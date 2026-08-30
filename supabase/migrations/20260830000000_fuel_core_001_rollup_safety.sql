-- FUEL-CORE-001 — carbon rollup hardening: remove the free-text fuel_type
-- → carbon.source_type enum cast from the unified rollup view.
--
-- Defect (FUEL-CORE-001 audit): the fuel branch joined
--     ef.source = d.fuel_type::carbon.source_type
-- so ANY legacy/imported non-enum value (e.g. 'ดีเซล', 'Diesel ', free text)
-- made the whole SELECT of carbon.v_unified_co2e fail with
-- "invalid input value for enum source_type", breaking every carbon
-- surface that reads the view.
--
-- Fix (data-honesty preserving): compare the ENUM side cast to text against
-- the stored text instead —
--     ef.source::text = d.fuel_type
-- An unknown/legacy value now simply matches no factor (kg_co2e NULL,
-- unknown stays unknown) instead of crashing or being reclassified.
-- Canonical values (diesel/gasoline/lpg/other) match exactly as before.
--
-- Scope guardrails:
--   * additive + idempotent (CREATE OR REPLACE VIEW) — no data is read,
--     written, cleaned, or reclassified by this migration;
--   * every other UNION branch is reproduced byte-for-byte from
--     20260719000002_v2_unified_rollup.sql (electricity Scope 2, garden
--     fuel, waste, chemical) — factor semantics unchanged;
--   * public.v_unified_co2e (20260719000010 REST exposure wrapper) selects
--     from this view and needs no change;
--   * import-side validation lives in the frontend adapter
--     (frontend/src/lib/import-adapters/fuel.ts) — missing stays NULL,
--     non-canonical tokens are rejected before any REST write.
--
-- Track Z scope (SQL only). Do NOT add emission-factor data here.

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

-- Scope 3 — Waste disposal (kg × factor by waste_type)
SELECT
    date_trunc('month', c.log_date)::date AS month,
    3::smallint AS scope,
    ('waste_' || COALESCE(c.waste_type, 'general'))::text AS source,
    COALESCE(SUM(c.weight_kg), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(c.id) AS row_count
FROM garbage.collection_log c
LEFT JOIN carbon.emission_factor ef
    ON ef.source = 'other'
    AND ef.unit = CASE c.waste_type
        WHEN 'infectious' THEN 'kg (infectious_waste)'
        WHEN 'recyclable' THEN 'kg (recyclable)'
        ELSE 'kg (general_waste)'
    END
    AND ef.effective_from <= date_trunc('month', c.log_date)
WHERE c.weight_kg IS NOT NULL
GROUP BY 1, c.waste_type, ef.kg_co2e

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
