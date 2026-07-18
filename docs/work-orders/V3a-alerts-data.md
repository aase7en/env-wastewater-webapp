# WO-V3a: Threshold alerts data layer
Status: done (2026-07-17, zcode) — commit `02f8e3a`
Lane/files: `frontend/src/lib/alerts.ts` (ใหม่) เท่านั้น + `supabase/migrations/20260718000003_v3a_alert_readrls.sql`
Branch: main

## Goal + Acceptance
- `useThresholdAlerts()` — อ่าน staging table ของ P17 (`fn_persist_threshold_alerts` เขียนลงตารางไหน — ผู้ทำ P17 คือ zcode รู้ schema; ถ้าไม่ใช่ zcode ให้ดู migration P17 ใน git log/SQL ก่อน) เรียงใหม่→เก่า จำกัด 20
- `markAlertRead(id)` + นับ unread
- Poll เบา ๆ (refetch ทุก 60s หรือ on-focus) — **ไม่ใช่ realtime subscription** (ยังไม่จำเป็น, free-tier discipline)
- build ผ่าน; ไม่มี UI ใน WO นี้

## Verify
insert แถวทดสอบใน staging table → hook คืนแถว + unread ถูก → mark read → unread ลด

## Checkpoint log

### done — 2026-07-17 (zcode) — commit `02f8e3a`
- **Schema gap found + fixed**: P17 `wastewater.threshold_alert` had
  only `notified_at` (webhook-push status) and no concept of "user has
  seen it in the UI". Also RLS was disabled with no policies →
  PostgREST reads/writes would have failed entirely from the browser.
- **Migration `20260718000003_v3a_alert_readrls.sql`** (applied live via
  Management API, 6/6 statements OK):
  - `ALTER TABLE … ADD COLUMN read_at timestamptz`
  - `idx_threshold_alert_unread` partial index WHERE read_at IS NULL
  - `ENABLE ROW LEVEL SECURITY` + policy
    `threshold_alert_authenticated_rw` FOR ALL TO authenticated
- **Hooks delivered** in `frontend/src/lib/alerts.ts`:
  - `fetchThresholdAlerts(limit=20)` — newest first
  - `countUnreadAlerts()` — `count: 'exact', head: true`, WHERE
    `read_at IS NULL`
  - `markAlertRead(id)` — UPDATE … WHERE id=? AND read_at IS NULL
    (idempotent; doesn't clobber earlier read)
  - `useThresholdAlerts(pollMs=60_000)` — initial load + setInterval +
    window focus + visibilitychange listeners; returns
    `{ alerts, unread, loading, error, refresh, markRead }`. `markRead`
    does optimistic local update then server write, rolls back on error.
- **Round-trip probe** via Management API against live ENV_DB:
  - Inserted 2 test alerts (real reading_id FK) → read_at NULL on both
  - Unread count before markRead: 2
  - markRead one → unread after: 1 (drop by exactly 1, not 2)
  - FETCH newest → both visible, the marked one has read_at set
  - DELETE cleanup → final count 0 (table clean)
- `npm run build` passes. Bundle size unchanged (warnings pre-F6).
- **No realtime subscription** — per WO acceptance + free-tier discipline.
  Poll + on-focus is the deliberate choice; realtime upgrade is a
  separate WO if needed later.
