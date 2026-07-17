-- P17 — Threshold alert persistence + notification staging.
--
-- wastewater.threshold (existing) holds the threshold *config* per
-- parameter (min/max + effective_from). It does NOT log individual alert
-- instances. This migration adds a new wastewater.threshold_alert table
-- that records each violation + whether it has been notified yet, plus an
-- AFTER INSERT trigger on wastewater.reading that calls
-- fn_check_thresholds and writes the violations. An Edge Function
-- (functions/notify-threshold) polls v_pending_threshold_alerts and
-- pushes to Line Notify / Telegram via a webhook URL in Vault.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + CREATE OR REPLACE for the
-- function/trigger/view.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) threshold_alert — one row per violation, per reading.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wastewater.threshold_alert (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id   uuid NOT NULL REFERENCES wastewater.reading(id) ON DELETE CASCADE,
    field        text NOT NULL,        -- do_average | free_chlorine | ph
    message      text NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    notified_at  timestamptz           -- NULL = pending, set when webhook fires
);
CREATE INDEX IF NOT EXISTS idx_threshold_alert_pending
    ON wastewater.threshold_alert (created_at ASC)
    WHERE notified_at IS NULL;
COMMENT ON TABLE wastewater.threshold_alert IS
    'P17 — per-violation log of threshold breaches. Polled by the notify-threshold Edge Function. notified_at = NULL is the pending-queue filter.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) AFTER INSERT trigger — populate the log.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wastewater.fn_persist_threshold_alerts()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    rec record;
BEGIN
    FOR rec IN
        SELECT field, message FROM wastewater.fn_check_thresholds(NEW.id)
    LOOP
        INSERT INTO wastewater.threshold_alert (reading_id, field, message)
        VALUES (NEW.id, rec.field, rec.message)
        ON CONFLICT DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_persist_threshold_alerts ON wastewater.reading;
CREATE TRIGGER trg_persist_threshold_alerts
    AFTER INSERT ON wastewater.reading
    FOR EACH ROW EXECUTE FUNCTION wastewater.fn_persist_threshold_alerts();

COMMENT ON FUNCTION wastewater.fn_persist_threshold_alerts() IS
    'P17 — AFTER INSERT trigger that writes fn_check_thresholds violations into wastewater.threshold_alert.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) View — pending alerts (work queue for the Edge Function).
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW wastewater.v_pending_threshold_alerts AS
SELECT
    a.id,
    a.reading_id,
    a.field,
    a.message,
    a.created_at,
    r.reading_date,
    COALESCE(r.reported_by_name_legacy, '(ไม่ระบุ)') AS reporter
FROM wastewater.threshold_alert a
LEFT JOIN wastewater.reading r ON r.id = a.reading_id
WHERE a.notified_at IS NULL
ORDER BY a.created_at ASC;

COMMENT ON VIEW wastewater.v_pending_threshold_alerts IS
    'P17 — work queue for the notify-threshold Edge Function. Notified rows get notified_at set and disappear from this view.';
