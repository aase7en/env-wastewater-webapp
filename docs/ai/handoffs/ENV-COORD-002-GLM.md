# ENV-COORD-002 — GLM-5.3 MAX implementation packet / lane handoff

Lifecycle: EXECUTED
Status: REVIEW_REQUESTED
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

## Result — ENV-COORD-002-C1 / 2026-09-07

- **Repo/worktree/branch/base:** `aase7en/env-wastewater-webapp` /
  `A:\GitHub\envww-coord-002` / `feat/env-coord-002`; base =
  `origin/main@7d4e6b52c616ff15f86e399a085ef16477d38ef8`
  (bootstrap claim PR #83 merged; trusted-claim `base_sha`
  `6360e149f42c419a8d7f878f28fc439e0ef1f6cc` verified as its ancestor).
- **Start HEAD:** `7d4e6b52c616ff15f86e399a085ef16477d38ef8`.
- **End HEAD:** the single implementation commit on
  `origin/feat/env-coord-002` (self-SHA intentionally not written into its
  own commit, per protocol §17; reviewer verifies the remote ref equals
  the PR head recorded below).
- **Dirty state at stop:** only untracked `.serena/` (never staged,
  never committed); no tracked file left modified.
- **Exact changed files (4 = full mutable scope, nothing else):**
  - `scripts/env_coordination_guard.py` (new — core + CLI)
  - `scripts/test_env_coordination_guard.py` (new — 128-test suite)
  - `docs/work-orders/ENV-COORD-002.md` (status → REVIEW_REQUESTED +
    implementation-owner evidence)
  - `docs/ai/handoffs/ENV-COORD-002-GLM.md` (this result block)
- **Preflight before first mutation:** authoritative `origin/main`
  registry parsed (policy_revision `7d4e6b52…`, registry_hash
  `2d1b901b…`); claim `ENV-COORD-002-C1` gen `1` holder
  `zcode-env-coord-002-g1-primary` worktree/branch matched;
  `SAFE_TO_MUTATE = YES` established and kept for the whole goal.
- **RED:** `python scripts/test_env_coordination_guard.py` against the
  signature-stub → `Ran 128 tests … FAILED (failures=7, errors=131)`,
  0 passing (errors include subTest expansion).
- **GREEN/final:** `python scripts/test_env_coordination_guard.py` →
  `Ran 128 tests … OK` (128/128); pytest equivalence →
  `128 passed, 12 subtests passed`.
- **Exact verification commands (all green):**
  `python scripts/test_env_coordination_guard.py`;
  `python -m pytest scripts/test_env_coordination_guard.py -q`;
  `python scripts/test_workflow_action_runtimes.py` (OK);
  `python scripts/check_workflow_action_runtimes.py` (PASS, 5 files);
  `python scripts/test_split_sql.py` (all passed);
  `PYTHONPATH=scripts python -m pytest scripts/test_ci_alert_payload.py -q`
  (33 passed); `git diff --check` (exit 0);
  live smoke `python scripts/env_coordination_guard.py status` and
  `scope-check` against the real registry (forbidden path denied, exit 2).
- **Exact pushed SHA and PR URL:** recorded in the PR body/evidence at
  push time (see "One next safe action"); PR head = the single commit
  described above. `scripts/test_oauth4_rls_probe.py` was NOT run —
  credential-gated Supabase probe, not in the CI scripts job, untouched.
- **Architecture ambiguities/decisions (implementation-level only,
  architecture semantics unchanged):**
  1. Link re-authorization order: outside-root → own forbidden (always
     wins) → §7.3 shared-file exception (exact path + participant) → own
     mutable required → other lanes' protected scope = their mutable ∪
     forbidden (registry disjointness makes this the realizable §13.36
     case; the exception is carried inside the registry as a trusted
     central record, never a lane-local file).
  2. Copy semantics: destination must be mutable; source is read-policy
     checked against forbidden scope only (reading other in-repo files
     stays legal).
  3. `GOAL_END` with `published = false` is rejected
     (`GOAL_END_NOT_PUBLISHED`) and the goal stays active (§5.2/§5.6).
  4. Lifecycle validation order: type → claim/generation binding →
     duplicate event id (idempotent/conflict) → strictly increasing seq →
     exact previous-event link → type-specific semantics.
  5. Admission-gate close is one-way per generation; reopen/transfer
     happens only via `complete_transfer` creating a new runtime/generation.
  6. `reconcile_effect` resolves only `EFFECT_UNKNOWN` admissions (§5.5
     reconcile-before-retry).
  7. `effective_enforcement_mode` downgrades `ENFORCING`/`HARDENED` to
     `ENFORCEMENT_NOT_ACTIVE` unless server enforcement is verified
     (§11.6); CLI always passes verified=false in this slice.
- **Problems found → fixed:** RED phase exposed (a) control-transition
  fixture computing the expected registry hash from a different claim set
  → fixed; (b) three test expectations conflicting with the deterministic
  failure-precedence above → tests aligned without weakening what they
  prove; (c) missing `HolderRuntime` admission delegation API → added;
  (d) link-evaluation ordering let `OUTSIDE_MUTABLE_SCOPE` mask
  `LINK_CROSSES_LANE` → semantics fixed per decision 1. Unresolved: none.
- **Limitations / non-blocking follow-up:** no hooks/CI/server policy in
  this slice (ENV-COORD-003+); git-mode CLI is read-only inspection, not
  enforcement; `evaluate_control_transition` validates shared-exception
  transitions but no writer creates them; `SHADOW`/`ENFORCING` paths are
  defined and unit-tested but unexercised against a real server;
  `test_oauth4_rls_probe.py` environment-gated (pre-existing).
- **Exactly ONE next safe action:** coordinator (GPT-5.6 Sol) verifies
  the actual remote diff/tests against this Work Order, obtains a fresh
  independent exact-SHA review of the PR head, and merges only on
  APPROVED with expected-head protection — then files ENV-COORD-003
  (CI integration in SHADOW mode) as a new claim.
