# Work Order — ENV-PARITY-P1-001 (C1, gen 1)

**Lane:** AppSheet parity program Phase 1, lane P1.1 — schema parity for the
daily wastewater reading table + personnel enums.
**Status:** DELIVERED — CLOSED. Implementation merged via PR #184 as
`d15398343ecc6c749acc5ef801107287771d1ff7` (second parent = D5-APPROVED
reviewed head `9ac2b08ea7f46fb7bcc68ad48e4a469bc6c6c1d7`; D5 fresh-GLM
APPROVED issuecomment-6895358402; merge-executor trail issuecomment-6895379195;
claim transition PR #183 merged as `aeda44108882e0dda2f55134c62a610b2da5fbd3`
with R2 APPROVED issuecomment-6890337150; registry closed by the docs-only
closeout PR off main @ `d153983`). Full D2/D3/D4/D5/D6 receipts in
`docs/ai/handoffs/ENV-PARITY-P1-001-GLM.md`.
**Routing:** Track-Z (GLM lane — lib logic, SQL, schema, tests, CI-free battery).
No Track F work exists in this lane (schema-only, no visual surface).
**Plan reference:** `docs/ai/APPSHEET-PARITY-PLAN.md` §6 Phase 1 lane table row
P1.1 (owner-authorized 2026-11-14; plan merged as base commit `1b00390`).
**Definition reference (read-only):**
`docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` §3.2
(`ข้อมูลผู้ปฏิบัติงาน`) and §3.3 (`ข้อมูลคุณภาพน้ำ`) — enum value lists are
quoted verbatim below and BIND.

## 1. Authorization basis (record)

1. **Owner standing Goal-mode instruction 2026-11-15** — "ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้" (continue along the laid plan and roadmap).
2. **Owner parity authorization 2026-11-14** — "วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล,
   การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด"
   (make data-entry and computation parity with AppSheet until ENV can fully
   replace it) → produced `docs/ai/APPSHEET-PARITY-PLAN.md`.
3. **Plan §6 Phase 1 row P1.1** (verbatim): "Schema: เพิ่มคอลัมน์ ENV ฝั่งบ่อบำบัด
   (`อัตราส่วนผสม` enum, `คลอรีนน้ำที่ใช้จริง` derived, enum ล้างตะแกรง/สถานะเครื่องจักร
   map กับ boolean เดิม) + enum ตำแหน่ง/สถานะบุคลากร" — tables
   `wastewater.reading`, `core.personnel`.
4. **Verbatim AppSheet enum ground truth** — reference §3 (quoted in §2 below).

The AUTHORIZATION BASIS is an explicit adversarial check item for the claim
transition review and the D5 implementation review — insufficient basis parks
the claim unmerged.

## 2. Scope — bind exactly (schema additions ONLY; NO computations)

This lane delivers schema parity for P1.1 only. Computations, views, form
wiring, and validations are **separate later lanes** (P1.2 views/derivations,
P1.4 form parity, P1.7 parity fixtures) — starting them here is silent scope
expansion.

### 2.1 `wastewater.reading` — 10 NEW nullable enum columns (additive)

The AppSheet ล้างตะแกรง/สถานะเครื่องจักร enums map onto the EXISTING boolean
machine-state columns. Per the plan wording "map กับ boolean เดิม" the mapping
is **additive, non-destructive**: the existing booleans REMAIN the source of
truth; new parallel enum columns record the AppSheet vocabulary for parity
(consumed by later lanes). Mapping (existing boolean column → new enum column):

| Existing boolean (source of truth) | New enum column (NULLABLE, no default) | CHECK values | AppSheet source (reference §3.3, verbatim) |
|---|---|---|---|
| `screen_cleaned_coarse` | `screen_cleaned_coarse_status` | `'ล้าง'`, `'ไม่ล้าง'` | `ล้างตะแกรงบ่อสูบ` — Enum `ไม่ล้าง` / `ล้าง` (initial `ไม่ล้าง`) |
| `screen_cleaned_fine` | `screen_cleaned_fine_status` | `'ล้าง'`, `'ไม่ล้าง'` | `ล้างตะแกรงละเอียด` — Enum `ไม่ล้าง` / `ล้าง` (initial `ล้าง`) |
| `pump1_running` | `pump1_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องสูบน้ำเสีย 1` — Enum `ปกติ` / `เสีย` (initial `ปกติ`) |
| `pump2_running` | `pump2_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องสูบน้ำเสีย 2` — Enum `ปกติ` / `เสีย` |
| `aerator1_running` | `aerator1_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องเติมอากาศ 1` — Enum `ปกติ` / `เสีย` |
| `aerator2_running` | `aerator2_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องเติมอากาศ 2` — Enum `ปกติ` / `เสีย` |
| `sludge_pump1_running` | `sludge_pump1_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องสูบตะกอน 1` — Enum `ปกติ` / `เสีย` |
| `sludge_pump2_running` | `sludge_pump2_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องสูบตะกอน 2` — Enum `ปกติ` / `เสีย` |
| `chlorine_pump1_running` | `chlorine_pump1_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องจ่ายคลอรีน 1` — Enum `ปกติ` / `เสีย` |
| `chlorine_pump2_running` | `chlorine_pump2_running_status` | `'ปกติ'`, `'เสีย'` | `เครื่องจ่ายคลอรีน 2` — Enum `ปกติ` / `เสีย` |

