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
Last updated: 2026-09-16

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

## Result — R2 remediation (PR #84 CHANGES_REQUIRED) / 2026-09-08

- **Same claim/context:** `ENV-COORD-002-C1`, generation `1`, holder
  `zcode-env-coord-002-g1-primary`, worktree `A:\GitHub\envww-coord-002`,
  branch `feat/env-coord-002`. No second execution context; mutable scope
  unchanged (the same 4 paths). Preflight re-run before remediation
  mutation: `origin/main@7d4e6b52…` unchanged, registry intact,
  `SAFE_TO_MUTATE = YES` maintained.
- **Repairs (all three P1 findings):**
  1. `AdmissionGate.has_unresolved_effects` now flags EVERY unreconciled
     `EFFECT_UNKNOWN` regardless of `child_alive`; live child remains an
     additional undrained condition (`unresolved_child_operations`).
  2. `TransferBarrier.complete_transfer` no longer self-authorizes g+1:
     it executes the worker-side handoff into `AWAITING_AUTHORIZATION`
     (new holder's gate closed) and returns a non-authorizing
     `TRANSFER_AWAITING_AUTHORIZED_TRANSITION` decision. Only
     `activate_transferred_claim(trusted_policy)` — revalidating the
     claim id at the exact new generation + new holder + mutable status
     against a fetched authoritative policy — returns
     `SAFE_TO_MUTATE = YES` bound to real `policy_revision`/
     `registry_hash` (§4.2B/§4.4).
  3. Full §7.3 shared-file exception contract: `shared_paths` (exact
     only, inside every participant's mutable scope),
     `participating_claims` bound to exact claim generations (≥ 2, no
     duplicates), single participating `integration_owner_claim_id`,
     `merge_order` exact permutation of participants,
     `release_condition` required. Registry overlap legalization permits
     ONLY the exact authorized shared paths (subtree∩subtree always
     conflicts); `evaluate_control_transition` accepts the same records
     with the proposal's claim id/generation as a virtual participant.
- **RED → GREEN:** RED `Ran 153 tests … FAILED (failures=15, errors=8)`
  (23 failing = new regressions + 2 tests updated to the corrected
  transfer contract; 130 prior tests passing); GREEN
  `Ran 153 tests … OK`; pytest `153 passed, 12 subtests passed`.
- **Reviewer reproducers re-run post-repair — all fail closed:**
  `UNKNOWN_NO_CHILD_ATTESTATION` now `None/QUIESCING/
  TRANSFER_BLOCKED_UNRESOLVED_EFFECTS`; `LOCAL_TRANSFER_SAFE` now
  `safe_to_mutate=False` + `TRANSFER_AWAITING_AUTHORIZED_TRANSITION`;
  shared-exception registry with exact overlap now validates and both
  participants may mutate the shared path, while broader overlap stays
  `OWNERSHIP_CONFLICT`.
- **Full relevant tests:** workflow runtimes OK; runtime check PASS;
  split_sql all passed; ci_alert_payload 33 passed; `git diff --check`
  exit 0; `status` CLI reads live registry
  (`7d4e6b52` / `BOOTSTRAP_CONTROL` / `ENV-COORD-002-C1`).
- **Changed files:** the same 4 authorized claim paths only; `.serena/`
  never staged.
- **Exact pushed SHA:** the new single commit on
  `origin/feat/env-coord-002` (recorded in the PR #84 head; not written
  into its own commit).
- **Problems found → fixed:** one of the new P1-3 tests initially
  expected `LINK_CROSSES_LANE` for a non-participant probing another
  lane's file; under registry invariants that path correctly fails as
  `OUTSIDE_MUTABLE_SCOPE` (target cannot be in the probe's own scope), so
  the expectation was corrected — the exception still leaks nothing.
  Unresolved: none.
- **Limitations (unchanged + new):** CLI `scope-check` stays explicitly
  inspection-only (caller-supplied actual state), per the review's
  non-blocking note; no hooks/CI/server policy (ENV-COORD-003+); no
  writer yet creates §7.3 records centrally.
- **Exactly ONE next safe action:** GPT-5.6 Sol re-reviews PR #84 at the
  new exact head SHA; merge only on APPROVED with expected-head
  protection; then file ENV-COORD-003 (SHADOW CI integration) as a new
  claim.

## Result — R3 remediation (continuation review, six blockers) / 2026-09-08

- **Actual-state preflight (no chat memory):** fetched origin; PR #84 head
  verified still `c0c7de7ebcfd11791315642e8bdb67b010fc2e1d` before work;
  `origin/main@7d4e6b52…` unchanged; registry claim
  `ENV-COORD-002-C1` gen 1 holder `zcode-env-coord-002-g1-primary`
  matches this context; worktree clean (`.serena/` untracked only);
  `SAFE_TO_MUTATE = YES` printed before first mutation. Same single
  execution context; mutable scope unchanged (4 paths).
- **Start HEAD:** `c0c7de7ebcfd11791315642e8bdb67b010fc2e1d`.
- **End HEAD:** new single commit on `origin/feat/env-coord-002`
  (self-SHA in the PR #84 head, not written into its own commit).
- **Six repairs (continuation-review blockers):**
  1. Admission/close atomicity: one `threading.RLock` serializes
     state-check, id-uniqueness, high-water, insertion, and close. No
     third ordering: admit either linearizes before close and is
     tracked, or fails `ADMISSION_GATE_CLOSED`. PROCESS-LOCAL only —
     cross-process serialization is a later adapter responsibility.
  2. Single temporary integration owner: only
     `integration_owner_claim_id` at its bound generation may mutate an
     exception-covered shared path (`SHARED_PATH_OWNER_REQUIRED`,
     `SHARED_OWNER_GENERATION_MISMATCH`); non-owner participants and
     link crossings fail closed.
  3. Full §4.4 activation preflight:
     `activate_transferred_claim(policy, actual_context)` / complete_
     transfer(..., actual_context) run the ordinary preflight (task,
     claim, generation, holder, worktree, branch, base ancestry, policy
     binding). Policy without actual context → `MISSING_ACTUAL_CONTEXT`;
     any mismatch → deterministic reason, state stays
     `AWAITING_AUTHORIZATION`, gate stays CLOSED, no partial activation.
  4. Live child always undrained: `child_alive=True` blocks transfer in
     every effect state (`TRANSFER_BLOCKED_LIVE_CHILDREN`);
     `reconcile_effect` preserves the child flag (explicit
     `child_alive=False` or `reconcile_child_dead()` required to drain).
  5. Shared-owner uniqueness: same canonical path + same participating
     claim/generation set allows at most ONE active exception record;
     conflicting owners AND exact duplicates are rejected
     (`INVALID_SHARED_EXCEPTION`) — duplicates are NOT idempotent
     (chosen contract, tested).
  6. `LOCK_HOLDING_CLAIM_STATUSES` derived from §4.1/§4.5: all states
     except READY/MERGED/CLOSED hold scope locks (STALE_CLAIM/
     RECOVERY_HOLD/STATE_DRIFT hold per §4.5; POSTMERGE_VERIFY holds
     until CLOSED). Released records no longer false-collide.
- **RED → GREEN:** RED `Ran 181 tests … FAILED (failures=8, errors=18)`
  (26 failing = six blockers' regressions + activation-contract updates;
  155 prior passing); GREEN `Ran 181 tests … OK`; pytest
  `181 passed, 15 subtests passed`. Concurrency regressions include a
  200-round Barrier admit-vs-close race and an 8-admitter sweep.
- **All six reproducers post-repair: PASS** (recorded verbatim in the
  WO R3 section; one-line forms: straggler → ADMISSION_GATE_CLOSED;
  NON_OWNER_SAFE=False/SHARED_PATH_OWNER_REQUIRED; wrong-worktree
  activation → WORKTREE_MISMATCH + AWAITING + closed gate;
  LIVE_CHILD_AFTER_RECONCILE blocked until reconcile_child_dead;
  DUP_SHARED_OWNER=INVALID_SHARED_EXCEPTION; CLOSED_OVERLAP=ACCEPTED
  while active overlap stays OWNERSHIP_CONFLICT).
- **Full relevant tests:** workflow runtimes OK; runtime check PASS;
  split_sql all passed; ci_alert_payload 33 passed; `git diff --check`
  exit 0; both script files compile clean.
- **Exact changed files:** the 4 authorized claim paths only.
- **Limitations:** gate atomicity is process-local (CPython GIL makes
  the threaded race hard to observe without orchestration; the lock is
  the actual repair, the tests pin the contract); no hooks/CI/server
  policy (ENV-COORD-003+); `scope-check` remains inspection-only;
  no central writer yet creates §7.3 records; MERGED counted as released
  and POSTMERGE_VERIFY as lock-holding is a documented derivation
  decision (architecture does not spell out MERGED-vs-POSTMERGE_VERIFY
  lock semantics explicitly — flagged for reviewer confirmation, not a
  code ambiguity).
- **Unresolved issues:** none.
- **Exactly ONE next safe action:** GPT-5.6 Sol re-reviews PR #84 at the
  new exact head; merge only on APPROVED with expected-head protection;
  then file ENV-COORD-003 (SHADOW CI integration) as a new claim.

## Result — R4 remediation (GPT-5.6 Sol R3 review, five P1) / 2026-09-08

- **Actual-state preflight (no chat memory):** fetched origin; PR #84 head
  verified still `7a6eb457230ce07748c0fa82abeb9f9725fdd702` before work;
  `origin/main@7d4e6b52…` unchanged; registry claim `ENV-COORD-002-C1`
  gen 1 holder `zcode-env-coord-002-g1-primary` matches this context;
  worktree clean (`.serena/` untracked only); `SAFE_TO_MUTATE = YES`
  maintained. Same single execution context; mutable scope unchanged
  (the same 4 paths).
- **Start HEAD:** `7a6eb457230ce07748c0fa82abeb9f9725fdd702`.
- **End HEAD:** new single commit on `origin/feat/env-coord-002`
  (self-SHA is the PR #84 head; not written into its own commit).
- **Five repairs (R3-review P1 blockers):**
  1. Frozen revision read: `_read_current_work()` resolves `origin/main`
     once, then `git show <sha>:docs/ai/CURRENT-WORK.md` — the text/
     revision pair cannot tear when the ref advances between reads.
  2. Durable §5.5 reconciliation: new `OPERATION_RECONCILED` lifecycle
     event (ordered, idempotent by event identity, bound to operation_id
     + generation, terminal observation only) clears unresolved state
     while `operation_record()` keeps the original UNKNOWN outcome for
     audit; OPERATION_OUTCOME after it stays `EVENT_CONFLICT`.
  3. Process-atomic TransferBarrier: one barrier-level `RLock` over all
     transitions + the status read; one g1 attestation can yield at most
     one proposed g2 (concurrent second transfer fails
     `TRANSFER_NOT_READY`, never g3). Process-local by design;
     cross-process stays adapter/server responsibility.
  4. §7.3 global single-owner invariant: at most ONE active exception
     record per canonical shared path regardless of participant sets
     (triangle/pairwise → `INVALID_SHARED_EXCEPTION`; one record, one
     owner, one merge order for three participants).
  5. Lock semantics: `RELEASED_CLAIM_STATUSES = (READY, CLOSED)`; MERGED
     and POSTMERGE_VERIFY hold until the authorized CLOSED release, and
     `evaluate_control_transition` filters released records like
     `validate_registry` already did. Supersedes the R3
     MERGED-releases derivation flagged for reviewer confirmation.
- **RED → GREEN:** RED `Ran 202 tests … FAILED (failures=12, errors=5)`
  (17 failing = the five blockers' regressions; 185 prior passing);
  GREEN `Ran 202 tests … OK` (stable across repeated runs); pytest
  `202 passed, 15 subtests passed`.
- **All five reviewer reproducers post-repair: PASS** (M1_PAIR frozen-SHA
  second call bound to revision N; M2 unresolved True→False with UNKNOWN
  retained; double transfer exactly one success at gen 2; TRIANGLE →
  INVALID_SHARED_EXCEPTION; MERGED_OVERLAP → OWNERSHIP_CONFLICT).
- **Problems found → fixed:** (a) the publish-vs-transfer regression
  initially asserted the replay publish always succeeds; under the
  barrier lock the transfer-first serialization correctly fails the OLD
  holder's replay closed (`COORDINATOR_CANNOT_PUBLISH_QUIESCENCE`) — the
  test now pins the durable invariants (attestation recorded, exactly
  one transfer, generation advanced exactly once) and accepts both valid
  serializations; (b) the mixed §4.4 activation test was made
  order-robust (a losing context fails its preflight reason OR
  `TRANSFER_NOT_READY` once the correct activation consumed AWAITING).
  Unresolved: none.
- **Full verification (all green):** unittest 202 OK; pytest
  202 passed + 15 subtests; `test_workflow_action_runtimes.py` OK;
  `check_workflow_action_runtimes.py` PASS (5 files);
  `test_split_sql.py` all passed; `test_ci_alert_payload.py` 33 passed;
  `git diff --check` exit 0; both scripts compile clean; live `status`
  smoke against the real registry through the frozen-SHA read
  (`7d4e6b52` / `BOOTSTRAP_CONTROL` / `ENV-COORD-002-C1`).
- **Exact changed files:** the 4 authorized claim paths only; `.serena/`
  never staged.
- **Limitations (unchanged + superseded):** no hooks/CI/server policy in
  this slice (ENV-COORD-003+); `scope-check` remains inspection-only; no
  central writer yet creates §7.3 records; barrier atomicity is
  process-local. R3's MERGED-releases derivation is superseded by the
  review's explicit MERGED/POSTMERGE_VERIFY-hold, READY/CLOSED-release
  contract.
- **Exactly ONE next safe action:** GPT-5.6 Sol re-reviews PR #84 at the
  new exact head; merge only on APPROVED with expected-head protection;
  then file ENV-COORD-003 (SHADOW CI integration) as a new claim.

## Result — R5 remediation (Sol triage of Astra review, five blockers) / 2026-09-08

- **Actual-state preflight (no chat memory):** fetched origin; PR #84
  head verified still `b3748d265fb83961dd6c00e593a64b64ce0a9448` before
  work (R4 head, Sol APPROVED_PENDING_INDEPENDENT_FINAL + triage of the
  Astra review bound to the older `7a6eb45` SHA);
  `origin/main@7d4e6b52…` unchanged; registry claim `ENV-COORD-002-C1`
  gen 1 holder `zcode-env-coord-002-g1-primary` matches this context;
  worktree clean (`.serena/` untracked only); `SAFE_TO_MUTATE = YES`.
  Same single execution context; mutable scope unchanged (4 paths).
- **Start HEAD:** `b3748d265fb83961dd6c00e593a64b64ce0a9448`.
- **End HEAD:** new single commit on `origin/feat/env-coord-002`
  (self-SHA is the PR #84 head; not written into its own commit).
- **Five repairs (R5 blockers):**
  1. Transfer tuple binding — `activate_transferred_claim` requires, in
     addition to a succeeding §4.4 preflight, an exact
     decision-vs-barrier tuple match (claim id / generation / holder)
     before any state change or gate open; mismatch raises the new
     `TRANSFER_TUPLE_MISMATCH` and the barrier stays
     AWAITING_AUTHORIZATION with the gate CLOSED.
  2. Publication gate — `published=False` events are rejected
     (`EVENT_NOT_PUBLISHED`; GOAL_END keeps `GOAL_END_NOT_PUBLISHED`)
     after duplicate-id handling and before any mutation, so
     authoritative state/head never move on unpublished evidence; a
     later published retry of the same semantic event applies cleanly
     (regressions cover GOAL_START, CHECKPOINT, OPERATION_INTENT,
     OPERATION_OUTCOME, OPERATION_RECONCILED, GOAL_END).
  3. Attestation replay re-validation — one shared
     `_publication_block_reason` gates fresh publication AND replay;
     replay with newly reported `unresolved_external_operations=True`
     demotes TRANSFER_READY → QUIESCING and blocks transfer; a later
     supported replay re-establishes TRANSFER_READY (full recovery
     tested through to a generation-2 handoff).
  4. Link/lock parity — `_evaluate_link` ignores released
     (READY/CLOSED) other claims, consistent with registry and
     control-transition logic; RECOVERY_HOLD / STALE_CLAIM / STATE_DRIFT
     lanes still block crossings of their protected scope.
  5. Strict goal predecessor — after the first goal, every new GOAL_START
     must directly reference the previous durable terminal GOAL_END
     event; a post-terminal OPERATION event as predecessor is
     `OUT_OF_ORDER_EVENT`. There is deliberately NO valid ordering in
     which a goal starts after a post-terminal event (referencing the
     old GOAL_END fails the ordinary head link).
- **RED → GREEN:** RED `Ran 219 tests … FAILED (failures=11, errors=1)`
  (12 failing = the five blockers' regressions; 207 prior passing);
  GREEN `Ran 219 tests … OK` (stable across repeated runs); pytest
  `219 passed, 15 subtests passed`.
- **All five reproducers post-repair: PASS** (A1 wrong-tuple activation
  fails TRANSFER_TUPLE_MISMATCH, stays AWAITING/CLOSED; A3 unpublished
  outcome EVENT_NOT_PUBLISHED, head unchanged, unresolved retained; A4
  publish-success → replay-with-uncertainty blocked, QUIESCING, transfer
  TRANSFER_NOT_READY; A8 CLOSED link allowed while RECOVERY_HOLD blocks;
  A10 non-terminal head rejected, normal GOAL_END predecessor accepted).
- **Full verification (all green):** unittest 219 OK; pytest 219 passed
  + 15 subtests; `test_workflow_action_runtimes.py` OK;
  `check_workflow_action_runtimes.py` PASS (5 files);
  `test_split_sql.py` all passed; `test_ci_alert_payload.py` 33 passed;
  `git diff --check` exit 0; both scripts compile clean.
- **Exact changed files:** the 4 authorized claim paths only; `.serena/`
  never staged.
- **Limitations:** unchanged from R4 (no hooks/CI/server policy,
  ENV-COORD-003+; scope-check inspection-only; no central §7.3 writer;
  process-local atomicity). Replay re-validation covers facts known to
  the barrier (caller-reported external uncertainty + runtime state);
  facts neither the runtime nor the caller reports cannot be discovered
  by this core.
- **Unresolved issues:** none.
- **Exactly ONE next safe action:** GPT-5.6 Sol performs a fresh
  exact-SHA review of PR #84 at the new head (and re-runs the Astra
  final adversarial review bound to that same SHA per the triage
  disposition); merge only on APPROVED with expected-head protection;
  then file ENV-COORD-003 (SHADOW CI integration) as a new claim.

## Result — R6 remediation (Sol R5 review, lifecycle compatibility) / 2026-09-08

- **Actual-state preflight (no chat memory):** fetched origin; PR #84
  head verified still `8f1d9ca49c054959a93643c55e4ba88576ffcb95` before
  work (R5 head; Sol R5 review CHANGES_REQUIRED, comment 5581469821);
  `origin/main@7d4e6b52…` unchanged; registry claim `ENV-COORD-002-C1`
  gen 1 holder `zcode-env-coord-002-g1-primary` matches this context;
  worktree clean (`.serena/` untracked only); `SAFE_TO_MUTATE = YES`.
  Same single execution context; mutable scope unchanged (4 paths).
- **Start HEAD:** `8f1d9ca49c054959a93643c55e4ba88576ffcb95`.
- **End HEAD:** new single commit on `origin/feat/env-coord-002`
  (self-SHA is the PR #84 head; not written into its own commit).
- **Authority-first design (no invented semantics):** read architecture
  §4.1 compatibility clause, protocol §18 in full (preferred lifecycle +
  READY_FOR_IMPLEMENTATION/RE-REVIEW_REQUESTED compatibility labels),
  engineering-loop §25 progression, and the authoritative CURRENT-WORK
  allowed-statuses list (adds IDLE, DESIGNING); usage pinned from
  07-ROADMAP (DESIGNING) and HANDOFF (RE-REVIEW_REQUESTED).
- **Repair:** vocabulary accepts the full compatibility contract
  (VERIFYING, READY_FOR_IMPLEMENTATION, RE-REVIEW_REQUESTED, IDLE,
  DESIGNING added); `MUTABLE_CLAIM_STATUSES` =
  (CLAIMED, ACTIVE, IMPLEMENTING, VERIFYING) so canonical IMPLEMENTING
  and the holder-side VERIFYING phase do not self-fence (§18 splits
  §4.1's ACTIVE phase; both write evidence before the review gate);
  lock semantics: READY_FOR_IMPLEMENTATION released like READY (§25
  pre-implementation slot), RE-REVIEW_REQUESTED fenced like
  REVIEW_REQUESTED, IDLE/DESIGNING conservatively fail-closed (no
  mutation grant derivable; §4.5 scope held).
- **RED → GREEN:** RED `Ran 230 tests … FAILED (failures=6, errors=8)`
  (14 failing items across the 11 new R6 regression methods; 219 prior
  tests passing — all current-five and historical regressions
  preserved); GREEN `Ran 230 tests … OK` stable; pytest
  `230 passed, 25 subtests passed`.
- **Reproducers post-repair:** VERIFYING / RE-REVIEW_REQUESTED /
  READY_FOR_IMPLEMENTATION parse OK; IMPLEMENTING and VERIFYING
  preflight `SAFE_TO_MUTATE = true`; READY_FOR_IMPLEMENTATION and
  RE-REVIEW_REQUESTED fail `CLAIM_STATUS_NOT_MUTABLE`; full 18-status
  allowed vocabulary parses in one registry; transferred IMPLEMENTING
  generation activates through the ordinary §4.4 preflight.
- **Full verification (all green):** unittest 230 OK; pytest 230 passed
  + 25 subtests; workflow runtimes OK; runtime check PASS (5 files);
  split_sql all passed; ci_alert_payload 33 passed; `git diff --check`
  exit 0; both scripts compile clean; live `status` smoke reads the
  real registry (`7d4e6b52` / `BOOTSTRAP_CONTROL` / CLAIMED).
- **Exact changed files:** the 4 authorized claim paths only; `.serena/`
  never staged.
- **Recorded for reviewer confirmation (conservative defaults, no
  invented grants):** IDLE/DESIGNING carry no mutation grant;
  READY_FOR_IMPLEMENTATION is released like READY. No material
  DECISION_REQUIRED ambiguity remained after reading §18/§25/§4.1 and
  the CURRENT-WORK allowed list.
- **Limitations:** unchanged from R5 (no hooks/CI/server policy,
  ENV-COORD-003+; scope-check inspection-only; no central §7.3 writer;
  process-local atomicity). The guard validates single-word statuses
  only — any future migration to structured status records is a new
  claim.
- **Unresolved issues:** none.
- **Exactly ONE next safe action:** GPT-5.6 Sol performs a fresh
  exact-SHA review of PR #84 at the new head; Astra final review is
  re-run only after the candidate stabilizes, bound to that same SHA;
  merge only on APPROVED with expected-head protection; then file
  ENV-COORD-003 (SHADOW CI integration) as a new claim.

## Result — R7 remediation (Sol R6 review, READY_FOR_IMPLEMENTATION release defect) / 2026-09-08

- **Actual-state preflight (no chat memory):** fetched origin; PR #84
  head verified still `038f51e2fd6d1175295450a25e3bb9553bfb0f63` before
  work (R6 head; Sol R6 review CHANGES_REQUIRED, comment 5583791336);
  `origin/main@7d4e6b52…` unchanged; registry claim `ENV-COORD-002-C1`
  gen 1 holder `zcode-env-coord-002-g1-primary` matches this context;
  worktree clean (`.serena/` untracked only); `SAFE_TO_MUTATE = YES`.
  Same single execution context; mutable scope unchanged (4 paths).
- **Start HEAD:** `038f51e2fd6d1175295450a25e3bb9553bfb0f63`.
- **End HEAD:** new single commit on `origin/feat/env-coord-002`
  (self-SHA is the PR #84 head; not written into its own commit).
- **Authority re-verified first-hand:** WO-STAB-006-PROPOSAL /
  WO-STAB-009-PROPOSAL ("Status: ACTIVE — READY_FOR_IMPLEMENTATION",
  assigned GLM owner, owned files) and WO-UX-AN-P001-GLM
  (READY_FOR_IMPLEMENTATION + Owner + owned files; parallel with
  DT-VIS-P001 only because owned production files do not overlap).
  Conclusion: the state allocates/owns its scope; R6's released-like-
  READY derivation was wrong. No material ambiguity → no
  DECISION_REQUIRED.
- **Repair (smallest):** `RELEASED_CLAIM_STATUSES = (READY, CLOSED)`;
  READY_FOR_IMPLEMENTATION remains parse-valid and non-mutable but is
  LOCK-HOLDING, so registry overlap validation, control-transition
  admission, and link/scope protection (all derived from
  `LOCK_HOLDING_CLAIM_STATUSES`) enforce consistently. R6 derivation
  comment corrected in code.
- **RED → GREEN:** RED `Ran 232 tests … FAILED (failures=3)` (exactly
  the three R7 regressions: registry overlap OWNERSHIP_CONFLICT,
  overlapping transition rejected, link crossing LINK_CROSSES_LANE;
  229 prior passing — all R1–R6 regressions and the READY released
  controls preserved); GREEN `Ran 232 tests … OK` stable; pytest
  `232 passed, 25 subtests passed`.
- **Reproducers post-repair:** READY_FOR_IMPLEMENTATION_OVERLAP
  REJECTED/OWNERSHIP_CONFLICT; READY_OVERLAP ACCEPTED;
  RE-REVIEW_REQUESTED/IMPLEMENTING overlaps still rejected;
  READY_FOR_IMPLEMENTATION_NEW_OVERLAP valid=False/OWNERSHIP_CONFLICT;
  READY_NEW_OVERLAP valid=True/None; RE-REVIEW_REQUESTED/IMPLEMENTING
  new-overlap still rejected.
- **Full verification (all green):** unittest 232 OK; pytest 232 passed
  + 25 subtests; workflow runtimes OK; runtime check PASS (5 files);
  split_sql all passed; ci_alert_payload 33 passed; `git diff --check`
  exit 0; both scripts compile clean; live `status` smoke reads the
  real registry (`7d4e6b52` / `BOOTSTRAP_CONTROL` / CLAIMED).
- **Exact changed files:** the 4 authorized claim paths only; `.serena/`
  never staged.
- **Limitations:** unchanged from R6 (no hooks/CI/server policy,
  ENV-COORD-003+; scope-check inspection-only; no central §7.3 writer;
  process-local atomicity; single-word statuses only).
- **Unresolved issues:** none.
- **Exactly ONE next safe action:** GPT-5.6 Sol performs a fresh
  exact-SHA review of PR #84 at the new candidate head (Astra final
  review remains deferred until Sol has a stable candidate; do not
  invoke Astra from the implementation lane); merge only on APPROVED
  with expected-head protection; then file ENV-COORD-003 (SHADOW CI
  integration) as a new claim.

## Result — R8 remediation (Sol triage of Astra final review, four blockers) / 2026-09-08

- **Actual-state preflight (no chat memory):** fetched origin; PR #84
  head verified still `f217e42ae6d22e10f7dded84ee49211f8013ffb1` before
  work (R7 head; Astra final review found four blockers, Sol triage
  reproduced all four — comment 5584602143);
  `origin/main@7d4e6b52…` unchanged; registry claim `ENV-COORD-002-C1`
  gen 1 holder `zcode-env-coord-002-g1-primary` matches this context;
  worktree clean (`.serena/` untracked only); `SAFE_TO_MUTATE = YES`.
  Same single execution context; mutable scope unchanged (4 paths).
- **Start HEAD:** `f217e42ae6d22e10f7dded84ee49211f8013ffb1`.
- **End HEAD:** new single commit on `origin/feat/env-coord-002`
  (self-SHA is the PR #84 head; not written into its own commit).
- **Four repairs:**
  1. g+1 runtime published already CLOSED — `complete_transfer`
     builds the new `HolderRuntime` privately, closes its gate, then
     assigns `self.runtime`; the orchestrated boundary probe (fires at
     the exact publication/close point and admits through the
     observable runtime) now sees `ADMISSION_GATE_CLOSED` instead of
     `IN_FLIGHT`.
  2. Win32 alias rejection — `canonicalize_path` fails closed
     (`INVALID_PATH`, never trims) on any segment with trailing `.` or
     trailing ASCII space; forbidden-file aliases can no longer bypass
     exact scope evaluation; interior dots/non-trailing spaces remain
     valid.
  3. Safety-first readiness invalidation — the CURRENT holder
     reporting `unresolved_external_operations=True` demotes an
     established `TRANSFER_READY` BEFORE fresh/replay/conflict identity
     handling (fresh id: returns blocked with state demoted;
     conflicting payload: `EVENT_CONFLICT` still raised, but only after
     demotion); `complete_transfer` then fails `TRANSFER_NOT_READY` at
     generation 1; restoration only through a supported replay;
     non-holder reports change nothing.
  4. Post-terminal operation events rejected — `OPERATION_OUTCOME` and
     `OPERATION_RECONCILED` require an ACTIVE goal
     (`OUT_OF_ORDER_EVENT`), so they never advance the durable head
     past a terminal GOAL_END; the generation is never stranded. The
     complete legal recovery chain is pinned end-to-end: Goal1
    START → INTENT → UNKNOWN → Goal1 END(PARTIAL) → Goal2 START
    (previous = the terminal GOAL_END) → RECONCILED under the active
    recovery goal → Goal2 END(COMPLETED_VERIFIED) → Goal3 START
    legally continues; the original UNKNOWN outcome stays on audit.
- **RED → GREEN:** RED `Ran 241 tests … FAILED (failures=14)` (all four
  blockers' regressions; 227 prior passing); GREEN `Ran 241 tests … OK`
  stable across repeat runs; pytest `241 passed, 33 subtests passed`.
- **Reproducers post-repair:** R8-1 boundary REJECTED/
  ADMISSION_GATE_CLOSED with post-state AWAITING_AUTHORIZATION/gate
  CLOSED; R8-2 exact spelling FORBIDDEN_PATH, both aliases REJECTED
  INVALID_PATH; R8-3 cases A and B demote to QUIESCING and block
  `complete_transfer` at generation 1; R8-4 post-terminal
  reconciliation rejected with head staying on the GOAL_END, recovery
  chain closes cleanly with UNKNOWN audit retained.
- **Authorized R5 semantic correction (Astra finding):** the two R5
  stranded-head pins were updated to the corrected contract — the
  post-terminal OPERATION event is now itself rejected, the terminal
  GOAL_END stays head, and the next goal starts legally from it. Every
  other R1–R7 regression passes unchanged.
- **Full verification (all green):** focused high-risk classes 158 OK
  (path canonicalization, lifecycle, reconciliation, unpublished
  events, transfer barrier, admission gate, concurrency, shared-file
  ownership/uniqueness, lock statuses, compatibility statuses, symlink
  policy); full unittest 241 OK; pytest 241 passed + 33 subtests;
  workflow runtimes OK; runtime check PASS (5 files); split_sql all
  passed; ci_alert_payload 33 passed; py_compile clean;
  `git diff --check` exit 0; live `status` smoke reads the real
  registry (`7d4e6b52` / `BOOTSTRAP_CONTROL` / CLAIMED).
- **Exact changed files:** the 4 authorized claim paths only; `.serena/`
  never staged.
- **Limitations:** alias rejection covers the authoritative smallest
  defect (trailing dot/space) only — no broader Win32 filesystem
  emulation; reconciliation-under-recovery-goal semantics derived from
  §5.5 reconcile-before-retry (the recovery goal owns the retry) and
  recorded here for reviewer confirmation; all prior limitations
  unchanged (no hooks/CI/server policy, ENV-COORD-003+; scope-check
  inspection-only; no central §7.3 writer; process-local atomicity).
- **Unresolved issues:** none.
- **Exactly ONE next safe action:** GPT-5.6 Sol performs a fresh
  exact-SHA review of PR #84 at the R8 candidate head; Astra is rerun
  only on the new exact SHA after Sol reaches a stable candidate (not
  invoked from this lane); merge only on APPROVED with expected-head
  protection; then file ENV-COORD-003 (SHADOW CI integration) as a new
  claim.

## Result — R9 remediation (Sol R8 review, goal identity) / 2026-09-08

- **Actual-state preflight (no chat memory):** fetched origin; PR #84
  head verified still `0fa7de691ddb9b4c0f79ae1c49bb455e9d15b463` before
  work (R8 head; Sol R8 review CHANGES_REQUIRED — four Astra R7
  blockers verified CLOSED, one new P2 goal-identity finding, comment
  5585930429); `origin/main@7d4e6b52…` unchanged; registry claim
  `ENV-COORD-002-C1` gen 1 holder `zcode-env-coord-002-g1-primary`
  matches this context; worktree clean (`.serena/` untracked only);
  `SAFE_TO_MUTATE = YES`. Same single execution context; mutable scope
  unchanged (4 paths).
- **Start HEAD:** `0fa7de691ddb9b4c0f79ae1c49bb455e9d15b463`.
- **End HEAD:** new single commit on `origin/feat/env-coord-002`
  (self-SHA is the PR #84 head; not written into its own commit).
- **Repair:** every active-goal-scoped lifecycle event (CHECKPOINT,
  OPERATION_INTENT, OPERATION_OUTCOME, OPERATION_RECONCILED) must carry
  the CURRENT active goal's identity — `event.goal_id ==
  self._active_goal` — failing closed `OUT_OF_ORDER_EVENT` BEFORE any
  mutation (no partial registration/outcome/reconciliation/head
  change). GOAL_END already enforced identity; no new reason code.
- **R8 recovery model preserved:** reconciliation of an OLD UNKNOWN
  under a NEW recovery goal remains valid, and the reconciliation event
  identifies that CURRENT recovery goal (not the original intent's
  goal) — pinned as a positive control plus the full Goal1 PARTIAL →
  Goal2 START → RECONCILED(g2) → Goal2 END → Goal3 START chain.
- **RED → GREEN:** RED `Ran 247 tests … FAILED (failures=4)` (the four
  mismatch regressions; 243 prior passing — all R1–R8 regressions
  unchanged, including closed-before-publication runtime, Win32 alias
  rejection, uncertainty invalidation, recovery-goal lifecycle,
  transfer tuple binding, concurrency/admission gate, stale-generation
  fencing, shared ownership, publication/replay, compatibility
  statuses, READY_FOR_IMPLEMENTATION locking); GREEN `Ran 247 tests …
  OK` stable; pytest `247 passed, 33 subtests passed`.
- **Reproducer post-repair:** INTENT(g999)/OUTCOME(g999) under active
  g1 → OUT_OF_ORDER_EVENT, head/events unchanged; RECONCILED(g999)
  under recovery g2 → OUT_OF_ORDER_EVENT, head e3 + unresolved
  unchanged; matching-identity recovery chain closes cleanly (UNKNOWN
  audit retained).
- **Full verification (all green):** focused high-risk classes 164 OK
  (incl. the new R9 goal-identity class); full unittest 247 OK; pytest
  247 passed + 33 subtests; workflow runtimes OK; runtime check PASS
  (5 files); split_sql all passed; ci_alert_payload 33 passed;
  py_compile clean; `git diff --check` exit 0; live `status` smoke
  reads the real registry (`7d4e6b52` / `BOOTSTRAP_CONTROL` / CLAIMED).
- **Exact changed files:** the 4 authorized claim paths only; `.serena/`
  never staged.
- **Limitations:** unchanged from R8 (smallest Win32 alias scope; no
  hooks/CI/server policy, ENV-COORD-003+; scope-check inspection-only;
  no central §7.3 writer; process-local atomicity).
- **Unresolved issues:** none.
- **Exactly ONE next safe action:** GPT-5.6 Sol performs a fresh
  exact-SHA review of PR #84 at the R9 candidate head; after Sol
  reaches a stable candidate, Astra is rerun on that new exact SHA (not
  invoked from this lane); merge only on APPROVED with expected-head
  protection; then file ENV-COORD-003 (SHADOW CI integration) as a new
  claim.

## Result — R10 overnight exhaustive hardening campaign / 2026-09-09

- **Preflight:** start SHA `7ea9e11508a8a7606d681bdde414770515774c54`
  verified as local HEAD = origin/feat/env-coord-002 = PR #84 head;
  `origin/main@7d4e6b52…` ancestor-verified; live registry re-read via
  the guard CLI (`7d4e6b52` / `2d1b901b…` / BOOTSTRAP_CONTROL /
  `ENV-COORD-002-C1` g1 CLAIMED / this holder/worktree/branch);
  worktree clean (`.serena/` untracked only); `SAFE_TO_MUTATE = YES`.
  Same single execution context; mutable scope the same 4 paths.
- **Sources re-read (not chat memory):** AGENTS.md, Operating Map,
  origin/main CURRENT-WORK registry + allowed-status list, Work Order,
  full architecture §1–15, engineering loop §24–27, protocol §18–23,
  DEFECT-MEMORY index, A-Wiki project pointer (no coordination-specific
  content; repo authority governs), actual code/tests/remote state.
- **R9 baseline:** reproduced before hardening — 4 goal-identity
  negatives fail closed with identical pre/post state snapshots;
  positive controls and the R8 recovery chain green.
- **Campaign phases completed:** invariant matrix (internal); adversarial
  probes over registry parsing, trust/TOCTOU, status matrix, paths,
  scope grammar, mutation endpoints, symlinks, shared-owner exceptions,
  lifecycle, operation journal, publication/replay, admission gate,
  transfer barrier, attestation identity, concurrency stress, exception
  atomicity, reason codes, enforcement truth, CLI, type boundaries,
  encapsulation, determinism, cross-subsystem consistency, historical
  coverage, test quality.
- **Six new defects found → repaired (RED → minimal repair → GREEN):**
  1. registry `version: true` bool masquerade (P3) → strict int check;
  2. lifecycle schema-int failures: `event_seq` str crash (TypeError
     instead of GuardFailure), float seq accepted, `claim_generation`
     bool accepted as gen 1 (P2) → type fencing at the top of
     `LifecycleLog.apply` before any mutation;
  3. unhashable shared-exception participant `claim_id` crash (P2) →
     strict non-empty-str check → `INVALID_SHARED_EXCEPTION`;
  4. CLI `validate-lifecycle` malformed documents exited rc=1 with a
     traceback (P2) → boundary maps TypeError/ValueError/KeyError to
     `IO_ERROR` exit 2;
  5. preflight `claim_generation=True` passed the authorization-path
     generation fence as gen 1 (P2 — found by the new property sweep) →
     strict non-bool int check → `STALE_CLAIM_GENERATION`;
  6. control-transition `expected_claim_generation=True` satisfied the
     §4.3 serialization fence (P2) → exact-int fencing for expected and
     proposed generations.
- **Audited clean (evidence in WO R10 section):** registry block
  ambiguities, frozen single Git read, tuple bindings, status matrix
  consistency across all three lock consumers, scope grammar, mutation
  endpoints, symlink parity, §7.3 adversarials, lifecycle atomicity
  snapshots, publication/replay, admission/transfer/attestation edges,
  reason codes, enforcement truth, determinism.
- **Durable additions:** `TestLifecycleTypeBoundaries`,
  `TestMetamorphicProperties` (9 bounded deterministic property tests),
  masquerade/participant/CLI regressions. Historical coverage
  re-verified: 25 sampled R1–R9 defect regressions all present.
- **Exact final verification:** standalone suite 4 consecutive OK runs;
  pytest **266 passed + 81 subtests**; concurrency stress PASS at 4
  switch intervals; decision determinism identical digests; workflow
  runtimes OK; runtime checker PASS (5 files); split_sql all passed;
  ci_alert_payload 33 passed; py_compile clean; `git diff --check`
  exit 0; changed paths = exactly the two script files + this handoff +
  the Work Order; no secrets/raw data touched; `.serena/` untouched.
- **Exact start HEAD:** `7ea9e11508a8a7606d681bdde414770515774c54`.
- **Exact final HEAD:** the R10 freeze commit on
  `origin/feat/env-coord-002` (= PR #84 head after push; remote ref is
  the authoritative record per protocol §18, not self-written).
- **Known limitations:** `TrustedPolicy.claims` dict interiors are
  technically mutable in memory (trust boundary is policy construction
  from hash-bound text; adapters must treat the policy as read-only);
  Win32 alias rejection covers the authoritative smallest defect
  (trailing dot/space); process-local atomicity; scope-check
  inspection-only; no hooks/CI/server policy (ENV-COORD-003+); no
  central §7.3 writer.
- **Unresolved P1/P2 issues:** none. **DECISION_REQUIRED items:** none.
- **Readiness:** all campaign phases completed green; every repair is
  tightening-only; candidate is ready for independent review.
- **Exactly ONE next safe action:** GPT-5.6 Sol performs a fresh
  independent exact-SHA review of the FINAL R10 candidate (PR #84
  head after this push). Only if Sol independently reaches APPROVED on
  that exact unchanged SHA should GPT-6 Astra perform the final
  adversarial exact-SHA review. Merge remains prohibited until both
  review gates are satisfied; then file ENV-COORD-003 (SHADOW CI
  integration) as a new claim.

## Result — R11 remediation (Sol R10 review, five blocker groups) / 2026-09-09

- **Preflight:** start `11c910bf15fa7a94c446a919d269df4a24f3b253`
  verified = local = origin branch = PR #84 head; base
  `origin/main@7d4e6b52…` unchanged; registry C1/g1/holder matches via
  the guard CLI; worktree clean (`.serena/` untracked only);
  `SAFE_TO_MUTATE = YES`. Same four-path mutable scope.
- **Five repairs (regression-first; RED 283 tests/65 failing → GREEN
  283 OK ×3; pytest 283 passed + 217 subtests):**
  1. TrustedPolicy recursive immutability: `_freeze` (MappingProxyType/
     tuple) on the validated registry; `_thaw` + proxy acceptance keep
     validation re-entrant; tuple-tolerant collection checks. All
     post-construction mutation of authorization data now impossible;
     authorization + hash byte-stable across attempts.
  2. `base_ancestor_of_head` authorizes only exact `True`.
  3. `server_enforcement_verified` exact `True` required for
     ENFORCING/HARDENED; all masquerades → ENFORCEMENT_NOT_ACTIVE.
  4. `published` exact `True` required to apply; non-bool masquerades
     fail closed pre-mutation on all six event classes.
  5. Lifecycle schema boundary: log generation exact positive non-bool
     int (constructor), CLI `int()` coercion removed, event identity
     fields non-empty strings, goal_id can never be None/empty (no
     invisible active goal), one log binds one task identity
     (`WRONG_CLAIM` on mismatch; justified by the registry's 1:1
     claim↔task mapping — no DECISION_REQUIRED needed).
- **Reviewer reproducers:** all closed (A mutation blocked/hash stable;
  B "false"/"0"/1 denied; C masquerades → ENFORCEMENT_NOT_ACTIVE;
  D GOAL_END("false") rejected, goal stays active; E GOAL_START(None)/
  task_id=123 rejected).
- **Full battery:** adjacent suites green; py_compile clean;
  `git diff --check` PASS; changed paths = exactly the four authorized
  files; live smoke `7d4e6b52`/BOOTSTRAP_CONTROL/CLAIMED.
- **Test-design notes:** three initial RED-test bugs (stale prev refs,
  wrong expected event counts, duplicate-id masking the publication
  gate) were fixed in the tests; one collateral was a REAL core gap —
  `validate_registry` could not re-validate its own frozen output —
  fixed via `_thaw` + MappingProxyType acceptance.
- **Limitations:** immutable policy records are observability-complete
  via mapping proxies (reads only); no new reason codes; all prior
  limitations unchanged.
- **Exactly ONE next safe action:** continue the campaign — Prompt 2/10
  (trusted-policy immutability + evidence-binding deep audit) in this
  same lane.

## Result — FINAL LONG-RUN HARDENING CAMPAIGN (Prompts 1–10) / 2026-09-09

- **Start SHA (before Prompt 1):**
  `11c910bf15fa7a94c446a919d269df4a24f3b253`.
- **Checkpoint SHAs:** Prompt 1 (R11 blockers A–E) →
  `3ac65d6235430b1e8c55984c1791fd197a75c85c` (pushed, CI green);
  Prompts 2–9 fixes + Prompt 10 packet → the final freeze commit (=
  remote PR #84 head after the final push).
- **Base:** `origin/main@7d4e6b52c616ff15f86e399a085ef16477d38ef8`.
  **PR:** #84 (OPEN, unmerged). **Claim:** `ENV-COORD-002-C1`,
  generation 1, holder `zcode-env-coord-002-g1-primary`, four-path
  scope only, `.serena/` untouched throughout.
- **Defects found + fixed in this campaign (all RED → minimal repair →
  GREEN):**
  | # | Severity | Defect | Repair | Regression |
  |---|----------|--------|--------|------------|
  | R11-A | P1 | TrustedPolicy post-construction mutation increased authorization under unchanged hash | recursive `_freeze` (MappingProxyType/tuple) + `_thaw` re-entry + tuple-tolerant checks | TestTrustedPolicyImmutability (5) |
  | R11-B | P1 | `base_ancestor_of_head` truthiness granted mutation on "false"/"0"/1 | exact-`True` fence in preflight | TestBooleanEvidenceFencing |
  | R11-C | P1 | enforcement verification truthiness reported ENFORCING on masquerades | exact-`True` fence | TestBooleanEvidenceFencing |
  | R11-D | P1 | `published="false"/1` terminated goals as durably published | exact-bool publication gate, all 6 event classes | TestPublicationFlagFencing |
  | R11-E | P1 | lifecycle identity schema holes (goal_id=None invisible goal, event_id empty, task unbound, CLI int() coercion) | schema boundary in `apply` + constructor + CLI de-coercion + one-log-one-task binding | TestLifecycleSchemaBoundary |
  | P3 | P2 | OPERATION_INTENT accepted None/empty/non-str operation_id | exact non-empty-string operation_id | TestLifecycleSchemaBoundary |
  | P8 | P2 | durable lifecycle events editable via caller-held payload dict (rewrote evidence + replay semantics) | deepcopy-on-store after validation, before mutation | TestDurableEventIsolation |
  | R10-recap | — | six earlier repairs (version bool, lifecycle types, unhashable participant, CLI traceback, preflight/control-transition generation masquerades) | present + passing | R10 classes |
- **Audited clean (no repair; evidence above):** Prompt 2 policy/
  evidence binding (13 surfaces, aliasing-safe, decisions frozen,
  revision boundaries); Prompt 3 lifecycle transition matrix (seq gaps
  legal, post-terminal atomicity, replay matrix); Prompt 4 boolean/
  coercion sweep (directional fail-closed for uncertainty/child flags,
  zero int() coercions left); Prompt 5 atomicity + stale handles (old
  runtime inert after transfer); Prompt 6 shared-owner/link parity
  under frozen policy; Prompt 7 deterministic races + stress.
- **Final verification (exact counts):** standalone suite **294 tests
  OK** ×3 consecutive; pytest **294 passed + 242 subtests**; concurrency
  stress ×3 OK + R10 switch-interval sweep; classes individually OK
  (isolation); adjacent suites: workflow runtimes OK, checker PASS
  (5 files), split_sql all passed, ci_alert_payload 33 passed;
  py_compile clean; `git diff --check` PASS; changed paths = exactly
  the four authorized files; live `status` smoke reads the real
  registry (`7d4e6b52` / BOOTSTRAP_CONTROL / CLAIMED).
- **Known limitations:** stale detached runtime objects can be mutated
  by in-process callers but no authorization path consumes them;
  `TrustedPolicy` interiors immutable via mapping proxies (observability
  read-only); Win32 alias rejection covers trailing dot/space only;
  process-local atomicity; scope-check inspection-only; hooks/CI/server
  policy belong to ENV-COORD-003+; no central §7.3 writer yet.
- **Unresolved P1/P2:** none. **DECISION_REQUIRED:** none (the narrow
  task-binding question was resolved by the reviewer's own minimum
  requirement — consistent one-task binding per log, justified by the
  registry's 1:1 claim↔task mapping).
- **Exactly ONE next safe action:** GPT-5.6 Sol performs a fresh
  independent exact-SHA review of the FINAL_CAMPAIGN_SHA (PR #84 head
  after this push). Only after Sol independently reaches APPROVED on
  that exact unchanged SHA should GPT-6 Astra perform the final
  adversarial exact-SHA review. DO NOT MERGE before both gates.


## Result ? R12 final campaign remediation / 2026-09-14

- Prior candidate: `e212689f5f27c0a88b7da5060b7c8df3f0970a1e` ? Sol
  `CHANGES_REQUIRED` (five remaining evidence/identity hardening groups).
- Actual execution: GPT-5.6 Sol via Remote Desktop Commander under explicit
  user authorization for bounded completion; no second parallel writer/context
  and no scope expansion. Historical claim identity remains
  `ENV-COORD-002-C1` / generation 1; actual executor is recorded here to avoid
  a false provenance claim.
- RED: **303 total tests; 55 failures + 4 errors** after adding nine R12
  regression methods against the old implementation.
- GREEN: standalone **303/303 PASS**; pytest **303 passed + 298 subtests**;
  workflow runtimes **14/14 PASS**; runtime checker PASS (5 files); split_sql
  PASS; CI-alert **33/33 PASS**; `py_compile` and `git diff --check` PASS.
- Closed invariants:
  1. `LifecycleLog` keeps authoritative events private; `events` and `apply()`
     expose detached deep copies, so returned/history views cannot rewrite
     nested payloads or replay identity.
  2. Admission `operation_id` is exact non-empty string; malformed/unhashable
     IDs fail with `INVALID_CLAIM_FIELD` before container access.
  3. `record_effect.child_alive` requires exact bool;
     `reconcile_effect.child_alive` accepts only `None` or exact bool, so
     malformed falsy evidence cannot clear a known-live child.
  4. `holder_publish.unresolved_external_operations` requires exact bool before
     any replay/publication/readiness mutation.
  5. TransferBarrier fences positive exact-int generation and exact non-empty
     claim/holder/new-holder IDs; attestation/latest-event identities are exact
     non-empty strings before publication.
- Current `origin/main` is `a92bfec2ffd705bec2a899995026d913412d1f52`,
  one commit ahead of the prior base and touching only five design-roadmap
  files; integrate it before freezing the next review SHA.
- `.serena/` remains protected untracked state; no other file outside the four
  authorized paths was mutated by R12.
- Status: `REVIEW_REQUESTED`; do not merge and do not start ENV-COORD-003 until
  fresh exact-SHA review + independent high-risk final review pass.
- **Merged-base freeze:** integrated `origin/main@a92bfec2ffd705bec2a899995026d913412d1f52`
  cleanly. Full post-integration battery: standalone **303/303 PASS**; pytest
  **303 passed + 298 subtests**; workflow runtimes **14/14**; runtime checker
  PASS (5 files); split_sql PASS; CI-alert **33/33**; py_compile and
  `git diff --check origin/main...HEAD` PASS. PR-relative scope remains exactly
  the four authorized paths.
- **Exactly ONE next safe action:** push the merged-base candidate, bind remote
  diff/CI/review to its exact PR head, and perform fresh Sol coordinator review;
  only an unchanged Sol-approved SHA may proceed to the independent high-risk
  final review.

## Result — R13 malformed operation_id fencing / 2026-09-16

- Inherited attributable dirty diff at HEAD `6df27e4bd7696e66dc4dcaca5c06ecf258515874`:
  `scripts/env_coordination_guard.py` +11 / `scripts/test_env_coordination_guard.py`
  +66 — verified, not rewritten.
- Repairs: malformed/unhashable `operation_id` is now fenced **before** dict
  access at all three remaining seams — `operation_record` (audit seam,
  `INVALID_CLAIM_FIELD` via `_require_stable_id`) and the OPERATION_OUTCOME /
  OPERATION_RECONCILED apply paths (`OUT_OF_ORDER_EVENT`). Well-formed unknown
  string ids keep `UNKNOWN_OPERATION` semantics (malformed ≠ unknown).
  Atomicity/retry regressions pinned: rejected events consume no sequence and
  leave no partial state; the same event still applies cleanly after rejection.
- Baseline (Sol independent recheck pre-commit, re-verified locally before
  commit): standalone **306/306 PASS**; pytest **306 passed + 313 subtests**;
  `py_compile` PASS; `git diff --check` PASS.
- Scope: only the two scripts changed by R13; the four authorized paths remain
  the whole PR scope. `.kilo/` and `.serena/` are protected untracked state.
- Status: `REVIEW_REQUESTED`; do not merge PR #84; do not activate
  ENV-COORD-003.
- **Merged-base freeze:** integrated `origin/main@bf26cb523c375f44d3bdd0ee9a6d0d66f1eb81bb`
  cleanly; movement was GISTDA-only (`ENV-INT-GISTDA-CORE-001`, five files,
  zero PR-scope overlap). Post-integration battery: standalone **306/306 PASS**;
  pytest **306 passed + 313 subtests**; `py_compile` PASS; `git diff --check`
  and `git diff --check origin/main...HEAD` PASS; scope vs `origin/main` is
  exactly the four authorized paths.
- **Exactly ONE next safe action:** fresh exact-SHA Sol acceptance review of
  the pushed head, then an independent non-authoring high-risk review; only
  after both pass on an unchanged SHA may merge proceed.

## Result — R14 structural boundary fencing / 2026-09-16

- **Start state (re-verified before mutation):** head
  `e3af986d03b5138ee18870f39f0d5a6a5d1438e9` (= `origin/feat/env-coord-002`,
  R13 freeze); tracked tree clean; `.kilo/` + `.serena/` protected
  untracked. Live registry re-read through the guard CLI: policy_revision
  `bf26cb523c375f44d3bdd0ee9a6d0d66f1eb81bb`, registry_hash `2d1b901b…`,
  `BOOTSTRAP_CONTROL`, claim `ENV-COORD-002-C1` gen 1 `CLAIMED`, holder/
  worktree/branch matching — claim gate intact for this generation.
- **Findings (independent review + same-class structural audit):** raw
  `TypeError` from malformed `merge_order` elements (`set()`/`sorted()` on
  unhashable/unorderable entries); raw `TypeError` from a malformed
  `proposed_mutable_scope` container (iteration of scalars; `str`/`dict`
  silently char/key-iterated); raw `AttributeError` from a malformed
  preflight `worktree` (`_normalize_worktree` on non-str); unhashable
  `proposed_claim_id` crashing the virtual-claim dict / pair frozenset;
  scalar/empty proposed claim ids silently degrading to non-identity
  reasons.
- **RED:** `TestR14StructuralBoundaryFencing` (12 methods) against the
  prior implementation → standalone **318 tests, 6 failures + 20 errors**
  (26 failing items = 20 raw-crash + 6 wrong-typed-outcome shapes; the 306
  prior tests green, R13 included); pytest **26 failed / 318 passed + 361
  subtests**.
- **GREEN:** standalone **318/318 PASS** (stable across consecutive runs);
  pytest **318 passed + 387 subtests**; focused high-risk classes **93
  passed + 96 subtests** (shared exception, uniqueness, control transition,
  preflight fencing, lifecycle type boundaries, operation reconciliation
  incl. R13, R14); workflow runtimes OK; runtime checker PASS (5 files);
  split_sql PASS; CI-alert **33/33**; `py_compile` PASS; `git diff --check`
  PASS.
- **Bounded adversarial sweep:** 31 probes (merge_order elements/container,
  `integration_owner_claim_id` values, scope container/elements,
  `proposed_claim_id` with and without shared exceptions, exceptions
  container, all seven preflight context fields) → **0 raw exceptions**;
  every JSON-like malformed input yields a typed `GuardFailure` or typed
  `Decision`.
- **Repairs (existing reason semantics; R13 unchanged):** merge_order
  element fence (`INVALID_SHARED_EXCEPTION`); proposed-scope container
  fence + proposed-claim-id stable-identity fence (`INVALID_CLAIM_FIELD`;
  elements keep `INVALID_SCOPE_EXPRESSION`); preflight worktree exact-str
  fence (`WORKTREE_MISMATCH` Decision). Fail-closed-only note: scalar/empty
  proposed claim ids now reject uniformly at the identity fence instead of
  `INVALID_SHARED_EXCEPTION`/`OWNERSHIP_CONFLICT` on some shapes.
- **Audited clean + pinned as regressions:** `integration_owner_claim_id`
  (all JSON-like values → participation-check rejection), exceptions
  container (`None` = documented absent), preflight equality fields,
  scope elements.
- **Merged-base freeze:** `origin/main` re-fetched before freeze and
  unchanged at `bf26cb523c375f44d3bdd0ee9a6d0d66f1eb81bb` — already
  integrated by R13's merge `ba3d305` (ancestor of HEAD verified); nothing
  to integrate. Scope vs `origin/main` = exactly the four authorized paths.
- **Status:** `REVIEW_REQUESTED`; do not merge PR #84; ENV-COORD-003 stays
  blocked pending fresh review.
- **Exactly ONE next safe action:** fresh exact-SHA Sol acceptance review
  of the pushed R14 head; only after Sol approval on the unchanged SHA
  plus the independent non-authoring high-risk final review may merge
  proceed.

## Result — R15 mandatory transition-invariant closure / 2026-09-17

- **Verdict supersession:** the independent `APPROVED` verdict on the R14
  head `7fa38cc2…` is **superseded/invalidated** — it missed Sol's
  deterministic `task_id` blocker. R15 closes that blocker's contract
  class: `evaluate_control_transition` must never return `valid=True` for
  a transition contradicting mandatory identity/scope/global-shared-path
  invariants (§§4.2, 4.3, 7.3; `validate_registry`).
- **Start state (re-verified):** HEAD `7fa38cc2c9bc539600e13f7407575e5b6924838d`
  = `origin/feat/env-coord-002` = PR #84 head; `origin/main@bf26cb5…`
  ancestor-verified; tracked tree clean (`.kilo/` + `.serena/` protected
  untracked); live registry via CLI `bf26cb5` / `2d1b901b…` /
  `BOOTSTRAP_CONTROL` / `ENV-COORD-002-C1` g1 `CLAIMED` — same
  claim/generation/holder, four-path scope.
- **RED (truthful, against unchanged code):** `TestR15MandatoryTransitionInvariants`
  (13 methods) → standalone **331 tests / 24 failures + 8 errors** (32
  failing items across the four P1s + the audit container seam; 318 prior
  tests + 7 new positive controls green); pytest **32 failed / 330 passed
  + 387 subtests**.
- **Repairs:** P1-1 exact non-empty-str `task_id` fenced before claim
  lookup (`INVALID_CLAIM_FIELD`); P1-2 empty/omitted
  `proposed_mutable_scope` rejected for new claims AND reassignments
  (`INVALID_CLAIM_FIELD`, registry-grade non-empty); P1-3 claim_id
  immutability — new task duplicating ANY existing id (incl. CLOSED) →
  `DUPLICATE_CLAIM`, reassignment with a different id → `WRONG_CLAIM`,
  None/equal-id/fresh-unique-id controls preserved, checks precede
  exception processing (no virtual-claim overwrite); P1-4 authoritative
  `policy.shared_exceptions` paths seed the proposal-exception uniqueness
  set → re-coverage fails `INVALID_SHARED_EXCEPTION`, no replace
  semantics invented; P2 pin — `authorized_shared_exceptions=[]`/`()`
  ≡ absent (no `proposed_claim_id` required), non-empty still requires
  one. Audit repair: non-mapping proposal container → typed
  `INVALID_CLAIM_FIELD` instead of raw `AttributeError`.
- **§4.3 audit clean (no repair, fail-closed already):**
  revision/hash equality fences, R10 exact-int generation fences, R1
  scope-element grammar, exception-record interior fences, and the bool
  `proposed_claim_generation` virtual-claim feed (final generation fence
  rejects it after indexing — cannot yield valid=True).
- **GREEN battery:** standalone **331/331 PASS** (stable re-runs); pytest
  **331 passed + 418 subtests**; focused transition/R13/R14/R15
  **36 passed + 110 subtests**; R15 matrix focused **13 passed + 31
  subtests**; workflow runtimes **14/14**; runtime checker PASS (5
  files); `test_split_sql.py` all passed; CI-alert **33/33**;
  `py_compile` PASS; `git diff --check` PASS; live `status` smoke reads
  the real registry (`bf26cb5`, `BOOTSTRAP_CONTROL`, `CLAIMED`).
- **Base freeze:** `origin/main` re-fetched before freeze, unchanged at
  `bf26cb523c375f44d3bdd0ee9a6d0d66f1eb81bb`, already integrated
  (ancestor of HEAD) — nothing to integrate, no conflict.
- **Scope:** code in the two scripts only; evidence in this handoff +
  the WO; PR-relative scope remains exactly the four claim-owned paths;
  no hooks/CI/server/frontend/schema/Supabase/data touched; no secrets or
  raw operational data read/persisted.
- **Status:** `REVIEW_REQUESTED`; do not merge PR #84; ENV-COORD-003
  stays blocked.
- **Exactly ONE next safe action:** fresh Sol exact-SHA review of the
  pushed R15 head (reviewer bound to the exact pushed SHA), then the
  independent non-authoring high-risk final review; only after both pass
  on an unchanged SHA may merge proceed.

## Result — R16 duplicate-JSON authority fencing / 2026-09-18

- **Trigger:** fresh GPT-5.6 Sol exact-SHA review of PR #84 head `fcb85e393705e0325a53ef53ba7aaa4ec898c05c` found a P1 fail-closed defect: ordinary `json.loads()` collapsed duplicate JSON object member names before registry semantic validation. Durable review finding: PR #84 comment `issuecomment-5731513884`.
- **Deterministic reproducer:** one claim object containing both `"status": "CLOSED"` and `"status": "CLAIMED"` was accepted by `load_trusted_policy`; the parsed authority became `CLAIMED`.
- **Execution:** bounded repair authored by GPT-5.6 Sol through Remote Desktop Commander under the user's explicit 2026-09-18 instruction to use RDC as fallback while Worker 1–5 are unavailable. Claim scope/generation are unchanged; no overlapping writer was launched.
- **RED:** new `TestR16DuplicateJsonMembers` produced 5 failing subcases across wrapper-level `coordination_registry`, registry `enforcement_mode`, and claim `status` / `claim_generation` / `execution_holder_id` duplicate members.
- **Repair:** one duplicate-detecting JSON object-pairs hook now rejects repeated member names at every object level with typed `REGISTRY_MALFORMED_JSON`; both trusted-registry parse sites use the same helper, so ambiguity is rejected before information is lost. Exact raw-block hash semantics are preserved.
- **GREEN:** standalone **334/334 PASS**; pytest **334 passed + 421 subtests**; adjacent workflow/split-SQL/CI-alert **47/47 PASS**; workflow runtime checker **5 files PASS**; `py_compile` PASS; `git diff --check` PASS; direct duplicate-status reproducer now fails closed with `REGISTRY_MALFORMED_JSON`.
- **Scope:** production/test changes only in the two scripts; this Work Order + lane handoff carry evidence. No `CURRENT-WORK.md`, architecture, workflow, frontend, Supabase, schema, data, secret, or raw operational-data mutation.
- **Status:** `RE-REVIEW_REQUESTED`; do not merge PR #84 and do not activate ENV-COORD-003.
- **ONE next safe action:** freeze/push the R16 exact SHA, bind CI and focused Sol rereview to that SHA, then obtain the required independent non-authoring high-risk final review before merge.
