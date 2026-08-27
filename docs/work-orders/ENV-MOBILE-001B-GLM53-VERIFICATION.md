# ENV-MOBILE-001B — DailyForm Verification and Regression Evidence

Status: BLOCKED_ON_ENV-MOBILE-001A
Model tier: GLM-5.3
Owner: GLM-5.3
Coordinator / independent reviewer / merge owner: GPT-5.6 Sol Ultra
Execution order: SECOND; start only after the Sol MAX lane is pushed and its exact commit is recorded.

## Objective

Add deterministic regression coverage and an exact evidence packet for the remediated ENV-MOBILE-001 behavior. This is a bounded verification task: do not redesign or edit production code.

## Repository contract

- Repository/worktree: `A:\GitHub\envww-mobile-001`
- Branch: `feat/env-mobile-001`
- PR: #40
- Parent work order: `docs/work-orders/ENV-MOBILE-001.md`
- Dependency: exact pushed commit recorded in `docs/ai/handoffs/ENV-MOBILE-001A-SOLMAX.md`

Before mutation, read the mandatory repository entry/SSoT sequence, fetch `origin/main`, verify exact repo/remote/branch/HEAD/dirty state/ownership, verify the dependency commit is an ancestor of HEAD, and state `SAFE_TO_MUTATE = YES`. Treat unknown `.serena/` content as protected. Do not reset, clean, delete, move, or stash it.

## Owned files

May edit only:

- `frontend/tests/e2e/daily-form-mobile.spec.ts`
- `docs/work-orders/ENV-MOBILE-001B-GLM53-VERIFICATION.md` for lane status only
- `docs/ai/handoffs/ENV-MOBILE-001B-GLM53.md`

Production files, shared SSoT, workflow files, and the Sol MAX handoff are read-only.

## Reference patterns

- Existing mobile spec: `frontend/tests/e2e/daily-form-mobile.spec.ts`
- Edit hydration/network mocking: `frontend/tests/e2e/daily-form-dirty.spec.ts`
- Authenticated fixture: `frontend/tests/e2e/fixtures.ts`
- Playwright configuration: `frontend/playwright.config.ts`
- UX acceptance: parent work order and `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md`

Reuse existing deterministic fixtures and selectors. Do not add dependencies or invent production data.

## Required regression coverage

Keep the current useful assertions and add the smallest maintainable coverage that proves:

1. 360 px and 430 px phone layouts have no page overflow, dense measurement controls are one-column, and the final field/actions remain reachable.
2. A tablet viewport such as 768×1024 and desktop 1024 px preserve useful two-column density without action-bar regression.
3. Every visible QuickChip has a measured bounding box of at least 44×44 CSS px.
4. At least one configured mobile/touch context exercises the real tap path; do not label Desktop Chrome with a resized viewport as touch evidence.
5. Keyboard users can reach and activate representative QuickChip/form actions, with visible/focusable validation feedback.
6. Submitting abnormal operation without a cause exposes/announces actionable validation context and preserves values already entered across accordions.
7. Deterministic create/save failure on the first request:
   - displays an accessible error;
   - keeps entered values;
   - permits retry;
   - succeeds on a second mocked request.
8. The abnormal-cause success path actually invokes the existing repair-request boundary; capture/assert the request instead of merely returning a mock response.
9. Edit mode at phone width keeps update/cancel/delete actions usable, non-overlapping, and outside final-field content.
10. ModuleDock remains tappable at rest, while form actions do not sit above or receive input through the dock sheet/scrim.
11. Capture deterministic screenshots for the representative 360, 430, and tablet states when the repository workflow supports it; record paths and what each image proves in the lane handoff.

If a required assertion exposes a production defect, record the reproducer and STOP at `PRODUCTION_REMEDIATION_REQUIRED`; do not edit production code.

## Full verification

Run and record:

- focused `daily-form-mobile.spec.ts`;
- relevant existing `daily-form-dirty.spec.ts` coverage;
- full Playwright;
- `npm test -- --run`;
- `npm run build`;
- `npm run lint`;
- `git diff --check`;
- GitHub PR checks after push, including the exact checked-out commit/ref from logs.

If local Supabase variables are missing, use only the repository's documented non-secret test profile or rely on remote CI and classify the local attempt as `ENVIRONMENT_FAILURE`. Never print or persist secrets.

## Evidence packet

Update `docs/ai/handoffs/ENV-MOBILE-001B-GLM53.md` with:

- dependency commit and final exact HEAD;
- changed paths;
- viewport/device matrix and whether each is viewport-only or real touch emulation;
- RED/GREEN evidence for each new regression;
- command/results/warnings;
- screenshot paths;
- actual PR head/base/mergeability/check runs and the commit/ref checked out by CI;
- residual risks;
- one next action: independent Sol Ultra exact-SHA re-review.

## Completion and stop gate

1. Commit only owned files using `chunk(ENV-MOBILE-001B): <summary>` and push the existing branch.
2. Set this lane to `RE-REVIEW_REQUESTED` only if every applicable gate passes; otherwise use `PRODUCTION_REMEDIATION_REQUIRED` or `BLOCKED` with exact evidence.
3. STOP. Do not edit production/shared SSoT/workflows, approve, merge, deploy, close ENV-MOBILE-001, or start another ROADMAP item.
