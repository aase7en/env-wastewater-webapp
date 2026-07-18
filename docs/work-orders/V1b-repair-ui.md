# WO-V1b: Repair-request UI — แจ้งเหตุผิดปกติ → ใบแจ้งซ่อม
Status: open (บล็อกโดย V1a)
Lane/files: `frontend/src/components/repair/*` (ใหม่), `frontend/src/pages/DashboardPage.tsx` (เพิ่มปุ่ม/modal), reuse `lib/pdf.ts`
Branch: track-f (ถ้า fable5 ทำ) / main (ถ้า zcode ทำ)

## Goal + Acceptance
- ปุ่ม "แจ้งเหตุผิดปกติ" บน dashboard — โผล่เมื่อ `system_operating=false` หรือมี alert ใด ๆ (ห้ามโผล่ตอนปกติ)
- Modal (AuraCard style): เลือกอุปกรณ์จาก `core.equipment` (optional) + กรอกสาเหตุ (บังคับ) → `createRepairRequest` จาก V1a → toast สำเร็จ
- หลังบันทึก: เสนอปุ่ม "พิมพ์ใบแจ้งซ่อม" → ใช้ template ใบแจ้งซ่อมเดิมจาก P16 (`lib/pdf.ts`)
- ทั้ง dark/light + mobile 375px + touch target ≥44px; ปิด SPEC ข้อ 6 ครบ loop

## Verify
จำลอง row ผิดปกติ → ปุ่มโผล่ → กรอก → แถวใหม่ใน `core.repair_request` → PDF ออก; สลับ theme ระหว่าง modal เปิด ไม่มีสีค้าง

## Checkpoint log
