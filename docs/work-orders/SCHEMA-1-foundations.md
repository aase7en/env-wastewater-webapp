# WO-SCHEMA-1: v2 multi-domain foundations
Status: claimed(zcode) (2026-07-17)
Lane/files: `supabase/migrations/20260719000000_v2_schemas.sql` (new) + WO skeleton files for Wave 2/3 + A-Wiki schema-doc cross-repo sync
Branch: main (env-wastewater-webapp) / sync-env-schema-v2 (A-Wiki)

## Goal + Acceptance
- สร้าง 8 schemas ใหม่บน ENV_DB (Supabase):
  `water_supply`, `garbage`, `fuel`, `garden`, `building`, `safety`, `food`, `chemical`
- แต่ละ schema มี master table skeleton อย่างน้อย 1 transactional table (id uuid PK, reading_date/check_date, recorded_by uuid, created_at) — column details เฉพาะที่จำเป็นวางลง DDL; ขยายทีหลังใน MOD-* chunks
- RLS ENABLE + policy `<schema>_<table>_rw` (authenticated, ALL) ทุกตารางใหม่
- Seed `core.location_category` เพิ่ม 8 rows ใหม่ (water_supply_zone, waste_storage, fuel_station, garden_zone, building_floor, safety_zone, food_lab, chemical_storage) — ใช้ ON CONFLICT DO NOTHING idempotent
- Verify: query `pg_class.relrowsecurity` ทุก table ใหม่ = true; query `pg_policies` = 1 row/table; `core.location_category` count เพิ่ม 8
- สร้าง WO skeleton files (Goal/Acceptance/Checkpoint-log) สำหรับ: SCHEMA-2, SCHEMA-3, SCHEMA-4, MOD-WS-a, MOD-WA-a, MOD-FU-a, MOD-GA-a, MOD-BL-a, MOD-FS-a, MOD-FO-a, MOD-CH-a (รวม MIG-WA, MIG-FU)
- A-Wiki sync: branch `sync-env-schema-v2` → `wiki/synthesis/env-webapp-schema-v2-multi-domain.md` (เขียนใหม่ — schema doc ฉบับ multi-domain) + `wiki/entities/env/<8 modules>.md` skeleton pages

## Verify
- SQL applied via Management API (6/6 OK ตามจำนวน statement)
- `SELECT relname, relrowsecurity FROM pg_class ...` → true ทุก table
- `SELECT count(*) FROM core.location_category` → เพิ่ม 8 จากเดิม
- `npm run build` ผ่าน (frontend ยังไม่ใช้ table ใหม่ → ไม่กระทบ)
- WO skeletons ทุกไฟล์มี status `open`
- A-Wiki PR เปิดและ merge หรือ commit บน branch

## Checkpoint log
