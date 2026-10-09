-- ENV-BUILDING-REPAIR-001 C1 — D3a EXPAND migration (PURELY ADDITIVE).
--
-- Applied under HUMAN_AUTHORIZATION_REQUIRED Gate 1 BEFORE the new
-- client merges/deploys. The currently deployed client (direct insert
-- in building.ts) MUST keep working unchanged after this applies:
-- NO direct-write ban, no column becomes NOT NULL, no restrictive
-- CHECK touches building.inspection_round.
--
-- Clauses implemented (decision packet
-- docs/work-orders/ENV-BUILDING-REPAIR-001.md):
--   1/3. durable inspection_round -> repair_request link: nullable FK
--        ON DELETE RESTRICT, unique when non-null.
--   4.  single origin: at most one of reading_id / inspection_round_id.
--   5.  ONE transactional RPC with a stable client key (idempotent,
--        full-payload same-key comparison, concurrency-serialized,
--        atomic rollback). Exposed to PostgREST via a narrow public
--        SECURITY DEFINER facade (D8 R1 P1-1).
--   6.  reported_by derived server-side from auth.uid(); definer
--        search_path locked; revoke PUBLIC/anon; in-function role
--        check that explicitly rejects missing/inactive app_user rows
--        (D8 R1 P1-2 — NULL role must fail closed).
--   7.  creation with true creates exactly once; repeating returns the
--        same pair (idempotency incl. concurrent retries via a
--        transaction-local advisory lock on the client key, and an
--        existing-round path that validates the stored round and
--        compares the FULL payload before linking — D8 R1 P1-4/5/6).
--        Cancellation RPC provided here too (status change only; flag
--        and link preserved; actor/time/reason recorded — D8 R1 P1-9).
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

-- Clause 7 audit fields for explicit cancellation (additive).
ALTER TABLE core.repair_request
    ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE core.repair_request
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE core.repair_request
    ADD COLUMN IF NOT EXISTS cancelled_reason text;

-- ── Clause 4: single origin (reading XOR inspection, or neither) ────────

ALTER TABLE core.repair_request
    DROP CONSTRAINT IF EXISTS chk_repair_single_origin;
ALTER TABLE core.repair_request
    ADD CONSTRAINT chk_repair_single_origin CHECK (
        NOT (reading_id IS NOT NULL AND inspection_round_id IS NOT NULL)
    );

-- ── RPC transaction-local trusted marker helpers ────────────────────────
--
-- The CONTRACT migration's ban triggers honor ONLY this marker (set by
-- the sanctioned RPCs around their DML, transaction-local so it dies
-- with the transaction). Defined in EXPAND so the RPC can self-wrap
-- from day one; harmless before the triggers exist.

