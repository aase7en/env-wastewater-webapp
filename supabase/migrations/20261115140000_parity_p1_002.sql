-- ============================================================================
-- ENV-PARITY-P1-002 C1 — AppSheet parity Phase 1, lane P1.2
-- Effective-dated equipment specs + meter-chain views (สายมิเตอร์)
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P1-002.md.
-- Plan row: docs/ai/APPSHEET-PARITY-PLAN.md §6 Phase 1 row P1.2 as amended
-- by commit fb57369 (owner-authorized 2026-11-14 / 15 พ.ย. 2569):
--   "SQL views สายมิเตอร์ (LAG เมื่อวาน/สูบ1-2, delta ไฟ, คำนวณสูบ ×34/×12,
--    AVG 4 วัน, chlorine streak) — กฎ delta≤0→ค่าว่าง · อัปเดต 15 พ.ย. 2569:
--    เจ้าของยืนยัน ×34/×12 = อัตราสูบต่อ 1 ชม. จากสเปกปั๊ม … ไม่ฝังค่าคงที่
--    ใน SQL — ต้องเป็น config จากระบบ spec อุปกรณ์ (lane spec อุปกรณ์ใช้ร่วม
--    อาจมาก่อนหรือยุบรวมใน lane นี้ ตามที่ปรึกษาออกแบบ)"
-- This lane FOLDS the equipment-spec sub-lane into P1.2 by design (WO §1).
--
-- R2 REVIEWED ADDENDUM — Chlorine_StreakCount closes the P1.3 deferral:
-- The claim transition excluded the continuous Chlorine_StreakCount
-- (transition instruction: "chlorine streak views already exist from P1.3 —
-- do not duplicate"), recording it as a named follow-up (WO §2.2.8, handoff
-- D0 item 1). The R2 transition review adjudicated that P3: the delivery
-- obligation is REAL and OPEN (reference doc 12 ~line 1421; the P1.3
-- delivery is the 2-day critical FLAGS — a different computation), to land
-- "via a named successor claim (or a reviewed addendum at the P1.2
-- implementation closeout)" (verdict issuecomment-6899667463 §5). This
-- migration IS that reviewed addendum: the continuous
-- chlorine_streak_count ships in wastewater.v_reading_meter_chain, closing
-- the P1.3 deferral. Binding streak semantics (claim instruction): streak =
-- consecutive calendar days with recorded usage; a calendar gap or a NULL
-- usage value resets to 0; the first day of a streak = 1. TRANSLATION NOTE
-- (recorded honestly, never silently reconciled): the AppSheet
-- Chlorine_StreakCount (reference §3.3 ~line 1421) counts days with
-- Free Chlorine < 0.5 since the last day >= 0.5; the R2-addendum binding
-- semantics above is a recorded-usage continuity streak (gaps-and-islands
-- over chlorine_used_real). The underlying usage value stays NULL on
-- unknown days (unknown ≠ zero holds for the VALUE); the streak COUNTER is
-- a defined derived state whose reset value 0 the addendum binds
-- explicitly.
--
-- OWNER ANSWERS A1–A3 (verbatim, plan §5.3 receipt block, commit fb57369):
--   A1 ×34/×12 (คำนวณสูบ 1/2): เป็น "อัตราการสูบต่อ 1 ชม. ของปั๊ม" คำนวณจาก
--      สเปกปั๊ม (กำลัง HP, ขนาดท่อ และปัจจัยที่เกี่ยวข้อง; เก็บโดยจับเวลาจริง
--      ต่อ 1 ชม. การทำงาน) — หน้างานใช้ hour meter (ชั่วโมง/วันต่อปั๊ม) ·
--      ข้อกำหนดใหม่: ต้องมีระบบตั้งค่าสเปกปั๊ม เพราะเมื่อซ่อม/เปลี่ยนปั๊มใน
--      อนาคต "ตัวเลขการสูบต่อ 1 ชม. อาจไม่เท่าเดิม"
--   A2 ×3.7 + Water_In (ประปาบาดาล): เช่นเดียวกัน — พลังงาน/การไหลคำนวณจาก
--      สเปกเครื่องมือ/อุปกรณ์ ต้องมีระบบข้อมูล spec เครื่องมือ (อัตราการไหล +
--      การกินไฟต่อ 1 ชม.); ค่าที่ผู้ใช้กรอกคือ จำนวนชั่วโมงปั๊มทำงาน
--   A3 ÷10 (Chlorine usage ประปา): ยังใช้อยู่ — ระบบน้ำบาดาลผสมคลอรีน 10% :
--      น้ำ = 1:9; hour meter ใช้ติดตามการใช้คลอรีนรายเดือน
--
-- VERBATIM GROUND TRUTH (docs/ai/digital-twin/
-- 12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md §3.3, table ข้อมูลคุณภาพน้ำ —
-- these BIND; none invented):
--   ปริมาณการใช้ไฟฟ้าของระบบ:
--     =IF([เลขมิเตอร์วันนี้]-[test_ดึงข้อมูลมิเตอร์วันก่อนหน้า]<= 0,"",
--         [เลขมิเตอร์วันนี้]-[test_ดึงข้อมูลมิเตอร์วันก่อนหน้า])
--   เลขมิเตอร์เมื่อวาน (DOCUMENTED BUG — global MAX, not yesterday):
--     =MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้], TRUE))
--   test_ดึงข้อมูลมิเตอร์วันก่อนหน้า:
--     =MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้],
--                 [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))
--   last_meter_สูบ1:
--     =MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์เครื่องสูบ 1],
--                 [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))
--   last_meter_สูบ2:
--     =MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์เครื่องสูบ 2],
--                 [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))
--   คำนวณสูบ 1 = ([เลขมิเตอร์เครื่องสูบ 1]-[last_meter_สูบ1])*34
--   คำนวณสูบ 2 = ([เลขมิเตอร์เครื่องสูบ 2]-[last_meter_สูบ2])*12
--   ปริมาณน้ำเสียที่เข้าระบบบำบัด:
--     =if(SUM(LIST([คำนวณสูบ 1],[คำนวณสูบ 2]))<=0,
--         "อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ",
--         (SUM(LIST([คำนวณสูบ 1],[คำนวณสูบ 2]))))
--   AVG_Westwater:
--     =AVERAGE(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณน้ำเสียที่เข้าระบบบำบัด],
--        AND([วันที่ บันทึก] >= ([_THISROW].[วันที่ บันทึก] - 3),
--            [วันที่ บันทึก] <= ([_THISROW].[วันที่ บันทึก]))))
--   คลอรีนน้ำที่ใช้จริง (spreadsheet ArrayFormula, C26=คลอรีนน้ำ ที่ใช้,
--   C38=อัตราส่วนผสม) — reference doc 12 ~line 767:
--     =ArrayFormula("คลอรีนน้ำที่ใช้จริง"{;IF(R2C38:R[763]C38="","",
--        R2C26:R[763]C26 / SWITCH(R2C38:R[763]C38,"1:2",2,"1:4",4,"1:9",9,""))})
--
-- HONEST CORRECTIONS BINDING IN THE ENV TRANSLATION (WO §2.2):
--   1. prev meters = LAG, never global MAX. The AppSheet MAX(SELECT(…))
--      forms are the documented bug (TRUE selects the WHOLE table; even the
--      < [_THISROW] forms take MAX over values, not date-nearest previous).
--      ENV: LAG(<meter>) OVER (ORDER BY reading_date, created_at, id) —
--      deterministic; first-ever reading has no previous → NULL.
--   2. delta ≤ 0 → NULL + meter_boundary_flag + reason — never 0, never
--      negative (meter reset/swap; a missing counterpart likewise → NULL +
--      flag with its own reason). The electric formula already encodes
--      "≤0 → blank" in AppSheet; the pump formulas do NOT — the guard is
--      mandatory in code for BOTH deltas (Jev Q5 CODE_FAILURE @ 1.0).
--   3. Pump volume = HOURS × spec-flow AT THE READING DATE, never ×34/×12
--      literals (A1: figures change when pumps change). Missing meter or
--      missing spec → NULL, never a fallback constant (missing spec is
--      FLAGGED, not zero-filled).
--   4. ปริมาณน้ำเสียที่เข้าระบบบำบัด = numeric only. The AppSheet text
--      prompt "อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ" is NEVER mirrored into
--      SQL; wastewater_in_derived = sum of the two computed pump volumes
--      only when BOTH exist, else NULL.
--   5. avg_westwater_4d = AVERAGE over reading_date BETWEEN D−3 AND D of
--      the DERIVED daily volume; missing days contribute nothing (never
--      filled with 0); empty window → NULL.
--   6. คลอรีนน้ำที่ใช้จริง = verbatim ÷SWITCH formula: chlorine_used ÷
--      SWITCH(ratio, '1:2'→2, '1:4'→4, '1:9'→9); blank/unknown ratio or
--      NULL value → NULL, never 0. ÷9-vs-÷10 NOTE (recorded, not silently
--      reconciled): the wastewater production formula divides by the ratio
--      DENOMINATOR (÷9 for 1:9), while A3's "÷10" binds the GROUNDWATER
--      water-supply system (10% solution 1:9 → pure fraction 1/10, which
--      lives in the chlorine_mix_groundwater spec row for P1.5). If the
--      owner later rules wastewater should also be ÷10, that is a reviewed
--      follow-up.
--   7. Existing views untouched: v_reading_with_computed keeps its shape
--      byte-identical, including its DISCOVERED QUIRK
--      `(pump2_meter - pump1_meter) AS energy_kwh_estimate` (a difference
--      between the two PUMP hour meters — not an electric-meter delta;
--      live: ≤ 0 for all 907 rows). Recorded follow-up; NOT fixed here;
--      regression-guarded in scripts/test_parity_p1_002_meter_chain.py.
--
-- REFERENCE-DATA VS USER-DATA (data-honesty distinction): the 4 INSERTs
-- below are SYSTEM REFERENCE/CONFIG rows in core.equipment_spec (the
-- AppSheet constants were always in effect — this seed makes the same
-- config visible to the SQL engine, per A1/A2 "config ระบบเดียวกัน"). NO
-- wastewater.reading row, NO carbon.* row, NO user-data row is inserted,
-- updated, or deleted by this migration. Test fixtures live only inside
-- rolled-back transactions in scripts/test_parity_p1_002_meter_chain.py.
--
-- VALID_FROM PIN (D3 preflight receipt): fixed literal DATE '2024-01-09' =
-- live `SELECT MIN(reading_date) FROM wastewater.reading` (907 rows span
-- 2024-01-09..2026-07-04; re-verified at preflight BEFORE apply — drift →
-- STOP, do not improvise a new date). Reasoning (WO §2.3.3): computations
-- join spec BY READING DATE, so a late pin (e.g. the owner-confirmation
-- date 2026-11-15) would leave all 907 historical rows with no resolvable
-- spec; the owner's A1/A2 confirm these are CURRENT values of long-standing
-- equipment; honest labeling (specs predate the data horizon) goes in
-- note/source — NOT false precision. NEVER CURRENT_DATE (non-deterministic
-- on re-run).
--
-- ELECTRIC-METER IDENTITY EVIDENCE (D3 preflight, read-only, live
-- ENV_DB gllqtbyofrcjzmbnfoeh): exactly ONE carbon.meter row — id
-- b6be4c99-c83a-43f7-b765-72286cc78bd0, meter_name 'ระบบบ่อบำบัดน้ำเสีย'
-- (the wastewater treatment system), source 'electricity', unit 'kWh',
-- is_active. carbon.reading: 907 rows spanning 2024-01-09..2026-07-04.
-- Linkage: 907/907 wastewater.reading rows carry carbon_reading_id (100%);
-- every linked reading resolves to exactly that ONE meter id; 0 linked
-- rows have NULL meter_value. Identity ESTABLISHED → delta_kwh wiring
-- joins per-reading carbon_reading_id → carbon.reading.meter_value (no
-- meter-id literal is embedded; the join follows the data). Had identity
-- been unresolved, delta_kwh would surface NULL with reason
-- 'electric-meter-identity-unresolved' — never guessed (WO §2.3.4).
--
-- APPSHEET → ENV COLUMN MAP (honest map, per-reading):
--   [_THISROW].[วันที่ บันทึก]          → wastewater.reading.reading_date
--   [เลขมิเตอร์เครื่องสูบ 1]            → pump1_meter (HOUR meter, A1)
--   [เลขมิเตอร์เครื่องสูบ 2]            → pump2_meter (HOUR meter, A1)
--   [เลขมิเตอร์วันนี้] (electric)       → carbon.reading.meter_value via
--                                          carbon_reading_id (preflight
--                                          evidence above)
--   [คลอรีนน้ำ ที่ใช้] (C26)            → chlorine_used
--   [อัตราส่วนผสม] (C38)                → chlorine_mix_ratio
--   [ปริมาณน้ำเสียที่เข้าระบบบำบัด]     → DERIVED (never the stored
--                                          wastewater_in column — that is
--                                          the manual-entry surface)
--
-- EFFECTIVE-DATED JOIN RULE: spec-at-that-date pick = valid_from <=
-- reading_date AND (valid_to IS NULL OR valid_to > reading_date) —
-- half-open [valid_from, valid_to) per the claim instruction ("valid_from
-- ≤ date < COALESCE(valid_to, ∞)"), ORDER BY valid_from DESC LIMIT 1
-- (latest start wins). Append-only discipline: spec edits APPEND a new row
-- and close the prior row's valid_to — never overwrite — so historical
-- recomputes stay historically correct (A1). No DB trigger enforces
-- append-only in this lane (admin UI deferred to P1.4+; documented
-- discipline + follow-up). UNIQUE (kind, valid_from) doubles as the
-- double-seed guard; a btree_gist EXCLUDE overlap constraint is recorded
-- as OPTIONAL hardening follow-up (WO §2.3.2).
--
-- EXISTING SURFACE — UNTOUCHED, ADDITIVE ONLY: no ALTER TABLE, no UPDATE/
-- DELETE/TRUNCATE/DROP TABLE, no GRANT, no POLICY, no trigger, no Edge
-- Function, no frontend artifact. RLS DDL appears ONLY as
-- ENABLE ROW LEVEL SECURITY on the NEW core.equipment_spec table (NO
-- policies — fail-closed deny-pending posture; views run with owner
-- rights; existing RLS untouched everywhere). DROP IF EXISTS appears only
-- for the NEW view this file itself creates (house idempotent form).
--
-- ============================================================================
-- ROLLBACK (reverse order; run via the same Management-API apply path —
-- fully additive lane, nothing to restore byte-exactly):
--   DROP VIEW IF EXISTS wastewater.v_reading_meter_chain;
--   DELETE FROM core.equipment_spec WHERE (kind, valid_from) IN (
--     ('pump_wastewater_1',      DATE '2024-01-09'),
--     ('pump_wastewater_2',      DATE '2024-01-09'),
--     ('pump_groundwater',       DATE '2024-01-09'),
--     ('chlorine_mix_groundwater', DATE '2024-01-09'));
--   DROP TABLE IF EXISTS core.equipment_spec;
--   DROP TYPE IF EXISTS core.equipment_spec_kind;
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Enum + table — effective-dated append-only equipment-spec history.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE core.equipment_spec_kind AS ENUM (
    'pump_wastewater_1',
    'pump_wastewater_2',
    'pump_groundwater',
    'chlorine_mix_groundwater'
);

CREATE TABLE core.equipment_spec (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind              core.equipment_spec_kind NOT NULL,
    flow_m3_per_h     numeric,
    energy_kwh_per_h  numeric,
    mix_part_chlorine numeric,
    mix_part_water    numeric,
    valid_from        date NOT NULL,
    valid_to          date,
    note              text,
    source            text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_equipment_spec_kind_valid_from UNIQUE (kind, valid_from),
    CONSTRAINT ck_equipment_spec_pump_ww1_flow_required CHECK (
        kind <> 'pump_wastewater_1' OR flow_m3_per_h IS NOT NULL),
    CONSTRAINT ck_equipment_spec_pump_ww2_flow_required CHECK (
        kind <> 'pump_wastewater_2' OR flow_m3_per_h IS NOT NULL),
    CONSTRAINT ck_equipment_spec_pump_gw_energy_required CHECK (
        kind <> 'pump_groundwater' OR energy_kwh_per_h IS NOT NULL),
    CONSTRAINT ck_equipment_spec_chlorine_mix_parts_required CHECK (
        kind <> 'chlorine_mix_groundwater'
        OR (mix_part_chlorine IS NOT NULL AND mix_part_water IS NOT NULL)),
    CONSTRAINT ck_equipment_spec_has_spec_value CHECK (
        num_nonnulls(flow_m3_per_h, energy_kwh_per_h, mix_part_chlorine) >= 1),
    CONSTRAINT ck_equipment_spec_positive_values CHECK (
        (flow_m3_per_h     IS NULL OR flow_m3_per_h     > 0)
        AND (energy_kwh_per_h IS NULL OR energy_kwh_per_h > 0)
        AND (mix_part_chlorine IS NULL OR mix_part_chlorine > 0)
        AND (mix_part_water    IS NULL OR mix_part_water    > 0)),
    CONSTRAINT ck_equipment_spec_valid_window CHECK (
        valid_to IS NULL OR valid_to >= valid_from)
);

-- Fail-closed: RLS enabled with NO policies (anon/authenticated denied;
-- migration owner + view execution unaffected — views run with owner
-- rights). Policies land with the P1.4 spec-admin consumer.
ALTER TABLE core.equipment_spec ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE core.equipment_spec IS
    'ENV-PARITY-P1-002 — effective-dated append-only equipment specs (A1/A2: pump flow/energy figures change on repair/replacement; computations join BY READING DATE; edits append, never overwrite; half-open [valid_from, valid_to) validity). Reference/config data, owner-confirmed via plan §5.3 A1–A3.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Seeds — 4 guarded rows (system reference data, NOT user data).
--    valid_from = DATE '2024-01-09' = live MIN(reading_date), preflight
--    re-verified (STOP-on-drift rule) before this migration is applied.
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO core.equipment_spec (kind, flow_m3_per_h, valid_from, note, source)
SELECT 'pump_wastewater_1', 34, DATE '2024-01-09',
       'Pump 1 per-hour flow (A1) — specs predate the data horizon (pinned at live MIN(reading_date); honest labeling, not false precision)',
       'owner-confirmed 2026-11-15 (plan §5.3 A1–A3)'
WHERE NOT EXISTS (
    SELECT 1 FROM core.equipment_spec
    WHERE kind = 'pump_wastewater_1' AND valid_from = DATE '2024-01-09');

INSERT INTO core.equipment_spec (kind, flow_m3_per_h, valid_from, note, source)
SELECT 'pump_wastewater_2', 12, DATE '2024-01-09',
       'Pump 2 per-hour flow (A1) — specs predate the data horizon (pinned at live MIN(reading_date); honest labeling, not false precision)',
       'owner-confirmed 2026-11-15 (plan §5.3 A1–A3)'
WHERE NOT EXISTS (
    SELECT 1 FROM core.equipment_spec
    WHERE kind = 'pump_wastewater_2' AND valid_from = DATE '2024-01-09');

INSERT INTO core.equipment_spec (kind, energy_kwh_per_h, valid_from, note, source)
SELECT 'pump_groundwater', 3.7, DATE '2024-01-09',
       'Groundwater pump energy per hour (A2) — serves the P1.5 water-supply lane via this same spec system; specs predate the data horizon',
       'owner-confirmed 2026-11-15 (plan §5.3 A1–A3)'
WHERE NOT EXISTS (
    SELECT 1 FROM core.equipment_spec
    WHERE kind = 'pump_groundwater' AND valid_from = DATE '2024-01-09');

INSERT INTO core.equipment_spec (kind, mix_part_chlorine, mix_part_water, valid_from, note, source)
SELECT 'chlorine_mix_groundwater', 1, 9, DATE '2024-01-09',
       'Groundwater chlorine mix 1:9 as a TYPED PAIR (A3: 10% solution → derived pure fraction 1/10 is computed in consumers, never stored) — serves the P1.5 ÷10 lane via this same spec system',
       'owner-confirmed 2026-11-15 (plan §5.3 A1–A3)'
WHERE NOT EXISTS (
    SELECT 1 FROM core.equipment_spec
    WHERE kind = 'chlorine_mix_groundwater' AND valid_from = DATE '2024-01-09');

-- ───────────────────────────────────────────────────────────────────────────
-- 3) v_reading_meter_chain — per-reading meter chain (WO §2.3.4, ONE view
--    implementing corrections 1–6 + the R2-addendum streak):
--      prev meters via date-ordered LAG (global-MAX bug corrected),
--      hour deltas (delta ≤ 0 or missing counterpart → NULL + boundary
--        flag/reason — never 0, never negative),
--      pump m³ = hours × spec-at-that-date (never ×34/×12 literals;
--        missing spec → NULL + spec_missing flag),
--      wastewater_in_derived numeric-only (both volumes required),
--      delta_kwh from the preflight-identified electric chain,
--      avg_westwater_4d (missing days contribute nothing; empty → NULL),
--      chlorine_used_real per the verbatim ÷SWITCH formula,
--      chlorine_streak_count gaps-and-islands (recorded-usage continuity;
--      gap/NULL resets to 0; first day = 1 — closes the P1.3 deferral).
-- ───────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS wastewater.v_reading_meter_chain;
CREATE VIEW wastewater.v_reading_meter_chain AS
WITH base AS (
    SELECT r.id,
           r.location_id,
           r.reading_date,
           r.created_at,
           r.pump1_meter,
           r.pump2_meter,
           r.chlorine_used,
           r.chlorine_mix_ratio,
           r.carbon_reading_id,
           cr.meter_value AS electric_meter,
           -- คลอรีนน้ำที่ใช้จริง — verbatim ÷SWITCH (reference doc 12 ~767):
           -- blank/unknown ratio or NULL value → NULL, never 0.
           CASE
               WHEN r.chlorine_used IS NULL THEN NULL
               WHEN r.chlorine_mix_ratio = '1:2' THEN r.chlorine_used / 2
               WHEN r.chlorine_mix_ratio = '1:4' THEN r.chlorine_used / 4
               WHEN r.chlorine_mix_ratio = '1:9' THEN r.chlorine_used / 9
               ELSE NULL
           END AS chlorine_used_real
    FROM wastewater.reading r
    LEFT JOIN carbon.reading cr ON cr.id = r.carbon_reading_id
),
ordered AS (
    -- Correction 1: LAG by date (deterministic tie-break), never global MAX.
    SELECT b.*,
           LAG(b.pump1_meter)        OVER w AS prev_pump1_meter,
           LAG(b.pump2_meter)        OVER w AS prev_pump2_meter,
           LAG(b.electric_meter)     OVER w AS prev_electric_meter,
           LAG(b.chlorine_used_real) OVER w AS prev_chlorine_used_real,
           LAG(b.reading_date)       OVER w AS prev_row_date
    FROM base b
    WINDOW w AS (ORDER BY b.reading_date, b.created_at, b.id)
),
computed AS (
    -- Correction 2: delta ≤ 0 or missing counterpart → NULL (guard below in
    -- volumed reasons); Correction 3: spec pick AT THE READING DATE (half-
    -- open window, latest start wins); streak_reset marks islands.
    SELECT o.*,
           s1.flow_m3_per_h AS pump1_spec_flow_m3_per_h,
           s2.flow_m3_per_h AS pump2_spec_flow_m3_per_h,
           CASE
               WHEN o.pump1_meter IS NULL OR o.prev_pump1_meter IS NULL THEN NULL
               WHEN o.pump1_meter - o.prev_pump1_meter <= 0 THEN NULL
               ELSE o.pump1_meter - o.prev_pump1_meter
           END AS pump1_hours,
           CASE
               WHEN o.pump2_meter IS NULL OR o.prev_pump2_meter IS NULL THEN NULL
               WHEN o.pump2_meter - o.prev_pump2_meter <= 0 THEN NULL
               ELSE o.pump2_meter - o.prev_pump2_meter
           END AS pump2_hours,
           CASE
               WHEN o.electric_meter IS NULL OR o.prev_electric_meter IS NULL THEN NULL
               WHEN o.electric_meter - o.prev_electric_meter <= 0 THEN NULL
               ELSE o.electric_meter - o.prev_electric_meter
           END AS delta_kwh,
           CASE
               WHEN o.chlorine_used_real IS NOT NULL
                    AND o.prev_chlorine_used_real IS NOT NULL
                    AND o.prev_row_date = o.reading_date - 1 THEN 0
               ELSE 1
           END AS streak_reset
    FROM ordered o
    LEFT JOIN LATERAL (
        SELECT es.flow_m3_per_h
        FROM core.equipment_spec es
        WHERE es.kind = 'pump_wastewater_1'
          AND es.valid_from <= o.reading_date
          AND (es.valid_to IS NULL OR es.valid_to > o.reading_date)
        ORDER BY es.valid_from DESC
        LIMIT 1
    ) s1 ON TRUE
    LEFT JOIN LATERAL (
        SELECT es.flow_m3_per_h
        FROM core.equipment_spec es
        WHERE es.kind = 'pump_wastewater_2'
          AND es.valid_from <= o.reading_date
          AND (es.valid_to IS NULL OR es.valid_to > o.reading_date)
        ORDER BY es.valid_from DESC
        LIMIT 1
    ) s2 ON TRUE
),
volumed AS (
    -- Corrections 3+4: volume only when hours exist (spec missing → NULL +
    -- flagged, never 0); derived inflow only when BOTH volumes exist.
    SELECT c.*,
           CASE WHEN c.pump1_hours IS NOT NULL
                THEN c.pump1_hours * c.pump1_spec_flow_m3_per_h END AS pump1_m3,
           CASE WHEN c.pump2_hours IS NOT NULL
                THEN c.pump2_hours * c.pump2_spec_flow_m3_per_h END AS pump2_m3,
           (c.pump1_hours IS NOT NULL AND c.pump1_spec_flow_m3_per_h IS NULL)
               OR (c.pump2_hours IS NOT NULL AND c.pump2_spec_flow_m3_per_h IS NULL)
               AS spec_missing,
           NULLIF(concat_ws(',',
                    CASE WHEN c.pump1_hours IS NOT NULL
                         AND c.pump1_spec_flow_m3_per_h IS NULL
                         THEN 'pump_wastewater_1' END,
                    CASE WHEN c.pump2_hours IS NOT NULL
                         AND c.pump2_spec_flow_m3_per_h IS NULL
                         THEN 'pump_wastewater_2' END), '') AS spec_missing_kinds,
           (   (c.pump1_meter IS NOT NULL AND c.prev_pump1_meter IS NULL)
            OR (c.pump1_meter IS NOT NULL AND c.prev_pump1_meter IS NOT NULL
                AND c.pump1_meter - c.prev_pump1_meter <= 0)
            OR (c.pump2_meter IS NOT NULL AND c.prev_pump2_meter IS NULL)
            OR (c.pump2_meter IS NOT NULL AND c.prev_pump2_meter IS NOT NULL
                AND c.pump2_meter - c.prev_pump2_meter <= 0)
            OR (c.electric_meter IS NOT NULL AND c.prev_electric_meter IS NULL)
            OR (c.electric_meter IS NOT NULL AND c.prev_electric_meter IS NOT NULL
                AND c.electric_meter - c.prev_electric_meter <= 0)
           ) AS meter_boundary_flag,
           NULLIF(concat_ws('; ',
                    CASE WHEN c.pump1_meter IS NOT NULL AND c.prev_pump1_meter IS NULL
                         THEN 'pump1: no previous reading' END,
                    CASE WHEN c.pump1_meter IS NOT NULL AND c.prev_pump1_meter IS NOT NULL
                          AND c.pump1_meter - c.prev_pump1_meter <= 0
                         THEN 'pump1: delta <= 0 (meter reset/swap suspected)' END,
                    CASE WHEN c.pump2_meter IS NOT NULL AND c.prev_pump2_meter IS NULL
                         THEN 'pump2: no previous reading' END,
                    CASE WHEN c.pump2_meter IS NOT NULL AND c.prev_pump2_meter IS NOT NULL
                          AND c.pump2_meter - c.prev_pump2_meter <= 0
                         THEN 'pump2: delta <= 0 (meter reset/swap suspected)' END,
                    CASE WHEN c.electric_meter IS NOT NULL AND c.prev_electric_meter IS NULL
                         THEN 'electric: no previous reading' END,
                    CASE WHEN c.electric_meter IS NOT NULL AND c.prev_electric_meter IS NOT NULL
                          AND c.electric_meter - c.prev_electric_meter <= 0
                         THEN 'electric: delta <= 0 (meter reset/swap suspected)' END), '') AS meter_boundary_reason
    FROM computed c
),
islanded AS (
    -- Correction 4: derived inflow only when BOTH pump volumes exist
    -- (numeric only — never the AppSheet text prompt). Gaps-and-islands:
    -- sum of resets draws island boundaries.
    SELECT v.*,
           CASE WHEN v.pump1_m3 IS NOT NULL AND v.pump2_m3 IS NOT NULL
                THEN v.pump1_m3 + v.pump2_m3 END AS wastewater_in_derived,
           SUM(v.streak_reset) OVER w2 AS streak_island
    FROM volumed v
    WINDOW w2 AS (ORDER BY v.reading_date, v.created_at, v.id)
),
streaked AS (
    SELECT i.*,
           ROW_NUMBER() OVER (PARTITION BY i.streak_island
                              ORDER BY i.reading_date, i.created_at, i.id) AS island_pos
    FROM islanded i
)
SELECT s.id,
       s.location_id,
       s.reading_date,
       s.created_at,
       s.pump1_meter,
       s.prev_pump1_meter,
       s.pump2_meter,
       s.prev_pump2_meter,
       s.electric_meter,
       s.prev_electric_meter,
       s.carbon_reading_id,
       s.pump1_hours,
       s.pump2_hours,
       s.delta_kwh,
       s.pump1_spec_flow_m3_per_h,
       s.pump2_spec_flow_m3_per_h,
       s.pump1_m3,
       s.pump2_m3,
       s.wastewater_in_derived,
       -- Correction 5: missing days contribute nothing; empty window → NULL.
       AVG(s.wastewater_in_derived) OVER (ORDER BY s.reading_date
            RANGE BETWEEN INTERVAL '3 days' PRECEDING AND CURRENT ROW)
           AS avg_westwater_4d,
       s.chlorine_used,
       s.chlorine_mix_ratio,
       s.chlorine_used_real,
       -- R2 reviewed addendum: continuous recorded-usage streak (gap/NULL
       -- resets to 0; first day = 1) — closes the P1.3 deferral.
       CASE WHEN s.chlorine_used_real IS NULL THEN 0
            ELSE s.island_pos END AS chlorine_streak_count,
       s.meter_boundary_flag,
       s.meter_boundary_reason,
       s.spec_missing,
       s.spec_missing_kinds
FROM streaked s;

COMMENT ON VIEW wastewater.v_reading_meter_chain IS
    'ENV-PARITY-P1-002 — meter chain per reading: LAG prev meters (AppSheet global-MAX bug corrected), hour deltas guarded (delta <= 0 or missing counterpart -> NULL + meter_boundary_flag/reason; never 0/negative), pump m3 = hours x equipment_spec AT the reading date (never x34/x12 literals; missing spec -> NULL + spec_missing), wastewater_in_derived numeric-only, delta_kwh from the carbon_reading_id electric chain (preflight-identified), avg_westwater_4d, chlorine_used_real per the verbatim division-SWITCH formula, chlorine_streak_count gaps-and-islands (R2 reviewed addendum closing the P1.3 deferral). Computed, never stored.';
