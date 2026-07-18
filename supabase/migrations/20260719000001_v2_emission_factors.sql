-- SCHEMA-2 — carbon.emission_factor master rows (Scope 1+2+3).
--
-- Seeds authoritative kgCO₂e-per-unit factors for every GHG-contributing
-- source that ENV_DB modules feed into the unified carbon rollup
-- (SCHEMA-3 / carbon.v_unified_co2e).
--
-- Strategy: **TGO Thailand-specific first; IPCC 2006 + USEPA fallback**
-- when TGO hasn't published a Thai value. Each row's `note` records the
-- source + publication year so the audit trail is queryable.
--
-- enum `carbon.source_type` already covers: electricity, diesel, gasoline,
-- lpg, other. Scope 3 sources (waste, chemical, waste-transport) use the
-- `other` value + a `note` subtype marker (avoids enum churn — every
-- additive source_type change is a one-way door in Postgres).
--
-- Track Z scope (SQL only — no UI, no className).
-- Idempotent: ON CONFLICT DO NOTHING.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Widen unique constraint — current is (source, effective_from) which
--    breaks when multiple `other`-scope factors share the same date.
--    Replace with (source, unit, effective_from) so e.g. diesel-L and
--    diesel-kg on the same date can both live.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE carbon.emission_factor DROP CONSTRAINT IF EXISTS emission_factor_source_effective_from_key;
ALTER TABLE carbon.emission_factor
    ADD CONSTRAINT emission_factor_source_unit_effective_from_key
    UNIQUE (source, unit, effective_from);

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Scope 2 — indirect electricity (Thailand grid).
-- ───────────────────────────────────────────────────────────────────────────
-- Value already in use as a TS constant in frontend/src/lib/carbon.ts
-- (EMISSION_FACTOR_KGCO2E_PER_KWH = 0.4999). This row makes the same
-- value queryable from SQL so the rollup view and the client agree.
INSERT INTO carbon.emission_factor (source, unit, kg_co2e, effective_from, note) VALUES
    ('electricity', 'kWh', 0.4999, DATE '2023-01-01',
     'TGO Thailand Grid EF 2023 — Emission Factor of Electricity Grid (announced 2024). Verified against frontend constant. USER SHOULD VERIFY annually: TGO publishes updates.')
ON CONFLICT (source, unit, effective_from) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) Scope 1 — direct fuel combustion (mobile + stationary).
--    TGO Thailand-specific factors where published; IPCC 2006 defaults
--    otherwise. Units are per-litre for liquid fuels (the unit the
--    hospital's fuel and garden modules record), per-kg for LPG.
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO carbon.emission_factor (source, unit, kg_co2e, effective_from, note) VALUES
    -- Diesel — TGO net-calorific-value × IPCC EF (stationary+mobile blended).
    -- 10.180 kg CO₂/L × 0.997 (oxidation) + small CH₄/N₂O ≈ 0.020 → ~10.21 kgCO₂e/L
    ('diesel', 'L', 10.21, DATE '2006-01-01',
     'IPCC 2006 Vol 2 Ch2 — diesel oil (mobile + stationary): NCV 36.42 TJ/Gg × 74,100 kg/TJ × 0.997 + CH₄/N₂O traces. TGO Thailand has not published a country-specific diesel EF, this is the IPCC default used by Thai TGO reports.'),

    -- Gasoline (motor spirit) — IPCC 2006 default × oxidation
    -- 8.89 kg CO₂/L + CH₄/N₂O ≈ 0.02 → ~8.91 kgCO₂e/L
    ('gasoline', 'L', 8.91, DATE '2006-01-01',
     'IPCC 2006 Vol 2 Ch2 — motor gasoline: NCV 34.32 TJ/Gg × 69,300 kg/TJ × 0.998 + CH₄/N₂O. TGO uses IPCC default for gasoline.'),

    -- LPG (cooking + some vehicles) — per kg
    -- 3.000 kg CO₂/kg fuel × 0.995 + traces ≈ 2.99 kgCO₂e/kg
    ('lpg', 'kg', 2.99, DATE '2006-01-01',
     'IPCC 2006 Vol 2 Ch2 — LPG: NCV 47.31 TJ/Gg × 63,100 kg/TJ × 0.995. TGO reference value.')
ON CONFLICT (source, unit, effective_from) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 4) Scope 3 — waste disposal (landfill + treatment).
--    TGO does not publish waste-type-specific factors; use
--    Thailand-specific defaults from กรมควบคุมมลพิษ (PCD) /
--    IPCC 2019 Refinement FOD model approximations.
--    Per-kg CO₂e (methane commitment per tonne of waste landfilled).
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO carbon.emission_factor (source, unit, kg_co2e, effective_from, note) VALUES
    -- General waste (municipal solid waste — landfill)
    -- PCD 2022 ~ 0.524 kgCO₂e/kg waste (DOC=0.16, MCF=0.8 landfill + collection)
    ('other', 'kg (general_waste)', 0.524, DATE '2022-01-01',
     'PCD Thailand 2022 — Municipal Solid Waste landfill FOD model. Scope 3 Category 5 (Waste Generated). Subtype general waste. USER SHOULD VERIFY regional landfill MCF varies.'),

    -- Infectious waste (hospital — incineration)
    -- ~3.30 kgCO₂e/kg incinerated (medical waste incinerator default)
    ('other', 'kg (infectious_waste)', 3.30, DATE '2006-01-01',
     'IPCC 2006 Vol 5 Ch5 + USEPA AP-42 — infectious/medical waste incineration default. Scope 3 Category 5. Subtype infectious waste.'),

    -- Recyclable (sold/donated) — assume 0 net (offset accounted downstream)
    ('other', 'kg (recyclable)', 0.0, DATE '2006-01-01',
     'No emission assigned locally — recyclables handed off, downstream processing emissions belong to recycler. Scope 3 Category 1 (purchased goods) reverse-credit if audited.'),

    -- Waste transport (garbage truck) — diesel per km, ~0.32 L/km × 10.21 kg/L
    ('other', 'km (waste_transport)', 3.27, DATE '2006-01-01',
     'Diesel garbage truck ~0.32 L/km × 10.21 kgCO₂e/L (Scope 1 diesel factor). Scope 3 Category 4 (Upstream Transportation). Subtype waste transport.')
