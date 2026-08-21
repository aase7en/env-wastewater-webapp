# CURRENT WORK

Status: REVIEW_REQUESTED

Allowed statuses:

- IDLE
- DESIGNING
- READY_FOR_IMPLEMENTATION
- IMPLEMENTING
- REVIEW_REQUESTED
- CHANGES_REQUIRED
- RE-REVIEW_REQUESTED
- APPROVED
- BLOCKED

> `CURRENT-WORK.md` is the authoritative task definition. Agents must not silently expand task scope.

## Work Order

`WO-STAB-005`

Owner: GLM 5.3

## Goal

Stop `ErrorBoundary` from remounting the app subtree (AuthProvider included) on every navigation, while keeping the post-crash recovery behavior: a route change still clears the recovery screen so the user can escape a broken page.

## Problem (P0 #5, reports/code-review-2026-08-12.md)

`ErrorRouteWatcher` rendered `<div key={location.pathname}>` around `ErrorBoundaryInner > AuthProvider`. React treats a changed key as a new subtree, so every route change unmounted and remounted the whole app: AuthProvider re-ran `getSession()` + `loadAppUser()` on each dock click — visible PageSkeleton flicker on every navigation plus a fresh `app_user` REST round-trip each time.

## Desired Result

- Healthy SPA navigation keeps the subtree mounted (AuthProvider survives; no flicker; no repeated app_user lookups).
- After a render crash, a route change (e.g. browser back — the crashed tree offers no in-app nav) clears the error and renders the target route.

## Technical Requirements

- Fix only `frontend/src/components/ErrorBoundary.tsx`; add regression tests under the existing Playwright stack.
- No Auth/RLS/Supabase changes, no Digital Twin files, no UI redesign, no P1 fixes, no new dependencies.

## Acceptance Criteria

- [x] Healthy SPA navigation does not remount the subtree (proven by counting `app_user` REST calls: stays at boot value; RED on old code showed 11 calls vs 2 expected).
- [x] Route change after a crash clears the recovery screen (lazy-chunk 404 → recovery screen → browser back → route renders).
- [x] Lint at documented baseline (12w+3e), build OK, Vitest 148/148, Playwright 34/34, `git diff --check` clean.
- [x] No Digital Twin / unrelated files.

## Implementation Checkpoint

`d11c2a3e6fa9843bd4ff2bad96e6d578c2a44ec8` (branch `fix/p0-error-boundary-remount`; see HANDOFF.md for details and PR).

## Out Of Scope

Remaining P1 findings (alert unread count, carbon MoM, role-visibility error UX), `annotateRow` policy, component-test harness, unsaved-changes navigation prompts, Digital Twin work.

## Next Action

GPT review of the PR → merge → next stabilization item (P1 batch or per GPT's priority).
