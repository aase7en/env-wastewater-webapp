# WO-DBA-3: admin_run_query + admin_explain PG functions (defense in depth)
Status: done (2026-07-17, zcode) — commit `6f71b13`
Lane/files: `supabase/migrations/20260719000005_dba3_admin_fn.sql` เท่านั้น (PG function แทน Edge Function — see decision below)
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

### done — 2026-07-17 (zcode) — commit `6f71b13`
- **DESIGN PIVOT**: replaced planned Deno Edge Function with PL/pgSQL
  PG functions (`admin_run_query`, `admin_explain`). Reasoning (a-think):
  - PostgREST auto-exposes RPC at `/rest/v1/rpc/<name>` — no deploy step
  - SECURITY INVOKER + caller's authenticated session → RLS policies
    on underlying tables apply natively (no manual SET LOCAL ROLE)
  - Reuses Postgres parser (harder to bypass than Deno regex)
  - One language (PL/pgSQL), no Deno toolchain to maintain
- Migration `20260719000005_dba3_admin_fn.sql` (4/4 OK):
  - `admin_run_query(sql_text text) RETURNS jsonb`
    - Strips comments, regex whitelist re-check (POSIX, layer 2)
    - DENY: DROP/TRUNCATE/ALTER/GRANT/REVOKE/CREATE/VACUUM/ANALYZE/
      COPY/CALL/DO-$$/SET ROLE/RESET ROLE
    - Stacked query block (`;` after trailing terminator)
    - Wraps user SQL in `WITH q AS (<sql>) SELECT jsonb_agg(to_jsonb(q))`
    - Returns `{rows, rowCount}`
  - `admin_explain(sql_text text) RETURNS jsonb` — same whitelist,
    returns `{text, estimatedRows}`, does NOT execute
- **Root-cause bugs caught + fixed (debug-mantra)**:
  - bug 1: PL/pgSQL regex used `\s`/`\b` (JS syntax) — PostgreSQL POSIX
    regex doesn't support those. Replaced with `[[:space:]]` and
    `([^a-zA-Z]|$)` for word boundaries
  - bug 2: CTE alias `result` collided with built-in name (42703
    column does not exist). Renamed to `q`
- **Verified live (6 scenarios)**:
  - `SELECT 1 as one, 2 as two` → rows [{one:1,two:2}], rowCount=1
  - `SELECT id, do_aeration FROM wastewater.reading LIMIT 2` → real
    rows from DB
  - `SELECT count(*) FROM carbon.reading` → {n:907}
  - `DROP TABLE x` → RAISE EXCEPTION 42000 ✓
  - `SELECT 1; SELECT 2` (stacked) → RAISE ✓
  - `SELECT 1 /* hide */ ; DROP TABLE x` → RAISE (DROP detected) ✓
  - `EXPLAIN SELECT count(*) FROM carbon.reading` → plan text + null rows
- RPC now consumable by `lib/admin/db-query.ts:runRawQuery` via
  `supabase.rpc('admin_run_query', {sql_text})`.
