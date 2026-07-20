# WO-OAUTH-1: schema migration — pending role + provisioning trigger + audit

Status: open (2026-07-21, queued for GLM execute)
Lane/files:
- `supabase/migrations/20260721000000_oauth1_pending_role.sql` (NEW)
- `reports/schema-snapshot-live.md` (regenerate)
Branch: main
Model tier: **cheap-ok** (pure Track Z — SQL only; no className/colors/fonts)

## บริบท — ทำไมต้อง chunk นี้ก่อน

OAuth buttons (Google + LINE) ใน `AuthPage.tsx` ไม่ทำงานเพราะ:
1. Supabase dashboard ยังไม่ได้ลงทะเบียน provider (OAUTH-2 + user config จะแก้)
2. ไม่มี auto-provisioning — เมื่อ OAuth login สำเร็จ `auth.users` มี row ใหม่
   แต่ `core.app_user` ไม่มี → `appUser=null` → `isAuthenticated=false` →
   bounce /login (race เดียวกับ AUTH-2)
3. `core.user_role` มีแค่ `(admin, staff)` — ถ้า auto-approve เป็น staff ทันที
   = PHI risk (any Gmail holder = staff ทันที)

แก้ด้วย: เพิ่ม enum `pending` + DB trigger auto-INSERT `core.app_user`
role=pending + audit trigger บน `core.app_user` (SCHEMA-4 gap — ปัจจุบัน
`app_user` ไม่มี audit).

## Goal + Acceptance

1. `core.user_role` enum มีค่า `(admin, staff, pending)`
2. `auth.users AFTER INSERT` trigger → INSERT `core.app_user(id=NEW.id,
   role='pending', display_name=NEW.raw_user_meta_data->>'name')`
   - Idempotent: re-run ปลอดภัย (DROP IF EXISTS + CREATE OR REPLACE)
   - ไม่ทำให้ row ที่มีอยู่ (admin เดิม) หาย
3. `public.app_user` view recreate (PG cache — pattern เดียวกับ AUTH-2)
4. `trg_audit_log` บน `core.app_user` (INSERT/UPDATE/DELETE) — เพื่อให้
   approve action ถูกบันทึกใน `core.audit_log` อัตโนมัติ
5. RLS policy บน `core.app_user` ยังคง:
   - admin: SELECT all + UPDATE role
   - authenticated: SELECT own row (`id = auth.uid()`)
   - **pending อ่าน own row ได้** เพื่อให้ `loadAppUser` resolve ได้
6. `npm run build` ผ่าน (ไม่แตะ frontend — sanity check เท่านั้น)

## Forbidden

- ห้ามแตะ frontend code (OAUTH-2 เป็นเจ้าของ client)
- ห้ามแตะ className/colors/fonts (Track F)
- ห้ามลบ row admin ที่มีอยู่
- ห้าม ALTER TYPE ที่ไม่ใช่ ADD VALUE (one-way operation — ใช้ ADD VALUE IF NOT EXISTS)
- ห้าม grant ให้ anon บน `core.app_user` (PHI-adjacent)

## Steps

### 1. Migration file `20260721000000_oauth1_pending_role.sql`

