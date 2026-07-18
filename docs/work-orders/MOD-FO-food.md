# WO-MOD-FO-a: Food Sanitation (coliform) module — data + page skeleton
Status: done (2026-07-17, zcode) — commit `28cef54`
Lane/files: `frontend/src/lib/food.ts` (new), `frontend/src/pages/FoodPage.tsx` (new), 1 route in App.tsx, column extensions on `food.lab_test`, **+ reagent stock decrement sub-system**
Branch: main
Depends on: SCHEMA-1
Mockup: ไม่มี — Track F ใช้ layout pattern ทั่วไป
**⚠️ PHI check**: coliform test ของ รพ.อุทัย = ตรวจน้ำ/อาหาร/สิ่งแวดล้อม — **ไม่ใช่ patient sample** (verified with user during planning). ถ้ามี patient-adjacent sample ในอนาคต → ห้าม route ผ่าน AI (a-think rule)

## Goal + Acceptance
- `food.lab_test` schema extension: sample_point, mpn_value, reagent_used (jsonb: {name, qty, unit}), reported_by_lab_tech, follow_up_action
- **Reagent stock decrement**: trigger AFTER INSERT บน food.lab_test → อัปเดต `chemical.movement` (direction='out', chemical_name = reagent)
- `lib/food.ts`: CRUD fns + `useFoodLabTests()` hook + `useReagentUsage(month)` report helper
- `pages/FoodPage.tsx` skeleton — list test + form + แสดง sample_date → reported_date (incubation period) + รายงานผล
- Route `/food` in App.tsx
- Build ผ่าน

## Verify
- กรอก 1 lab_test พร้อม reagent_used → chemical.movement มี row ใหม่ (auto-decrement)
- กรอก lab_test ไม่มี reagent → chemical.movement ไม่ถูกแตะ
- Build ผ่าน

## Checkpoint log
