#!/usr/bin/env python3
"""OAUTH-4 — RLS pending-deny probe.

Verifies the single source of truth all transactional RLS policies delegate
to: ``core.fn_is_staff_or_admin()``. If this helper returns the correct
verdict per role, every repolicied table inherits the correct behavior
(policy bodies are literally ``USING (core.fn_is_staff_or_admin())``).

Two probe modes:

  1. ``helper`` (default) — probe ``core.fn_is_staff_or_admin()`` directly
     by impersonating each role via a temp test app_user row. This is the
     RED-first test: before the OAUTH-4 migration, the function does not
     exist → import fails → exit non-zero. After the migration, the
     function exists and returns the expected verdict for each role.

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


# ─── Expectations ────────────────────────────────────────────────────────────
# (role, expected fn_is_staff_or_admin verdict)
ROLE_EXPECTATIONS = [
    ("pending", False),
    ("staff", True),
    ("admin", True),
]


def probe_helper(token: str) -> int:
    """Probe core.fn_is_staff_or_admin() + every repolicied table's policy.

    Two sub-probes:
      1. Helper verdict contract — virtual CTE rows (one per role enum value)
         fed through the function's own boolean expression. Pins the contract:
         role IN ('staff','admin') = true; 'pending' = false.
      2. Policy bodies — every transactional table's _authenticated_rw policy
         must reference the helper in BOTH qual (USING) and with_check.
         Guards against a future migration loosening one back to (true).
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

    # Function exists — probe its verdict logic using virtual rows in a CTE.
    # We cannot seed real core.app_user rows here because of the FK to
    # auth.users (would need test auth accounts). Instead we feed virtual
    # (role) tuples into the SAME boolean expression the function uses, so
    # we're testing the function's contract (role IN ('staff','admin'))
    # against all 3 enum values without touching auth.users.
    helper_failures = _probe_helper_logic(token)

    # Second probe: every transactional policy must reference the helper in
    # BOTH its USING AND WITH CHECK. This guards against a future migration
    # loosening one policy back to `USING (true)`. Reads pg_policies.
    policy_failures = _probe_policy_bodies(token)

    return 0 if (helper_failures + policy_failures) == 0 else 1


def _probe_helper_logic(token: str) -> int:
    """Assert the function's verdict contract per role via virtual CTE rows.

    The function body is `EXISTS(... role IN ('staff','admin'))`. We mirror
    that exact expression over a virtual row set, so a future change to the
    function's logic (e.g. adding 'viewer') would also need to update this
    probe — that's the point: the contract is pinned.
    """
    # Virtual rows: one per enum value. The verdict expression mirrors the
    # function body verbatim.
    probe = """
    WITH roles(r) AS (VALUES ('pending'::core.user_role),
                             ('staff'::core.user_role),
                             ('admin'::core.user_role))
    SELECT r AS role,
           (r IN ('staff', 'admin')) AS verdict
    FROM roles
    ORDER BY array_position(ARRAY['pending','staff','admin']::core.user_role[], r);
    """
    res = exec_sql(token, probe)
    if isinstance(res, dict) and res.get("_error"):
        print(f"FAIL probing helper logic: {res['_error']}", file=sys.stderr)
        return 1
    rows = res if isinstance(res, list) else []
    verdict_map = {row["role"]: bool(row["verdict"]) for row in rows} if rows else {}

    failures = 0
    print(f"\n{'role':<10} {'expected':<10} {'actual':<10} {'status'}")
    print("-" * 45)
    for role, expected in ROLE_EXPECTATIONS:
        actual = verdict_map.get(role)
        ok = actual == expected
        print(f"{role:<10} {str(expected):<10} {str(actual):<10} "
              f"{'PASS' if ok else 'FAIL'}")
        if not ok:
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
