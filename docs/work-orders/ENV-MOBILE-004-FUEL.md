Status: COMPLETE
Owner: GPT-5.6 Sol
Parallel Core audit: GLM-5.3 MAX may perform read-only Fuel data-contract/schema/query/RLS audit; no mutable ownership
Independent reviewer / merge owner: fresh reviewer context after implementation stops
Parent roadmap: `ENV-MOBILE-002+` Domain form convergence

## Goal

Make the existing Fuel / fleet dispense workflow practical on 360–430 px phones while preserving current Supabase payload/query/schema, meter-delta warning, carbon-source semantics, and useful tablet/desktop density.

## Exact start boundary

- Repo/worktree: `A:\GitHub\envww-review-mobile-001`
- Branch: `feat/env-mobile-004-fuel`
- Base: `origin/main@4385379d9801998ba54e97560de1fe59ae29469d`
- Route: `/fuel`
- Existing page: `frontend/src/pages/FuelPage.tsx`
- Existing data layer: `frontend/src/lib/fuel.ts` — read-only for this WO
- Existing import adapter: `frontend/src/lib/import-adapters/fuel.ts` — read-only for this WO
- Historical module WO: `docs/work-orders/MOD-FU-fuel.md` — read-only
- Protected unknown state: `.serena/` — do not touch

Before production mutation: fetch current main; verify repo/remote/branch/HEAD/dirty state; verify this claim is ACTIVE; verify no overlapping Fuel writer/PR; establish deterministic phone-width RED/baseline.

## Source-reality audit — 2026-08-28

Verified before activation:

- `FuelPage.tsx` uses `grid grid-cols-2 md:grid-cols-4` for the entry form, so phone widths receive two controls per row.
- Fuel history renders a raw multi-column table without a local overflow wrapper.
- Delete action is a plain text button; phone touch-target size is unproven.
- No dedicated Fuel Playwright mobile spec exists.
- Actual `fuel.dispense_log` schema includes `log_date`, `fuel_type`, `litres`, `meter_before`, `meter_after`, `vehicle_or_use`, `vehicle_id`, `odometer`, `purpose`, `cost_baht`, `supplier`, `recorded_by`, `note`, timestamps. Snapshot row count 0 is historical evidence only and must not be presented as current inventory/usage.
- RLS is enabled; current migration policy requires `core.fn_is_staff_or_admin()` for authenticated read/write.
- `computeDelta()` returns null unless before/after/litres are all present, computes `meter_after - meter_before`, rounds diff to 2 decimals, and marks mismatch only when `abs(diff) > 0.1`. The page confirms before saving a mismatch. This behavior is out of scope to redefine.
- UI fuel options `diesel`, `gasoline`, `lpg`, `other` all exist in `carbon.source_type`.
- A-Wiki says MOD-FU-a columns are pending, but actual ENV schema/migrations already contain them. Actual schema/migrations are authoritative.
- Historical MIG-FU CSV migration remains blocked waiting for user export; that does not block this responsive slice.

### Separate Core Engineering finding — do not fix in this WO

`fuel.dispense_log.fuel_type` is free text. `frontend/src/lib/import-adapters/fuel.ts` passes imported fuel type through without enum normalization, while the unified carbon view casts `d.fuel_type::carbon.source_type`. A legacy/imported unexpected string could therefore break carbon-view evaluation. This requires a separate Core Engineering contract/regression decision; mobile convergence must not silently change import or carbon semantics.

## Owned mutable scope

May edit only:

