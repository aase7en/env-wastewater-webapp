# Work Order — ENV-PARITY-P1-003 (C1, gen 1)

**Lane:** AppSheet parity program Phase 1, lane P1.3 — Critical flags 2-day
streak (DO/Cl/TDS/pH) → seed `wastewater.threshold` (incl. SV30 >450/<150,
น้ำเข้า >70) + fire `threshold_alert`.
**Status:** IMPLEMENTATION DELIVERED — REVIEW_REQUESTED (implementing branch
`feat/env-parity-p1-003`; D2 RED + D3 preflight/apply/post-verify + D4
battery receipts in `docs/ai/handoffs/ENV-PARITY-P1-003-GLM.md`; the
implementer stops here — the authorized reviewer owns approval and merge).
**Routing:** Track-Z (GLM lane — SQL migration, view/function logic, tests,
battery). No Track F work exists in this lane (DB logic + seeds + tests only,
no visual surface).
**Plan reference:** `docs/ai/APPSHEET-PARITY-PLAN.md` §6 Phase 1 lane table
row P1.3 (owner-authorized 2026-11-14; plan merged as commit `1b00390`):
"Critical flags 2 วัน (DO/Cl/TDS/pH) → seed `wastewater.threshold` (รวม
SV30 >450/<150, น้ำเข้า >70) + ยิง `threshold_alert`" — tables
`wastewater.threshold(+_alert)`. Supporting spec rows: plan §4.1
(Critical-* computation row, DIVERGE → SQL window per-day EXISTS feeding
`wastewater.threshold` + `threshold_alert`) and plan §5.1 (แจ้งเตือนค่าผิดปกติ
bots — "เกณฑ์ SV30 >450/<150 ยังไม่อยู่ใน `wastewater.threshold` (seed ได้ทันที
Phase 1)").
**Definition reference (read-only):**
`docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` §3.3
(`ข้อมูลคุณภาพน้ำ` Critical-* columns) and §9 (bots) — threshold values and
directions are quoted verbatim below and BIND; no new constants are invented.

## 1. Authorization basis (record)

1. **Owner standing Goal-mode instruction 2026-11-15** — "ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้" (continue along the laid plan and roadmap).
2. **Owner parity authorization 2026-11-14** — "วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล,
   การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด"
   → produced `docs/ai/APPSHEET-PARITY-PLAN.md`.
3. **Plan §6 Phase 1 row P1.3** (verbatim, quoted above).
4. **Verbatim AppSheet ground truth** — reference §3.3 Critical-* formulas and
   §9 bot conditions (quoted in §2 below).

**Out-of-order note (BY DESIGN, recorded in the claim):** Phase 1 executes
P1.3 before P1.2/P1.5. Reason: P1.2 (×34/×12 meter factors) and P1.5 (×3.7,
÷10 water-supply constants) are gated on owner confirmation of domain
constants per plan §8 risk row 3 ("ยืนยันกับเจ้าของ/เอกสารหน้างานก่อน merge"),
while P1.3 has NO such gate — every P1.3 constant below is quoted verbatim
from the owner's own AppSheet formulas/bots that run in production today, so
the values are owner-confirmed by construction. Lane numbering is not
execution order; this does not authorize P1.2/P1.5 work.

The AUTHORIZATION BASIS is an explicit adversarial check item for the claim
transition review and the D5 implementation review — insufficient basis parks
the claim unmerged.

## 2. Pinned threshold ground truth (VERBATIM — these BIND)

### 2.1 Threshold seeds for `wastewater.threshold` (8 rows)

Schema (live, `reports/schema-snapshot-live.md`): `id uuid` default
`gen_random_uuid()`, `parameter_code text NOT NULL`, `min_value
numeric(10,3) NULL`, `max_value numeric(10,3) NULL`, `effective_from date
NOT NULL default CURRENT_DATE`, `note text NULL`; UNIQUE
`(parameter_code, effective_from)`. One-sided thresholds are encoded with the
unused side NULL — no schema change to this table in this lane.

