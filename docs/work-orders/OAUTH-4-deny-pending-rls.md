# OAUTH-4 — Deny pending-role on transactional RLS

> **Tier**: cheap-ok Track Z (pure SQL + probe script)
> **Status**: GLM in-progress (2026-07-24)
> **Scope**: 1 migration + 1 RLS probe script + ADR-0011 (optional)
> **Blocks**: should land *before* user opens Google/LINE OAuth (Part A-D in
> `docs/runbooks/dashboard-config-oauth-ai.md`) — otherwise pending users
> can touch transactional data during the window between OAuth signup and
> admin approval.

## Problem

OAUTH-1 added a `pending` role (signed-up-but-not-yet-approved OAuth user).
RequireAuth already bounces pending → `/pending-approval` at the frontend
layer (`RequireAuth.tsx:41-42`). **But the DB-level RLS belt still allows
pending through**, because the transactional policies are written as:

```sql
CREATE POLICY <table>_authenticated_rw ON <schema>.<table>
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

`TO authenticated` matches ANY authenticated JWT — including a pending
user. So a pending user with a stolen/crafted direct REST call (or any
future tool using the anon+JWT layer) can read AND write transactional
data before admin approval. This contradicts OAUTH-1's intent: "pending =
wait for approval before touching data."

The frontend bounce is defense-in-depth, not the trust boundary. RLS is
the belt of trust; this WO tightens it.

## Affected tables (surveyed from migrations)

10 transactional tables use the broad `TO authenticated USING(true)` form:

| Table | Schema | Migration |
|---|---|---|
| `daily_check` | water_supply | v2_schemas |
| `collection_log` | garbage | v2_schemas |
| `dispense_log` | fuel | v2_schemas |
| `work_round` | garden | v2_schemas |
| `inspection_round` | building | v2_schemas |
| `monthly_check` | safety | v2_schemas |
| `lab_test` | food | v2_schemas |
| `movement` | chemical | v2_schemas |
| `master` | chemical | mod_columns |
| `threshold_alert` | wastewater | v3a_alert_readrls |
| `regulation` | core | doc_regulations |

> `core.ai_query_log` is INSERT-only (logging) — left open on purpose
> (anonymous telemetry-style, no PHI). Not in scope.

## Approach

Mirror the `core.fn_is_admin()` SECURITY DEFINER pattern from OAUTH-1b
(commit `20260721000002`). Create a sibling `core.fn_is_staff_or_admin()`
that returns true when the caller's role ∈ {`staff`, `admin`}. Then
rewrite each transactional policy's `USING`/`WITH CHECK` from
`(true)` → `(core.fn_is_staff_or_admin())`.

**Why SECURITY DEFINER (not inline subquery)**: OAUTH-1b found that a
policy subquery on `core.app_user` re-enters RLS → 42P17 infinite
recursion. The fn reads app_user under the owner's privileges, bypassing
RLS, so the lookup does not recurse. Same lesson; same fix shape.

**Why `staff OR admin` (not just `staff`)**: admin must retain full
access (audit log page, approval UI, etc. already assume admin can read
all). `pending` is the only role denied.

## Non-goals

- No frontend changes (RequireAuth bounce already handles UX).
- No changes to `core.app_user` / `core.audit_log` / `core.ai_query_log`
  policies (those are role-scoped already or intentionally open).
- No new columns, no data backfill.
- Does NOT touch anon role — anon stays denied everywhere (existing).

## Test plan (a-debug Iron Law #1 — failing test first)

`scripts/test_oauth4_rls_probe.py` — probes each transactional table's
effective policy by impersonating roles via `set_config('role', ...)`
through the Management API:

1. **RED (before migration)**: for each table, expect that a `pending`
   role context still passes the policy's USING expression — this is the
   bug. Probe should report "GAP: pending allowed on <table>".
2. **GREEN (after migration)**: same probe now reports "pending denied on
   <table>" for all 11 tables; `staff` + `admin` still allowed.

Probe shape: SELECT from each table inside a transaction with
`set_config('request.jwt.claim.role', 'pending')` + `set_config('role',
'authenticated')` — if RLS denies, PostgREST-style behavior is emulated
by checking `pg_policies` USING expression resolution. **Simpler
fallback if JWT-impersonation proves fragile**: directly assert that
`core.fn_is_staff_or_admin()` returns false when the caller's app_user
role is `pending`, true for `staff`/`admin` — this tests the helper fn
(the single source of truth all policies delegate to).

## Verify

- migration applies clean via `apply_migration_api.py`
- probe script reports 11/11 tables deny pending
- `core.fn_is_staff_or_admin()` unit-probed for all 3 roles
- frontend build still passes (no callsite change)
- regression: grep all callsites (already admin/staff-gated via RequireAuth)

## Files

- `supabase/migrations/20260724000000_oauth4_deny_pending_rls.sql` (new)
- `scripts/test_oauth4_rls_probe.py` (new — RED first, GREEN after)
- `docs/adr/0011-rls-pending-deny.md` (new — optional, records decision)
- `docs/handoff/2026-07-19-track-z-complete.md` (append close note)
- `MIGRATION.md` (claim + close in In-progress table)
