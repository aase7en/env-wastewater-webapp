# ENV-MOBILE-006-GARBAGE — Implementation / Review Handoff

Status: CLOSED
Date: 2026-09-01
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-006-garbage`
Branch: `feat/env-mobile-006-garbage`
Base: `origin/main@b165a7209a4fa2a14f2471e3b0cdf36f9a806e25`
Activation SHA: `02eb11828a2326048e2c04f008cb7293aac43855`
Reviewed SHA: `e723d07359ebd8c1ddb7fed772c083ee1b0e32db`; PR #63 merge: `c975291c59e9c462120948af60c7ae04d5b2fbeb`.

## Objective

Make `/garbage` practical and accessible at 360–430 px while preserving the already-live `GARBAGE-CORE-001` canonical classification/data/carbon contract.

## Allowed mutable scope

- `frontend/src/pages/GarbagePage.tsx`
- `frontend/tests/e2e/garbage-mobile.spec.ts`
- `docs/work-orders/ENV-MOBILE-006-GARBAGE.md`
- this handoff
- bounded CURRENT-WORK/HANDOFF/ROADMAP/PROJECT-GRAPH status records

No-touch: Garbage lib/import adapter, schema/RLS/carbon/factors, shared UI/AppShell/styles, other modules, `.serena/**`, real environmental data.

## RED / baseline

Against unchanged activation head:

- 360px first/second control x-delta: **154px** — RED.
- semantic label associations: **0/9** — RED.
- Delete: **19.125 × 24.797px** — RED versus 44px minimum.
- blank date: **1 POST**, no persistent associated error, no focus recovery — RED.
- 1024px density x-delta: **235px** — already green.
- initial history/document containment with baseline row: already green.

## Implementation

Page-local only:

- phone form becomes one column; density returns at `sm`/`md` breakpoints;
- all 9 visible controls receive stable IDs and programmatic labels;
- required date blocks locally with zero POST, persistent associated error, and focus recovery;
- Delete receives 44px minimum touch target;
- save error/retry preserves values and exact canonical `GarbageInput` body;
- `segregation_type` remains the only classification write; `waste_type` is absent from request bodies;
- enlarging Delete exposed a representative history-card containment regression, so a named/focusable local horizontal-scroll region with ArrowRight keyboard reachability was added as the smallest repair.

## Verification

- focused Garbage Playwright: **9/9 PASS**, retries 0, worker 1;
- Pixel-class touch save: PASS;
- save-error/retry body equality + canonical payload: PASS;
- blank-date zero POST/error/focus: PASS;
- 360/390/430/768/1024 coverage: PASS;
- Vitest: **229/229 PASS**;
- standalone TypeScript: PASS;
- lint: **12 pre-existing warnings / 0 errors**;
- production build: PASS;
- full Playwright: **105/105 PASS**;
- `git diff --check`: PASS.

Fresh-worktree missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` was classified as ENVIRONMENT_FAILURE. Tests were rerun with process-only values loaded from existing secure local configuration; secrets were not copied or printed. Worker 502/timeouts were TRANSPORT_FAILURE; artifact/process inspection confirmed full Playwright passed with no failed tests and no port-5173 listener left behind.

No real environmental writes were used.

## Independent review / release closure

- External GLM-5.3 MAX independently APPROVED exact SHA `e723d07359ebd8c1ddb7fed772c083ee1b0e32db`: Standards PASS, Spec/UX PASS, no blockers. Independent commands included focused Garbage Playwright 9/9, Vitest 229/229, TypeScript, lint, build, full Playwright 105/105, diff/scope and remote-head checks.
- PR #63 merged with expected-head guard as `c975291c59e9c462120948af60c7ae04d5b2fbeb`; reviewed-head ancestry is verified.
- Exact-main runs: `test` `33496925087`, E2E smoke `33496925046`, Pages `33496925085` — all SUCCESS. GitHub Pages deployment `6199171927` is SUCCESS for the exact merge SHA.
- Live root-to-client Pages probes at 360x844 and 390x844 passed: document width equals viewport, 9/9 labels, Save/Delete >=44px, no browser errors; all REST mocked/no real writes.
- Direct `/garbage` deep-link showed the known Pages/shared-ModuleDock settling condition: document 365px at 360px while the 404-to-SPA handoff settles, then 360px within about 250ms. Garbage content was not the offender and stable root-to-client navigation remained clean.
- No Core/import/schema/RLS/carbon/factor/shared-shell semantics changed; canonical `segregation_type`-only writes remain intact.

## One next safe action

Audit Food / Safety / Building read-only on current main and activate exactly one bounded next mobile WO based on operational frequency/control density and source/data-contract risk.
