# ENV-COORD-001 — Enforceable multi-agent coordination architecture

Status: REVIEW_REQUESTED
Risk: HIGH (project-control / multi-agent governance)
Owner / architecture lead: GPT-5.6 Sol
Implementation surface: docs-only architecture contract
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-coord-001`
Branch: `docs/env-coord-001`
Base: `origin/main@a8fa47137d640a479d3dbc88f6e8c198d266c7f0`
Exact HEAD: PENDING_REMEDIATION_CHECKPOINT
Independent architecture reviewer: GPT-6 Astra or strongest available
high-reasoning reviewer in a fresh context
Lane handoff: `docs/ai/handoffs/ENV-COORD-001-SOL.md`
Last updated: 2026-09-07

## Objective

Design the enforceable coordination layer that prevents stale SSoT,
overlapping claims, uncheckpointed long-running goals, and duplicate mutation
across GPT / GLM / Codex / GPT Work / workers before new ENV North-Star
production lanes are distributed.

## User-confirmed requirements

- Do not rely on chat memory.
- Long sessions may contain multiple tasks and multiple `/goal` runs.
- Every goal completion must persist progress, evidence, problems, fixed vs
  unresolved status, blockers, and next action.
- Reusable failures must be remembered so the same problem is not repeatedly
  rediscovered.
- Hook-capable surfaces should enforce the workflow automatically.
- Hookless ChatGPT sessions must still be safe through repo entry rules and CI.
- Avoid the stale handoff/current-work failure previously observed in
  multi-agent projects.

## Preconditions / evidence

- PR #81 `SDLC-OPT-001` was independently reviewed at exact head
  `d9b5ea0bb7b67f6e41f9328174dd220df7d1767d` and merged as
  `a8fa47137d640a479d3dbc88f6e8c198d266c7f0` before this branch was created.
- Primary checkout is stale/dirty/protected; this work uses an isolated clean
  worktree based on current `origin/main`.
- Open PR #80 owns GISTDA adapter files only.
- Open PR #75 owns the Building repair decision Work Order only.
- No open PR owns the files in this lane.

## Mutable scope

- `docs/ai/architecture/ENV-COORDINATION-GUARD.md`
- `docs/work-orders/ENV-COORD-001.md`
- `docs/ai/handoffs/ENV-COORD-001-SOL.md`
- bounded active-frontier reconciliation in `docs/ai/CURRENT-WORK.md`
- bounded coordinator checkpoint in `docs/ai/HANDOFF.md`

## Forbidden scope

- `frontend/**`
- `supabase/**`
- production schema/RLS/data/provider code
- `.claude/**`, ZCode/Codex hook implementation
- `.github/workflows/**`
- guard scripts/runtime implementation
- PR #80 GISTDA scope
- PR #75 Building scope
- ENV-OPS-001A production implementation
- destructive cleanup of the dirty primary checkout

## Architecture decisions to settle

1. authority hierarchy and no-shadow-SSoT rule;
2. coordinator-only central claim allocation;
3. worker-owned lane-local goal checkpoints;
4. task / claim / goal state machines;
5. `STALE_CLAIM` semantics with no automatic release;
6. GoalStart / Checkpoint / GoalEnd requirements;
7. defect-memory promotion rules;
8. one platform-independent guard core;
9. hook adapter boundaries for ZCode/Codex/Chat/Work;
10. required CI backstop for hookless/bypassing clients;
11. recovery after crash, stale state, head drift, and scope collision;
12. rollout and chaos-test plan.

## Acceptance

- Architecture has no second live task registry.
- A new zero-chat-history worker can determine where live state belongs.
- Central claim writes and lane-local goal writes cannot contend by default.
- A new goal cannot silently replace an uncheckpointed prior goal.
- A stale claim does not become free solely because time elapsed.
- Hook-capable agents can be denied before out-of-scope mutation.
- Hookless agents are still blocked by CI before integration.
- Exact-SHA review invalidates on head drift.
- Material defects require executable prevention before global defect memory.
- The plan names deterministic chaos scenarios for multi-agent collisions.
- No production/runtime/hook/CI mutation occurs in this architecture-only WO.

## Verification

- inspect exact diff and changed-file list;
- `git diff --check`;
- confirm only mutable docs paths changed;
- search architecture for all required lifecycle/invariant terms;
- reconcile open PR ownership immediately before freeze;
- push exact SHA and inspect remote diff;
- independent adversarial architecture review bound to exact SHA.

No frontend build/E2E is required for this docs-only architecture slice.

## Stop rule

Architecture author stops at `REVIEW_REQUESTED`. Do not activate
`ENV-COORD-002` until independent review findings are resolved and this
contract is explicitly `APPROVED_FOR_IMPLEMENTATION`.

## Verification checkpoint — R0 candidate — 2026-09-07

- Clean isolated base: `a8fa47137d640a479d3dbc88f6e8c198d266c7f0`.
- R0 exact reviewed SHA: `708bac20b03aa2d6c1ef3b4afc2c50a7c6df1c33`.
- `git diff --check`: PASS.
- Intended task-owned paths: architecture contract, Work Order, lane handoff,
  bounded `CURRENT-WORK.md`, bounded `HANDOFF.md`.
- `.serena/` was generated by tool activation, is not task-owned, and MUST
  remain uncommitted.
- Open PR ownership rechecked: #80 GISTDA and #75 Building do not overlap this
  scope.
- No frontend/schema/RLS/provider/hook/CI/runtime files changed.

## Independent adversarial review R1 — CHANGES_REQUIRED

Reviewer verdict is bound to exact SHA
`708bac20b03aa2d6c1ef3b4afc2c50a7c6df1c33`.

Blocking architecture gaps:

1. coordinator authorization/trusted policy inputs and precedence undefined;
2. claim transition lacked expected-revision serialization and generation
   fencing;
3. CI/server enforcement/freshness and bypass policy incomplete;
4. path/scope grammar and overlap semantics non-deterministic;
5. durable checkpoint publication/replay/external-operation uncertainty
   undefined;
6. bootstrap and broken-guard repair admission undefined.

The reviewer explicitly blocked `ENV-COORD-002`.

## R1 remediation contract

R1 remediation adds:

- authoritative-current-main-only policy inputs and candidate-branch
  self-authorization denial;
- coordinator authority as a server-validated control transition rather than
  model/Git/GitHub-identity assertion;
- `claim_id` + monotonic `claim_generation` fencing;
- expected policy revision/registry hash/generation for claim transitions;
- `RECOVERY_HOLD` for inaccessible former workers;
- durable checkpoint identity/order/idempotency and fast-forward remote
  publication;
- operation intent/outcome journal for non-idempotent external actions;
- exact deterministic path grammar/case-fold/rename/link rules;
- trusted CI evidence tuple, current-main re-evaluation, missing/spoofed/skipped
  fail-closed behavior;
- explicit current repository state `ENFORCEMENT_NOT_ACTIVE` because remote
  API confirms `main` has no branch protection and no rulesets;
- cold bootstrap, control-maintenance and human-authorized break-glass repair;
- expanded deterministic/chaos scenarios for every R1 trace.

## R1 reviewer-finding traceability

| R1 finding | Remediation section(s) | Expected reviewer check |
|---|---|---|
| Coordinator authorization / trusted policy precedence | Architecture §3.1–§3.3, §10 | Candidate Work Order cannot widen authority; same GitHub identity is not authentication; agent credentials cannot bypass server policy |
| Atomic claim transition / fencing | §4.2–§4.5 | expected policy revision + registry hash + generation; old worker fenced; inaccessible worker -> RECOVERY_HOLD |
| CI/server enforcement/freshness | §9.1–§9.6 | current main unprotected is explicit blocker; trusted producer; evidence tuple; current-main re-evaluation; missing/spoofed/skipped fail closed |
| Deterministic scope semantics | §7.2–§7.3 | exact path/subtree grammar; case-fold/NFC; rename endpoints; new files; link escape; forbidden precedence |
| Checkpoint durability / replay / side effects | §5.2–§5.6, §8.1 | commit+push+remote verify; event ID/order; terminal Goal-End; OPERATION_INTENT and UNKNOWN outcome blocks retry |
| Bootstrap / broken-guard repair | §11.6–§11.7, §12 | BOOTSTRAP_CONTROL -> SHADOW -> ENFORCING -> HARDENED; bounded CONTROL_MAINTENANCE; human-only BREAK_GLASS |

## Independent adversarial review R2 — CHANGES_REQUIRED

Reviewer verdict is bound to exact SHA
`92bf8803f73ca950dd4d73a964ad740caecf236a`.

One P1 architecture gap remained:

- generation fencing covered preflight/reassignment state but did not prove that
  an invocation already admitted under generation `g` had drained/cancelled
  before `g+1` could become active.

Required ordering guarantee:

- stop new admissions;
- drain/cancel already-admitted mutations;
- prove no unresolved mutation/external-operation remains;
- only then transfer ownership; otherwise retain the scope lock.

Non-blocking review items also requested in-root resolved-link re-authorization,
removal of the duplicated historical HANDOFF heading, and explicit chaos cases
for paused admitted mutation, duplicate live contexts, link cross-lane target,
and first-goal genesis.

## R2 remediation contract

R2 adds:

- exactly one trusted `execution_holder_id` per claim generation;
- atomic mutation admission gate and active-admission set;
- `QUIESCING -> TRANSFER_READY` barrier before generation transfer;
- `QUIESCENCE_ATTESTATION` with `active_admissions = 0` and no unresolved
  external operation;
- no hot reassignment when a platform cannot reliably expose/drain admissions;
- second live context cannot reuse the same claim generation;
- first GoalStart uses `GENESIS`, later GoalStart requires terminal Goal-End;
- in-root symlink/junction targets are re-authorized against all active lane
  scopes;
- duplicated HANDOFF heading removed;
- four new deterministic/chaos cases covering the R2 schedule.

## Stop / review state

R2 remediation must stop at `REVIEW_REQUESTED` on a new exact pushed SHA.
Do not activate `ENV-COORD-002` until a fresh independent reviewer returns
`APPROVED` for that exact SHA.

## One next safe action

Verify the R2 transfer-ordering remediation and non-blocking cleanup, freeze/push the new candidate, inspect the actual remote PR diff, and request fresh independent adversarial review.
