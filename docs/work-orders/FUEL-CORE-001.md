# FUEL-CORE-001 - fuel_type data honesty and carbon rollup safety

Status: REVIEW_REQUESTED
Owner: GLM-5.3 MAX (Core Engineering / Track Z)
Lead / review owner: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-fuel-core-001`
Branch: `fix/fuel-core-001`
Base: `origin/main@2db209e88f61b4471784a6540dc67a65930fb894`
Exact HEAD: literal SHA frozen in the pushed PR head + external review packet per governance §17
Handoff path: `docs/ai/HANDOFF.md` + temporary external review/implementation packet while active
Last updated: 2026-08-30

## Implementation evidence — 2026-08-30

- RED (before implementation, focused `fuel.test.ts`): **10 failed / 1 passed** —
  - `expected 'diesel' to be null` (missing fuel_type fabricated into diesel) ×2;
  - `expected 'DIESEL' to be 'diesel'` (no canonical normalization);
  - `token: biodiesel: expected [Function] to throw` (arbitrary token passed through);
  - migration contract ×6 (no additive hardening migration existed).
  The 1 pass = canonical values accepted (already correct pre-change).
  Static defect record: original unsafe cast at `supabase/migrations/20260719000002_v2_unified_rollup.sql:51` (`ef.source = d.fuel_type::carbon.source_type`).
- Implementation (smallest fail-closed correction):
  - `frontend/src/lib/import-adapters/fuel.ts` — new `mapFuelType()`: blank/missing → `null` (drops the `?? "diesel"` fabrication); trim/case-fold normalization to the canonical token only; non-canonical non-empty token throws `ประเภทน้ำมันไม่รองรับ (ต้องเป็น diesel/gasoline/lpg/other หรือเว้นว่าง): …` into the existing adapter row-error path before any REST write. No synonym/Thai mapping invented.
  - `supabase/migrations/20260830000000_fuel_core_001_rollup_safety.sql` — additive `CREATE OR REPLACE VIEW carbon.v_unified_co2e`: fuel branch join changed to `ef.source::text = d.fuel_type` (enum side cast to text). Unknown/legacy values now match no factor (kg_co2e NULL = unknown stays unknown) instead of raising an enum-cast error; canonical values match exactly as before; all other UNION branches reproduced verbatim; no emission-factor data touched.
- Test-harness notes: the migration contract test strips `--` comments before asserting so the migration's defect-documentation prose cannot mask/trip assertions; assertions bind to executable SQL.
- GREEN gates: focused `fuel.test.ts` **11/11 PASS**; full Vitest **214/214 PASS**; standalone `tsc -b` PASS; lint **12 pre-existing warnings / 0 errors** (no new); production build PASS (existing chunk-size advisory only); `git diff --check` PASS.
- Bulk Import E2E: **not practical within this WO's mutable scope** — a new e2e spec file is outside the declared mutable file list, so browser-level proof is deferred rather than scope-expanded; adapter rejection is proven at unit level through the same `mapRow` throw path Bulk Import renders.
- No real hospital data, no real REST writes, no legacy data cleanup, no UI/schema-RLS/factor changes.

## Objective

Prevent free-text or missing imported `fuel_type` values from being silently classified as a real fuel, and prevent legacy/dirty free-text values in `fuel.dispense_log` from crashing `carbon.v_unified_co2e`. Preserve unknown as unknown; never coerce it to diesel or other.

## Source reality / defect

- Live schema snapshot: `carbon.source_type = electricity | diesel | gasoline | lpg | other`.
- `fuel.dispense_log.fuel_type` is nullable free-text.
- Bulk Import writes `fuelAdapter` mapped rows directly to `dispense_log`.
- Current adapter defaults missing type to `diesel` and passes any non-empty string through.
- Current carbon rollup joins with `d.fuel_type::carbon.source_type`; an unexpected legacy/import string can raise an enum-cast error and break view evaluation.
- Existing UI options are canonical enum-compatible values; UI/mobile redesign is outside this lane.

## Mutable scope

- `frontend/src/lib/import-adapters/fuel.ts`
- one focused Fuel import-adapter unit test file under `frontend/src/lib/import-adapters/`
- one new additive migration under `supabase/migrations/` for Fuel rollup hardening
- one focused deterministic regression checker/test for the new migration if needed
- `docs/work-orders/FUEL-CORE-001.md`
- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`
- `docs/ai/DEFECT-MEMORY.md` only for one verified reusable lesson

## Forbidden scope

- `frontend/src/pages/FuelPage.tsx` and all visual/mobile files
- `frontend/src/lib/fuel.ts` persisted-row type narrowing unless independently proven necessary
- existing historical migration rewrites
- emission-factor values or scientific/carbon factors
- Garbage/Garden/Chemical/Water/Wastewater behavior
- auth/RLS/PHI/shared shell/workflows/packages/dependencies
- `.serena/**`

## Required behavior

1. Missing/blank imported fuel type stays `null`; do not default to diesel/other.
2. Trim/case normalization may canonicalize an already-equivalent canonical token (e.g. `DIESEL` -> `diesel`). Do not invent synonym/Thai-name mappings without an approved source contract.
3. Non-empty unsupported imported fuel type fails that row through the existing adapter error path before any REST write.
4. Canonical accepted import values: `diesel`, `gasoline`, `lpg`, `other`.
5. Carbon rollup must not cast arbitrary free-text fuel values into `carbon.source_type`. Prefer safe comparison such as enum-to-text against stored text so an unknown legacy value produces no matched factor rather than crashing or being reclassified.
6. Preserve all other union branches and carbon factor semantics exactly.
7. Do not mutate or clean legacy production data in this WO.

## RED / regression requirements

Before production mutation, prove at least:
- missing fuel type currently becomes diesel (RED for honesty);
- unsupported token currently passes adapter validation (RED);
- current rollup SQL contains unsafe `d.fuel_type::carbon.source_type` cast (RED/static contract).

GREEN must prove:
- canonical values accepted; whitespace/case equivalent normalized only;
- missing/blank -> null;
- unsupported non-empty value -> adapter row error and zero valid row for that row;
- rollup migration contains no free-text-to-enum Fuel cast; unknown legacy value cannot cause enum-cast failure by construction;
- other rollup source branches unchanged semantically.

## Verification

- focused Fuel adapter tests;
- deterministic migration contract checker/test;
- full Vitest;
- typecheck; lint with no new warnings; build;
- focused Bulk Import E2E if practical, with synthetic data and zero real writes;
- `git diff --check`;
- actual changed-file/scope review;
- exact-head CI/E2E as applicable;
- fresh independent exact-SHA review before merge.

## Acceptance

- Unknown/missing imported environmental data is never fabricated into diesel/other.
- Invalid imported type is visible as an import error before database write.
- Existing dirty/legacy `fuel_type` cannot crash carbon rollup through enum cast.
- No carbon factor, RLS, UI/mobile, or unrelated domain behavior changes.
- No real hospital data writes used for verification.

## Stop condition

Implementation owner stops at `REVIEW_REQUESTED` with exact pushed SHA, remote diff, RED/GREEN evidence, test results, known limitations, and one next safe action. Implementation owner must not merge.

## One next safe action

GLM-5.3 MAX reads repo SSoT + this WO, verifies actual state/ownership, establishes RED regressions, implements the smallest fail-closed adapter + additive rollup hardening, runs gates, updates SSoT, pushes/open PR, then stops at REVIEW_REQUESTED.
