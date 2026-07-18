# WO-SCHEMA-4: generic audit_log trigger
Status: open
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
