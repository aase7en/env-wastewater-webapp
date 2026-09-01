# ENV-MOBILE-006-GARBAGE — Implementation / Review Handoff

Status: REVIEW_REQUESTED
Date: 2026-09-01
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-006-garbage`
Branch: `feat/env-mobile-006-garbage`
Base: `origin/main@b165a7209a4fa2a14f2471e3b0cdf36f9a806e25`
Activation SHA: `02eb11828a2326048e2c04f008cb7293aac43855`
Review SHA: resolve from the actual pushed remote branch/PR head after freeze; any head change invalidates the review.

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

## Independent review contract

Reviewer must independently inspect the actual diff and work order at the exact pushed branch/PR head. Review separately:

1. **Standards** — repository rules, scope, accessibility/test quality, maintainability.
2. **Spec/UX** — all mobile/tablet/desktop acceptance criteria, failure/retry behavior, canonical payload preservation, no scope creep.

Return `APPROVED`, `CHANGES_REQUIRED`, or `BLOCKED` bound to the exact reviewed SHA. Do not merge.

## One next safe action

Freeze/push the branch, resolve the exact remote head SHA, then perform independent exact-SHA review before PR merge readiness.
