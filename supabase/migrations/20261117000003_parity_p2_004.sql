-- ============================================================================
-- ENV-PARITY-P2-004 C1 — coliform ×3 two-step testing via the additive
-- food.lab_test extension (AppSheet parity Phase 2, lane P2.4, v1.7.0).
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P2-004.md
-- (plan §6 Phase 2 row P2.4). Handoff:
-- docs/ai/handoffs/ENV-PARITY-P2-004-GLM.md. Predecessors: P2.1–P2.3
-- (safety asset masters + extinguisher QR flow v1.5.0 + emergency-light
-- check flow + 332-row seed v1.6.0).
--
-- DECISIONS PINNED AT CLAIM (WO §3/§8):
--   D1-2 ONE generic additive extension of food.lab_test — never a
--        dedicated water table (plan text + §3.3 mapping + the existing
--        generic shape). The pre-existing 15 columns are UNTOUCHED.
--   D1-3 SEED NOTHING (SOURCE_UNAVAILABLE — WO §2.1 locate receipt: zero
--        coliform tabs in any public workbook; AppSnapshot = definitions
--        only). legacy_id + source_provenance ship NOW so the deferred
--        seed needs NO second migration. This file carries ZERO INSERT
--        statements; the re-fetch obligation joins the extinguisher-master
--        ledger entry.
--   D1-5 personnel resolution UUID-or-NULL, NEVER verbatim: the AppSheet
--        ผู้เก็บตัวอย่าง/ผู้รายงาน/employee-sample Refs target
--        ข้อมูลผู้ปฏิบัติงาน whose key Employee_id IS the Thai national ID
--        (ref 12 §11). The *_legacy TEXT columns are reserved for
--        DRIVE-SOURCED unresolved values only — never repo-committed
--        verbatim identifiers.
--   D1-6 existing RLS UNTOUCHED: the ONE policy lab_test_authenticated_rw
--        (FOR ALL TO authenticated, staff-or-admin), the audit trigger
--        trg_audit_log and the dormant trg_decrement_reagent stay exactly
--        as delivered (oauth4 restate + FOOD-CORE-001). No grants change;
--        the public.lab_test security_invoker façade flows the new columns
--        through automatically (select * — no façade statement here).
--   D1-7 two-step flow semantics: sample_date (NOT NULL DEFAULT
--        CURRENT_DATE, existing) = Collect_date — always filled at step 1;
--        the RESULT step (result / mpn_value / reported_date / reporter_id)
--        is app-supplied — NO DB default is added on any result-side
--        column (AppSheet Result_date TODAY() inits are FORM-only). A row
--        is created collect-first with result fields NULL (รอผล) and
--        completed later (กรอกผลภายหลัง). The verbatim Show If
--        `TODAY()>[Collect_date]` (ref 3656/3838) is UI gating: same-day
--        collect stays pending — honest AppSheet parity. Suggested
--        +1/+2 วัน (ref 3654/3848) are UI-only suggestions — never
--        auto-filled, never enforced.
--   D1-8 documented value sets are UI-restricted verbatim lists — NO hard
--        CHECK constraint is added (P1.001 lesson: unknown ≠ rejected).
--        The value sets are pinned verbatim in the column comments below.
--   D1-4 equipment prepared-not-FKed: equipment_legacy carries the
--        AppSheet Items Item ID verbatim (aca317bf default water/food,
--        2fe4aa7c default employee — the two real IDs in the formulas,
--        ref 3594/3650/3834). core.item does NOT exist (never fabricated,
--        P2.1 lesson); the true equipment_id FK → Items master is the
--        Phase-3 successor's obligation (plan: "FK อุปกรณ์→Items master
--        เตรียม Phase 3").
--
-- SOURCE LINEAGE (reference 12 READ-ONLY — docs/ai/digital-twin/
-- 12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md):
--   §3.11 `coliform bac.` (ref 2973-3060) — the general table:
--       สานถานที่เก็บตัวอย่าง {โรงครัว, บ่อบำบัด}; Result {Positive,
--       Negative}; ผู้รายงาน Valid If ตำแหน่ง<>"นายแพทย์".
--   §3.16 `coliform bac._Water` (ref 3528-3601) — Collect_Location Enum
--       Key {โรงครัว, ตู้กดน้ำ OPD, ตู้กดน้ำ IPD, ตู้กดน้ำปฐมภูมิ
--       (ห้องฟัน)}; Result_bac. {Positive, Negative}; อุปกรณ์ init
--       =aca317bf. No Show If, no suggested dates, no image column —
--       ENV renders water through the SAME plan-row two-step flow but
--       WITHOUT +1/+2 suggestions (honest per-source parity).
--   §3.17 `coliform bac. Food.` (ref 3603-3789) — sample {ช้อนสั้น, ถาด,
--       มือพี่กุ้ง, มือป้าอ้อ, มือแก๊ป}; Result_date Suggested
--       =LIST(date([Collect_date]+1),date([Collect_date]+2)) + Show If
--       =TODAY()>[Collect_date]; Result_bac. {Positive, Negative,
--       Positive ++, invalid}; ภาพผลการตรวจ Image + same Show If;
--       ผู้เก็บ Valid If (นักวิชาการสาธารณสุข, สถานะ≠ลาออก, ≠นายแพทย์);
--       ผู้รายงาน Valid If (นักวิชาการสาธารณสุข); อุปกรณ์ init =aca317bf.
--   §3.19 `coliform bac. Employee` (ref 3792-3960) — sample = Ref →
--       ข้อมูลผู้ปฏิบัติงาน Valid If OR(ตำแหน่ง="นักโชชนาการ",
--       ตำแหน่ง="พนักงานประกอบอาหาร") (the swab SUBJECT is a person);
--       Result_date Suggested +1/+2 + same Show If; Result_bac. extended
--       set; ภาพผลการตรวจ Image; อุปกรณ์ init =2fe4aa7c.
--   (§3.37 Filter_ColiformBac is OUT of this lane — P2.5 numbers + Phase 4
--   PDF; the §3.11 อ11 static-image virtual and the §3.17 อุปกรณ์ (List)
--   virtual are display-time derivations — never stored.)
--
-- PREFLIGHT (live-verified 2026-11-17 before apply):
--   the 11 new columns absent from food.lab_test; baselines
--   wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 /
--   safety.emergency_light 48 / safety.fire_extinguisher 0 /
--   safety.extinguisher_inspection 0 / safety.emergency_light_check 332 /
--   food.lab_test 0 (the SOURCE_UNAVAILABLE 0-row disclosure).
--
-- ROLLBACK (reverse order; DESTRUCTIVE — drops any rows already entered
-- through the new UI; run only if the lane is reverted before Phase 3):
--   alter table food.lab_test drop constraint if exists lab_test_legacy_id_key;
--   drop index if exists lab_test_legacy_id_key;
--   alter table food.lab_test
--       drop column if exists source_provenance,
--       drop column if exists legacy_id,
--       drop column if exists result_image,
--       drop column if exists equipment_legacy,
--       drop column if exists reporter_legacy,
--       drop column if exists reporter_id,
--       drop column if exists collected_by_legacy,
--       drop column if exists collected_by_id,
--       drop column if exists sample_person_id,
--       drop column if exists collect_point,
--       drop column if exists sample_source;
--   notify pgrst, 'reload schema';
--   (The pre-existing 15 columns, the RLS policy, both triggers, the
--   façade view and all grants are NEVER touched — the rollback removes
--   ONLY what this migration added.)
--
-- Zero writes to any other table. No policy/grant/trigger/façade change.
-- ============================================================================

