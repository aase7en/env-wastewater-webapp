-- ============================================================================
-- ENV-PARITY-P3-002 FIX #2 — D5 repair: revoke locking + reversed-probe truth
-- (house *_fix convention: a NEW migration, never an edit of the applied
-- 20261118000002_parity_p3_002.sql / 20261118000003_parity_p3_002_fix.sql)
-- ============================================================================
-- WHY THIS EXISTS (D5 review @ 03e0f60, 2026-11-18 — CHANGES_REQUIRED):
--
-- P2-1 (revoke race, 000002:500-524): fn_revoke_chlorine_deduction read
-- the ledger probe without a lock and iterated the allocation slices
-- without FOR UPDATE. Two concurrent revokes for one deleted usage row
-- (two tabs / stale-row double-delete; the water-supply delete path has
-- no single-fire guard — only the wastewater undo-window has one) can
-- BOTH pass the status probe before either commits.
--
-- THE CONCURRENT DOUBLE-REVOKE SCENARIO, EXPLICITLY: staff A and staff B
-- both fire the delete (or both replay it) for usage row U whose deduction
-- D took slices from lot L, which ALSO carries a live deduction E from
-- another usage row. Without locks both transactions read D.status =
-- 'deducted', both see D's slices unreversed, and both subtract D's slice
-- quantity from L.amount_deducted → L is restored D's amount TWICE: E's
-- stock is silently eaten — an over-restore contradicting the pinned
-- "exact recorded slices, never more than was taken" (and invisible to
-- the UI, since the usage row is already gone). If L carries no other
-- deduction the loser instead dies on the named never-negative CHECK.
--
-- THE FIX (two lines, per the D5 ruling): the ledger probe takes
-- SELECT … FOR UPDATE — under READ COMMITTED the second revoke BLOCKS on
-- the locked row, and when the winner commits, the loser's locked re-read
-- (EvalPlanQual) observes status='reversed' → the honest
-- 'nothing-to-reverse' no-op. The allocation cursor additionally takes
-- FOR UPDATE in the SAME deterministic order (created_at DESC, id DESC)
-- for every revoker — mirroring the deduct function's consistent-order
-- lock discipline (uniform ORDER BY + FOR UPDATE, 000002:385-391) so any
-- two revokers of the same deduction queue in identical order (no
-- deadlock); belt-and-braces behind the ledger-row pin.
--
-- P3-3 (reversed mislabel, 000002:341-358): fn_deduct_chlorine_stock's
-- idempotency probe mapped ANY non-deducted/partial status — including
-- 'reversed' — to 'already-skipped' with reason "a deduction attempt is
-- already recorded without stock": a mislabel for a REVERSED deduction.
-- The probe now returns the truthful 'reversed' status (already_recorded
-- true, no re-deduction — idempotency unchanged: ONE attempt per usage
-- row; deletes compensate, edits never re-deduct).
--
-- REPLAY SAFETY: both bodies are late-bound CREATE OR REPLACE — on any
-- fresh `db reset`/`push` the statements re-apply cleanly over the
-- objects 000002 creates. (The recorded replay note stands: 000002's own
-- seed block is early-bound and fails 42703 on fresh replay; 000003
-- repairs the seed; THIS file references functions only.)
--
-- ROLLBACK: CREATE OR REPLACE both functions back to their 000002 bodies
-- — the probe branch + the two FOR UPDATE lines are the entire delta.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1) fn_revoke_chlorine_deduction — re-applied with the P2-1 locking
--    discipline (probe FOR UPDATE + allocation cursor FOR UPDATE, same
--    deterministic order). Semantics otherwise byte-identical to 000002.
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
    -- P2-1 (D5): FOR UPDATE pins the ledger row — concurrent revokes of
    -- the same usage row serialize here; the loser re-reads the winner's
    -- committed row under READ COMMITTED (EvalPlanQual) and falls into
    -- the honest nothing-to-reverse branch below instead of double-
    -- restoring the lot.
    SELECT * INTO v_ded
    FROM chemical.inventory_lot_deduction d
    WHERE d.source_table = p_source_table AND d.source_id = p_source_id
    FOR UPDATE;

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
    -- P2-1 (D5): FOR UPDATE locks the slices in the SAME deterministic
    -- order for every revoker (created_at DESC, id DESC) — consistent-order
    -- locking, the deduct function's discipline; no cross-revoker deadlock.
    FOR v_alloc IN
        SELECT a.*
        FROM chemical.inventory_lot_allocation a
        WHERE a.deduction_id = v_ded.id AND a.reversed_at IS NULL
        ORDER BY a.created_at DESC, a.id DESC
        FOR UPDATE
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
    'ENV-PARITY-P3-002 D2 P3-1 ruling + D5 P2-1 repair — usage-row deletion after a deduction is compensated with opposite direction=in movements tagged purpose=auto-reversal <source>:<id> carrying the provenance reversal note; lot amount_deducted is restored FEFO-inverse (exactly what was taken); ledger flips to reversed; idempotent (nothing-to-reverse otherwise); D5: the ledger probe and the allocation cursor take FOR UPDATE (consistent created_at DESC, id DESC order) so concurrent double-revokes serialize — the loser returns the honest nothing-to-reverse, never an over-restore.';

GRANT EXECUTE ON FUNCTION chemical.fn_revoke_chlorine_deduction(text, uuid, date) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) fn_deduct_chlorine_stock — re-applied with the P3-3 probe repair (a
--    reversed prior deduction now reports the truthful reversed status,
--    not the mislabeled already-skipped). Semantics otherwise byte-
--    identical to 000002 (FEFO, fail-closed, idempotent).
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
        -- P3-3 (D5): a REVERSED prior deduction is its own truthful state —
        -- never mislabeled as an unpaid skip.
        IF v_existing.status = 'reversed' THEN
            RETURN jsonb_build_object(
                'status', 'reversed',
                'deducted_total', v_existing.deducted_total,
                'shortfall', v_existing.shortfall,
                'already_recorded', true,
                'allocated', '[]'::jsonb,
                'reason', 'a prior deduction for this usage row is recorded as reversed (idempotent — no second attempt)');
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
    'ENV-PARITY-P3-002 — SECURITY INVOKER (P2.2). FEFO expiry ASC NULLS LAST over chemical.inventory_lot; ONE direction=out chemical.movement per slice (balance stays fn_recompute_balance-owned); fail-closed skipped + typed shortfall when stock cannot serve the usage (never negative, usage never blocked); idempotent per (source_table, source_id) via chemical.inventory_lot_deduction UNIQUE; D5 P3-3: a reversed prior deduction probes back the truthful reversed status (never the mislabeled already-skipped); typed jsonb result {status, deducted_total, shortfall, already_recorded, allocated[], reason} — the R2 P3-2 already-deducted flag is the truthful idempotent success.';

GRANT EXECUTE ON FUNCTION chemical.fn_deduct_chlorine_stock(text, uuid, numeric, date) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) house notify trailer — refresh the PostgREST schema cache (P2.3 lesson)
-- ───────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
