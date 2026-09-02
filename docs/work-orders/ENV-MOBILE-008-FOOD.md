# ENV-MOBILE-008 — Food Mobile Convergence

Status: CLOSED
Owner / implementer: GPT-5.6 Sol via Serena visual fallback
Independent review owner: external GLM-5.3 MAX or fresh independent reviewer; review must bind to the exact pushed head
Parent roadmap: `ENV-MOBILE-002+` Domain form convergence
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-008-food`
Branch: `feat/env-mobile-008-food`
Base: `origin/main@b05a25e182ddd648414f2d1d35be79ef67776e15`
Last updated: 2026-09-02

## Goal

Make `/food` practical, accessible, and truthful for 360–430 px field use while preserving the already live-verified FOOD-CORE-001 contract and useful tablet/desktop density.

## Dependency gate

- `FOOD-CORE-001` is CLOSED / MERGED / LIVE VERIFIED.
- Blank/missing imported `sample_type` / `test_type` stays null; only canonical values are accepted by the import contract.
- `FoodInput` does not expose `reagent_used`; reagent decrement remains deliberately dormant.
- Production canonical CHECK constraints are live and validated.
- No Food Core/import/schema/RLS/reagent-trigger behavior may change in this visual slice.

## Source reality / current page

- Route: `/food`.
- Page: `frontend/src/pages/FoodPage.tsx`.
- Data layer: `frontend/src/lib/food.ts` — read-only in this WO.
- Current form has 9 visible controls before Save: two dates, sample type, sample point, test type, MPN, result, technician, follow-up action.
- Current phone grid is `grid-cols-2 md:grid-cols-4`, so a fresh geometry baseline is required rather than assuming prior domain results.
- Shared `Field` only creates a programmatic association when callers provide `htmlFor` and the control has a matching id.
- `sample_date` is required by the DB contract but the page currently has no local zero-POST required-date recovery.
- History is a six-column table; local containment and action reachability must be measured, not inferred from document width.

## Mutable scope

- `frontend/src/pages/FoodPage.tsx`
- `frontend/tests/e2e/food-mobile.spec.ts` (new)
- this work order
- `docs/ai/handoffs/ENV-MOBILE-008-SOL.md` (new)
- bounded status/claim/closure entries only in:
  - `docs/ai/CURRENT-WORK.md`
  - `docs/ai/HANDOFF.md`
  - `docs/ai/ROADMAP.md`
  - `docs/ai/graph/PROJECT-GRAPH.md`

## Forbidden / read-only scope

- `frontend/src/lib/food.ts`
- `frontend/src/lib/import-adapters/food.ts`
- Food adapter tests / Bulk Import behavior, including ENV-DEFECT-012
- Supabase schema/migrations/RLS
- `food.fn_decrement_reagent`, `trg_decrement_reagent`, `chemical.*`
- shared `Input` / `Field` / `Button` / Aura components
- AppShell / ModuleDock / global styles
- Building / Safety / other modules
- `.serena/**`
- real hospital/environmental/safety data

## RED / baseline contract

Before production edits, focused Playwright must measure at least:

1. 360/390/430: primary fields form one phone column and settled document width does not overflow.
2. All 9 controls have stable ids + programmatic labels.
3. Save and Delete meet >=44x44 px touch target on phone.
4. History stays inside its card/viewport; if horizontal scrolling is required it is a named focusable region and keyboard reachable.
5. 768/1024 retain useful multi-column density.
6. Failed save preserves all entered values and retry sends the exact same complete `FoodInput` body.
7. Payload preserves canonical `sample_type` / `test_type` and never contains `reagent_used`.
8. Blank required `sample_date` produces zero POST, persistent associated error, and focus recovery without clearing other values.
9. Keyboard traversal reaches every field and Save; a real touch profile can save without document overflow.

Baseline failures are evidence, not permission to broaden scope.

## Expected smallest repair

Only after RED:

- give page-local stable ids / `htmlFor` associations;
- recompose the form to one column on phones with larger-screen density restored;
- add a local required-date guard + deterministic associated error/focus recovery;
- make Delete >=44 px;
- add a page-local history scroll boundary only if measured containment requires it;
- preserve exact Food payload semantics and dormant reagent policy.

## Implementation / verification checkpoint — 2026-09-02

- Truthful RED at unchanged activation head: **6 FAIL / 3 PASS**. REDs: phone two-column x-delta **154 px**; 0/9 programmatic label associations; Delete width **19.125 px**; Food history boundary escaped to **415.90625 px** while the owning card ended at 344 px and document width remained false-green; blank required `sample_date` issued **1 POST**; keyboard traversal blocked by the missing label seam. Already-green baseline: tablet/desktop density, failed-save exact retry payload, canonical Food payload with no `reagent_used`, and Pixel-class touch save semantics.
- Page-local repair only: stable ids/`htmlFor` for all 9 controls; one-column phone grid with larger-breakpoint density restored; required `sample_date` zero-POST guard with associated persistent error + focus recovery; Delete >=44 px; named/focusable local history region with horizontal scrolling. Food lib/import/schema/RLS/reagent trigger/shared UI remained untouched.
- Focused Food Playwright after repair: **9/9 PASS**, one worker/retries 0, including 360/390/430/768/1024 and Pixel-class touch.
- Standalone TypeScript: PASS. Full Vitest: **19 files / 248 tests PASS**. Lint: **12 pre-existing warnings / 0 errors**. `git diff --check`: PASS.
- Post-edit production build is **PASS** (`tsc -b && vite build`, 3305 modules transformed). Earlier build retries across Serena Workers 2–4 were transport-blocked; a later Worker 5 retry completed successfully. Full Playwright attempts through Worker 5 and a fresh Worker 1 both returned connector/upstream HTTP 502 before any test result, classified `TOOL/TRANSPORT_FAILURE`, not an E2E failure. Exact-head GitHub CI / Pages build and full E2E remain mandatory release authority before merge.
- No real REST/environmental writes occurred; Food REST in Playwright remained mocked/synthetic.

## Review / release closure — 2026-09-02

- Frozen implementation / PR head: `d894c58611ba455f813d4e8c5698098ebc64f5c4` on PR #68; actual remote diff remained exactly the 8 bounded Food page/test/WO/handoff/SSoT files.
- Fresh detached exact-SHA review APPROVED Standards + Spec/UX with no blockers; review evidence comment `issuecomment-5507086478`.
- Exact-head GitHub test and E2E workflows succeeded. The PR full-E2E run contained one unrelated pre-existing error-boundary navigation retry; Food-focused acceptance remained 9/9 with retries=0.
- Expected-head merge produced `73f76cd42636be0253c0a2e4a9c906d8fe164582`.
- Exact-main test `33611702436` SUCCESS; full E2E `33611702467` **124/124 PASS clean run**; Pages `33611702477` SUCCESS.
- Deployed root→client mocked/synthetic production probe passed at 360/390/430 with document/body width equal to viewport while Food rendered. Direct Pages `/food` deep-link testing separately reproduced the known hosting/shared-shell transition and failed only the document-width assertion while 8/9 Food checks passed; this is tracked as hosting/test-path evidence rather than hidden as a Food regression.
- No real REST/application/environmental writes occurred. Food Core/import/schema/RLS/reagent trigger/shared UI/AppShell/ModuleDock remained unchanged.

## Verification

At minimum:

- focused `food-mobile.spec.ts`, retries 0, one worker;
- representative 360/390/430/768/1024 + Pixel-class touch;
- full Vitest;
- standalone `tsc -b`;
- lint (no new warnings/errors);
- production build;
- full Playwright with mocked/synthetic REST and no real writes;
- `git diff --check` + changed-file audit;
- independent Standards + Spec/UX exact-head review;
- exact-head CI before merge;
- post-merge exact-main test/E2E/Pages + deployed root-to-client mobile smoke with mocked REST/no real writes.

## Stop condition

`CLOSED` only after exact-SHA independent review, expected-head merge, exact-main CI/E2E/Pages, deployed root→client mobile verification, no-real-write audit, and durable SSoT closeout evidence. These gates are now satisfied for ENV-MOBILE-008-FOOD.

## One next safe action

Merge the bounded docs-only Food closeout, fetch/reconcile current `origin/main`, then activate `ENV-CMD-001` only after a fresh SSoT/ownership gate. Building is reserved for the separately running GPT Ultra `ENV-BUILDING-REPAIR-001` campaign; Environmental Intelligence remains a separate GLM lane.
