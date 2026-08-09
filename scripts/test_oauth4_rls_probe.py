#!/usr/bin/env python3
"""OAUTH-4 — RLS pending-deny probe.

Verifies the single source of truth all transactional RLS policies delegate
to: ``core.fn_is_staff_or_admin()``. If this helper returns the correct
verdict per role, every repolicied table inherits the correct behavior
(policy bodies are literally ``USING (core.fn_is_staff_or_admin())``).

Two probe modes:

  1. ``helper`` (default) — four sub-probes:
     a. ``core.fn_is_staff_or_admin()`` body contract (SECURITY DEFINER +
        role IN ('staff','admin') + STABLE) via pg_get_functiondef.
     b. Every OAUTH-4 transactional table's ``_authenticated_rw`` policy
        references the helper in BOTH USING + WITH CHECK.
     c. ``ai_query_log`` INSERT gates WITH CHECK on actor=auth.uid().
     d. The 5 SCHEMA5b reference tables (personnel/attachment/location/
        sensor/sensor_reading) gate on the helper (these kept the schema5
        ``USING (true)`` until SCHEMA5b closed the gap — same OAUTH-1 intent).
     This is the RED-first test: before the respective migrations apply,
     each sub-probe fails → exit non-zero.

  2. ``live`` — probe a live REST row-read on a sample transactional table
     using a forged JWT per role. Heavier; needs test auth.users rows.
     Deferred — run after user provisions test accounts.

Usage:
    uv run python scripts/test_oauth4_rls_probe.py [--mode helper|live]

Requires SUPABASE_ACCESS_TOKEN in env (resolved from Drive secrets — see
scripts/_env.py). Does NOT commit any data: test rows are created + deleted
inside a single transaction that is rolled back at the end.
"""
from __future__ import annotations

import argparse
import sys

import httpx

PROJECT_REF = "gllqtbyofrcjzmbnfoeh"
API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"


def _load_token() -> str:
    from _env import load_secret
    tok = load_secret("SUPABASE_ACCESS_TOKEN")
    if not tok:
        print("SUPABASE_ACCESS_TOKEN not found", file=sys.stderr)
        sys.exit(1)
    return tok


def exec_sql(token: str, query: str):
    """Run one SQL query via Management API.

    Returns a list[dict] of rows on success, or {"_error": str, "_status": int}
    on HTTP error. (Management API returns a bare JSON list of row dicts for
    SELECTs — e.g. ``[{"x": 1}]`` — and an error object on 4xx/5xx.)
    """
    r = httpx.post(
        API,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"query": query},
        timeout=60,
    )
    if r.status_code >= 400:
        try:
            body = r.json()
            msg = body.get("message") or body.get("error") or r.text
        except Exception:
            msg = r.text
        return {"_error": msg, "_status": r.status_code}
    try:
        return r.json()
    except Exception:
        return {"_raw": r.text}


