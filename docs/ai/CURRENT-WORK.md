# CURRENT WORK

Status: READY_FOR_IMPLEMENTATION

Allowed statuses:

- IDLE
- DESIGNING
- READY_FOR_IMPLEMENTATION
- IMPLEMENTING
- REVIEW_REQUESTED
- CHANGES_REQUIRED
- RE-REVIEW_REQUESTED
- APPROVED
- BLOCKED

> `CURRENT-WORK.md` is the authoritative task definition. Agents must not silently expand task scope.

## Review Queue — 2026-08-22

| Order | PR | Verdict | Repository checkpoint |
|---:|---:|---|---|
| 1 | #16 — `WO-STAB-007` | APPROVED and merged | merge `77015d691d2d5a9f20937e582ffb53aa31cad875` |
| 2 | #15 — `WO-UX-SCALE-001` | APPROVED and merged | merge `da3f510535e711c7cdcbd52bca98c3ecea15e2e7` |
| 3 | #14 — Digital Twin foundation | APPROVED and merged | merge `da3b70bdc5338f36c600efb3a3feedea2dee5420` |

PR #14 is approved and merged. Digital Twin visual work orders are now unblocked, subject to each work order's own dependency and user-approval rules in `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`.

## Active Work — Multi-Agent Design Execution

Program: `ENV-NEXT-DESIGN`

State: `READY_FOR_IMPLEMENTATION`

Authoritative execution plan: `docs/ai/design/ENV-NEXT-DESIGN-EXECUTION.md`.

User approval recorded 2026-08-23: continue the design work while preserving the existing Digital Twin as the spatial/visual core, and delegate bounded implementation work to GLM 5.3 where its engineering strengths are appropriate.

### Lane A — Digital Twin visual vertical slice

Work: `DT-VIS-P001` — Site-authentic Aeration Diorama Blockout.

Design spec: `docs/ai/design/DT-VIS-P001-DESIGN-SPEC.md`.

Owner: GPT/Codex visual engineer; one writer at a time.

Status: `READY`.

Goal: continue the existing Aeration Tank 3D direction. Do not replace the Twin with a 2D dashboard. Preserve all data-honesty, accessibility, Process fallback, reduced-motion and WebGL resilience contracts.

### Lane B — GLM 5.3 analytics engineering

Work order: `docs/work-orders/WO-UX-AN-P001-GLM.md`.

Owner: GLM 5.3.

Status: `READY_FOR_IMPLEMENTATION`.

Goal: build a reusable Situation & Trend presentation kit under `frontend/src/components/analytics/**`, with explicit unknown/stale/source states, Ladle stories and deterministic tests. No production route/data-source/Twin/shared-token changes.

### Parallel-safety rule

Lane A and Lane B may proceed concurrently only within their owned file paths. Each lane writes only its lane-specific handoff under `docs/ai/handoffs/`; the coordinating/reviewer agent owns the shared `docs/ai/HANDOFF.md`. Shared UI/tokens/styles, `DashboardPage.tsx`, routing/navigation, or other cross-lane files require explicit temporary ownership before editing.

### Stop conditions

- Lane A stops at visual `REVIEW_REQUESTED` with screenshots and full required gates.
- Lane B stops at `REVIEW_REQUESTED` with focused tests, lint/build/unit evidence and exact HEAD.
- Neither lane may start Sankey, Hazard Map, Operations board, full navigation rewrite, or external API production integration without a new active work order.

## Completed Foundation Context

PR #14 — Digital Twin foundation remediation is complete and approved.

## Main Integration

- Current `main` integrated before remediation: `7d73814782f8475731d886f6826da5bc9af36c11`.
- Merge commit on PR #14 branch: `113a68e`.
- Coordination conflicts were limited to `docs/ai/CURRENT-WORK.md` and `docs/ai/HANDOFF.md` and were resolved toward the latest `main` state as required.
- Untracked `.serena/`, `frontend/shot-process.png`, and `frontend/shot-twin.png` were not staged, removed, reset, or cleaned.

## Four Reviewer Findings Remediated

1. **Aeration DO semantics**
   - `DashboardRow.do_average` is no longer mapped to `AerationTankTwinAsset.dissolvedOxygenMgL`.
   - Aeration DO remains `unavailable`/unknown until a truthful tank-specific source exists.
   - `tds_aeration` remains a truthful manual snapshot metric.

