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
        -- D8 R2 P1-3: a TRUE round's clause-2 premise is durable too.
        -- Patching issues_found to false or stripping location_id while
        -- the flag stays true would leave an invalid repair-needed round;
        -- the trigger column list below makes these transitions reachable.
        IF NEW.repair_needed IS TRUE THEN
            IF NEW.issues_found IS NOT TRUE THEN
                RAISE EXCEPTION
                    'ENV_C1_BAN_PREMISE_STRIP: a repair-needed round must keep issues_found true (clause 2)'
                    USING ERRCODE = '42501';
            END IF;
            IF NEW.location_id IS NULL THEN
                RAISE EXCEPTION
                    'ENV_C1_BAN_PREMISE_STRIP: a repair-needed round must keep its durable location (clause 2)'
                    USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_c1_guard_repair_needed ON building.inspection_round;
CREATE TRIGGER trg_c1_guard_repair_needed
    BEFORE INSERT OR UPDATE OF repair_needed, issues_found, location_id
    ON building.inspection_round
    FOR EACH ROW
    EXECUTE FUNCTION building.fn_c1_guard_repair_needed();

-- (Marker helpers core.c1_rpc_begin/c1_rpc_end and the self-wrapping
--  core.create_building_repair / core.cancel_building_repair are defined
--  in the EXPAND migration; the triggers above honor the marker.)

-- ── (4) Repair-side provenance + protected-field protection ────────────

CREATE OR REPLACE FUNCTION core.fn_c1_guard_repair_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
BEGIN
    IF current_setting('env_c1.rpc_write', true) = 'on' THEN
        -- Sanctioned RPC path (create/cancel). BEFORE DELETE must return
        -- OLD (NEW is NULL there) or permitted deletions are suppressed.
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    IF TG_OP = 'INSERT' AND NEW.inspection_round_id IS NOT NULL THEN
        RAISE EXCEPTION
            'ENV_C1_BAN_LINKED_REPAIR_INSERT: direct inserts cannot set inspection_round_id — use the create_building_repair RPC (clause 5)'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'DELETE' AND OLD.inspection_round_id IS NOT NULL THEN
        RAISE EXCEPTION
            'ENV_C1_BAN_LINKED_REPAIR_DELETE: a linked repair cannot be deleted — its provenance is protected (clause 8)'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- D8 R3 P1-2: linking an UNLINKED repair to a round directly is
        -- the same forgery as a linked INSERT — the guard must cover
        -- NULL -> non-NULL too, not just changes from an existing link.
        IF OLD.inspection_round_id IS NULL
           AND NEW.inspection_round_id IS NOT NULL THEN
            RAISE EXCEPTION
                'ENV_C1_BAN_LINKED_REPAIR_INSERT: direct updates cannot attach inspection_round_id — use the create_building_repair RPC (clause 5)'
                USING ERRCODE = '42501';
        END IF;
        IF OLD.inspection_round_id IS NOT NULL THEN
            IF NEW.inspection_round_id IS DISTINCT FROM OLD.inspection_round_id THEN
                RAISE EXCEPTION
                    'ENV_C1_BAN_LINKED_REPAIR_UNLINK: a linked repair''s inspection_round_id is immutable (clause 8)'
                    USING ERRCODE = '42501';
            END IF;
            -- D8 R2 P1-2 + D8 R3 P1-6: lifecycle status, cancellation
            -- audit fields, reporter, and creation/resolution timestamps
            -- on a linked repair are RPC-owned; direct PATCHes bypass
            -- actor/reason and spoof provenance.
            IF NEW.status IS DISTINCT FROM OLD.status
               OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
               OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
               OR NEW.cancelled_reason IS DISTINCT FROM OLD.cancelled_reason
               OR NEW.reported_by IS DISTINCT FROM OLD.reported_by
               OR NEW.created_at IS DISTINCT FROM OLD.created_at
               OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at THEN
                RAISE EXCEPTION
                    'ENV_C1_BAN_LINKED_REPAIR_LIFECYCLE: a linked repair''s lifecycle, reporter, and timestamp fields change only via the sanctioned RPCs (clauses 6-7)'
                    USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_c1_guard_repair_link ON core.repair_request;
CREATE TRIGGER trg_c1_guard_repair_link
    BEFORE INSERT OR DELETE OR UPDATE
    ON core.repair_request
    FOR EACH ROW
    EXECUTE FUNCTION core.fn_c1_guard_repair_link();

-- ── (5) Clause 6 RLS alignment for core.repair_request (D8 R2 P1-1) ────
--
-- The pre-C1 policy on this table was the broad authenticated ALL
-- (true/true) shape from V1a — OAUTH-4 repolicied other transactional
-- tables but NOT this one (contrary to the R1 claim here). Pending
-- authenticated users could therefore mutate repairs through the public
-- facade. Drop every existing policy on the table and install the
-- canonical staff/admin gate (same helper as OAUTH-4, avoids the
-- app_user RLS recursion).

DO $repolicy$
DECLARE
    v_policy text;
BEGIN
    FOR v_policy IN
        SELECT policyname FROM pg_policies
         WHERE schemaname = 'core' AND tablename = 'repair_request'
    LOOP
        EXECUTE format('DROP POLICY %I ON core.repair_request', v_policy);
    END LOOP;
END
$repolicy$;

CREATE POLICY repair_request_staff_or_admin_rw ON core.repair_request
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

COMMENT ON POLICY repair_request_staff_or_admin_rw ON core.repair_request IS
    'ENV-BUILDING-REPAIR-001 C1 clause 6: repairs are staff/admin-only '
    '(pending denied) — replaces the broad authenticated ALL(true) policy '
    'that OAUTH-4 never covered for this table.';

COMMIT;
