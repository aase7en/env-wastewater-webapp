# ENV-MOBILE-001A — DailyForm UX Remediation

Status: READY_FOR_IMPLEMENTATION
Model tier: GPT-5.6 Sol MAX
Owner: GPT-5.6 Sol MAX
Coordinator / independent reviewer / merge owner: GPT-5.6 Sol Ultra
Execution order: FIRST; `ENV-MOBILE-001B` remains blocked until this lane is committed and pushed.

## Objective

Repair the bounded user-experience blockers found in the exact review of PR #40 head `87fdc7c0b014ed7279df93de7b4bdc539926debb`, without changing wastewater data or application-shell contracts.

## Repository contract

- Repository/worktree: `A:\GitHub\envww-mobile-001`
- Branch: `feat/env-mobile-001`
- PR: #40
- Review base: `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`
- Parent work order: `docs/work-orders/ENV-MOBILE-001.md`

Before mutation, read the mandatory repository entry/SSoT sequence plus `MIGRATION.md` section `ACTIVE — Two-track parallel work`, fetch `origin/main`, verify exact repo/remote/branch/HEAD/dirty state/ownership, confirm the `ENV-MOBILE-001A` claim row is ACTIVE and no competing file claim exists, and state `SAFE_TO_MUTATE = YES`. Treat unknown `.serena/` content as protected. Do not reset, clean, delete, move, or stash it.

If branch HEAD or `origin/main` differs from this record, reconcile current source reality and record the new SHAs before editing. Do not reuse the rejected review as approval.

## Owned files

May edit only:

- `frontend/src/pages/DailyFormPage.tsx`
- `docs/work-orders/ENV-MOBILE-001A-SOLMAX-UX-REMEDIATION.md` for lane status only
- `docs/ai/handoffs/ENV-MOBILE-001A-SOLMAX.md`
- `MIGRATION.md` only to mark the existing `ENV-MOBILE-001A` claim row complete

Do not edit the Playwright spec; GLM-5.3 owns that file after this lane.

## Required UX corrections

1. Make every QuickChip interactive target at least the existing 44 px project minimum. Prefer the project touch-min token where compatible; do not invent a new token or shared primitive.
2. Make abnormal-cause validation usable from the bottom action bar:
   - preserve all entered values;
   - keep the field-level error adjacent to the textarea;
   - announce the error accessibly;
   - move focus or scroll to actionable validation context so a phone user is not left at the bottom with only an off-screen banner.
3. Make create/update API failures visible and accessible while preserving entered values and allowing a retry.
4. Reconcile the sticky action bar with ModuleDock layering in the owned page only:
   - dock controls remain tappable at rest;
   - form actions remain tappable without covering the final field;
   - form actions must not render or receive input above the ModuleDock scrim/sheet when that modal layer is open;
   - verify default and large dock icon preferences at 360–430 px.
5. Preserve useful density from `sm` upward and avoid desktop/tablet regression. Do not restore half-width dense fields below `sm`.

## Required visual inspection

Inspect rendered create and edit states at 360, 390, 430, 768, and 1024 px. Include:

- normal and abnormal-system validation states;
- QuickChips and keyboard focus treatment;
- two-button create and three-button edit action layouts;
- final-field scrolling;
- dock at rest and with its sheet/scrim open;
- dark and light theme if the existing test harness permits without unrelated work.

Record actual observations in the lane handoff. Do not claim a viewport/state that was not rendered.

## Data and behavior invariants

- no schema/RLS/query/payload normalization change;
- empty numeric values remain null, never fabricated as zero;
- `system_operating`, `wastewater_discharged`, threshold, hydration, repair-request, delete, manual/latest/live semantics remain unchanged;
- no AppShell, ModuleDock, router, navigation, shared UI primitive, or Digital Twin edit.

## Verification

Run applicable focused checks against the changed page plus:

- `npm run lint`
- `npm run build`
- `npm test -- --run`
- existing focused DailyForm Playwright spec, without editing it
- `git diff --check`

Classify missing Supabase environment values as an environment failure; do not weaken source/tests to bypass them. Record command, environment, result, warnings, and exact HEAD.

## Completion and stop gate

1. Update `docs/ai/handoffs/ENV-MOBILE-001A-SOLMAX.md` with before/after behavior, files changed, exact commands/results, screenshots/evidence locations, branch, commit, and exact HEAD.
2. Set this lane to `UX_REMEDIATED_AWAITING_VERIFICATION` and mark only the `ENV-MOBILE-001A` claim row complete; leave the GLM row blocked for the coordinator to activate after verifying the pushed checkpoint.
3. Before commit, fetch and use `git pull --ff-only`; if it cannot fast-forward, stop and report instead of rewriting history. Commit only owned files using `chunk(ENV-MOBILE-001A): <summary>` and push the existing branch.
4. STOP. Do not edit GLM-owned tests/shared SSoT, approve, merge, deploy, close ENV-MOBILE-001, or start another ROADMAP item.