2. **`latest` vs `live` contract**
   - `TwinMode` now includes `latest`.
   - Zustand initial mode and `returnToLatest()` use `latest`.
   - Dashboard-row mapping defaults to `latest`; manual rows cannot be emitted as `live` by the dashboard adapter/selector.
   - `live` remains reserved for future real sensor telemetry; no realtime polling was added.

3. **Real renderer-init failure coverage**
   - WebGL capability detection is cached so React StrictMode does not create/lose a second probe context during development double initialization.
   - The actual R3F renderer canvas is explicitly marked before `new WebGLRenderer(...)`.
   - Playwright now fails WebGL only on that connected renderer canvas, asserts the renderer-init path was reached, then verifies the Thai fallback and Process recovery.
   - Existing unsupported-WebGL and context-loss tests remain intact.

4. **Mouse/touch Process → 3D readiness reset**
   - Both tab click handlers now route through `selectDashboardView()` just like keyboard/fallback navigation.
   - E2E coverage records panel attribute mutations and proves the first visible re-entry state is `loading`, followed by `ready` only after the remounted scene frame.

## RED / GREEN Evidence

Before production remediation:

- `dashboard-adapter.test.ts`: 3 RED — manual snapshot still `live`, live-mode dashboard row remained `live`, and `returnToLatest()` returned `live`.
- `digital-twin.spec.ts`: 3 RED — plant-wide `4.50 mg/L` still appeared as Aeration DO, click re-entry exposed stale `ready`, and renderer-init test did not reach the marked R3F renderer path.

After remediation:

- focused twin unit suite: **7/7 passed**.
- focused Digital Twin Playwright: **7/7 passed** with `--retries=0`.
- readiness focused check: **1/1 passed** with `--retries=0`.

## Full Gates

- `npm run lint`: **PASS — 12 warnings, 0 errors** (baseline or better; no new remediation finding).
- `npm run build`: **PASS**.
- `npm test -- --run`: **159/159 PASS**.
- full Playwright: **44/44 PASS**.
- `git diff --check`: **PASS**.
- GitHub PR #14 at remediation head `2f6311b`: `smoke`, `scripts`, and both `notify` checks **SUCCESS**.
- GitHub merge state at remediation head: **CLEAN**.

## Guardrails Preserved

- No Supabase schema/Auth/RLS changes.
- No ProcessFlowDiagram implementation changes.
- No realtime polling.
- No visual-direction/Blender/GLTF expansion.
- Unknown telemetry remains unknown.
- React Query/Supabase remains telemetry source of truth; manual/live source data was not moved into Zustand.

## GPT Re-Review Verdict — APPROVED

Re-reviewed PR #14 at head `47d3ae0c3d747c12de005e1b55e7ecbbe58a74f3`, including remediation commit `2f6311bf4ad9ee9469e81e7db2c42c8e00f9bf37`.

Verified against the actual diff:

- plant-wide `do_average` is no longer represented as direct Aeration Tank DO;
- manual/dashboard snapshots use `latest`, while `live` remains reserved for future sensor telemetry;
- renderer-init coverage reaches the marked R3F renderer canvas after the capability probe and verifies fallback/recovery;
- Process → 3D click re-entry resets readiness to `loading` before returning to `ready`;
- `main@7d73814782f8475731d886f6826da5bc9af36c11` is an ancestor of the reviewed branch;
- PR was mergeable and GitHub `smoke`, `scripts`, and `notify` checks were green.

PR #14 merged as `da3b70bdc5338f36c600efb3a3feedea2dee5420`.

## Non-Blocking Follow-up

The rendered top bar is now at least 64px high while `--topbar-h` in `frontend/src/styles/spacing.css` still documents 56px. The token is currently unused. Reconcile or retire it before a future consumer relies on it; do not expand PR #14 scope.

## Next Action

Run the two approved lanes from `docs/ai/design/ENV-NEXT-DESIGN-EXECUTION.md` without file overlap:

- Lane A: visual engineer implements `DT-VIS-P001` from `docs/ai/design/DT-VIS-P001-DESIGN-SPEC.md`.
- Lane B: GLM 5.3 implements `docs/work-orders/WO-UX-AN-P001-GLM.md`.

Both stop at their review gates. Do not automatically start Sankey, Hazard Map, Operations, or navigation work afterward.
