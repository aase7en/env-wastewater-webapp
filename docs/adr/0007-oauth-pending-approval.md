# ADR-0007: OAuth (Google + LINE) with DB-trigger provisioning + pending approval

- **Status**: Accepted (2026-07-21, chunks OAUTH-1/2/3)
- **Context**: [WO OAUTH-1](../work-orders/OAUTH-1-schema.md) + [OAUTH-2](../work-orders/OAUTH-2-client.md) + [OAUTH-3](../work-orders/OAUTH-3-admin.md)
- **Related**: ADR-0004 (Supabase-first), AUTH-2 (`f2b7527` app_user schema fix), SCHEMA-5 REST exposure, SCHEMA-4 audit trigger

## Context

`AuthPage.tsx` ships two buttons — "Sign in with Google" and "Sign in with LINE" —
that call `supabase.auth.signInWithOAuth(...)`. As of 2026-07-21:

1. **Neither provider is configured in the Supabase dashboard.** Clicking either
   returns `provider ... is not enabled` or `client_id invalid`. The buttons are
   UI dead weight today.
2. **No auto-provisioning path exists.** `core.app_user` is a 1:1 with
   `auth.users.id` (PK + FK `ON DELETE CASCADE`). Email/password users today
   rely on an admin seeding `core.app_user` rows by hand. For OAuth (where a
   stranger from Gmail can land a new `auth.users` row in seconds), manual
   seeding does not scale and produces a race: the new auth.users row exists
   but `appUser` is null → `isAuthenticated=false` → bounce to /login despite
   a valid OAuth session (same failure mode as AUTH-2).
3. **No role for "signed up but not yet approved".** `core.user_role` is
   `(admin, staff)`. Opening OAuth to all Gmail accounts without an
   intermediate state means any Gmail holder is immediately `staff` — PHI
   risk for a hospital app (water readings + repair requests + attachments
   could carry patient-adjacent info).

The hospital is a public facility but the app data is operational/PHI-adjacent.
The team is small (single admin today). Email/password works for known staff;
OAuth is wanted for convenience but must not bypass human vetting.

## Decision

Adopt a **3-part pattern**:

### 1. Add `pending` to `core.user_role` + DB-trigger provisioning

```sql
ALTER TYPE core.user_role ADD VALUE 'pending';
```

A trigger on `auth.users` AFTER INSERT creates the matching `core.app_user`
row automatically with `role='pending'` and `display_name` extracted from
Supabase Auth's `raw_user_meta_data->>'name'` (Google/LINE profile name) or
`NULL` fallback (UI falls back to email per AUTH-2).

This closes the AUTH-2 race for OAuth users: `appUser` resolves
immediately after the OAuth callback instead of `null` → no spurious bounce.

### 2. Pending users see a "รออนุมัติ" page, not the app

`RequireAuth` checks role. If `appUser.role === 'pending'`, redirect to a
new `/pending-approval` route that explains the wait state and offers sign-out.
The user can authenticate but cannot reach `/dashboard`, `/form`, etc.

RLS reinforces this: pending users can SELECT their own `app_user` row only.
Every transactional table (`wastewater.reading`, `core.attachment`, etc.)
denies them via existing `authenticated` policies that implicitly rely on
the role being `admin` or `staff`. (We do not need a new RLS clause per
table — the existing `role IN ('admin','staff')` policies already exclude
`pending`.)

### 3. Admin approval via `/admin/users`

A new admin-only page lists `role='pending'` rows with email, display_name,
and provider (decoded from `auth.users.raw_app_meta_data->>'provider'`).
Admin clicks "อนุมัติ" (calls `core.fn_approve_user(uuid)` →
`UPDATE ... SET role='staff'`) or "ปฏิเสธ" (`core.fn_reject_user(uuid)` →
`SET is_active=false`).

Both RPCs are `SECURITY DEFINER` and check `EXISTS (SELECT 1 FROM core.app_user
WHERE id=auth.uid() AND role='admin')` — same pattern as `core.fn_audit_log`
admin policies (SCHEMA-4 `20260719000003`). Approval lands in `core.audit_log`
via the new `trg_audit_log` on `core.app_user` (the table was previously
not audited — a SCHEMA-4 gap).

## Alternatives considered

- **A. Email allowlist (`@uthai.go.th` only).** Tightest. Rejected because
  hospital staff may use personal Gmail for OAuth convenience, and verifying
  every allowed domain upfront is brittle. The approval flow subsumes this:
  admin can reject non-staff Gmail accounts case-by-case.
- **B. Auto-approve new OAuth users as `staff`.** Simplest. Rejected — PHI
  risk. Any Gmail holder becomes staff immediately, including outsiders who
  stumble on the public app.
- **C. Client-side upsert of `app_user` after OAuth callback.** Rejected —
  requires either an open INSERT policy (abuse risk) or an Edge Function
  (extra surface). DB trigger is atomic, idempotent, and runs before any
  client code sees the session.
- **D. Manual admin seeding only (today's pattern).** Rejected — does not
  scale and produces the AUTH-2 race for OAuth users.

## Consequences

**Positive:**
- OAuth works end-to-end once providers are configured in dashboard.
- Auto-provisioning closes the AUTH-2 race for OAuth users.
- Approval flow is the human gate; no PHI leak before vetting.
- Audit log captures every approval/rejection (who approved whom, when).

**Negative:**
- Adds a `pending` enum value — any code that switches on `role` must handle
  the third case. (Today, only `RequireAuth` and `isAdmin` checks exist;
  both are updated in OAUTH-2.)
- Trigger on `auth.users` is a Supabase-internal table — future Supabase
  migrations could theoretically conflict. Mitigation: trigger uses
  `CREATE OR REPLACE FUNCTION` + `DROP TRIGGER IF EXISTS` so it is
  re-runnable and survives Supabase platform updates.
- Admin must remember to check `/admin/users` — a NAV badge with count
  is added in OAUTH-3 to surface pending requests.