Boolean ↔ enum mapping (documented in the migration file comments): `true` ↔
`'ล้าง'` / `'ปกติ'`, `false` ↔ `'ไม่ล้าง'` / `'เสีย'`. **No sync trigger, no
backfill, no default** in this lane — the columns exist as parity surface; any
write-path mapping lands in later lanes with its own review.

### 2.2 `wastewater.reading` — enum CHECK on the EXISTING `chlorine_mix_ratio`

**Discovery (record at claim time):** the column already exists as nullable
free text — `chlorine_mix_ratio` is mapped from AppSheet
`อัตราส่วนผสม(คลอรีน/น้ำ)` since the original migration
(`scripts/phase2_generate_sql.py:42`); frontend surface
`frontend/src/lib/types.ts:113` (`chlorine_mix_ratio?: string | null`).
Adding a second column would duplicate it — **forbidden** (same rule as
`คลอรีนน้ำที่ใช้จริง` below). Parity action: add a CHECK constraint on the
existing column.

- AppSheet ground truth (reference §3.3 `อัตราส่วนผสม(คลอรีน/น้ำ)`, verbatim):
  Enum `1:2` / `1:4` / `1:9` (initial value `=1:4`).
- DDL: `CHECK (chlorine_mix_ratio IN ('1:2','1:4','1:9'))`, named
  `ck_wastewater_reading_chlorine_mix_ratio_enum`, added **NOT VALID** (see
  §3.3 rationale). NULL passes (unknown stays unknown — no coercion).
- The AppSheet initial value `1:4` is a UI default — intentionally **NOT**
  mirrored as a DB default.

### 2.3 `wastewater.reading` — `คลอรีนน้ำที่ใช้จริง`: NO schema change

`คลอรีนน้ำที่ใช้จริง` is already stored as an input column (`chlorine_used`,
`frontend/src/lib/types.ts:112`). In AppSheet it is a spreadsheet-formula
derivation (reference §3.3 verbatim: divides the dose volume by
`SWITCH(ratio, "1:2",2, "1:4",4, "1:9",9, "")`). **The DERIVATION lands in
P1.2 (SQL views).** This lane must NOT add a derived/duplicate column and must
NOT add any formula or trigger. Record this explicitly in the handoff.

### 2.4 `core.personnel` — enum CHECKs on the EXISTING `position` + `status`

**Discovery (record at claim time):** both columns already exist as nullable
free text (`frontend/src/lib/supabase-queries.ts:179`
`.select("id, staff_code, full_name, position, status")`;
`frontend/src/lib/types.ts:68-74` `PersonnelOut`). Adding duplicate columns is
**forbidden**. Parity action: add CHECK constraints on the existing columns.

- `position` — AppSheet ground truth (reference §3.2 `ตำแหน่ง`, verbatim):
  `นายแพทย์` / `พนักงานบริการ` / `นักวิชาการสาธารณสุข` / `นักโภชนาการ` /
  `พนักงานประกอบอาหาร`.
  DDL: `CHECK (position IN ('นายแพทย์','พนักงานบริการ','นักวิชาการสาธารณสุข',
  'นักโภชนาการ','พนักงานประกอบอาหาร'))`, named `ck_core_personnel_position_enum`,
  NOT VALID.
- `status` — AppSheet ground truth (reference §3.2 `สถานะ`, verbatim):
  `ทำงาน` / `ย้ายกลุ่มงาน` / `ลาออก` / `ลาศึกษาต่อ`.
  DDL: `CHECK (status IN ('ทำงาน','ย้ายกลุ่มงาน','ลาออก','ลาศึกษาต่อ'))`,
  named `ck_core_personnel_status_enum`, NOT VALID.
