#!/usr/bin/env python3
"""P5b.2-live — introspect the live ENV_DB schema and write a verified snapshot.

Connects via SUPABASE_DB_URL (read-only — only runs SELECTs against
information_schema / pg_catalog / pg_views). Produces
reports/schema-snapshot-live.md with every table, column, type, constraint,
enum, and view in the core/carbon/wastewater schemas.

Usage:
    # .env must hold SUPABASE_DB_URL (or export it first)
    uv run python scripts/introspect_schema.py

Exit codes:
    0  snapshot written
    1  DB_URL missing or connection failed (printed to stderr)

This is the "live" half of P5b.2. The "local-source" half already ran — see
reports/schema-snapshot-p5.md for what was reconciled from INSERT contracts.
"""
from __future__ import annotations

import asyncio
import sys
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "reports/schema-snapshot-live.md"

SCHEMAS = ("core", "carbon", "wastewater")

# All queries are read-only. information_schema + pg_catalog give us the
# complete DDL picture without needing pg_dump (which the Supabase pooler
# transaction mode doesn't support well).
COLUMNS_SQL = """
SELECT table_schema, table_name, column_name, ordinal_position,
       data_type, udt_name, character_maximum_length,
       numeric_precision, numeric_scale,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = ANY(:schemas)
ORDER BY table_schema, table_name, ordinal_position
"""

TABLES_SQL = """
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = ANY(:schemas)
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name
"""

VIEWS_SQL = """
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname = ANY(:schemas)
ORDER BY schemaname, viewname
"""

ENUMS_SQL = """
SELECT n.nspname AS schema, t.typname AS enum_name,
       string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS labels
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = ANY(:schemas)
GROUP BY n.nspname, t.typname
ORDER BY n.nspname, t.typname
"""

CONSTRAINTS_SQL = """
SELECT n.nspname AS schema, c.relname AS table_name,
       con.conname AS constraint_name, con.contype,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON con.conrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = ANY(:schemas)
ORDER BY n.nspname, c.relname, con.contype, con.conname
"""

INDEXES_SQL = """
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = ANY(:schemas)
ORDER BY schemaname, tablename, indexname
"""

RLS_SQL = """
SELECT n.nspname AS schema, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = ANY(:schemas)
  AND c.relkind = 'r'
ORDER BY n.nspname, c.relname
"""


async def main() -> int:
    # Load settings the same way the app does, so .env is honored.
    from app.core.config import get_settings
    try:
        settings = get_settings()
    except Exception as e:  # noqa: BLE001
        print(f"settings load failed: {e}", file=sys.stderr)
        return 1

    url = settings.supabase_db_url
    if "unset" in url or "REPLACE_WITH" in url:
        print(
            "SUPABASE_DB_URL is not configured (still a placeholder). "
            "Fill in the real DB password in .env first — see .env.example.",
            file=sys.stderr,
        )
        return 1

    from sqlalchemy import text
    from app.core.db import _engine

    engine = _engine()
    try:
        async with engine.connect() as conn:
            # asyncpg via SQLAlchemy uses .execute on the connection for text().
            tables = (await conn.execute(text(TABLES_SQL), {"schemas": list(SCHEMAS)})).all()
            columns = (await conn.execute(text(COLUMNS_SQL), {"schemas": list(SCHEMAS)})).all()
            views = (await conn.execute(text(VIEWS_SQL), {"schemas": list(SCHEMAS)})).all()
            enums = (await conn.execute(text(ENUMS_SQL), {"schemas": list(SCHEMAS)})).all()
            constraints = (await conn.execute(text(CONSTRAINTS_SQL), {"schemas": list(SCHEMAS)})).all()
            indexes = (await conn.execute(text(INDEXES_SQL), {"schemas": list(SCHEMAS)})).all()
            rls = (await conn.execute(text(RLS_SQL), {"schemas": list(SCHEMAS)})).all()
            rowcounts = await _safe_rowcounts(conn)
    except Exception as e:  # noqa: BLE001
        print(f"DB connection/query failed: {e}", file=sys.stderr)
        return 1
    finally:
        await engine.dispose()

    _write_report(tables, columns, views, enums, constraints, indexes, rls, rowcounts)
    print(f"Snapshot written to {OUT_PATH}")
    return 0


