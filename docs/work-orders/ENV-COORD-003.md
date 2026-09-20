# ENV-COORD-003 — Coordination CI SHADOW integration + trusted evidence tuple

Status: WAITING_FOR_BOOTSTRAP_CLAIM
Risk: HIGH (project-control / CI trust boundary)
Owner / implementation model: GLM-5.3 MAX via Kilo + CoinTH
Coordinator / integration owner: GPT-5.6 Sol
Review owner: GPT-5.6 Sol + fresh non-authoring high-risk reviewer
Repository: `aase7en/env-wastewater-webapp`
Planned worktree: `A:\\GitHub\\envww-coord-003`
Planned branch: `feat/env-coord-003-shadow`
Claim proposal branch: `docs/env-coord-003-claim`
Policy/base revision: `94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed`
Claim: `ENV-COORD-003-C1` generation `1`
Execution holder: `kilo-glm-env-coord-003-g1-primary`
Enforcement mode during implementation: `BOOTSTRAP_CONTROL`
Lane handoff: `docs/ai/handoffs/ENV-COORD-003-GLM.md`
Last updated: 2026-09-20

## Objective

Install the first trusted coordination CI check in **SHADOW** operation and emit
the §9.3 integration evidence tuple without activating server-required
enforcement. The check must evaluate PR ownership/scope against authoritative
main using trusted workflow/guard code and must never execute candidate code in
a privileged `pull_request_target` context.
## Authoritative sources

Read in order:
1. `AGENTS.md`
2. `docs/ai/CURRENT-WORK.md`
3. this Work Order
4. `docs/ai/architecture/ENV-COORDINATION-GUARD.md` §§4, 9–13
5. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md` §§17–26
6. `docs/ai/handoffs/ENV-COORD-003-GLM.md`
7. actual Git/worktree/remote/PR/Actions state

`ENV-COORD-002` merged as PR #84 / main
`94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed`; merged-head guard 344/344,
workflow runtime 14/14, and workflow checker passed before this claim proposal.
Release reconciliation then verified no matching live holder process or Kilo
session, tracked worktree state clean, local HEAD = remote branch head
`297133f452b5af73be90ef08b63275cf4ca28873`, and that head is an ancestor of
merged main. Protected untracked `.kilo/` and `.serena/` remain untouched.

## Claim gate

No implementation mutation until the `ENV-COORD-003-C1` transition is
independently reviewed and merged into authoritative `main`. At start, the
worker must re-read current main and prove exact task/claim/generation/holder,
branch/worktree/base and scope. Any mismatch => `SAFE_TO_MUTATE = NO`.

GLM route preflight on 2026-09-20: `cointh-glm/glm-5.3` and flash both
responded successfully. Provider-specific remaining quota was not exposed by
the safe CLI surface; route admission/liveness is current evidence only.
## Mutable scope — generation 1

Only:
- `.github/workflows/coordination-shadow.yml`
- `scripts/env_coordination_ci.py`
- `scripts/test_env_coordination_ci.py`
- `docs/work-orders/ENV-COORD-003.md`
- `docs/ai/handoffs/ENV-COORD-003-GLM.md`

## Forbidden scope

- `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`
- `docs/ai/architecture/ENV-COORDINATION-GUARD.md`, `AGENTS.md`
- `scripts/env_coordination_guard.py`, `scripts/test_env_coordination_guard.py`
- existing workflows: `deploy-frontend.yml`, `e2e.yml`,
  `supabase-keepalive.yml`, `test.yml`, `_example_hermes_l4_auto_pr.yml`
- `.claude/**`, `frontend/**`, `supabase/**`, `data/**`
- credentials/env files, GitHub rulesets/branch protection/settings
- any production feature activation or environmental-data mutation

Forbidden scope wins over lane-local wording.
## Required design contract

1. Run from trusted base/control code. Prefer `pull_request_target` for PR
   observation, with minimal read permissions and **never** checkout/execute the
   candidate head under that privileged event.
2. Candidate identity is an assertion, not authority. Define one strict,
   deterministic `COORDINATION-CANDIDATE v1` PR-body JSON block carrying
   `task_id`, `claim_id`, `claim_generation`, and
   `execution_holder_id`; reject missing/ambiguous/duplicate/malformed blocks.
3. Match that assertion to the trusted main claim, including branch, holder,
   generation and mutable/forbidden scope. Candidate Work Order text cannot
   widen authority.
4. Obtain changed-file reality from GitHub metadata/API without executing
   candidate code. Canonicalize/evaluate paths with the trusted guard semantics.
5. Build a machine-readable evidence tuple containing at least:
   `pr_head_sha`, `current_policy_revision`, `registry_hash`, `claim_id`,
   `claim_generation`, `guard_version_sha`, `trusted_check_producer`,
   and `required_review_evidence`.
6. `guard_version_sha` must bind the trusted guard revision/blob actually used.
   `trusted_check_producer` must identify the workflow/ref/run context.
7. Review evidence must be head-bound. In SHADOW, missing or unverified reviewer
   trust must be reported truthfully; do not manufacture `TRUSTED` from an
   ordinary same-credential comment. The check may report/fail on missing
   evidence, but server policy does not yet require the check.
8. A violation produces a deterministic non-zero job result plus a concise
   reason; a green SHADOW run still must not claim `ENFORCING`.
9. Emit the tuple in logs/job summary and as a machine-readable
   `coordination-evidence.json` artifact when practical.
10. Keep GitHub I/O isolated from deterministic evaluation so tests can use
    fixtures/mocks and run without network or secrets.
11. No direct write/comment/label/merge side effects from the SHADOW workflow.
12. Never interpolate untrusted PR text into shell commands.

## Minimum fail-closed scenarios

- no recognized claim / wrong branch / wrong task / wrong claim id
- stale generation or wrong execution holder
- changed file outside mutable scope or inside forbidden scope
- candidate self-expands Work Order/scope
- malformed/duplicate candidate identity block
- missing trusted Work Order/handoff path
- stale policy revision / registry hash mismatch
- missing/head-stale review evidence
- candidate changes guard/workflow/control files without an authorized control claim
- candidate code is never executed by the privileged shadow workflow
## Acceptance / verification

- regression-first tests for the scenarios above;
- focused `scripts/test_env_coordination_ci.py` PASS with counts recorded;
- existing `scripts/test_env_coordination_guard.py` remains green;
- workflow runtime tests/checker remain green;
- workflow YAML/static syntax is valid;
- `git diff --check` PASS;
- remote PR diff is exactly the five mutable paths;
- no secrets, PHI/PII, `data/raw/`, environmental writes, schema/RLS changes;
- exact-head GitHub CI PASS;
- fresh independent exact-SHA review PASS;
- expected-head merge, then post-main SHADOW smoke on a safe synthetic/test PR
  or equivalent no-write fixture proves the workflow uses trusted base code.

## Explicit non-goals

No branch protection/ruleset/required-check activation; that is
`ENV-COORD-004` and requires explicit human authorization. No ZCode/Codex/GPT
adapter work (`005/006/007`), no chaos activation (`008`), and no
North-Star production dispatch (`009`).

## Stop condition

Stop at `REVIEW_REQUESTED`. Implementation owner does not merge.

## Exactly one next safe action

After this claim transition is independently approved and merged, create the
isolated implementation worktree from then-current main, prove
`SAFE_TO_MUTATE = YES`, and dispatch the single GLM-5.3 MAX holder.
