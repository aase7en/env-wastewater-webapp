-- ============================================================================
-- ENV-PARITY-P1-001 C1 — AppSheet parity Phase 1, lane P1.1 (schema-only)
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P1-001.md
-- (§2 binds scope exactly; §3.1 this file). Plan row: docs/ai/
-- APPSHEET-PARITY-PLAN.md §6 Phase 1 row P1.1 ("Schema: เพิ่มคอลัมน์ ENV
-- ฝั่งบ่อบำบัด (อัตราส่วนผสม enum, enum ล้างตะแกรง/สถานะเครื่องจักร map กับ
-- boolean เดิม) + enum ตำแหน่ง/สถานะบุคลากร").
--
-- Enum ground truth — quoted VERBATIM from the read-only definition
-- reference docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md:
--   §3.2 ตำแหน่ง  : นายแพทย์ / พนักงานบริการ / นักวิชาการสาธารณสุข /
--                   นักโภชนาการ / พนักงานประกอบอาหาร
--   §3.2 สถานะ    : ทำงาน / ย้ายกลุ่มงาน / ลาออก / ลาศึกษาต่อ
--   §3.3 อัตราส่วนผสม(คลอรีน/น้ำ): 1:2 / 1:4 / 1:9 (initial value =1:4)
--   §3.3 ล้างตะแกรงบ่อสูบ/ละเอียด : Enum ไม่ล้าง / ล้าง
--   §3.3 เครื่องสูบน้ำเสีย 1–2, เครื่องเติมอากาศ 1–2, เครื่องสูบตะกอน 1–2,
--        เครื่องจ่ายคลอรีน 1–2 : Enum ปกติ / เสีย
-- No invented values. The AppSheet initial values (1:4, ไม่ล้าง, ล้าง,
-- ปกติ) are UI defaults and are intentionally NOT mirrored as DB column
-- defaults (unknown ≠ zero ≠ any value).
--
-- ZERO-DML: this file contains schema definition statements only — no
-- data writes of any kind, no row backfill (the 907 historical
-- wastewater.reading rows are untouched), no row-level-security DDL, no
-- permission changes, no functions, no triggers, no column defaults.
-- ============================================================================
--
-- (a) 3 enum CHECK constraints on EXISTING nullable free-text columns,
--     each added NOT VALID:
--   * NOT VALID rationale: the existing-row scan is skipped, so the 907
--     historical rows are never touched or rewritten; the check still
--     enforces on every new/changed row from now on — parity going
--     forward, history untouched. Legacy non-enum values found in the
--     D3 preflight (core.personnel.position: 3 rows; core.personnel.
--     status: 6 'active' rows) stay readable and are never coerced —
--     honesty rule "unknown ≠ normal"; a later VALIDATE CONSTRAINT is an
--     explicit follow-up gated on an owner decision about legacy cleanup.
--   * NULL passes every check (an unclassified employee or an unrecorded
--     ratio keeps its true state; never coerced to a value).
--
-- (b) 10 additive parity columns on wastewater.reading: the AppSheet
--     ล้างตะแกรง/สถานะเครื่องจักร enums mapped alongside the EXISTING
--     boolean machine-state columns. Additive, non-destructive mapping
--     per plan wording "map กับ boolean เดิม":
--       screen_cleaned_coarse  ↔ screen_cleaned_coarse_status  (ล้าง/ไม่ล้าง)
--       screen_cleaned_fine    ↔ screen_cleaned_fine_status    (ล้าง/ไม่ล้าง)
--       pump1_running          ↔ pump1_running_status          (ปกติ/เสีย)
--       pump2_running          ↔ pump2_running_status          (ปกติ/เสีย)
--       aerator1_running       ↔ aerator1_running_status       (ปกติ/เสีย)
--       aerator2_running       ↔ aerator2_running_status       (ปกติ/เสีย)
--       sludge_pump1_running   ↔ sludge_pump1_running_status   (ปกติ/เสีย)
--       sludge_pump2_running   ↔ sludge_pump2_running_status   (ปกติ/เสีย)
--       chlorine_pump1_running ↔ chlorine_pump1_running_status (ปกติ/เสีย)
--       chlorine_pump2_running ↔ chlorine_pump2_running_status (ปกติ/เสีย)
--     Boolean ↔ enum mapping (documented only — no sync trigger, no
--     backfill in this lane): true ↔ 'ล้าง' / 'ปกติ', false ↔
--     'ไม่ล้าง' / 'เสีย'. The EXISTING booleans REMAIN the source of
--     truth; the new enum columns are parallel parity surface for later
--     lanes (P1.2 views/derivations, P1.4 form parity own the write-path
--     mapping). All 10 columns: type text, NULLABLE, NO default.
--
-- (c) Explicit non-goals honored: คลอรีนน้ำที่ใช้จริง stays the stored
--     input column chlorine_used — its spreadsheet-formula DERIVATION
--     (dose ÷ SWITCH(ratio)) belongs to P1.2; no derived/duplicate
--     column and no formula/trigger is added here.
--
-- ============================================================================
-- ROLLBACK (schema-only, reverse order; run via the same Management-API
-- apply path):
--   ALTER TABLE wastewater.reading DROP CONSTRAINT IF EXISTS
--     ck_wastewater_reading_chlorine_mix_ratio_enum;
--   ALTER TABLE core.personnel DROP CONSTRAINT IF EXISTS
--     ck_core_personnel_position_enum;
--   ALTER TABLE core.personnel DROP CONSTRAINT IF EXISTS
--     ck_core_personnel_status_enum;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS screen_cleaned_coarse_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS screen_cleaned_fine_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS pump1_running_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS pump2_running_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS aerator1_running_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS aerator2_running_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS sludge_pump1_running_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS sludge_pump2_running_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS chlorine_pump1_running_status;
--   ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS chlorine_pump2_running_status;
-- (constraints on existing columns are dropped by name; the existing
-- columns themselves are never dropped — rollback removes ONLY the 13
-- objects this migration created)
-- ============================================================================

ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS screen_cleaned_coarse_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS screen_cleaned_fine_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS pump1_running_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS pump2_running_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS aerator1_running_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS aerator2_running_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS sludge_pump1_running_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS sludge_pump2_running_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS chlorine_pump1_running_status text;
ALTER TABLE wastewater.reading
  ADD COLUMN IF NOT EXISTS chlorine_pump2_running_status text;

-- CHECK 1/3 — อัตราส่วนผสม(คลอรีน/น้ำ) on the EXISTING
-- wastewater.reading.chlorine_mix_ratio (1:2 / 1:4 / 1:9, verbatim §3.3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_wastewater_reading_chlorine_mix_ratio_enum'
      AND conrelid = 'wastewater.reading'::regclass
  ) THEN
    ALTER TABLE wastewater.reading
      ADD CONSTRAINT ck_wastewater_reading_chlorine_mix_ratio_enum
      CHECK (chlorine_mix_ratio IN ('1:2','1:4','1:9')) NOT VALID;
  END IF;
END
$$;

-- CHECK 2/3 — ตำแหน่ง on the EXISTING core.personnel.position
-- (5 values, verbatim §3.2)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_core_personnel_position_enum'
      AND conrelid = 'core.personnel'::regclass
  ) THEN
    ALTER TABLE core.personnel
      ADD CONSTRAINT ck_core_personnel_position_enum
      CHECK (position IN ('นายแพทย์','พนักงานบริการ','นักวิชาการสาธารณสุข',
                          'นักโภชนาการ','พนักงานประกอบอาหาร')) NOT VALID;
  END IF;
END
$$;

-- CHECK 3/3 — สถานะ on the EXISTING core.personnel.status
-- (4 values, verbatim §3.2)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_core_personnel_status_enum'
      AND conrelid = 'core.personnel'::regclass
  ) THEN
    ALTER TABLE core.personnel
      ADD CONSTRAINT ck_core_personnel_status_enum
      CHECK (status IN ('ทำงาน','ย้ายกลุ่มงาน','ลาออก','ลาศึกษาต่อ')) NOT VALID;
  END IF;
END
$$;
