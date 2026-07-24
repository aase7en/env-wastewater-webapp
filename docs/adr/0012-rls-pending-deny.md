# ADR-0012 — Deny pending-role on transactional RLS

**Date**: 2026-07-24
**Status**: Accepted
**WO**: `docs/work-orders/OAUTH-4-deny-pending-rls.md`
**Migration**: `supabase/migrations/20260724000000_oauth4_deny_pending_rls.sql`

## Context

OAUTH-1 (ADR-0007) introduced a `pending` role for OAuth users who have
signed up but not yet been approved by an admin. The frontend bounces
pending users to `/pending-approval` via `RequireAuth.tsx:41-42`.

However, the **database-level RLS** — the actual trust boundary — still
allowed pending through. Every transactional table's policy was written as:

```sql
CREATE POLICY <table>_authenticated_rw ON <schema>.<table>
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

`TO authenticated` matches ANY authenticated JWT, including a pending user.
So a pending user with a direct REST call (curl, a future mobile client,
any tool using the JWT layer) could read AND write transactional data
before admin approval. The frontend bounce is defense-in-depth, not the
belt of trust.

This was discovered while prepping the dashboard-config runbook
(`docs/runbooks/dashboard-config-oauth-ai.md`): once the user opens Google
OAuth (Part A), real pending users would exist for the first time, and
the window between signup and approval would expose transactional data.

## Decision

Mirror the `core.fn_is_admin()` SECURITY DEFINER pattern from OAUTH-1b
(ADR-0008) to avoid the same RLS recursion. Add a sibling
`core.fn_is_staff_or_admin()` and rewrite every transactional policy's
`USING`/`WITH CHECK` from `(true)` → the helper.

### Why SECURITY DEFINER (not inline subquery)

ADR-0008 documented that a policy subquery on `core.app_user` re-enters RLS
→ 42P17 infinite recursion. The helper reads `core.app_user` under the
owner's privileges (postgres), bypassing RLS, so the lookup does not
recurse. Same lesson; same fix shape.

### Why `staff OR admin` (not just `staff`)

Admin must retain full access (audit log, approval UI, etc.). `pending` is
the only role denied. The helper is the single source of truth — all 11
transactional policies delegate to it, so the contract is pinned in one
place.

### Affected tables (11)

`water_supply.daily_check`, `garbage.collection_log`, `fuel.dispense_log`,
`garden.work_round`, `building.inspection_round`, `safety.monthly_check`,
`food.lab_test`, `chemical.movement`, `chemical.master`,
`wastewater.threshold_alert`, `core.regulation`.

### Out of scope

- `core.ai_query_log` (INSERT-only telemetry, no PHI) — left open on purpose.
- `core.app_user` / `core.audit_log` — already role-scoped by OAUTH-1 / SCHEMA-5.
- anon role — stays denied everywhere (unchanged).

## Consequences

**Positive**:
- RLS belt now matches OAUTH-1's intent — pending = wait before touching data.
- Single helper function = single place to audit the role contract.
- Future tables can reuse `core.fn_is_staff_or_admin()` in their policies.

**Negative**:
- One more SECURITY DEFINER function to maintain (same shape as fn_is_admin,
  low maintenance burden).
- Probe script (`scripts/test_oauth4_rls_probe.py`) must be re-run if the
  enum changes (e.g. adding a `viewer` role) — but that's the point: the
  contract is pinned and a regression test catches loosenings.

## Verification

- `scripts/test_oauth4_rls_probe.py` runs against live ENV_DB:
  - helper logic: 3/3 roles correct (pending→false, staff→true, admin→true)
  - policy bodies: 11/11 tables reference the helper in both USING + WITH CHECK
- Migration applied 24/24 statements OK via Management API.
- No frontend changes (RequireAuth bounce already handles UX).

## Related

- ADR-0007 (OAUTH-1 pending role) — the role this tightens
- ADR-0008 (RLS self-reference recursion) — the pattern this mirrors
- `docs/runbooks/dashboard-config-oauth-ai.md` — the work this unblocks safely
