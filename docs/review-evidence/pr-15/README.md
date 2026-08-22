# PR #15 — WO-UX-SCALE-001 Re-review Evidence

## Summary

- Preserve the approved Aura typography/icon/button scaling work.
- Fix both bell dropdowns so they remain fully visible at a 360px viewport.
- Raise the mobile `/dashboard` brand-link touch target from 36x36 to at least 44x44.
- Add deterministic mobile regression coverage and desktop overflow coverage.
- Integrate current `main` while preserving merged PR #16 calendar-MoM behavior and the current review queue.

## Reviewer Findings Addressed

### Bell panel viewport containment

Before remediation, the notification panel's right edge measured 376px in a 360px viewport.

- [Before — notification panel](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/before-notification-panel.png?raw=1)
- [After — notification panel](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/after-notification-panel.png?raw=1)
- [After — pending-user panel](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/after-pending-panel.png?raw=1)

Mobile panels now use viewport-anchored fixed positioning and return to the original per-bell absolute desktop alignment from `sm` upward.

### Mobile brand touch target

Before remediation, the accessible brand link measured 36px wide. It now uses `--touch-min` minimum dimensions and measures at least 44x44 at 360px.

- [Before — mobile header](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/before-mobile-header.png?raw=1)
- [After — mobile header](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/after-mobile-header.png?raw=1)

## Desktop Before / After

Desktop alignment remains intentionally unchanged while overflow is guarded in both themes.

- [Before — desktop light](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/before-desktop-1440-light.png?raw=1)
- [After — desktop light](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/after-desktop-1440-light.png?raw=1)
- [Before — desktop dark](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/before-desktop-1440-dark.png?raw=1)
- [After — desktop dark](https://github.com/aase7en/env-wastewater-webapp/blob/feat/ux-scale-001/docs/review-evidence/pr-15/after-desktop-1440-dark.png?raw=1)

## Regression Coverage

- `frontend/tests/e2e/ux-scale-mobile.spec.ts`
  - 44x44 minimum mobile brand target.
  - 360px document overflow check in both themes.
  - both bell panels fully inside the open viewport.
  - Escape still closes the notification panel.
- `frontend/tests/e2e/ux-scale-desktop.spec.ts`
  - 1440px document overflow check in both themes.

Focused mobile stability run: `--retries=0 --repeat-each=3` → 6/6 PASS.

## Full Gates

- `npm run lint` — documented baseline only: 12 warnings + 3 existing Playwright-fixture false-positive errors; no new remediation lint finding.
- `npm run build` — PASS.
- `npm test -- --run` — 152/152 PASS.
- full Playwright — 37/37 PASS.
- `git diff --check` — PASS.

## Checkpoints

- UI/test/evidence remediation: `309f1a6`
- current-main integration: `64c2e71`
- coordination handoff: `85cdefe`

Status: `RE-REVIEW_REQUESTED`.

Do not merge from the implementation worker. GPT reviewer decides the merge. PR #14 remains blocked until PR #15 merges.
