# ENV-VIS-STORY-001B — GLM Handoff (scenario simulation C1 contract)

Task `ENV-VIS-STORY-001B` (Stage 2 of epic ENV-VIS-STORY-001 / Issue #110).
Claim: `ENV-VIS-STORY-001B-C1` (generation 1).
WO: `docs/work-orders/ENV-VIS-STORY-001B.md`. This file is the durable
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

- 2026-10-14: gpt-6-sol @ max read-only consult (99,215 tokens, exit 0).
  Recommendations ALL incorporated: Track-Z-only lib slice defensible (tests
  + fixtures are C1's consumer; a later reviewed integration slice is the
  production consumer); ScenarioDefinition/deriveScenarioState shape with
  provenance {source:"simulation", observedAt:null} naming-compatible with
  the Twin's spelling but a separate contract from TwinSimulationOverrides;
  scenarioState separate from topology activity/tieIn (hypothetical
  activation never resolves needs_confirmation); loss-of-aeration as a
  qualitative aeration_tank override; exactly the six rule-5 fixtures;
  invariants incl. compile-time non-assignability and no-clock/no-random;
  WO risks P1 (vocabulary escape, activation≠confirmation, domain-owner gate
  must be recorded UNPASSED) + P2 (Twin confusion, fixture/production
  separation, scope creep). Freshness caveat honored: the coordinator
  re-verified main (`fb17c6c`) directly before authoring.

## Status

- 2026-10-14 (claim transition authored): WO + registry entry + frontier
  bullet drafted on `docs/env-vis-story-001b-claim` off main `fb17c6c`.
  Predecessor fence (guard module): policy `fb17c6cb754d372800ddc505bb6dbcec2f6c7e05`,
  registry block sha256 `9ef4b20d298dd268c2f9253549ce3aadb30f5b60985b402d706355a39fca1534`.
  Activation basis = the owner's 5th repeated continuation steer immediately
  after the report naming 001B the next gated lane, following the PR #132
  R3 precedent (ACTIVATION_BASIS: SUFFICIENT). Explicitly submitted to R3 as
  an adversarial check; insufficient basis ⇒ parks unmerged + one-line ask
  presented once. Next: R3 → expected-head merge → D2 RED → D3 → D4 → D5 → D6.

(append-only below this line)

## D1 contract table (frozen for D2)

Six-scenario inventory (SSoT modeling rule 5) and their EXACT overrides.
Output invariants for every row: provenance `{ source: "simulation",
observedAt: null }`; untouched edges render `scenarioState: "baseline"` with
topology activity/tieIn RETAINED; no numeric effect, unit, or observed
timestamp anywhere.

| # | Scenario id | Thai label | Overrides (input) | Derived output |
| --- | --- | --- | --- | --- |
| 1 | pump-sump-bypass-active | เปิดเส้นทางรองบ่อพัก (สมมุติ) | edge pump-sump-bypass -> active-path | that edge scenarioState "active-path"; its tieIn STAYS needs_confirmation (hypothetical activation never confirms an as-built connection) |
| 2 | emergency-overflow-active | เปิดเส้นทางล้นฉุกเฉิน (สมมุติ) | edge emergency-overflow -> active-path | same rule as row 1 |
| 3 | loss-of-aeration | หยุดการเติมอากาศ (บ่อเติมอากาศ) | stage aeration_tank -> { aeration: "interrupted" } | the stage is marked process-interrupted; NO water edge is turned off (an unsupported hydraulic claim per Role A) |
| 4 | ras-interruption | หยุดส่งตะกอนไหลกลับ (RAS) | edge ras-return -> interrupted | that edge scenarioState "interrupted"; topology untouched |
| 5 | excess-sludge-wasting | การทิ้งตะกอนส่วนเกิน (WAS) | edge was-to-drying-beds -> active-path | qualitative focus condition only; no quantity implied |
| 6 | chlorine-dosing-interruption | หยุดจ่ายคลอรีน (สมมุติ) | edge chlorine-dosing -> interrupted | that edge scenarioState "interrupted"; no dose or residual implied |

Type shape: `ScenarioEdgeCondition = "active-path" | "interrupted"`;
`ScenarioDefinition.edgeOverrides: Partial<Record<ProcessExplanationEdgeId, ScenarioEdgeCondition>>`
(unknown IDs rejected at compile time AND by a runtime guard);
`ScenarioDefinition.stageOverrides?: { aeration_tank?: { aeration: "interrupted" } }`
(the ONLY C1 stage override). `deriveScenarioState` returns
`{ provenance, edges: Array<topology edge fields + scenarioState: "baseline" | "active-path" | "interrupted">, stages: Array<stage + optional scenarioProcess: "process-interrupted"> }`
in stable PROCESS_EXPLANATION order. Edge/stage-ID typing: the constant is
narrowed at the TYPE level so `ProcessExplanationEdgeId` /
`ProcessExplanationStageId` literal unions are exported from
`environmental-flow.ts` (compile-time unknown-ID rejection, pinned by an
@ts-expect-error test) — zero runtime behavior change.

## Execution receipts

- 2026-10-14 (transition merged): PR #135 merged as `e5bf6a7` (second parent = R3-APPROVED `7fd2522`; trail: R1 CHANGES_REQUIRED with ACTIVATION_BASIS: SUFFICIENT + 3 findings (6170647883-era), R2 APPROVED no-findings 6170740044; main CI test=success). Implementation worktree env-vis-story-001b-20261014 / feat/env-vis-story-001b at base `e5bf6a7`.
- 2026-10-14 (D2 RED, commit `17e04ca`): all cases failed truthfully (module-not-found) - inventory, unknown-edge rejection, topology retention, loss-of-aeration stage semantics, never-blends provenance/vocabulary, determinism/no-mutation, compile-time non-assignability + type-level ID rejection. One D2 regex self-repair during D3 (bare /DO/i matched "dosing"; pinned as key-form metric fields) and one directive-placement repair (single-line object under @ts-expect-error).
- 2026-10-14 (D3 GLM Track Z): `process-scenario.ts` (ScenarioDefinition/ScenarioState/deriveScenarioState; synchronous pure; UNKNOWN_SCENARIO_EDGE runtime guard; aeration-interrupted the ONLY stage override) + `__fixtures__/process-scenarios.ts` (the six rule-5 scenarios, Thai hypothetical labels, preserved assumptions; never imported by production paths). `environmental-flow.ts` type-level narrowing: frozen TOPOLOGY_EDGE_IDS/TOPOLOGY_STAGE_IDS tuples + exported ProcessExplanationEdgeId/StageId literal unions + interface ids narrowed (first attempt `as const satisfies` on the whole constant reverted - the tuple discrimination leaked a TS2367 into the FORBIDDEN EnvironmentalFlowStory.tsx; the interface-union form compiles consumers unchanged; the tuples are pinned to the live topology by test).
- 2026-10-14 (D4 battery): focused scenario 12/12 + environmental-flow 18/18; FULL vitest **412/412** (28 files); `tsc -b` clean; lint 0 errors (12 pre-existing warnings); `git diff --check` clean. No e2e (no UI change).
- Next: D5 fresh-GLM review at the frozen head -> D6 expected-head merge + exact-main CI verify + closeout transition.

## Closure receipts (D5/D6)

- D5 (2026-10-14): fresh-GLM-5.3-MAX independent review at exact head `efe670d` — **APPROVED** (verdict issuecomment-6171174450). Battery independently reproduced (targeted 30/30, full 412/412, tsc clean, lint 0 errors); scope exact (5 files, all allowed); contract-table fidelity verified row-by-row; zero numerics with the domain-owner gate recorded UNPASSED; purity verified (no Date/random/IO); fixtures isolated; the @ts-expect-error non-assignability verified genuine (ScenarioState lacks asOf/sourceType/quantities/discharge); environmental-flow.ts diff type-level only with Stage-1 18/18 unchanged. 1 informational P3 (scenarioId additive beyond the D1 sketch; all frozen invariants hold).
- D6 (2026-10-14): expected-head merge — **PR #136 merged as `70d9ab0`** (parents: `e5bf6a7` + reviewed `efe670d`; ancestry verified). Exact-main workflows on `70d9ab0`: test SUCCESS · E2E smoke SUCCESS · Deploy to GitHub Pages SUCCESS. Closeout transition: registry CLOSED at generation 1, fence moved to `70d9ab0` + block sha256 `67c369ec…` (guard module), frontier bullet + coordination summary reconciled (ONE active claim remains: Building, deferred). Implementation worktree `env-vis-story-001b-20261014` preserved clean at `efe670d` (fully merged). CLOSED confers no fresh mutation authority; the scenario VIEW and any numeric-effect work each need their own owner-authorized activation + WO + NEW reviewed claim transition.
