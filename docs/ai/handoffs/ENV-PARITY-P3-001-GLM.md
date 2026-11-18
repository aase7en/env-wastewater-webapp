# GLM Handoff — ENV-PARITY-P3-001 (Claim ENV-PARITY-P3-001-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p3-001` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p3-001` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row IS the scope

AppSheet parity **Phase 3 — งานสนับสนุน — lane P3.1, the FIRST Phase-3 lane**. Plan §6 row P3.1 line 245 VERBATIM (binding, supersedes any shorthand):

> | P3.1 | Items/Vendors/distributor/Categories masters (`core.item`+`core.vendor`+category) + ผูก `ชนิดเครื่องมือตรวจ`/`อุปกรณ์` ที่ว่างจาก Phase 2 |

WO `docs/work-orders/ENV-PARITY-P3-001.md` holds the full binding pins (§0 components, §2 source receipts, §3 migration plan, §4 UI, §5 release, §7 D1 items). Read it before writing anything. Summary of the deliverables:

1. **Four masters** — `core.item` (§3.29), `core.vendor` (§3.31), `core.item_category` (§3.27 `Categories`; D1-4), `core.distributor` (§3.15) — uuid PKs + verbatim `UNIQUEID()` 8-hex legacy ids UNIQUE + `source_provenance`; RLS = SELECT staff-or-admin / INSERT-UPDATE-DELETE admin (house master pattern, P2.1 D1-7); virtual REF_ROWS columns recorded-never-persisted.
2. **Two bindings** — (a) `food.lab_test.equipment_id` FK → `core.item` (repays the P2.4 D1-4 debt; `equipment_legacy` verbatim column untouched; lab_test is 0 rows so the additive FK breaks nothing); (b) the water-side `ชนิดเครื่องมือตรวจ` additive column + picker (D1-3 — P1.5 never shipped it; the AppSheet Ref→Items is ref 2397 + §4 line 5605).
3. **Seed** — distributor REACHABLE: guarded 6/6 seed (P2.1 recipe: single transaction, `WHERE NOT EXISTS` canary holding at RED, verbatim bytes, blanks ⇒ NULL, `source_provenance` pins workbook `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk` tab `distributor` sheetId 11 + fetch date 2026-11-18, MIGRATION.md count report). Items/Vendors/Categories SOURCE_UNAVAILABLE → **seed NOTHING, never fabricated** (zero Items/Vendors/Categories tabs in the 12-tab pond enumeration TODAY + the full 6-workbook P2.4 enumeration); owner sheet-share obligation carried; `legacy_*_id` UNIQUE + `source_provenance` ship NOW so deferred seeds need NO second migration.
4. **UI** — minimal admin-gated master-management (Thai, พ.ศ., mobile-first, validations verbatim — Items Category enum tokens `w6hwsyj`/`72b68b19`/`9a7ebdaf` ref 4792; UI-restricted lists, no hard CHECK rejection per the P1.001 lesson) + the two honest equipment pickers (empty `core.item` ⇒ honest empty state, never a fabricated list).
5. **Release v1.9.0 MINOR** (D1-5) — `frontend/package.json` 1.8.0→1.9.0 + Thai พ.ศ. CHANGELOG entry; tag at the deployed merge SHA post-deploy.

## 1. Ground-truth citations (reference 12 READ-ONLY — never edited)

