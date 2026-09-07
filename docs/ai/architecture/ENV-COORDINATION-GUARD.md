# ENV Coordination Guard — architecture contract

Status: R2_REVIEW_REQUESTED
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

## 3. Durable state tiers and trusted policy

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

`docs/ai/CURRENT-WORK.md` remains the one canonical active-task/ownership
registry. For machine enforcement it will contain a bounded, parseable
`COORDINATION-REGISTRY v1` block near the active frontier; historical prose
remains human-readable but is not parsed as authority.

Each active mutable claim record contains at least:

```text
task_id
claim_id
claim_generation
status
owner_role
execution_holder_id
branch
base_sha
mutable_scope
forbidden_scope
work_order_path
handoff_path
review_owner
dependencies
last_checkpoint_pointer
one_next_safe_action
```

The guard reads authorization policy only from the latest fetched authoritative
`origin/main` revision. A candidate branch's copy of `CURRENT-WORK.md` is
never trusted to grant that same candidate permission.

### 3.1 Trusted policy revision

Every guard decision is bound to:

```text
policy_revision = exact latest origin/main SHA used for the decision
registry_hash   = hash of the canonical COORDINATION-REGISTRY block
claim_id
claim_generation
```

If the authoritative branch advances, the guard must fetch/reload policy before
a new mutation decision. A previous green decision is not proof that the
current policy still permits the action.

### 3.2 Field precedence

Authorization fields have this precedence:

```text
authoritative origin/main claim record
> server-enforced control transition
> lane Work Order / handoff
> candidate-branch docs
> agent statement / chat memory
```

A worker-editable Work Order or handoff MUST NOT widen authority. Candidate
changes to those files may document work, acceptance, evidence, or a narrower
self-imposed scope, but the effective mutable scope is always the trusted claim
record from authoritative `origin/main`.

If a candidate Work Order declares broader scope than the trusted claim, the
guard reports `POLICY_CONTRADICTION`; it does not grant the broader scope.

### 3.3 Coordinator authorization

"Coordinator" is a protocol role, not a self-asserted model identity.

ENV agents may share the same local machine account and the same GitHub
identity. Therefore Git author name, GitHub login, branch author, process name,
model name, or text such as "I am the coordinator" is never authentication.

A claim allocation/reassignment/release becomes authorized only when its
control transition is merged into authoritative `main` through the required
server-side control-plane gates defined in §9. Until those server gates are
active, ENV is in bootstrap mode (§11.6) and control transitions require the
existing exact-SHA independent review plus explicit human-authorized merge.

No secret coordinator token is stored in Git/docs/handoffs.

Coordinator authorization also requires a privilege boundary. Agent-accessible
GitHub credentials MUST NOT be able to silently bypass or disable the required
main-branch/ruleset gates. A repository-owner/admin credential that is exposed
to ordinary agent execution cannot itself serve as proof of human authorization.

Before `HARDENED` may be claimed, use either:

- server rules that do not permit the agent-operating identity to bypass or
  alter required enforcement; or
- a dedicated least-privilege agent/bot/app credential that can create
  branches/PRs but cannot change protection/rulesets or use bypass, while the
  human retains the separate control credential.

If this separation cannot be proven, record
`CREDENTIAL_BOUNDARY_UNVERIFIED` and keep production-lane activation blocked.

### Tier C — Lane-local durable memory

Each mutable lane owns exactly one bounded Work Order plus one lane handoff.

The lane handoff records the live execution checkpoint for that lane:

- task ID, claim ID and claim generation;
- active goal;
- previous terminal goal event;
- repo/worktree/branch/start HEAD/current HEAD/dirty state;
- files changed;
- verification;
- problems found;
- fixed / unresolved status;
- blockers/decisions;
- operation intents/outcomes where applicable;
- next safe action.