def probe_helper(token: str) -> int:
    """Probe core.fn_is_staff_or_admin() + every repolicied table's policy.

    Three sub-probes:
      1. Helper function BODY contract — assert the deployed function's
         source (via pg_get_functiondef) contains the role IN ('staff','admin')
         contract. NOT a mirror expression: reads the actual deployed body so
         a future edit to the function that loosens the contract is caught.
         (Opus review D2: the original probe mirrored the expression via a CTE,
         which tested Postgres `IN` semantics — not the function. Useless as a
         regression guard.)
      2. Policy bodies — every transactional table's _authenticated_rw policy
         must reference the helper in BOTH qual (USING) and with_check.
         Guards against a future migration loosening one back to (true).
      3. ai_query_log INSERT policy — must gate WITH CHECK on actor=auth.uid()
         so pending users cannot write + actor cannot be spoofed. (Opus review
         D3: read-side was already correct, INSERT-side was WITH CHECK (true).)
    """
    # First: does the function exist? (RED-first gate — fails before migration)
    exists = exec_sql(
        token,
        "SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace "
        "WHERE p.proname = 'fn_is_staff_or_admin' AND n.nspname = 'core';",
    )
    if isinstance(exists, dict) and exists.get("_error"):
        print(f"FAIL: cannot query pg_proc — {exists['_error']}", file=sys.stderr)
        return 2
    rows = exists if isinstance(exists, list) else []
    if not rows:
        print("RED: core.fn_is_staff_or_admin() does not exist yet "
              "(expected before OAUTH-4 migration).", file=sys.stderr)
        return 1

    # Function exists — assert its deployed body matches the contract.
    helper_failures = _probe_helper_body(token)

    # Second probe: every transactional policy must reference the helper in
    # BOTH its USING AND WITH CHECK. This guards against a future migration
    # loosening one policy back to `USING (true)`. Reads pg_policies.
    policy_failures = _probe_policy_bodies(token)

    # Third probe: ai_query_log INSERT must gate WITH CHECK on actor=auth.uid().
    aiq_failures = _probe_ai_query_log_insert(token)

    # Fourth probe: the 5 reference tables (SCHEMA5b) that OAUTH-4 missed —
    # personnel/attachment/location/sensor/sensor_reading were left on the
    # schema5 `(true)` policy, so a pending user could read the staff roster
    # (PHI-adjacent) and write attachments. Must now gate on the helper.
    ref_failures = _probe_reference_policy_bodies(token)

    # Fifth probe: audit_log INSERT must gate WITH CHECK on actor=auth.uid().
    # Same forgery class as D3 (ai_query_log): the trigger sets actor correctly
    # but a direct PostgREST POST bypasses the trigger and can forge another
    # user's uid — surfacing as that victim in the admin audit viewer.
    aud_failures = _probe_audit_log_insert(token)

    # Sixth probe (AUDITFIX-A): sensitive admin tables that the audit doc
    # (`reports/infra-audit-2026-08.md`) flagged as missing trg_audit_log.
    # `core.ai_provider` stores API keys (key_value) — a code comment in
    # `20260719000008_dba_ai_columns.sql:26-27` falsely claimed SELECT-audit
    # coverage, but no trigger was ever created. AUDITFIX-A adds the standard
    # DML trigger (INSERT/UPDATE/DELETE). `core.attachment` is also flagged
    # (regulation PDF swap = phish vector) if the table exists live.
    trg_failures = _probe_trigger_existence(token)

    return 0 if (helper_failures + policy_failures + aiq_failures + ref_failures + aud_failures + trg_failures) == 0 else 1


def _probe_helper_body(token: str) -> int:
    """Assert the DEPLOYED function body matches the role contract.

    Reads pg_get_functiondef (the actual deployed source) and asserts it
    contains `role IN ('staff', 'admin')`. This is a real regression guard —
    unlike the original CTE-mirror probe, which tested Postgres `IN` semantics
    and would still PASS if the function body were silently edited to allow
    'pending' or 'viewer'. (Opus review D2.)
    """
    res = exec_sql(
        token,
        "SELECT pg_get_functiondef('core.fn_is_staff_or_admin()'::regprocedure) AS def;",
    )
    if isinstance(res, dict) and res.get("_error"):
        print(f"FAIL reading function def: {res['_error']}", file=sys.stderr)
        return 1
    rows = res if isinstance(res, list) else []
    defn = rows[0].get("def", "") if rows else ""

    # Contract assertions on the deployed body. Each must be present.
    required = [
        ("SECURITY DEFINER", "must be SECURITY DEFINER (bypass RLS — no recursion)"),
        ("role IN ('staff', 'admin')", "must gate on role IN ('staff', 'admin')"),
        ("STABLE", "must be STABLE (pure read — query planner hint)"),
    ]
    print(f"\n{'contract':<40} {'present':<10} {'status'}")
    print("-" * 60)
    failures = 0
    for needle, why in required:
        present = needle in defn
        print(f"{needle:<40} {'yes' if present else 'NO':<10} "
              f"{'PASS' if present else 'FAIL'}")
        if not present:
            print(f"          → {why}", file=sys.stderr)
            failures += 1
    return failures


