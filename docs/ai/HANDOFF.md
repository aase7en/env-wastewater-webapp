# HANDOFF

Status: REVIEW_REQUESTED

## Task

`WO-STAB-004` — prevent React Query background/window-focus refetch from overwriting unsaved user edits in the wastewater Daily Form (P0 data-integrity, finding #4 of `reports/code-review-2026-08-12.md`).

## Implementation Summary

- **Root cause**: `DailyFormPage` hydrated local form state inside `useEffect([existing])`. React Query background refetches (window-focus / reconnect, `staleTime` 30s) deliver fresh snapshots → the effect repopulated the whole form, silently wiping unsaved edits.
- **Fix — id-aware dirty gate** (per the work order's suggested design direction):
  - NEW `frontend/src/lib/form-hydration.ts`: pure `resolveHydration()` / `markDirty()` logic. Rules: first hydration ALLOWED; pristine same-record refresh ALLOWED (useful server refresh preserved); dirty same-record snapshot DENIED (the bug); different reading id ALLOWED + gate reset (record switch hydrates). Exported from `lib/` (not the page) so the page gains zero new exports — avoids the `react(only-export-components)` class that cost a remediation round in WO-STAB-INTEGRATE-001, and enables node-env unit testing.
  - `DailyFormPage.tsx`: `gateRef` consulted in the hydration effect; the single field-set helper (`set`, used by all 28 field edits) marks the gate dirty. Create/update/delete flows untouched; no visual change; React Query focus refetch NOT globally disabled.

## Files Added

- `frontend/src/lib/form-hydration.ts`
- `frontend/src/lib/form-hydration.test.ts`
- `frontend/tests/e2e/daily-form-dirty.spec.ts`

## Files Modified

- `frontend/src/pages/DailyFormPage.tsx` (+24/−5)

## Files Deleted

- None.

## Important Decisions

- Gate decision logic is a pure function in `lib/` (testability + lint-class avoidance) rather than inline refs-only in the page.
- E2E trigger uses a REAL offline→online transition (`context.setOffline`, trusted CDP network events → `refetchOnReconnect`). Synthetic `focus`/`visibilitychange` events and `bringToFront` tab-switching proved non-deterministic in headless Chromium across runs; the reconnect path exercises the identical overwrite mechanism (a fresh `existing` snapshot reaching the hydration effect), which is what this WO protects.
- The e2e mock returns a CHANGED row on the second fetch (date `2026-08-01` vs initial `2026-08-20`) — a same-data refetch would prove nothing (structural sharing keeps object identity).

## UX Changes

- None visible. Edits now persist through background refetches; all other form behavior unchanged.

## Visual / 3D Changes

- None. No Digital Twin files touched.

## Tests

### Commands

From `frontend/`: `npm run lint`, `npm run build`, `npm test -- --run`, `npm run e2e`; from repo root: `git diff --check`.

### Results

- Lint: **12 warnings + 3 errors — exactly the documented baseline** (one transient new warning, an unused fixture param in the new spec, was fixed before commit).
- Build: pass (`✓ built in 16.84s`).
- Vitest: **148/148** (142 baseline + 6 new gate-logic tests).
- Playwright e2e: **32/32** (31 baseline + 1 new).
- `git diff --check`: CLEAN.
- **RED proof** (on ungated code, before wiring the gate): the e2e test failed with the input flipped to the server value `2026-08-01` — the data-loss bug captured directly; GREEN after wiring the gate.

## Known Issues

- E2E gate test takes ~35s (waits past the 30s staleTime by design; no time-mocking hooks are exposed to the page).
- The e2e exercises the reconnect flavor of background refetch, not window-focus literally (headless focus events are non-deterministic; the overwrite path is identical — see Important Decisions).

## Deferred Work

- Out-of-scope items per CURRENT-WORK: ErrorBoundary/AuthProvider remount P0, P1 findings (alert count, carbon MoM, role-visibility error UX), `annotateRow` policy, unsaved-changes navigation prompts, autosave/drafts.

## Risks

- Low. Gate logic is pure and unit-covered on all four acceptance behaviors; the deny path is latch-stable across repeated snapshots and resets on id change. Create mode (`id` undefined) treated as a record switch, verified by test.

## Branch

`fix/p0-form-dirty-gate`

## Exact HEAD

`f5616540c7f387c0b1851427da490764792785c5` (implementation checkpoint — the code/test commit; PR includes it plus this HANDOFF commit).

## Reviewer Focus

- `lib/form-hydration.ts` — the four gate rules against the WO acceptance criteria.
- The hydration effect + `set()` wiring in `DailyFormPage.tsx` (only modified file; +24/−5).
- E2E trigger choice (reconnect vs focus) — see Important Decisions.

## Next Action

GPT 5.6 Sol UltraMAX review of PR → merge → next production WO (per CURRENT-WORK reviewer notes).
