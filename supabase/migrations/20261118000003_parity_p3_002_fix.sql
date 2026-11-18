-- ============================================================================
-- ENV-PARITY-P3-002 FIX — the guarded config-mapping seed, corrected
-- (house *_fix convention: a NEW migration, never an edit of the applied
-- 20261118000002_parity_p3_002.sql).
-- ============================================================================
-- WHY THIS EXISTS (live receipt, 2026-11-18): statement [37/38] of
-- 20261118000002 failed 42703 — `column "source_provenance" of relation
-- "master" does not exist`. The seed block had assumed the P2.1/P3.1
-- seed-lineage column, but chemical.master predates that convention
-- (migration 20260719000006: id, name, cas_no, hazard_class, unit,
-- reorder_point, current_balance, is_active, created_at + the additive
-- legacy_item_id) and the WO §3-3 boundary forbids ANY further column on
-- chemical.master beyond legacy_item_id. The mapping row therefore seeds
-- into the EXISTING columns only; its provenance is carried verbatim HERE
-- and in the migration header (a config-reference row, not operational
-- data — the R2 P3-3 ref-6014 pin stays in the source text).
--
-- GUARD: WHERE NOT EXISTS legacy_item_id = '0c0e6a47' (idempotent — safe
-- to re-send; asserted by scripts/test_parity_p3_002_inventory.py).
--
-- ROLLBACK: DELETE FROM chemical.master WHERE legacy_item_id = '0c0e6a47'
-- AND NOT EXISTS (SELECT 1 FROM chemical.movement WHERE master_id = chemical.master.id);
-- NOTIFY pgrst, 'reload schema';
-- ============================================================================

-- >>> SEED-BLOCK-START
INSERT INTO chemical.master
    (name, unit, legacy_item_id)
SELECT
    'คลอรีน 10%',
    'kg',
    '0c0e6a47'
WHERE NOT EXISTS (
    SELECT 1 FROM chemical.master WHERE legacy_item_id = '0c0e6a47'
);
-- <<< SEED-BLOCK-END

-- PROVENANCE (recorded here verbatim — chemical.master has no provenance
-- column and the WO §3-3 boundary forbids adding one): this is the ONE
-- reference/config mapping row of ENV-PARITY-P3-002 — the verbatim
-- AppSheet `Item ID` of คลอรีน 10%, anchor `=[Item ID] = "0c0e6a47"` at
-- REF 6014 (the Only-if condition of the manual `Deduct Chlorine Stock`
-- action, ref 6011-6031; fence 6013). chemical.inventory_lot itself seeds
-- ZERO rows — SOURCE_UNAVAILABLE (the Inventory tab is absent from every
-- enumerated source, 2026-11-18; seed NOTHING, never fabricated).

-- house notify trailer (P2.3 lesson)
NOTIFY pgrst, 'reload schema';
