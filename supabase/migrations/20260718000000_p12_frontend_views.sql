-- P12 — frontend-first queries: computed fields + dashboard rollup as SQL.
--
-- Replaces app/core/computed.py + app/core/alert.py + the /api/dashboard
-- endpoint with DB-side functions/views so the frontend (Supabase JS)
-- can query directly without FastAPI in the middle.
--
-- Idempotent: uses CREATE OR REPLACE / DROP IF EXISTS so it's safe to
-- re-run. All objects live in the wastewater schema.

-- ───────────────────────────────────────────────────────────────────────────
-- fn_do_average(d, s, b) — mean of non-null DO samples (mg/L).
-- Mirrors app/core/computed.py:do_average. Returns NULL if all three NULL.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wastewater.fn_do_average(
    d_aeration      numeric,
    d_sedimentation numeric,
    d_before_discharge numeric
) RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
    WITH samples AS (
        SELECT v FROM (VALUES (d_aeration), (d_sedimentation), (d_before_discharge)) AS t(v)
        WHERE v IS NOT NULL
    )
    SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE AVG(v) END FROM samples
$$;

COMMENT ON FUNCTION wastewater.fn_do_average(numeric, numeric, numeric) IS
    'Mean of non-null DO samples. P12 frontend-first replacement for app/core/computed.py:do_average.';

-- ───────────────────────────────────────────────────────────────────────────
-- fn_check_thresholds(reading_id) — returns one row per threshold violation.
-- Mirrors app/core/alert.py:check_thresholds. DO<2.0 / Cl<0.5 / pH 6.5–8.5.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wastewater.fn_check_thresholds(reading_uuid uuid)
RETURNS TABLE(field text, message text) LANGUAGE sql STABLE AS $$
    WITH r AS (
        SELECT
            do_aeration, do_sedimentation, do_before_discharge,
            ph, free_chlorine,
            wastewater.fn_do_average(do_aeration, do_sedimentation, do_before_discharge) AS do_avg
        FROM wastewater.reading WHERE id = reading_uuid
    )
    SELECT 'do_average', 'DO เฉลี่ย ' || do_avg::text || ' mg/L ต่ำกว่า 2.0 — ตรวจสอบระบบเติมอากาศ'
    FROM r WHERE do_avg IS NOT NULL AND do_avg < 2.0
    UNION ALL
    SELECT 'free_chlorine', 'คลอรีนอิสระ ' || free_chlorine::text || ' mg/L ต่ำกว่า 0.5'
    FROM r WHERE free_chlorine IS NOT NULL AND free_chlorine < 0.5
    UNION ALL
    SELECT 'ph', 'pH ' || ph::text || ' อยู่นอกช่วงปกติ 6.5–8.5'
    FROM r WHERE ph IS NOT NULL AND (ph < 6.5 OR ph > 8.5)
$$;

COMMENT ON FUNCTION wastewater.fn_check_thresholds(uuid) IS
    'Threshold violations for a single reading. P12 replacement for app/core/alert.py:check_thresholds.';

-- ───────────────────────────────────────────────────────────────────────────
-- v_dashboard_14day — rollup view the DashboardPage queries.
-- Replaces the FastAPI /api/dashboard?days=N endpoint.
-- Returns 14 most-recent rows (oldest first for charting) with computed
-- do_average + threshold flags + date_thai_be.
-- ───────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS wastewater.v_dashboard_14day;
CREATE VIEW wastewater.v_dashboard_14day AS
SELECT
    id,
    reading_date,
    wastewater.fn_do_average(do_aeration, do_sedimentation, do_before_discharge) AS do_average,
    ph,
    free_chlorine,
    tds_aeration,
    water_used_total,
    wastewater_in,
    system_operating,
    wastewater_discharged,
    (wastewater.fn_do_average(do_aeration, do_sedimentation, do_before_discharge) IS NOT NULL
        AND wastewater.fn_do_average(do_aeration, do_sedimentation, do_before_discharge) < 2.0) AS do_alert,
    (free_chlorine IS NOT NULL AND free_chlorine < 0.5) AS chlorine_alert,
    (ph IS NOT NULL AND (ph < 6.5 OR ph > 8.5)) AS ph_alert,
    EXTRACT(YEAR FROM reading_date)::int + 543 AS date_thai_be
FROM wastewater.reading
ORDER BY reading_date DESC;

COMMENT ON VIEW wastewater.v_dashboard_14day IS
    'Dashboard rollup: most-recent-first rows with computed do_average + threshold flags. P12 frontend-first replacement for FastAPI /api/dashboard.';

-- ───────────────────────────────────────────────────────────────────────────
-- v_reading_detail — single-reading detail + computed fields for the form.
-- Replaces FastAPI /api/readings/{id} GET response with computed fields.
-- ───────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS wastewater.v_reading_detail;
CREATE VIEW wastewater.v_reading_detail AS
SELECT
    r.*,
    wastewater.fn_do_average(r.do_aeration, r.do_sedimentation, r.do_before_discharge) AS do_average,
    (r.pump2_meter - r.pump1_meter) AS energy_kwh_estimate,
    EXTRACT(YEAR FROM r.reading_date)::int + 543 AS date_thai_be
FROM wastewater.reading r;

COMMENT ON VIEW wastewater.v_reading_detail IS
    'Reading detail + computed fields. P12 frontend-first replacement for FastAPI /api/readings/{id} ReadingDetail response.';
