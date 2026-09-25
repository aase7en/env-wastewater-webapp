# ENV-COORD-005 — ZCode/Kilo lifecycle adapter

Status: DECISION_REQUIRED (proposal only; no implementation claim is active)
Risk: HIGH (cross-session mutation authorization and recovery)
Proposed implementation model: GLM-5.3 MAX, after the activation gates below
Current control-transition owner: GPT-5.6 Sol per the authoritative COORD-002 work order
GPT-6 Sol role: optional high-risk architecture/adjudication review when routed
Read-only advisory: JEV
Repository: `aase7en/env-wastewater-webapp`
Last updated: 2026-09-26

## Trigger and current recovery disposition

The COORDINATION-REGISTRY on `origin/main@94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed`
still records `ENV-COORD-002-C1`, generation `1`, holder
`zcode-env-coord-002-g1-primary`, status `CLAIMED`.

Read-only recovery found the Kilo session `ses_f41557e93ffezzqC5u0tui2EyB`,
title `ENV-COORD-002 R17 strict registry schema`, model `cointh-glm/glm-5.3/max`,
and worktree `A:\GitHub\envww-coord-002`. Its 58 recorded tool calls are
`completed`; the last assistant step ended with `stop`. A fresh narrow Windows
process check found no process carrying that session, holder, or worktree
identity. The session's patch paths match the four COORD-002 mutable paths.
Its Git effects are reconciled: branch head `297133f452b5af73be90ef08b63275cf4ca28873`
is present in merged PR #84, now on main; PR #87 remains a separate open
proposal at `c8a8437f2f4471f2ea08d8836ed20b8f17ac4c0b`.

The COORD-002 worktree's tracked tree is clean. It still contains untracked
`.kilo/` and `.serena/` entries. Their observed file dates predate the R17
session, the session's patch paths do not include them, and its command record
shows no file delete/move operation. They were preserved untouched; no cleanup
or attribution of those files to R17 is claimed.

This proves the Kilo session is terminal and its observed Git effects are
reconciled. It does **not** provide a typed binding from the registered holder
ID to that Kilo session, an ENV lifecycle checkpoint, an ENV admission
high-water mark, or an ENV `active_admissions` observation. No ENV lifecycle
events were emitted by that session. Those fields are `NOT_EMITTED`, not
zero-valued facts. No unresolved external effect was found in the recorded
session actions, but that does not repair the missing lifecycle proof.

Work-order recovery classification: `RECOVERY_REQUIRED` (choice C), an advisory
work-item disposition only. The evidence does not support `ACTIVE`; runtime and
observed Git effects are reconciled; no unknown external effect was identified;
formal ENV quiescence remains unproved. Under the parent architecture, the
corresponding claim-control posture is `RECOVERY_HOLD`. The authoritative
registry has not made that transition: it still records generation 1 as
`CLAIMED`, and the claim and scope remain locked. This is a missing-adapter /
durable-observation gap, not a request for human recollection. Do not issue a
release or reassignment receipt for this historical run from the Kilo tool-call
count.

Recovery observation (2026-09-25; proposal evidence, not a canonical receipt):

| Field | Observed value |
| --- | --- |
| Project / repository | `env-wastewater-webapp` / `aase7en/env-wastewater-webapp` |
| Task / claim / generation | `ENV-COORD-002` / `ENV-COORD-002-C1` / `1` |
| Registered holder | `zcode-env-coord-002-g1-primary` |
| Runtime session | `ses_f41557e93ffezzqC5u0tui2EyB`; provider identity is correlated by task title, model, branch/worktree, and exact patch scope, but not typed to the registered holder ID |
| Worktree / branch / recovered HEAD | `A:\GitHub\envww-coord-002` / `feat/env-coord-002` / `297133f452b5af73be90ef08b63275cf4ca28873` |
| Lifecycle checkpoint | `NOT_EMITTED` by the ENV lifecycle authority |
| Admission high-water | `NOT_EMITTED`; Kilo tool-call count is not an ENV admission counter |
| Active admissions | `UNKNOWN` to the ENV authority; Kilo reports all 58 recorded calls completed and session stopped |
| External outcomes | No unresolved effect identified in the recorded Kilo actions; no ENV operation-outcome ledger was emitted |
| Side-effect classification | `KNOWN_EFFECT_RECONCILED` for observed Git changes: branch commit is merged through PR #84 at main `94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed`; untracked `.kilo/` and `.serena/` entries predate the session and remain untouched |
| Work-order disposition | `RECOVERY_REQUIRED` (advisory only); recommend preserving generation 1 under `RECOVERY_HOLD` semantics |
| Authoritative registry state | `CLAIMED`, generation 1; unchanged pending a separately authorized control transition |
| Receipt status | Observation only; not a `QUIESCENCE_ATTESTATION` and not a claim-release receipt |

