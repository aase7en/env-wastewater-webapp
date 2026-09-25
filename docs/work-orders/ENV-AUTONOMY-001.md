# ENV-AUTONOMY-001 — ENV-local autonomy bootstrap and live proofs

## Assignment

- Status: `CLAIM_PROPOSED / BOOTSTRAP_CONTROL`
- Owner role: ENV project supervisor
- Supervisor route: GPT-6 Luna MAX (routing metadata only)
- Reviewer: independent GPT-6 Sol reviewer; implementation author must not merge
- Repository: `aase7en/env-wastewater-webapp`
- Worktree: `A:\GitHub\_worktrees\env-autonomy-bootstrap-20260926`
- Branch: `codex/env-autonomy-bootstrap-20260926`
- Base: `origin/main@839ff34185dff675a7bfd4adf6350d6b2c1e4eaa`
- Execution holder: `exec-holder-env-autonomy-001-g1-10b79866-9012-4701-9cf9-33ce6d00df5f`
- Last updated: 2026-09-26

## Objective

Install and prove a small ENV-specific execution-continuity layer that reuses
`docs/ai/CURRENT-WORK.md`, its Coordination Guard claim policy, Work Orders,
and one handoff per lane. The layer must help the supervisor recover state,
choose only safe READY work, route work by verified task fit, checkpoint
external waits, and refill safe capacity. It must not become a second task
registry, scheduler service, provider authority, or project roadmap.

This is the separately scoped autonomy-bootstrap action authorized in the
accepted `ENV-COORD-002-C1-RECOVERY-HOLD` Work Order. That C1 claim remains at
generation 1 with its existing holder and four-file lock. No file in its
mutable scope may be changed by this work.

## Current evidence and model fit — 2026-09-26

- Trusted base is `839ff34185dff675a7bfd4adf6350d6b2c1e4eaa`; the registry
  parsed successfully after PR #89, with C1 in `RECOVERY_HOLD` and enforcement
  still `BOOTSTRAP_CONTROL`.
- The local supervisor worktree at
  `A:\GitHub\_worktrees\env-wastewater-webapp-codex-supervisor` remains
  detached at its earlier base and has untracked `.serena/`. It is preserved
  untouched. This task uses the clean isolated worktree named above.
- Installed runtime: `codex-cli 0.156.1`; its help has no `codex hooks`
  command. Current official Codex Hooks documentation supports project
  `.codex/hooks.json`, command hooks, `commandWindows`, and the documented
  lifecycle events. It also says some tool paths are not covered and a failed
  hook does not universally block the operation. Installation and trust must
  therefore be proved in the actual fresh project session; local hooks are
  not server enforcement. Reference checked 2026-09-26:
  https://developers.openai.com/codex/hooks
- Installed Kilo CLI is `7.7.2`. A sanitized Kilo export on 2026-09-25
  evidenced a prior `cointh-glm/glm-5.3/max` session, but it does not prove
  current quota or upstream readiness. Refresh both immediately before any
  material GLM call.
- No JEV tool or executable was found in the current tool inventory or PATH.
  Record JEV as `UNAVAILABLE` unless a live supported read-only route is
  discovered; never fabricate Proof C.
- GPT-6 Luna MAX is assigned to task decomposition, reconciliation, routine
  orchestration, and low-risk integration under this explicit owner mission.
  GLM-5.3 MAX is a candidate for bounded heavy implementation; GLM-5.3 Flash
  is a candidate for read-only or low-risk analysis. Both need current
  task-bound provider admission. GPT-6 Sol is reserved for independent
  cross-cutting exact-SHA review. Model names are routing preferences, not
  identity or authorization evidence.

## Claim transition

The candidate adds `ENV-AUTONOMY-001-C1`, generation 1, with the exact
worktree, branch, base, holder, and scope recorded in the canonical registry
inside `docs/ai/CURRENT-WORK.md`.

Optimistic-concurrency fences for this proposal:

- expected policy revision: `839ff34185dff675a7bfd4adf6350d6b2c1e4eaa`
- expected registry hash: `894aa6d6238c7f2624dfea5d55f1cf0148868a96aa052a1e9b7d294abefda060`
- expected claim generation: `null` (new claim)
- proposed claim generation: `1`
- proposed status: `CLAIMED`

