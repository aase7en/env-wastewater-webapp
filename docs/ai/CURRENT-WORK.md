# CURRENT WORK

Status: CHANGES_REQUIRED

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

`WO-UX-SCALE-001`

Owner: Codex — Visual Experience Owner

PR: #15

Reviewed checkpoint: `d6b31c19b734331b54c5861c4e74aaf30f5d97f9`

## Reviewer Verdict

`CHANGES_REQUIRED`

The typography, icon scale, shared button sizing, Aura theme behavior and closed-header layout match the work order. Two interactive mobile acceptance failures must be corrected before merge.

## Required Remediation

### 1. Keep both bell panels inside the mobile viewport

`NotificationBell` and `PendingUsersBell` render a 320px-wide panel with `absolute right-0`, anchored to each individual bell. At 360px the bells sit to the left of the theme and user controls, so an open panel extends beyond the viewport's left edge. `max-w-[calc(100vw-1.5rem)]` limits panel width but does not change that anchor position.

Required result:

- Opening either bell panel at 360px keeps the entire panel visible and usable.
- Preserve desktop alignment, keyboard Escape behavior, outside-click behavior and accessible labels.
- Add deterministic browser coverage for both panel positions at the mobile viewport; do not validate only the closed header's document width.

Relevant files:

- `frontend/src/components/ui/NotificationBell.tsx`
- `frontend/src/components/ui/PendingUsersBell.tsx`
- `frontend/src/components/layout/AppShell.tsx` only if a shared header anchor is needed

### 2. Make the mobile brand link at least 44px by 44px

Below `sm`, the wordmark is hidden and the brand link's only visible child is the `w-9 h-9` logo. The link itself has no minimum dimensions or padding, leaving a 36px by 36px touch target.

Required result:

- The `/dashboard` brand link has a computed interactive target of at least 44px by 44px at 360px.
- Keep the compact mobile header within the viewport and retain its accessible name.

Relevant file:

- `frontend/src/components/layout/AppShell.tsx`

## Handoff Evidence

The work order requires before/after screenshots in the PR handoff. The current PR describes a local screenshot folder but does not attach or link reviewable before/after pairs. Add representative mobile and desktop before/after evidence to PR #15 when requesting re-review.

## Non-Blocking Follow-up

The rendered top bar is now at least 64px high while `--topbar-h` in `frontend/src/styles/spacing.css` still documents 56px. The token is currently unused, so this does not block remediation, but reconcile or explicitly retire it before a future consumer relies on it.

## Integration Requirement

PR #16 merged after this branch was cut. The reviewed PR now has a content conflict in `docs/ai/CURRENT-WORK.md` against current `main`. Integrate current `main` after the UI remediation, retain the calendar-MoM fix and latest repo-wide handoff state, then keep this work order at `RE-REVIEW_REQUESTED`. Do not discard another owner's changes while resolving the coordination file.

## Verification Required

- `npm run build`
- `npm test`
- full Playwright suite, including both open bell panels at 360px
- `npm run lint` against the documented baseline
- `git diff --check`
- confirm no document-level horizontal overflow at 360px in light and dark themes
- confirm PR #15 is mergeable against current `main`

## Next Action

Codex: remediate only the findings above on PR #15, update the PR evidence and this file to `RE-REVIEW_REQUESTED`, then stop for GPT re-review. Do not start the Digital Twin visual lane and do not merge the PR.
