# ENV-VIS-STORY-001B-VIEW — SIMULATED Scenario View (Work Order, C1 slice)

Status: CLAIMED (transition pending R3 review + merge)
Task: `ENV-VIS-STORY-001B-VIEW` (the scenario VIEW slice of Stage 2, epic
ENV-VIS-STORY-001 / Issue #110 — the production consumer of the
ENV-VIS-STORY-001B-C1 contract delivered via PR #136)
Claim: `ENV-VIS-STORY-001B-VIEW-C1` (generation 1)
Base: `b5473766dcb46bfc09eaebb8f0bd8aab40d4c063`
Registered by: GLM-5.3 MAX coordinator (claim-transition author)
Review owner (this transition): deterministic R3 cross-model — Codex `gpt-6-sol`
@ max read-only (live per-review admission evidence = the R1 dispatch itself,
recorded in the handoff; designated fallback `gpt-5.6-sol`; GPT-6 Astra
prohibited; never author-and-approve).

## Activation basis (R3-gated, third application of the reviewed precedent)

The owner's standing continuation instruction "ทำงานต่อที่ค้างให้จบ โดยใช้ JEV AI
และ GPT6-Sol ช่วยในงานที่เหมาะสม" — repeated for the SIXTH time on 2026-10-14,
immediately after the report naming the SIMULATED-labeled scenario view as
the next owner-gated epic lane. This follows the precedent R3-judged
ACTIVATION_BASIS: SUFFICIENT twice before (PR #132 for 001A at the 4th steer;
PR #135 for 001B-C1 at the 5th). The view is Track F work — the steer's named
GPT-6 Sol lane. Basis again submitted to R3 as an explicit adversarial check;
insufficient basis ⇒ parks unmerged + one-line ask presented exactly once.
JEV: UNAVAILABLE per the fleet router (checked, recorded, not probed, no
substitution).

**The domain-owner numeric gate REMAINS UNPASSED and is NOT crossed by this
slice**: the view renders qualitative hypothetical states only — zero numeric
effects, zero water-quality values, zero units, zero observed timestamps in
any scenario copy or marker. The quantity evidence cards keep their recorded
numbers untouched (they are observed evidence, clearly separated from the
simulation overlay).

## Objective

Deliver the production consumer of the scenario contract: a SIMULATED-labeled
scenario view integrated into the EXISTING `/flow` story (Issue #110 rule 5 —
no second flow engine/dashboard/renderer). Incorporates the gpt-6-sol Role A
consult for C2 (2026-10-14, read-only, fully incorporated below).

### Design (Role A, frozen)

- **Interaction**: a collapsible scenario section beside the stage strip; a
  native picker listing the six Thai scenarios; selecting changes NOTHING
  until **ใช้สถานการณ์สมมุติ** is pressed; **ล้างสถานการณ์** clears the overlay.
  The SAME stage strip and branch cards render hypothetical markers
  (aeration_tank marked for loss-of-aeration; the matching branch card for
  each edge override). The 001A teaching highlight and the quantity evidence
  cards are UNCHANGED.
- **Track Z (GLM)**: promote the six ScenarioDefinitions to ONE production
  catalog `frontend/src/lib/process-scenarios.ts` exporting
  `PROCESS_SCENARIO_CATALOG`; the C1 fixture file
  `__fixtures__/process-scenarios.ts` becomes a RE-EXPORT of it (production
  code never imports `__fixtures__/`; pinned by test). The component calls
  `deriveScenarioState` directly — no new view model, no new engine.
- **Track F (Codex `gpt-6-sol` @ max)**: `EnvironmentalFlowStory.tsx` +
  `index.css` only. While an overlay is applied — INCLUDING while the picker
  is collapsed — a persistent banner shows **"โหมดจำลอง (SIMULATED) — ไม่ใช่
  ข้อมูลจริง"** plus the Thai scenario label, `รหัสสถานการณ์: {scenarioId}`,
  and its assumptions. Explicit chips: **"สมมุติ: เปิดใช้เส้นทาง"** /
  **"สมมุติ: เส้นทางหยุดชะงัก"** / **"สมมุติ: หยุดเติมอากาศ"** with styling
  DISTINCT from the 001A teaching ring. Activated bypass/emergency cards
  RETAIN "ยังไม่ยืนยันการเชื่อมต่อจริง" (hypothetical activation never
  confirms an as-built tie-in). Reduced-motion static; keyboard operable;
  360/390/430 no overflow.
- **DOM hooks (e2e contract)**: `process-scenario-picker`,
  `process-scenario-apply`, `process-scenario-clear`,
  `process-scenario-banner`, `process-scenario-marker` chips;
  `data-scenario-edge-id` / `data-scenario-stage-id` + state attributes on
  the marked nodes.

### RED-first contracts (D2)

Lib (GLM): the catalog is exactly the six C1 scenarios (identity pinned);
fixtures re-export the catalog; production modules never import
`__fixtures__/` (grep-pinned in test). E2E (GLM, environmental-flow.spec.ts):
all six options listed; select-before-apply changes nothing; apply → banner
+ markers per the frozen table; activated exception cards still render the
  uncertainty note; clear removes everything; keyboard path; no numbers /
units / observed timestamps in scenario copy or markers (evidence cards'
recorded numbers are out of scope); 360/390/430 containment.

## Scope (mutable, exactly — identical to the registry claim entry)

- `frontend/src/lib/process-scenarios.ts` — Track Z GLM (new production catalog)
- `frontend/src/lib/__fixtures__/process-scenarios.ts` — Track Z GLM (re-export)
- `frontend/src/lib/process-scenario.test.ts` — Track Z GLM (catalog + isolation pins)
- `frontend/tests/e2e/environmental-flow.spec.ts` — Track Z GLM (new cases)
- `frontend/src/components/flow/EnvironmentalFlowStory.tsx` — Track F Codex
  (sole writer during the D3b window)
- `frontend/src/index.css` — Track F Codex (sole writer during the D3b window;
  shared stylesheet — temporary ownership recorded in the handoff)
- `docs/work-orders/ENV-VIS-STORY-001B-VIEW.md` (this WO)
- `docs/ai/handoffs/ENV-VIS-STORY-001B-VIEW-GLM.md`

## Forbidden

Everything else — including `frontend/src/components/pfd/**`,
`frontend/src/components/digital-twin/**`, `frontend/src/lib/twin/**`,
`frontend/src/App.tsx`, `frontend/src/components/layout/AppShell.tsx`,
`scripts/**`, `supabase/**`, `docs/ai/CURRENT-WORK.md` (via reviewed
transitions only), `data/**`, `.env`. No operational writes; no numeric
effects (domain-owner gate UNPASSED); no P002 motion; no 001C export work.

## D-plan

D1 (this WO + handoff contract table) → D2 RED (GLM) → D3a GLM catalog → D3b
Codex component/CSS (single-writer window) → D4 battery (focused + full
vitest, tsc, lint, /flow e2e incl. the new cases, diff-check) → D5 fresh-GLM
review at the exact frozen head (cross-model vs the Codex Track-F author) →
D6 expected-head merge + exact-main CI + deployed smoke + closeout transition.

## Acceptance

All RED contracts green at the frozen head; SIMULATED banner visible whenever
an overlay is applied; exception uncertainty retained under activation; zero
numerics in scenario copy/markers; no forbidden file touched; receipts
durable in the handoff.

## Dispatch-exception risk record

Owner-authorized activation basis above + the standing continuation pattern.
Codex `gpt-6-sol` @ max implements Track F under the 2026-10-12 Role-B
conditions; GLM implements Track Z and coordinates; fresh-GLM D5 review
(cross-model vs the Codex author). The implementing lane never merges its own
PR; stop at REVIEW_REQUESTED.