The candidate registry is not authority. Exact-SHA independent review, current
base and remote-diff checks, green exact-head CI, explicit owner
authorization already present in this task, and expected-head merge are
required before implementation mutation.

## Mutable scope

The claim owns only these paths:

- `docs/ai/CURRENT-WORK.md` — coordinator-controlled task lifecycle/claim
  fields; never self-expand scope or alter the C1 record.
- `docs/ai/HANDOFF.md` — the required caveat about the preserved stale
  supervisor worktree and a concise bootstrap checkpoint.
- `docs/ai/handoffs/ENV-AUTONOMY-001.md` — this lane's sole live execution
  checkpoint and receipt surface.
- `docs/work-orders/ENV-AUTONOMY-001.md` — this bounded contract and evidence.
- `.github/workflows/test.yml` — only to add the focused deterministic
  autonomy runtime suite to the existing scripts CI job; do not add secrets,
  permissions, coordination enforcement, deployment, or network steps.
- `.agents/skills/env-faster/**`
- `.agents/skills/env-nightshift/**`
- `.agents/skills/env-fleet-router/**`
- `.agents/skills/env-kilo-lifecycle/**`
- `.codex/hooks.json`
- `.codex/hooks/env_lifecycle.py`
- `scripts/env_autonomy_runtime.py`
- `scripts/test_env_autonomy_runtime.py`

`CURRENT-WORK.md` stays the only task/claim authority. The four skill folders
are instructions and adapters, not another registry. `ENV-AUTONOMY-001.md` is
the lane handoff, not a database. Do not add a daemon, new service, external
dependency, parallel Roadmap, or provider/model authority.

## Forbidden scope and safety

- C1's locked files: `scripts/env_coordination_guard.py`,
  `scripts/test_env_coordination_guard.py`,
  `docs/work-orders/ENV-COORD-002.md`, and
  `docs/ai/handoffs/ENV-COORD-002-GLM.md`.
- Existing coordination architecture, `AGENTS.md`, all GitHub server/branch
  policy and coordination workflow changes, production `frontend/**`,
  `supabase/**`, `data/**`, and `.env`. The exact test workflow exception
  above cannot alter secrets, permissions, deployment, or coordination gates.
- A-Wiki content; it is read-only context and has a separate ownership
  boundary.
- Real hospital records, PHI, credentials, production database writes,
  deployments, or provider prompts containing identifiable/operational data.
- Direct unbound heavy-provider invocation or Kilo mutation that bypasses the
  accepted task/claim/worktree admission route.

The bootstrap can add useful local guards, but it must report
`ENFORCEMENT_NOT_ACTIVE` until the independent ENV-COORD-003/004 rollout proves
trusted CI and server-side controls. Green CI or a trusted local hook does not
change that statement.

## Required implementation behavior

### ENV-Faster skill and selector

- Derive work only from the canonical Roadmap, `CURRENT-WORK.md`, and bounded
  Work Orders; do not create tasks to fill capacity.
- Cap simultaneously ACTIVE mutable lanes at 3 and independent read-only
  review lanes at 1.
- Count `WAITING_EXTERNAL` or `PARKED` lanes outside active WIP only when
  ownership and the latest checkpoint are safely published.
- Require each mutable lane to bind project, repo, worktree, branch, exact
  base/head, task/Work Order, claim generation/holder, scope, dependencies,
  lane kind, provider/model, and run identity.
- Reject overlapping mutable scope unless the existing Coordination Guard
  explicitly authorizes an exact shared-path exception.
- Set `AUTO_REFILL_REQUIRED=true` only when a real independent SAFE_READY lane
  exists and active capacity is free; otherwise return `false` with the
  concrete reason.

### ENV-NightShift skill

Use the documented loop:

`RECOVER -> RECONCILE -> HARVEST -> REFRESH READY -> AUTO-FILL -> EXECUTE -> VERIFY -> REVIEW -> REPAIR -> CI -> MERGE -> POST-MAIN -> HARVEST -> AUTO-FILL`.

Treat waits as nonterminal. After checkpointing a lane in
`WAITING_EXTERNAL`/`PARKED`, refresh the READY set and take independent safe
work. Wait quietly for unchanged external state; do not repeatedly poll or
spin recursively. Preserve `NEW SESSION != NEW TASK` and distinguish lost
turns from failed executions.

### ENV-Fleet-Router and Kilo lifecycle adapter

