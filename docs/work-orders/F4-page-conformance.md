# WO-F4.1–F4.5: Per-page suite conformance (หน้าละ sub-WO — claim แยกได้)
Status: F4.1 claimed(fable5) · F4.2–F4.5 open
Lane/files: `frontend/src/pages/<หน้านั้น>.tsx` — **className/markup เท่านั้น** (logic/hook ห้ามแตะ)
Branch: track-f (fable5) / main (zcode)

## Sub-WOs
- **F4.1 DailyFormPage** — mobile-first, Luminous Mint light เด่น (staff กรอกกลางแจ้ง), Accordion 6 section ใช้ AuraCard static, chips สี/กลิ่นตามข้อมูลจริง, touch ≥44px
- **F4.2 ReadingsListPage** — ตาราง + status pills ตาม `fuel_fleet_refined_aura_dark` table pattern
- **F4.3 EquipmentPage** — list + maintenance ตาม `integrated_waste_management` card/stepper patterns
- **F4.4 ReportsPage** — template cards ตาม `staff_manuals_resources` card pattern (Pinned/updated meta)
- **F4.5 AuthPage** — glass card กลางจอ + brand + gradient CTA; Google logo สีทางการคงเดิม

## Acceptance (ทุก sub)
เทียบ screenshot ใกล้เคียงใน `design/`; dark/light สมบูรณ์ (ไม่มี hardcoded dark hex); mobile 375px ไม่มี h-scroll; reduced-motion; build ผ่าน; E2E เดิมเขียว (แก้ selector ที่พังจาก markup ใน commit เดียวกัน)

## Verify
เปิดหน้าใน preview ทั้ง 2 theme + 375px; รายงาน DOM/computed-style ยืนยัน token

## Checkpoint log
