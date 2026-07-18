-- SCHEMA-4 — generic audit_log trigger + policies.
--
-- Populates `core.audit_log` automatically for every INSERT/UPDATE/DELETE
-- on transactional tables across all ENV_DB operational schemas. Drives
-- compliance audit trail + helps debug who-changed-what.
--
-- DESIGN (a-think 7-step):
--  - Approach A "generic function + per-table trigger" chosen over B
--    "per-table inline code" — DRY, simple. New tables only need a
--    CREATE TRIGGER line, not a new function body.
--  - actor = auth.uid() (NULL when service-role inserts — by design,
--    service-role actions are system-level and audit_row.actor stays
--    NULL to distinguish them from user actions)
--  - PERFORMANCE: only attached to transactional tables, NOT telemetry
--    (wastewater.sensor_reading would be too write-heavy for an audit
--    trigger at hospital scale)
--  - RLS: audit_log had NO policies (RLS was enabled but deny-all). Added
--    INSERT for authenticated (trigger runs in invoker context) + SELECT
--    for authenticated (own-actor only) + full access for admin role.
--
-- Track Z scope (SQL only — no UI, no className).
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Generic trigger function. Reads TG_OP + TG_TABLE_NAME + NEW/OLD
--    records. Uses to_jsonb() so column-shape drift is automatic — new
--    columns on underlying tables land in new_data/old_data without
--    touching this function.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION core.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_row_id text;
    v_old jsonb;
    v_new jsonb;
BEGIN
    -- Extract row_id (every audited table has uuid PK named 'id').
    IF TG_OP = 'DELETE' THEN
        v_row_id := OLD.id::text;
        v_old := to_jsonb(OLD);
        v_new := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_row_id := NEW.id::text;
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        v_row_id := NEW.id::text;
        v_old := NULL;
        v_new := to_jsonb(NEW);
    END IF;

    INSERT INTO core.audit_log (actor, action, table_name, row_id, old_data, new_data)
    VALUES (
        auth.uid(),                                  -- NULL for service-role
        TG_OP,                                       -- 'INSERT' / 'UPDATE' / 'DELETE'
        quote_ident(TG_TABLE_SCHEMA) || '.' || quote_ident(TG_TABLE_NAME),
        v_row_id,
        v_old,
        v_new
    );

    -- Return appropriate record so trigger chain continues.
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION core.fn_audit_log() IS
    'SCHEMA-4 (2026-07-17) — generic audit trigger function. Attaches to transactional tables (INSERT/UPDATE/DELETE). Writes one row per DML to core.audit_log with actor=auth.uid(), full to_jsonb(NEW) and to_jsonb(OLD). Idempotent re-install via CREATE OR REPLACE.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) RLS policies on core.audit_log.
--    Previously RLS was enabled but no policy existed → deny-all → any
--    trigger INSERT would have failed (trigger runs in invoker context).
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS audit_log_authenticated_insert ON core.audit_log;
DROP POLICY IF EXISTS audit_log_authenticated_select_own ON core.audit_log;
DROP POLICY IF EXISTS audit_log_admin_all ON core.audit_log;

-- INSERT: any authenticated user (trigger writes via their session)
CREATE POLICY audit_log_authenticated_insert
    ON core.audit_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- SELECT: authenticated users see only their own actions (actor = self)
CREATE POLICY audit_log_authenticated_select_own
    ON core.audit_log FOR SELECT
    TO authenticated
    USING (actor = auth.uid());

-- Admin role: full access (SELECT + INSERT + UPDATE + DELETE for corrections)
CREATE POLICY audit_log_admin_all
    ON core.audit_log FOR ALL
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
-- 3) Attach trigger to every transactional table.
--    Skips telemetry (wastewater.sensor_reading) and audit_log itself.
--    DROP IF EXISTS first → idempotent.
-- ───────────────────────────────────────────────────────────────────────────

-- Existing tables (Wave 1 + pre-v2)
DROP TRIGGER IF EXISTS trg_audit_log ON wastewater.reading;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON wastewater.reading
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON carbon.reading;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON carbon.reading
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON core.repair_request;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON core.repair_request
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON wastewater.threshold_alert;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON wastewater.threshold_alert
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

-- New v2 module tables (SCHEMA-1)
DROP TRIGGER IF EXISTS trg_audit_log ON water_supply.daily_check;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON water_supply.daily_check
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON garbage.collection_log;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON garbage.collection_log
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON fuel.dispense_log;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON fuel.dispense_log
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON garden.work_round;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON garden.work_round
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON building.inspection_round;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON building.inspection_round
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON safety.monthly_check;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON safety.monthly_check
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON food.lab_test;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON food.lab_test
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log ON chemical.movement;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON chemical.movement
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();
