# ENV-VIS-STORY-001-NUM — GLM Handoff (simulated numeric effects N3+N4)

Task `ENV-VIS-STORY-001-NUM` (numeric-effects slice of Stage 2, epic
ENV-VIS-STORY-001 / Issue #110). Claim: `ENV-VIS-STORY-001-NUM-C1`
(generation 1). WO: `docs/work-orders/ENV-VIS-STORY-001-NUM.md`. This file
is the durable receipt trail (append-only below the D1 record).

## Review-route record (D5, implementation PR)

- Preferred: **cross-model D5 review by GPT-6.1 Terra via Codex CLI**
  (admitted 2026-11-08, session `01a1bc81-76c7-7543-b354-7814bc92e3bb`,
  per the FLEET-ROUTER-001 admission record) at the exact frozen head.
- **Dispatch exception recorded**: GLM-5.3 MAX authored BOTH tracks this
  slice (lib Track Z + view Track F in the same file set) because no Codex
  implementation admission occurred in this session — so the ordinary
  cross-model-vs-author pairing is unavailable and the reviewer MUST be a
  different model context from the author.
- Floor fallback: fresh GLM-5.3 MAX R2 (independent reviewer context) if
  the Terra dispatch hits a provider admission error — recorded, never a
  silent downgrade. GPT-6 Astra prohibited. Never author-and-approve.
  The implementing lane stops at REVIEW_REQUESTED and NEVER merges.

## D1 design record (frozen)

- Authority: owner numeric gate decision in-session 2026-11-10 (verbatim
  substance on issue #110): N1 REJECTED; N2 DEFERRED (relay duty-cycle
  sheet pending owner values); N3 APPROVED with recorded-value precedence
  (recorded never overwritten); N4 APPROVED contingent on cited-versioned
  GHG-management factors, no factor = no effect. Content authority: the
  approval packet (PR #141) tier-2 MODEL-ASSUMPTION-BOUND rules incl.
  ห้ามแทนค่าศูนย์. Process authority:
  `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`
  (WAS path clarifier→drying beds; aeration 2 aerators; RAS loop; chlorine
  dosing 2 pumps; unknown ≠ zero discipline).
- Contract: `deriveScenarioState` byte-frozen; new separate pure typed
  functions `deriveScenarioWasDifference(definition, recorded)` and
  `deriveScenarioSensitivities(definition, inputs, registry)`; typed
  `ScenarioDefinition.numericEffects` declarations only.
- N3 display rules (owner rule implemented literally): recorded evidence
  carried separately (`recorded: { field: "excess_sludge_removed", value,
  unit: "m³", period: "daily" } | null`) and displayed FIRST;
  `difference = proposed − recorded` ONLY when recorded is finite;
  otherwise `difference: null` and `displayPrecedence: "simulated"`; no
  declaration or non-finite proposed → NO effect (null); zero is never
  substituted for unknown.
- N3 proposed value decision: the catalog declares
  `value: 1.5, unit: "m³/วัน", assumptionClass: "declared-model-assumption",
  assumptionId: "001-NUM-v1"` with a Thai basis note explicitly stating it
  is NOT recorded, NOT owner-specified, and must not be used for
  operational interpretation. Risk recorded: the value is a declared
  model assumption (high uncertainty, display-only); the owner replaces it
  through a future reviewed slice when a real proposed/owner value exists.
- N4 spec: one sensitivity (`aeration-blower-electricity`, factor
  `tgo-grid-th-2022-2024`, base source `relay-duty-cycle-reference`, status
  `pending-owner-values`). Derivation: factor missing / wrong kind /
  value-null → omission reason `no-factor`; base non-finite/absent →
  omission reason `no-activity-base`; both finite → rendered
  `value = baseKwh × factor.value` unit `kgCO2e/วัน` with the FULL citation
  embedded. Omissions render NOTHING (never zero). Today the base is
  pending → the N4 sensitivity renders nothing in the view (honest).
- View: SIMULATED numeric chip inside the existing scenario marker system
  (`data-testid="process-scenario-numeric"`,
  `data-scenario-numeric-kind`, `data-scenario-precedence`), Thai copy,
  units on every number, assumption basis + uncertainty note visible,
  static (animation:none), scoped `env-flow-story-scenario-numeric*`
  classes. The 001B no-numbers pins on qualitative markers/banners remain
  intact (chip is a separate element class).
- FlowDiagramPage: one header sentence added (SIMULATED numeric effects
  only while a scenario is applied) — user-facing vocabulary discipline.
- N1: no code path anywhere. N2: sheet skeleton only, no derivation.

## D1 factor research record (citations with versions)

Primary applied factor (N4):

- **TGO grid electricity — 0.5562 kgCO2e/kWh** (Scope 2 generation part
  0.4750 + Scope 3 upstream fuel-chain part 0.0812), Thai grid mix, data
  years **2022–2024**, effective 2026-01-01 by the TGO board announcement
  (December 2025; prior 2016–2018 factor 0.5986 retired 2026-03-31);
  GWP set IPCC AR5.
- Source documents: (1) TGO announcement "ค่าการปล่อยก๊าซเรือนกระจกจากการผลิต/
  การใช้ไฟฟ้า" board decision, effective 1 มกราคม 2569 — corroborated by
  https://www.nationthailand.com/news/policy/40059019 (2025-11-30: Scope 2
  0.4750 + Scope 3 0.0812, effective 1 January, transition to 31 March);
  (2) TGO CFP emission-factor table row "ไฟฟ้า — grid mix ปี 2022-2024 —
  kWh — 0.5562 — Thai National LCI Database, TIIS-MTEC-NSTDA (with TGO
  electricity 2022-2024) — Update_April2026" at
  https://thaicarbonlabel.tgo.or.th/; (3) open-climate.ai TGO library
  (CFO edition February 2026, mandatory 2026-01-01: "generation 0.4750 plus
  fuel chain 0.0812 makes 0.5562 kg CO2e per kWh, data years 2022 to 2024").
- Uncertainty class: `official-national-factor`; applicability note records
  that TGO does not state whether T/D losses are included (treated as
  generation + upstream fuel chain only). Alternative T-VER/LESS
  consumption factors (e.g. EFEC 2022 = 0.4682 tCO2/MWh, announced
  2025-05-28) exist but target mitigation-project baselines, not
  organizational display — recorded here, not applied.
- Fallback CLASS (declared, value-null, NOT applied to any base):
  2006 IPCC Guidelines for National Greenhouse Gas Inventories, Vol.5
  Waste, Ch.6 (Wastewater Treatment and Discharge) — the same guideline
  basis Thailand's BUR4 national inventory uses (onep.go.th); uncertainty
  class `tier-1-default-high`.

## D2 RED receipts (commit `ebb87dd`, base `bd5a941`)

- Focused vitest `src/lib/process-scenario.test.ts`: **9 failed / 15
  passed** — truthful failures: (1) proposed-volume declaration absent;
  (2) deriveScenarioWasDifference absent (recorded-precedence case);
  (3) zero-substitution case unresolvable (function absent); (4) no-effect
  case; (5) NUMERIC_EFFECT_EMISSION_FACTORS absent (registry pin);
  (6) loss-of-aeration sensitivity spec absent; (7) no-base omission case;
  (8) unknown-factor fail-closed case; (9) base×factor rendered case.
- E2E: **2 truthful failures** (SIMULATED numeric chip absent under the
  WAS scenario — toHaveCount 0 vs 1; chip not found in the
  recorded-precedence/zero-substitution case) + **1 regression-guard case
  passing vacuously at RED** (no base+factor pair renders no chip — it
  pins that the omission discipline SURVIVES implementation; recorded as
  such, not claimed as a RED failure).
- tsc clean at the RED commit (casts through unknown; no @ts-expect-error).

## D3 record (commit `27fc47f` + shim `36c0fe4`)

- `process-scenario.ts`: types + the two pure derivations (fail-closed
  finite checks; UNKNOWN_SCENARIO_EDGE discipline untouched).
- `process-scenarios.ts`: N3 declaration + N4 spec + cited registry.
- `EnvironmentalFlowStory.tsx`: ScenarioNumericChip on the WAS branch card
  (applied-scenario-only); N4 rendered-chip block (empty today); Thai
  copy with units, basis, uncertainty.
- `index.css`: static scoped chip styles (animation/transition none).
- `FlowDiagramPage.tsx`: one SIMULATED-vocabulary header sentence.
- D2→D3 mechanics repairs (assertions byte-identical): dynamic-import
  probes replaced by typed static imports; fixture shim extended to
  re-export `NUMERIC_EFFECT_EMISSION_FACTORS` (PROCESS_SCENARIOS alias
  preserved); one e2e assertion precision fix — `not.toContain("ผลต่าง")`
  was too broad (it also matched the legitimate wording
  "ผลต่างคำนวณไม่ได้") and was tightened to the computed-difference label
  `ผลต่างสมมุติ:`; the implementation was already correct.

## D4 battery (all at the frozen head)

| Gate | Result |
| --- | --- |
| Focused vitest (process-scenario + environmental-flow) | 42/42 |
| FULL vitest | **424/424** (28 files; 415 pre-existing + 9 new) |
| `tsc -b` | clean (exit 0) |
| lint (oxlint) | **0 errors**, 12 pre-existing warnings |
| /flow Playwright FULL spec | **19/19** (16 existing + 3 new) |
| `git diff --check` (bd5a941..HEAD and worktree) | clean |
| Scope-exact | `git diff --name-only bd5a941..HEAD` = the 8 in-scope code files; + 3 new docs (this handoff, the WO, the relay sheet) = exactly the 11 mutable files |
| Guard suite | **344 passed** (450 subtests) |
| Runtime suite | **62 passed** (32 subtests) |
| `docs/ai/CURRENT-WORK.md` diff | **empty (0 lines)** |

Environment notes (recorded truthfully): the machine-local gitignored
`frontend/.env` was absent in the fresh worktree and was created with the
real project URL + a NON-WORKING placeholder key (module-load guard only;
all network paths in the tests are route-mocked; a placeholder key fails
closed). Pre-existing condition recorded: `npm ci` fails at base because
the committed lockfile is out of sync with `package.json` (missing
typescript@5.9.3) — pre-existing at `bd5a941`, untouched per scope; the
battery ran via `npm install` resolution. Playwright chromium v1228
(installed for the pinned @playwright/test 1.61.1).

## Review routing (next step for the owner/reviewer)

1. Freeze verified: HEAD = the last commit on `feat/env-visstory-001-num`
   (recorded in the PR body); base = `bd5a941`.
2. D5 cross-model review — GPT-6.1 Terra (Codex CLI) preferred at the exact
   head; fresh-GLM R2 floor; verdict posted on the PR.
3. D6 expected-head merge BY THE REVIEWER (never the implementing lane).
4. Post-merge: exact-main CI (test = scripts suites; e2e + deploy-preview
   per PR #85 evidence include whatever checks appear) + deployed smoke.

(append-only below this line)
