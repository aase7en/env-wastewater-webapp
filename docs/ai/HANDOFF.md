# HANDOFF

Status: IMPLEMENTING — Analytics Lane B completed and merged as PR #21; Digital Twin Lane A is the only active implementation lane.

## Active Design Execution — 2026-08-23

User approved continuation of design work while preserving the existing Digital Twin as the spatial/visual core.

Authoritative execution plan: `docs/ai/design/ENV-NEXT-DESIGN-EXECUTION.md`.

### Lane A — Digital Twin visual

- Work: `DT-VIS-P001`
- Spec: `docs/ai/design/DT-VIS-P001-DESIGN-SPEC.md`
- Owner: ChatGPT GPT-5.6 Sol + SunDay-Worker 3 on `feature/dt-vis-p001`; one writer at a time
- Status: IMPLEMENTING
- Scope: site-authentic Aeration Tank diorama only; no new treatment stages or data semantics

### Lane B — GLM 5.3

- Work order: `docs/work-orders/WO-UX-AN-P001-GLM.md`
- Original owner: GLM 5.3; temporary executor: ChatGPT GPT-5.6 Sol + SunDay-Worker 3
- Status: APPROVED / MERGED
- PR: #21
- Merge: `553247fd38fb210702a18601644a62b86c5d2ee3`
- Result: reusable `frontend/src/components/analytics/**` situation/provenance/chart-frame kit with Ladle stories and deterministic tests; no production route wiring

Lane B is closed. Lane A remains isolated from analytics code and is the only active implementation lane. Any need for shared files still requires explicit ownership handoff.

## Repo State — 2026-08-23

Current authoritative branch: `main`.

PR #14 final reviewed head:

`47d3ae0c3d747c12de005e1b55e7ecbbe58a74f3`

Remediation commit:

`2f6311bf4ad9ee9469e81e7db2c42c8e00f9bf37`

PR #14 merge commit on `main`:

`da3b70bdc5338f36c600efb3a3feedea2dee5420`

The reviewed branch had integrated `main@7d73814782f8475731d886f6826da5bc9af36c11` through merge `113a68e` before remediation. The primary worktree's unrelated untracked user files were not staged, deleted, reset, or cleaned during review/merge.

## Completed Queue Before PR #14

- PR #16 — `WO-STAB-007`: APPROVED / MERGED at `77015d691d2d5a9f20937e582ffb53aa31cad875`.
- PR #15 — `WO-UX-SCALE-001`: APPROVED / MERGED at `da3f510535e711c7cdcbd52bca98c3ecea15e2e7`.

## PR #14 Remediation Completed and Approved

### 1. Truthful Aeration DO contract

`DashboardRow.do_average` is the derived plant-wide average of multiple DO points. It is no longer mapped into the Aeration Tank's direct `dissolvedOxygenMgL` metric.

Result:

- Aeration DO = unavailable/unknown without a tank-specific source.
- No false direct/manual provenance.
- `tds_aeration` remains mapped as a manual daily snapshot.

### 2. `latest` reserved for manual current snapshot

- Added `latest` to `TwinMode`.
- Store initial mode = `latest`.
- `returnToLatest()` returns to `latest`.
- Dashboard-row adapter only emits `latest` or `historical`; the selector coerces dashboard-row `live` requests to `latest`.
- `live` remains available only for future actual sensor telemetry.
- No realtime polling/source was added.

### 3. Genuine R3F renderer-init failure path

- `supportsWebGL()` now caches its browser result, preventing React StrictMode double initialization from creating/losing a second capability-probe context.
- `TwinCanvas` marks the actual connected R3F canvas before `new WebGLRenderer(...)`.
- Playwright forces failure only on that marked canvas and asserts the renderer-init path was reached.
- Thai fallback and Process navigation remain usable.
- Unsupported-WebGL and context-loss coverage remains present.

### 4. Process → 3D click readiness reset

- Both tab click handlers use `selectDashboardView()`.
- Mouse/click re-entry now resets parent renderer status to `loading` in the same transition that remounts the 3D panel.
- E2E MutationObserver coverage proves the first visible re-entry state is `loading`, followed by `ready` after the new scene frame.

### 5. Main integration

- Integrated `main@7d738147...` before code remediation.
- Merge preview found conflicts only in `docs/ai/CURRENT-WORK.md` and `docs/ai/HANDOFF.md`.
- Those conflicts were resolved toward latest `main`, as required by the prior handoff.
- No production-code merge conflict occurred.

## RED Evidence

Before production fixes:

- Twin unit contract: **3 failed / 4 passed**.
  - default manual state returned `live` instead of `latest`;
  - explicit dashboard-row `live` request remained `live`;
  - `returnToLatest()` returned `live`.
- Digital Twin E2E: **3 failed / 4 passed**.
  - derived `4.50 mg/L` still appeared as Aeration DO;
  - Process → 3D click returned stale `ready` instead of `loading`;
  - renderer-init failure test never reached the marked R3F canvas and stayed `ready`.

## GREEN / Full Verification

Focused:

- `dashboard-adapter.test.ts`: **7/7 PASS**.
- Digital Twin Playwright with `--retries=0`: **7/7 PASS**.
- readiness re-entry focused test: **1/1 PASS**.

Full gates:

- lint: **PASS — 12 warnings, 0 errors**.
- build: **PASS**.
- Vitest: **159/159 PASS**.
- Playwright: **44/44 PASS**.
- `git diff --check`: **PASS**.
- GitHub PR #14 at `2f6311b`: `smoke`, `scripts`, and both `notify` checks **SUCCESS**.
- GitHub merge state: **CLEAN**.

## GPT Re-Review Verdict

`APPROVED`.

Reviewer verified all four recorded findings against the actual remediation diff at `2f6311bf4ad9ee9469e81e7db2c42c8e00f9bf37`, confirmed `main@7d73814782f8475731d886f6826da5bc9af36c11` is an ancestor of the branch, and confirmed GitHub `smoke`, `scripts`, and `notify` checks were green with the PR mergeable.

PR #14 was merged as:

`da3b70bdc5338f36c600efb3a3feedea2dee5420`

The Digital Twin foundation review gate is closed. No additional GPT foundation decision is pending.

## Files Intentionally Changed by Remediation

- `frontend/src/components/digital-twin/TwinCanvas.tsx`
- `frontend/src/lib/twin/dashboard-adapter.test.ts`
- `frontend/src/lib/twin/dashboard-adapter.ts`
- `frontend/src/lib/twin/selectors.ts`
- `frontend/src/lib/twin/store.ts`
- `frontend/src/lib/twin/types.ts`
- `frontend/src/lib/twin/webgl.ts`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/tests/e2e/digital-twin.spec.ts`
- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`

## Guardrails

- No schema/Auth/RLS changes.
- No ProcessFlowDiagram implementation changes.
- No historical-UI expansion.
- No realtime polling.
- No Digital Twin visual-direction, Blender/GLTF or new-stage work.
- Unknown telemetry remains unknown.
- Do not stage/delete/reset the untracked files listed above.

## Next Action

Follow `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md` for the visual lane. The foundation dependency is now satisfied. `DT-VIS-P001` still carries its own explicit user-approval requirement on the board; no further GPT foundation decision is pending.