- NULL passes both checks (a departed/unclassified employee keeps its true
  state; never coerced to `ทำงาน`).

### 2.5 Explicit non-goals

- NO data writes of any kind (no INSERT/UPDATE/DELETE, no backfill of the 907
  historical rows, no normalization of legacy values).
- NO column defaults (unknown ≠ zero ≠ any value — `unknown ≠ 0` honesty rule).
- NO RLS changes, NO policy DDL, NO grant changes.
- NO form pages, NO `/flow`, NO Digital Twin, NO `supabase/functions/**`,
  NO CI changes, NO frontend/lib wiring (that is P1.4; `frontend/**` is
  forbidden).
- NO version bump / CHANGELOG entry: schema-only, user-invisible preparation
  per the CHANGELOG criteria (no new or changed user-facing capability);
  record this reasoning in the D4 log.
- NO edits to `docs/ai/APPSHEET-PARITY-PLAN.md`,
  `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`,
  `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` (read-only
  references).

## 3. Deliverables

### 3.1 Migration file — ONE file

`supabase/migrations/20261115120000_parity_p1_001.sql` (house timestamp
naming; **deviations recorded**: the claim instruction's literal spelling
`<timestamp>_parify_p1_001.sql` is normalized to `_parity_` — house naming is
descriptive-lowercase and "parify" is a typo of the lane subject; the
claim-time timestamp `20261115000001` was superseded by the delivered
`20261115120000` — filename reconciled here, §3.4, and §5 by the closeout
transition per D5 P3-1).

Requirements:

- Schema-only DDL: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for the 10 new
  columns (type `text`, NULLABLE, no default) + idempotent conditional
  `ADD CONSTRAINT` (a `DO $$ ... $$` block checking `pg_constraint` before
  each `ADD CONSTRAINT ... NOT VALID`) for the 13 CHECK constraints.
- Header comment block: lane id, plan row, reference quotes, boolean↔enum
  mapping, NOT VALID rationale, rollback SQL (see §3.4), zero-DML statement.
- No data writes. No RLS DDL. No function/trigger creation.

### 3.2 D2 RED-first schema test

`scripts/test_parity_p1_001_schema.py` (new) — Python unittest in the house
`scripts/test_*.py` style, **read-only**: it must only query
`information_schema.columns` and `pg_constraint`/`pg_get_constraintdef()` via
the same Management-API access path as `scripts/apply_migration_api.py`
(`scripts/_env.py`; token from Drive secrets; NO `.env` printing).

Assertions (all must FAIL truthfully before the migration is applied — the
RED record goes in the handoff):

1. The 10 new `wastewater.reading` columns exist, are `text`, `is_nullable =
   YES`, and have NO column default.
2. The 13 CHECK constraints exist with exactly the pinned
   `pg_get_constraintdef()` text (enum value lists verbatim).
3. The existing source-of-truth boolean columns and `chlorine_used` still
   exist and are unchanged (guard against accidental drops).

Run it GREEN in D4 after apply. The test never writes to the DB.

### 3.3 Preflight before apply (receipts into the handoff)

1. **Live-object check** via the Management API introspection path: confirm
   `wastewater.reading` and `core.personnel` exist and record the live column
   lists for the touched columns; if a discovery above does not hold live
   (e.g. a column name differs), STOP and report — do not improvise schema.
2. **Legacy-value evidence**: record `SELECT DISTINCT` (non-null values +
   counts) for `chlorine_mix_ratio`, `position`, `status`. If any non-null
   legacy value is outside its enum set, it stays untouched (NOT VALID keeps
   it readable; honesty — never coerce). A later `VALIDATE CONSTRAINT` is an
   explicit follow-up gated on an owner decision about legacy cleanup.
3. **Zero-DML confirmation**: grep the migration file for
   `INSERT|UPDATE|DELETE|TRUNCATE|GRANT|POLICY` — must return nothing (the
   words may appear only in comments; if so, note it).
4. **NOT VALID semantics note** (record): `NOT VALID` skips the existing-row
   scan but still enforces the CHECK on every new INSERT/UPDATE — parity
   going forward, history untouched.

### 3.4 Apply + rollback

- Apply to ENV_DB (`gllqtbyofrcjzmbnfoeh`, ap-southeast-1) ONLY via
  `uv run python scripts/apply_migration_api.py
  supabase/migrations/20261115120000_parity_p1_001.sql`; record the
  statement-by-statement receipt verbatim in the handoff.
