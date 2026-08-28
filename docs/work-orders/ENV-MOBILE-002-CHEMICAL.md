# ENV-MOBILE-002 — Chemical Form Mobile Convergence

Status: READY_FOR_IMPLEMENTATION
Owner: GPT-5.6 Sol (GLM-5.3 limit fallback authorized by user 2026-08-28)
Independent reviewer / merge owner: fresh reviewer context after implementation stops
Parent roadmap: `ENV-MOBILE-002+` Domain form convergence

## Goal

Make the existing Chemical sub-store workflow practical on 360–430 px phones while preserving its current Supabase data/query/business semantics and desktop usefulness.

## Exact start boundary

- Repo/worktree: `A:\GitHub\envww-review-mobile-001`
- Branch: `feat/env-mobile-002-chemical`
- Base: `origin/main@cca5a05d640c8262e0ef102d6fb9826f6f297553`
- Route: `/chemical`
- Existing production page: `frontend/src/pages/ChemicalPage.tsx`
- Existing data layer: `frontend/src/lib/chemical.ts` — read-only for this WO
- Existing module WO: `docs/work-orders/MOD-CH-chemical.md` — historical/read-only
- Protected unknown state: `.serena/` — do not touch

Before production mutation: fetch current main; verify repo/remote/branch/HEAD/dirty state; verify this claim is ACTIVE; verify no overlapping writer/PR; establish RED/baseline at phone width.

## Source-reality audit

Verified before activation:

- `ChemicalPage.tsx` uses `grid grid-cols-2 md:grid-cols-4` for both catalog and movement forms, so phone widths receive two controls per row.
- Stock and movement history render raw multi-column tables without an overflow/recomposition wrapper.
- Delete actions are plain text buttons; mobile touch-target size is not yet proven.
- No dedicated Chemical Playwright spec exists.
- `reports/schema-snapshot-live.md` confirms implemented `chemical.master` and `chemical.movement`; the snapshot reported 0 rows on 2026-08-03, which is historical evidence only and must not be presented as current inventory.
- Actual schema includes `master_id`, lot/expiry/supplier/unit-cost fields and FK; balance is recomputed by `chemical.fn_recompute_balance()` on movement changes.
- Companion A-Wiki `wiki/entities/env/chemical.md` is stale where it calls `chemical.master` pending. Actual ENV_DB schema/repo migration is authoritative; updating A-Wiki is outside this WO.
- Current movement UI initializes `quantity` to `0`, and schema has no positive-quantity CHECK. Whether zero should be rejected is a separate data-contract/business-rule decision; do not change it in this responsive WO.

## Owned files

May edit only:

- `frontend/src/pages/ChemicalPage.tsx`
- `frontend/tests/e2e/chemical-mobile.spec.ts`
- this work order
- `docs/ai/handoffs/ENV-MOBILE-002-SOL.md`
- `MIGRATION.md` only for this claim row
- `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, and `docs/ai/ROADMAP.md` only for bounded status/closure records

No-touch without a new decision/work order:

- `frontend/src/lib/chemical.ts`
- `frontend/src/App.tsx`
- shared UI primitives/styles/AppShell/ModuleDock
- DB schema/RLS/migrations/triggers
- Carbon rollup/data semantics
- other module forms
- Digital Twin
- A-Wiki repository

## Mobile contract — 360–430 px

1. Catalog and movement forms must not force half-width dense controls; primary fields render one control per row at phone width.
2. No document-level horizontal overflow.
3. Stock/history content must be contained within the page. If tables remain tables, any horizontal scroll must be local/intentional and not make the document overflow.
4. Add/save/delete interactive targets used in the workflow must be at least the project 44 px touch minimum.
5. Entered values must remain stable while scrolling/interacting and after a deterministic mocked save error.
6. Create operations must continue using the existing payload/data layer; no renamed/redefined fields, automatic values, or fabricated inventory.
7. Real touch emulation must exercise representative catalog/movement actions.

## Tablet / desktop contract

- Preserve useful multi-column density from larger breakpoints.
- Tables remain readable and actions reachable at 768 and 1024 px.
- Do not degrade current desktop information density merely to satisfy phone layout.

## Baseline / RED plan

Before production edit, add the smallest deterministic Chemical E2E coverage using existing auth/network fixtures and prove at least:

- 360 px catalog/movement controls currently share rows (RED for phone convergence);
- whether document-level overflow occurs with representative mocked stock/history rows;
- current delete target dimensions with representative rows.

Do not fabricate RED for a condition that already passes; record measured baseline instead.

## Baseline evidence — 2026-08-28

Environment note: the clean worktree initially lacked local `node_modules`, so the first Playwright attempt was classified `ENVIRONMENT_FAILURE`. A gitignored local junction reuses the already-installed dependency tree from `A:\GitHub\envww-mobile-001\frontend\node_modules`; no package/lock/dependency source changed.

Measured against unmodified `ChemicalPage.tsx` at branch checkpoint `c6ea6a873b03137e30ffe2fb1c70b7db347cbdc8`:

- 360 px catalog first/second controls: **154 px x-axis delta** — RED; desired one phone column is <8 px delta.
- 360 px movement first/second controls: **154 px x-axis delta** — RED.
- 360 px document-level horizontal overflow: **PASS / none detected** — do not claim this as a production defect.
- three representative delete actions: each approximately **19.125 × 24.797 CSS px** — RED versus 44×44 minimum.
- 1024 px catalog density: PASS; first/second controls remain on separate columns as intended.
- representative mocked stock/history rows were used only for deterministic layout evidence; they are not production inventory.

The RED is therefore bounded to phone form composition and delete touch targets. Table/page containment already passes the document-overflow assertion; implementation should preserve that rather than invent a new failure.

## Implementation seam

Prefer page-local responsive classes/wrappers only:

- one-column phone form grids with larger-breakpoint density preserved;
- page-local table containment/recomposition;
- page-local 44 px delete-action treatment using existing tokens/classes/components where possible.

No shared primitive rewrite.

## Verification

Run and record:

- focused `chemical-mobile.spec.ts` with `--retries=0`;
- representative Pixel 7/mobile-touch project/context;
- relevant route/auth smoke;
- full Vitest;
- production build/typecheck;
- lint;
- full Playwright when production implementation is complete;
- `git diff --check`;
- rendered inspection/screenshots at 360, 390/430, 768, and 1024 where practical.

If tests expose a data/query/schema defect rather than a responsive/interaction defect, STOP that subproblem as `DECISION_REQUIRED` or create a separate bounded remediation WO; do not silently broaden this slice.

## Completion gate

Stop implementation at `REVIEW_REQUESTED` with exact HEAD, changed paths, RED/GREEN evidence, visual evidence, commands/results, residual risks, and data-contract findings in `docs/ai/handoffs/ENV-MOBILE-002-SOL.md`. The implementation owner must not merge its own code-changing PR.
