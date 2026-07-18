# WO-DBA-4: DBAConsolePage + /admin/db route (admin-only)
Status: done (2026-07-17, zcode) — commit `d48c6f2`
Lane/files: `frontend/src/pages/admin/DBAConsolePage.tsx` (new), `frontend/src/App.tsx` (1 route), `frontend/src/components/layout/AppShell.tsx` (admin-only nav link — Track F owns className)
Branch: main
Depends on: DBA-2

## Goal + Acceptance
- Route `/admin/db` wrapped in `<RequireAuth role="admin">` (extends existing RequireAuth to support role prop)
- DBAConsolePage skeleton layout:
  - Left sidebar: Saved queries list (DBA-7) + AI suggestions (DBA-9)
  - Center: query builder (DBA-5) or raw SQL editor (DBA-6) toggle
  - Right/bottom: result table (DBA-5) + AI chat panel (DBA-10)
- Initial state: empty result, prompt "เลือก table หรือพิมพ์คำถาม"
- className minimal (Track F owns polish)
- Staff (non-admin) → route renders `<NotFoundPage />` (no API hint)
- `npm run build` passes

## Verify
- Admin login → navigate `/admin/db` → page renders
- Staff login → navigate `/admin/db` → 404 (no leak)
- Anon → redirect to /login?next=/admin/db

## Checkpoint log