def _probe_ai_query_log_insert(token: str) -> int:
    """Assert ai_query_log INSERT policy gates WITH CHECK on actor=auth.uid().

    The read-side policy (owner_select) was already correct, but the
    INSERT-side was `WITH CHECK (true)` — so any authenticated user (including
    pending) could write a row, and the `actor` column could be spoofed to a
    different uid (then the spoofed victim's owner_select would surface it).
    Fix: WITH CHECK (actor = auth.uid()). (Opus review D3.)
    """
    q = (
        "SELECT with_check FROM pg_policies "
        "WHERE schemaname = 'core' AND tablename = 'ai_query_log' "
        "AND policyname = 'ai_query_log_authenticated_insert';"
    )
    res = exec_sql(token, q)
    if isinstance(res, dict) and res.get("_error"):
        print(f"FAIL probing ai_query_log INSERT: {res['_error']}", file=sys.stderr)
        return 1
    rows = res if isinstance(res, list) else []
    print(f"\n{'policy':<45} {'gate':<12} {'status'}")
    print("-" * 65)
    if not rows:
        print(f"{'ai_query_log_authenticated_insert':<45} {'missing':<12} FAIL")
        return 1
    check = rows[0].get("with_check") or ""
    gated = "actor = auth.uid()" in check
    print(f"{'ai_query_log_authenticated_insert':<45} "
          f"{'actor=uid' if gated else 'OPEN (' + check.strip() + ')':<12} "
          f"{'PASS' if gated else 'FAIL'}")
    return 0 if gated else 1


def _probe_audit_log_insert(token: str) -> int:
    """Assert audit_log INSERT policy gates WITH CHECK on actor=auth.uid().

    The trigger (core.fn_audit_log) always sets actor = auth.uid() server-side,
    so tightening WITH CHECK does NOT break the trigger path — both sides
    agree. The hole this closes: a direct PostgREST POST to /rest/v1/audit_log
    bypasses the trigger and, under the old WITH CHECK (true), could forge
    another user's uid as actor. That forged row then surfaced in the admin
    audit viewer via audit_log_admin_all. Fix mirrors D3: WITH CHECK
    (actor = auth.uid()). (2026-08-03 recon I1.)

    Note: service-role inserts with actor = NULL bypass RLS entirely
    (BYPASSRLS), so this gate does not affect the system-action logging path
    documented in v2_audit_trigger.sql lines 11-12.
    """
    q = (
        "SELECT with_check FROM pg_policies "
        "WHERE schemaname = 'core' AND tablename = 'audit_log' "
        "AND policyname = 'audit_log_authenticated_insert';"
    )
    res = exec_sql(token, q)
    if isinstance(res, dict) and res.get("_error"):
        print(f"FAIL probing audit_log INSERT: {res['_error']}", file=sys.stderr)
        return 1
    rows = res if isinstance(res, list) else []
    print(f"\n{'policy':<45} {'gate':<12} {'status'}")
    print("-" * 65)
    if not rows:
        print(f"{'audit_log_authenticated_insert':<45} {'missing':<12} FAIL")
        return 1
    check = rows[0].get("with_check") or ""
    gated = "actor = auth.uid()" in check
    print(f"{'audit_log_authenticated_insert':<45} "
          f"{'actor=uid' if gated else 'OPEN (' + check.strip() + ')':<12} "
          f"{'PASS' if gated else 'FAIL'}")
    return 0 if gated else 1


# Tables that AUDITFIX-A retro-fits with the standard trg_audit_log trigger.
# `core.ai_provider` is the primary target (key_value API-key column; a code
# comment in 20260719000008_dba_ai_columns.sql:26-27 falsely claimed audit
# coverage that was never created). `core.attachment` is flagged in the audit
# report too (regulation PDF swap = phish vector) but it was created in the
# archived FastAPI era and may not exist in the live DB — probe tolerates its
# absence (reports SKIP, not FAIL).
AUDITFIX_TABLES = [
    ("core", "ai_provider"),      # required — must gain trigger
    ("core", "attachment"),        # optional — SKIP if table absent live
]


