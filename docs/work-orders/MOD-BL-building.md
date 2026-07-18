# WO-MOD-BL-a: Building Inspection module — data + page skeleton
Status: done (2026-07-17, zcode) — commit `28cef54`
Lane/files: `frontend/src/lib/building.ts` (new), `frontend/src/pages/BuildingPage.tsx` (new), 1 route in App.tsx, column extensions on `building.inspection_round`
Branch: main
Depends on: SCHEMA-1
Mockup: ไม่มี — Track F ใช้ layout pattern ทั่วไป

## Goal + Acceptance
- `building.inspection_round` schema extension: round_type (monthly/quarterly/annual), checklist (jsonb), photos (text[]), severity (low/medium/high), assigned_to
- `lib/building.ts`: CRUD fns + `useBuildingRounds()` hook
- `pages/BuildingPage.tsx` skeleton — list รอบตรวจ + form สร้างใหม่ + ปุ่ม "แจ้งซ่อม" ถ้า repair_needed=true → seed `core.repair_request`
- Route `/building` in App.tsx
- Build ผ่าน

## Verify
- กรอก 1 row → select → delete สะอาด
- repair_needed=true → repair_request ถูก seed
- Build ผ่าน

## Checkpoint log
