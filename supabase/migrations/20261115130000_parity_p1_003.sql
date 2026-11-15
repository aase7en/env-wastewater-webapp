-- ============================================================================
-- ENV-PARITY-P1-003 C1 — AppSheet parity Phase 1, lane P1.3
-- Threshold seeds + 2-day Critical streak flags + alert firing
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P1-003.md
-- (§2 pins the threshold ground truth verbatim; §3.1 this file). Plan row:
-- docs/ai/APPSHEET-PARITY-PLAN.md §6 Phase 1 row P1.3 ("Critical flags 2 วัน
-- (DO/Cl/TDS/pH) → seed wastewater.threshold (รวม SV30 >450/<150, น้ำเข้า >70)
-- + ยิง threshold_alert").
--
-- REFERENCE-DATA VS USER-DATA (data-honesty distinction, WO §3.1):
-- The 8 INSERTs below are SYSTEM REFERENCE/CONFIG rows in
-- wastewater.threshold (the AppSheet thresholds were always in effect —
-- this seed makes the same config visible to the SQL engine). NO
-- wastewater.reading row and NO user-data row is inserted, updated, or
-- deleted by this migration. Test fixtures live only inside rolled-back
-- transactions in scripts/test_parity_p1_003_thresholds.py.
--
-- VERBATIM GROUND TRUTH (docs/ai/digital-twin/
-- 12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md §3.3 + §9; values BIND, none
-- invented):
--   Critical-DO-1: [บ่อเติมอากาศ(DO-1)] < 1
--   Critical-DO-2: [บ่อตกตะกอน(DO-2)] < 1
--   Critical-DO-3: [น้ำก่อนทิ้ง(DO-3)] < 1.5
--   Critical-FreeChlorine-Lowerlow: [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] < 0.5
--   Critical-FreeChlorine-HigherHigh: [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] > 1
--   TDS2 critical: [ในน้ำก่อนทิ้ง (TDS-2)] > 1000
--   pH Critical: [ความเป็นกรดและด่าง(pH)] > 9 OR [ความเป็นกรดและด่าง(pH)] < 5
--   SV30_Notice bot: OR([การตกตะกอน(SV30)]>450,[การตกตะกอน(SV30)]<150)
--   water_overload bot: [ปริมาณน้ำเสียที่เข้าระบบบำบัด] > 70
--
-- DISCOVERIES RECORDED AT CLAIM TIME (WO §2.1 — bind the lane):
--   1. pH bound discrepancy: plan §4.1 summary says "pH>9/<4" but the
--      verbatim `pH Critical` formula is `< 5` on the low side. The seed
--      pins min_value = 5 per the verbatim formula; the plan summary is a
--      TYPO, documented, not copied.
--   2. Disabled/decayed bots are NOT seeded: `(disabled) Line AS record 3`
--      (TDS-2 >900 ×2 duplicated, Temperature >40, pH >8.3, SV30 >650,
--      inflow >62) is disabled in AppSheet itself — excluded. TDS_Notice /
--      pH_Notice bots have EMPTY event conditions (broken in AppSheet) and
--      carry no thresholds of their own; their substance is the Critical
--      columns (seeded via tds2/ph). The >2.5 free-chlorine FORMAT rule
--      (reference §10) is a display-only UI rule owned by lane P1.4 — not
--      a threshold row.
--   3. wastewater_in honesty caveat: the stored column is the compared
--      surface; the AppSheet quantity is pump-meter derived (P1.2 scope,
--      owner-gated). NULL/sparse → no fire (unknown ≠ zero, never coerced).
--   4. Alert DELIVERY (Telegram/LINE/webhook) is out of scope (Phase 4
--      owner decision); notify-threshold Edge Function untouched; new
--      alert rows surface via the EXISTING pending queue
--      (v_pending_threshold_alerts / NotificationBell) with zero
--      frontend edits.
--
-- 2-DAY CRITICAL STREAK — TRANSLATION NOTE (WO §2.2, BINDING):
-- Each AppSheet Critical-* virtual column is an IF(AND(COUNT(SELECT(col,
-- [col]<bound AND [วันที่ บันทึก]=D−2))>0, COUNT(...D−1)>0, COUNT(...D)>0),
-- TRUE, FALSE) — EXACT calendar-date equality over a 3-date window. The
-- plan §4.1 summary suggests "SQL window/LAG"; a naive LAG-over-recorded-
-- rows chain is NOT equivalent (it would skip across calendar gaps). The
-- faithful translation below is per-date EXISTS at fixed offsets D−2/D−1/D:
-- NULL never violates (comparison is not TRUE), a missing day has no
-- violating row → EXISTS false → streak FALSE (missing readings = no
-- streak, never fabricated). Chlorine_StreakCount (gaps-and-islands) is
-- P1.2 scope, NOT this lane. sv30/wastewater_in are IMMEDIATE single-day
-- conditions (their bots fire on the reading itself) — no streak.
--
-- PER-COLUMN TRANSLATION (AppSheet deref/context → ENV columns, honest map):
--   [_THISROW].[วันที่ บันทึก]  → the probe row's wastewater.reading.reading_date
--   [วันที่ บันทึก] in SELECT() → p.reading_date of every other row
--   [บ่อเติมอากาศ(DO-1)]        → p.do_aeration            < 1   (critical_do1)
--   [บ่อตกตะกอน(DO-2)]          → p.do_sedimentation       < 1   (critical_do2)
--   [น้ำก่อนทิ้ง(DO-3)]          → p.do_before_discharge    < 1.5 (critical_do3)
--   [คลอรีนอิสระ...Free Chlorine] → p.free_chlorine < 0.5 (critical_free_chlorine_low)
--                                   p.free_chlorine > 1   (critical_free_chlorine_high)
--   [ในน้ำก่อนทิ้ง (TDS-2)]      → p.tds_before_discharge   > 1000 (critical_tds2)
--   [ความเป็นกรดและด่าง(pH)]     → p.ph > 9 OR p.ph < 5     (critical_ph)
--   [การตกตะกอน(SV30)] (bot)    → r.sv30 > 450 OR r.sv30 < 150 (immediate_sv30)
--   [ปริมาณน้ำเสียที่เข้า...] (bot)→ r.wastewater_in > 70   (immediate_wastewater_in)
-- AppSheet's SELECT counts rows of ONE table (no location dimension); the
-- EXISTS probes likewise cover all wastewater.reading rows on the date.
--
-- OBJECT NAMES (pinned):
--   wastewater.fn_critical_flags(uuid)          STABLE, per-reading flags
--   wastewater.v_reading_critical_flags         per-reading flag view
--   wastewater.fn_check_thresholds_parity(uuid) STABLE, new alert branches
--   wastewater.fn_persist_parity_alerts()       trigger fn (parity path)
--   trg_persist_parity_alerts on wastewater.reading AFTER INSERT
--
-- EXISTING SURFACE — BYTE-IDENTICAL, ADDITIVE ONLY:
-- wastewater.fn_check_thresholds(uuid), fn_persist_threshold_alerts() and
-- trg_persist_threshold_alerts are NOT touched by this migration (the
-- legacy branches do-average<2.0 / free_chlorine<0.5 / pH 6.5–8.5 keep
-- their exact behavior and message text). The parity path is a SECOND
-- trigger so each alert class is written exactly once (calling the legacy
-- fn again from the parity path would duplicate its rows). Existing
-- threshold_alert rows are NEVER modified or deleted (history is honest).
--
-- EFFECTIVE_FROM PIN (D3 preflight receipt): fixed literal
-- DATE '2024-01-09' = live `SELECT MIN(reading_date) FROM
-- wastewater.reading` (907 rows span 2024-01-09..2026-07-04) — the seeded
-- config covers ALL historical rows for parity flags (v_reading_detail's
-- LATERAL picks effective_from <= reading_date). NEVER CURRENT_DATE
-- (non-deterministic on re-run). Double-seed guard: one guarded INSERT per
-- parameter (WHERE NOT EXISTS on (parameter_code, effective_from), the
-- table's UNIQUE key).
--
-- NO RLS DDL. No grant changes. No Edge Function changes. No frontend
-- artifact. No ALTER TABLE, no UPDATE/DELETE/TRUNCATE/DROP TABLE, no
-- POLICY statements. DROP IF EXISTS appears only as the house idempotent
-- form for the NEW objects this file itself creates.
--
-- ============================================================================
-- ROLLBACK (reverse order; run via the same Management-API apply path):
--   DROP TRIGGER IF EXISTS trg_persist_parity_alerts ON wastewater.reading;
--   DROP FUNCTION IF EXISTS wastewater.fn_persist_parity_alerts();
--   DROP FUNCTION IF EXISTS wastewater.fn_check_thresholds_parity(uuid);
--   DROP VIEW IF EXISTS wastewater.v_reading_critical_flags;
--   DROP FUNCTION IF EXISTS wastewater.fn_critical_flags(uuid);
--   DELETE FROM wastewater.threshold WHERE (parameter_code, effective_from) IN (
--     ('do1', DATE '2024-01-09'), ('do2', DATE '2024-01-09'),
--     ('do3', DATE '2024-01-09'), ('free_chlorine', DATE '2024-01-09'),
--     ('ph', DATE '2024-01-09'), ('tds2', DATE '2024-01-09'),
--     ('sv30', DATE '2024-01-09'), ('wastewater_in', DATE '2024-01-09'));
--   -- fn_check_thresholds requires NO restore: this migration never
--   -- modifies it. Its PRIOR (P12) definition, pinned verbatim for
--   -- byte-exact verification (matches pg_get_functiondef output shape):
--   --   CREATE OR REPLACE FUNCTION wastewater.fn_check_thresholds(reading_uuid uuid)
--   --    RETURNS TABLE(field text, message text) LANGUAGE sql STABLE AS $$
--   --     WITH r AS (
--   --         SELECT do_aeration, do_sedimentation, do_before_discharge,
--   --             ph, free_chlorine,
--   --             wastewater.fn_do_average(do_aeration, do_sedimentation, do_before_discharge) AS do_avg
--   --         FROM wastewater.reading WHERE id = reading_uuid
--   --     )
--   --     SELECT 'do_average', 'DO เฉลี่ย ' || do_avg::text || ' mg/L ต่ำกว่า 2.0 — ตรวจสอบระบบเติมอากาศ'
--   --     FROM r WHERE do_avg IS NOT NULL AND do_avg < 2.0
--   --     UNION ALL
--   --     SELECT 'free_chlorine', 'คลอรีนอิสระ ' || free_chlorine::text || ' mg/L ต่ำกว่า 0.5'
--   --     FROM r WHERE free_chlorine IS NOT NULL AND free_chlorine < 0.5
--   --     UNION ALL
--   --     SELECT 'ph', 'pH ' || ph::text || ' อยู่นอกช่วงปกติ 6.5–8.5'
--   --     FROM r WHERE ph IS NOT NULL AND (ph < 6.5 OR ph > 8.5)
--   --    $$;
--   Pre-existing threshold_alert rows are NEVER deleted (history honest).
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Threshold seed rows — system reference data (8 guarded INSERTs).
--    effective_from = DATE '2024-01-09' = live MIN(reading_date), pinned.
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'do1', NULL, 1, DATE '2024-01-09', 'Critical-DO-1 (ref §3.3): DO-1 < 1 — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'do1' AND effective_from = DATE '2024-01-09');

INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'do2', NULL, 1, DATE '2024-01-09', 'Critical-DO-2 (ref §3.3): DO-2 < 1 — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'do2' AND effective_from = DATE '2024-01-09');

INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'do3', NULL, 1.5, DATE '2024-01-09', 'Critical-DO-3 (ref §3.3): DO-3 < 1.5 — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'do3' AND effective_from = DATE '2024-01-09');

INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'free_chlorine', 0.5, 1, DATE '2024-01-09', 'Critical-FreeChlorine-Lowerlow < 0.5 / HigherHigh > 1 (ref §3.3) — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'free_chlorine' AND effective_from = DATE '2024-01-09');

INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'ph', 5, 9, DATE '2024-01-09', 'pH Critical: > 9 OR < 5 (ref §3.3 verbatim; plan-summary ''<4'' is a typo) — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'ph' AND effective_from = DATE '2024-01-09');

INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'tds2', 1000, NULL, DATE '2024-01-09', 'TDS2 critical: TDS-2 > 1000 (ref §3.3) — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'tds2' AND effective_from = DATE '2024-01-09');

INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'sv30', 150, 450, DATE '2024-01-09', 'SV30_Notice bot: > 450 OR < 150 (ref §9) — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'sv30' AND effective_from = DATE '2024-01-09');

INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effective_from, note)
SELECT 'wastewater_in', 70, NULL, DATE '2024-01-09', 'water_overload bot: > 70 (ref §9) — AppSheet parity seed'
WHERE NOT EXISTS (
    SELECT 1 FROM wastewater.threshold
    WHERE parameter_code = 'wastewater_in' AND effective_from = DATE '2024-01-09');

-- ───────────────────────────────────────────────────────────────────────────
-- 2) fn_critical_flags(reading_uuid) — verbatim 2-day Critical streak
--    semantics per WO §2.2 (per-date EXISTS at D−2/D−1/D; NULL never
--    violates; missing day ⇒ no streak) + immediate bot conditions.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wastewater.fn_critical_flags(reading_uuid uuid)
RETURNS TABLE (
    id                         uuid,
    reading_date               date,
    critical_do1               boolean,
    critical_do2               boolean,
    critical_do3               boolean,
    critical_free_chlorine_low boolean,
    critical_free_chlorine_high boolean,
    critical_tds2              boolean,
    critical_ph                boolean,
    immediate_sv30             boolean,
    immediate_wastewater_in    boolean
) LANGUAGE sql STABLE AS $$
    WITH r AS (
        SELECT x.id, x.reading_date, x.sv30, x.wastewater_in
        FROM wastewater.reading x WHERE x.id = reading_uuid
    )
    SELECT
        r.id,
        r.reading_date,
        -- Critical-DO-1 (ref §3.3): do_aeration < 1 on D−2 AND D−1 AND D
        EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 2 AND p.do_aeration < 1)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 1 AND p.do_aeration < 1)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date AND p.do_aeration < 1),
        -- Critical-DO-2 (ref §3.3): do_sedimentation < 1, same shape
        EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 2 AND p.do_sedimentation < 1)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 1 AND p.do_sedimentation < 1)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date AND p.do_sedimentation < 1),
        -- Critical-DO-3 (ref §3.3): do_before_discharge < 1.5, same shape
        EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 2 AND p.do_before_discharge < 1.5)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 1 AND p.do_before_discharge < 1.5)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date AND p.do_before_discharge < 1.5),
        -- Critical-FreeChlorine-Lowerlow (ref §3.3): free_chlorine < 0.5
        EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 2 AND p.free_chlorine < 0.5)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 1 AND p.free_chlorine < 0.5)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date AND p.free_chlorine < 0.5),
        -- Critical-FreeChlorine-HigherHigh (ref §3.3): free_chlorine > 1
        EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 2 AND p.free_chlorine > 1)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 1 AND p.free_chlorine > 1)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date AND p.free_chlorine > 1),
        -- TDS2 critical (ref §3.3): tds_before_discharge > 1000
        EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 2 AND p.tds_before_discharge > 1000)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 1 AND p.tds_before_discharge > 1000)
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date AND p.tds_before_discharge > 1000),
        -- pH Critical (ref §3.3): ph > 9 OR ph < 5 per date
        EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 2 AND (p.ph > 9 OR p.ph < 5))
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date - 1 AND (p.ph > 9 OR p.ph < 5))
        AND EXISTS (SELECT 1 FROM wastewater.reading p
                WHERE p.reading_date = r.reading_date AND (p.ph > 9 OR p.ph < 5)),
        -- SV30_Notice bot (ref §9): immediate OR(> 450, < 150) — no streak
        (r.sv30 IS NOT NULL AND (r.sv30 > 450 OR r.sv30 < 150)),
        -- water_overload bot (ref §9): immediate > 70 — no streak
        (r.wastewater_in IS NOT NULL AND r.wastewater_in > 70)
    FROM r
