# Work Order — ENV-PARITY-P2-001 (Claim ENV-PARITY-P2-001-C1, gen 1)

**Status: DELIVERED — implementation complete, STOP at REVIEW_REQUESTED (PR: implementation lane, branch `feat/env-parity-p2-001`). Implementer never merges; reviewer owns approval + merge.**
**Claim branch:** `docs/env-parity-p2-001-claim` · **Implementation base:** `d8974739815d9ba5a84e8ccad1cf6e6c8712ad5c` (PR #204 merge, origin/main tip, worktree fresh-verified)
**Governance pattern:** PR #183–#201 claim-transition series (docs-only claim → reviewed merge → implementation lane → D5 → closeout).

## 0. Lane identity

AppSheet parity program **Phase 2, lane P2.1** (plan §6 Phase 2 row P2.1, line 231):

> Schema สินทรัพย์: `safety.fire_extinguisher` (QR/วันบรรจุ/หมดอายุ/ขนาด/ประเภท) + `safety.emergency_light` (QR/ชั้น/ผู้ให้บริการ) — seed จาก Sheets

**This lane = schema + seed + tests ONLY.** NO inspection tables/flows (P2.2 `safety.extinguisher_inspection` / P2.3 `safety.emergency_light_check` are separate lanes). NO frontend (asset-management UI comes with P2.2/P2.3 or later). Implementer never merges.

## 1. Authorization basis

1. Owner standing Goal-mode instruction 2026-11-15/16 — "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14 producing `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 2 row P2.1 exactly.
3. The PR #203 Phase-1-closeout frontier option (a): "continue Phase 2 (ถังดับเพลิง/ไฟฉุกเฉิน/coliform — 6 lanes) per the owner standing instruction — each lane requires its own NEW reviewed claim transition". This claim IS that transition for P2.1.
4. The seed INSERTs are real-data writes to the OWNER'S asset registry, authorized by the plan row itself ("seed จาก Sheets") — every row count is receipted at D3.

## 2. Source data (READ-ONLY verification record — 2026-11-16)

Fetched via the public gviz CSV export (the daily-pond precedent); **nothing written to Drive**. Local copies for the implementing lane:

| file (under `/tmp/env-p2-001-sources/`) | source | rows | role |
|---|---|---|---|
| `sheet-fire-inspection.csv` | workbook **ข้อมูลตรวจไฟฉุกเฉิน** `1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw`, tab `Emergency light` (gid 0) | **48 data rows** | **Emergency light MASTER — seeded here** |
| `light-check-SHAPE-ONLY.csv` | same workbook, tab `Check` (gid 1164639452) | 332 data rows | **SHAPE ONLY — P2.3 scope, NOT seeded** |
| `sheet-fire-extinguisher.csv` | workbook **fire_extinguisher** `15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E`, tab `ตรวจสอบถัง` (gid 0) | 858 data rows | **SHAPE ONLY — P2.2 scope, NOT seeded** |
| `fe-numbers.csv`, `*-htmlview.html` | tab inventories | — | verification evidence |

### 2.1 DEVIATION (recorded at claim, reviewer adjudication item D1-1) — instruction file IDs unverifiable

The claim instruction's four Drive file IDs were probed read-only and are **dead**: ข้อมูลถังดับเพลิง `1FzZ9eSJEZw2nzfTsz2ScHD9Nugkyfq0aQ7X9FxRHRlt` → HTTP **404** (gviz + export + drive/view); ตรวจสอบถัง `1D-cYXYFuN5T9OofTLI-rvw0s9555UpKq` → **404**; Check `1zPIhhnjuwNcHCAaBz-jaUCwqrGCmOTTF0zHqjn0hXKU` → **404**; Emergency light `1b4lxFnYdjsAxkqyQzyBQXP1dOQ0sruHlgZD37o-qoIw` → **400** (invalid ID on gviz + export + drive/view).

Substituted with the **cross-verified folder extraction** (2026-11-13 session; parent folder `ActivatedSludge-29279640` `1HBhuEaBeQLz8jlj0VxPXvbM03It1bNre`, 49 items, two independent extraction passes, URL cross-checks): workbook IDs above return HTTP 200 and the control (daily-pond `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk`) confirms the fetch method. **All six public workbooks had their tab lists enumerated** (daily-pond 12 tabs; หมากัด 6; ตรวจไฟฉุกเฉิน 4; งานสวน 4; fire_extinguisher 5; tool_maintainance 1) — **no ข้อมูลถังดับเพลิง master tab exists in the publicly-shared folder.** The `fire_extinguisher` workbook's first tab is the ตรวจสอบถัง INSPECTION table (which carries per-inspection copies of type/packing_date/chem_exp), and its remaining tabs (เก็บรูป / Filter_Firer / Menu_Firer / Numbers) are not masters (`Numbers` = a 1..N filler column).

**Consequence (data honesty): the fire-extinguisher MASTER rows are seed NOTHING — the schema still ships per §3 below, and the whole-table reconciliation row records SOURCE_UNAVAILABLE. Nothing is fabricated, inferred, or reconstructed from the inspection table.** D1 of the implementing lane re-attempts the fetch (instruction IDs + the enumeration above) and re-pins this section only if the master sheet becomes fetchable — never silently.

## 3. Pinned ground truth — column reconciliation (AppSheet definition × real sheet)

Reference doc: `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` §3.12 (ข้อมูลถังดับเพลิง, ref 3044–3096) and §3.32 (Emergency light, ref 4926–4993) — READ-ONLY.

### 3.1 `safety.emergency_light` — full reconciliation (headers IDENTICAL in both sources)

| AppSheet §3.32 | Real sheet header | ENV column | Type | NULL | Notes |
|---|---|---|---|---|---|
| `_RowNumber` | (absent) | — | — | — | AppSheet system artifact, never migrated |
| `ERL_ID` (Key) | `ERL_ID` | `erl_id` | TEXT PK | NOT NULL | values `001`–`049` zero-padded strings — TEXT verbatim, **never numeric coercion** |
| `location` (Label) | `location` | `location` | TEXT | NOT NULL | all 48 rows non-blank; whitespace kept verbatim (row `032` has a trailing space — never silently trimmed) |
| `Pic` (Image, Label) | `Pic` | `pic_path` | TEXT | NULL | AppSheet Drive-relative paths (`Emergency light_Images/NNN.Pic.HHMMSS.jpg`); 8 blanks → NULL; stored as legacy refs, never fetched/rewritten |
| `QR` (Image, **App formula** ref 4952–4956) | `QR` | **NOT STORED** | — | — | app formula = `qrserver…&data=` & [ERL_ID]; verified all 48 sheet URLs equal the derived-from-id pattern → the QR payload IS `erl_id`; storing the URL would duplicate a derived value (D1-3); scan-flow rendering is P2.2/P2.3 scope |
| `Receive_date` (Date) | `Receive_date` | `receive_date` | DATE | NULL | **all 48 rows `5/6/2568` = พ.ศ. d/m/yyyy → DATE '2025-06-05'** (2568 − 543); parse rule D1-4 |
| `location_floor` (Number Min 1 Max 3, init `=1`) | `location_floor` | `location_floor` | SMALLINT | NULL | observed domain {1,2,3}: floor 1 ×28, 2 ×18, 3 ×2, 0 blanks; **no DB DEFAULT** — the AppSheet `=1` initial value is form-only, not data (D1-6) |
| `Providers` | `Providers` | `providers` | TEXT | NULL | 38 blanks → NULL; 10 populated (`MAX BRIGHT by C.E.E` ×3, `MAX` ×3, `SUNNY` ×3, `Sunny MODEL SN 206 DH 1` ×1) |
| — | — | `source_provenance` | TEXT NOT NULL DEFAULT | — | MIGRATION.md convention |
| — | — | `legacy_id` | TEXT (unique) | — | traceability = `erl_id` itself; column kept for the house convention so consumers join on one name |

### 3.2 `safety.fire_extinguisher` — shape pinned from §3.12 ALONE (master sheet unavailable)

| AppSheet §3.12 | ENV column | Type | NULL | Notes |
|---|---|---|---|---|
| `Row ID` (Key, `UNIQUEID("PackedUUID")`) | `legacy_row_id` | TEXT PK | NOT NULL | real value format NEVER observed — D1 re-verifies against real headers before any seed |
| `Location` (Label) | `location` | TEXT | NULL | |
| `ประเภทถังดับเพลิง` (Enum) | `extinguisher_type` | TEXT | NULL | AppSheet enum values pinned verbatim: `เคมีแห้ง (Dry Chemical Extinguishers)` / `สารเหลวระเหย BF2000` / `น้ำยาโฟม (Foam Extinguishers)` / `คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)` / `น้ำ (Best Drop)` — **TEXT + documented enum, NO hard CHECK constraint** (P1.001 VALIDATE-CONSTRAINT lesson: unknown ≠ rejected, D1-2); seed-time reconciliation flags any out-of-enum value |
| `รูปถ่ายถังดับเพลิง` (Image) | `photo_path` | TEXT | NULL | |
| `QR CODE` (Image, **App formula** ref 3077–3081) | **NOT STORED** | — | — | derived from Row ID (D1-3) |
| `วันที่บรรจุ` (Date) | `packed_date` | DATE | NULL | |
| `วันที่หมดอายุ` (Date) | `expiry_date` | DATE | NULL | P2.2's Update_ExpDate trigger writes this LATER — no trigger in this lane |
| `ขนาดบรรจุ` (Text) | `size_label` | TEXT | NULL | |
| — | `source_provenance`, `legacy_id` | as §3.1 | | |

Both tables live in a **NEW `safety` schema** (D1-5: `CREATE SCHEMA IF NOT EXISTS safety` + `GRANT USAGE ON SCHEMA safety TO authenticated`, mirroring the `water_supply` grant shape in `20261116000002:…`).

## 4. Seed plan (D3) — guarded, idempotent, honest

- ONE migration `supabase/migrations/20261116000004_parity_p2_001.sql` (schema + RLS + seeds; header carries rollback SQL — `DROP TABLE` ×2, `DROP SCHEMA safety` guarded by an exists-subquery so it only drops when empty).
  **FILENAME DEVIATION (recorded at implementation, D3):** this WO's claim-era draft pinned `20261117000000_parity_p2_001_asset_masters.sql`; the coordinator's implementation dispatch pins `20261116000004_parity_p2_001.sql` (true next sequential slot after `20261116000003`) and directs the exact name to be pinned here — the dispatch pin governs (P1.7 coordinator-pin precedent). All filename pointers in this WO now carry the delivered name.
- Emergency-light seed: INSERT … SELECT per row **guarded `WHERE NOT EXISTS`** on `erl_id` — re-running the file is a no-op (idempotency is a D2 test group). `source_provenance = 'AppSheet Sheets export 2026-11-16'`. Blank cells → NULL **never 0/''**; พ.ศ. dates parsed per D1-4; `legacy_id` = sheet `ERL_ID`.
- Fire-extinguisher seed: **ZERO rows** (§2.1). The migration carries a commented-out, shape-complete template + the reconciliation record so a later lane can activate it the moment the sheet is fetchable — with its own reviewed transition if that lane changes scope.
- RLS (house convention, `core.fn_is_staff_or_admin()` / `core.fn_is_admin()` — shapes per `20261116000001:81-91`): SELECT using staff-or-admin; INSERT **with check (admin)**; UPDATE both using+with check (admin); DELETE using (admin). Masters are admin-managed EDITABLE reference data — unlike the append-only `core.equipment_spec`, UPDATE must exist because P2.2's expiry trigger updates `expiry_date` (D1-7). No anonymous access; no REST façade in this lane (P2.2 decides façades).
- Apply via `scripts/apply_migration_api.py` with the **ENV_DB gate** (PROJECT_REF `gllqtbyofrcjzmbnfoeh`); preflight = objects absent + baseline row counts 0/0; post-verify = per-table row counts + policy shapes via `pg_policies` + anon probe denied. **Receipts carry the exact before/after counts of §5.**

## 5. Count reconciliation (MIGRATION.md convention — the before/after table)

| table / sheet | sheet data rows | parseable | seeded (this lane) | skipped (reason) |
|---|---|---|---|---|
| Emergency light (master) | **48** (IDs 001–049; **044 absent at source — a source gap, not a skip**) | 48 (all dates `5/6/2568`, floors ∈ {1,2,3}, no blank id/location/floor) | **48** | 0 |
| ข้อมูลถังดับเพลิง (master) | **SOURCE UNAVAILABLE** (0 fetchable — §2.1) | 0 | **0** | whole table: `SOURCE_UNAVAILABLE` reconciliation row |
| ตรวจสอบถัง (inspection) | 858 | — | **0 — SHAPE ONLY, P2.2 scope** | out of lane scope |
| Check (inspection) | 332 | — | **0 — SHAPE ONLY, P2.3 scope** | out of lane scope |

## 6. Parse hazards (documented at claim from the real bytes)

1. **พ.ศ. vs ค.ศ.** — sheet dates are `d/m/yyyy` in พ.ศ. (`5/6/2568`); rule: year > 2500 ⇒ พ.ศ. (− 543). Any unparseable/ambiguous date ⇒ that row seeds NOTHING + lands on the reconciliation list (none found in 48).
2. **Zero-padded text IDs** — `001` must stay TEXT; numeric coercion would corrupt the QR payload.
3. **Blank ≠ zero** — 38 blank `Providers`, 8 blank `Pic` ⇒ NULL; never `''`/`0`.
4. **Whitespace verbatim** — `032` location carries a trailing space; never silently normalized.
5. **Derived QR** — every sheet QR value equals the app-formula derivation of the id; not seeded as data.
6. **044 gap** — missing id at source; recorded, never back-filled.

## 7. D-phase plan

- **D2 RED** — `scripts/test_parity_p2_001_asset_masters.py` (transactional rollback-smoke, zero net persistence, canary-gated): groups SCHEMA (tables/columns/types/nullability/RLS shapes), SEED (the 48 rows exact — ids, 2025-06-05, floors, NULL pattern, verbatim whitespace + legacy pic paths), IDEMPOTENCY (seed re-run ⇒ 0 new rows), HONESTY (NULL-not-zero probes on providers/pic), COUNT-RECONCILIATION (48 seeded reported vs §5; extinguisher 0 + SOURCE_UNAVAILABLE). Truthful RED pre-apply; fixture batch never sent pre-apply.
- **D3** — the ONE migration; preflight → apply → post-verify per §4; receipts with row counts; WO D-phase log updated.
- **D4 battery** — vitest FULL, `tsc -b`, oxlint, Playwright FULL (workers=1), guard 344/344, runtime 62/62, `git diff --check`; release checker **NO bump** (v1.4.1 stays — DB-only lane, no user-visible surface; reasoning recorded, D1-8; P1.3 precedent).
- **D5** — fresh-GLM independent review at the exact frozen head with an independently executed battery rerun where possible. **Implementer never merges.**

## 8. D1 adjudication items (reviewer)

D1-1 the §2.1 source-ID deviation + fire-extinguisher seed-NOTHING ruling · D1-2 TEXT+documented-enum, no hard CHECK · D1-3 QR not stored as data · D1-4 พ.ศ. parse rule · D1-5 new `safety` schema · D1-6 no floor DEFAULT · D1-7 UPDATE/DELETE admin policies (editable masters, P2.2 trigger dependency) · D1-8 checker no-bump · D1-9 scope = exactly the 5 claimed files below.

## 9. Scope

**Mutable:** `supabase/migrations/20261116000004_parity_p2_001.sql` · `scripts/test_parity_p2_001_asset_masters.py` · `docs/work-orders/ENV-PARITY-P2-001.md` · `docs/ai/handoffs/ENV-PARITY-P2-001-GLM.md` · `docs/ai/CURRENT-WORK.md` (this transition + the later closeout only).

**Forbidden:** everything else — ALL existing supabase/ files (47 migrations + config + seed stay untouched; the ONE authorized supabase write is the new migration file); inspection tables/flows (P2.2/P2.3); frontend/** (pages, components, lib, e2e specs); CI (`.github/**`); reference/plan docs (`docs/ai/APPSHEET-PARITY-PLAN.md`, `docs/ai/digital-twin/**`, `docs/ai/PROJECT-BRIEF.md`, ROADMAP, DEFECT-MEMORY, ENV-ENGINEERING-LOOP, HANDOFF.md, AGENTS.md); `data/**`; `.env`; Drive writes (the CSVs are read-only snapshots under /tmp); `wastewater.*` / `water_supply.*` / `carbon.*` / `core.*` / `food.*` schemas (TESTED-NOT-EDITED at most); Phase 4 surfaces; CHANGELOG/package.json (no release — D1-8).

**STOP at REVIEW_REQUESTED — the implementing agent never merges its own PR.**

## 10. D-phase execution log (implementation lane, 2026-11-16)

- **D2 RED (commit `bd7cfe2`)** — `scripts/test_parity_p2_001_asset_masters.py`, live ENV_DB pre-apply: **17 failed / 3 passed** (the 3 passes = `test_no_anon_policies` + `test_no_defaults_on_floor_and_dates` [vacuous empty results on absent tables] + `test_preexisting_safety_table_untouched` [monthly_check genuinely intact]). Every failure's true reason = absent objects (`relation "safety.emergency_light" does not exist`). The idempotency test's canary gate held — seed batch never sent pre-apply (zero-write risk avoided). Zero durable writes.
- **D3 (commit `d2bf762` + docs commit)** — preflight receipts: both tables absent, target policies 0, `safety` schema pre-existing with only `monthly_check` (garbage/safety domain; USAGE already granted to postgres+authenticated — the migration's `CREATE SCHEMA IF NOT EXISTS` + `GRANT USAGE` are verified no-ops there), baseline 907/9/4 intact. Applied via `scripts/apply_migration_api.py`: **73 statements → 73 OK / 0 FAIL**. Post-verify: counts **48 / 0**; 8 policies with pinned shapes (SELECT staff-or-admin, INSERT/UPDATE/DELETE admin) + 0 anon policies + RLS enabled ×2; byte-exact spot-checks vs the saved CSV for rows `002`, `018`, `032` (incl. the 032 trailing space) — all match; anon REST probes fail-closed (PGRST205 outside `public`, PGRST106 profile refusal); monthly_check + baseline untouched. Contract suite GREEN post-apply: **20 passed** (after 3 test-harness scope fixes — queries had leaked into the pre-existing `monthly_check`; RED meaning unchanged, recorded in the handoff).
- **D4 battery at the docs head** — vitest FULL **630 passed / 1 designed skip (631)**; `tsc -b` exit 0; oxlint exit 0 (**18 pre-existing warnings**, baseline intact, 0 errors); Playwright FULL workers=1 **248 passed (5.7m)**; guard **344 passed + 450 subtests**; runtime **62 passed + 32 subtests**; release checker **OK (v1.4.1)** — **NO bump** per D1-8 (DB-only lane, no user-visible frontend surface; P1.3 precedent; reasoning recorded); `git diff --check` clean; diff vs main = exactly the claimed files.
- **D1-1 re-fetch obligation honored at D2**: the instruction's dead Drive IDs were not retried blindly; the substitution workbook + CSV snapshot (§2) were re-verified as the seed source (snapshot bytes parsed programmatically; the D2 expectations table is generated, not hand-typed).
