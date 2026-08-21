# CURRENT WORK

Status: CHANGES_REQUIRED

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

## Work Order

`WO-TWIN-INTEGRATE-001`

Owner: GLM 5.3 — Core Engineering / integration

PR: #14

Reviewed checkpoint: `36a895e68742c57e34b9354798d2fc5497d90596`

## Reviewer Verdict

`CHANGES_REQUIRED`

The Phase 1 renderer structure, Zustand boundary, explicit demo labeling, unknown water/aerator values, lazy loading, Process fallback and reduced-motion path are sound in principle. The following data-contract, readiness-test and integration issues block merge.

## Required Remediation

### 1. Do not present plant-wide `do_average` as Aeration Tank DO

`wastewater.v_dashboard_14day.do_average` is produced by `fn_do_average(do_aeration, do_sedimentation, do_before_discharge)`. It is a derived plant-wide average, not the Aeration Tank observation. `dashboard-adapter.ts` currently assigns it to `AerationTankTwinAsset.dissolvedOxygenMgL` and marks it as a direct manual snapshot; the data panel then labels it simply `DO` under the Aeration asset.

Required result:

- Do not map `DashboardRow.do_average` to an Aeration Tank DO metric with direct/manual provenance.
- Without changing the Supabase schema, either leave Aeration DO unavailable or model the value separately and label it explicitly as a plant-wide derived average with truthful derived provenance.
- Preserve unknown-first behavior and add regression tests proving the corrected semantic and provenance.

Relevant files:

- `frontend/src/lib/twin/dashboard-adapter.ts`
- `frontend/src/lib/twin/types.ts`
- `frontend/src/lib/twin/dashboard-adapter.test.ts`
- presentation labels only where required to consume the corrected contract
- reference definition: `supabase/migrations/20260718000000_p12_frontend_views.sql`

Do not change the Supabase schema or query raw records from the renderer.

### 2. Reserve `live` mode for actual realtime telemetry

Manual daily dashboard rows currently enter the domain as mode `live`; `returnToLatest()` also sets `live`. Hiding the word LIVE in the UI is not sufficient because the shared contract itself misclassifies latest manual data.

Required result:

- Add/use a `latest` mode for the current manual snapshot.
- Keep `live` available only for future actual realtime sensor telemetry.
- Keep `historical` and `simulation` behavior distinct.
- Update selectors, store actions/names, tests and UI branching without adding realtime polling.

Relevant files:

- `frontend/src/lib/twin/types.ts`
- `frontend/src/lib/twin/store.ts`
- `frontend/src/lib/twin/dashboard-adapter.ts`
- `frontend/src/lib/twin/selectors.ts`
- twin unit and E2E tests

### 3. Test the real renderer-initialization failure path

The Playwright test named `falls back when renderer initialization fails` permits WebGL only for the first distinct canvas. In React StrictMode, the side-effectful `supportsWebGL()` state initializer can run twice, so the second capability probe can fail before R3F reaches the `WebGLRenderer` factory. The test therefore does not establish that an actual renderer-construction failure reaches the Thai fallback.

Required result:

- Make capability detection safe/deterministic under StrictMode.
- Force failure only when the connected R3F canvas initializes (or use an equally explicit test seam), while allowing the capability probe to succeed.
- Assert that the renderer-init path was reached and that Dashboard/Process remain usable.
- Do not skip or weaken the existing unsupported-WebGL and context-loss coverage.

### 4. Reset readiness for mouse/touch re-entry to 3D

`selectDashboardView()` resets the status to `loading`, but the two tab click handlers call `setDashboardView()` directly. After switching 3D → Process → 3D, `data-twin-status` can retain stale `ready` before the remounted Canvas renders a frame.

Required result:

- Route click/touch tab changes through the same readiness-reset path as keyboard/fallback navigation.
- Add deterministic coverage for Process → 3D re-entry and prove `ready` is emitted only after the new scene frame.

Relevant file:

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/tests/e2e/digital-twin.spec.ts`

### 5. Reconcile the PR with current `main` before re-review

The reviewed head no longer merges cleanly. `git merge-tree` reports conflicts in:

- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`

PR #15 is also ahead in the required merge queue and is currently under remediation. After #15 is approved and merged, integrate the then-current `main` once, preserve the latest repo-wide handoff/queue, and record this Twin remediation without restoring stale WO-STAB-005 instructions.

## Scope Guardrails

- No Supabase schema, Auth or RLS changes.
- No ProcessFlowDiagram implementation changes.
- No Blender/GLTF, new treatment stages, historical UI, realtime polling or visual polish.
- React Query/Supabase remains the telemetry source of truth; do not move live/manual snapshots into Zustand.

## Verification Required

- `npm run build`
- `npm run lint` against the documented baseline
- `npm test`
- full Playwright suite, including genuine renderer-init failure and 3D re-entry readiness
- `git diff --check`
- confirm the final PR is mergeable against current `main`

## Next Action

GLM 5.3: remediate only the findings above, preserve the approved Phase 1 behavior, integrate current `main` after PR #15 lands, update `HANDOFF.md` and this file to `RE-REVIEW_REQUESTED`, push PR #14, then stop for GPT re-review. Do not merge.
