# WO-V2a: Carbon data layer
Status: open
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
