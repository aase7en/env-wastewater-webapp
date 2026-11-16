-- ============================================================================
-- ENV-PARITY-P2-002 C1 — P2 REPAIR (D5 review, PR #208
-- issuecomment-6930206052): Update_ExpDate trigger no-ops when the master
-- expiry_date IS NULL even though the inspection carries a chem_exp_snapshot
-- → master never acquires an expiry via staff inspections. Fix: re-define
-- safety.trg_fn_extinguisher_update_expdate() so a NULL master expiry no
-- longer suppresses the bump. CREATE OR REPLACE only — migration
-- 20261116000005_parity_p2_002.sql is APPLIED and stays immutable.
-- ============================================================================
-- Lane: Track-Z (GLM) — repair commit on feat/env-parity-p2-002.
-- Finding: D5 P2 at 20261116000005_parity_p2_002.sql:341 (the
-- `v_current_expiry IS NULL OR ...` early return), deliberately pinned by
-- test_22 as a "three-valued ANY() transcription".

-- ─── COORDINATOR RULING (decision receipt — recorded verbatim) ────────────
-- "the D5's owner-ruling framing is resolved by delegated decision
-- (GLM-coordinator, standing owner instruction 2026-11-15; Terra
-- usage-limited until 2026-11-20, Jev contract-degenerate — receipts
-- already on file): AppSheet ground truth per D5's own evidence =
-- blank-date (1899 zero-date) FIRES the Update_ExpDate bot; therefore
-- honest parity = when master expiry_date IS NULL and the new inspection's
-- chem_exp_snapshot IS NOT NULL → SET the master expiry from it (a real
-- recorded value propagates; NULL chem_exp still no-ops; bump-later-only
-- otherwise unchanged). Never fabricate a date from nothing."

-- ─── WHY (AppSheet blank-date rationale) ──────────────────────────────────
-- The verbatim bot condition is
--   [_THISROW].[chem_exp] > ANY(SELECT(ข้อมูลถังดับเพลิง[วันที่หมดอายุ],
--                                 [QR_CODE] = [Row ID]))
-- AppSheet evaluates date comparisons with spreadsheet-serial semantics:
-- a blank date cell behaves as the spreadsheet zero-date (1899-12-30), so
-- ANY real chem_exp IS greater than a blank master date — the bot FIRES
-- and _Bot_Update_EXP seeds the master วันที่หมดอายุ from the inspection.
-- Migration 05's `IS NULL ⇒ no-op` early return transcribed SQL three-
-- valued NULL logic instead — NOT the AppSheet runtime behavior — and
-- silently under-populated exactly the extinguishers registered without
-- an expiry (expiry_date is optional in the lane's own admin entry UI,
-- and the master table is UNSEEDED). A NULL chem_exp still never fires:
-- blank ≈ blank(1899-12-30) is not strictly greater, and the guard below
-- short-circuits before any comparison.

-- ─── NEW SEMANTICS (post-fix) ─────────────────────────────────────────────
--   master expiry_date      NEW.chem_exp_snapshot   behavior
--   NULL                    non-NULL                SET (bump fires; latest-
--                                                   wins SET below decides
--                                                   the value written)
--   non-NULL                > expiry                SET (bump-later-only,
--                                                   unchanged)
--   non-NULL                <= expiry               no-op (unchanged)
--   any                     NULL                    no-op (guard, unchanged)
-- Latest-wins SET + deterministic tiebreak (inspection_date DESC,
-- created_at DESC, id DESC — D1-6) UNCHANGED. SECURITY DEFINER + pinned
-- search_path + fn_is_staff_or_admin defense-in-depth UNCHANGED.

-- ─── REACHABILITY NOTE (repairs D5 P3-1, migration 05 SQL:345-349) ────────
-- Migration 05's comment claimed "a latest row with NULL chem_exp sets
-- expiry NULL" was unreachable (the latest pick is NEW itself, whose
-- chem_exp is non-NULL past the guard). Post-fix the path IS reachable in
-- two real ways: (a) a backdated NEW (chem_exp > master) can pass the bump
-- guard while an even-later inspection_date row with a blank chem_exp wins
-- the latest pick; (b) within one transaction all rows share the
-- transaction-stable now() created_at, so the id-DESC tiebreak can hand
-- the pick to a higher-id blank-chem_exp row. Writing NULL is the VERBATIM
-- _Bot_Update_EXP behavior (the AppSheet SET writes the selected row's
-- chem_exp even when blank — AppSheet stores a blank, ENV stores NULL);
-- it is not a fabricated date. The function body comment below now
-- describes exactly this.

-- ─── PREFLIGHT (live-verified 2026-11-16 before apply) ───────────────────
--   to_regprocedure('safety.trg_fn_extinguisher_update_expdate()') → NOT
--   NULL; pg_get_functiondef contains the OLD condition
--   `IF v_current_expiry IS NULL OR NEW.chem_exp_snapshot <=
--   v_current_expiry THEN` (the exact defect); trg_extinguisher_update_
--   expdate exists AFTER INSERT on safety.extinguisher_inspection
--   executing this function; baselines unchanged (907/9/4/48/0/0).

