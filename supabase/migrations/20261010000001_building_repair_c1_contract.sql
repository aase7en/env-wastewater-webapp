-- ENV-BUILDING-REPAIR-001 C1 — D3b CONTRACT migration.
--
-- Authored WITH the expand migration so ONE exact-SHA review (D8) and
-- ONE merge (D9) cover both files. LIVE application is deferred to
-- HUMAN_AUTHORIZATION_REQUIRED Gate 2, only after: new client deployed
-- (D9), positive quiescence evidence (D9b), and BOTH-class orphan
-- reconciliation. The applied file must be the reviewed merged-main
-- blob.
--
-- One transaction (R3 rounds 5–8 + D8 R1):
--   (1) ACCESS EXCLUSIVE locks on both tables;
--   (2) re-assert clause 1 in BOTH directions (typed aborts);
--   (3) install the DURABLE bidirectional direct-write ban triggers on
--       building.inspection_round — sanctioned RPC writes are marked
--       with a TRANSACTION-LOCAL trusted setting set by the RPC itself
--       (D8 R1 P1-3: pg_trigger_depth() does NOT distinguish
--       RPC-originated row writes — function-call depth does not raise
--       trigger depth — so depth was replaced by an explicit marker);
--   (4) repair-side provenance protection (D8 R1 P1-7): a linked
--       repair cannot be deleted or have its inspection_round_id
--       changed/unset outside the RPC path — direct REST mutation
--       raises with a pinned SQLSTATE, so a true inspection can never
--       be orphaned by a direct write.
--
-- Rejections use pinned SQLSTATE '42501' and greppable ENV_C1_BAN_*
-- messages (captured durably in the PostgreSQL server log; an
-- in-transaction audit insert would roll back with the rejected
-- statement). There is NO true→false route: clause-7 cancellation
-- (core.cancel_building_repair) preserves the flag and the link.

BEGIN;

LOCK TABLE building.inspection_round IN ACCESS EXCLUSIVE MODE;
LOCK TABLE core.repair_request IN ACCESS EXCLUSIVE MODE;

-- ── (2) Clause-1 invariant, both directions, under the locks ───────────

DO $assert$
DECLARE
    v_missing_repair integer;
    v_stale_flag     integer;
BEGIN
    SELECT count(*) INTO v_missing_repair
      FROM building.inspection_round ir
     WHERE ir.repair_needed IS TRUE
       AND NOT EXISTS (
            SELECT 1 FROM core.repair_request rr
             WHERE rr.inspection_round_id = ir.id
       );
    IF v_missing_repair > 0 THEN
        RAISE EXCEPTION
            'ENV_C1_ASSERT_CLASS_I: % inspection round(s) with repair_needed true have no linked repair — reconcile via the RPC promotion path before Gate 2',
            v_missing_repair
            USING ERRCODE = '23514';
    END IF;

    SELECT count(*) INTO v_stale_flag
      FROM core.repair_request rr
     WHERE rr.inspection_round_id IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM building.inspection_round ir
             WHERE ir.id = rr.inspection_round_id
               AND ir.repair_needed IS NOT TRUE
       );
    IF v_stale_flag > 0 THEN
        RAISE EXCEPTION
            'ENV_C1_ASSERT_CLASS_II: % linked repair(s) point at inspection round(s) whose flag is no longer true — disposition each under clause 7 (explicit cancellation or owner-directed restoration) before Gate 2',
            v_stale_flag
            USING ERRCODE = '23514';
    END IF;
END
$assert$;

-- ── (3) Durable bidirectional direct-write ban (clause 5) ──────────────
--
-- The sanctioned RPCs set a transaction-local marker
-- (env_c1.rpc_write = 'on') before their DML and clear it after; the
-- trigger honors ONLY that marker. Direct REST/view writes never set
-- it and are rejected in both directions.

CREATE OR REPLACE FUNCTION building.fn_c1_guard_repair_needed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = building, core, public, pg_temp
AS $fn$
BEGIN
    IF current_setting('env_c1.rpc_write', true) = 'on' THEN
        RETURN NEW;  -- sanctioned core.create_building_repair path
    END IF;

    IF TG_OP = 'INSERT' AND NEW.repair_needed IS TRUE THEN
        RAISE EXCEPTION
            'ENV_C1_BAN_DIRECT_TRUE_SET: direct inserts cannot set repair_needed — use the create_building_repair RPC'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.repair_needed IS NOT TRUE AND NEW.repair_needed IS TRUE THEN
            RAISE EXCEPTION
                'ENV_C1_BAN_DIRECT_TRUE_SET: direct updates cannot set repair_needed — use the create_building_repair RPC'
                USING ERRCODE = '42501';
        END IF;
        IF OLD.repair_needed IS TRUE AND NEW.repair_needed IS NOT TRUE THEN
            RAISE EXCEPTION
                'ENV_C1_BAN_DIRECT_TRUE_TO_FALSE: a linked round keeps repair_needed true — cancellation changes the repair lifecycle status, never the flag'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_c1_guard_repair_needed ON building.inspection_round;
CREATE TRIGGER trg_c1_guard_repair_needed
    BEFORE INSERT OR UPDATE OF repair_needed ON building.inspection_round
    FOR EACH ROW
    EXECUTE FUNCTION building.fn_c1_guard_repair_needed();

-- (Marker helpers core.c1_rpc_begin/c1_rpc_end and the self-wrapping
--  core.create_building_repair / core.cancel_building_repair are defined
--  in the EXPAND migration; the triggers above honor the marker.)

-- ── (4) Repair-side provenance protection (D8 R1 P1-7) ────────────────

CREATE OR REPLACE FUNCTION core.fn_c1_guard_repair_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
BEGIN
    IF current_setting('env_c1.rpc_write', true) = 'on' THEN
        RETURN NEW;  -- sanctioned RPC path (create/cancel)
    END IF;

    IF TG_OP = 'DELETE' AND OLD.inspection_round_id IS NOT NULL THEN
        RAISE EXCEPTION
            'ENV_C1_BAN_LINKED_REPAIR_DELETE: a linked repair cannot be deleted — its provenance is protected (clause 8)'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.inspection_round_id IS NOT NULL
       AND NEW.inspection_round_id IS DISTINCT FROM OLD.inspection_round_id THEN
        RAISE EXCEPTION
            'ENV_C1_BAN_LINKED_REPAIR_UNLINK: a linked repair''s inspection_round_id is immutable (clause 8)'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_c1_guard_repair_link ON core.repair_request;
CREATE TRIGGER trg_c1_guard_repair_link
    BEFORE DELETE OR UPDATE OF inspection_round_id ON core.repair_request
    FOR EACH ROW
    EXECUTE FUNCTION core.fn_c1_guard_repair_link();

-- Clause 6 RLS alignment: repair_request + inspection_round already
-- carry OAUTH-4 fn_is_staff_or_admin policies (verified on main); the
-- direct-write ban triggers above close the remaining provenance holes
-- on top of RLS.

COMMIT;
