-- ENV-WASTE-CARBON-001A — carbon rollup data honesty: no UNKNOWN→ZERO, no
-- factor fan-out, no NULL source labels.
--
-- Defects being closed (see docs/work-orders/ENV-WASTE-CARBON-001A.md):
--   1. Electricity branch COALESCE(SUM(r.consumption) * ef.kg_co2e, 0)
--      converted a missing/unapplicable emission factor (and an
--      all-NULL-consumption month) into a fabricated KNOWN ZERO — the only
--      UNION branch that did so after FUEL-CORE-001/GARBAGE-CORE-001.
--   2. Every branch LEFT JOINed carbon.emission_factor with only
--      effective_from <= month. Two applicable factor rows (different
--      effective_from — allowed by the UNIQUE constraint) fanned the join
--      out: the month appeared twice with different kg values and consumers
--      summed both (double counting). The electricity factor note explicitly
--      expects annual TGO updates, so the first factor update would have
--      triggered this on production data.
--   3. Fuel branch labeled rows with d.fuel_type::text even when fuel_type
--      is NULL (litres recorded, type missing) — a NULL source label in the
--      view output.
--
-- Repairs (additive only; CREATE OR REPLACE VIEW; no data is read, written,
-- backfilled, or cleaned; emission-factor rows/values untouched):
--   A. Electricity branch: COALESCE(SUM(r.consumption), 0) * ef.kg_co2e —
--      a missing factor now yields kg_co2e NULL (UNAVAILABLE), matching the
--      other four branches — plus WHERE r.consumption IS NOT NULL so
--      activity-quantity-missing rows are excluded exactly like every other
--      branch's IS NOT NULL filter (row_count = rows with activity).
--   B. All five branches select at most ONE factor row via
--      LEFT JOIN LATERAL (... ORDER BY effective_from DESC LIMIT 1) — the
--      deterministic latest-effective factor at month granularity
--      (effective_from <= date_trunc('month', ...)). With the current
--      single-factor data the numeric output is identical.
--   C. Fuel branch labels missing fuel_type explicitly as
--      fuel_unclassified (GARBAGE-CORE-001 waste_unclassified precedent);
--      a NULL fuel_type still matches no factor -> kg_co2e NULL.
--   Everything else — canonical segregation_type waste semantics
--   (GARBAGE-CORE-001), the enum-side-to-text fuel factor join
--   (FUEL-CORE-001), the chemical reagent fallback, garden branch, and the
--   public.v_unified_co2e pass-through facade — is preserved.
--
-- Track Z scope (SQL only). Implementation owner does NOT apply this
-- migration; the lead applies the merged migration via the supported
-- Management API path and live-verifies read-only.
-- Rollback/reapply: reapply 20260831000000 to roll back; rerun this file to
-- reapply (idempotent CREATE OR REPLACE VIEW).

