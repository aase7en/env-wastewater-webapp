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

## D5 REPAIR RECORD (cross-model review repairs, appended 2026-11-10)

These repairs followed the cross-model D5 review by **GPT-6.1 Terra (Codex
CLI, session `01a1c4d2`, verdict `CHANGES_REQUIRED`)** at the frozen head
`cd2f4b10ca580e1edfc9a0bad61db7a34e2b660f` — 3×P2 + 1×P3 + the P3-plus
Buddhist-Era note. TDD discipline held: repair tests were added first and
their truthful RED was recorded before implementation. Scope stayed exactly
within the 11 mutable files (5 touched: `process-scenario.ts`,
`process-scenarios.ts`, `EnvironmentalFlowStory.tsx`,
`process-scenario.test.ts`, `environmental-flow.spec.ts`).

### Findings → repairs (1:1)

**P2-1 — display rounding (formatDelta ~lines 14/34).** Finding: a
genuinely nonzero WAS difference (e.g. 0.0004 m³/วัน) rendered as
"= 0 m³/วัน" after `toFixed(3)` — a display-level zero substitution.
Repair: new pure exported `formatScenarioNumber(value)` in
`process-scenario.ts` — 3-decimal display rounding for regular magnitudes,
adaptive precision escalation for values that round to zero at display
precision (extra decimals; compact scientific-ish form for extreme
magnitudes, e.g. `1e-15`), `"0"` ONLY for an exact zero, null/non-finite →
null (render nothing). The local `formatDelta` was removed; the WAS
difference text AND the N4 chip value line (same display-zero hazard class,
`parseFloat(value.toFixed(3))`) both render through it now.

**P2-2 — factor admission validation (deriveScenarioSensitivities
~line 280).** Finding: only id/kind/finite-value were checked; a factor
with `source: ""`, `version: ""`, or a wrong unit would still be
multiplied. Repair: admission gate after `no-factor` — non-empty trimmed
`source`, non-empty trimmed `version`, and `unit === "kgCO2e/kWh"` (the
declared sensitivity unit contract) required; otherwise the spec omits
with fail-closed reason `invalid-factor-metadata` + Thai note (reason
union extended). Tests: uncited (`source: ""`), versionless (`version:
""`), wrong-unit (`tCO2/MWh`), whitespace-only source → all omitted,
never computed; valid registry control still computes.

**P2-3 — activity-base typed evidence (~lines 272/291).** Finding: the
base `aerationBlowerRuntimeKwh` accepted any bare number without
provenance. Repair: the accepted base is now a typed envelope
`ScenarioActivityBaseEvidence { sourceId, status:
"confirmed-by-owner" | "pending-owner-values", period: "daily", value }`;
an effect computes ONLY when BOTH the declared spec status AND the input
evidence status are `confirmed-by-owner` AND `period === "daily"` (the
scenario evaluation period semantics). Fail-closed reasons: absent/null/
non-finite base → `no-activity-base`; pending/unconfirmed (declaration or
evidence) → `activity-base-unconfirmed`; period mismatch → 
`activity-base-period-mismatch`. The declared spec status type widened to
`ScenarioActivityBaseStatus` (catalog stays `pending-owner-values`).
Behavior today unchanged: the UI call site passes null (omitted
`no-activity-base`) and the relay reference literal declares
`pending-owner-values` (stays omitted even against a confirmed input —
declaration flips only through a reviewed slice). Tests: pending base →
omitted; declared-pending + confirmed input → omitted; period mismatch →
omitted; non-finite envelope value → omitted; confirmed fixture
(declared + input confirmed) → computed.

**P3-4 — banner contradiction (process-scenarios.ts ~line 78 +
EnvironmentalFlowStory.tsx ~line 364).** Finding: the WAS scenario banner
still said "ไม่อ้างปริมาณหรืออัตราใด ๆ" while numeric chips display
simulated quantities on the same screen. Repair: reworded to the precise
truth — "ไม่อ้างปริมาณหรืออัตราที่สังเกตได้จริงใด ๆ — ค่าเชิงตัวเลขที่แสดง
(ถ้ามี) เป็นค่าจำลอง (SIMULATED) ที่ระบุฐานสมมติชัดเจนเท่านั้น" (no
OBSERVED quantities/rates are claimed; clearly-labeled SIMULATED values
may be shown; hypothetical wording style kept). The same contradiction
class was applied to the second numeric-declaring scenario
(loss-of-aeration), whose line also carried the stale parenthetical
"(รอการอนุมัติของเจ้าของโดเมน)" — superseded by the 2026-11-10 owner
gate. Verified NO test asserted either old string; new pins added (unit
contract pins + e2e banner assertion).

**P3-plus — Buddhist Era factor-version formatting
(~EnvironmentalFlowStory.tsx line 486).** Finding note: when the N4 chip
eventually renders a factor version year, format years user-facing as
พ.ศ. while keeping the original version identifier intact for
traceability. Repair: pure exported `formatScenarioFactorVersion(version)`
— CE year tokens (1600–2999, word-bounded) render as "พ.ศ. (ค.ศ.)"
inline (e.g. "2565 พ.ศ. (2022 ค.ศ.)"); quantity-like tokens (0.4750,
GWP set ids) never match; the underlying `factor.version` string is
never mutated (data-level traceability pinned by test). Wired into the
currently-empty N4 chip version line so the path is correct when it
activates. 5 unit tests.

### D5-repair RED receipt (before implementation)

Focused vitest `process-scenario.test.ts`: **22 failed / 43 passed** —
all 22 failures are exactly the new D5-repair contracts (P2-1 ×7, P2-2
×5, P2-3 ×3 failing, P3-4 ×2, P3-plus ×4, plus the fixture-based
computed-path rewrite of the old bare-number test). Recorded truthfully:
1 new P2-3 case (non-finite envelope value → `no-activity-base`) passed
at RED because the old contract already rejected non-numeric inputs —
it pins that behavior through the envelope path, not a RED failure.
E2E note (recorded honestly): the new small-difference/banner case was
NOT separately run at RED — at `cd2f4b1` it would fail by inspection
(the chip rendered `toFixed(3)`-collapsed text and the banner carried
the old string); repair tests were committed together with the fix per
the repair slice, and the recorded RED receipt for this slice is the
focused lib run above.

### Battery after repairs (all at the new head)

| Gate | Result |
| --- | --- |
| Focused vitest (process-scenario + environmental-flow) | **65/65** (42 + 23 new) |
| FULL vitest | **447/447** (28 files; 424 + 23 new) |
| `tsc -b` | clean (exit 0) |
| lint (oxlint) | **0 errors**, 12 pre-existing warnings |
| /flow Playwright FULL spec | **20/20** (19 + 1 new small-difference case) |
| Guard suite | **344 passed** (OK) |
| Runtime suite | **62 passed** (OK) |
| `git diff --check` (bd5a941..HEAD and worktree) | clean |
| Scope-exact | `git diff --name-only bd5a941..HEAD` = exactly the 11 mutable files; repair commit touches 5 of them |
| `docs/ai/CURRENT-WORK.md` diff | **still empty (0 lines)** |

Environment notes unchanged from D4 (same worktree; `frontend/.env`
placeholder guard; battery via `npm install` resolution; chromium v1228).

(append-only below this line)
