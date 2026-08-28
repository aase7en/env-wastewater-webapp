# ENV-MOBILE-003 — Water Supply mobile convergence handoff

Date: 2026-08-28
State: REVIEW_REQUESTED
Owner: GPT-5.6 Sol
Branch: `feat/env-mobile-003-water-supply`
Base: `origin/main@2e70c81b54dc20809c37dbe7a4d6a0e973172d11`
Production checkpoint: `66e86dcb515d411b9e6b858ae89a4109f5ac3bc3`

## Goal

Make the existing Water Supply / groundwater-quality recording page practical on 360–430 px phones without changing its Supabase payload/query/schema/null semantics or inventing compliance rules.

## Source reality / scope

- Actual ENV schema confirms implemented Water Supply quality fields; A-Wiki's `MOD-WS-a pending` line is stale and was not used as production authority.
- `frontend/src/lib/water-supply.ts`, schema/RLS/migrations, thresholds/compliance, shared UI/AppShell, other forms, and Digital Twin were not changed.
- Production page change is limited to `frontend/src/pages/WaterSupplyPage.tsx`; regression coverage is `frontend/tests/e2e/water-supply-mobile.spec.ts`.
- `.serena/` remains protected/untracked and untouched.

## RED baseline

Against unchanged production page at base:

- 360 px first/second form-field x delta: **154 px** — RED versus one phone column.
- Delete target: **~19.125 × 24.797 CSS px** — RED versus project 44×44 minimum.
- Document-level horizontal overflow: PASS / none.
- Existing recent-record table containment: PASS.
- 1024 px multi-column density: PASS.

No table remediation was added because baseline did not prove a table containment defect.

## Implementation

Production checkpoint `66e86dcb515d411b9e6b858ae89a4109f5ac3bc3`:

- form grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`;
- delete action uses existing `--touch-min` for 44×44 minimum plus page-local hover/touch treatment;
- no data/payload/query/schema/business-rule changes.

## Verification

Non-secret test profile:

- `VITE_SUPABASE_URL=https://gllqtbyofrcjzmbnfoeh.supabase.co`
- `VITE_SUPABASE_ANON_KEY=test-anon-key`

Results:

- focused Water Supply Playwright: **7/7 PASS**, retries 0, worker 1;
- full Playwright: **73/73 PASS**, retries 0, workers 2;
- Vitest: **202/202 PASS**;
- typecheck + production build: PASS;
- lint: **12 pre-existing warnings / 0 errors**;
- route/auth smoke: PASS;
- `git diff --check`: PASS;
- screenshots generated under ignored `frontend/test-results/`: 360, 390, 430, 768, 1024;
- Pixel 7 touch path: PASS;
- deterministic first-save failure: error visible, entered pH/chlorine/turbidity/coliform values preserved, retry succeeds;
- retry request body preserves existing field names/numeric/text semantics.

## Residual / deferred items

- No new potable-water thresholds/compliance validation was introduced. Any compliance or legal-limit behavior requires a separate data/business-rule contract and current authoritative source verification.
- Table remains the existing locally-contained table; this slice did not invent a mobile card schema because baseline did not establish a containment defect.
- GitHub Pages direct deep-link behavior is a hosting concern and is reviewed separately during production smoke.

## Final review / merge / deployment closure

- Final reviewed PR #44 head: `5cd8f4aa304812868a669bab614177f8a4525c1b`.
- Independent review: APPROVED; exact production diff limited to Water Supply responsive breakpoint + 44px delete target; data layer/schema/RLS/compliance/shared shell unchanged; focused reviewer rerun 7/7 PASS.
- Merge: `d3034d83954ec8287b9dab561f7802668207d23e`.
- Post-merge exact-SHA runs: test `33150344819`, E2E `33150344767`, Pages `33150344886` — all SUCCESS.
- Deployment: `6137172294` SUCCESS for exact merge SHA.
- Live deployed-bundle 390×844 smoke via Pages root HTTP 200 + client-side `/water-supply`, mocked REST/no real writes: form x-delta 0; save target 71.89×48; delete target 44×44; document overflow false; no console/page errors.

Lane status: COMPLETE. Next eligible domain slice is Fuel after this docs-only closure is merged to main.