The implementation owner may update its lane handoff because that path is part
of its exclusive mutable scope. It may not change the trusted claim generation,
central scope, or coordinator authorization by editing this lane-local file.

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
RECOVERY_HOLD
OWNERSHIP_CONFLICT
STATE_DRIFT
```

Existing repository compatibility states remain valid until migrated.

### 4.2 Claim identity and fencing

Every mutable claim receives:

- immutable `claim_id`;
- monotonically increasing integer `claim_generation`;
- exact task/branch/scope policy from authoritative main.

The active worker records that generation in its lane checkpoint. Every
preflight and every mutation-capable hook must re-read the latest authoritative
claim and require an exact generation match.

Reassignment or material scope/owner replacement increments
`claim_generation`. The previous generation is immediately fenced: an old
worker that resumes later receives `STALE_CLAIM_GENERATION` and
`SAFE_TO_MUTATE = NO`, even if it uses the same GitHub identity, branch name,
or machine account.

### 4.2A Exclusive execution holder and mutation admissions

A claim generation authorizes exactly one live mutation execution context,
identified by opaque `execution_holder_id`. Multiple agents/processes/sessions
must not concurrently mutate under the same claim generation, even if they use
the same model, user, GitHub identity, worktree, goal ID, or branch.

Changing the live execution holder is a transfer and MUST increment
`claim_generation`; a second context cannot simply reuse the current
generation.

Within the current holder, every mutation-capable invocation uses an admission
protocol:

```text
ADMISSION_OPEN
  -> admit operation_id / admission_id
  -> IN_FLIGHT
  -> EFFECT_COMPLETE | EFFECT_FAILED | EFFECT_UNKNOWN
  -> admission closed
```

The holder maintains an atomic admission gate and active-admission set shared by
all mutation-capable tool invocations in that execution context.

An invocation is considered **already admitted** from the moment its admission
record is created until the adapter records one of the terminal effect states
above. Passing an earlier preflight is not sufficient to remove it from this
set.

Where an execution platform can re-check authorization immediately at the
actual mutation boundary, it SHOULD re-read the claim generation there as an
additional fence. The architecture MUST NOT rely on that capability because
some hook surfaces can only gate before invocation.

### 4.2B Quiesce/drain transfer barrier

Ownership/execution transfer uses this ordering:

```text
ACTIVE(g, holder=A)
  -> QUIESCING(g, holder=A)
  -> admission gate CLOSED
  -> wait/cancel until active_admissions == 0
  -> verify no unresolved EFFECT_UNKNOWN / OPERATION_INTENT
  -> publish QUIESCENCE_ATTESTATION
  -> TRANSFER_READY(g)
  -> authorized claim transition
  -> ACTIVE(g+1, holder=B)
```

Entering `QUIESCING` closes the holder's admission gate before transfer; all
new mutation admissions fail closed.

A `QUIESCENCE_ATTESTATION` is valid only when it identifies the current
`claim_id`, `claim_generation`, `execution_holder_id`, latest lifecycle
event/checkpoint, admission sequence high-water mark, and proves
`active_admissions = 0` with no unresolved external-operation outcome.

The coordinator MUST NOT release/reassign the scope until that attestation is
verified against current policy and actual runtime/worktree/remote evidence.

If an already-admitted invocation is paused, hung, detached, or cannot be
demonstrably cancelled/drained, the claim remains locked. State becomes
`RECOVERY_HOLD` (or stays `QUIESCING`) rather than allocating generation
`g+1`.

If the execution platform cannot expose a reliable admission lifecycle, it is
not eligible for hot reassignment. The current execution must be demonstrably
stopped and reconciled; otherwise the scope remains locked.

### 4.3 Serialized claim transition

A coordinator control transition is optimistic-concurrency-controlled.

The transition proposal records:

```text
expected_policy_revision
expected_registry_hash
task_id
expected_claim_generation   # null only for a genuinely new claim
proposed_claim_generation
proposed transition
```

Before integration, the trusted coordination check must re-read current
authoritative main and fail with `STALE_POLICY_REVISION` if the expected
registry/claim generation no longer matches.

Claim transitions must be integrated through a server configuration that
serializes/revalidates against latest main (for example an enforced up-to-date
merge or merge-queue path). Two proposals created from the same registry
revision cannot both become valid if their effective scopes collide.

### 4.4 Claim activation

For multi-agent mutable work, a worker may mutate only after:

1. the authorized claim transition exists on authoritative main;
2. its local branch/worktree matches the trusted record;
3. its recorded claim generation matches current main;
4. its `execution_holder_id` matches the one trusted for that generation;
5. its admission gate is `OPEN` and the mutation invocation obtains a unique active admission record;
6. its preflight passes against the latest fetched policy revision.

A worker MUST NOT start production mutation merely because:

- a chat message assigned it;
- a local branch exists;
- its own Work Order/handoff says it owns the task;
- another agent said the task was free;
- it authored a candidate `CURRENT-WORK.md` change.

### 4.5 Claim release, stale claims and inaccessible workers

Claims are released or reassigned only after the quiesce/drain transfer barrier in §4.2B completes and an authorized control transition revalidates the current policy. Checking only the apparent worktree/remote branch/PR/dirty state is insufficient because an already-admitted invocation may still be pending.

Time inactivity may classify a claim as `STALE_CLAIM`, but MUST NOT make the
scope available automatically.

If the former worktree/worker is unavailable or cannot be inspected:

1. move the claim to `RECOVERY_HOLD`;
2. preserve the current generation and scope lock;
3. inspect every reachable remote branch/PR/checkpoint/evidence source;
4. record what local/unpushed state may be missing;
5. do not issue a new worker generation until the uncertainty is reconciled.

If potentially material local state is irretrievable, abandoning it requires
explicit human authorization and a durable loss/risk record. Only then may a
new generation be allocated.

## 5. Goal lifecycle and durable checkpoints

A session may contain many tasks/goals. Session boundaries are therefore not
sufficient checkpoints.

```text
GOAL_START
  -> ITERATE
  -> CHECKPOINT*
  -> GOAL_END
