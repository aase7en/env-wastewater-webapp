# CURRENT WORK

Status: REVIEW_REQUESTED

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

## Review Queue — 2026-08-23

| Order | PR | Verdict | Repository checkpoint |
|---:|---:|---|---|
| 1 | #16 — `WO-STAB-007` | APPROVED and merged | merge `77015d691d2d5a9f20937e582ffb53aa31cad875` |
| 2 | #15 — `WO-UX-SCALE-001` | APPROVED and merged | merge `da3f510535e711c7cdcbd52bca98c3ecea15e2e7` |
| 3 | #14 — Digital Twin foundation | APPROVED and merged | merge `da3b70bdc5338f36c600efb3a3feedea2dee5420` |
| 4 | #21 — `WO-UX-AN-P001` | APPROVED and merged | merge `553247fd38fb210702a18601644a62b86c5d2ee3` |
| 5 | #23 — `DT-VIS-P001` | APPROVED and merged | merge `491ff6dd980e1e3b032b934588baefb9218b1b2b` |
| 6 | #26 — P1 WO proposals | APPROVED and merged; activation decided | merge `e98df9057bd2cbb4ba879371dd82b7164d7da91a` |

PR #14 is approved and merged. Digital Twin visual work orders are now unblocked, subject to each work order's own dependency and user-approval rules in `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`.

## Active Work — P1 Stabilization Queue

Program: `ENV-P1-STABILIZATION`

State: `REVIEW_REQUESTED`

Activation decision: GPT review of PR #26 on 2026-08-24. PR #26 was docs-only and merged as `e98df9057bd2cbb4ba879371dd82b7164d7da91a`.

Execution is **serialized** to reduce review risk even though the owned production files do not overlap:

1. `WO-STAB-009` — annotateRow PHI/provider boundary. Status: `REVIEW_REQUESTED` — PR #29, checkpoint `1fbb33f8703ae1dd0373f039e090d8fa22b3a45a`, all local gates + GitHub CI green, awaiting GPT review. Owner: GLM 5.3. Active source: `docs/work-orders/WO-STAB-009-PROPOSAL.md` (status inside file is ACTIVE). This runs first because it controls external-provider data disclosure. Mandatory GPT amendments: runtime `ai_scope` approval must be intersected with a static per-table safe-field profile; unknown/ambiguous/unmapped scope fails closed; projection/scrubbing occurs before prompt construction; refusal paths send/log no raw row; scope read failure yields zero provider calls.
2. `WO-STAB-006` — alert unread optimistic-count idempotency. Status: `REVIEW_REQUESTED` — serial precondition met (WO-STAB-009 reached `REVIEW_REQUESTED` on PR #29). PR #30, checkpoint `8af33dc070457de03309ae9b30fe84728aad8466`, all local gates green (RED-first: 3 failing tests on the extracted bug, then fix). Owner: GLM 5.3. Active source: `docs/work-orders/WO-STAB-006-PROPOSAL.md` (status inside file is ACTIVE).

Execution contract for both WOs:

- GLM follows the full engineering loop and records durable evidence in repo docs/handoff;
- one WO at a time in the order above;
- each implementation stops at `REVIEW_REQUESTED` with exact HEAD, changed files, RED/GREEN evidence, lint/build/unit/full-Playwright/diff-check results and PR URL;
- GLM must not merge its implementation PR; GPT/reviewer owns final approval/merge;
- `WO-STAB-008`, `DT-VIS-P002/P003`, `UX-FLOW-P001`, `ENV-INT-P001`, Operations, navigation rewrite and external API production work remain **DEFERRED / NOT ACTIVE**.

## Completed Work — Multi-Agent Design Execution

Program: `ENV-NEXT-DESIGN`

State: `APPROVED`

Authoritative execution plan: `docs/ai/design/ENV-NEXT-DESIGN-EXECUTION.md`.

User approval recorded 2026-08-23: continue the design work while preserving the existing Digital Twin as the spatial/visual core, and delegate bounded implementation work to GLM 5.3 where its engineering strengths are appropriate.

### Lane A — Digital Twin visual vertical slice

Work: `DT-VIS-P001` — Site-authentic Aeration Diorama Blockout.

Design spec: `docs/ai/design/DT-VIS-P001-DESIGN-SPEC.md`.

Implementation owner: ChatGPT GPT-5.6 Sol + SunDay-Worker 3 on isolated branch `feature/dt-vis-p001`; final review/merge completed by GPT with SunDay-Worker 5 after Worker 3 transport termination.

Status: `APPROVED / MERGED` — PR #23, merge `491ff6dd980e1e3b032b934588baefb9218b1b2b`.

Goal: continue the existing Aeration Tank 3D direction. Do not replace the Twin with a 2D dashboard. Preserve all data-honesty, accessibility, Process fallback, reduced-motion and WebGL resilience contracts.

### Lane B — GLM 5.3 analytics engineering

Work order: `docs/work-orders/WO-UX-AN-P001-GLM.md`.

Original owner: GLM 5.3; temporarily executed by ChatGPT GPT-5.6 Sol + SunDay-Worker 3.

Status: `APPROVED / MERGED` — PR #21, merge `553247fd38fb210702a18601644a62b86c5d2ee3`.

Goal: build a reusable Situation & Trend presentation kit under `frontend/src/components/analytics/**`, with explicit unknown/stale/source states, Ladle stories and deterministic tests. No production route/data-source/Twin/shared-token changes.

### Historical parallel-safety rule (P001 closed)

Lane A and Lane B may proceed concurrently only within their owned file paths. Each lane writes only its lane-specific handoff under `docs/ai/handoffs/`; the coordinating/reviewer agent owns the shared `docs/ai/HANDOFF.md`. Shared UI/tokens/styles, `DashboardPage.tsx`, routing/navigation, or other cross-lane files require explicit temporary ownership before editing.

### Stop conditions

- Lane A completed the full loop and merged as PR #23 (`491ff6dd980e1e3b032b934588baefb9218b1b2b`).
- Lane B completed the full loop and merged as PR #21 (`553247fd38fb210702a18601644a62b86c5d2ee3`).
- `ENV-NEXT-DESIGN` P001 execution is closed. Do not start Sankey, Hazard Map, Operations board, full navigation rewrite, external API production integration, or the next Digital Twin visual slice without a new active work order / explicit approval.

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

Execute the activated P1 stabilization queue in strict order:

1. GLM 5.3 implements `WO-STAB-009` from `docs/work-orders/WO-STAB-009-PROPOSAL.md`, including all GPT activation amendments, and stops at `REVIEW_REQUESTED` with a PR and full evidence.
2. Only after step 1 reaches `REVIEW_REQUESTED`, GLM 5.3 implements `WO-STAB-006` from `docs/work-orders/WO-STAB-006-PROPOSAL.md` and again stops at `REVIEW_REQUESTED`.

The `ENV-NEXT-DESIGN` program gate remains closed for `DT-VIS-P002`, Sankey, Hazard Map, Operations, navigation, and external API production integration. `WO-STAB-008` also remains deferred.