- Rollback SQL (schema-only, documented in the migration header AND the
  handoff):
  `ALTER TABLE wastewater.reading DROP CONSTRAINT IF EXISTS <each of the 13>;`
  then `ALTER TABLE wastewater.reading DROP COLUMN IF EXISTS <each of the 10>;`
  (constraints on existing columns are dropped by name; the existing columns
  themselves are never dropped).

### 3.5 WO/handoff/frontier docs

- This WO + `docs/ai/handoffs/ENV-PARITY-P1-001-GLM.md` (D0 authored at
  claim time; D-phase logs + receipts appended by the implementing lane).
- `docs/ai/CURRENT-WORK.md`: registry fence re-pin + new claim + frontier
  bullet (done in the claim transition itself; later status updates follow the
  closeout convention).

## 4. Execution routing (D-plan)

- **D2 RED**: author `scripts/test_parity_p1_001_schema.py`; run against the
  live DB BEFORE applying the migration; record the truthful failure output
  (columns/constraints missing) in the handoff.
- **D3**: author the migration; run the §3.3 preflight; record receipts;
  apply via `scripts/apply_migration_api.py`; re-run the schema test GREEN.
- **D4 battery** at the frozen implementation head (all must pass; record
  outputs): FULL vitest suite, `tsc -b`, lint, Playwright FULL
  (workers=1), guard `344/344`, runtime battery `62/62`, the new schema test
  GREEN, `git diff --check` clean. **No version bump** — record the reasoning
  (schema-only, user-invisible; CHANGELOG criteria require no release entry).
- **D5**: fresh-GLM independent review at the exact frozen head (independently
  re-executed battery where possible; cross-model reviewer Terra eligible per
  precedent). Implementer NEVER merges its own implementation PR.
- Stop at **REVIEW_REQUESTED**; the authorized reviewer owns approval and
  merge.

Worktree: `_worktrees/env-parity-p1-001` (implementation branch
`feat/env-parity-p1-001` created from the transition merge SHA; the claim
transition itself lives on `docs/env-parity-p1-001-claim`).

## 5. Mutable scope (claim-bound)

- `supabase/migrations/20261115120000_parity_p1_001.sql` (delivered)
- `scripts/test_parity_p1_001_schema.py` (new)
- `docs/work-orders/ENV-PARITY-P1-001.md` (this file)
- `docs/ai/handoffs/ENV-PARITY-P1-001-GLM.md` (new)
- `docs/ai/CURRENT-WORK.md` (registry + frontier status transitions only)

## 6. Forbidden scope

Form pages (`/form`), `frontend/**`, `/flow`, Digital Twin pages/lib,
`supabase/functions/**`, CI (`.github/**`), `docs/ai/APPSHEET-PARITY-PLAN.md`,
`docs/ai/digital-twin/**` (read-only references),
`docs/ai/HANDOFF.md`, `AGENTS.md`, `data/**`, `.env`, `scripts/
env_coordination_guard.py`, `scripts/env_autonomy_runtime.py`, and everything
else not listed in §5.

## 7. Truth constraints (binding)

- Unknown ≠ zero/normal/anything: NULL stays NULL; no backfill; no defaults.
- `latest` ≠ `live`: this lane adds schema only; no telemetry claims.
- The booleans remain the source of truth in P1.1; enum columns are parallel
  parity surface with a documented mapping — no silent semantic replacement.
- Legacy non-enum values are never edited or hidden; NOT VALID keeps them
  honest and visible as follow-up evidence.
- Enum value lists are quoted verbatim from reference §3 — no invented values.
- Dates user-facing พ.ศ. (CE + 543) in any Thai text the lane produces.
- No PHI in test data or receipts; no real writes in tests (schema test is
  read-only introspection).
- No assertion weakening to force RED→GREEN.

## 8. Acceptance

1. Registry shows exactly one new claim (`ENV-PARITY-P1-001-C1`, gen 1) after
   the reviewed transition merge; JSON-diff vs base = 1 new claim, others
   byte-identical.
2. Migration applied with preflight + apply receipts in the handoff; schema
   test RED (pre-apply) and GREEN (post-apply) outputs recorded verbatim.
3. D4 battery green at the frozen head with the no-version-bump reasoning
   recorded.
4. D5 fresh-GLM review recorded; PR stopped at REVIEW_REQUESTED; implementer
   did not merge.
