# ENV-VIS-STORY-001-NUM — Simulated Numeric Effects N3+N4 (Work Order, C1 slice)

Status: CLOSED — delivered via PR #158 (merged fe96f7f); closeout
transition pending. Claim `ENV-VIS-STORY-001-NUM-C1`
(generation 1); base `bd5a9414fe696237154af0fa1a5b529258dfdc2b` (main at
claim transition, merged via PR #157). Branch `feat/env-visstory-001-num`
in registered worktree `env-visstory-001num`. Receipts durable in
`docs/ai/handoffs/ENV-VIS-STORY-001-NUM-GLM.md`.
Task: `ENV-VIS-STORY-001-NUM` (numeric-effects slice of Stage 2, epic
ENV-VIS-STORY-001 / Issue #110 — the gate-passing follow-up to the CLOSED
001B contract lane PR #136 and 001B-VIEW lane PR #139).
Review owner (implementation PR): cross-model D5 by GPT-6.1 Terra (Codex
CLI) PREFERRED — GLM authors both tracks this slice (no Codex-author
admission in-session; recorded dispatch exception) — with fresh-GLM R2 as
the floor; GPT-6 Astra prohibited; never author-and-approve; never silent
downgrade.

## Authorization basis (owner numeric gate, PASSED for N3+N4 only)

Owner decision given in-session 2026-11-10, recorded verbatim-substance on
issue #110: **N1 diverted-volume REJECTED** (bypass/overflow physical routes
unconfirmed; both delegates recommended defer); **N2 interruption-exposure
DEFERRED, not rejected** (equipment runs on relay duty timers; the manual
reference sheet below awaits owner-supplied values); **N3 WAS difference
(simulated − recorded) APPROVED** with the recorded-value-precedence rule
(recorded value displayed first when it exists; recorded never overwritten);
**N4 resource/emission sensitivities APPROVED contingent** on cited,
versioned factors from GHG-management references (national GHG inventory /
TGO / IPCC-class); no factor = no effect. Content authority:
`docs/ai/design/ENV-VIS-STORY-001B-NUMERIC-APPROVAL-PACKET.md` (merged PR
#141; independently reviewed APPROVED) tier-2 MODEL-ASSUMPTION-BOUND rules —
scenario mapping, formula shapes, per-factor provenance, units, uncertainty,
interpretation limits; **ห้ามแทนค่าศูนย์ (never substitute zero)**; approval
covers ONLY this separately-claimed SIMULATED slice — never observed-data
claims, no water-quality projections, no tier-3 items.

## Objective

Deliver the owner-approved numeric-effects slice on the EXISTING /flow
scenario view (Issue #110 rule 5 — no second flow engine/renderer):

- **N3** — excess-sludge (WAS) volume difference, formula
  `proposed (simulated) − recorded`, on exactly the WAS-affected scenario
  (`excess-sludge-wasting`). Recorded evidence takes display precedence and
  is never overwritten; without a recorded value the difference is
  uncomputable (null) and display falls to the SIMULATED proposed value
  with its assumption basis; unknown never becomes zero.
- **N4** — resource/emission sensitivity machinery: `activity base × factor`
  ONLY where both a scenario-specific activity base AND a cited-versioned
  factor exist. Shipped registry: the TGO grid-electricity factor
  (cited, versioned) + the IPCC 2006 Vol.5 fallback CLASS (value-null). The
  aeration-electricity spec's activity base awaits the owner's relay
  duty-cycle reference → the sensitivity is OMITTED today (renders nothing,
  never zero). Unknown factor id → fail-closed omission.
- **N2** — reference sheet SKELETON ONLY (no activation):
  `docs/ai/design/ENV-VIS-STORY-001-NUM-RELAY-DUTY-CYCLE-REFERENCE.md`.
- **N1** — NOT implementable under this claim (rejected): no diverted-volume
  numeric path exists anywhere in this slice.

## D1 design decisions (frozen)

1. `deriveScenarioState` stays byte-frozen (qualitative ScenarioState
   contract, 001B D5-pinned); numeric derivations are SEPARATE typed pure
   functions: `deriveScenarioWasDifference(definition, recorded)` and
   `deriveScenarioSensitivities(definition, inputs, registry)`.
2. `ScenarioDefinition.numericEffects?: ScenarioNumericEffects` — typed
   declarations only; the shipped catalog declares the N3 proposed volume
   (value 1.5, unit m³/วัน, `assumptionClass: "declared-model-assumption"`,
   `assumptionId: "001-NUM-v1"`, Thai basis note, high uncertainty) and one
   N4 spec (`aeration-blower-electricity` → factor `tgo-grid-th-2022-2024`,
   base source `relay-duty-cycle-reference`, status `pending-owner-values`).
3. N4 factor registry `NUMERIC_EFFECT_EMISSION_FACTORS` (see citations
   table below) lives in `process-scenarios.ts`; derivation takes the
   registry as a parameter (pure DI, no import cycle).
4. View: SIMULATED numeric chip (`data-testid="process-scenario-numeric"`,
   Thai labels, units on every number, assumption basis + uncertainty
   visible) rendered inside the EXISTING scenario marker system on the WAS
   branch card while the scenario is applied; rendered N4 chips (none
   today) would render in the same system; omissions render NOTHING.
   The 001B no-numbers pins on qualitative markers/banners stay intact.
5. N1: no code path, no type, no UI. N2: no derivation, sheet skeleton only.

## N4 factor citations table (researched 2026-11-10)

| Field | TGO grid electricity | IPCC fallback class |
| --- | --- | --- |
| id | `tgo-grid-th-2022-2024` | `ipcc-2006-vol5-ch6-fallback` |
| value / unit | **0.5562 kgCO2e/kWh** (Scope 2 generation 0.4750 + Scope 3 upstream fuel chain 0.0812) | none bound (class declaration only) |
| source document | อบก./TGO — ค่าการปล่อยก๊าซเรือนกระจกจากการผลิต/ใช้ไฟฟ้า, board announcement Dec 2025 effective 2026-01-01; TGO CFP/CFO factor list (Update_April2026, with Thai National LCI Database, TIIS-MTEC-NSTDA) | 2006 IPCC Guidelines for National GHG Inventories, Vol.5 Waste, Ch.6 (Wastewater Treatment and Discharge) |
| version | grid mix data years **2022–2024**; GWP set IPCC AR5; prior 2016–2018 factor (0.5986) retired 2026-03-31 | 2006 Guidelines (same basis as Thailand's BUR4 national inventory) |
| uncertainty class | `official-national-factor` (TGO does not state T/D-loss inclusion — recorded in applicability) | `tier-1-default-high` |
| applicability | Thai national-grid electricity, organizational (CFO) accounting | future wastewater/sludge CH4 effects IF a BOD-class activity base appears |
| corroboration | TGO CFP table row "ไฟฟ้า grid mix ปี 2022-2024, kWh, 0.5562" (thaicarbonlabel.tgo.or.th) + TGO board announcement (nationthailand.com 2025-11-30) + open-climate.ai TGO library (edition Feb 2026, mandatory 2026-01-01) | Thailand BUR4 (onep.go.th) inventory uses the 2006 IPCC Guidelines |

If a credible cited factor had not been found, the sensitivity would have
been OMITTED (honest no-factor-no-effect); the TGO factor is found and
cited, and the OMITTED state today is caused by the missing activity base
(relay duty-cycle values pending owner input) — never rendered as zero.

## Scope (mutable, exactly — identical to the registry claim entry)

- `frontend/src/lib/process-scenario.ts` — typed numeric-effect contract +
  derivations
- `frontend/src/lib/process-scenarios.ts` — catalog numericEffects
  declarations + factor registry
- `frontend/src/pages/FlowDiagramPage.tsx` — header SIMULATED-vocabulary
  note (one sentence)
- `frontend/src/components/flow/EnvironmentalFlowStory.tsx` — SIMULATED
  numeric chip wiring
- `frontend/src/lib/process-scenario.test.ts` — N3/N4 contract pins
- `frontend/src/lib/__fixtures__/process-scenarios.ts` — re-export shim
  (unchanged reference)
- `frontend/tests/e2e/environmental-flow.spec.ts` — 3 new e2e cases
- `frontend/src/index.css` — static numeric-chip styles
- `docs/ai/design/ENV-VIS-STORY-001-NUM-RELAY-DUTY-CYCLE-REFERENCE.md` (new)
- `docs/work-orders/ENV-VIS-STORY-001-NUM.md` (this WO)
- `docs/ai/handoffs/ENV-VIS-STORY-001-NUM-GLM.md` (new)

## Forbidden

The packet file, `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`,
`docs/ai/DEFECT-MEMORY.md`, `AGENTS.md`, `scripts/**`, `supabase/**`,
`.github/**`, `data/**`, `.env`, `frontend/src/components/digital-twin/**`,
`frontend/src/components/pfd/**`, `frontend/src/lib/twin/**`,
`frontend/src/components/flow/WastewaterFlowDiagram.tsx`. No N1/N2 numeric
path; no water-quality projection; no operational writes; no LIVE vocabulary
for simulated values.

## D-plan

D1 (this WO + handoff D1 record incl. factor research) → D2 RED-first
tests (lib + e2e, truthful failures recorded) → D3 implement to green →
D4 battery (focused vitest + FULL vitest + tsc + lint + /flow Playwright
FULL + diff-check + scope-exact file list + guard 344/344 + runtime 62/62
+ CURRENT-WORK.md diff empty) → freeze exact head → D5 cross-model review
(GPT-6.1 Terra preferred; fresh-GLM R2 floor) → D6 expected-head merge by
the reviewer (never the implementing lane).

## Acceptance

- N3 chip under the WAS scenario shows recorded precedence + SIMULATED
  difference with units + assumption basis; unknown recorded → no
  difference, no zero, precedence falls to simulated.
- N4: no factor / no activity base → renders NOTHING (never zero);
  the registry pins the cited TGO factor + IPCC fallback class.
- N1 absent; N2 sheet is a skeleton with owner-input columns and the
  mandatory header rules (manual reference ≠ telemetry; unknown stays
  unknown; N2 activation requires the owner-filled sheet).
- Qualitative 001B contract + Stage-1 tests unchanged (18/18 Stage-1,
  415 pre-existing vitest, 16 existing /flow cases).
- All D4 battery gates green at the frozen head; no forbidden file touched.

## Dispatch-exception risk record

GLM authors both tracks this slice (lib Track Z + view Track F within the
same file set); no Codex admission occurred in this session — recorded as a
dispatch exception with cross-model D5 (GPT-6.1 Terra via Codex CLI) as the
PREFERRED review route and fresh-GLM R2 as the floor. The implementing lane
never merges its own PR; the lane stops at REVIEW_REQUESTED.