async def _safe_rowcounts(conn) -> dict[tuple[str, str], int]:
    """Best-effort row counts per table. Failures → -1, never abort."""
    from sqlalchemy import text
    out: dict[tuple[str, str], int] = {}
    rows = (await conn.execute(text(TABLES_SQL), {"schemas": list(SCHEMAS)})).all()
    for schema, table in rows:
        try:
            n = (
                await conn.execute(
                    text(f'SELECT count(*) FROM "{schema}"."{table}"')  # noqa: S608
                )
            ).scalar()
            out[(schema, table)] = n
        except Exception:  # noqa: BLE001
            out[(schema, table)] = -1
    return out


def _write_report(tables, columns, views, enums, constraints, indexes, rls, rowcounts) -> None:
    lines: list[str] = []
    lines.append("# Schema Snapshot — LIVE (P5b.2-live)")
    lines.append("")
    lines.append(f"> Introspected from ENV_DB on {date.today().isoformat()}.")
    lines.append(f"> Schemas: {', '.join(SCHEMAS)}.")
    lines.append(
        "> This file is GENERATED by `scripts/introspect_schema.py` — re-run "
        "it to refresh; do not hand-edit."
    )
    lines.append("")

    # Tables + row counts
    lines.append("## Tables")
    lines.append("")
    lines.append("| Schema | Table | Rows |")
    lines.append("|---|---|---|")
    for schema, table in tables:
        n = rowcounts.get((schema, table), -1)
        lines.append(f"| `{schema}` | `{table}` | {n} |")
    lines.append("")

    # Columns grouped by table
    lines.append("## Columns")
    lines.append("")
    by_table: dict[tuple[str, str], list] = {}
    for row in columns:
        by_table.setdefault((row.table_schema, row.table_name), []).append(row)
    for (schema, table), cols in sorted(by_table.items()):
        lines.append(f"### `{schema}.{table}`")
        lines.append("")
        lines.append("| # | column | type | nullable | default |")
        lines.append("|---|---|---|---|---|")
        for c in cols:
            full_type = _format_type(c)
            default = c.column_default or ""
            lines.append(
                f"| {c.ordinal_position} | `{c.column_name}` | `{full_type}` | "
                f"{'YES' if c.is_nullable == 'YES' else 'NO'} | `{default}` |"
            )
        lines.append("")

    # Enums
    if enums:
        lines.append("## Enum types")
        lines.append("")
        lines.append("| Schema | Enum | Values |")
        lines.append("|---|---|---|")
        for schema, name, labels in enums:
            lines.append(f"| `{schema}` | `{name}` | {labels} |")
        lines.append("")

    # Constraints
    if constraints:
        lines.append("## Constraints")
        lines.append("")
        con_sym = {"p": "PK", "f": "FK", "u": "UNIQUE", "c": "CHECK", "x": "EXCL"}
        lines.append("| Schema | Table | Name | Kind | Definition |")
        lines.append("|---|---|---|---|---|")
        for schema, table, name, contype, defn in constraints:
            kind = con_sym.get(contype, contype)
            lines.append(f"| `{schema}` | `{table}` | `{name}` | {kind} | `{defn}` |")
        lines.append("")

    # Indexes
    if indexes:
        lines.append("## Indexes")
        lines.append("")
        for schema, table, name, defn in indexes:
            lines.append(f"- `{schema}.{table}` **{name}**: `{defn}`")
        lines.append("")

    # RLS
    lines.append("## Row-level security")
    lines.append("")
    lines.append("| Schema | Table | RLS enabled |")
    lines.append("|---|---|---|")
    for schema, table, enabled in rls:
        lines.append(f"| `{schema}` | `{table}` | {'✅' if enabled else '❌'} |")
    lines.append("")

    # Views (definitions can be long; include them verbatim)
    if views:
        lines.append("## Views")
        lines.append("")
        for schema, name, defn in views:
            lines.append(f"### `{schema}.{name}`")
            lines.append("```sql")
            lines.append(defn.strip())
            lines.append("```")
            lines.append("")

    OUT_PATH.parent.mkdir(exist_ok=True, parents=True)
    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")


def _format_type(c) -> str:
    t = c.data_type
    if t == "character varying" and c.character_maximum_length:
        return f"varchar({c.character_maximum_length})"
    if t == "numeric" and c.numeric_precision is not None:
        if c.numeric_scale is not None:
            return f"numeric({c.numeric_precision},{c.numeric_scale})"
        return f"numeric({c.numeric_precision})"
    if t == "USER-DEFINED":
        return c.udt_name
    return t


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
