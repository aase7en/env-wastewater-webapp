#!/usr/bin/env python3
"""P12.5 — apply a SQL migration to ENV_DB via the Supabase Management API.

Uses the same IPv6-workaround path as introspect_schema_api.py: queries
go through the HTTPS Management API, not a direct DB connection.

Usage:
    uv run python scripts/apply_migration_api.py <migration.sql>

The migration file is split into statements by ``split_sql`` (handles
``$$`` dollar-quote, ``'...''`` string literals, ``--`` line comments,
and ``;`` terminators) and sent one at a time. Statement-level errors
are reported but do not abort the whole migration — re-running idempotent
migrations is the expected recovery path.

Requires SUPABASE_ACCESS_TOKEN in env (resolved from Drive secrets — see
scripts/_env.py).
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
    # Lazy import: test_split_sql.py imports this module and must stay free
    # of env-resolution side effects at import time.
    from _env import load_secret
    tok = load_secret("SUPABASE_ACCESS_TOKEN")
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
    """Split a script into individual statements.

    Single-pass scanner that correctly handles, in priority order:
      1. ``$tag$ ... $tag$``  — dollar-quoted bodies (function source)
      2. ``'...''...'``       — single-quoted string literals (with '' escapes)
      3. ``-- ...\\n``         — line comments (strip to end of line)
      4. ``;``                — statement terminator (only when not in 1/2/3)

    Bug this replaces (SCHEMA-5 meter view dropped 2026-07-19): the old
    regex-based splitter called ``stmt.lstrip().startswith("--")`` on the
    buffer between two semicolons. When a statement ended with
    ``;   -- inline comment`` the buffer for the *next* statement started
    with that comment text, so the check dropped the whole next statement
    (e.g. ``create view public.meter ...``). Inline-comment stripping here
    runs char-by-char so a comment can never leak into the next statement.
    """
    statements: list[str] = []
    buf: list[str] = []
    i = 0
    n = len(sql)
    while i < n:
        ch = sql[i]

        # ── Dollar-quote: scan for the matching $tag$ that opened here. ──
        if ch == "$":
            m = re.match(r"\$[A-Za-z0-9_]*\$", sql[i:])
            if m:
                tag = m.group(0)
                end = sql.find(tag, i + len(tag))
                if end == -1:
                    # Unbalanced — append rest verbatim and stop.
                    buf.append(sql[i:])
                    i = n
                    break
                buf.append(sql[i:end + len(tag)])
                i = end + len(tag)
                continue

        # ── Single-quote string literal — respect '' as escaped quote. ──
        if ch == "'":
            buf.append(ch)
            i += 1
            while i < n:
                if sql[i] == "'":
                    if i + 1 < n and sql[i + 1] == "'":
                        buf.append("''")
                        i += 2
                        continue
                    buf.append("'")
                    i += 1
                    break
                buf.append(sql[i])
                i += 1
            continue

        # ── Line comment — strip to end of line, never enters buf. ──
        if ch == "-" and i + 1 < n and sql[i + 1] == "-":
            nl = sql.find("\n", i)
            if nl == -1:
                i = n
            else:
                i = nl  # keep the \n so statement boundaries still line up
            continue

        # ── Statement terminator. ──
        if ch == ";":
            buf.append(";")
            stmt = "".join(buf).strip()
            if stmt and stmt != ";":
                statements.append(stmt)
            buf = []
            i += 1
            continue

        buf.append(ch)
        i += 1

    tail = "".join(buf).strip()
    if tail:
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
    # split_sql handles -- comments (full-line and inline) itself; do NOT
    # pre-strip here — pre-stripping by line used to leave inline comments
    # dangling after ';' and corrupt the next statement's boundary.
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
