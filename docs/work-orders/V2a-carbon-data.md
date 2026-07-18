# WO-V2a: Carbon data layer
Status: done (2026-07-17, zcode)
Lane/files: `frontend/src/lib/carbon.ts` (ใหม่) เท่านั้น (+ SQL view เฉพาะถ้าจำเป็นจริง)
Branch: main

## Goal + Acceptance
- config `EMISSION_FACTOR_KGCO2E_PER_KWH` ค่าเดียวแก้ได้ (ค่าไทย ~0.4999 — ใส่ comment แหล่งอ้างอิง + ปีของ factor, mark เป็นค่าที่ user ควร verify)
- `useCarbonMonthly(months)` — aggregate จาก `carbon.reading` (907 แถว migrate แล้ว): kWh รวม/เดือน ต่อมิเตอร์ + tCO2e = kWh × factor / 1000
- คืน: รายเดือน {month, kwh_meter1, kwh_meter2, tco2e}, รวมปี, เทียบเดือนก่อน (%)
- ระวัง: ค่า kWh อาจเป็น cumulative meter reading → ต้องใช้ delta ไม่ใช่ sum ตรง ๆ — ตรวจกับข้อมูลจริงก่อน (ดู reports/phase1-analysis.md เรื่อง electricity meter deltas)
- build ผ่าน; ไม่มี UI ใน WO นี้

## Verify
log ตัวเลข 3 เดือนล่าสุดเทียบคำนวณมือจาก DB จริง

## Checkpoint log

### done — 2026-07-17 (zcode) — commit `765e24e`
- **Schema verified live** via Management API:
  - `carbon.reading`: `meter_value` (cumulative) + `consumption` (daily
    usage kWh) — confirmed 907 rows, 2024-01-09 → 2026-07-04
  - `carbon.meter`: **only 1 meter** exists ("ระบบบ่อบำบัดน้ำเสีย"),
    not 2 as the WO draft assumed. Hook returns `meters[]` array so
    future multi-meter additions (pump1/pump2 sub-meters) won't require
    a refactor.
  - RLS verified: both `carbon.reading` + `carbon.meter` have
    `authenticated`, ALL commands policies.
- **Aggregation strategy decision (per phase1-analysis.md §4 warning)**:
  Use `SUM(consumption)` — NOT meter delta. phase1 found 71/907
  mismatches between day-over-day `meter_value` delta and the
  `consumption` column; operators entered actual usage in AppSheet, so
  `consumption` is the authoritative value.
- **Emission factor** = `0.4999` kgCO₂e/kWh with inline comment citing
  TGO (Thailand Greenhouse Gas Management Organization) 2023 grid EF,
  with an explicit ⚠️ note that the user should verify the latest TGO
  publication for their reporting year. Single constant — changing it
  flows to all downstream math.
- **Delivered** in `frontend/src/lib/carbon.ts`:
  - `fetchCarbonMonthly(months=12)` — client-side aggregation over
    PostgREST (no SQL view needed: fetches daily rows for the window,
    buckets by YYYY-MM × meter_id in JS). ~365 rows max per year —
    cheap, and lets the UI re-render instantly if the EF constant
    changes without a DB round-trip.
  - `useCarbonMonthly(months)` hook — { data, loading, error }
  - Returns `CarbonSummary { months[], kwh_total_period, tco2e_total_period }`
    Each `CarbonMonth` has `{ month, days, meters[], kwh_total, tco2e,
    mom_change_pct }`. `mom_change_pct` = null for the oldest month.
- **Manual verify vs DB** (EF = 0.4999):
  - 2026-05: 137 kWh × 0.4999/1000 = 0.0685 tCO₂e ✓
  - 2026-06: 140 kWh × 0.4999/1000 = 0.0700 tCO₂e ✓
  - MoM 06 vs 05: (0.0700-0.0685)/0.0685 × 100 = **+2.19%** ✓
  - 2-month totals: 277 kWh / 0.1385 tCO₂e ✓
  - Sample daily check: Jul 4 latest meter=9205, daily ~4-6 kWh ✓
- `npm run build` passes. Bundle unchanged.
- **No UI** in this WO — V2b owns the page.
