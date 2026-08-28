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

## Current execution state — 2026-08-28

- Active work order: `ENV-MOBILE-002` — Chemical form mobile convergence; contract `docs/work-orders/ENV-MOBILE-002-CHEMICAL.md`.
- Branch/worktree: `feat/env-mobile-002-chemical` / `A:\\GitHub\\envww-review-mobile-001` from `origin/main@cca5a05d640c8262e0ef102d6fb9826f6f297553`.
- Owner: GPT-5.6 Sol as the user-authorized GLM-5.3 limit fallback. Scope is page-local Chemical responsive/interaction work + one focused E2E spec; data layer/schema/shared UI/other forms remain read-only.
- State: `REVIEW_REQUESTED`. Production checkpoint `7b1baef8e70f3081fbc6e5088fdfac57c7341d92`; Chemical E2E 7/7 PASS, full Playwright 66/66 PASS, Vitest 202/202 PASS, typecheck/build PASS, lint 12 baseline warnings / 0 errors, route smoke + diff-check PASS. Fresh independent reviewer owns approval/merge.
- `ENV-MOBILE-001` is complete, merged, deployed, production-smoked, and read-only historical evidence.

## Review Queue — 2026-08-23

| Order | PR | Verdict | Repository checkpoint |
|---:|---:|---|---|
| 1 | #16 — `WO-STAB-007` | APPROVED and merged | merge `77015d691d2d5a9f20937e582ffb53aa31cad875` |
| 2 | #15 — `WO-UX-SCALE-001` | APPROVED and merged | merge `da3f510535e711c7cdcbd52bca98c3ecea15e2e7` |
| 3 | #14 — Digital Twin foundation | APPROVED and merged | merge `da3b70bdc5338f36c600efb3a3feedea2dee5420` |
| 4 | #21 — `WO-UX-AN-P001` | APPROVED and merged | merge `553247fd38fb210702a18601644a62b86c5d2ee3` |
| 5 | #23 — `DT-VIS-P001` | APPROVED and merged | merge `491ff6dd980e1e3b032b934588baefb9218b1b2b` |
| 6 | #26 — P1 WO proposals | APPROVED and merged; activation decided | merge `e98df9057bd2cbb4ba879371dd82b7164d7da91a` |
| 7 | #29 — `WO-STAB-009` | HISTORICAL — post-merge finding later remediated by #33 | merge `590f41303ba7c949eb44b9844ccc8dab4675b34a`; final closure recorded on PR #33 |
| 8 | #30 — `WO-STAB-006` | APPROVED and merged | merge `72bd8f6088b177fb28017beda95c70a778d872e1` |
| 9 | #33 — `WO-STAB-009` remediation-2/3 | **APPROVED and merged** | reviewed head `468a3fec1808b4020d81e79df4d6ec7a03d459a9`; merge `b33c630d6a10a262aa6cd16469efbf475c4338fd` |

### GPT Review Verdict — PR #29 / WO-STAB-009 — 2026-08-26

`CHANGES_REQUIRED` — do not merge.

Verified green evidence: Vitest 183/183 with non-secret dummy Supabase env, build PASS, lint 12 warnings / 0 errors, diff-check PASS, and GitHub `smoke` / `scripts` / both `notify` checks SUCCESS. The runtime `ai_scope` ∩ static-profile gate, ambiguity fail-closed behavior, pre-prompt projection, scope-error zero-provider-call behavior, and refusal-message raw-row protection are present.

Blocking PHI finding: `TABLE_SAFE_FIELDS["wastewater.reading"]` includes unrestricted user-entered `color_desc`, `smell_desc`, and `note`. `DailyFormPage.tsx` allows arbitrary text in all three fields, while the scrubber only handles email/phone/Thai-ID patterns; patient names or other non-regex identifiers can therefore survive and reach the external provider. Remediation must remove those unrestricted fields from the provider-safe profile (not replace the boundary with a name regex) and add captured-body regression coverage.

### GPT Re-Review Verdict — PR #29 / WO-STAB-009 — 2026-08-26