| parameter_code | min_value | max_value | ENV column compared | AppSheet source (verbatim) |
|---|---|---|---|---|
| `do1` | NULL | `1` | `wastewater.reading.do_aeration` (บ่อเติมอากาศ DO-1) | `Critical-DO-1`: `[บ่อเติมอากาศ(DO-1)] < 1` |
| `do2` | NULL | `1` | `wastewater.reading.do_sedimentation` (บ่อตกตะกอน DO-2) | `Critical-DO-2`: `[บ่อตกตะกอน(DO-2)] < 1` |
| `do3` | NULL | `1.5` | `wastewater.reading.do_before_discharge` (น้ำก่อนทิ้ง DO-3) | `Critical-DO-3`: `[น้ำก่อนทิ้ง(DO-3)] < 1.5` |
| `free_chlorine` | `0.5` | `1` | `wastewater.reading.free_chlorine` (คลอรีนอิสระในน้ำก่อนทิ้ง Free Chlorine) | `Critical-FreeChlorine-Lowerlow`: `< 0.5`; `Critical-FreeChlorine-HigherHigh`: `> 1` (one row, both bounds; `chlorine_Notice` = OR of the two) |
| `ph` | `5` | `9` | `wastewater.reading.ph` (ความเป็นกรดและด่าง pH) | `pH Critical`: `> 9` OR `< 5` (one row, both bounds) |
| `tds2` | `1000` | NULL | `wastewater.reading.tds_before_discharge` (ในน้ำก่อนทิ้ง TDS-2) | `TDS2 critical`: `> 1000` |
| `sv30` | `150` | `450` | `wastewater.reading.sv30` (การตกตะกอน SV30) | `SV30_Notice` bot: `OR([การตกตะกอน(SV30)]>450,[การตกตะกอน(SV30)]<150)` |
| `wastewater_in` | `70` | NULL | `wastewater.reading.wastewater_in` (ปริมาณน้ำเสียที่เข้าระบบบำบัด) | `water_overload` bot: `[ปริมาณน้ำเสียที่เข้าระบบบำบัด] > 70` |

Param codes `do1`/`do2`/`do3`/`free_chlorine`/`ph` ALREADY exist as the
positional convention consumed by `wastewater.v_reading_detail` flag columns
(live view definition, snapshot lines 1144–1180: LATERAL joins on exactly
these five codes). `tds2`/`sv30`/`wastewater_in` are NEW codes following the
same positional/semantic convention (`tds2` = AppSheet TDS-2 positional name;
NOT bare `tds`, which would be ambiguous against `tds_aeration`).

**Discoveries recorded at claim time (bind the lane shape):**

1. **pH bound discrepancy — verbatim reference wins.** Plan §4.1's summary
   row writes "pH>9/<4", but the verbatim `pH Critical` formula (reference
   §3.3) is `< 5` on the low side. The seed pins `min_value = 5` per the
   verbatim formula; the plan summary is noted as a summary typo, not
   silently copied.
2. **Disabled/decayed bots are NOT seeded.** `(disabled) Line AS record 3`
   (TDS-2 >900 ×2 duplicated, Temperature >40, pH >8.3, SV30 >650, inflow
   >62) is disabled in AppSheet itself and is excluded. `TDS_Notice` /
   `pH_Notice` bots have EMPTY event conditions (broken/unconfigured in
   AppSheet — plan §5.1) and carry no thresholds of their own; their
   substance is the Critical columns (`TDS2 critical`, `pH Critical`), which
   ARE seeded via `tds2`/`ph`. The `free chlorine` FORMAT rule (>2.5 red
   highlight, reference §10) is a display-only UI rule owned by the P1.4 UI
   lane — not a threshold row, not seeded here.
