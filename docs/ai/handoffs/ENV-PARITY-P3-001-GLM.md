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