| Pin | Where |
|---|---|
| §3.15 `distributor` 8 cols (key id UNIQUEID) | ref 3505-3526 |
| §3.27 `Categories` 4 cols (key ID UNIQUEID; Category, Icon Image Label) | ref 4660-4677 |
| §3.29 `Items` 20 cols (key Item ID UNIQUEID; Category enum tokens w6hwsyj/72b68b19/9a7ebdaf ref 4792; Vendor Ref→Vendors ref 4794-4798; 4 virtual REF_ROWS ref 4800-4862) | ref 4753-4862 |
| §3.31 `Vendors` 9 cols (key ID UNIQUEID; Name/Logo/URL/Phone/Email/Address; Related Items virtual) | ref 4886-4924 |
| น้ำประปา.ชนิดเครื่องมือตรวจ Ref→Items | ref 2397 + §4 line 5605 |
| coliform อุปกรณ์ Ref→Items (Employee/Food./_Water) | ref 4821/4837/4853 (+ §3.16/§3.17/§3.19) |
| the two REAL formula Item IDs (aca317bf water/food, 2fe4aa7c employee) | ref 3594/3650/3834 + migration `20261117000003_parity_p2_004.sql:54-60,176-178` |
| PII class: Employee_id IS the Thai national ID | ref 12 §11 |

## 2. Source receipts (this transition, 2026-11-18, READ-ONLY, zero Drive writes)

- Pond workbook `ข้อมูลบ่อบำบัดประจำวัน` `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk` full XLSX export (364,794 bytes) → **12 tabs byte-consistent with P2.4's enumeration**; `distributor` PRESENT (sheetId 11); header `id, dealer, dealer_email, dealer_address, dealer_tel, salesname, lineID` = ref §3.15 verbatim; **6 data rows / 6 unique 8-hex ids**.
- Items/Vendors/Categories/Inventory/maintenance/job: ABSENT in all 12 pond tabs (programmatic probes) + ABSENT across the other five public workbooks (P2.4 enumeration: markad 6 / งานสวน 4 — job,auditors,location_area,ชีต4 / tool_maintainance 1 / extinguisher 5 / light 4). Tool_Machine/tool_Calibrate tabs = P3.3 candidates (NOT yours).
- gviz by-NAME fallback landmine (P2.6 §2.1) stands — absence proofs = XLSX tab enumeration only.
- Distributor business-contact fields (dealer_tel/salesname): NOT PHI / NOT the Employee_id class; verbatim-commit is D1-6 (honest alternatives: commit-verbatim or no-seed — NEVER mask-to-NULL).

## 3. D-phase obligations

- **D2 RED first** — new unit suite fails-to-collect (module absent — the honest new-file RED mode); e2e truthful failures over the absent surface; SQL contract suite records live absent-object failures (seed canary holds — ZERO durable writes pre-apply); `tsc` records the absent-module error. Record every count verbatim; disclose any legacy pass.
- **D3** — ONE migration `supabase/migrations/20261118000001_parity_p3_001.sql` applied via `scripts/apply_migration_api.py` behind the ENV_DB gate with preflight (targets absent, policies 0, baselines 907/9/4 + 48/0 + 332 + lab_test 0 intact) + documented rollback; schema lib additive (`supabase-queries.ts`); masters UI + pickers; seed byte-verification (6/6 + spot-check incl. one trailing-space-style byte pin per the P2.1 discipline).
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1; guard 344/344 (+450 subtests); runtime 62/62 (+32 subtests); checker OK v1.9.0; `git diff --check` clean; 13-digit digit-run grep of new files = 0.
- **D5** — fresh-GLM independent review at the exact frozen head + independent battery rerun + seed-lineage byte verification. Implementer never merges.

## 4. Hard constraints (violations park the claim)

- Scope = the registry `mutable_scope` + WO §9 EXACTLY. Everything unlisted forbidden. Any rename/rename-class change = recorded deviation, never silent.
- The two delivered-surface wirings are ADDITIVE ONLY (lab อุปกรณ์ picker; water ชนิดเครื่องมือตรวจ per D1-3) — every other delivered P1/P2 pixel byte-untouched; existing suites edit-forbidden.
- Honesty: unknown ≠ zero; blanks ⇒ NULL; empty `core.item` ⇒ honest empty pickers; latest ≠ live; พ.ศ.; synthetic test values only; no PHI; no Employee_id-class values; 13-digit grep 0.
- ENV_DB gate: apply only via the gated helper with preflight/rollback; zero unanticipated durable writes (RED canary + baseline assertions).
- No Drive writes of any kind; no `.env`/secrets in commits or chat; no reference/plan-doc edits; no CI edits.

