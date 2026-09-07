# ENV-COORD-002 — Coordination Guard core + deterministic tests

Status: CLAIM_PROPOSED
Risk: HIGH (project-control bootstrap)
Owner / implementation model: GLM-5.3 MAX via ZCode
Coordinator / integration owner: GPT-5.6 Sol
Independent bootstrap-claim reviewer: GLM-5.3 Flash or another fresh non-authoring reviewer
Repository: `aase7en/env-wastewater-webapp`
Planned implementation worktree: `A:\\GitHub\\envww-coord-002`
Planned implementation branch: `feat/env-coord-002`
Bootstrap claim proposal branch: `docs/env-coord-002-claim`
Policy base: `origin/main@6360e149f42c419a8d7f878f28fc439e0ef1f6cc`
Claim ID: `ENV-COORD-002-C1`
Claim generation: `1`
Execution holder ID: `zcode-env-coord-002-g1-primary`
Enforcement mode: `BOOTSTRAP_CONTROL`
Lane handoff/result destination: `docs/ai/handoffs/ENV-COORD-002-GLM.md`
Last updated: 2026-09-07

## Parent architecture

Approved exact architecture candidate:
`docs/ai/architecture/ENV-COORDINATION-GUARD.md`

Independent Astra approval was bound to exact SHA
`e5f6a419aa226151788763970e8c008f48d4a28d`, merged by PR #82 as
`6360e149f42c419a8d7f878f28fc439e0ef1f6cc`.

Architecture state remains `BOOTSTRAP_CONTROL`; GitHub `main` is not yet
protected and repository rulesets remain absent. This implementation MUST NOT
claim `ENFORCING`.

## Objective

Implement the pure deterministic Coordination Guard core and registry parser
that later CI/hook adapters will call. Close the architecture-to-code gap with
regression-first tests for authority, claim fencing, scope semantics, lifecycle
ordering, admission/quiescence, and fail-closed behavior.

This slice does **not** install hooks, modify GitHub branch/ruleset policy, or
activate production feature lanes.

## Model-fit decision

GLM-5.3 MAX is selected for the implementation lane because this work is a
bounded long-running coding/test/state-machine task. GPT-5.6 Sol retains
architecture/integration/review ownership. Astra is not justified for routine
implementation; it is reserved for scarce adversarial/final review if a new
material architecture ambiguity appears.

## Authoritative sources

Read in this order:

1. `AGENTS.md`
2. `docs/ai/CURRENT-WORK.md` active registry/frontier
3. this Work Order
4. `docs/ai/architecture/ENV-COORDINATION-GUARD.md`
5. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md` relevant ownership/review sections
6. `docs/ai/handoffs/ENV-COORD-002-GLM.md`
7. actual Git/worktree/remote/PR state

Do not use chat memory as authority.

## Claim / bootstrap gate

Implementation may start only after this bootstrap claim transition reaches
authoritative `main` through exact-SHA independent review and human-authorized
merge.

At implementation start, verify the authoritative registry still contains:

- task `ENV-COORD-002`;
- claim `ENV-COORD-002-C1`;
- generation `1`;
- execution holder `zcode-env-coord-002-g1-primary`;
- branch `feat/env-coord-002`;
- the exact mutable/forbidden scope below.

If any field differs: `SAFE_TO_MUTATE = NO`.

## Mutable scope

Only:

- `scripts/env_coordination_guard.py`
- `scripts/test_env_coordination_guard.py`
- `docs/work-orders/ENV-COORD-002.md`
- `docs/ai/handoffs/ENV-COORD-002-GLM.md`

No other file is mutable in generation 1.

## Forbidden scope

Explicitly forbidden:

- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`
- `docs/ai/architecture/ENV-COORDINATION-GUARD.md`
- `AGENTS.md`
- `.github/**`
- `.claude/**`
- `frontend/**`
- `supabase/**`
- `data/**`
- credentials/env files
- PR #80 GISTDA scope
- PR #75 Building scope
- ENV-OPS-001A production implementation
- GitHub branch protection/rulesets/settings

Forbidden scope wins over any lane-local wording.

## Implementation boundary

Use Python 3.11+ and standard library unless a dependency is demonstrably
necessary and separately authorized.

The core should be deterministic and side-effect-minimal. Prefer pure functions
and explicit data structures. Shell/Git interrogation must be isolated behind
testable seams.

