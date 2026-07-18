# WO-SCHEMA-4: generic audit_log trigger
Status: done (2026-07-17, zcode) — commit `ef6989c`
Lane/files: `supabase/migrations/20260719000003_v2_audit_trigger.sql` เท่านั้น
Branch: main
Depends on: SCHEMA-1

## Goal + Acceptance
- สร้าง PL/pgSQL function `core.fn_audit_log()` แบบ generic ที่ทำงานได้กับทุก table (อ่าน TG_TABLE_NAME / TG_OP / NEW / OLD)
- INSERT/UPDATE/DELETE → เขียน row ใน `core.audit_log` (existing table: actor/action/table_name/row_id/old_data/new_data)
- `actor` = `auth.uid()` (NULL ถ้าเป็น service-role)
- ติดตั้ง trigger บน 8 tables ใหม่ของ SCHEMA-1 + tables เดิมที่ยังไม่มี audit (wastewater.reading, carbon.reading, core.repair_request)
- Idempotent: DROP TRIGGER IF EXISTS ก่อน CREATE
- **Pre-mortem**: trigger loop บน heavy-write table (เช่น sensor_reading) อาจช้า — เก็บ audit_log แค่ transactional tables ไม่ใช่ telemetry
- ไม่มี UI

## Verify
- INSERT 1 row ใน `water_supply.daily_check` → ตรวจ `core.audit_log` เห็น row ใหม่ action='INSERT' table_name='daily_check'
- UPDATE → audit_log row ใหม่ action='UPDATE' old_data/new_data ถูก
- DELETE → audit_log row ใหม่ action='DELETE' old_data ถูก

## Checkpoint log

### done — 2026-07-17 (zcode) — commit `ef6989c`
- **Approach A chosen** (generic function `core.fn_audit_log()` + per-table
  trigger) over per-table inline code. DRY — new tables only need a
  CREATE TRIGGER line. Uses `to_jsonb(NEW)`/`to_jsonb(OLD)` so column-
  shape drift is automatic.
- **Critical RLS gap found + fixed**: `core.audit_log` had RLS enabled
  but NO policies → deny-all → any trigger INSERT in user context would
  have failed. Added 3 policies:
  - `audit_log_authenticated_insert` — INSERT FOR authenticated (trigger
    writes via invoker context)
  - `audit_log_authenticated_select_own` — SELECT FOR authenticated
    WHERE actor = auth.uid() (users see only their own actions)
  - `audit_log_admin_all` — ALL FOR authenticated WHERE app_user.role='admin'
    (compliance officer can review everything + correct entries)
- **Triggers attached** to 11 transactional tables (NOT telemetry):
  - Existing: wastewater.reading, carbon.reading, core.repair_request,
    wastewater.threshold_alert
  - New v2: water_supply.daily_check, garbage.collection_log,
    fuel.dispense_log, garden.work_round, building.inspection_round,
    safety.monthly_check, food.lab_test, chemical.movement
- **Verified live** via round-trip probe:
  - INSERT water_supply.daily_check → audit_log INSERT row with new_data ✓
  - UPDATE → audit_log UPDATE row with both old_data + new_data ✓
  - DELETE → audit_log DELETE row with old_data ✓
  - All 3 actions captured in order, cleanup afterwards
- **actor semantics**: NULL when service-role / Management API probe
  runs (no auth.uid() context). In production browser path with user
  login, auth.uid() returns the user's UUID → audit row actor = user.
  This distinguishes system actions from user actions by design.
- **Performance**: NOT attached to wastewater.sensor_reading (telemetry,
  too write-heavy). Only transactional tables.
