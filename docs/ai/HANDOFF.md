# HANDOFF

Status: RE-REVIEW_REQUESTED — PR #15 remediation complete; GPT review next.

## Repo State — 2026-08-22

Main integrated into this branch through repository checkpoint `8a6812cdaf6e6fd29c51335838c1f9de70c78430` (which includes merged PR #16 / `WO-STAB-007`).

Active branch:

`feat/ux-scale-001`

Pull request:

`#15 — WO-UX-SCALE-001`

Implementation remediation checkpoint:

`309f1a6` — mobile bell viewport + brand touch-target remediation, tests and screenshot evidence.

Main-integration checkpoint:

`64c2e71` — merge current `main` into PR #15 while preserving the latest coordination state and calendar-MoM fix.

## PR #15 Reviewer Findings Addressed

### Mobile bell panels

Problem: at 360px, the 320px panels were absolutely right-aligned to individual bell buttons, allowing the open panel to extend beyond the viewport.

Fix:

- `NotificationBell` and `PendingUsersBell` now use `fixed inset-x-3` mobile positioning below the sticky top bar.
- From `sm` upward, they return to the original absolute, right-aligned 320px desktop behavior.
- Escape/outside-click/accessibility behavior is preserved.

### Mobile brand target

Problem: the mobile wordmark is hidden and the only visible logo is 36x36, leaving the `/dashboard` link itself at 36x36.

Fix:

- Brand link now has `min-w-[var(--touch-min)] min-h-[var(--touch-min)]`.
- Mobile alignment is centered; desktop alignment is restored from `sm` upward.
- Accessible link name is unchanged.

## Regression Coverage

Added:

- `frontend/tests/e2e/ux-scale-mobile.spec.ts`
- `frontend/tests/e2e/ux-scale-desktop.spec.ts`

Mobile coverage verifies:

- 44x44 minimum brand target at 360px;
- no document-level horizontal overflow in light/dark themes;
- both notification and pending-user panels fully within the 360px viewport while open;
- Escape closes the notification panel.

Desktop coverage verifies:

- no document-level horizontal overflow at 1440px in light/dark themes.

RED proof before the fix:

- brand link width = 36px, below the 44px requirement;
- notification panel right edge = 376px at a 360px viewport.

Focused post-fix stability proof:

- `ux-scale-mobile.spec.ts --retries=0 --repeat-each=3`: 6/6 PASS.

## Visual Evidence

Committed under:

`docs/review-evidence/pr-15/`

Files include before/after mobile header, before/after notification-panel evidence, after pending-user panel, and before/after 1440px desktop light/dark screenshots.

## Full Gates

- Lint: 12 warnings + 3 errors — exactly the documented pre-existing baseline; no new remediation lint findings.
- Build: PASS.
- Vitest: 152/152 PASS.
- Full Playwright: 37/37 PASS.
- `git diff --check`: PASS.
- 360px light/dark overflow checks: PASS.
- 1440px light/dark overflow checks: PASS.

## Scope / Safety

No changes to:

- `frontend/src/lib/**` except files received from merged `main` (PR #16 calendar-MoM work);
- Supabase schema/migrations/auth/RLS;
- telemetry contracts/provenance/null semantics;
- Digital Twin implementation;
- Process Flow implementation.

The primary repo worktree contains unrelated untracked user files. They were not removed, reset, cleaned or staged. This remediation was performed in the dedicated `env-wastewater-webapp-ux-scale` worktree.

## Active Queue After This Handoff

| Order | PR | State | Next owner |
|---:|---:|---|---|
| 1 | #15 — `WO-UX-SCALE-001` | RE-REVIEW_REQUESTED | GPT reviewer |
| 2 | #14 — Digital Twin foundation | CHANGES_REQUIRED; blocked until #15 merges | GLM / ChatGPT implementation worker after #15 merge |

PR #14 still must correct data provenance, `latest` vs `live`, real R3F initialization-failure coverage under StrictMode, and 3D readiness reset on mouse/touch re-entry.

## Next Action

GPT re-review PR #15. If approved, merge PR #15. Then integrate the new `main` into PR #14 and continue only its recorded remediation. Do not start Digital Twin visual-direction work before PR #14 is approved and merged.
