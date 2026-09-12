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

### Remediation evidence — R6 (Sol R5 exact-SHA review, lifecycle compatibility) / 2026-09-08

Sol reviewed R5 head `8f1d9ca49c054959a93643c55e4ba88576ffcb95`
(CHANGES_REQUIRED, Standards/Spec audit): the guard's status vocabulary
was incompatible with the repo's canonical task lifecycle. All repaired
on the same claim/generation/holder with regression-first tests.

- Authority read before designing (no invented semantics): architecture
  §4.1 ("existing repository compatibility states remain valid until
  migrated"), protocol §18 (preferred lifecycle + READY_FOR_IMPLEMENTATION
  / RE-REVIEW_REQUESTED compatibility labels, read in full), ENV-
  ENGINEERING-LOOP §25 progression, and the authoritative CURRENT-WORK
  allowed-statuses list at `origin/main@7d4e6b52` (which additionally
  carries IDLE and DESIGNING); DESIGNING usage pinned from
  `docs/ai/digital-twin/07-ROADMAP.md` and RE-REVIEW_REQUESTED usage
  from `docs/ai/HANDOFF.md` (implementation owner must not act).
- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 230 tests … FAILED (failures=6, errors=8)` — 14 failing items
  across 11 new R6 regression methods (the 219 prior tests passing
  unchanged, preserving every current-five + historical regression).
- GREEN: `Ran 230 tests … OK` (stable across repeated runs); pytest →
  `230 passed, 25 subtests passed`.
- Repair (vocabulary + deterministic semantics, derivations recorded in
  code comments):
  1. `CLAIM_STATUSES` now accepts the full repo compatibility contract:
     adds `VERIFYING`, `READY_FOR_IMPLEMENTATION`,
     `RE-REVIEW_REQUESTED`, `IDLE`, `DESIGNING`. A registry following
     the still-valid lifecycle stays readable.
  2. `MUTABLE_CLAIM_STATUSES = (CLAIMED, ACTIVE, IMPLEMENTING,
     VERIFYING)`: §18 splits §4.1's ACTIVE working phase into
     IMPLEMENTING → VERIFYING before the REVIEW_REQUESTED gate —
     canonical IMPLEMENTING no longer self-fences implementation, and
     VERIFYING (holder-side verification writing evidence) is equally
     mutable. Transferred generations in IMPLEMENTING activate through
     the ordinary §4.4 preflight (regression included).
  3. Lock/release: `READY_FOR_IMPLEMENTATION` is released like READY
     (engineering-loop §25 pre-implementation slot);
     `RE-REVIEW_REQUESTED` fences exactly like REVIEW_REQUESTED (not
     mutable, lock held); `IDLE`/`DESIGNING` are accepted vocabulary
     with conservative fail-closed semantics — no mutation grant is
     derivable from current repo authority, and §4.5 keeps their scope
     held (inactivity must not silently free scope).
- Reviewer reproducers re-run post-repair: `VERIFYING`,
  `RE-REVIEW_REQUESTED`, `READY_FOR_IMPLEMENTATION` all parse OK;
  `IMPLEMENTING` preflight `SAFE_TO_MUTATE = true`; `VERIFYING`
  preflight true; `READY_FOR_IMPLEMENTATION`/`RE-REVIEW_REQUESTED`
  preflight false `CLAIM_STATUS_NOT_MUTABLE`. Full allowed-status
  vocabulary parses in one registry (18 statuses).
- Recorded for reviewer confirmation (not blockers; conservative
  fail-closed defaults): IDLE/DESIGNING mutation semantics (none
  granted), READY_FOR_IMPLEMENTATION released-like-READY derivation.
  No DECISION_REQUIRED ambiguity was material enough to block the
  repair: every named state had derivable semantics and the two extra
  vocabulary states received fail-closed treatment.
- Adjacent suites green (workflow runtimes OK; runtime check PASS 5
  files; split_sql all passed; ci_alert_payload 33 passed); both scripts
  compile clean; `git diff --check` PASS; live `status` CLI smoke still
  reads the real registry (`7d4e6b52`, `BOOTSTRAP_CONTROL`,
  `ENV-COORD-002-C1` CLAIMED).

### Remediation evidence — R7 (Sol R6 exact-SHA review, READY_FOR_IMPLEMENTATION release defect) / 2026-09-08

Sol reviewed R6 head `038f51e2fd6d1175295450a25e3bb9553bfb0f63`
(CHANGES_REQUIRED, comment 5583791336): R6's "READY_FOR_IMPLEMENTATION
released like READY" derivation was not supported by repo compatibility
usage and permitted overlapping ownership. Repaired on the same
claim/generation/holder with regression-first tests.

- Authority re-verified by the implementation owner (not taken from the
  comment alone): `docs/work-orders/WO-STAB-006-PROPOSAL.md` and
  `WO-STAB-009-PROPOSAL.md` record "Status: ACTIVE —
  READY_FOR_IMPLEMENTATION" with assigned GLM owners and owned files;
  `docs/work-orders/WO-UX-AN-P001-GLM.md` records
  `Status: READY_FOR_IMPLEMENTATION`, `Owner: GLM 5.3`, owned files, and
  allows parallel work only because owned files do not overlap — i.e.
  the state allocates/owns its scope; release semantics were wrong.
- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 232 tests … FAILED (failures=3)` — exactly the three R7
  regressions (registry overlap, control-transition admission, link
  parity); 229 prior tests passing unchanged (all R1–R6 regressions +
  the ordinary-READY released controls).