`APPROVED / MERGED` — reviewed head `676b432452ad1754708907fb0c1fbef9c77d325e`; merge `590f41303ba7c949eb44b9844ccc8dab4675b34a`.

Reviewer verified the remediation removes unrestricted `color_desc`, `smell_desc`, and `note` from `TABLE_SAFE_FIELDS["wastewater.reading"]`; runtime `ai_scope` ∩ static-profile authorization and fail-closed behavior remain unchanged. Projection + captured-provider-body regressions prove arbitrary non-regex identifying free text cannot leave the browser.

Independent reviewer gates: focused boundary **16/16 PASS**, full Vitest **195/195 PASS**, build PASS, lint **12 warnings / 0 errors**, diff-check clean. Reviewer local full Playwright was interrupted by Worker 3 transport termination (502/session terminated), not a test failure; GLM recorded **48/48 PASS**, and exact-head GitHub `smoke`, `scripts`, and both `notify` checks were SUCCESS. PR was CLEAN/MERGEABLE before merge.

### GPT Post-Merge Re-Re-Review Verdict — PR #29 / WO-STAB-009 — 2026-08-26

`CHANGES_REQUIRED (post-merge discovery)` — PR #29 was already merged before this re-re-review; do not attempt to rewrite or reopen the merged PR. Open a fresh remediation-2 branch/PR from current `origin/main`.

The original remediation is valid: `color_desc`, `smell_desc`, and `note` are absent from `wastewater.reading`; the two new remediation tests genuinely pin the original defect. Independent RED-proof temporarily re-added those three fields and produced exactly **2 focused failures**, including captured provider-body leakage of `ผู้ป่วย สมชาย ใจดี HN 12345`; the reviewed source was restored immediately.

Blocking all-profile audit findings remain in the static provider-safe map: `fuel.dispense_log.fuel_type` is unrestricted DB `text`, and the fuel bulk-import adapter accepts arbitrary strings; `garbage.collection_log.waste_type` is unrestricted legacy DB `text`; both tables are seeded `patient_safe=true` and `is_enabled=true` in `core.ai_scope`. `wastewater.threshold_alert.severity` is also statically allowlisted although the current threshold-alert schema has no `severity` column, creating a dormant future-safe-field hazard. Carbon and the remediated wastewater-reading profiles are bounded by the current contracts reviewed.

Re-review evidence at exact reviewed head: focused boundary **16/16 PASS**, full Vitest **195/195 PASS**, build PASS, lint **12 warnings / 0 errors**, diff-check clean, exact-head GitHub `smoke`, `scripts`, and both `notify` checks SUCCESS. Local full Playwright was interrupted by transport/tool failure; accepted remote exact-head evidence remains green.

Required next step: execute `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION-2.md` on a fresh GLM-owned branch/PR. Prefer the smallest fail-closed fix: remove unbounded/stale string fields from the provider-safe profile, add RED-first captured-body regressions, preserve runtime `ai_scope` ∩ static-profile authorization and all previously-good fail-closed behavior, then stop at `RE-REVIEW_REQUESTED`. GPT remains review/merge owner.

### GPT Re-Review Verdict — PR #33 / WO-STAB-009 remediation-2 — 2026-08-26

`CHANGES_REQUIRED — DO NOT MERGE` — reviewed exact PR head `44c35ee8d08863d88243da99c6ea851ac98b7d7d` against base `origin/main@0f549f17d70b44f70ff6f09aa7f0ea86a2d71ef7`. PR #33 was CLEAN and exact-head GitHub `smoke`, `scripts`, and both `notify` checks were SUCCESS.

The intended remediation-2 changes are valid: `fuel_type`, `waste_type`, and stale `severity` are removed from the provider-safe profiles. GPT independently reproduced the claimed remediation-2 RED state by restoring the pre-fix field list in an isolated worktree: exactly **5/5 new tests failed**, including captured provider-body leakage of `ผู้ป่วย สมชาย ใจดี HN 12345`; after restoring PR #33 code, focused boundary tests returned **21/21 PASS**. Independent full gates: Vitest **200/200 PASS**, build PASS, lint **12 warnings / 0 errors**, `git diff --check` clean.

