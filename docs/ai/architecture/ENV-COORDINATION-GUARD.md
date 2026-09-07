# ENV Coordination Guard — architecture contract

Status: DRAFT_FOR_INDEPENDENT_REVIEW
Task: `ENV-COORD-001`
Owner / architecture lead: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-coord-001`
Branch: `docs/env-coord-001`
Base: `origin/main@a8fa47137d640a479d3dbc88f6e8c198d266c7f0`
Last updated: 2026-09-07

## 1. Problem

ENV already has strong written rules for SSoT, bounded lanes, exact-SHA review,
handoff, and one-writer ownership. The remaining failure mode is enforcement:
an agent can still forget to checkpoint, act on stale `CURRENT-WORK.md`, start
without a durable claim, edit outside its lane, or finish a long goal without
persisting what changed.

This contract converts those prose rules into an executable coordination layer
without creating a second project control plane.

## 2. Core invariants

1. Chat/model memory is never operational authority.
2. `docs/ai/CURRENT-WORK.md` remains the single canonical active-task and
   ownership registry.
3. Actual remote Git/PR/CI/runtime evidence can invalidate stale SSoT claims;
   mismatch is `STATE_DRIFT`, never silently reconciled by guessing.
4. One writer owns each mutable file/scope at a time.
5. Workers do not allocate their own claims.
6. A task claim is not automatically freed by time expiry.
7. Every long-running goal is resumable from durable lane-local state.
8. Material defects are remembered through executable prevention first.
9. Hooks are early guardrails; CI is the unavoidable final guard.
10. A new agent with zero chat history must be able to resume safely.

## 3. Durable state tiers

### Tier A — Project bootstrap

ChatGPT Project files may contain stable entry instructions and pointers only.
They MUST NOT contain a second live copy of task/claim/progress state.

A bootstrap file may state:

- repository/path;
- mandatory entry files;
- how to recover live state;
- that inaccessible live state means `STATE_UNVERIFIED`.

It must never copy the current task table from the repo.

### Tier B — Coordination SSoT

`docs/ai/CURRENT-WORK.md` owns coarse-grained coordination:

- active task ID;
- owner / agent / model;
- worktree / branch / base;
- lifecycle status;
- mutable and forbidden scope;
- dependencies;
- Work Order;
- lane handoff path;
- review owner;
- latest checkpoint pointer;
- one next safe action.

Only the lead/coordinator may allocate, reassign, release, or close claims.

Goal-level progress does not churn this central file on every iteration.

### Tier C — Lane-local durable memory

Each mutable lane owns exactly one bounded Work Order plus one lane handoff.

The lane handoff records the live execution checkpoint for that lane:

- active goal;
- previous completed goal;
- repo/worktree/branch/HEAD/dirty state;
- files changed;
- verification;
- problems found;
- fixed / unresolved status;
- blockers/decisions;
- next safe action.

The implementation owner may update its lane handoff because that path is part
of its exclusive mutable scope.

### Tier D — Evidence / reusable memory

- tests/checkers/types/schema/CI = executable prevention;
- PR/review evidence = exact-SHA assurance;
- `docs/ai/DEFECT-MEMORY.md` = only material, verified, reusable defect
  knowledge;
- ordinary transient failures stay in the lane checkpoint instead of polluting
  global defect memory.

## 4. Claim model

### 4.1 Claim states

```text
READY
  -> CLAIMED
  -> ACTIVE
  -> REVIEW_REQUESTED
  -> APPROVED / CHANGES_REQUIRED
  -> MERGE_READY
  -> MERGED
  -> POSTMERGE_VERIFY
  -> CLOSED

Exceptional:
BLOCKED
DECISION_REQUIRED
HUMAN_ACTION_REQUIRED
STALE_CLAIM
OWNERSHIP_CONFLICT
STATE_DRIFT
```

Existing repository compatibility states remain valid until migrated.

### 4.2 Claim activation

For multi-agent mutable work, a claim becomes authoritative only after the
coordinator records it in canonical SSoT on current `origin/main`.

A worker MUST NOT start production mutation merely because:

- a chat message assigned it;
- a local branch exists;
- its own lane handoff says it owns the task;
- another agent said the task was free.

The worker must fetch current remote state and pass the coordination preflight.

### 4.3 Claim release

Claims are released only by explicit coordinator reconciliation after checking
actual worktree, remote branch/PR, uncheckpointed mutation, and dependencies.

Time inactivity may classify a claim as `STALE_CLAIM`, but MUST NOT make the
scope available automatically.

## 5. Goal lifecycle

A session may contain many tasks/goals. Session boundaries are therefore not
sufficient checkpoints.

```text
GOAL_START
  -> ITERATE
  -> CHECKPOINT*
  -> GOAL_END
