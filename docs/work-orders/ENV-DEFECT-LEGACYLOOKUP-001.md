# ENV-DEFECT-LEGACYLOOKUP-001 — Legacy ENV-AUTONOMY-001 Lookup Audit (Work Order)

Status: CLAIMED (transition pending R3 review + merge)
Task: `ENV-DEFECT-LEGACYLOOKUP-001` (the recorded follow-up audit from the
ENV-DEFECT-STOPHOOK-001 closeout, PR #144 — the remaining hardcoded
non-Stop-path claim lookups)
Claim: `ENV-DEFECT-LEGACYLOOKUP-001-C1` (generation 1)
Base: `d8334a22c1e77e54c778e4545061075ae445701b`
Registered by: GLM-5.3 MAX coordinator (claim-transition author)
Review owner (this transition): deterministic R3 cross-model — Codex
`gpt-6-sol` @ max read-only (live per-review admission evidence = the R1
dispatch itself, recorded in the handoff; designated fallback
`gpt-5.6-sol`; GPT-6 Astra prohibited; never author-and-approve).

## Authorization basis (R3-gated)

Same pattern as ENV-DEFECT-STOPHOOK-001: the owner's standing repeated
continuation instruction + this full reviewed-claim process. This slice IS
the follow-up the STOPHOOK closeout explicitly recorded ("the other legacy
lookups get a SEPARATE audit later — recorded as a follow-up"). Basis
submitted to R3 as an explicit adversarial check; insufficient ⇒ parks
unmerged + one-line ask once. JEV: UNAVAILABLE per the fleet router.

## Objective

Audit and fix ALL remaining hardcoded `claim_by_task("ENV-AUTONOMY-001")`
lookups in `scripts/env_autonomy_runtime.py` that serve non-Stop paths.
ENV-AUTONOMY-001 has been CLOSED since 2026-10-05; every remaining site
mis-binds work to a closed claim. Role A consult (gpt-6-sol, 127,967
tokens, read-only) incorporated in full.

### Site triage (Role A, frozen)

| Site | Function | Disposition |
| --- | --- | --- |
| ~874 | `record_hook_observation` (PostToolUse receipts) | USE the context-selected claim for the receipt, session admission, and `claim["handoff_path"]`; validate the binding before writing |
| ~1417 | `transition_kilo_receipt` | Select the context claim; resolve `run_id` only within that claim's handoff |
| ~1553 | `verify_kilo_receipt` | Select the context claim and verify its published handoff; never reinterpret an older claim's receipt as a new claim's |
| ~1853 | `hook_pretool` (mutation guard) | Select AFTER resolving the invoking git root + branch; bind AUTONOMY_EVENT changes to the selected claim's handoff; reject commands whose explicit --task/--root targets another context |
| ~2221 | `_resolve_append_event_claim` | Remove the implicit closed-task fallback; with no --task, select by context; an explicit task must MATCH the selected claim before mutation |
| ~278 | `select_route` | SAFE AS-IS (only reports task fit; never mutates) |
| CLI defaults (~2681/2693/2708/2713) | status / append-event / verify-event / verify-checkpoint | Replace implicit ENV-AUTONOMY-001 defaults with context selection; keep explicit --task working (must match) |
| ~29-30 | WORK_ORDER / HANDOFF constants | WORK_ORDER appears unused (verify + document); HANDOFF is LOAD-BEARING in the shell classifier — must become claim-bound |

### Unification

Generalize `_select_stop_claim` into a shared `_select_context_claim(policy,
root, branch, *, allow_none: bool)` — closed-ineligible, samefile+exact-
branch, ambiguity/identity fail-closed-typed, uniqueness requirement (a
match plus an unresolvable same-branch worktree = unproven uniqueness =
fail closed); the Stop path keeps a thin wrapper preserving the frozen
STOPHOOK contract (Stop-only foreign neutrality); other paths use
allow_none=False equivalents that fail typed on no-match.

### Mutation-guard rule (Role A C)

A worktree foreign to the OLD closed claim may use ITS OWN uniquely
selected claim, subject to the existing guard. A worktree with NO eligible
claim still DENIES mutation. PreToolUse and PostToolUse must bind the SAME
claim (id, generation, holder, handoff).

### RED-first contract (D2)

Failing cases for: successor-claim PostToolUse receipts; all Kilo
transition/verify states under that claim; PreToolUse allow under a
selected claim / deny in no-claim context / reject mismatched CLI targets;
implicit vs explicit append-event and verification tasks; cross-claim
receipt reuse rejected; the old handoff stays unchanged. Regressions green:
StopHookContextTests, AstraHardeningTests publication/checkpoint, guard 344.

## Scope (mutable, exactly — identical to the registry claim entry)

- `scripts/env_autonomy_runtime.py` — Track Z GLM (sole writer)
- `scripts/test_env_autonomy_runtime.py` — Track Z GLM (sole writer)
- `docs/work-orders/ENV-DEFECT-LEGACYLOOKUP-001.md` (this WO)
- `docs/ai/handoffs/ENV-DEFECT-LEGACYLOOKUP-001-GLM.md`

## Forbidden

Everything else — `scripts/env_coordination_guard.py` (claim_by_task
consumed read-only), `.codex/**`, `docs/ai/ENV-ENGINEERING-LOOP.md` (#101
= separate slice), frontend, supabase, CURRENT-WORK (via reviewed
transitions), data, .env.

## D-plan

D1 (this WO + handoff triage table) → D2 RED (GLM) → D3 GLM implementation
→ D4 battery (focused + full runtime + guard 344 + diff-check) → D5 review
at the exact frozen head (fresh-GLM if the proxy quota window allows;
otherwise the recorded gpt-6-sol @ max upgrade with cross-model
independence — same deviation basis as STOPHOOK) → D6 expected-head merge +
exact-main CI + closeout transition.

## Acceptance

Zero hardcoded `claim_by_task("ENV-AUTONOMY-001")` lookups remain in
mutation-bearing paths (routing's safe fallback documented); every
mutating path binds the context-selected claim; receipts never cross
claims; battery green; receipts durable in the handoff.

## Dispatch-exception risk record

Owner-authorization basis above; GLM implements (Track Z); gpt-6-sol
consulted (done) and reviews the claim transition (never
author-and-approve). No production data writes.
