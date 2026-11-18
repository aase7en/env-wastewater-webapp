-- ============================================================================
-- ENV-PARITY-P3-002 C1 — chemical inventory lots (Lot/MFG/EXP per ถัง) +
-- FEFO chlorine auto-deduction via chemical.movement (AppSheet parity
-- Phase 3, lane P3.2, v1.10.0).
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P3-002.md
-- (plan §6 Phase 3 row P3.2 line 246 VERBATIM). Handoff:
-- docs/ai/handoffs/ENV-PARITY-P3-002-GLM.md. Predecessors: P1.1–P1.7,
-- P2.1–P2.6 (PHASE 2 COMPLETE), P3.1 (v1.9.0 — core.item exists, 0 rows).
--
-- DELIVERS (the ONE authorized supabase write of this lane):
--   1. chemical.inventory_lot — the per-ถัง lot receipt table translating
--      reference 12 §3.28 `Inventory` (ref 4679-4751)
--   2. chemical.inventory_lot_deduction — the deduction ledger whose
--      (source_table, source_id) UNIQUE index IS the idempotency pin
--      (WO §3-2 "deduction index"); a retried save NEVER double-deducts
--   3. chemical.inventory_lot_allocation — the slice-level lot↔movement
--      join; the FEFO-inverse reversal provenance (the D2 P3-1 ruling)
--   4. chemical.master + ONE additive nullable UNIQUE column legacy_item_id
--      (the AppSheet `Item ID` mapping; NO other change to master/movement
--      — movement keeps its 16 columns; balance_after stays trigger-owned
--      by chemical.fn_recompute_balance, migration 20260719000006)
--   5. RPC chemical.fn_deduct_chlorine_stock — SECURITY INVOKER (P2.2
--      binding), FEFO expiry ASC NULLS LAST, fail-closed (skipped + typed
--      shortfall, stock NEVER negative, usage rows NEVER blocked),
--      idempotent via the ledger UNIQUE, typed jsonb result incl. the
--      R2 P3-2 'already-deducted' flag
--   6. RPC chemical.fn_revoke_chlorine_deduction — the D2 P3-1 reversal
--      ruling: ON usage-row delete → compensate with opposite
--      direction='in' movement rows tagged to the source (provenance
--      reversal note), restoring lot stock via FEFO-inverse
--   7. public.inventory_lot — security_invoker REST façade (only `public`
--      is PostgREST-reachable; the P2.4 D1-6 lesson: SELECT * expands its
--      column list AT CREATION) + grants
--   8. guarded seed: the ONE config mapping row (reference data, P1.3
--      precedent) — chemical.master.legacy_item_id = '0c0e6a47', the
--      verbatim AppSheet action anchor at REF 6014 (R2 P3-3 citation pin;
--      the action body is ref 6011-6031, the 6013 fence line names the
--      Only-if condition whose verbatim `=[Item ID] = "0c0e6a47"` sits at
--      ref 6014)
--   9. chemical.inventory_lot seeds ZERO rows — SOURCE_UNAVAILABLE (WO §2:
--      the P3.1 same-day 2026-11-18 enumeration; the Inventory tab is
--      ABSENT from all sources; seed NOTHING, never fabricated)
--  10. house `notify pgrst` trailer (the P2.3 lesson — refresh the
--      PostgREST schema cache after DDL)
--
-- ─── NAME MAPPINGS (verbatim AppSheet §3.28 → house snake_case) ──────────
--   Inventory ID (Text Key, UNIQUEID())  → legacy_id text UNIQUE
--   Item ID (Text)                       → item_legacy_id text (verbatim
--                                          8-hex lineage preserved even
--                                          when core.item lacks the row —
--                                          the P2.4 equipment_legacy
--                                          precedent) + item_id uuid FK →
--                                          core.item (parity binding,
--                                          NULL-safe: core.item is 0 rows
--                                          at base with an HONEST empty
--                                          picker, never a fabricated list)
--   DateTime (initial NOW())             → receipt_date date NOT NULL
--                                          DEFAULT CURRENT_DATE
--   Amount (Number)                      → amount_received numeric(10,3)
--                                          NOT NULL CHECK (> 0); unit =
--                                          the master's unit (kg) — D1-7:
--                                          ถัง→kg is the receipt-time
--                                          entry choice of the admin, the
--                                          ถัง count rides in note/UI
--                                          fields, NO invented conversion
--   Amount_unit_deduct (Number)          → amount_deducted numeric(10,3)
--                                          NOT NULL DEFAULT 0; remaining =
--                                          received − deducted ≥ 0 enforced
--                                          by the named CHECK
--                                          inventory_lot_remaining_nonnegative
--                                          — NEVER negative stock
--   Total_deduct (Number)                → NO observed producer formula in
--                                          ref 12 (D1-4) — recorded,
--                                          never persisted as a separate
--                                          column; amount_deducted IS the
--                                          running total
--   LotNo (Text)                         → lot_no text
--   MFG (Text at source)                 → mfg_date date NULL — date-typed
--                                          in ENV per the พ.ศ.-parse house
--                                          rule; unparseable legacy text
--                                          stays NULL, NEVER coerced
--   EXP (Text)                           → expiry_date date NULL (FEFO key)
--   LifeTime (Time, TIMENOW())           → lifetime_note text NULL —
--                                          verbatim-compatibility carrier,
--                                          recorded not drive-logic
--   Chlorine_realyDiv10 / Div4 (Virtual) → NOT persisted — plan §4 line
--                                          152 pins both AS-IS "คิวรี
--                                          'ค่าใช้คลอรีนล่าสุดของวัน' —
--                                          ไม่ต้องเก็บซ้ำ" (the P2.4
--                                          virtual-column precedent); they
--                                          stay query-derived displays
--   _RowNumber (system)                  → not persisted
--   AppSheet ground truth for automation: the action `Deduct Chlorine
--   Stock` (ref 6011-6031) is MANUAL on Item 0c0e6a47 ONLY, floored at 0;
--   the bot `(disabled) Auto Deduct Chlorine Stock` (ref 6350-6353) is
--   DISABLED at source — there is NO live lot-level allocation automation
--   to replicate. Auto-deduction in ENV is an ENV-new capability built
--   honestly per owner answer B6 (2026-11-15, plan §5.3-3: "เปิด
--   ถ้าทำได้จริง"), recorded as such, never presented as a transcription.
--
-- ─── DEDUCTION SEMANTICS (WO §4 pinned; D2 fixtures assert each) ─────────
--   Triggers (D1-3 BOTH-IN, divergence recorded): (a) wastewater — after a
--   successful fn_create_reading save where chlorine_used > 0, the deducted
--   quantity = คลอรีนน้ำที่ใช้จริง (the ÷SWITCH chlorine_used_real of
--   wastewater.v_reading_meter_chain, migration 20261115140000); (b) water
--   supply — after a successful water_supply.daily_check save where
--   chlorine_usage > 0, the quantity = chlorine_usage_realy (the ÷(1+9)
--   spec-driven value of water_supply.v_daily_check_chain per A3).
--   AppSheet NEVER deducted from the water-supply flow — this is the B6
--   intent extension, adjudicated explicitly, never silently reconciled.
--   Allocation = FEFO by expiry_date ASC NULLS LAST, then receipt_date,
--   then created_at. One chemical.movement direction='out' row PER consumed
--   slice; the lot's amount_deducted advances per slice; the deduction
--   ledger records (source_table, source_id) UNIQUE so a retried save is
--   an honest 'already-deducted' idempotent success (R2 P3-2), and the
--   allocation rows give the reversal its exact FEFO-inverse provenance.
--   Fail-closed: total allocated ≤ Σ lot remainings; the shortfall stays
--   UNDEDUCTED and is surfaced in the typed result; no lot/master balance
--   ever goes negative (CHECKs + the RPC guard); the usage save itself is
--   never blocked by stock state (data honesty: unknown ≠ zero — no lot /
--   no mapping config = skipped + flagged, NEVER deducted-as-0, NEVER
--   stock fabricated; latest ≠ live — deduction reads receipted lots,
--   never sensor telemetry). Editing a usage row does NOT retroactively
--   re-deduct (WO §4-4). REVERSAL (D2 P3-1 ruling): deleting a usage row
--   that HAD been deducted would orphan its direction='out' movements and
--   overstate consumption forever — both delete paths are real app
--   surfaces (supabase-queries.ts deleteReading + water-supply.ts
--   deleteWaterSupplyDaily), and the compensation is exact, not heuristic
--   (the allocation ledger records each slice), so the honest rule is
--   IMPLEMENTED: fn_revoke_chlorine_deduction writes opposite direction='in'
--   movements tagged purpose='auto-reversal <source>:<id>' with the
--   provenance reversal note, restores each lot's amount_deducted in
--   FEFO-inverse order, flips the ledger to 'reversed', and is idempotent
--   ('nothing-to-reverse' otherwise; a skipped deduction reverses to
--   restored_total = 0 — nothing was taken). Re-deduction of edited usage
--   rows remains a future claim, recorded never silent.
--
-- ─── RLS POSTURE (D1-5 amended — recorded) ───────────────────────────────
--   The WO proposed the strict house master pattern (ALL writes admin).
--   AMENDED for inventory_lot UPDATE only: the deduction RPC is SECURITY
--   INVOKER (the non-negotiable P2.2 binding) and it must fire on saves by
--   STAFF users too, so UPDATE (the amount_deducted advance the RPC
--   performs) is staff-or-admin; receipt INSERT and lot DELETE stay
--   admin-only. The honesty floor is held by the named CHECKs regardless
--   of writer; the admin UI never hand-edits amount_deducted. Ledger +
--   allocation tables use the chemical.movement posture (staff-or-admin
--   ALL — bookkeeping rows written only via the RPC).
--
-- ─── ROLLBACK (schema-only; run as separate script behind the same gate)
--   DROP FUNCTION IF EXISTS chemical.fn_revoke_chlorine_deduction(text, uuid, date);
--   DROP FUNCTION IF EXISTS chemical.fn_deduct_chlorine_stock(text, uuid, numeric, date);
--   DROP VIEW IF EXISTS public.inventory_lot;
--   REVOKE ALL ON public.inventory_lot FROM authenticated;
--   DROP TABLE IF EXISTS chemical.inventory_lot_allocation;
--   DROP TABLE IF EXISTS chemical.inventory_lot_deduction;
--   DROP TABLE IF EXISTS chemical.inventory_lot;
--   DROP INDEX IF EXISTS chemical.chemical_master_legacy_item_id_unique;
--   ALTER TABLE chemical.master DROP COLUMN IF EXISTS legacy_item_id;
--   NOTIFY pgrst, 'reload schema';
--   (The seed row added to chemical.master is reference data — the
--   rollback leaves it; remove manually if a full reversion is required:
--   DELETE FROM chemical.master WHERE legacy_item_id = '0c0e6a47'
--   AND NOT EXISTS (SELECT 1 FROM chemical.movement WHERE master_id = chemical.master.id);)
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1) chemical.inventory_lot — the per-ถัง lot receipt (§3.28 mapping above)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chemical.inventory_lot (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id        uuid REFERENCES chemical.master(id),
    item_id          uuid REFERENCES core.item(id),
    item_legacy_id   text,
    receipt_date     date NOT NULL DEFAULT CURRENT_DATE,
    lot_no           text,
    mfg_date         date,
    expiry_date      date,
    lifetime_note    text,
    amount_received  numeric(10,3) NOT NULL DEFAULT 0
                     CONSTRAINT inventory_lot_amount_positive CHECK (amount_received > 0),
    amount_deducted  numeric(10,3) NOT NULL DEFAULT 0
                     CONSTRAINT inventory_lot_amount_deducted_nonnegative CHECK (amount_deducted >= 0),
    source_provenance text NOT NULL DEFAULT 'manual admin entry (ENV v1.10.0)',
    legacy_id        text UNIQUE,
    note             text,
    recorded_by      uuid,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT inventory_lot_remaining_nonnegative
               CHECK (amount_deducted <= amount_received)
);

