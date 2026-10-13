# ENV-WASTE-CARBON-001 — Integrated Waste/Plastic/Carbon/T-VER View (Work Order, C1 slice)

Claim: `ENV-WASTE-CARBON-001-C1` (generation 1) · Status at activation: CLAIMED
Authoring lane: GLM-5.3 MAX (claim coordination, D1 contracts, D2 RED-first tests, D4 integration) · D3 implementation model: **BLOCKED-UNTIL-ADMISSION** (see below)
Base main at transition authoring: `4e65bc1d5b92f35b5f3e8434969cc02546ed9556`

## Objective

Deliver the parent roadmap node's first bounded slice (M3): a truthful
**integrated sustainability view** presenting waste categories, emissions by
source family, and T-VER **evidence readiness** — built strictly on the
delivered 001A contracts. Grounding dependency (satisfied): the A–K
requirement-gate inventory in `docs/work-orders/ENV-WASTE-CARBON-001A.md`
(5 source families; ONLY electricity contributes rows today — 907; fuel/
garden/garbage/chemical are 0-row; plastic detail exists only as
GARBAGE-CORE-001 `segregation_type` semantics).

## Binding data-honesty contracts (from A–K + the delivered 001A rollup)

- Present each of the 5 source families with its truthful state: CONTRIBUTING
  (electricity, with rollup numbers via the existing `useCarbonRollup`
  contract) or **UNAVAILABLE/ไม่มีข้อมูล** (0-row families — never 0.000).
- `hasUnavailableContribution`/`unavailableSources` semantics reused
  read-only; no new aggregation, no new inference, no invented factors.
- **T-VER: evidence-readiness framing ONLY** — describe which documented
  inputs exist vs absent (e.g., waste composition, factor provenance); NEVER
  render eligibility, status, credit estimates, or registration progress.
  Missing evidence stays explicitly UNAVAILABLE.
- Waste categories: only the GARBAGE-CORE-001 canonical segregation semantics;
  no plastic-weight estimates beyond recorded data.
- **Plastic = ABSENT/UNAVAILABLE, explicitly.** Per the delivered 001A
  contract (A–K; waste_recyclable must never be relabeled as plastic), NO
  plastic category/mass/unit/factor/mapping exists anywhere. The view must
  render Plastic as ไม่มีข้อมูล/ABSENT and D2 RED tests must pin that state;
  relabeling any segregation value as "plastic" is a defect.
- LIVE/LATEST/HISTORICAL/SIMULATED/STALE/UNAVAILABLE badges where a temporal
  claim is made; color secondary. Thai labels; พ.ศ. dates; unknown ≠ zero.

## Scope (mutable, exactly — identical to the registry claim entry)

- `frontend/src/pages/SustainabilityPage.tsx` (new; route `/sustainability`)
- `frontend/src/lib/sustainability/**` (new; read-only contract over existing rollup/garbage data)
- `frontend/src/App.tsx` (route wiring only) · `frontend/src/components/layout/AppShell.tsx` (nav entry for `/sustainability` only — NAV lives there; no other shell changes)
- `frontend/tests/e2e/sustainability.spec.ts` (new)
- `docs/work-orders/ENV-WASTE-CARBON-001.md` (this file), `docs/ai/handoffs/ENV-WASTE-CARBON-001-GLM.md`

Forbidden: everything else — notably carbon-rollup lib/tests (READ-ONLY
dependency), GarbagePage/GARBAGE-CORE semantics, Operations/Building/Twin
surfaces, `docs/ai/CURRENT-WORK.md`, guard/autonomy scripts, `data/**`, `.env`.

## Owner split & D3 gate

- GLM-5.3 MAX: D1 (pin the exact nav/route file + contract shapes), D2
  RED-first tests, D4 integration battery, handoff receipts.
- **D3 implementation dispatch: BLOCKED-UNTIL-ADMISSION.** The PR-#114 owner
  authorization designated `gpt-6-sol` @ max **for DT-VIS-P003-C1 only**; it
  does not transfer to this lane. D3 proceeds only after (a) an explicit
  owner authorization names the implementation model for THIS Work Order
  (one-line steer + reviewed transition per the PR-#114 pattern), or (b) an
  admitted default per routing rules emerges. `gpt-5.6-sol` remains
  R3-REVIEW-ONLY. Until then the claim parks in registry `BLOCKED` after D2.
- Single-writer rule during any D3 window (Codex sole writer of ALL mutable
  files); GLM resumes at the recorded D3→D4 handoff.

## Dispatch-exception risk record

Autonomous production dispatch remains `BOOTSTRAP_CONTROL` / `AUTONOMY_NOT_READY`
/ `ENFORCEMENT_NOT_ACTIVE` (truthful). Lane proceeds under the owner-authorized
continuation steer (2026-10-12: continue the roadmap on non-Building lanes).
Admission evidence policy: once per materially changed fingerprint; recorded
2026-10-12 evidence: gpt-6.1-sol → HTTP 400 entitlement; gpt-5.6-sol admitted
(R3-review-only). Compensating controls: RED-first tests; full battery
(tsc/oxlint/vitest/playwright — twin/e2e needs the ref-matching dev-server
URL per the P003 D4 lesson); fresh-context independent exact-SHA review;
expected-head merge; post-main CI/deploy + deployed-marker check; bounded
registry scope.

## D-plan

D1 — GLM: pin the exact nav/route file, the read-only data contracts
(rollup hook + garbage segregation + emission-factor provenance fields), and
the truth-table for family states + T-VER readiness items.
D2 — GLM: RED-first tests (unit contract + Playwright: family states, ไม่มีข้อมูล
never 0.000, T-VER readiness list without eligibility, badges, a11y 44px,
360px no-overflow).
D3 — implementation dispatch per the gate above.
D4 — GLM battery + receipts. D5 — fresh independent review (GLM if Codex
implements; cross-model vs author; never author-and-approve). D6 — expected-
head merge, post-main CI/deploy/smoke, board/roadmap status update, closeout
transition.

## Acceptance

- The page truthfully answers "คาร์บอน/ขยะอะไรบ้างที่มีข้อมูลจริง" with 1
  contributing family + 4 explicit UNAVAILABLE states; T-VER section is
  readiness-only; **Plastic renders ABSENT/ไม่มีข้อมูล (pinned by RED tests;
  no segregation value relabeled as plastic)**; all numbers trace to delivered
  contracts; no horizontal
  overflow at 360px; a11y floors met; all RED tests green at the reviewed head.
