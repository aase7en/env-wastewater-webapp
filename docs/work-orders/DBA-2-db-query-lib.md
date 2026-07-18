# WO-DBA-2: lib/admin/db-query.ts — whitelist + RLS-bounded execution
Status: open
Lane/files: `frontend/src/lib/admin/db-query.ts` (new) เท่านั้น
Branch: main
Depends on: DBA-1

## Goal + Acceptance
- Client-side query runner using existing `lib/supabase.ts` client (RLS-bounded — no service-role in browser)
- **Statement whitelist** (regex + parse):
  - ALLOW: `SELECT`, `INSERT INTO`, `UPDATE`, `DELETE FROM`, `WITH` (CTE leading to SELECT only)
  - DENY (return error before run): `DROP`, `TRUNCATE`, `ALTER`, `GRANT`, `REVOKE`, `CREATE`, `VACUUM`, `ANALYZE` (avoid EXPLAIN confusion)
- Two execution modes:
  - **Builder mode**: structured query object → supabase-js `.from().select().eq()` chain
  - **Raw mode**: raw SQL string → `supabase.rpc('admin_run_query', { sql })` (calls DBA-3 Edge Function or PG function)
- Functions exported:
  - `isStatementAllowed(sql): { ok: boolean; reason?: string }`
  - `runQuery(sql, opts): Promise<{ rows, rowCount, columns, elapsedMs }>`
  - `runExplain(sql): Promise<string>` (EXPLAIN ANALYZE preview for mutations)
  - `executeMutation(sql, params): Promise<{ affectedRows }>`
- Result row limit default 1000, max 10000
- All mutations log to `core.audit_log` automatically via SCHEMA-4 trigger
- `npm run build` passes
- Unit-testable: `isStatementAllowed` pure function

## Verify
- Unit: `SELECT * FROM x` → ok=true; `DROP TABLE x` → ok=false reason clear
- Integration: builder-mode `runQuery({ table: 'wastewater.reading', limit: 5 })` returns 5 rows
- Integration: raw-mode `runQuery('SELECT count(*) FROM carbon.reading')` returns count
- Mutation: `executeMutation('DELETE FROM ... WHERE id=...')` → audit_log row present

## Checkpoint log
