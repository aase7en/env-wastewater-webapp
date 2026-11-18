-- ============================================================================
-- ENV-PARITY-P3-003 C1 — the maintenance/calibration log (core.item_calibration)
-- + the guarded 11-row `maintaining` seed (AppSheet parity Phase 3, lane
-- P3.3, v1.11.0).
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P3-003.md
-- (plan §6 Phase 3 row P3.3 line 247 VERBATIM: "maintenance/สอบเทียบ
-- (core.item_calibration หรือตารางย่อย)"). Handoff:
-- docs/ai/handoffs/ENV-PARITY-P3-003-GLM.md. Predecessors: P1.1–P1.7,
-- P2.1–P2.6, P3.1 (v1.9.0 — core.item exists, 0 rows), P3.2 (v1.10.0).
--
-- DELIVERS (the ONE authorized supabase write of this lane):
--   1. core.item_calibration — the maintenance/calibration log table
--      translating reference 12 §3.30 `maintenance` (ref 4864-4884: 7
--      columns, key `maintenanceID`) × the sheet-side sources
--   2. the guarded seed: the 11 `maintaining` rows (workbook
--      tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw,
--      full XLSX export 5,913 bytes GET-only 2026-11-18; census: tool_id
--      11 nonempty / 6 distinct · date 11/5 distinct · calibrate_range
--      7 nonempty / 4 blank · unit 11/4 distinct · compare_ref 11/2
--      distinct) — the seed block below was generated PROGRAMMATICALLY
--      from those bytes, never hand-typed
--   3. RLS (D1-6 RULED posture — the owner dispatch pin for this lane:
--      log/append pattern, the P2.4 lab_test precedent class): SELECT +
--      INSERT staff-or-admin / UPDATE + DELETE admin (UPDATE carries
--      USING + WITH CHECK per house). This AMENDS the WO §3-1 proposed
--      master default (INSERT admin) — hospital staff record calibration
--      entries; admins curate. Recorded, never silent.
--   4. public.item_calibration — security_invoker REST façade (only
--      `public` is PostgREST-reachable) + grants
--   5. house `notify pgrst` trailer (the P2.3 lesson)
--
-- ─── NAME MAPPINGS (§3.30 verbatim → house snake_case + sheet-side) ──────
--   InventoryID (Text)                → item_id uuid NULL FK → core.item(id)
--                                       (parity binding; core.item is 0 rows
--                                       at base — NULL-safe with an HONEST
--                                       empty picker, never a fabricated
--                                       list; the P3.2 item_legacy_id
--                                       precedent)
--   (sheet `tool_id` / the Tool_Machine `mac_id` key space) →
--                                     tool_legacy_id text NULL — verbatim
--                                     8-hex lineage preserved even when
--                                     core.item lacks the row (D1-3 RULED:
--                                     the Tool_Machine machine master stays
--                                     UNSEEDED; core.item stays 0 rows;
--                                     binding via item_id NULL FK +
--                                     tool_legacy_id verbatim)
--   item_Name (Text, Name Label)      → item_name text NULL — honest
--                                       display text while core.item has 0
--                                       rows; NEVER a substitute for the FK
--   Cal_date (Date, initial value
--   TODAY())                          → calibration_date date NOT NULL
--                                       DEFAULT CURRENT_DATE — THE Init
--                                       TRANSLATION: `TODAY()` is the ONLY
--                                       formula in §3.30; it becomes the
--                                       column DEFAULT (new entries default
--                                       to today), carried by NO trigger,
--                                       NO RPC, NO generated column (WO
--                                       §3-2 — a plain log). Documented,
--                                       never silent.
--   Cal_method (Text)                 → cal_method text
--   Cal_result (Text)                 → cal_result text — D1-2 RULED: the
--                                       sheet-side `compare_ref` column IS
--                                       the result-class source of this
--                                       column (the WO §0 equivalence
--                                       "Cal_result/compare_ref (ผล)"),
--                                       so the seeded rows carry cal_result
--                                       = 'InControl' / 'Higher Ref.'
--                                       VERBATIM; NO separate compare_ref
--                                       column (provenance recorded here +
--                                       in source_provenance)
--   maintenanceID (Text Key,
--   UNIQUEID())                       → legacy_id text UNIQUE
--   (system _RowNumber)               → not persisted
--   maintaining-only cycle fields
--   (sheet `calibrate_range` + `unit`): calibrate_range text NULL +
--                                       calibrate_unit text NULL — carried
--                                       additive with recorded provenance
--                                       per D1-2. NOTE (the D2 finding):
--                                       these are MEASURED VALUES (12.7 %,
--                                       319.0 ppm, 7.1 pH, 100.0 %, 1.0
--                                       ppm), NOT intervals — see the
--                                       next-due ruling below.
--
-- ─── NEXT-DUE RULING (D1-5, decided at D2 — recorded, overturnable by the
-- ─── reviewer explicitly, never silently) ────────────────────────────────
--   NO next-due is computed or stored anywhere in this lane. Ground truth:
--   §3.30's only formula is Cal_date Init TODAY(); no next-due column or
--   formula exists anywhere in ref 12 (the R2 zero-hit verification); the
--   `maintaining` sheet is a plain sheet with no formula layer; and the
--   WO §4-2 hypothesized cycle inputs (calibrate_range/calibrate_unit) are
--   MEASURED VALUES with units %/ppm/mg/L/pH — NONE is a duration, so NO
--   interval rule is justifiable from any source. Per the owner dispatch
--   option (D2 decision): the ENV UI shows ครั้งล่าสุด + จำนวนครั้ง per
--   tool and OMITS next-due entirely, with an honest on-screen note that
--   the legacy system has no next-due counterpart. Unknown ≠ zero; never
--   a guessed date; never presented as an AppSheet transcription.
--
-- ─── พ.ศ. DATE TRANSLATION (the seed's one recorded value conversion) ────
--   The sheet `date` values carry พ.ศ. (Buddhist Era) years (2566/2567 =
--   CE 2023/2024 − consistent with a Thai hospital's calibration history).
--   ENV stores CE dates (year − 543) per the house พ.ศ.-parse rule (the
--   P3.2 MFG precedent: date-typed in ENV; unparseable stays NULL, never
--   coerced). The UI renders CE + 543 back to พ.ศ. Verbatim-fidelity pins
--   apply to the TEXT columns; the date translation is documented here and
--   spot-checked live by scripts/test_parity_p3_003_calibration.py.
--
-- ─── SOURCE HONESTY (WO §2 receipts; D1-4) ───────────────────────────────
--   `maintaining` REACHABLE → the guarded 11-row seed ships (11/11 count
--   reconciliation + the census above; blanks ⇒ NULL; verbatim strings;
--   source_provenance pins workbook + tab + fetch date). `tool_Calibrate`
--   (the sheet-side §3.30 mirror) is REACHABLE-but-EMPTY — 0 rows, the
--   honest zero recorded, nothing fabricated. The `Tool_Machine` machine
--   master (20 rows) stays UNSEEDED (D1-3). core.item stays 0 rows.
--
-- ─── RLS (D1-6 RULED — log/append; zero anon policies → fail-closed) ─────
--   SELECT : authenticated, using (core.fn_is_staff_or_admin())
--   INSERT : authenticated, with check (core.fn_is_staff_or_admin())
--   UPDATE : authenticated, using + with check (core.fn_is_admin())
--   DELETE : authenticated, using (core.fn_is_admin())
--
-- ─── PREFLIGHT (verified live before apply; all held) ─────────────────────
--   to_regclass('core.item_calibration') NULL (absent);
--   to_regclass('public.item_calibration') NULL; pg_policies on the table 0
--   baselines intact: wastewater.reading 907 / core.personnel 9 /
--   core.equipment_spec 4 / safety.emergency_light 48 /
--   safety.fire_extinguisher 0 / safety.emergency_light_check 332 /
--   food.lab_test 0 / core.item 0 / core.vendor 0 / core.item_category 0 /
--   core.distributor 6 / chemical.inventory_lot 0
--
-- ─── ROLLBACK (schema-only; run as a separate script behind the same gate;
--      DESTRUCTIVE — drops seeded rows and any admin-entered history) ────
--   DROP VIEW IF EXISTS public.item_calibration;
--   REVOKE ALL ON public.item_calibration FROM authenticated;
--   DROP TABLE IF EXISTS core.item_calibration;
--   NOTIFY pgrst, 'reload schema';
--
-- Zero writes to any other table. The seed block is guarded WHERE NOT
-- EXISTS — re-running it is a no-op (idempotency contract, tested by
-- test_seed_block_resend_inserts_zero_rows).
-- ============================================================================

-- ─── 1) core.item_calibration (§3.30 `maintenance` translation) ────────────

create table core.item_calibration (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id          uuid REFERENCES core.item(id),  -- AppSheet 'InventoryID' — parity binding, NULL-safe (core.item 0 rows at base; honest empty picker)
    tool_legacy_id   text,                           -- sheet-side tool_id verbatim 8-hex lineage (Tool_Machine mac_id key space; D1-3)
    item_name        text,                           -- AppSheet 'item_Name' (Name Label) — honest display text, never an FK substitute
    calibration_date date NOT NULL DEFAULT CURRENT_DATE,  -- AppSheet 'Cal_date' Init TODAY() — THE Init translation (the table's only formula)
    cal_method       text,                           -- AppSheet 'Cal_method' verbatim (no maintaining source column → NULL, never fabricated)
    cal_result       text,                           -- AppSheet 'Cal_result' verbatim; seeded rows carry the sheet-side compare_ref result class verbatim (D1-2)
    calibrate_range  text,                           -- maintaining-only measured value (NOT an interval — the D1-5 D2 finding)
    calibrate_unit   text,                           -- maintaining-only unit (%/ppm/mg/L/pH observed)
    source_provenance text NOT NULL DEFAULT 'manual admin entry (ENV v1.11.0)',
    legacy_id        text UNIQUE,                    -- AppSheet 'maintenanceID' UNIQUEID() / sheet-side maintaining.id verbatim
    note             text,
    recorded_by      uuid,
    created_at       timestamptz NOT NULL DEFAULT now()
);

comment on table core.item_calibration is
    'ENV-PARITY-P3-003 — AppSheet §3.30 maintenance (ref 4864-4884) as the maintenance/calibration log. A plain log: NO RPC, NO trigger, NO generated column (WO §3-2) — next-due is DISPLAY-TIME ONLY and is NOT computed at all (D1-5 D2 ruling: the maintaining cycle fields are measured values, not intervals; the legacy system has no next-due counterpart; ENV shows ครั้งล่าสุด + จำนวนครั้ง and states the absence honestly).';

-- ─── 2) RLS + policies (D1-6 RULED log/append posture) ─────────────────────

alter table core.item_calibration enable row level security;

drop policy if exists calibration_select on core.item_calibration;
create policy calibration_select
    on core.item_calibration for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists calibration_insert_staff on core.item_calibration;
create policy calibration_insert_staff
    on core.item_calibration for insert to authenticated
    with check (core.fn_is_staff_or_admin());

drop policy if exists calibration_update_admin on core.item_calibration;
create policy calibration_update_admin
    on core.item_calibration for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists calibration_delete_admin on core.item_calibration;
create policy calibration_delete_admin
    on core.item_calibration for delete to authenticated
    using (core.fn_is_admin());

grant select, insert, update, delete on core.item_calibration to authenticated;

-- ─── 3) the REST façade (security_invoker — only `public` is reachable) ────

create view public.item_calibration
with (security_invoker=on) as
select * from core.item_calibration;

comment on view public.item_calibration is
    'ENV-PARITY-P3-003 — REST façade over the calibration log. security_invoker: row access follows the caller through the core.item_calibration RLS policies (SELECT+INSERT staff-or-admin; UPDATE+DELETE admin — the D1-6 ruled log/append posture). Zero anon policies — anonymous access fails closed.';

grant select, insert, update, delete on public.item_calibration to authenticated;

-- ─── 4) column comments — the honesty pins ─────────────────────────────────

