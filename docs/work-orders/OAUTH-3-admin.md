# WO-OAUTH-3: admin approval — RPC + PendingUsersPage + NAV badge

Status: open (2026-07-21, queued after OAUTH-2)
Lane/files:
- `supabase/migrations/20260721000001_oauth3_admin_rpc.sql` (NEW)
- `frontend/src/lib/admin/users.ts` (NEW)
- `frontend/src/pages/admin/PendingUsersPage.tsx` (NEW)
- `frontend/src/App.tsx` (new `/admin/users` route)
- `frontend/src/components/layout/AppShell.tsx` (NAV entry + badge count)
- `reports/schema-snapshot-live.md` (regenerate)
Branch: main
Model tier: **cheap-ok Track Z** + Track F polish ที่หลัง (Fable5)

## บริบท

OAuth user login สำเร็จ → role='pending' → bounce `/pending-approval`.
Admin ต้องมีหน้าเห็น user pending ทั้งหมด + ปุ่ม approve/reject.

## Goal + Acceptance

1. `core.fn_approve_user(uuid)` RETURNS void SECURITY DEFINER
   - `UPDATE core.app_user SET role='staff' WHERE id=$1 AND is_active=true`
   - ตรวจ admin: `EXISTS (SELECT 1 FROM core.app_user WHERE id=auth.uid() AND role='admin')`
   - ไม่ใช่ = raise exception `permission denied`
2. `core.fn_reject_user(uuid)` RETURNS void SECURITY DEFINER
   - `UPDATE core.app_user SET is_active=false WHERE id=$1`
   - เดียวกัน admin check
   - ไม่ DELETE auth.users (user ยัง login ได้แต่ is_active=false → RequireAuth bounce)
3. `lib/admin/users.ts`:
   - `fetchPendingUsers()`: SELECT pending + JOIN auth.users metadata (email, provider, created_at)
   - `approveUser(id)`: `.rpc('fn_approve_user', { user_id: id })`
   - `rejectUser(id)`: `.rpc('fn_reject_user', { user_id: id })`
   - **NOTE**: auth.users table is in `auth` schema — not exposed via PostgREST.
     Email + provider ต้องมาจาก `core.app_user` เท่านั้น OR
     duplicate into `core.app_user` via trigger (see Step 1 below — we
     extend the OAUTH-1 provisioning function to copy email too).
4. `PendingUsersPage.tsx`:
   - Pattern: copy `AIAdminPage.tsx` structure (useCallback refresh + toast + TableSkeleton)
   - Columns: display_name, email, provider, created_at, [อนุมัติ] [ปฏิเสธ]
   - Empty state: "ไม่มีผู้ใช้รออนุมัติ"
5. App.tsx: `/admin/users` route (lazy, requireAdmin)
6. AppShell.tsx: NAV entry "รออนุมัติ" (adminOnly, icon `person_add`)
   - Badge count (optional Track F polish — basic version: just label)
7. RLS: grant EXECUTE on RPCs to authenticated (function-level admin check inside)
8. `npm run build` ✅ + Vitest ✅ + Playwright ✅

## Forbidden

- ห้ามแตะ className/colors/fonts ของ AuraCard/Button/Table (Track F) — basic Tailwind only
- ห้าม DELETE auth.users จาก RPC (ใช้ is_active=false แทน)
- ห้าม grant EXECUTE ให้ anon
- ห้าม route credentials ผ่าน chat

## Steps

### 1. Migration `20260721000001_oauth3_admin_rpc.sql`

