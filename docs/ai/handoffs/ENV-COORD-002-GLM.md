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
Last updated: 2026-09-08

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