- GREEN: `Ran 232 tests … OK` (stable across repeated runs); pytest →
  `232 passed, 25 subtests passed`.
- Repair (smallest): `RELEASED_CLAIM_STATUSES = (READY, CLOSED)`;
  `READY_FOR_IMPLEMENTATION` stays parse-valid and non-mutable but now
  LOCK-HOLDING — registry overlap, control-transition admission, and
  link/scope protection all derive from `LOCK_HOLDING_CLAIM_STATUSES`
  and enforce consistently. R6 code comment corrected with the WO
  evidence; no DECISION_REQUIRED ambiguity (the cited usage is
  unambiguous).
- Reviewer reproducers re-run post-repair:
  `READY_FOR_IMPLEMENTATION_OVERLAP=REJECTED reason=OWNERSHIP_CONFLICT`;
  `READY_OVERLAP=ACCEPTED`; `RE-REVIEW_REQUESTED_OVERLAP` and
  `IMPLEMENTING_OVERLAP` still REJECTED;
  `READY_FOR_IMPLEMENTATION_NEW_OVERLAP valid=False
  reason=OWNERSHIP_CONFLICT`; `READY_NEW_OVERLAP valid=True reason=None`;
  `RE-REVIEW_REQUESTED_NEW_OVERLAP` / `IMPLEMENTING_NEW_OVERLAP` still
  rejected.
- READY released-controls preserved in-suite: `test_ready_does_not_hold_lock`,
  `test_transition_overlap_with_ready_claim_accepted`,
  `test_ready_claim_does_not_block_link_crossing`.
- Adjacent suites green (workflow runtimes OK; runtime check PASS 5
  files; split_sql all passed; ci_alert_payload 33 passed); both scripts
  compile clean; `git diff --check` PASS; live `status` CLI smoke still
  reads the real registry (`7d4e6b52`, `BOOTSTRAP_CONTROL`,
  `ENV-COORD-002-C1` CLAIMED).

### Remediation evidence — R8 (Sol triage of Astra final review, four blockers) / 2026-09-08

Astra final review of R7 head `f217e42ae6d22e10f7dded84ee49211f8013ffb1`
found four blocking defects; Sol independently reproduced all four
(comment 5583791336 → triage comment 5584602143). All repaired on the
same claim/generation/holder with regression-first tests.

- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 241 tests … FAILED (failures=14)` — all four blockers'
  regressions failing (boundary probe admitted IN_FLIGHT; both path
  aliases evaluated safe; fresh + conflicting uncertainty left
  TRANSFER_READY standing; post-terminal outcome and reconciliation
  applied and stranded the head); 227 prior tests passing unchanged.
- GREEN: `Ran 241 tests … OK` (stable across repeated runs); pytest →
  `241 passed, 33 subtests passed`.
- Repairs:
  1. `complete_transfer` constructs the g+1 `HolderRuntime` privately,
     closes its gate while still private, and only then assigns
     `self.runtime` — the new runtime is never externally observable
     OPEN; the orchestrated boundary probe (intercepting the exact
     publication/close point) now observes `ADMISSION_GATE_CLOSED`, the
     published AWAITING runtime is already CLOSED, failed activation
     keeps it CLOSED, and exact-tuple activation opens it normally.
  2. `canonicalize_path` rejects segments with a trailing `.` or
     trailing ASCII space with `INVALID_PATH` (never trims) — Win32
     aliases of a forbidden file can no longer bypass exact scope
     evaluation; interior dots/non-trailing spaces stay valid; case/
     separator/NFC/traversal tests unchanged.
  3. `holder_publish` invalidates an established `TRANSFER_READY` on
     contrary current safety evidence from the CURRENT holder BEFORE
     identity/replay/conflict handling (fresh attestation id returns
     blocked with state demoted; conflicting payload still raises
     `EVENT_CONFLICT` but only after demotion); `complete_transfer`
     then fails `TRANSFER_NOT_READY`; restoration only via a supported
     replay; non-holder reports still change nothing.
  4. `OPERATION_OUTCOME` and `OPERATION_RECONCILED` require an ACTIVE
     goal — post-terminal operation events are rejected
     `OUT_OF_ORDER_EVENT` before advancing the durable head, so the
     terminal GOAL_END stays the head; the documented legal recovery
     chain (Goal1 START → INTENT → UNKNOWN → Goal1 END(PARTIAL) →
     Goal2 START from the terminal GOAL_END → RECONCILED under the
     active recovery goal → Goal2 END(COMPLETED_VERIFIED) → Goal3
     START legally continues) passes with the original UNKNOWN audit
     retained.
- All four Astra/Sol reproducers re-run post-repair: R8-1 boundary
  `REJECTED/ADMISSION_GATE_CLOSED`, post-state AWAITING_AUTHORIZATION
  with gate CLOSED; R8-2 exact path FORBIDDEN_PATH while both aliases
  REJECTED INVALID_PATH; R8-3 cases A/B demote to QUIESCING with
  `complete_transfer` blocked at generation 1; R8-4 post-terminal
  reconciliation rejected with head staying on the GOAL_END and the
  full recovery chain closing cleanly.
- R5 semantic correction authorized by the Astra finding: the two
  R5 stranded-head tests pinned rejection of a GOAL_START after a
  post-terminal operation event; with post-terminal operation events
  now rejected earlier, those tests were updated to the corrected
  contract (the terminal GOAL_END stays head; the next goal starts
  from it). All other R1–R7 regressions pass unchanged.
- Prior high-risk suites re-run focused (path canonicalization, goal
  lifecycle, reconciliation, unpublished events, transfer barrier,
  admission gate, concurrency, shared-file ownership/uniqueness, lock
  statuses, compatibility statuses, symlink policy): 158 tests OK.
- Adjacent suites green (workflow runtimes OK; runtime check PASS 5
  files; split_sql all passed; ci_alert_payload 33 passed); both scripts
  compile clean; `git diff --check` PASS; live `status` CLI smoke still
  reads the real registry (`7d4e6b52`, `BOOTSTRAP_CONTROL`,
  `ENV-COORD-002-C1` CLAIMED).

### Remediation evidence — R9 (Sol R8 exact-SHA review, goal identity) / 2026-09-08

Sol reviewed R8 head `0fa7de691ddb9b4c0f79ae1c49bb455e9d15b463`: the
four Astra R7 blockers independently verified CLOSED; one new blocking
P2 — active-goal-scoped lifecycle events did not verify
`event.goal_id == active goal`. Repaired on the same
claim/generation/holder with regression-first tests.

- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 247 tests … FAILED (failures=4)` — the four mismatch regressions
  (CHECKPOINT / OPERATION_INTENT / OPERATION_OUTCOME /
  OPERATION_RECONCILED with a wrong goal_id all applied); 243 prior
  tests passing unchanged.
