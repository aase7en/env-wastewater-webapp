# Handoff — ENV-PARITY-P2-001-GLM (D0 — claim transition)

Claim `ENV-PARITY-P2-001-C1` (gen 1, CLAIMED) — AppSheet parity Phase 2 lane P2.1: safety asset masters (`safety.fire_extinguisher` + `safety.emergency_light`) — schema + seed from Sheets + tests. **This lane is DB-only: no frontend, no inspection tables (P2.2/P2.3), no CI. Implementer never merges.**

## 1. Authorization

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้").
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane = §6 Phase 2 row P2.1 (plan line 231) bound exactly.
3. PR #203 closeout frontier option (a) — Phase 2 proceeds lane-by-lane, each with its own NEW reviewed claim transition; this is the P2.1 one. Seed writes are authorized by the plan row itself ("seed จาก Sheets") — they are real-data writes to the owner's asset registry, receipted per row count at D3.

## 2. D0 scope discoveries (verified read-only 2026-11-16)

### 2.1 Source data — WHAT ACTUALLY EXISTS (deviation D1-1 recorded in the WO §2.1)

- The **claim instruction's four Drive file IDs are dead** (probed read-only): ข้อมูลถังดับเพลิง `1FzZ9eSJ…` → 404 (gviz/export/drive-view), ตรวจสอบถัง `1D-cYXYF…` → 404, Check `1zPIhhnj…` → 404, Emergency light `1b4lxFnY…` → 400 invalid ID. Do NOT retry them blindly; re-probe per WO §2.1 at D1.
- Substituted, **cross-verified folder extraction** (2026-11-13 session, parent `1HBhuEaBeQLz8jlj0VxPXvbM03It1bNre`, 49 items, two independent passes): the public gviz CSV export works (control = daily-pond `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk` → 200).
- **Emergency light MASTER — AVAILABLE**: workbook ข้อมูลตรวจไฟฉุกเฉิน `1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw`, tab `Emergency light` (gid 0) — **48 data rows**, IDs `001`–`049` with a single source gap at `044`. Fetched CSV: `/tmp/env-p2-001-sources/sheet-fire-inspection.csv`.
- **SHAPE-ONLY tabs (P2.2/P2.3 — never seeded here)**: `ตรวจสอบถัง` = workbook `fire_extinguisher` `15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E` gid 0, 858 rows (`/tmp/env-p2-001-sources/sheet-fire-extinguisher.csv`); `Check` = same light workbook gid 1164639452, 332 rows (`/tmp/env-p2-001-sources/light-check-SHAPE-ONLY.csv`).
- **ข้อมูลถังดับเพลิง MASTER — NOT PRESENT in the public folder.** All six public workbooks' tab lists were enumerated (daily-pond 12, หมากัด 6, ตรวจไฟฉุกเฉิน 4, งานสวน 4, fire_extinguisher 5, tool_maintainance 1): no master tab. The `fire_extinguisher` workbook's first tab is the tank INSPECTION table; its `Numbers` tab is a 1..N filler. **Per data honesty: seed NOTHING for extinguisher; schema ships from §3.12 alone; reconciliation row SOURCE_UNAVAILABLE. Never reconstruct master rows from the inspection table.**
- /tmp snapshots are ephemeral — if missing at implementation start, re-fetch via the exact gviz URLs in WO §2 (GET only; zero Drive writes).

### 2.2 Pinned schema facts (reference 12 §3.12 ref 3044–3096 / §3.32 ref 4926–4993, READ-ONLY)

