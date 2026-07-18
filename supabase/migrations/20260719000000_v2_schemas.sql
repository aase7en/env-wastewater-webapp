-- SCHEMA-1 — v2 multi-domain foundations.
--
-- Expands ENV_DB from 2 operational schemas (wastewater + carbon) to 10 by
-- adding 8 new ones covering every environmental/occupational-health/safety
-- module that รพ.อุทัย runs (per WO-SCHEMA-1 / plan-v2).
--
-- Each new schema gets:
--   - at least one transactional table skeleton (id, *_date, recorded_by,
--     created_at) — concrete data columns are added in MOD-* chunks per
--     module spec, this migration only reserves the namespace + minimal
--     shape so foreign keys and RLS can land.
--   - ENABLE ROW LEVEL SECURITY + policy `<schema>_<table>_rw`
--     (authenticated, ALL) — same discipline as every existing table.
--
-- Also adds 8 location_category rows so `core.location` can be tagged
-- per module zone (idempotent ON CONFLICT).
--
-- Track Z scope (SQL only — no UI, no className, no theme tokens).
-- Idempotent: CREATE SCHEMA IF NOT EXISTS + CREATE TABLE IF NOT EXISTS.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) New schemas
-- ───────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS water_supply;
CREATE SCHEMA IF NOT EXISTS garbage;
CREATE SCHEMA IF NOT EXISTS fuel;
CREATE SCHEMA IF NOT EXISTS garden;
CREATE SCHEMA IF NOT EXISTS building;
CREATE SCHEMA IF NOT EXISTS safety;
CREATE SCHEMA IF NOT EXISTS food;
CREATE SCHEMA IF NOT EXISTS chemical;

COMMENT ON SCHEMA water_supply IS 'v2 module — groundwater / potable water daily standards checks';
COMMENT ON SCHEMA garbage     IS 'v2 module — waste collection, segregation, disposal';
COMMENT ON SCHEMA fuel        IS 'v2 module — fuel / fleet inventory and dispensing';
COMMENT ON SCHEMA garden      IS 'v2 module — gardening / landscaping work rounds';
COMMENT ON SCHEMA building    IS 'v2 module — building + premises inspection rounds';
COMMENT ON SCHEMA safety      IS 'v2 module — fire safety / emergency lighting monthly checks';
COMMENT ON SCHEMA food        IS 'v2 module — food sanitation, coliform bacteria testing';
COMMENT ON SCHEMA chemical    IS 'v2 module — sub-store chemical inventory (chlorine etc.)';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Transactional table skeletons (one per schema).
--    Concrete measurement columns land in their MOD-* chunks. These exist
--    so the platform can be wired end-to-end (insert/select/RLS/audit) from
--    day one. recorded_by is filled by an auth.uid() default trigger or by
--    the Supabase client; nullable here so manual probes via service-role
--    don't fail.
-- ───────────────────────────────────────────────────────────────────────────