- GREEN: `Ran 247 tests … OK` (stable across repeated runs); pytest →
  `247 passed, 33 subtests passed`.
- Repair: `LifecycleLog.apply` requires, for every active-goal-scoped
  event (CHECKPOINT, OPERATION_INTENT, OPERATION_OUTCOME,
  OPERATION_RECONCILED), that `event.goal_id` equals the CURRENT active
  goal, failing closed `OUT_OF_ORDER_EVENT` BEFORE any mutation
  (operation registration/outcome/reconciliation records, head, events,
  active-goal state all untouched on rejection). GOAL_END already
  enforced identity; no new reason code needed.
- R8 recovery model preserved and pinned: an old UNKNOWN operation
  (intent under g1) is reconciled by an event identifying the CURRENT
  recovery goal g2 — the reconciliation event's goal_id is NOT required
  to equal the original intent's goal; the full chain Goal1 PARTIAL →
  Goal2 recovery START → RECONCILED(g2) → Goal2 END → Goal3 START
  still applies with the UNKNOWN audit retained.
- Reviewer reproducer re-run post-repair: `INTENT(g999)` and
  `OUTCOME(g999)` under active g1 → `OUT_OF_ORDER_EVENT` with head/events
  unchanged; `RECONCILED(g999)` under recovery g2 → `OUT_OF_ORDER_EVENT`
  with head e3 and unresolved state unchanged; the matching-identity
  recovery chain closes cleanly (unresolved cleared, UNKNOWN audit
  retained, head advanced legally).
- Focused high-risk classes re-run including the new R9 class: 164 OK
  (goal identity, lifecycle, reconciliation, unpublished events,
  transfer barrier, admission gate, concurrency, shared-file
  ownership/uniqueness, path canonicalization, symlink, lock statuses,
  compatibility statuses).
- Adjacent suites green (workflow runtimes OK; runtime check PASS 5
  files; split_sql all passed; ci_alert_payload 33 passed); both scripts
  compile clean; `git diff --check` PASS; live `status` CLI smoke still
  reads the real registry (`7d4e6b52`, `BOOTSTRAP_CONTROL`,
  `ENV-COORD-002-C1` CLAIMED).

### R10 — Overnight exhaustive hardening campaign / 2026-09-09