3. **Existing hardcoded branches remain.** `wastewater.fn_check_thresholds`
   (migration `20260718000000_p12_frontend_views.sql`) currently hardcodes
   do-average < 2.0, free_chlorine < 0.5, pH outside 6.5–8.5 — these are the
   original FastAPI-port alerts with no AppSheet counterpart. This lane
   EXTENDS the function additively and must NOT remove or alter the existing
   branches' behavior (extend, don't replace; existing divergence documented,
   removal is a separate owner decision).
4. **`wastewater_in` honesty caveat.** The stored `wastewater_in` column is
   the compared surface in this lane. The AppSheet quantity is pump-meter
   derived; the derivation/ meter-chain view is P1.2 (×34/×12 constants —
   owner-gated). If the stored column is NULL/sparse for a reading, the
   immediate check simply does not fire (unknown ≠ zero — never coerced,
   never estimated here).
5. **Alert surfacing is out of scope.** Delivery channel (Telegram/LINE/etc.)
   is the Phase 4 owner decision (plan §5.3 item 2); `notify-threshold` Edge
   Function polling `v_pending_threshold_alerts` already exists and is NOT
   modified. Existing frontend surfaces (`NotificationBell.tsx`,
   `supabase-queries.ts`) already read pending alerts — new alert rows may
   appear there via existing surfaces; `frontend/**` stays untouched and
   forbidden.

### 2.2 2-day Critical streak semantics (verbatim translation)

AppSheet `Critical-*` virtual columns are computed per row with EXACT
calendar-date equality over a 3-date window (D = the row's
`[วันที่ บันทึก]`): `AND(COUNT(violations on D−2) > 0, COUNT(violations on
D−1) > 0, COUNT(violations on D) > 0)` → TRUE. ENV translation, per
parameter (directions from §2.1):

- `critical_do1` := EXISTS(a row with `do_aeration < 1` on date D−2) AND
  EXISTS(on D−1) AND EXISTS(on D), comparing `reading_date::date` equality.
- `critical_do2` (do_sedimentation < 1), `critical_do3`
  (do_before_discharge < 1.5), `critical_free_chlorine_low` (free_chlorine
  < 0.5), `critical_free_chlorine_high` (free_chlorine > 1), `critical_tds2`
  (tds_before_discharge > 1000), `critical_ph` (ph > 9 OR ph < 5) — same
  shape.
- NULL never violates (a NULL value on any of the three dates contributes no
  COUNT for that date). A MISSING reading on any of D−2/D−1/D means no
  violation exists for that date → the streak is FALSE. This is the honesty
  rule "unknown ≠ zero / missing readings = no streak" — never fabricated.
- **Documented translation note:** the plan §4.1 summary suggests "SQL
  window/LAG"; a naive LAG-over-recorded-rows chain is NOT equivalent to the
  verbatim semantics (it would skip across calendar gaps). The faithful
  translation is per-date EXISTS at fixed offsets D−2/D−1/D. Implement this
  faithfully and record the divergence note in the migration header; a
  separate chlorine continuous-streak (gaps-and-islands, `Chlorine_StreakCount`)
  is P1.2 scope, NOT this lane.
- Streak flags are computed (view/function), never stored as columns on
  `wastewater.reading` (plan DIVERGE disposition: no per-row materialized
  columns).
- `sv30` and `wastewater_in` are IMMEDIATE single-day conditions (the bots
  fire on the reading itself) — no streak applies to them.

### 2.3 Alert firing (extend the existing chain, don't replace)

Existing chain (live): `trg_persist_threshold_alerts` AFTER INSERT on
`wastewater.reading` → `wastewater.fn_persist_threshold_alerts()` → INSERTs
rows from `wastewater.fn_check_thresholds(NEW.id)` into
`wastewater.threshold_alert` (field, message) → `v_pending_threshold_alerts`
exposes `notified_at IS NULL` rows.

This lane:

1. Extends the check surface so a NEW reading also produces
   `wastewater.threshold_alert` rows for: the immediate `sv30` condition
   (>450 or <150), the immediate `wastewater_in` condition (>70), and each
   TRUE critical flag (§2.2) evaluated for the new row (its D−2/D−1/D
   window). Implementation shape: additive `UNION ALL` branches in
   `fn_check_thresholds` and/or a parallel check function called from
   `fn_persist_threshold_alerts` (or a second trigger) — implementer chooses
   within the bound "existing branches' behavior byte-identical; existing
   rows untouched; no RLS changes; no Edge Function changes".