def _probe_trigger_existence(token: str) -> int:
    """Assert each AUDITFIX_TABLES table carries `trg_audit_log`.

    RED-first: before AUDITFIX-A applies, ai_provider has no trigger → FAIL.
    After apply, the DROP+CREATE pattern leaves exactly one `trg_audit_log`
    row in pg_trigger → PASS. attachment is best-effort (SKIP if the table
    doesn't exist in the live DB — created in the archived FastAPI era).

    Query joins pg_trigger + pg_class + pg_namespace and excludes internal
    triggers (t.tgisinternal). A healthy result is exactly one row named
    `trg_audit_log` per table.
    """
    print(f"\n{'table':<35} {'trigger':<18} {'status'}")
    print("-" * 65)
    failures = 0
    for schema, table in AUDITFIX_TABLES:
        # First: does the table itself exist? (attachment may not.)
        exists_q = (
            "SELECT 1 FROM pg_class c "
            "JOIN pg_namespace n ON n.oid = c.relnamespace "
            f"WHERE n.nspname = '{schema}' AND c.relname = '{table}' "
            "AND c.relkind IN ('r','p');"
        )
        ex = exec_sql(token, exists_q)
        if isinstance(ex, dict) and ex.get("_error"):
            print(f"{schema}.{table:<30} ERROR: {ex['_error']}", file=sys.stderr)
            failures += 1
            continue
        ex_rows = ex if isinstance(ex, list) else []
        if not ex_rows:
            print(f"{schema}.{table:<30} —                 SKIP (table absent)")
            continue  # not a failure — table genuinely doesn't exist live

        # Table exists — does trg_audit_log fire on it?
        q = (
            "SELECT t.tgname FROM pg_trigger t "
            "JOIN pg_class c ON c.oid = t.tgrelid "
            "JOIN pg_namespace n ON n.oid = c.relnamespace "
            f"WHERE n.nspname = '{schema}' AND c.relname = '{table}' "
            "AND NOT t.tgisinternal AND t.tgname = 'trg_audit_log';"
        )
        res = exec_sql(token, q)
        if isinstance(res, dict) and res.get("_error"):
            print(f"{schema}.{table:<30} ERROR: {res['_error']}", file=sys.stderr)
            failures += 1
            continue
        rows = res if isinstance(res, list) else []
        present = any((r.get("tgname") == "trg_audit_log") for r in rows)
        print(f"{schema}.{table:<30} "
              f"{'present' if present else 'MISSING':<18} "
              f"{'PASS' if present else 'FAIL'}")
        if not present:
            failures += 1
    return failures


# All transactional tables that OAUTH-4 repolicied. Any policy on these
# tables MUST gate on the helper in both USING and WITH CHECK.
REPOLICIED_TABLES = [
    ("water_supply", "daily_check"),
    ("garbage", "collection_log"),
    ("fuel", "dispense_log"),
    ("garden", "work_round"),
    ("building", "inspection_round"),
    ("safety", "monthly_check"),
    ("food", "lab_test"),
    ("chemical", "movement"),
    ("chemical", "master"),
    ("wastewater", "threshold_alert"),
    ("core", "regulation"),
]