```

One active goal per lane execution context.

Every lifecycle event carries:

```text
task_id
claim_id
claim_generation
goal_id
event_type
event_seq
event_id
previous_event_id
```

`event_seq` is monotonically increasing inside a claim generation.
`event_id` is stable for retries of the same semantic event.

The first-ever `GOAL_START` in a new claim generation uses a distinguished `previous_event_id = GENESIS` and is valid only when no prior goal event exists for that generation. Every subsequent `GOAL_START` must reference the previous durable terminal `GOAL_END`; an unterminated predecessor blocks the next goal.

### 5.1 GOAL_START

Before a new goal may mutate:

1. identify task and goal IDs;
2. fetch/reconcile latest remote reality and authoritative policy;
3. read current claim + Work Order + latest durable lane checkpoint;
4. verify claim ID/generation, worktree, branch and base;
5. verify deterministic scope ownership;
6. require the previous goal to have a valid terminal `GOAL_END` event;
7. publish the new goal objective;
8. return `SAFE_TO_MUTATE = YES` or fail closed.

A normal checkpoint is not sufficient to replace an active goal. The previous
goal must have a terminal Goal-End classification.

### 5.2 Durable publication

A checkpoint is authoritative only after all of the following succeed:

1. lane handoff/evidence is updated;
2. relevant task-owned code/docs state is captured in one Git commit;
3. the commit is pushed fast-forward to the claimed remote branch;
4. the remote branch head is read back and verified.

A local file write, local commit without push, chat summary, or tool memory is
not a durable checkpoint.

The checkpoint payload records the previous durable event/checkpoint identity,
but does not try to write its own final Git SHA into the same commit. The
published commit SHA becomes the external checkpoint identity after push.

Normal pushes are fast-forward only. A non-fast-forward rejection means
publication failed and must be reconciled; it must not be silently force-pushed.

The authoritative resume location is:

```text
latest valid pushed checkpoint on the currently claimed branch
+ current authoritative claim generation
+ actual remote/local Git state
```

### 5.3 Idempotent and ordered lifecycle transitions

- retry of the same `event_id` with identical payload is a no-op success;
- same `event_id` with different payload is `EVENT_CONFLICT`;
- lower or duplicate `event_seq` with a different event ID is rejected;
- a transition whose `previous_event_id` is not the current durable event is
  `OUT_OF_ORDER_EVENT`;
- a delayed event from an old claim generation is rejected.

This prevents duplicate/late stop hooks from overwriting newer evidence.

### 5.4 Meaningful checkpoint triggers

Create a durable checkpoint at meaningful boundaries, including:

- RED/reproducer established;
- root cause proven;
- architecture/product decision made;
- focused GREEN achieved;
- full verification achieved;
- blocker/decision discovered;
- material commit created;
- before risky/non-idempotent external mutation;
- before context/model/session rotation;
- before usage/context exhaustion.

### 5.5 External/non-idempotent operation journal

Git state alone cannot prove whether an external side effect completed.

Before a non-idempotent or difficult-to-reverse operation, publish an
`OPERATION_INTENT` checkpoint containing:

- operation_id;
- action category/target;
- authorization basis;
- idempotency key when the external system supports one;
- expected observable outcome;
- retry policy;
- rollback/mitigation where applicable.

After execution, publish exactly one outcome:

`SUCCEEDED | FAILED | UNKNOWN`.

If the side effect may have succeeded but outcome acknowledgement was lost,
record `UNKNOWN` and block retries until external state is reconciled. Never
infer failure merely because the tool response was lost.

### 5.6 GOAL_END

Every goal end records at minimum:

1. terminal result classification;
2. attempted vs actually completed work;
3. start HEAD and current/published checkpoint identity;
4. dirty state and changed files;
5. verification/evidence;
6. problems found;
7. each problem's fixed/unresolved/blocking state;
8. regression prevention when a material defect was fixed;
9. decisions/blockers;
10. exactly one next safe action.

Allowed terminal goal results:

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

A Goal-End is complete only when its checkpoint is durably published per §5.2.
If publication fails, the goal remains active/partial and the next goal is
blocked.

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
policy-check
control-transition-check
```

