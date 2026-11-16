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
