# ADR-0008: SECURITY DEFINER helper for self-referential RLS policies

- **Status**: Accepted (2026-07-21, chunk OAUTH-1b)
- **Context**: [OAUTH-1b commit `1394d2a`](https://github.com/aase7en/env-wastewater-webapp/commit/1394d2a) + [OAUTH-1 commit `13ac9c5`](https://github.com/aase7en/env-wastewater-webapp/commit/13ac9c5)
- **Related**: ADR-0007 (OAuth pending approval), SCHEMA-4 audit_log trigger pattern

## Context

`core.app_user` is a 1:1 mapping to `auth.users` — the role-bearing row that
drives every auth-aware code path (`isAuthenticated`, `isAdmin`, `isPending`).
RLS policies on it must answer two questions:

1. Can the caller read this row? (own row yes; other rows only if admin)
2. Can the caller write this row? (admin only)

The "admin only" check requires reading the caller's own role from
`core.app_user`. OAUTH-1 (commit `13ac9c5`) introduced:

```sql
CREATE POLICY app_user_admin_all ON core.app_user
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'));
```

This is the **same pattern** that SCHEMA-4's `audit_log_admin_all` uses
(commit `20260719000003_v2_audit_trigger.sql`), so it looked safe.

It was not. The first authenticated query through PostgREST raised:

```
HTTP 500 { code: 42P17, message: "infinite recursion detected in policy
for relation \"app_user\"" }
```

## Root cause

Postgres evaluates RLS policies by re-running the policy expression for each
row. The `EXISTS (SELECT FROM core.app_user …)` subquery re-enters RLS on
`core.app_user` itself, which fires the same policy expression again, which
runs another subquery, …

Postgres detects the cycle and refuses with `42P17`. The query never returns.

SCHEMA-4's audit_log policy doesn't have this problem because its policy
lives on `core.audit_log` (a different table) and only **reads** `core.app_user`
— that read enters `app_user`'s RLS once, no recursion.

The bug class is specific to a policy on table T that subqueries table T.

## Discovery path

This went undetected through three review rounds because every verification
path bypassed it:

1. **Migration apply** (Supabase Management API direct SQL) — runs as the
   `postgres` owner, which bypasses RLS entirely. The policy exists but is
   never exercised, so the recursion is invisible.
2. **`loadAppUser` unit-level probe** — GLM queried `core.app_user` directly
   via the same Management API, also as `postgres`. No RLS.
3. **Fable5 review** — verified via `SET LOCAL ROLE authenticated` simulation
   that ran in a single transaction, but used the pre-OAUTH-1 schema state
   where the recursive policy didn't exist yet.

The bug only surfaced when a real user logged in via the browser and the
frontend issued `GET /rest/v1/app_user?id=eq.<uuid>` with a Bearer JWT.
PostgREST runs that as the `authenticated` role with the JWT's `auth.uid()`,
which exercises the policy and trips the recursion. End result: HTTP 500,
`appUser=null`, `isAuthenticated=false`, login bounce — same visible symptom
as AUTH-2 but different root cause.

## Decision

**Any RLS policy on table T that needs to read T to make a decision must do
the read through a `SECURITY DEFINER` helper function.** SECURITY DEFINER
functions execute with the owner's privileges (`postgres`) and bypass RLS,
breaking the recursion.

The fix applied in OAUTH-1b:

```sql
CREATE OR REPLACE FUNCTION core.fn_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = core, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM core.app_user
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE POLICY app_user_admin_all ON core.app_user
    FOR ALL TO authenticated
    USING (core.fn_is_admin())
    WITH CHECK (core.fn_is_admin());
```

`fn_is_admin()` runs as `postgres`, so its inner SELECT on `core.app_user`
does not re-enter RLS — no recursion.

This is the canonical Supabase pattern documented at
https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-in-rls
under "Use SECURITY DEFINER on functions called in RLS policies that
read from the same table the policy is on."

## Alternatives considered

- **A. `auth.jwt()` claim check.** Read the role from a custom JWT claim
  instead of `core.app_user`. Rejected — would require hooking Supabase
  Auth's JWT generation to inject `app_user.role` per login, which is fragile
  and not the default Supabase flow. Role also wouldn't update live (JWT
  caches the claim until refresh).
- **B. Duplicate role into `auth.users.raw_app_meta_data`.** Rejected —
  same staleness problem + denormalization that needs sync triggers.
- **C. Move the admin check out of RLS into RPCs only.** Rejected —
  the `app_user_read` policy (own-row SELECT) is needed for
  `loadAppUser` to work at all, and admin-only writes still need a policy
  guard so the table isn't wide-open to any authenticated user.
- **D. `pg_policy` recursion guard via `pg_policy_depth_limit`.** Not a
   real Postgres feature; the 42P17 error is the only signal.

## Consequences

**Positive:**
- Self-referential RLS policies are safe to write, as long as the read goes
  through a SECURITY DEFINER helper.
- The pattern is reusable: `fn_is_staff()`, `fn_is_active()`, etc. can be
  added the same way if future policies need them.
- Audit trail: SECURITY DEFINER functions show up in `\df+` and the schema
  snapshot, so reviewers can spot the recursion guard at a glance.

**Negative:**
- One indirection layer between the policy and the data it reads — future
  maintainers must understand the SECURITY DEFINER bypass or they'll write
  the recursive form again.
- `fn_is_admin()` must be kept in sync with the role enum. If a new role is
  added (e.g. `super_admin`), every caller of `fn_is_admin()` needs review.
- SECURITY DEFINER is a privilege-escalation surface — the function body
  must be a tight, read-only check. Never write a SECURITY DEFINER function
  that performs writes based on caller input.

## When this applies

Write the recursion-safe form whenever **all three** are true:

1. The policy is on table T.
2. The policy's `USING` or `WITH CHECK` expression reads from T.
3. T has RLS enabled.

Otherwise (e.g. SCHEMA-4 `audit_log_admin_all` reading `core.app_user` from
a policy on `core.audit_log`), the inline `EXISTS` form is fine — it
doesn't recurse because the policy lives elsewhere.

## Test that would have caught OAUTH-1 earlier

Every data-side WO should include a **REST probe** in its Verify commands,
not just SQL probes. Concretely:

```bash
# After applying a migration that touches RLS policies:
# 1. Login as a known authenticated user (via supabase-js password grant).
# 2. Hit the affected table through /rest/v1/ with the Bearer JWT.
# 3. Assert HTTP 200 + expected row count.
```

SQL-only verification (Management API as `postgres`) cannot exercise RLS.
This is the same lesson Fable5's SCHEMA-5 review captured — and it bit again
here. Both should be referenced in future WO templates.