$$;

COMMENT ON FUNCTION wastewater.fn_critical_flags(uuid) IS
    'ENV-PARITY-P1-003 — verbatim AppSheet Critical-* translation (ref §3.3): per-date EXISTS at D−2/D−1/D (calendar-date equality; NULL/missing day ⇒ no streak) + immediate SV30/water_overload bot conditions (ref §9).';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) v_reading_critical_flags — computed per-reading flags (never stored
--    columns on wastewater.reading; plan DIVERGE disposition).
-- ───────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS wastewater.v_reading_critical_flags;
CREATE VIEW wastewater.v_reading_critical_flags AS
SELECT c.*
FROM wastewater.reading x
CROSS JOIN LATERAL wastewater.fn_critical_flags(x.id) c;

COMMENT ON VIEW wastewater.v_reading_critical_flags IS
    'ENV-PARITY-P1-003 — per-reading 2-day Critical streak flags (critical_do1/2/3, critical_free_chlorine_low/high, critical_tds2, critical_ph) + immediate sv30/wastewater_in conditions. Computed, never stored.';

-- ───────────────────────────────────────────────────────────────────────────
-- 4) fn_check_thresholds_parity(reading_uuid) — the NEW alert branches
--    only (immediate sv30/wastewater_in + each TRUE critical flag). The
--    legacy fn_check_thresholds branches are NOT duplicated here (its own
--    untouched trigger already persists them; duplication would double
--    those rows). field naming: immediate conditions carry the seeded
--    parameter codes; streak alerts carry the view column names.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wastewater.fn_check_thresholds_parity(reading_uuid uuid)
RETURNS TABLE (field text, message text) LANGUAGE sql STABLE AS $$
    WITH r AS (
        SELECT x.id, x.sv30, x.wastewater_in, x.do_aeration, x.do_sedimentation,
               x.do_before_discharge, x.ph, x.free_chlorine, x.tds_before_discharge
        FROM wastewater.reading x WHERE x.id = reading_uuid
    ),
    f AS (
        SELECT * FROM wastewater.fn_critical_flags(reading_uuid)
    )
    SELECT 'sv30',
           'SV30 ' || r.sv30::text || ' mL/L '
             || CASE WHEN r.sv30 > 450 THEN 'สูงกว่าเกณฑ์ 450' ELSE 'ต่ำกว่าเกณฑ์ 150' END
             || ' — ตรวจสอบการตกตะกอน'
    FROM r WHERE r.sv30 IS NOT NULL AND (r.sv30 > 450 OR r.sv30 < 150)
    UNION ALL
    SELECT 'wastewater_in',
           'ปริมาณน้ำเสียที่เข้าระบบบำบัด ' || r.wastewater_in::text
             || ' m³/วัน สูงกว่าเกณฑ์ 70 — ตรวจสอบภาระน้ำเสียเข้าระบบ'
    FROM r WHERE r.wastewater_in IS NOT NULL AND r.wastewater_in > 70
    UNION ALL
    SELECT 'critical_do1',
           'DO-1 (บ่อเติมอากาศ) ' || r.do_aeration::text
             || ' mg/L ต่ำกว่าเกณฑ์ 1 ต่อเนื่อง 3 วัน — ตรวจสอบระบบเติมอากาศ'
    FROM r JOIN f ON f.id = r.id WHERE f.critical_do1
    UNION ALL
    SELECT 'critical_do2',
           'DO-2 (บ่อตกตะกอน) ' || r.do_sedimentation::text
             || ' mg/L ต่ำกว่าเกณฑ์ 1 ต่อเนื่อง 3 วัน — ตรวจสอบบ่อตกตะกอน'
    FROM r JOIN f ON f.id = r.id WHERE f.critical_do2
    UNION ALL
    SELECT 'critical_do3',
           'DO-3 (น้ำก่อนทิ้ง) ' || r.do_before_discharge::text
             || ' mg/L ต่ำกว่าเกณฑ์ 1.5 ต่อเนื่อง 3 วัน — ตรวจสอบคุณภาพน้ำก่อนทิ้ง'
    FROM r JOIN f ON f.id = r.id WHERE f.critical_do3
    UNION ALL
    SELECT 'critical_free_chlorine_low',
           'คลอรีนอิสระ ' || r.free_chlorine::text
             || ' mg/L ต่ำกว่าเกณฑ์ 0.5 ต่อเนื่อง 3 วัน — ตรวจสอบการจ่ายคลอรีน'
    FROM r JOIN f ON f.id = r.id WHERE f.critical_free_chlorine_low
    UNION ALL
    SELECT 'critical_free_chlorine_high',
           'คลอรีนอิสระ ' || r.free_chlorine::text
             || ' mg/L สูงกว่าเกณฑ์ 1 ต่อเนื่อง 3 วัน — ตรวจสอบการจ่ายคลอรีน'
    FROM r JOIN f ON f.id = r.id WHERE f.critical_free_chlorine_high
    UNION ALL
    SELECT 'critical_tds2',
           'TDS-2 (ในน้ำก่อนทิ้ง) ' || r.tds_before_discharge::text
             || ' สูงกว่าเกณฑ์ 1000 ต่อเนื่อง 3 วัน — ตรวจสอบคุณภาพน้ำก่อนทิ้ง'
    FROM r JOIN f ON f.id = r.id WHERE f.critical_tds2
    UNION ALL
    SELECT 'critical_ph',
           'pH ' || r.ph::text
             || ' อยู่นอกช่วงเกณฑ์ 5–9 ต่อเนื่อง 3 วัน — ตรวจสอบความเป็นกรดด่าง'
    FROM r JOIN f ON f.id = r.id WHERE f.critical_ph
