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

- [ ] Healthy SPA navigation does not remount the subtree through a deterministic regression test (the production fix is accepted in principle; test A currently flakes during dock-link pointer interaction).
- [x] Route change after a crash clears the recovery screen (lazy-chunk 404 → recovery screen → browser back → route renders).
- [ ] Lint/build/Vitest remain at the verified baseline and the full Playwright suite passes after the deterministic-test remediation, with the focused spec also clean under retries-disabled repeated execution.
- [x] No Digital Twin / unrelated files.

## Remediation Round (CHANGES_REQUIRED — test determinism)

Test A rewritten per the reviewer finding: keyboard navigation (focus + Enter, no pointer hit-testing), toHaveURL assertion after every transition (end-anchored patterns, no persistent-nav text markers), page.goto used only at boot, app_user call-count assertion unchanged. Stability proof: `--retries=0 --repeat-each=3` → 6/6 passed. Full gates re-run green (lint baseline 12+3, build, Vitest 148/148, Playwright 34/34, diff-check clean).

## Implementation Checkpoint

Remediation checkpoint: `c1521481beaabee73a4da5542ec2e2c28765cd3e` (test-only change; production checkpoint remains `d11c2a3e6fa9843bd4ff2bad96e6d578c2a44ec8`). Branch `fix/p0-error-boundary-remount`; see HANDOFF.md and PR #12.

## Reviewer Finding — Test Gate Blocker

Production review found no blocking issue in `ErrorBoundary.tsx`: removing the pathname-keyed wrapper preserves subtree identity, and the pure derived-state reset matches the required error-recovery semantics.

The new regression test A is not deterministic enough to approve:

- `frontend/tests/e2e/error-boundary-remount.spec.ts:51-53` performs repeated pointer clicks on animated/overlapping ModuleDock links. Reviewer-local targeted runs failed twice at the second navigation because the parent `.dock-item` intercepted pointer events.
- A fresh CI-profile targeted run also failed on its first attempt and passed only on Playwright's configured retry, reported as `1 flaky`. A green exit code can therefore mask the failure.
- The post-click markers (`"บันทึก"`, `"ประวัติ"`) are also present in the persistent navigation UI, so they can resolve before the destination page is proven active. The test does not currently assert the URL after each navigation.

Required remediation:

1. Keep the three transitions as true in-page React Router navigation; do not replace them with `page.goto`, because full reloads would remount AuthProvider and invalidate the behavior under test.
2. Trigger the links without pointer hit-testing (for example, keyboard activation or an explicit DOM click appropriate for this non-pointer regression).
3. Assert the expected URL/path after every transition before continuing. Use destination-specific page assertions only if they cannot match persistent navigation labels.
4. Prove the focused spec stable with retries disabled and repeated execution (minimum `--retries=0 --repeat-each=3`), then run the full Playwright suite and all existing gates.
5. Do not alter or weaken the `app_user` call-count assertion. No production-code change is requested unless the corrected test exposes a separate defect.
6. Update `HANDOFF.md`, push the remediation to PR #12, and stop at `RE-REVIEW_REQUESTED`.

## Out Of Scope

Remaining P1 findings (alert unread count, carbon MoM, role-visibility error UX), `annotateRow` policy, component-test harness, unsaved-changes navigation prompts, Digital Twin work.

## Next Action

GLM 5.3: remediate only the deterministic-test finding above, run all gates, update the handoff, push PR #12, and stop at `RE-REVIEW_REQUESTED`.
