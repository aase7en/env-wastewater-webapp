# WO-V3a: Threshold alerts data layer
Status: open
Lane/files: `frontend/src/lib/alerts.ts` (ใหม่) เท่านั้น
Branch: main

## Goal + Acceptance
- `useThresholdAlerts()` — อ่าน staging table ของ P17 (`fn_persist_threshold_alerts` เขียนลงตารางไหน — ผู้ทำ P17 คือ zcode รู้ schema; ถ้าไม่ใช่ zcode ให้ดู migration P17 ใน git log/SQL ก่อน) เรียงใหม่→เก่า จำกัด 20
- `markAlertRead(id)` + นับ unread
- Poll เบา ๆ (refetch ทุก 60s หรือ on-focus) — **ไม่ใช่ realtime subscription** (ยังไม่จำเป็น, free-tier discipline)
- build ผ่าน; ไม่มี UI ใน WO นี้

## Verify
insert แถวทดสอบใน staging table → hook คืนแถว + unread ถูก → mark read → unread ลด

## Checkpoint log
