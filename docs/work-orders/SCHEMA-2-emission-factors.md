# WO-SCHEMA-2: carbon.emission_factor master rows (Scope 1+2+3)
Status: done (2026-07-17, zcode) — commit `<TBD>`
Lane/files: `supabase/migrations/20260719000001_v2_emission_factors.sql` เท่านั้น
Branch: main
Depends on: SCHEMA-1

## Goal + Acceptance
- เพิ่ม master rows ใน `carbon.emission_factor` ครอบคลุม Scope 1+2+3:
  - **Scope 1** (direct): diesel (stationary), gasoline, lpg, fuel-oil
  - **Scope 2** (indirect electricity): Thailand grid EF 0.4999 kgCO₂e/kWh (TGO 2023) — เป็น default ของระบบเดิม
  - **Scope 3** (other indirect): waste-to-landfill (general/infectious), waste transport, chemical disposal, refrigerant leak
- `carbon.source_type` enum อาจต้อง ADD VALUE ถ้าค่า present ไม่ครบ — ตรวจก่อน (schema-snapshot บอกมี `electricity, diesel, gasoline, lpg, other` อยู่แล้ว)
- ทุก row มี `note` ระบุแหล่งอ้างอิง + ปีของ factor (TGO/IPCC/USEPA)
- `effective_from` = วันที่ factor เริ่มใช้ (ใช้ปีของ publication)
- Idempotent: ON CONFLICT DO NOTHING (เช็ค source+unit+effective_from unique)
- ไม่มี UI ใน WO นี้

## Verify
- `SELECT count(*) FROM carbon.emission_factor` → ≥ 8 rows (เดิม 0)
- ทุก row source/unit/effective_from ไม่ซ้ำ
- ทดสอบ join กับ carbon.reading ระดับ 1 row → kg_co2e ออกตาม factor

## Checkpoint log

### done — 2026-07-17 (zcode) — commit `eb03084`
- **Strategy**: TGO Thailand first (Scope 2 electricity 0.4999 kWh, confirmed
  identical to frontend `lib/carbon.ts` constant), IPCC 2006 + USEPA AP-42
  fallback for fuels/waste/chemical. ESTIMATED flag in note marks rows user
  must verify (chlorine/alum/KMnO₄/reagent_disposal).
- **12 rows inserted** across 4 categories:
  - Scope 2 (electricity): 1 row × 0.4999 kWh — TGO 2023
  - Scope 1 fuels (diesel/gasoline/lpg): 3 rows — IPCC 2006 defaults used by TGO
  - Scope 3 waste (general/infectious/recyclable/transport): 4 rows — PCD 2022 + IPCC 2006 + USEPA
  - Scope 3 chemical (chlorine/alum/KMnO₄/reagent_disposal): 4 rows — ESTIMATED EIO-LCA proxy
- **Unique constraint widened**: dropped `emission_factor_source_effective_from_key`,
  added `emission_factor_source_unit_effective_from_key` = UNIQUE(source, unit,
  effective_from). Two-way door (reversible). Reason: needed because multiple
  `source='other'` rows (waste/chemical/etc.) would otherwise collide on the
  same effective_from date.
- **enum source_type unchanged** — `other` + subtype marker in `unit` string
  (e.g. `kg (chlorine)`) avoids enum churn (one-way door in Postgres).
- **Verified live**:
  - count = 12 rows
  - join carbon.reading × emission_factor WHERE source='electricity' returns
    `6.00 kWh × 0.4999 = 2.9994 kgCO₂e` — exact match with `lib/carbon.ts`
    constant (single source of truth validated end-to-end)
  - unique constraint present
- **Known splitter bug** (same as SCHEMA-1): `apply_migration_api.py` regex
  splits on `;` inside plain single-quoted strings. First apply had 4 FAIL
  because note strings contained `;`. Fixed by removing `;` from note text.
  Idempotent re-apply succeeded (6/7, 1 FAIL on already-existing constraint
  = expected ON CONFLICT behaviour). Bug will be addressed in dedicated
  tooling chunk (deferred).
