# GLM Handoff — ENV-PARITY-P3-002 (Claim ENV-PARITY-P3-002-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p3-002` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p3-002` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row IS the scope

AppSheet parity **Phase 3 — งานสนับสนุน — lane P3.2, the SECOND Phase-3 lane**. Plan §6 row P3.2 line 246 VERBATIM (binding, supersedes any shorthand):

> | P3.2 | Inventory: ผูก Lot/MFG/EXP + หักสต๊อกผ่าน `chemical.movement` (ทางเลือก auto ตาม owner decision §5.3-3) |

WO `docs/work-orders/ENV-PARITY-P3-002.md` holds the full binding pins (§0 components, §2 source receipts, §3 migration plan, §4 deduction semantics, §5 UI, §6 release, §8 D1 items). Read it before writing anything. Summary of the deliverables:

1. **Inventory lot semantics (ผูก Lot/MFG/EXP)** — reference 12 §3.28 `Inventory` (13 cols, ref 4679-4751) translated into ONE new dedicated lot table `chemical.inventory_lot` (per-ถัง lot receipts: LotNo/MFG/EXP per lot, amount_received/amount_deducted with a never-negative CHECK, master_id + item_id/item_legacy_id bindings, `legacy_id` UNIQUE + `source_provenance`); the two §3.28 virtual columns (`Chlorine_realyDiv10`/`Chlorine_realyDiv4`) are QUERY-DERIVED displays (plan §4 line 152 "ไม่ต้องเก็บซ้ำ") — never stored.
2. **Auto-deduction via `chemical.movement`** — owner B6 (2026-11-15, plan §5.3-3 verbatim: "เปิด ถ้าทำได้จริง… คลอรีน 10% รับเข้าเป็น N ถัง/ตลับ") authorizes the auto option, gated on this lane. RPC `chemical.fn_deduct_chlorine_stock` (SECURITY INVOKER, P2.2 binding): FEFO by expiry (NULLs last), allocation slices → ONE `direction='out'` movement row per slice (the existing `fn_recompute_balance` trigger stays the balance authority), **fail-closed when no lot has stock — the usage row still records, the deduction is skipped + explicitly flagged, stock NEVER negative**, idempotent per usage row via a `(source_table, source_id)` UNIQUE deduction index. AppSheet has NO live automation to replicate (manual action `Deduct Chlorine Stock` ref 6011-6031 on Item `0c0e6a47` only, floored at 0; bot `(disabled) Auto Deduct Chlorine Stock` ref 6350-6353) — auto-deduct is an ENV-new capability built honestly per B6, recorded as such, never presented as an AppSheet transcription.
3. **Seed verdict** — `Inventory` sheet SOURCE_UNAVAILABLE (P3.1 same-day 2026-11-18 receipt: the tab is ABSENT from the 12-tab pond enumeration + the P2.4 6-workbook enumeration; re-fetch honestly not repeated same-day) → **seed NOTHING, never fabricated**; the ONLY guarded seed is the ONE reference/config mapping row (`chemical.master.legacy_item_id = '0c0e6a47'`, the verbatim AppSheet action anchor, ref 6013).
4. **UI** — minimal admin-gated inventory surface: รับเข้า lot entry per ถัง (B6's own words) + stock view with per-lot remaining + honest empty states; ADDITIVE deduction-result badges on the two chlorine form surfaces; the delivered `/chemical` manual movement entry is **UNCHANGED**.
5. **Release v1.10.0 MINOR** (D1-8) — `frontend/package.json` 1.9.0→1.10.0 + Thai พ.ศ. CHANGELOG entry; tag at the deployed merge SHA post-deploy.

## 1. Ground-truth citations (reference 12 READ-ONLY — never edited)

| Pin | Where |
|---|---|
| §3.28 `Inventory` 13 cols (key `Inventory ID` `UNIQUEID()`; `Item ID`/`DateTime` NOW()/`Amount`/`Amount_unit_deduct`/`Total_deduct`/`LotNo`/`MFG`/`EXP`/`LifeTime` TIMENOW(); `Chlorine_realyDiv10`/`Chlorine_realyDiv4` Virtual ReadOnly) | ref 4679-4751 |
| `Chlorine_realyDiv10` = latest น้ำประปา `real_Chlorine` by MAXROW Date | ref 4719-4734 |
| `Chlorine_realyDiv4` = latest ข้อมูลคุณภาพน้ำ `คลอรีนน้ำที่ใช้จริง` by MAXROW วันที่ บันทึก | ref 4736-4750 |
| manual action `Deduct Chlorine Stock` (SET `Amount_unit_deduct` −= today's คลอรีนน้ำที่ใช้จริง of Item `0c0e6a47`, ELSE 0 floor; `Invoke Deduct Chlorine Stock` REF_ACTION) | ref 6011-6041 |
| bot `(disabled) Auto Deduct Chlorine Stock` (App on ข้อมูลคุณภาพน้ำ · Adds → Run action on rows) — DISABLED at source | ref 6350-6353 |
| คลอรีนน้ำที่ใช้จริง ÷SWITCH derivation (wastewater) | ref ~767 + P1.2 `wastewater.v_reading_meter_chain.chlorine_used_real` |
| น้ำประปา `Chlorine usage` / `Chlorine_usage_realy` ÷(1+9) (A3 verbatim) | P1.5 `water_supply.daily_check.chlorine_usage` + `water_supply.v_daily_check_chain` |
| plan §4 line 152 — Inventory virtual lookups AS-IS "คิวรีค่าใช้คลอรีนล่าสุดของวัน — ไม่ต้องเก็บซ้ำ" | `docs/ai/APPSHEET-PARITY-PLAN.md:152` |
| owner B6 + §5.3-3 (auto-deduct authorization, 2026-11-15) | `docs/ai/APPSHEET-PARITY-PLAN.md:183` + `:197` |
| PII class: Employee_id IS the Thai national ID | ref 12 §11 |

## 2. Source receipts (this transition, 2026-11-18, READ-ONLY, zero Drive writes)

- **`Inventory` sheet rows: SOURCE_UNAVAILABLE — seed 0.** Inherited from the P3.1 same-day source enumeration (2026-11-18, verbatim in `docs/work-orders/ENV-PARITY-P3-001.md` §2): the `Inventory` tab is ABSENT from all 12 pond-workbook tabs AND from the P2.4 full 6-public-workbook enumeration. The re-fetch was honestly NOT repeated this transition (same-day receipt; the gviz by-NAME landmine stands — absence proofs = XLSX tab enumeration only). `legacy_id` UNIQUE + `source_provenance` ship NOW so a deferred owner-sheet seed needs NO second migration; owner sheet-share obligation carried durably.
- **`chemical.movement` live shape** (schema snapshot `reports/schema-snapshot-live.md:158-177` + `20260719000006_mod_columns.sql:143-155`): 16 columns — already carries `lot_no`/`expiry_date`/`supplier`/`unit_cost`/`master_id` but **NO MFG and NO per-lot remaining** ⇒ the dedicated lot table is required; movement stays the ledger; `balance_after` stays trigger-owned by `chemical.fn_recompute_balance`.
- **Chlorine save paths** (code reads at base `1294732`): wastewater readings save via the atomic `fn_create_reading` RPC (PR #171) with `chlorine_used` + `chlorine_mix_ratio` (derived `chlorine_used_real` = คลอรีนน้ำที่ใช้จริง); water supply saves via `frontend/src/lib/water-supply.ts` with `chlorine_usage` (derived `chlorine_usage_realy` ÷(1+9) per A3). BOTH consume the same 10% chlorine stock per B6/A3 — D1-3 rules wastewater-only (strict AppSheet anchor: the action + disabled bot both target ข้อมูลคุณภาพน้ำ only) vs both-in (B6 intent). WO proposes BOTH-IN with the divergence recorded.
- **`/chemical` delivered surface** (`ChemicalPage.tsx` + `frontend/src/lib/chemical.ts`): manual รับเข้า/จ่ายออก movement entry with Lot No. field — byte-untouched by this lane.

## 3. D-phase obligations

- **D2 RED first** — new unit suite fails-to-collect (module absent — the honest new-file RED mode); e2e truthful failures over the absent surface; SQL contract suite (`scripts/test_parity_p3_002_inventory.py`, transaction-scoped BEGIN…ROLLBACK zero-net-persistence) records live absent-object failures pre-apply (lot table/RPC/mapping absent; the deduction fixtures NEVER sent pre-apply — canary holds, ZERO durable writes); `tsc` records the absent-module error. Fixture semantics pinned: FEFO order incl. NULL-expiry-last, multi-lot split allocation, shortfall fail-closed flag, idempotent retry no-double-deduct, never-negative CHECK, movement-row shape (direction='out'/lot/master/purpose/note), mapping resolution by `legacy_item_id`. Record every count verbatim; disclose any legacy pass.
- **D3** — ONE migration `supabase/migrations/20261118000002_parity_p3_002.sql` applied via `scripts/apply_migration_api.py` behind the ENV_DB gate with preflight (targets absent, policies 0, baselines wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / fire_extinguisher 0 / emergency_light_check 332 / food.lab_test 0 / core.item 0 / core.vendor 0 / core.item_category 0 / core.distributor 6 intact) + documented rollback; schema lib additive; the RPC wiring in the two chlorine save paths (ADDITIVE lines only — recorded deviation if a closed insert/literal forces one more file, the P3.1 food.ts precedent); the admin inventory UI + badges.
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1; guard 344/344 (+450 subtests); runtime 62/62 (+32 subtests); checker OK v1.10.0; `git diff --check` clean; 13-digit digit-run grep of new files = 0.
- **D5** — fresh-GLM independent review at the exact frozen head + independent battery rerun + own read-only live probes (movement rows created ONLY inside ROLLBACK transactions; baselines identical pre/post). Implementer never merges.

## 4. Hard constraints (violations park the claim)

- Scope = the registry `mutable_scope` + WO §10 EXACTLY. Everything unlisted forbidden. Any rename-class change = recorded deviation, never silent.
- The delivered `/chemical` page + `chemical.ts` CRUD are byte-untouched; the two chlorine form wirings are ADDITIVE ONLY; every other delivered P1/P2 surface byte-untouched; existing suites edit-forbidden (additive only).
- Honesty: unknown ≠ zero (no lot/no stock = skipped + flagged, never deducted-as-0, never stock fabricated); latest ≠ live; empty `core.item`/no lots ⇒ honest empty states; blanks ⇒ NULL; พ.ศ.; synthetic test values only; no PHI; 13-digit grep 0.
- ENV_DB gate: apply only via the gated helper with preflight/rollback; zero unanticipated durable writes (RED canary + baseline assertions); house `notify pgrst` trailer.
- No Drive writes of any kind; no `.env`/secrets in commits or chat; no reference/plan-doc edits; no CI edits.

## 5. Single next safe action

After the transition PR merges: create `_worktrees/env-parity-p3-002` off the new main tip, commit D2 RED (unit + e2e + SQL-contract + tsc evidence, zero durable writes), then D3 → D4 → D5 per §3 — stopping at REVIEW_REQUESTED.