- `frontend/src/pages/FuelPage.tsx`
- `frontend/tests/e2e/fuel-mobile.spec.ts`
- this work order
- `docs/ai/handoffs/ENV-MOBILE-004-SOL.md`
- bounded Fuel status/claim records in `MIGRATION.md`, `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, `docs/ai/ROADMAP.md`, `docs/ai/graph/PROJECT-GRAPH.md`

No-touch without a separate work order/decision:

- `frontend/src/lib/fuel.ts`
- `frontend/src/lib/import-adapters/fuel.ts`
- carbon rollup/view code or emission factors
- DB schema/RLS/migrations/triggers
- shared UI primitives/styles/AppShell/ModuleDock
- other module forms
- Digital Twin
- A-Wiki repository

## Mobile contract — 360–430 px

1. Entry fields must not force half-width dense controls; primary fields render one control per row at phone width.
2. No document-level horizontal overflow.
3. Fuel history must stay contained within the page. If it remains a table, any horizontal scroll must be local/intentional.
4. Save/delete workflow targets must meet the project 44 px touch minimum.
5. Entered values must remain stable after a deterministic mocked save error and retry.
6. Existing payload field names/null semantics must remain unchanged.
7. Meter-delta warning + confirm-before-save behavior must remain intact; this responsive slice must not change the 0.1 mismatch rule.
8. Real touch emulation must exercise a representative valid fuel save path using synthetic test-only values.

## Tablet / desktop contract

- Preserve useful multi-column density at 768 and 1024 px.
- Keep history readable/actions reachable.
- Do not degrade desktop information density merely to satisfy phone layout.

## Baseline / RED plan

Before production edit, add the smallest deterministic Fuel E2E coverage and prove/measure:

- 360 px first/second form controls x delta;
- document overflow at 360 px;
- history table local/document containment with a synthetic representative row;
- delete target dimensions;
- 1024 px multi-column density.

Record conditions that already pass; do not manufacture RED.

## Baseline evidence — 2026-08-28

Measured against the unchanged production page on `origin/main@4385379d9801998ba54e97560de1fe59ae29469d` using synthetic E2E-only Fuel rows:

- 360 px first/second form-control x delta: **154 px** — RED versus one phone column.
- Delete target: **~19.125 × 24.797 CSS px** — RED versus project 44×44 minimum.
- 360 px document-level horizontal overflow with representative history row: **PASS / none detected**. Do not add a table wrapper solely by assumption.
- 1024 px multi-column form density: **PASS**.

The RED is bounded to phone form composition and delete touch target. Production data/query/schema/import/carbon behavior remains untouched at this checkpoint.

## Verification

Run and record:

- focused `fuel-mobile.spec.ts` with retries 0;
- representative Pixel 7 touch context;
- save-error/retry value + payload checks;
- meter-delta warning/confirmation regression if practical;
- route/auth smoke;
- full Vitest;
- typecheck/build;
- lint;
- full Playwright;
- `git diff --check`;
- screenshots at 360, 390/430, 768, 1024 where practical.

## Implementation / verification evidence — 2026-08-28

Production checkpoint: `413d435cf780ee6b809175d15fc2b86a55baf01d`.

Implemented only the bounded page-local seam: phone one-column form grid plus 44px delete target. Existing history containment, Fuel data/query/schema/RLS/carbon behavior, and `computeDelta` mismatch semantics were preserved.

GREEN evidence: focused Fuel Playwright 8/8 PASS; full Playwright 81/81 PASS; Vitest 202/202 PASS; typecheck/build PASS; lint 12 baseline warnings / 0 errors; route smoke + diff-check PASS; Pixel 7 touch path PASS; 360/390/430/768/1024 coverage; deterministic save failure preserves values and retry sends unchanged Fuel payload semantics; meter-delta warning/confirm cancel/accept behavior preserved.

Evidence packet: `docs/ai/handoffs/ENV-MOBILE-004-SOL.md`.

## Exact review / bounded remediation — 2026-08-28

Review `5050262812` returned `CHANGES_REQUIRED` against exact PR head `1f4d29644573820e27c926bb9700d41037346c3d`: all 11 visible Fuel labels lacked programmatic control associations, positional E2E selectors hid the defect, keyboard order/native activation were unproved, and retry coverage did not pin equal complete request bodies.

The unchanged page reproduced the finding: focused semantic RED resolved `getByLabel("วันที่")` to 0 controls. Remediation production checkpoint `6ac3c96d42cd9b9eff15429e4436d24dcad22438` then:

- adds stable page-local IDs plus matching `Field htmlFor` for all 11 Fuel controls;
- replaces positional form interaction/layout selectors with semantic `getByLabel()` coverage and pins every ID/accessibility name;
- proves keyboard order through every Fuel control and Enter activation from the focused native Save button; Chromium's native date input may retain its host focus while traversing internal segments, so that bounded exception is capped before the remaining controls require exact one-Tab order;
- proves the failed and retry POST JSON bodies are equal and exactly match the complete `FuelInput` contract, including `vehicle_or_use`, `odometer`, `cost_baht`, and `supplier` as null.

Remediation GREEN: focused Fuel Playwright **10/10 PASS** (retries 0, worker 1); full Playwright **83/83 PASS** (retries 0, 2 workers); Vitest **202/202 PASS** across 15 files; standalone TypeScript build PASS; production build PASS; lint **12 pre-existing warnings / 0 errors**; `git diff --check` PASS. Pixel 7 touch, 360/390/430/768/1024 layout evidence, save error/retry, meter-delta confirm cancel/accept, and auth/module routes remain covered. No Fuel data/import/carbon/schema/RLS/shared primitive behavior changed.

## Final review / merge / deployment closure - 2026-08-28

Verdict: `APPROVED / MERGED / DEPLOYED / PRODUCTION-SMOKED`.

- Final reviewed PR #46 head: `8e871d225a67f1da2a1c143556c2b34aaf9e90c6`; fresh independent reviewer reran focused Fuel Playwright **10/10 PASS**, verified exact diff/current base, and recorded APPROVED review `5051826429`.
- Exact-head PR workflows `33164741371` (E2E smoke) and `33164741375` (test) were SUCCESS before merge.
- PR #46 merged to main as `57f0bb3dd5c9a7e74ee0deb84bb166b215a8706a`.
- Post-merge exact-SHA runs: test `33178476395`, E2E `33178476367`, Pages `33178476366` - all SUCCESS; deployment `6142569782` is `success` for exact merge SHA.
- Live deployed-bundle 390x844 root-to-client `/fuel` smoke with all REST mocked/no real writes: one-column x-delta 0, semantic labels 11/11, Save 71.89x48, Delete 44x44, no settled document overflow, no console/page errors.
- Direct deep-link production-spec runs can sample transient shared ModuleDock settling overflow. The settled root-to-client smoke is clean and shared shell was unchanged, so this remains a non-blocking shell/hosting timing observation.
- No Fuel data/query/import/carbon/schema/RLS/shared primitive semantics changed. Imported arbitrary `fuel_type` versus carbon enum-cast remains a separate Core Engineering work order candidate.

## Completion gate - CLOSED

ENV-MOBILE-004 Fuel is complete. Garden/Garbage is the next eligible domain-form convergence slice only after this docs-only closeout is merged to main.
