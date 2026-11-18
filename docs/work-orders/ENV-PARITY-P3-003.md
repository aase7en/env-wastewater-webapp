# Work Order — ENV-PARITY-P3-003 (Claim ENV-PARITY-P3-003-C1, gen 1)

**Status: REGISTERED — CLAIMED — IMPLEMENTATION DELIVERED, STOP AT REVIEW_REQUESTED (PR #229 @ head `0dfeb73`; the implementer never merges; the authorized reviewer owns approval + merge. D2/D3/D4 receipts in §11 below.)**

**Governance pattern:** PR #183–#227 claim-transition series (docs-only claim → reviewed merge → implementation lane → D5 fresh-GLM → closeout). Direct predecessor: ENV-PARITY-P3-002 (PRs #225/#226/#227 — delivered + RELEASED v1.10.0 + CLOSED; base `29087982624da2ad6a28bd3bcd70de53791e5452` = the P3.2 closeout merge). This lane is **Phase 3 lane 3, the THIRD Phase-3 lane**.

**Routing:** Track-Z GLM (schema/SQL/RLS/lib/tests + the minimal admin UI). One writer per file; the implementing lane never merges its own PR; the authorized reviewer owns approval + merge.

## 0. Lane identity — plan row pinned VERBATIM, boundary decided at claim

AppSheet parity program **Phase 3 — งานสนับสนุน — lane P3.3** (plan `docs/ai/APPSHEET-PARITY-PLAN.md` §6 Phase 3, row P3.3, **line 247**, quoted VERBATIM — this row text, not any dispatch shorthand, is the lane scope):

> | P3.3 | maintenance/สอบเทียบ (`core.item_calibration` หรือตารางย่อย) |

The row's components, bound AS WRITTEN (D1-1, THE adversarial check item):

1. **maintenance/สอบเทียบ — the AppSheet ground truth** = reference 12 **§3.30 ตาราง `maintenance` — 7 คอลัมน์ (key `maintenanceID`)** (ref 4864-4884), transcribed VERBATIM and binding: `_RowNumber` (System hidden); `InventoryID` Text; `maintenanceID` Text Key; `item_Name` Name Label; `Cal_date` Date, **initial value `TODAY()`**; `Cal_method` Text; `Cal_result` Text. Data access mode `as app creator`; Update mode `7`. **The ONLY formula in the table is `Cal_date` Init `TODAY()`** — every other column is a plain persisted field.
2. **`core.item_calibration` หรือตารางย่อย** — the row itself names the proposed table and offers the sub-table alternative. WO proposes ONE new log table `core.item_calibration` (the row's own primary name) translating §3.30 × the sheet-side sources; D1-2 rules the shape.
3. **The sheet-side sources** (the maintenance/calibration reality outside the AppSheet snapshot): the pond workbook tabs `Tool_Machine` (17-col machine master, 20 rows) + `tool_Calibrate` (6-col §3.30 mirror, **0 rows**), and the standalone `tool_maintainance` workbook tab `maintaining` (6-col calibration history, **11 rows**) — full receipts in §2.

**The honesty pin up front:** the dispatch paraphrase "รายการเครื่องมือ, วันส่งสอบเทียบ, ผล, รอบถัดไป" maps onto the sources as `tool_id`/`item_Name` (รายการเครื่องมือ), `Cal_date`/`date` (วันส่งสอบเทียบ), `Cal_result`/`compare_ref` (ผล) — but **"รอบถัดไป" (next calibration due) has NO verbatim AppSheet counterpart**: no next-due column exists in §3.30, and no next-due formula exists anywhere in reference 12 (§4/D1-5). Next-due in ENV is an ENV display-time computation candidate, NEVER presented as an AppSheet transcription.

**Boundary decision (D1-1):** THIS lane = the maintenance/calibration log schema + RLS + the guarded 11-row seed + the minimal admin maintenance/calibration UI (list + form) + the next-due display semantics per §4/D1-5 + tests. **NOT in this lane:** P3.4 job/QR/geofence; P3.5 คู่มือ ×2 + address; P3.6 tests consolidated lane; Phase 4 PDF/Telegram dispatcher surfaces; Phase 5 cutover; the `Tool_Machine` machine-master seeding (REACHABLE 20 rows — recorded candidate, D1-3 rules, default OUT); PDF/export/print of calibration certificates; CI; reference/plan docs; Drive writes. Every unlisted module/behavior is forbidden.

## 1. Authorization basis

1. Owner standing Goal-mode instruction 2026-11-15/16 — "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14 producing `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 3 row P3.3 (line 247, quoted in §0) exactly.
3. The P3.2 closeout frontier (PR #227 merged as `29087982624da2ad6a28bd3bcd70de53791e5452` = THIS transition's base; note verbatim: "**P3.3 next per plan §6 line 247: maintenance/สอบเทียบ (`core.item_calibration` หรือตารางย่อย)**"). This claim IS the P3.3 transition of that record.
4. The P3.1 delivered dependency: `core.item` EXISTS (migration `20261118000001_parity_p3_001.sql`, uuid PK + verbatim `legacy_id` UNIQUE) with **0 rows** (SOURCE_UNAVAILABLE — seeds await owner sheet-shares). The calibration table binds to it additively and NULL-safely with an honest empty picker — the exact P3.2 `chemical.inventory_lot` precedent.

## 2. Source data — seed verdict + existing-surface receipts (this transition, 2026-11-18, all READ-ONLY, zero Drive writes)

| Source | Method (read-only) | Result at this claim | Verdict |
|---|---|---|---|
| AppSheet `maintenance` definition | reference 12 §3.30 (ref 4864-4884) READ-ONLY | 7 columns verbatim (§0-1); only formula = `Cal_date` Init `TODAY()`; the ref-12 37-table index contains **NO `Tool_Machine`/`tool_Calibrate` AppSheet tables** — the machine tabs are sheet-side only | The §3.30 shape is the AppSheet truth spine |
| Pond workbook `Tool_Machine` tab (`1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk`, full XLSX export 366,744 bytes, `/tmp` snapshot, deleted after verification; programmatic tab enumeration) | GET-only XLSX export + openpyxl enumeration | 17 header cols verbatim: `mac_id, ข้อมูลอุปกรณ์, mac_picture, mac_brand, mac_model, mac_HtoU, 'MFG ', 'EXP ', mac_buydate, mac_lifetime, mac_maintenance_date, mac_stock, Unit, ตัวแทน, distributor, วิธีใช้งาน, User manual` (note the trailing spaces in `'MFG '`/`'EXP '`); **20 data rows / 20 unique `mac_id`**; `mac_maintenance_date` 20 nonempty / 10 distinct; `ตัวแทน`, `MFG`, `EXP`, `ข้อมูลอุปกรณ์`, `วิธีใช้งาน` all EMPTY (0 nonempty); `User manual` 7 nonempty | **REACHABLE** — a machine/equipment MASTER (distinct from the §3.29 `Items` table: different key `mac_id` vs `Item ID`, absent from the ref-12 AppSheet index). Recorded candidate; seeding OUT of this lane by default (D1-3) |
| Pond workbook `tool_Calibrate` tab | same export + enumeration | 6 header cols verbatim: `id, ข้อมูลอุปกรณ์, mac_id_ref, Cal_date, Cal_method, Cal_result`; **0 data rows** | **REACHABLE but EMPTY** — the sheet-side mirror of §3.30; nothing to seed from it (the honest zero count is recorded, never turned into fabricated rows) |
| `tool_maintainance` workbook tab `maintaining` (`1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw`, full XLSX export 5,913 bytes; programmatic enumeration) | GET-only XLSX export + enumeration | 6 header cols verbatim: `id, tool_id, date, calibrate_range, unit, compare_ref`; **11 data rows**; census: `tool_id` 11 nonempty / **6 distinct**; `date` 11 nonempty / **5 distinct**; `calibrate_range` 7 nonempty / **4 blank**; `unit` 11 nonempty / 4 distinct; `compare_ref` 11 nonempty / **2 distinct** | **REACHABLE → the guarded seed ships these 11 rows** (count reconciliation 11/11 + the census above; blanks ⇒ NULL; verbatim strings; `source_provenance` pins workbook + tab + fetch date; MIGRATION.md count report) |
| PII census | column-level probes over all three sources | **NO personnel-identity columns in any P3.3 source**: `Tool_Machine.ตัวแทน` EMPTY; `maintaining`/`tool_Calibrate` carry no personnel columns; `compare_ref` = result-class values | The standing personnel rule (UUID-or-NULL, never verbatim) still pins any future personnel resolution; 13-digit digit-run grep of new files = 0 |

The P3.1 same-day 2026-11-18 enumeration (12 pond tabs byte-consistent with P2.4) is corroborated: this transition's fresh export re-enumerates 12 tabs with `Tool_Machine`/`tool_Calibrate`/`distributor` PRESENT. The gviz by-NAME landmine stands (presence/absence proofs = XLSX tab enumeration only).

## 3. Data layer — ONE additive migration (applied to ENV_DB in the implementation lane)

ONE migration `supabase/migrations/20261118000005_parity_p3_003.sql` (exact name pinned — true next slot after `20261118000004_parity_p3_002_revoke_lock.sql`; a D5-demanded repair follows the house `*_fix` convention as a NEW migration, never an edit of the applied one). Components:

1. **`core.item_calibration`** — the maintenance/calibration log table translating §3.30 × the sheet-side sources (AppSheet column → column mapping recorded in SQL comments): `id` uuid PK; `item_id` uuid NULL REFERENCES core.item(id) (parity binding to the `InventoryID`/items side; core.item is 0 rows at base so NULL-safe with an HONEST empty picker — never a fabricated list); `tool_legacy_id` text NULL (verbatim sheet-side `tool_id`/`mac_id_ref` lineage — preserved even when core.item lacks the row, the P2.4 `equipment_legacy` + P3.2 `item_legacy_id` precedent); `item_name` text NULL (AppSheet `item_Name` Label — carried as honest display text while core.item has 0 rows; NEVER a substitute for the FK); `calibration_date` date NOT NULL DEFAULT CURRENT_DATE (AppSheet `Cal_date` Init `TODAY()` verbatim; sheet-side `date`); `cal_method` text (AppSheet `Cal_method` verbatim); `cal_result` text (AppSheet `Cal_result` verbatim; `compare_ref` provenance recorded per D1-2); `calibrate_range` text NULL + `calibrate_unit` text NULL (the `maintaining`-only cycle fields — the §4 next-due computation inputs; carried with recorded provenance per D1-2); `source_provenance` text NOT NULL; `legacy_id` text UNIQUE (AppSheet `maintenanceID` `UNIQUEID()` / sheet-side `id` verbatim); `note` text; `created_at`/`recorded_by` per house. RLS: house master pattern (SELECT `core.fn_is_staff_or_admin()`; INSERT/UPDATE/DELETE `core.fn_is_admin()` with USING+WITH CHECK on UPDATE) — D1-6 confirms/amends.
2. **NO RPC, NO trigger, NO generated column** — the row text names a plain maintenance/calibration log; the §4 next-due is DISPLAY-TIME ONLY (a stored/generated next-due column would persist derived data and is forbidden unless D1-5 explicitly rules otherwise).
3. **Guarded seed:** the 11 `maintaining` rows via the guarded P2.1/P3.1 recipe (single transaction, `WHERE NOT EXISTS` idempotency canary, verbatim strings, blanks ⇒ NULL — `calibrate_range` 4 NULLs, `source_provenance` pins workbook `1QlG0vsk…` + tab `maintaining` + fetch date, MIGRATION.md count report 11/11 + the census). **Nothing else is seeded**: `tool_Calibrate` contributes 0 rows (empty at source); `core.item` stays 0 rows; the `Tool_Machine` machine master stays UNSEEDED (D1-3) — never fabricated, never reconstructed.
4. Baselines asserted in preflight: wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / fire_extinguisher 0 / emergency_light_check 332 / food.lab_test 0 / core.item 0 / core.vendor 0 / core.item_category 0 / core.distributor 6 / chemical.inventory_lot 0 — identical pre/post (RED canary + zero unanticipated durable writes).
5. Rollback SQL documented in-file; applied via `scripts/apply_migration_api.py` behind the **ENV_DB gate** (`SUPABASE_DB_URL`, project `ENV_DB` `gllqtbyofrcjzmbnfoeh`) with preflight + post-verify; house `notify pgrst` trailer (the P2.3 P3 lesson).

## 4. Next-due display semantics — THE honesty pin (D1-5)

1. **Ground truth:** NO verbatim AppSheet next-due formula EXISTS — §3.30's only formula is `Cal_date` Init `TODAY()`; the ref-12 37-table index contains NO `Tool_Machine`/`tool_Calibrate` tables; `maintaining` is a plain sheet (no formula layer exported); `Tool_Machine.mac_maintenance_date` is a machine-level master field, not a computed next-due.
2. **Therefore** "รอบถัดไป" in ENV = a proposed ENV display-time computation from `calibration_date` + `calibrate_range`/`calibrate_unit` (e.g. "1 ปี" → +1 year; unknown/unparseable/blank cycle ⇒ **NO next-due shown** — never fabricated, never a guessed date, unknown ≠ zero). It is labeled a house computation, never "AppSheet verbatim".
3. D1-5 rules the exact display semantics (compute from the cycle fields vs show the raw cycle fields vs omit next-due entirely); a reviewer may overturn explicitly — never silently.

## 5. UI — minimal admin maintenance/calibration surface (house patterns)

- Admin-gated (`RequireAuth requireAdmin`, the `/admin/equipment-specs` + `/admin/masters` + `/admin/inventory` precedent) maintenance/calibration surface: **list** (per-tool calibration history, พ.ศ. dates, honest empty state — no rows ⇒ "ยังไม่มีรายการสอบเทียบ", never a fabricated entry) + **form** (Thai labels; `calibration_date` defaults to today per `Cal_date` Init `TODAY()` verbatim; `cal_method`/`cal_result` verbatim-named; the `maintaining`-only cycle fields carried per D1-2; **validations verbatim = the §3.30 pins ONLY** (`Cal_date` default) — everything else is house-level required/blank-honest validation, never invented as "AppSheet verbatim"); next-due display per §4/D1-5; mobile-first.
- Nav/route additive only (`frontend/src/App.tsx`); no dock rework (Track F concerns park).

## 6. Release decision — v1.11.0 MINOR (D1-7)

New user-visible capability (the admin maintenance/calibration list + form on a new schema) ⇒ the CHANGELOG MINOR criterion (ฟีเจอร์ใหม่ที่ใช้งานได้โดยไม่กระทบของเดิม) — the same class that shipped v1.9.0/v1.10.0. `frontend/package.json` 1.10.0 → **1.11.0** + Thai พ.ศ. CHANGELOG entry carrying the implementation PR; annotated tag at the deployed merge SHA post-deploy per the ENV-APP-VERSION-001 D6 process. The no-bump alternative is REJECTED with this recorded reasoning (a reviewer may overturn explicitly — never silently).

## 7. D-phase plan (Track-Z GLM)

- **D2 RED** — the new unit suite fails-to-collect (module absent — the honest new-file-lane RED mode, P1.5/P2.4/P3.1/P3.2 precedent); the e2e spec records truthful failures over the absent surface; the SQL contract suite (`scripts/test_parity_p3_003_calibration.py`, transaction-scoped BEGIN…ROLLBACK zero-net-persistence) records absent-object failures live pre-apply (table absent; the seed fixtures never sent pre-apply — canary holds, ZERO durable writes); `tsc` records the absent-module error. RED semantics pinned as fixtures: table + column shapes, RLS policy shapes, the guarded-seed idempotency canary (re-run adds 0), blanks⇒NULL census (11/11; 4 NULL `calibrate_range`; distinct counts), verbatim-string fidelity, baseline integrity. Every RED count recorded verbatim; any legacy pass disclosed (the P2.4 P3-1 convention).
- **D3 implement** — the ONE migration (§3) applied to ENV_DB with preflight/rollback; schema lib (`supabase-queries.ts` additive + the new calibration lib); the admin UI (§5); spot-checks live (seed row counts + census in a rolled-back transaction; baselines identical).
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1; guard 344/344 (+450 subtests); runtime 62/62 (+32 subtests); checker OK v1.11.0; `git diff --check` clean; 13-digit digit-run grep of new files = 0.
- **D5** — fresh-GLM independent review at the exact frozen head with an independently executed battery rerun where possible + own live read-only probes. **Implementer never merges; the authorized reviewer owns approval + merge.**

## 8. D1 adjudication items (reviewer)

- **D1-1** — the boundary (THE adversarial item): the row AS WRITTEN = maintenance/สอบเทียบ (the calibration/maintenance log); P3.4–P3.6, Phase 4/5, CI, reference/plan docs, Drive writes OUT. A different reading must be ruled explicitly with the row text quoted.
- **D1-2** — table shape (§0-2/§3-1): ONE `core.item_calibration` (the row's own primary name) vs a sub-table; where the `maintaining`-only columns (`calibrate_range`, `unit`, `compare_ref`) land (carried as additive NULLable columns with recorded provenance — proposed — vs dropped vs a sub-table); `compare_ref` as a `cal_result`-provenance field vs a separate column.
- **D1-3** — the `Tool_Machine` machine-master question: REACHABLE (20 rows / 20 unique `mac_id`) but a DIFFERENT artifact from the §3.29 `Items` table (different key; absent from the ref-12 AppSheet index). WO proposes core.item stays 0 rows and the calibration table binds via `item_id` NULL FK + `tool_legacy_id` verbatim; machine-master seeding (if ever) is its own future lane. Must be ruled explicitly — never silently narrowed.
- **D1-4** — the seed verdict (§2): `maintaining` REACHABLE → the guarded 11-row seed ships (11/11 + census); `tool_Calibrate` REACHABLE-but-EMPTY (0 rows — the honest zero recorded); never fabricated.
- **D1-5** — next-due semantics (§4): NO verbatim AppSheet formula exists; next-due = ENV display-time computation candidate, never presented as AppSheet transcription; blank/unknown cycle ⇒ NO next-due shown. D1 rules compute-vs-show-vs-omit.
- **D1-6** — RLS posture (house master pattern proposed: SELECT staff-or-admin, INSERT/UPDATE/DELETE admin) vs a log/append pattern (the P2.4 D1-6 `lab_test` precedent).
- **D1-7** — release v1.11.0 MINOR (§6 reasoning; overturn ⇒ recorded).
- **D1-8** — honesty rules (§4 + §5 empty states): unknown ≠ zero (blank cycle ⇒ no next-due; missing result ⇒ ยังไม่ทราบ, never ผ่าน); latest ≠ live; พ.ศ. dates; no PHI (13-digit grep 0); synthetic test values only; zero unanticipated durable writes.
- **D1-9** — scope files (the registry `mutable_scope` mirrors §10): everything unlisted forbidden.

## 9. Escalation valve

If implementation discovers a hard blocker (e.g. a seed-byte divergence vs the pinned census, an ENV_DB gate refusal, `maintaining` rows that don't reconcile 11/11), it STOPS and records a deviation — never a silent switch, never a scope self-expansion.

## 10. Registry-scope summary (mirrors the CURRENT-WORK claim append)

Mutable: `supabase/migrations/20261118000005_parity_p3_003.sql` (+ house-convention fix-migrations if D5 demands — never an edit of an applied migration), the new admin calibration page/component files + `frontend/src/App.tsx` (additive nav/route only) + `frontend/src/lib/supabase-queries.ts` (additive calibration reads/writes) + the new calibration lib + its `.test.ts` + the new e2e spec + `scripts/test_parity_p3_003_calibration.py`, `CHANGELOG.md` + `frontend/package.json` (the v1.11.0 bump only), `docs/work-orders/ENV-PARITY-P3-003.md`, `docs/ai/handoffs/ENV-PARITY-P3-003-GLM.md`, `docs/ai/CURRENT-WORK.md` (transition + closeout only). Exact new-file names pinned at the WO/implementation start inside these bounded paths — any rename is a recorded deviation, never silent.

Forbidden: everything else — the other Phase-3 modules (P3.4 job/QR/geofence — the `งานสวน` workbook `job` tab is P3.4's lane; P3.5 คู่มือ ×2 + address; P3.6 tests consolidated lane — each needs its own NEW reviewed claim transition), Phase 4 PDF/Telegram dispatcher surfaces (owner-gated per plan §5.3), Phase 5 cutover scope, the `Tool_Machine` machine-master seeding into core.item or any new master table (D1-3), seed rows beyond the ONE guarded 11-row `maintaining` history (`tool_Calibrate` 0 rows; core.item stays 0 — never fabricated), the delivered `/chemical` + `/admin/inventory` + `/admin/masters` + all delivered P1/P2 form/report/QR/report surfaces (byte-untouched; existing test suites edit-forbidden — additive only), `.github/**`, CI changes of any kind, `docs/ai/digital-twin/**` (reference 12 READ-ONLY), reference/plan docs (`APPSHEET-PARITY-PLAN.md`, `PROJECT-BRIEF`, `ROADMAP`, `DEFECT-MEMORY`, `ENV-ENGINEERING-LOOP`, `HANDOFF.md`, `AGENTS.md`), `docs/ai/architecture/ENV-COORDINATION-GUARD.md` + `scripts/env_coordination_guard.py` + `scripts/env_autonomy_runtime.py`, `data/**`, `.env`, secrets and raw data never committed/printed, Google Drive writes of any kind, personnel-identity values anywhere (the `Employee_id` national-ID class; 13-digit digit-run grep of new files = 0).

## 11. Implementation receipts (this lane, 2026-11-18; PR #229, head `0dfeb73`)

### 11.1 D2 RED (commit `26e22fa` — zero durable writes)

| Suite | RED result |
|---|---|
| vitest `src/lib/calibration.test.ts` | fails-to-collect (`./calibration` absent — the honest new-file RED mode); 0 tests run |
| `tsc -b` | 1 × TS2307 (absent module) + 2 × TS7006 cascades |
| Playwright `env-parity-p3-003-calibration.spec.ts` | 6 failed / 0 passed over the absent surface |
| `scripts/test_parity_p3_003_calibration.py` (live ENV_DB) | **7 failed truthfully** (table/view/policies absent — the real DB errors) / **1 passed** (the disclosed legacy baseline probe over pre-existing objects — the RED canary) / **5 skipped** (the seed fixtures are canary-gated and were NEVER SENT pre-apply) |

### 11.2 D2 rulings (D1 items adjudicated by the implementing lane per the owner dispatch; reviewer-overturnable, never silent)

- **D1-2 (table shape):** ONE `core.item_calibration` per the WO §3-1 column list; `calibrate_range`/`calibrate_unit` carried additive NULLable; **`compare_ref` carries VERBATIM in `cal_result`** (the WO §0 equivalence `Cal_result`/`compare_ref` = ผล — seeded values `InControl`/`Higher Ref.`); `cal_method` NULL for seeded rows (no source column — never fabricated).
- **D1-5 (next-due) — THE ruling:** **NO next-due is computed, stored, or rendered.** Justification: §3.30's only formula is `Cal_date` Init `TODAY()`; no next-due column/formula exists in ref 12 (R2 zero-hit); and the hypothesized cycle inputs are NOT intervals — the fetched bytes show `calibrate_range`+`unit` are MEASURED VALUES (12.7 %, 319.0 ppm, 7.1 pH, 100.0 %, 1.0 ppm; units %/ppm/mg/L/pH), `compare_ref` is a result class. No interval rule is justifiable from any source ⇒ the UI shows **ครั้งล่าสุด + จำนวนครั้ง** per tool and states the absence honestly on-screen (never presented as an AppSheet transcription). Pinned by `NEXT_DUE_PINNED_ABSENT` in the lib + e2e assertions.
- **D1-6 (RLS):** the owner dispatch pin rules the **log/append posture** — SELECT+INSERT `core.fn_is_staff_or_admin()` / UPDATE+DELETE `core.fn_is_admin()` (USING+WITH CHECK on UPDATE); zero anon policies (fail-closed). This AMENDS the WO §3-1 proposed master default (INSERT admin), recorded here per the dispatch instruction.
- **พ.ศ.→CE date translation (the seed's one recorded value conversion):** the sheet `date` values carry พ.ศ. years (2566/2567); ENV stores CE (year − 543) per the house พ.ศ.-parse rule (P3.2 MFG precedent); the UI renders CE + 543 back to พ.ศ. Spot-checked live (all distinct years CE; `1d5ce050` → 2024-05-16).

### 11.3 D3 apply evidence (ENV_DB gate held; `scripts/apply_migration_api.py`)

- Preflight PASS: `core.item_calibration`/`public.item_calibration` absent, policies 0, **12/12 baselines intact** (wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / safety.fire_extinguisher 0 / safety.emergency_light_check 332 / food.lab_test 0 / core.item 0 / core.vendor 0 / core.item_category 0 / core.distributor 6 / chemical.inventory_lot 0).
- Apply: **33 OK / 0 FAIL** (single migration; no edit of any applied migration).
- Post-verify: contract suite **13 passed / 0 failed / 0 skipped** — 11/11 seed reconciliation, census exact (tool_legacy_id 6 distinct · calibration_date 5 distinct · calibrate_range 7 nonempty + 4 NULL · calibrate_unit 4 distinct · cal_result 2 distinct), **2-row verbatim spot-check re-read from the fetched XLSX bytes** (`1d5ce050`, `664d0c36`), guarded re-send inserts 0, no RPC/trigger/generated column, the 4 pinned RLS policies + zero anon policies, façade security_invoker on; **anon REST probe 401 (42501) fail-closed** with the real publishable key; zero fixture leaks; baselines identical post-battery.

### 11.4 D4 battery (at frozen head `0dfeb73`)

| Check | Result |
|---|---|
| vitest FULL | 787 passed / 1 skipped (45 files) |
| `tsc -b` | clean |
| oxlint FULL | 0 errors; 19 warnings — **all pre-existing** (0 in the new calibration files) |
| Playwright FULL chromium workers=1 | **303 passed / 0 failed** (6.7 min; incl. the 6 new calibration tests) |
| guard | 344 passed + 450 subtests |
| runtime | 62 passed + 32 subtests |
| checker | RELEASE VERSION CHECK: OK (v1.11.0; CHANGELOG entry v1.11.0) |
| `git diff --check` (base→head) | clean |
| exact-13-digit-run grep of new files | 0 hits (the raw `[0-9]{13}` probe matches only the 14-digit migration-slot timestamp `20261118000005` — a repo-internal identifier class present in every prior lane, not a person-identity run) |
| diff ⊆ claimed scope | 11 files, all inside WO §10 mutable_scope (App.tsx additive route only; `supabase-queries.ts` intentionally untouched — the calibration lib owns reads/writes, the inventory-lib precedent) |

### 11.5 Seed count table (the deliverable count report)

| Census column | pinned | seeded | match |
|---|---|---|---|
| rows (`maintaining` tab) | 11 | 11 | ✓ |
| `tool_legacy_id` (sheet `tool_id`) | 11 nonempty / 6 distinct | 11 / 6 | ✓ |
| `calibration_date` (sheet `date`, พ.ศ.→CE) | 11 nonempty / 5 distinct | 11 / 5 | ✓ |
| `calibrate_range` | 7 nonempty / 4 blank | 7 / 4 NULL | ✓ |
| `calibrate_unit` (sheet `unit`) | 11 nonempty / 4 distinct | 11 / 4 | ✓ |
| `cal_result` (sheet `compare_ref`) | 11 nonempty / 2 distinct | 11 / 2 | ✓ |
| `cal_method` | — (no source column) | NULL ×11 | ✓ (never fabricated) |
| `item_id` / `item_name` | — (core.item 0 rows) | NULL ×11 | ✓ (honest empty picker) |
| `tool_Calibrate` tab | 0 rows (REACHABLE-but-EMPTY) | 0 seeded | ✓ (honest zero) |
| `Tool_Machine` master | UNSEEDED (D1-3) | 0 rows | ✓ |