CREATE OR REPLACE FUNCTION core.c1_rpc_begin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_temp AS $fn$
BEGIN
    PERFORM set_config('env_c1.rpc_write', 'on', true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION core.c1_rpc_begin() FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION core.c1_rpc_end()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_temp AS $fn$
BEGIN
    PERFORM set_config('env_c1.rpc_write', '', true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION core.c1_rpc_end() FROM PUBLIC, anon;

-- ── Clauses 5/6/7: the one invariant-preserving server command ──────────

CREATE OR REPLACE FUNCTION core.create_building_repair_inner(
    p_client_key      uuid,   -- stable client-generated round UUID (retry key)
    p_round_date      date,
    p_location_id     uuid,
    p_inspector       text,
    p_findings        text,
    p_cause           text,   -- explicit nonblank repair cause (clause 2)
    p_equipment_id    uuid DEFAULT NULL,
    p_round_type      text DEFAULT NULL,
    p_severity        text DEFAULT NULL,
    p_assigned_to     text DEFAULT NULL
)
RETURNS TABLE (inspection_round_id uuid, repair_request_id uuid, already_exists boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
DECLARE
    v_actor        uuid := auth.uid();
    v_role         text;
    v_round_id     uuid := p_client_key;
    v_repair_id    uuid;
    v_exists       boolean := FALSE;
    v_cause        text := btrim(p_cause);
    v_round_date   date := COALESCE(p_round_date, CURRENT_DATE);
    v_inspector    text := NULLIF(btrim(COALESCE(p_inspector, '')), '');
    v_findings     text := NULLIF(btrim(COALESCE(p_findings, '')), '');
    v_equipment    uuid := p_equipment_id;
    v_equip        uuid;
    v_round_type   text := COALESCE(NULLIF(btrim(COALESCE(p_round_type, '')), ''), 'monthly');
    v_severity     text := NULLIF(btrim(COALESCE(p_severity, '')), '');
    v_assigned_to  text := NULLIF(btrim(COALESCE(p_assigned_to, '')), '');
    r_round        building.inspection_round%ROWTYPE;
BEGIN
    -- Clause 6: server-side identity + in-function role check.
    -- D8 R1 P1-2: a caller with NO active app_user row gets v_role = NULL
    -- and must fail closed (NULL NOT IN (...) is NULL, not TRUE).
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'ENV_C1_AUTH_REQUIRED: caller must be signed in'
            USING ERRCODE = '42501';
    END IF;
    SELECT au.role INTO v_role
      FROM core.app_user au
     WHERE au.id = v_actor AND au.is_active;
    IF v_role IS NULL OR v_role NOT IN ('staff', 'admin') THEN
        RAISE EXCEPTION 'ENV_C1_ROLE_DENIED: active staff/admin app_user required'
            USING ERRCODE = '42501';
    END IF;

    -- Clause 2: explicit, separate repair cause (findings stay observations).
    IF v_cause IS NULL OR v_cause = '' THEN
        RAISE EXCEPTION 'ENV_C1_CAUSE_REQUIRED: explicit repair cause is mandatory'
            USING ERRCODE = '23514';
    END IF;
    IF p_location_id IS NULL THEN
        RAISE EXCEPTION 'ENV_C1_LOCATION_REQUIRED: a repair-needed round needs a durable location scope'
            USING ERRCODE = '23514';
    END IF;

    -- D8 R1 P1-4: serialize concurrent retries on the same client key.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_client_key::text, 0));

    -- Clause 7 + retry safety: same client key → same pair (full-payload
    -- comparison), or typed rejection.
    SELECT rr.id INTO v_repair_id
      FROM core.repair_request rr
     WHERE rr.inspection_round_id = p_client_key;

    IF v_repair_id IS NOT NULL THEN
        -- Linked pair already exists under this key.
        SELECT ir.* INTO r_round
          FROM building.inspection_round ir
         WHERE ir.id = p_client_key;
        SELECT cause, equipment_id INTO v_cause, v_equip FROM core.repair_request WHERE id = v_repair_id;
        -- D8 R1 P1-5 + D8 R3 P2-7: compare the COMPLETE canonical payload
        -- INCLUDING the existing repair's equipment association.
        IF r_round.round_date      IS DISTINCT FROM v_round_date
           -- D8 R4 P1-2: a NULL stored location on a linked pair is a
           -- RESTORABLE expand-window injury, not a payload conflict —
           -- the restoration below refills it from this retry's value.
           -- A non-NULL mismatch stays a conflict.
           OR (r_round.location_id IS NOT NULL
               AND r_round.location_id IS DISTINCT FROM p_location_id)
           OR r_round.inspector    IS DISTINCT FROM v_inspector
           OR r_round.findings     IS DISTINCT FROM v_findings
           OR v_cause              IS DISTINCT FROM btrim(p_cause)
           OR r_round.round_type   IS DISTINCT FROM v_round_type
           OR r_round.severity     IS DISTINCT FROM v_severity
           OR r_round.assigned_to  IS DISTINCT FROM v_assigned_to
           OR v_equip              IS DISTINCT FROM v_equipment
        THEN
            RAISE EXCEPTION 'ENV_C1_KEY_PAYLOAD_CONFLICT: this client key already exists with a different payload'
                USING ERRCODE = '23505';
        END IF;
        -- D8 R3 P1-4: class-II reconciliation — a linked repair whose
        -- inspection flag was flipped false by a direct writer during
        -- the expand window. The sanctioned RPC RESTORES the premise
        -- (clause 2) and the flag (clause 1) instead of returning with
        -- the invariant still broken.
        IF r_round.repair_needed IS NOT TRUE OR r_round.issues_found IS NOT TRUE
           OR r_round.location_id IS NULL THEN
            UPDATE building.inspection_round
               SET issues_found = TRUE,
                   repair_needed = TRUE,
                   location_id = COALESCE(location_id, p_location_id)
             WHERE id = p_client_key;
        END IF;
        RETURN QUERY SELECT v_round_id, v_repair_id, TRUE;
        RETURN;
    END IF;

    -- D8 R1 P1-6 + D8 R3 P1-3: the round exists WITHOUT a linked repair
    -- — either a plain old-client round, or exactly a Gate-2 class-I
    -- orphan (repair_needed=true written directly by the old client,
    -- which this RPC must be able to PROMOTE). Validate the payload and
    -- the premise, then link — promoting when flagged.
    SELECT ir.* INTO r_round
      FROM building.inspection_round ir
     WHERE ir.id = p_client_key;
    IF FOUND THEN
        IF r_round.round_date  IS DISTINCT FROM v_round_date
           OR (r_round.location_id IS NOT NULL
               AND r_round.location_id IS DISTINCT FROM p_location_id)
           OR r_round.inspector IS DISTINCT FROM v_inspector
           OR r_round.findings  IS DISTINCT FROM v_findings
           OR r_round.round_type IS DISTINCT FROM v_round_type
           OR r_round.severity IS DISTINCT FROM v_severity
           OR r_round.assigned_to IS DISTINCT FROM v_assigned_to
        THEN
            RAISE EXCEPTION 'ENV_C1_KEY_PAYLOAD_CONFLICT: existing round under this client key has a different payload'
                USING ERRCODE = '23505';
        END IF;
        -- Class-I promotion only from a sound premise (clause 2): the
        -- orphan must have issues_found=true and a location, exactly as
        -- a fresh RPC-created round would.
        IF r_round.issues_found IS NOT TRUE OR r_round.location_id IS NULL THEN
            RAISE EXCEPTION 'ENV_C1_PROMOTION_PREMISE: existing round % lacks the issues_found premise or durable location — fix the row before promotion', p_client_key
                USING ERRCODE = '23514';
        END IF;
        UPDATE building.inspection_round
           SET issues_found = TRUE, repair_needed = TRUE
         WHERE id = p_client_key;
    ELSE
        INSERT INTO building.inspection_round AS ir (
            id, round_date, location_id, inspector, findings,
            issues_found, repair_needed, recorded_by,
            round_type, severity, assigned_to
        ) VALUES (
            v_round_id, v_round_date, p_location_id,
            v_inspector, v_findings, TRUE, TRUE, v_actor,
            v_round_type, v_severity, v_assigned_to
        );
    END IF;

    INSERT INTO core.repair_request (
        inspection_round_id, equipment_id, reading_id, reported_by, cause, status
    ) VALUES (
        v_round_id, v_equipment, NULL, v_actor, v_cause, 'open'
    )
    RETURNING id INTO v_repair_id;

    RETURN QUERY SELECT v_round_id, v_repair_id, FALSE;
END;
$fn$;

CREATE OR REPLACE FUNCTION core.create_building_repair(
    p_client_key      uuid,
    p_round_date      date,
    p_location_id     uuid,
    p_inspector       text,
    p_findings        text,
    p_cause           text,
    p_equipment_id    uuid DEFAULT NULL,
    p_round_type      text DEFAULT NULL,
    p_severity        text DEFAULT NULL,
    p_assigned_to     text DEFAULT NULL
)
RETURNS TABLE (inspection_round_id uuid, repair_request_id uuid, already_exists boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
DECLARE
    v_ins uuid;
    v_rep uuid;
    v_dup boolean;
BEGIN
    PERFORM core.c1_rpc_begin();
    BEGIN
        SELECT * INTO v_ins, v_rep, v_dup FROM core.create_building_repair_inner(
            p_client_key, p_round_date, p_location_id, p_inspector, p_findings,
            p_cause, p_equipment_id, p_round_type, p_severity, p_assigned_to
        );
        PERFORM core.c1_rpc_end();
    EXCEPTION WHEN OTHERS THEN
        PERFORM core.c1_rpc_end();
        RAISE;
    END;
    RETURN QUERY SELECT v_ins, v_rep, v_dup;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION core.create_building_repair_inner(uuid, date, uuid, text, text, text, uuid, text, text, text)
    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION core.create_building_repair(uuid, date, uuid, text, text, text, uuid, text, text, text)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION core.create_building_repair(uuid, date, uuid, text, text, text, uuid, text, text, text)
    TO authenticated;

COMMENT ON FUNCTION core.create_building_repair_inner(uuid, date, uuid, text, text, text, uuid, text, text, text) IS
    'ENV-BUILDING-REPAIR-001 C1 (clause 5): body of the single transactional, '
    'idempotent, invariant-preserving path creating one inspection round '
    'and its at-most-one aggregate linked repair. Stable client key = '
    'client-generated round UUID; concurrent retries serialize on an '
    'advisory lock; same key + same FULL payload = idempotent return; '
    'different payload under the same key = rejected; an existing plain '
    'round under the key is promoted only if unflagged and payload-equal.';

-- ── Clause 7: explicit cancellation RPC (status change only) ────────────
--
-- Cancellation preserves the true flag and the historical link; it
-- records actor (auth.uid()), time, and reason; the audit trigger
-- captures the committed UPDATE.

CREATE OR REPLACE FUNCTION core.cancel_building_repair(
    p_repair_id uuid,
    p_reason    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
DECLARE
    v_actor  uuid := auth.uid();
    v_role   text;
    v_reason text := NULLIF(btrim(COALESCE(p_reason, '')), '');
    v_linked uuid;
    v_loc    uuid;
BEGIN
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'ENV_C1_AUTH_REQUIRED: caller must be signed in'
            USING ERRCODE = '42501';
    END IF;
    SELECT au.role INTO v_role
      FROM core.app_user au
     WHERE au.id = v_actor AND au.is_active;
    IF v_role IS NULL OR v_role NOT IN ('staff', 'admin') THEN
        RAISE EXCEPTION 'ENV_C1_ROLE_DENIED: active staff/admin app_user required'
            USING ERRCODE = '42501';
    END IF;
    IF v_reason IS NULL THEN
        RAISE EXCEPTION 'ENV_C1_CANCEL_REASON_REQUIRED: explicit cancellation reason is mandatory'
            USING ERRCODE = '23514';
    END IF;

    SELECT rr.inspection_round_id INTO v_linked
      FROM core.repair_request rr
     WHERE rr.id = p_repair_id;
    IF v_linked IS NULL THEN
        RAISE EXCEPTION 'ENV_C1_NOT_LINKED: % is not a linked repair', p_repair_id
            USING ERRCODE = '23514';
    END IF;

    -- D8 R3 P1-1: this UPDATE is RPC-owned DML — run it under the
    -- transaction-local marker so the contract-phase lifecycle guard
    -- recognizes it as the sanctioned path (otherwise every UI
    -- cancellation would be rejected post-Gate-2).
    PERFORM core.c1_rpc_begin();
    BEGIN
        UPDATE core.repair_request
           SET status = 'cancelled',
               resolved_at = COALESCE(resolved_at, now()),
               cancelled_by = v_actor,
               cancelled_at = now(),
               cancelled_reason = v_reason
         WHERE id = p_repair_id;
        -- D8 R4 P1-3 + R5 P1-3: a class-II row (flag flipped false
        -- during the expand window) must not survive cancellation with
        -- the invariant broken — and the Gate-2 assertions alone would
        -- not catch a stripped PREMISE. Restore the complete trusted
        -- premise the RPC originally wrote (repair_needed + issues_found
        -- true); a missing location_id cannot be fabricated — reject for
        -- explicit owner reconciliation instead. The marker lets these
        -- UPDATEs pass the contract guards; any RAISE rolls the whole
        -- cancellation back (no half-applied state).
        -- D8 R6 P2: lock the linked row FIRST, then validate the premise
        -- under that lock — a concurrent direct writer can no longer slip
        -- a NULL location between the check and the flag restoration.
        UPDATE building.inspection_round ir
           SET repair_needed = TRUE, issues_found = TRUE
         WHERE ir.id = v_linked
           AND (ir.repair_needed IS NOT TRUE OR ir.issues_found IS NOT TRUE)
        RETURNING ir.location_id INTO v_loc;
        IF NOT FOUND THEN
            SELECT ir.location_id INTO v_loc
              FROM building.inspection_round ir
             WHERE ir.id = v_linked
               FOR UPDATE;
        END IF;
        IF v_loc IS NULL THEN
            RAISE EXCEPTION
                'ENV_C1_CANCEL_PREMISE: linked round % lost its durable location during the expand window — explicit owner reconciliation required before cancellation', v_linked
                USING ERRCODE = '23514';
        END IF;
        PERFORM core.c1_rpc_end();
    EXCEPTION WHEN OTHERS THEN
        PERFORM core.c1_rpc_end();
        RAISE;
    END;
    -- The linked inspection keeps repair_needed = true and the link.
END;
$fn$;

REVOKE EXECUTE ON FUNCTION core.cancel_building_repair(uuid, text)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION core.cancel_building_repair(uuid, text)
    TO authenticated;

COMMENT ON FUNCTION core.cancel_building_repair(uuid, text) IS
    'ENV-BUILDING-REPAIR-001 C1 (clause 7): explicit cancellation of a '
    'linked repair — lifecycle status change ONLY; the inspection flag '
    'and the durable link are preserved; actor/time/reason recorded; '
    'committed UPDATE captured by the audit trigger.';

-- ── PostgREST exposure: narrow public facades (D8 R1 P1-1) ──────────────
--
-- Supabase exposes only `public` to PostgREST. The client therefore
-- cannot call core.* directly. These thin SECURITY DEFINER facades
-- forward 1:1 to the core functions (same signature, same errors);
-- PUBLIC/anon revoked; authenticated granted.

CREATE OR REPLACE FUNCTION public.create_building_repair(
    p_client_key uuid, p_round_date date, p_location_id uuid,
    p_inspector text, p_findings text, p_cause text, p_equipment_id uuid DEFAULT NULL,
    p_round_type text DEFAULT NULL, p_severity text DEFAULT NULL, p_assigned_to text DEFAULT NULL
)
RETURNS TABLE (inspection_round_id uuid, repair_request_id uuid, already_exists boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
BEGIN
    RETURN QUERY SELECT * FROM core.create_building_repair(
        p_client_key, p_round_date, p_location_id,
        p_inspector, p_findings, p_cause, p_equipment_id,
        p_round_type, p_severity, p_assigned_to
    );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.create_building_repair(uuid, date, uuid, text, text, text, uuid, text, text, text)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_building_repair(uuid, date, uuid, text, text, text, uuid, text, text, text)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_building_repair(
    p_repair_id uuid, p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
BEGIN
    PERFORM core.cancel_building_repair(p_repair_id, p_reason);
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.cancel_building_repair(uuid, text)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_building_repair(uuid, text)
    TO authenticated;

-- ── Clause 10: recreate the facade so PostgREST sees the link ──────────
--
-- D8 R3 P1-5: the facade is READ-ONLY. All repair creation/mutation
-- goes through the RPCs (clause 5); direct table/view DML is revoked
-- from the start of the rollout (expand window included), so no
-- caller — pending or otherwise — can forge inspection links while
-- the contract-phase triggers do not yet exist. The old client only
-- writes building.inspection_round (plain rounds), which stays allowed.

CREATE OR REPLACE VIEW public.repair_request
    WITH (security_invoker = on) AS
    SELECT * FROM core.repair_request;

GRANT SELECT ON public.repair_request TO authenticated;

-- D8 R3 P1-5 + R4 P1-1 + R5 P1-1/P1-2: narrow the table privileges.
-- The base schema granted table-level INSERT/UPDATE/DELETE to
-- authenticated; PostgreSQL privileges are ADDITIVE, so a column-level
-- REVOKE alone cannot subtract that. The correct shape is: revoke the
-- table grants, then re-grant ONLY the columns the manual-repair
-- workflows use (INSERT without the link — manual and reading-origin
-- seeding; UPDATE status/resolved_at — resolve). The link column and
-- the RPC-owned cancellation fields stay ungranted, so NO caller can
-- forge an inspection link or spoof cancellation before the contract
-- triggers exist. DELETE is not re-granted at all: no client workflow
-- deletes repairs, and clause 8 protects linked provenance (an
-- RPC-created linked repair therefore cannot be deleted during the
-- expand window either). security_invoker views check these same
-- base-table column privileges, so the facade is gated identically.
REVOKE INSERT, UPDATE, DELETE ON core.repair_request FROM authenticated;
REVOKE ALL ON core.repair_request FROM anon, PUBLIC;
GRANT INSERT (id, equipment_id, reading_id, reported_by, cause, status,
              created_at, resolved_at)
    ON core.repair_request TO authenticated;
GRANT UPDATE (equipment_id, reading_id, reported_by, cause, status,
              created_at, resolved_at)
    ON core.repair_request TO authenticated;

-- D8 R6 P1-1: column grants cannot distinguish linked from unlinked
-- rows, so status/resolved_at must stay writable for MANUAL rows while
-- staying spoof-proof on LINKED rows during the expand window. Install
-- the linked-row lifecycle guard HERE (marker-honoring, same shape the
-- contract migration will re-assert); direct PATCHes of status,
-- resolved_at, reported_by, created_at, or the cancellation fields on a
-- LINKED repair raise from Gate 1 onward — cancellation is
-- cancel-RPC-only from day one. Manual (unlinked) rows keep the full
-- granted workflow.

CREATE OR REPLACE FUNCTION core.fn_c1_guard_repair_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, building, public, pg_temp
AS $fn$
BEGIN
    IF current_setting('env_c1.rpc_write', true) = 'on' THEN
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

COMMIT;
