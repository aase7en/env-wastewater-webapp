# UX-FLOW-P001 — Truthful Wastewater Environmental Flow

Status: RE-REVIEW_REQUESTED
Owner / implementer: GPT-5.6 Sol via Serena visual/product lane
Independent review owner: fresh exact-SHA reviewer
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-flow-p001`
Branch: `feat/ux-flow-p001`
Activation base: `origin/main@64f9f89cec1e0abe6b81d50a9bc6f26ecc500098`
Date: 2026-09-02

## Goal

Deliver the first production-accessible wastewater Environmental Flow surface that answers **what quantities are actually known and how the Activated Sludge process is structurally connected** without converting missing quantities, boolean status, process topology, or dummy fixtures into fabricated Sankey values.

## Requirement gate — settled from repository SSoT

- `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` requires a wastewater-first Environmental Flow / Sankey slice and says line width may encode quantity only when period/unit semantics are comparable and truthful.
- `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` is the user-confirmed topology authority. It explicitly separates normal liquid flow, RAS, WAS, drying-bed filtrate return, chlorine dosing, bypass, and emergency overflow, and states that path existence does not prove current flow.
- Existing `FlowDiagramPage.tsx` / `useFlowData()` is an orphan build scaffold: it is not routed by current `App.tsx`; its default producer is dummy data and non-dummy modes throw.
- Current `wastewater.reading` supports daily `water_used_total` (m³), `wastewater_in` (m³), `excess_sludge_removed` (m³), `wastewater_discharged` (boolean) and `reading_date`. There is no verified numeric treated-discharge quantity, RAS quantity, filtrate-return quantity, bypass quantity, or emergency-flow quantity.

No human decision is required for this bounded slice.

## User outcome

Authenticated ENV staff can open `/flow` and immediately distinguish:

1. latest daily quantity evidence that is actually recorded;
2. the structural Activated Sludge path;
3. which branches have no quantity measurement;
4. whether the latest row recorded discharge as yes/no/unknown, without treating the boolean as volume;
5. how to drill back to wastewater operations/history.

## Data-honesty contract

Mandatory:

- latest != live;
- missing != zero;
- path exists != currently flowing;
- `wastewater_discharged` boolean != discharge volume;
- `water_used_total` != `wastewater_in` and no conservation/balance inference is allowed;
- sludge volume is a different medium from water even though both use m³;
- no stage-by-stage quantity may be repeated/inferred from influent;
- no RAS/WAS/filtrate/bypass/emergency quantity may be fabricated;
- dummy fixture data must never appear on the production `/flow` route;
- simulation is out of scope.

## Desired surface

### A. Context / trust header

- title: Environmental Flow / การไหลเชิงสิ่งแวดล้อม;
- latest record reference date in Thai BE;
- explicit label that this is latest daily evidence, not Live;
- error/empty state is local and truthful.

### B. Quantity evidence strip

Three independent evidence cards:

- total hospital water use — `water_used_total`, m³/day evidence;
- wastewater entering treatment — `wastewater_in`, m³/day evidence;
- excess sludge removed — `excess_sludge_removed`, m³/day evidence, medium=sludge.

Missing values render unavailable/—, never 0.

Water use and influent are not connected by a quantified balance edge.

### C. Activated Sludge structural flow

Normal liquid topology:

`influent_collection → pump_sump/screening → aeration → secondary_clarifier → flow_measurement_weir → chlorine_contact → treated_effluent_outfall`

Separate structural branches:

- clarifier → aeration: RAS;
- clarifier → sludge drying beds: WAS;
- sludge drying beds → upstream collection: filtrate return;
- chlorine solution → final-treatment/contact stage: dosing;
- bypass/emergency paths are exception routes and must render `state unknown / quantity unavailable`, not animated as active.

Only the wastewater-entry evidence may be attached to the influent entry point. Do not propagate that number through downstream stages.

### D. Discharge evidence

`wastewater_discharged` is displayed only as:

- recorded yes;
- recorded no;
- unknown/not recorded.

Always pair with `ปริมาณระบาย: ไม่มีข้อมูล` until a real numeric contract exists.

### E. Drill-down

Provide real links to:

- `/dashboard` — Process / Digital Twin;
- `/readings` — history;
- `/form` — record latest operational data.

Expose `/flow` from the current Command Center without a broad AppShell/nav rewrite.

## Responsive / accessibility

- 360/390/430: one-column evidence; structural diagram must recompose/scroll locally without document overflow; no required hover; important actions >=44px.
- tablet/desktop: horizontal process story where useful, with readable labels and structural branch grouping.
- all critical content available as text, not only line position/color.
- keyboard reaches all drill-down links.
- reduced-motion: no motion is required for this slice.

## Mutable scope

Expected bounded scope:

- `frontend/src/pages/FlowDiagramPage.tsx`
- `frontend/src/lib/environmental-flow.ts` (new pure model/query shaping boundary)
- `frontend/src/lib/environmental-flow.test.ts` (new)
- `frontend/src/components/flow/EnvironmentalFlowStory.tsx` (new)
- `frontend/src/App.tsx` — route wiring only
- `frontend/src/pages/OverviewPage.tsx` — one discoverability link only if needed
- `frontend/tests/e2e/environmental-flow.spec.ts` (new)
- this work order + task handoff

If implementation can be smaller, prefer smaller.

## No-touch / forbidden scope

- `frontend/src/lib/env-int/**` / PR #72
- `frontend/src/lib/carbon-rollup*`, `CarbonRollupPage.tsx`, Waste/Carbon migration / PR #76
- Building/Repair files owned by GPT Ultra
- `frontend/src/lib/flow-model.ts` and `frontend/src/lib/use-flow-data.ts` unless a separately reproduced defect requires a bounded change; the new production flow should not depend on dummy producer semantics
- Digital Twin/R3F files
- schema/RLS/migrations
- AppShell/ModuleDock/global nav rewrite
- real hospital/environmental writes
- `.serena/**`

## RED matrix

R1. pure model keeps `water_used_total`, `wastewater_in`, and `excess_sludge_removed` distinct with exact units/medium/source fields.
R2. null/missing quantity remains null/unavailable, never numeric 0.
R3. `wastewater_discharged=true` never produces a discharge quantity.
R4. `wastewater_discharged=false` never produces numeric zero discharge.
R5. structural downstream liquid edges carry no inherited/inferred quantity.
R6. RAS, filtrate, bypass and emergency edges have quantity unavailable.
R7. latest evidence preserves exact `reading_date` and never returns `live` provenance.
R8. `/flow` is authenticated and no longer 404/orphan.
R9. production `/flow` contains no dummy/sample operational value/copy.
R10. page displays latest evidence date and explicit not-Live wording.
R11. missing quantity displays `—` / unavailable, not `0`.
R12. discharge boolean and unavailable discharge-volume message coexist.
R13. 360/390/430 no document overflow; diagram has a usable local boundary/recomposition.
R14. actions >=44px and keyboard reachable.
R15. source error/empty state is truthful and does not fabricate topology quantities.
R16. `/flow` discoverability link exists from the current Command Center without broad nav mutation.

## Verification

- focused pure-model Vitest;
- focused Playwright with synthetic mocked staff/session + mocked REST only;
- TypeScript / `tsc -b`;
- full Vitest;
- oxlint baseline or better;
- production build;
- full applicable Playwright / exact-head CI;
- 360/390/430 + desktop rendered evidence;
- `git diff --check`;
- changed-file + forbidden-scope audit;
- fresh exact-SHA Standards + Spec/UX/Data-honesty review.

## Stop conditions

Stop only for material decision/ownership/safety/dependency blockers or at `REVIEW_REQUESTED` after exact candidate freeze. Implementation owner does not self-merge.

## Implementation / verification checkpoint — 2026-09-02

- Activation base: `64f9f89cec1e0abe6b81d50a9bc6f26ecc500098`; current main integrated cleanly through `6c36ebe4f3b7e6e5106da317d6935d3cd9119340` with no Flow/Carbon overlap.
- RED: focused model test initially failed because the production `environmental-flow` module did not exist.
- GREEN: pure model **11/11 PASS** after null/whitespace/provenance hardening.
- Real browser repair loop: first discharge-evidence browser assertion failed because `AuraCard` does not forward arbitrary DOM props; moved the test id to an owned DOM wrapper, then the single regression passed.
- Final focused Playwright: **9/9 PASS** in CI mode with a non-reused local server, mocked staff/session and mocked REST only. Covers 360/390/430 geometry, source error, empty state, missing values, discharge semantics, structural branches, no dummy copy, discoverability and keyboard reachability.
- TypeScript PASS; changed production files have clean LSP diagnostics.
- Full Vitest after current-main integration: **21 files / 279 tests PASS**.
- oxlint: **12 baseline warnings / 0 errors**; no new Flow warning.
- Production build PASS (3308 modules); existing large-chunk warning only.
- Full local Playwright was attempted but the connector returned HTTP 502 / session termination before a trustworthy completion result. Classified `TOOL/TRANSPORT_FAILURE`; exact-head GitHub E2E is mandatory release authority for the full suite.
- No real environmental/application writes; no schema/RLS/provider/Digital-Twin mutation.
- Candidate diff must remain exactly the 9 owned files listed in the task handoff; `.serena/**` remains protected and unstaged.

## R2 independent-review remediation — 2026-09-02

- Independent exact-SHA review of `806f6992212855ee10cfc97447e15126a5f587fc` returned `CHANGES_REQUIRED` on one material topology finding: the pure Environmental Flow model omitted the user-confirmed chlorine-dosing branch even though the rendered UI hard-coded a dosing card.
- Repair keeps chlorine dosing structural only: `chlorine_solution_storage → chlorine_contact_tank`, `medium=chemical`, `quantity=null`, `unit=null`, `activity=structural`. No dose rate, pump state or active-flow inference is introduced.
- Added pure-model regression pinning the chlorine edge and rendered Playwright assertions for the dosing route + unavailable quantity wording.
- Focused pure-model suite after repair: **12/12 PASS**.
- `npx tsc -b`: PASS.
- First local Playwright attempts hit a stale/misconfigured local server and then a branch server without `VITE_SUPABASE_*`; the app correctly failed fast at module load. Classified `ENVIRONMENT_FAILURE`, not application failure.
- Re-run used a branch-owned Vite server with secure local Supabase config injected process-only (values never printed/persisted) and fully mocked test REST/session. Focused Playwright: **9/9 PASS**.
- Branch will reconcile current `origin/main` before candidate freeze; any main integration or head change requires full relevant verification and a fresh exact-SHA review.
