# CURRENT WORK

Status: IMPLEMENTING

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

## Review Queue — 2026-08-22

| Order | PR | Verdict | Repository checkpoint |
|---:|---:|---|---|
| 1 | #16 — `WO-STAB-007` | APPROVED and merged | merge `77015d691d2d5a9f20937e582ffb53aa31cad875` |
| 2 | #15 — `WO-UX-SCALE-001` | REMEDIATION IN PROGRESS | original findings head `edd18b0f77bf2050fa49e6cde95eb7d3f6251a99` |
| 3 | #14 — Digital Twin foundation | CHANGES_REQUIRED | findings head `fc9023020bd2fc09e1bab2138153f44ab3f11978` |

PR #14 must not merge before PR #15. No Digital Twin visual-direction work starts until PR #14 is approved and merged.

## Active Work Order

`WO-UX-SCALE-001`

Owner: ChatGPT Sol MAX + SunDay-Worker 1 temporarily covering Codex while Codex is rate-limited.

PR: #15

Branch: `feat/ux-scale-001`

Original reviewed production checkpoint: `d6b31c19b734331b54c5861c4e74aaf30f5d97f9`

## Reviewer Verdict

`CHANGES_REQUIRED`

Typography, icon scale, shared button sizing, Aura theme behavior and closed-header layout were accepted. Two interactive mobile acceptance failures must be remediated before merge.

## Required Remediation

### 1. Keep both bell panels inside the mobile viewport

At 360px, `NotificationBell` and `PendingUsersBell` used 320px `absolute right-0` panels anchored to individual bell buttons, allowing the panel to extend beyond the viewport.

Required result:

- Opening either bell panel at 360px keeps the entire panel visible and usable.
- Preserve desktop alignment, keyboard Escape behavior, outside-click behavior and accessible labels.
- Add deterministic browser coverage for both panel positions at the mobile viewport.

### 2. Make the mobile brand link at least 44px by 44px

Below `sm`, the wordmark is hidden and the visible logo is 36px square. The `/dashboard` brand link must expose a computed interactive target of at least 44px by 44px while keeping the compact mobile header inside the viewport and retaining its accessible name.

## Remediation Implemented

- Mobile bell panels now use a viewport-anchored fixed position (`inset-x-3`) below the sticky top bar, then return to the existing per-bell absolute alignment from `sm` upward.
- The mobile brand link now has minimum touch-target dimensions using `--touch-min`, with centered mobile alignment and the prior desktop alignment restored at `sm`.
- Added deterministic Playwright coverage:
  - mobile 360px brand target >= 44x44;
  - document-width overflow checks in both themes;
  - both opened bell panels fully inside the 360px viewport;
  - Escape still closes the notification panel;
  - desktop 1440px overflow guard in both themes.
- Captured reviewable evidence in `docs/review-evidence/pr-15/` including before/after mobile and desktop screenshots plus both remediated panels.
- RED proof captured before the remediation: brand target measured 36px; notification panel right edge measured 376px in a 360px viewport.

## Integration Requirement

PR #16 merged after this branch was cut. Current `main` has been integrated into PR #15 during this remediation. Coordination files must preserve the current queue, merged calendar-MoM fix and PR #14 dependency order.

## Verification Required

- focused mobile spec with retries disabled and repeated execution;
- `npm run build`;
- `npm test`;
- full Playwright suite;
- `npm run lint` against the documented baseline;
- `git diff --check`;
- no document-level horizontal overflow at 360px in light and dark themes;
- PR #15 mergeable against current `main`;
- before/after screenshot evidence linked in PR #15.

## PR #14 — Required Owner Action After #15

Owner: GLM 5.3 — Core Engineering / integration

PR #14 remains `CHANGES_REQUIRED` and blocked until PR #15 merges. Its four blocking findings remain:

1. `DashboardRow.do_average` must not be presented as Aeration Tank DO with direct/manual provenance.
2. Manual latest snapshots must use `latest`, reserving `live` for actual sensor telemetry.
3. Renderer-init fallback coverage must reach the actual R3F renderer-construction failure path under StrictMode.
4. Mouse/touch Process → 3D re-entry must reset readiness before the remounted scene renders.

After #15 merges, integrate the then-current `main`, resolve coordination docs toward the latest state, run all gates and stop at `RE-REVIEW_REQUESTED`.

## Non-Blocking Follow-up

The rendered top bar is now at least 64px high while `--topbar-h` in `frontend/src/styles/spacing.css` still documents 56px. The token is currently unused. Reconcile or retire it before a future consumer relies on it; do not expand this remediation scope.

## Next Action

Complete all PR #15 gates. If green, update this file and `HANDOFF.md` to `RE-REVIEW_REQUESTED`, push PR #15 and stop for GPT review. Do not merge and do not start Digital Twin visual-direction work.
