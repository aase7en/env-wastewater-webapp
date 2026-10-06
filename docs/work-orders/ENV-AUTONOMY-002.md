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

## Result — implementation and verification — 2026-10-06

- **Branch/base:** `codex/env-autonomy-002-hardening` rebased onto
  `origin/main@889963648c06ff9910b6497f72a1158f8a37696c` after PRs #96/#97/#98
  merged all four control transitions (ENV-AUTONOMY-001 CLOSED,
  ENV-COORD-002-C1 released by owner decision, this claim CLAIMED).
- **RED-first evidence:** the six-test `AstraHardeningTests` class failed on
  the pre-repair runtime (all six RED, including four subtests) before any
  repair; after the repairs all six pass. Tests never read real
  `.env`/`data/raw` values (synthetic fixtures only).
- **Repairs delivered:** (1) splatting/indirection (`@name`, `%VAR%`) rejected
  as `SPLATTING_OR_INDIRECTION_FORBIDDEN` before literal-path classification;
  (2) the unredacted `git remote -v` READ_ONLY allowance removed (falls
  through to UNCLASSIFIED fail-closed); (3) `_has_unpublished_operation_resolution`
  blocks mutation admission while a locally appended reconciliation is not yet
  the remote branch head; (4) `_reject_session_identity_drift` /
  `_enforce_session_admission` pin each session to its first-admitted claim
  identity (check-only in PreToolUse; recording rides the PostToolUse receipt
  write so admission never dirties the worktree); (5) `_posttool_receipt_context`
  handles the idempotent duplicate-receipt shape instead of raising KeyError;
  (6) the successor routing prerequisite — `append-event --task` with
  backward-compatible default `ENV-AUTONOMY-001`, unknown tasks fail closed,
  routing never creates authority.
- **Full battery on the final rebased tree:** autonomy + guard combined
  **376 passed + 482 subtests** (32 autonomy incl. the 6 new, 344 guard),
  workflow runtimes **14/14**, checker **PASS**, `py_compile` **PASS**,
  `git diff --check` **PASS**. No C1-locked file touched; no registry,
  CURRENT-WORK, HANDOFF, architecture, frontend, Supabase, or data change;
  no provider dispatch; `AUTONOMY_NOT_READY` / `ENFORCEMENT_NOT_ACTIVE`
  remain truthful.

## R2 review repair — 2026-10-06

- **Review:** independent GPT-6 Astra exact-SHA review of `79ee2a1` returned
  `CHANGES_REQUIRED` (4 P1 + 1 P2), each reproduced by read-only synthetic
  probes: (1) cmd.exe variable names may contain whitespace, so `%READ
  TARGET%` bypassed the splatting regex; (2) branch-head equality is not
  publication proof for reconciliations (uncommitted append with HEAD ==
  remote stays allowed; historical resolutions re-block after later local
  commits); (3) `git add/commit/push` never reach the receipt-recording
  call, so publication-only sessions carry no recorded identity and inherit
  a replacement holder's authority; (4) the `ApplyPatch` alias escapes the
  casefolded mutation-intent predicate (`applypatch` ≠ `apply_patch`);
  (5) four of six hardening tests called new helpers directly, so RED
  demonstrated helper absence rather than integration detection.
- **Repairs (R2):** (1) ANY `%...%` token is rejected as expansion syntax;
  (2) `_has_unpublished_operation_resolution` now compares local resolution
  event_ids against the remote branch's handoff document and fails closed
  when the remote handoff is unreadable; (3) `_record_session_binding`
  persists the session admission during PostToolUse for the git-publication
  early-return path (never during PreToolUse); (4) the mutation-intent
  predicate lists both `apply_patch` and `ApplyPatch` spellings explicitly;
  (5) three new behavioral tests drive `hook_pretool`/`record_hook_observation`
  end-to-end (reconciliation blocked until the remote handoff contains the
  event; git-commit publication records a binding that then denies the same
  session after reassignment; the ApplyPatch alias is drift-checked), the
  splatting test drives `hook_pretool`, and the old journal test's remote
  simulation now returns a real handoff document.
- **Full battery on the final tree:** autonomy + guard **379 passed + 482
  subtests**, workflow runtimes **14/14**, checker **PASS**, `py_compile`
  **PASS**, `git diff --check` **PASS**. Scope unchanged (registered six
  paths only); C1-locked files untouched; no provider dispatch.

## R3 review repair — 2026-10-06

- **Review:** R3 at `0eea65b` returned `CHANGES_REQUIRED` with a single P2:
  the duplicate-receipt and task-routing regressions still called
  `_posttool_receipt_context` / `_resolve_append_event_claim` directly, so a
  broken `_cmd_hook` receipt path or hard-coded CLI claim selection would
  pass undetected.
- **Repair:** both tests now drive the real entrypoints. The duplicate test
  delivers the SAME `tool_use_id` twice through `_cmd_hook` PostToolUse
  (stdin event JSON, stdout captured), asserts exit 0 + well-formed
  hookSpecificOutput both times, and proves exactly one receipt is journaled.
  The routing test drives `_cmd_append_event --task ENV-AUTONOMY-002` with
  the publication/binding gates verified-green, asserts the successor
  handoff alone receives the event and the ENV-AUTONOMY-001 handoff bytes
  are unchanged, and keeps the unknown-task fail-closed assertion.
- **Battery:** autonomy + guard **379 + 482 subtests**, workflow **14/14**,
  checker **PASS**, `py_compile` **PASS**, `git diff --check` **PASS**.
