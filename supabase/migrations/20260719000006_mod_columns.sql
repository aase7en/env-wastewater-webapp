-- MOD-batch — Wave 3 module column extensions + 2 sub-triggers.
--
-- SCHEMA-1 created the 8 transactional table skeletons with minimal columns
-- (id, *_date, recorded_by, note, created_at + a few module-specific ones).
-- This migration extends each with the concrete measurement columns the
-- daily-entry forms need, plus two cross-module triggers:
--
--   1. food.lab_test AFTER INSERT → decrement chemical.movement
--      (auto-track reagent consumption)
--   2. chemical.movement AFTER INSERT/UPDATE → recompute chemical.master
--      .current_balance (FIFO inventory) — requires new chemical.master
--      table.
--
-- Idempotent: ALTER TABLE ADD COLUMN IF NOT EXISTS + CREATE TABLE IF NOT
-- EXISTS + CREATE OR REPLACE FUNCTION.
-- Track Z scope (SQL only).

-- ───────────────────────────────────────────────────────────────────────────
-- 1) water_supply.daily_check — groundwater/potable water parameters
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE water_supply.daily_check
    ADD COLUMN IF NOT EXISTS ph                    numeric(4,2),
    ADD COLUMN IF NOT EXISTS free_chlorine_residual numeric(6,3),  -- mg/L
    ADD COLUMN IF NOT EXISTS turbidity              numeric(6,2),   -- NTU
    ADD COLUMN IF NOT EXISTS total_coliform         text,           -- ไม่พบ / พบ (MPN/100ml: N)
    ADD COLUMN IF NOT EXISTS fecal_coliform         text,
    ADD COLUMN IF NOT EXISTS iron                   numeric(6,3),   -- mg/L
    ADD COLUMN IF NOT EXISTS manganese              numeric(6,3),   -- mg/L
    ADD COLUMN IF NOT EXISTS hardness               numeric(8,2),   -- mg/L as CaCO3
    ADD COLUMN IF NOT EXISTS tds                    numeric(8,2);   -- mg/L

COMMENT ON TABLE water_supply.daily_check IS
    'MOD-WS — daily groundwater quality check. Columns per Thai drinking water standard (ประกาศ สธ. ฉบับที่ 135).';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) garbage.collection_log — waste segregation + disposal metadata
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE garbage.collection_log
    ADD COLUMN IF NOT EXISTS segregation_type text,     -- general / infectious / recyclable / chemical
    ADD COLUMN IF NOT EXISTS contractor        text,
    ADD COLUMN IF NOT EXISTS vehicle_plate     text,
    ADD COLUMN IF NOT EXISTS manifest_no       text,
    ADD COLUMN IF NOT EXISTS destination       text;

COMMENT ON TABLE garbage.collection_log IS
    'MOD-WA — daily waste collection log. waste_type kept for backwards compat (legacy data). segregation_type is the canonical field going forward.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) fuel.dispense_log — vehicle + cost tracking
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE fuel.dispense_log
    ADD COLUMN IF NOT EXISTS vehicle_id     text,
    ADD COLUMN IF NOT EXISTS odometer       numeric(10,1),
    ADD COLUMN IF NOT EXISTS purpose        text,
    ADD COLUMN IF NOT EXISTS cost_baht      numeric(10,2),
    ADD COLUMN IF NOT EXISTS supplier       text;

COMMENT ON TABLE fuel.dispense_log IS
    'MOD-FU — fuel dispense events. delta_check via app layer (computeDelta helper warns if litres ≠ meter_after - meter_before).';

-- ───────────────────────────────────────────────────────────────────────────
-- 4) garden.work_round — duration + equipment + waste collected
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE garden.work_round
    ADD COLUMN IF NOT EXISTS duration_hours    numeric(5,2),
    ADD COLUMN IF NOT EXISTS equipment_used    text,   -- comma-separated (chain saw, mower, blower)
    ADD COLUMN IF NOT EXISTS waste_collected_kg numeric(10,2),
    ADD COLUMN IF NOT EXISTS photo_path         text;

COMMENT ON TABLE garden.work_round IS
    'MOD-GA — garden/landscaping work round. Scope 1 carbon feed via fuel_used_l.';

-- ───────────────────────────────────────────────────────────────────────────
-- 5) building.inspection_round — checklist + severity + assignment
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE building.inspection_round
    ADD COLUMN IF NOT EXISTS round_type   text,        -- monthly / quarterly / annual
    ADD COLUMN IF NOT EXISTS checklist    jsonb,       -- structured: [{item, ok, note}]
    ADD COLUMN IF NOT EXISTS photos       text[],      -- array of paths
    ADD COLUMN IF NOT EXISTS severity     text,        -- low / medium / high
    ADD COLUMN IF NOT EXISTS assigned_to  text;

COMMENT ON TABLE building.inspection_round IS
    'MOD-BL — building/premises inspection round. repair_needed=true seeds core.repair_request (app-layer).';

-- ───────────────────────────────────────────────────────────────────────────
-- 6) safety.monthly_check — fire safety + emergency lighting detail
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE safety.monthly_check
    ADD COLUMN IF NOT EXISTS extinguisher_count          integer,
    ADD COLUMN IF NOT EXISTS extinguisher_expired_count  integer,
    ADD COLUMN IF NOT EXISTS exit_light_count            integer,
    ADD COLUMN IF NOT EXISTS exit_light_broken_count     integer,
    ADD COLUMN IF NOT EXISTS fire_alarm_tested           boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS sprinkler_tested            boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS apd_aed_checked             boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS next_check_due              date;