comment on column core.item_calibration.calibration_date is
    'P3.3 — AppSheet Cal_date (Date, initial value TODAY(), §3.30 ref 4864-4884). The Init translation: the column DEFAULT CURRENT_DATE (the ONLY formula in the §3.30 table; carried by NO trigger/RPC/generated column). Seeded rows carry the sheet-side maintaining.date values translated พ.ศ.→CE (year − 543; the house พ.ศ.-parse rule, P3.2 MFG precedent) — the UI renders CE + 543 back to พ.ศ.';
comment on column core.item_calibration.cal_result is
    'P3.3 — AppSheet Cal_result verbatim (§3.30). D1-2 ruling: the sheet-side maintaining.compare_ref IS the result-class source of this column (the WO §0 equivalence Cal_result/compare_ref = ผล), so seeded rows carry ''InControl'' / ''Higher Ref.'' VERBATIM; no separate compare_ref column; provenance in source_provenance. A blank result renders ยังไม่ทราบ — never ผ่าน (unknown ≠ zero).';
comment on column core.item_calibration.calibrate_range is
    'P3.3 — maintaining-only field carried per D1-2 (additive NULLable, provenance recorded). D2 finding: MEASURED VALUES (12.7 % / 319.0 ppm / 7.1 pH / 100.0 % / 1.0 ppm observed), NOT calibration intervals — never used to compute a next-due (D1-5).';
