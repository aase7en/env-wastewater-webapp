-- ENV-BUILDING-REPAIR-001 C1 — D3b CONTRACT migration.
--
-- Authored WITH the expand migration so ONE exact-SHA review (D8) and
-- ONE merge (D9) cover both files. LIVE application is deferred to
-- HUMAN_AUTHORIZATION_REQUIRED Gate 2, only after: new client deployed
-- (D9), positive quiescence evidence (D9b), and BOTH-class orphan
-- reconciliation. The applied file must be the reviewed merged-main
-- blob.
--
-- One transaction (R3 rounds 5–8):
--   (1) ACCESS EXCLUSIVE locks on both tables;
--   (2) re-assert clause 1 in BOTH directions (typed abort on any
--       violation — self-defending against the preflight race);
--   (3) install the DURABLE bidirectional direct-write ban triggers:
--       direct true-set outside the RPC and direct linked true→false
--       are both rejected with pinned SQLSTATE '42501' and greppable
--       messages (captured durably in the PostgreSQL server log; an
--       in-transaction audit insert would roll back with the rejected
--       statement). There is NO true→false route: clause-7
--       cancellation preserves the true flag and the link, changing
--       only the repair lifecycle status.

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
-- Writes made from inside core.create_building_repair (trigger depth >
-- 1) pass: the RPC IS the invariant-preserving path. Direct REST/view
-- writes (trigger depth 1) that would set the flag true — on either
-- INSERT or UPDATE — or flip a linked round's flag away from true are
-- rejected. Nothing here, and nothing the RPC exposes, ever clears the
-- flag on a linked round: cancellation changes the repair lifecycle
-- status only.

CREATE OR REPLACE FUNCTION building.fn_c1_guard_repair_needed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = building, core, public, pg_temp
AS $fn$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;  -- writes performed by core.create_building_repair
    END IF;

    IF TG_OP = 'INSERT' AND NEW.repair_needed IS TRUE THEN
        RAISE EXCEPTION
            'ENV_C1_BAN_DIRECT_TRUE_SET: direct inserts cannot set repair_needed — use core.create_building_repair'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.repair_needed IS NOT TRUE AND NEW.repair_needed IS TRUE THEN
            RAISE EXCEPTION
                'ENV_C1_BAN_DIRECT_TRUE_SET: direct updates cannot set repair_needed — use core.create_building_repair'
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

COMMENT ON FUNCTION building.fn_c1_guard_repair_needed() IS
    'ENV-BUILDING-REPAIR-001 C1 clause 5: durable bidirectional direct-'
    'write ban. Direct true-set and direct linked true→false both raise '
    'SQLSTATE 42501 with greppable ENV_C1_BAN_* messages (server-log '
    'capture; transactional audit of rolled-back writes is impossible '
    'by design). RPC-originated writes pass via trigger depth.';

COMMIT;