CREATE OR REPLACE VIEW carbon.v_unified_co2e AS
-- Scope 2 — Electricity (carbon.reading × latest electricity factor)
SELECT
    date_trunc('month', r.reading_date)::date AS month,
    2::smallint AS scope,
    'electricity'::text AS source,
    COALESCE(SUM(r.consumption), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(r.id) AS row_count
FROM carbon.reading r
LEFT JOIN LATERAL (
    SELECT ef0.kg_co2e
    FROM carbon.emission_factor ef0
    WHERE ef0.source = 'electricity'
      AND ef0.unit = 'kWh'
      AND ef0.effective_from <= date_trunc('month', r.reading_date)
    ORDER BY ef0.effective_from DESC LIMIT 1
) ef ON true
WHERE r.consumption IS NOT NULL
GROUP BY 1, ef.kg_co2e

UNION ALL

-- Scope 1 — Fuel dispense (litres × latest factor by fuel_type; missing
-- fuel_type is labeled fuel_unclassified and matches no factor)
SELECT
    date_trunc('month', d.log_date)::date AS month,
    1::smallint AS scope,
    COALESCE(d.fuel_type, 'fuel_unclassified')::text AS source,
    COALESCE(SUM(d.litres), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(d.id) AS row_count
FROM fuel.dispense_log d
LEFT JOIN LATERAL (
    SELECT ef0.kg_co2e
    FROM carbon.emission_factor ef0
    WHERE ef0.source::text = d.fuel_type
      AND ef0.unit = 'L'
      AND ef0.effective_from <= date_trunc('month', d.log_date)
    ORDER BY ef0.effective_from DESC LIMIT 1
) ef ON true
WHERE d.litres IS NOT NULL
GROUP BY 1, COALESCE(d.fuel_type, 'fuel_unclassified'), ef.kg_co2e

UNION ALL

-- Scope 1 — Garden equipment fuel (2-stroke, treated as gasoline)
SELECT
    date_trunc('month', w.round_date)::date AS month,
    1::smallint AS scope,
    'garden_fuel'::text AS source,
    COALESCE(SUM(w.fuel_used_l), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(w.id) AS row_count
FROM garden.work_round w
LEFT JOIN LATERAL (
    SELECT ef0.kg_co2e
    FROM carbon.emission_factor ef0
    WHERE ef0.source = 'gasoline'
      AND ef0.unit = 'L'
      AND ef0.effective_from <= date_trunc('month', w.round_date)
    ORDER BY ef0.effective_from DESC LIMIT 1
) ef ON true
WHERE w.fuel_used_l IS NOT NULL
GROUP BY 1, ef.kg_co2e

UNION ALL

-- Scope 3 — Waste disposal (kg × latest factor by CANONICAL segregation_type)
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
LEFT JOIN LATERAL (
    SELECT ef0.kg_co2e
    FROM carbon.emission_factor ef0
    WHERE ef0.source = 'other'
      AND ef0.unit = CASE c.segregation_type WHEN 'general' THEN 'kg (general_waste)' WHEN 'infectious' THEN 'kg (infectious_waste)' WHEN 'recyclable' THEN 'kg (recyclable)' ELSE NULL END
      AND ef0.effective_from <= date_trunc('month', c.log_date)
    ORDER BY ef0.effective_from DESC LIMIT 1
) ef ON true
WHERE c.weight_kg IS NOT NULL
GROUP BY 1, c.segregation_type, ef.kg_co2e

UNION ALL

-- Scope 3 — Chemical movements out (kg × latest factor by chemical_name match)
SELECT
    date_trunc('month', m.movement_date)::date AS month,
    3::smallint AS scope,
    ('chemical_' || lower(split_part(m.chemical_name, ' ', 1)))::text AS source,
    COALESCE(SUM(m.quantity), 0) * ef.kg_co2e AS kg_co2e,
    COUNT(m.id) AS row_count
FROM chemical.movement m
LEFT JOIN LATERAL (
    SELECT ef0.kg_co2e
    FROM carbon.emission_factor ef0
    WHERE ef0.source = 'other'
      AND ef0.unit = CASE WHEN m.chemical_name ILIKE '%chlorine%' OR m.chemical_name ILIKE '%คลอรีน%' THEN 'kg (chlorine)' WHEN m.chemical_name ILIKE '%alum%' OR m.chemical_name ILIKE '%สารส้ม%' THEN 'kg (alum)' WHEN m.chemical_name ILIKE '%kmno4%' OR m.chemical_name ILIKE '%ด่างทับทิม%' THEN 'kg (kmno4)' ELSE 'kg (reagent_disposal)' END
      AND ef0.effective_from <= date_trunc('month', m.movement_date)
    ORDER BY ef0.effective_from DESC LIMIT 1
) ef ON true
WHERE m.direction = 'out' AND m.quantity IS NOT NULL
GROUP BY 1, m.chemical_name, ef.kg_co2e;

COMMENT ON VIEW carbon.v_unified_co2e IS
    'ENV-WASTE-CARBON-001A (2026-09-02) — unified cross-schema carbon rollup. UNION ALL of 5 sources: electricity Scope 2, fuel dispense + garden fuel Scope 1, waste + chemical Scope 3. Each branch selects at most one latest-effective carbon.emission_factor row (LATERAL ... ORDER BY effective_from DESC LIMIT 1); a missing/unapplicable factor yields kg_co2e NULL (UNAVAILABLE), never a fabricated zero. RLS inherits from underlying tables (authenticated-only).';