2. `field` carries the parameter code (matches the `v_reading_detail` flag
   naming); `message` is user-facing Thai containing the actual value and the
   verbatim bound (e.g. "SV30 480 mL/L สูงกว่าเกณฑ์ 450 — ตรวจสอบการตกตะกอน");
   no invented constants, พ.ศ. if any date is ever included.
3. NO alert dispatcher, NO webhook, NO notification send in this lane
   (Phase 4 owner decision); the queue (`notified_at IS NULL`) is the lane's
   output surface.

## 3. Deliverables

### 3.1 Migration file — ONE file

`supabase/migrations/20261116000000_parity_p1_003.sql` (house timestamp
naming; sorts after `20261115120000_parity_p1_001.sql`). Precedent verified:
house convention keeps view/function definitions INSIDE migrations
(`fn_check_thresholds` in `20260718000000_p12_frontend_views.sql`,
`fn_persist_threshold_alerts` in `20260718000001_p17_threshold_alerts.sql`) —
no separate SQL-definition files exist or are created.

Requirements:

- **Seed INSERTs (reference data, NOT user data):** 8 rows via
  `INSERT INTO wastewater.threshold (...) SELECT <explicit literal values>
  ... WHERE NOT EXISTS (SELECT 1 FROM wastewater.threshold WHERE
  parameter_code = <code> AND effective_from = <pinned literal>)` — one
  guarded statement per parameter (double-seed guard). `effective_from` MUST
  be a FIXED literal date pinned in the file (candidate `DATE '2026-01-01'`),
  chosen at D2 from a read-only preflight so that
  `effective_from <= MIN(reading_date)` live (the seeded config must cover
  the 907 historical rows for parity flags); NEVER `CURRENT_DATE`
  (non-deterministic on re-run). **Data-honesty distinction recorded in the
  migration header:** threshold rows are system reference/config data
  authorized for seeding by the plan row (AppSheet thresholds were always in
  effect); no `wastewater.reading` row and no user-data row is inserted,
  updated, or deleted by this migration.
- **Critical-streak logic:** new STABLE SQL function(s) (e.g.
  `wastewater.fn_critical_flags(reading_uuid)` or a set-returning check) and
  a view (e.g. `wastewater.v_reading_critical_flags`) implementing §2.2 —
  exact names pinned in the migration header; semantics per §2.2 only, no
  extra heuristics.
- **Alert extension per §2.3** using the existing trigger chain.
- Header comment block: lane id, plan row, verbatim formula/bot quotes, the
  §2.1 discoveries (esp. pH <5 vs plan-summary <4; disabled bots excluded),
  the reference-data-vs-user-data distinction, rollback SQL (see §3.4), and
  the translation note of §2.2.
- No RLS DDL. No grant changes. No Edge Function changes. No frontend
  artifact.

### 3.2 D2 RED-first threshold test

`scripts/test_parity_p1_003_thresholds.py` (new) — Python unittest in the
house `scripts/test_*.py` style against ENV_DB via the same Management-API
access path as `scripts/apply_migration_api.py` (`scripts/_env.py`; token
from Drive secrets; NEVER printed). It must FAIL truthfully before the
migration is applied:

1. The 8 seeded `wastewater.threshold` rows exist with EXACTLY the pinned
   (min_value, max_value, effective_from) per §2.1 (NULL sides asserted as
   NULL).
