# ENV-WASTE-CARBON-001-C1 — Handoff (claim checkpoint)

## Checkpoint 0 — Claim transition authored (2026-10-13)

- Claim `ENV-WASTE-CARBON-001-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges.
- Work Order: `docs/work-orders/ENV-WASTE-CARBON-001.md` — bounded C1 slice:
  integrated sustainability view (`/sustainability`) grounded in the delivered
  001A A–K inventory + honesty contracts; 1 contributing family (electricity)
  + 4 explicit UNAVAILABLE families; T-VER evidence-readiness ONLY (never
  eligibility); read-only reuse of the rollup contract.
- D3 SPLIT by track and model-authorized (2026-10-14 owner steer, recorded
  in-substance in the WO): D3a = GLM implements `family-state.ts` (Track Z);
  D3b = Codex CLI `gpt-6-sol` @ max implements the page/route/nav ONLY
  (Track F; per-file sole writer; GLM paused during the D3b dispatch);
  gpt-6.1-sol unprobed on its unchanged blocked fingerprint; gpt-5.6-sol
  R3-review-only. JEV named by the
  owner as helper but UNAVAILABLE per the fleet router — no advisory consumed,
  no probing. D1 (@29f0471: contracts + truth table) and D2 (@1b4f73d: RED
  unit + e2e) are COMPLETE in worktree `env-wc001-20261013` (branch
  `feat/env-waste-carbon-001`).
- Next (D3 split by track per AGENTS.md): **D3a GLM implements
  `frontend/src/lib/sustainability/family-state.ts`** to the frozen unit
  contract (RED→green; GLM sole writer of lib/sustainability/**). **D3b
  Codex `gpt-6-sol` @ max implements `SustainabilityPage.tsx` + `App.tsx`
  route + `AppShell.tsx` nav** consuming family-state read-only (Codex sole
  writer of those three files only; GLM paused during the dispatch). → D4
  battery (full vitest + tsc + lint + Playwright on a ref-matching dev
  server) → D5 FRESH independent GLM-5.3 MAX review (cross-model vs the
  Codex author; implementing lane never merges) → D6 deploy + receipts +
  closeout.

## D1 — Read-only data contracts + family-state truth table pinned (2026-10-13)

Grounding (read from code on `44181fb`):
- **Rollup contract (read-only import)**: `useCarbonRollup(months=12)` /
  `RollupSummary { rows; byScope: ScopeSummary[]; grandTotalKg (KNOWN total
  only); incompleteSources: string[] (expected factor-backed sources with no
  rows in window); unavailableSources: string[] (seen, ≥1 NULL-kg row);
  hasUnavailableContribution }`; `RollupRow { source; kg_co2e: number|null
  (NULL = factor unavailable, not zero); … }`; `EXPECTED_SOURCES` is the
  factor-backed allowlist (scope 1: diesel/gasoline/lpg/garden_fuel …).
- **Garbage contract (read-only)**: `frontend/src/lib/garbage.ts` —
  `GarbageLog { … segregation_type: string|null … }`,
  `useGarbageLogs(limit=30)`; segregation_type is the canonical
  GARBAGE-CORE-001 classification; **no plastic category/mass/unit/factor
  exists anywhere** (001A A–K; `waste_recyclable` is NOT plastic).
- **NAV**: `frontend/src/components/layout/AppShell.tsx` NAV array (~line 24–45;
  คาร์บอน / คาร์บอนรวม / จัดการขยะ entries exist) — new entry `/sustainability`
  label "ความยั่งยืน" goes there, nothing else changes.

**Family-state truth table (exhaustive, per the A–K facts):**
| Family | State today | Rendering |
| electricity | CONTRIBUTING (907 rows; via rollup rows grandTotalKg) | real numbers from `useCarbonRollup`; badge LATEST (manual-snapshot semantics per rollup) |
| fuel (diesel/gasoline/lpg) | UNAVAILABLE (0 rows) | ไม่มีข้อมูล; listed in `incompleteSources` |
| garden_fuel | UNAVAILABLE (0 rows) | ไม่มีข้อมูล |
| waste (garbage) | UNAVAILABLE (0 rows) | ไม่มีข้อมูล; segregation breakdown only if `useGarbageLogs` returns rows (else ABSENT list) |
| chemical | UNAVAILABLE (0 rows) | ไม่มีข้อมูล |
| **Plastic** | **ABSENT (no contract exists)** | explicit ABSENT/ไม่มีข้อมูล — never derived from waste_recyclable; RED-pinned |

Truth rules: unknown ≠ zero (NULL kg never 0.000); grandTotalKg rendered as
"ยอดรวมที่ทราบ" with `hasUnavailableContribution` flag; when
`unavailableSources` non-empty, those sources render with an UNAVAILABLE
contribution marker, not 0.

**T-VER readiness items (readiness-only, never eligibility):** each item =
{ input, status: DOCUMENTED|ABSENT }: electricity consumption (DOCUMENTED —
907 rows); waste composition by category (ABSENT — no plastic/complex
categories); per-source emission factors (PARTIAL — electricity factor
documented; fuel/garden/waste/chemical factors absent for 0-row sources —
render per EXPECTED_SOURCES × incompleteSources); boundary/period evidence
(ABSENT — no T-VER boundary documentation exists in-repo). NO eligibility,
status, credit estimate, or registration progress is ever rendered.

**Composition**: single responsive page section per family + T-VER readiness
card; ≥44px targets; 360px no horizontal overflow; Thai labels; พ.ศ. dates.

New module: `frontend/src/lib/sustainability/family-state.ts` (pure derivation
from RollupSummary + GarbageLog[]; no new queries) + unit test; page consumes
it. D2 RED tests target these contracts.
