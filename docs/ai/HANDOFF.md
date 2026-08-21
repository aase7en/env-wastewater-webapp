# HANDOFF

Status: CHANGES_REQUIRED

## Task

`WO-STAB-005` — stop ErrorBoundary from remounting the app subtree on every navigation while keeping the post-crash route-change recovery (P0 #5, `reports/code-review-2026-08-12.md`).

## Implementation Summary

- **Root cause**: `ErrorRouteWatcher` rendered `<div key={location.pathname}>` around `ErrorBoundaryInner > AuthProvider`. A changed key forces React to unmount/remount the subtree — AuthProvider re-ran `getSession()` + `loadAppUser()` on every dock click (skeleton flicker + a fresh `app_user` REST call per navigation).
- **Fix — derived reset instead of remount** (`frontend/src/components/ErrorBoundary.tsx`, only modified production file):
  - The function wrapper reads `useLocation()` and passes `routeKey={location.pathname}` as a prop.
  - `getDerivedStateFromProps` clears an ACTIVE error when `routeKey` changes (escape hatch) and remembers the new route in state (`lastRouteKey`). Healthy navigations only update the remembered key — the subtree stays mounted and AuthProvider survives.
  - The wrapper `<div>` and the `key` trick are deleted entirely.
  - Reset lives in `getDerivedStateFromProps` (pure) rather than `componentDidUpdate`+`setState`: an initial variant using componentDidUpdate tripped `react(no-did-update-set-state)`; instead of suppressing the rule, the logic was refactored to the derived form. Nothing suppressed.

## Files Added

- `frontend/tests/e2e/error-boundary-remount.spec.ts` (2 regression tests)

## Files Modified

- `frontend/src/components/ErrorBoundary.tsx` (+34/−20)

## Files Deleted

- None.

## Important Decisions

- Escape path in test B uses **browser back** (`page.goBack()`): when the tree is crashed the recovery screen is the only rendered output — there is no in-app nav to click, so back/popstate is the real user route-change mechanism.
- Test B triggers a genuine render-phase throw by blocking the lazy `TrendsPage` chunk (route pattern covers both the dev-server module URL and the hashed prod asset).
- Test A measures remounts by counting `app_user` REST calls (AuthProvider's mount effect) across 3 SPA navigations.

## UX Changes

- Visible improvement (no behavior regression): no more skeleton flicker on every navigation; post-crash recovery via route change works as before.

## Visual / 3D Changes

- None. No Digital Twin files touched.

## Tests

### Commands

From `frontend/`: `npm run lint`, `npm run build`, `npm test -- --run`, `npm run e2e`; from repo root: `git diff --check`.

### Results

- Lint: **12 warnings + 3 errors — exactly the documented baseline** (3 transient new hits during development were eliminated by the derived-state refactor + fixture-param rename; nothing suppressed).
- Build: pass.
- Vitest: **148/148**.
- Playwright e2e: **34/34** (32 existing + 2 new).
- `git diff --check`: CLEAN.
- **RED proof** (test A on the old code, via temporary stash): expected 2 `app_user` calls, received **11** — the remount storm captured directly; GREEN (2/2) with the fix.

## Known Issues

- The derived reset clears error state on ANY route change while an error is active (including forward navigation via any external mechanism) — matches the intended semantics.

## Deferred Work

Out of scope per CURRENT-WORK: P1 findings (alert unread count, carbon MoM, role-visibility error UX), `annotateRow` policy, component-test harness.

## Risks

- Low. Single-file production change; both behaviors pinned by regression tests with a captured RED.

## Branch

`fix/p0-error-boundary-remount`

## Exact HEAD

`d11c2a3e6fa9843bd4ff2bad96e6d578c2a44ec8` (implementation checkpoint; doc-only commits sit on top).

## Reviewer Focus

- The `getDerivedStateFromProps` reset semantics in `ErrorBoundary.tsx` (healthy nav = key update only; error + route change = clear).
- Test A's measurement approach (app_user call count) and test B's crash trigger (lazy chunk block) + browser-back escape.

## Reviewer Decision — CHANGES_REQUIRED

The production implementation is accepted in principle; the blocker is the determinism of regression test A.

Reviewer evidence on the PR branch:

- `npm run build`: PASS.
- `npm test`: 148/148 PASS.
- CI run `32453224779`: 34/34 PASS.
- Targeted local spec, normal profile: test A failed twice at `error-boundary-remount.spec.ts:52`; `.dock-item` intercepted the second dock-link pointer click. Test B passed both times.
- Targeted local spec, fresh CI profile: test A failed first attempt and passed on retry, producing `1 flaky`; the process exited green only because CI config permits one retry.

Required fix:

1. Preserve real client-side React Router transitions, but remove pointer hit-testing from this remount regression; do not use full-page `page.goto` for the three post-boot transitions.
2. Assert the URL/path after every transition. The current Thai text markers also exist in the persistent nav and do not prove the destination rendered.
3. Keep the `app_user` boot-count equality assertion intact.
4. Run the focused spec with `--retries=0 --repeat-each=3`, then lint/build/Vitest/full Playwright/`git diff --check`.
5. Update this handoff with exact results and stop at `RE-REVIEW_REQUESTED`.

## Next Action

GLM 5.3 remediates only the reviewer test finding, pushes PR #12, and stops at `RE-REVIEW_REQUESTED`.
