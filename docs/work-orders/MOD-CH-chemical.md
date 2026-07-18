# WO-MOD-CH-a: Chemical sub-store module — data + page skeleton
Status: done (2026-07-17, zcode) — commit `28cef54`
Lane/files: `frontend/src/lib/chemical.ts` (new), `frontend/src/pages/ChemicalPage.tsx` (new), 1 route in App.tsx, column extensions on `chemical.movement`, optional `chemical.master` reference table
Branch: main
Depends on: SCHEMA-1
Mockup: ไม่มี — Track F ใช้ layout pattern ทั่วไป

## Goal + Acceptance
- Optional new table `chemical.master` (id, name, cas_no, hazard_class, unit, reorder_point, current_balance) — เก็บ catalog + auto-computed balance
- `chemical.movement` schema extension: lot_no, expiry_date, supplier, unit_cost, master_id FK
- **Balance trigger**: AFTER INSERT บน movement → update chemical.master.current_balance (increment/decrement based on direction)
- `lib/chemical.ts`: CRUD fns + `useChemicalMovements()` hook + `useChemicalStock()` (current balances with reorder alert)
- `pages/ChemicalPage.tsx` skeleton — stock overview + movement log + form (in/out)
- Route `/chemical` in App.tsx
- Build ผ่าน
- Scope 1/3 carbon feed — ใช้ใน CRB-2

## Verify
- INSERT movement direction='in' qty=10 → master.current_balance +10
- INSERT movement direction='out' qty=3 → master.current_balance -3
- `useChemicalStock` คืน row with current_balance < reorder_point → flag
- Build ผ่าน

## Checkpoint log
