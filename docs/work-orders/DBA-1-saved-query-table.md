# WO-DBA-1: core.saved_query table (DBA console foundation)
Status: open
Lane/files: `supabase/migrations/<ts>_v2_saved_query.sql` เท่านั้น
Branch: main
Depends on: SCHEMA-1 (core schema), SCHEMA-4 (audit_log trigger)

## Goal + Acceptance
- สร้าง `core.saved_query` table:
  ```sql
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name         text NOT NULL
  sql_text     text NOT NULL
  description  text
  created_by   uuid NOT NULL          -- auth.uid()
  is_shared    boolean NOT NULL DEFAULT false
  tags         text[] NOT NULL DEFAULT '{}'
  last_run_at  timestamptz
  run_count    integer NOT NULL DEFAULT 0
  created_at   timestamptz NOT NULL DEFAULT now()
  ```
- RLS policies:
  - Owner (created_by = auth.uid()): SELECT/INSERT/UPDATE/DELETE own queries
  - is_shared=true: SELECT FOR authenticated (shared library visible to all)
  - Admin role: full access
- Indexes: `(created_by)` btree + partial `(is_shared) WHERE is_shared=true`
- Idempotent CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS
- Attach `core.fn_audit_log()` trigger (SCHEMA-4) — track every mutation
- ไม่มี UI

## Verify
- INSERT query as authenticated user → row visible to self
- is_shared=true → other authenticated user can SELECT
- is_shared=false → other user SELECT returns empty
- audit_log trigger auto-captures writes

## Checkpoint log