```

One active goal per lane execution context.

### 5.1 GOAL_START

Before a new goal may mutate:

1. identify task and goal IDs;
2. fetch/reconcile remote reality;
3. read current claim + Work Order + latest lane checkpoint;
4. verify actor/worktree/branch/base;
5. verify no overlapping mutable scope;
6. verify previous goal is closed/checkpointed;
7. record the new goal objective;
8. return `SAFE_TO_MUTATE = YES` or fail closed.

A second goal cannot silently replace an unclosed previous goal.

### 5.2 CHECKPOINT

Create a durable checkpoint at meaningful boundaries, including:

- RED/reproducer established;
- root cause proven;
- architecture/product decision made;
- focused GREEN achieved;
- full verification achieved;
- blocker/decision discovered;
- material commit created;
- before risky/non-idempotent mutation;
- before context/model/session rotation;
- before usage/context exhaustion.

### 5.3 GOAL_END

Every goal end records at minimum:

1. goal result classification;
2. attempted vs actually completed work;
3. start HEAD and end HEAD;
4. dirty state and changed files;
5. verification/evidence;
6. problems found;
7. each problem's fixed/unresolved/blocking state;
8. regression prevention when a material defect was fixed;
9. decisions/blockers;
10. exactly one next safe action.

Allowed goal results:

```text
COMPLETED_VERIFIED
COMPLETED_UNVERIFIED
PARTIAL
BLOCKED
DECISION_REQUIRED
FAILED
PAUSED
```

`DONE` alone is not a valid goal result.

## 6. Defect learning

Classify discovered problems:

### Working problem

Transient or lane-local issue, for example a selector typo, temporary tool
failure, or one-off fixture mismatch. Record in the lane handoff.

### Material reusable defect

A defect with meaningful recurrence/blast radius, such as:

- fabricated environmental semantics;
- stale ownership causing duplicate work;
- PHI/provider leakage;
- wrong unit/timezone/source mapping;
- repeated responsive overflow pattern;
- unsafe retry/idempotency behavior.

Material defects use:

```text
REPRODUCE
-> ROOT CAUSE
-> REPAIR
-> EXECUTABLE REGRESSION PREVENTION
-> VERIFY
-> DEFECT-MEMORY
```

Prefer regression test/checker/type/schema/CI guard over prose-only memory.

## 7. Coordination Guard core

Future `ENV-COORD-002` implements one deterministic core, tentatively:

`scripts/env_coordination_guard.py`

Required semantic commands:

```text
status
reconcile
preflight <TASK>
scope-check <TASK>
goal-start <TASK> <GOAL>
checkpoint <TASK> <GOAL>
goal-end <TASK> <GOAL>
stop-check <TASK>
review-check <TASK> <SHA>
```

All execution-surface adapters call this same core. Hook/plugin implementations
must not reimplement claim semantics independently.

### 7.1 preflight output

Success must be explicit:

`SAFE_TO_MUTATE = YES`

Failure must be fail-closed, for example:

```text
SAFE_TO_MUTATE = NO
reason = OWNERSHIP_CONFLICT
```

Preflight validates at least repository identity, current remote state,
task/owner, worktree, branch, base, dirty-state ownership, scope overlap,
Work Order/handoff existence, and material PR/state drift.

## 8. Execution-surface adapters

Adapters translate platform events into the semantic lifecycle. The core
contract remains platform-independent.

### ZCode / GLM

Target mapping, subject to adapter verification against the installed ZCode
version:

- session startup -> reconcile/status;
- submitted `/goal` -> goal-start;
- pre-write/edit/shell -> preflight + scope-check;
- successful mutations -> accumulate changed/evidence state;
- tool failure -> failure checkpoint buffer;
- stop/finalization -> stop-check and goal-end gate.

Because an execution engine may emit several stop-like events during a
long-running goal, the adapter MUST distinguish an iteration stop from a
declared goal completion/pause/block. Starting the next goal is an additional
hard gate: the previous goal must already have a valid Goal-End checkpoint.

### Codex

Use available pre/post tool and stop/session events only as adapters to the same
guard core. File mutation outside the claimed scope should be denied before the
tool runs when the platform supports it.

### ChatGPT without hooks

The repository entry protocol requires explicit guard preflight before
mutation. Since chat cannot guarantee a local hook, GitHub CI remains the
non-bypassable backstop.

### GPT Work

Do not assume local tool hooks identical to Codex/ZCode. Use the same
repository preflight plus available PR/event-triggered reconciliation where
supported. Work output remains a claim until repo/remote evidence is checked.

## 9. CI enforcement

Future `ENV-COORD-003` adds a required coordination check.

At minimum CI must fail when:

- a mutable PR has no recognized Task ID/claim;
- branch/task identity contradicts the claim;
- changed files exceed mutable scope;
- forbidden files are touched;
- two active lanes overlap without an explicit reconciliation contract;
- required Work Order or lane handoff is missing;
- review evidence claims a SHA other than current PR head;
- a lane reaches review/merge state without its required Goal-End checkpoint;
- remote PR reality materially contradicts canonical ownership without a
  reconciled `STATE_DRIFT` record.

CI must work even when the contributing agent has no hooks.

## 10. Central-registry write policy

To avoid the exact collision the guard is meant to prevent:

- coordinator: may allocate/reassign/release task claims in
  `CURRENT-WORK.md`;
- implementation worker: may update only its Work Order, lane handoff,
  claimed source/tests/evidence;
- reviewer: may write review evidence only in its allocated review surface;
- no worker self-claims shared files by editing `CURRENT-WORK.md`.

The guard implementation should make accidental violations machine-detectable.

## 11. Failure and recovery

### Crash during a goal

Resume from latest lane checkpoint + actual Git state. Classify unrecorded
changes as `PARTIAL` / `UNKNOWN`; never rerun non-idempotent work blindly.

### Stale central record

Actual remote/PR state triggers `STATE_DRIFT`. Stop the affected lane, retain
its claim, reconcile, then continue.

### Stale claim

Mark `STALE_CLAIM`; do not auto-release. Coordinator decides ACTIVE vs
RELEASED after evidence inspection.

### Shared-file requirement

Serialize by default. If overlap is unavoidable, coordinator records temporary
integration ownership and merge order before mutation.

## 12. Rollout

```text
ENV-COORD-001  architecture + lifecycle contract
ENV-COORD-002  guard CLI + deterministic tests
ENV-COORD-003  required CI enforcement
ENV-COORD-004  ZCode plugin/hook adapter
ENV-COORD-005  Codex adapter
ENV-COORD-006  Chat/Work bootstrap + event reconciliation
ENV-COORD-007  multi-agent chaos/collision verification
ENV-COORD-008  activate North-Star production lanes under the guard
```

Do not parallelize 002/003 until the core schema/API is stable. After the core
is stable, platform adapters may proceed in disjoint scopes.

## 13. Mandatory chaos scenarios

The final system is not accepted until deterministic/integration evidence
covers at least:

1. two agents claiming the same file;
2. two distinct branches claiming the same task;
3. agent edits a forbidden file;
4. goal 1 ends without checkpoint then goal 2 attempts to start;
5. crash after mutation before session end;
6. stale claim after apparent inactivity;
7. PR head changes after approval;
8. CURRENT-WORK says active but task branch is already merged;
9. worker reports DONE while tests failed;
10. agent without hooks opens a violating PR;
11. concurrent independent lanes pass without false collision;
12. shared-file lane is serialized and later safely released.

## 14. Acceptance for architecture freeze

This architecture may be marked `APPROVED_FOR_IMPLEMENTATION` only after:

- independent adversarial review of race/split-brain/deadlock/bypass/recovery;
- no second live SSoT is introduced;
- task-level vs goal-level state ownership is unambiguous;
- claim release cannot silently discard uncheckpointed work;
- hookless agents remain governed by CI;
- no platform adapter is treated as stronger authority than repo/remote reality;
- rollout slices have disjoint ownership boundaries.

## 15. Next safe action

Freeze this draft at an exact SHA and send it to an independent high-reasoning
reviewer for adversarial architecture review. Resolve every material finding
before activating `ENV-COORD-002`.
