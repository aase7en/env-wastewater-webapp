# WO-V4a: Unified overview data layer
Status: done (2026-07-18, fable5) — commit `1d2e6a8`
Lane/files: `frontend/src/lib/overview.ts` (ใหม่) เท่านั้น
Branch: main

## Goal + Acceptance
- `useOverview()` รวม KPI 3 ระบบจาก hook/queries ที่มีอยู่ (ห้าม duplicate query logic — reuse `supabase-queries.ts` + `carbon.ts`):
  - น้ำ: สถานะระบบวันนี้ + DO เฉลี่ย + วันที่บันทึกล่าสุด
  - ไฟฟ้า: kWh เดือนนี้ (2 มิเตอร์, delta-aware ตาม V2a)
  - carbon: tCO2e เดือนนี้ + เทียบเดือนก่อน
- คืน loading/error รวมแบบ per-section (ระบบใดพังไม่ล้มทั้งหน้า)

## Verify
ตัวเลขตรงกับหน้า detail แต่ละระบบ

## Checkpoint log
- [2026-07-18] fable5: **done** — `lib/overview.ts`: `useOverview()` compose
  hooks เดิมล้วน (useDashboard + useCarbonMonthly — ไม่ duplicate query)
  คืน water/energy/carbon แยก loading/error ต่อ section ตาม acceptance;
  energy เดือนล่าสุด = CarbonMonth ตัวท้าย (แหล่งเดียวกับ carbon)