COMMENT ON TABLE chemical.inventory_lot IS
    'ENV-PARITY-P3-002 — AppSheet §3.28 Inventory (ref 4679-4751) as per-ถัง lot receipts. remaining = amount_received - amount_deducted, never negative (named CHECKs). FEFO order = expiry_date ASC NULLS LAST, receipt_date, created_at. Chlorine_realyDiv10/Div4 virtuals are query-derived displays (plan §4 line 152) — never stored.';

ALTER TABLE chemical.inventory_lot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_lot_select ON chemical.inventory_lot;
CREATE POLICY inventory_lot_select ON chemical.inventory_lot
    FOR SELECT TO authenticated
    USING (core.fn_is_staff_or_admin());

DROP POLICY IF EXISTS inventory_lot_insert_admin ON chemical.inventory_lot;
CREATE POLICY inventory_lot_insert_admin ON chemical.inventory_lot
    FOR INSERT TO authenticated
    WITH CHECK (core.fn_is_admin());

DROP POLICY IF EXISTS inventory_lot_update ON chemical.inventory_lot;
CREATE POLICY inventory_lot_update ON chemical.inventory_lot
    FOR UPDATE TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

DROP POLICY IF EXISTS inventory_lot_delete_admin ON chemical.inventory_lot;
CREATE POLICY inventory_lot_delete_admin ON chemical.inventory_lot
    FOR DELETE TO authenticated
    USING (core.fn_is_admin());

