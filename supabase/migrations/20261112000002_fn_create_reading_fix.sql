-- ENV-PERF-001 D5-P1 repair — fix the carbon branch of public.fn_create_reading.
-- NEW migration: the applied 20261112000001_fn_create_reading.sql is
-- immutable once applied and must not be edited. See PR #171 D5 receipt
-- (issuecomment-6825964444) + docs/ai/handoffs/ENV-PERF-001-GLM.md.
--
-- Defect being repaired:
--   The carbon branch of 20261112000001 inserted `location_id` into
--   carbon.reading, but live carbon.reading has NO such column (columns:
--   id, meter_id, reading_date, meter_value, consumption, input_source,
--   raw_payload, recorded_by, created_at — reports/schema-snapshot-live.md;
--   engine error 42703 verified live by the D5 reviewer). plpgsql does not
--   validate column references at CREATE time, so the apply succeeded while
--   the electricity branch was guaranteed to abort the whole atomic
--   transaction at first real invocation. Origin of the myth: the OLD
--   client path (base 4b4a482 supabase-queries.ts) sent
--   `location_id: null // defaults via trigger` to the public.carbon_reading
--   PostgREST view, and wastewater.reading — which DOES have location_id —
--   was mistakenly assumed to mirror it.
--
-- Repairs in this file (function body only; schema untouched):
--   1. Carbon INSERT uses exactly the real columns
--      (meter_id, reading_date, meter_value, consumption, input_source).
--      raw_payload / recorded_by / created_at stay at their defaults
--      (NULL / NULL / now()) — the old PostgREST insert path never set
--      them either, so value semantics are unchanged.
--   2. Stale "BEFORE INSERT trigger" comments corrected: live
--      wastewater.reading has NO BEFORE INSERT defaults trigger — only
--      trg_audit_log and trg_persist_threshold_alerts, both AFTER
--      (verified live, D5). reported_by/location_id are nullable with no
--      default; the form sends explicit nulls, so both stay NULL — the
--      same outcome as the old PostgREST path claimed to rely on.
--
-- Everything else is byte-equivalent to 20261112000001: same signature,
-- SECURITY DEFINER, search_path pinned to core,public, the same
-- fail-closed core.fn_is_staff_or_admin() role gate, the same
-- column-by-column wastewater casts, the same atomic repair_request
-- insert, the same jsonb return. Idempotent (CREATE OR REPLACE).
-- Rollback (schema-only, see WO): DROP FUNCTION IF EXISTS
-- public.fn_create_reading(jsonb); then re-apply 20261112000001 if the
-- pre-fix shape is ever needed again (not recommended — see defect above).
CREATE OR REPLACE FUNCTION public.fn_create_reading(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
    v_carbon_id uuid;
    v_row wastewater.reading;
    v_cause text;
    v_meter_value text;
    v_consumption text;
BEGIN
    IF NOT core.fn_is_staff_or_admin() THEN
        RAISE EXCEPTION 'permission denied: staff or admin role required'
            USING ERRCODE = '42501';
    END IF;

    -- Split off the non-column fields (old client-side behavior).
    v_cause := NULLIF(btrim(COALESCE(p_payload->>'abnormal_cause', '')), '');
    v_meter_value := NULLIF(btrim(COALESCE(p_payload->>'electricity_meter_value', '')), '');
    v_consumption := NULLIF(btrim(COALESCE(p_payload->>'electricity_consumption', '')), '');

    -- 1) carbon.reading (electricity) — same fixed P5b meter as before,
    --    now against the REAL columns only (D5 repair: no location_id —
    --    that column does not exist on carbon.reading). The unique
    --    (meter_id, reading_date) constraint aborts the whole transaction
    --    on a duplicate day, same as the old client path.
    IF v_meter_value IS NOT NULL THEN
        INSERT INTO carbon.reading
            (meter_id, reading_date, meter_value, consumption, input_source)
        VALUES (
            'b6be4c99-c83a-43f7-b765-72286cc78bd0',
            (p_payload->>'reading_date')::date,
            v_meter_value::numeric,
            v_consumption::numeric,
            'manual'
        )
        RETURNING id INTO v_carbon_id;
    END IF;

    -- 2) wastewater.reading — column-by-column extraction (NULL for
    --    missing/empty payload keys; table defaults behave exactly as
    --    under the old PostgREST insert). reported_by/location_id have
    --    no default and no BEFORE INSERT trigger (verified live: only
    --    trg_audit_log + trg_persist_threshold_alerts, both AFTER) —
    --    they stay NULL when the payload omits them; the AFTER audit +
    --    threshold triggers keep firing unchanged.
    INSERT INTO wastewater.reading (
        location_id, reading_date, reported_by,
        tds_aeration, temp_aeration, tds_before_discharge,
        ph, do_aeration, do_sedimentation, do_before_discharge,
        sv30, free_chlorine, color_desc, smell_desc,
        screen_cleaned_coarse, screen_cleaned_fine,
        pump1_running, pump2_running, aerator1_running, aerator2_running,
        sludge_pump1_running, sludge_pump2_running,
        chlorine_pump1_running, chlorine_pump2_running,
        system_operating, pump1_meter, pump2_meter,
        water_used_total, wastewater_in, wastewater_discharged,
        chlorine_used, chlorine_mix_ratio, excess_sludge_removed,
        carbon_reading_id, input_source, note,
        legacy_id, reported_by_name_legacy
    ) VALUES (
        NULLIF(p_payload->>'location_id', '')::uuid,
        (p_payload->>'reading_date')::date,
        NULLIF(p_payload->>'reported_by', '')::uuid,
        NULLIF(p_payload->>'tds_aeration', '')::numeric(10,2),
        NULLIF(p_payload->>'temp_aeration', '')::numeric(5,2),
        NULLIF(p_payload->>'tds_before_discharge', '')::numeric(10,2),
        NULLIF(p_payload->>'ph', '')::numeric(4,2),
        NULLIF(p_payload->>'do_aeration', '')::numeric(6,2),
        NULLIF(p_payload->>'do_sedimentation', '')::numeric(6,2),
        NULLIF(p_payload->>'do_before_discharge', '')::numeric(6,2),
        NULLIF(p_payload->>'sv30', '')::numeric(6,2),
        NULLIF(p_payload->>'free_chlorine', '')::numeric(6,3),
        NULLIF(p_payload->>'color_desc', ''),
        NULLIF(p_payload->>'smell_desc', ''),
        NULLIF(p_payload->>'screen_cleaned_coarse', '')::boolean,
        NULLIF(p_payload->>'screen_cleaned_fine', '')::boolean,
        NULLIF(p_payload->>'pump1_running', '')::boolean,
        NULLIF(p_payload->>'pump2_running', '')::boolean,
        NULLIF(p_payload->>'aerator1_running', '')::boolean,
        NULLIF(p_payload->>'aerator2_running', '')::boolean,
        NULLIF(p_payload->>'sludge_pump1_running', '')::boolean,
        NULLIF(p_payload->>'sludge_pump2_running', '')::boolean,
        NULLIF(p_payload->>'chlorine_pump1_running', '')::boolean,
        NULLIF(p_payload->>'chlorine_pump2_running', '')::boolean,
        NULLIF(p_payload->>'system_operating', '')::boolean,
        NULLIF(p_payload->>'pump1_meter', '')::numeric(12,2),
        NULLIF(p_payload->>'pump2_meter', '')::numeric(12,2),
        NULLIF(p_payload->>'water_used_total', '')::numeric(12,2),
        NULLIF(p_payload->>'wastewater_in', '')::numeric(12,2),
        NULLIF(p_payload->>'wastewater_discharged', '')::boolean,
        NULLIF(p_payload->>'chlorine_used', '')::numeric(10,3),
        NULLIF(p_payload->>'chlorine_mix_ratio', ''),
        NULLIF(p_payload->>'excess_sludge_removed', '')::numeric(10,2),
        v_carbon_id,
        'manual',
        NULLIF(p_payload->>'note', ''),
        NULLIF(p_payload->>'legacy_id', ''),
        NULLIF(p_payload->>'reported_by_name_legacy', '')
    )
    RETURNING * INTO v_row;

    -- 3) repair_request when abnormal — inside the same transaction. A
    --    failure here now ABORTS the whole create (the old client path
    --    logged a console.warn and continued — that swallow is the defect
    --    this RPC fixes).
    IF v_cause IS NOT NULL THEN
        INSERT INTO core.repair_request (reading_id, cause, status)
        VALUES (v_row.id, v_cause, 'open');
    END IF;

    RETURN to_jsonb(v_row);
END;
$$;

COMMENT ON FUNCTION public.fn_create_reading(jsonb) IS
    'ENV-PERF-001 (2026-11-12, D5 repair 20261112000002) — atomic daily-reading create: carbon.reading (when electricity present, REAL columns only — location_id does not exist there) + wastewater.reading + core.repair_request (when abnormal_cause set) in ONE transaction, returning the created reading row as jsonb. SECURITY DEFINER, gated on core.fn_is_staff_or_admin() (fail-closed, same role gate as the transactional RLS policies). Replaces the 3 sequential client-side inserts whose repair_request failures were swallowed.';

GRANT EXECUTE ON FUNCTION public.fn_create_reading(jsonb) TO authenticated;
