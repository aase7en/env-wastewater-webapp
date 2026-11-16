-- ============================================================================
-- ENV-PARITY-P1-005 C1 — AppSheet parity Phase 1, lane P1.5
-- น้ำประปา daily usage: activity enum + Hour_meter chain + spec-driven
-- estimates (energy ÷ water-in) + Chlorine usage ÷(1+9) — คุณภาพน้ำตามเดิม
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P1-005.md.
-- Plan row: docs/ai/APPSHEET-PARITY-PLAN.md §6 Phase 1 row P1.5 as amended
-- by the owner A2/A3 receipt (commit fb57369; 15 พ.ย. 2569):
--   A2 — energy/flow from the instrument/equipment spec system; the user
--        enters HOURS the pump ran (×3.7 = spec config, same system as P1.2)
--   A3 — chlorine 10% stock mixed 1:9 with water; usage ÷10 confirmed
--
-- VERBATIM GROUND TRUTH (docs/ai/digital-twin/
-- 12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md §3.8 ตาราง น้ำประปา, ref
-- 2384–2677 — these BIND; none invented):
--   activity enum values (ref 2519):
--     ลงข้อมูลการใช้น้ำประจำวัน / ฟรีคลอรีน / TDS   (init ref 2509–2515 =
--     UI default only — never a DB default)
--   Water_In Valid If >0 (ref 2561–2565); Invalid value error
--     "ตรวจสอบข้อมูลดีๆก่อน" (ref 2567–2571) — form-level, replicated in the
--     pure lib + page, NOT in SQL
--   last_Hour_meter = global MAX over earlier dates (ref 2648–2654) — the
--     DOCUMENTED AppSheet bug, corrected here exactly like P1.2: LAG by
--     check_date with the deterministic tie-break (check_date, created_at,
--     id), never a global aggregate
--   Hour_Work = Hour_meter − last_Hour_meter (ref 2656–2663)
--   Energy_use = delta × 3.7 with a clamp of negatives to zero (ref
--     2529–2539) — the clamp is NOT replicated (it swallows meter resets):
--     delta ≤ 0 → NULL + hour_boundary_flag + reason, never 0, never
--     negative (plan §4.2 DIVERGE, ref plan line 145)
--   Water_In auto-write Hour_Work × 8 (ref 2547–2553) — the ×8 constant is
--     NEVER replicated or silently stored (plan §4.2 DIVERGE, ref plan line
--     144 / WO D1-5): water_in_estimate surfaces view-only from the
--     spec-at-date flow_m3_per_h; until the owner seeds the flow it stays
--     NULL + flagged (honest unknown). The stored water_in column keeps
--     ONLY what the user typed or NULL.
--   Chlorine_usage_realy = Chlorine usage ÷ 10 (ref 2665–2671, spelling
--     "realy" kept VERBATIM for traceability); chlorine_concentrated =
--     Chlorine usage ÷ 10 (ref 2603–2609) — D1-4: the divisor is DERIVED
--     from the chlorine_mix_groundwater spec row (mix_part_chlorine +
--     mix_part_water = 1+9 = 10 = the "10%" stock), never a hardcoded 10.
--
-- OWNER ANSWERS A2/A3 (verbatim, plan §5.3 receipt block, commit fb57369):
--   A2: "เช่นเดียวกัน — พลังงาน/การไหลคำนวณจาก สเปกเครื่องมือ/อุปกรณ์ ต้องมี
--        ระบบข้อมูล spec เครื่องมือ (อัตราการไหล + การกินไฟต่อ 1 ชม.);
--        ค่าที่ผู้ใช้กรอกคือ จำนวนชั่วโมงปั๊มทำงาน"
--   A3: "ยังใช้อยู่ — ระบบน้ำบาดาลผสมคลอรีน 10% : น้ำ = 1:9; hour meter
--        ใช้ติดตามการใช้คลอรีนรายเดือน"
--
-- ADDITIVE ONLY — NO data writes: the 4 new columns are NULLable with NO
-- defaults (all existing rows stay NULL — the CHECK is added VALID because
-- NULL passes); the 15 pre-existing columns, the daily_check RLS policy
-- (daily_check_authenticated_rw FOR ALL TO authenticated covers new
-- columns) and the public.daily_check façade (select * auto-includes new
-- columns) are UNTOUCHED. Zero INSERT/UPDATE/DELETE row writes anywhere in
-- this file (history backfill is Phase 5 per plan §7). core.equipment_spec
-- is consumed READ-ONLY (P1.2 seeds: pump_groundwater energy 3.7 +
-- chlorine_mix_groundwater 1:9, valid_from DATE '2024-01-09'; NO new seeds).
--
-- EFFECTIVE-DATED JOIN RULE (P1.2 pattern): spec-at-date pick = valid_from
-- <= check_date AND (valid_to IS NULL OR valid_to > check_date) — half-open
-- [valid_from, valid_to), ORDER BY valid_from DESC LIMIT 1 (latest start
-- wins).
--
-- POSTGREST EXPOSURE (P1.4 D1-7 ACCEPTED pattern): only `public` is exposed
-- (PGRST106). The new façade runs with (security_invoker=on) so the caller's
-- RLS gates every row (anon probes fail closed); select granted to
-- authenticated; pgrst notified to reload the schema.
--
-- ============================================================================
-- ROLLBACK (reverse order; run via the same Management-API apply path —
-- fully additive lane, nothing to restore byte-exactly):
--   DROP VIEW IF EXISTS public.v_daily_check_chain;
--   DROP VIEW IF EXISTS water_supply.v_daily_check_chain;
--   ALTER TABLE water_supply.daily_check
--     DROP CONSTRAINT IF EXISTS ck_daily_check_activity_values;
--   ALTER TABLE water_supply.daily_check
--     DROP COLUMN IF EXISTS activity,
--     DROP COLUMN IF EXISTS hour_meter,
--     DROP COLUMN IF EXISTS water_in,
--     DROP COLUMN IF EXISTS chlorine_usage;
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1) The 4 usage columns — NULLable, no defaults (unknown ≠ any value).
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE water_supply.daily_check
    ADD COLUMN IF NOT EXISTS activity text,
    ADD COLUMN IF NOT EXISTS hour_meter numeric,
    ADD COLUMN IF NOT EXISTS water_in numeric,
    ADD COLUMN IF NOT EXISTS chlorine_usage numeric;