All execution-surface adapters call this same core. Hook/plugin implementations
must not reimplement claim semantics independently.

### 7.1 Trusted inputs and preflight output

Guard authorization inputs are only:

- latest fetched authoritative `origin/main` registry;
- actual Git/worktree/remote state;
- current PR/server evidence;
- lane-local durable checkpoint for the trusted claim generation.

Candidate-branch policy edits, model identity claims, and worker-modified Work
Orders never grant authority.

Success must be explicit:

`SAFE_TO_MUTATE = YES`

Failure must be fail-closed, for example:

```text
SAFE_TO_MUTATE = NO
reason = OWNERSHIP_CONFLICT
```

Preflight validates at least repository identity, current policy revision,
claim ID/generation, worktree, branch, base, dirty-state ownership,
deterministic scope overlap, checkpoint/event order, Work Order/handoff
existence, and material PR/state drift.

### 7.2 Canonical path and scope grammar

All guard implementations use one cross-platform canonicalization algorithm.

Canonical path rules:

1. input is repository-root-relative only;
2. convert separators to `/`;
3. Unicode-normalize to NFC;
4. reject absolute paths, drive prefixes, NUL, `.`, `..`, empty segments,
   and paths escaping repo root;
5. compare collision/authorization keys using Unicode case-folded canonical
   paths on every platform, including Linux CI;
6. fail repository preflight if tracked paths have a case-fold collision that
   cannot be represented safely on the Windows development host.

Allowed scope expressions are only:

- exact file path: `path/to/file.ts`;
- directory subtree: `path/to/dir/**`.

No negation, character classes, single-star wildcard, brace expansion, or
arbitrary glob grammar is permitted.

Forbidden scope always wins.

Overlap is deterministic:

- exact/exact overlap iff canonical keys equal;
- exact/subtree overlap iff exact path is inside subtree;
- subtree/subtree overlap iff either canonical subtree prefix contains the
  other.

Changed-file evaluation:

- add/untracked: check destination path;
- delete: check source path;
- rename/move: check both source and destination;
- copy: check source read policy and destination mutable policy where
  applicable.

Symlink/junction policy:

- scope is defined over Git repository paths, not resolved external targets;
- mutation through a symlink/junction that resolves outside the worktree root
  is denied;
- an in-root resolved target is re-authorized as if that resolved repository path had been requested directly: it must fall inside the same claim's mutable scope, outside its forbidden scope, and outside every other active lane's protected scope unless an explicit shared-file exception applies;
- guard/runtime code must resolve the actual target before mutation when the
  tool can traverse filesystem links.

### 7.3 Bounded shared-file exception