## 5. Single next safe action

After the transition PR merges: create `_worktrees/env-parity-p3-001` off the new main tip, commit D2 RED (unit + e2e + SQL-contract + tsc evidence, zero durable writes), then D3 → D4 → D5 per §3 — stopping at REVIEW_REQUESTED.

---

## 6. Implementation receipts — D2/D3/D4 (Track-Z GLM lane, 2026-11-18)

Worktree `_worktrees/env-parity-p3-001` (fresh: `origin/main` `bb43c83` = ancestor of HEAD at lane start). Commits: D2 RED `57422c1` → D3 implementation `5854cdc` → docs receipts (this commit). **STOP at REVIEW_REQUESTED — never merged by the implementer.**

### D2 RED (commit `57422c1`) — every count verbatim; zero durable writes

| Suite | RED outcome |
|---|---|
| vitest FULL (`frontend/src/lib/masters.test.ts`) | FAILED SUITE ×1 — fail-to-collect: `Cannot find module './masters'`; 42 files passed / 743 passed + 1 skipped (the legacy pass DISCLOSED per the P2.4 P3-1 convention) |
| `tsc -b` | `src/lib/masters.test.ts(38,8): error TS2307: Cannot find module './masters'` |
| Playwright (new spec `env-parity-p3-001-masters.spec.ts`, chromium w=1) | **9 failed / 0 passed** — truthful failures over the absent surface (`/admin/masters` route absent, no masters/picker testids) |
| SQL contract (`scripts/test_parity_p3_001_masters.py`, live ENV_DB) | **22 failed / 1 passed** — the 1 pre-apply pass is `test_no_anon_policies_on_core_masters`, VACUOUSLY true on absent tables (disclosed); the seed canary HELD (`core.distributor` absent ⇒ seed block NOT sent) ⇒ zero durable writes; baselines asserted intact pre-apply |

### D3 implement + gated apply (commit `5854cdc`)

- **Gate:** `SUPABASE_DB_URL` resolved from Drive secrets and asserted to point at ENV_DB `gllqtbyofrcjzmbnfoeh` (never printed); token via the same Drive-secrets path, never printed.
- **Preflight (live, all asserted):** 4 core targets + 4 public façades ABSENT; target policies 0; `equipment_id`/`instrument_id` columns absent; baselines wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / safety.fire_extinguisher 0 / safety.emergency_light_check 332 / food.lab_test 0 intact.
- **Apply:** `scripts/apply_migration_api.py supabase/migrations/20261118000001_parity_p3_001.sql` → **72 statements OK / 0 FAIL** (documented rollback in the migration header).
- **Seed count table (count-reconciliation GREEN):**

| Master | Sheet | Seeded | Skipped | Verdict |
|---|---|---|---|---|
| core.distributor | 6 | **6** | 0 | REACHABLE — guarded seed shipped |
| core.item | — | **0** | — | SOURCE_UNAVAILABLE — seed NOTHING |
| core.vendor | — | **0** | — | SOURCE_UNAVAILABLE — seed NOTHING |
| core.item_category | — | **0** | — | SOURCE_UNAVAILABLE — seed NOTHING |

