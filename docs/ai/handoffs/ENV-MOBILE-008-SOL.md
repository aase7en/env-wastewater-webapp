# ENV-MOBILE-008-FOOD — Implementation / Review Handoff

Status: REVIEW_REQUESTED
Date: 2026-09-02
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-008-food`
Branch: `feat/env-mobile-008-food`
Base / activation SHA: `origin/main@b05a25e182ddd648414f2d1d35be79ef67776e15`
Owner: GPT-5.6 Sol via Serena visual fallback. Implementer does not self-merge.

## Objective

Converge `/food` for 360–430 px field use while preserving the live-verified FOOD-CORE-001 contract and useful 768/1024 density.

## Dependency / ownership gate

- `FOOD-CORE-001` is CLOSED / MERGED / LIVE VERIFIED.
- GLM ENV-INT research is read-only to ENV and does not overlap this writer.
- Mutable production scope is page-local: `frontend/src/pages/FoodPage.tsx` plus new `frontend/tests/e2e/food-mobile.spec.ts`.
- Food lib/import/schema/RLS/reagent trigger, shared UI/AppShell/ModuleDock, Building/Safety/other domains and `.serena/**` are no-touch.
- No real environmental/application writes are permitted in tests; REST must be mocked/synthetic.

## RED contract

Focused Food Playwright measures:

- one-column phone composition at 360/390/430;
- 9 stable id/programmatic-label pairs;
- >=44 px Save/Delete;
- local history containment + named keyboard-reachable scroll if needed;
- tablet/desktop density;
- failed-save value preservation + exact retry body;
- canonical `sample_type` / `test_type`, no `reagent_used`;
- required sample date zero-POST/error/focus recovery;
- keyboard traversal and Pixel-class touch path.

## RED / GREEN evidence

- Baseline at activation SHA `b05a25e182ddd648414f2d1d35be79ef67776e15`: **6 FAIL / 3 PASS**. Failures were phone x-delta 154 px, 0/9 labels, Delete width 19.125 px, history boundary right 415.90625 px vs card right 344 px (document width alone false-green), blank required date issuing 1 POST, and keyboard traversal blocked by missing labels. Tablet/desktop density, exact retry payload/no `reagent_used`, and Pixel touch payload semantics were already green.
- Repair stayed page-local: 9 ids/labels, phone one-column composition with larger-screen density restored, local required-date zero-POST/error/focus recovery, >=44 px Delete, and named/focusable local history horizontal-scroll region.
- Focused Playwright: **9/9 PASS**, `--workers=1 --retries=0`, covering 360/390/430/768/1024 and Pixel-class touch.
- TypeScript PASS; full Vitest **248/248 PASS**; lint **12 pre-existing warnings / 0 errors**; `git diff --check` PASS.
- Post-edit production build is **PASS** (`tsc -b && vite build`, 3305 modules transformed). Earlier Serena Workers 2–4 transport-blocked the build rerun; Worker 5 later completed it successfully. Full Playwright attempts through Worker 5 and fresh Worker 1 both returned connector/upstream HTTP 502 before any test result. Classified `TOOL/TRANSPORT_FAILURE`, not app/E2E failure; exact-head GitHub CI/Pages/full E2E remain mandatory release authority.
- Food Core/import/schema/RLS/reagent trigger/shared UI were not modified; all Food REST in tests remained mocked/synthetic and no real writes occurred.

## One next safe action

Explicitly stage only the bounded Food implementation/test/SSoT files, commit/push, freeze exact PR head, audit actual remote diff, obtain independent exact-SHA Standards + Spec/UX review, and require exact-head GitHub CI/Pages/full E2E before merge. Implementer does not self-merge.
