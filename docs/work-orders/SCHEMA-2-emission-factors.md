# WO-SCHEMA-2: carbon.emission_factor master rows (Scope 1+2+3)
Status: open
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
