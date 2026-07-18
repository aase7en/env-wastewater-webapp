# WO-MOD-WS-a: Water Supply (groundwater) module — data + page skeleton
Status: open
Lane/files: `frontend/src/lib/water-supply.ts` (new), `frontend/src/pages/WaterSupplyPage.tsx` (new), 1 route in `frontend/src/App.tsx`, optional `supabase/migrations/..._mod_ws.sql` (column extensions on `water_supply.daily_check`)
Branch: main
Depends on: SCHEMA-1

## Goal + Acceptance
- `water_supply.daily_check` schema extension: pH, free_chlorine_residual (mg/L), turbidity (NTU), total_coliform (MPN/100ml or text), fecal_coliform, iron, manganese, hardness, TDS
- `lib/water-supply.ts`:
  - `fetchWaterSupplyDaily(limit=30)`, `createWaterSupplyDaily(input)`, `updateWaterSupplyDaily(id, input)`, `deleteWaterSupplyDaily(id)`
  - `useWaterSupplyDaily()` hook
- `pages/WaterSupplyPage.tsx` skeleton — minimal form + list, **className/markup minimal** (Track F ตาม design เป็น -b chunk — ยังไม่มี mockup นี้, ใช้ layout ของ DailyFormPage เป็นแนว)
- Route `/water-supply` in App.tsx (เฉพาะ WO นี้เท่านั้น)
- `npm run build` ผ่าน
- ไม่มี PDF/UI polish (deferred to -b / PDF chunks)

## Verify
- กรอกข้อมูล 1 row → select เห็น → delete สะอาด
- Build ผ่าน

## Checkpoint log