-- ─── POST-VERIFY (rollback-smoke, all inside BEGIN…ROLLBACK) ──────────────
--   1. null-expiry-SETS — master expiry NULL + staff INSERT with non-NULL
--      chem_exp_snapshot ⇒ master expiry becomes that value (was: no-op).
--   2. null-chem_exp-NOOPS — master expiry non-NULL + INSERT with NULL
--      chem_exp_snapshot ⇒ master expiry unchanged (guard).
--   3. bump-later-only REGRESSION — non-NULL master expiry + chem_exp <=
--      expiry ⇒ no-op; chem_exp > expiry ⇒ bump (test_21 unchanged).
--   Pinned permanently by scripts/test_parity_p2_002_extinguisher_
--   inspection.py: test_22 (inverted pin: NULL expiry + non-NULL chem_exp
--   ⇒ SET; NULL chem_exp ⇒ no-op), test_21 (bump-later-only + latest-wins
--   + backdated recompute), test_23 (tiebreak), test_24 (definer path).

-- ─── ROLLBACK (restores migration 05's exact function body) ───────────────
--   create or replace function safety.trg_fn_extinguisher_update_expdate()
--   … with the pre-fix bump guard
--      IF v_current_expiry IS NULL OR NEW.chem_exp_snapshot
--         <= v_current_expiry THEN RETURN NEW; END IF;
--   … (full body = migration 05 §4; the trigger itself needs no change —
--   it executes whatever body the function currently has). Verified
--   round-trip: re-applying this file is a no-op (idempotent).
-- ============================================================================

create or replace function safety.trg_fn_extinguisher_update_expdate()
returns trigger
language plpgsql
security definer
set search_path = safety, core, public
as $$
DECLARE
    v_current_expiry date;
    v_latest_chem    date;
BEGIN
    IF NOT core.fn_is_staff_or_admin() THEN
        RETURN NEW;  -- defense-in-depth: only staff/admin writes bump
    END IF;
    IF NEW.extinguisher_id IS NULL OR NEW.chem_exp_snapshot IS NULL THEN
        RETURN NEW;  -- NULL chem_exp ⇒ no-op (blank ≈ blank: bot never fires)
    END IF;

    SELECT expiry_date INTO v_current_expiry
      FROM safety.fire_extinguisher
     WHERE legacy_row_id = NEW.extinguisher_id;

    -- bump-later-only: NEW.chem_exp > master expiry (strictly greater).
    -- P2 FIX (20261116000006): a NULL master expiry no longer returns —
    -- AppSheet's blank master date behaves as the spreadsheet-serial
    -- zero-date (1899-12-30), so the verbatim bot condition
    -- [_THISROW].[chem_exp] > ANY(...) FIRES against a blank master date
    -- and a real recorded chem_exp propagates (coordinator ruling —
    -- decision receipt in this file's header + the lane handoff). At this
    -- point v_current_expiry may be NULL (⇒ the comparison below is NULL
    -- ⇒ falls through to the SET) or a real date (⇒ strictly-greater
    -- gate). NULL chem_exp never reaches here (guard above).
    IF v_current_expiry IS NOT NULL AND NEW.chem_exp_snapshot <= v_current_expiry THEN
        RETURN NEW;
    END IF;

    -- Master expiry ← chem_exp of the latest inspection (MAX
    -- inspection_date; NEW is already visible AFTER INSERT). Deterministic
    -- tiebreak per D1-6. A latest row with NULL chem_exp sets expiry NULL
    -- — verbatim _Bot_Update_EXP behavior (the AppSheet SET writes the
    -- selected row's chem_exp even when blank). REACHABLE post-fix — see
    -- the header's reachability note (backdated-later-row or same-
    -- transaction id-DESC tie can put a blank-chem_exp row in the pick);
    -- this corrects migration 05's "unreachable" comment (D5 P3-1).
    SELECT chem_exp_snapshot INTO v_latest_chem
      FROM safety.extinguisher_inspection
     WHERE extinguisher_id = NEW.extinguisher_id
     ORDER BY inspection_date DESC, created_at DESC, id DESC
     LIMIT 1;

    UPDATE safety.fire_extinguisher
       SET expiry_date = v_latest_chem
     WHERE legacy_row_id = NEW.extinguisher_id;

    RETURN NEW;
END;
$$;

drop trigger if exists trg_extinguisher_update_expdate on safety.extinguisher_inspection;
create trigger trg_extinguisher_update_expdate
    after insert on safety.extinguisher_inspection
    for each row
    execute function safety.trg_fn_extinguisher_update_expdate();

notify pgrst, 'reload schema';