- Emergency light: AppSheet columns ≡ sheet headers (`ERL_ID`,`location`,`Pic`,`QR`,`Receive_date`,`location_floor`,`Providers`). Full column-by-column reconciliation → WO §3.1. Key facts: `ERL_ID` = QR payload (`QR` is an App formula — all 48 URLs verified equal to the derivation, so QR is **not stored**); `location_floor` ∈ {1:28, 2:18, 3:2}; `Receive_date` = `5/6/2568` on **all** rows (พ.ศ. → `2025-06-05`); 38 blank Providers + 8 blank Pic ⇒ NULL; row `032` location has a trailing space — keep verbatim.
- Fire extinguisher: shape from §3.12 only (9 cols; enum values pinned verbatim incl. Thai+English spellings; `วันที่บรรจุ`/`วันที่หมดอายุ` have `TODAY()` initial values — form-only, never seed defaults).
- House RLS convention: SELECT `using (core.fn_is_staff_or_admin())`; admin-only write policies `with check (core.fn_is_admin())` (+ USING for UPDATE/DELETE) — shapes per `20261116000001_parity_p1_004_equipment_spec_admin.sql:81-91`. Difference vs equipment_spec: these masters get UPDATE+DELETE admin policies (editable assets; P2.2's expiry trigger needs UPDATE) — D1-7.
- Schema: NEW `safety` schema; `GRANT USAGE` to authenticated mirroring `20261116000002`'s water_supply grant.
- Migration filename pinned: `20261117000000_parity_p2_001_asset_masters.sql` (next free slot after `20261116000003`). Apply via `scripts/apply_migration_api.py` with the ENV_DB gate (PROJECT_REF `gllqtbyofrcjzmbnfoeh`); preflight objects-absent/rows-0; post-verify counts 48/0 + `pg_policies` shapes + anon denied; rollback SQL in the migration header (guarded `DROP SCHEMA` only-when-empty).

### 2.3 Testable-unit analysis → D2 RED plan

`scripts/test_parity_p2_001_asset_masters.py` — transactional rollback-smoke (zero net persistence; probe ids re-queried = 0; the seed fixture batch is canary-gated, never sent pre-apply), groups: SCHEMA / SEED / IDEMPOTENCY / HONESTY / COUNT-RECONCILIATION (WO §7). Truthful RED pre-apply = every schema probe fails on absent objects; disclosed as such. No vitest/e2e surface exists for this lane (no lib, no UI) — D4 runs the FULL existing battery to prove zero regression (vitest FULL, tsc, oxlint, Playwright FULL workers=1, guard 344, runtime 62, diff-check) + release checker no-bump v1.4.1 with reasoning (D1-8).

## 3. Bound scope (WO §9)

Mutable = 5 files: the ONE migration, the ONE test script, this handoff, the WO, `docs/ai/CURRENT-WORK.md` (this transition + closeout only). Everything else forbidden — especially inspection tables, frontend, CI, reference/plan docs, Drive writes.

## 4. Single next safe action

After this claim transition is independently reviewed (R2 floor: fresh GLM-5.3 MAX) and merged: activate the implementation worktree `_worktrees/env-parity-p2-001` on the merged base (freshness gate), execute D2 RED → D3 apply (row counts in receipts) → D4 battery → D5 fresh-GLM — and STOP at REVIEW_REQUESTED; the implementing agent never merges.

---

## 5. D2/D3/D4 receipts (implementation lane, 2026-11-16 — worktree `_worktrees/env-parity-p2-001`, branch `feat/env-parity-p2-001`)

### 5.1 D1 re-fetch obligation (WO §2.1)

The instruction's four dead Drive IDs were NOT retried blindly. The substitution source was re-verified: workbook `1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw` tab `Emergency light`, snapshot `/tmp/env-p2-001-sources/sheet-fire-inspection.csv` (48 data rows present, headers `ERL_ID,location,Pic,QR,Receive_date,location_floor,Providers`). The extinguisher master remains unfetchable — SOURCE_UNAVAILABLE stands; nothing reconstructed. Zero Drive writes.

### 5.2 Count reconciliation (WO §5 — the before/after table)

| table / sheet | sheet data rows | parseable | seeded (this lane) | skipped (reason) |
|---|---|---|---|---|
| Emergency light (master) | 48 (IDs 001–049, source gap 044) | 48 (all dates `5/6/2568` → `2025-06-05`; floors {1:28, 2:18, 3:2}; 38 NULL providers; 8 NULL pics) | **48** (live `count(*)` = 48 post-apply) | 0 |
| ข้อมูลถังดับเพลิง (master) | SOURCE UNAVAILABLE (0 fetchable) | 0 | **0** (live `count(*)` = 0) | whole table: `SOURCE_UNAVAILABLE` reconciliation + commented activation template in the migration (§6) |
| ตรวจสอบถัง (inspection) | 858 | — | **0 — SHAPE ONLY, P2.2 scope** | out of lane scope |
| Check (inspection) | 332 | — | **0 — SHAPE ONLY, P2.3 scope** | out of lane scope |

### 5.3 D2 RED (commit `bd7cfe2`) — TRUTHFUL pre-apply outcome

Command: `A_WIKI_DRIVE_PATH=<drive> uv run --with pytest python -m pytest scripts/test_parity_p2_001_asset_masters.py -q`
Result: **17 failed / 3 passed** (live ENV_DB, tables absent).
- All 17 failures carry the true reason: `relation "safety.emergency_light" does not exist` (or fire_extinguisher / policy probes).
- The 3 passes are honestly classified: `test_no_anon_policies` + `test_no_defaults_on_floor_and_dates` = vacuous empty-result probes on absent tables (they become meaningful post-apply); `test_preexisting_safety_table_untouched` = genuine pre+post pass (monthly_check).
- `test_seed_block_reapply_is_noop` failed at its CANARY (tables absent) → the seed batch was never sent pre-apply — zero-write risk avoided (P1.3 house method).
- Zero durable writes: every group is read-only; the only write-capable probe (idempotency re-send) is canary-gated + rollback-smoked.

### 5.4 D3 preflight (verified live immediately before apply)

- `safety.emergency_light` / `safety.fire_extinguisher` → `to_regclass` NULL (absent) ✓
- target policies = 0 ✓ · `safety` schema PRE-EXISTING (verified: it hosts the garbage/safety-domain `safety.monthly_check`, owner postgres, RLS on, 1 ALL-authenticated policy; schema ACL = postgres USAGE+CREATE, authenticated USAGE — identical shape to `water_supply`). The migration's `CREATE SCHEMA IF NOT EXISTS safety` + `GRANT USAGE … TO authenticated` are therefore verified NO-OPs on ENV_DB (and still create the schema on fresh environments, D1-5 as adjudicated). monthly_check untouched throughout (policy count 1 pre/post).
- Baseline counters: `wastewater.reading` 907 / `core.personnel` 9 / `core.equipment_spec` 4 ✓ (re-verified unchanged post-apply).

### 5.5 D3 apply + post-verify

- Apply: `uv run --with httpx python scripts/apply_migration_api.py supabase/migrations/20261116000004_parity_p2_001.sql` → **73 statements → 73 OK / 0 FAIL** (1 schema + 1 grant + 2 tables + 2 alter-RLS + 8 drop-policy + 8 create-policy + 2 table-grants + 48 guarded seeds + 1 notify).
- Post-verify (live): counts **48 / 0** ✓; `pg_policies` = exactly the 8 pinned shapes (`*_read` SELECT using `core.fn_is_staff_or_admin()`; `*_insert_admin` / `*_update_admin` / `*_delete_admin` on `core.fn_is_admin()`; UPDATE carries USING+WITH CHECK) ✓; 0 anon policies ✓; `relrowsecurity` true ×2 ✓.
- **Byte-exact spot-checks vs the saved CSV** (rows `002`, `018`, `032` — including the mandated 032-trailing-space + a NULL-provider row class): DB tuple (location, pic_path, receive_date, location_floor, providers) == CSV bytes for all 3; `repr(location[032]) = 'OPD หัตการ เบอร์7 '` (trailing space verbatim). Row `018` pins the NULL-pic/floor-3 class, `002` the populated-provider class.
- RLS anon fail-closed: `GET /rest/v1/emergency_light` (anon) → **404 PGRST205** (not in exposed `public`); `Accept-Profile: safety` → **406 PGRST106** (only public/graphql_public exposed) — plus 0 anon policies at the RLS layer. No REST façade in this lane (P2.2 decides).
- Seed VALUES were generated PROGRAMMATICALLY from the snapshot CSV by a throwaway generator (parse rules: blanks→NULL, พ.ศ. −543, verbatim whitespace, QR-derived-from-id asserted on all 48 rows and NOT stored; id gap 044 asserted) — never hand-typed; generator cited here per the dispatch and NOT committed (unclaimed file).

### 5.6 D2 GREEN (post-apply)

Same suite: **20 passed / 0 failed**. En route, 3 TEST-HARNESS scope fixes were needed (recorded in the D3 commit): `test_primary_keys` / `test_policy_shapes` / `test_no_defaults_on_floor_and_dates` had initially scoped queries to the whole `safety` schema and leaked into the pre-existing `monthly_check` (false "unexpected policy/PK" + false DEFAULT rows). Fixes = table-scoped filters only; **RED meaning unchanged** (they failed pre-apply on the true absent-object reason; the vacuous-pass classification of the two empty-probe tests is unchanged). No assertion weakened.

### 5.7 D4 battery (at the docs head)

| check | result |
|---|---|
| vitest FULL | **630 passed / 1 designed skip (631)** — after the gitignored `frontend/.env` bring-up (see deviations) |
| `tsc -b` | exit 0 |
| oxlint | exit 0 — **18 pre-existing warnings** (exact baseline), 0 errors |
| Playwright FULL workers=1 | **248 passed (5.7m)** |
| guard | **344 passed + 450 subtests** |
| runtime | **62 passed + 32 subtests** |
| release checker | `RELEASE VERSION CHECK: OK (v1.4.1)` — **NO BUMP** (D1-8: DB-only lane, zero user-visible frontend surface; P1.3 precedent) |
| `git diff --check` | clean |
| scope | diff vs main = exactly the claimed files (migration + test + WO + handoff; no CURRENT-WORK.md) |

### 5.8 Recorded deviations / honesty notes (reviewer)

1. **Migration filename** — delivered `20261116000004_parity_p2_001.sql` per the coordinator dispatch (true next slot; "pin exact name in WO"); the claim-era draft name `20261117000000_parity_p2_001_asset_masters.sql` is superseded and the WO §4/§9/§10 now carry the delivered name (P1.7 coordinator-pin precedent). Rollback section in the migration header notes the `DROP SCHEMA safety` guard reality: on ENV_DB the schema is NOT empty (`monthly_check` pre-dates this lane) so a plain drop-schema rollback fails by design — the two `DROP TABLE`s are the precise rollback of this lane's objects.
2. **Test-harness scope fixes** (§5.6) — 3 query-scope repairs, RED meaning unchanged, disclosed.
3. **Worktree bring-up (machine-local, gitignored, never committed/printed):** `.env` stub (`__LOAD_FROM_DRIVE__=true`, documented chain) + `frontend/.env` from the approved Drive resolver (SUPABASE_URL / SUPABASE_ANON_KEY); first vitest run failed 3 files on the missing `frontend/.env` (module-load contract), re-run green after bring-up; npm ci used `--legacy-peer-deps` (house CI-1 note, lock byte-untouched — verified clean status).
4. **pytest via `uv run --with pytest` / `--with httpx`** (P1.7 house command; pyproject/uv.lock untouched).
5. **Committer identity auto-configured** (house precedent, recorded like prior lanes).
6. D1-1 substitution workbook re-verified at lane start (§5.1); the extinguisher master's SOURCE_UNAVAILABLE ruling and the re-fetch obligation at P2.2 carry forward unchanged.

---

## 6. D6 CLOSEOUT RECEIPT (docs-only closeout lane, 2026-11-16 — branch `docs/env-parity-p2-001-closeout`)

Claim `ENV-PARITY-P2-001-C1` → **CLOSED** by this closeout transition. Scope = exactly 3 files: `docs/ai/CURRENT-WORK.md` (fence×2 + registry status CLOSED + `one_next_safe_action` receipt rewrite + frontier CLOSED record + next-frontier record), `docs/work-orders/ENV-PARITY-P2-001.md` (status → DELIVERED—CLOSED with PR refs + the D5 P3-2 rollback-wording reconciliation), this handoff (D6). **STOP at REVIEW_REQUESTED — the closeout author never merges; the authorized reviewer owns approval + merge.**

### 6.1 Full delivery chain (#204 → #205)

| stage | PR | merge SHA | parents | evidence |
|---|---|---|---|---|
| claim transition | #204 | `d8974739815d9ba5a84e8ccad1cf6e6c8712ad5c` | `71d3902682077078b9fa2ed6c94d8344d99fade7` + reviewed transition head `9a8763483dc04c8402d6427bcbdfdcf089b63c43` | docs-only; fence pinned at base `71d3902` (registry block AT base, guard method `scripts/env_coordination_guard.py:454-456`) |
| implementation | #205 | `1ae8695ca609e231c9820e3615cd2af8bc461e3c` | `d8974739815d9ba5a84e8ccad1cf6e6c8712ad5c` + `8bd9cafa64196e53556b1a0427832735e4288a73` | second parent EXACTLY the D5-APPROVED reviewed head `8bd9caf`; merge commit, no squash, expected-head discipline `--match-head-commit`; merge trail issuecomment-6920819912 |
| closeout | (this PR) | — | — | off main @ `1ae8695`; fence re-pinned: `expected_policy_revision = 1ae8695ca609e231c9820e3615cd2af8bc461e3c`, `expected_registry_hash = e2205c013dad31ec71166fb0fd51eabfe96d5ff450ac0d116a4518621b46ba2a` (guard `registry_hash` of the registry block AT `1ae8695`, method `scripts/env_coordination_guard.py:454-456`; same convention as #166/#169/#185/#188/#191/#194/#197/#200/#203) |

D5 fresh-GLM APPROVED at exact head `8bd9caf` (issuecomment-6920788302): zero P1/P2, **SEED-LINEAGE RULING GENUINE**, 2 informational P3s. Reviews never merged their own work: #204 and #205 were merged by the authorized merge executor with the in-thread trail.

### 6.2 Apply evidence (D3, re-verified)

- Apply: `scripts/apply_migration_api.py supabase/migrations/20261116000004_parity_p2_001.sql` → **73 statements → 73 OK / 0 FAIL** (1 schema no-op + 1 grant no-op + 2 tables + 2 alter-RLS + 8 drop-policy + 8 create-policy + 2 table-grants + 48 guarded seeds + 1 notify).
- Preflight: both tables absent; target policies 0; `safety` schema PRE-EXISTING (hosts only `monthly_check` — `CREATE SCHEMA IF NOT EXISTS` + `GRANT USAGE` verified no-ops); baseline 907/9/4 intact.
- Post-verify: counts **48 / 0**; 8 pinned policy shapes + 0 anon policies + RLS enabled ×2; byte-exact CSV spot-checks (`002`, `018`, `032` trailing space verbatim); anon fail-closed (404 PGRST205 / 406 PGRST106); contract suite **20 passed** post-apply.
- Exact-main verification at `1ae8695` (pre-closeout): guard suite **344 passed + 450 subtests**; `validate-registry` **ok:true, 33 claims, C1 still CLAIMED** (closeout transitions it); merge stat = **exactly 4 files** (813+/4−); **NO Pages deploy** — `deploy-frontend.yml` paths filter (`frontend/**` + its own workflow file) excludes docs/scripts/supabase; only the main `test` run executed post-merge.

### 6.3 Seed-lineage verification note (the D5 critical check)

D5's ruling: the `/tmp/env-p2-001-sources/sheet-fire-inspection.csv` snapshot **genuinely contains the EMERGENCY-LIGHT master, not fire-inspection rows** — header `ERL_ID,location,Pic,QR,Receive_date,location_floor,Providers`, all 48 Pic refs under `Emergency light_Images/*`, uniform พ.ศ. dates. The filename reflects the export source (P3-1 "landmine"); the true lineage (workbook ข้อมูลตรวจไฟฉุกเฉิน `1iqSxix…`, tab `Emergency light`) is disclosed in three committed places (migration header `20261116000004_parity_p2_001.sql:22-25`, WO §2, handoff §5.1). D5's own programmatic cross-check: **ALL 48 seed rows vs CSV bytes = 0 mismatches** (beyond the required ≥5), including the 032 trailing space at raw-byte level, the 38 NULL providers, the 8 NULL pics, and the 044 gap absent in both; QR verified as a pure derived formula of the id on all 48 rows and correctly NOT stored. The D2 seed expectations table was generated from the CSV bytes, not hand-typed. **Carry-forward: the P2.2 brief must carry the filename≠content note; the extinguisher master remains UNSEEDED (SOURCE_UNAVAILABLE) with the re-fetch obligation — owner sharing the sheet or an admin-UI entry path needed; never reconstructed from the inspection table.**

### 6.4 Honest deviations (consolidated)

1. **Migration filename** — delivered `20261116000004_parity_p2_001.sql` per the coordinator dispatch (true next slot), superseding the claim-era draft name; WO §4/§9/§10 carry the delivered name (P1.7 coordinator-pin precedent).
2. **3 test-harness scope fixes en route to GREEN** (§5.6) — table-scoped query filters only; RED meaning unchanged; D5 independently re-executed the RED commit (post-apply DB makes exact 17F/3P non-recreatable without destructive drops — disclosed; the actual 4F/16P run is exactly corroborative of the disclosed mode, and its 16 passes include all SEED tests proving live DB==CSV through the RED-commit test itself).
3. **Worktree bring-up** — gitignored `.env` stub + `frontend/.env` (Drive resolver), npm ci `--legacy-peer-deps`; never committed (diff contains no env files), never printed.
4. **pytest via `uv run --with pytest` / `--with httpx`**; committer identity auto-configured (house precedent).
5. **WO rollback wording** (D5 P3-2) — reconciled in THIS closeout: WO §4 now aligned to the delivered migration header reality (plain drop-schema fails-by-design on ENV_DB; the two DROP TABLEs are the precise rollback). No code/migration content changed by this closeout — docs only.
6. **CSV filename landmine** (D5 P3-1) — recorded as a REQUIRED note for the P2.2 brief (§6.3); the `/tmp` snapshots are ephemeral and their names are not authoritative — the committed citations are.

### 6.5 Scope-lock release

Scope lock released at generation 1; CLOSED confers no fresh mutation authority; the closeout itself changed exactly the 3 docs files above; all other work still requires a NEW reviewed claim transition (next lane: P2.2 extinguisher inspection QR flow — see the CURRENT-WORK.md next-frontier record).
