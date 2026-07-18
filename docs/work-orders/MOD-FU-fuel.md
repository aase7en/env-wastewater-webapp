# WO-MOD-FU-a: Fuel module — data + page skeleton
Status: done (2026-07-17, zcode) — commit `28cef54`
Lane/files: `frontend/src/lib/fuel.ts` (new), `frontend/src/pages/FuelPage.tsx` (new), 1 route in App.tsx, column extensions on `fuel.dispense_log`, **+ MIG-FU** legacy CSV migration
Branch: main
Depends on: SCHEMA-1
Mockup: `design/fuel_fleet_management_light_mode/` + `design/fuel_fleet_refined_aura_dark/` — Track F ใช้ใน -b

## Goal + Acceptance
- `fuel.dispense_log` schema extension: vehicle_id (text), odometer, purpose, cost_baht, supplier
- **MIG-FU**: phase1 CSV analysis ของ AppSheet fuel export → phase2 SQL → promote. **BLOCKED รอ user export**
- `lib/fuel.ts`: CRUD fns + `useFuelDispense()` hook + helper `computeDelta(meter_before, meter_after)` ตรวจแล้วเตือนถ้า delta ≠ litres
- `pages/FuelPage.tsx` skeleton
- Route `/fuel` in App.tsx
- Build ผ่าน
- Scope 1 carbon feed — ใช้ใน CRB-1

## Verify
- กรอก 1 row → select → delete สะอาด
- delta mismatch alert แสดง
- Build ผ่าน

## Checkpoint log

### blocked
MIG-FU รอ user export AppSheet CSV ของ fuel module
