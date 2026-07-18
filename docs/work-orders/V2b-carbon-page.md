# WO-V2b: Carbon Footprint page
Status: open (บล็อกโดย V2a)
Lane/files: `frontend/src/pages/CarbonPage.tsx` (ใหม่), route ใน `App.tsx` (เฉพาะ WO นี้), nav ใน `AppShell.tsx` (เพิ่ม 1 รายการ icon `co2`)
Branch: track-f / main ตามผู้ทำ

## Goal + Acceptance
- ตาม `design/carbon_footprint_sustainability/screen.png` (dark) + `carbon_footprint_light_mode/screen.png` (light): KPI 3 ใบ (Total GHG เดือนนี้ / เทียบเดือนก่อน / รวมปี) + bar chart รายเดือน (Recharts — ใช้ pattern token จาก TrendsPage: `cssVarRGB` + `useAuraTheme`)
- **ห้าม** "LIVE MONITORING" badge (no-fake-telemetry) → ใช้ "ข้อมูลถึง <เดือนล่าสุด>"; การ์ด Tree Planting/Composting ของ mockup = ยังไม่มีข้อมูลจริง → ไม่ใส่ (อย่าสร้าง UI ที่ไม่มี data)
- dark/light + mobile + reduced-motion ครบ

## Verify
เทียบ screenshot ทั้ง 2 theme; ตัวเลขตรงกับ V2a verify log

## Checkpoint log
