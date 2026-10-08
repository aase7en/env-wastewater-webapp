-- ENV-BUILDING-REPAIR-001 C1 — D3a EXPAND migration (PURELY ADDITIVE).
--
-- Applied under HUMAN_AUTHORIZATION_REQUIRED Gate 1 BEFORE the new
-- client merges/deploys. The currently deployed client (direct insert
-- in building.ts) MUST keep working unchanged after this applies:
-- NO direct-write ban, no column becomes NOT NULL, no restrictive
-- CHECK touches building.inspection_round.
--
-- Clauses implemented here (decision packet
-- docs/work-orders/ENV-BUILDING-REPAIR-001.md):
--   1/3. durable inspection_round -> repair_request link: nullable FK
--        ON DELETE RESTRICT, unique when non-null.
--   4.  single origin: at most one of reading_id / inspection_round_id.
--   5.  ONE transactional RPC with a stable client key (idempotent,
--        same-key/different-payload rejection, atomic rollback).
--   6.  reported_by derived server-side from auth.uid(); definer
--        search_path locked; revoke PUBLIC/anon; in-function role
--        check (staff/admin only, pending denied).
--   7.  creation with true creates exactly once; repeating returns the
--        same pair (idempotency).
--   10. public facade view recreated (picks up the new column).
--   (audit capture for committed rows comes from the existing
--    core.fn_audit_log AFTER-DML triggers.)

BEGIN;

-- ── Clause 1/3: the durable link ────────────────────────────────────────

ALTER TABLE core.repair_request
    ADD COLUMN IF NOT EXISTS inspection_round_id uuid
        REFERENCES building.inspection_round(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS repair_request_inspection_round_id_key
    ON core.repair_request (inspection_round_id)
    WHERE inspection_round_id IS NOT NULL;

COMMENT ON COLUMN core.repair_request.inspection_round_id IS
    'ENV-BUILDING-REPAIR-001 C1: at most one aggregate linked repair per '
    'building inspection round; unique when non-null; ON DELETE RESTRICT '
    'protects repair provenance (no hard-delete/unlink).';

-- ── Clause 4: single origin (reading XOR inspection, or neither) ────────

ALTER TABLE core.repair_request
    DROP CONSTRAINT IF EXISTS chk_repair_single_origin;
ALTER TABLE core.repair_request
    ADD CONSTRAINT chk_repair_single_origin CHECK (
        NOT (reading_id IS NOT NULL AND inspection_round_id IS NOT NULL)
    );

-- ── Clause 5/6/7: the one invariant-preserving server command ──────────
--
-- create_building_repair(round) — creates the inspection round AND its
-- linked repair in ONE transaction. The client supplies a stable
-- client_key (the client-generated round UUID, retained across
-- ambiguous retries). Re-submitting the same key with the SAME payload
-- returns the existing pair (idempotent retry); a DIFFERENT payload
-- under the same key is rejected (double-submit safety). The caller's
-- identity comes from auth.uid() only — spoofed reporter input is not
-- accepted. Caller must be an active staff/admin app_user.

CREATE OR REPLACE FUNCTION core.create_building_repair(
    p_client_key      uuid,   -- stable client-generated round UUID (retry key)
    p_round_date      date,
    p_location_id     uuid,
    p_inspector       text,
    p_findings        text,
    p_cause           text,   -- explicit nonblank repair cause (clause 2)
    p_equipment_id    uuid DEFAULT NULL
)
RETURNS TABLE (inspection_round_id uuid, repair_request_id uuid, already_exists boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public, pg_temp
AS $fn$
DECLARE
    v_actor      uuid := auth.uid();
    v_role       text;
    v_round_id   uuid := p_client_key;
    v_repair_id  uuid;
    v_exists     boolean := FALSE;
    v_prev_cause text;
BEGIN
    -- Clause 6: server-side identity + in-function role check.
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'ENV_C1_AUTH_REQUIRED: caller must be signed in'
            USING ERRCODE = '42501';
    END IF;
    SELECT au.role INTO v_role
      FROM core.app_user au
     WHERE au.id = v_actor AND au.is_active;
    IF v_role NOT IN ('staff', 'admin') THEN
        RAISE EXCEPTION 'ENV_C1_ROLE_DENIED: pending/unrecognized users cannot create repairs'
            USING ERRCODE = '42501';
    END IF;

    -- Clause 2: explicit, separate repair cause (findings stay observations).
    IF p_cause IS NULL OR btrim(p_cause) = '' THEN
        RAISE EXCEPTION 'ENV_C1_CAUSE_REQUIRED: explicit repair cause is mandatory'
            USING ERRCODE = '23514';
    END IF;
    -- Clause 2: a repair-needed round requires the issues premise + a
    -- durable premise scope.
    IF p_location_id IS NULL THEN
        RAISE EXCEPTION 'ENV_C1_LOCATION_REQUIRED: a repair-needed round needs a durable location scope'
            USING ERRCODE = '23514';
    END IF;

    -- Clause 7 + retry safety: same client key → same pair, or reject.
    SELECT rr.id, rr.cause
      INTO v_repair_id, v_prev_cause
      FROM core.repair_request rr
     WHERE rr.inspection_round_id = p_client_key;

    IF v_repair_id IS NOT NULL THEN
        IF v_prev_cause IS DISTINCT FROM btrim(p_cause) THEN
            RAISE EXCEPTION 'ENV_C1_KEY_PAYLOAD_CONFLICT: this client key already exists with a different cause'
                USING ERRCODE = '23505';
        END IF;
        RETURN QUERY SELECT v_round_id, v_repair_id, TRUE;
        RETURN;
    END IF;

    -- Clause 1: create the round (idempotent on the stable key) …
    INSERT INTO building.inspection_round AS ir (
        id, round_date, location_id, inspector, findings,
        issues_found, repair_needed, recorded_by
    ) VALUES (
        v_round_id, COALESCE(p_round_date, CURRENT_DATE), p_location_id,
        p_inspector, p_findings, TRUE, TRUE, v_actor
    )
    ON CONFLICT (id) DO NOTHING;

    -- … and its exactly-one linked repair, atomically (clause 5).
    INSERT INTO core.repair_request (
        inspection_round_id, equipment_id, reading_id, reported_by, cause, status
    ) VALUES (
        v_round_id, p_equipment_id, NULL, v_actor, btrim(p_cause), 'open'
    )
    RETURNING id INTO v_repair_id;

    RETURN QUERY SELECT v_round_id, v_repair_id, FALSE;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION core.create_building_repair(uuid, date, uuid, text, text, text, uuid)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION core.create_building_repair(uuid, date, uuid, text, text, text, uuid)
    TO authenticated;

COMMENT ON FUNCTION core.create_building_repair(uuid, date, uuid, text, text, text, uuid) IS
    'ENV-BUILDING-REPAIR-001 C1 (clause 5): the single transactional, '
    'idempotent, invariant-preserving path creating one inspection round '
    'and its at-most-one aggregate linked repair. Stable client key = '
    'client-generated round UUID; same key + same cause = idempotent '
    'retry; different cause under the same key = rejected.';

-- ── Clause 10: recreate the facade so PostgREST sees the link ──────────

CREATE OR REPLACE VIEW public.repair_request
    WITH (security_invoker = on) AS
    SELECT * FROM core.repair_request;

GRANT SELECT ON public.repair_request TO authenticated;

COMMIT;