Campaign: ENV-COORD-002 R10 Overnight Exhaustive Hardening.
Start exact SHA: `7ea9e11508a8a7606d681bdde414770515774c54` (verified =
local HEAD = origin/feat/env-coord-002 = PR #84 head before work).
Base: `origin/main@7d4e6b52c616ff15f86e399a085ef16477d38ef8` (ancestor
verified). Claim `ENV-COORD-002-C1` gen 1 holder
`zcode-env-coord-002-g1-primary`; live registry re-read through the
guard CLI (`7d4e6b52` / registry_hash `2d1b901b…` / BOOTSTRAP_CONTROL /
CLAIMED). `SAFE_TO_MUTATE = YES`; no other writer; `.serena/` untouched.

**Phases completed:** state re-pin; authoritative-source re-read (AGENTS,
Operating Map, origin/main CURRENT-WORK registry + allowed-status list,
this WO, full architecture §1–15, engineering loop §24–27, protocol
§18–23, DEFECT-MEMORY index, A-Wiki pointer — no coordination-specific
A-Wiki content; repo authority governs); R9 baseline reproduced (4
mismatch negatives fail closed with byte-identical state snapshots,
positive controls + R8 recovery chain green); invariant matrix built
internally; adversarial probes across registry parsing, trust/TOCTOU,
status matrix, paths, scope grammar, mutation endpoints, symlinks,
shared-owner exceptions, lifecycle/operations/publication, admission
gate, transfer barrier, attestation identity, concurrency stress,
exception atomicity, reason codes, enforcement truth, CLI, type
boundaries, encapsulation, determinism, cross-subsystem consistency,
historical-defect coverage, test quality.

**New defects found and repaired (all RED → minimal repair → GREEN):**

1. **Registry `version` bool masquerade (P3).** `"version": true`
   accepted: Python `True == 1` defeats `version != REGISTRY_VERSION`.
   Violated schema-integer intent; inconsistent with the existing
   `claim_generation` bool rejection. Repair: strict non-bool int check
   → `UNSUPPORTED_REGISTRY_VERSION`. Regression:
   `TestRegistryParsing.test_registry_version_must_be_real_integer`
   (True/False/1.0/"1"/None all rejected).
2. **Lifecycle schema-int masquerades/crashes (P2).** `event_seq="3"`
   crashed `TypeError` in the monotonic comparison (no GuardFailure);
   `event_seq=2.5` accepted; `claim_generation=True` accepted as
   generation 1. Violated §5 monotonic-integer semantics and §7.1
   fail-closed reasons. Repair: type fencing at the top of
   `LifecycleLog.apply` (`STALE_CLAIM_GENERATION` / `OUT_OF_ORDER_EVENT`)
   before any mutation. Regressions: `TestLifecycleTypeBoundaries`
   (crash-not-reason, float/bool rejection, snapshot-unchanged sweep).
3. **Unhashable shared-exception participant id (P2).**
   `participating_claims` entry with a list `claim_id` crashed
   `TypeError: unhashable type` on the registry lookup. Repair: strict
   non-empty-str check → `INVALID_SHARED_EXCEPTION` (the participant
   generation field already rejected bools — pinned as a regression).
4. **CLI malformed lifecycle document traceback (P2).**
   `validate-lifecycle` on invalid JSON / missing fields / bad
   generation exited rc=1 with a raw traceback instead of the §7.1
   reason contract. Repair: CLI boundary maps
   `TypeError/ValueError/KeyError` to `IO_ERROR` + exit 2. Regression:
   `TestCLI.test_validate_lifecycle_malformed_document_fails_closed`
   (4 malformed shapes).
5. **Preflight `claim_generation` bool masquerade (P2,
   authorization path).** `claim_generation=True` in the execution
   context passed preflight as generation 1 via the equality fence —
   found by the new metamorphic property sweep. Violated §4.2 exact-
   generation fencing. Repair: strict non-bool int check in `preflight`
   → `STALE_CLAIM_GENERATION`. Protected by
   `TestMetamorphicProperties.test_wrong_generation_or_holder_never_
   increases_authorization`.
6. **Control-transition generation bool masquerade (P2).**
   `expected_claim_generation=True` satisfied the §4.3 serialization
   fence as generation 1. Repair: exact-int fencing for expected AND
   proposed generations. Regression:
   `TestControlTransition.test_transition_generation_bool_masquerade_
   rejected` (5 malformed combinations).

**Audited clean (no defect; evidence recorded):** missing/duplicate/
malformed/decoy registry blocks; unsupported version; duplicate claim
ids/tasks; empty IDs; unknown status; forbidden-inside-mutable
(evaluation-level precedence); frozen single `origin/main` read (only
one real Git read exists); decision tuple binding across
preflight/activation; full accepted-status matrix consistent across
registry overlap / transition admission / link crossing (all three
derive from `LOCK_HOLDING_CLAIM_STATUSES`; MUTABLE consumed only by the
shared preflight); scope grammar (segment-boundary matching, wildcard
rejections, case aliases); mutation endpoints (rename/copy/mixed-batch
worst-element fail-closed); symlink matrix (lock/release parity);
§7.3 exceptions (9 adversarial shapes incl. triangle/owner/generation/
merge-order/release); lifecycle transition matrix incl. atomicity
snapshots; operation journal sequences; publication/replay idempotency;
admission gate edge sweep; transfer barrier states; attestation
identity matrix (stale attestation cannot drive g2; old-holder and
new-holder replay behavior); concurrency stress across 4 switch
intervals; decision determinism (identical digests over repeats);
encapsulation (observed: `TrustedPolicy.claims` dicts are observational
but technically mutable in memory — documented limitation, no repair;
trust boundary is at policy construction from hash-bound text); reason
codes; enforcement truth (BOOTSTRAP_CONTROL preserved, no ENFORCING
path reachable without server verification); CLI exit codes. Historical
defect coverage re-verified: 25 sampled regressions from R1–R9 all
present (one per material defect).

**Durable additions:** `TestLifecycleTypeBoundaries` (5 tests),
`TestGoalIdentityMismatch` already from R9, `TestMetamorphicProperties`
(9 bounded deterministic property tests: canonicalization idempotence,
NFC stability, case-alias equivalence, forbidden-scope monotonicity,
generation/holder fencing monotonicity, closed-gate admission
monotonicity, uncertainty monotonicity, replay idempotency/conflict,
goal-identity monotonicity), participant/CLI/registry masquerade
regressions.

**Final verification (exact counts):** standalone suite 4 consecutive
runs OK; pytest **266 passed + 81 subtests**; focused high-risk classes
OK; concurrency stress PASS at switch intervals 1e-6/1e-5/1e-4/0.02;
workflow runtimes OK; runtime checker PASS (5 files); split_sql all
passed; ci_alert_payload 33 passed; py_compile clean; `git diff --check`
PASS; changed paths = exactly the two script files + this WO + the lane
handoff; no secrets/raw data touched; `.serena/` untracked/untouched.

**Known limitations (unchanged + new):** policy object interiors are
technically mutable in memory (trust boundary is construction from
hash-bound text; adapters must treat `TrustedPolicy` as read-only);
Win32 alias rejection covers the authoritative smallest defect
(trailing dot/space); process-local atomicity; scope-check
inspection-only; no hooks/CI/server policy (ENV-COORD-003+); no central
§7.3 writer.

**Unresolved P1/P2:** none. **DECISION_REQUIRED items:** none.
**Readiness:** all campaign phases completed green; candidate is ready
for independent GPT-5.6 Sol exact-SHA review.

### Remediation evidence — R11 (Sol R10 exact-SHA review, five blocker groups) / 2026-09-09

Sol reviewed R10 head `11c910bf15fa7a94c446a919d269df4a24f3b253`
(CHANGES_REQUIRED, comment 5593185043). Start state re-pinned identical;
same claim/generation/holder; four-path scope.

- RED: `python scripts/test_env_coordination_guard.py` →
  `Ran 283 tests … FAILED (failures=65)` — all five blocker groups'
  regressions; 243 prior tests passing (R1–R10 preserved).
- GREEN: `Ran 283 tests … OK` (stable ×3); pytest →
  `283 passed, 217 subtests passed`.
- **A — TrustedPolicy recursive immutability (P1):** new `_freeze`
  (dict→MappingProxyType, list→tuple recursively) applied to the
  validated registry snapshot returned by `validate_registry`;
  `_thaw` + MappingProxyType acceptance keep `validate_registry`
  re-entrant; collection checks tuple-tolerant. Post-construction
  mutation of claims/scope lists/status/holder/generation/task/branch/
  worktree/raw_registry/shared-exception owner/participants/merge_order/
  release_condition is now IMPOSSIBLE (TypeError), and authorization is
  byte-identical before/after attempts under a constant registry_hash
  (Sol's frontend reproducer closed: mutation blocked, still
  FORBIDDEN_PATH, hash stable).
- **B — base ancestry exact bool (P1):** preflight authorizes only
  `base_ancestor_of_head is True`; "false"/"0"/1/1.0/"true"/[]/{}/None
  all fail `BASE_NOT_ANCESTOR`. Transferred-claim activation inherits
  the behavior (regression pins wrong-value activation stays
  AWAITING_AUTHORIZATION with gate CLOSED; exact-True activates).
- **C — enforcement verification exact bool (P1):**
  `effective_enforcement_mode` accepts only exact `True` as verified
  server enforcement; ENFORCING/HARDENED with any truthy masquerade
  report `ENFORCEMENT_NOT_ACTIVE` (full 4-mode boundary matrix pinned).
- **D — lifecycle publication exact bool (P1):** `published` must be
  exact `True` to apply; False unpublished; every non-bool masquerade
  ("false"/"true"/1/0/None/"1"/2.0/[]/{}) fails closed before mutation
  across all six event classes (EVENT_NOT_PUBLISHED; GOAL_END keeps
  GOAL_END_NOT_PUBLISHED). The "false"-terminated-goal reproducer is
  closed (active goal unchanged).
- **E — lifecycle schema boundary (P1):** log `claim_generation` exact
  positive non-bool int in the constructor (`STALE_CLAIM_GENERATION`);
  CLI `int(...)` coercion removed (true/1.0/"1"/0/-1/None all rc=2, no
  silent normalization); identity fields `event_id`/`previous_event_id`/
  `goal_id` exact non-empty strings (`OUT_OF_ORDER_EVENT`) — the
  GOAL_START(goal_id=None) → invisible-active-goal → second-start chain
  is impossible; `task_id` exact non-empty string and one log binds one
  task identity (first applied event binds; mismatch → `WRONG_CLAIM`),
  derived from the registry's 1:1 claim↔task mapping — the narrow
  constructor-vs-inference ambiguity required no DECISION_REQUIRED
  because consistent binding alone satisfies the reviewer's minimum.
- Reviewer reproducers re-run post-repair: A mutation blocked + hash
  stable + FORBIDDEN_PATH; B False/True/"false"/"0"/1 exact; C
  ENFORCING evidence False/"false"/"0"/1 → ENFORCEMENT_NOT_ACTIVE,
  True → ENFORCING; D GOAL_END("false") rejected with goal still
  active; E GOAL_START(None) and task_id=123 rejected.
- Adjacent suites green (workflow runtimes OK; checker PASS 5 files;
  split_sql all passed; ci_alert 33 passed); py_compile clean;
  `git diff --check` PASS; live `status` smoke reads the real registry
  (`7d4e6b52`, BOOTSTRAP_CONTROL, CLAIMED).

### FINAL LONG-RUN HARDENING CAMPAIGN (Prompts 1–10) / 2026-09-09

Campaign: ENV-COORD-002 R11+ long-run hardening (10-prompt campaign).
Start SHA (before Prompt 1): `11c910bf15fa7a94c446a919d269df4a24f3b253`.
Checkpoint SHAs: Prompt 1 (R11 five blockers) → `3ac65d6235430b1e8c5
59 84c1791fd197a75c85c`; Prompts 2–9 fixes + Prompt 10 packet → the
final freeze commit (the remote PR #84 head after this push). Base:
`origin/main@7d4e6b52c616ff15f86e399a085ef16477d38ef8`. Claim
`ENV-COORD-002-C1` gen 1 holder `zcode-env-coord-002-g1-primary`.

**Prompt 1 — R11 blockers (all closed, see R11 section above):**
TrustedPolicy deep immutability; base-ancestry exact-bool; enforcement
verification exact-bool; lifecycle publication exact-bool; lifecycle
schema boundary (log generation, identity fields, task binding, CLI
de-coercion).

**Prompt 2 — policy/evidence-binding deep audit (audited clean; pinned):**
all 13 obtainable mutation surfaces blocked; `claims`/`raw_registry`
intentionally alias ONE immutable mapping (aliasing cannot create
authorization/evidence drift under full immutability); deepcopy of
policy interiors is isolated; Decisions frozen and hash-stable;
policy_revision type boundaries (None/""/123/[]/{}) →
INVALID_CLAIM_FIELD; frozen revision/text pair consistent. Durable
regressions: `TestPolicyEvidenceBinding` (5 tests).

**Prompt 3 — lifecycle schema/state-machine (one repair):**
`OPERATION_INTENT` with None/empty/non-str `operation_id` was accepted —
unidentifiable operations could be journaled (§5.5 stable identity).
Repair: exact non-empty-string operation_id (`OUT_OF_ORDER_EVENT`)
before registration. Also pinned: sequence gaps are legal monotonic
progress (dup/lower still rejected); post-terminal
CHECKPOINT/INTENT/OUTCOME/RECONCILED/second-GOAL-END all rejected with
snapshot-verified atomicity. New tests in `TestLifecycleSchemaBoundary`.

**Prompt 4 — boolean/coercion sweep (audited clean; no repair):**
zero remaining `int()` coercion sites; every exact-bool field from
R10/R11 holds; `unresolved_external_operations` and `child_alive`
masquerades are directionally fail-closed — the dangerous direction
("false" string clearing uncertainty or unblocking a child) cannot
occur; truthy masquerades conservatively block. Evidence tables in the
lane handoff.

**Prompt 5 — exception atomicity/stale handles (audited clean):**
representative rejection classes leave authoritative state unchanged
(snapshot-verified in suite); the one authorized fail-side mutation
(current-holder contrary quiescence demoting stale TRANSFER_READY
before EVENT_CONFLICT) is explicitly tested. Stale-handle audit: after
transfer+activation the old `HolderRuntime` remains CLOSED (admission
rejected); a caller may poke the stale object's gate attribute but the
stale runtime is detached from the barrier — no authorization path
consumes it (documented limitation, not a bypass).

**Prompt 6 — paths/scope/symlink/shared-owner (audited clean):**
shared-owner single-writer, non-owner denial, and owner link-crossing
into the exact shared path verified correct under the R11 frozen-policy
structures; no Windows semantics broadened.

**Prompt 7 — concurrency/transfer/quiescence (audited clean):**
deterministic races (double transfer, admit-vs-close ×200, 8-admitter
sweep, publication boundary probe, mixed activation race) all green;
concurrency class stress ×3 plus R10's four switch-interval sweep.

**Prompt 8 — aliasing/encapsulation (one repair, P2):**
`LifecycleEvent` is frozen but its `payload` dict was shared with the
caller — post-apply mutation through that reference rewrote durable
evidence and permanently changed replay/conflict semantics (deterministic
reproducer: stored payload became "MUTATED-AFTER-APPLY"; the ORIGINAL
semantic payload then conflicted). Repair: `LifecycleLog.apply` stores a
`copy.deepcopy` of the event after every validation and before any
mutation — durable records are detached from caller references;
operation-record intents are detached too. Regressions:
`TestDurableEventIsolation` (3 tests). `operation_record()` returns a
fresh dict (verified); attestation storage is not caller-accessible;
`Decision`/`TransitionValidation`/`ScopeExpr`/`ModeDecision` frozen-safe.

**Prompt 9 — defect history + test quality (audited clean):** every
material R1–R11 defect maps to at least one executable regression
(mapping recorded in the lane handoff); classes run individually and in
suite with identical results (no order/isolation dependence); repeated
runs stable.

**Prompt 10 — final freeze:** this packet; final verification battery
recorded in the lane handoff R11+ section; final SHA = the remote PR
#84 head after this push.

## Stop condition

Implementation owner stops at `REVIEW_REQUESTED`; must not self-merge and must
not modify central claim/SSoT files.

## One next safe action

After the bootstrap claim PR is independently reviewed and merged, create the
isolated `feat/env-coord-002` worktree from that exact main, launch one
GLM-5.3 MAX ZCode context with holder ID
`zcode-env-coord-002-g1-primary`, run RED tests first, then implement only this
slice.
