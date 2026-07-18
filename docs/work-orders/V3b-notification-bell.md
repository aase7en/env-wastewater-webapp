# WO-V3b: Notification bell ใน top bar
Status: done (2026-07-18, fable5) — commit `f707822`
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
- [2026-07-18] fable5: **done** — `NotificationBell.tsx` ใหม่ (badge unread
  ซ่อนเมื่อ 0, FILL icon เมื่อมี unread จริงเท่านั้น, dropdown aura-card
  static: รายการ message/วันที่, คลิก = markRead + ไป `/form/:id`,
  Escape/คลิกนอกปิด, aria-expanded) + ผูก AppShell desktop top bar +
  mobile header; ซ่อนทั้งก้อนเมื่อไม่ login (RLS gate อยู่แล้ว).
  ใช้ API ของ V3a ตรง ๆ (alerts/unread/markRead — optimistic update ฝั่ง
  lib). build + Playwright 8/8 เขียว. Visual dropdown เต็มรูปแบบต้องดู
  หลัง login (bell ไม่ render ตอน unauthenticated)