$$;

COMMENT ON FUNCTION wastewater.fn_check_thresholds_parity(uuid) IS
    'ENV-PARITY-P1-003 — parity alert branches: immediate sv30/wastewater_in (ref §9 bots) + each TRUE Critical streak flag. Legacy fn_check_thresholds branches intentionally NOT duplicated (separate trigger persists those exactly once).';

-- ───────────────────────────────────────────────────────────────────────────
-- 5) Parity persistence: second AFTER INSERT trigger on the EXISTING
--    chain's target table. wastewater.threshold_alert keeps its shape;
--    only rows are written, via the same (reading_id, field, message)
--    contract as the P17 trigger.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION wastewater.fn_persist_parity_alerts()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    rec record;
BEGIN
    FOR rec IN
        SELECT field, message FROM wastewater.fn_check_thresholds_parity(NEW.id)
    LOOP
        INSERT INTO wastewater.threshold_alert (reading_id, field, message)
        VALUES (NEW.id, rec.field, rec.message)
        ON CONFLICT DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_persist_parity_alerts ON wastewater.reading;
CREATE TRIGGER trg_persist_parity_alerts
    AFTER INSERT ON wastewater.reading
    FOR EACH ROW EXECUTE FUNCTION wastewater.fn_persist_parity_alerts();

COMMENT ON FUNCTION wastewater.fn_persist_parity_alerts() IS
    'ENV-PARITY-P1-003 — AFTER INSERT trigger persisting fn_check_thresholds_parity violations into wastewater.threshold_alert. Parallel to (never replacing) trg_persist_threshold_alerts.';