2. The critical-streak function(s)/view exist with the pinned names.
3. Streak semantics with transaction-scoped fixtures: inside ONE transaction,
   INSERT clearly-marked fixture `wastewater.reading` rows (note marker
   `P1.003-FIXTURE`, legacy_id NULL) covering: 3 consecutive violating days
   → flag TRUE; a gap in D−2/D−1 → flag FALSE; value inside bounds → FALSE;
   NULL value day → FALSE (no fabrication); immediate sv30/wastewater_in
   firing on the new row (the existing trigger produces `threshold_alert`
   rows inside the same transaction) — then ROLLBACK. Fixtures are
   permitted ONLY inside this rolled-back transaction; the receipt records
   pre/post row counts of `wastewater.reading` and `wastewater.threshold_alert`
   proving zero durable writes.
4. The 3 legacy `fn_check_thresholds` branches still exist (regression guard
   against accidental replacement).

Run GREEN in D4 after apply.

### 3.3 Preflight before apply (receipts into the handoff)

1. **ENV_DB gate** — same as WO P1.001 §3.3: `PROJECT_REF gllqtbyofrcjzmbnfoeh`
   hardcoded in `scripts/apply_migration_api.py`; identifying artifact
   recorded (`wastewater.reading` = 907 rows etc.).
2. **Live threshold state:** `SELECT * FROM wastewater.threshold` — record
   rows (snapshot says 0; if any row exists live, the double-seed guard and
   the pinned `effective_from` must be re-checked against it; STOP and report
   on conflict — do not improvise).
3. **History-bound effective_from evidence:** read-only
   `SELECT MIN(reading_date) FROM wastewater.reading`; pin the migration's
   literal `effective_from` ≤ that date; record the receipt.
4. **Name-collision check:** no existing `fn_critical*`/pinned view name in
   `wastewater`; no `threshold` row conflict per item 2.
5. **Destructive-statement confirmation:** grep the migration for
   `UPDATE|DELETE|TRUNCATE|DROP TABLE|ALTER TABLE|GRANT|POLICY` — expected:
   none beyond the documented additive `CREATE OR REPLACE FUNCTION/VIEW` +
   guarded `INSERT ... SELECT`; anything else STOP and report. (Unlike P1.001,
   this migration legitimately contains INSERTs — the zero-DML grep does not
   apply; the reference-data-only grep replaces it.)

### 3.4 Apply + rollback

- Apply to ENV_DB (`gllqtbyofrcjzmbnfoeh`, ap-southeast-1) ONLY via
  `uv run python scripts/apply_migration_api.py
  supabase/migrations/20261116000000_parity_p1_003.sql`; record the
  statement-by-statement receipt verbatim in the handoff.
- Rollback SQL (documented in the migration header AND the handoff):
  `DELETE FROM wastewater.threshold WHERE (parameter_code, effective_from) IN
  (<the 8 exact pinned pairs>)`; `DROP VIEW IF EXISTS
  wastewater.<pinned view>`; `DROP FUNCTION IF EXISTS
  wastewater.<pinned function(s)>`; `CREATE OR REPLACE FUNCTION
  wastewater.fn_check_thresholds(uuid)` restored to its PRIOR definition —
  the exact prior definition text (from
  `20260718000000_p12_frontend_views.sql`) is pinned verbatim in the
  migration header comment for byte-exact restore. Pre-existing
  `threshold_alert` rows are NEVER deleted (history is honest).

### 3.5 WO/handoff/frontier docs

- This WO + `docs/ai/handoffs/ENV-PARITY-P1-003-GLM.md` (D0 authored at
  claim time; D-phase logs + receipts appended by the implementing lane).
- `docs/ai/CURRENT-WORK.md`: registry fence re-pin + new claim + frontier
  bullet (done in the claim transition itself; later status updates follow
  the closeout convention).

## 4. Execution routing (D-plan)

- **D2 RED**: author `scripts/test_parity_p1_003_thresholds.py`; run against
  the live DB BEFORE applying the migration; record the truthful failure
  output (missing seeds/objects) in the handoff.
- **D3**: author the migration; run the §3.3 preflight; record receipts;
  apply via `scripts/apply_migration_api.py`; re-run the threshold test
  GREEN (RED items + fixture semantics).
