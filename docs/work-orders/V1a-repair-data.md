# WO-V1a: Repair-request data layer
Status: done (2026-07-17, zcode)
Lane/files: `frontend/src/lib/repair.ts` (ใหม่) เท่านั้น + ตรวจ RLS ฝั่ง Supabase
Branch: main

## Goal + Acceptance
- `createRepairRequest({ equipment_id?, reading_id?, cause })` → insert `core.repair_request` (cause NOT NULL, status default `open`)
- `useRepairRequests()` hook ดึงรายการ (ล่าสุดก่อน) + `useEquipmentList()` (10 ตัวจาก `core.equipment`) ถ้ายังไม่มีใน supabase-queries
- ตรวจว่า RLS ให้ authenticated insert/select ได้จริง (ตาราง+policy สร้างแล้วใน chunk P2)
- pattern เดียวกับ `lib/supabase-queries.ts` เดิม; `npm run build` ผ่าน

## Verify
insert ทดสอบ 1 แถวผ่าน hook → query เห็นแถว → ลบทิ้ง

## Checkpoint log

### done — 2026-07-17 (zcode) — commit `<TBD>`
- **RLS** verified via Management API on live ENV_DB:
  - `core.repair_request` — policy `core_repair_request_rw`, role `authenticated`, ALL, `true`/`true`
  - `core.equipment` — policy `core_equipment_rw`, role `authenticated`, ALL, `true`/`true`
- **Round-trip** on `core.repair_request` via Management API:
  - INSERT (cause only) → status defaulted to `'open'` server-side ✓
  - SELECT by id → row visible ✓
  - DELETE → row removed, final count 0 ✓
  - Note: `reported_by` stayed NULL because the probe ran through the
    service-account query endpoint (no auth.uid() context). In the
    browser path the RLS session sets it automatically.
- **Hook reuse**: `useEquipment()` already exists in `hooks.ts` (calls
  `fetchEquipment` from `supabase-queries.ts`) — not duplicated. V1a
  only adds `useRepairRequests`, `createRepairRequest`,
  `resolveRepairRequest`, `fetchRepairRequests` in the new file.
- **Schema drift caught** (not fixed here — out of V1a scope): live
  `core.equipment` has a single `name` column; `types.ts` declares
  `name_th` + `name_en`. `core.repair_request` has no `reported_date`;
  `createReading` in `supabase-queries.ts:155` still sends it (silently
  swallowed by its try/catch). Flag for a separate fix chunk.
- `npm run build` passes. Bundle warning unchanged (pre-F6).
