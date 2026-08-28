# ENV-MOBILE-001A — Sol MAX UX Remediation Handoff

Status: UX_REMEDIATED_AWAITING_VERIFICATION
Date: 2026-08-27
Owner: GPT-5.6 Sol MAX (resumed with SunDay-Worker 3 after Worker 1 transport termination)
Branch: `feat/env-mobile-001`
PR: #40
Base: `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`
Lane starting HEAD: `fec0f1ba814e3df3c9b78c80c188c832a86d531f`
Checkpoint commit: `74550da24af09a5afe506d2c269de89cb6392092` (pushed to `origin/feat/env-mobile-001`; verified remote head matched before ENV-MOBILE-001B activation).

## Before / root cause

PR #40 exact review found the mobile layout improvement incomplete:

- QuickChips were only 36 px high, below the 44 px project touch minimum.
- Abnormal-cause submit validation left a phone user at the bottom action bar without moving focus to the actionable field.
- create/update API failure banners were not explicit accessible alert/focus destinations.
- the existing `z-50` form action bar sat above the ModuleDock scrim (`z-[35]`) when a Dock sheet was open.
- a naive remediation that lowered the action bar below the Dock caused the Dock root to intercept the Save button at rest; the final solution therefore has to distinguish Dock-rest from Dock-modal states.

## Production change

Changed only `frontend/src/pages/DailyFormPage.tsx`:

1. QuickChip targets now use `min-h-[var(--touch-min)] min-w-[var(--touch-min)]`.
2. Abnormal-cause validation keeps the adjacent field error, adds `aria-invalid` / `aria-describedby`, and focuses + scrolls `#abnormal_cause` into view on submit. Smooth scrolling is disabled under reduced-motion preference.
3. Banner errors are `role="alert"`, assertive, focusable, and API failures move focus to the banner. Form state is not cleared on failure, so retry remains possible.
4. Form actions remain `z-50` while the Dock is at rest so Save/Cancel/Delete stay tappable. A page-local MutationObserver detects the existing full-screen ModuleDock modal scrim; while it is present the action bar becomes `aria-hidden`, `inert`, `pointer-events-none`, and `z-30`, so it cannot render or receive input through the Dock modal layer.
5. No AppShell, ModuleDock, shared UI primitive, schema/RLS/query/payload normalization, hydration, threshold, repair-request, delete, or Digital Twin contract changed.

## Rendered evidence

A temporary non-production Playwright/Vite evidence runner rendered the actual page in Chromium with fake non-secret auth/Supabase values and deterministic REST mocks. The runner was removed before commit. Screenshots are local ignored evidence under `frontend/test-results/env-mobile-001a-visual/`.

| State | Observed result | Screenshot |
|---|---|---|
| 360×800 dark create + abnormal validation | no horizontal overflow; submit focuses `#abnormal_cause`; `aria-invalid=true`; QuickChip 89.5×44; 2 create actions; final field clears action bar | `360-dark-create-abnormal.png` |
| 390×844 light create | no overflow; QuickChip keyboard focus true and 89.5×44; 2 create actions; final field clear | `390-light-create-focus.png` |
| 430×900 dark + Large Dock | no overflow; QuickChip 44 px high; final field clear; after the Dock is returned from intentional scroll-hide to rest, Dock root is inside viewport (y≈693–868) with 5 visible controls and 4 center-point hit targets; `ทุกโมดูล` is keyboard-focusable; opening its sheet shows the scrim and makes the form action bar `aria-hidden=true`, `inert=true`, `pointer-events:none` | `430-dark-large-dock-sheet.png` |
| 768×1024 light tablet | no overflow; useful two-column measurement density preserved; final field clear | `768-light-tablet.png` |
| 1024×900 dark edit | no overflow; useful two-column density preserved; 3 edit actions present; final field clear | `1024-dark-edit.png` |

Note: ModuleDock intentionally hides on downward page scroll and reappears after upward scroll. The Large Dock at-rest check explicitly returned the Dock to its visible state before hit-testing; the transient hidden position was not treated as a defect.

## Verification

Environment for commands below used only non-secret placeholders:

- `VITE_SUPABASE_URL=https://gllqtbyofrcjzmbnfoeh.supabase.co`
- `VITE_SUPABASE_ANON_KEY=test-anon-key`

Results after the production change:

- focused `tests/e2e/daily-form-mobile.spec.ts`: **3/3 PASS**.
- Vitest `npm test -- --run`: **202/202 PASS** (15 files).
- `npm run build`: **PASS**; existing chunk-size warning remains.
- `npm run lint`: **0 errors / 12 pre-existing warnings** after the temporary visual runner was removed; baseline preserved.
- `git diff --check`: **PASS**.
- TypeScript diagnostics for `DailyFormPage.tsx`: no new error/warning; only the existing `FormEvent` deprecation hint.

Initial local Playwright attempts without `VITE_SUPABASE_*` were classified `ENVIRONMENT_FAILURE`; after using the non-secret test profile the app booted and deterministic tests exercised the product code normally.

## Remaining verification delegated to ENV-MOBILE-001B

GLM-5.3 owns only `frontend/tests/e2e/daily-form-mobile.spec.ts` plus its lane handoff/status/claim. It must add deterministic coverage for 360/430/tablet, measured 44×44 touch targets, actual mobile/touch context, keyboard validation, first-save failure + retry with value preservation, repair-request invocation, edit actions, Dock rest/scrim behavior, screenshots, full Playwright, and exact remote CI evidence. It must not edit production code.

If any required assertion exposes a production defect, GLM must stop at `PRODUCTION_REMEDIATION_REQUIRED` rather than editing `DailyFormPage.tsx`.

## Next safe action

Remove the temporary evidence runner, re-run lint to confirm the 12-warning baseline, update lane status/claim, `git fetch` + `git pull --ff-only`, inspect owned diff, commit/push the ENV-MOBILE-001A checkpoint, then have the coordinator record its exact pushed SHA and activate ENV-MOBILE-001B.
