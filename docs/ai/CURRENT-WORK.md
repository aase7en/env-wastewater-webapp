# CURRENT WORK

Status: APPROVED

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

`WO-STAB-004`

Owner: GLM 5.3

## Goal

Prevent in-progress edits on the wastewater daily edit form from being silently overwritten by React Query background/window-focus refetches.

## Problem

The current edit flow in `frontend/src/pages/DailyFormPage.tsx` repopulates the entire form whenever `existing` changes:

```text
useReading(id)
  → React Query
  → background/window-focus refetch
  → `existing` receives a new snapshot
  → `useEffect([existing])`
  → `setForm(...)`
  → unsaved user input can be lost
```

The global QueryClient enables `refetchOnWindowFocus`. The current `useReading()` hook does not override that behavior, and `DailyFormPage` has no dirty/hydration guard. This matches P0 finding #4 in `reports/code-review-2026-08-12.md` and remains present on current `main` after the approved stabilization merge.

## Desired Result

In edit mode, server/query refreshes may update cached data, but once the user has started editing, no background/window-focus refetch may overwrite unsaved form state.

The initial record must still hydrate correctly. Navigating to a different reading ID must hydrate that record correctly. Save/delete behavior must remain unchanged.

## User Experience Requirements

- A staff member can open an existing daily reading and edit fields normally.
- If the tab/app loses focus and regains focus while the form has unsaved edits, those edits remain exactly as entered.
- No new warning dialog, save flow, visual redesign, or navigation redesign is required in this WO.
- Initial loading behavior and Thai UI remain unchanged unless a minimal change is required for correctness.

## Visual / UI Requirements

- No visual redesign.
- Do not alter Aura styling, layout, accordion structure, labels, thresholds, or button appearance.

## 3D Requirements

- None.
- Do not touch Digital Twin branches/files.

## Technical Requirements

1. Inspect the current `DailyFormPage`, `useReading`, QueryClient defaults, existing E2E fixtures, and relevant tests before choosing the implementation.
2. Protect user-edited local form state from background/window-focus refetch overwrite.
3. Prefer the smallest robust solution. A dirty/hydration gate in the form layer is preferred if it preserves useful query refresh behavior; do not globally disable React Query focus refresh for unrelated pages.
4. Handle route/record identity correctly: if the edit page is used for a different reading ID, the new record must be allowed to hydrate.
5. Do not rely only on object identity of React Query results as a dirty signal.
6. Do not convert missing values to defaults beyond existing form semantics.
7. Do not change create/update/delete API contracts in this WO unless strictly necessary; if a broader contract change appears necessary, stop and report it instead.
8. Add a regression test using the existing test stack where practical. Prefer existing Vitest/Playwright infrastructure; do not add a new testing framework or dependency for this WO.
9. Run full regression gates and document results in `docs/ai/HANDOFF.md`.
10. Stop at `REVIEW_REQUESTED`; do not merge to `main` yourself.

## Files / Areas To Inspect

- `frontend/src/pages/DailyFormPage.tsx`
- `frontend/src/lib/hooks.ts`
- `frontend/src/lib/query-client.ts`
- `frontend/tests/e2e/**`
- existing form/readings tests and fixtures
- `reports/code-review-2026-08-12.md`

> Paths are hints. Inspect source before assuming exact implementation points.

## Reuse Opportunities

- Reuse the current local `form` state and existing field update helper rather than introducing a form library.
- Reuse React refs/state and current React Query behavior.
- Reuse existing Playwright/Vitest infrastructure.

## Acceptance Criteria

- [x] Existing record hydrates correctly on initial edit-page load.
- [x] After a user changes at least one field, a window-focus/background refetch cannot replace the unsaved form values.
- [x] Refetch before the user edits does not break initial/current server-state hydration.
- [x] Navigating/editing a different reading ID can hydrate the new record rather than remaining permanently gated by the prior record's dirty state.
- [x] Existing create flow remains unchanged.
- [x] Existing update flow remains unchanged.
- [x] Existing delete flow remains unchanged.
- [x] A regression test demonstrates the data-loss bug is prevented, using the existing test stack where feasible.
- [x] `npm run build` passes.
- [x] `npm test` passes with no regression.
- [x] Full Playwright suite passes.
- [x] `npm run lint` is at the documented baseline or better; no new warnings/errors caused by this WO.
- [x] `git diff --check` passes.
- [x] No Digital Twin files are modified.
- [x] No unrelated P0/P1 fixes are bundled into this WO.
- [x] `docs/ai/HANDOFF.md` records implementation facts, tests, branch, and implementation checkpoint.
- [x] HANDOFF reached `REVIEW_REQUESTED` before reviewer approval.

## Out Of Scope