## Parent architecture and observed gap

Follow `docs/ai/architecture/ENV-COORDINATION-GUARD.md` §§3–5, 9, 11, and 12.
The architecture roadmap already names this slice as the ZCode plugin/hook
adapter. The merged COORD-002 core keeps `AdmissionGate` and lifecycle state
in process memory; its own documentation says cross-process/session
serialization belongs to a later adapter. The current CLI validates supplied
state but has no durable event writer.

Cross-repository evidence is pinned to A-Wiki-Conductor
`origin/main@97f935735f51bd0efe3146decc260966f56c796a`. That source contains
`SQLiteExecutionStore` (`src/a_conductor/execution_store.py`),
`SQLiteWorkerLeaseStore` (`src/a_conductor/worker_lease.py`), and provider
admission persistence (`src/a_conductor/provider_config_store.py`). These are
existing stores to evaluate for `REUSE -> WRAP -> EXTEND`; their presence
does not establish that they can provide ENV claim lifecycle or quiescence.
`DurableExecutionReceipt` carries `claim_generation` and an opaque
`binding_digest`, but does not itself type the ENV claim ID, registered holder,
admission high-water, or lifecycle checkpoint. The worker lease store owns
worker capacity leases, not the ENV claim lifecycle. The matching
`docs/agent-collab/EXECUTION_LIVENESS_PROTOCOL.md` remains marked
`PROPOSED BINDING GOVERNANCE CONTRACT`, `RUNTIME IMPLEMENTATION PENDING`, and
`R2_REREVIEW_REQUIRED` at this pin.

As of 2026-09-26, a read-only inspection of the configured local A-Conductor
database found no matching R17 session, holder, worktree, branch, or
recovered-HEAD identity and no matching execution, worker-lease, or lifecycle
record. R17 was run through Kilo directly; it was not dispatched through a
matching typed A-Conductor execution record. Do not infer that source-level
store availability proves that this hook surface was covered. Do not create a
second database, sidecar queue, or competing claim store to cover the gap.

Before implementation, the control owner and A-Conductor owner must identify
and pin whether these existing stores can atomically bind a mutation
admission and its terminal result to the complete ENV claim tuple, including
the registered holder and per-tool lifecycle evidence. If an existing store
cannot provide that contract, return to `DECISION_REQUIRED` for a
cross-repository authority decision. A local JSON/SQLite ledger is not an
acceptable fallback.

## Objective

Add a ZCode/Kilo adapter that gates each mutation-capable tool invocation
against the latest trusted ENV policy and records lifecycle/effect evidence in
the selected canonical execution authority. The current holder runtime owns
gate closure and publication of quiescence evidence; the coordinator may
validate it, but may not construct it.

The adapter must bind, as one immutable execution context:

- project and repository identity;
- task ID, claim ID, generation, and registered execution-holder ID;
- provider run/session ID and the mapping from that ID to the holder;
- canonical worktree, branch, starting HEAD, and current HEAD;
- expected policy revision and expected registry hash;
- authorized mutable scope and forbidden scope;
- monotonic admission/event identities from the canonical authority.

Any missing identity, policy drift, unsupported hook surface, unavailable
authority, or unknown outcome fails closed before another mutation is allowed.

## Required behavior

1. At session start, fetch authoritative `origin/main` and bind the exact
   policy revision, registry hash, claim tuple, runtime session, worktree,
   branch, HEAD, and scopes. Candidate-branch policy is never trusted.
2. At the actual mutation-capable tool boundary, atomically request a durable
   admission from the canonical authority. A preflight alone does not count.
   If the authority cannot provide atomic admission, do not invoke the tool.
3. Record a stable operation ID and monotonic high-water value before the
   invocation. On return, record the exact terminal result and any child
   process or external-operation identity. Timeout, disconnect, or lost
   response becomes `OUTCOME_UNKNOWN`; never replay automatically.
4. When closing, the holder first closes the admission gate, then drains or
   cancels admitted work, reconciles child processes and external effects, and
   records the final lifecycle checkpoint. It publishes
   `QUIESCENCE_ATTESTATION` only when the high-water is known, no admission at
   or below it is active, and no operation outcome is unresolved.
5. Recovery reads the same canonical records and the exact provider session
   record. It must distinguish absent events from zero events. Legacy runs
   without durable admission records remain `RECOVERY_HOLD` unless an
   already-approved recovery contract establishes equivalent machine proof.
   The adapter must never backfill an invented high-water value.