- Route GPT-6 Luna MAX, GPT-6 Sol, GLM-5.3 MAX, GLM-5.3 Flash, and JEV
  according to the mission's task-fit policy, with current evidence and
  limitations attached to material assignments.
- Keep JEV strictly `READ_ONLY`; it cannot own claims, write files, approve,
  satisfy acceptance alone, or authorize providers.
- Before a material GLM dispatch, refresh proxy quota and upstream model
  readiness separately through a verified secret-safe path. `UNKNOWN` fails
  closed; 401/403 means auth/entitlement, not quota exhaustion.
- Bind each dispatch to task, claim/generation/holder, worktree, branch,
  exact HEAD/base, exact scope, provider/model/variant, and execution/run ID.
- Treat Kilo/ZCode session list/export as observation only. Direct CLI presence,
  `Worker online`, model name, or quota count is not a terminal execution
  receipt.
- Persist `REQUESTED -> RESULT_WRITTEN -> INGESTED_TO_SSOT -> ARCHIVED/CLEARED`
  through the existing bounded transport/handoff rules in
  `ENV-AGENT-OPS-002`; do not ask the user to copy result text.

### Codex lifecycle hook and receipts

- Use the installed/runtime-supported Codex Hooks schema only. Hook events
  may adapt recovery, preflight, receipt capture, compaction/interrupt/stop,
  and session boundaries, but unsupported or uncovered paths must be stated.
- On mutation-capable calls, bind the actual task, claim generation/holder,
  repo/worktree/branch/base/head, scope, lane kind, and provider/run identity;
  capture Codex `session_id`/`turn_id` when the event supplies them. The opaque
  registry holder ID is a tuple field, not authentication. Fail closed where
  the hook event supports blocking if any required fact is missing or stale.
- Reuse the Coordination Guard core. Do not copy its claim parser or policy
  into a second authorization implementation.
- Write lifecycle/effect evidence to the one lane handoff using the existing
  event order and operation intent/outcome semantics. `UNKNOWN` effects block
  retry. A local write or local commit is not durable: require fast-forward
  push and verified remote head before advertising a recoverable checkpoint.
- Hook discovery/trust must be verified in a fresh session. If this installed
  runtime cannot activate the merged project hook in the current session,
  finish the review/CI/merge and checkpoint sequence, then emit the single
  `HOOK_ACTIVATION_RESTART_REQUIRED` gate with path, accepted SHA, clean
  worktree proof, and continuation prompt. Preserve the original untracked
  `.serena/` tree; use a separate clean primary worktree for that gate if
  needed.

## Verification and live acceptance proofs

Run focused deterministic tests for the selector, exact identity/scope
binding, WIP/refill behavior, lifecycle ordering/idempotency, unknown effects,
stale policy/generation, and reviewer independence. Use synthetic state only.
Wire that test module into the existing `.github/workflows/test.yml` scripts
job, then run the relevant repository script checks and exact-head hosted CI.
Do not read `.env` values or `data/raw/`.

Before claiming `ENV AUTONOMY READY`, capture these five proofs in this Work
Order and lane handoff:

1. **GLM-5.3 MAX:** one bounded task through the accepted structured adapter;
   include redacted task/claim/worktree/SHA/provider/variant/run/result
   identity. No raw output or hospital data.
2. **GLM-5.3 Flash:** one bounded read-only or low-risk task through the same
   admission and receipt path.
3. **JEV:** one real read-only advisory call with zero mutations. If no
   supported live route exists, mark `UNAVAILABLE`; do not substitute a GPT
   response.
4. **Review independence:** show an author cannot satisfy the independent
   review gate and record an exact-SHA reviewer result.
5. **Wait/refill:** demonstrate a genuinely waiting/parked lane releasing
   active capacity while an independent canonical SAFE_READY lane starts,
   never exceeding WIP. A test fixture alone does not prove the live system.

Until every required live proof is accepted, report the exact adapter state
and keep the system `AUTONOMY_NOT_READY`. Provider waiting does not stop
independent authorized work. A human gate requires durable evidence of a
missing user-only credential, authorization, access, or unresolved authority
decision.

## One next safe action

Review this docs-only exact-SHA claim transition, refresh the base/registry
fences and CI, then let the independent reviewer merge only with
`--match-head-commit`. No skills, hooks, scripts, or runtime mutation before
that merge is verified on main.