-- activity enum CHECK — the two AppSheet values VERBATIM (ref 2519). Added
-- VALID: every existing row is NULL and NULL passes the CHECK.
ALTER TABLE water_supply.daily_check
    DROP CONSTRAINT IF EXISTS ck_daily_check_activity_values;
ALTER TABLE water_supply.daily_check
    ADD CONSTRAINT ck_daily_check_activity_values
    CHECK (activity IN ('ลงข้อมูลการใช้น้ำประจำวัน', 'ฟรีคลอรีน / TDS'));

COMMENT ON COLUMN water_supply.daily_check.activity IS
    'ENV-PARITY-P1-005 — AppSheet น้ำประปา activity enum (ref 2519, verbatim): ลงข้อมูลการใช้น้ำประจำวัน / ฟรีคลอรีน / TDS via ck_daily_check_activity_values. AppSheet init (ref 2509–2515) is a UI create-only default — NO DB default; NULL = unknown (unknown ≠ any value).';
COMMENT ON COLUMN water_supply.daily_check.hour_meter IS
    'ENV-PARITY-P1-005 — AppSheet น้ำประปา Hour_meter (ref 2400, Show If ref 2521–2527): the user-entered HOURS the groundwater pump ran (owner A2). Chain/energy/water-in derivations live in water_supply.v_daily_check_chain, never stored here.';
COMMENT ON COLUMN water_supply.daily_check.water_in IS
    'ENV-PARITY-P1-005 — AppSheet น้ำประปา Water_In (ref 2402): the MEASURED value the user types (Valid If >0, ref 2561–2565; error ตรวจสอบข้อมูลดีๆก่อน ref 2567–2571 — form-level). The AppSheet ×8 auto-write is NEVER stored (plan §4.2 DIVERGE / WO D1-5); the estimate surfaces view-only as v_daily_check_chain.water_in_estimate.';
