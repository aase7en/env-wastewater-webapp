# ENV-PARITY-P1-001-C1 — Handoff (claim checkpoint)

conventions note: this handoff follows the
`docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md` conventions (claim checkpoint
sections, per-phase evidence, durable receipts). D-phase logs D1+ are appended
by the implementing lane; nothing before D0 is rewritten later.

## D0 — Claim transition authored (15 พฤศจิกายน 2569 / 2026-11-15)

- Claim `ENV-PARITY-P1-001-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges to
  `main`.
- Task `ENV-PARITY-P1-001` (new task row; task_id uniqueness checked against
  the registry via the guard — no OWNERSHIP_CONFLICT; 25 → 26 claims,
  JSON-diff exactly 1 new claim).
- Work Order: `docs/work-orders/ENV-PARITY-P1-001.md` (authorization basis,
  scope bound to plan §6 Phase 1 row P1.1, verbatim enum ground truth,
  migration design, D-plan, mutable/forbidden scope, truth constraints,
  acceptance).
- Lane: Track-Z (GLM) only — SQL migration + live-introspection RED-first
  schema test + battery; no Track F work exists (schema-only, no visual
  surface).
- Holder (this coordinator session): `kilo-env-parity-p1-001-g1-primary`;
  worktree
  `/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-parity-p1-001`;
  transition branch `docs/env-parity-p1-001-claim`; implementation branch
  `feat/env-parity-p1-001` (created from the transition merge SHA, NOT before
  merge); base `1b00390590fec1eee79b7773adee8131fae7563a` (= origin/main at
  transition authoring; the parity plan itself is this base commit).
- Fence: `expected_policy_revision` pins the base SHA;
  `expected_registry_hash` pins the registry block AT the base, guard method
  `scripts/env_coordination_guard.py:454-456`
  (`sha256(exact canonical block text)`), verified via
  `python3 scripts/env_coordination_guard.py validate-registry --file
  docs/ai/CURRENT-WORK.md` at base →
  `{"claims": 25, "ok": true, "registry_hash":
  "65de18c75d0e7ee49c814296c7bb8df2d84dc5a9506e75e61e6c9c8f37c544ff"}`.
  Prior fences (`f60316ce…` / `5a07061a…`) re-pinned to the new base.
- Registry ground truth (honesty note): **25 claims at base — NOT 24**. The
  24-count from the UNDO closeout predates the `ENV-SUNDAYMCP-ROUTING-001-C1`
  claim (added later by another agent); the instruction's uncertainty was
  resolved with validate-registry ground truth as required.

### Authorization basis (recorded, adversarial-check item)

1. Owner standing Goal-mode instruction 2026-11-15: "ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14: "วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล,
   การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด"
   → `docs/ai/APPSHEET-PARITY-PLAN.md` (base commit `1b00390`).
3. Plan §6 Phase 1 lane table row P1.1 (quoted verbatim in the WO §1.3).
4. Verbatim AppSheet definition reference §3.2/§3.3 (enum lists quoted in the
   WO §2 — they BIND; no invented values).

### Scope discoveries recorded at claim time (bind the lane shape)

1. **`chlorine_mix_ratio` already exists** on `wastewater.reading` — nullable
   free text, mapped from AppSheet `อัตราส่วนผสม(คลอรีน/น้ำ)` since the
   original migration (`scripts/phase2_generate_sql.py:42`; frontend surface
   `frontend/src/lib/types.ts:113`). Parity action = CHECK constraint on the
   EXISTING column (`1:2`/`1:4`/`1:9`), never a duplicate column.
2. **`core.personnel` already has `position`/`status`** — nullable free text
   (`frontend/src/lib/supabase-queries.ts:179`; `frontend/src/lib/types.ts:68-74`).
   Parity action = CHECK constraints on the EXISTING columns, verbatim value
   lists.
3. **Machine/screen enums map onto existing booleans** per the plan wording
   "map กับ boolean เดิม" — ADDITIVE mapping: 10 new nullable no-default
   `*_status` columns; booleans remain source of truth
   (true↔`ล้าง`/`ปกติ`, false↔`ไม่ล้าง`/`เสีย`); no sync trigger in this lane.
4. **`คลอรีนน้ำที่ใช้จริง` stays the stored input column `chlorine_used`** —
   the spreadsheet-formula DERIVATION (dose ÷ SWITCH(ratio)) is P1.2; this
   lane adds no derived/duplicate column and no formula/trigger.
5. **Live-DB caveat**: the Supabase MCP session reachable during claim
   authoring is connected to a DIFFERENT project (queries for
   `wastewater.reading`/`core.personnel` returned empty there) — live
   ENV_DB verification is therefore an explicit D3 PREFLIGHT step for the
   implementing lane (via the `scripts/apply_migration_api.py` /
   `scripts/introspect_schema_api.py` Management-API path with
   `SUPABASE_ACCESS_TOKEN` from Drive secrets, or `.env` `SUPABASE_DB_URL`
   tooling). If a discovery above does not hold live (e.g. a column name
   differs), STOP and report — do not improvise schema.

### Deviations recorded at claim time

- Migration filename: instruction's literal `<timestamp>_parify_p1_001.sql`
  normalized to `20261115000001_parity_p1_001.sql` (house descriptive naming;
  "parify" is a typo of the lane subject "parity"). Recorded here and in the
  WO §3.1.
- Claim-count: instruction said "last known 24, one agent reported 25 —
  verify" → verified 25 (see D0 honesty note above).

### Type-surface precedent check (recorded)

The instruction allowed a minimal type touch ONLY if house conventions
require it. Checked: `frontend/src/lib/types.ts` is MANUAL ("Manual for now;
will be auto-generated from /openapi.json later") and prior schema lanes did
NOT regenerate any type file — FOOD-CORE touched only import-adapters +
trigger gating; ENV-PERF-001 added the `fn_create_reading` RPC with
`frontend/**` untouched. This lane is schema-only with NO frontend wiring
(P1.4 owns forms), so **no type file changes** — `frontend/**` stays
forbidden.

### Binding execution plan (pointer to WO §4)

D2 RED (`scripts/test_parity_p1_001_schema.py`, read-only introspection,
truthful failure pre-apply) → D3 ONE migration + preflight receipts +
`scripts/apply_migration_api.py` apply + rollback SQL documented → D4 battery
(FULL vitest, `tsc -b`, lint, Playwright FULL workers=1, guard 344/344,
runtime 62/62, schema test GREEN, `git diff --check`; **no version bump —
schema-only user-invisible prep, no CHANGELOG entry per the criteria,
reasoning recorded in the D4 log**) → D5 fresh-GLM independent review at the
exact frozen head → **REVIEW_REQUESTED**; implementer never merges.

### Truth constraints (binding pointer to WO §7)

unknown ≠ 0 (NULL stays NULL; no backfill of the 907 historical rows; no
defaults; legacy non-enum values never edited or hidden — NOT VALID keeps
them visible as follow-up evidence); latest ≠ live; booleans remain source of
truth; enum lists verbatim; พ.ศ. user-facing dates; no PHI; no real writes in
tests; no assertion weakening.

## D1 — (empty; no delegated consults were required for this claim — scope and
values are fully pinned by the plan row + verbatim reference. Any later
genuine fork gets its own consult receipt here.)

## D2 — RED (implemented by the delivering lane, 15 พฤศจิกายน 2569 / 2026-11-15)

Authored `scripts/test_parity_p1_001_schema.py` (new) — Python unittest in the
house `scripts/test_*.py` style, strictly read-only: it queries only
`information_schema.columns` and `pg_constraint`/`pg_get_constraintdef()` on
ENV_DB through the same Management-API path as
`scripts/apply_migration_api.py` (`scripts/_env.py`; `SUPABASE_ACCESS_TOKEN`
from Drive secrets, never printed). Assertions: (1) the 10 new
`wastewater.reading` parity columns exist as `text`, nullable, NO default;
(2) the 3 enum CHECK constraints exist with pinned
`pg_get_constraintdef()` text and NOT VALID (`convalidated = false`);
(3) the existing source-of-truth columns (10 booleans + `chlorine_used` +
`chlorine_mix_ratio` + `core.personnel.position`/`.status`) remain unchanged.

Truthful RED (run against the LIVE DB BEFORE the migration was applied —
migration file not yet authored):

```
SUBFAILED(constraint='ck_wastewater_reading_chlorine_mix_ratio_enum') ... missing on wastewater.reading
SUBFAILED(constraint='ck_core_personnel_position_enum') ... missing on core.personnel
SUBFAILED(constraint='ck_core_personnel_status_enum') ... missing on core.personnel
SUBFAILED(column='screen_cleaned_coarse_status' … 'chlorine_pump2_running_status') — all 10 "missing parity column <name>" (found {})
13 failed, 3 passed, 1 warning, 14 subtests passed in 1.22s
```

The 14 passing subtests are assertion group 3 (source-of-truth surface
unchanged) — i.e. the RED is exactly the missing parity surface, nothing else.

Harness note (recorded): the very first RED attempt hit a test-harness bug
(a class-attribute function became a bound method via `self.q` → TypeError);
fixed with `staticmethod` and re-run — the recorded RED above is the
post-fix truthful outcome, not a masked failure.

### D3 gate + preflight receipts (recorded before apply)

1. **ENV_DB gate (WO §3.3.1 dispatch item)** — tooling points at ENV_DB:
   `PROJECT_REF = "gllqtbyofrcjzmbnfoeh"` hardcoded at
   `scripts/apply_migration_api.py:29` (same constant in
   `scripts/introspect_schema_api.py:20`); API endpoint
   `https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query`.
   ENV_DB-identifying artifact after connecting: `SELECT count(*)` through
   that endpoint → `wastewater.reading` = **907 rows** and
   `core.personnel` = **9 rows**, matching the row counts captured in
   `reports/schema-snapshot-live.md` from ENV_DB (2026-11-13). The D0 caveat
   (MCP session attached to a different project) does not apply to this
   Management-API path.
2. **Token resolution deviation**: the `scripts/_env.py` resolver chain is
   broken on this machine (no repo-local `.env` stub exists in the worktree
   or the canonical checkout, and the sibling A-Wiki lives under
   `_from_Desktop/A-Wiki`, outside the candidate list). Resolution used tier 1
   of the same approved resolver — `SUPABASE_ACCESS_TOKEN` injected into the
   process environment from the Drive secrets file
   (`<drive>/secrets/env-wastewater-webapp.env`, Drive root resolved via the
   A-Wiki `drive` link). The token was never printed, logged, or persisted.
3. **Live-object check**: `wastewater.reading` and `core.personnel` exist;
   all D0 discoveries hold live — `chlorine_mix_ratio` text/nullable/no
   default, 10 machine/screen booleans present, `chlorine_used` numeric,
   `position`/`status` text/nullable/no default (full lists recorded in the
   preflight probe output).
4. **Name-collision check**: zero `ck_%` constraints on either target table;
   zero existing `*_status` columns on `wastewater.reading` — no collisions
   for any of the 13 new object names.
5. **Legacy-value evidence** (`SELECT DISTINCT` + counts; NOT VALID keeps
   these readable and uncoerced — owner follow-up evidence):
   - `wastewater.reading.chlorine_mix_ratio` (all 907 rows non-null): `1:4`×678,
     `1:9`×199, `1:2`×30 — all within the enum set.
   - `core.personnel.position` (8 of 9 rows non-null): `พนักงานบริการ`×5,
     `นักวิชาการสาธารณสุข`×1 in-enum; **3 rows OUTSIDE the enum**:
     `ผู้ช่วยช่างทั่วไป`×1, `พนักงานช่วยเหลือคนไข้`×1, `พนักงานเปล`×1.
   - `core.personnel.status` (9 of 9 rows non-null): `ลาออก`×3 in-enum;
     **6 rows OUTSIDE the enum**: `active`×6.
   A later `VALIDATE CONSTRAINT` therefore requires an explicit owner
   decision on legacy cleanup first (never silently coerced here).
6. **Zero-DML confirmation**: `grep -inE
   "INSERT|UPDATE|DELETE|TRUNCATE|GRANT|POLICY"` on the migration file →
   zero matches (case-insensitive; no comment hits either). Local
   `split_sql` dry-run → exactly 13 statements (10 `ADD COLUMN IF NOT
   EXISTS` + 3 `DO $$` guards), dollar-quotes handled.
7. **NOT VALID semantics note**: NOT VALID skips the existing-row scan
   (907 historical rows untouched) but still enforces the CHECK on every
   new/changed row — parity going forward, history untouched.

### D3 apply receipt (verbatim)

```
20261115120000_parity_p1_001.sql: 13 statement(s)
  [1/13] OK: ALTER TABLE wastewater.reading
  [2/13] OK: ALTER TABLE wastewater.reading
  [3/13] OK: ALTER TABLE wastewater.reading
  [4/13] OK: ALTER TABLE wastewater.reading
  [5/13] OK: ALTER TABLE wastewater.reading
  [6/13] OK: ALTER TABLE wastewater.reading
  [7/13] OK: ALTER TABLE wastewater.reading
  [8/13] OK: ALTER TABLE wastewater.reading
  [9/13] OK: ALTER TABLE wastewater.reading
  [10/13] OK: ALTER TABLE wastewater.reading
  [11/13] OK: DO $$
  [12/13] OK: DO $$
  [13/13] OK: DO $$

Done: 13 OK, 0 FAIL
```

Applied via `uv run python scripts/apply_migration_api.py
supabase/migrations/20261115120000_parity_p1_001.sql` (2026-11-15).

### D3 post-verify

- All 3 constraints present, `contype = 'c'`, **`convalidated = false`
  (NOT VALID)**; live `pg_get_constraintdef()` (verbatim):
  - `ck_wastewater_reading_chlorine_mix_ratio_enum` →
    `CHECK ((chlorine_mix_ratio = ANY (ARRAY['1:2'::text, '1:4'::text, '1:9'::text]))) NOT VALID`
  - `ck_core_personnel_position_enum` →
    `CHECK (("position" = ANY (ARRAY['นายแพทย์'::text, 'พนักงานบริการ'::text, 'นักวิชาการสาธารณสุข'::text, 'นักโภชนาการ'::text, 'พนักงานประกอบอาหาร'::text]))) NOT VALID`
  - `ck_core_personnel_status_enum` →
    `CHECK ((status = ANY (ARRAY['ทำงาน'::text, 'ย้ายกลุ่มงาน'::text, 'ลาออก'::text, 'ลาศึกษาต่อ'::text]))) NOT VALID`
- All 10 `*_status` columns exist: `text`, `is_nullable = YES`, no default.
- Historical rows unchanged: `wastewater.reading` = 907, `core.personnel` = 9.
- Schema test GREEN after pin correction: `3 passed, 1 warning, 27 subtests
  passed in 1.27s` (10 parity columns + 3 constraints + 14 unchanged
  source-of-truth columns, all asserted).

### D3 test-pin correction (recorded — not an assertion weakening)

The D2 RED run pinned the authored IN-form DDL text as the expected
`pg_get_constraintdef()` rendering. PostgreSQL's actual deterministic deparse
differs textually (`IN (...)` is parse-time sugar for `= ANY (ARRAY[...])`,
adds `::text` casts, quotes the reserved-word column `"position"`, and
appends `NOT VALID` to the def). Before the GREEN run the pinned text was
corrected to the observed live rendering quoted above — semantically
identical and strictly STRONGER (it now byte-pins the full cast forms and
the NOT VALID suffix; enum values, their order, and NOT VALID remain pinned
verbatim). No assertion was weakened to force RED→GREEN.

### Post-interruption resume note (recorded)

The delivering session was interrupted (API-key expiry) AFTER the apply and
post-verify above, before the PR. On resume, the live DB state was
re-verified BEFORE any apply attempt: all 3 `ck_%` constraints present with
`convalidated = false`, all 10 `*_status` columns present, 907 rows —
**already applied, verified; apply was NOT re-run** (no double-apply).
During the interruption the same apply path and Drive-secret source were
used again only for read-only introspection.

## D4 — battery at the frozen implementation head (15 พฤศจิกายน 2569)

All commands run from the lane worktree
`/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-parity-p1-001`
(branch `feat/env-parity-p1-001` @ base `aeda441`):

| Item | Result |
|---|---|
| vitest FULL (`npm run test`) | **32 files: 503 passed \| 1 skipped (504)** — the 1 skip is the designed `skipIf` from prior lanes |
| `tsc -b` | exit 0 (clean) |
| lint (`npm run lint` / oxlint) | exit 0; 18 warnings / 0 errors (all pre-existing: `AuthProvider.tsx` ×2, `gen-pwa-icon-192.mjs`, et al.) |
| Playwright FULL (`npx playwright test --workers=1`) | **213 passed (4.9m)** |
| guard (`pytest scripts/test_env_coordination_guard.py`) | **344 passed + 450 subtests** |
| runtime (`pytest scripts/test_env_autonomy_runtime.py`) | **62 passed + 32 subtests** |
| schema test (`pytest scripts/test_parity_p1_001_schema.py`) | **GREEN** — 3 passed, 27 subtests (see D3) |
| checker (`python3 scripts/check_release_version.py`) | `RELEASE VERSION CHECK: OK (v1.1.0; CHANGELOG entry v1.1.0)` |
| `git diff --check` | clean |

**No version bump — recorded reasoning**: this lane is schema-only
preparation for later parity lanes (P1.2/P1.4); it adds DB constraints and
nullable columns that no user-facing surface reads yet. Per the CHANGELOG
criteria (release entries require a new or changed user-facing capability),
no CHANGELOG entry and no version bump; `package.json` and `CHANGELOG.md`
are untouched and the checker confirms the current `v1.1.0` pairing intact.

### D4 environment-prep notes (machine-local, never committed)

- The fresh worktree lacked the gitignored `frontend/.env`; the first vitest
  run had 2 collection failures ("Missing VITE_SUPABASE_URL /
  VITE_SUPABASE_ANON_KEY"). Fixed by copying the canonical checkout's
  gitignored `frontend/.env` (129 bytes; publishable anon surface only) —
  NOT the `.env.example` placeholders, which silently stalled every e2e
  page-load. `frontend/.env` is gitignored and is not part of this PR.
- `npm install` drift on `frontend/package-lock.json` (unclaimed file) was
  reverted — the PR diff stays inside the claimed file set.
- Playwright chromium (headless shell v1228) was installed locally; two
  silent Playwright hangs (zero output for 40 min) were diagnosed to (a) an
  orphaned vite dev server from the session interruption wedging the
  webServer handoff and (b) the `.env.example` placeholder values above;
  both fixed, then the suite ran clean end-to-end.

### Changed files (diff vs `origin/main` @ aeda441 — claimed set only)

1. `supabase/migrations/20261115120000_parity_p1_001.sql` (new)
2. `scripts/test_parity_p1_001_schema.py` (new)
3. `docs/work-orders/ENV-PARITY-P1-001.md` (status transition only)
4. `docs/ai/handoffs/ENV-PARITY-P1-001-GLM.md` (D2/D3/D4 receipts appended)

`docs/ai/CURRENT-WORK.md` untouched on this branch (registry transitions
belong to the closeout convention). No `frontend/**`, no CI, no
`supabase/functions/**`, no plan/reference edits.

### Deviations (all recorded; none material to scope)

1. **Migration filename**: this dispatch instruction's
   `20261115120000_parity_p1_001.sql` was used instead of the WO
   §3.1/§5 literal `20261115000001_parity_p1_001.sql` (the current explicit
   instruction wins over the claim-time WO spelling; both satisfy house
   timestamp naming; sorts after every existing migration).
2. **WO "13 CHECK constraints"** (§3.1, §3.2 item 2, §3.4) is a conflation
   of the 10 columns + 3 CHECKs; WO §2 pins exactly **3** CHECK constraints,
   and exactly 3 were delivered, tested, and rolled back by name. The
   rollback block covers "the 13 objects this migration created" (3
   constraints + 10 columns).
3. **Test pin correction** — see D3 above (stronger pin, recorded).
4. **Token via process-env injection** — see D3 gate item 2.
5. **Post-interruption resume** — see D3 resume note (no double-apply).

## D5 — (to be appended: reviewer verdict + receipt)

## D6 — CLOSEOUT RECEIPT (only by a separate reviewed closeout transition)
