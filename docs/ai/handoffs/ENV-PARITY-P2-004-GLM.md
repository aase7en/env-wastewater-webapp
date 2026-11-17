# Handoff — ENV-PARITY-P2-004-GLM (D0 — claim transition)

Claim `ENV-PARITY-P2-004-C1` (gen 1, CLAIMED) — AppSheet parity Phase 2 lane P2.4: **Coliform ×3 (น้ำ/อาหาร/พนักงาน) — ขยาย `food.lab_test` (จุดเก็บ enum, ผู้เก็บ/ผู้รายงานแยก, FK อุปกรณ์→Items master เตรียม Phase 3, flow สองจังหวะ collect→result + suggested +1/+2 วัน)** (plan §6 row P2.4, line 234, verbatim). **Implementer never merges; stop at REVIEW_REQUESTED.**

## 1. Authorization

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้").
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 2 row P2.4 (line 234) exactly.
3. The P2.3 closeout frontier (PR #212 merged `e2e845f93e226c179b31987f9e843701ce09b9ed` = this transition's base): "Next lane: P2.4–P2.6 — coliform (3 lanes; source sheets coliform bac. ×4 tables per plan §6) — each needs its own NEW reviewed claim transition." This transition IS the P2.4 claim of that record.
4. **Boundary decision D1-1 (decided AT claim, per the plan's own numbering):** the dispatch hypothesis "water only in P2.4; employee/food in P2.5/P2.6" contradicts the plan — its own rows assign P2.4 = Coliform ×3 via ONE shared `food.lab_test` extension, P2.5 = the รายงานสรุป lane (สรุป coliform numbers), P2.6 = tests + master seed + QR. The lane therefore covers the plan row as written: the shared schema + two-step flow + the three verbatim source vocabularies; the water emphasis of the dispatch is honored as the seed-deferral record (§2.2 — the only coliform history the dispatch named, and it is SOURCE_UNAVAILABLE).

## 2. D0 scope discoveries (verified read-only 2026-11-17)

### 2.1 Carried prerequisites

- **`food.lab_test` is LIVE and generic** (§2.2 of the WO — 15 columns, RLS `lab_test_authenticated_rw` FOR ALL TO authenticated staff-or-admin, audit trigger, dormant reagent trigger, REST façade `public.lab_test` security_invoker, empty at last snapshot 0 rows). `/food` → `FoodPage.tsx` → `lib/food.ts` CRUD is the existing surface the two-step flow extends additively.
- **P2.1/P2.3 conventions carry:** guarded-seed pattern (single transaction, `WHERE NOT EXISTS` canary — zero durable writes during RED), `legacy_id` + `source_provenance` traceability, personnel resolution UUID-or-NULL with DRIVE-SOURCED lookups only, camera-irrelevant (no QR in this lane), `scripts/apply_migration_api.py` + ENV_DB gate (PROJECT_REF `gllqtbyofrcjzmbnfoeh`), one-migration-per-lane.
- **P2.3 D5 P1 lesson (recorded for the future coliform seed):** numeric-stored IDs break string probes — lookups ALWAYS type-coerce (the `coliform bac. Employee` `sample` refs and any future `ผู้เก็บ/ผู้รายงาน` seed resolution against Drive-sourced `Employee_id` values must normalize numeric vs text before comparing).

### 2.2 The coliform history sheets — SOURCE_UNAVAILABLE (the locate receipt)

The dispatch directed fetching `coliform bac._Water` per the P2.1 handoff D0 folder extraction. Executed READ-ONLY (ห้ามเขียน Drive — nothing written):

- Parent folder `ActivatedSludge-29279640` `1HBhuEaBeQLz8jlj0VxPXvbM03It1bNre` re-enumerated (50 titles): **all 6 public spreadsheets tab-enumerated from full XLSX exports — ZERO coliform tabs** (pond 12 tabs / markad 6 / garden 4 / tool 1 / extinguisher 5 / light 4 — exact tab lists in WO §2.1). Subfolders (Content/_recoveryData/background/รูป/Send line notify_photo) hold PDF templates, images, one txt — no workbooks. The `"Appsheet"` item is a Google Apps Script, not a spreadsheet.
- The AppSnapshot JSON (`1ymX1B45b6X5Ex_OzDJ_h6PAaYLtSxrw5`, 1,087,558 bytes, `/tmp/env-p2-004-snapshot.json`) carries the four coliform **definitions** (tableSettings `"Identifiers redacted": true` — no workbook IDs) and **no row data** (programmatic check: enum tokens only, no row arrays).
- AppSheet's own image folders (`coliform bac. Employee_Images`, `coliform bac. Food._Images`) exist but no `coliform bac._Water_Images` (the Water table has no Image column — consistent with ref 12 §3.16) — and no coliform source workbook is shared.
- **Verdict D1-3: seed NOTHING (0 rows); nothing reconstructed; the re-fetch obligation joins the extinguisher-master ledger entry (owner shares the coliform sheet(s), or an admin-UI entry path); the guarded seed design + `legacy_id`/`source_provenance` ship NOW so the deferred seed needs NO second migration.** The P2.1 extinguisher-master SOURCE_UNAVAILABLE precedent (0-row ship + durable obligation) governs. **This deviates from the dispatch's seed directive — recorded, not silently dropped.**

### 2.3 Verbatim AppSheet ground truth (reference 12 READ-ONLY) — the binding pins

- **§3.16 `coliform bac._Water`** (ref 3528-3601, 8 cols, key `Collect_Location`): `Collect_date` TODAY() · `Collect_Location` Enum Key Label {โรงครัว / ตู้กดน้ำ OPD / ตู้กดน้ำ IPD / ตู้กดน้ำปฐมภูมิ (ห้องฟัน)} · `Result_date` TODAY() · `Result_bac.` {Positive/Negative} · `อุปกรณ์` Ref→Items init `=aca317bf` · `ผู้รายงาน` Ref Valid If `ตำแหน่ง<>"นายแพทย์"…`. **NO result-step Show If, NO suggested dates, NO image column** — the water surface is genuinely collect+result-in-one in AppSheet; the two-step flow comes from the plan row and the Food/Employee tables; ENV renders water with the SAME two-step flow (the plan's single flow) but WITHOUT the +1/+2 suggestions (honest per-source parity — D1-7).
- **§3.17 `coliform bac. Food.`** (ref 3603-3789, 11 cols): `sample` {ช้อนสั้น / ถาด / มือพี่กุ้ง / มือป้าอ้อ / มือแก๊ป}; `Result_date` init `=IF([Collect_date]>=NOW(),"",TODAY())` + **Suggested `=LIST(date([Collect_date]+1),date([Collect_date]+2))`** (ref 3654) + **Show If `=TODAY()>[Collect_date]`** (ref 3656-3658); `Result_bac.` {Positive/Negative/Positive ++/invalid} + same Show If; `ภาพผลการตรวจ` Image + same Show If; `ผู้เก็บตัวอย่าง` Ref SWITCH-init default READ_ONLY + Valid If (นักวิชาการสาธารณสุข, ไม่ลาออก); `ผู้รายงาน` Ref IF(TODAY()>[Collect_date],SWITCH…,"") + Valid If (นักวิชาการสาธารณสุข) + Show If; `อุปกรณ์` init `=aca317bf` Valid If OR(aca317bf, 2fe4aa7c); `อุปกรณ์ (List)` virtual OUT.
- **§3.19 `coliform bac. Employee`** (ref 3792-3960, 10 cols): `sample` **Ref → ข้อมูลผู้ปฏิบัติงาน** Valid If `OR([ตำแหน่ง]="นักโภชนาการ",[ตำแหน่ง]="พนักงานประกอบอาหาร")` (the swab SUBJECT is a staff member — personnel-class); `Result_date` init `=IF([Collect_date]<=TODAY(),TODAY(),"")` + the same Suggested +1/+2 (ref 3848) + Show If; `อุปกรณ์` init `=2fe4aa7c`; `ผู้รายงาน`/`ผู้เก็บตัวอย่าง` same SWITCH family.
- **§3.11 `coliform bac.`** (ref 2973-3060, 8 cols): the general table — `สานถานที่เก็บตัวอย่าง` {โรงครัว / บ่อบำบัด}; `ผู้รายงาน` Valid If `ตำแหน่ง<>"นายแพทย์"`; `อ11` = a static shared Drive image virtual (**OUT**); `Result` {Positive/Negative}.
- **§3.37 `Filter_ColiformBac`** (ref 5523+, 8 cols): date-range report builder — **OUT** (numbers → P2.5; PDF → Phase 4).
- **PII pin (ref 12 §11 + P2.3 R2/D5 precedent):** `Employee_id` IS the Thai national ID. `sample_person_id`/`collected_by_id`/`reporter_id` resolve **UUID-or-NULL, NEVER verbatim**; legacy TEXT columns exist for DRIVE-SOURCED unresolved values only; the future seed's resolution is a type-coerced lookup against Drive-sourced data, never repo data; 13-digit digit-run grep of the migration = 0 matches (suite pin).

### 2.4 House facts verified (D0)

- Baselines at base `e2e845f`: registry **35 claims** (validate-registry `ok:true`, registry_hash `12836f892420ddb1d16e712f0c42b5883b8ec4178ae821475c95213dc62a9f90` — the fence value), all CLOSED except ENV-BUILDING-REPAIR-001 (DEFERRED) + THIS claim after append; ENV_DB counts 907/9/4 + masters 48/0 + extinguisher inspection 0 + emergency_light_check 332 + food.lab_test 0 (last recorded snapshot; re-verified live at D3 preflight).
- One migration slot: `supabase/migrations/20261117000003_parity_p2_004.sql` (true next sequential after `20261117000002` — pinned at claim, no filename deviation).
- `frontend/package.json` = 1.6.0 → **v1.7.0 MINOR** at D4 (D1-9: first user-visible coliform two-step flow; existing `/food` behavior preserved — no regression, additive UI only).

## 3. Testable-unit analysis → D2 RED plan

1. **SCHEMA** — the 9 additive columns (`sample_source`, `collect_point`, `sample_person_id`, `collected_by_id`, `collected_by_legacy`, `reporter_id`, `reporter_legacy`, `equipment_legacy`, `result_image`) + `legacy_id` UNIQUE + `source_provenance`; FK shapes → `core.personnel(id)`; types/nullability per WO §3.1; the existing 15 columns byte-identical.
2. **RLS/REGRESSION** — `lab_test_authenticated_rw` untouched (shape pinned); audit trigger intact; façade `public.lab_test` exposes the new columns; anon probes fail closed; the existing FoodPage CRUD path unchanged.
3. **FLOW** — result-side columns (`result`, `mpn_value`, `reported_date`, `reporter_id`) carry NO DB defaults (app-supplied step-2 writes; the AppSheet TODAY() inits are form-only); `sample_date` NOT NULL DEFAULT CURRENT_DATE (step-1 always fills); no NOT NULL added on any result-side column.
4. **HONESTY** — 0 seed rows (the SOURCE_UNAVAILABLE reconciliation pin); baselines intact (907/9/4/48/0/0/332/0); no 13-digit digit-runs in the migration; enum columns have NO hard CHECK (documented value sets are UI-restricted verbatim lists).
5. **FORM PARITY (vitest `food.test.ts`)** — two-step flow state machine (collect → pending → result); verbatim value sets per `sample_source` (water 4-enum / food 5-enum / general 2-enum / employee personnel pick); Show If gating (result fields only when TODAY() > collect date — same-day collect renders รอผล, never editable); suggested +1/+2 chips on food/employee ONLY, never auto-filled; `equipment_legacy` defaults per source (aca317bf water/food, 2fe4aa7c employee); Thai labels; พ.ศ. dates.
6. **E2E (Playwright `coliform-lab-test.spec.ts`)** — บันทึกเก็บตัวอย่าง → row appears รอผล → กรอกผลภายหลัง (next-day simulation via an old collect date) → result renders; mobile 360/390/430; existing /food single-step regression case.

Truthful RED pre-apply: the SQL suite fails on absent columns/objects; vitest fails-to-collect (no `food.test.ts` yet); e2e fails on absent testids/flow.

## 4. Bound scope (WO §9)

ONE migration `supabase/migrations/20261117000003_parity_p2_004.sql` (additive `ALTER TABLE food.lab_test` ×9 + FKs + `legacy_id` UNIQUE index; NO seed block; NO policy changes; NO grants changes) + the SQL contract suite + FoodPage additive two-step integration + `components/coliform/**` + `lib/food.ts` + `lib/food.test.ts` + additive wiring (supabase-queries/hooks) + App.tsx route-only (only if the D1 split needs it) + e2e spec + CHANGELOG/package.json (v1.7.0 MINOR) + the WO + this handoff + `docs/ai/CURRENT-WORK.md` (transition + closeout only). Everything else forbidden (WO §9) — including the P2.5 report, P2.6 surfaces, Phase-3 masters, extinguisher/light/P1 surfaces, CI, reference/plan docs, Drive writes, `data/**`, `.env`. **No personnel-table writes; no master fabrication; no seed rows.**

## 5. Single next safe action

Independent exact-SHA review of THIS docs-only claim transition (R2 floor: fresh GLM-5.3 MAX reviewer context; the AUTHORIZATION BASIS incl. the D1-1 boundary decision (plan-row-verbatim ×3), the D1-2 generic-extension decision, and the D1-3 SOURCE_UNAVAILABLE seed ruling is an explicit adversarial check item — insufficient basis parks the claim unmerged). On approval the AUTHORIZED reviewer merges THIS transition; only then does the implementing lane activate on the merged base via a fresh freshness gate: worktree `_worktrees/env-parity-p2-004`, D2 RED → D3 ENV_DB-gated apply (ONE additive migration, no seed) → D4 battery (vitest FULL, tsc, oxlint, Playwright FULL workers=1, guard 344, runtime 62, checker OK v1.7.0) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED — implementer never merges**.

---

## 6. Implementation-lane receipts (D2/D3/D4 — appended after the claim merges)

**IMPLEMENTATION DELIVERED — REVIEW_REQUESTED (implementer never merges).** Head `dc9cc553e269d96a9b3954c3a5d2a7eef3cde6a6` on `feat/env-parity-p2-004` (base `d22c993` = origin/main at claim merge; freshness gate re-verified 2026-11-17). Commits: `0f13b70` (D2 RED) → `654cfae` (D3 feat) → `5660dea` (façade-fix deviation) → `dc9cc55` (checker-driven literal cleanup). Diff vs main = exactly 9 files, all in WO §9 scope: `supabase/migrations/20261117000003_parity_p2_004.sql`, `scripts/test_parity_p2_004_coliform_lab_test.py`, `frontend/src/lib/food.ts`, `frontend/src/lib/food.test.ts`, `frontend/src/components/coliform/ColiformFlow.tsx`, `frontend/src/pages/FoodPage.tsx`, `frontend/tests/e2e/coliform-lab-test.spec.ts`, `CHANGELOG.md`, `frontend/package.json`. `supabase-queries.ts`/`hooks.ts`/`App.tsx` needed NO changes (the personnel pickers reuse the existing `useInspectors()` hook — the §4-bound additive-wiring slots stayed empty by design). `docs/ai/CURRENT-WORK.md` untouched.

### D2 RED receipts (commit `0f13b70`, migration UNAPPLIED, ENV_DB live)

- SQL contract suite: **8 failed / 7 passed** — truthful absent-schema failures (`additive column sample_source missing`, FK/UNIQUE absent, façade columns absent, flow-smoke insert failing on the missing column, migration-file pins). The 7 passes are pre-existing pins (0-seed count, baselines 907/9/4/48/0/0/332/0, RLS single-policy shape, both triggers, no-new-CHECK pair, sample_date CURRENT_DATE default, anon fail-closed).
- `frontend/src/lib/food.test.ts`: fails-to-collect (no coliform exports in `./food`).
- `frontend/tests/e2e/coliform-lab-test.spec.ts`: **9 failed / 0 passed**.

### D3 APPLY receipts (ENV_DB gate PROJECT_REF `gllqtbyofrcjzmbnfoeh`, `scripts/apply_migration_api.py`)

- Preflight: 15 pre-existing columns, the 11 new columns absent, `lab_test_legacy_id_key` absent, baselines exact (907/9/4/48/0/0/332/food.lab_test 0) → gate OK.
- Apply: **15/15 statements OK** (11×ADD COLUMN in one ALTER + FKs inline, the UNIQUE DO-block, 10×COMMENT, the façade OR REPLACE, `notify pgrst`).
- Post-verify: SQL contract suite **15/15 GREEN**; zero-net-persistence rollback-smoke proved the two-step flow live (step-1 insert defaults `sample_date=CURRENT_DATE` with all result-side NULL; step-2 update works; duplicate `legacy_id` → unique_violation; NULL duplicates allowed).
- **Count report / 0-seed disclosure (SOURCE_UNAVAILABLE D1-3):** `food.lab_test` **0 rows before apply / 0 rows after** — NOTHING seeded, NOTHING reconstructed; per-column reconciliation is vacuously 0/0; the personnel-ref suppression count is N/A (no seed rows exist); the re-fetch obligation stands with the extinguisher-master ledger entry. The 13-digit digit-run grep of the migration = **0 matches** (PII pin).
- **Recorded deviation (caught by the D3 post-verify, not silently fixed):** WO §2.2 claimed the `select *` façade "flows the new columns through automatically" — FALSE in Postgres (views expand `*` at creation). First apply → suite 13P/2F (`façade does not expose sample_source`). Fix commit `5660dea`: ONE `create or replace view public.lab_test with (security_invoker=on) as select * from food.lab_test` — the same definition schema5 already had; OR REPLACE preserves ACLs; no policy/grant statement. Deviation documented in the migration header D1-6 note.

### D4 battery receipts (final head `dc9cc55`)

- vitest FULL: **39 files / 676 passed / 1 skipped** (designed skipIf); `food.test.ts` 21/21 GREEN.
- `tsc -b`: clean. oxlint: exit 0 (pre-existing warnings only — CarbonPage/Toast untouched by this lane).
- Playwright FULL chromium workers=1: **272/272** (6.1m), including the new 9-test coliform spec (two-step per domain, รอผล same-day gate, +1/+2 chips text, mobile 360/390/430 overflow, legacy single-step regression) — mock-model only, zero ENV_DB writes.
- Coordination guard: **344 passed + 450 subtests**. Autonomy runtime: **62 passed + 32 subtests**.
- Release checker: `RELEASE VERSION CHECK: OK (v1.7.0; CHANGELOG entry v1.7.0)`. `git diff --check`: clean.
- Release: package.json 1.6.0→1.7.0 MINOR + Thai พ.ศ. CHANGELOG (17 พฤศจิกายน พ.ศ. 2569). The CHANGELOG PR-ref line is stamped with the real PR number in the final docs commit after `gh pr create`.
- **STOP at REVIEW_REQUESTED — implementer never merges.** Next: D5 fresh-GLM review at the exact frozen head with independent battery rerun where possible.

## 7. D6 CLOSEOUT RECEIPT (docs-only closeout lane, 2026-11-17 — branch `docs/env-parity-p2-004-closeout`)

Claim `ENV-PARITY-P2-004-C1` → **CLOSED** by this closeout transition. Scope = exactly 3 files: `docs/ai/CURRENT-WORK.md` (fence×2 + registry status CLOSED + `one_next_safe_action` receipt rewrite + frontier CLOSED record + next-frontier record → P2.5 next ungated, then P2.6), `docs/work-orders/ENV-PARITY-P2-004.md` (top Status + §10 Status → DELIVERED—CLOSED with PR refs), this handoff (D6). **STOP at REVIEW_REQUESTED — the closeout author never merges; the authorized reviewer owns approval + merge.**

### 7.1 Full delivery chain (#213 → #214) — all receipts verified live at closeout

| stage | PR | merge SHA | parents | evidence |
|---|---|---|---|---|
| claim transition | #213 | `d22c993ec432c2835a86e0a5035f4134f3faacec` | `e2e845f93e226c179b31987f9e843701ce09b9ed` + reviewed transition head | docs-only; fence pinned at base `e2e845f` (registry block AT base, guard method `scripts/env_coordination_guard.py:454-456`); **R2 APPROVED issuecomment-6938316372** — fresh reviewer, zero P1/P2, 1 non-blocking P3 = the pre-existing BUILDING-status narrative/registry wording (untouched, 35-identical verified); the two EXPLICIT adjudications ruled: **D1-1 boundary ACCEPT** (the plan's OWN numbering assigns P2.4 = Coliform ×3 น้ำ/อาหาร/พนักงาน via ONE shared `food.lab_test` extension; P2.5 = the รายงานสรุป lane per plan line 235; P2.6 = tests+master-seed+QR per line 236 — the "water-only P2.4" dispatch hypothesis rejected) and **D1-3 SOURCE_UNAVAILABLE ACCEPT** (all 6 public workbooks tab-enumerated 2026-11-17 — zero coliform tabs; 0-seed + carried re-fetch obligation per the P2.1 precedent; `legacy_id` UNIQUE + `source_provenance` shipped NOW so the deferred seed needs NO second migration) |
| implementation | #214 | `2df4bb0d8de35a669accd05b1c56db3753666ce9` | `d22c993ec432c2835a86e0a5035f4134f3faacec` + **D5-APPROVED head `6bb0c2d85856a77080029ab30537dc70d0ded026`** | merge commit, no squash, expected-head discipline; chain: D2 RED `0f13b70` → D3 `654cfae` → façade-fix `5660dea` (recorded deviation) → `dc9cc55` version-literal cleanup → `6bb0c2d` changelog PR-ref stamp; **D5 APPROVED issuecomment-6940988505** at exact head `6bb0c2d`; merge-execution review trail **issuecomment-6941049339** |

### 7.2 D2/D3/D5 record (verified live at closeout)

- **D2 truthful RED `0f13b70`:** SQL contract suite **8 failed / 7 passed** (the 8 failures = absent columns/FK/UNIQUE/flow/smoke/file; the 7 passes = pre-existing pins: 0-seed count, baselines, RLS shape, triggers, no-new-CHECK, `sample_date` default, anon fail-closed) + form-parity vitest **fail-to-collect** (`./food` coliform exports absent) + e2e coliform spec **recorded 9 failed / 0 passed**.
  - **P3-1 RED-count reconcile (D5, carried as a note — no repair):** the D5 isolated rerun measured **8 failed / 1 passed** — the 1 pass is the legacy-form no-regression test, which passes **trivially at RED** because the legacy UI predates the lane. RED discipline itself is intact (all 8 coliform-capability tests fail truthfully); future RED records should report the legacy pass honestly.
- **D3 `654cfae`:** ONE additive migration `20261117000003_parity_p2_004.sql` applied via `scripts/apply_migration_api.py` with the ENV_DB gate — 11 columns + FKs + `legacy_id` UNIQUE; **NO seed** (SOURCE_UNAVAILABLE — `food.lab_test` 0 rows before and after; baselines 907/9/4/48/0/0/332/0 intact); NO policy changes.
  - **Recorded deviation (caught by the D3 post-verify, not silently fixed):** the pre-created `select *` REST façade **expands `*` at creation in Postgres**, so the new columns were REST-unreachable after the first apply (suite 13P/2F: the façade pin caught it). **Fix `5660dea`:** ONE `create or replace view public.lab_test with (security_invoker=on) as select * from food.lab_test` — the **same definition schema5 already had**; OR REPLACE preserves ACLs; no policy/grant statement; deviation documented in the migration header.
  - **D5 ruling on the fix:** **legitimate byte-equivalent**, with `security_invoker=on` explicitly **restated** — required because OR REPLACE resets reloptions, so omitting it would have silently dropped the option. (Also verified: no policy exists on the view — RLS lives on `food.lab_test` and is enforced through the invoker view; column append keeps OR REPLACE valid — existing output names/types/order unchanged.)
  - `dc9cc55`: version-literal cleanup — the checker's rule-3 caught `v1.7.0` literals inside src comments; comment-only change.
- **D5 fresh-GLM independent review APPROVED issuecomment-6940988505** at exact head `6bb0c2d` — zero P1/P2, **3 P3**:
  1. **P3-1** the RED e2e count reconcile (recorded 9F/0P vs isolated rerun 8F/1P trivial legacy pass) — reconciled in this D6 note per the reviewer's closeout-lane suggestion.
  2. **P3-2** `frontend/src/components/coliform/ColiformFlow.tsx:356,364` — the +1/+2 chip labels render CE/ISO dates (`+1 วัน (2026-11-18)`) — user-facing date not พ.ศ. Mitigations: sits beside the native `type=date` input it populates (platform-ISO), and row-header dates are พ.ศ. via `thaiDate`. Advisory: consider `thaiDate` in the label with ISO as the value. Carried as a follow-up.
  3. **P3-3** `frontend/src/lib/food.test.ts:23-37` — the env-stub explanation comment appears twice (duplicated block). Cosmetic. Carried as a follow-up.
  - **D5 honesty note:** no resolvable `SUPABASE_ACCESS_TOKEN` on the review machine → the SQL suite could not execute live there; D5 verified it by **static trace of the exact RED tree, reproducing exactly 8F/7P**, and re-ran the e2e RED isolated on its own dev server (first two runs were contaminated by a leftover vite server on :5173 via `reuseExistingServer`; isolated on :5377 for the true result).
  - D5 own battery at `6bb0c2d`: SQL 15/15, vitest FULL **676/1skip** (`food.test.ts` 21/21), Playwright FULL **272/272**.

### 7.3 Release evidence (v1.7.0 MINOR, verified live at closeout)

- Pages run **44034603993 SUCCESS** @ `2df4bb0d8de35a669accd05b1c56db3753666ce9` (live-checked: status completed, conclusion success, headSha exact).
- Live markers: index bundle carries **1.7.0**; `assets/FoodPage-D_Xw8wMI.js` HTTP 200 carries **รอผล ×7 + ตู้กดน้ำ + โรงครัว**.
- Annotated tag **v1.7.0** (`21735b9248e2f21475bf1126f0173721545b17bd`) dereferences `2df4bb0d8de35a669accd05b1c56db3753666ce9` (local + remote).
- `python3 scripts/check_release_version.py --tag v1.7.0` → **OK, exit 0**.

### 7.4 Follow-up ledger additions (this closeout)

1. **Coliform history SOURCE_UNAVAILABLE re-fetch obligation** — owner shares the coliform sheet(s) → seed later via the guarded P2.1/P2.3 pattern; `legacy_id`/`source_provenance` already shipped by the P2.4 migration, so **no second schema migration** is needed; type-coerced personnel lookups per the P2.3 lesson.
2. **The 3 D5 P3 follow-ups** (see §7.2): RED count reconcile note (recorded here — no repair needed), the พ.ศ. chip-label advisory (`ColiformFlow.tsx:356,364`), the duplicated comment (`food.test.ts:23-37`, cosmetic).

### 7.5 Frontier + standing

Next parity lane = **P2.5 รายงานสรุป** (the aggregate report lane per plan line 235 — นับปกติ/ผิดปกติถัง, ผ่าน/ไม่ผ่านไฟ, สรุป coliform — ตัวเลขอย่างเดียว; Filter_Firer/Filter_Light/Filter_ColiformBac semantics), then **P2.6** (tests + seed ข้อมูล master จาก Sheets + เชื่อม QR per plan line 236 — the natural home of the extinguisher-master + coliform-history re-seeds) — each needs its own NEW reviewed claim transition. Standing: **Phase-1 dual-run PENDING OWNER ACTION**, extinguisher-master + coliform history await owner shares, hooks #155 approved-not-started (owner-manual), #156 open (owner-manual), Building WAITING_EXTERNAL, P4 authorized awaiting Phase reach.

### 7.6 Scope-lock release

Worktree `_worktrees/env-parity-p2-004` preserved clean at the delivered head `6bb0c2d` (fully merged via PR #214). Scope lock released at generation 1; **CLOSED confers no fresh mutation authority**; all other work still requires a NEW claim transition; no closed lane confers execution authority.
