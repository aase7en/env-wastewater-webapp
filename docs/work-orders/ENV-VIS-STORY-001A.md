# ENV-VIS-STORY-001A — Animated Process Infographic, Stage 1 (Work Order, C1 slice)

Status: CLAIMED (transition pending R3 review + merge)
Task: `ENV-VIS-STORY-001A` (Stage 1 of epic ENV-VIS-STORY-001, Issue #110)
Claim: `ENV-VIS-STORY-001A-C1` (generation 1)
Base: `66f343d42066d9b368e310040d6867b4cbe5d2ba`
Registered by: GLM-5.3 MAX coordinator (claim-transition author)
Review owner (this transition): deterministic R3 cross-model — Codex `gpt-6-sol`
@ max read-only (live per-review admission evidence = the R1 dispatch itself,
recorded in the handoff; designated fallback `gpt-5.6-sol`; GPT-6 Astra
prohibited; never author-and-approve).

## Activation basis (R3-gated interpretation, stated plainly)

The R2-approved roadmap entry requires **owner activation** before Stage 001A
mutation. Basis recorded here: the owner's standing continuation instruction
"ทำงานต่อที่ค้างให้จบ โดยใช้ JEV AI และ GPT6-Sol ช่วยในงานที่เหมาะสม"
(finish pending work, using GPT-6 Sol where appropriate) — repeated 2026-10-14
for the FOURTH time, AFTER two coordinator reports explicitly stated that the
only remaining autonomous pending lane is VIS-STORY-001A activation and that
it awaits an owner line. VIS-STORY-001A Stage 1 is Track F (visual) work — the
steer's named-model lane. The interpretation that this repeat = activation is
recorded in-substance here and is submitted to this transition's R3 reviewer as
an explicit adversarial check: **if the reviewer finds the basis insufficient,
the claim parks unmerged and a one-line activation ask is presented to the
owner exactly once.** JEV: named by the owner again but UNAVAILABLE per the
fleet router (no supported live route; no substitution) — checked, recorded,
not probed.

## Objective

Deliver Stage 1 of the owner-approved epic (Issue #110; roadmap entry merged
via PR #124 `5ba265c`): an **animated process EXPLANATION** of the Activated
Sludge system — structural teaching motion only. This WO incorporates the
gpt-6-sol Role A architecture consult (2026-10-14, read-only, 134,918 tokens)
and re-verifies Issue #110 rule 5 verbatim: "Reuse `/flow` and current Twin.
Avoid a second flow engine, second dashboard, or conflicting renderer/data
authority."

### Hard boundaries (from the roadmap entry + Issue #110 + the 11-UTHAI SSoT)

1. **Process explanation, never current state**: no current flow, no measured
   speed, no live/latest data binding to the animation. The stage story must
   carry the visible label "ภาพอธิบายกระบวนการ ไม่ใช่สถานะปัจจุบัน" (per Role A).
2. **Exception paths stay visibly uncertain**: bypass + emergency edges render
   dashed/static with uncertain wording; they NEVER animate. Per the SSoT:
   pipe exists ≠ currently flowing; the tie-in stays `needs_confirmation`.
3. **No SIMULATED/LIVE vocabulary**: educational labels only; the semantics
   vocabulary stays reserved for Stage 2's simulation contract.
4. **No second engine/dashboard/renderer** (rule 5): extend the EXISTING DOM
   `/flow` story (`EnvironmentalFlowStory.tsx`) and its existing renderer/
   query; the dashboard `ProcessFlowDiagram.tsx`, the Twin, and P003 callouts
   are distinct surfaces NOT touched by 001A.
5. **P002/P003 exclusion**: no new Twin water-material/equipment motion; no
   callout changes.
6. **Distinct animation cue (Role A P1)**: the dashboard PFD already uses an
   endless dashed "flow" animation; 001A must NOT reuse that cue — teaching
   motion is a user-controlled, one-step-at-a-time stage/branch HIGHLIGHT,
   not a flowing-line effect. No moving water, particles, pump cues, or speed
   encoding.
7. Unknown ≠ zero; no production writes; no telemetry inference; user-facing
   dates พ.ศ.; reduced-motion static fallback + non-WebGL DOM by design;
   360/390/430 mobile widths; keyboard operable with visible focus.

## Scope (mutable, exactly — identical to the registry claim entry)

- `frontend/src/lib/environmental-flow.ts` — Track Z (GLM sole writer)
- `frontend/src/lib/environmental-flow.test.ts` — Track Z (GLM)
- `frontend/tests/e2e/environmental-flow.spec.ts` — Track Z (GLM)
- `frontend/src/components/flow/EnvironmentalFlowStory.tsx` — Track F (Codex
  `gpt-6-sol` @ max sole writer during the D3b window)
- `frontend/src/index.css` — Track F (Codex sole writer during the D3b window;
  shared stylesheet — temporary ownership recorded in the handoff before the
  dispatch, released after)
- `docs/work-orders/ENV-VIS-STORY-001A.md` (this WO)
- `docs/ai/handoffs/ENV-VIS-STORY-001A-GLM.md`

## Track Z contract (D1/D3a — GLM)

In `environmental-flow.ts`, add a static, typed process-explanation topology
derived from the 11-UTHAI Recommended Process Graph:

- `ProcessExplanationStage` (id + Thai teaching label + caption), the eight
  main-path stages;
- `ProcessExplanationEdge` (from/to + edge class: main-path / RAS / WAS /
  filtrate-return / chlorine-dosing; bypass + emergency edges carry
  `tieIn: "needs_confirmation"` and `activity: "unknown"`);
- `PROCESS_EXPLANATION` constant + small derivation helpers;
- `toEnvironmentalFlowModel()` derives its existing edge identities and
  endpoints from this topology so there is ONE topology authority — existing
  quantity semantics stay BYTE-IDENTICAL (pinned by tests);
- no readings, timestamps, rates, equipment states, or SIMULATED vocabulary
  anywhere in the explanation contract.

RED-first tests pin: stage/edge inventory vs the SSoT graph; water-vs-sludge
edge separation (modeling rule 1); uncertain tie-ins for bypass/emergency;
unchanged quantity semantics; vocabulary absence (SIMULATED|LIVE|real-time
must not appear in the explanation contract).

## Track F visual (D3b — Codex `gpt-6-sol` @ max)

In `EnvironmentalFlowStory.tsx`: consume the shared contract (replace the
hardcoded `NORMAL_STAGES` array), render a user-controlled step-through
highlight of confirmed stages + branch cards (the structural-teaching
motion), scoped CSS in `index.css`; static reduced-motion state; keyboard
controls + visible focus; 360/390/430 no-overflow; the uncertainty label
above; bypass/emergency dashed + never animated. No other surface touched.

## D-plan

D1 (this WO + contract table in the handoff) → D2 RED (GLM) → D3a GLM Track Z
→ D3b Codex Track F (single-writer window) → D4 battery (focused + full
vitest, tsc, lint, /flow Playwright incl. NEW explanation-step cases,
reduced-motion + mobile evidence, git diff --check) → D5 fresh-GLM review at
the frozen head → D6 expected-head merge + exact-main CI + deployed smoke +
closeout transition.

## Acceptance

All boundaries above hold at the frozen head; battery green; deployed `/flow`
carries the explanation surface with the uncertainty label; no forbidden
surface changed; receipts durable in the handoff.

## Dispatch-exception risk record

Product-lane work under the owner-authorized dispatch-exception pattern
(activation basis above + standing 2026-10-12 Codex-proactive directive Role
B conditions for the D3b dispatch). GLM coordinates and implements Track Z;
Codex `gpt-6-sol` implements Track F only; fresh-GLM D5 review (cross-model
independence vs the Codex author). No production data writes; no Building/
schema/RLS involvement.
