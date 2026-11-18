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

---

## 6. IMPLEMENTATION RECEIPT (D2 → D4, 2026-11-18, Track-Z GLM lane — STOP at REVIEW_REQUESTED)

Lane branch `feat/env-parity-p3-002` off the merged main tip `5dcd2c7bbf6c9c9637a90d07c454e0e12133beb1` (PR #225 merge; ancestry verified). Worktree `_worktrees/env-parity-p3-002` (clean at start; the repo-level `_worktrees/` untracked dir on the main checkout predates this lane — untouched). Commits: D2 RED `16d5f1c` → D3 feat `8edaf82` → release v1.10.0 + docs (final head recorded on the PR). **Implementer never merges; the authorized reviewer owns approval + merge.**

### 6.1 Environment receipts (local machine)

- Secrets resolution: the sibling-A-Wiki chain does NOT resolve from this machine layout; the Drive root is mounted at `~/Library/CloudStorage/GoogleDrive-aase7en@sunday-estate.com/My Drive/A-Wiki-Data` — supplied per-invocation via `A_WIKI_DRIVE_PATH` (never printed). Gate held: `SUPABASE_DB_URL` asserted to contain the ENV_DB ref `gllqtbyofrcjzmbnfoeh` (boolean-checked only); `SUPABASE_ACCESS_TOKEN` len 44 (never printed).
- The kilo-config supabase MCP token is STALE (401 on Management API + MCP `Unauthorized`) — all live probes ran through the Drive-secrets token + `scripts/_env.py`/`apply_migration_api.py` path instead.
- Local gitignored stubs created per house precedent (worktrees don't inherit them): repo-root `.env` = one line `__LOAD_FROM_DRIVE__=true`; `frontend/.env` copied from the canonical checkout (public publishable values only). `git check-ignore` verified both.

### 6.2 D2 RED (commit `16d5f1c`) — counts VERBATIM

| Channel | Result |
|---|---|
| vitest focused (`src/lib/inventory.test.ts`) | **1 file failed-to-collect** — `Error: Cannot find module '.../src/lib/inventory'` (TS2307); **0 tests collected** |
| `tsc -b` | **exit 2** — `src/lib/inventory.test.ts(21,8): error TS2307: Cannot find module './inventory' or its corresponding type declarations.` (1 error) |
| Playwright focused (`env-parity-p3-002-inventory.spec.ts`) | **4 failed / 0 passed** — truthful failures over the absent surface: `/admin/inventory` hit the unauthed catch-all (NotFound), so even the anon-bounce assertion had no route to bounce |
| Live SQL contract (`scripts/test_parity_p3_002_inventory.py`) | **10 failed / 1 passed / 9 skipped** — the 10 failures are the truthful absent-object reasons (e.g. `relation "chemical.inventory_lot" does not exist`, `column "legacy_item_id" does not exist`); the **1 pass is the DISCLOSED legacy pass** (the 11-table baseline canary 907/9/4/48/0/332/0/0/0/0/6 + master 0 — asserted over pre-existing objects only, by design so the durable-write canary is observable at RED); the **9 skips are the canary holding** (deduction fixtures F-A…F-G + seed re-send are NEVER SENT while the objects are absent — zero durable writes pre-apply) |

RED-suite mechanics note (honest): the suite file received assertion-mechanics corrections during D3 AFTER the RED capture (polcmd char codes not bitmasks; `timestamp with time zone` long name; `to_regprocedure` not `to_regproc`; a missing `;` before ROLLBACK in the fixture runner; a correlated-scope bug in two evidence subqueries; the mapping test moved to the fix-migration after the live 42703) — the RED RUN above was executed against the file as it stood at `16d5f1c` and the counts are from that run; the corrections changed how assertions read, not what they pin.

**D2 ruling — P3-1 reversal: IMPLEMENTED (not out-of-scope).** Both usage-row delete paths are real app surfaces (`supabase-queries.ts:deleteReading`, `water-supply.ts:deleteWaterSupplyDaily` — grep receipts at base), so orphaned `direction='out'` movements were a live gap; the compensation is EXACT (the allocation ledger records every slice — lot ↔ movement), so FEFO-inverse restore can never over-restore and the never-negative CHECKs hold by construction. Ruling + justification recorded in WO §7a; fixtures F-F/F-F2 + the delete-path wiring prove it.

**D2 pin — P3-2 result shape:** typed jsonb `{status: 'deducted'|'partial'|'skipped'|'already-deducted'|'already-skipped'|'reversed'|'nothing-to-reverse'|'noop', deducted_total, shortfall, already_recorded, allocated[], reason}`; a retried save is an IDEMPOTENT SUCCESS returning the truthful prior state (`already-deducted` w/ the prior total; `already-skipped` w/ the prior shortfall) and the badge renders it truthfully — never a double deduction, never a misreported "ไม่ได้หัก".

**D2 pin — P3-3:** the config-seed anchor citation is REF 6014 (the verbatim `=[Item ID] = "0c0e6a47"` inside the correctly-cited 6011-6031 range; fence 6013) — carried in the migration header, the fix-migration provenance paragraph, and asserted by `test_config_seed_provenance_recorded_in_source`.

### 6.3 D3 — migration + live evidence (commit `8edaf82`)

- `supabase/migrations/20261118000002_parity_p3_002.sql` applied via `scripts/apply_migration_api.py`: **37/38 OK** — the ONLY failure was statement [37/38] (the guarded config seed) failing LIVE `42703: column "source_provenance" of relation "master" does not exist`: the seed block had assumed the P2.1/P3.1 seed-lineage column, but `chemical.master` (20260719000006) predates that convention and WO §3-3 forbids ANY further column. **Repaired per the house `*_fix` convention as a NEW migration `20261118000003_parity_p3_002_fix.sql`** (never an edit of the applied file; the original in-file seed block stays for the record, unapplied), applied **2/2 OK**. The mapping row seeds `(name 'คลอรีน 10%', unit 'kg', legacy_item_id '0c0e6a47')` only; its provenance (ref 6014 + the SOURCE_UNAVAILABLE 0-lot verdict) is carried verbatim in the fix-migration source — the honest carrier, since no column may hold it. **DEVIATION (recorded, reviewer to rule): the fix migration was demanded at D3 by a live failure, not at D5** — the WO anticipated the convention for D5 repairs; the same rule applied earlier.
- Preflight/post-verify baselines (read-only probes, live): `chemical.master` **0 rows** at claim (clean seed; probe receipt 2026-11-18) → **exactly 1** mapping row post-apply; `chemical.inventory_lot` / RPCs absent pre-apply (to_regclass/to_regprocedure NULL receipts) → present post-apply; the 11-table baselines 907/9/4/48/0/332/0/0/0/0/6 intact pre/post.
- Live rollback-smoke (all inside single-request BEGIN…ROLLBACK, zero net persistence proven by post-counts 0/0/0 + balance restored 0.000): FEFO order incl. NULL-expiry-last + multi-lot split (LOT-B 3.0 → LOT-A 2.5, LOT-C untouched); shortfall fail-closed (partial 2.0/3.0 surfaced); no-stock → `skipped` + full shortfall + 0 movements; idempotent retry → `already-deducted`, 1 movement, 1 ledger row; direct overdraw → `check_fired` (named CHECK holds); reversal → `direction='in'` ×2 with `purpose_rev` + `note_has_provenance` true, lots restored to 0, ledger `reversed`, second call `nothing-to-reverse`; mapping-absent (is_active=false in-txn) → honest `skipped` + mapping-absent reason + ledger row; **balance-drop smoke: receipt 5.0 → deduct 2.0 → `current_balance` 3.0** (trigger-owned) with 0 lots + balance 0.000 after ROLLBACK.
- Contract battery final: **21/21 GREEN** (was 10F/1P/9S at RED).
- **D3 design correction caught by the live fixture:** a lot receipt must ALSO write ONE `direction='in'` movement — without it `fn_recompute_balance` (movement-net authority) drives `current_balance` negative on the first deduction (the fixture measured −2.0). `createInventoryLot` writes lot + matching 'in' movement (two sequential writes; the second's failure surfaces an honest warning — an atomic receipt RPC is a possible future lane, not a pinned surface). The contract battery encodes the receipt-movement rule (F-B).

### 6.4 D3 frontend (same commit)

- `frontend/src/lib/inventory.ts` — pins (CHLORINE_LEGACY_ITEM_ID = '0c0e6a47' ref 6014; SOURCE_WASTEWATER/SOURCE_WATER_SUPPLY per D1-3 BOTH-IN), the verbatim ÷SWITCH `chlorineUsedReal` (mirrors `wastewater.v_reading_meter_chain`; blank/unknown → NULL never 0), `formatDeductionBadge` truthful texts (WO §5 verbatim lines + the P3-2 already-* lines), RPC wrappers (`fn_deduct_chlorine_stock` / `fn_revoke_chlorine_deduction` pinned arg names), save-path helpers (`deductForReading` derives the real qty from the SAVED payload; `deductForWaterSupplyCheck` reads the VIEW-owned `chlorine_usage_realy` back from `v_daily_check_chain` — never re-derived client-side, the report-summary precedent; missing spec → honest skip note, never a guessed quantity), delete-path `revokeForUsageRow` (best-effort honest warning — the delete already succeeded), lot CRUD (blanks ⇒ NULL; amount > 0 enforced; the receipt-movement contract).
- `frontend/src/pages/admin/InventoryPage.tsx` + `components/inventory/LotReceiptSection.tsx` + `StockViewSection.tsx` — the admin-gated surface (RequireAuth requireAdmin; route-only `/admin/inventory`, the /admin/masters precedent — admin nav lives in AppShell, outside the lane); honest empty state verbatim "ยังไม่มีล็อตสต๊อก — รอการรับเข้าจริง"; MFG blank = "ไม่ทราบ" never coerced; FEFO preview order mirrors the RPC; พ.ศ. dates via `thaiDate`; `fefoOrder` lives in the lib (pure, testable).
- `frontend/src/App.tsx` — additive lazy import + `/admin/inventory` route ONLY (17 added lines).
- ADDITIVE wiring: `DailyFormPage.tsx` (create branch: `chlorine_used > 0` → `deductForReading` → non-blocking honest toast before navigate; edits never re-deduct), `WaterSupplyPage.tsx` (submit → `createWaterSupplyDailyWithDeduction` + badge toast; remove → reversal-note toast), `supabase-queries.ts` (`deleteReading` → best-effort reversal warning), `water-supply.ts` (delete → best-effort reversal warning; new `createWaterSupplyDailyWithDeduction`; plain `createWaterSupplyDaily` byte-identical). `form-parity.ts` NOT touched (the additive badge state did not require it — no deviation). The delivered `/chemical` page + `chemical.ts` are byte-untouched.
- Known boundary (recorded, never silent): CSV bulk import (`bulkInsertReadingRows`) does NOT auto-deduct — the lane wires the two FORM save paths only (WO §4-1); imported readings with chlorine_used stay undeducted until a future claim wires the import surface.

### 6.5 D4 battery (at the freeze head)

| Check | Result |
|---|---|
| vitest FULL | **44 files, 779 passed / 1 skipped (the designed skipIf)** |
| `tsc -b` | clean (exit 0) |
| oxlint | **0 errors / 19 warnings — byte-equal count to the main-checkout baseline (0 new)** |
| Playwright FULL chromium workers=1 (CI=1) | **297/297 passed (6.6m)** |
| guard suite | **344/344 (+450 subtests)** |
| runtime suite | **62/62 (+32 subtests)** |
| `check_release_version.py --tag v1.10.0` | **OK (v1.10.0; CHANGELOG entry v1.10.0), exit 0** — one iteration: the checker caught (a) the CHANGELOG/package mismatch ordering and (b) a hardcoded `v1.10.0` literal inside `inventory.ts` source_provenance text → reworded to `ENV-PARITY-P3-002` (the checker doing its job) |
| `git diff --check` | clean |
| 13-digit digit-run grep (new files) | only 14-digit migration-name substrings (`2026111800000…`/`20261115140000` in comments) — **0 PHI** |
| validate-registry | ok:true, **40 claims, BOOTSTRAP_CONTROL** — CURRENT-WORK.md diff EMPTY (transition+closeout only, per scope) |
| Diff vs main | **exactly the 16 claimed-scope files** (2563+/6−) |

### 6.6 Deviations ledger (all recorded; none silent)

1. **`*_fix` repair migration at D3** (live 42703 demanded it immediately) — the WO text anticipated the convention "if D5 demands"; same house rule applied earlier; reviewer to rule.
2. **D1-5 RLS posture AMENDED** as the WO anticipated: `inventory_lot` UPDATE = staff-or-admin (the SECURITY INVOKER RPC must deduct on staff saves — admin-only UPDATE would break every staff-initiated save's deduction), INSERT/DELETE admin, SELECT staff-or-admin; ledger + allocation = the movement posture (staff-or-admin ALL). Honesty floor held by the named CHECKs regardless of writer; the admin UI never hand-edits `amount_deducted`.
3. **The WO §3-2 "deduction index" realized as TWO tables** — `chemical.inventory_lot_deduction` ((source_table, source_id) UNIQUE ledger) + `chemical.inventory_lot_allocation` (slice join): `chemical.movement` gains NO columns (WO §3-3) and has no source columns, so per-source traceability + FEFO-inverse reversal provenance live in the join; both are additive new objects in the lane's data layer.
4. **Receipts write a matching 'in' movement** (item D3 above) — keeps the delivered balance authority truthful; the fixture caught the negative-balance failure mode.
5. **Local gitignored env stubs** (repo-root `.env` one-liner + `frontend/.env` copy) — house precedent, `git check-ignore` verified, never committed.
6. **RED-suite mechanics corrections during D3** — disclosed in 6.2; the RED counts are from the run at `16d5f1c`.

### 6.7 Next step

D5 fresh-GLM independent review at the exact frozen head (battery rerun where possible + own read-only live probes — movement rows ONLY inside ROLLBACK transactions; the canary/baselines table in 6.5 is the zero-net receipt). The implementer NEVER merges; the authorized reviewer owns approval + merge. Release v1.10.0 MINOR: annotated tag at the deployed merge SHA post-deploy per ENV-APP-VERSION-001 D6.
