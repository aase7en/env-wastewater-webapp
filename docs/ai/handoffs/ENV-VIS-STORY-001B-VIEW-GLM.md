# ENV-VIS-STORY-001B-VIEW — GLM Handoff (SIMULATED scenario view)

Task `ENV-VIS-STORY-001B-VIEW` (the scenario VIEW slice of Stage 2, epic
ENV-VIS-STORY-001 / Issue #110). Claim: `ENV-VIS-STORY-001B-VIEW-C1`
(generation 1). WO: `docs/work-orders/ENV-VIS-STORY-001B-VIEW.md`. This file
is the durable receipt trail.

## Review-route record (R3, this transition)

- Reviewer: Codex CLI `gpt-6-sol` @ `model_reasoning_effort=max`, sandbox
  read-only, dispatched from this exact worktree at the transition head.
- Live admission evidence for THIS review route: the R1 dispatch itself
  (exit code / tokens / verdict appended below as each round completes).
- Designated fallback if the gpt-6-sol review dispatch hits a provider
  admission error: `gpt-5.6-sol` (admitted R3-review-only across the
  PR #113/#118/#122 trails). GPT-6 Astra prohibited. Never
  author-and-approve; never silent GLM downgrade.

## Role A consult record (pre-WO)

- 2026-10-14: gpt-6-sol @ max read-only consult for C2. Recommendations ALL
  incorporated into the WO: collapsible scenario section + native picker +
  ใช้สถานการณ์สมมุติ/ล้างสถานการณ์ buttons; same stage strip/branch cards;
  production catalog `process-scenarios.ts` with `__fixtures__` re-exporting
  (production never imports fixtures); component calls deriveScenarioState
  directly (no new view model); persistent banner "โหมดจำลอง (SIMULATED) —
  ไม่ใช่ข้อมูลจริง" + scenario id + assumptions while applied (incl.
  collapsed); explicit สมมุติ chips styled DISTINCT from the 001A ring;
  activated exception cards retain "ยังไม่ยืนยันการเชื่อมต่อจริง"; the
  process-scenario-* DOM hooks; e2e pins incl. no-numbers-in-scenario-copy
  (evidence cards' recorded numbers out of scope); P1 risks (fixture import
  from production, blending, activation≠confirmation) + P2 (second renderer,
  numerics, P002/001C scope, mobile clipping) preempted in the WO.
  Freshness caveat honored: coordinator re-verified main (`b547376`)
  directly before authoring.

## D1 contract table (frozen for D2)

Scenario → visible effect mapping (overlay markers; teaching highlight and
evidence cards UNCHANGED; banner shown whenever applied):

| # | scenarioId | Picker label (Thai) | Marker(s) rendered |
| --- | --- | --- | --- |
| 1 | pump-sump-bypass-active | เปิดเส้นทางรองบ่อพัก (สมมุติ) | chip สมมุติ: เปิดใช้เส้นทาง on the pump-sump-bypass branch card (data-scenario-edge-id=pump-sump-bypass, state=active-path); the card RETAINS ยังไม่ยืนยันการเชื่อมต่อจริง |
| 2 | emergency-overflow-active | เปิดเส้นทางล้นฉุกเฉิน (สมมุติ) | same pattern on data-scenario-edge-id=emergency-overflow (state=active-path); uncertainty note retained |
| 3 | loss-of-aeration | หยุดการเติมอากาศ (บ่อเติมอากาศ) | chip สมมุติ: หยุดเติมอากาศ on the aeration_tank stage card (data-scenario-stage-id=aeration_tank, state=process-interrupted); NO edge marker |
| 4 | ras-interruption | หยุดส่งตะกอนไหลกลับ (RAS) | chip สมมุติ: เส้นทางหยุดชะงัก on data-scenario-edge-id=ras-return (state=interrupted) |
| 5 | excess-sludge-wasting | การทิ้งตะกอนส่วนเกิน (WAS) | chip สมมุติ: เปิดใช้เส้นทาง on data-scenario-edge-id=was-to-drying-beds (state=active-path) |
| 6 | chlorine-dosing-interruption | หยุดจ่ายคลอรีน (สมมุติ) | chip สมมุติ: เส้นทางหยุดชะงัก on data-scenario-edge-id=chlorine-dosing (state=interrupted) |

Banner (whenever applied, incl. collapsed picker): "โหมดจำลอง (SIMULATED) —
ไม่ใช่ข้อมูลจริง" + Thai scenario label + รหัสสถานการณ์: {scenarioId} +
assumptions list. Zero numerics/units/observed-timestamps in any scenario
copy or marker. DOM hooks: process-scenario-picker / -apply / -clear /
-banner / -marker chips + data-scenario-edge-id / data-scenario-stage-id +
state attributes. Catalog: `PROCESS_SCENARIO_CATALOG` in
`frontend/src/lib/process-scenarios.ts` (the six definitions, byte-identical
to the C1 fixtures); `__fixtures__/process-scenarios.ts` re-exports it.

## Status

- 2026-10-14 (claim transition authored): WO + registry entry + frontier
  bullet drafted on `docs/env-vis-story-001b-view-claim` off main `b547376`.
  Predecessor fence (guard module): policy `b5473766dcb46bfc09eaebb8f0bd8aab40d4c063`,
  registry block sha256 `2aa07e7a411e72777bdf84c988ebe4bcc99294e6b8ceb5ccc8fa64d3ee900e8e`.
  Activation basis = the owner's 6th repeated continuation steer immediately
  after the report naming the scenario view next — third application of the
  R3-judged precedent (PR #132, PR #135). Explicitly submitted to R3 as an
  adversarial check; insufficient basis ⇒ parks unmerged + one-line ask
  presented once. The domain-owner numeric gate stays UNPASSED. Next: R3 →
  expected-head merge → D2 RED → D3a → D3b → D4 → D5 → D6.

(append-only below this line)
