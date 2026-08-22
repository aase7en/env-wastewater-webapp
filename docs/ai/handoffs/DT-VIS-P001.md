# DT-VIS-P001 Handoff

Status: IMPLEMENTING
Owner: ChatGPT GPT-5.6 Sol + SunDay-Worker 3 (continuing the existing visual branch)

When implementation begins, this lane owns this handoff file. Record:

- branch;
- exact HEAD;
- files changed;
- screenshots/evidence;
- tests/build/lint/diff-check;
- known issues/blockers;
- final lane status (`REVIEW_REQUESTED` or `BLOCKED`).

Analytics Lane B is closed. The coordinator owns shared `docs/ai/CURRENT-WORK.md` and `docs/ai/HANDOFF.md`; this visual lane should continue writing detailed progress here until review.

## Active Implementation State — 2026-08-23

- Branch: `feature/dt-vis-p001`
- Worktree: `A:\GitHub\envww-dt-vis`
- Base: `main@b0e3bc3faf224f096e29fdf4f09fd70d9f9b8113` before Lane B merge; integrate current `main` before opening the visual PR.
- Current local visual work: site-authentic Aeration Tank diorama changes in `frontend/src/components/digital-twin/WastewaterTwin.tsx`.
- Local checks already observed during implementation: TypeScript diagnostics clean after runtime setup, build PASS, lint baseline 12 warnings / 0 errors, focused Twin unit 7/7 PASS, full Vitest 159/159 PASS.
- Still required before review: integrate latest `main`, visual/browser QA, screenshots/evidence, full Playwright E2E, final diff review, lane report, PR and merge decision.
- Analytics Lane B is merged; no production-file overlap remains.

## Loop Engineer Record

### 1. Grill

Constraints accepted from the design spec and current SSoT:

- Digital Twin remains the spatial/visual core; this work may not replace it with a 2D dashboard;
- preserve `latest` vs future `live`, unknown-first telemetry, simulation labeling, Process fallback, reduced motion, and renderer-failure recovery;
- no new treatment stages, external APIs, Supabase/Auth/RLS, `ProcessFlowDiagram.tsx`, Blender/GLTF, or per-aerator telemetry;
- site-authentic cues are limited to the recorded turquoise pipe, red ladder/rail, blue sign, concrete pad, and restrained grass/hedge context;
- visual polish must stay modest enough for mobile/WebGL performance.

### 2. Brainstorm

Chosen direction:

- keep procedural geometry and the existing R3F foundation;
- reshape the generic low basin into a taller concrete Aeration Tank with recognizable site cues;
- use opaque/semi-opaque wastewater teal rather than clear ornamental water;
- remove the generic scene grid so the site pad/context carries the diorama instead;
- use the existing three-quarter camera and only tune shared `TwinCanvas.tsx` for warm daylight, not layout/data behavior;
- capture before/after evidence from the existing foundation screenshot and deterministic Playwright scenarios.

Rejected:

- full campus/background buildings;
- decorative machinery or sci-fi instrumentation;
- transparent water exposing an invented bottom;
- always-on bubble animation when aerator state is unknown;
- adding heavy textures or new 3D dependencies.

### 3. Plan

1. Record temporary shared-file ownership for `TwinCanvas.tsx` limited to lighting/grid presentation.
2. Finish procedural site-authentic geometry in `WastewaterTwin.tsx`.
3. Tune warm daylight and remove the generic grid without changing renderer/data behavior.
4. Add deterministic visual-evidence E2E coverage for desktop light/dark, mobile, simulation, reduced motion, Process, and fallback states.
5. Run focused Twin tests, lint, build, full Vitest, full Playwright, visual evidence capture, and `git diff --check`.
6. Review screenshots/diff, debug findings, update this handoff, commit, push, open PR, wait for CI, review, and merge if clean.

### Temporary shared-file ownership

`frontend/src/components/digital-twin/TwinCanvas.tsx` is temporarily owned by this lane **only for scene lighting/background/grid presentation**. `DashboardPage.tsx`, routing, data contracts, renderer readiness logic, and fallback behavior remain no-touch.