COMMENT ON TABLE safety.monthly_check IS
    'MOD-FS — monthly fire safety + emergency lighting check. Legal requirement (พ.ร.บ. ป้องกันอัคคีภัย 2542).';

-- ───────────────────────────────────────────────────────────────────────────
-- 7) food.lab_test — sample metadata + reagent usage
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE food.lab_test
    ADD COLUMN IF NOT EXISTS sample_point      text,
    ADD COLUMN IF NOT EXISTS mpn_value         numeric(10,2),   -- MPN/100ml numeric form
    ADD COLUMN IF NOT EXISTS reagent_used      jsonb,           -- {name, qty, unit}
    ADD COLUMN IF NOT EXISTS reported_by_lab_tech text,
    ADD COLUMN IF NOT EXISTS follow_up_action  text;

COMMENT ON TABLE food.lab_test IS
    'MOD-FO — food/water sanitation lab tests. reagent_used seeds chemical.movement via fn_food_reagent_decrement trigger.';

-- ───────────────────────────────────────────────────────────────────────────
-- 8) chemical.master + chemical.movement extensions + balance trigger
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chemical.master (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL UNIQUE,
    cas_no          text,
    hazard_class    text,
    unit            text NOT NULL DEFAULT 'kg',
    reorder_point   numeric(10,3),
    current_balance numeric(10,3) NOT NULL DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chemical.master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_authenticated_rw ON chemical.master;
CREATE POLICY master_authenticated_rw
    ON chemical.master FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_audit_log ON chemical.master;
CREATE TRIGGER trg_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON chemical.master
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

COMMENT ON TABLE chemical.master IS
    'MOD-CH — chemical sub-store master catalog. current_balance kept in sync by fn_chemical_recompute_balance trigger on chemical.movement.';

ALTER TABLE chemical.movement
    ADD COLUMN IF NOT EXISTS lot_no        text,
    ADD COLUMN IF NOT EXISTS expiry_date   date,
    ADD COLUMN IF NOT EXISTS supplier      text,
    ADD COLUMN IF NOT EXISTS unit_cost     numeric(10,2),
    ADD COLUMN IF NOT EXISTS master_id     uuid REFERENCES chemical.master(id);

-- ───────────────────────────────────────────────────────────────────────────
-- 9) chemical.movement AFTER INSERT/UPDATE/DELETE → recompute master.balance
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION chemical.fn_recompute_balance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_master uuid;
BEGIN
    v_master := COALESCE(NEW.master_id, OLD.master_id);
    IF v_master IS NULL THEN
        RETURN NEW;  -- legacy movement without master link — skip
    END IF;
    -- Sum quantity with sign: in=+, out=-
    UPDATE chemical.master m
    SET current_balance = COALESCE((
        SELECT SUM(CASE direction WHEN 'in' THEN quantity ELSE -quantity END)
        FROM chemical.movement
        WHERE master_id = v_master
    ), 0)
    WHERE m.id = v_master;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_balance ON chemical.movement;
CREATE TRIGGER trg_recompute_balance
    AFTER INSERT OR UPDATE OR DELETE ON chemical.movement
    FOR EACH ROW EXECUTE FUNCTION chemical.fn_recompute_balance();

COMMENT ON FUNCTION chemical.fn_recompute_balance() IS
    'MOD-CH — keeps chemical.master.current_balance in sync. direction=in adds, direction=out subtracts.';

-- ───────────────────────────────────────────────────────────────────────────
-- 10) food.lab_test AFTER INSERT → decrement reagent stock
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION food.fn_decrement_reagent()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_reagent jsonb;
    v_master  uuid;
    v_qty     numeric;
    v_unit    text;
    v_name    text;
BEGIN
    v_reagent := NEW.reagent_used;
    IF v_reagent IS NULL THEN
        RETURN NEW;
    END IF;
    v_name := v_reagent->>'name';
    v_qty  := (v_reagent->>'qty')::numeric;
    v_unit := v_reagent->>'unit';
    IF v_name IS NULL OR v_qty IS NULL THEN
        RETURN NEW;
    END IF;
    -- Find master by name (case-insensitive) — skip if not catalogued
    SELECT id INTO v_master FROM chemical.master WHERE LOWER(name) = LOWER(v_name) LIMIT 1;
    INSERT INTO chemical.movement (movement_date, chemical_name, direction, quantity, unit, purpose, master_id)
    VALUES (NEW.sample_date, v_name, 'out', v_qty, COALESCE(v_unit, 'unit'),
            'auto: food.lab_test ' || NEW.id, v_master);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_reagent ON food.lab_test;
CREATE TRIGGER trg_decrement_reagent
    AFTER INSERT ON food.lab_test
    FOR EACH ROW EXECUTE FUNCTION food.fn_decrement_reagent();

COMMENT ON FUNCTION food.fn_decrement_reagent() IS
    'MOD-FO — auto-decrements chemical.movement when a lab_test uses reagent. Skips silently if reagent_used is null.';