```sql
-- OAUTH-1: add 'pending' role + auto-provisioning trigger + audit on app_user.
-- See docs/work-orders/OAUTH-1-schema.md + docs/adr/0007-oauth-pending-approval.md
-- Idempotent. Track Z scope (SQL only).

-- ─── 1) Extend user_role enum ─────────────────────────────────────────────
ALTER TYPE core.user_role ADD VALUE IF NOT EXISTS 'pending';

-- ─── 2) Provisioning function + trigger on auth.users ────────────────────
-- When a new auth.users row appears (email signup OR OAuth callback), create
-- the matching core.app_user row automatically with role='pending'.
CREATE OR REPLACE FUNCTION core.fn_provision_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    INSERT INTO core.app_user (id, role, display_name)
    VALUES (
        NEW.id,
        'pending',
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NULL
        )
    )
    ON CONFLICT (id) DO NOTHING;  -- idempotent if re-fired
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provision_app_user ON auth.users;
CREATE TRIGGER trg_provision_app_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION core.fn_provision_app_user();

COMMENT ON FUNCTION core.fn_provision_app_user() IS
    'OAUTH-1 (2026-07-21) — auto-provision core.app_user row when a new auth.users row lands (email signup or OAuth callback). role=pending by default; admin promotes via core.fn_approve_user (OAUTH-3). SECURITY DEFINER so the trigger can write to core.app_user regardless of caller role. Idempotent via ON CONFLICT (id) DO NOTHING.';

-- ─── 3) Recreate public.app_user view (PG caches column list at CREATE) ──
-- Pattern identical to AUTH-2: adding display_name to base table does not
-- propagate to `select *` views without an explicit recreate.
CREATE OR REPLACE VIEW public.app_user
    WITH (security_invoker=on) AS SELECT * FROM core.app_user;

-- ─── 4) Audit trigger on core.app_user (SCHEMA-4 gap) ────────────────────
-- Same pattern as every other transactional table (see 20260719000003_v2_audit_trigger.sql:115+).
-- Captures approve/reject actions (UPDATE role / SET is_active=false) in core.audit_log.
DROP TRIGGER IF EXISTS trg_audit_log ON core.app_user;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON core.app_user
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

-- ─── 5) RLS on core.app_user ─────────────────────────────────────────────
-- Re-declare to be explicit about pending role visibility.
-- (Existing policies from SCHEMA-5 are kept; these are no-ops if same name.)
DROP POLICY IF EXISTS app_user_read ON core.app_user;
DROP POLICY IF EXISTS app_user_update_self ON core.app_user;
DROP POLICY IF EXISTS app_user_admin_all ON core.app_user;

-- authenticated: SELECT own row (pending user reads own row to resolve appUser)
CREATE POLICY app_user_read ON core.app_user
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- admin: full access (read all + update role for approve/reject)
CREATE POLICY app_user_admin_all ON core.app_user
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'));
```

### 2. Apply migration

```bash
uv run python scripts/apply_migration_api.py \
  supabase/migrations/20260721000000_oauth1_pending_role.sql
```

Expect: 5+ statements OK (count: ALTER TYPE + CREATE FUNCTION + DROP TRIGGER +
CREATE TRIGGER + COMMENT + CREATE VIEW + DROP TRIGGER + CREATE TRIGGER +
3× DROP POLICY + 2× CREATE POLICY = ~12 statements depending on splitter).

### 3. Refresh snapshot

```bash
uv run python scripts/introspect_schema_api.py
```

Expect: `core.user_role` enum row = `admin, staff, pending`.

### 4. Probe trigger (manual — test user creation)

```bash
# Use Supabase dashboard → Auth → Users → "Add user" with a test email
# (NOT through Z.ai — PHI boundary). Then probe via Management API:
uv run python -c "
import sys; sys.path.insert(0, 'scripts')
from introspect_schema_api import query, _load_token
tok = _load_token()
r = query(tok, \"SELECT id, role, display_name, is_active FROM core.app_user ORDER BY created_at DESC LIMIT 5\")
for row in r: print(row)
"
# Expect: new row with role='pending', is_active=true, display_name from
# metadata or NULL.
```

### 5. Verify

- `npm run build` ✅ (sanity — no frontend touched)
- snapshot enum includes `pending` ✅
- `auth.users` trigger exists (`pg_trigger` probe)
- `core.app_user` audit trigger exists
- existing admin row untouched (id, role='admin' preserved)

## Verify commands summary

```bash
uv run python scripts/apply_migration_api.py supabase/migrations/20260721000000_oauth1_pending_role.sql
uv run python scripts/introspect_schema_api.py
cd frontend && npm run build
```

## Dependencies

- ต้องรันหลัง AUTH-2 (`f2b7527` landed) — เพราะ `display_name` column ต้องมีอยู่
- OAUTH-2 (client) ต้องรันหลัง chunk นี้ — เพราะ `pending` role ต้องมีอยู่ใน DB
  ก่อน RequireAuth จะเช็คได้

## Checkpoint / ปิดท้าย

(none yet — execute pending)
