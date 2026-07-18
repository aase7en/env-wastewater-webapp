"""Regression tests for split_sql (see SCHEMA-5 meter-drop bug, 2026-07-19).

Run:  uv run python scripts/test_split_sql.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_migration_api import split_sql  # noqa: E402


def check(label: str, sql: str, expected: list[str]) -> None:
    """Compare split_sql output against ``expected`` (full statement bodies).

    Each ``expected`` entry should match the trimmed, trailing-`;`-stripped
    statement. Multi-line bodies (dollar-quoted) compare as-is.
    """
    stmts = split_sql(sql)
    norm = []
    for s in stmts:
        t = s.strip()
        if t.endswith(";"):
            t = t[:-1]
        norm.append(t)
    if norm == expected:
        print(f"  ok  {label}  ({len(stmts)} stmt)")
    else:
        print(f"  FAIL {label}")
        print(f"       expected {len(expected)}:")
        for e in expected:
            print(f"         - {e!r}")
        print(f"       got {len(norm)}:")
        for g in norm:
            print(f"         - {g!r}")
        sys.exit(1)


def main() -> int:
    # 1) The exact SCHEMA-5 case: inline comment after ; must not eat next stmt.
    check(
        "inline-comment-after-semicolon",
        """create view public.a as select * from core.a;
create view public.b as select * from core.b;   -- inline comment trailing
create view public.c as select * from core.c;
""",
        [
            "create view public.a as select * from core.a",
            "create view public.b as select * from core.b",
            "create view public.c as select * from core.c",
        ],
    )

    # 2) Full-line comments should be skipped (no empty / comment stmt).
    check(
        "full-line-comments-skipped",
        """-- a comment
create table t (id int);
-- another
create index on t (id);
""",
        ["create table t (id int)", "create index on t (id)"],
    )

    # 3) Dollar-quoted body with ; inside must stay together.
    check(
        "dollar-quote-with-internal-semicolons",
        """create function f() returns void as $$
begin
  insert into t values (1);
  insert into t values (2);
end $$ language plpgsql;
select 1;
""",
        [
            "create function f() returns void as $$\nbegin\n  insert into t values (1);\n  "
            "insert into t values (2);\nend $$ language plpgsql",
            "select 1",
        ],
    )

    # 4) Single-quoted literal with ; inside must stay together.
    check(
        "single-quote-with-internal-semicolon",
        """insert into t values ('a;b');
select 2;
""",
        ["insert into t values ('a;b')", "select 2"],
    )

    # 5) Single-quote with escaped '' inside.
    check(
        "single-quote-with-escape",
        """insert into t values ('it''s;ok');
select 3;
""",
        ["insert into t values ('it''s;ok')", "select 3"],
    )

    # 6) Comment chars inside string literal must not start a comment.
    check(
        "comment-chars-inside-string",
        """insert into t values ('-- not a comment;');
select 4;
""",
        ["insert into t values ('-- not a comment;')", "select 4"],
    )

    # 7) Trailing statement without semicolon.
    check(
        "trailing-no-semicolon",
        """create table t (id int);
create table u (id int)""",
        ["create table t (id int)", "create table u (id int)"],
    )

    # 8) The real SCHEMA-5 file: must contain the meter view.
    repo_root = Path(__file__).resolve().parent.parent
    schema5 = repo_root / "supabase/migrations/20260719000010_schema5_rest_exposure.sql"
    if schema5.exists():
        stmts = split_sql(schema5.read_text(encoding="utf-8"))
        has_meter = any("public.meter" in s and "carbon.meter" in s for s in stmts)
        has_carbon_reading = any("carbon_reading" in s and "carbon.reading" in s for s in stmts)
        if has_meter and has_carbon_reading:
            print(f"  ok  schema5-file-has-meter-view  ({len(stmts)} stmt)")
        else:
            print(f"  FAIL schema5-file-has-meter-view  (meter={has_meter}, carbon_reading={has_carbon_reading})")
            sys.exit(1)

    print("\nAll split_sql tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