comment on column core.item_calibration.tool_legacy_id is
    'P3.3 — sheet-side maintaining.tool_id verbatim 8-hex (the Tool_Machine mac_id key space; D1-3: the machine master stays UNSEEDED, core.item stays 0 rows — binding via item_id NULL FK + this verbatim lineage, the P2.4 equipment_legacy + P3.2 item_legacy_id precedent).';
comment on column core.item_calibration.item_id is
    'P3.3 — AppSheet InventoryID parity binding: uuid-or-NULL FK → core.item(id). core.item is 0 rows at base (SOURCE_UNAVAILABLE — never fabricated), so seeded rows carry NULL and the UI shows an HONEST empty picker; the verbatim tool_legacy_id stays the lineage of record.';
comment on column core.item_calibration.legacy_id is
    'P3.3 — AppSheet maintenanceID UNIQUEID() / sheet-side maintaining.id verbatim 8-hex. 11 values seeded from the maintaining tab (11/11 count reconciliation; census: tool_id 6 distinct / date 5 distinct / calibrate_range 7 nonempty + 4 blank / unit 4 distinct / compare_ref 2 distinct).';

-- ─── 5) seed — the 11 maintaining rows (guarded, idempotent, D1-4) ──────────
-- The block below was generated PROGRAMMATICALLY from the fetched XLSX
-- bytes (/tmp/env-p3-003-maintaining.xlsx — workbook
-- 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw, tab maintaining, 5,913
-- bytes GET-only 2026-11-18) — never hand-typed. Parse: blanks→NULL;
-- strings verbatim; dates translated พ.ศ.→CE (year − 543, documented
-- above); cal_method/item_id/item_name NULL (no maintaining source column;
-- core.item 0 rows). Re-running the block inserts zero rows.
-- tool_Calibrate contributes ZERO rows (REACHABLE-but-EMPTY — the honest
-- zero; never fabricated).