Blocking all-profile audit finding: `TABLE_SAFE_FIELDS["wastewater.reading"]` still positively allowlists **12 keys that do not exist in the current live schema**: `do_inlet`, `do_tank`, `do_outlet`, `ph_inlet`, `ph_tank`, `ph_outlet`, `tds_inlet`, `tds_tank`, `tds_outlet`, `temperature`, `sludge_level_cm`, and `wastewater_out`. `reports/schema-snapshot-live.md` (ENV_DB introspection 2026-08-03) contains none of them, and later migrations do not add them. Repository search finds them only in the annotation safe-profile/tests rather than an enforceable DB/write contract.

This is the same stale-allowlist hazard class PR #33 correctly fixed for `severity`. GPT also independently proved an immediate boundary weakness on the reviewed head: temporarily passing `ph_tank = "ผู้ป่วย สมชาย ใจดี HN 12345"` through the existing approved-row test caused the captured provider request to contain the full value; the reviewer modification was restored immediately and tracked diff returned clean. Therefore the PR's claim that every surviving provider-safe field is schema-backed is not verified.

Required remediation: continue **the existing PR #33 branch**, integrate latest reviewer SSoT from `main`, remove the 12 stale wastewater keys using the smallest fail-closed correction, replace stale-field test fixtures with actual schema-backed fields, add deterministic stale-key RED→GREEN coverage, re-audit every allowlisted key against live schema + later migrations, run full gates, update SSoT to `RE-REVIEW_REQUESTED`, and stop. Contract: `docs/ai/prompts/GPT56-REVIEW-PR33-REMEDIATION.md`. GPT remains independent review/merge owner.

### GPT Final Re-Review / Merge Verdict — PR #33 / WO-STAB-009 remediation-3 — 2026-08-26

`APPROVED / MERGED` — reviewed exact PR head `468a3fec1808b4020d81e79df4d6ec7a03d459a9`; merge `b33c630d6a10a262aa6cd16469efbf475c4338fd`.

Independent reviewer verification: `wastewater.reading` now contains exactly the 7 audited provider-safe keys `[id, reading_date, free_chlorine, sv30, wastewater_in, wastewater_discharged, system_operating]`. All five static profiles were reconciled against `reports/schema-snapshot-live.md`; later `202608*.sql` migrations do not alter the five provider-safe tables. R1/R2 exclusions remain intact (`color_desc` / `smell_desc` / `note`, `fuel_type`, `waste_type`, `severity`). Stale metric names remain only in negative-test payloads/comments.

Independent RED-proof: reviewer temporarily re-added stale `ph_tank` to the wastewater profile in an isolated worktree. The two remediation-3 tests failed exactly as intended: the exact-seven-key contract exposed the extra key, and the captured provider request contained `ph_tank` plus `ผู้ป่วย สมชาย ใจดี HN 12345`. Reviewer restored the exact PR head immediately; tracked diff returned clean and focused boundary tests returned **23/23 PASS**.

Independent gates: full Vitest **202/202 PASS** using non-secret dummy Supabase env, build PASS, lint **12 warnings / 0 errors**, `git diff --check` clean. Exact-head GitHub `smoke`, `scripts`, and both `notify` checks were SUCCESS; `.github/workflows/e2e.yml` runs full `npx playwright test` in the smoke job, accepted as exact-head Playwright evidence. Merge commit `277b085` preserved the prior GPT PR #33 review record and has `main@5b1f88e` as its second parent.

WO-STAB-009 is closed. Adding real live metric names such as `do_aeration`, `ph`, or `tds_aeration` to the provider-safe profile remains a separate authorization decision; the approved payload is intentionally minimal.

### GPT Review Verdict — PR #30 / WO-STAB-006 — 2026-08-26

`APPROVED / MERGED` — merge `72bd8f6088b177fb28017beda95c70a778d872e1`.

