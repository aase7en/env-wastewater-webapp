# ENV-PARITY-P1-003-C1 — Handoff (claim checkpoint)

conventions note: this handoff follows the
`docs/ai/handoffs/ENV-PARITY-P1-001-GLM.md` conventions (claim checkpoint
sections, per-phase evidence, durable receipts). D-phase logs D1+ are
appended by the implementing lane; nothing before D0 is rewritten later.

## D0 — Claim transition authored (15 พฤศจิกายน 2569 / 2026-11-15)

- Claim `ENV-PARITY-P1-003-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges to
  `main`.
- Task `ENV-PARITY-P1-003` (new task row; task_id uniqueness checked against
  the registry via the guard — no OWNERSHIP_CONFLICT; 26 → 27 claims,
  JSON-diff exactly 1 new claim).
- Work Order: `docs/work-orders/ENV-PARITY-P1-003.md` (authorization basis,
  scope bound to plan §6 Phase 1 row P1.3, verbatim threshold ground truth
  from reference §3.3/§9, streak-semantic translation, alert-chain extension
  design, D-plan, mutable/forbidden scope, truth constraints, acceptance).
- Lane: Track-Z (GLM) only — ONE migration (threshold seeds + 2-day critical
  streak functions/view + alert-chain extension) + live-DB RED-first
  threshold test + battery; no Track F work exists (no visual surface).
- Holder (this coordinator session): `kilo-env-parity-p1-003-g1-primary`;
  worktree
  `/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-parity-p1-003`;
  transition branch `docs/env-parity-p1-003-claim`; implementation branch
  `feat/env-parity-p1-003` (created from the transition merge SHA, NOT
  before merge); base `912db2e528d290b675e36e5d9aabb9c2b18d2e28` (=
  origin/main tip at transition authoring; the closeout merge of PR #185 —
  clean, fetched, ff verified).
- Fence: `expected_policy_revision` pins the base SHA;
  `expected_registry_hash` pins the registry block AT the base, guard method
  `scripts/env_coordination_guard.py:454-456`
  (`sha256(exact canonical block text)`), verified via
  `python3 scripts/env_coordination_guard.py validate-registry --file
  docs/ai/CURRENT-WORK.md` at base →
  `{"claims": 26, "ok": true, "registry_hash":
  "6dce8bb6c311b897e7e950259e0b2f8a03b33adf0c6f1f1d2b97c43a3eda75f8"}`.
  Empirical cross-check: the same guard method at the prior base `d153983`
  reproduces the prior fence `d6b62e0959185b2ae06bba2925b0a3298ecc66bef68a8c6988186a606f94d6d8`
  byte-exactly — method validated. Prior fences re-pinned to the new base in
  this transition.

### Authorization basis (recorded, adversarial-check item)

1. Owner standing Goal-mode instruction 2026-11-15: "ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14: "วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล,
   การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด"
   → `docs/ai/APPSHEET-PARITY-PLAN.md` (base commit `1b00390`).
3. Plan §6 Phase 1 lane table row P1.3 (quoted verbatim in the WO header) +
   plan §4.1 Critical-* computation row + plan §5.1 SV30-seed note.
4. Verbatim AppSheet definition reference §3.3 (`ข้อมูลคุณภาพน้ำ` Critical-*
   formulas) + §9 (bots `Do1_Notice`/`Do3_Notice`/`SV30_Notice`/
   `chlorine_Notice`/`TDS_Notice`/`pH_Notice`/`water_overload`) — values and
   directions quoted in WO §2.1 and BIND; no invented constants.

### Out-of-order execution note (BY DESIGN, recorded in the claim)

Phase 1 runs P1.3 before P1.2/P1.5. P1.2 (×34/×12) and P1.5 (×3.7, ÷10) are
gated on owner confirmation of domain constants per plan §8 risk row 3
("ยืนยันกับเจ้าของ/เอกสารหน้างานก่อน merge"); P1.3 has no such gate because
every constant it seeds comes verbatim from the owner's own production
AppSheet formulas/bots (owner-confirmed by construction). This claim does
NOT authorize P1.2/P1.5 work; lane numbering is not execution order.

### Pinned threshold values (summary — full table with mappings in WO §2.1)

`do1` max 1 · `do2` max 1 · `do3` max 1.5 · `free_chlorine` min 0.5 / max 1 ·
`ph` min 5 / max 9 · `tds2` min 1000 · `sv30` min 150 / max 450 ·
`wastewater_in` min 70. Sources: `Critical-DO-1/2/3` (<1/<1/<1.5),
`Critical-FreeChlorine-Lowerlow/HigherHigh` (<0.5/>1), `TDS2 critical`
(>1000), `pH Critical` (>9/<5), `SV30_Notice` bot (>450/<150),
`water_overload` bot (>70) — all verbatim reference §3.3/§9.

### Scope discoveries recorded at claim time (bind the lane shape)

1. **pH bound discrepancy — verbatim wins:** plan §4.1's summary says
   "pH>9/<4" but the verbatim `pH Critical` formula is `< 5`; seed pins
   min 5. Plan-summary typo documented, not silently copied.
2. **Disabled bots NOT seeded:** `(disabled) Line AS record 3` (TDS-2 >900,
   Temp >40, pH >8.3, SV30 >650, inflow >62) is disabled in AppSheet —
   excluded; `TDS_Notice`/`pH_Notice` bots have EMPTY event conditions
   (broken in AppSheet, plan §5.1) — their substance is the Critical columns
   (seeded via `tds2`/`ph`). The >2.5 free-chlorine FORMAT rule (§10) is a
   UI display rule owned by P1.4 — not a threshold row.
3. **Existing param-code convention:** `do1/do2/do3/free_chlorine/ph` are
   already consumed by `v_reading_detail` flag columns (live snapshot);
   `tds2` follows the positional AppSheet naming (TDS-2 = ในน้ำก่อนทิ้ง) to
   avoid ambiguity with `tds_aeration`.
4. **Existing hardcoded alert branches remain:** `fn_check_thresholds`
   (do-avg <2.0, Cl <0.5, pH 6.5–8.5 — the original FastAPI-port values,
   no AppSheet counterpart) stays byte-identical in behavior; this lane
   EXTENDS the check surface, never replaces (removal = separate owner
   decision).
5. **Streak semantics translation:** verbatim AppSheet = per-date EXISTS at
   D−2/D−1/D with exact calendar-date equality (COUNT>0 per date); a naive
   LAG-over-recorded-rows diverges across calendar gaps — the faithful
   EXISTS form is required; missing/NULL day ⇒ no violation ⇒ streak FALSE
   (missing readings = no streak, never fabricated). `sv30` and
   `wastewater_in` are immediate single-day conditions (their bots fire on
   the reading itself).
6. **Alert delivery is out of scope:** `notify-threshold` Edge Function and
   any Telegram/LINE channel stay untouched (Phase 4 owner decision, plan
   §5.3 item 2); this lane populates the existing pending queue only.
   Existing frontend surfaces (`NotificationBell.tsx`) already read pending
   alerts and stay untouched — new rows surface through existing UI with
   zero frontend edits; `frontend/**` remains forbidden.
7. **Reference-data distinction:** `wastewater.threshold` rows are system
   reference/config data (always in effect in AppSheet; authorized by the
   plan row) — seeding them is NOT a user-data write; no
   `wastewater.reading` row is touched by the migration. Test fixtures, when
   needed for streak semantics, live ONLY inside a single transaction
   ending in ROLLBACK with pre/post row-count proof.
8. **Live-DB caveat (same as P1.001):** the MCP session reachable during
   claim authoring may not be ENV_DB — live verification is an explicit D3
   PREFLIGHT step via the `scripts/apply_migration_api.py` /
   `scripts/introspect_schema_api.py` Management-API path (ENV_DB gate
   artifact + `SELECT MIN(reading_date)` history-bound `effective_from`
   evidence + live `wastewater.threshold` state check). If a discovery above
   does not hold live (e.g. non-empty threshold table, different column
   names), STOP and report — do not improvise.

### Deviations recorded at claim time

- None material. Migration filename pinned as
  `supabase/migrations/20261116000000_parity_p1_003.sql` per the dispatch
  instruction's `<ts>_parity_p1_003.sql` template (house timestamp naming;
  sorts after the delivered `20261115120000_parity_p1_001.sql`).
- Claim-count: instruction's expectation "registry should be 26 claims with
  ENV-PARITY-P1-001-C1 CLOSED" verified true via validate-registry ground
  truth at base (26 claims, ok).

### Binding execution plan (pointer to WO §4)

D2 RED (`scripts/test_parity_p1_003_thresholds.py`: missing seeds/objects +
streak fixtures designed, truthful failure pre-apply) → D3 ONE migration
(`20261116000000_parity_p1_003.sql`) + preflight receipts (ENV_DB gate,
live threshold state, history-bound effective_from, name collisions,
reference-data-only grep) + `scripts/apply_migration_api.py` apply + rollback
SQL documented → D4 battery (FULL vitest, `tsc -b`, lint, Playwright FULL
workers=1, guard 344/344, runtime 62/62, threshold test GREEN, `git diff
--check`; **no version bump — DB logic + reference-data seeds, no
user-facing UI change, reasoning recorded in the D4 log**) → D5 fresh-GLM
independent review at the exact frozen head → **REVIEW_REQUESTED**;
implementer never merges.

### Truth constraints (binding pointer to WO §7)

unknown ≠ 0 (NULL never violates; missing day = no streak; `wastewater_in`
sparse → no fire, never estimated); latest ≠ live; threshold values verbatim
from reference §3.3/§9 (no invented constants; disabled bots stay disabled);
threshold rows = system reference data ≠ user data; พ.ศ. user-facing dates;
no PHI; no durable writes in tests (transaction-scoped fixtures +
ROLLBACK + count proof); no assertion weakening.

## D1 — (empty; no delegated consults were required for this claim — scope,
values, and semantics are fully pinned by the plan row + verbatim reference
§3.3/§9. Any later genuine fork gets its own consult receipt here.)

## D2 — RED (implemented by the delivering lane, 15 พฤศจิกายน 2569 / 2026-11-15)

Authored `scripts/test_parity_p1_003_thresholds.py` (new) — Python unittest in
the house `scripts/test_*.py` style, run through the same Management-API
access path as `scripts/apply_migration_api.py` (`scripts/_env.py`;
`SUPABASE_ACCESS_TOKEN` from Drive secrets, never printed). Assertion groups
(WO §3.2): (1) the 8 seeded `wastewater.threshold` rows with EXACTLY the
pinned (min_value, max_value, effective_from, note); (2) the parity objects
`fn_critical_flags`/`fn_check_thresholds_parity`/`fn_persist_parity_alerts`/
`v_reading_critical_flags`/`trg_persist_parity_alerts` exist; (3) streak
semantics + alert firing via transaction-scoped fixtures with a final
ROLLBACK and pre/post durable-count proof; (4) legacy `fn_check_thresholds`
byte-identical regression guard (whitespace-normalized `pg_get_functiondef`
pinned to the live pre-apply capture of the P12 definition).

Fixture method (recorded, with feasibility evidence): the Management-API
query endpoint executes a multi-statement batch on ONE session and — per a
dedicated smoke run BEFORE authoring — honors a trailing `ROLLBACK` against
its own transaction wrapper (fixture row + 2 legacy alert rows visible
inside the batch; durable state identical before/after). The dispatch's
preferred rolled-back-transaction method is therefore REAL, not the
migration-file-content fallback.

Truthful RED (run against the LIVE DB BEFORE the migration was applied —
migration file not yet authored):

```
SUBFAILED(routine='fn_critical_flags') … missing routine wastewater.fn_critical_flags
SUBFAILED(routine='fn_check_thresholds_parity') … missing routine wastewater.fn_check_thresholds_parity
SUBFAILED(routine='fn_persist_parity_alerts') … missing routine wastewater.fn_persist_parity_alerts
FAILED test_parity_objects_exist           (routines + view/trigger missing)
FAILED test_seed_rows_exact                (0 != 8 : expected exactly 8 seed rows, found 0)
FAILED test_streak_semantics_and_alert_firing_rollback_fixture
  → AssertionError: parity functions missing (migration unapplied):
    fn_critical_flags / fn_check_thresholds_parity — fixture batch NOT sent
    (parse-time failure and zero-write risk avoided); streak assertions
    cannot be evaluated yet
6 failed, 1 passed, 1 warning in 1.27s   (the 1 pass = legacy
  fn_check_thresholds byte-identical guard — a guard, not a RED target)
```

Post-RED durable state re-verified: `wastewater.reading` = 907,
`wastewater.threshold_alert` = 0, `wastewater.threshold` = 0 — ZERO durable
writes (the fixture batch was never sent pre-apply; see the canary note).

Harness notes (recorded honestly — the RED output above is from the final
pre-apply revision; two earlier attempts hit test-harness bugs that were
fixed and re-run, RED meaning unchanged):

1. Attempt 1: the generated fixture INSERT placed the note marker OUTSIDE
   the VALUES tuple (`(…), 'P1.003-FIXTURE'`) — syntax error, not a DB or
   assertion fact; fixed (note moved inside the tuple).
2. Attempt 2: the flags probes were wrapped in a `to_regprocedure` CASE
   guard to keep the batch parse-safe pre-apply — but PostgreSQL resolves
   function CALLS at PARSE time, so the batch still failed 42883
   (`fn_critical_flags(uuid) does not exist`) before CASE laziness could
   apply. Redesigned to a parse-safe canary request
   (`to_regprocedure` presence probe, NULL for missing) that GATES the
   fixture batch: pre-apply the gate fails truthfully and the batch is
   never sent; post-apply the batch runs with full streak assertions.
3. Post-apply GREEN run surfaced a third formatting bug: the seed value
   comparison string-normalized `Decimal.normalize()` output, which yields
   exponent forms (`'1.5E+2'`, `'1E+3'`) for `150.000`/`1000.000` — the
   LIVE values were exactly the pinned ones. Fixed to numeric equality
   (`Decimal(got) == Decimal(expected)`; `150.000 == 150` exactly). This
   is a comparison-FORMAT fix, not an assertion weakening (see D3 note).

## D3 — migration + preflight + apply + post-verify (15 พฤศจิกายน 2569 / 2026-11-15)

### D3 preflight receipts (recorded before apply; all read-only)

1. **ENV_DB gate (§3.3.1 pattern)** — `PROJECT_REF =
   "gllqtbyofrcjzmbnfoeh"` hardcoded at `scripts/apply_migration_api.py:29`;
   API endpoint
   `https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query`.
   ENV_DB-identifying artifact: `wastewater.reading` = **907 rows**,
   `core.personnel` = **9 rows** — matching
   `reports/schema-snapshot-live.md` (2026-11-13). The D0 live-DB caveat
   does not apply to this Management-API path.
2. **Token resolution deviation (same as P1.001)**: the `scripts/_env.py`
   chain is broken on this machine (no repo-local `.env` stub; sibling
   A-Wiki under `_from_Desktop/A-Wiki`, outside the candidate list).
   Resolution used tier 1 of the same approved resolver —
   `SUPABASE_ACCESS_TOKEN` injected into the process environment from the
   Drive secrets file (`<drive>/secrets/env-wastewater-webapp.env`, Drive
   root resolved via the A-Wiki `drive` link). Never printed, logged, or
   persisted.
3. **Live threshold state**: `SELECT * FROM wastewater.threshold` → **0
   rows** (matches the snapshot; no seed conflict; double-seed guard and
   pinned `effective_from` needed no re-check).
4. **History-bound effective_from evidence**:
   `SELECT MIN(reading_date), MAX(reading_date) FROM wastewater.reading` →
   **`2024-01-09` .. `2026-07-04`** (907 rows). The WO's candidate literal
   `DATE '2026-01-01'` is NOT ≤ MIN — therefore the migration pins
   **`effective_from = DATE '2024-01-09'` = live MIN(reading_date)** so the
   seeded config covers all 907 historical rows (the `v_reading_detail`
   LATERAL picks `effective_from <= reading_date`). NEVER `CURRENT_DATE`.
5. **Name-collision check**: `information_schema.routines` (patterns
   `fn_critical%`, `fn_check_thresholds%`, `fn_persist%`) → only the
   existing `fn_check_thresholds` + `fn_persist_threshold_alerts`; views →
   only existing `v_reading_detail` + `v_pending_threshold_alerts`. No
   collision for any of the 5 new object names.
6. **Trigger inventory (pre)**: `trg_audit_log` + `trg_persist_threshold_alerts`
   on `wastewater.reading` — the parity trigger is added alongside, never
   replacing.
7. **Destructive-statement confirmation (§3.3 item 5, reference-data-only
   grep)**: `grep -inE
   "UPDATE|DELETE|TRUNCATE|DROP TABLE|ALTER TABLE|GRANT|POLICY"` → matches
   ONLY inside `--` comment lines (the documented rollback SQL + prose;
   `split_sql` strips line comments so they never execute); the
   executable-lines-only grep → **zero matches**. Local `split_sql`
   dry-run → exactly **19 statements** (8 guarded `INSERT … SELECT … WHERE
   NOT EXISTS` + 3 `CREATE OR REPLACE FUNCTION` + 4 `COMMENT ON` + 1
   `DROP VIEW IF EXISTS`/`CREATE VIEW` pair + 1 `DROP TRIGGER IF EXISTS`/
   `CREATE TRIGGER` pair) — the DROP-IF-EXISTS forms cover ONLY the new
   objects this file itself creates (house idempotency convention).

### D3 apply receipt (verbatim)

```
20261115130000_parity_p1_003.sql: 19 statement(s)
  [1/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [2/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [3/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [4/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [5/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [6/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [7/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [8/19] OK: INSERT INTO wastewater.threshold (parameter_code, min_value, max_value, effectiv
  [9/19] OK: CREATE OR REPLACE FUNCTION wastewater.fn_critical_flags(reading_uuid uuid)
  [10/19] OK: COMMENT ON FUNCTION wastewater.fn_critical_flags(uuid) IS
  [11/19] OK: DROP VIEW IF EXISTS wastewater.v_reading_critical_flags;
  [12/19] OK: CREATE VIEW wastewater.v_reading_critical_flags AS
  [13/19] OK: COMMENT ON VIEW wastewater.v_reading_critical_flags IS
  [14/19] OK: CREATE OR REPLACE FUNCTION wastewater.fn_check_thresholds_parity(reading_uuid uu
  [15/19] OK: COMMENT ON FUNCTION wastewater.fn_check_thresholds_parity(uuid) IS
  [16/19] OK: CREATE OR REPLACE FUNCTION wastewater.fn_persist_parity_alerts()
  [17/19] OK: DROP TRIGGER IF EXISTS trg_persist_parity_alerts ON wastewater.reading;
  [18/19] OK: CREATE TRIGGER trg_persist_parity_alerts
  [19/19] OK: COMMENT ON FUNCTION wastewater.fn_persist_parity_alerts() IS

Done: 19 OK, 0 FAIL
```

Applied via `uv run python scripts/apply_migration_api.py
supabase/migrations/20261115130000_parity_p1_003.sql` (2026-11-15).

### D3 post-verify

- All 8 seed rows present with EXACTLY the pinned values
  (`min_value, max_value, effective_from`): `do1` NULL/1, `do2` NULL/1,
  `do3` NULL/1.5, `free_chlorine` 0.5/1, `ph` 5/9, `tds2` 1000/NULL,
  `sv30` 150/450, `wastewater_in` 70/NULL — all `effective_from =
  2024-01-09`; notes verbatim (incl. the pH plan-typo annotation).
- View exists (`information_schema.views` = 1); live sample (latest
  reading 2026-07-04) computes all 11 flag columns; historical volume
  over the 907 rows: `critical_do1`×37, `critical_free_chlorine_low`×158,
  `immediate_sv30`×30, `immediate_wastewater_in`×81, `critical_tds2`×0
  (TDS-2 >1000 never recorded — honest zero).
- Trigger inventory (post): `trg_audit_log` +
  `trg_persist_threshold_alerts` (legacy, untouched) +
  `trg_persist_parity_alerts` (new).
- Existing surface untouched: `wastewater.reading` = 907,
  `wastewater.threshold_alert` = 0 (pre-existing alerting unchanged — the
  legacy trigger only fires on NEW inserts), legacy
  `fn_check_thresholds(uuid)` `pg_get_functiondef` byte-identical
  (whitespace-normalized) to the pre-apply capture (test group 4 GREEN).
- Threshold test GREEN after apply: **4 passed, 1 warning, 33 subtests
  passed** (8 seed rows + 3 routines + view + trigger + 16 flag probes +
  6 alert-field probes — including the rolled-back fixture streak cases:
  3 consecutive violating days → TRUE; gap day → FALSE; in-bounds →
  FALSE; NULL day → FALSE; immediate sv30/wastewater_in firing; legacy
  `free_chlorine` branch still firing; pre/post durable counts equal =
  zero durable writes).

### D3 test-pin correction (recorded — not an assertion weakening)

The first GREEN run failed 3 seed subtests because the test string-
normalized `Decimal.normalize()` output, which renders `150.000` as
`'1.5E+2'` and `1000.000` as `'1E+3'`. The LIVE values were exactly the
pinned ones. The comparison was corrected to numeric equality
(`Decimal(got) == Decimal(expected)`), which is strictly the same numeric
contract without the string-form artifact (`150.000 == 150` exactly).
No assertion was weakened to force RED→GREEN.

### Per-Critical-column translation notes (WO §2.2 — honest deref/context map)

Each verbatim AppSheet formula (reference §3.3) is an
`IF(AND(COUNT(SELECT(col, [col]<bound> AND [วันที่ บันทึก]=D−2))>0,
COUNT(…D−1)>0, COUNT(…D)>0), TRUE, FALSE)`. Translation per column
(all in `wastewater.fn_critical_flags` / `v_reading_critical_flags`):

| AppSheet column (§3.3) | ENV probe (per date D−2/D−1/D, `p.reading_date = r.reading_date − k`) | View column |
|---|---|---|
| `Critical-DO-1` — `[บ่อเติมอากาศ(DO-1)] < 1` | `p.do_aeration < 1` | `critical_do1` |
| `Critical-DO-2` — `[บ่อตกตะกอน(DO-2)] < 1` | `p.do_sedimentation < 1` | `critical_do2` |
| `Critical-DO-3` — `[น้ำก่อนทิ้ง(DO-3)] < 1.5` | `p.do_before_discharge < 1.5` | `critical_do3` |
| `Critical-FreeChlorine-Lowerlow` — `< 0.5` | `p.free_chlorine < 0.5` | `critical_free_chlorine_low` |
| `Critical-FreeChlorine-HigherHigh` — `> 1` | `p.free_chlorine > 1` | `critical_free_chlorine_high` |
| `TDS2 critical` — `[ในน้ำก่อนทิ้ง (TDS-2)] > 1000` | `p.tds_before_discharge > 1000` | `critical_tds2` |
| `pH Critical` — `> 9 OR < 5` (per date, OR inside each COUNT) | `(p.ph > 9 OR p.ph < 5)` | `critical_ph` |
| `SV30_Notice` bot (§9) — `OR(> 450, < 150)` | `r.sv30 > 450 OR r.sv30 < 150` (single-day, this row only) | `immediate_sv30` |
| `water_overload` bot (§9) — `> 70` | `r.wastewater_in > 70` (single-day) | `immediate_wastewater_in` |

Honest mapping notes:

- `[_THISROW].[วันที่ บันทึก]` → the probe row's
  `wastewater.reading.reading_date`; `[วันที่ บันทึก]` inside each
  `SELECT()` filter → every other row's `p.reading_date`. AppSheet date
  arithmetic (`[วันที่ บันทึก] - 2`) → PostgreSQL `date - integer`.
- AppSheet's `COUNT(SELECT(...)) > 0` over ONE table (no location
  dimension) → `EXISTS (SELECT 1 FROM wastewater.reading p …)` over all
  rows on the date (any `location_id`).
- `NULL` never violates: a NULL column makes the comparison non-TRUE so
  the row contributes no COUNT — SQL `WHERE` drops it identically. A
  MISSING day has no row → `EXISTS` false → streak FALSE.
- The plan §4.1 "SQL window/LAG" suggestion is NOT implemented verbatim —
  a naive LAG-over-recorded-rows would skip across calendar gaps; the
  faithful per-date EXISTS form is implemented (WO §2.2 divergence note,
  recorded in the migration header).
- `Chlorine_StreakCount` (gaps-and-islands) is P1.2 scope — not built here.
- Alert `field` naming: immediate conditions carry the seeded parameter
  codes (`sv30`, `wastewater_in`); streak alerts carry the view column
  names (`critical_do1`, `critical_do2`, `critical_do3`,
  `critical_free_chlorine_low`, `critical_free_chlorine_high`,
  `critical_tds2`, `critical_ph`). Messages are user-facing Thai with the
  actual value + verbatim bound, units per house labels (SV30 = mL/L,
  น้ำเข้า = m³/วัน), no dates (so no พ.ศ. concerns), no invented constants.

### Rollback SQL (also in the migration header)

```sql
DROP TRIGGER IF EXISTS trg_persist_parity_alerts ON wastewater.reading;
DROP FUNCTION IF EXISTS wastewater.fn_persist_parity_alerts();
DROP FUNCTION IF EXISTS wastewater.fn_check_thresholds_parity(uuid);
DROP VIEW IF EXISTS wastewater.v_reading_critical_flags;
DROP FUNCTION IF EXISTS wastewater.fn_critical_flags(uuid);
DELETE FROM wastewater.threshold WHERE (parameter_code, effective_from) IN (
  ('do1', DATE '2024-01-09'), ('do2', DATE '2024-01-09'),
  ('do3', DATE '2024-01-09'), ('free_chlorine', DATE '2024-01-09'),
  ('ph', DATE '2024-01-09'), ('tds2', DATE '2024-01-09'),
  ('sv30', DATE '2024-01-09'), ('wastewater_in', DATE '2024-01-09'));
```

`fn_check_thresholds(uuid)` requires NO restore — this migration never
modifies it (its prior P12 definition is pinned verbatim in the migration
header for byte-exact verification). Pre-existing `threshold_alert` rows
are NEVER deleted (history is honest).

## D4 — battery at the frozen implementation head (15 พฤศจิกายน 2569)

All commands run from the lane worktree
`/Volumes/MAC_WORK/DevWorkspace/Github/env-wastewater-webapp/_worktrees/env-parity-p1-003`
(branch `feat/env-parity-p1-003` @ base `a65125e`):

| Item | Result |
|---|---|
| vitest FULL (`npm run test`) | **32 files: 503 passed \| 1 skipped (504)** — the 1 skip is the designed `skipIf` from prior lanes |
| `tsc -b` | exit 0 (clean) |
| lint (`npm run lint` / eslint+oxlint chain) | exit 0; 18 warnings / 0 errors (all pre-existing — same 18 P1.001 recorded) |
| Playwright FULL (`npx playwright test --workers=1`) | **213 passed (7.6m)** |
| guard (`pytest scripts/test_env_coordination_guard.py`) | **344 passed + 450 subtests** |
| runtime (`pytest scripts/test_env_autonomy_runtime.py`) | **62 passed + 32 subtests** |
| threshold test (`pytest scripts/test_parity_p1_003_thresholds.py`) | **GREEN** — 4 passed, 33 subtests (see D3) |
| checker (`python3 scripts/check_release_version.py`) | `RELEASE VERSION CHECK: OK (v1.1.0; CHANGELOG entry v1.1.0)` |
| `git diff --check` | clean |

**No version bump — recorded reasoning**: this lane is DB logic +
reference-data seeds (threshold config rows, streak functions/view,
alert-queue rows). No new or changed user-facing UI surface exists — new
`threshold_alert` rows surface through the EXISTING notification bell /
operations surfaces with zero frontend edits, and the parity view is not
yet read by any frontend query. Per the CHANGELOG criteria (release
entries require a new or changed user-facing capability), no CHANGELOG
entry and no version bump; `package.json` and `CHANGELOG.md` untouched and
the checker confirms the current `v1.1.0` pairing intact.

### D4 environment-prep notes (machine-local, never committed)

- The fresh worktree lacked the gitignored `frontend/.env`; copied from
  the canonical checkout (publishable anon surface only) — same as P1.001
  D4 notes. `npm install` drift on `frontend/package-lock.json` (unclaimed
  file) was reverted; the PR diff stays inside the claimed file set.

### Changed files (diff vs `origin/main` @ a65125e — claimed set only)

1. `supabase/migrations/20261115130000_parity_p1_003.sql` (new)
2. `scripts/test_parity_p1_003_thresholds.py` (new)
3. `docs/work-orders/ENV-PARITY-P1-003.md` (status transition only)
4. `docs/ai/handoffs/ENV-PARITY-P1-003-GLM.md` (D2/D3/D4 receipts appended)

`docs/ai/CURRENT-WORK.md` untouched on this branch (registry transitions
belong to the closeout convention). No `frontend/**`, no CI, no
`supabase/functions/**`, no plan/reference edits, no RLS DDL, no grants.

### Deviations (all recorded; none material to scope)

1. **Migration filename**: this dispatch instruction's
   `20261115130000_parity_p1_003.sql` was used instead of the WO
   §3.1/§5 literal `20261116000000_parity_p1_003.sql` (the current explicit
   instruction wins over the claim-time WO spelling — same P1.001
   precedent; both satisfy house timestamp naming and sort after
   `20261115120000_parity_p1_001.sql`).
2. **`effective_from` pin**: the WO §3.1 candidate `DATE '2026-01-01'` is
   NOT ≤ live `MIN(reading_date)` (`2024-01-09`); per the WO's own binding
   rule the literal pinned is `DATE '2024-01-09'` = live MIN (receipt
   item D3-4).
3. **Alert extension shape**: implemented as a parallel check function +
   SECOND AFTER INSERT trigger (`fn_check_thresholds_parity` +
   `fn_persist_parity_alerts` + `trg_persist_parity_alerts`) rather than
   `UNION ALL` branches inside `fn_check_thresholds` — the WO explicitly
   allowed this shape ("a parallel check function called from … or a
   second trigger"); chosen so the legacy function stays byte-identical
   and its alerts are written exactly once (calling it again from the
   parity path would duplicate its rows).
4. **Test harness evolution**: three recorded harness fixes (see D2 notes
   + D3 pin correction) — none changed assertion meaning; the RED output
   recorded is truthful for the pre-apply DB state.
5. **Streak-flag alert coverage in the fixture**: the rolled-back fixture
   asserts parity alert rows for `sv30`, `wastewater_in`,
   `critical_do1`, `critical_ph`, `critical_free_chlorine_high` (5 of 9
   parity branches end-to-end); the remaining branches (`critical_do2`,
   `critical_do3`, `critical_tds2`, `critical_free_chlorine_low`) are
   verified at the flag level via `fn_critical_flags` probes (same code
   path the trigger consumes). Full 9-branch alert coverage follows from
   the shared function; noted for the reviewer.