- **Byte verification vs the source CSV** (`/tmp/env-p3-001-pond.xlsx` 364,794 bytes, tab distributor sheetId 11; extracted programmatically to `/tmp/env-p3-001-distributor.csv`): spot-check 1 = full-row `f67d5e26` byte-equal (7/7 fields); spot-check 2 = `e5e76725` dealer char_length 4 / UTF-8 octet length 10 (Thai multi-byte verbatim) + salesname null-shape; FULL-TABLE AUDIT = all 6 rows byte-equal to the CSV, whitespace audit clean (no value carries leading/trailing whitespace — the source itself is whitespace-clean, recorded). Blanks ⇒ NULL (4 email / 2 address / 0 tel / 3 salesname / 5 lineID — counts DERIVED from the embedded sheet bytes in the contract suite, never hand-counted; an earlier hand-count 3/2/3/4 was corrected to the derived numbers — the seeded data was never wrong, only the test's expectation. **[CORRECTED at closeout 2026-11-18 per D5 P3-1: this prose previously said "4 lineID"; the derived truth — the committed test's bytes-derived expectation at `scripts/test_parity_p3_001_masters.py:519` (`sum(... if v[5] is None)` over `EXPECTED_DISTRIBUTOR_ROWS`) and the seeded rows — is 5 (`e5e76725`, `0a7abe65`, `becdc598`, `262d81ee`, `96e0f383`; only `f67d5e26` carries a line_id). Seed data unaffected — byte-equal per the D5 independent 36/36 audit; prose-only.]**)
- **Contract suite GREEN: 23/23 passed** post-apply (one 429 throttle retry disclosed — Management-API rate limit, not a logic failure).
- **Bindings live:** `food.lab_test.equipment_id` FK → `core.item(id)` (+ `public.lab_test` refreshed to expose it); `water_supply.daily_check.instrument_id` FK → `core.item(id)` (+ `public.daily_check` refreshed); `equipment_legacy` verbatim column untouched.

### UI + lib (house patterns)

- `/admin/masters` (RequireAuth requireAdmin; route-additive only): `MastersPage` + `ItemsSection`/`VendorsSection`/`CategoriesSection`/`DistributorSection` — EDITABLE reference-data semantics (list + create + edit + delete) per the AppSheet Update-mode-7 rows, unlike the append-only equipment_spec; Thai labels, mobile-first grids, พ.ศ. display via the house utils elsewhere; Category enum tokens `w6hwsyj`/`72b68b19`/`9a7ebdaf` carried VERBATIM as a UI-restricted list (no hard CHECK); honest empty states everywhere (`ยังไม่มีข้อมูลอุปกรณ์/ผู้ขาย/หมวดหมู่/ผู้จัดจำหน่าย` — never a fabricated option).
- The two pickers: lab อุปกรณ์ (`ColiformFlow` — additive; empty `core.item` ⇒ honest empty chip, no picker rendered; non-empty ⇒ picker + `equipment_id` in the collect POST, legacy default untouched) and water ชนิดเครื่องมือตรวจ (`WaterSupplyPage` — additive lines; extended-payload passthrough so `lib/water-supply.ts` stays untouched).
- `lib/masters.ts` (+ 14-test unit suite): types, honesty helpers (`toNullableText`/`toNullableNumber` — blanks ⇒ NULL, never coerced), payload builders, façade fetchers/CRUD, read/mutation hooks (hooks.ts untouched — out of scope).

### Recorded deviation (WO §8 — never silent)