-- ───────────────────────────────────────────────────────────────────────────
-- 2) chemical.inventory_lot_deduction — the deduction ledger = the
--    (source_table, source_id) UNIQUE idempotency index (WO §3-2)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chemical.inventory_lot_deduction (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table   text NOT NULL
                   CONSTRAINT inventory_lot_deduction_source_domain
                   CHECK (source_table IN ('wastewater.reading', 'water_supply.daily_check')),
    source_id      uuid NOT NULL,
    master_id      uuid REFERENCES chemical.master(id),
    deducted_total numeric(10,3) NOT NULL DEFAULT 0,
    shortfall      numeric(10,3) NOT NULL DEFAULT 0,
    status         text NOT NULL DEFAULT 'deducted'
                   CONSTRAINT inventory_lot_deduction_status_domain
                   CHECK (status IN ('deducted', 'partial', 'skipped', 'reversed')),
    note           text,
    recorded_by    uuid,
    created_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT inventory_lot_deduction_source_unique UNIQUE (source_table, source_id)
);

COMMENT ON TABLE chemical.inventory_lot_deduction IS
    'ENV-PARITY-P3-002 — one deduction attempt per usage row (UNIQUE source). status: deducted | partial (shortfall surfaced, fail-closed) | skipped (no stock / no mapping — never deducted-as-0) | reversed (P3-1 reversal). A retried save returns the honest already-deducted / already-skipped idempotent result (R2 P3-2).';

