# WO-F5: PFD interactive drill-down
Status: open
Lane/files: `frontend/src/components/pfd/*` เท่านั้น
Branch: track-f / main ตามผู้ทำ

## Goal + Acceptance
- คลิก/แตะ stage node → panel ใต้ diagram แสดงค่าของ stage นั้น (ข้อมูลมีใน `DashboardRow` แล้ว: DO 3 จุด, TDS, chlorine ฯลฯ — mapping stage→fields ชัดเจน) + คำอธิบายสั้นของขั้นตอน
- Node active = ring + FILL ตาม suite water screen; keyboard focusable (tabindex + Enter)
- Bubbles ใน AerationTank ผูก `system_operating` จริง (มีแล้ว — ตรวจว่า off = หยุดจริง) — semantic flow colors ห้ามเปลี่ยน
- ไม่มี dependency ใหม่; build + reduced-motion ผ่าน

## Verify
คลิกครบ 5 stage เห็นค่าถูก; แตะบนมือถือ; ปิด aerator (mock row) → bubbles หยุด

## Checkpoint log
