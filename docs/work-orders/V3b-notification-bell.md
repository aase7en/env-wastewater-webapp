# WO-V3b: Notification bell ใน top bar
Status: open (บล็อกโดย V3a)
Lane/files: `frontend/src/components/ui/NotificationBell.tsx` (ใหม่), `frontend/src/components/layout/AppShell.tsx` (top bar + mobile header)
Branch: track-f / main ตามผู้ทำ

## Goal + Acceptance
- กระดิ่ง Material Symbol `notifications` + badge เลข unread (ซ่อนเมื่อ 0) ใน desktop top bar + mobile header
- Dropdown (AuraCard, blur ตาม suite): รายการเตือนค่าเกิน threshold — parameter, ค่า, วันที่ (thaiDate), คลิก = mark read + ลิงก์ไป reading นั้น (`/form/:id`)
- ว่าง = EmptyState "ไม่มีการแจ้งเตือน"; ใช้ข้อมูลจริงจาก V3a เท่านั้น — ห้าม pulse dot ถ้าไม่มี unread จริง
- dark/light + mobile + คีย์บอร์ด/aria (aria-expanded, focus trap เบา ๆ)

## Verify
insert แถวทดสอบ → badge ขึ้น → เปิด dropdown เห็นรายการ → คลิก → read → badge ลด; ทั้ง 2 theme

## Checkpoint log
