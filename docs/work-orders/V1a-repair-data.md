# WO-V1a: Repair-request data layer
Status: open
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
