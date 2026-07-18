# WO-V4b: Unified Command home page
Status: done (2026-07-18, fable5)
Lane/files: `frontend/src/pages/OverviewPage.tsx` (ใหม่), route `/` ใน `App.tsx` (เฉพาะ WO นี้), nav ใน `AppShell.tsx` (แดชบอร์ด → ชี้ `/`, หน้าน้ำเดิมยังอยู่ `/dashboard`)
Branch: track-f / main ตามผู้ทำ

## Goal + Acceptance
- ตาม `design/unified_central_command_dashboard/screen.png`: การ์ดใหญ่ 3 ใบ Water / Energy / Carbon + status chip (ปกติ=เขียว nuance ตาม suite) + ตัวเลขหลักจาก V4a + คลิกการ์ด → drill-down (`/dashboard`, `/carbon`; Energy ยังไม่มีหน้า → การ์ดแสดงตัวเลขแต่ไม่มีลิงก์ หรือลิงก์ไป Trends)
- `/` เลิก redirect ไป /dashboard → render OverviewPage (public เหมือน dashboard)
- **ห้าม** Emergency Shutdown / Systems Topology ปลอม (no-fake-actuation; topology เป็นรูป mockup — ไม่ใส่)
- dark/light + mobile + reduced-motion

## Verify
เปิด `/` เห็น Overview; ตัวเลข 3 ระบบตรงหน้า detail; nav กลับไปกลับมาถูก; E2E เดิมที่คาด redirect `/`→dashboard ต้องแก้ใน WO นี้ให้เขียว

## Checkpoint log
- [2026-07-18] fable5: **done** — `pages/OverviewPage.tsx`: การ์ด 3 ระบบ
  (Water status chip ปกติ/ผิดปกติ/ยังไม่บันทึก + DO ล่าสุด; Energy kWh
  เดือนล่าสุด + วันบันทึก; Carbon tCO₂e + MoM chip) คลิก drill-down,
  aura animated เฉพาะ water ผิดปกติจริง, QuickLink 4 ปุ่มไปหน้าที่มีจริง;
  `/` render OverviewPage แทน redirect (ลบ Navigate ที่ไม่ใช้แล้ว);
  nav: ภาพรวม `/` (dashboard icon) + บ่อบำบัด `/dashboard` (water_drop) +
  คาร์บอน; ไม่มี Emergency Shutdown/topology mockup ตามกติกา.
  smoke.spec แก้ 2 จุด: root ตรวจ h1 ภาพรวมระบบ แทน redirect, nav list 8
  รายการใหม่. build + Playwright 8/8 เขียว (รันก่อน commit)
