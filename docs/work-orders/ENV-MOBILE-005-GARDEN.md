# ENV-MOBILE-005 - Garden Mobile Convergence

Status: COMPLETE / MERGED / DEPLOYED / PRODUCTION-SMOKED
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

## Implementation / verification evidence - 2026-08-28

Production checkpoint: `356334641fb15b5c399579dc7cde9f5640cdbb90`.

Implemented only the page-local responsive/accessibility/touch seam: one-column phone grid with `sm`/`md` density restoration, stable ID/`htmlFor` associations for all 9 controls, and the existing 44px touch minimum on delete. History containment was already green and was not rewritten.

Verification: focused Garden **9/9 PASS**; full Playwright **92/92 PASS**; Vitest **202/202 PASS**; typecheck PASS; build PASS; lint **12 baseline warnings / 0 errors**; targeted Garden lint 0/0; diff-check PASS; 360/390/430/768/1024 + Pixel 7 + keyboard/Enter + save-error/retry equality covered.

No Garden data/query/schema/RLS/carbon/shared primitive semantics changed. All E2E data is synthetic.

## Independent review / remediation evidence - 2026-08-29

The exact original PR head `39f25a92c0bbd10365c618c4477d4cca34f52f1f` received `CHANGES_REQUIRED` in review `PRR_kwDOTN3Mzc8AAAABLSqMwQ` for two reproducible defects:

- the document-level overflow assertion was false-green because AppShell hid overflow while the history table/delete action escaped its Garden card at 320/360 px;
- `garden.work_round.round_date` is `NOT NULL`, but a cleared date could still submit `round_date: ""` with no page-local required state, persistent associated error, or focus recovery.

Four new assertions failed before production remediation (**4 FAIL / 8 PASS**). Remediation checkpoint `e137cd468f628961dcfb697f0470cb3da76062bd` adds only a named, focusable local history scroll region with keyboard ArrowRight reachability and a page-local required-date guard/error/focus path. It does not change the Garden API payload shape or data layer.

Fresh verification: focused Garden **12/12 PASS**; full Playwright **95/95 PASS**; Vitest **202/202 PASS**; standalone typecheck PASS; production build PASS; lint **12 baseline warnings / 0 errors**; targeted Garden lint 0/0; `git diff --check` PASS. REST is fully mocked in Garden E2E and no real writes occur.

## Final review / merge / production closure - 2026-08-29

- Fresh Standards + Spec/UX review APPROVED exact final head `327ae8b541f3e29f5727acc7edb3ed76b12f20bc`; approval record `5055767858`; focused reviewer Garden **12/12 PASS**.
- Exact-head test `33219010216` and E2E `33219010234` succeeded; full CI Playwright was **95/95** and the tested synthetic-merge tree was identical to the reviewed head.
- PR #48 merged as `001ef532b1203b3bd2def7c28bdd6845a948dec8`.
- Exact merge-SHA test `33219682337`, E2E `33219682275` (**95/95**), and Pages `33219682308` succeeded; deployment `6150037544` reports success for the exact merge SHA.
- Live 390x844 root-to-client Pages smoke loaded deployed asset `assets/index-BIvntuDt.js` and found the new error/field/history markers. It verified 9/9 label associations, local history containment + keyboard ArrowRight reachability, Save 71.89x48, Delete 44x44, blank-date zero POST + persistent associated error/focus/value preservation, one corrected intercepted POST, document/body width 390, and zero browser errors. Every REST request was intercepted; no real write occurred.
- Direct deep-link production execution showed a first-frame 365px document at a 360px viewport during the GitHub Pages HTTP-404-to-SPA transition, then settled to 360 within 25 ms. The stable root-to-client path did not reproduce it; this remains a separately routed hosting/test-timing observation.

Garden data/query/schema/RLS/carbon/shared-shell semantics remain unchanged. The lane is closed.

## Completion gate

Satisfied. Any future Garden change requires a new bounded work order/claim. Garbage may proceed only after its separate Core data-contract audit resolves the routed classification/carbon semantics.