-- water_supply — daily groundwater/potable water quality log
CREATE TABLE IF NOT EXISTS water_supply.daily_check (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    check_date    date NOT NULL DEFAULT CURRENT_DATE,
    location_id   uuid REFERENCES core.location(id),
    recorded_by   uuid,
    note          text,
    created_at    timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE water_supply.daily_check IS
    'v2 skeleton — daily groundwater/potable water quality checks (pH, chlorine residual, turbidity, coliform presence). Columns extended in MOD-WS-a.';

-- garbage — daily waste collection log
CREATE TABLE IF NOT EXISTS garbage.collection_log (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    log_date       date NOT NULL DEFAULT CURRENT_DATE,
    location_id    uuid REFERENCES core.location(id),
    waste_type     text,            -- general / infectious / recyclable / chemical
    weight_kg      numeric(10,2),
    disposal_route text,            -- กทม. / บริษัทเอกชน / เผา / ฝังกลบ
    recorded_by    uuid,
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE garbage.collection_log IS
    'v2 skeleton — daily waste collection log. Columns extended in MOD-WA-a.';

-- fuel — fuel inventory + dispensing events
CREATE TABLE IF NOT EXISTS fuel.dispense_log (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    log_date       date NOT NULL DEFAULT CURRENT_DATE,
    fuel_type      text,            -- diesel / gasoline / lpg / other (mirrors carbon.source_type)
    litres         numeric(10,2),
    meter_before   numeric(12,2),
    meter_after    numeric(12,2),
    vehicle_or_use text,
    recorded_by    uuid,
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE fuel.dispense_log IS
    'v2 skeleton — fuel dispense events. Meter delta vs litres cross-checked in MOD-FU-a. Scope 1 carbon feed.';

-- garden — landscaping work round log
CREATE TABLE IF NOT EXISTS garden.work_round (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    round_date     date NOT NULL DEFAULT CURRENT_DATE,
    location_id    uuid REFERENCES core.location(id),
    work_type      text,            -- ตัดหญ้า / ตัดแต่งไม้ / กำจัดวัชพืช / อื่นๆ
    area_sqm       numeric(10,2),
    worker_count   integer,
    fuel_used_l    numeric(10,2),   -- Scope 1 carbon feed (2-stroke fuel)
    recorded_by    uuid,
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE garden.work_round IS
    'v2 skeleton — garden/landscaping work round log. Scope 1 carbon via fuel_used_l.';

-- building — building/premises inspection round
CREATE TABLE IF NOT EXISTS building.inspection_round (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    round_date     date NOT NULL DEFAULT CURRENT_DATE,
    location_id    uuid REFERENCES core.location(id),
    inspector      text,
    findings       text,
    issues_found   boolean NOT NULL DEFAULT false,
    repair_needed  boolean NOT NULL DEFAULT false,
    recorded_by    uuid,
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE building.inspection_round IS
    'v2 skeleton — building/premises round inspection. Issues feed repair_request via UI.';

-- safety — monthly fire safety + emergency lighting checks
CREATE TABLE IF NOT EXISTS safety.monthly_check (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    check_date             date NOT NULL DEFAULT CURRENT_DATE,
    location_id            uuid REFERENCES core.location(id),
    extinguisher_inspected boolean NOT NULL DEFAULT false,
    exit_light_functional  boolean NOT NULL DEFAULT false,
    issues_found           text,
    recorded_by            uuid,
    note                   text,
    created_at             timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE safety.monthly_check IS
    'v2 skeleton — monthly fire extinguisher + emergency lighting check (legal requirement).';

-- food — food sanitation + coliform bacteria testing
CREATE TABLE IF NOT EXISTS food.lab_test (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_date       date NOT NULL DEFAULT CURRENT_DATE,
    sample_type       text,           -- น้ำประปา / น้ำบาดาล / อาหาร / ผัก
    test_type         text,           -- total_coliform / e_coli / fecal_coliform
    result            text,           -- ไม่พบ / พบ (MPN/100ml: N) — kept as text until units stable
    reported_date     date,
    technician        text,
    recorded_by       uuid,
    note              text,
    created_at        timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE food.lab_test IS
    'v2 skeleton — food/water sanitation lab tests (coliform). Test/Result columns are text for now. MOD-FO-a will add reagent stock decrement.';

-- chemical — sub-store chemical inventory + movements
CREATE TABLE IF NOT EXISTS chemical.movement (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_date  date NOT NULL DEFAULT CURRENT_DATE,
    chemical_name  text NOT NULL,         -- คลอรีน / สารส้ม / ด่างทับทิม / ฯลฯ
    direction      text NOT NULL,         -- in / out
    quantity       numeric(10,3) NOT NULL,
    unit           text NOT NULL DEFAULT 'kg',
    balance_after  numeric(10,3),
    purpose        text,
    recorded_by    uuid,
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE chemical.movement IS
    'v2 skeleton — chemical sub-store movements (FIFO balance). Scope 1/3 carbon feed via emission_factor join.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) RLS — enable + authenticated policy on every new table.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE water_supply.daily_check   ENABLE ROW LEVEL SECURITY;
ALTER TABLE garbage.collection_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel.dispense_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden.work_round          ENABLE ROW LEVEL SECURITY;
ALTER TABLE building.inspection_round  ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety.monthly_check       ENABLE ROW LEVEL SECURITY;
ALTER TABLE food.lab_test              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical.movement          ENABLE ROW LEVEL SECURITY;

-- Idempotent policies (DROP IF EXISTS first so re-runs are safe).
DROP POLICY IF EXISTS daily_check_authenticated_rw  ON water_supply.daily_check;
DROP POLICY IF EXISTS collection_log_authenticated_rw ON garbage.collection_log;
DROP POLICY IF EXISTS dispense_log_authenticated_rw   ON fuel.dispense_log;
DROP POLICY IF EXISTS work_round_authenticated_rw     ON garden.work_round;
DROP POLICY IF EXISTS inspection_round_authenticated_rw ON building.inspection_round;
DROP POLICY IF EXISTS monthly_check_authenticated_rw  ON safety.monthly_check;
DROP POLICY IF EXISTS lab_test_authenticated_rw       ON food.lab_test;
DROP POLICY IF EXISTS movement_authenticated_rw       ON chemical.movement;

CREATE POLICY daily_check_authenticated_rw  ON water_supply.daily_check   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY collection_log_authenticated_rw ON garbage.collection_log   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY dispense_log_authenticated_rw   ON fuel.dispense_log        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY work_round_authenticated_rw     ON garden.work_round        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY inspection_round_authenticated_rw ON building.inspection_round FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY monthly_check_authenticated_rw  ON safety.monthly_check     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY lab_test_authenticated_rw       ON food.lab_test            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY movement_authenticated_rw       ON chemical.movement        FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 4) Seed location_category rows for env-module zones.
--    core.location.category_id → these rows let a single location table
--    serve every module. ON CONFLICT DO NOTHING so re-runs are idempotent.
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO core.location_category (name) VALUES
    ('โซนน้ำประปาบาดาล'),
    ('จุดเก็บขยะ'),
    ('ปั๊มน้ำมันเชื้อเพลิง'),
    ('โซนสวน/ภูมิทัศน์'),
    ('อาคาร/ชั้น'),
    ('จุดความปลอดภัย'),
    ('ห้องตรวจสุขาภิบาลอาหาร'),
    ('คลังเคมีภัณฑ์ย่อย')
ON CONFLICT DO NOTHING;
