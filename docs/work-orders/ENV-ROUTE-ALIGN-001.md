# ENV-ROUTE-ALIGN-001 — Runtime Route-Table Alignment (Work Order, C1 slice)

Status: CLAIMED (transition pending R3 review + merge)
Task: `ENV-ROUTE-ALIGN-001`
Claim: `ENV-ROUTE-ALIGN-001-C1` (generation 1)
Base: `3cf12092bff0c6d3dee6420097da79012a99fb01`
Registered by: GLM-5.3 MAX coordinator (claim-transition author)
Review owner (this transition): deterministic R3 cross-model — Codex `gpt-6-sol`
(admitted; live per-review admission evidence = the R1 dispatch itself,
recorded in the handoff review-route section; designated fallback
`gpt-5.6-sol`; GPT-6 Astra prohibited; never author-and-approve).

## Objective

Close the deferred follow-up recorded in the durable owner routing policy
(PR #112, `.agents/skills/env-fleet-router/SKILL.md`): **"Runtime `route`
alignment for the two new categories is a deferred follow-up; this policy
text is the durable authority."** The deferral trigger ("first Codex
dispatch lane") has fired (2026-10-14 WC001 D3b). Align
`scripts/env_autonomy_runtime.py` with the SKILL.md route table by adding:

1. **`hard_engineering`** (high-complexity bounded implementation) →
   Codex GPT-6.1 Sol MAX — proactive (owner directive 2026-10-12), lane
   `MUTATION`. Boundary (process-level, unchanged): only when verified
   admission + canonical claim/ownership + exact mutable scope + no
   competing owner + separate qualified independent reviewer.
2. **`architecture_consult`** (read-only design) → Codex GPT-6.1 Sol MAX —
   proactive, lane `READ_ONLY_CONSULT` (new lane kind). Needs no mutation
   ownership.

Fail-closed semantics unchanged: `route` never dispatches; GPT-6.1 Sol
routes stay `ADMISSION_REQUIRED` / `dispatch_allowed: false` with
`provider_candidate: codex-cli`.

## Scope (mutable, exactly — identical to the registry claim entry)

- `scripts/env_autonomy_runtime.py`
- `scripts/test_env_autonomy_runtime.py`
- `docs/work-orders/ENV-ROUTE-ALIGN-001.md`
- `docs/ai/handoffs/ENV-ROUTE-ALIGN-001-GLM.md`

## Forbidden

Everything else, including `docs/ai/CURRENT-WORK.md` (via reviewed
transitions only), `.agents/skills/env-fleet-router/SKILL.md` (the durable
policy text — consumed read-only; this slice IMPLEMENTS it, never edits
it), `scripts/env_coordination_guard.py`, all frontend files, `data/**`,
`.env`.

## Design (mirrors SKILL.md 1:1)

- `SUPPORTED_MODELS["gpt-6.1 sol"]` gains `hard_engineering` +
  `architecture_consult` (alongside `independent_review`).
- `ROUTE_DEFAULTS` gains the two rows above. The CLI `route` subcommand's
  `choices=sorted(ROUTE_DEFAULTS)` extends automatically.
- `route_fit`: the single `gpt-6.1 sol` lane rule becomes a per-category
  allowed-lane map — `independent_review→{INDEPENDENT_REVIEW}`,
  `hard_engineering→{MUTATION}`, `architecture_consult→{READ_ONLY_CONSULT}`.
  Mismatch reason `REVIEWER_ROLE_ONLY` is preserved for
  `independent_review`; the two new categories use `SOL_ROLE_LANE_MISMATCH`.
- `select_route` unchanged (already routes GPT-6.1 Sol through
  `requires_external_admission` → codex-cli candidate, ADMISSION_REQUIRED,
  dispatch_allowed False). Docstring gains the 2026-10-12 proactive note.

## D-plan

- **D2 (GLM):** RED-first tests — `select_route("hard_engineering")` /
  `select_route("architecture_consult")` (currently
  `TASK_CATEGORY_UNSUPPORTED`), per-category lane mismatches, CLI choices
  extension, R2/R3 independent_review behavior unchanged.
- **D3 (GLM, Track Z):** implement the design above.
- **D4 (GLM):** full pytest battery for
  `scripts/test_env_autonomy_runtime.py` +
  `scripts/test_env_coordination_guard.py` (regression).
- **D5:** fresh-GLM independent review at the exact frozen head.
- **D6:** expected-head merge + exact-main CI verify + closeout transition.

## Acceptance

- `python scripts/env_autonomy_runtime.py route --task-category hard_engineering`
  and `--task-category architecture_consult` report the GPT-6.1 Sol
  ADMISSION_REQUIRED route with the pinned lane kinds; every existing
  route behavior unchanged; full battery green; SKILL.md untouched.

## Dispatch-exception risk record

Owner-authorized alignment of an already-merged owner-policy PR (#112)
whose text explicitly mandates this follow-up; continued by the owner
steer of 2026-10-14. GLM implements (Track Z scripts lane); Codex
`gpt-6-sol` serves only as the R3 reviewer of this transition (never
author-and-approve). JEV: UNAVAILABLE per the fleet router (checked,
recorded, not probed, no substitution).
