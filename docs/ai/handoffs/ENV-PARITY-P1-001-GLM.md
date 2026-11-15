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

## D2 — (to be appended by the implementing lane: RED test output verbatim)

## D3 — (to be appended: preflight receipts + apply receipt + GREEN run)

## D4 — (to be appended: battery outputs + no-version-bump reasoning)

## D5 — (to be appended: reviewer verdict + receipt)

## D6 — CLOSEOUT RECEIPT (only by a separate reviewed closeout transition)