-- ─── 1) The 11 additive columns (idempotent; existing 15 untouched) ───────

ALTER TABLE food.lab_test
    ADD COLUMN IF NOT EXISTS sample_source      text,
    ADD COLUMN IF NOT EXISTS collect_point      text,
    ADD COLUMN IF NOT EXISTS sample_person_id   uuid REFERENCES core.personnel(id),
    ADD COLUMN IF NOT EXISTS collected_by_id    uuid REFERENCES core.personnel(id),
    ADD COLUMN IF NOT EXISTS collected_by_legacy text,
    ADD COLUMN IF NOT EXISTS reporter_id        uuid REFERENCES core.personnel(id),
    ADD COLUMN IF NOT EXISTS reporter_legacy    text,
    ADD COLUMN IF NOT EXISTS equipment_legacy   text,
    ADD COLUMN IF NOT EXISTS result_image       text,
    ADD COLUMN IF NOT EXISTS legacy_id          text,
    ADD COLUMN IF NOT EXISTS source_provenance  text;

-- ─── 2) legacy_id UNIQUE — AppSheet Row ID traceability for the DEFERRED
--       seed (0 rows exist now; SOURCE_UNAVAILABLE D1-3). NULL duplicates
--       stay allowed (standard UNIQUE semantics — manual UI rows carry
--       no legacy id).

DO $p2_004_unique$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'food.lab_test'::regclass
          AND conname  = 'lab_test_legacy_id_key'
    ) THEN
        ALTER TABLE food.lab_test
            ADD CONSTRAINT lab_test_legacy_id_key UNIQUE (legacy_id);
    END IF;
