# GLM Handoff — ENV-PARITY-P3-003 (Claim ENV-PARITY-P3-003-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p3-003` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p3-003` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row IS the scope

AppSheet parity **Phase 3 — งานสนับสนุน — lane P3.3, the THIRD Phase-3 lane**. Plan §6 row P3.3 line 247 VERBATIM (binding, supersedes any shorthand):

> | P3.3 | maintenance/สอบเทียบ (`core.item_calibration` หรือตารางย่อย) |

WO `docs/work-orders/ENV-PARITY-P3-003.md` holds the full binding pins (§0 components, §2 source receipts, §3 migration plan, §4 next-due semantics, §5 UI, §6 release, §8 D1 items). Read it before writing anything. Summary of the deliverables:

1. **Maintenance/calibration log schema** — reference 12 §3.30 `maintenance` (7 cols, ref 4864-4884: `InventoryID`; `maintenanceID` Key; `item_Name` Label; `Cal_date` Date **Init `TODAY()`**; `Cal_method`; `Cal_result`) translated into ONE new log table `core.item_calibration` (the row's own primary name; `item_id` NULL FK → core.item + `tool_legacy_id` verbatim lineage + `item_name` honest display text + `legacy_id` UNIQUE + `source_provenance`; the `maintaining`-only cycle fields `calibrate_range`/`calibrate_unit`/`compare_ref` carried with recorded provenance per D1-2). NO RPC/trigger/generated column — a plain log; next-due is DISPLAY-TIME ONLY.
2. **Seed verdict** — REACHABLE → guarded seed: the `tool_maintainance` workbook tab `maintaining` (11 data rows: tool_id 6 distinct / date 5 distinct / calibrate_range 7 nonempty-4 blank / unit 4 distinct / compare_ref 2 distinct) seeds 11/11 via the guarded P2.1/P3.1 recipe (verbatim strings, blanks⇒NULL, source_provenance, MIGRATION.md count report + census). `tool_Calibrate` tab is REACHABLE-but-EMPTY (0 rows — the honest zero recorded, nothing fabricated); `Tool_Machine` machine master (20 rows) stays UNSEEDED (D1-3); core.item stays 0 rows.
3. **Next-due honesty (D1-5)** — NO verbatim AppSheet next-due formula EXISTS (§3.30's only formula = `Cal_date` Init `TODAY()`; the ref-12 37-table index has NO Tool_Machine/tool_Calibrate; `maintaining` is a plain sheet). "รอบถัดไป" = an ENV display-time computation candidate from `calibration_date` + `calibrate_range`/`calibrate_unit` — never presented as AppSheet verbatim; blank/unknown/unparseable cycle ⇒ NO next-due shown (never fabricated, unknown ≠ zero).
4. **UI** — minimal admin-gated maintenance/calibration surface: list (per-tool history, พ.ศ., honest empty state) + form (Thai; `calibration_date` defaults to today per `Cal_date` Init `TODAY()` verbatim; **validations verbatim = the §3.30 pins ONLY** — everything else house-level, never invented as "AppSheet verbatim"); mobile-first; additive nav/route only.
5. **Release v1.11.0 MINOR** (D1-7) — `frontend/package.json` 1.10.0→1.11.0 + Thai พ.ศ. CHANGELOG entry; tag at the deployed merge SHA post-deploy.

## 1. Ground-truth citations (reference 12 READ-ONLY — never edited)

| Pin | Where |
|---|---|
| §3.30 `maintenance` 7 cols (key `maintenanceID`; `Cal_date` Date Init `TODAY()`; Update mode `7`; data access `as app creator`) | ref 4864-4884 |
| plan §6 Phase 3 row P3.3 line 247 VERBATIM | `docs/ai/APPSHEET-PARITY-PLAN.md:247` |
| the 37-table index — NO `Tool_Machine`/`tool_Calibrate` AppSheet tables (sheet-side only) | ref 12 §2 table-of-tables |
| PII class: Employee_id IS the Thai national ID | ref 12 §11 |
| P3.2 legacy-binding precedent (`item_legacy_id` verbatim + NULL-safe core.item picker) | `docs/work-orders/ENV-PARITY-P3-002.md` §3-1 + migration `20261118000002` |

## 2. Source receipts (this transition, 2026-11-18, READ-ONLY, zero Drive writes)

- **Pond workbook** `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk` (full XLSX export 366,744 bytes → `/tmp` snapshot, deleted after verification; 12 tabs byte-consistent with the P2.4/P3.1 enumerations): tab `Tool_Machine` (17 header cols verbatim `mac_id, ข้อมูลอุปกรณ์, mac_picture, mac_brand, mac_model, mac_HtoU, 'MFG ', 'EXP ', mac_buydate, mac_lifetime, mac_maintenance_date, mac_stock, Unit, ตัวแทน, distributor, วิธีใช้งาน, User manual`) **20 data rows / 20 unique mac_id** — REACHABLE machine master, seeding OUT by default (D1-3; `ตัวแทน`/`MFG`/`EXP`/`ข้อมูลอุปกรณ์`/`วิธีใช้งาน` EMPTY; `User manual` 7 nonempty); tab `tool_Calibrate` (6 header cols verbatim `id, ข้อมูลอุปกรณ์, mac_id_ref, Cal_date, Cal_method, Cal_result`) **0 data rows** — REACHABLE-but-EMPTY.
- **tool_maintainance workbook** `1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw` (full XLSX export 5,913 bytes; 1 tab `maintaining`): 6 header cols verbatim `id, tool_id, date, calibrate_range, unit, compare_ref`; **11 data rows** (tool_id 11 nonempty / 6 distinct; date 11/5 distinct; calibrate_range 7 nonempty / 4 blank; unit 11/4 distinct; compare_ref 11/2 distinct) ⇒ **REACHABLE → the guarded seed ships 11/11**.
- **PII census:** NO personnel-identity columns in any P3.3 source (`Tool_Machine.ตัวแทน` EMPTY; `maintaining`/`tool_Calibrate` carry none; `compare_ref` = result-class values) — the UUID-or-NULL rule still pins any future personnel resolution; 13-digit grep 0.
- The gviz by-NAME landmine stands (presence/absence proofs = XLSX tab enumeration only).

## 3. D-phase obligations

- **D2 RED first** — new unit suite fails-to-collect (module absent — the honest new-file RED mode); e2e truthful failures over the absent surface; SQL contract suite (`scripts/test_parity_p3_003_calibration.py`, transaction-scoped BEGIN…ROLLBACK zero-net-persistence) records live absent-object failures pre-apply (table absent; the seed fixtures NEVER sent pre-apply — canary holds, ZERO durable writes); `tsc` records the absent-module error. Fixture semantics pinned: table/column shapes, RLS policy shapes, guarded-seed idempotency (re-run adds 0), blanks⇒NULL census (11/11; 4 NULL `calibrate_range`; distinct counts), verbatim-string fidelity, baseline integrity. Record every count verbatim; disclose any legacy pass.
- **D3** — ONE migration `supabase/migrations/20261118000005_parity_p3_003.sql` applied via `scripts/apply_migration_api.py` behind the ENV_DB gate with preflight (target absent, policies 0, baselines wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / fire_extinguisher 0 / emergency_light_check 332 / food.lab_test 0 / core.item 0 / core.vendor 0 / core.item_category 0 / core.distributor 6 / chemical.inventory_lot 0 intact) + documented rollback; schema lib additive; the admin calibration UI + next-due display per D1-5.
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1; guard 344/344 (+450 subtests); runtime 62/62 (+32 subtests); checker OK v1.11.0; `git diff --check` clean; 13-digit digit-run grep of new files = 0.
- **D5** — fresh-GLM independent review at the exact frozen head + independent battery rerun + own read-only live probes (seed counts verified inside ROLLBACK transactions; baselines identical pre/post). Implementer never merges.

## 4. Hard constraints (violations park the claim)

- Scope = the registry `mutable_scope` + WO §10 EXACTLY. Everything unlisted forbidden. Any rename-class change = recorded deviation, never silent.
- The `Tool_Machine` machine master stays UNSEEDED; `tool_Calibrate` contributes 0 rows; core.item stays 0 rows — never fabricated, never reconstructed.
- Honesty: unknown ≠ zero (blank cycle ⇒ no next-due; missing result ⇒ ยังไม่ทราบ, never ผ่าน); latest ≠ live; empty `core.item` ⇒ honest empty picker; blanks ⇒ NULL; พ.ศ.; synthetic test values only; no PHI; 13-digit grep 0.
- ENV_DB gate: apply only via the gated helper with preflight/rollback; zero unanticipated durable writes (RED canary + baseline assertions); house `notify pgrst` trailer.
- No Drive writes of any kind; no `.env`/secrets in commits or chat; no reference/plan-doc edits; no CI edits.

## 5. Single next safe action

After the transition PR merges: create `_worktrees/env-parity-p3-003` off the new main tip, commit D2 RED (unit + e2e + SQL-contract + tsc evidence, zero durable writes), then D3 → D4 → D5 per §3 — stopping at REVIEW_REQUESTED.

---

## 6. Implementation receipts (D2/D3/D4, 2026-11-18; PR #229 — STOP at REVIEW_REQUESTED)

Full receipts live in the WO §11 (`docs/work-orders/ENV-PARITY-P3-003.md`); the D5 reviewer's one-paragraph digest:

- **D2 RED truthful** (`26e22fa`, zero durable writes): vitest fails-to-collect / tsc TS2307 / e2e 6F-0P / live SQL contract 7F-1P(disclosed legacy baseline)-5S(canary — fixtures never sent pre-apply).
- **D2 rulings:** D1-2 compare_ref→`cal_result` verbatim (`InControl`/`Higher Ref.`); **D1-5 NO next-due anywhere** (cycle fields are measured values %/ppm/mg/L/pH, not intervals — ครั้งล่าสุด + จำนวนครั้ง + on-screen absence note; `NEXT_DUE_PINNED_ABSENT` pins it); D1-6 log/append RLS (staff SELECT+INSERT / admin UPDATE+DELETE) per the owner dispatch pin; sheet dates translated พ.ศ.→CE (year − 543, house พ.ศ.-parse rule) and rendered back to พ.ศ. by the UI.
- **D3 apply:** preflight PASS (12/12 baselines + target absent) → **33 OK / 0 FAIL** → post-verify **13/13** (11/11 seed, census exact, 2-row spot-check vs the fetched XLSX bytes, guarded re-send adds 0, no RPC/trigger/generated column, 4 pinned policies + zero anon, façade security_invoker, anon REST 401/42501 fail-closed, zero fixture leaks).
- **D4 battery** (`0dfeb73`): vitest 787P/1S · tsc clean · oxlint 0 errors (19 pre-existing warnings, 0 in new files) · Playwright FULL chromium w=1 **303/303** · guard 344+450 · runtime 62+32 · checker OK v1.11.0 · `git diff --check` clean · exact-13-digit-run grep 0 · diff = 11 files ⊆ WO §10.
- **D5 next:** fresh-GLM review at head `0dfeb73` (re-run the battery where possible + own read-only probes; the contract suite is transaction-scoped and re-runnable as-is; the source XLSX re-fetches GET-only to `/tmp/env-p3-003-maintaining.xlsx` when absent). Implementer never merges; the authorized reviewer owns approval + merge; the closeout (CURRENT-WORK rewrite) is the successor docs lane.

---

## 7. D6 CLOSEOUT RECEIPT (2026-11-18; claim ENV-PARITY-P3-003-C1 → CLOSED)

The docs-only closeout transition `docs/env-parity-p3-003-closeout` off main @ `8cd6af6c0e1a4fcbf28434fce90a22c7186f5af9` records the delivered chain and the v1.11.0 release. STOP at REVIEW_REQUESTED — the closeout author never merges.

**Full chain:**
1. **Claim transition PR #228** merged `46e88a24a2ee29bc0220b85f445266f62efa8a2a` (docs-only; base `2908798…` = the P3.2 closeout merge; independent review APPROVED issuecomment-6971800231 at exact head `619f575…`, 0 P1 / 0 P2; merge receipt issuecomment-6971834721; parents `2908798` + `619f575`).
2. **Implementation PR #229** merged `8cd6af6c0e1a4fcbf28434fce90a22c7186f5af9` (merge commit, no squash; second parent EXACTLY the D5-APPROVED head `21754799e7bc8eebe9e762ddb175b76d3eb70f5b`; expected-head discipline `--match-head-commit`; merge trail issuecomment-6973349954; merge stat = 13 files 1587+/2−; CURRENT-WORK.md diff EMPTY at merge). Commit chain: `26e22fa` D2 RED → `0dfeb73` D3 → `2175479` D3/D4 receipts.
3. **Post-merge at `8cd6af6`:** guard 344 passed (+450 subtests) exit 0; runtime 62 passed (+32 subtests); validate-registry `{ok:true, claims:41, BOOTSTRAP_CONTROL}` — C1 still CLAIMED pre-closeout; local main ff-only `46e88a2→8cd6af6`, clean; merge stat = exactly the PR's 13 files.
4. **D5 fresh-GLM independent review APPROVED** issuecomment-6973281802 at the exact frozen head `2175479` (0 P1 / 0 P2; 2 informational P3): the reviewer fetched the `maintaining` XLSX independently (5,913 bytes — byte-size matches the WO receipt), read ref 12 §3.30 directly (7 columns verbatim; the ONLY formula = `Cal_date` Init `TODAY()`; doc-wide next-due/รอบถัดไป/ครั้งถัดไป grep = 0 hits), verified the seed **11/11 field-by-field** vs its own fetch (blanks⇒NULL ×4; พ.ศ.→CE hand-checked: 2567-05-16→2024-05-16, 2566-08-21→2023-08-21), ran the live contract suite **13/13**, reproduced RED truthfully (with the honest SQL-state-change disclosure — the D2-recorded 7F/1P/5S is inherently non-reproducible post-apply), and ran its own battery matching D4 (vitest 787/1skip, tsc clean, oxlint 0 errors, Playwright 303/303, guard 344, runtime 62, checker OK v1.11.0).
5. **Release v1.11.0 MINOR LIVE:** Pages run **44268317493 SUCCESS** @ `8cd6af6` (https://github.com/aase7en/env-wastewater-webapp/actions/runs/44268317493); live markers verified fresh — `index-D0rBYg6j.js` (last-modified 08:36:09 GMT) carries **1.11.0 ×2** (the build-injected constant + the พ.ศ. CHANGELOG heading `## v1.11.0 — 18 พฤศจิกายน พ.ศ. 2569`) + `app-version-chip` + `app-version-summary` + `ข้อมูลเวอร์ชันแอป`; the lazy chunk **`CalibrationPage-Dx9vJhyQ.js`** (HTTP 200, fresh) carries `calibration-page`/`calibration-form`/`calibration-item-select` testids + `สอบเทียบเครื่องมือ` + `ประวัติการสอบเทียบเครื่องมือ` + `บันทึกผลสอบเทียบ` + `ยังไม่มีรายการสอบเทียบ` (honest empty state) + **THE absence note** `หมายเหตุความถูกต้อง: ระบบเดิมไม่มีข้อมูล 'ครั้งถัดไป' … ไม่คำนวณวันถัดไป` (the D1-5 honesty core, live). Annotated tag **`v1.11.0`** (`df0c93e4`) dereferences the deployed merge SHA `8cd6af6` (never the PR head); `git ls-remote` confirms both refs; `scripts/check_release_version.py --tag v1.11.0` → `RELEASE VERSION CHECK: OK (v1.11.0; CHANGELOG entry v1.11.0)`, exit 0.
6. **Closeout fence:** `expected_policy_revision = 8cd6af6c0e1a4fcbf28434fce90a22c7186f5af9`; `expected_registry_hash = 6c9997fde62217a33ddb1c4cf3849e216f4796af90944f668a3c569a789e1c3b` (guard `registry_hash` AT the merge SHA; validate-registry at `8cd6af6` = ok:true, 41 claims). Programmatic claim-by-claim JSON diff vs `8cd6af6` = **exactly 1 of 41 claims changed** (ENV-PARITY-P3-003-C1 → CLOSED), the other 40 byte-identical; `git diff --check` clean.

**The 2 D5 informational P3s reconciled as ledger follow-ups (no silent fix):**
- **P3-1 (cosmetic):** the implementation PR body counts "Changed files (11)" by logical grouping; the physical diff is 13 files (lib/component/docs pairs counted as singles). Scope itself exact — labeling quirk only.
- **P3-2 (process note):** the D2-recorded SQL RED counts (7F/1P/5S) are inherently non-reproducible post-apply against the live DB — the absent-object failures + the 5 canary skips can no longer be reproduced once the migration is applied (the single post-apply RED failure = `FileNotFoundError` on the migration file, correctly absent at `26e22fa`). Future lanes may consider recording a RED-state DB snapshot hash or a fenced pre-apply window.

**Honesty record:** next-due remains display-time-only and ABSENT (nothing computed, stored, or rendered — pinned by `NEXT_DUE_PINNED_ABSENT` + the live on-screen absence note + the e2e `next-due-value` count-0 pin); `cal_method`/`item_id`/`item_name` NULL ×11 (never fabricated); `tool_Calibrate` contributes 0 rows (honest zero); `Tool_Machine` unseeded (D1-3); core.item stays 0 rows; no PHI anywhere (13-digit grep 0); zero durable test writes.

**Frontier after this closeout merges:** next lane = **P3.4** per plan §6 Phase 3 line 248 VERBATIM — job: QR-scan + geofence ≤0.7 กม. (server haversine) + working EnumList + ภาพ — อาจขยาย `building.inspection_round` หรือแยก `core.job_log` (ตัดสินที่ WO); job master REACHABLE in the งานสวน workbook. P3.4, then P3.5 (คู่มือ ×2 + address) and P3.6 (Tests), each need their own NEW reviewed claim transition. Standing: Phase-1 dual-run PENDING OWNER ACTION; sheet shares (extinguisher master re-seed, coliform history re-seed, Items/Vendors/Categories master seeds); hooks #155 approved-not-started + #156 open (owner-manual); Building WAITING_EXTERNAL; P4 authorized awaiting Phase reach (อย่าเริ่มก่อนได้คำตอบ §5.3). CLOSED confers no fresh mutation authority.
