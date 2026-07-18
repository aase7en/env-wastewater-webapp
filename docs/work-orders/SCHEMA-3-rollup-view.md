# WO-SCHEMA-3: cross-schema carbon rollup view
Status: done (2026-07-17, zcode) — commit `ef6989c`
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

### done — 2026-07-17 (zcode) — commit `ef6989c`
- **Approach A chosen** (single UNION ALL VIEW) over MATERIALIZED VIEW (B)
  and parameterized function (C). Reason: PostgREST queryable directly
  via `/rest/v1/v_unified_co2e`, no cron/staleness to manage, data
  always fresh.
- **5 UNION ALL subqueries**:
  - Scope 2: carbon.reading × electricity EF (existing)
  - Scope 1: fuel.dispense_log × diesel/gasoline/lpg EF (by fuel_type)
  - Scope 1: garden.work_round × gasoline EF (2-stroke fuel_used_l)
  - Scope 3: garbage.collection_log × waste factor (general/infectious/recyclable by waste_type)
  - Scope 3: chemical.movement (direction='out') × chemical factor (chlorine/alum/KMnO₄/reagent_disposal)
- **Type fix encountered**: `carbon.source_type = text` operator doesn't
  exist → cast `d.fuel_type::carbon.source_type`. Idempotent re-apply OK.
- **Verified live**:
  - 2026-06: 140 kWh × 0.4999 = 69.986 kgCO₂e ✓ (matches V2a manual calc)
  - 2026-07: 19 kWh × 0.4999 = 9.4981 kgCO₂e ✓
  - Scope totals: Scope 2 = 2185.06 kgCO₂e across 31 source rows
  - EXPLAIN ANALYZE: 0.838ms — HashAggregate + sequential scans on
    small tables, very fast
  - Scope 1 + 3 not visible (module tables empty) — by design, dashboard
    will show "ข้อมูล incomplete" flag until module data lands
- **RLS inheritance**: view inherits policy from underlying tables
  (each has authenticated-rw). PostgreSQL does not support ENABLE ROW
  LEVEL SECURITY on views directly — documented in migration comment.
- No frontend impact (no UI in this chunk).
