# ENV-AUTONOMY-002 — Lane handoff

## Assignment — 2026-10-05

- Claim `ENV-AUTONOMY-002-C1`, generation 1, status `CLAIMED`, holder
  `zcode-env-autonomy-002-g1-primary`.
- Worktree `A:\GitHub\_worktrees\env-autonomy-002-20261005`, branch
  `codex/env-autonomy-002-hardening`, base
  `origin/main@9f5a089f99e9682848aae62b5b4842566c0b8081`.
- Work Order: `docs/work-orders/ENV-AUTONOMY-002.md`.
- Objective: RED-first fail-closed hardening of the five 2026-10-05 GPT-6
  Astra findings against `scripts/env_autonomy_runtime.py` (splatting
  protected-read bypass; session-identity drift; unpublished-reconciliation
  admission bypass; unredacted `git remote -v`; duplicate-receipt KeyError),
  plus the bounded successor lifecycle-routing prerequisite required to make
  this registered claim able to publish its own typed checkpoints.
- External cointh/Kilo dispatch remains disabled (`UNKNOWN` quota/upstream);
  no provider call is planned or permitted by this lane. JEV `UNAVAILABLE`.

## Checkpoint

- Lane not yet started. No mutations outside the registered scope; C1's
  locked four files remain untouched. The control-transition branch now
  bootstraps an empty version-1 lifecycle document for this claim. The first
  bounded source prerequisite is to make `append-event` task-selectable while
  preserving all existing admission checks. After that routing regression is
  RED→GREEN, append the first `GOAL_START` with the actual current execution
  goal id, publish/verify it, then reproduce and repair the five Astra
  findings, run the full local battery, publish the `REVIEW_REQUESTED`
  checkpoint, and stop for independent exact-SHA review.

## Lifecycle bootstrap

The empty event list is intentional: no Zcode/Codex goal identity is invented
by this docs-only control transition. After the task-routing prerequisite is
GREEN, the executing lane supplies its real goal id on the first typed
`GOAL_START` event.

<!-- ENV-AUTONOMY-LIFECYCLE:START -->
```json
{
  "version": 1,
  "task_id": "ENV-AUTONOMY-002",
  "claim_id": "ENV-AUTONOMY-002-C1",
  "claim_generation": 1,
  "goal_id": null,
  "codex_hook_observations": [],
  "events": []
}
```
<!-- ENV-AUTONOMY-LIFECYCLE:END -->
