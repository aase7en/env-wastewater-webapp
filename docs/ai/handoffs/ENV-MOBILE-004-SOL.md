# ENV-MOBILE-004 — Fuel mobile convergence

Date: 2026-08-28
Owner: GPT-5.6 Sol
Branch/worktree: `feat/env-mobile-004-fuel` / `A:\GitHub\envww-review-mobile-001`
Base: `origin/main@4385379d9801998ba54e97560de1fe59ae29469d`
RED checkpoint: `39b7293fb58f457f7fd199dd8dd7f14af0b35be7`
Production checkpoint: `413d435cf780ee6b809175d15fc2b86a55baf01d`
Remediation production checkpoint: `6ac3c96d42cd9b9eff15429e4436d24dcad22438`

## Goal

Make the existing Fuel / fleet dispense workflow practical on 360–430 px phones without changing Supabase payload/query/schema, meter-delta warning semantics, carbon-source semantics, or useful tablet/desktop density.

## Source reality / bounded scope

- Mutable production file: `frontend/src/pages/FuelPage.tsx` only.
- Focused regression file: `frontend/tests/e2e/fuel-mobile.spec.ts`.
- `frontend/src/lib/fuel.ts`, import adapter, schema/RLS/migrations, carbon view/rollup, shared UI/AppShell, other forms, and Digital Twin were read-only.
- `.serena/` remains protected/untracked and untouched.

## RED baseline

Against unchanged production at base:

- 360 px first/second form-control x delta: **154 px** — RED versus one phone column.
- Delete action: **~19.125 × 24.797 CSS px** — RED versus project 44×44 touch minimum.
- History table/document containment: PASS; no page-level horizontal overflow — already good, not changed.
- Desktop multi-column density: PASS — already good, preserved.

## Production change

Production checkpoint `413d435cf780ee6b809175d15fc2b86a55baf01d` contains only two page-local class changes:

- form grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`;
- delete action uses existing `--touch-min` for minimum 44×44 target plus page-local hover treatment.

No field/default/payload/query/schema/RLS/carbon/meter-delta rule was changed.

## Verification

Results from the exact implementation state before production checkpoint:

- focused Fuel Playwright: **8/8 PASS**, retries 0, worker 1;
- full Playwright: **81/81 PASS**, retries 0;
- Vitest: **202/202 PASS**;
- typecheck + production build: PASS;
- lint: **12 pre-existing warnings / 0 errors**;
- auth/module route smoke: PASS;
- `git diff --check`: PASS;
- phone coverage: 360 / 390 / 430 px;
- tablet/desktop coverage: 768 / 1024 px;
- Pixel 7 touch path: PASS;
- first save failure preserves entered values; retry succeeds and request payload semantics remain unchanged;
- meter-delta mismatch remains visible; confirm cancel prevents POST and confirm accept allows POST.

All representative Fuel rows used by E2E are synthetic test evidence, not production environmental/operational data.

## Exact review / remediation

Review `5050262812` returned `CHANGES_REQUIRED` on exact PR head `1f4d29644573820e27c926bb9700d41037346c3d`. It found that the 11 visible `Field` labels were sibling labels without `htmlFor`/control IDs, while the E2E used positional selectors and did not prove semantic names, keyboard order, native button activation, or equal complete retry payloads.

Focused RED on the unchanged production page: `getByLabel("วันที่")` resolved to 0 controls.

Remediation checkpoint `6ac3c96d42cd9b9eff15429e4436d24dcad22438`:

- associates every Fuel label with one stable page-local control ID;
- converts Fuel form E2E interaction/layout lookup to `getByLabel()` and asserts all 11 IDs/accessibility names;
- tabs through the complete Fuel control sequence and presses Enter on the focused Save button. Chromium's native date input can retain host focus while traversing internal segments, so only that host may repeat within a capped loop; the remaining 10 controls and Save require exact one-Tab order;
- asserts failed and retry POST JSON equality against the complete `FuelInput`, including null `vehicle_or_use`, `odometer`, `cost_baht`, and `supplier`.

## Remediation verification

- focused Fuel Playwright: **10/10 PASS**, retries 0, worker 1;
- full Playwright: **83/83 PASS**, retries 0, 2 workers;
- Vitest: **202/202 PASS** across 15 files;
- standalone `tsc -b`: PASS;
- production build: PASS (existing Vite chunk-size advisory only);
- lint: **12 pre-existing warnings / 0 errors**;
- `git diff --check`: PASS;
- Pixel 7 touch, 360/390/430/768/1024 composition, touch targets, local containment, save failure/retry, meter-delta confirm cancel/accept, and auth/module routes remain covered.

No shared Input/Button, Fuel data/query/import adapter, carbon code, schema/RLS/workflow/package, other module, or `.serena/` file changed.

## Separate Core Engineering finding — outside this mobile WO

`fuel.dispense_log.fuel_type` is free text. `frontend/src/lib/import-adapters/fuel.ts` can pass imported arbitrary strings through, while `carbon.v_unified_co2e` casts `d.fuel_type::carbon.source_type`. Current UI options (`diesel`, `gasoline`, `lpg`, `other`) match the enum, but legacy/import values outside the enum may make carbon rollup evaluation fail. This needs a separate Core Engineering data-contract/regression work order; do not silently change it in the mobile convergence PR.

## Stop gate

Implementation owner stops at `RE-REVIEW_REQUESTED`. Fresh independent reviewer must inspect the exact pushed PR head/diff, rerun/inspect focused evidence, verify exact-head CI, and own approval/merge. Any code-changing push invalidates this evidence and requires fresh verification.
