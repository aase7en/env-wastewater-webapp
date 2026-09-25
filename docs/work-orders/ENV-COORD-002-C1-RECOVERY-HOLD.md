# ENV-COORD-002-C1 RECOVERY_HOLD Control Transition

Status: proposal; this document and its registry edit have authority only after the exact reviewed commit is merged to main.
Risk: HIGH — central claim control and cross-session recovery.
Repository: aase7en/env-wastewater-webapp.
Date: 2026-09-26.

## Goal and authorization

Record the canonical, generation-preserving CLAIMED -> RECOVERY_HOLD state for ENV-COORD-002-C1. The project owner explicitly authorized only this hold transition, conditional on current evidence, independent exact-SHA review, CI, and governance checks. The authorization does not permit release, reassignment, generation 2, scope changes, or new mutation within C1's locked scope.

The Coordinator is the protocol role described in docs/ai/architecture/ENV-COORDINATION-GUARD.md §3.3. The model name in old routing text is not authentication. This proposal is made under the user's current designation of GPT-6 Luna MAX as mission supervisor; a fresh GPT-6 Sol review is routed for independent high-risk control review.

## Trusted pre-state

- origin/main: 94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed.
- policy_revision: 94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed.
- Exact canonical registry block hash: 2d1b901b013fbc149c2d95db619dae8ec038ba3e0d2fde49e0b2c93c6b425d0a.
- Enforcement mode: BOOTSTRAP_CONTROL.
- Claim: task ENV-COORD-002, ID ENV-COORD-002-C1, generation 1, status CLAIMED, holder zcode-env-coord-002-g1-primary.
- Worktree/branch: A:/GitHub/envww-coord-002 / feat/env-coord-002.
- Mutable scope remains exactly scripts/env_coordination_guard.py, scripts/test_env_coordination_guard.py, docs/work-orders/ENV-COORD-002.md, and docs/ai/handoffs/ENV-COORD-002-GLM.md.

The current registry and hash were read through the guard status command against fetched origin/main; the candidate transition must retain both predecessor fences. No candidate branch copy grants authority before merge.

## Recovery evidence gathered

- GitHub PR #84 is merged; the recovered implementation commit 297133f452b5af73be90ef08b63275cf4ca28873 is on current main.
- The holder worktree has no tracked changes. Untracked .kilo/ and .serena/ remain untouched and are not attributed to this session.
- Kilo 7.7.2 sanitized export for session ses_f41557e93ffezzqC5u0tui2EyB identifies cointh-glm/glm-5.3/max, 58 tool parts, and final assistant finish stop; the session list shows its last update on 2026-09-20.
- A standalone Windows process scan on 2026-09-26 found no matching holder/session/worktree/HEAD process and no Kilo/ZCode process.
- PR #80 is merged as bf26cb523c375f44d3bdd0ee9a6d0d66f1eb81bb, with exact-head scripts, smoke, and notify checks successful. PR #87 is still open at c8a8437f2f4471f2ea08d8836ed20b8f17ac4c0b; its CI is green but an author comment requires changes. PR #88 is still an open proposal at 2727abc9c8c50bb84dbf09e2a0b0383cbe5e2e16; no GitHub review decision exists.
- GitHub reports main is not protected and the repository has no rulesets. The required bootstrap control gate is therefore exact-SHA independent review plus the owner's explicit authorization and expected-head merge; green CI alone is not approval.

## Facts that remain unknown

- ENV lifecycle checkpoint: NOT_EMITTED.
- ENV admission high-water: NOT_EMITTED.
- ENV active admissions: UNKNOWN.
- ENV external-operation outcome ledger: NOT_EMITTED; process/session termination is not a substitute.
- QUIESCENCE_ATTESTATION: absent. No zero-active-admissions or release fact is claimed.

This evidence supports only RECOVERY_HOLD. It does not satisfy the §4.2B quiescence barrier and cannot authorize transfer or mutation.

## Proposed control transition

The docs/ai/CURRENT-WORK.md candidate updates only the central control facts needed for this transition and reconciles the verified current frontier:

- expected_policy_revision: 94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed
- expected_registry_hash: 2d1b901b013fbc149c2d95db619dae8ec038ba3e0d2fde49e0b2c93c6b425d0a
- task_id: ENV-COORD-002
- claim_id: ENV-COORD-002-C1
- expected_generation: 1
- proposed_generation: 1
- proposed_status: RECOVERY_HOLD
- holder: zcode-env-coord-002-g1-primary
- mutable_scope: unchanged

No other C1 identity or scope field changes. The candidate does not create a quiescence receipt or authorize writes in the four locked paths. If current main or the source registry hash changes before merge, discard this proposal's stale fence and prepare a fresh exact-SHA proposal.

## Acceptance and post-main checks

- Parse the candidate registry with the existing Coordination Guard; require RECOVERY_HOLD, generation 1, the same claim/holder/scope, and both exact pre-state fences.
- Verify the full candidate diff contains no C1 release, reassignment, generation increment, scope modification, or fabricated lifecycle/admission/outcome value.
- Obtain a fresh independent exact-SHA review. Any head edit invalidates it.
- Require all exact-head CI checks green and re-fetch/re-pin main immediately before expected-head merge.
- After merge, fetch main, verify the merge SHA and ancestry, run the guard trusted status against exact origin/main, and confirm C1 is still RECOVERY_HOLD at generation 1 with the same holder/scope. Do not authorize mutation or transfer.
- Next project action after the accepted hold: create a separate, disjoint autonomy-bootstrap work order and claim/worktree as directed by the owner; no writes in C1 scope.