ALTER TABLE chemical.inventory_lot_deduction ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_lot_deduction_staff_all ON chemical.inventory_lot_deduction;
CREATE POLICY inventory_lot_deduction_staff_all ON chemical.inventory_lot_deduction
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- ───────────────────────────────────────────────────────────────────────────
-- 3) chemical.inventory_lot_allocation — slice-level lot↔movement join
--    (the FEFO-inverse reversal provenance)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chemical.inventory_lot_allocation (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deduction_id         uuid NOT NULL REFERENCES chemical.inventory_lot_deduction(id),
    lot_id               uuid NOT NULL REFERENCES chemical.inventory_lot(id),
    movement_id          uuid NOT NULL REFERENCES chemical.movement(id),
    quantity             numeric(10,3) NOT NULL
                         CONSTRAINT inventory_lot_allocation_quantity_positive CHECK (quantity > 0),
    reversed_movement_id uuid REFERENCES chemical.movement(id),
    reversed_at          timestamptz,
    created_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE chemical.inventory_lot_allocation IS
    'ENV-PARITY-P3-002 — one row per FEFO allocation slice: which lot was consumed by which direction=out movement, and (on reversal) the direction=in movement that restored it. chemical.movement itself gains NO new columns (WO §3-3) — this join is the source traceability the ledger needs.';

ALTER TABLE chemical.inventory_lot_allocation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_lot_allocation_staff_all ON chemical.inventory_lot_allocation;
CREATE POLICY inventory_lot_allocation_staff_all ON chemical.inventory_lot_allocation
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- ───────────────────────────────────────────────────────────────────────────
-- 4) chemical.master + ONE additive nullable UNIQUE column (the AppSheet
--    `Item ID` mapping — ref 6014). NO other change to master/movement.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE chemical.master
    ADD COLUMN IF NOT EXISTS legacy_item_id text;

