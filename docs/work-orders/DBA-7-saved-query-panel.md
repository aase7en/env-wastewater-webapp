# WO-DBA-7: SavedQueryPanel — list/save/share
Status: open
Lane/files: `frontend/src/components/admin/SavedQueryPanel.tsx` (new), `frontend/src/lib/admin/saved-query.ts` (new)
Branch: main
Depends on: DBA-1, DBA-5

## Goal + Acceptance
- `lib/admin/saved-query.ts` exports:
  - `listSavedQueries({ includeShared?: boolean, tags?: string[] })` — returns `SavedQuery[]`
  - `saveQuery({ name, sql_text, description, tags, is_shared })` — INSERT
  - `updateQuery(id, patch)` — UPDATE own
  - `deleteQuery(id)` — DELETE own (with double confirm)
  - `incrementRunCount(id)` — UPDATE last_run_at + run_count
  - `useSavedQueries()` hook
- **SavedQueryPanel** UI (sidebar in DBAConsolePage):
  - Search box (filter by name/tags)
  - List of saved queries (name + tags + last run + run_count + shared icon)
  - Click → loads into QueryBuilder/SqlEditor
  - Right-click menu: Run / Edit / Duplicate / Share toggle / Delete
  - "+ New query" button (active when SqlEditor has unsaved SQL)
  - Share toggle: switches `is_shared` — visible to all authenticated
- Shared queries section (separate, read-only unless owner)
- Tags: free-form text input → chip array
- className minimal

## Verify
- Save query → list updates → click → loads
- Share toggle → other admin sees it in "Shared" section
- Run increments run_count + updates last_run_at
- Delete with confirm → row removed

## Checkpoint log