A shared-file exception is never an implied glob override. It must be an
authorized central claim record containing:

- exact canonical shared file path(s);
- participating claim IDs/generations;
- single temporary integration owner;
- dependency/merge order;
- release condition.

Forbidden scope still wins unless an explicit control-plane transition changes
the trusted policy.

## 8. Execution-surface adapters and assurance boundary

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
hard gate: the previous goal must already have a durable terminal Goal-End
checkpoint.

### Codex

Use available pre/post tool and stop/session events only as adapters to the same
guard core. File mutation outside the claimed scope should be denied before the
tool runs when the platform supports it.

### ChatGPT without hooks

The repository entry protocol requires explicit guard preflight before
mutation. Since chat cannot guarantee a local hook, server CI is the
integration backstop, not a guarantee that prohibited local/external side
effects never happened.

### GPT Work

Do not assume local tool hooks identical to Codex/ZCode. Use the same
repository preflight plus available PR/event-triggered reconciliation where
supported. Work output remains a claim until repo/remote evidence is checked.

### 8.1 Pre-execution side-effect policy

CI can reject integration; it cannot undo local filesystem, database, network,
deployment, notification, or other external side effects.

Therefore mutation adapters must classify commands/actions before execution:

- reversible repository-local mutation -> ordinary scope preflight;
- external but idempotent/read-only -> policy-defined allow path;
- non-idempotent/destructive/high-risk -> require authorization plus the
  durable `OPERATION_INTENT` journal in §5.5 before execution;
- opaque command whose target/effect cannot be established -> fail closed or
  require explicit authorization.

## 9. Server/CI enforcement and freshness

Future `ENV-COORD-003` adds a required coordination check, but a green check
is trusted only when the server enforcement contract below is active.

### 9.1 Current rollout dependency

Verified on 2026-09-07:

- GitHub reports `main` as **not protected**;
- repository rulesets list is empty.

Therefore the repository is currently:

`ENFORCEMENT_NOT_ACTIVE`

The existing `scripts` / `notify` checks do not constitute coordination
enforcement. New North-Star production dispatch remains paused until the guard
and required server policy are installed and verified.

### 9.2 Trusted check producer

The required coordination check must execute guard/workflow code from a
trusted authoritative base/control revision, not accept a candidate PR's
modified guard as proof that the same candidate is safe.

Normal product lanes may not modify guard code, the coordination workflow, or
server-policy configuration.

Control-maintenance changes use the bounded procedure in §11.7.

The required status check must be configured server-side as originating from
the trusted GitHub Actions integration/workflow identity (or an equivalently
trusted app). A check merely sharing the same display name is insufficient.

### 9.3 Integration evidence tuple

A valid coordination approval is bound to:

```text
pr_head_sha
current_policy_revision
registry_hash
claim_id
claim_generation
guard_version_sha
trusted_check_producer
required_review_evidence
```

If any tuple field changes, prior coordination approval is stale.

Missing, skipped, cancelled, neutral, unavailable, unauthenticated, or spoofed
required checks fail closed.

Required independent review evidence must exist, identify the reviewer
mechanism/context required by policy, and bind to the current PR head. Missing
or head-mismatched review is not approval.

### 9.4 Re-evaluation against latest main

An unchanged PR head must not remain mergeable solely because it was green
against an older policy revision.

The protected main integration path must require the coordination check to be
re-evaluated against latest authoritative main before merge, using an enforced
up-to-date merge/merge-queue mechanism or an equivalently serialized
server-side gate.

A `main` policy/claim change that can affect a PR invalidates its previous
coordination tuple and requires a new check.

Control transitions additionally enforce the expected revision/generation
contract in §4.3.

### 9.5 Required server properties

Before ENV enters enforced mode, `main` must have a server-enforced
branch/ruleset policy that, at minimum:

- blocks direct unreviewed integration;
- requires the trusted coordination status check;
- requires the branch/merge candidate to be evaluated against current main;
- does not allow ordinary agent/session bypass;
- defines who, if anyone, may use administrative bypass;
- prevents the credential available to ordinary agents from changing the
  ruleset/protection or using bypass;
- keeps any human break-glass/control credential outside ordinary agent
  execution surfaces;