Reviewer verified one `wasUnread` decision controls both the row flip and unread decrement, repeat/already-read/unknown-id paths preserve the same snapshot reference, and rollback remains invalidate-on-error. RED-first was independently reproduced by temporarily restoring the old unconditional-decrement arithmetic in the isolated review worktree: exactly the three claimed regressions failed (repeat-click identity, already-read decrement, unknown-id decrement). The reviewed implementation was restored immediately; focused tests returned 10/10, full Vitest 179/179, build PASS, lint 12 warnings / 0 errors and diff-check clean. GitHub E2E on reviewed head `941f6d73f9ccfcaa8f4efc47c0aa4c86f16d509e` runs full `npx playwright test` against the PR branch and completed SUCCESS.

PR #14 is approved and merged. Digital Twin visual work orders are now unblocked, subject to each work order's own dependency and user-approval rules in `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`.

## Active Work — P1 Stabilization Queue

Program: `ENV-P1-STABILIZATION`

State: `APPROVED`

Activation decision: GPT review of PR #26 on 2026-08-24. PR #26 was docs-only and merged as `e98df9057bd2cbb4ba879371dd82b7164d7da91a`.

Execution is **serialized** to reduce review risk even though the owned production files do not overlap:

1. `WO-STAB-009` — annotateRow PHI/provider boundary. Status: `APPROVED / MERGED` — PR #33 reviewed exact head `468a3fec1808b4020d81e79df4d6ec7a03d459a9`, merge `b33c630d6a10a262aa6cd16469efbf475c4338fd`. Remediation-3 removed all 12 stale `wastewater.reading` allowlist keys; the profile is exactly 7 live-schema-backed keys. GPT independently reproduced RED by re-adding `ph_tank` (2/2 remediation-3 tests failed, including captured wire-body PHI), restored the reviewed source, verified focused 23/23, full Vitest 202/202, build PASS, lint 12w/0e, diff-check clean, and accepted exact-head GitHub full-Playwright smoke evidence. Closed.
2. `WO-STAB-006` — alert unread optimistic-count idempotency. Status: `APPROVED / MERGED` — PR #30, implementation checkpoint `8af33dc070457de03309ae9b30fe84728aad8466`, reviewed head `941f6d73f9ccfcaa8f4efc47c0aa4c86f16d509e`, merge `72bd8f6088b177fb28017beda95c70a778d872e1`. Reviewer independently reproduced the claimed RED state (exactly 3 failures), restored the implementation, verified focused 10/10, full Vitest 179/179, build PASS, lint 12 warnings / 0 errors, diff-check clean, and GitHub full `npx playwright test` job SUCCESS.

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

## User-Confirmed Goal-First Engineering Process — 2026-08-27

The user confirmed that the ENV project must use one durable Loop Engineer process for future work, with **GOAL as the first step** and repository SSoT instead of chat memory. Binding process: `docs/ai/ENV-ENGINEERING-LOOP.md`. Reusable verified failure lessons live in `docs/ai/DEFECT-MEMORY.md`. Process adoption merged via PR #37: reviewed head `6ac3d430ea03e9feb433ff332d0475b81cb5e48f`, merge `8d9828a4974103b7b3744dc2dd336d2d697a7506`.

Process requirements now include: fetch/source-reality before questioning; Grill Me / Grill With Docs for unresolved decisions; primary-source research and optional independent brainstorm/prototype when useful; spec → bounded vertical-slice work orders → ownership gate; real RED/baseline evidence; narrow implementation + repro-driven debug; focused + system/E2E real-use testing; responsive/accessibility/data-honesty/security review; repo report + defect memory; independent exact-diff review; PR + applicable exact-SHA CI; re-audit against current main; authorized merge; fetch main + deployment/smoke verification; close before the next deferred slice.

The historical `docs/repo-health-100` branch remains audit evidence and must not be reused as a stale working base. Future milestone audits use a fresh unique repo-health branch from then-current `origin/main`; documentation/governance gaps may be fixed there, while production defects discovered by audit are routed into their own bounded work orders/branches.