COMMENT ON COLUMN water_supply.daily_check.chlorine_usage IS
    'ENV-PARITY-P1-005 — AppSheet น้ำประปา Chlorine usage (ref 2398, Show If ref 2501–2507): user-entered. ÷(1+9)-from-spec derivation lives in water_supply.v_daily_check_chain (chlorine_usage_realy/chlorine_concentrated, AppSheet spelling realy kept verbatim).';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) water_supply.v_daily_check_chain — the per-row chain view (ONE view,
--    the P1.2 v_reading_meter_chain pattern mirrored):
--      prev hour meter via date-ordered LAG + deterministic tie-break
--        (the AppSheet global-MAX bug corrected — never a global aggregate),
--      hour_work with delta ≤ 0 or missing prev → NULL + hour_boundary_
--        flag/reason (never 0, never negative),
--      energy_use_estimate = hour_work × spec-at-date energy_kwh_per_h
--        (pump_groundwater, seed 3.7 — owner A2 config, never a literal),
--      water_in_estimate = hour_work × spec-at-date flow_m3_per_h (D1-5:
--        spec-flow-driven; no flow seeded → NULL + flag, never ×8),
--      chlorine_usage_realy / chlorine_concentrated = chlorine_usage ÷
--        NULLIF(mix_part_chlorine + mix_part_water, 0) from the
--        chlorine_mix_groundwater spec row (D1-4: 1+9 = 10 = the "10%"
--        stock; missing spec → NULL),
--      spec_missing / spec_missing_kinds honest flags (no zero-fill).
--    Computed, never stored. The form displays these READ-ONLY, flagged.
-- ───────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS water_supply.v_daily_check_chain;
CREATE VIEW water_supply.v_daily_check_chain AS
WITH base AS (
    SELECT d.id,
           d.check_date,
           d.location_id,
           d.recorded_by,
           d.note,
           d.created_at,
           d.activity,
           d.hour_meter,
           d.water_in,
           d.chlorine_usage,
           LAG(d.hour_meter) OVER w AS prev_hour_meter
    FROM water_supply.daily_check d
    WINDOW w AS (ORDER BY d.check_date, d.created_at, d.id)
),
guarded AS (
    SELECT b.*,
           CASE
               WHEN b.hour_meter IS NULL OR b.prev_hour_meter IS NULL THEN NULL
               WHEN b.hour_meter - b.prev_hour_meter <= 0 THEN NULL
               ELSE b.hour_meter - b.prev_hour_meter
           END AS hour_work,
           (b.hour_meter IS NOT NULL
            AND (b.prev_hour_meter IS NULL
                 OR b.hour_meter - b.prev_hour_meter <= 0)) AS hour_boundary_flag,
           NULLIF(concat_ws('; ',
                    CASE WHEN b.hour_meter IS NOT NULL AND b.prev_hour_meter IS NULL
                         THEN 'hour: no previous reading' END,
                    CASE WHEN b.hour_meter IS NOT NULL AND b.prev_hour_meter IS NOT NULL
                          AND b.hour_meter - b.prev_hour_meter <= 0
                         THEN 'hour: delta <= 0 (meter reset/swap suspected)' END), '') AS hour_boundary_reason
    FROM base b
),
specced AS (
    SELECT g.*,
           ps.energy_kwh_per_h AS spec_energy_kwh_per_h,
           ps.flow_m3_per_h    AS spec_flow_m3_per_h,
           ms.mix_part_chlorine,
           ms.mix_part_water
    FROM guarded g
    LEFT JOIN LATERAL (
        SELECT es.energy_kwh_per_h, es.flow_m3_per_h
        FROM core.equipment_spec es
        WHERE es.kind = 'pump_groundwater'
          AND es.valid_from <= g.check_date
          AND (es.valid_to IS NULL OR es.valid_to > g.check_date)
        ORDER BY es.valid_from DESC
        LIMIT 1
    ) ps ON TRUE
    LEFT JOIN LATERAL (
        SELECT es.mix_part_chlorine, es.mix_part_water
        FROM core.equipment_spec es
        WHERE es.kind = 'chlorine_mix_groundwater'
          AND es.valid_from <= g.check_date
          AND (es.valid_to IS NULL OR es.valid_to > g.check_date)
        ORDER BY es.valid_from DESC
        LIMIT 1
    ) ms ON TRUE
),
computed AS (
    SELECT s.*,
           CASE WHEN s.hour_work IS NOT NULL AND s.spec_energy_kwh_per_h IS NOT NULL
                THEN s.hour_work * s.spec_energy_kwh_per_h END AS energy_use_estimate,
           CASE WHEN s.hour_work IS NOT NULL AND s.spec_flow_m3_per_h IS NOT NULL
                THEN s.hour_work * s.spec_flow_m3_per_h END AS water_in_estimate,
           CASE WHEN s.chlorine_usage IS NOT NULL
                THEN s.chlorine_usage / NULLIF(s.mix_part_chlorine + s.mix_part_water, 0) END AS chlorine_usage_realy,
           CASE WHEN s.chlorine_usage IS NOT NULL
                THEN s.chlorine_usage / NULLIF(s.mix_part_chlorine + s.mix_part_water, 0) END AS chlorine_concentrated,
           NULLIF(concat_ws(',',
                    CASE WHEN s.hour_work IS NOT NULL AND s.spec_energy_kwh_per_h IS NULL
                         THEN 'pump_groundwater' END,
                    CASE WHEN s.hour_work IS NOT NULL AND s.spec_flow_m3_per_h IS NULL
                         THEN 'pump_groundwater' END,
                    CASE WHEN s.chlorine_usage IS NOT NULL AND s.mix_part_chlorine IS NULL
                         THEN 'chlorine_mix_groundwater' END), '') AS spec_missing_kinds
    FROM specced s
)
SELECT c.id,
       c.check_date,
       c.location_id,
       c.recorded_by,
       c.note,
       c.created_at,
       c.activity,
       c.hour_meter,
       c.prev_hour_meter,
       c.hour_work,
       c.hour_boundary_flag,
       c.hour_boundary_reason,
       c.water_in,
       c.water_in_estimate,
       c.chlorine_usage,
       c.chlorine_usage_realy,
       c.chlorine_concentrated,
       c.energy_use_estimate,
       c.spec_energy_kwh_per_h,
       c.spec_flow_m3_per_h,
       c.mix_part_chlorine,
       c.mix_part_water,
       (c.spec_missing_kinds IS NOT NULL) AS spec_missing,
       c.spec_missing_kinds
