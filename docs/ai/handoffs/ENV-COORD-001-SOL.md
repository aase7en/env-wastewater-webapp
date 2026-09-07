# ENV-COORD-001 — GPT-5.6 Sol lane handoff

Status: REVIEW_REQUESTED
Task: `ENV-COORD-001`
Owner: GPT-5.6 Sol
Worktree: `A:\\GitHub\\envww-coord-001`
Branch: `docs/env-coord-001`
Base: `origin/main@a8fa47137d640a479d3dbc88f6e8c198d266c7f0`
HEAD: PENDING_REMEDIATION_CHECKPOINT
Dirty state: expected task-owned docs changes only after drafting
Last updated: 2026-09-07

## Current goal

Design the enforceable multi-agent coordination architecture before any new
North-Star production lanes are dispatched.

## Completed / verified

- Re-read repository freshness/ownership rules and multi-agent SSoT contract.
- Reconciled remote reality: PR #81 was reviewed and merged before this branch.
- Verified open PR #80 and #75 do not overlap this lane.
- Protected the stale/dirty primary checkout by creating a clean isolated
  worktree from current `origin/main`.
- R0 architecture candidate pushed/opened as PR #82 at exact SHA
  `708bac20b03aa2d6c1ef3b4afc2c50a7c6df1c33`.
- Independent Astra review returned `CHANGES_REQUIRED` and explicitly blocked
  `ENV-COORD-002`.
- Remote API was independently rechecked: `main` is not branch protected and
  repository rulesets are empty. Current state is therefore
  `ENFORCEMENT_NOT_ACTIVE`.

## R1 findings being remediated

1. trusted coordinator authorization/policy precedence;
2. atomic expected-revision claim transitions + generation fencing;
3. trusted server CI/current-main freshness/bypass handling;
4. deterministic scope/path overlap semantics;
5. durable checkpoint ordering/replay + external side-effect uncertainty;
6. cold bootstrap and broken-guard repair admission.

## R1 architecture direction

- trusted authorization comes only from latest fetched `origin/main` claim
  policy, never a candidate Work Order or agent identity;
- candidate Work Orders cannot widen central scope;
- claims carry `claim_id` + monotonic `claim_generation`;
- control transitions carry expected policy revision/registry hash/generation;
- stale generations are fenced even when sessions share one GitHub identity;
- inaccessible previous workers enter `RECOVERY_HOLD`, never auto-release;
- GoalStart requires prior durable terminal Goal-End;
- checkpoint publication means commit + fast-forward push + remote-head verify;
- lifecycle events have stable ID/sequence/predecessor for idempotent replay;
- non-idempotent external actions require published intent/outcome journal;
- path grammar is exact-path or subtree-only with cross-platform canonical
  normalization, forbidden-first precedence and rename/link handling;
- CI approval is bound to PR head + current policy revision + claim generation +
  trusted producer + review evidence and must re-evaluate against current main;
- bootstrap proceeds through BOOTSTRAP_CONTROL -> SHADOW -> ENFORCING ->
  HARDENED;
- broken guard has bounded CONTROL_MAINTENANCE and human-only BREAK_GLASS.

## R2 review / remediation

R1 remediation was pushed at exact SHA
`92bf8803f73ca950dd4d73a964ad740caecf236a`.

Fresh Astra review returned `CHANGES_REQUIRED` with one remaining P1:
already-admitted mutation invocations could theoretically cross a generation
transfer after preflight.

R2 remediation now defines:

- one `execution_holder_id` per generation;
- atomic admission gate + active-admission set;
- `QUIESCING -> admission gate CLOSED -> active_admissions = 0 ->
  QUIESCENCE_ATTESTATION -> TRANSFER_READY -> g+1`;
- no new generation while any admitted invocation is paused/hung/unknown;
- no hot reassignment on platforms that cannot reliably prove drain/cancel;
- second live context requires explicit transfer/new generation;
- first GoalStart uses `GENESIS`; later goals require terminal Goal-End;
- in-root link targets are re-authorized against lane scopes;
- duplicated HANDOFF heading removed;
- R2 chaos cases added.

## Evidence

Architecture contract:
`docs/ai/architecture/ENV-COORDINATION-GUARD.md`

Work Order:
`docs/work-orders/ENV-COORD-001.md`

PR:
`#82`

R0 reviewed SHA:
`708bac20b03aa2d6c1ef3b4afc2c50a7c6df1c33`

R1 reviewed SHA:
`92bf8803f73ca950dd4d73a964ad740caecf236a`

## Blockers

`ENV-COORD-002` remains blocked until R2 remediation is pushed and a fresh independent exact-SHA architecture review returns `APPROVED`.

## Do not do

- do not start `ENV-COORD-002`;
- do not modify hook/CI/runtime code in this lane;
- do not touch PR #80/#75 scope;
- do not clean/reset the primary checkout;
- do not claim branch protection/server enforcement exists yet.

## One next safe action

Run docs-only R2 verification for transfer ordering, duplicate live contexts, GoalStart genesis, and resolved-link authorization; freeze/push a new exact SHA to PR #82; then request fresh independent adversarial review.
