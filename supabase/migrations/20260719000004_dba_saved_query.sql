-- DBA-1 — core.saved_query table.
--
-- Foundation for Wave 4b DBA Console: stores admin-saved SQL queries
-- with sharing + tagging + run-count tracking.
--
-- RLS design (per WO-DBA-1):
--   - Owner (created_by = auth.uid()): full access to own queries
--   - is_shared=true: SELECT FOR authenticated (shared library)
--   - Admin role: full access to all queries
--
-- audit_log trigger (SCHEMA-4 core.fn_audit_log) attaches automatically —
-- every mutation tracked.
--
-- Track Z scope (SQL only — no UI, no className).
-- Idempotent.

CREATE TABLE IF NOT EXISTS core.saved_query (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name         text NOT NULL,
    sql_text     text NOT NULL,
    description  text,
    created_by   uuid NOT NULL,
    is_shared    boolean NOT NULL DEFAULT false,
    tags         text[] NOT NULL DEFAULT '{}',
    last_run_at  timestamptz,
    run_count    integer NOT NULL DEFAULT 0,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_query_created_by
    ON core.saved_query (created_by);
CREATE INDEX IF NOT EXISTS idx_saved_query_shared
    ON core.saved_query (name, tags)
    WHERE is_shared = true;

COMMENT ON TABLE core.saved_query IS
    'DBA-1 (2026-07-17) — Wave 4b DBA Console saved queries. Owner-RLS + shared flag + admin full access. Tracks last_run_at + run_count for analytics.';

-- ───────────────────────────────────────────────────────────────────────────
-- Enable RLS + policies.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE core.saved_query ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_query_owner_all ON core.saved_query;
DROP POLICY IF EXISTS saved_query_shared_read ON core.saved_query;
DROP POLICY IF EXISTS saved_query_admin_all ON core.saved_query;

-- Owner: full access to their own queries.
CREATE POLICY saved_query_owner_all
    ON core.saved_query FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Shared: read-only for any authenticated user.
CREATE POLICY saved_query_shared_read
    ON core.saved_query FOR SELECT
    TO authenticated
    USING (is_shared = true);

-- Admin: full access to any query (compliance / curation).
CREATE POLICY saved_query_admin_all
    ON core.saved_query FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM core.app_user
                WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM core.app_user
                WHERE id = auth.uid() AND role = 'admin')
    );

-- ───────────────────────────────────────────────────────────────────────────
-- Attach audit_log trigger (SCHEMA-4 generic function).
-- ───────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_audit_log ON core.saved_query;
CREATE TRIGGER trg_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.saved_query
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();
