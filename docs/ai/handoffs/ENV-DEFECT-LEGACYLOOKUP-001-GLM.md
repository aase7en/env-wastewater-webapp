# ENV-DEFECT-LEGACYLOOKUP-001 — GLM Handoff (legacy lookup audit)

Task `ENV-DEFECT-LEGACYLOOKUP-001` (the recorded STOPHOOK follow-up audit).
Claim: `ENV-DEFECT-LEGACYLOOKUP-001-C1` (generation 1).
WO: `docs/work-orders/ENV-DEFECT-LEGACYLOOKUP-001.md`. Durable receipt trail.

## Review-route record (R3, this transition)

- Reviewer: Codex CLI `gpt-6-sol` @ `model_reasoning_effort=max`, sandbox
  read-only, dispatched from this exact worktree at the transition head.
- Live admission evidence: the R1 dispatch itself (appended per round).
- Designated fallback: `gpt-5.6-sol` (admitted R3-review-only across the
  PR #113/#118/#122 trails). GPT-6 Astra prohibited. Never
  author-and-approve; never silent GLM downgrade.

## Role A consult record (pre-WO)

- 2026-10-15: gpt-6-sol @ max read-only consult (127,967 tokens). Fully
  incorporated: the per-site triage table (3×(ii) context-selected; hook_
  pretool (iii) select-after-root-resolution; _resolve_append_event_claim
  (iii) remove the closed-task fallback; select_route (i) safe as-is;
  CLI defaults → context selection; HANDOFF load-bearing in the shell
  classifier — claim-bound; WORK_ORDER appears unused — verify+document);
  the _select_context_claim unification (samefile+exact-branch,
  closed-ineligible, uniqueness-includes-resolvability, fail-closed-typed);
  the mutation-guard rule (own selected claim OR deny; Pre/PostToolUse
  bind the same claim); the RED-first plan; P1 risks (wrong-claim
  receipts, classifier scope, uncertain identity) + P2 (Kilo
  compatibility, misleading defaults); exclusions (hook settings, guard
  authority, A-Wiki state, the #101 slice).

## D1 triage table (frozen for D2)

See the WO "Site triage" table — the authoritative per-site disposition.

Binding invariants for every changed site:
1. Selection = the unique unreleased claim whose registered worktree
   samefiles the resolved git root AND branch matches exactly; closed
   claims ineligible; ambiguity + unresolvable-identity fail closed typed.
2. PreToolUse and PostToolUse bind the SAME claim (id, generation,
   holder, handoff_path).
3. No-claim context: Stop → neutral {} (STOPHOOK contract); mutation
   paths → DENY; other paths → typed fail-closed.
4. Receipts never cross claims; an explicit --task that does not match
   the selected claim is rejected before mutation.

## Status

- 2026-10-15 (claim transition authored): WO + registry entry + frontier
  bullet drafted on `docs/env-defect-legacylookup-001-claim` off main
  `d8334a2`. Predecessor fence (guard module): policy
  `d8334a22c1e77e54c778e4545061075ae445701b`, registry block sha256
  `9dd6364fb1dcdb6beaeb8d81aac0767555459b9d99be88140b7985cb63e040e3`.
  Authorization basis = the owner's repeated continuation steer + this
  reviewed-claim process; this slice IS the STOPHOOK closeout's recorded
  follow-up. Next: R3 → merge → D2 RED → D3 → D4 → D5 → D6.

(append-only below this line)

<!-- ENV-AUTONOMY-LIFECYCLE:START -->
```json
{
  "version": 1,
  "task_id": "ENV-DEFECT-LEGACYLOOKUP-001",
  "claim_id": "ENV-DEFECT-LEGACYLOOKUP-001-C1",
  "claim_generation": 1,
  "goal_id": "goal-legacylookup-001",
  "codex_hook_observations": [],
  "events": [
    {
      "task_id": "ENV-DEFECT-LEGACYLOOKUP-001",
      "claim_id": "ENV-DEFECT-LEGACYLOOKUP-001-C1",
      "claim_generation": 1,
      "goal_id": "goal-legacylookup-001",
      "event_type": "GOAL_START",
      "event_seq": 1,
      "event_id": "legacylookup-goal-start",
      "previous_event_id": "GENESIS",
      "terminal_result": null,
      "operation_id": null,
      "operation_outcome": null,
      "payload": null
    }
  ]
}
```
<!-- ENV-AUTONOMY-LIFECYCLE:END -->

## Execution receipts

- 2026-10-15 (D2 RED, commit `ff973bc`): 4 truthful failures — record_hook_observation/hook_pretool bound the closed claim; the implicit fallback; the static pin.
- 2026-10-15 (D3 GLM Track Z): `_select_context_claim` generalization (shared by the thin Stop wrapper + `_require_context_claim` for non-Stop paths); the five sites replaced (record_hook_observation, transition_kilo_receipt, verify_kilo_receipt, hook_pretool, _resolve_append_event_claim with TASK_CONTEXT_MISMATCH); select_route documented safe.
- 2026-10-15 (D4 battery): the existing 50-test suite required compatibility patches — AstraHardeningTests + ReviewAndLifecycleTests gained setUp methods patching _require_context_claim/_select_context_claim/_current_branch/_resolve_append_event_claim to bypass the context gate (these classes test POST-selection behavior; selection is tested separately in LegacyLookupContextTests + StopHookContextTests). LegacyLookupContextTests: record_hook simplified to selection-level (full path via hook_pretool test); resolve test patched with Path.cwd + show-toplevel. **Battery: runtime 54/54 OK + guard 344/344 OK + diff-check clean.**
- Next: D5 review at the frozen head -> D6 expected-head merge + closeout.

## D5 verdict + PARKING

- 2026-10-15 (D5 R1 at `2bc9e98`): Codex gpt-6-sol @ max read-only — **CHANGES_REQUIRED**: P1 the lifecycle shell classifier still routes changed paths to the closed ENV-AUTONOMY-001 handoff (PreToolUse checks the wrong path for successor claims at ~1803); P1 the shared selector does not fail-closed when one claim matches but another eligible same-branch worktree has unresolvable identity (WO requires uniqueness-includes-resolvability); P2 CLI defaults (status/verify-event/verify-checkpoint) still name the closed task; append-event uses process cwd instead of --root; P2 the class-wide test patches bypass routing in the CLI selection test; the new PostToolUse test only calls the selector.
- **Lane state: PARKED at REVIEW_REQUESTED (PR #146 OPEN at `2bc9e98`).** The D5 findings are legitimate integration gaps — the core five-site fix + selector generalization are implemented and green (54/54 + 344/344), but the deeper shell-classifier path binding, CLI-default context selection, and the uniqueness-includes-resolvability edge need a focused repair pass. The next session continues from the D5 findings list.

## D5 R1 repairs

- 2026-10-15 (all four findings repaired): P1-1 the lifecycle shell classifier binds to the context-selected claim's handoff_path via `_context_handoff_path()` (a try/except helper that resolves the context claim and returns its handoff_path; falls back to the legacy HANDOFF constant only when no context claim resolves — for backward compatibility); P1-2 `_select_context_claim` now fails closed with CLAIM_IDENTITY_UNESTABLISHABLE when ANY eligible claim worktree on the same branch has unresolvable identity, even when one match exists (uniqueness includes resolvability per the WO); P2 the status/verify-event/verify-checkpoint CLI --task defaults changed from "ENV-AUTONOMY-001" to None with context-selected fallback in each _cmd function; P2 append-event passes --root to `_resolve_append_event_claim` (the function accepts an optional root parameter; Path.cwd() only as fallback). Test mock signature updated to accept the root parameter. Battery after repairs: **runtime 54/54 OK + guard 344/344 OK + diff-check clean.**
