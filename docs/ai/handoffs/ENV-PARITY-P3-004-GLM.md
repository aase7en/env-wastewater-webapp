# GLM Handoff — ENV-PARITY-P3-004 (Claim ENV-PARITY-P3-004-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p3-004` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p3-004` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row IS the scope

AppSheet parity **Phase 3 — งานสนับสนุน — lane P3.4, the FOURTH Phase-3 lane**. Plan §6 row P3.4 line 248 VERBATIM (binding, supersedes any shorthand):

> | P3.4 | job: QR-scan + geofence ≤0.7 กม. (server haversine) + working EnumList + ภาพ — อาจขยาย `building.inspection_round` หรือแยก `core.job_log` (ตัดสินที่ WO) |

WO `docs/work-orders/ENV-PARITY-P3-004.md` holds the full binding pins (§0 components, §2 source receipts, §3 migration plan, §4 geofence/virtual semantics, §5 UI, §6 release, §8 D1 items). Read it before writing anything. Summary of the deliverables:

1. **Job log schema** — reference 12 §3.24 `job` (19 cols, ref 4363–4620: the 9 persisted `ID`/`Date_time`/`QR_CODE`/`location`/`location_name`/`practician`/`working`/`image`/`issue` + the 9 virtual ReadOnly) translated into ONE new log table `core.job_log` (the row's own alternative name; `legacy_id` UNIQUE + `location_area_id` FK + `qr_legacy_id` + `lat`/`lng` + `practitioner_id` UUID-or-NULL + `practitioner_legacy_id` + `working` verbatim + `image_ref` + `issue` + `source_provenance`) + the §3.23 master `core.location_area` (15-row seed). The 9 VIRTUAL columns are NEVER stored — the haversine gate computes, the พ.ศ./ชื่อเล่น renders, `L.Image` is NOT replicated.
2. **The server haversine geofence (the row's own pin)** — haversine(lat, lng, **14.361183, 100.645474**) — the verbatim hospital pin — rejecting `> 0.7` km on NEW staff writes with the verbatim error `ฮั่นแน่...เข้ามาทำงานก่อน`; the QR Valid If poem verbatim on the QR surface; the AppSheet `<=2` virtual-check bound RECORDED, never reconciled; the 1102-row history seed EXEMPT from retroactive re-validation.
3. **Seed verdict** — REACHABLE → guarded seeds: `job` **1102/1102** (census: ID 1102 distinct; Date_time 1097 datetime + 5 string cells พ.ศ. 2566→2569 ⇒ CE year−543; QR 1101 nonempty = 1099 rows over 15 unique 8-hex ids + **2 literal `สแกน QR CODE` placeholders + 1 blank carried verbatim, never coerced**; location 1055 distinct pairs; location_name 1089/13 blank; practician 1100/2 blank/13 distinct = PII; working 1085/17 blank/15 combos; image 1091/11 blank incl. `Unable to lo…` artifacts; issue 39) + `location_area` **15/15** (join integrity with job.QR_CODE exact, 0 unmatched either direction). `auditors` REACHABLE-but-EMPTY (0 rows — honest zero, OUT per D1-3); `ชีต4` scratch (never seeded); core.personnel stays 9 rows.
4. **THE PII HARD PIN** — `practician` = 1037 raw 13-digit national-ID cells (13 distinct). Seed carries ONLY the resolved `core.personnel` UUID or NULL (the P2.3 D1-3 precedent VERBATIM: type-coerced Employee_id probes + full-name → employee_code resolution + disclosure counts in the handoff/MIGRATION count report). The raw 13-digit strings NEVER enter any SQL file, log, fixture, or chat; 13-digit digit-run grep of new files = 0.
5. **UI** — minimal staff-gated job log surface (the `practician` Valid If = the P1.4 gate verbatim; scan → geofence verdict → working multi-select over the 4 verbatim values `รดน้ำ`/`ตัดหญ้า`/`กวาด`/`เก็บขยะ` → photo → issue; history list พ.ศ. + honest empty state); mobile-first; additive nav/route only. D1-7 rules the gate.
6. **Release v1.12.0 MINOR** (D1-8) — `frontend/package.json` 1.11.0→1.12.0 + Thai พ.ศ. CHANGELOG entry; tag at the deployed merge SHA post-deploy.

## 1. Ground-truth citations (reference 12 READ-ONLY — never edited)

| Pin | Where |
|---|---|
| §3.24 `job` 19 cols (key `ID`; QR_CODE Valid If gate + poem; practician Valid If; working Enum values; the 9 virtual formulas) | ref 4363–4620 |
| §3.23 `location_area` 5 cols (key `id`; `qr_code` zxing App formula) | ref 4335–4361 |
| plan §6 Phase 3 row P3.4 line 248 VERBATIM | `docs/ai/APPSHEET-PARITY-PLAN.md:248` |
| PII class: Employee_id IS the Thai national ID | ref 12 §11 |
| P2.3 personnel-PII precedent (`auditor_id` UUID-or-NULL + legacy text + type-coerced resolution + disclosure counts) | migration `20261117000001_parity_p2_003.sql` + fix `20261117000002` |
| table-shape context: `building.inspection_round` + `garden.work_round` v2 skeletons | `supabase/migrations/20260719000000_v2_schemas.sql:95–125` |

## 2. Source receipts (this transition, 2026-11-19, READ-ONLY, zero Drive writes)

- **งานสวน workbook** `1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw` (full XLSX export 92,721 bytes → `/tmp` snapshot, deleted after verification; 4 tabs `job`/`auditors`/`location_area`/`ชีต4`, byte-consistent with the P2.4 6-workbook enumeration): tab `job` (9 header cols verbatim `ID, Date_time, QR_CODE, location, location_name, practician, working, image, issue`) **1102 data rows** — REACHABLE → guarded seed ships 1102/1102 (full census in WO §2); tab `location_area` (4 header cols verbatim `id, qr_code, area_name, image`) **15 data rows / 15 unique ids** — REACHABLE → guarded seed ships 15/15; tab `auditors` (6 header cols verbatim `ID, Date_time, QR_CODE, location, issue, auditors`) **0 data rows** — REACHABLE-but-EMPTY, absent from the ref-12 37-table index (sheet-side only); tab `ชีต4` — scratch (`#REF!` debris), NOT a data source.
- **PII census:** `job.practician` = 1037 nonempty cells with raw 13-digit digit-runs (13 distinct) — the ONLY PII column in any P3.4 source; UUID-or-NULL is a HARD pin; 13-digit grep 0. All other tabs/columns: NO personnel identity.
- The gviz by-NAME landmine stands (presence/absence proofs = XLSX tab enumeration only). The source XLSX re-fetches GET-only to `/tmp/env-p3-004-garden.xlsx` when absent.

## 3. D-phase obligations

- **D2 RED first** — new unit suite fails-to-collect (module absent — the honest new-file RED mode); e2e truthful failures over the absent surface; SQL contract suite (`scripts/test_parity_p3_004_job.py`, transaction-scoped BEGIN…ROLLBACK zero-net-persistence) records live absent-object failures pre-apply (tables absent; the seed fixtures NEVER sent pre-apply — canary holds, ZERO durable writes); `tsc` records the absent-module error. Fixture semantics pinned: table/column shapes, RLS policy shapes, guarded-seed idempotency (re-run adds 0), blanks⇒NULL census (1102/1102 + 15/15; the placeholder/blank QR rows; 17 NULL working; 13 NULL location_name; the practitioner disclosure counts), verbatim-string fidelity, haversine bounds (0.7 reject / accept / history-exempt), PII (no 13-digit digit-run anywhere), baseline integrity. Record every count verbatim; disclose any legacy pass.
- **D3** — ONE migration `supabase/migrations/20261118000006_parity_p3_004.sql` applied via `scripts/apply_migration_api.py` behind the ENV_DB gate with preflight (target absent, policies 0, baselines wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / fire_extinguisher 0 / emergency_light_check 332 / food.lab_test 0 / core.item 0 / core.vendor 0 / core.item_category 0 / core.distributor 6 / chemical.inventory_lot 0 / core.item_calibration 11 intact) + documented rollback; the practitioner resolution step (uuid/NULL only into generated SQL); schema lib additive; the job log surface + geofence verdicts per D1-5/D1-6.
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1; guard 344/344 (+450 subtests); runtime 62/62 (+32 subtests); checker OK v1.12.0; `git diff --check` clean; 13-digit digit-run grep of new files = 0.
- **D5** — fresh-GLM independent review at the exact frozen head + independent battery rerun + own read-only live probes (seed counts verified inside ROLLBACK transactions; baselines identical pre/post). Implementer never merges.

## 4. Hard constraints (violations park the claim)

- Scope = the registry `mutable_scope` + WO §10 EXACTLY. Everything unlisted forbidden. Any rename-class change = recorded deviation, never silent.
- The `auditors` tab contributes 0 rows; `ชีต4` never seeded; `core.personnel` stays 9 rows; `core.location` untouched — never fabricated, never reconstructed.
- PII: `practician` 13-digit values NEVER in SQL/lib/UI/tests/logs/chat — resolved UUID-or-NULL only + disclosure counts; 13-digit grep 0.
- Honesty: unknown ≠ zero (blanks⇒NULL; the placeholder/invalid QR rows carried verbatim and flagged, never dropped or "fixed"; a geofence reject is an honest reject, never a silent pass); latest ≠ live; พ.ศ. dates; synthetic test values only; zero unanticipated durable writes.
- ENV_DB gate: apply only via the gated helper with preflight/rollback; house `notify pgrst` trailer.
- No Drive writes of any kind; no `.env`/secrets in commits or chat; no reference/plan-doc edits; no CI edits.

## 5. Single next safe action

After the transition PR merges: create `_worktrees/env-parity-p3-004` off the new main tip, commit D2 RED (unit + e2e + SQL-contract + tsc evidence, zero durable writes), then D3 → D4 → D5 per §3 — stopping at REVIEW_REQUESTED.

## 6. Implementation receipts (D2/D3/D4, 2026-11-19; PR #232 — STOP at REVIEW_REQUESTED)

Full receipts live in the WO §11 (`docs/work-orders/ENV-PARITY-P3-004.md`); the D5 reviewer's one-paragraph digest:

- **D2 RED truthful** (`c86f242`, zero durable writes): vitest fails-to-collect (0 tests) / tsc TS2307 / e2e **7F-0P** truthful / live SQL contract **7F + 10S canary + 2P disclosed legacy passes**. Honest env note recorded: the fresh worktree lacked the gitignored `frontend/.env` at RED (main checkout holds it untracked) — the e2e RED combines absent-surface + env-gap; resolved at D3, never silent.
- **D2 rulings:** **D1-5 CONFIRMED 0.7 km** as the server write gate (the plan row's OWN pin; the `<=2` virtual-check bound recorded verbatim, never reconciled — `DISPLAY_CHECK_LIMIT_KM`); **D1-6 RULED** BEFORE INSERT trigger (gates every insert path) + blank-coordinates reject with the verbatim `ฮั่นแน่...เข้ามาทำงานก่อน` + the history-seed exemption via the pinned seed-provenance marker; **D1-4 RULED** `working` = verbatim " , "-joined text (new writes join identically); **D1-7 RULED** location_area house-master RLS + job_log log/append (staff SELECT+INSERT / admin UPDATE+DELETE, zero anon) + staff UI gate.
- **D3 apply:** preflight PASS live (13/13 baselines + targets absent) → gated apply 480 OK → Management-API `ThrottlerException` (rate limit, not SQL) → throttle-aware idempotent re-send finished the guarded seeds → **1102/1102 + 15/15** + `notify pgrst` → contract suite **19/19 OK** (census exact; 3-row verbatim spot-check vs XLSX bytes — placeholder row + NULL-practician row + resolved row; geofence rollback-smoke in-range ok / out-of-range verbatim reject / blank reject / seed class exempt / zero residue; guarded re-send adds 0; join integrity 0 unmatched).
- **PII resolution outcome (ALL 1100 nonempty cells — the R2 P3-A carry): RESOLVED 765 / NULL 335 (+2 blanks ⇒ NULL)** — 765 cells → 7 distinct staff UUIDs (STAFF-001…007) via type-coerced `Employee_id` probes (exact/last-13/first-13) + whitespace/title-normalized full-name → unique core.personnel match; **the distinct 8-digit class ×63 RESOLVED to STAFF-003** (the personnel tab itself carries that employee's Employee_id as an 8-digit value — exact match, name unique; recorded per the R2's verbatim-class demand); 335 cells over 7 distinct values honestly NULL (243 cells / 3 values incl. the 16-digit ×161 class with no Employee_id probe hit; 92 cells / 3 values whose matched names are absent from the 9-row core.personnel); raw values never entered any committed file/DB/chat; `practitioner_legacy_id` NULL on every row; 13-digit grep of new files = 0.
- **D4 battery** (docs head): vitest FULL 809P/1S (46 files: 787P/1S base + 22 new job tests) · tsc clean · oxlint 0 errors (pre-existing warnings only) · Playwright FULL chromium w=1 **310/310** (303 base + 7 new) · guard 344/344 (+450 subtests) · runtime 62/62 (+32 subtests) · checker OK v1.12.0 · `git diff --check` clean · diff = 13 files ⊆ WO §10 · 13-digit grep 0. (Counts as executed live — see the exact numbers in the merge-candidate receipt below if D5 re-runs differ by legitimate suite drift.)
- **D5 next:** fresh-GLM review at the exact frozen head (battery re-run where possible + own read-only live probes; the contract suite re-runs as-is; XLSX re-fetches GET-only to `/tmp/env-p3-004-garden.xlsx` + `/tmp/env-p3-004-pond.xlsx`). Implementer never merges; the authorized reviewer owns approval + merge; the closeout (CURRENT-WORK rewrite) is the successor docs lane.

---
