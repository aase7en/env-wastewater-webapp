# ENV-COORD-002 — Coordination Guard core + deterministic tests

Status: REVIEW_REQUESTED
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
Last updated: 2026-09-08

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

### Implementation-owner evidence — ENV-COORD-002-C1 / 2026-09-07

Executed by holder `zcode-env-coord-002-g1-primary` (GLM-5.3 MAX / ZCode) in
worktree `A:\GitHub\envww-coord-002` on branch `feat/env-coord-002`, from
main `7d4e6b52c616ff15f86e399a085ef16477d38ef8` (bootstrap claim merged;
claim `base_sha` `6360e149…` verified as ancestor).

- RED (against signature-stub with `NotImplementedError` bodies):
  `python scripts/test_env_coordination_guard.py` →
  `Ran 128 tests … FAILED (failures=7, errors=131)` — 0 passing
  (errors include subTest expansion).
- GREEN focused: `python scripts/test_env_coordination_guard.py` →
  `Ran 128 tests … OK` (128/128). Pytest equivalence:
  `python -m pytest scripts/test_env_coordination_guard.py -q` →
  `128 passed, 12 subtests passed`.
- Relevant full Python script tests (CI `scripts` job set + adjacent
  suites, same worktree): `test_workflow_action_runtimes.py` OK;
  `check_workflow_action_runtimes.py` PASS (5 workflow files);
  `test_split_sql.py` all passed; `test_ci_alert_payload.py` 33 passed.
  `test_oauth4_rls_probe.py` not runnable in this environment
  (credential-gated Supabase probe, not in the CI scripts job; untouched
  by this diff).
- `git diff --check` → PASS (exit 0).
- Exact changed files: the four mutable paths of this claim; no other
  tracked path modified; `.serena/` left untracked/unstaged.
- Exact pushed SHA / PR URL: frozen in the lane handoff result block
  (self-SHA is not written into its own commit; reviewer verifies the
  remote ref matches the PR head evidence).
- Live-registry smoke (git mode, read-only):
  `python scripts/env_coordination_guard.py status` →
  policy_revision `7d4e6b52…`, mode `BOOTSTRAP_CONTROL` (effective
  `BOOTSTRAP_CONTROL`), claims `ENV-COORD-002-C1` gen 1 `CLAIMED`;
  `scope-check` with `--change modify scripts/env_coordination_guard.py
  --change modify AGENTS.md` → `SAFE_TO_MUTATE = false`,
  reason `FORBIDDEN_PATH`, bound to the exact policy tuple.

Limitations / non-blocking follow-up: no hook or CI integration in this
slice (ENV-COORD-003+); CLI git mode is read-only inspection, not
enforcement; shared-file-exception transitions are validated
(`evaluate_control_transition`) but no writer creates them; admission-gate
close is one-way per generation (recovery creates a new generation via
transfer). Full list in the lane handoff.

### Remediation evidence — R2 (PR #84 CHANGES_REQUIRED) / 2026-09-08

GPT-5.6 Sol review at `6e257905113a4b379ee05e77c7ceda67a9d19ada` required
three P1 repairs; all executed on the same claim/generation/holder with
regression-first tests.

- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 153 tests … FAILED (failures=15, errors=8)` — 23 failing (all new
  remediation regressions + the 2 tests updated to the corrected
  transfer contract), 130 prior tests passing unchanged.
- GREEN: `Ran 153 tests … OK`; pytest → `153 passed, 12 subtests passed`.
- Reviewer reproducers re-run after repair, all fail closed:
  P1-1 `UNKNOWN(child_alive=False)` → attestation `None`, state
  `QUIESCING`, `TRANSFER_BLOCKED_UNRESOLVED_EFFECTS`;
  P1-2 `complete_transfer` → `safe_to_mutate=False`,
  `TRANSFER_AWAITING_AUTHORIZED_TRANSITION` (no local authority for g+1;
  `activate_transferred_claim(trusted_policy)` is the only authority
  path, bound to real `policy_revision`/`registry_hash`);
  P1-3 exact shared-path overlap with a full §7.3 record validates and
  both participants may mutate it; broader/uncovered overlap still
  `OWNERSHIP_CONFLICT`.
- Other suites re-verified green; `git diff --check` PASS; `status` CLI
  still reads the live registry (`7d4e6b52`, `BOOTSTRAP_CONTROL`).

### Remediation evidence — R3 (continuation review, six blockers) / 2026-09-08

Re-verified from actual state: PR #84 head was still `c0c7de7…` with all
six continuation-review blockers open; same claim/generation/holder
preflight re-run (`origin/main@7d4e6b52…` unchanged).

- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 181 tests … FAILED (failures=8, errors=18)` — 26 failing (the six
  blockers' regressions + activation tests updated to the §4.4 context
  contract), 155 prior tests passing unchanged.