END
$p2_004_unique$;

-- ─── 3) Column comments — the documented value sets verbatim (D1-8: UI
--       restricted, NO hard CHECK) + the provenance/PII pins ───────────────

COMMENT ON COLUMN food.lab_test.sample_source IS
    'P2.4 — which coliform surface the row belongs to. Documented values (UI-restricted, NO hard CHECK — D1-8): น้ำ (§3.16 Water) / อาหาร (§3.17 Food) / พนักงาน (§3.19 Employee) / ทั่วไป (§3.11 general). NULL = unknown stays unknown.';

COMMENT ON COLUMN food.lab_test.collect_point IS
    'P2.4 — จุดเก็บตัวอย่าง verbatim per source (UI-restricted, NO hard CHECK — D1-8): น้ำ {โรงครัว, ตู้กดน้ำ OPD, ตู้กดน้ำ IPD, ตู้กดน้ำปฐมภูมิ (ห้องฟัน)} (§3.16) · อาหาร {ช้อนสั้น, ถาด, มือพี่กุ้ง, มือป้าอ้อ, มือแก๊ป} (§3.17) · ทั่วไป {โรงครัว, บ่อบำบัด} (§3.11) · พนักงาน NULL (the sample is a person — §3.19). The legacy sample_point text column is untouched (compat).';

COMMENT ON COLUMN food.lab_test.sample_person_id IS
    'P2.4 — the employee-swab subject (§3.19 sample Ref). UUID-or-NULL FK → core.personnel(id): personnel-class data NEVER carries verbatim national-ID-class identifiers (PII pin D1-5; ref 12 §11). Valid If semantics (ตำแหน่ง นักโภชนาการ/พนักงานประกอบอาหาร) = UI gating.';

COMMENT ON COLUMN food.lab_test.collected_by_id IS
    'P2.4 — ผู้เก็บตัวอย่าง resolved (§3.17/§3.19). UUID-or-NULL FK → core.personnel(id); app entries resolve via the signed-in identity picker (house auth — no AppSheet USEREMAIL() SWITCH transcription). PII pin D1-5.';

COMMENT ON COLUMN food.lab_test.collected_by_legacy IS
    'P2.4 — ผู้เก็บตัวอย่าง legacy TEXT reserved for DRIVE-SOURCED unresolved values only (P2.3 auditor precedent). NEVER verbatim national-ID-class identifiers from this repo.';

COMMENT ON COLUMN food.lab_test.reporter_id IS
    'P2.4 — ผู้รายงาน resolved (all four tables §3.11/§3.16/§3.17/§3.19). UUID-or-NULL FK → core.personnel(id). Result-side step-2 write — NO DB default (D1-7). PII pin D1-5.';

COMMENT ON COLUMN food.lab_test.reporter_legacy IS
    'P2.4 — ผู้รายงาน legacy TEXT reserved for DRIVE-SOURCED unresolved values only. NEVER verbatim national-ID-class identifiers from this repo.';

COMMENT ON COLUMN food.lab_test.equipment_legacy IS
    'P2.4 — อุปกรณ์ verbatim AppSheet Items Item ID (aca317bf default water/food, 2fe4aa7c default employee — ref 3594/3650/3834). NO FK: core.item does not exist (never fabricated — P2.1 lesson); the true equipment_id FK → Items master is the Phase-3 successor obligation (D1-4).';

COMMENT ON COLUMN food.lab_test.result_image IS
    'P2.4 — ภาพผลการตรวจ (§3.17/§3.19). NEW UI entries follow the house core.attachment pattern and store the Storage path here (P2.3 pic_path precedent); legacy Drive-relative refs would be stored verbatim if a seed ever arrives. Show If TODAY()>Collect_date = UI gating (D1-7).';

COMMENT ON COLUMN food.lab_test.legacy_id IS
    'P2.4 — the AppSheet Row ID verbatim (UNIQUEID("PackedUUID") tokens). UNIQUE for the DEFERRED coliform-history seed (SOURCE_UNAVAILABLE D1-3 — WO §2.1): when the owner shares the sheets, the guarded P2.1/P2.3 seed pattern applies with NO second schema migration. NULL for manual UI rows.';

COMMENT ON COLUMN food.lab_test.source_provenance IS
    'P2.4 — MIGRATION.md provenance convention: manual UI entries set their own (e.g. ENV UI manual entry); a future seed pins workbook+tab+fetch date.';

-- ─── P3-1 (house trailer): PostgREST schema cache reload.
notify pgrst, 'reload schema';
