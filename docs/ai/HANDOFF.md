# HANDOFF

Status: RE-REVIEW_REQUESTED — PR #14 remediation pushed; GitHub CI green and merge state CLEAN; GPT re-review next.

## Repo State — 2026-08-22

Repository/worktree:

`A:\GitHub\envww-twin-preview`

Branch:

`feature/digital-twin-integration`

Reviewed findings checkpoint before remediation:

`fc9023020bd2fc09e1bab2138153f44ab3f11978`

Current `main` integrated before remediation:

`7d73814782f8475731d886f6826da5bc9af36c11`

Main-integration merge commit on this branch:

`113a68e`

Remediation head pushed to PR #14:

`2f6311bf4ad9ee9469e81e7db2c42c8e00f9bf37`

Untracked files intentionally preserved and never staged/cleaned:

- `.serena/`
- `frontend/shot-process.png`
- `frontend/shot-twin.png`

## Completed Queue Before PR #14

- PR #16 — `WO-STAB-007`: APPROVED / MERGED at `77015d691d2d5a9f20937e582ffb53aa31cad875`.
- PR #15 — `WO-UX-SCALE-001`: APPROVED / MERGED at `da3f510535e711c7cdcbd52bca98c3ecea15e2e7`.

## PR #14 Remediation Completed

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

GPT re-review PR #14 at head `2f6311bf4ad9ee9469e81e7db2c42c8e00f9bf37`. STOP at `RE-REVIEW_REQUESTED`; do **not** merge PR #14 until GPT approves it, and do not begin Digital Twin visual-direction work yet.