- GREEN: `Ran 181 tests … OK`; pytest → `181 passed, 15 subtests passed`.
- Repairs: (1) `AdmissionGate` admit/close/reconcile + all reads behind
  one `threading.RLock` — admission-vs-close has a deterministic
  serialization boundary (process-local; adapters own cross-process);
  (2) §7.3 single temporary integration owner enforced for mutation AND
  link crossing (`SHARED_PATH_OWNER_REQUIRED` /
  `SHARED_OWNER_GENERATION_MISMATCH`); (3)
  `activate_transferred_claim(policy, actual_context)` runs the complete
  §4.4 preflight (task/claim/generation/holder/worktree/branch/base/
  policy binding) — policy identity alone raises `MISSING_ACTUAL_CONTEXT`
  or the preflight reason and never opens the gate; (4) live child
  (`child_alive=True`) is undrained in every effect state
  (`TRANSFER_BLOCKED_LIVE_CHILDREN`), `reconcile_effect` preserves the
  child flag unless explicitly reconciled dead; (5) duplicate/conflicting
  shared-file exception records for the same path + participant/
  generation set are rejected (duplicates are NOT idempotent); (6)
  `LOCK_HOLDING_CLAIM_STATUSES` = all §4.1 states except READY/MERGED/
  CLOSED — overlap enforcement applies only to lock-holding claims.
- All six reviewer reproducers re-run post-repair: PASS (straggler admit
  after close fails closed; non-owner shared write denied; wrong-worktree
  activation stays AWAITING with closed gate; live child after reconcile
  blocks until reconciled dead; DUP_SHARED_OWNER →
  INVALID_SHARED_EXCEPTION; CLOSED overlap accepted while active overlap
  still conflicts).
- Deterministic threaded concurrency regressions added (Barrier/Event
  choreography, 200-round admit-vs-close race, 8-admitter sweep).
- Adjacent suites green; `git diff --check` PASS.

### Remediation evidence — R4 (GPT-5.6 Sol R3 review, five P1) / 2026-09-08

Exact-SHA review of the R3 head `7a6eb457230ce07748c0fa82abeb9f9725fdd702`
(CHANGES_REQUIRED) confirmed the six prior blockers fixed and found five
additional contract gaps; all repaired on the same claim/generation/holder
with regression-first tests.

- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 202 tests … FAILED (failures=12, errors=5)` — 17 failing (the five
  blockers' regressions), 185 prior tests passing unchanged.
- GREEN: `Ran 202 tests … OK` (stable across repeated runs); pytest →
  `202 passed, 15 subtests passed`.
- Repairs:
  1. `_read_current_work()` freezes `origin/main` once and reads the
     document from that exact object (`git show <sha>:…`); the second Git
     read never touches the mutable ref (§3.1 exact policy binding).
  2. New ordered/idempotent `OPERATION_RECONCILED` lifecycle event binds
     operation_id + claim generation, accepts only an explicit terminal
     observation (`SUCCEEDED`/`FAILED`), durably clears
     `has_unresolved_external_operations`, and retains the original
     UNKNOWN execution outcome for audit (`operation_record()`); a later
     `OPERATION_OUTCOME` stays `EVENT_CONFLICT`.
  3. One barrier-level `RLock` serializes `begin_quiesce`,
     `holder_publish`, `coordinator_interrupt`, `complete_transfer`, and
     activation: one g attestation yields at most ONE g+1 handoff; the
     concurrent second transfer fails `TRANSFER_NOT_READY` instead of
     advancing to g3. Process-local, as with the admission gate.
  4. §7.3 global invariant: at most ONE active exception record per
     canonical shared path across ALL participant sets — triangle/pairwise
     coverage of one path is `INVALID_SHARED_EXCEPTION`; three
     participants belong in one record with one owner and one merge order.
  5. `RELEASED_CLAIM_STATUSES = (READY, CLOSED)`: MERGED and
     POSTMERGE_VERIFY hold their scope lock until the authorized CLOSED
     release, and `evaluate_control_transition` now skips released
     records exactly like `validate_registry` (no implicit MERGED
     release). This supersedes the R3 MERGED-releases derivation that was
     flagged for reviewer confirmation.
- All five reviewer reproducers re-run post-repair, all fail closed:
  `M1_PAIR` second git call is `show <frozen-sha>:docs/ai/CURRENT-WORK.md`
  with the text bound to revision N; `M2` unresolved True → False with
  original outcome UNKNOWN retained and `reconciled=SUCCEEDED`;
  concurrent double transfer always exactly one success at generation 2
  with the loser `TRANSFER_NOT_READY` (never generation 3);
  `TRIANGLE_MULTI_OWNER` → `INVALID_SHARED_EXCEPTION`;
  `MERGED_OVERLAP` → `OWNERSHIP_CONFLICT`.
- Concurrency regressions added: decoy-widened attestation-scan double
  transfer race (40 rounds), publish-vs-transfer serialization (25
  rounds), 4-way mixed §4.4 activation race (exactly one activation, no
  partial activation).
- Adjacent suites green (workflow runtimes OK; runtime check PASS 5
  files; split_sql all passed; ci_alert_payload 33 passed);
  `git diff --check` PASS; live `status` CLI smoke reads the real
  registry through the frozen-SHA read (`7d4e6b52`, `BOOTSTRAP_CONTROL`).

### Remediation evidence — R5 (Sol triage of Astra review, five blockers) / 2026-09-08

Sol reviewed R4 head `b3748d265fb83961dd6c00e593a64b64ce0a9448`
(APPROVED_PENDING_INDEPENDENT_FINAL), then triaged the Astra adversarial
review against that exact head: five findings still reproducible; all
repaired on the same claim/generation/holder with regression-first tests.

- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 219 tests … FAILED (failures=11, errors=1)` — 12 failing (the
  five blockers' regressions), 207 prior tests passing unchanged.
- GREEN: `Ran 219 tests … OK` (stable across repeated runs); pytest →
  `219 passed, 15 subtests passed`.
- Repairs:
  1. Transfer tuple binding: after a SUCCEEDING §4.4 preflight,
     `activate_transferred_claim` additionally requires
     decision.claim_id/generation/holder == the pending barrier tuple
     before any state change or gate open (new reason
     `TRANSFER_TUPLE_MISMATCH`); a valid g1/A decision can never
     activate a pending g2/B runtime.
  2. Publication gate: any `published=False` event is rejected
     (`EVENT_NOT_PUBLISHED`; GOAL_END keeps its pinned
     `GOAL_END_NOT_PUBLISHED`) BEFORE any state mutation, so
     authoritative state/head never move on unpublished evidence and a
     later published retry of the same semantic event applies cleanly
     (tested for all six event types).
  3. Attestation replay re-validation: fresh publication and replay share
     one current-safety-fact gate (`_publication_block_reason`); a replay
     reporting newly discovered `unresolved_external_operations=True`
     demotes TRANSFER_READY → QUIESCING, blocks transfer, and a later
     supported replay re-establishes readiness.
  4. Link/lock parity: `_evaluate_link` skips released (READY/CLOSED)
     claims exactly like registry and control-transition overlap logic;
     RECOVERY_HOLD/STALE_CLAIM/STATE_DRIFT still protect their scope.
  5. Strict goal predecessor: after the first goal, every new GOAL_START
     must directly reference the previous durable terminal GOAL_END event
     (`_last_goal_end_id`); a post-terminal OPERATION event as
     predecessor is rejected with `OUT_OF_ORDER_EVENT`.
- All five reproducers re-run post-repair, all fail closed:
  `A1_WRONG_TUPLE_SAFE=False TRANSFER_TUPLE_MISMATCH AWAITING_AUTHORIZATION
  CLOSED`; `A3_UNPUBLISHED_OUTCOME=EVENT_NOT_PUBLISHED` with head
  unchanged and unresolved retained; `A4_REPLAY` publish
  success/replay-blocked with `QUIESCING` +
  `TRANSFER_BLOCKED_UNRESOLVED_EFFECTS` and transfer blocked;
  `A8_CLOSED_LINK=True None` while RECOVERY_HOLD still
  `LINK_CROSSES_LANE`; `A10_NEW_GOAL_AFTER_NONTERMINAL_HEAD=
  OUT_OF_ORDER_EVENT` with the normal GOAL_END predecessor accepted.
- Adjacent suites green (workflow runtimes OK; runtime check PASS 5
  files; split_sql all passed; ci_alert_payload 33 passed); both scripts
  compile clean; `git diff --check` PASS.

## Stop condition

Implementation owner stops at `REVIEW_REQUESTED`; must not self-merge and must
not modify central claim/SSoT files.

## One next safe action

After the bootstrap claim PR is independently reviewed and merged, create the
isolated `feat/env-coord-002` worktree from that exact main, launch one
GLM-5.3 MAX ZCode context with holder ID
`zcode-env-coord-002-g1-primary`, run RED tests first, then implement only this
slice.