FROM computed c;

COMMENT ON VIEW water_supply.v_daily_check_chain IS
    'ENV-PARITY-P1-005 — water-supply daily chain: LAG prev hour meter (AppSheet global-MAX bug corrected; deterministic tie-break check_date/created_at/id), hour_work guarded (delta <= 0 or missing prev → NULL + hour_boundary_flag/reason; never 0/negative), energy_use_estimate = hours × equipment_spec AT check_date (pump_groundwater, seed 3.7; missing → NULL + spec_missing), water_in_estimate spec-flow-driven (never the AppSheet ×8; no flow seeded → NULL + flag), chlorine_usage_realy/chlorine_concentrated = usage ÷ NULLIF(mix parts, 0) from chlorine_mix_groundwater (D1-4; missing → NULL). Computed, never stored; displayed estimate-flagged, never presented as live telemetry.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) PostgREST façade (security_invoker — the caller's RLS gates every row;
--    anon probes fail closed). P1.4 D1-7 ACCEPTED pattern.
-- ───────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_daily_check_chain;
CREATE VIEW public.v_daily_check_chain WITH (security_invoker=on)
    AS SELECT * FROM water_supply.v_daily_check_chain;

GRANT SELECT ON public.v_daily_check_chain TO authenticated;

notify pgrst, 'reload schema';
