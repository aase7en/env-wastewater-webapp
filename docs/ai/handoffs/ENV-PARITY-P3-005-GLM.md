# GLM Handoff — ENV-PARITY-P3-005 (Claim ENV-PARITY-P3-005-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p3-005` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p3-005` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row IS the scope

AppSheet parity **Phase 3 — งานสนับสนุน — lane P3.5, the FIFTH Phase-3 lane**. Plan §6 row P3.5 line 249 VERBATIM (binding, supersedes any shorthand):

> | P3.5 | คู่มือ ×2 (หมวดเอกสารในแอป: รายการ+ไฟล์+รูป) + address (config/seed ตาม owner decision §5.3-4) |

WO `docs/work-orders/ENV-PARITY-P3-005.md` holds the full binding pins (§0 components, §2 source receipts, §3 migration plan, §4 virtual/link semantics, §5 UI, §6 release, §8 D1 items). Read it before writing anything. Summary of the deliverables:

1. **Three tables** — reference 12 §3.22 `คู่มือ` (5 cols, key `id`) + §3.26 `คู่มือน้ำประปา` (5 cols, key `Row ID`) translated into `core.manual_wastewater` + `core.manual_water_supply` (the row's "×2" verbatim; D1-2 rules the two-vs-one shape) + §3.6 `address` (8 cols, key `TambonID`) into `core.address`. All: uuid PK + verbatim legacy ids UNIQUE + `source_provenance` + house RLS. The §3.6 `Address_Key` virtual is NEVER stored.
2. **Owner answer B7 (2026-11-15)** — หัวรายงานดึงจากตาราง ไม่ฝัง: address = the admin-EDITABLE reference table the future P4.1 PDF headers read from. The P4.1 consumption is a NOTED Phase 4 dependency — never built in this lane.
3. **Seed verdicts** — `คู่มือ` REACHABLE → guarded seed **10/10** (pond workbook tab: 10 rows / 10 unique 8-hex ids / ZERO blanks; รายการ = 10 distinct Thai manual titles; รูป = `คู่มือ_Images/…` refs; link = `คู่มือ_Files_/…pdf` refs); `address` REACHABLE → **D1-3 rules the scope** (full guarded census **7,436/7,436** PROPOSED — TambonID 7,436 unique / 77 provinces / DistrictID 928; the plan's "~1 แถว" vs the census reality is a recorded DIVERGENCE; integer-coerce the float ids); `คู่มือน้ำประปา` **SOURCE_UNAVAILABLE → 0 rows + marker, never fabricated** (absent from ALL 6 public workbooks re-enumerated 2026-11-19; the water-supply workbook never publicly shared; owner sheet-share obligation carried).
4. **The manual FILES are link-only metadata** — the PDFs live in Drive folders and NEVER enter repo/DB/bundle/chat (no copying, no embedding, no binaries); UI new-tab anchors ONLY for absolute http(s) refs, legacy relative refs render as text + honest note (the AppSheet `gettablefileurl` resolution is infrastructure NOT replicated — the P3.4 `L.Image` precedent).
5. **UI** — two additive admin-gated pages (manuals list/link display with domain tabs + the honest water-supply empty state; address editable reference with search/pagination over the census), Thai/พ.ศ., mobile-first, additive nav/route only. D1-7 rules the shape.
6. **Release v1.13.0 MINOR** (D1-8) — `frontend/package.json` 1.12.0→1.13.0 + Thai พ.ศ. CHANGELOG entry; tag at the deployed merge SHA post-deploy.

## 1. Ground-truth citations (reference 12 READ-ONLY — never edited)

| Pin | Where |
|---|---|
| §3.22 `คู่มือ` 5 cols (key `id`; Init `UNIQUEID()`; no virtual columns) | ref 4315–4334 (actions ref 6273; view ref 5929) |
| §3.26 `คู่มือน้ำประปา` 5 cols (key `Row ID`; Init `UNIQUEID("PackedUUID")`) | ref 4640–4659 (actions ref 6274; view ref 5930) |
| §3.6 `address` 8 cols (key `TambonID`; `Address_Key` virtual formula) | ref 1521–1543 (actions ref 6258) |
| plan §6 Phase 3 row P3.5 line 249 VERBATIM | `docs/ai/APPSHEET-PARITY-PLAN.md:249` |
| Owner answer B7 + §5.3-4 (ตารางแก้ไขได้ — ไม่ฝัง; P4.1 อ่านหัวรายงานจากตาราง) | `docs/ai/APPSHEET-PARITY-PLAN.md:184,198` |
| plan matrix address row ("~1 แถว" assumption vs the census reality) | `docs/ai/APPSHEET-PARITY-PLAN.md:95` |
| Virtual-column never-stored precedent (`L.Image` class) | `docs/work-orders/ENV-PARITY-P3-004.md` §3-3/§4 |
| type-coercion lesson (float ids) | the P2.3 D5 P1 root-cause record (registry ledger) |

## 2. Source receipts (this transition, 2026-11-19, READ-ONLY, GET-only XLSX exports to local tmp snapshots, deleted after verification, zero Drive writes)

- **Pond workbook** `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk` (full XLSX 365,725 bytes → `/tmp` snapshot; 12 tabs byte-consistent with the P2.4/P3.1 enumerations): tab `คู่มือ` — 4 header cols verbatim `id, รายการ, รูป, link`; **10 data rows / 10 unique ids / zero blanks** (full census in WO §2) — REACHABLE → guarded seed ships 10/10.
- **markad workbook** `1AUjAulq0-YvfJVhcBtJJfJhesAPArqn6BhjP3Gi8azQ` (full XLSX 1,187,196 bytes; 6 tabs byte-consistent with the P2.4 enumeration): tab `address` — sheet header = the 6 stored cols verbatim `TambonID, TambonThai, DistrictID, DistrictThai, ProvinceID, ProvinceThai`; **7,436 data rows** (TambonID 7,436 unique; 77 provinces; DistrictID 928; อุทัยธานี 70 rows/8 districts; ids arrive as sheet floats → integer-coerce at seed generation) — REACHABLE → D1-3 rules the seed scope.
- **`คู่มือน้ำประปา`: absent everywhere** — the 6-workbook re-enumeration of TODAY (pond 12 / markad 6 / งานสวน 4 / tool_maintainance 1 [5,913 bytes EXACT match to P3.3] / extinguisher 5 / light 4; export sha256 content hashes pinned per the P3.4 D5 P3-3 lesson) + the P2.4 full enumeration. The PDF FILES seen as Drive FOLDER content are folder content, NOT the table's workbook — folder listings are not sheet enumerations.
- **PII census:** NO personnel-identity column in ANY P3.5 source (public manuals + public national geography). The 13-digit ban is preventive; grep of new files = 0.
- The gviz by-NAME landmine stands (presence/absence proofs = XLSX tab enumeration only). Source XLSX re-fetches GET-only to `/tmp/env-p3-005-pond.xlsx` + `/tmp/env-p3-005-markad.xlsx` when absent.

## 3. D-phase obligations

- **D2 RED first** — new unit suites fail-to-collect (module absent — the honest new-file RED mode); e2e truthful failures over the absent surfaces; SQL contract suite (`scripts/test_parity_p3_005_manuals_address.py`, transaction-scoped BEGIN…ROLLBACK zero-net-persistence) records live absent-object failures pre-apply (tables absent; the seed fixtures NEVER sent pre-apply — canary holds, ZERO durable writes); `tsc` records the absent-module errors. Fixture semantics pinned: table/column shapes, RLS policy shapes, guarded-seed idempotency (re-run adds 0), the 10/10 + census seed semantics (integer-coercion, blanks⇒NULL — both tabs have none), verbatim-string fidelity, the link-display predicate (absolute http(s) → new-tab anchor; relative → text + honest note), Address_Key never-stored, baseline integrity. Record every count verbatim; disclose any legacy pass.
- **D3** — ONE migration `supabase/migrations/20261118000007_parity_p3_005.sql` applied via `scripts/apply_migration_api.py` behind the ENV_DB gate with preflight (target tables absent, target policies 0, baselines wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / fire_extinguisher 0 / emergency_light_check 332 / food.lab_test 0 / core.item 0 / core.vendor 0 / core.item_category 0 / core.distributor 6 / chemical.inventory_lot 0 / core.item_calibration 11 / core.location_area 15 / core.job_log 1102 intact) + documented rollback + the house `notify pgrst` trailer; guarded seeds per the D1-2/D1-3 rulings; schema lib additive; the two admin surfaces per D1-6/D1-7.
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1; guard 344/344 (+450 subtests); runtime 62/62 (+32 subtests); checker OK v1.13.0; `git diff --check` clean; 13-digit digit-run grep of new files = 0.
- **D5** — fresh-GLM independent review at the exact frozen head + independent battery rerun + own read-only live probes (seed counts verified inside ROLLBACK transactions; baselines identical pre/post) + own source re-fetch. Implementer never merges.

## 4. Hard constraints (violations park the claim)

- Scope = the registry `mutable_scope` + WO §10 EXACTLY. Everything unlisted forbidden. Any rename-class change = recorded deviation, never silent.
- `คู่มือน้ำประปา` contributes 0 rows (SOURCE_UNAVAILABLE — never fabricated, never reconstructed from folder listings or ref-12 definitions); `core.personnel` stays 9 rows.
- THE FILES: no Drive write of any kind; no PDF binary copied into repo/DB/bundle/chat; link-only metadata; legacy refs verbatim, never fetched/rewritten.
- `Address_Key` NEVER stored (display-time only); no trigger writes derived values.
- Honesty: unknown ≠ zero (the empty water-supply manual table renders the honest empty state; never a fabricated row); latest ≠ live; verbatim strings; พ.ศ. dates; synthetic test values only; zero unanticipated durable writes.
- ENV_DB gate: apply only via the gated helper with preflight/rollback; house `notify pgrst` trailer.
- No `.env`/secrets in commits or chat; no reference/plan-doc edits; no CI edits; no Phase 4 surface of any kind (the P4.1 header consumption stays a noted dependency).

## 5. Single next safe action

After the transition PR merges: create `_worktrees/env-parity-p3-005` off the new main tip, commit D2 RED (unit + e2e + SQL-contract + tsc evidence, zero durable writes), then D3 → D4 → D5 per §3 — stopping at REVIEW_REQUESTED.