- treats bypass as a recorded break-glass event, not a routine path.

Because multiple agents may share the repository owner's GitHub identity,
server policy—not account-name inference—is the authority boundary.

### 9.6 Coordination check failures

At minimum the required check fails when:

- a mutable PR has no recognized trusted claim;
- branch/task identity contradicts the claim;
- candidate policy tries to self-expand scope;
- changed files exceed canonical mutable scope;
- forbidden files are touched;
- two active lanes overlap without an authorized shared-file contract;
- claim generation is stale;
- required Work Order/lane handoff/durable terminal Goal-End is missing;
- lifecycle events are duplicate-conflicting or out of order;
- review evidence is missing/untrusted/head-stale;
- the current policy revision differs from the approved tuple;
- remote PR reality materially contradicts ownership without reconciled
  `STATE_DRIFT`.

CI must work even when the contributing agent has no hooks.

## 10. Central-registry and control-transition write policy

To avoid the exact collision the guard is meant to prevent:

- coordinator may **propose** claim allocation/reassignment/release transitions;
- only a server-validated transition merged into authoritative main changes
  actual authority;
- implementation worker may update only its lane Work Order, lane handoff,
  claimed source/tests/evidence;
- reviewer may write review evidence only in its allocated review surface;
- no worker self-claims shared files by editing `CURRENT-WORK.md` on its
  candidate branch;
- no model/session identity is sufficient to bypass the transition gate.

The guard implementation must make accidental or intentional candidate-branch
self-authorization machine-detectable.

## 11. Failure, recovery, bootstrap and repair

### 11.1 Crash during a goal

Resume from the latest durable pushed lane checkpoint + actual Git/remote state.
Classify unrecorded local changes as `PARTIAL` / `UNKNOWN`; never rerun
non-idempotent work blindly.

A torn local checkpoint that was not successfully pushed is not authoritative.

### 11.2 Stale central record

Actual remote/PR state triggers `STATE_DRIFT`. Stop only the affected lane,
retain its claim, reconcile, then continue unrelated healthy lanes whose claims
remain valid.

### 11.3 Stale claim

Mark `STALE_CLAIM`; do not auto-release. Coordinator proposes ACTIVE,
RECOVERY_HOLD, or RELEASED only after evidence inspection and the authorized
transition gate.

### 11.4 Former worker resumes after reassignment

The old `claim_generation` is fenced. Preflight returns
`STALE_CLAIM_GENERATION`; no mutation is allowed even if the old worktree is
otherwise clean.

### 11.5 Shared-file requirement

Serialize by default. If overlap is unavoidable, use the exact-path
shared-file exception in §7.3 before mutation.

### 11.6 Cold bootstrap / first guard implementation

The guard cannot require itself before it exists.

`BOOTSTRAP_CONTROL` is a temporary, explicit mode for `ENV-COORD-002/003`
and the first server-policy activation.

Bootstrap requirements:

- production feature dispatch remains paused;
- work occurs in isolated control-plane worktrees;
- mutable scope is limited to guard/tests/coordination docs/workflow/server
  policy needed for the bootstrap slice;
- existing repository safety and exact-SHA independent review remain binding;
- every bootstrap PR uses expected-head merge protection available at the time;
- server configuration changes require explicit human authorization;
- bootstrap evidence records the exact pre-enforcement limitations;
- no agent may claim "ENFORCING" until server policy is verified from the
  remote API and negative tests prove violating PRs are blocked.

Proposed rollout states:

```text
BOOTSTRAP_CONTROL
-> SHADOW        # guard/check reports but is not yet server-required
-> ENFORCING     # required check + protected current-main revalidation active
-> HARDENED      # adapters + chaos suite + recovery verified
```

North-Star production lanes remain paused until the project-defined activation
gate in §12 is satisfied.

### 11.7 Broken-guard control maintenance

If the guard/required workflow itself is broken, create a bounded
`CONTROL_MAINTENANCE` lane.

Normal repair path:

- exact allowed files: guard core/tests/workflow/coordination docs required for
  the defect;
- reproduce the guard defect;
- independent review of the repair exact SHA;
- server policy continues to enforce every unaffected gate;
- repair merges through normal current-main revalidation when possible.

