# WO-V1b: Repair-request UI — แจ้งเหตุผิดปกติ → ใบแจ้งซ่อม
Status: done (2026-07-18, fable5) — commit `cbc4283`
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
- [2026-07-18] fable5: **done** — `components/repair/RepairRequestModal.tsx`
  ใหม่ (เลือกอุปกรณ์ optional จาก useEquipment, cause บังคับ, save ผ่าน
  createRepairRequest ของ V1a, สำเร็จแล้วเสนอปุ่มพิมพ์ PDF ใบแจ้งซ่อม
  ผ่าน generateRepairRequest/downloadPDF ของ P16, reporter จาก useAuth);
  ปุ่ม "แจ้งเหตุผิดปกติ" บน dashboard โผล่เฉพาะ attention จริง
  (system_operating=false หรือ alert ใด ๆ) + login แล้ว. reading_id ส่ง null
  เพราะ v_dashboard_14day/DashboardRow ไม่มี id — ถ้าอยากผูก reading ให้
  เพิ่ม id เข้า view ใน chunk แยก (Z-lane). build + Playwright 8/8 เขียว.
  ⚠ process miss: เริ่มงานโดยไม่ claim ก่อน (ผิด rule 1) — โชคดีไม่ชนเพราะ
  scope เป็นไฟล์ใหม่+F-lane; อย่าเลียนแบบ
