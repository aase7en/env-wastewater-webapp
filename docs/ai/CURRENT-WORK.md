# CURRENT WORK

Status: RE-REVIEW_REQUESTED

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
| 3 | #14 — Digital Twin foundation | RE-REVIEW_REQUESTED | remediation `2f6311bf4ad9ee9469e81e7db2c42c8e00f9bf37` |

No Digital Twin visual-direction work starts until PR #14 is approved and merged.

## Active Work Order

PR #14 — Digital Twin foundation remediation.

Owner during remediation: ChatGPT Sol MAX + SunDay-Worker 1 temporarily covering GLM 5.3 while GLM is rate-limited.

State: `RE-REVIEW_REQUESTED`

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

## Non-Blocking Follow-up

The rendered top bar is now at least 64px high while `--topbar-h` in `frontend/src/styles/spacing.css` still documents 56px. The token is currently unused. Reconcile or retire it before a future consumer relies on it; do not expand PR #14 scope.

## Next Action

GPT re-review PR #14 at remediation head `2f6311bf4ad9ee9469e81e7db2c42c8e00f9bf37`. Do **not** merge before GPT approval and do not begin Digital Twin visual-direction work yet.
