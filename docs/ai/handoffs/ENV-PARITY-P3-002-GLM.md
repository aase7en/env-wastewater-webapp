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

## 7. D5 REPAIR RECEIPT (2026-11-18 — 2×P2 + 4×P3, one repair commit; STOP at REVIEW_REQUESTED)

D5 verdict: CHANGES_REQUIRED (review receipt: PR #226 issuecomment-6969433332 @ head `03e0f60`). Repairs only — no merge, no approval; the authorized reviewer owns re-review.

- **P2-1 revoke race** → NEW fix migration `supabase/migrations/20261118000004_parity_p3_002_revoke_lock.sql` (house `*_fix` convention — the applied 000002 is NOT edited): `CREATE OR REPLACE chemical.fn_revoke_chlorine_deduction` with (a) the ledger probe `SELECT … FOR UPDATE` — under READ COMMITTED a second concurrent revoke blocks on the row, then re-reads the winner's committed status and returns the honest `nothing-to-reverse` instead of restoring again; (b) `FOR UPDATE` on the allocation cursor in the SAME deterministic order for every revoker (`created_at DESC, id DESC`) — the deduct function's consistent-order lock discipline (000002:385-391), no cross-revoker deadlock. The concurrent double-revoke scenario (two tabs / stale-row delete; the water-supply path has no single-fire guard) is documented in the migration header. Applied via the ENV_DB gate (`scripts/apply_migration_api.py`, Drive-secrets token, never printed): **7/7 statements OK**. Function-body diff vs 000002 verified programmatically: ONLY the two lock lines + comments — no semantic drift.
- **Rollback-smoke evidence** (single-request BEGIN…ROLLBACK, zero net persistence **0 lots / 0 movements / 0 ledger rows** post-probe): the D5 over-restore shape — ONE lot (4.0 kg) carrying TWO deductions from different usage rows (U1 −1.5, U2 −1.0 → peak `amount_deducted` 2.5); revoke #1 → `reversed`, restored **exactly 1.5** (lot → 1.0); revoke #2 same row (concurrent-style sequential) → `nothing-to-reverse`, restored **0**, lot stays **1.0** — U2's 1.0 slice intact, **never over-restored**; only ONE reversal movement created; ledger `reversed`; allocation reversed 1/1. Bonus P3-3 live: deduct retry on U1 → **`reversed`** with the truthful reason (never `already-skipped`); retry on U2 → `already-deducted` (idempotency unchanged). 15 assertions GREEN.
- **P3-3 reversed mislabel** → same fix migration: `fn_deduct_chlorine_stock`'s idempotency probe returns the truthful `reversed` status (`already_recorded` true, no re-deduction) instead of mapping a reversed prior deduction to `already-skipped`. Verified live in the smoke above.
- **P2-2 dropped reversal warning** → `DailyFormPage.tsx` `scheduleDeferredDelete` now captures `deleteReading`'s returned `string | null` and toasts it via `entry.toast.warning` — mirroring the water-supply delete path (never thrown, never silent; the usage row is already gone, so a failed reversal must stay visible).
- **P3-4 success badges as warnings** → `lib/inventory.ts` `deductForReading`/`deductForWaterSupplyCheck` now return a structured badge `{ text, variant }` (`'deducted'` → success variant; every other outcome → warning; classification rides the result status, never string-matching); `DailyFormPage` create path, `water-supply.ts` `createWaterSupplyDailyWithDeduction` (`deductionNote` → `deductionBadge`), and `WaterSupplyPage` render the badge in its variant. Delete-path reversal notes stay warning-styled strings by contract (D5 ruled the water-supply path correct as-is).
- **P3-2 replay record (000002 NOT edited — do-not-edit honored)**: the committed in-file seed block of `20261118000002` is EARLY-BOUND — its INSERT references `chemical.master.source_provenance/note`, columns chemical.master does not have (WO §3-3 forbids them). Fresh-replay consequence: on any fresh `supabase db reset`/`push` the chain replays 000002 → statements 1-36 persist (tables/functions/views), statement [37/38] (the seed) fails live 42703 → `20261118000003_parity_p3_002_fix.sql` repairs the seed with the 3-column guarded INSERT (late-bound-safe) → the chain completes; `20261118000004` is function-only (late-bound CREATE OR REPLACE) and replays cleanly on top. The deviation itself stands recorded in the 000003 header.
- **P3-1 PR-body scope-count correction**: the PR body's "Changed files (16)" undercounts — the raw diff at head `03e0f60` is **18 files** (the body enumerated 17 entries and omitted `frontend/tests/e2e/env-parity-p3-002-inventory.spec.ts`); this repair adds `20261118000004_parity_p3_002_revoke_lock.sql` on top (19). SCOPE ITSELF CLEAN per D5: every file sits inside WO §10 mutable_scope (the e2e spec explicitly authorized; fix-migrations are the pre-authorized house convention; CURRENT-WORK.md and form-parity.ts untouched).

### 7.1 Battery at the repair head (own run, verbatim)

| Check | Result |
|---|---|
| Live SQL contract (`scripts/test_parity_p3_002_inventory.py`) | **21/21 passed** (7.95s) |
| Rollback-smoke (D5 P2-1, this repair) | **15 assertions GREEN + zero-persistence 0/0/0** |
| vitest FULL | **779 passed / 1 skipped** (44 files, baseline-equal) |
| `tsc -b` | clean (exit 0) |
| oxlint | exit 0 — **19 warnings, byte-equal to the D4 baseline (0 new)** |
| Playwright FULL chromium workers=1 (CI=1) | **297/297 passed (6.7m)** |
| guard suite | **344/344 (+450 subtests)** |
| runtime suite | **62/62 (+32 subtests)** |
| `check_release_version.py --tag v1.10.0` | **OK (v1.10.0; CHANGELOG entry v1.10.0), exit 0** |
| `git diff --check` | clean |
| 13-digit digit-run grep (changed/new files) | migration-name substrings only — **0 PHI** |

Repair commit: one commit — `fix(inventory): D5 P2 — revoke FOR UPDATE locking + reversal-warning surfacing (+P3 repairs)` — exact head SHA recorded on the PR. Next step: D5 re-review at the new head; implementer NEVER merges.

## D6 — CLOSEOUT RECEIPT (2026-11-18)

Docs-only closeout transition off main @ `fcea791d2363bf08d06266403cca96c002ce9ca9`; branch `docs/env-parity-p3-002-closeout`; STOP at REVIEW_REQUESTED — the closeout author never merges; the authorized reviewer owns approval + merge. Scope: exactly 3 files — `docs/ai/CURRENT-WORK.md` (registry closeout), this handoff (this D6), `docs/work-orders/ENV-PARITY-P3-002.md` (status → DELIVERED — CLOSED).

### Full chain

1. **Claim transition** — PR #225 merged `5dcd2c7bbf6c9c9637a90d07c454e0e12133beb1` (docs-only, off base `12947321b36a5b821c7759426beed01b052fb3e8`; fence `expected_policy_revision = 12947321…` / `expected_registry_hash = 0eefa5f6…`, registry block AT base — re-verified byte-exactly at closeout: validate-registry at `12947321` reproduces `0eefa5f690e5d2bfafc6f19e29d6efb7a31b5d600a4f22d8d0b7e6d250d4a955`; R2 APPROVED issuecomment-6967800796 — 0 P1 / 0 P2 / 3 non-blocking P3 carried INTO the implementation pins: P3-1 the reversal semantics (implemented: `chemical.fn_revoke_chlorine_deduction` FEFO-inverse over the allocation ledger), P3-2 the typed RPC result shape (pinned incl. `already-deducted`/`already-skipped`/`reversed`/`nothing-to-reverse`), P3-3 the config-seed anchor citation corrected to ref 6014 within the 6011-6041 range).
2. **Implementation** — PR #226 merged `fcea791d2363bf08d06266403cca96c002ce9ca9`, second parent EXACTLY the D5-R2-APPROVED repaired head `ba401a551d6086cb8bfab723e8d12a044016a8ce` (merge commit, no squash); merge stat = 19 files 3090+/8- = the claimed code files + WO + handoff incl. BOTH fix-migrations; CURRENT-WORK.md diff EMPTY at merge.
3. **D2 RED `16d5f1c`** — vitest `inventory.test.ts` failed-to-collect (TS2307, 0 collected); `tsc -b` exit 2 (1×TS2307); focused e2e 4F/0P truthful; live SQL contract 10F/1P/9S (the 1 pass = the disclosed 11-table baseline canary; the 9 skips = the canary holding — ZERO durable writes). D5 independently reproduced the frontend legs exactly at an isolated worktree @ `16d5f1c` and recorded the SQL legs as a D2-time record (its post-apply rerun 5F/6P/9S legitimately differs once the objects exist; two D2-script query bugs repaired in the head script, disclosed).
4. **D3 `8edaf82` + the house `*_fix` repair** — migration `20261118000002_parity_p3_002.sql` applied 37/38: statement [37/38] (the guarded config seed) failed LIVE 42703 (`chemical.master` predates the `source_provenance` convention; WO §3-3 forbids adding the column) → NEW migration `20261118000003_parity_p3_002_fix.sql` applied 2/2 (late-bound-safe 3-column guarded INSERT + provenance-in-source; the original in-file seed block stays for the record, unapplied). **D5 ruled the fix-migration deviation JUSTIFIED** ("Fix-migration deviation — verified justified"). Recorded design deviation: the WO §3-2 "deduction index" realized as `chemical.inventory_lot_deduction` ((source_table, source_id) UNIQUE) + `chemical.inventory_lot_allocation` (slice join) — `chemical.movement` gains NO columns. Contract battery 21/21 GREEN.
5. **D5 fresh review** — R1 CHANGES_REQUIRED issuecomment-6969433332 @ `03e0f602` (base `5dcd2c7`): 2×P2 — P2-1 the revoke race (the ledger probe + allocation cursor unlocked → a concurrent double-revoke could silently over-restore), P2-2 the wastewater delete path discarded the reversal warning (`DailyFormPage.tsx:235`) — plus 4×P3 (PR-body scope-count label; the early-bound seed replay consequence; `reversed` mislabeled `already-skipped`; success badges rendered as warnings). D5 also explicitly ruled the FEFO concurrent-allocation race SAFE (consistent-order FOR UPDATE + EPQ re-read) and the same-source double-save SAFE (fail-closed 23505).
6. **Repairs `ba401a5`** (single commit, 6 files) — NEW fix migration `20261118000004_parity_p3_002_revoke_lock.sql` (CREATE OR REPLACE `fn_revoke_chlorine_deduction` with FOR UPDATE on the ledger probe + the allocation cursor in the same deterministic order as the deduct FEFO discipline; body-delta vs 000002 verified programmatically = ONLY the lock lines + comments; applied 7/7 OK via the ENV_DB gate) + the rollback-smoke **15 assertions GREEN, never-over-restored** (one lot 4.0 kg carrying two deductions 1.5+1.0: revoke #1 restores exactly 1.5, revoke #2 → honest `nothing-to-reverse`, 0 restored; U2's slice intact; only ONE reversal movement; zero net persistence 0/0/0) + P2-2 warning captured and toasted in `scheduleDeferredDelete` + P3-3 truthful `reversed` probe + P3-4 structured badge variants. Migrations 000002/000003 byte-untouched (do-not-edit honored).
7. **D5 R2 APPROVED** — issuecomment-6970104113 @ `ba401a551d6086cb8bfab723e8d12a044016a8ce` (fresh reviewer): repair diff exactly 6 files verified; P2-1 locking verified programmatically; own battery at the repair head — SQL contract 21/21 live, vitest 779/1skip (44 files), Playwright FULL 297/297, guard 344/344, checker OK v1.10.0; CI 4/4 SUCCESS; "APPROVED — merge authorized"; merge trail in-thread.
8. **Release v1.10.0 MINOR (D1-8)** — Pages deploy run 44245300562 SUCCESS @ `fcea791`; live markers verified (the index bundle carries 1.10.0; `assets/InventoryPage-CKywxLJX.js` carries รับเข้าล็อต / ล็อต / หมดอายุ / FEFO / ไม่เดาค่า); annotated tag `v1.10.0` (tag object `276f1af9d7078fdf652954d8fa84043ac3565155`) dereferences the deployed merge SHA `fcea791`; `check_release_version.py --tag v1.10.0` OK exit 0.
9. **Post-merge verification at `fcea791`** — guard 344/344 OK; validate-registry `ok:true` 40 claims BOOTSTRAP_CONTROL with this claim still CLAIMED at merge time (the closeout lane closed it).

### Closeout ledger (carried items)

- **Replay-consequence note (D5 P3-2, stands as recorded):** `20261118000002`'s committed seed block is EARLY-BOUND — on any fresh `supabase db reset`/`push` the chain replays 000002 → statements 1-36 persist → statement [37/38] fails 42703 → `20261118000003_parity_p3_002_fix.sql` repairs the seed late-bound-safe → the chain completes; `20261118000004` is late-bound function-only and replays cleanly on top. The deviation stands recorded in the 000003 header + §7 above; 000002 is never edited.
- **Test-runner note:** `scripts/test_parity_p3_002_inventory.py` carries NO `__main__` block — it MUST be invoked as `python3 -m unittest scripts.test_parity_p3_002_inventory`; a bare `python3 scripts/…` invocation collects nothing and trivially exits 0 (false-green risk for future lanes).
- **Seed-verdict inheritance disclosure:** the `Inventory` SOURCE_UNAVAILABLE verdict is inherited from the P3.1 SAME-DAY 2026-11-18 enumeration (the tab ABSENT from the 12-tab pond enumeration + the P2.4 6-workbook enumeration); the re-fetch was honestly NOT repeated same-day; the gviz by-NAME landmine stands. Lot rows remain 0 — never fabricated.
- **B6 DELIVERED:** owner answer B6 (2026-11-15, "เปิด ถ้าทำได้จริง") is now operational — FEFO fail-closed idempotent auto-deduction + exact reversal wired into both chlorine save paths, the admin lot entry + stock view live at `/admin/inventory`, released v1.10.0.
- **CSV bulk-import boundary (recorded, never silent):** `bulkInsertReadingRows` does NOT auto-deduct — only the two FORM save paths are wired (WO §4-1); wiring the import surface belongs to a future claim.

### Fence

`expected_policy_revision = fcea791d2363bf08d06266403cca96c002ce9ca9`; `expected_registry_hash = 3bc6fa9661bb8030cdc015f643d79c3f6bfbd18c9275a63e525c5d911c703b75` (guard `validate-registry` registry_hash AT `fcea791`; method empirically cross-checked — the same method at `767a087` reproduces the recorded `6de13bfb…` and at `12947321` reproduces `0eefa5f6…` byte-exactly).

### Programmatic verification (re-run at the closeout head)

- guard 344/344 OK; validate-registry `ok:true` 40 claims, `ENV-PARITY-P3-002-C1` CLOSED; `git diff --check` clean.
- Claim-by-claim JSON diff vs `fcea791`: exactly 1 of 40 claims changed (this claim → CLOSED), other 39 byte-identical.
- `git diff --stat` vs `fcea791`: exactly 3 files (CURRENT-WORK.md + WO + handoff).