def _probe_policy_bodies(token: str) -> int:
    """Assert every repolicied table's policy references the helper.

    Reads pg_policies qual + with_check for the _authenticated_rw policy on
    each table. Fails if either clause is missing `fn_is_staff_or_admin`.
    """
    print(f"\n{'table':<40} {'using':<8} {'check':<8} {'status'}")
    print("-" * 70)
    failures = 0
    for schema, table in REPOLICIED_TABLES:
        q = (
            "SELECT qual, with_check FROM pg_policies "
            f"WHERE schemaname = '{schema}' AND tablename = '{table}' "
            f"AND policyname = '{table}_authenticated_rw';"
        )
        res = exec_sql(token, q)
        if isinstance(res, dict) and res.get("_error"):
            print(f"{schema}.{table:<36} ERROR: {res['_error']}", file=sys.stderr)
            failures += 1
            continue
        rows = res if isinstance(res, list) else []
        if not rows:
            print(f"{schema}.{table:<36} —      —      FAIL (policy missing)")
            failures += 1
            continue
        row = rows[0]
        qual = row.get("qual") or ""
        check = row.get("with_check") or ""
        using_ok = "fn_is_staff_or_admin" in qual
        check_ok = "fn_is_staff_or_admin" in check
        ok = using_ok and check_ok
        print(f"{schema}.{table:<33} "
              f"{'yes' if using_ok else 'NO':<8} {'yes' if check_ok else 'NO':<8} "
              f"{'PASS' if ok else 'FAIL'}")
        if not ok:
            failures += 1
    return failures


# The 5 reference tables that OAUTH-4 missed — they kept the schema5
# `USING (true)` / `WITH CHECK (true)` policy and were therefore reachable by
# a pending user. SCHEMA5b repolicied them onto the same helper. Unlike the
# transactional tables these use SELECT-only policies (except attachment, which
# stays FOR ALL), and their policy names differ (`personnel_read`, not
# `personnel_authenticated_rw`). Tuple shape: (schema, table, policyname, cmd)
# where cmd is "SELECT" (assert USING only) or "ALL" (assert USING + WITH CHECK).
REFERENCE_TABLES = [
    ("core", "personnel", "personnel_read", "SELECT"),
    ("core", "attachment", "attachment_rw", "ALL"),
    ("core", "location", "location_read", "SELECT"),
    ("wastewater", "sensor", "sensor_read", "SELECT"),
    ("wastewater", "sensor_reading", "sensor_reading_read", "SELECT"),
]


def _probe_reference_policy_bodies(token: str) -> int:
    """Assert the 5 reference tables gate their policy on the helper.

    RED-first: before SCHEMA5b applies, these policies still carry the schema5
    `USING (true)` → the helper string is absent → FAIL. After SCHEMA5b the
    qual (and, for attachment, the with_check) reference the helper → PASS.
    SELECT-only tables assert USING only; the FOR-ALL attachment asserts both.
    """
    print(f"\n{'reference table':<40} {'using':<8} {'check':<8} {'status'}")
    print("-" * 70)
    failures = 0
    for schema, table, policyname, cmd in REFERENCE_TABLES:
        q = (
            "SELECT qual, with_check FROM pg_policies "
            f"WHERE schemaname = '{schema}' AND tablename = '{table}' "
            f"AND policyname = '{policyname}';"
        )
        res = exec_sql(token, q)
        if isinstance(res, dict) and res.get("_error"):
            print(f"{schema}.{table:<36} ERROR: {res['_error']}", file=sys.stderr)
            failures += 1
            continue
        rows = res if isinstance(res, list) else []
        if not rows:
            print(f"{schema}.{table:<36} —      —      FAIL (policy missing)")
            failures += 1
            continue
        row = rows[0]
        qual = row.get("qual") or ""
        check = row.get("with_check") or ""
        using_ok = "fn_is_staff_or_admin" in qual
        # SELECT-only policies have no WITH CHECK — only assert it for FOR ALL.
        check_ok = True if cmd == "SELECT" else "fn_is_staff_or_admin" in check
        ok = using_ok and check_ok
        print(f"{schema}.{table:<33} "
              f"{'yes' if using_ok else 'NO':<8} "
              f"{'—' if cmd == 'SELECT' else ('yes' if check_ok else 'NO'):<8} "
              f"{'PASS' if ok else 'FAIL'}")
        if not ok:
            failures += 1
    return failures


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--mode", choices=["helper", "live"], default="helper")
    args = ap.parse_args()

    token = _load_token()
    if args.mode == "helper":
        return probe_helper(token)
    print("live mode not implemented yet (needs test auth.users rows).",
          file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
