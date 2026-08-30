-- GARBAGE-CORE-001 — canonical waste classification + carbon data honesty.
--
-- Defects being closed (see docs/work-orders/GARBAGE-CORE-001.md):
--   1. The unified rollup's waste branch read LEGACY `c.waste_type` and its
--      CASE fell every non-infectious/non-recyclable value — including
--      `chemical`, missing, and unknown text — through to the GENERAL-waste
--      factor, fabricating carbon numbers that do not exist.
--   2. Nothing constrained `segregation_type`, so arbitrary/unsupported
--      classifications could be written.
--
-- Repairs (additive only; no data is read, written, backfilled, or cleaned):
--   A. Idempotent CHECK constraint on the canonical field
--      `garbage.collection_log.segregation_type`:
--      NULL (unclassified) or exactly one of general/infectious/recyclable/
--      chemical. DROP IF EXISTS + ADD revalidates existing rows, so the
--      migration FAILS CLOSED if unexpected production data would violate
--      the contract — it never silently cleans or reclassifies rows.
--      (Read-only live check 2026-08-31 found the table empty; no backfill
--      is authorized or needed.)
--   B. CREATE OR REPLACE VIEW carbon.v_unified_co2e with the waste branch
--      reading CANONICAL `c.segregation_type` (never legacy waste_type):
--        general    -> 'kg (general_waste)'
--        infectious -> 'kg (infectious_waste)'
--        recyclable -> 'kg (recyclable)'
--        chemical / NULL / unsupported -> ELSE NULL unit -> no factor match
--          -> kg_co2e NULL (UNAVAILABLE). NEVER falls back to general.
--      Source label uses COALESCE(segregation_type, 'unclassified') so a
--      missing classification is labeled waste_unclassified, not
--      waste_general. Every other UNION branch is reproduced verbatim from
--      the merged 20260830000000_fuel_core_001_rollup_safety.sql view
--      (including the FUEL-CORE-001 enum-side-to-text fuel join); emission
--      factor rows/values are untouched.
--
-- Track Z scope (SQL only). Implementation owner does NOT apply this
-- migration; the lead applies the merged migration via the supported
-- Management API path and live-verifies read-only.

-- A. Canonical value constraint (idempotent; fail-closed on dirty data).
ALTER TABLE garbage.collection_log
    DROP CONSTRAINT IF EXISTS collection_log_segregation_type_check;
ALTER TABLE garbage.collection_log
    ADD CONSTRAINT collection_log_segregation_type_check
    CHECK (segregation_type IS NULL OR segregation_type IN ('general','infectious','recyclable','chemical'));

-- B. Rollup hardening (idempotent).
CREATE OR REPLACE VIEW carbon.v_unified_co2e AS
-- Scope 2 — Electricity (existing carbon.reading, joined with EF)
SELECT
    date_trunc('month', r.reading_date)::date AS month,
    2::smallint AS scope,
    'electricity'::text AS source,
    COALESCE(SUM(r.consumption) * ef.kg_co2e, 0) AS kg_co2e,
    COUNT(r.id) AS row_count
FROM carbon.reading r
LEFT JOIN carbon.emission_factor ef
    ON ef.source = 'electricity'
    AND ef.unit = 'kWh'
    AND ef.effective_from <= date_trunc('month', r.reading_date)
GROUP BY 1, ef.kg_co2e

UNION ALL

-- Scope 1 — Fuel dispense (litres × factor by fuel_type)
SELECT
    date_trunc('month', d.log_date)::date AS month,
    1::smallint AS scope,
    d.fuel_type::text AS source,
    COALESCE(SUM(d.litres), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(d.id) AS row_count
FROM fuel.dispense_log d
LEFT JOIN carbon.emission_factor ef
    ON ef.source::text = d.fuel_type
    AND ef.unit = 'L'
    AND ef.effective_from <= date_trunc('month', d.log_date)
WHERE d.litres IS NOT NULL
GROUP BY 1, d.fuel_type, ef.kg_co2e

UNION ALL

-- Scope 1 — Garden equipment fuel (2-stroke, treated as gasoline)
SELECT
    date_trunc('month', w.round_date)::date AS month,
    1::smallint AS scope,
    'garden_fuel'::text AS source,
    COALESCE(SUM(w.fuel_used_l), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(w.id) AS row_count
FROM garden.work_round w
LEFT JOIN carbon.emission_factor ef
    ON ef.source = 'gasoline'
    AND ef.unit = 'L'
    AND ef.effective_from <= date_trunc('month', w.round_date)
WHERE w.fuel_used_l IS NOT NULL
GROUP BY 1, ef.kg_co2e

UNION ALL

-- Scope 3 — Waste disposal (kg × factor by CANONICAL segregation_type)
-- chemical / NULL / unsupported: unit NULL -> no factor -> kg_co2e NULL
-- (UNAVAILABLE). Missing classification labels waste_unclassified, never
-- waste_general. Legacy waste_type is intentionally NOT read here.
SELECT
    date_trunc('month', c.log_date)::date AS month,
    3::smallint AS scope,
    ('waste_' || COALESCE(c.segregation_type, 'unclassified'))::text AS source,
    COALESCE(SUM(c.weight_kg), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(c.id) AS row_count
FROM garbage.collection_log c
LEFT JOIN carbon.emission_factor ef
    ON ef.source = 'other'
    AND ef.unit = CASE c.segregation_type
        WHEN 'general' THEN 'kg (general_waste)'
        WHEN 'infectious' THEN 'kg (infectious_waste)'
        WHEN 'recyclable' THEN 'kg (recyclable)'
        ELSE NULL
    END
    AND ef.effective_from <= date_trunc('month', c.log_date)
WHERE c.weight_kg IS NOT NULL
GROUP BY 1, c.segregation_type, ef.kg_co2e

UNION ALL

-- Scope 3 — Chemical movements out (kg × factor by chemical_name match)
SELECT
    date_trunc('month', m.movement_date)::date AS month,
    3::smallint AS scope,
    ('chemical_' || lower(split_part(m.chemical_name, ' ', 1)))::text AS source,
    COALESCE(SUM(m.quantity), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(m.id) AS row_count
FROM chemical.movement m
LEFT JOIN carbon.emission_factor ef
    ON ef.source = 'other'
    AND ef.unit = CASE
        WHEN m.chemical_name ILIKE '%chlorine%' OR m.chemical_name ILIKE '%คลอรีน%' THEN 'kg (chlorine)'
        WHEN m.chemical_name ILIKE '%alum%'    OR m.chemical_name ILIKE '%สารส้ม%'    THEN 'kg (alum)'
        WHEN m.chemical_name ILIKE '%kmno4%'   OR m.chemical_name ILIKE '%ด่างทับทิม%' THEN 'kg (kmno4)'
        ELSE 'kg (reagent_disposal)'
    END
    AND ef.effective_from <= date_trunc('month', m.movement_date)
WHERE m.direction = 'out' AND m.quantity IS NOT NULL
GROUP BY 1, m.chemical_name, ef.kg_co2e;
