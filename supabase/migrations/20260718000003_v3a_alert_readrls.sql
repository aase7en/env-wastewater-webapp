-- V3a — Threshold alerts: read-tracking column + RLS.
--
-- P17 created `wastewater.threshold_alert` to log violations and feed the
-- notify-threshold Edge Function (notified_at = whether the webhook fired).
-- V3a (frontend alert bell) needs a separate concept: whether the USER has
-- *seen* a given alert. notified_at ≠ read_at (an alert can be pushed to
-- LINE and still be unread in the dashboard). This migration adds read_at
-- and enables RLS so the authenticated browser session can read/update
-- the table directly via PostgREST.
--
-- Track Z scope (SQL) — no page edits, no className, no theme tokens.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) read_at column — NULL = unread, timestamp = when the user dismissed it.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE wastewater.threshold_alert
    ADD COLUMN IF NOT EXISTS read_at timestamptz;

COMMENT ON COLUMN wastewater.threshold_alert.read_at IS
    'V3a — when the user dismissed/read this alert in the UI. NULL = unread. Distinct from notified_at (whether the webhook push fired).';

-- Helpful partial index for the "count unread" query (WHERE read_at IS NULL).
CREATE INDEX IF NOT EXISTS idx_threshold_alert_unread
    ON wastewater.threshold_alert (created_at DESC)
    WHERE read_at IS NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Enable RLS + authenticated-read policy.
-- ───────────────────────────────────────────────────────────────────────────
-- Threshold alerts are operational metadata, not patient-identifiable, so
-- any authenticated user of the ENV app may read them. Writes (UPDATE
-- read_at) also authenticated-only. The notify-threshold Edge Function
-- uses the service_role key and bypasses RLS entirely.
ALTER TABLE wastewater.threshold_alert ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS threshold_alert_authenticated_rw ON wastewater.threshold_alert;
CREATE POLICY threshold_alert_authenticated_rw
    ON wastewater.threshold_alert
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
