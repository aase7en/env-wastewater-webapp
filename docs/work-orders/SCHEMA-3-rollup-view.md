# WO-SCHEMA-3: cross-schema carbon rollup view
Status: open
Lane/files: `supabase/migrations/20260719000002_v2_unified_rollup.sql` เท่านั้น
Branch: main
Depends on: SCHEMA-1, SCHEMA-2

## Goal + Acceptance
- สร้าง view `carbon.v_unified_co2e` ที่ union ทุก carbon-contributing table ข้าม schema:
  - `carbon.reading` (Scope 2 electricity, existing)
  - `fuel.dispense_log` (Scope 1)
  - `garden.work_round.fuel_used_l` (Scope 1)
  - `chemical.movement` (Scope 1/3 — เฉพาะ direction='out' + คำนวณจาก emission_factor matching chemical_name)
  - `garbage.collection_log` (Scope 3 — waste-to-landfill factor × weight_kg)
- Output columns: `month (date), scope (int 1/2/3), source (text), kg_co2e (numeric)`
- Aggregate ระดับเดือน (date_trunc('month', *_date))
- RLS: view อนุมานจาก underlying table policies (authenticated)
- **Pre-mortem**: cross-schema view ใน Supabase free ทำได้แต่ต้องระวัง NULL on empty tables — ใช้ COALESCE และ LEFT JOIN
- ไม่มี UI

## Verify
- `SELECT * FROM carbon.v_unified_co2e LIMIT 5` — คืน row จาก carbon.reading เดิม (Scope 2)
- `EXPLAIN ANALYZE SELECT * FROM carbon.v_unified_co2e` — execution plan ไม่พัง
- ทดสอบ RLS: query ผ่าน anon session → ปฏิเสธ (empty result)

## Checkpoint log