6. Replayed receipts are identity-idempotent. Context drift, a second holder,
   an expired/missing lease, or disagreement between canonical authorities
   blocks mutation and transfer.

## Scope and exclusions

The eventual claim must pin exact adapter/hook source paths, fixtures/tests,
one Work Order, and one lane handoff after the installed Kilo/ZCode hook API
and canonical execution authority are verified. This proposal does not grant
that claim.

Excluded: changing the COORD-002 core or its active claim, editing
`CURRENT-WORK.md`, releasing/reassigning generation 1, repairing PR #87,
creating a parallel task/event database, changing GitHub protection/rulesets,
installing a global user hook, reading PHI or `data/raw/`, and production
environmental writes.

## Activation gates

- The historical COORD-002 recovery has an accepted control transition; until
  then its existing scope remains locked.
- The canonical execution authority and atomic admission/result API are named,
  version-pinned, and proven to bind ENV claim identity. The adapter adds no
  competing authority.
- The installed Kilo/ZCode version and supported hook lifecycle are verified
  from its actual runtime/docs. Do not guess hook names or assume a shell
  wrapper intercepts every mutation-capable tool.
- A new disjoint mutation claim/worktree is registered through the
  authoritative exact-SHA control path. The proposal branch itself grants no
  authority.
- While enforcement remains `BOOTSTRAP_CONTROL`, any control transition needs
  fresh independent exact-SHA review and a human-authorized merge through the
  separate control credential/channel required by architecture §3.3. This is
  a claim-control authorization boundary; it does not require a human to
  restate facts already present in durable runtime evidence.

## Acceptance evidence

- A deny-by-default probe proves no mutation-capable tool invocation starts
  when policy is stale, the registry hash is stale, identity is incomplete,
  scope is outside the claim, or the durable authority is unavailable.
- Deterministic tests cover admit-vs-close races, duplicate/replayed IDs,
  process crash before and after invocation, child process survival, timeout,
  unknown external effect, runtime restart, identity drift, and concurrent
  holders.
- A disposable-worktree end-to-end run proves one admitted operation,
  terminal outcome recording, holder-published quiescence, and successful
  coordinator validation against exact policy/registry hashes. A complementary
  unknown-outcome run proves the scope remains locked and is not replayed.
- Evidence binds exact source SHA, runtime/hook version, provider session ID,
  test fixtures/results, and canonical execution-authority records. No real
  environmental writes are used.

## Model-fit rationale — 2026-09-26

Selection date: 2026-09-26. Task category: Track Z correctness and data-contract
work for a cross-session admission/lifecycle adapter, with deterministic race,
crash, and recovery fixtures; no visual work is in scope. The role basis is
`docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md` §§21 and 25: GPT leads
decomposition and review, GLM owns core correctness/security/data-contract
work, and workers handle bounded repository execution.

Task-specific primary evidence is the earlier COORD-002 R17 implementation:
the Kilo session metadata names `cointh-glm/glm-5.3/max` for the same bounded
Python state-machine and registry work; its exact head
`297133f452b5af73be90ef08b63275cf4ca28873` was merged through PR #84, and
GitHub test run `35510103597` passed for that exact head. The recorded 58 Kilo
tool calls completed and the session stopped. This supports GLM-5.3 MAX as a
candidate for the bounded adapter implementation after authority and hook
contracts are verified. It does not prove that the route is currently ready,
that this adapter is authorized, or that COORD-002 has lifecycle/quiescence
proof.

GLM-5.3 Flash is a candidate for fixture collection and focused independent
checks. JEV is read-only advisory for race and recovery edge cases. The current
designated control owner remains GPT-5.6 Sol; GPT-6 Sol may provide high-risk
architecture/adjudication review when routed. GPT-6 Luna MAX supervises
decomposition and evidence collection. These are routing preferences, not
proof that a route or quota is currently available. Verify each route before
dispatch; if unavailable, leave the claim unallocated rather than substitute an
unreviewed writer.

## Current next safe action

Keep `ENV-COORD-002-C1` locked; the authoritative registry remains `CLAIMED`,
generation 1. Treat `RECOVERY_REQUIRED` as this Work Order's advisory
classification and preserve the claim under `RECOVERY_HOLD` semantics. Obtain
the designated control owner's exact-SHA decision on recording the recovery
hold through the separately authorized control path, then establish the
canonical execution-authority contract with the A-Conductor owner. Do not
activate this adapter claim until both decisions are durable.
