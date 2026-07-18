# WO-DBA-3: supabase/functions/admin-query Edge Function (defense in depth)
Status: open
Lane/files: `supabase/functions/admin-query/index.ts` (new) เท่านอร์ only
Branch: main
Depends on: DBA-2

## Goal + Acceptance
- Deno Edge Function that re-applies the **same whitelist** as DBA-2 (defense in depth — even if client bypassed)
- Endpoints:
  - `POST /admin-query` body `{ sql: string, mode: 'select'|'mutation' }`
    - Verifies JWT auth.uid() present (reject anon)
    - Verifies `core.app_user.role = 'admin'`
    - Runs whitelist parse (allow SELECT/INSERT/UPDATE/DELETE/CTE-SELECT only)
    - Executes via Postgres connection using service_role key BUT within a transaction
      that explicitly SETs role to the user's role via `SET LOCAL ROLE authenticated`
      (re-applies RLS) — this is the key safety mechanism
    - For mode='mutation': runs EXPLAIN first, returns affected row count preview,
      client confirms, then commits
  - `POST /admin-query/explain` body `{ sql }` returns EXPLAIN ANALYZE text
- Statement parser: use `postgres` library `parse(sql)` AST walk to reject DROP/TRUNCATE/etc.
  — NOT regex alone (regex can be bypassed by comments / multi-statement)
- Response shape matches DBA-2 `runQuery` return
- All function calls log to `core.audit_log` via trigger
- Idempotent deploy

## Verify
- POST with anon JWT → 401
- POST with admin JWT + `SELECT 1` → returns `[{ ?column?: 1 }]`
- POST with admin JWT + `DROP TABLE x` → 400 with clear error
- POST mutation with `WHERE id=...` → EXPLAIN preview returned, no commit yet
- After client confirm → row affected count matches EXPLAIN estimate

## Checkpoint log
