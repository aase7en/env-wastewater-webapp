# WO-MOD-FS-a: Fire Safety module — data + page skeleton
Status: done (2026-07-17, zcode) — commit `28cef54`
Lane/files: `frontend/src/lib/safety.ts` (new), `frontend/src/pages/SafetyPage.tsx` (new), 1 route in App.tsx, column extensions on `safety.monthly_check`
Branch: main
Depends on SCHEMA-1
Mockup: ไม่มี — Track F ใช้ layout pattern ทั่วไป

## Goal + Acceptance
- `safety.monthly_check` schema extension: extinguisher_count, extinguisher_expired_count, exit_light_count, exit_light_broken_count, fire_alarm_tested, sprinkler_tested, apd_aed_checked, next_check_due (date)
- `lib/safety.ts`: CRUD fns + `useSafetyMonthly()` hook + `useUpcomingSafetyChecks(days=30)` (ดึงรอบตรวจที่ใกล้ due)
- `pages/SafetyPage.tsx` skeleton — list + form + alert รอบตรวอเลยกำหนด
- Route `/safety` in App.tsx
- Build ผ่าน
- Legal requirement: ประพจำ (monthly) → ผูกกับ DOC-1 regulatory seed

## Verify
- กรอก 1 row → select → delete สะอาด
- `useUpcomingSafetyChecks` คืนรอบที่ next_check_due ≤ now+30d
- Build ผ่าน

## Checkpoint log
