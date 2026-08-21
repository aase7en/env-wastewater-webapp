# HANDOFF

Status: APPROVED

## Task

`WO-STAB-004` — prevent React Query background/window-focus refetch from overwriting unsaved user edits in the wastewater Daily Form (P0 data-integrity, finding #4 of `reports/code-review-2026-08-12.md`). **CI remediation round** for PR #11 after CHANGES_REQUIRED.

## Reviewer Approval

GPT 5.6 Sol UltraMAX returned **PASS** on 2026-08-21. PR #11 was merged into `main` as `f48dcd76d14010b17f0f6bdd35ad111201a24a27`.

- Root cause and the final workflow behavior were independently verified from repository state.
- CI runs `32440011145` (`66c97d2`) and `32440235796` (`ac8a87a`) both passed 32/32; the 32-test discovery set includes `daily-form-dirty.spec.ts`, proving the regression was not skipped.
- Reviewer-local production build passed, Vitest passed 148/148, and `git diff --check` passed.
- No assertions, application code, Digital Twin files, or global React Query focus settings changed during remediation.
- The dev-server CI profile limitation is accepted for this work order; production-preview E2E remains deferred.

## Root Cause of the local-vs-CI discrepancy

The CI workflow's "Run smoke tests" step pointed `E2E_BASE_URL` at the **deployed GitHub Pages site (main)**. `playwright.config.ts` disables its `webServer` whenever `E2E_BASE_URL` is set — so the PR's own `dist/`, compiled one step earlier in the same job, was **never exercised**. The new regression asserts behavior that only exists in this PR's build, so CI failed by construction (it received main's overwrite: `2026-08-01`) while local runs passed (the local `npm run e2e` boots the branch via the dev webServer). Structurally, that CI profile could never catch any pre-merge behavior regression — it always tested the previous deploy.

## Remediation (production code unchanged)

- `0b7cd14` — first attempt: serve the job's `dist/` via `vite preview` and run the suite against it. The CI job produced repeated auth-gated suite failures (protected routes never bounced — RequireAuth stuck loading) before the follow-up push cancelled the run. This dragged service-worker / base-path / prod-build variables into an auth-gated suite — out of this WO's scope.
- `66c97d2` — final fix: **run the suite via Playwright's own webServer** (`E2E_BASE_URL` unset → config boots vite dev from the checked-out branch, `CI=true` forces a fresh server, VITE_* secrets passed to the step). This is the exact profile the regression was written and verified against; the PR's code is what runs. Prod build remains gated by the separate Build step; post-deploy prod smoke stays covered by `deploy-frontend.yml`'s own smoke-test step.
- The gate implementation, unit tests, and the e2e regression itself are **unchanged** from the reviewed checkpoint `f561654` — no assertion weakened, the changed-server snapshot and the reconnect refetch path are intact.

## Files Added

- (unchanged from first round) `frontend/src/lib/form-hydration.ts`, `frontend/src/lib/form-hydration.test.ts`, `frontend/tests/e2e/daily-form-dirty.spec.ts`

## Files Modified

- `frontend/src/pages/DailyFormPage.tsx` (gate wiring — unchanged this round)
- `.github/workflows/e2e.yml` (the remediation — run step only)

## Files Deleted

- None.

## Important Decisions

- CI now tests the PR branch code (dev webServer profile) instead of the deployed main build. This closes the structural blind spot: CI previously could not catch pre-merge behavior regressions at all.
- The vite-preview variant was attempted and reverted-with-reason (commit `0b7cd14` remains in history for the audit trail) — making an auth-gated suite pass under prod-build+preview is a separate concern, not this WO.

## UX Changes

- None new (first-round fix unchanged: edits persist through background refetches).

## Visual / 3D Changes

- None. No Digital Twin files touched.

## Tests

### Commands

From `frontend/`: `npm run lint`, `npm run build`, `npm test -- --run`, `npm run e2e`; from repo root: `git diff --check`. CI: GitHub Actions run on PR #11.

### Results

- Local (branch): lint **12w+3e = documented baseline** · build pass · Vitest **148/148** · Playwright **32/32** · `git diff --check` clean (from the first round; remediation changed no app code).
- **GitHub Actions (decisive gate this round): run 32440011145 — `E2E smoke tests / smoke` PASS, 32/32 in 1m59s**, including the previously-failing regression. PR checks: smoke ✓ · scripts ✓ · notify ✓.
- Reviewer verification: current-head run `32440235796` also passed 32/32; local production build passed; Vitest passed 148/148; `git diff --check` clean.

## Known Issues

- CI exercises the dev-server profile of the PR code, not a served production bundle (see Important Decisions; prod-build preview under the auth-gated suite is flagged as follow-up territory).
- E2E gate test ~35s (staleTime wait by design).

## Deferred Work

- Prod-build/preview (or preview-equivalent) CI profile for the full auth-gated suite — separate WO if wanted.
- Out-of-scope stabilization items per CURRENT-WORK (ErrorBoundary remount P0, P1 findings, annotateRow policy).

## Risks

- Low. No production code changed in this round; CI now tests what the WO claims.

## Branch

Merged from `fix/p0-form-dirty-gate` into `main` via PR #11.

## Exact HEAD

Implementation checkpoint: `66c97d2` (CI run `32440011145`). Approved PR head: `ac8a87a` (CI run `32440235796`). Merge commit: `f48dcd76d14010b17f0f6bdd35ad111201a24a27`.

## Review Result

- **PASS** — remediation meets the WO acceptance criteria and the release-blocking CI mismatch is resolved.
- Evidence clarification: `git show 66c97d2` is workflow-only. The broader literal range `f561654..66c97d2` also contains earlier coordination-document changes, but no production or test changes.

## Next Action

WO-STAB-004 is complete. The next production work order should address the remaining P0: ErrorBoundary/AuthProvider remount behavior.