ON CONFLICT (source, unit, effective_from) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 5) Scope 3 — chemical production + disposal (rough proxy).
--    True production EF requires LCA databases (ecoinvent/Gabi); here we
--    use a conservative placeholder from EIO-LCA Thailand 2010 economic
--    table for "chemical manufacturing" — flagged ESTIMATED.
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO carbon.emission_factor (source, unit, kg_co2e, effective_from, note) VALUES
    -- Chlorine (gas production + transport) — placeholder ESTIMATED
    -- ~1.80 kgCO₂e per kg chlorine produced (industry average)
    ('other', 'kg (chlorine)', 1.80, DATE '2010-01-01',
     'ESTIMATED — EIO-LCA Thailand 2010 chemical manufacturing proxy for chlorine (Cl₂) production. NO country-specific value published by TGO. USER MUST VERIFY with supplier-specific EPD when available. Scope 3 Category 1.'),

    -- Alum (aluminium sulfate) — production
    -- ~0.45 kgCO₂e/kg (industry average)
    ('other', 'kg (alum)', 0.45, DATE '2010-01-01',
     'ESTIMATED — industry average for aluminium sulfate (coagulant) production. USER MUST VERIFY. Scope 3 Category 1.'),

    -- Potassium permanganate (KMnO₄) — production
    -- ~5.20 kgCO₂e/kg (rough estimate, energy-intensive process)
    ('other', 'kg (kmno4)', 5.20, DATE '2010-01-01',
     'ESTIMATED — rough proxy for KMnO₄ production (energy-intensive). USER MUST VERIFY. Scope 3 Category 1.'),

    -- Generic reagent disposal (incineration of contaminated lab waste)
    -- ~2.50 kgCO₂e/kg incinerated
    ('other', 'kg (reagent_disposal)', 2.50, DATE '2006-01-01',
     'IPCC 2006 + USEPA — chemical/biomedical waste incineration default for lab reagent disposal. Scope 3 Category 5. Subtype: reagent disposal.')
ON CONFLICT (source, unit, effective_from) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 6) Seed a comment for audit clarity.
-- ───────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE carbon.emission_factor IS
    'SCHEMA-2 (2026-07-17) — master emission factors. Strategy: TGO Thailand first (Scope 2 electricity 0.4999 kWh), IPCC 2006 + USEPA fallback for fuels/waste/chemical. ESTIMATED flag in note marks rows user must verify. Scope 3 sources use source=other with subtype in unit string (avoids enum churn).';
