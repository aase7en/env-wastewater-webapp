# ENV-MOBILE-002 — Chemical Mobile Convergence Handoff

Status: REVIEW_REQUESTED
Date: 2026-08-28
Owner: GPT-5.6 Sol (user-authorized GLM-5.3 limit fallback)
Independent reviewer / merge owner: fresh reviewer context

## Repository checkpoint

- Repo/worktree: `A:\GitHub\envww-review-mobile-001`
- Branch: `feat/env-mobile-002-chemical`
- Base: `origin/main@cca5a05d640c8262e0ef102d6fb9826f6f297553`
- Activation checkpoint: `c6ea6a873b03137e30ffe2fb1c70b7db347cbdc8`
- RED checkpoint: `813fbcda6c65617455279eaf3dd5d356772c8f33`
- Production + focused regression checkpoint: `7b1baef8e70f3081fbc6e5088fdfac57c7341d92`
- Protected untracked state: `.serena/` untouched.

## Goal

Make the Chemical sub-store workflow practical on 360–430 px phones while preserving current Supabase data/query/business semantics and desktop usefulness.

## Source reality / boundaries

- Actual ENV_DB schema snapshot + migrations confirm `chemical.master` and extended `chemical.movement`; the older A-Wiki note calling `chemical.master` pending is stale.
- `frontend/src/lib/chemical.ts`, schema/RLS/migrations/triggers, shared UI/AppShell/ModuleDock, Carbon semantics, other forms, Digital Twin, and A-Wiki were not edited.
- Separate finding, not changed in this WO: movement `quantity` initializes to `0` and DB has no positive-quantity CHECK. This is a business/data-contract decision, not a responsive-layout fix.

## RED baseline

Measured against unmodified ChemicalPage:

- 360 px catalog first/second control x-delta: **154 px** (RED; two columns on phone).
- 360 px movement first/second control x-delta: **154 px** (RED).
- Representative delete actions: approximately **19.125 × 24.797 CSS px** (RED vs 44×44 minimum).
- Document-level horizontal overflow: PASS / none detected; not claimed as a defect.
- 1024 px multi-column density: PASS.

## Production change

Only `frontend/src/pages/ChemicalPage.tsx`:

- catalog and movement grids: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`;
- stock table contained in a local `overflow-x-auto` wrapper with bounded minimum table width;
- history table contained in a local `overflow-x-auto` wrapper with bounded minimum table width;
- delete actions use existing `--touch-min` for at least 44×44 targets.

No field names, values, defaults, payloads, queries, database constraints, balance semantics, or realtime/manual semantics changed.

## Regression coverage

`frontend/tests/e2e/chemical-mobile.spec.ts` proves:

- 360 px one-column catalog + movement composition and no document overflow;
- add/save/delete targets meet 44 px minimum;
- 390 and 430 px remain phone one-column layouts;
- 768 and 1024 preserve useful multi-column density;
- stock/history own their horizontal scroll locally without page overflow;
- deterministic first movement-save error preserves entered values; retry succeeds with the same payload values;
- Pixel 7 mobile/touch emulation can add a catalog item and record a movement;
- deterministic screenshots at 360/390/430/768/1024 under ignored `frontend/test-results/`.

## Verification evidence

- Focused Chemical Playwright: **7/7 PASS**, `--workers=1 --retries=0`.
- Full Playwright: **66/66 PASS** using 2 workers; log: ignored `frontend/test-results/env-mobile-002-full.log`.
- Relevant auth/module route smoke: PASS.
- Vitest with non-secret test Supabase profile: **202/202 PASS**.
- TypeScript typecheck: PASS.
- Production build: PASS.
- Lint: **12 pre-existing warnings / 0 errors**.
- `git diff --check`: PASS.
- TypeScript diagnostics for `ChemicalPage.tsx`: none.

Initial full Vitest attempt without local `VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY` produced 2 environment-only module-load failures; rerun with the established non-secret test profile passed 202/202. No product/test assertion failed in that environment incident.

## Residual risks / follow-ups

1. `quantity=0` acceptance remains a separate business-rule/data-contract question; do not silently fold it into mobile convergence.
2. Tables intentionally retain local horizontal scrolling on phone rather than inventing a card schema/recomposition in this bounded slice.
3. Toast error semantics remain existing shared behavior (`role=status`); this WO verifies error visibility/value preservation but does not rewrite shared toast accessibility.

## Stop gate

Implementation owner stops at `REVIEW_REQUESTED`. Fresh reviewer must inspect the exact pushed PR diff/SHA, rerun or inspect applicable evidence, verify CI, and own merge. Any code-changing push invalidates this handoff evidence and requires fresh verification.
