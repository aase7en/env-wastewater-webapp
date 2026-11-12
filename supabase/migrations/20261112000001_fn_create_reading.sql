-- ENV-PERF-001 — atomic daily-reading create RPC.
-- See docs/work-orders/ENV-PERF-001.md + docs/ai/handoffs/ENV-PERF-001-GLM.md
-- Idempotent (CREATE OR REPLACE). Track Z scope (SQL only).
--
-- Why this function exists:
--   The daily form previously did 3 sequential client-side inserts per save
--   (supabase-queries.ts:194-247): (1) carbon.reading when electricity data
--   is present, (2) wastewater.reading, (3) core.repair_request when the
--   system ran abnormal. Three network round trips, NOT atomic, and a
--   failing step (3) was swallowed with console.warn (:240-243) — a repair
--   request could silently never exist for an abnormal day. This function
--   performs all three inserts in ONE Postgres transaction and lets any
--   failure propagate to the caller (honesty requirement of the WO).
--
-- Design notes:
--   * SECURITY DEFINER — the function bypasses RLS to write across the
--     carbon/wastewater/core schemas in one transaction, so it MUST gate
--     itself on the same role check the transactional RLS policies use
--     (core.fn_is_staff_or_admin(), OAUTH-4 helper). Fail-closed: any
--     non-staff/admin caller gets 42501 before any write.
--   * SET search_path pinned (house pattern from OAUTH-3) so a hostile
--     schema object cannot hijack unqualified resolution; every object is
--     schema-qualified anyway.
--   * auth.uid()-based role lookup inside fn_is_staff_or_admin reads the
--     request JWT (GUC), which is unaffected by SECURITY DEFINER — the gate
--     sees the real caller.
--   * The BEFORE INSERT trigger on wastewater.reading (the same trigger
--     PostgREST inserts hit) still fills reported_by/location defaults;
--     audit + threshold triggers keep firing unchanged.
--   * Payload fields map column-by-column so table defaults keep working and
--     unknown keys are ignored. `abnormal_cause`,
--     `electricity_meter_value`, `electricity_consumption` are NOT columns
--     of wastewater.reading — they are split off here exactly as the old
--     client code did.
--   * Returns the created reading row (id + trigger-derived fields) as
--     jsonb — the same shape the old `.select("*").single()` returned.
--   * Rollback (schema-only, see WO): DROP FUNCTION IF EXISTS
--     public.fn_create_reading(jsonb);
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

    -- 1) carbon.reading (electricity) — same fixed P5b meter as before.
    --    The unique (meter_id, reading_date) constraint aborts the whole
    --    transaction on a duplicate day, same as the old client path.
    IF v_meter_value IS NOT NULL THEN
        INSERT INTO carbon.reading
            (meter_id, reading_date, meter_value, consumption, location_id, input_source)
        VALUES (
            'b6be4c99-c83a-43f7-b765-72286cc78bd0',
            (p_payload->>'reading_date')::date,
            v_meter_value::numeric,
            v_consumption::numeric,
            NULL, -- location defaults via trigger (unchanged)
            'manual'
        )
        RETURNING id INTO v_carbon_id;
    END IF;

    -- 2) wastewater.reading — column-by-column extraction (NULL for
    --    missing/empty payload keys; table defaults + BEFORE INSERT trigger
    --    behave exactly as under the old PostgREST insert).
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
    'ENV-PERF-001 (2026-11-12) — atomic daily-reading create: carbon.reading (when electricity present) + wastewater.reading + core.repair_request (when abnormal_cause set) in ONE transaction, returning the created reading row as jsonb. SECURITY DEFINER, gated on core.fn_is_staff_or_admin() (fail-closed, same role gate as the transactional RLS policies). Replaces the 3 sequential client-side inserts whose repair_request failures were swallowed.';

GRANT EXECUTE ON FUNCTION public.fn_create_reading(jsonb) TO authenticated;
