# HANDOFF

Status: READY_FOR_IMPLEMENTATION — GPT activated the remaining GLM-safe P1 stabilization queue after reviewing and merging PR #26. Execute WO-STAB-009 first, then WO-STAB-006; all other candidate lanes remain inactive.

## Active P1 Stabilization Queue — 2026-08-24

Decision source: GPT review of PR #26 (`e98df9057bd2cbb4ba879371dd82b7164d7da91a`).

### 1. WO-STAB-009 — PHI/provider boundary

- Decision: **ACTIVATE WITH AMENDMENTS**.
- Owner: GLM 5.3.
- Status: READY_FOR_IMPLEMENTATION.
- Work-order source: `docs/work-orders/WO-STAB-009-PROPOSAL.md` (now marked ACTIVE).
- Priority rationale: this is an external-provider disclosure boundary and therefore runs before the badge-count bug.
- Mandatory boundary: effective authorization = runtime `core.ai_scope` (`patient_safe=true`, `is_enabled=true`) **AND** a static explicit per-table safe-field profile. Runtime/admin toggles alone cannot widen row payloads.
- Unknown, ambiguous, unmapped, disabled or unreadable scope fails closed with zero provider calls. Do not use `STATIC_PHI_DENY` as a positive-allowlist fallback.
- Project safe fields before prompt construction; unknown fields omitted; scrub projected string values as defense-in-depth; refusal/error paths must not include/log raw row content.
- GLM stops at REVIEW_REQUESTED; GPT performs final review/merge.

### 2. WO-STAB-006 — unread optimistic count

- Decision: **ACTIVATE**.
- Owner: GLM 5.3.
- Status: READY_FOR_IMPLEMENTATION, serialized behind WO-STAB-009.
- Work-order source: `docs/work-orders/WO-STAB-006-PROPOSAL.md` (now marked ACTIVE).
- Prefer one pure optimistic-cache transform so row flip and unread decrement share one `wasUnread` decision.
- Do not start until WO-STAB-009 reaches REVIEW_REQUESTED.
- GLM stops at REVIEW_REQUESTED; GPT performs final review/merge.

Deferred: WO-STAB-008 and all program-level visual/external lanes (`DT-VIS-P002/P003`, `UX-FLOW-P001`, `ENV-INT-P001`, Operations, navigation rewrite, external API production integration).

## Completed Design Execution — 2026-08-23

User approved continuation of design work while preserving the existing Digital Twin as the spatial/visual core.

Authoritative execution plan: `docs/ai/design/ENV-NEXT-DESIGN-EXECUTION.md`.

### Lane A — Digital Twin visual

- Work: `DT-VIS-P001`
- Spec: `docs/ai/design/DT-VIS-P001-DESIGN-SPEC.md`
- Implementation owner: ChatGPT GPT-5.6 Sol + SunDay-Worker 3; final review/merge completed with SunDay-Worker 5 after Worker 3 transport termination
- Status: APPROVED / MERGED
- PR: #23
- Merge: `491ff6dd980e1e3b032b934588baefb9218b1b2b`
- Result: site-authentic Aeration Tank diorama slice with visual acceptance E2E and screenshot evidence; no new treatment stages or data semantics

### Lane B — GLM 5.3

- Work order: `docs/work-orders/WO-UX-AN-P001-GLM.md`
- Original owner: GLM 5.3; temporary executor: ChatGPT GPT-5.6 Sol + SunDay-Worker 3
- Status: APPROVED / MERGED
- PR: #21
- Merge: `553247fd38fb210702a18601644a62b86c5d2ee3`
- Result: reusable `frontend/src/components/analytics/**` situation/provenance/chart-frame kit with Ladle stories and deterministic tests; no production route wiring

Both P001 design lanes are closed and merged. That design program remains closed; the separate P1 stabilization queue above is now the only active production authorization. Future design/external work still requires a new bounded work order / explicit approval and must re-establish file ownership before editing shared surfaces.

## DT-VIS-P001 Closure

- Final reviewed branch head: `504709ffdeff663fae4126f3ce0d37cff67af0db`.
- PR #23 GitHub checks: `smoke`, `scripts`, and both `notify` checks SUCCESS.
- Local final gates: focused Twin adapter 7/7, focused Twin+visual Playwright 11/11, lint baseline 12 warnings / 0 errors, build PASS, Vitest 169/169, full Playwright 48/48, diff-check PASS.
- Evidence: `docs/review-evidence/dt-vis-p001/` (desktop light/dark, 360px mobile, simulation, reduced motion, Process, context-loss fallback, before captures).
- PR #23 merged to `main` as `491ff6dd980e1e3b032b934588baefb9218b1b2b`.
- No schema/Auth/RLS/router/Process/data-contract change and no new 3D dependency was introduced.

Design-program gate remains **STOP** for candidate visual/external lanes in `docs/ai/design/ENV-NEXT-DESIGN-EXECUTION.md`. The only active exception is the separately authorized P1 stabilization queue (`WO-STAB-009` → `WO-STAB-006`) recorded above.

## Repo State — 2026-08-23

Current authoritative branch: `main`.

### Machine-local worktree caveat

The legacy primary worktree `A:\\GitHub\\env-wastewater-webapp` was still at `7d73814782f8475731d886f6826da5bc9af36c11` after the P001 closure. It was **not** fast-forwarded because untracked user-owned files under `docs/ai/digital-twin/` would collide with tracked files now present on current `main`. Those untracked files were intentionally left untouched.

Until the user explicitly reconciles that legacy worktree, agents must not treat its local checkout as current SSoT. Run the freshness gate in `AGENTS.md` and use current `origin/main` / a clean worktree for authoritative reads and new branches. Remote `main` after the P001 closure is `6559fa31cd83d2d1c5378bfd810527b743a215ac` before this caveat update.

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
