# ENV-AUTONOMY-001 — ENV-local autonomy bootstrap and live proofs

## Assignment

- Status: `CHANGES_REQUIRED / BOOTSTRAP_CONTROL` after hosted Actions run
  `36205380772` found a Linux/Windows path-semantics mismatch in a regression
  at candidate `cb1c396`; trusted `origin/main` remains `CLAIMED` until this
  implementation PR merges.
- Owner role: ENV project supervisor
- Supervisor route: GPT-6 Luna MAX (routing metadata only)
- Reviewer: independent GPT-6 Sol reviewer; implementation author must not merge
- Repository: `aase7en/env-wastewater-webapp`
- Worktree: `A:\GitHub\_worktrees\env-autonomy-bootstrap-20260926`
- Branch: `codex/env-autonomy-bootstrap-20260926`
- Claim base: `839ff34185dff675a7bfd4adf6350d6b2c1e4eaa`
- Current implementation base: `origin/main@0ea079d69c3186272f1ae6be82cbbeb22ed99266`
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

- The claim transition in PR #90 was independently reviewed and merged as
  `0ea079d69c3186272f1ae6be82cbbeb22ed99266`; current trusted registry hash is
  `2e8da438901c452cdc709942603733153aba7bd4b88c5bbda201cb02f059ed24`.
  The autonomy claim is `CLAIMED`, generation 1. C1 remains in
  `RECOVERY_HOLD`; enforcement is still `BOOTSTRAP_CONTROL`.
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
- Local verification on the current code candidate: autonomy runtime
  **25/25 PASS**, Coordination Guard **344/344 PASS**, workflow-action
  regressions **14/14 PASS**, workflow semantic checker PASS, `split_sql`
  regressions PASS, Python compilation PASS, and `git diff --check` exits 0
  (with CRLF-normalization warnings only). The actual runtime status passes
  this claim's identity preflight; refill finds 0 canonical SAFE_READY tasks,
  and Kilo admission remains `UNKNOWN` for both proxy quota and upstream
  readiness. No provider request was made.
- GitHub Actions run `36195805695` passed at code HEAD
  `db8d4785a07b36c76e206da6706a9426d5962114`; run `36196641540` passed
  `scripts` and `notify` at `6dbfd47fef14ef782d138dc357d47e31d3d41313`.
  After the four review repairs, `36205380772` failed the `scripts` job at
  `cb1c396`: Linux treated `C:outside.txt` as an ordinary relative filename,
  unlike Windows' drive-relative path semantics. Commit `7b456fc` now checks
  Windows drive/root syntax with `PureWindowsPath` on every host. Local
  autonomy tests pass **25/25** after this repair; exact-head hosted Actions
  must be rerun before review.
- Fresh review at `6dbfd47fef14ef782d138dc357d47e31d3d41313` found three P1s
  and one P2: wildcard protected-path reads, blocked Kilo REQUESTED/outcome
  progress, historical receipt verification coupled to current admission, and
  missing exact claim scope in the durable binding. Code commits `87a5d47`
  and `1565c5b` address those findings. The real checkpoint CLI also exposed
  immutable trusted-claim dependencies as tuples while the binding API expects
  lists; `1565c5b` normalizes that comparison, pinned by a new regression.
  Exact-head hosted Actions and fresh independent review are pending on the
  new published candidate.
- The installed Kilo 7.7.2 CLI help exposes `profile`, `models`, and
  `roll-call`; the official CLI reference describes `roll-call` as a model
  connectivity/latency test that sends prompts. Kilo's published balance is
  account credit state, while successful inference is a separate upstream
  request. No documented non-billable `cointh-glm` quota + upstream readiness
  probe was identified, so no `roll-call` or model call was made. References:
  [Kilo CLI reference](https://kilo.ai/docs/code-with-ai/platforms/cli-reference),
  [Kilo Gateway usage and billing](https://kilo.ai/docs/gateway/usage-and-billing).

## Claim transition — merged and verified

PR #90 added `ENV-AUTONOMY-001-C1`, generation 1, with the exact worktree,
branch, base, holder, and scope recorded in the canonical registry inside
`docs/ai/CURRENT-WORK.md`. It received independent exact-SHA approval and
merged as `0ea079d69c3186272f1ae6be82cbbeb22ed99266`; the accepted Guard
registry is authoritative and implementation is active within that scope.

Optimistic-concurrency fences at proposal time:

- expected policy revision: `839ff34185dff675a7bfd4adf6350d6b2c1e4eaa`
- expected registry hash: `894aa6d6238c7f2624dfea5d55f1cf0148868a96aa052a1e9b7d294abefda060`
- expected claim generation: `null` (new claim)
- proposed claim generation: `1`
- proposed status: `CLAIMED`

The merged claim authorizes implementation only within the exact mutable
scope below. It does not authorize server-side enforcement or production lane
dispatch.

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
- Dispatch admission requires fresh task-bound evidence with both proxy quota
  and upstream readiness `READY`. The current `kilo-preflight` adapter returns
  `UNKNOWN` (`NOT_CONFIGURED_FOR_SECRET_SAFE_QUOTA_PROBE`) and refuses request
  admission; no Kilo prompt/roll-call has been sent. The persisted
  `kilo-receipt-transition` / `kilo-receipt-verify` CLI stores receipts in the
  existing lane handoff and derives state from trusted claim/context plus
  published lifecycle evidence; caller-supplied booleans and event/SHA claims
  are not accepted as proof.
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

Commits `87a5d47` and `1565c5b` repair the four independent-review findings and the immutable trusted-dependency binding blocker. Commit `7b456fc` fixes the cross-platform Windows path fixture identified by hosted run `36205380772`; local autonomy tests pass **25/25**. The lane handoff records `CHANGES_REQUIRED` in event `env-autonomy-001-checkpoint-0010` from code HEAD `7b456fc`; publish and verify that checkpoint, rerun exact-head hosted CI, and then request fresh independent exact-SHA review if the checks pass. Keep Kilo dispatch disabled while admission is `UNKNOWN`, and preserve `ENFORCEMENT_NOT_ACTIVE` and `AUTONOMY_NOT_READY` until actual hook activation, server controls, and all applicable live proofs are verified.
