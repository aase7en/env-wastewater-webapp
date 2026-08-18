# CURRENT WORK

Status: RE-REVIEW_REQUESTED

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

`WO-STAB-INTEGRATE-001`

Owner: GLM 5.3

## Goal

Finish the integration review for `fix/p0-stabilization` with **no lint-baseline regression** and an exact durable checkpoint before production merge.

## Review Result

**CHANGES_REQUIRED**

GPT reviewed the actual GitHub branch after integration.

Confirmed good:

- `main` is now an ancestor of `fix/p0-stabilization` (`behind_by: 0`).
- The three reviewed stabilization fixes remain in the branch.
- Build passes.
- Vitest passes: 142/142.
- Playwright passes: 31/31.
- `git diff --check` is clean.
- No Digital Twin files were modified.

Blocking findings are narrow and limited to the items below.

## Required Changes

### 1. Remove the new lint warning introduced by WO-STAB-003

Current branch lint result is 13 warnings + 3 errors, while the documented baseline is 12 warnings + 3 errors.

The additional warning is `react(only-export-components)` caused by exporting `signOutAll` from `frontend/src/components/AuthProvider.tsx`.

Fix this without changing sign-out behavior. Preferred direction:

- move the testable sign-out helper/seam into a non-component `.ts` module (for example an auth utility/service module consistent with the existing repo structure),
- keep `AuthProvider.tsx` consuming that helper,
- update the existing sign-out unit test to import the helper from its new module,
- do not suppress/disable the lint rule merely to make the warning disappear.

Acceptance: lint must return to the documented baseline or better, with no new warnings/errors caused by this branch.

### 2. Record one exact pushed HEAD in HANDOFF

`docs/ai/HANDOFF.md` currently describes a review-candidate SHA and then says the final pushed tip is a later doc-only commit without recording that final SHA directly.

Update HANDOFF so `## Exact HEAD` contains the single exact SHA returned by `git rev-parse origin/fix/p0-stabilization` after all remediation commits are pushed.

Do not use an indirect instruction such as “authoritative value: run git rev-parse”. The durable checkpoint must contain the actual SHA.

## Desired Result

A re-review candidate on `fix/p0-stabilization` that preserves the three production fixes, preserves latest `main`, restores lint to baseline-or-better, records the exact pushed HEAD, reruns all gates, and stops at `RE-REVIEW_REQUESTED`.

## Files / Areas To Inspect

- `frontend/src/components/AuthProvider.tsx`
- `frontend/src/components/AuthProvider.signout.test.ts`
- existing auth utility/service modules under `frontend/src/lib/` or the nearest appropriate non-component location
- `docs/ai/HANDOFF.md`
- `docs/ai/CURRENT-WORK.md`

> Inspect the repository first. Paths are hints, not permission to refactor unrelated areas.

## Acceptance Criteria

- [ ] Sign-out still calls Supabase sign-out and clears React Query cache.
- [ ] Query cache still clears even if Supabase sign-out throws.
- [ ] `AuthProvider.tsx` no longer introduces the new `react(only-export-components)` warning from `signOutAll`.
- [ ] `npm run lint` is at the documented baseline or better; no new branch-caused lint regression.
- [ ] `npm run build` passes.
- [ ] `npm test` passes with no regression.
- [ ] Full Playwright suite passes.
- [ ] `git diff --check` passes.
- [ ] No Digital Twin files are modified.
- [ ] No remaining P0/P1 work is bundled into this remediation.
- [ ] `docs/ai/HANDOFF.md` contains the single exact pushed branch HEAD SHA.
- [ ] HANDOFF status is `RE-REVIEW_REQUESTED` when finished.

## Out Of Scope

- WO-STAB-004 form dirty/refetch protection.
- ErrorBoundary/AuthProvider remount bug.
- `annotateRow` policy.
- Component-test harness work beyond adapting the existing sign-out test to the moved helper.
- Digital Twin work.
- UI/visual redesign.
- New external dependencies.
- Database migrations.

## Reviewer Notes

The integration itself is structurally sound. This is not a request to redo the merge or the three fixes. Only remove the new lint regression cleanly and make the HANDOFF checkpoint exact.

After this WO passes re-review and is merged to `main`, the next work order should address the remaining P0 form data-loss risk caused by background/window-focus refetch.

## Current Branch

`fix/p0-stabilization`

## Current HEAD

See branch `fix/p0-stabilization`; GLM must replace the HANDOFF checkpoint with the exact pushed SHA after remediation.

## Next Action

GLM: pull latest `main`, read this file and `docs/ai/HANDOFF.md`, make only the two required remediation changes, run all gates, update HANDOFF, push normally, then STOP at `RE-REVIEW_REQUESTED`.
