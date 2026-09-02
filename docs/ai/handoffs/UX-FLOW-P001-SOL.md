# UX-FLOW-P001 — GPT-5.6 Sol Handoff

Status: RE-REVIEW_REQUESTED
Date: 2026-09-02
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-flow-p001`
Branch: `feat/ux-flow-p001`
Activation base: `origin/main@64f9f89cec1e0abe6b81d50a9bc6f26ecc500098`
Integrated main before first freeze: `origin/main@6c36ebe4f3b7e6e5106da317d6935d3cd9119340`
Current main to reconcile before R2 freeze: `origin/main@b6256616216bc0b657fbcf15ff9a5dabde0f321a` (PR #72 merged after independent approval)
Owner / implementer: GPT-5.6 Sol via Serena
Independent review owner: fresh exact-SHA reviewer

## Objective

Build the first truthful wastewater Environmental Flow vertical slice as a production-accessible `/flow` surface without promoting the old dummy P21 scaffold or inventing missing Sankey quantities.

## Settled source reality

- Previous `FlowDiagramPage.tsx` was an orphan scaffold: no `/flow` route existed in `App.tsx`.
- Existing `useFlowData()` uses dummy data and throws for non-dummy modes; it remains untouched and is not used by the production slice.
- User-confirmed Activated Sludge topology is authoritative in `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`.
- Daily wastewater records support `water_used_total` m³, `wastewater_in` m³, `excess_sludge_removed` m³, boolean `wastewater_discharged`, `reading_date`, and `input_source`.
- No verified numeric final-discharge, RAS, filtrate, bypass or emergency-flow quantity exists.

## Implementation

- Added pure `environmental-flow.ts` truth model.
- Added `EnvironmentalFlowStory.tsx` with quantity evidence + structural Activated Sludge story.
- Replaced orphan dummy Flow page with read-only latest-record query using existing `fetchReadings(1)` + `fetchReading(id)` boundaries.
- Added authenticated `/flow` route.
- Added one bounded Command Center discoverability link; no global AppShell/ModuleDock rewrite.
- Missing/blank quantity remains null/`—`; `Number("")` is never allowed to become false zero.
- `wastewater_in` is quantified only at `influent-entry`, never propagated through downstream stages.
- `excess_sludge_removed` attaches only to the WAS branch and remains sludge medium even though the unit is m³.
- `wastewater_discharged` remains yes/no/unknown only; discharge quantity always unavailable.
- RAS/filtrate/bypass/emergency quantities remain unavailable; exception-route activity remains unknown.
- `input_source="manual"` may render `manual-latest`; other/unknown sources render `recorded-latest`. No path emits `live`.
- Production `/flow` contains no dummy/sample operational values.

## RED → GREEN / repair evidence

1. Pure-model RED: focused Vitest failed before implementation because `./environmental-flow` did not exist.
2. Pure-model GREEN after first micro-step: 9/9 PASS.
3. TypeScript then caught `ReadingDetail.reading_date` as optional; model input was relaxed so missing date becomes `asOf=null` rather than fabricated.
4. First real browser run reproduced a UI-contract defect: `flow-discharge-evidence` was not discoverable because `AuraCard` intentionally does not forward arbitrary DOM props. Repaired by moving `data-testid` to an owned DOM wrapper; single regression 1/1 PASS.
5. Deep-bug pass added whitespace quantity and non-manual provenance regressions. Final focused model suite: **11/11 PASS**.
6. Added source-error browser regression so HTTP 500 remains local, quantities stay unavailable, topology remains structural and no dummy copy appears. Final focused browser suite in CI-mode/non-reused server: **9/9 PASS**.

## Verification on current-main-integrated branch

- focused model Vitest: **11/11 PASS**.
- focused Playwright: **9/9 PASS**, `workers=1`, CI mode, synthetic mocked staff/session + mocked REST only.
- mobile: 360/390/430 no document overflow; important actions >=44px; keyboard drill-down links reachable.
- TypeScript / `tsc -b`: PASS.
- LSP diagnostics: clean for `environmental-flow.ts`, `EnvironmentalFlowStory.tsx`, `FlowDiagramPage.tsx`, `App.tsx`, `OverviewPage.tsx`.
- full Vitest after integrating PR #76/main: **21 files / 279 tests PASS**.
- oxlint: **12 existing warnings / 0 errors**, no new Flow warning.
- production build: PASS, 3308 modules; existing large-chunk warning remains baseline. Twin remains separate lazy chunk.
- `git diff --check origin/main...HEAD`: PASS before final evidence-only amendment.
- full local Playwright was attempted twice; connector returned HTTP 502 / worker session termination before a trustworthy completion summary. This is `TOOL/TRANSPORT_FAILURE`, not an application failure. Exact-head GitHub E2E is therefore mandatory release authority for the full suite.
- no real hospital/environmental writes; all Flow browser REST is mocked/synthetic.

## Concurrent ownership at freeze preparation

- GPT Ultra still owns Building/Repair; its worktree contains active docs/live-preflight mutation and remains NO-TOUCH.
- GLM PR #72 remediation advanced to clean exact head `ffbb740f6a5dd4ebf174150b130db11bc83625bc`; independent GPT MAX re-review is required separately.
- ENV-WASTE-CARBON-001A PR #76 was independently reviewed, merged as `6c36ebe4f3b7e6e5106da317d6935d3cd9119340`, exact-main CI/Pages passed, and its merged view migration applied 2/2 OK with read-only live verification. Flow safely integrated that main without conflict.

## Candidate scope

Expected diff against current `origin/main` is exactly 9 owned files:

- `docs/ai/handoffs/UX-FLOW-P001-SOL.md`
- `docs/work-orders/UX-FLOW-P001.md`
- `frontend/src/App.tsx`
- `frontend/src/components/flow/EnvironmentalFlowStory.tsx`
- `frontend/src/lib/environmental-flow.test.ts`
- `frontend/src/lib/environmental-flow.ts`
- `frontend/src/pages/FlowDiagramPage.tsx`
- `frontend/src/pages/OverviewPage.tsx`
- `frontend/tests/e2e/environmental-flow.spec.ts`

Forbidden/no-touch remains: `frontend/src/lib/env-int/**`, Building/Repair, Carbon rollup/migrations, old `flow-model.ts` / `use-flow-data.ts`, Digital Twin/R3F, AppShell/ModuleDock, schema/RLS and `.serena/**`.

## R2 independent-review remediation

- Independent reviewer bound to exact SHA `806f6992212855ee10cfc97447e15126a5f587fc` and recorded `CHANGES_REQUIRED` on PR #77.
- Finding: the pure model omitted chlorine dosing although the user-confirmed topology requires it as a separate graph edge/state; the component only hard-coded a text card, leaving model/UI drift possible.
- Repair: add `chlorine-dosing` edge from `chlorine_solution_storage` to `chlorine_contact_tank` using `medium=chemical`, structural activity and unavailable quantity/unit. No chlorine dose, pump state, flow rate or Live state is inferred.
- Regression: pure model now pins this edge; focused suite **12/12 PASS**. Rendered E2E pins Chlorine dosing route and unavailable quantity text; focused browser suite **9/9 PASS** on a branch-owned Vite server with process-only secure config and mocked REST/session.
- Local 9/9 failures before that successful run were root-caused to missing `VITE_SUPABASE_*` on a fresh branch server (module-load fail-fast) / stale dev-server reuse; classified `ENVIRONMENT_FAILURE`, not application failure.
- PR #72 provenance core was independently approved and merged as main `b6256616216bc0b657fbcf15ff9a5dabde0f321a`; Flow must integrate that file-disjoint main before candidate freeze.

## Review gate

Freeze a new exact SHA after current-main integration and verification, push it, verify actual remote diff, then perform fresh detached exact-SHA Standards + Spec/UX/Data-honesty review. Any finding requires repair → NEW SHA → review again. Implementation owner does not self-merge.
