Status: REVIEW_REQUESTED
Owner: GPT-5.6 Sol (user-directed continuation while GLM is unavailable)
Independent reviewer / merge owner: fresh reviewer context after implementation stops
Parent roadmap: `ENV-MOBILE-002+` Domain form convergence

## Goal

Make the existing Water Supply / groundwater quality workflow practical at 360–430 px phones while preserving the current Supabase data/query/business semantics and useful tablet/desktop density.

## Exact start boundary

- Repo/worktree: `A:\GitHub\envww-review-mobile-001`
- Branch: `feat/env-mobile-003-water-supply`
- Base: `origin/main@2e70c81b54dc20809c37dbe7a4d6a0e973172d11`
- Route: `/water-supply`
- Existing page: `frontend/src/pages/WaterSupplyPage.tsx`
- Existing data layer: `frontend/src/lib/water-supply.ts` — read-only for this WO
- Historical module WO: `docs/work-orders/MOD-WS-water-supply.md` — read-only
- Protected unknown state: `.serena/` — do not touch

Before production mutation: verify fresh main ancestry, no overlapping writer/PR, establish deterministic phone-width RED/baseline, then update this gate to READY_FOR_IMPLEMENTATION only if the failure is real.

## Source-reality audit

Verified 2026-08-28:

- `WaterSupplyPage.tsx` currently uses `grid grid-cols-2 md:grid-cols-4` for the data-entry form, so phone widths receive two controls per row.
- The recent-records table already has a page-local `overflow-x-auto` wrapper; table/document containment must be measured rather than assumed broken.
- Delete actions are plain text buttons; phone touch-target dimensions are not yet proven.
- No dedicated Water Supply Playwright spec exists.
- `reports/schema-snapshot-live.md` confirms the implemented `water_supply.daily_check` fields (`ph`, free chlorine residual, turbidity, total/fecal coliform, iron, manganese, hardness, TDS). Its 0-row count is historical snapshot evidence only, not a statement of current production records.
- Companion A-Wiki still labels MOD-WS-a column extension as pending. Actual ENV repo migrations/live schema are authoritative; updating A-Wiki is outside this WO.
- No threshold/compliance business rules will be added from A-Wiki text in this mobile slice. A-Wiki limits are domain context, not authorization to create production validation or alert semantics.

## Owned files

May edit only:

- `frontend/src/pages/WaterSupplyPage.tsx`
- `frontend/tests/e2e/water-supply-mobile.spec.ts`
- this work order
- `docs/ai/handoffs/ENV-MOBILE-003-SOL.md`
- `MIGRATION.md` only for this claim row
- `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, `docs/ai/ROADMAP.md`, `docs/ai/graph/PROJECT-GRAPH.md` only for bounded status/closure records

No-touch without a new decision/work order:

- `frontend/src/lib/water-supply.ts`
- `frontend/src/App.tsx`
- shared UI primitives/styles/AppShell/ModuleDock
- DB schema/RLS/migrations
- thresholds/compliance rules
- other domain forms
- Digital Twin
- A-Wiki repository

## Mobile contract — 360–430 px

1. Entry fields must not force half-width dense controls; primary fields render one control per row on phone widths.
2. No document-level horizontal overflow.
3. Existing recent-record table must remain contained; if horizontal scroll is required it must be local/intentional.
4. Save/delete targets used by the workflow must meet the project 44 px touch minimum.
5. Entered values must survive deterministic mocked save failure and retry.
6. Existing payload names/types/null semantics remain unchanged; do not fabricate readings, thresholds, location mappings, or derived compliance states.
7. Real touch emulation must exercise representative save behavior.

## Tablet / desktop contract

- Preserve useful multi-column density at 768 and 1024 px.
- Recent records remain readable and delete action reachable.

## Baseline / RED plan

Before production edit, create the smallest deterministic E2E spec with existing auth/network fixtures and measure:

- 360 px first/second form-field x delta;
- document-level overflow;
- local table containment with representative mocked rows;
- save/delete target dimensions;
- 1024 px multi-column density.

Do not fabricate a RED condition that already passes.

## Baseline evidence — 2026-08-28

Measured against unchanged `WaterSupplyPage.tsx` at branch base `2e70c81b54dc20809c37dbe7a4d6a0e973172d11` with deterministic mocked rows:

- 360 px first/second form controls: **154 px x-axis delta** — RED; desired phone one-column composition is <8 px.
- Delete action: approximately **19.125 × 24.797 CSS px** — RED versus project 44×44 minimum.
- Document-level horizontal overflow at 360 px: **PASS / none detected**.
- Existing recent-record table wrapper containment: **PASS**; do not invent a table-overflow defect.
- 1024 px multi-column density: **PASS**.

Implementation is therefore bounded to the phone form grid and delete touch target. Existing table markup remains unchanged unless a later test demonstrates a real defect.

## Verification

Run and record:

- focused `water-supply-mobile.spec.ts` with `--retries=0`;
- 360, 390/430, 768, 1024 rendered evidence;
- Pixel 7 mobile-touch path;
- deterministic save failure + retry/value preservation;
- route/auth smoke;
- full Vitest with non-secret test Supabase profile;
- typecheck/build;
- lint;
- full Playwright after implementation;
- `git diff --check`;
- independent exact-head review + CI + merge + deployment/live smoke.

## Implementation / verification evidence — 2026-08-28

Production checkpoint: `66e86dcb515d411b9e6b858ae89a4109f5ac3bc3`.

Implemented only the bounded page-local seam: phone one-column form grid plus 44px delete target. Existing table/data/query/schema/compliance behavior was preserved.

GREEN evidence: focused Water Supply Playwright 7/7 PASS; full Playwright 73/73 PASS; Vitest 202/202 PASS; typecheck/build PASS; lint 12 baseline warnings / 0 errors; route smoke + diff-check PASS; Pixel 7 touch path PASS; screenshots at 360/390/430/768/1024; deterministic save failure preserves values and retry sends unchanged field semantics.

Evidence packet: `docs/ai/handoffs/ENV-MOBILE-003-SOL.md`.

## Completion gate

Implementation stops at `REVIEW_REQUESTED`. Fresh reviewer must inspect the exact pushed PR head/diff and own approval/merge. Any code-changing push invalidates the evidence above. After merge/deploy/live verification, close the lane in a docs-only checkpoint before activating Fuel.
