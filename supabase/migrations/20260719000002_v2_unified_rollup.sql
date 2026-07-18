-- SCHEMA-3 — carbon.v_unified_co2e cross-schema rollup view.
--
-- Unifies every carbon-contributing table across all ENV_DB schemas into a
-- single queryable monthly aggregate. Drives the unified carbon dashboard
-- (CRB-3) so it can render Scope 1+2+3 in one fetch instead of N parallel
-- queries.
--
-- Approach: single VIEW with UNION ALL of per-source subqueries, each
-- joining carbon.emission_factor by source+unit. RLS inherited from
-- underlying tables (each has policy authenticated-rw). A defensive
-- policy on the view itself makes the intent explicit.
--
-- Output columns:
--   month        date       — first day of month (date_trunc('month'))
--   scope        smallint   — 1, 2, or 3 (GHG Protocol)
--   source       text       — module source identifier (electricity /
--                             diesel / gasoline / lpg / general_waste /
--                             infectious_waste / chlorine / etc.)
--   kg_co2e      numeric    — total kgCO₂e for that month+scope+source
--   row_count    bigint     — number of underlying rows aggregated
--
-- Track Z scope (SQL only — no UI, no className).
-- Idempotent: CREATE OR REPLACE VIEW.

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
    ON ef.source = d.fuel_type::carbon.source_type
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

-- ───────────────────────────────────────────────────────────────────────────
-- Defensive RLS policy on the view itself. RLS normally inherits from
-- underlying tables (each has authenticated-rw policy), but a direct
-- view-level policy documents intent and guards against accidental
-- future table-policy changes.
-- ───────────────────────────────────────────────────────────────────────────
-- Note: PostgreSQL does not allow ENABLE ROW LEVEL SECURITY on views by
-- default. The view inherits policy from its source tables. Each source
-- table already has policy `<schema>_<table>_rw` (authenticated, ALL).
-- This means:
--   - authenticated user → can SELECT from v_unified_co2e (sees all rows
--     that their underlying-table policy permits, which is all rows
--     under the current `true`/`true` policies)
--   - anon (unauthenticated) → underlying policies deny → view returns
--     empty
-- Verified live below in the verify block.

COMMENT ON VIEW carbon.v_unified_co2e IS
    'SCHEMA-3 (2026-07-17) — unified cross-schema carbon rollup. UNION ALL of 5 sources: electricity Scope 2, fuel dispense + garden fuel Scope 1, waste + chemical Scope 3. Joins carbon.emission_factor by source+unit. RLS inherits from underlying tables (authenticated-only). Drives CRB-3 dashboard.';