This is a **process authorization**, not production-feature activation. Existing deferred lanes remain deferred.

## ENV-ARCH-001 Closure / ENV-MOBILE-001 Closure — 2026-08-28

### ENV-ARCH-001

State: `APPROVED / MERGED`

- Reviewed exact head: `2d58c684330d4db0e80bda0c8fc2ebd8890e4eef`.
- PR: #39.
- Merge on main: `08db62c821cf7b95aaeb373c603d77ccc4d9b98a`.
- Review evidence: docs-only paths; `origin/main` ancestry verified; `git diff --check` clean; route inventory matched `frontend/src/App.tsx`; schema-family claims matched `reports/schema-snapshot-live.md`; required operating artifacts present; exact-head `scripts` + `notify` CI SUCCESS. Frontend E2E/deploy were not applicable because no `frontend/**` path changed.
- Result: project operating map, unified architecture, project graph, roadmap, current-state inventory and next work-order contract are now on main.

### Completed Work — ENV-MOBILE-001

State: `COMPLETE`

Goal: make the wastewater daily recording workflow mobile-first at 360–430 px while preserving current data/validation/hydration/threshold/repair/null semantics.

Branch/worktree: `feat/env-mobile-001` / `A:\\GitHub\\envww-mobile-001` from `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`.

Final reviewer / merge owner: GPT-5.6 Sol fresh reviewer context. PR #40 is merged and the production deployment has been verified; all implementation/remediation lanes are closed and read-only.

Contract: `docs/work-orders/ENV-MOBILE-001.md`.

Owned production scope:

- `frontend/src/pages/DailyFormPage.tsx`;
- one focused mobile DailyForm E2E spec under `frontend/tests/e2e/`;
- lane-specific SSoT/evidence only.

No schema/RLS/query/data-contract/AppShell/navigation/Digital-Twin/shared-UI rewrite is authorized in this slice.

Review-request evidence:

- RED: at 360 px, the first two dense water-quality inputs were 149 px apart horizontally under the old unconditional two-column layout.
- RED-2: the floating ModuleDock intercepted the fixed submit bar on phone, preventing a real tap path.
- Implementation checkpoint: `a99629935b68dac58a3e7fb8c1498e923fe5a174`.
- GREEN: responsive one-column below `sm`, preserved two-column density at 1024 px, elevated action bar + bottom clearance, focused Playwright 3/3 PASS.
- Full gates: Playwright 51/51 PASS; Vitest 202/202 PASS; build PASS; oxlint 0 errors / 12 pre-existing warnings; `git diff --check` PASS.
- Exact review: PR #40 head `87fdc7c0b014ed7279df93de7b4bdc539926debb` against `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a` returned `CHANGES_REQUIRED — DO NOT MERGE`.
- Remote state at review: OPEN and CLEAN/MERGEABLE; no branch protection/ruleset and no server-required checks. Visible checks succeeded, but E2E checked GitHub merge ref `e330b26ce966620c6e84bbb482746a5c68bf3a53` rather than the literal reviewed head SHA.
- Blocking gaps: 36 px QuickChips versus 44 px minimum; incomplete 430 px/tablet/touch-target/keyboard/touch/edit/error-retry/repair-request/visual evidence; success-only save mock; stale PR/SSoT evidence; and prior implementer/reviewer role conflict.
- Remediation contracts: `docs/work-orders/ENV-MOBILE-001A-SOLMAX-UX-REMEDIATION.md` then `docs/work-orders/ENV-MOBILE-001B-GLM53-VERIFICATION.md`.
- ENV-MOBILE-001A: **COMPLETE / PUSHED** at `74550da24af09a5afe506d2c269de89cb6392092`. Local evidence: focused Playwright 3/3, Vitest 202/202, build PASS, lint 12 pre-existing warnings / 0 errors, diff-check PASS; rendered Chromium matrix covered 360/390/430/768/1024, dark/light, create/edit, abnormal focus, 44 px QuickChips, final-field clearance, and Dock scrim inactivation. Remote PR head was verified equal to this checkpoint before lane B activation.
- ENV-MOBILE-001B: **COMPLETE / PUSHED** — GLM verification lane finished before lane D; its E2E spec is now read-only historical regression evidence.
- ENV-MOBILE-001D: **PRODUCTION_REMEDIATION_REQUIRED / COMPLETE / PUSHED** at `cdaa1097022b7fbfedfff8302a628af630f6cfb1`; unchanged GLM regression reproduced the failed-save focus/viewport race 2/20 and then stopped with no production edits.
- ENV-MOBILE-001E: **COMPLETE / PUSHED** — production checkpoint `b7c2623168da4d6fac8990a7f90180ee1b1326f1`; state-backed post-commit reveal + deterministic `auto` scroll applied to `DailyFormPage.tsx`; failed-save 1/1 and repeat 20/20 PASS, full mobile spec 11/11, Vitest 202/202, typecheck/lint/build/diff-check PASS; lane evidence in `docs/ai/handoffs/ENV-MOBILE-001E-SOLMAX.md`.
- Final independent review: **APPROVED** at exact PR head `f7af3027dafe52f06719a2e08de993a31045162f`. Independent rerun: failed-save 20/20 PASS; mobile spec 11/11 PASS; Vitest 202/202 PASS; build PASS; lint 12 baseline warnings / 0 errors; diff-check PASS. One unrelated `modules.spec.ts` navigation timeout under full parallel load passed 10/10 on isolated reproduction.
- PR #40 merged as `74675a532a871c7bba78de15eccb35b6b0ba433b`. Post-merge `test`, E2E smoke, and GitHub Pages deploy all SUCCESS; deployment `6135815691` is `success` for that exact main SHA.
- Live production smoke at 390×844: HTTP 200, login rendered, `/form` correctly auth-gated to `login?next=/form`, no horizontal overflow and no console/page errors. The deployed bundle contains the new DailyForm remediation.
- Closure result: `COMPLETE`. No schema/RLS/query/payload/manual-vs-live semantics changed.

