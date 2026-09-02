-- FOOD-CORE-001 — canonical food categorical constraints (data honesty).
--
-- Defect being closed (see docs/work-orders/FOOD-CORE-001.md):
--   The food import adapter fabricated real categorical values when source
--   data was missing (blank/missing sample_type → 'น้ำประปา', blank/missing
--   test_type → 'total_coliform') and accepted arbitrary text, while the DB
--   had no constraints — the same data-honesty defect class already closed
--   for fuel (FUEL-CORE-001) and garbage (GARBAGE-CORE-001): unknown ≠ a
--   real category.
--
-- Repair (additive only; no data is read, written, backfilled, or cleaned):
--   Idempotent CHECK constraints on `food.lab_test.sample_type` and
--   `food.lab_test.test_type`, mirroring the canonical value sets of the
--   FoodPage selects and the A-Wiki food entity (the 4-value schema comment
--   on sample_type is stale documentation — the page/A-Wiki 5-value set is
--   the operative contract):
--     sample_type: NULL (unknown) or exactly one of
--       น้ำประปา / น้ำบาดาล / อาหาร / ผัก / น้ำแข็ง
--     test_type:   NULL (unknown) or exactly one of
--       total_coliform / e_coli / fecal_coliform
--   DROP IF EXISTS + ADD revalidates existing rows, so the migration FAILS
--   CLOSED if unexpected production data would violate the contract — it
--   never silently cleans or reclassifies rows. (Read-only live snapshot
--   2026-08-03 recorded food.lab_test as empty; no backfill is authorized
--   or needed.)
--
-- Reagent policy: the AFTER INSERT trigger trg_decrement_reagent /
--   food.fn_decrement_reagent → chemical.movement cross-domain decrement is
--   deliberately NOT touched — it stays DORMANT (no app/import write path
--   sets reagent_used; FoodInput omits it). Hardening it is a separate
--   backlog/decision surface recorded in the work order, not this slice.
--
-- Track Z scope (SQL only). Implementation owner does NOT apply this
-- migration; the lead applies the merged migration via the supported
-- Management API path and live-verifies read-only.

-- Canonical value constraints (idempotent; fail-closed on dirty data).
ALTER TABLE food.lab_test
    DROP CONSTRAINT IF EXISTS lab_test_sample_type_check;
ALTER TABLE food.lab_test
    ADD CONSTRAINT lab_test_sample_type_check
    CHECK (sample_type IS NULL OR sample_type IN ('น้ำประปา','น้ำบาดาล','อาหาร','ผัก','น้ำแข็ง'));

ALTER TABLE food.lab_test
    DROP CONSTRAINT IF EXISTS lab_test_test_type_check;
ALTER TABLE food.lab_test
    ADD CONSTRAINT lab_test_test_type_check
    CHECK (test_type IS NULL OR test_type IN ('total_coliform','e_coli','fecal_coliform'));
