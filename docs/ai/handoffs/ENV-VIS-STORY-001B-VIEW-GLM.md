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

## Temporary shared-file ownership (D3b window) + R1 partial-review record

- 2026-10-14 (pre-D3b, per the WO): `frontend/src/index.css` (shared
  stylesheet) + `frontend/src/components/flow/EnvironmentalFlowStory.tsx`
  are under the Codex D3b sole-writer window; GLM does not touch them until
  the window closes with the D3b commit. (R3 R1 finding: this record was
  promised by the WO but missing from the handoff - repaired in this commit.)
- 2026-10-14 (R1 dispatch partial record): the gpt-6-sol @ max read-only
  review at `7a90c96` ran 106,764 tokens and was CUT by a Codex account
  usage limit ("try again at 11:27 PM") BEFORE emitting a formal verdict.
  Substantive fragments that landed before the cut (recorded transparently,
  NOT treated as approval): the reviewer's assessment that the sixth steer
  fits the two reviewed precedents for this bounded qualitative view with
  the numeric gate unpassed; that the reasoning does NOT extend to optional
  export (001C) or numeric effects; and the index.css-record finding above.
  Per the quota-boundary policy (boundaries can be stale - probe once),
  the dispatch is retried once after the repair commit; if the limit
  persists the claim parks at REVIEW_REQUESTED with this blocker recorded.

## PARKED at REVIEW_REQUESTED - provider quota gate (2026-10-14)

- R3 ROUND 2 RETRY (at `8501d18`): the one-per-policy retry ALSO hit the
  Codex account usage limit ("try again at 11:27 PM"; 3 occurrences in the
  log). No further probing per the standing policy. The designated fallback
  `gpt-5.6-sol` shares the same account quota and is therefore equally
  blocked - no fallback dispatch.
- **Lane state: PARKED at the typed review gate.** No mutation authority
  exists (the transition is not merged); D2-D6 do not start. The R1 finding
  is already repaired at `8501d18`; the round-2 prompt is reproducible from
  the review-route record.
- **Resume condition:** after the account quota resets (stated 23:27 local
  2026-10-14), re-dispatch R3 round 2 at the CURRENT PR head (this parking
  commit `633eaf4`, or later if further reviewed repairs land - always the
  exact remote head) -> on APPROVED, expected-head merge PR #138 -> D2 RED ->
  D3a GLM catalog -> D3b Codex view -> D4 -> D5 -> D6. Trigger: the owner's
  next message or resuming the supervisor automation (both currently
  owner-controlled).
