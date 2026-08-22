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

## Review Queue — 2026-08-22

| Order | PR | Verdict | Repository checkpoint |
|---:|---:|---|---|
| 1 | #16 — `WO-STAB-007` | APPROVED and merged | merge `77015d691d2d5a9f20937e582ffb53aa31cad875` |
| 2 | #15 — `WO-UX-SCALE-001` | RE-REVIEW_REQUESTED | remediation `309f1a6`; main integration `64c2e71` |
| 3 | #14 — Digital Twin foundation | CHANGES_REQUIRED | findings head `fc9023020bd2fc09e1bab2138153f44ab3f11978` |

PR #14 must not merge before PR #15. No Digital Twin visual-direction work starts until PR #14 is approved and merged.

## Active Work Order

`WO-UX-SCALE-001`

Owner: ChatGPT Sol MAX + SunDay-Worker 1 temporarily covering Codex while Codex is rate-limited.

PR: #15

Branch: `feat/ux-scale-001`

Original reviewed production checkpoint: `d6b31c19b734331b54c5861c4e74aaf30f5d97f9`

## Reviewer Verdict Addressed

The original typography/icon/button/Aura scaling work remains intact. The two blocking mobile findings have been remediated:

1. Both bell panels now remain fully inside a 360px viewport when opened.
2. The mobile `/dashboard` brand link now has a computed interactive target of at least 44px by 44px.

## Remediation Details

- `NotificationBell` and `PendingUsersBell` use viewport-anchored fixed positioning on mobile (`inset-x-3`, below the sticky top bar), then restore the original per-bell absolute right alignment from `sm` upward.
- The mobile brand link uses `--touch-min` minimum width/height, centered below `sm`, while preserving desktop alignment from `sm` upward.
- Escape behavior, outside-click behavior, accessible labels, navigation behavior and desktop dropdown alignment are unchanged.
- Current `main` was integrated after the UI remediation. The merged calendar-MoM fix and latest queue coordination were preserved.

## Regression Coverage

Added:

- `frontend/tests/e2e/ux-scale-mobile.spec.ts`
  - brand target >= 44x44 at 360px;
  - no document overflow in both themes;
  - both open bell panels fully inside the viewport;
  - Escape closes the notification panel.
- `frontend/tests/e2e/ux-scale-desktop.spec.ts`
  - 1440px desktop overflow guard in both themes.

RED proof before remediation:

- brand link measured 36px wide;
- notification panel right edge reached 376px in a 360px viewport.

Focused remediation run after the fix:

- mobile spec with `--retries=0 --repeat-each=3`: 6/6 PASS.

## Review Evidence

Reviewable screenshots are committed under:

`docs/review-evidence/pr-15/`

Evidence includes:

- before/after mobile header;
- before/after notification panel evidence;
- after pending-user panel;
- before/after 1440px light and dark desktop screenshots.

## Full Verification

- `npm run lint`: documented baseline only — 12 warnings + 3 existing fixture false-positive errors; no new lint finding from this remediation.
- `npm run build`: PASS.
- `npm test -- --run`: 152/152 PASS.
- full Playwright: 37/37 PASS.
- `git diff --check`: PASS.
- mobile 360px document overflow check: PASS in both themes.
- desktop 1440px overflow check: PASS in both themes.

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

GPT re-review PR #15. If approved, merge #15. Only after that should PR #14 integrate the new main and continue its remediation. Do not begin Digital Twin visual-direction work yet.
