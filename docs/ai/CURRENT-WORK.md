# CURRENT WORK

Status: REVIEW_REQUESTED

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

`WO-STAB-INTEGRATE-001`

Owner: GLM 5.3

## Goal

Prepare the already-reviewed `fix/p0-stabilization` fixes for safe integration with the latest `main` without adding new feature or bug-fix scope.

## Problem

GPT reviewed the three stabilization commits on `fix/p0-stabilization` and found the implemented fixes acceptable for their intended scope:

- `cdd6f6d` — redact denied PHI-bearing chat-history entries before AI provider send
- `e065253` — clear React Query cache during sign-out, including error path
- `26c629f` — judge delete success by mutation error rather than returned data

However, the branch currently diverges from `main`: it is 3 commits ahead and 6 commits behind because the lightweight `docs/ai/` workspace was added after the stabilization branch was created.

The three fixes are therefore **PASS — integration gated** rather than ready for direct production merge.

## Desired Result

Bring the latest `main` into `fix/p0-stabilization` safely, preserve all three stabilization commits, rerun the full regression gates against the integrated branch, update `docs/ai/HANDOFF.md`, and stop for GPT review before merging to `main`.

## User Experience Requirements

- No new UX behavior beyond the three already-reviewed fixes.
- Successful deletion must navigate normally instead of reporting false failure.
- Sign-out must not leave prior-user React Query data visible on a shared device.
- AI chat history that matches the PHI deny boundary must not be sent verbatim to the provider.

## Visual / UI Requirements

- No visual redesign.
- Preserve current UI styling and layout.

## 3D Requirements

- None.
- Do not touch `feature/digital-twin-v3`.

## Technical Requirements

1. Inspect current `origin/main` and `origin/fix/p0-stabilization` before changing history.
2. Integrate latest `main` into `fix/p0-stabilization` using the safest normal Git workflow for an already-pushed collaboration branch. Prefer a non-destructive merge of `main` into the branch unless there is a repository-specific reason not to.
3. Do not drop, squash, rewrite, or materially alter the three reviewed stabilization fixes during this WO.
4. Resolve conflicts narrowly. `docs/ai/` from `main` must be preserved.
5. Do not implement remaining P0/P1 findings in this WO.
6. Run the full regression gates after integration.
7. Update `docs/ai/HANDOFF.md` with implementation facts, exact test commands/results, branch, and exact HEAD.
8. Stop at `REVIEW_REQUESTED`. Do not merge to `main` in this WO.

## Files / Areas To Inspect

- Git history for `main` and `fix/p0-stabilization`
- `frontend/src/lib/admin/ai-chat.ts`
- `frontend/src/lib/admin/ai-chat.test.ts`
- `frontend/src/components/AuthProvider.tsx`
- `frontend/src/components/AuthProvider.signout.test.ts`
- `frontend/src/lib/hooks.ts`
- `frontend/src/pages/DailyFormPage.tsx`
- `MIGRATION.md`
- `docs/ai/**`

> Paths listed here are hints. The implementation agent must inspect the repository before assuming they are correct.

## Reuse Opportunities

- Reuse the existing three stabilization commits exactly where possible.
- Reuse the existing Vitest and Playwright suites; do not add a new test framework for this integration-only WO.

## Acceptance Criteria

- [ ] Latest `main` is an ancestor of the resulting `fix/p0-stabilization` HEAD, or equivalent safe integration is demonstrated without losing current `main` content.
- [ ] Commits/fixes `cdd6f6d`, `e065253`, and `26c629f` remain present/equivalent and their intended behavior is unchanged.
- [ ] `docs/ai/PROJECT-BRIEF.md`, `CURRENT-WORK.md`, `HANDOFF.md`, and `docs/ai/design/*` remain present after integration.
- [ ] `npm run build` passes.
- [ ] `npm test` passes with no regression from the current baseline.
- [ ] Full Playwright suite passes.
- [ ] `npm run lint` is no worse than the documented existing baseline; no new lint regression from this WO.
- [ ] `git diff --check` passes.
- [ ] No Digital Twin files are modified.
- [ ] No remaining P0/P1 bug is silently bundled into this WO.
- [ ] `docs/ai/HANDOFF.md` records exact branch and exact HEAD.
- [ ] Agent stops at `REVIEW_REQUESTED` and does not merge to `main`.

## Out Of Scope

- Remaining production blockers, including form overwrite on window-focus refetch and ErrorBoundary/AuthProvider remount behavior.
- `annotateRow` data-egress policy.
- Component-test harness work.
- Any Digital Twin normalization, rebase, visual, 3D, asset, or simulation work.
- New dependencies.
- Database migrations.

## Implementation Notes

GPT review result for the existing three commits: **PASS — integration gated**.

For AI row annotation policy later, the approved direction is **explicit AI-safe allowlist + safe-field projection first; content scrubber only as defense-in-depth**. Do not implement that policy in this WO.

After this integration gate is approved and merged, the next production work should address the remaining P0 data-integrity blocker where in-progress form edits can be overwritten by background/window-focus refetch.

## Reviewer Notes

GPT inspected the actual GitHub commit diffs before issuing this work order. The branch is currently behind `main`, so green tests from the pre-`docs/ai` branch are necessary but not sufficient for production merge. The purpose of this WO is only to produce an integrated, re-tested review candidate.

## Current Branch

`fix/p0-stabilization`

## Current HEAD

Pre-integration reviewed HEAD: `26c629f78b69f1a44a59fa4bccb3dd06090c4309`

## Next Action

GLM: read `PROJECT-BRIEF.md`, this work order, and relevant source; integrate latest `main`, run all gates, update `HANDOFF.md`, push normally if allowed, then stop at `REVIEW_REQUESTED`.