- ErrorBoundary/AuthProvider remount P0.
- P1 alert unread count, carbon MoM, role-visibility error UX, or `annotateRow` policy.
- Generic unsaved-changes navigation prompts.
- Autosave/drafts.
- Offline form persistence.
- New form framework or test framework.
- Digital Twin / 3D / asset work.
- New external dependencies.
- Database migrations.

## Implementation Notes

Review of `WO-STAB-INTEGRATE-001`: **PASS**. The approved stabilization branch was fast-forwarded into `main` at `8fd5dab96ec27e1a4b564ad2fdc2f3ec26c1e0c2`.

For durable handoffs, record an **implementation checkpoint SHA** (the code/test commit being reviewed). Do not try to make a Markdown file contain the SHA of the commit that contains that same Markdown update; that is self-referential and cannot be made stable. The reviewer will verify the actual branch tip directly from GitHub.

Likely robust design direction to evaluate, not a mandatory implementation:

- track whether the current record/form has been hydrated,
- track whether the user has made a local edit,
- allow server snapshots to hydrate while not dirty,
- block subsequent server-to-form replacement while dirty,
- reset the hydration/dirty gate when the reading ID changes.

GLM should validate the simplest implementation against actual React/React Query behavior before coding.

## Reviewer Notes

This is a P0 data-integrity task. Correctness is more important than preserving every background refresh. However, do not disable focus refresh globally when the actual issue is local form rehydration.

## Review Finding — CI Blocker

Reviewer verification after PR #11 creation found a blocking mismatch between local and GitHub CI behavior.

Verified facts:

- PR #11 is OPEN and MERGEABLE.
- Focused local unit test passes: `frontend/src/lib/form-hydration.test.ts` = 6/6.
- Local production build passes.
- Focused local Playwright regression passes: `frontend/tests/e2e/daily-form-dirty.spec.ts` = 1/1.
- GitHub Actions workflow `E2E smoke tests / smoke` FAILS on the same new regression test, including retry.
- CI failure proves the unsaved input is overwritten: expected `2026-08-15`, received server-refetch value `2026-08-01`.

This is a release blocker for WO-STAB-004. The current implementation cannot be approved while CI demonstrates the protected value is still lost under the CI execution path.

Required remediation scope:

1. Reproduce or explain the local-vs-CI difference using repository evidence.
2. Determine whether the root cause is the production gate implementation, component lifecycle/remount behavior, or an invalid/non-equivalent E2E trigger.
3. Fix the smallest correct layer; do not weaken the acceptance criterion and do not make the test pass by avoiding a real refetch.
4. Preserve the existing constraints: no Digital Twin changes, no unrelated fixes, no global disabling of React Query focus refresh unless strictly proven necessary.
5. Re-run focused tests plus the required regression gates.
6. Push remediation to PR #11 and require GitHub CI green.
7. Update `HANDOFF.md` with the new checkpoint and exact CI evidence.
8. Set status to `RE-REVIEW_REQUESTED` only after the blocking CI check is green.

## Reviewer Approval

GPT 5.6 Sol UltraMAX completed the remediation re-review on 2026-08-21 and returned **PASS**.

- Verified the root cause directly: the former `E2E_BASE_URL` made Playwright skip its local `webServer` and test the deployed `main` site instead of the checked-out PR code.
- Verified `66c97d2` changes only `.github/workflows/e2e.yml`; production code and regression-test blobs are unchanged from reviewed checkpoint `f561654`.
- Verified CI run `32440011145` at `66c97d2` and current-head run `32440235796` at `ac8a87a`: both passed 32/32. The discovered 32-test set includes `daily-form-dirty.spec.ts`, so the regression ran and was not skipped.
- Verified local reviewer gates: production build passed, Vitest passed 148/148, and `git diff --check` passed.
- Accepted the disclosed limitation that PR CI uses the Vite dev-server profile; production-build preview coverage remains a separate work order.
- Merged PR #11 into `main` as merge commit `f48dcd76d14010b17f0f6bdd35ad111201a24a27`.

Evidence clarification: the literal range `f561654..66c97d2` also contains earlier coordination-document changes. The functional fix commit itself (`git show 66c97d2`) is workflow-only, and there are no `frontend/src` or `frontend/tests` changes between those checkpoints.

## Current Branch

Create/use a focused branch from latest `main`, recommended:

`fix/p0-form-dirty-gate`

## Current HEAD

Approved merge checkpoint on `main`: `f48dcd76d14010b17f0f6bdd35ad111201a24a27`.

## Next Action

WO-STAB-004 is complete. Create a new focused work order for the remaining production P0: ErrorBoundary/AuthProvider remount behavior. Do not resume Digital Twin visual work from this coordination file.