- **D4 battery** at the frozen implementation head (all must pass; record
  outputs): FULL vitest suite, `tsc -b`, lint, Playwright FULL (workers=1),
  guard `344/344`, runtime battery `62/62`, the new threshold test GREEN,
  `git diff --check` clean. **No version bump** — record the reasoning
  (DB logic + reference-data seeds; no new or changed user-facing UI
  surface — alert rows surface through the EXISTING notification
  bell/operations surfaces without frontend edits; CHANGELOG criteria
  require no release entry).
- **D5**: fresh-GLM independent review at the exact frozen head (independently
  re-executed battery where possible; cross-model reviewer Terra eligible per
  precedent). Implementer NEVER merges its own implementation PR.
- Stop at **REVIEW_REQUESTED**; the authorized reviewer owns approval and
  merge.

Worktree: `_worktrees/env-parity-p1-003` (implementation branch
`feat/env-parity-p1-003` created from the transition merge SHA; the claim
transition itself lives on `docs/env-parity-p1-003-claim`).

## 5. Mutable scope (claim-bound)

- `supabase/migrations/20261116000000_parity_p1_003.sql` (new)
- `scripts/test_parity_p1_003_thresholds.py` (new)
- `docs/work-orders/ENV-PARITY-P1-003.md` (this file)
- `docs/ai/handoffs/ENV-PARITY-P1-003-GLM.md` (new)
- `docs/ai/CURRENT-WORK.md` (registry + frontier status transitions only)

House-convention check done at claim time: view/function definitions live in
migrations (precedent `p12`/`p17`), so NO separate view/function definition
file is claimed or created.

## 6. Forbidden scope

Form pages (`/form`, `/flow`), `frontend/**`, Digital Twin pages/lib,
`supabase/functions/**`, CI (`.github/**`),
`docs/ai/APPSHEET-PARITY-PLAN.md`,
`docs/ai/digital-twin/**` (read-only references, incl. the reference §3/§9),
`docs/ai/HANDOFF.md`, `AGENTS.md`, `data/**`, `.env`,
`scripts/env_coordination_guard.py`, `scripts/env_autonomy_runtime.py`,
`wastewater.threshold_alert` schema/RLS (the table keeps its shape; only rows
via the existing trigger), `notify-threshold` Edge Function, and everything
else not listed in §5.

## 7. Truth constraints (binding)

- Unknown ≠ zero/normal/stopped: NULL readings never violate thresholds and
  never fabricate streaks; a missing day breaks the streak honestly; the
  `wastewater_in` derivation gap is P1.2's problem, never patched with an
  estimate here.
- `latest` ≠ `live`: no telemetry claims; alerts fire on recorded readings.
- Threshold values are quoted verbatim from reference §3.3/§9 — no invented
  constants; disabled bots are not resurrected; the plan-summary pH typo is
  documented, not copied.
- Threshold rows are system reference data (authorized seed), user rows are
  untouchable — the distinction is stated in the migration header.
- Simulation/estimation labeling: nothing in this lane estimates; if a future
  need appears, it parks as a follow-up, not a silent heuristic.
- Dates user-facing พ.ศ. (CE + 543) in any Thai text the lane produces.
- No PHI in test data or receipts; test fixtures are transaction-scoped with
  ROLLBACK and recorded count-proof — no durable writes in tests.
- No assertion weakening to force RED→GREEN.

## 8. Acceptance

1. Registry shows exactly one new claim (`ENV-PARITY-P1-003-C1`, gen 1) after
   the reviewed transition merge; JSON-diff vs base `912db2e` = 1 new claim
   (26 → 27), others byte-identical.
2. Migration applied with preflight + apply receipts in the handoff; threshold
   test RED (pre-apply) and GREEN (post-apply) outputs recorded verbatim;
   fixture rollback proof recorded (zero durable writes).
3. D4 battery green at the frozen head with the no-version-bump reasoning
   recorded.
4. D5 fresh-GLM review recorded; PR stopped at REVIEW_REQUESTED; implementer
   did not merge.
