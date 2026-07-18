# WO-DBA-6: SqlEditor (Advanced toggle — raw SQL with client whitelist)
Status: open
Lane/files: `frontend/src/components/admin/SqlEditor.tsx` (new)
Branch: main
Depends on: DBA-5

## Goal + Acceptance
- Toggle "Advanced" in DBAConsolePage switches QueryBuilder ↔ SqlEditor
- SqlEditor features:
  - Multi-line textarea (Monaco-lite: line numbers, syntax highlight basic — optional, defer to Track F)
  - `Cmd/Ctrl+Enter` to run
  - On Run: call `isStatementAllowed` from DBA-2 first → if deny, show error toast with reason (no server call)
  - If allow + starts with SELECT/CTE → call `runQuery` directly
  - If allow + INSERT/UPDATE/DELETE → call `runExplain` → show affected preview modal → on confirm call `executeMutation`
  - Result panel reuses ResultTable from DBA-5
  - Keyboard shortcut hint visible
- Statement whitelist UX:
  - DENY words shown greyed-out in autocomplete (visual cue)
  - DENY on Run → toast "คำสั่งต้องห้าม: DROP. อนุญาตเฉพาะ SELECT/INSERT/UPDATE/DELETE"
- Save current SQL to `core.saved_query` via DBA-7 panel
- className minimal

## Verify
- Type `SELECT * FROM carbon.reading LIMIT 5` + Cmd+Enter → results show
- Type `DROP TABLE x` + Cmd+Enter → toast error, no server call
- Type `DELETE FROM wastewater.reading WHERE id='...'` → EXPLAIN preview modal → confirm → row affected
- Switch back to Builder mode preserves last query (state lifted to page)

## Checkpoint log