If the broken guard makes compliant repair impossible, use `BREAK_GLASS`
only with explicit human authorization.

Break-glass requirements:

- no agent may self-authorize it;
- the authorizing human must act through a control credential or channel not
  available to the ordinary agent execution surface;
- if that privilege separation does not exist, stop at
  `HUMAN_CREDENTIAL_BOUNDARY_REQUIRED` rather than simulating authorization;
- record why the normal gate is impossible;
- smallest possible file/settings scope;
- two independent evidence passes when practical;
- capture exact before/after server policy and commit SHAs;
- open a material defect/incident record;
- re-enable normal enforcement immediately after repair;
- rerun negative enforcement and chaos tests before resuming production lanes.

A break-glass event never becomes precedent for ordinary bypass.

## 12. Rollout and activation gates

```text
ENV-COORD-001  architecture + lifecycle + security/fencing contract
ENV-COORD-002  guard core + registry parser + deterministic unit tests
ENV-COORD-003  CI integration in SHADOW mode + trusted evidence tuple
ENV-COORD-004  server enforcement activation (ruleset/protection/current-main revalidation)
ENV-COORD-005  ZCode plugin/hook adapter
ENV-COORD-006  Codex adapter
ENV-COORD-007  Chat/GPT Work bootstrap + PR/event reconciliation
ENV-COORD-008  multi-agent chaos/collision/recovery verification
ENV-COORD-009  activate North-Star production lanes under HARDENED guard
```

Dependencies:

- 002 follows only an approved 001 contract.
- 003 follows stable core schema/API from 002.
- 004 requires explicit human authorization for GitHub server policy changes.
- 005/006/007 may proceed in disjoint adapter scopes only after core semantics
  are stable.
- 008 validates local adapters, hookless CI enforcement, server freshness,
  bootstrap and repair paths together.
- 009 is blocked until the remote API proves server enforcement is active,
  required negative tests fail as expected, recovery tests pass, and no
  material coordination defect remains open.

The guard is not "enforced" merely because its code exists or a workflow is
green.

## 13. Mandatory deterministic and chaos scenarios

The final system is not accepted until evidence covers at least the scenarios
below with explicit expected outcomes.

1. **Same-file double claim** — second transition fails
   `OWNERSHIP_CONFLICT`.
2. **Same task on two branches** — stale/second generation is denied.
3. **Worker impersonates coordinator** — candidate self-claim has no authority;
   preflight and CI fail.
4. **Worker expands its Work Order scope** — effective scope remains the
   authoritative central claim; broader candidate contract fails
   `POLICY_CONTRADICTION`.
5. **Two control transitions from one registry revision** — after the first
   wins, the second fails `STALE_POLICY_REVISION` or collision revalidation.
6. **Old worker resumes after reassignment** — old generation fails
   `STALE_CLAIM_GENERATION`.
7. **Forbidden file edit** — pre-tool guard denies where available and CI also
   rejects the PR.
8. **New file inside/outside subtree** — canonical scope algorithm allows only
   the in-scope path.
9. **Rename/move crossing a scope boundary** — both source/destination are
   evaluated; unauthorized endpoint fails.
10. **Windows path alias/case variant** — canonical case-folded path cannot
    bypass a claim or create a false independent lane.
11. **Symlink/junction escape** — mutation resolving outside the worktree is
    denied.
12. **Goal 1 lacks terminal Goal-End then Goal 2 starts** — Goal 2 is blocked.
13. **Torn checkpoint** — local write/commit without successful verified push
    is not an authoritative resume point.
14. **Duplicate Goal-End event** — identical `event_id` is idempotent; changed
    payload is `EVENT_CONFLICT`.
15. **Out-of-order lifecycle event** — stale sequence/previous-event reference is
    rejected.
16. **Cross-worktree resume** — new execution context resumes only from the
    latest valid pushed checkpoint matching current generation.
17. **External operation succeeds but acknowledgement is lost** — operation
    remains `UNKNOWN`; automatic retry is blocked until reconciliation.
18. **Stale claim after inactivity** — state becomes `STALE_CLAIM`, scope
    remains locked.
