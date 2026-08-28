# ENV-MOBILE-005 - Garden Mobile Convergence

Status: IMPLEMENTING
Owner: GPT-5.6 Sol
Independent reviewer / merge owner: fresh reviewer context after implementation stops
Parent roadmap: `ENV-MOBILE-002+` Domain form convergence

## Goal

Make the existing Garden / landscaping work-round workflow practical on 360-430 px phones while preserving the current Supabase payload/query/schema, carbon-feed semantics, null behavior, and useful tablet/desktop density.

## Exact start boundary

- Repo/worktree: `A:\GitHub\envww-review-mobile-001`
- Branch: `feat/env-mobile-005-garden`
- Base: `origin/main@19eb31ff725e746a1e5856db5c9e86badd1c725b`
- Route: `/garden`
- Existing page: `frontend/src/pages/GardenPage.tsx`
- Existing data layer: `frontend/src/lib/garden.ts` - read-only for this WO
- Existing module WO: `docs/work-orders/MOD-GA-garden.md` - historical/read-only
- Protected unknown state: `.serena/` - do not touch

## Source-reality audit

Verified before activation:

- `GardenPage.tsx` uses `grid grid-cols-2 md:grid-cols-4`, so phone widths receive two dense controls per row.
- Nine visible form controls are rendered through sibling `Field` labels with no `htmlFor`/control `id`; semantic label association is not currently established.
- Delete is a plain text button; phone touch-target size is not yet proven.
- History is a raw table; document/table containment must be measured before adding wrappers.
- No dedicated Garden Playwright spec exists.
- Actual ENV schema contains the implemented extended fields (`duration_hours`, `equipment_used`, `waste_collected_kg`, `photo_path`). A-Wiki's statement that MOD-GA-a is pending is stale; actual ENV repo/schema is authoritative.
- `work_type`, `equipment_used`, and `note` are schema text fields. Do not invent enum restrictions or automatic values in this responsive WO.
- `location_id` and `photo_path` exist in `GardenInput` but have no current page controls and initialize to null. Preserve this exact payload contract; do not invent location/photo UI in this slice.
- `fuel_used_l` is part of the existing Scope 1 carbon feed. Do not alter conversion/source semantics.

## Owned files

May edit only:

- `frontend/src/pages/GardenPage.tsx`
- `frontend/tests/e2e/garden-mobile.spec.ts`
- this work order
- `docs/ai/handoffs/ENV-MOBILE-005-SOL.md`
- `MIGRATION.md` only for this claim row
- `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, `docs/ai/ROADMAP.md`, `docs/ai/graph/PROJECT-GRAPH.md` only for bounded Garden status/closure

No-touch without a separate decision/work order:

- `frontend/src/lib/garden.ts`
- schema/RLS/migrations/carbon calculations or views
- `frontend/src/App.tsx`
- shared Input/Button/UI primitives/styles/AppShell/ModuleDock
- Garbage or any other module page
- A-Wiki repository
- `.serena/`

## Mobile contract - 360-430 px

1. Primary Garden controls render one control per row at phone width; useful multi-column density returns at larger breakpoints.
2. No settled document-level horizontal overflow.
3. History content remains contained; add a local table wrapper only if baseline proves it is needed.
4. Save/delete controls used in the workflow meet the project 44 px touch minimum.
5. All visible Garden form controls have programmatic label associations and stable page-local IDs.
6. Keyboard users can traverse the Garden controls and activate Save without pointer input.
7. First mocked save failure preserves entered values; retry sends the same complete null-aware `GardenInput` payload and succeeds.
8. Pixel-class real touch emulation completes a representative synthetic save path.

## Tablet / desktop contract

- Preserve useful form density at 768 and 1024 px.
- History remains readable and actions reachable.
- Do not degrade larger-screen information density to solve phone layout.

## Baseline / RED plan

Before production edit, add the smallest deterministic Garden E2E coverage and measure:

- 360 px first/second control x-axis delta;
- document-level overflow with a representative synthetic history row;
- delete target dimensions;
- semantic `getByLabel()` association count;
- 1024 px density.

Record conditions that already pass; do not manufacture RED.


## Baseline evidence - 2026-08-28

Focused Garden baseline at exact activation head `1fce5132f7e667f9324a1ff0eca9110c73d9f2f1`, retries 0, worker 1: **2 PASS / 3 RED**.

- 360 px first/second control x-delta: **154 px** - RED versus one phone column.
- Delete target width: **19.125 px** - RED versus 44 px minimum (width failure alone is sufficient to fail the touch contract).
- Semantic `getByLabel("date")` equivalent for the visible Thai date label resolves **0 controls** - RED. Source markup confirms the same missing `htmlFor`/`id` pattern for all nine visible controls.
- History table/document containment at 360 px: **PASS**. Do not add a table wrapper solely by assumption.
- 1024 px multi-column density: **PASS**. Preserve it.

No production file was changed to obtain this RED/baseline.

## Implementation seam

Prefer page-local changes only: responsive grid classes, page-local IDs/`htmlFor`, and page-local 44 px delete-action treatment. Do not rewrite shared primitives or the Garden data layer.

## Verification

Run and record:

- focused `garden-mobile.spec.ts` with retries 0;
- Pixel 7 / representative touch context;
- save-error/retry payload equality;
- keyboard/focus path;
- route/auth smoke;
- full Vitest;
- typecheck + production build;
- lint;
- full Playwright;
- `git diff --check`;
- rendered inspection/screenshots at 360, 390/430, 768, 1024 where practical.

If tests expose a data/query/schema/carbon defect, stop that subproblem and route it to a separate Core Engineering work order. Do not silently broaden this mobile slice.

## Completion gate

Implementation owner stops at `REVIEW_REQUESTED`. Fresh reviewer must inspect exact pushed PR head/diff, rerun focused evidence, verify exact-head CI, and own approval/merge. After merge/deploy/live verification, close the lane in a docs-only checkpoint before activating Garbage.