- **`frontend/src/lib/food.ts` +6 lines (2 functional)**: `ColiformSampleInput.equipment_id?: string | null` + the insert key `equipment_id: input.equipment_id ?? null`. The mutable_scope pinned FoodPage/ColiformFlow for the lab wiring, but the ONLY write path (`createColiformSample`) uses a closed insert literal that would silently DROP the D1-4 FK write — a decorative picker. The 2 additive lines are the minimal honest fix (same track owns the file; no other lane's surface touched). Everything else ⊆ the pinned mutable_scope.

### D4 battery (at head `5854cdc` + docs)

| Gate | Result |
|---|---|
| vitest FULL | **757 passed / 1 skipped (758)** — 43 files (743 legacy + 14 new masters tests) |
| `tsc -b` | clean (exit 0) |
| oxlint | exit 0 — 0 errors; 19 warnings ALL pre-existing (0 findings in new/changed files) |
| Playwright FULL chromium w=1 | **293 passed** (284 legacy + 9 new) |
| guard (`test_env_coordination_guard.py`) | **344 passed + 450 subtests** |
| runtime (`test_env_autonomy_runtime.py`) | **62 passed + 32 subtests** |
| `check_release_version.py --tag v1.9.0` | **OK (v1.9.0; CHANGELOG entry v1.9.0)** — package.json 1.8.0→1.9.0, Thai พ.ศ. CHANGELOG entry, PR #223-ref |
| `git diff --check` | clean |
| exact-13-digit digit-run grep over all 16 changed files | **0 matches** (the only digit-runs ≥13 digits are the 14-digit migration timestamps — no national-ID-class value) |
| diff vs main | exactly 16 files — 15 ⊆ mutable_scope + the recorded food.ts deviation |

### Handoff to D5

Fresh-GLM independent review at the exact frozen head; independently re-run the battery where possible + re-verify the seed lineage bytes. The implementer never merges; the authorized reviewer owns approval + merge (release v1.9.0 tag at the deployed merge SHA post-deploy per ENV-APP-VERSION-001 D6).

## D6 — CLOSEOUT RECEIPT (2026-11-18)

Docs-only closeout transition off main @ `767a087e6cbb151b93076cf8a76e60cd8f8a8cd6`; branch `docs/env-parity-p3-001-closeout`; STOP at REVIEW_REQUESTED — the closeout author never merges; the authorized reviewer owns approval + merge. Scope: exactly 3 files — `docs/ai/CURRENT-WORK.md` (registry closeout), this handoff (lineID correction + this D6), `docs/work-orders/ENV-PARITY-P3-001.md` (status → DELIVERED — CLOSED).

### Full chain

1. **Claim transition** — PR #222 merged `bb43c83f3f39fbf232f2dab65e74fed421b3ccf1` (docs-only, off base `5253f66594e02af04ee56fc3896fc86b0f7232ed`; fence `expected_policy_revision = 5253f66…` / `expected_registry_hash = 73083e44…`, registry block AT base, guard method — re-verified byte-exactly at closeout: validate-registry at `5253f66` reproduces `73083e44e653f62d86b03faed2feff5b0c38bdfcf9e9aff3803b05499ea9a78b`).
2. **Implementation** — PR #223 merged `767a087e6cbb151b93076cf8a76e60cd8f8a8cd6`, second parent EXACTLY the D5-APPROVED head `db430839611f5b0bac1f3ed371a5f445e0f83ef5` (merge commit, no squash, `gh pr merge --match-head-commit db430839…`); merge stat = 18 files 3002+/3- = the 16 claimed code files + WO + handoff (the D5 file reconciliation); CURRENT-WORK.md diff EMPTY at merge; ONE recorded deviation `frontend/src/lib/food.ts` +6 ruled ACCEPT by D5.
3. **D5 fresh-GLM independent review** — APPROVED issuecomment-6966808162 at exact frozen head `db43083` (base `bb43c83`): 0 P1 / 0 P2 / 3 P3 + 1 informational; distributor seed independently re-verified 36/36 field checks 0 mismatches; Items/Vendors/Categories zero-seed SOURCE_UNAVAILABLE independently reproduced; all D1 rulings D1-1…D1-8 CONFIRMED, none overturned.
4. **Merge-execution review trail** — issuecomment-6966860214 (D5 receipt, expected head `db430839…`, merge policy, the 4 P3 carries, tag plan).
5. **Deploy verification** — Pages run 44221110267 SUCCESS for `767a087`; live HTTP-200 checks: `assets/index-hdVgf-yA.js` carries `1.9.0` ×2 + `app-version-chip` + `app-version-summary` + `ข้อมูลเวอร์ชันแอป`; `assets/MastersPage-CwceHGUq.js` carries `ผู้จัดจำหน่าย` / `ยังไม่มีข้อมูล` / `ตัวที่ยังไม่มีข้อมูลจาก Sheets`.
6. **Release v1.9.0 MINOR (D1-5)** — annotated tag `v1.9.0` (tag object `4eb1ff37007fb6f51b4dc4100132a7dfcc07d5d9`) created on the deployed merge SHA `767a087` (peels to it, `ls-remote` confirmed), pushed; `python3 scripts/check_release_version.py --tag v1.9.0` → "RELEASE VERSION CHECK: OK (v1.9.0; CHANGELOG entry v1.9.0)", exit 0.
7. **Post-merge verification at `767a087`** — guard 344/344 OK; validate-registry `{ok:true, claims:39, BOOTSTRAP_CONTROL}` with this claim still CLAIMED at merge time (the closeout lane closed it); local main ff-only `bb43c83→767a087` clean.

### The 4 D5 doc-nits — carried and reconciled here

- **P3-1** — handoff blanks-census prose said "4 lineID"; derived truth (the committed test's bytes-derived expectation `scripts/test_parity_p3_001_masters.py:519` + the seeded rows) is **5**. Per D5's "fix in closeout or leave with this comment as the correction of record": BOTH applied — the prose above is corrected in place with a bracketed correction note, and the WO status records the correction of record. Seed data unaffected (D5's independent 36/36 byte audit).
- **P3-2** — RED commit `57422c1` carried a second, unrecorded tsc error TS6133 `'ItemFormInput' is declared but its value is never read` at `masters.test.ts(36,8)` (unused type import, removed by head). Disclosure-level; RED mode/mic meaning unaffected. Carried to the CURRENT-WORK ledger — no fix required.
- **P3-3 (informational)** — XLSX export size drift (364,794 → 366,687 at D5's re-fetch) is Sheets metadata volatility; distributor-tab content verified byte-equal. No action.
- **P3-4 (informational)** — the D5 session could not independently rerun the live-DB contract suite (Drive-secrets token + MCP unreachable there). Live-DB state rests on the implementer's receipts (72 OK / 0 FAIL, 23/23 post-apply) + D5's source-level byte verification. Carried to the ledger; re-run belongs to a future lane with Drive access.

### Fence

`expected_policy_revision = 767a087e6cbb151b93076cf8a76e60cd8f8a8cd6`; `expected_registry_hash = 6de13bfb9f302575c77bea2a57f58fc280eef5432a2616e33e010b71d0a2059a` (guard `validate-registry` registry_hash AT `767a087`; method empirically cross-checked — the same method at claim base `5253f66` reproduces the recorded `73083e44…` byte-exactly).

### Programmatic verification (to be re-run at the closeout head)

- guard 344/344 OK; validate-registry `ok:true` 39 claims, `ENV-PARITY-P3-001-C1` CLOSED; `git diff --check` clean.
- Claim-by-claim JSON diff vs `767a087`: exactly 1 of 39 claims changed (this claim → CLOSED), other 38 byte-identical.
- `git diff --stat` vs `767a087`: exactly 3 files (CURRENT-WORK.md + WO + handoff).

### Frontier after this closeout merges

Phase 3 lane **P3.2** next per plan §6 line 246 — "Inventory: ผูก Lot/MFG/EXP + หักสต๊อกผ่าน `chemical.movement` (ทางเลือก auto ตาม owner decision §5.3-3)" — needs its own NEW reviewed claim transition (core.item remains seedless until the owner shares the Items sheet; the P3.1 schema + legacy/provenance columns make the deferred seeds migration-free). Items/Vendors/Categories master seeds STILL AWAIT OWNER SHEET-SHARES (guarded P2.1/P2.3 recipe, never fabricated). Phase 4 remains owner-gated per plan §5.3 (อย่าเริ่มก่อนได้คำตอบ §5.3). Standing: Phase-1 dual-run PENDING OWNER ACTION; the extinguisher-master + coliform-history + 858-row ตรวจสอบถัง sheet-share re-seeds PENDING OWNER ACTION; hooks #155 approved-not-started (owner-manual); #156 open (owner-manual); Building WAITING_EXTERNAL; P4 authorized awaiting Phase reach. CLOSED confers no fresh mutation authority.