19. **Former worktree inaccessible** — state becomes `RECOVERY_HOLD`; no new
    generation until reconciliation or explicit human-authorized abandonment.
20. **PR head changes after review** — exact-SHA approval is invalidated.
21. **Policy/ownership changes on main while PR head is unchanged** — previous
    coordination tuple becomes stale and required check re-runs/fails until
    current-policy validation passes.
22. **Missing required review** — merge gate fails.
23. **Forged/same-name untrusted check** — merge gate fails because producer
    identity is not trusted.
24. **Required check skipped/cancelled/unavailable** — fail closed; no merge.
25. **Hookless ChatGPT opens violating PR** — server-required check blocks
    integration.
26. **Healthy unrelated lane while another has STATE_DRIFT** — affected lane
    stops; unrelated disjoint lane remains valid.
27. **Concurrent independent lanes** — both pass without false collision.
28. **Authorized shared-file exception** — only declared exact path and
    integration owner are accepted; release restores exclusive ownership.
29. **Cold bootstrap** — first guard implementation can proceed only under
    `BOOTSTRAP_CONTROL` and cannot falsely report ENFORCING.
30. **First claim-allocation transition** — manual/bootstrap exact-SHA gate
    succeeds before normal guard enforcement exists.
31. **Broken-guard ordinary repair** — bounded `CONTROL_MAINTENANCE` path
    repairs without disabling unaffected policy.
32. **Broken guard requires break-glass** — no bypass without explicit human
    authorization; before/after policy and defect evidence are recorded.
33. **Worker says DONE while verification failed** — Goal-End cannot be
    `COMPLETED_VERIFIED`; integration remains blocked.
34. **Paused admitted invocation during reassignment** — pause a mutation after admission but before effect; transfer must remain blocked in `QUIESCING`/`RECOVERY_HOLD` until the invocation is cancelled/drained and `active_admissions = 0`; generation `g+1` must not activate earlier.
35. **Two live contexts resume the same claim/generation/goal** — only the trusted `execution_holder_id` may obtain mutation admission; the second context fails closed and must use an explicit transfer with a new generation.
36. **In-root link crosses lane boundary** — an allowed symlink/junction path resolving into another lane's protected in-root path is denied unless an explicit shared-file exception authorizes that exact resolved target.
37. **Goal-chain genesis vs predecessor** — the first-ever GoalStart in a generation may use `GENESIS`; every later GoalStart rejects an unterminated or non-terminal predecessor.

## 14. Acceptance for architecture freeze

This architecture may be marked `APPROVED_FOR_IMPLEMENTATION` only after a
fresh independent adversarial review confirms that:

- no second live SSoT is introduced;
- trusted authorization comes only from authoritative current-main policy, not
  candidate-branch Work Orders or model/GitHub identity claims;
- coordinator/control transitions have expected-revision serialization, claim-generation fencing, exactly one live `execution_holder_id` per generation, and a quiesce/drain transfer barrier that prevents already-admitted mutations from crossing ownership transfer;
- stale/inaccessible workers cannot silently free or retain mutation rights;
- task-level vs goal-level state ownership and terminal Goal-End requirements
  are unambiguous;
- checkpoint publication/replay ordering is durable and idempotent;
- non-idempotent external operation uncertainty fails closed;
- deterministic path/scope grammar covers new files, rename endpoints,
  case aliases, link escapes, and re-authorization of in-root resolved link targets against all active lane scopes;
- hookless agents remain governed at integration by a trusted server-required
  check evaluated against latest main;
- missing/skipped/spoofed/head-stale review/check evidence fails closed;
- current lack of branch protection/rulesets is explicitly treated as a
  rollout blocker, not as current enforcement;
- bootstrap and broken-guard repair have bounded admission paths;
- CI/local-hook assurance boundaries are explicit;
- rollout slices have disjoint ownership boundaries and the guard does not
  depend on itself before bootstrap completion.

## 15. Next safe action

Persist the independent `CHANGES_REQUIRED` evidence, verify this remediation
against each blocking finding and the current unprotected-main reality, freeze
and push a new exact SHA, then request a fresh independent adversarial review.
Do not activate `ENV-COORD-002` before that review returns APPROVED.