-- Constraint-grade uniqueness via a UNIQUE index (idempotent DDL; Postgres
-- UNIQUE indexes allow multiple NULLs — the column stays optional).
CREATE UNIQUE INDEX IF NOT EXISTS chemical_master_legacy_item_id_unique
    ON chemical.master (legacy_item_id);

COMMENT ON COLUMN chemical.master.legacy_item_id IS
    'ENV-PARITY-P3-002 — the verbatim AppSheet `Item ID` (8-hex) mapping, e.g. 0c0e6a47 (คลอรีน 10%, the Deduct Chlorine Stock action anchor, ref 6014). Resolved by chemical.fn_deduct_chlorine_stock — config data, never hardcoded in application logic.';

-- ───────────────────────────────────────────────────────────────────────────
-- 5) chemical.fn_deduct_chlorine_stock — SECURITY INVOKER, FEFO,
--    fail-closed, idempotent (WO §3-2/§4; R2 P3-2 result shape pinned)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION chemical.fn_deduct_chlorine_stock(
    p_source_table  text,
    p_source_id     uuid,
    p_quantity      numeric,
    p_movement_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = chemical, public, core
AS $$
DECLARE
    v_master    chemical.master;
    v_existing  chemical.inventory_lot_deduction;
    v_lot       chemical.inventory_lot;
    v_mov       chemical.movement;
    v_ded_id    uuid;
    v_qty       numeric;
    v_needed    numeric;
    v_alloc     numeric;
    v_total     numeric := 0;
    v_shortfall numeric;
    v_allocated jsonb := '[]'::jsonb;
    v_slice     record;
BEGIN
    -- Guard: a deduction needs a positive quantity; zero/NULL usage is an
    -- honest no-op (the wiring never calls with ≤ 0 — double honesty).
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN jsonb_build_object(
            'status', 'noop',
            'deducted_total', 0,
            'shortfall', 0,
            'already_recorded', false,
            'allocated', '[]'::jsonb,
            'reason', 'p_quantity must be > 0 — nothing to deduct');
    END IF;
    v_qty := round(p_quantity, 3);

    -- Idempotency (R2 P3-2): ONE deduction attempt per usage row. A retried
    -- save NEVER double-deducts — it returns the truthful prior state.
    SELECT * INTO v_existing
    FROM chemical.inventory_lot_deduction d
    WHERE d.source_table = p_source_table AND d.source_id = p_source_id;
    IF v_existing.id IS NOT NULL THEN
        IF v_existing.status IN ('deducted', 'partial') THEN
            RETURN jsonb_build_object(
                'status', 'already-deducted',
                'deducted_total', v_existing.deducted_total,
                'shortfall', v_existing.shortfall,
                'already_recorded', true,
                'allocated', '[]'::jsonb,
                'reason', 'deduction already recorded for this usage row (idempotent — no second deduction)');
        END IF;
        RETURN jsonb_build_object(
            'status', 'already-skipped',
            'deducted_total', v_existing.deducted_total,
            'shortfall', v_existing.shortfall,
            'already_recorded', true,
            'allocated', '[]'::jsonb,
            'reason', 'a deduction attempt is already recorded without stock (idempotent — no second attempt)');
    END IF;

    -- Resolve the chlorine master by the verbatim AppSheet anchor (ref 6014)
    -- — config data, never hardcoded application logic.
    SELECT * INTO v_master
    FROM chemical.master m
    WHERE m.legacy_item_id = '0c0e6a47' AND m.is_active
    LIMIT 1;
    IF v_master.id IS NULL THEN
        INSERT INTO chemical.inventory_lot_deduction
            (source_table, source_id, deducted_total, shortfall, status, note, recorded_by)
        VALUES
            (p_source_table, p_source_id, 0, v_qty, 'skipped',
             'mapping config absent: no active chemical.master row with legacy_item_id ''0c0e6a47''',
             auth.uid());
        RETURN jsonb_build_object(
            'status', 'skipped',
            'deducted_total', 0,
            'shortfall', v_qty,
            'already_recorded', false,
            'allocated', '[]'::jsonb,
            'reason', 'mapping config absent: no active chemical.master row with legacy_item_id ''0c0e6a47''');
    END IF;

    -- FEFO allocation: earliest expiry first; NULL-expiry lots LAST (by
    -- receipt, then creation order). Only lots with remaining > 0. FOR
    -- UPDATE so concurrent saves cannot oversubscribe the same lot.
    FOR v_lot IN
        SELECT l.*
        FROM chemical.inventory_lot l
        WHERE l.master_id = v_master.id
          AND l.amount_deducted < l.amount_received
        ORDER BY l.expiry_date ASC NULLS LAST, l.receipt_date ASC, l.created_at ASC
        FOR UPDATE
    LOOP
        EXIT WHEN v_total >= v_qty;
        v_needed := v_qty - v_total;
        v_alloc  := LEAST(v_needed, v_lot.amount_received - v_lot.amount_deducted);
        CONTINUE WHEN v_alloc <= 0;

        -- ONE movement row per consumed slice; balance_after stays NULL —
        -- the existing fn_recompute_balance trigger (20260719000006) remains
        -- the balance authority.
        INSERT INTO chemical.movement
            (movement_date, chemical_name, direction, quantity, unit,
             purpose, recorded_by, note, lot_no, expiry_date, master_id)
        VALUES
            (p_movement_date, v_master.name, 'out', v_alloc, v_master.unit,
             'auto-deduct FEFO ' || p_source_table || ':' || p_source_id,
             auth.uid(), 'auto-deduct FEFO',
             v_lot.lot_no, v_lot.expiry_date, v_master.id)
        RETURNING * INTO v_mov;

        UPDATE chemical.inventory_lot
        SET amount_deducted = amount_deducted + v_alloc
        WHERE id = v_lot.id;

        v_total     := v_total + v_alloc;
        v_allocated := v_allocated || jsonb_build_object(
            'lot_id', v_lot.id, 'lot_no', v_lot.lot_no,
            'quantity', v_alloc, 'movement_id', v_mov.id);
    END LOOP;

    v_shortfall := v_qty - v_total;

    -- Fail-closed: no lot had any remaining stock → the usage row is NOT
    -- blocked, nothing is deducted-as-0, the shortfall is surfaced loudly.
    IF v_total <= 0 THEN
        INSERT INTO chemical.inventory_lot_deduction
            (source_table, source_id, master_id, deducted_total, shortfall, status, note, recorded_by)
        VALUES
            (p_source_table, p_source_id, v_master.id, 0, v_shortfall, 'skipped',
             'no lot has remaining stock — fail-closed, usage row unaffected',
             auth.uid());
        RETURN jsonb_build_object(
            'status', 'skipped',
            'deducted_total', 0,
            'shortfall', v_shortfall,
            'already_recorded', false,
            'allocated', '[]'::jsonb,
            'reason', 'no lot has remaining stock');
    END IF;

    INSERT INTO chemical.inventory_lot_deduction
        (source_table, source_id, master_id, deducted_total, shortfall, status, note, recorded_by)
    VALUES
        (p_source_table, p_source_id, v_master.id, v_total, v_shortfall,
         CASE WHEN v_shortfall > 0 THEN 'partial' ELSE 'deducted' END,
         'auto-deduct FEFO', auth.uid())
    RETURNING id INTO v_ded_id;

    -- Slice provenance: which lot ↔ which movement (the reversal's exact map).
    FOR v_slice IN
        SELECT * FROM jsonb_to_recordset(v_allocated)
        AS x(lot_id uuid, lot_no text, quantity numeric, movement_id uuid)
    LOOP
        INSERT INTO chemical.inventory_lot_allocation
            (deduction_id, lot_id, movement_id, quantity)
        VALUES
            (v_ded_id, v_slice.lot_id, v_slice.movement_id, v_slice.quantity);
    END LOOP;

    RETURN jsonb_build_object(
        'status', CASE WHEN v_shortfall > 0 THEN 'partial' ELSE 'deducted' END,
        'deducted_total', v_total,
        'shortfall', v_shortfall,
        'already_recorded', false,
        'allocated', v_allocated,
        'reason', NULL);
END;
$$;

COMMENT ON FUNCTION chemical.fn_deduct_chlorine_stock(text, uuid, numeric, date) IS
    'ENV-PARITY-P3-002 — SECURITY INVOKER (P2.2). FEFO expiry ASC NULLS LAST over chemical.inventory_lot; ONE direction=out chemical.movement per slice (balance stays fn_recompute_balance-owned); fail-closed skipped + typed shortfall when stock cannot serve the usage (never negative, usage never blocked); idempotent per (source_table, source_id) via chemical.inventory_lot_deduction UNIQUE; typed jsonb result {status, deducted_total, shortfall, already_recorded, allocated[], reason} — the R2 P3-2 already-deducted flag is the truthful idempotent success.';

GRANT EXECUTE ON FUNCTION chemical.fn_deduct_chlorine_stock(text, uuid, numeric, date) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 6) chemical.fn_revoke_chlorine_deduction — the D2 P3-1 reversal ruling:
--    ON usage-row delete → opposite direction='in' movement rows tagged to
--    the source (provenance reversal note), restoring lot stock via
--    FEFO-inverse. Idempotent + honest no-op when nothing was deducted.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION chemical.fn_revoke_chlorine_deduction(
    p_source_table  text,
    p_source_id     uuid,
    p_reversal_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = chemical, public, core
AS $$
DECLARE
    v_ded      chemical.inventory_lot_deduction;
    v_alloc    chemical.inventory_lot_allocation;
    v_lot      chemical.inventory_lot;
    v_mov      chemical.movement;
    v_master   chemical.master;
    v_restored numeric := 0;
    v_reversals jsonb := '[]'::jsonb;
BEGIN
    SELECT * INTO v_ded
    FROM chemical.inventory_lot_deduction d
    WHERE d.source_table = p_source_table AND d.source_id = p_source_id;

    -- Honest no-op: no recorded deduction (or already reversed) → nothing
    -- to restore, nothing fabricated.
    IF v_ded.id IS NULL OR v_ded.status = 'reversed' THEN
        RETURN jsonb_build_object(
            'status', 'nothing-to-reverse',
            'restored_total', 0,
            'allocated', '[]'::jsonb,
            'reason', 'no recorded deduction for this usage row');
    END IF;

    SELECT * INTO v_master FROM chemical.master WHERE id = v_ded.master_id;

    -- FEFO-inverse: unwind the allocation slices in reverse order (the last
    -- slice taken is the first restored), restoring each lot exactly what
    -- was deducted from it — never more, so the never-negative CHECKs hold
    -- by construction. A skipped deduction has no slices → restored 0.
    FOR v_alloc IN
        SELECT a.*
        FROM chemical.inventory_lot_allocation a
        WHERE a.deduction_id = v_ded.id AND a.reversed_at IS NULL
        ORDER BY a.created_at DESC, a.id DESC
    LOOP
        SELECT * INTO v_lot
        FROM chemical.inventory_lot
        WHERE id = v_alloc.lot_id
        FOR UPDATE;

        INSERT INTO chemical.movement
            (movement_date, chemical_name, direction, quantity, unit,
             purpose, recorded_by, note, lot_no, expiry_date, master_id)
        VALUES
            (p_reversal_date,
             COALESCE(v_master.name, 'คลอรีน 10%'),
             'in', v_alloc.quantity,
             COALESCE(v_master.unit, 'kg'),
             'auto-reversal ' || p_source_table || ':' || p_source_id,
             auth.uid(),
             'provenance reversal of deduction ' || v_ded.id ||
               ' (usage row deleted — lot stock restored, FEFO-inverse)',
             v_lot.lot_no, v_lot.expiry_date, v_ded.master_id)
        RETURNING * INTO v_mov;

        UPDATE chemical.inventory_lot
        SET amount_deducted = amount_deducted - v_alloc.quantity
        WHERE id = v_alloc.lot_id;

        UPDATE chemical.inventory_lot_allocation
        SET reversed_movement_id = v_mov.id, reversed_at = now()
        WHERE id = v_alloc.id;

        v_restored  := v_restored + v_alloc.quantity;
        v_reversals := v_reversals || jsonb_build_object(
            'lot_id', v_alloc.lot_id, 'lot_no', v_lot.lot_no,
            'quantity', v_alloc.quantity, 'movement_id', v_mov.id);
    END LOOP;

    UPDATE chemical.inventory_lot_deduction
    SET status = 'reversed',
        note = COALESCE(note, '') ||
               ' | reversed: usage row deleted — lot stock restored via provenance reversal'
    WHERE id = v_ded.id;

    RETURN jsonb_build_object(
        'status', 'reversed',
        'restored_total', v_restored,
        'allocated', v_reversals,
        'reason', NULL);
END;
$$;

COMMENT ON FUNCTION chemical.fn_revoke_chlorine_deduction(text, uuid, date) IS
    'ENV-PARITY-P3-002 D2 P3-1 ruling — usage-row deletion after a deduction is compensated with opposite direction=in movements tagged purpose=auto-reversal <source>:<id> carrying the provenance reversal note; lot amount_deducted is restored FEFO-inverse (exactly what was taken); ledger flips to reversed; idempotent (nothing-to-reverse otherwise).';

GRANT EXECUTE ON FUNCTION chemical.fn_revoke_chlorine_deduction(text, uuid, date) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 7) public.inventory_lot — security_invoker REST façade (only `public` is
--    PostgREST-reachable; the P2.4 D1-6 column-freeze lesson recorded)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.inventory_lot
WITH (security_invoker=on) AS
SELECT id, master_id, item_id, item_legacy_id, receipt_date, lot_no, mfg_date,
       expiry_date, lifetime_note, amount_received, amount_deducted,
       (amount_received - amount_deducted) AS amount_remaining,
       source_provenance, legacy_id, note, recorded_by, created_at
FROM chemical.inventory_lot;

COMMENT ON VIEW public.inventory_lot IS
    'ENV-PARITY-P3-002 — REST façade for the per-ถัง lot receipts (+ the derived amount_remaining). security_invoker: row access follows the caller via the chemical.inventory_lot RLS policies (SELECT staff-or-admin; INSERT/DELETE admin; UPDATE staff-or-admin for the RPC deduct path).';

GRANT SELECT ON public.inventory_lot TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chemical.inventory_lot TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chemical.inventory_lot_deduction TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chemical.inventory_lot_allocation TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 8) guarded seed — the ONE reference/config mapping row (P1.3 precedent).
--    REF 6014 verbatim anchor: `=[Item ID] = "0c0e6a47"` (the Only-if
--    condition of the manual `Deduct Chlorine Stock` action, ref 6011-6031;
--    fence 6013 — the R2 P3-3 citation pin). inventory_lot seeds ZERO rows:
--    SOURCE_UNAVAILABLE (WO §2 — the Inventory tab is absent from every
--    enumerated source, 2026-11-18; seed NOTHING, never fabricated; the
--    owner sheet-share obligation is carried durably).
-- >>> SEED-BLOCK-START
INSERT INTO chemical.master
    (name, unit, legacy_item_id, source_provenance, note)
SELECT
    'คลอรีน 10%',
    'kg',
    '0c0e6a47',
    'AppSheet ref 6014 verbatim (=[Item ID] = "0c0e6a47" — the Deduct Chlorine Stock action anchor, ref 6011-6031)',
    'ENV-PARITY-P3-002 config mapping (reference row; AppSheet Inventory sheet SOURCE_UNAVAILABLE — 0 lot rows seeded, never fabricated)'
WHERE NOT EXISTS (
    SELECT 1 FROM chemical.master WHERE legacy_item_id = '0c0e6a47'
);
-- <<< SEED-BLOCK-END

-- ───────────────────────────────────────────────────────────────────────────
-- 9) house notify trailer — refresh the PostgREST schema cache (P2.3 lesson)
-- ───────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
