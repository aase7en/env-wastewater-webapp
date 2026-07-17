#!/usr/bin/env python3
"""P12.5 — apply a SQL migration to ENV_DB via the Supabase Management API.

Uses the same IPv6-workaround path as introspect_schema_api.py: queries
go through the HTTPS Management API, not a direct DB connection.

Usage:
    uv run python scripts/apply_migration_api.py <migration.sql>

The migration file is split on ';' and sent statement-by-statement so the
API can run each DDL command independently (the /database/query endpoint
executes one statement per call). Statement-level errors are reported but
do not abort the whole migration — re-running idempotent migrations is
the expected recovery path.

Requires SUPABASE_ACCESS_TOKEN in env (resolved from Drive secrets — see
app.core.config._resolve_env_file).
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

import httpx

REPO_ROOT = Path(__file__).resolve().parent.parent
PROJECT_REF = "gllqtbyofrcjzmbnfoeh"
API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"


def _load_token() -> str:
    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not tok:
        from app.core.config import _resolve_env_file
        p = _resolve_env_file()
        if p:
            for line in Path(p).read_text(encoding="utf-8").splitlines():
                if line.startswith("SUPABASE_ACCESS_TOKEN="):
                    tok = line.split("=", 1)[1].strip()
                    break
    if not tok:
        print("SUPABASE_ACCESS_TOKEN not found", file=sys.stderr)
        sys.exit(1)
    return tok


def exec_statement(token: str, stmt: str) -> tuple[bool, str]:
    """Run one SQL statement via Management API. Returns (ok, message)."""
    r = httpx.post(
        API,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"query": stmt},
        timeout=60,
    )
    if r.status_code >= 400:
        try:
            body = r.json()
            msg = body.get("message") or body.get("error") or r.text
        except Exception:
            msg = r.text
        return False, msg
    return True, ""


def split_sql(sql: str) -> list[str]:
    """Split a script into individual statements, respecting $$ dollar-quote.

    Uses a regex scan for $tag$ tokens and tracks whether we're inside one.
    Statements end at the first ';' outside any dollar-quoted block.
    """
    statements: list[str] = []
    # All dollar-quote boundaries in the script: $tag$ opening, $tag$ closing.
    dollar_tokens = [m.span() for m in re.finditer(r"\$[A-Za-z0-9_]*\$", sql)]

    # Build a set of character-position ranges where we are inside a $$ block.
    inside: list[tuple[int, int]] = []
    i = 0
    while i < len(dollar_tokens):
        open_start = dollar_tokens[i][0]
        tag = sql[dollar_tokens[i][0]:dollar_tokens[i][1]]
        # find matching close tag (same string)
        close_start = -1
        for j in range(i + 1, len(dollar_tokens)):
            tok_str = sql[dollar_tokens[j][0]:dollar_tokens[j][1]]
            if tok_str == tag:
                close_start = dollar_tokens[j][1]
                break
        if close_start == -1:
            break  # unbalanced; bail
        inside.append((open_start, close_start))
        i = j + 1

    def in_dollar(pos: int) -> bool:
        return any(s <= pos < e for s, e in inside)

    buf: list[str] = []
    for pos, ch in enumerate(sql):
        buf.append(ch)
        if ch == ";" and not in_dollar(pos):
            stmt = "".join(buf).strip()
            if stmt and not stmt.lstrip().startswith("--"):
                statements.append(stmt)
            buf = []
    tail = "".join(buf).strip()
    if tail and not tail.lstrip().startswith("--"):
        statements.append(tail)
    return statements


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    path = Path(sys.argv[1])
    if not path.is_absolute():
        path = REPO_ROOT / path
    if not path.exists():
        print(f"migration not found: {path}", file=sys.stderr)
        return 2

    sql = path.read_text(encoding="utf-8")
    # Strip full-line comments to reduce noise in the split output.
    sql = "\n".join(line for line in sql.splitlines() if not line.strip().startswith("--"))
    statements = split_sql(sql)
    print(f"{path.name}: {len(statements)} statement(s)")

    tok = _load_token()
    ok_count = 0
    fail_count = 0
    for i, stmt in enumerate(statements, 1):
        head = stmt.split("\n", 1)[0][:80]
        ok, msg = exec_statement(tok, stmt)
        status = "OK" if ok else "FAIL"
        print(f"  [{i}/{len(statements)}] {status}: {head}")
        if not ok:
            print(f"          → {msg}")
            fail_count += 1
        else:
            ok_count += 1

    print(f"\nDone: {ok_count} OK, {fail_count} FAIL")
    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
