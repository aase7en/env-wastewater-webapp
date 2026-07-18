# WO-MOD-WA-a: Waste/Garbage module — data + page skeleton
Status: open
Lane/files: `frontend/src/lib/garbage.ts` (new), `frontend/src/pages/GarbagePage.tsx` (new), 1 route in App.tsx, column extensions on `garbage.collection_log`, **+ MIG-WA** legacy CSV migration
Branch: main
Depends on: SCHEMA-1
Mockup: `design/integrated_waste_management/` (screen.png + code.html) — Track F ใช้ใน -b

## Goal + Acceptance
- `garbage.collection_log` schema extension: เพิ่ม columns (segregation_type enum, contractor, vehicle_plate, manifest_no, destination)
- **MIG-WA**: phase1 CSV analysis ของ AppSheet waste export → phase2 SQL staging → validate → promote. **BLOCKED รอ user export AppSheet CSV**
- `lib/garbage.ts`: CRUD fns + `useGarbageCollection()` hook
- `pages/GarbagePage.tsx` skeleton
- Route `/garbage` in App.tsx
- Build ผ่าน

## Verify
- กรอก 1 row → select → delete สะอาด
- Build ผ่าน

## Checkpoint log

### blocked
MIG-WA รอ user export AppSheet CSV ของ waste module