```sql
-- OAUTH-3: admin approve/reject RPCs + extend provisioning to copy email.
-- See docs/work-orders/OAUTH-3-admin.md + docs/adr/0007-oauth-pending-approval.md
-- Idempotent. Track Z scope (SQL only).

-- ─── 1) Extend OAUTH-1 provisioning to copy email into core.app_user ─────
-- (auth.users is not PostgREST-exposed, so we duplicate email into app_user
--  for the admin page. display_name already comes from raw_user_meta_data.)
-- Add email column if missing (auth emails are public info for admin UI).
ALTER TABLE core.app_user ADD COLUMN IF NOT EXISTS email text;
COMMENT ON COLUMN core.app_user.email IS
    'Duplicate of auth.users.email for admin UI listing. NULL for users created before OAUTH-3.';

-- Recreate provisioning fn to populate email too (idempotent — DROP IF EXISTS first).
CREATE OR REPLACE FUNCTION core.fn_provision_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    INSERT INTO core.app_user (id, role, display_name, email)
    VALUES (
        NEW.id,
        'pending',
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NULL
        ),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Recreate view (cache refresh for new email column).
CREATE OR REPLACE VIEW public.app_user
    WITH (security_invoker=on) AS SELECT * FROM core.app_user;

-- ─── 2) Approve / reject RPCs ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION core.fn_approve_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'permission denied: admin role required' USING ERRCODE = '42501';
    END IF;
    UPDATE core.app_user SET role = 'staff' WHERE id = p_user_id AND is_active = true;
END;
$$;
COMMENT ON FUNCTION core.fn_approve_user(uuid) IS
    'OAUTH-3 (2026-07-21) — admin promotes a pending user to staff. SECURITY DEFINER + admin role check inside. Audit log fires via trg_audit_log (OAUTH-1).';

CREATE OR REPLACE FUNCTION core.fn_reject_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'permission denied: admin role required' USING ERRCODE = '42501';
    END IF;
    UPDATE core.app_user SET is_active = false WHERE id = p_user_id;
END;
$$;
COMMENT ON FUNCTION core.fn_reject_user(uuid) IS
    'OAUTH-3 (2026-07-21) — admin deactivates a user (is_active=false). Does NOT delete auth.users (user can still attempt login but RequireAuth rejects). SECURITY DEFINER + admin check.';

GRANT EXECUTE ON FUNCTION core.fn_approve_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION core.fn_reject_user(uuid) TO authenticated;
```

### 2. `lib/admin/users.ts`

```ts
import { supabase } from "../supabase";

export interface PendingUser {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  is_active: boolean;
}

export async function fetchPendingUsers(): Promise<PendingUser[]> {
  const { data, error } = await supabase
    .from("app_user")
    .select("id, display_name, email, created_at, is_active")
    .eq("role", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingUser[];
}

export async function approveUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("fn_approve_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
}

export async function rejectUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("fn_reject_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
}
```

### 3. `pages/admin/PendingUsersPage.tsx`

Pattern: copy `AIAdminPage.tsx` (lines 1-80). Replace provider CRUD with
pending user table. Use `TableSkeleton` for loading, `toast("success", ...)`
for actions, `confirm()` for reject confirmation.

### 4. `App.tsx` route

```tsx
const PendingUsersPage = lazy(() =>
  import("./pages/admin/PendingUsersPage").then((m) => ({ default: m.PendingUsersPage }))
);
// ...
<Route
  path="/admin/users"
  element={
    <RequireAuth requireAdmin>
      <Suspense fallback={<PageSkeleton />}><PendingUsersPage /></Suspense>
    </RequireAuth>
  }
/>
```

### 5. `AppShell.tsx` NAV

Add to NAV array (adminOnly section):

```ts
{ to: "/admin/users", label: "รออนุมัติ", icon: "person_add", adminOnly: true },
```

### 6. e2e test `tests/e2e/admin-users.spec.ts`

Mock pending users + admin role, render page, click "อนุมัติ", verify
RPC call + toast.

## Dependencies

- OAUTH-1 (pending role + provisioning trigger)
- OAUTH-2 (PendingApprovalPage exists for the rejected-pending UX continuity)
- icon `person_add` already in Material Symbols subset (FONTS-1)

## Verify

```bash
uv run python scripts/apply_migration_api.py supabase/migrations/20260721000001_oauth3_admin_rpc.sql
uv run python scripts/introspect_schema_api.py
cd frontend && npm run build && npx vitest run && npx playwright test
# Probe RPC (Fable5 pattern review #2/#6):
# SET LOCAL ROLE authenticated; select core.fn_approve_user(...);
```

## Checkpoint / ปิดท้าย

(none yet — execute pending)
