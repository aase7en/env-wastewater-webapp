# ENV-VIS-STORY-001A — GLM Handoff (animated process infographic, Stage 1)

Task `ENV-VIS-STORY-001A` (Stage 1 of epic ENV-VIS-STORY-001 / Issue #110).
Claim: `ENV-VIS-STORY-001A-C1` (generation 1).
WO: `docs/work-orders/ENV-VIS-STORY-001A.md`. This file is the durable
receipt trail.

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

- 2026-10-14: gpt-6-sol @ max read-only consult (134,918 tokens, exit 0)
  from the env-wc001b-20261014 worktree against origin/main-era files.
  Recommendations ALL incorporated into the WO: extend the DOM `/flow` story
  only (rule-5 compliant; PFD/Twin/P003 untouched); Track Z
  ProcessExplanation topology contract in environmental-flow.ts with
  toEnvironmentalFlowModel() deriving edge identities from it; Track F
  user-controlled step-through highlight with a DISTINCT cue (P1: the
  dashboard's endless dashed-flow cue must not be reused); bypass/emergency
  uncertain + never animated; sole-writer split incl. temporary index.css
  ownership. Caveat honored: Issue #110 rule 5 re-verified verbatim at the
  gate (gh, OPEN); remote freshness re-verified (origin/main 66f343d).

## Status

- 2026-10-14 (claim transition authored): WO + registry entry + frontier
  bullet drafted on `docs/env-vis-story-001a-claim` off main `66f343d`.
  Predecessor fence (guard module): policy `66f343d42066d9b368e310040d6867b4cbe5d2ba`,
  registry block sha256 `80c21bf5d7895f8162117c6de2999215116d13775b9af1451d4dcce1613911eb`.
  Activation basis = the owner's 4th repeated continuation steer (recorded
  in-substance in the WO) — explicitly submitted to R3 as an adversarial
  check; insufficient basis ⇒ claim parks unmerged + one-line ask presented
  once. Next: R3 → expected-head merge → D2 RED → D3a → D3b → D4 → D5 → D6.

(append-only below this line)

## D1 contract table (stage/edge mapping, frozen for D2)

`ProcessExplanation` derives from the 11-UTHAI Recommended Process Graph and
maps 1:1 onto the EXISTING `toEnvironmentalFlowModel()` edge IDs (single
topology authority — the derivation changes identities nowhere, it only
sources them from the shared contract):

| SSoT graph segment | Existing edge ID (environmental-flow.ts) | Medium | Kind | Activity | Tie-in |
| --- | --- | --- | --- | --- | --- |
| influent_collection → pump_sump | influent-entry | water | normal | structural | confirmed |
| pump_sump → fine_screen | pump-sump-to-screening | water | normal | structural | confirmed |
| fine_screen → aeration_tank | screening-to-aeration | water | normal | structural | confirmed |
| aeration_tank → secondary_clarifier | aeration-to-clarifier | water | normal | structural | confirmed |
| secondary_clarifier → flow_measurement_weir | clarifier-to-weir | water | normal | structural | confirmed |
| flow_measurement_weir → chlorine_contact_tank | weir-to-chlorine | water | normal | structural | confirmed |
| chlorine_contact_tank → treated_effluent_outfall | chlorine-to-outfall | water | normal | structural | confirmed |
| secondary_clarifier → ras_pumps → aeration_tank (RAS loop) | ras-return | sludge | return | structural | confirmed |
| secondary_clarifier → sludge_drying_beds (WAS) | was-to-drying-beds | sludge | normal | structural | confirmed |
| sludge_drying_beds → drying_bed_filtrate_return → pump_sump | filtrate-return | water | return | structural | confirmed |
| chlorine_solution_storage → dosing → final treatment | chlorine-dosing | chemical | normal | structural | confirmed |
| pump_sump → pump_sump_bypass (exception) | pump-sump-bypass | water | exception | **unknown** | **needs_confirmation** |
| pump_sump → emergency_overflow_line (exception) | emergency-overflow | water | exception | **unknown** | **needs_confirmation** |

Stages (8, Thai teaching labels from the existing `/flow` story):
ระบบรวบรวมน้ำเสีย influent_collection · บ่อพัก/เครื่องสูบ pump_sump ·
ตะแกรงละเอียด fine_screen · บ่อเติมอากาศ aeration_tank · บ่อตกตะกอน
secondary_clarifier · บ่อวัดอัตราการไหล flow_measurement_weir · บ่อสัมผัสคลอรีน
chlorine_contact_tank · จุดระบายน้ำทิ้ง treated_effluent_outfall.

Contract invariants (D2 RED pins): water/sludge/chemical edges never collapse
(modeling rule 1); the two exception edges are the ONLY `activity: "unknown"`
+ `tieIn: "needs_confirmation"` entries and never animate; quantity-bearing
edges (influent-entry, was-to-drying-beds) keep their existing quantity
semantics BYTE-IDENTICAL; no readings/timestamps/rates/equipment states; no
SIMULATED/LIVE/real-time vocabulary in the explanation contract.

## Temporary shared-file ownership (D3b window)

- 2026-10-14: `frontend/src/index.css` (shared stylesheet) + `frontend/src/components/flow/EnvironmentalFlowStory.tsx` are under the Codex D3b sole-writer window (GLM does not touch them until the window closes with the D3b commit).
