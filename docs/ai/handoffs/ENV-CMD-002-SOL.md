# ENV-CMD-002 — GPT-5.6 Sol Implementation Handoff

Status: REVIEW_REQUESTED
Date: 2026-09-02
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-cmd-002`
Branch: `feat/env-cmd-002-overview`
Activation base: `origin/main@51d742104b96ba9a86e218f6b49850ab5115c3b8`
Owner: GPT-5.6 Sol via Serena visual lane

## Objective

Implement the first Hospital Overview command-center vertical slice under the canonical `ENV-CMD-001` contract while preserving current internal data semantics and keeping GLM env-int + Building repair lanes isolated.

## Ownership

Mutable production scope is only `frontend/src/pages/OverviewPage.tsx` plus new focused E2E. `frontend/src/lib/env-int/**`, Building/repair, Overview data/query libs, analytics components, Digital Twin runtime, router/shell/shared UI and schema are no-touch.

## Source reality

- `/` is authenticated and renders `OverviewPage`.
- Overview data remains Water/Energy/Carbon from existing `useOverview()`.
- wastewater primary row is newest in a 14-day query, not automatically current/live;
- `do_average` is derived and must remain labeled average/latest;
- Energy/Carbon public Overview row exposes month, SQL row count (`days`), kWh and tCO2e only;
- no provider/observed-at freshness provenance exists in that public Overview contract;
- TwinCanvas remains lazy under `/dashboard`, not Overview.

## RED → GREEN evidence

- RED before implementation: focused Command Center Playwright **9 failed**.
- First repeated 9-fail outputs were not accepted as app evidence: one run reused another worktree's Vite `:5173`; another fresh-server run lacked Vite Supabase env and failed before React render.
- Correct worktree-specific Vite `:5174`, using process-only values from the existing secure local `.env` without copying/printing them, closed focused E2E to **9/9 PASS**, workers=1, retries=0.
- 360/390/430 hierarchy, no document overflow, >=44px marked actions, scoped latest wastewater status/date, Energy row-count semantics, explicit month periods, attention state, Twin/Process drill-down/no Canvas, domain links, independent-source error and keyboard reachability all passed.
- `tsc -b`: PASS.
- Vitest: **19 files / 248 tests PASS**.
- lint: **12 baseline warnings / 0 errors**.
- production build: PASS, 3305 modules; `TwinCanvas` remains a separate lazy chunk and is not mounted by Overview.
- `git diff --check`: PASS.
- full local Playwright attempt returned connector HTTP 502 before test evidence; classified TOOL/TRANSPORT_FAILURE. Exact-head GitHub E2E/CI must supply full-suite release evidence.
- no real environmental/application writes; all focused browser data is synthetic/mocked.

## Candidate scope

Production mutation is confined to `frontend/src/pages/OverviewPage.tsx`. New verification/continuity files are the focused E2E, this handoff and the work order. GLM `frontend/src/lib/env-int/**`, Building/repair, Overview query/data libs, analytics kit, Twin runtime, router/shell/shared UI and schema remain untouched.

## Stop gate

Do not self-merge. Freeze/push the bounded candidate, audit actual remote diff, obtain fresh exact-SHA Standards + Spec/UX/Data-honesty review, require exact-head CI/E2E, and stop at `REVIEW_REQUESTED` until independent approval.
