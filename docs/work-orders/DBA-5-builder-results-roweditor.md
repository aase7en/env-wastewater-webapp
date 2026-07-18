# WO-DBA-5: QueryBuilder + ResultTable + RowEditor (CRUD UI skeleton)
Status: open
Lane/files: `frontend/src/components/admin/QueryBuilder.tsx`, `ResultTable.tsx`, `RowEditor.tsx` (new)
Branch: main
Depends on: DBA-4

## Goal + Acceptance
- **QueryBuilder** (default mode):
  - Schema/table dropdown (introspected via PostgREST `/rest/v1/` or via `core.saved_query` tags)
  - Column multi-select (load from PostgREST `?select=` OpenAPI)
  - Filter chips: column + operator (=, <>, <, >, like, in, is null) + value
  - Sort by column asc/desc
  - Limit selector (1000 default, max 10000)
  - "Run" button → calls `runQuery` from DBA-2
- **ResultTable**:
  - Sticky header + first column
  - Sortable headers (click to toggle asc/desc)
  - Click row → opens RowEditor drawer (DBA-5 row editor)
  - Pagination (page size + prev/next + jump to page)
  - Export CSV button (client-side)
- **RowEditor**:
  - Detects column types from introspection (text/numeric/boolean/date/uuid/jsonb)
  - INSERT form (per-column input matching type — boolean Toggle, date picker, etc.)
  - UPDATE inline (same form pre-filled)
  - DELETE with **double-confirm modal**: "ลบแถว id=X ใช่ไหม? ไม่สามารถย้อนกลับได้"
  - Confirm shows affected row count preview (via EXPLAIN from DBA-3)
- All mutations trigger toast on success/failure
- audit_log captured automatically via SCHEMA-4
- className minimal

## Verify
- Builder on `wastewater.reading` filter `do_aeration < 2` → returns matching rows
- Click row → drawer opens with column values pre-filled
- INSERT form → submit → row in table + audit_log INSERT row
- DELETE → confirm modal → row gone + audit_log DELETE row
- Export CSV downloads file

## Checkpoint log
