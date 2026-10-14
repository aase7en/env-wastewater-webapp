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

## D2 — RED-first test contract landed (2026-10-13)

- `frontend/src/lib/sustainability/family-state.test.ts` (9 tests): fixed
  FAMILY_ORDER incl. plastic; electricity CONTRIBUTING/LATEST with real
  numbers; 4 families UNAVAILABLE ไม่มีข้อมูล never numeric; plastic ABSENT
  even with waste_recyclable garbage rows; waste segregation summary without
  fabricated carbon; unavailableSources → UNAVAILABLE-contribution marker
  never 0.000; known-only-total flag; T-VER readiness statuses
  DOCUMENTED/ABSENT/PARTIAL with a serialized no-eligibility/no-credit guard.
  **RED verified**: `Cannot find module './family-state'` (implementation
  module absent by design).
- `frontend/tests/e2e/sustainability.spec.ts` (7 tests, authed fixture):
  six family cards; UNAVAILABLE cards ไม่มีข้อมูล never 0.000; plastic
  data-family-state=ABSENT; T-VER readiness section with no
  eligibility/credit/registration text; known-only total marker; NAV
  ความยั่งยืน ≥44px reaching the page; 360px no horizontal overflow.
  RED expected pre-implementation (route/elements absent).
- Next: D3 BLOCKED-UNTIL-ADMISSION for this lane (per-lane owner
  authorization per the PR-#114 pattern; asked once in PR #118). Until
  then: no implementation dispatch; claim may park in registry BLOCKED.

## D3a + D3b complete — ownership transferred back to GLM (2026-10-14)

- **D3a @3d5d49d (GLM, Track Z):** `family-state.ts` implemented to the frozen
  unit contract — 9/9 unit green, `tsc --noEmit` clean.
- **D3b (Codex `gpt-6-sol` @ max, Track F):** implemented
  `SustainabilityPage.tsx` (frozen hooks consumed read-only; six family cards
  with data-family/data-family-state; known-total marker; T-VER readiness
  section with data-readiness-status; no eligibility/credit words),
  `App.tsx` route wiring, `AppShell.tsx` nav entry ความยั่งยืน. tsc clean.
  e2e 5/7: the two failures are frozen-spec issues, not product defects —
  (1) card-count assertion runs before the lazy authed page settles
  (snapshot showed 5 settling cards; provable test-timing bug, same class as
  the P003 D2 spec fix); (2) nav-link test assumes top-level dock visibility
  while the dock's default groups put new modules under ทุกโมดูล
  (124×82 px link verified once exposed). Both tests left untouched by Codex
  per the freeze; GLM owns the disposition in D4.
- **D3b→D4 handoff:** per-file ownership of all mutable files transfers back
  to GLM at this entry (single-writer window closed; Codex made no commit).

## D4 — GLM integration battery GREEN (2026-10-14)

- e2e spec corrections (provable test bugs, assertion substance preserved):
  (1) card-count → `toHaveCount(6)` auto-retry (lazy authed settle); (2) nav
  test opens ทุกโมดูล picker first — the truthful path to an unpinned module
  in the floating ModuleDock (Link tile ≥44px verified); (3) test 2 gated on
  the six-card settle before counting UNAVAILABLE states.
- Verified: Playwright chromium **7/7** (ref-matching dev server, dummy anon
  key — no real credentials); vitest full **27 files / 387 tests**;
  `tsc --noEmit` clean; oxlint 0 errors / 12 pre-existing warnings.
- Next: D5 FRESH independent GLM review at the pushed head → expected-head
  merge → D6 deploy + live-marker receipts + closeout.

## D5 + D6 — Review, merge, deploy, live-marker receipts (2026-10-14)

- **D5**: FRESH independent GLM reviewer (separate context; independent of both
  the GLM Track-Z and Codex Track-F authoring runs) returned **VERDICT:
  APPROVED at exact head `245c29ac5fd8e054687f6d53c96f35e4e51ba62e`** —
  truth table, scope, read-only contracts, zero eligibility vocabulary, and
  all three e2e edits diff-verified substance-preserving; 4 non-blocking
  notes (P2 latent waste-branch mislabel unreachable today; 3×P3). Durable
  verdict: PR #121 issuecomment-6160114878.
- **Merge**: PR #121 expected-head merged as **`2df0bcd`** (second parent =
  reviewed `245c29a`; ancestry verified).
- **Exact-main CI**: test SUCCESS (13s); Deploy frontend to GitHub Pages
  SUCCESS (1m29s); E2E smoke SUCCESS (5m3s) — all at `2df0bcd`.
- **D6 live-marker verification (fresh, from the live origin)**: deployed
  index `assets/index-wSPXCzFw.js` carries the ความยั่งยืน nav entry; the
  lazy route chunk `assets/SustainabilityPage-zh7wi_TM.js` contains BOTH
  `sustainability-families` and `tver-readiness` test ids. Verified live at
  closeout time — not inferred from the deploy run alone.
- Worktree `env-wc001-20261013` preserved clean at `245c29a` (fully merged).
  WO obligations satisfied; closure effective when the closeout transition
  merges. Follow-ups recorded for the parent node: P2 waste-subtotal note,
  P3 readiness-union/load-guard alignment, P3 factor-readiness basis,
  P3 known-only-flag pin.
