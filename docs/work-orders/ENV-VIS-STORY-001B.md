# ENV-VIS-STORY-001B — Interactive Scenario Simulation, C1 contract slice (Work Order)

Status: CLAIMED (transition pending R3 review + merge)
Task: `ENV-VIS-STORY-001B` (Stage 2 of epic ENV-VIS-STORY-001, Issue #110)
Claim: `ENV-VIS-STORY-001B-C1` (generation 1)
Base: `fb17c6cb754d372800ddc505bb6dbcec2f6c7e05`
Registered by: GLM-5.3 MAX coordinator (claim-transition author)
Review owner (this transition): deterministic R3 cross-model — Codex `gpt-6-sol`
@ max read-only (live per-review admission evidence = the R1 dispatch itself,
recorded in the handoff; designated fallback `gpt-5.6-sol`; GPT-6 Astra
prohibited; never author-and-approve).

## Activation basis (R3-gated, follows the PR #132 precedent)

The roadmap's Stage-2 sequencing requires the deterministic scenario model +
isolated fixtures BEFORE any visual effects. Activation basis recorded here:
the owner's standing continuation instruction "ทำงานต่อที่ค้างให้จบ โดยใช้ JEV AI
และ GPT6-Sol ช่วยในงานที่เหมาะสม" — repeated for the FIFTH time on 2026-10-14,
immediately after a report explicitly listing Stage 001B as the next
owner-gated lane. This follows the R3-established precedent of PR #132, where
the reviewer judged the equivalent 4th-repeat basis **ACTIVATION_BASIS:
SUFFICIENT** for the then-sole pending lane. The basis is again submitted to
this transition's R3 as an explicit adversarial check; insufficient basis ⇒
the claim parks unmerged and a one-line activation ask is presented exactly
once. JEV: named by the owner but UNAVAILABLE per the fleet router (no
supported live route; no substitution) — checked, recorded, not probed.

**The internal human gate is NOT crossed by this slice:** the roadmap requires
domain-owner approval before numeric effects or water-quality projections.
That approval remains **UNPASSED** — C1 contains zero numeric effects, zero
water-quality values, zero units, zero timestamps-as-observed. The gate stays
open for a future slice that would introduce such effects.

## Objective

Deliver the Stage-2 FIRST slice per the roadmap: a **deterministic scenario
model + isolated fixtures** — Track Z only, no UI, no Twin changes, no visual
effects, no operational writes. Incorporates the gpt-6-sol Role A consult
(2026-10-14, read-only, 99,215 tokens, recommendations fully incorporated
below). The production CONSUMER of this contract is a FUTURE reviewed
integration slice (the SIMULATED-labeled scenario view); in C1 the RED-first
tests + fixtures are the consumer (Role A: a type-only re-export would add no
evidence).

### Contract (D1 — frozen in the handoff contract table)

- `ScenarioDefinition`: `id`; Thai `label`; `provenance: { source:
  "simulation", observedAt: null }` (same "simulation" spelling as the Twin's
  TwinMetricSource — naming-compatible but a SEPARATE contract from the
  asset-level numeric `TwinSimulationOverrides`, which stays untouched in
  `twin/**`); preserved `assumptions: string[]`; `edgeOverrides` keyed to
  PROCESS_EXPLANATION edge IDs (typed via literal edge/stage-ID unions
  exported from `environmental-flow.ts`); optional qualitative
  `stageOverrides` — C1 allows exactly ONE shape:
  `{ aeration_tank?: { aeration: "interrupted" } }` (the loss-of-aeration
  process override; output marks the stage `process-interrupted` and touches
  NO water edge).
- `deriveScenarioState(definition): ScenarioState` — synchronous, pure;
  returns ALL 13 edges in stable topology order; each edge RETAINS its
  topology `activity`/`tieIn`/`note` and gains a separate `scenarioState`
  recording the hypothetical condition ("active-path" | "interrupted" |
  "baseline"). **Activating bypass/emergency in a scenario does NOT resolve
  their as-built `needs_confirmation` tie-in** (a hypothetical activation is
  never a confirmed connection).
- **Loss of aeration** uses a qualitative `aeration_tank` process override —
  turning off a WATER edge would claim an unsupported hydraulic effect (Role
  A P-finding, incorporated).
- Fixture inventory = EXACTLY the six SSoT modeling-rule-5 scenarios:
  pump-sump bypass, emergency overflow, loss of aeration, RAS interruption,
  excess-sludge wasting, chlorine dosing interruption.

### Invariants (D2 RED pins)

Six-scenario inventory exact; unknown edge-ID override rejected (typed +
runtime guard); untouched edges keep contract semantics AND both uncertain
tie-ins stay `needs_confirmation`; equal definitions → equal output, no input
mutation; **compile-time non-assignability** of scenario output to
latest-flow / Twin operational state types (no adapter exists — never
blends); no numeric effect / water-quality value / unit anywhere in C1;
`observedAt` stays null (nothing was observed); no async/timers/clock/
randomness/IO; Stage-1 quantity semantics unchanged (regression).

## Scope (mutable, exactly — identical to the registry claim entry)

- `frontend/src/lib/environmental-flow.ts` — Track Z GLM, **type-level
  narrowing of the topology ONLY**: narrow the PROCESS_EXPLANATION constant /
  its edge + stage types so literal edge-ID and stage-ID unions are derivable
  and exported (compile-time rejection of unknown IDs, pinned by an
  @ts-expect-error test); zero runtime behavior change, Stage-1 tests
  untouched in substance
- `frontend/src/lib/process-scenario.ts` — Track Z GLM
- `frontend/src/lib/__fixtures__/process-scenarios.ts` — Track Z GLM
  (isolated fixtures; never imported by production code paths — test/lib use
  only)
- `frontend/src/lib/process-scenario.test.ts` — Track Z GLM
- `docs/work-orders/ENV-VIS-STORY-001B.md` (this WO)
- `docs/ai/handoffs/ENV-VIS-STORY-001B-GLM.md`

## Forbidden

Everything else — including `frontend/src/components/**` (no UI),
`frontend/src/index.css`, `frontend/src/lib/twin/**` (the Twin simulation
contract is a different lane), `frontend/src/App.tsx`, `scripts/**`,
`supabase/**`, `docs/ai/CURRENT-WORK.md` (via reviewed transitions only),
`data/**`, `.env`. No operational writes of any kind.

## D-plan

D1 (this WO + handoff contract table) → D2 RED (GLM) → D3 GLM implementation
(sole writer of the four code paths) → D4 battery (focused + full vitest,
tsc, lint, diff-check; no e2e applies — no UI change) → D5 fresh-GLM-5.3-MAX
independent review at the exact frozen head (Track-Z-only slice: fresh
context vs the GLM author per the ordinary R2 floor; cross-model Sol review
is reserved to this claim transition) → D6 expected-head merge + exact-main
CI verify + closeout transition. The implementing lane never merges its own
PR; stop at REVIEW_REQUESTED.

## Acceptance

All invariants pinned at the frozen head; battery green; the domain-owner
numeric gate explicitly recorded UNPASSED in code comments + WO + handoff;
no forbidden file touched; receipts durable in the handoff.

## Dispatch-exception risk record

Owner-authorized activation basis above + the standing continuation pattern.
GLM implements (Track Z); Codex `gpt-6-sol` reviews this transition only
(never author-and-approve). No production data writes; no Building/schema/
RLS involvement.
