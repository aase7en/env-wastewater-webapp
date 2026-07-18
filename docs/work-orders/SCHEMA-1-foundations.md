# WO-SCHEMA-1: v2 multi-domain foundations
Status: done (2026-07-17, zcode) — commit `<TBD>`
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

### done — 2026-07-17 (zcode) — commit `<TBD>`
- **Migration applied live** via Management API (`20260719000000_v2_schemas.sql`):
  - 56/58 statements OK; 2 FAIL (food.lab_test comment split on `;`
    inside comment text — known splitter bug). All actual DDL + RLS +
    policies + seed succeeded. Comment re-applied manually post-hoc
    (verified via `obj_description('food.lab_test'::regclass)`).
- **Verified live**:
  - 8 new tables across 8 schemas, RLS enabled on every one
    (building/chemical/food/fuel/garbage/garden/safety/water_supply)
  - 8 policies (1 per table, authenticated FOR ALL)
  - `core.location_category` count = 16 (8 original + 8 new env zones)
- **WO skeletons created** (10 files):
  - SCHEMA-2 emission-factors, SCHEMA-3 rollup-view, SCHEMA-4 audit-trigger
  - MOD-WS water-supply, MOD-WA waste (+MIG-WA blocked), MOD-FU fuel
    (+MIG-FU blocked), MOD-GA garden, MOD-BL building, MOD-FS fire-safety,
    MOD-FO food, MOD-CH chemical
- **A-Wiki cross-repo sync** (PR #8, merged):
  - `wiki/synthesis/env-webapp-schema-v2-multi-domain.md` (new, supersedes Pi5 doc)
  - 8 module entity pages in `wiki/entities/env/`
  - branch `sync-env-schema-v2` squash-merged + deleted; pre-existing
    agent work safely stashed + restored
- **Frontend untouched** (Track Z scope respected). `npm run build` not
  re-run (no FE changes since last green build).
- **Known splitter bug** in `apply_migration_api.py`: regex split on `;`
  inside dollar-quoted bodies is fine, but plain single-quoted strings
  containing `;` still trip it. Logged; will fix in P22 dead-code sweep
  or a dedicated tooling chunk — out of SCHEMA-1 scope.