## User-Confirmed Product Experience Goal — 2026-08-27

The user confirmed the preserved prototype set under `docs/ai/design/references/` as the visual north star for ENV dashboard/command-center surfaces. The durable interpretation and execution constraints are in `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md`.

Binding planning direction:

- Dashboard/intelligence surfaces target the prototype-level command-center hierarchy while preserving the existing Digital Twin as spatial/visual core.
- Operational data-entry/form surfaces are mobile-first because field users will primarily record data on phones.
- Every materially changed panel/layer must define responsive + interactive behavior for desktop, tablet, and mobile; mobile composition may stack/collapse/tab/drawer/bottom-sheet rather than shrink the desktop grid.
- Prototype sample values/labels are reference-only and are not production data contracts.
- Future work follows the engineer loop and must be activated as bounded vertical-slice work orders with explicit ownership, responsive evidence, tests where applicable, and independent review.

The original prototype record was design/planning authorization. The user's later 2026-08-27 continuation instruction now authorizes roadmap execution one bounded work order at a time under the ownership/review gates above. It does not authorize invented data contracts or parallel overlap.

## Next Action

1. Fresh independent reviewer inspects the exact pushed ENV-MOBILE-002 / Chemical PR head and verifies the bounded page/test diff plus evidence; implementation owner must not merge.
2. If approved and CI is green, merge, verify `origin/main`, Pages deployment, and live `/chemical` auth/smoke behavior; then close ENV-MOBILE-002 durably.
3. Only after Chemical closure may the roadmap activate `ENV-MOBILE-003` / Water Supply as the next single domain-form slice. Keep Fuel, Garden/Garbage, Food/Safety/Building, `DT-VIS-P002/P003`, `UX-FLOW-P001`, `ENV-INT-P001`, `WO-STAB-008`, P2 backlog, and token cleanup inactive until their turn and explicit ownership gate.
4. Additional provider-visible wastewater metrics remain a separate data/security contract decision; continuation authorization does not implicitly expand the approved AI safe profile.
