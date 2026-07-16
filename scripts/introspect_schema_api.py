#!/usr/bin/env python3
"""P5b.2-live — introspect ENV_DB via Supabase Management API (HTTPS).

This is the IPv6-workaround path: instead of connecting to the DB directly
(which requires IPv6 on free-tier-new projects), it uses the Management API
database/query endpoint over plain HTTPS. PAT comes from .env.

Read-only. Produces reports/schema-snapshot-live.md.
"""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

import httpx

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "reports/schema-snapshot-live.md"
PROJECT_REF = "gllqtbyofrcjzmbnfoeh"
API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

SCHEMAS = ("core", "carbon", "wastewater")


def _load_token() -> str:
    """Read PAT from the Drive-backed .env (or any env source)."""
    from app.core.config import get_settings
    s = get_settings()
    # supabase_access_token isn't on Settings; pull from env file directly.
    import os
    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not tok:
        # Try reading from the resolved env file
        from app.core.config import _resolve_env_file
        p = _resolve_env_file()
        if p:
            for line in Path(p).read_text(encoding="utf-8").splitlines():
                if line.startswith("SUPABASE_ACCESS_TOKEN="):
                    tok = line.split("=", 1)[1].strip()
                    break
    if not tok:
        print("SUPABASE_ACCESS_TOKEN not found in env or Drive .env", file=sys.stderr)
        sys.exit(1)
    return tok


def query(token: str, sql: str):
    r = httpx.post(
        API,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"query": sql},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def main() -> int:
    tok = _load_token()
    schemas_list = ",".join(f"'{s}'" for s in SCHEMAS)

    tables = query(tok, f"SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ({schemas_list}) AND table_type='BASE TABLE' ORDER BY 1,2")
    columns = query(tok, f"SELECT table_schema, table_name, column_name, ordinal_position, data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default FROM information_schema.columns WHERE table_schema IN ({schemas_list}) ORDER BY 1,2,3")
    views = query(tok, f"SELECT schemaname, viewname, definition FROM pg_views WHERE schemaname IN ({schemas_list}) ORDER BY 1,2")
    enums = query(tok, f"SELECT n.nspname AS schema, t.typname AS enum_name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS labels FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON t.typnamespace=n.oid WHERE n.nspname IN ({schemas_list}) GROUP BY 1,2 ORDER BY 1,2")
    constraints = query(tok, f"SELECT n.nspname AS schema, c.relname AS table_name, con.conname AS constraint_name, con.contype, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON con.conrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname IN ({schemas_list}) ORDER BY 1,2,3,4")
    indexes = query(tok, f"SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname IN ({schemas_list}) ORDER BY 1,2,3")
    rls = query(tok, f"SELECT n.nspname AS schema, c.relname AS table_name, c.relrowsecurity AS rls_enabled FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname IN ({schemas_list}) AND c.relkind='r' ORDER BY 1,2")

    # Row counts
    rowcounts = {}
    for t in tables:
        schema, table = t["table_schema"], t["table_name"]
        try:
            r = query(tok, f'SELECT count(*) AS n FROM "{schema}"."{table}"')
            rowcounts[(schema, table)] = r[0]["n"]
        except Exception:
            rowcounts[(schema, table)] = -1

    _write_report(tables, columns, views, enums, constraints, indexes, rls, rowcounts)
    print(f"Snapshot written to {OUT_PATH}")
    return 0


def _fmt(c: dict) -> str:
    t = c["data_type"]
    if t == "character varying" and c["character_maximum_length"]:
        return f"varchar({c['character_maximum_length']})"
    if t == "numeric" and c["numeric_precision"] is not None:
        if c["numeric_scale"] is not None:
            return f"numeric({c['numeric_precision']},{c['numeric_scale']})"
        return f"numeric({c['numeric_precision']})"
    if t == "USER-DEFINED":
        return c["udt_name"]
    return t


def _write_report(tables, columns, views, enums, constraints, indexes, rls, rowcounts) -> None:
    L = []
    L.append("# Schema Snapshot — LIVE (P5b.2-live)")
    L.append("")
    L.append(f"> Introspected from ENV_DB on {date.today().isoformat()} via Supabase Management API.")
    L.append(f"> Schemas: {', '.join(SCHEMAS)}. GENERATED — re-run `scripts/introspect_schema_api.py`.")
    L.append("")

    L.append("## Tables")
    L.append("")
    L.append("| Schema | Table | Rows |")
    L.append("|---|---|---|")
    for t in tables:
        s, n = t["table_schema"], t["table_name"]
        L.append(f"| `{s}` | `{n}` | {rowcounts.get((s,n),-1)} |")
    L.append("")

    L.append("## Columns")
    L.append("")
    by_table = {}
    for c in columns:
        by_table.setdefault((c["table_schema"], c["table_name"]), []).append(c)
    for (s, n), cols in sorted(by_table.items()):
        L.append(f"### `{s}.{n}`")
        L.append("")
        L.append("| # | column | type | nullable | default |")
        L.append("|---|---|---|---|---|")
        for c in sorted(cols, key=lambda x: x["ordinal_position"]):
            d = c["column_default"] or ""
            L.append(f"| {c['ordinal_position']} | `{c['column_name']}` | `{_fmt(c)}` | {'YES' if c['is_nullable']=='YES' else 'NO'} | `{d}` |")
        L.append("")

    if enums:
        L.append("## Enum types")
        L.append("")
        L.append("| Schema | Enum | Values |")
        L.append("|---|---|---|")
        for e in enums:
            L.append(f"| `{e['schema']}` | `{e['enum_name']}` | {e['labels']} |")
        L.append("")

    if constraints:
        L.append("## Constraints")
        L.append("")
        sym = {"p":"PK","f":"FK","u":"UNIQUE","c":"CHECK","x":"EXCL"}
        L.append("| Schema | Table | Name | Kind | Definition |")
        L.append("|---|---|---|---|---|")
        for c in constraints:
            L.append(f"| `{c['schema']}` | `{c['table_name']}` | `{c['constraint_name']}` | {sym.get(c['contype'],c['contype'])} | `{c['definition']}` |")
        L.append("")

    if indexes:
        L.append("## Indexes")
        L.append("")
        for i in indexes:
            L.append(f"- `{i['schemaname']}.{i['tablename']}` **{i['indexname']}**: `{i['indexdef']}`")
        L.append("")

    L.append("## Row-level security")
    L.append("")
    L.append("| Schema | Table | RLS enabled |")
    L.append("|---|---|---|")
    for r in rls:
        L.append(f"| `{r['schema']}` | `{r['table_name']}` | {'✅' if r['rls_enabled'] else '❌'} |")
    L.append("")

    if views:
        L.append("## Views")
        L.append("")
        for v in views:
            L.append(f"### `{v['schemaname']}.{v['viewname']}`")
            L.append("```sql")
            L.append(v["definition"].strip())
            L.append("```")
            L.append("")

    OUT_PATH.parent.mkdir(exist_ok=True, parents=True)
    OUT_PATH.write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