-- >>> SEED-BLOCK-START (guarded, idempotent — re-running is a no-op)
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '1d5ce050', 'af420125', DATE '2024-05-16', '12.7', '%', 'Higher Ref.', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '1d5ce050');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '3c40c1ed', '6aa9cc77', DATE '2023-08-21', NULL, 'ppm', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '3c40c1ed');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT 'e75eb989', 'cf9a417e', DATE '2023-08-21', NULL, 'mg/L', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = 'e75eb989');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '2b2bd62d', '42bfd946', DATE '2023-08-21', '7.1', 'pH', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '2b2bd62d');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT 'e424523a', '34d97b35', DATE '2023-08-21', NULL, '%', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = 'e424523a');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '18211fa1', 'af420125', DATE '2023-08-09', NULL, 'mg/L', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '18211fa1');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '0f579225', 'af420125', DATE '2024-05-16', '319.0', 'ppm', 'Higher Ref.', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '0f579225');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '678f6b15', '0c0e6a47', DATE '2024-05-16', '319.0', 'ppm', 'Higher Ref.', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '678f6b15');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT 'b0106ceb', '42bfd946', DATE '2024-05-20', '7.1', 'pH', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = 'b0106ceb');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '50ae0e7b', '34d97b35', DATE '2024-05-20', '100.0', '%', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '50ae0e7b');
INSERT INTO core.item_calibration (legacy_id, tool_legacy_id, calibration_date, calibrate_range, calibrate_unit, cal_result, cal_method, item_id, item_name, source_provenance) SELECT '664d0c36', 'cf9a417e', DATE '2024-05-30', '1.0', 'ppm', 'InControl', NULL, NULL, NULL, 'workbook tool_maintainance 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw tab maintaining (full XLSX export 5,913 bytes GET-only 2026-11-18) — ENV-PARITY-P3-003 guarded seed' WHERE NOT EXISTS (SELECT 1 FROM core.item_calibration WHERE legacy_id = '664d0c36');
-- <<< SEED-BLOCK-END

-- ─── 6) house trailer — PostgREST schema cache reload (the P2.3 lesson) ────
notify pgrst, 'reload schema';
