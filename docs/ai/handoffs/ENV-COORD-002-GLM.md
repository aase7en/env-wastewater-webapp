# ENV-COORD-002 — GLM-5.3 MAX implementation packet / lane handoff

Lifecycle: REQUESTED
Status: WAITING_FOR_BOOTSTRAP_CLAIM
Task: `ENV-COORD-002`
Claim ID: `ENV-COORD-002-C1`
Claim generation: `1`
Execution holder ID: `zcode-env-coord-002-g1-primary`
Owner: GLM-5.3 MAX / ZCode
Coordinator: GPT-5.6 Sol
Repository: `A:\\GitHub\\env-wastewater-webapp`
Planned worktree: `A:\\GitHub\\envww-coord-002`
Planned branch: `feat/env-coord-002`
Claim policy base: `origin/main@6360e149f42c419a8d7f878f28fc439e0ef1f6cc`
Work Order: `docs/work-orders/ENV-COORD-002.md`
Last updated: 2026-09-07

## Before any mutation

1. Read `AGENTS.md`.
2. Read current `docs/ai/CURRENT-WORK.md` active registry/frontier.
3. Read `docs/work-orders/ENV-COORD-002.md`.
4. Read `docs/ai/architecture/ENV-COORDINATION-GUARD.md`.
5. Read relevant `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`.
6. Fetch `origin` and verify actual repo/worktree/branch/HEAD/dirty state.
7. Verify the bootstrap claim is on authoritative `main` with exact claim ID,
   generation, holder, branch and scope.
8. If any mismatch exists, write the mismatch here and STOP with
   `SAFE_TO_MUTATE = NO`.

Do not infer authority from this packet alone.

## Objective

Implement the deterministic Coordination Guard core + registry parser + tests.
No hooks, no GitHub ruleset/protection changes, no production feature work.

## Allowed files

- `scripts/env_coordination_guard.py`
- `scripts/test_env_coordination_guard.py`
- `docs/work-orders/ENV-COORD-002.md`
- this file

## Forbidden

Everything else, especially central SSoT, architecture contract, workflows,
hooks, frontend, Supabase, data, credentials, GISTDA, Building and ENV-OPS.

## Execution contract

Use one ZCode goal/context for this claim generation. Do not create a second
live implementation context with the same generation.

Implement regression-first:

`RED -> CORE -> GREEN -> REFACTOR -> FOCUSED VERIFY -> RELEVANT FULL PYTHON TESTS -> SELF REVIEW -> PUSH -> REVIEW_REQUESTED`

The non-blocking Astra refinement is binding for implementation:
the current execution holder/runtime adapter closes the admission gate and owns
publication of quiescence evidence while closure remains in force; the
coordinator validates that evidence and cannot fabricate it. If publication
fails, transfer remains blocked.

## Required result written back here

When stopping, replace/update Lifecycle/Status and append:

- actual repo/worktree/branch/base/start HEAD/end HEAD;
- dirty state;
- exact changed files;
- RED tests + counts;
- GREEN/final tests + counts;
- exact verification commands;
- exact pushed SHA and PR URL;
- architecture ambiguities/decisions;
- problems found and fixed/unresolved state;
- limitations;
- exactly ONE next safe action.

Stop at `REVIEW_REQUESTED`. Do not merge.