Required core capabilities for this slice:

1. parse the canonical `COORDINATION-REGISTRY v1` block from trusted text;
2. validate required schema/claim fields and reject ambiguity/duplicates;
3. carry `policy_revision`, `registry_hash`, `claim_id`,
   `claim_generation`, `execution_holder_id`;
4. canonicalize repository paths per approved cross-platform rules;
5. implement exact-file/subtree scope membership and overlap;
6. enforce forbidden-scope precedence;
7. evaluate add/delete/rename endpoints deterministically;
8. model lifecycle event ordering with `GENESIS`, stable event IDs,
   monotonic sequence and predecessor checks;
9. model one live execution holder per generation;
10. model mutation admission gate / active admissions;
11. model `QUIESCING -> QUIESCENCE_ATTESTATION -> TRANSFER_READY` and reject
    transfer while any admission/unknown external outcome remains;
12. represent fail-closed reason codes rather than returning ambiguous booleans;
13. expose a small CLI sufficient for deterministic local inspection/tests,
    initially `status`, `scope-check`, and pure-state validation commands.

Do not implement server CI enforcement or platform hooks in this slice.

## Non-blocking Astra implementation refinements to encode

The approved architecture review requested explicit implementation behavior for:

1. **quiescence publisher ownership** — after the current execution holder
   atomically closes its admission gate, that same holder/runtime adapter owns
   publication of quiescence evidence while the gate remains closed. The
   coordinator validates but does not manufacture worker quiescence. If the
   holder cannot publish, transfer remains blocked / recovery-held.
2. admission creation racing with gate closure;
3. lost/replayed quiescence publication or coordinator interruption before
   transfer;
4. timed-out invocation whose child process remains alive remains undrained.

These are implementation refinements, not permission to alter the approved
architecture semantics.

## Required RED tests before implementation

At minimum encode deterministic failing tests for:

- malformed/duplicate registry;
- candidate Work Order cannot widen trusted claim scope;
- stale claim generation rejected;
- second execution holder rejected for same generation;
- admission creation racing with gate close yields exactly one allowed ordering:
  admitted-before-close remains tracked, or close wins and admission fails;
- transfer rejected while `active_admissions > 0`;
- timed-out parent with live child remains undrained;
- lost/replayed quiescence evidence is idempotent or rejected by event identity;
- coordinator interruption before transfer leaves generation unchanged;
- first GoalStart accepts `GENESIS`;
- later GoalStart rejects unterminated predecessor;
- duplicate/out-of-order lifecycle events rejected;
- forbidden scope overrides allowed scope;
- Windows case alias cannot bypass scope;
- rename evaluates source and destination;
- in-root symlink/junction resolved target in another lane is unauthorized;
- outside-root link target denied;
- independent disjoint scopes do not false-collide.

## Acceptance

1. Required focused tests pass with exact counts recorded.
2. `python scripts/test_env_coordination_guard.py` passes.
3. Existing Python script tests relevant to repo test workflow remain green.
4. `git diff --check` passes.
5. Remote diff contains only the four mutable paths.
6. No secret/raw operational data is read/persisted.
7. No GitHub/server/hook/frontend/schema mutation.
8. Core never reports `ENFORCING`; bootstrap state remains explicit.
9. Quiescence evidence cannot be fabricated by coordinator when holder evidence
   is missing.
10. Any unresolved architecture ambiguity stops at `DECISION_REQUIRED` rather
    than being invented in code.

## Verification

Implementation owner records:

- RED command + failures/count;
- GREEN focused command + counts;
- relevant full Python script test command + counts;
- `git diff --check`;
- exact changed files;
- exact pushed SHA;
- remote PR URL/head;
- limitations and any non-blocking follow-up.

Coordinator independently inspects actual diff/SHA/tests and obtains fresh
independent review before merge.

## Stop condition

Implementation owner stops at `REVIEW_REQUESTED`; must not self-merge and must
not modify central claim/SSoT files.

## One next safe action

After the bootstrap claim PR is independently reviewed and merged, create the
isolated `feat/env-coord-002` worktree from that exact main, launch one
GLM-5.3 MAX ZCode context with holder ID
`zcode-env-coord-002-g1-primary`, run RED tests first, then implement only this
slice.
