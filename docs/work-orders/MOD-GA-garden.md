# WO-MOD-GA-a: Garden/Landscaping module — data + page skeleton
Status: open
Lane/files: `frontend/src/lib/garden.ts` (new), `frontend/src/pages/GardenPage.tsx` (new), 1 route in App.tsx, column extensions on `garden.work_round`
Branch: main
Depends on SCHEMA-1
Mockup: ไม่มี — Track F ใช้ layout pattern ทั่วไป

## Goal + Acceptance
- `garden.work_round` schema extension: duration_hours, equipment_used (text[] or comma-separated), waste_collected_kg, photo_path
- `lib/garden.ts`: CRUD fns + `useGardenRounds()` hook
- `pages/GardenPage.tsx` skeleton
- Route `/garden` in App.tsx
- Build ผ่าน
- Scope 1 carbon feed (fuel_used_l) — ใช้ใน CRB-1

## Verify
- กรอก 1 row → select → delete สะอาด
- Build ผ่าน

## Checkpoint log
