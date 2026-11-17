# Handoff — ENV-PARITY-P2-006-GLM (D0 — claim transition)

Claim `ENV-PARITY-P2-006-C1` (gen 1, CLAIMED) — AppSheet parity Phase 2 lane P2.6 — **the FINAL Phase-2 lane**: **Tests + seed ข้อมูล master จาก Sheets + เชื่อม QR** (plan §6 row P2.6, line 236, verbatim). **Test-only lane: fixtures ship; seeds ship an honest NO-SEED record; QR ships connectivity test coverage. Implementer never merges; stop at REVIEW_REQUESTED.**

## 1. Authorization

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้").
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 2 row P2.6 (line 236) exactly.
3. The P2.5 closeout frontier (PR #218 merged `5e30a54332e296906a1ffc4421b880ac7ffdd3a4` = this transition's base): "the FINAL Phase-2 lane P2.6 (Tests + seed ข้อมูล master จาก Sheets + เชื่อม QR; plan line 236) — needs its own NEW reviewed claim transition; then Phase 4 (PDF)." This transition IS the P2.6 claim of that record.
4. **Verbatim-pin directive honored (D0):** the dispatch required reading the actual row text before writing — the row's own THREE components (Tests / seed ข้อมูล master จาก Sheets / เชื่อม QR) supersede the dispatch's "tests+master-seed+QR" shorthand; the boundary ruling (WO D1-1: Tests = the executable deliverable; seed = honest NO-SEED; QR = test coverage, printable-QR OUT) is THE adversarial check item.
5. **Structural precedent carried:** ENV-PARITY-P1-007 (PRs #201/#202, v1.4.1) — the P1.7 fixture-driven parity suite: typed case tables `{ id, family, input…, expected, ref, divergence? }`, every case citing its ref-12 line, divergent cases asserting CORRECTED expectations, plus a transactional SQL fixture script. This lane clones that shape for the Phase-2 domains (trigger/RPC/QR resolve, light-check flow, coliform two-step).

## 2. D0 scope discoveries (verified read-only 2026-11-17/18)

### 2.1 The seed verdicts — re-verified NOW (the dispatch's fetch directive, executed)

- **Extinguisher master `ข้อมูลถังดับเพลิง` — STILL SOURCE_UNAVAILABLE.** Workbook `fire_extinguisher` `15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E` re-enumerated via full XLSX export: exactly **5 tabs (ตรวจสอบถัง / เก็บรูป / Filter_Firer / Menu_Firer / Numbers)** — byte-identical to the P2.1 enumeration. No master tab. Seed NOTHING; never reconstructed from the inspection table (P2.1 D1).
- **Coliform history — STILL SOURCE_UNAVAILABLE.** Light workbook `ข้อมูลตรวจไฟฉุกเฉิน` `1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw` re-enumerated: **4 tabs (Emergency light / Check / ER_light_Menu / Filter_Light)**; combined with P2.4's full 6-workbook enumeration (2026-11-17) — **zero coliform tabs anywhere**. Seed NOTHING; `legacy_id`/`source_provenance` already shipped by P2.4 (no second migration needed).
- **`ตรวจสอบถัง` inspection history — REACHABLE but FK-BLOCKED.** Public gviz CSV (tab `ตรวจสอบถัง`, gid 0): **858 data rows, 27-col header (18 persisted + 9 padding)**, first data row matches P2.2's pinned observation byte-for-byte. The seed is blocked: `safety.extinguisher_inspection.extinguisher_id` FKs → `safety.fire_extinguisher(legacy_row_id)` (0 rows — SOURCE_UNAVAILABLE master), the 858 `QR_CODE` values ARE the master Row IDs, and reconstructing masters from inspections is FORBIDDEN. The history seed rides with the master re-seed (guarded P2.1/P2.3 recipe, dependency-ordered: master → inspections → coliform ×4) + plan §7 Phase-2 backfill + P5.2 pre-cutover.
- **METHOD LANDMINE (new, recorded):** a by-NAME gviz probe (`&sheet=<name>`) silently FALLS BACK to the first tab and returns HTTP 200 for unknown sheet names — observed live (`sheet=ข้อมูลถังดับเพลิง` returned the ตรวจสอบถัง content). Absence proofs require full XLSX exports + programmatic tab enumeration. Never trust a 200-by-name as presence.

### 2.2 Verbatim AppSheet ground truth (reference 12 READ-ONLY) — the binding pins

- **§3.12 master** (9 cols): ประเภทถังดับเพลิง 5-value enum verbatim; **`QR CODE` = `="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [Row ID]`** (ref 3077-3081) — QR derive-never-store; วันที่บรรจุ/หมดอายุ init TODAY().
- **§3.13 ตรวจสอบถัง** (27 cols): QR_CODE Valid If + verbatim error `ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ` (ref 3158-3166); 5 Show If gates (ref 3176-3253); item enums (ref 3256-3330); `breakdown_details` init `IF([chem_exp]<=[Date_time],"หมดอายุ","ไม่หมดอายุ")` (ref 3336-3338); type **6-value vs master 5-value** — recorded divergence, both pinned.
- **§8 bots → the trigger:** `Update_ExpDate` (ref 6414-6420) + `_Bot_Update_EXP` (ref 6152-6185) → ENV bump-later-only + the adjudicated NULL-expiry parity ruling (blank master date fires the bot — resolved by `20261116000006_parity_p2_002_trigger_null_fix.sql`); deterministic tiebreak.
- **§3.32 light master** (8 cols): `QR` = same formula shape over `[ERL_ID]`; `location_floor` 1..3. **§3.33 Check** (14 cols): the full value-set/Show-If matrix — test_result Show If `[Persistency]="มี"`; Broken_detail EnumList 5 values + Pic/Status Show If `OR(ไม่ผ่าน, ไม่เหมาะสม)` + Status 3 values; `location` auto-fill + master-gated Show If; `SortKey = CONCATENATE([Date_time], "-", [_ROWNUMBER])`.
- **§3.11/§3.16/§3.17/§3.19 coliform ×4:** result sets (+`Positive ++`/invalid food/employee), collect-point vocabularies water 4 / food 5 / general 2 / employee none, Show If `=TODAY()>[Collect_date]` (ref 3606/3646/3838), suggested `+1/+2` Food ref 3654 + Employee ref 3848 ONLY, `อ11` static-image virtual OUT.
- **PII pin:** `Employee_id` IS the Thai national ID (ref 12 §11); the §3.33 Auditor SWITCH is redacted. **Fixture tables carry SYNTHETIC values only** (P1.7 precedent: no secrets, no real patient data, no production row copies); 13-digit digit-run grep of new files = 0 matches (suite pin).

### 2.3 House facts verified (D0)

- Baselines at base `5e30a54`: registry **37 claims** (validate-registry `ok:true`, registry_hash `2a6b3671c197a4ed2b049f7ce860a50e23bd9204c19a839aa744fcb25067afa9` — the fence value, empirically cross-checked: the same guard method at the prior claim base `fb2bead` reproduces the recorded `faae38d5…` byte-exactly); all parity claims CLOSED except THIS after append.
- The fixture targets are LIVE at base: `Update_ExpDate` trigger + `fn_resolve_extinguisher_qr` (P2.2 + the NULL-expiry fix), the light resolve RPC + 332-row check seed (P2.3), the coliform two-step + `isPendingResult` (`lib/food.ts:251-255`) (P2.4); existing suites inventoried in WO §2.2 — P2.6 does NOT re-cover them (additive tables only; edit-forbidden).
- `frontend/package.json` = **1.8.0** → **stays 1.8.0 (NO bump — test-only, D1-3; CHANGELOG byte-untouched)**.

## 3. Testable-unit analysis → D2 RED plan

1. **EXTINGUISHER (`family: "extinguisher"`)** — trigger decision table (bump-later-only; NULL-expiry parity case; tiebreak; backdated); RPC resolve (known id ⇒ payload copies + expiry status; unknown/blank ⇒ fail-closed w/ the verbatim label); QR derive-never-store; form value sets incl. the 6-vs-5 type divergence + `breakdown_details` auto-label + Show If gates.
2. **LIGHT (`family: "light"`)** — §3.33 value sets + the Show If matrix; location auto-fill + unknown-id honesty; light RPC resolve contract; the seed-reality distributions (blank-300 Status) as real-data facts.
3. **COLIFORM (`family: "coliform"`)** — same-day gate cases; `isPendingResult` consumed (never re-derived); +1/+2 suggestions (Food/Employee only; never auto-filled); per-source vocabulary gating (never coerced); result-set membership (++/invalid separate); collect-first NULL result semantics (catalog-probed in the SQL battery: result-side columns carry NO DB defaults).
4. **SQL battery (`scripts/test_parity_p2_006_fixtures_sql.py`)** — transactional zero-net-persistence (the `test_parity_p2_002/003/004` shape): trigger/RPC/two-step cases against the LIVE delivered objects; preflight/post-run baseline counts identical (907/9/4 + 48/0 + 332 + lab_test unchanged).

Truthful RED: the TS suite fails-to-collect at RED (module `./parity-fixtures-p2` absent — the honest new-file-lane RED mode); the SQL script does not exist at RED and its D3 first run is expected GREEN (it verifies EXISTING objects) — recorded plainly, per the P2.4 P3-1 honesty lesson.

## 4. Bound scope (WO §9 / registry mutable_scope)

`frontend/src/lib/parity-fixtures-p2.ts` + `.test.ts`, `scripts/test_parity_p2_006_fixtures_sql.py`, the WO + this handoff + `docs/ai/CURRENT-WORK.md` (transition + closeout only). Everything else forbidden (WO §9) — including ALL `supabase/` files (NO migration/seed/DB write), `CHANGELOG.md` + `frontend/package.json` (byte-untouched), delivered surfaces, existing test suites (additive-only lane), CI, reference/plan docs, Drive writes, `data/**`, `.env`, personnel-identity values in fixtures (synthetic only).

## 5. Single next safe action

Independent exact-SHA review of THIS docs-only claim transition (R2 floor: fresh GLM-5.3 MAX reviewer context; the AUTHORIZATION BASIS incl. the D1-1 three-component boundary ruling (row-verbatim) and the D1-4 seed verdicts are explicit adversarial check items — insufficient basis parks the claim unmerged). On approval the AUTHORIZED reviewer merges THIS transition; only then does the implementing lane activate on the merged base via a fresh freshness gate: worktree `_worktrees/env-parity-p2-006`, D2 RED (fail-to-collect) → D3 implement (fixture tables + SQL battery) → D4 battery (vitest FULL, tsc, oxlint, Playwright FULL workers=1, guard 344, runtime 62, checker OK v1.8.0 NO-bump, PII grep 0) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED — implementer never merges**.

---

## 6. Implementation-lane receipts (D2/D3/D4 — appended after the claim merges)

Lane activated on the merged base `85743a2` (origin/main @ claim merge PR #219) in the registered worktree `env-wastewater-webapp/_worktrees/env-parity-p2-006`, branch `feat/env-parity-p2-006`. Track-Z GLM, **test-only lane — NO seed, NO bump** (WO §3/§6; D1-2/D1-3/D1-4 honored: `supabase/` diff EMPTY, `CHANGELOG.md` + `frontend/package.json` byte-untouched at 1.8.0, zero seed rows, zero Drive writes).

### D2 RED (commit `e4b84c1` — test file committed ALONE, importing the absent `./parity-fixtures-p2`)

- **Focused vitest** `src/lib/parity-fixtures-p2.test.ts` → `Test Files 1 failed (1); Tests no tests` — `Error: Cannot find module './parity-fixtures-p2'` — the honest **fail-to-collect** RED mode for a new-file lane (P1.7/P2.4 precedent; handoff §3 truthfulness note).
- **FULL vitest at RED** → `Test Files 1 failed | 41 passed (42); Tests 711 passed | 1 skipped (712)` — the single failed file IS the RED suite; zero legacy failures (P2.4 P3-1 lesson applied: any legacy pass at RED is recorded — here 41 files/711 tests passed by design, none claimed as RED).
- **tsc at RED** → `error TS2307: Cannot find module './parity-fixtures-p2'` + implicit-any cascade from the unresolvable import — all collateral of the same absence (cleared at D3).
- **SQL script at RED: DID NOT EXIST** (new-file lane) — recorded plainly; its D3 first run is expected GREEN (its subject is verification of EXISTING delivered objects, never claimed as RED).
- Environment repairs at RED (gitignored local files only, never committed): fresh worktree lacked `frontend/node_modules` → `npm ci` (738 packages); lacked `frontend/.env` → created from the Drive secrets via the approved resolver (values never printed; `frontend/.env` is gitignored). Without it, 3 unrelated suites fail loud at module load (`Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY`) — the at-base FULL-vitest truth is the post-repair record above.

### D3 implement (fixture tables + SQL battery; suite green)

- `frontend/src/lib/parity-fixtures-p2.ts` — **59 fixture cases** across the three WO §4 families, every case carrying its verbatim ref-12 citation, **3 divergence-noted cases** all asserting CORRECTED expectations: `EX-T04` (NULL-expiry parity ruling, migration 20261116000006), `EX-V04` (inspection-type 6-value vs master 5-value — AppSheet self-divergence, both lists verbatim ref 3198 vs 3072), `LT-R02` (no Check-specific error pinned — §3.13-family label reused). SQL-side cases (22) marked `sql: true` and mirrored 1:1 by `P2_006_SQL_CASE_IDS`.
- `frontend/src/lib/parity-fixtures-p2.test.ts` — 32 vitest tests covering the 37 vitest-executed cases against the shipped pure libs (`extinguisher-inspection`, `emergency-light-check`, `food`) — no re-derivation, no edits to any existing lib or suite (additive-only lane).
- `scripts/test_parity_p2_006_fixtures_sql.py` — the transactional battery (single-request BEGIN…ROLLBACK per batch, zero net persistence; the P2.2/P2.3/P2.4 house shape): trigger decision table EX-T01..06, RPC contracts EX-R01..05 (incl. snapshot freezing), light RPC LT-R01/R02, seed-reality distributions LT-D01..04, catalog probes LT-K01/CB-C01/CB-C03/CB-F01, two-step smoke CB-C02, preflight/post baselines + probe-residue asserts.
- **Preflight baselines live-verified 2026-11-18** (read-only, before any battery): `wastewater.reading` 907 · `core.personnel` 9 · `core.equipment_spec` 4 · `safety.emergency_light` 48 · `safety.fire_extinguisher` 0 (SOURCE_UNAVAILABLE — NO seed, D1-4) · `safety.extinguisher_inspection` 0 · `safety.emergency_light_check` 332 · `food.lab_test` 0 — byte-matching WO §7 D3's expected preflight.
- Seed-reality distributions re-verified live (exact, pre-assertion): test_result ผ่าน×316/ไม่ผ่าน×16; Persistency มี×315/ไม่มี×17; Position เหมาะสม×329/ไม่เหมาะสม×3; Status blank×300/ขอติดตั้ง×16/แจ้งซ่อม×14/แจ้งย้ายตำแหน่ง×2.
- **SQL battery first run (D3): 24/24 passed GREEN** — expected and recorded honestly (it verifies EXISTING P2.2/P2.3/P2.4 delivered objects); post-run baselines identical + probe residue 0.
- Hand-computation honesty: two implementer-side corrections landed inside the D3 commit before any green claim — the EX-V05 hand-computed assert (chem_exp 2026-09-13 vs inspection 2026-01-15 ⇒ ไม่หมดอายุ; the shipped lib was right, the first assert line was wrong) and the PII scan applying the P2.4 test_32 scrub precedent (documented 14-digit migration-filename tokens scrubbed before the 13-digit scan — they are documentation, not data).

### D4 battery (at the D3 head, recorded before push)

| Check | Result |
|---|---|
| vitest FULL | `Test Files 42 passed (42); Tests 743 passed \| 1 skipped (744)` (32 new tests included) |
| `tsc -b` | clean (0 errors) |
| oxlint | exit 0 — 0 errors, 19 warnings all pre-existing in unrelated files; the two NEW lib files lint with **0 findings** |
| Playwright FULL chromium `--workers=1` | **284/284 passed (6.4m), exit 0** — the no-regression gate green on this lane's code. Honesty record: the two earlier runs reported `273 passed / 11 failed (11.8m)` — root-caused NOT to this lane's changes but to a STALE zombie vite dev server (a prior lane's, serving the P2.004-era worktree) occupying shared port 5173, which Playwright's `reuseExistingServer` silently reused (exactly the P2.5-summary spec's 11 tests failed — the section absent from P2.4-era code; 273+11 = 284 = the --list total). The stale server was killed; the clean run above exercises THIS worktree's own dev server. |
| guard (`env_coordination_guard status`) | `ok: true` — 344/344 + 450 subtests (self-test battery `344 passed`) |
| runtime (`test_env_autonomy_runtime.py`) | 62/62 passed + 32 subtests |
| release checker | regression battery `37 passed, 0 failed`; `check_release_version.py --tag v1.8.0` → `RELEASE VERSION CHECK: OK (v1.8.0; CHANGELOG entry v1.8.0)` exit 0 — **NO bump confirmed** |
| `git diff --check` | clean |
| PII 13-digit scan (3 new files) | raw grep hits = the documented 14-digit migration-filename tokens only; **after the P2.4-precedent scrub: 0 matches** (suite-pinned) |
| diff vs base `85743a2` | EXACTLY the 5 claimed files (`parity-fixtures-p2.ts`, `parity-fixtures-p2.test.ts`, `test_parity_p2_006_fixtures_sql.py`, WO, this handoff); `supabase/` EMPTY; `CHANGELOG.md`/`frontend/package.json` byte-untouched; CURRENT-WORK untouched by the implementation lane |

### Achieved-parity report (the P1 DoD ≥98% convention, reported honestly)

- **Executable cases: 59/59 passing = 100%** (target ≥98% met) — 37 vitest-executed + 22 SQL-exercised; every case hand-computed from the ref-12 verbatim formulas; zero cases skipped or weakened.
- **Divergence-corrected cases: 3** (EX-T04 NULL-expiry parity ruling · EX-V04 inspection-6-vs-master-5 type divergence · LT-R02 reused fail-closed label) — all asserting CORRECTED expectations with the note + ruling reference, never silently matching a bug.
- SQL battery makes **zero durable writes** (preflight/post baselines identical; probe residue asserted 0 after every batch).

### Deviations / environment records (none material to scope)

1. The dispatch's stated worktree path `Github/_worktrees/env-parity-p2-006` does not exist on this machine; the registered worktree (git worktree list, authoritative) is `env-wastewater-webapp/_worktrees/env-parity-p2-006` @ `85743a2` [feat/env-parity-p2-006] — all work done there (recorded per the AGENTS.md local-worktree caveat rule).
2. Secrets resolution on this machine required the documented `A_WIKI_DRIVE_PATH` override (Drive root via the `_from_Desktop/A-Wiki/drive` symlink); `scripts/_env.py` default candidates don't match this layout. Values never printed.
3. RED-commit test-file adjustments before D3 green (all recorded above; none affect the RED evidence, which is the fail-to-collect itself).

**STOP at REVIEW_REQUESTED — implementer never merges. Next: D5 fresh-GLM independent review at the exact frozen head (independently executed battery rerun where possible + hand-verification of the fixture expected values against the ref-12 verbatim formulas); the authorized reviewer owns approval + merge.**

---

## 7. D6 CLOSEOUT RECEIPT (docs-only closeout lane)

Appended 2026-11-18 by the closeout lane (branch `docs/env-parity-p2-006-closeout` off main @ `2f7d52349ab63f3583ebe764c67c15ffe9af13d7`; 3 changed docs: `docs/ai/CURRENT-WORK.md` + this handoff + the WO status line).

### Delivered chain (all receipts verified live before writing)

| Step | Receipt |
|---|---|
| Claim transition | PR #219 merged `85743a29adb40953e03d13999449873cc7d9938b` (docs-only, base `5e30a54332e296906a1ffc4421b880ac7ffdd3a4`) |
| Implementation | PR #220 merged `2f7d52349ab63f3583ebe764c67c15ffe9af13d7` — second parent EXACTLY the D5-APPROVED head `e1478d41ff3e045e61f6ceff4ac76d15926126f2`, merge commit no squash, expected-head discipline `--match-head-commit e1478d41ff3e045e61f6ceff4ac76d15926126f2`; merge stat = exactly the PR's 5 files (2215+/2−); CURRENT-WORK.md diff EMPTY at merge; supabase/ EMPTY (D1-2); NO BUMP v1.8.0 stays + tag untouched (D1-3) |
| D5 review | fresh-GLM APPROVED issuecomment-6964073525 at exact frozen head `e1478d4` — 59/59 fixture cases hand-verified vs ref-12 verbatim formulas; RED reproduced at isolated `e4b84c1`; own battery rerun green (vitest 743/1skip, Playwright 284/284, guard 344+450, runtime 62+32, checker OK v1.8.0); zero P1/P2; 2 non-blocking P3 doc-consistency nits carried to the ledger (CB-G04 blank-Collect_date arm `parity-fixtures-p2.ts:587-592` + EX-V05 missing-date arm `:338` lack divergence notes vs the AppSheet zero-date reading — safety-positive, asserted production behavior unaffected) |
| Merge trail | issuecomment-6964101922 (D5 receipt + expected head + merge policy + no-bump note), posted pre-merge by the merge executor |
| Pre-merge gates | PR OPEN / MERGEABLE / CLEAN; checks notify ×2 + scripts + smoke all pass; head OID == expected |
| Post-merge at `2f7d523` | guard 344/344 + 450 subtests OK; validate-registry ok:true 38 claims BOOTSTRAP_CONTROL (claim still CLAIMED at merge time — this closeout closed it); local main ff-only 85743a2→2f7d523 clean; merge stat exactly 5 files |
| Deploy (honest note) | the merge touched frontend/ paths (the two new fixture lib files) so Deploy frontend to GitHub Pages TRIGGERED — Pages run 44199974779 SUCCESS @ `2f7d523` + E2E smoke run 44199974571 SUCCESS + test run 44199974935 success; no release bump, no tag (test-only lane) |

### Fence

- `expected_policy_revision` = `2f7d52349ab63f3583ebe764c67c15ffe9af13d7` (the PR #220 merge SHA)
- `expected_registry_hash` = `40d85c2053c4a0cf45d817ae9d9babcc2b43772228285591e172df50be973a25` (guard validate-registry registry_hash AT `2f7d523`, claim still CLAIMED — the pre-closeout block)

### Claim-by-claim JSON diff vs `2f7d523`

Exactly **1 of 38 claims changed** (`ENV-PARITY-P2-006-C1` → CLOSED + `one_next_safe_action` rewrite); the other 37 byte-identical (programmatic sort-keys comparison).

### PHASE 2 COMPLETION — ALL 6 LANES CLOSED (claim SHA / implementation SHA)

| Lane | Claim | Impl | PRs | Release |
|---|---|---|---|---|
| P2.1 masters | `d897473` | `1ae8695` | #204/#205 | no release (DB-only; emergency_light seeded 48/48; fire_extinguisher schema 0 rows — SOURCE_UNAVAILABLE awaiting owner source) |
| P2.2 inspection QR | `5ccdb50` | `fc24253` | #207/#208 | v1.5.0 MINOR |
| P2.3 light checks | `70c0a64` | `c408e62` | #210/#211 | v1.6.0 MINOR |
| P2.4 coliform ×3 | `d22c993` | `2df4bb0` | #213/#214 | v1.7.0 MINOR |
| P2.5 summary report | `22edf23` | `79482b4` | #216/#217 | v1.8.0 MINOR |
| P2.6 fixtures (this lane) | `85743a2` | `2f7d523` | #219/#220 | NO BUMP — v1.8.0 stays (test-only) |

### Phase-2 DoD status per plan (honest)

- **ตรวจถัง/ไฟด้วยสแกน QR ได้ครบจุดที่ AppSheet ทำ ✓** — P2.2/P2.3 scan flows + resolve RPCs live; P2.6 added the QR-connectivity fixture coverage (derive-never-store, fail-closed RPC contracts, verbatim Valid If/error labels); printable-QR label generation OUT per the P2.2 ruling (no owner ask).
- **งานรายเดือน/ตามช่วง parity delivered ✓** — P2.5 numeric summaries (ถัง/ไฟ/coliform — ตัวเลขอย่างเดียว; PDF = Phase 4).
- **Honest gaps (NOT zero-coerced):** the extinguisher master + the coliform history + the 858-row ตรวจสอบถัง inspection history remain UNSEEDED — SOURCE_UNAVAILABLE awaits owner sheet-shares (P5 backfill dependencies; the guarded P2.1/P2.3 recipe recorded dependency-ordered master → inspections → coliform ×4; `legacy_id`/`source_provenance` columns already shipped so the deferred seeds need NO second schema migration).

### Next + standing

- **Next UNGATED:** Phase 3 (งานสนับสนุน — มอบหมายงาน job / คลัง Items-Inventory-Vendors / คู่มือ — 6 lanes per plan §6; each needs its own NEW reviewed claim transition; `core.item` ABSENT at base, never fabricated). Phase 4 (PDF) remains owner-gated per plan §5.3.
- **Standing:** Phase-1 dual-run PENDING OWNER ACTION; the sheet-share re-seeds PENDING OWNER ACTION; hooks #155 approved-not-started + #156 open (owner-manual); Building WAITING_EXTERNAL; P4 authorized awaiting Phase reach.

### Deviations

None. Scope = exactly the 3 docs files; guard + registry green at the branch head; implementer never merged; the closeout author does not merge this PR either — STOP at REVIEW_REQUESTED.
