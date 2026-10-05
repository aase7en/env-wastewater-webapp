# ENV-AUTONOMY-002 — Autonomy runtime fail-closed hardening

Status: CLAIMED / BOOTSTRAP_CONTROL (registered 2026-10-05)
Risk: HIGH — admission control, protected-data boundary, lifecycle integrity.
Repository: aase7en/env-wastewater-webapp.

## Assignment

- Task: `ENV-AUTONOMY-002`; claim `ENV-AUTONOMY-002-C1`, generation 1.
- Holder: `zcode-env-autonomy-002-g1-primary` (GLM-5.3 MAX lane; external
  cointh/Kilo dispatch remains disabled with quota/upstream `UNKNOWN`, so the
  admitted route is the in-session GLM lane under the current supervisor).
- Worktree: `A:\GitHub\_worktrees\env-autonomy-002-20261005`;
  branch `codex/env-autonomy-002-hardening`; base `origin/main@9f5a089f99e9682848aae62b5b4842566c0b8081`.
- Reviewer: independent GPT-6 Astra via Codex CLI (GPT-6.1 Sol not admitted on
  the current account). The implementing lane must not merge its own PR.
- Mutable scope (exactly):
  `scripts/env_autonomy_runtime.py`,
  `scripts/test_env_autonomy_runtime.py`,
  `.codex/hooks.json`,
  `.codex/hooks/env_lifecycle.py`,
  `docs/work-orders/ENV-AUTONOMY-002.md`,
  `docs/ai/handoffs/ENV-AUTONOMY-002.md`.
- Forbidden: `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, the C1 locked
  four files, `docs/ai/architecture/ENV-COORDINATION-GUARD.md`, `AGENTS.md`,
  `frontend/**`, `supabase/**`, `data/**`, `.env`.

## Source of findings

Retroactive independent exact-SHA review of the merged ENV-AUTONOMY-001
implementation at `origin/main@9f5a089` (GPT-6 Astra via Codex CLI,
2026-10-05, read-only, high reasoning) returned `CHANGES_REQUIRED` with five
findings. Full verdict text is recorded in the ENV-AUTONOMY-001 closeout PR
and in `docs/ai/handoffs/ENV-AUTONOMY-001.md`.

## Required repairs (RED-first, smallest fail-closed fix each)

1. **P1 — argument splatting bypass.** PowerShell `Get-Content @readArgs`
   (and the ripgrep equivalent) is classified by the literal token, so a
   splatted variable whose value names `.env` / `data/raw/` is allowed.
   Reject splatting/expansion syntax (`@name`, and any unexpanded
   variable-bearing token) as `UNKNOWN` before literal-path classification.
2. **P1 — admitted session identity drift.** Mutation-admission preflight
   derives the claim identity from current policy, so a resumed
   pre-reassignment session passes under a new generation/holder. Persist the
   session's admitted `(claim_id, generation, holder)` tuple at first
   admission and reject any drift on later invocations.
3. **P1 — unpublished reconciliation bypass.** Replay coerces a locally
   appended `published: false` `OPERATION_RECONCILED` event to `published:
   true`, clearing the unresolved-operation gate before durable publication.
   Keep pending-event validation separate from authoritative admission
   replay; an unpublished reconciliation must not re-open mutation admission.
4. **P2 — unredacted `git remote -v`.** The unconditional READ_ONLY allowance
   can print credential-bearing remote URLs into transcripts. Deny it or
   replace it with a sanitized identity check that never emits the raw URL.
5. **P2 — duplicate post-tool receipt `KeyError`.** Redelivered
   `tool_use_id` returns the idempotent result, but the hook path then reads
   `changed_paths` from it. Handle the idempotent shape explicitly and return
   the original observation/no-op.

## Successor lifecycle routing prerequisite

Before the five Astra repairs begin, close the exact reviewer blocker found on
PR #96: the current `append-event` CLI is hard-coded to
`ENV-AUTONOMY-001`, so the successor cannot publish its own lifecycle
checkpoint. This prerequisite is explicitly authorized within the existing
runtime/test/handoff mutable scope:

- add `--task` to `append-event` with backward-compatible default
  `ENV-AUTONOMY-001`, then resolve the claim with
  `policy.claim_by_task(args.task)`; unknown tasks must fail closed;
- preserve all existing claim/worktree/scope validation; selecting a task
  never creates authority;
- use the version-1 lifecycle bootstrap block already registered in
  `docs/ai/handoffs/ENV-AUTONOMY-002.md`; it intentionally contains no
  fabricated goal event;
- after this routing fix is GREEN, append the first `GOAL_START` for
  `ENV-AUTONOMY-002` using the actual current execution goal id via
  `--goal-id`, publish/verify it, then use the normal typed lifecycle path for
  checkpoints and operation events;
- add deterministic regressions proving successor task selection works, the
  old default remains compatible, unknown tasks fail closed, and no C1 or
  other-claim handoff is modified.

This is bounded execution plumbing for the already-registered successor claim;
it grants no new task, scope, provider, review, merge, or completion authority.

## Execution contract

- Reproduce each Astra finding as a deterministic RED test before its repair
  (in-memory/synthetic probes that never read real `.env`/`data/raw` values),
  and reproduce the lifecycle-routing blocker before its prerequisite repair.
- Keep all existing suites green: autonomy 26/26 + guard 344/344 baselines
  may grow but never regress; `py_compile`, `git diff --check` must pass.
- No behavior changes beyond the five Astra findings plus the bounded
  successor lifecycle-routing/bootstrap prerequisite above; no registry/C1/
  architecture edits; no provider dispatch; keep `AUTONOMY_NOT_READY` /
  `ENFORCEMENT_NOT_ACTIVE` truthful.
- Stop at `REVIEW_REQUESTED` with exact HEAD, changed files, RED→GREEN
  evidence, and the PR URL. Independent GPT-6 Astra review of the exact SHA
  is required before any merge.

## Acceptance

All five findings closed with regression coverage; fresh independent
exact-SHA review `APPROVED`; expected-head merge; post-main suites green;
closeout folded into SSoT.
