# HANDOFF

Status: CHANGES_REQUIRED — PR #29 / WO-STAB-009 requires PHI-boundary remediation; PR #30 / WO-STAB-006 was GPT-approved and merged as `72bd8f6088b177fb28017beda95c70a778d872e1`. No deferred lane is activated.

## Active P1 Stabilization Queue — 2026-08-24

Decision source: GPT review of PR #26 (`e98df9057bd2cbb4ba879371dd82b7164d7da91a`).

### GPT Review Record — PR #29 / WO-STAB-009 — 2026-08-26

- Verdict: **CHANGES_REQUIRED — DO NOT MERGE**.
- Reviewed branch tip: `703e371b8d8dbde38f698b0371d6ece9ecd7dbc7`; implementation checkpoint `1fbb33f8703ae1dd0373f039e090d8fa22b3a45a`.
- Verified gates: Vitest **183/183 PASS** (isolated worktree with non-secret dummy Supabase env), build PASS, lint **12 warnings / 0 errors**, diff-check PASS; GitHub `smoke`, `scripts`, both `notify` checks SUCCESS.
- Verified good boundary behavior: runtime `ai_scope` approval intersects static profile; ambiguous/unknown scope fails closed; `projectSafeRow()` precedes prompt construction; scope read failure produces zero provider calls; `STATIC_PHI_DENY` is not used as positive allowlist fallback; refusal messages do not include raw row values.
- Blocking PHI finding: `wastewater.reading` static profile includes `color_desc`, `smell_desc`, and `note`, and `DailyFormPage.tsx` permits arbitrary text for all three. Regex scrubbing only covers email/phone/Thai-ID shapes, so patient names/other non-regex identifiers can survive into the provider request.
- Required remediation: remove unrestricted free-text fields from the provider-safe profile; do not use name-regex as the authorization boundary; add project + captured-body regressions using non-regex identifying text; audit remaining profiles for unrestricted free text only within this WO scope.
- Remediation prompt: `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION.md`.
- Next owner for PR #29: GLM 5.3 remediation, then STOP at `RE-REVIEW_REQUESTED`; GPT remains merge owner.

### 1. WO-STAB-009 — PHI/provider boundary

- Decision: **CHANGES_REQUIRED after GPT review of PR #29**.
- Owner: GLM 5.3 remediation; GPT remains reviewer/merge owner.
- Status: CHANGES_REQUIRED.
- Work-order source: `docs/work-orders/WO-STAB-009-PROPOSAL.md`; remediation: `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION.md`.
- Blocking issue: the static `wastewater.reading` profile includes unrestricted `color_desc`, `smell_desc`, and `note`; current regex scrubbing cannot guarantee removal of patient names/other identifying free text.
- Required correction: remove unrestricted free-text fields from the provider-safe profile and add captured-body regressions; keep the verified runtime/static intersection, ambiguity fail-closed, projection-before-prompt, zero-call scope-error, and no-`STATIC_PHI_DENY`-fallback behavior.
- GLM must push remediation to PR #29 and STOP at RE-REVIEW_REQUESTED; GLM must not merge.

### 2. WO-STAB-006 — unread optimistic count

- Decision: **APPROVED / MERGED**.
- Implementation owner: GLM 5.3; reviewer/merge owner: GPT.
- PR #30 reviewed head: `941f6d73f9ccfcaa8f4efc47c0aa4c86f16d509e`; implementation checkpoint: `8af33dc070457de03309ae9b30fe84728aad8466`.
- Merge: `72bd8f6088b177fb28017beda95c70a778d872e1`.
- Verified implementation: one `wasUnread` decision gates both row flip and unread decrement; already-read / unknown-id paths return the same snapshot reference; rollback remains invalidate-on-error.
- Independent RED reproduction: reviewer temporarily restored the old unconditional-decrement arithmetic in the isolated review worktree; exactly 3 tests failed (repeat-click identity, already-read decrement, unknown-id decrement). Reviewer restored the reviewed implementation immediately; focused suite returned 10/10.
- Full reviewer gates: Vitest 179/179 PASS; build PASS; lint 12 warnings / 0 errors; diff-check PASS. The local full-Playwright invocation was interrupted by Worker 3 transport termination, not a test failure; remote GitHub E2E on the exact reviewed head independently runs full `npx playwright test` against PR code and completed SUCCESS.
- Closed. Do not reopen unless a new regression is observed.

Deferred: WO-STAB-008 and all program-level visual/external lanes (`DT-VIS-P002/P003`, `UX-FLOW-P001`, `ENV-INT-P001`, Operations, navigation rewrite, external API production integration).

### GPT Reviewer Session Checkpoint — 2026-08-26

- PR #29 verdict: CHANGES_REQUIRED; remediation prompt `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION.md`.
- PR #30 verdict: APPROVED and merged `72bd8f6088b177fb28017beda95c70a778d872e1`.
- Review work was isolated in `A:\GitHub\env-wastewater-webapp-review-worker3`; the dirty/stale primary worktree was not reset, cleaned, stashed, or mutated.
- Worker 3 transport terminated during a local full-Playwright invocation. This was classified as transport failure, not test failure. The worker later reconnected; GitHub E2E evidence on exact PR #30 head independently confirms the workflow executes full `npx playwright test` and completed SUCCESS.
- Live re-check on 2026-08-26: PR #29 remains OPEN at `703e371b8d8dbde38f698b0371d6ece9ecd7dbc7`; no remediation commit has been pushed. GitHub reports `CONFLICTING` / merge state `DIRTY` against current `main`. This is a handoff blocker, not a reviewer failure.
- Next safe action: GLM 5.3 remediates PR #29 only, first reconciling current `main` additively while preserving both the PR #29 CHANGES_REQUIRED record and PR #30 merged record, then stops at `RE-REVIEW_REQUESTED`. `WO-STAB-008` remains inactive until explicit user go-ahead + Codex coordination.

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

## WO-STAB-009 Execution Record — 2026-08-25 (GLM 5.3)

- PR: #29 (branch fix/p1-annotate-phi-boundary, checkpoint 1fbb33f8703ae1dd0373f039e090d8fa22b3a45a)
- Implementation: NEW lib/admin/annotate-boundary.ts (canonical keys, static TABLE_SAFE_FIELDS profiles, projectSafeRow + PII scrub, isRuntimeApproved fail-closed — never STATIC_PHI_DENY-as-allowlist, canonicalizeTableName ambiguity-fail-closed) + annotateRow gated (runtime ∩ static, projection before prompt, refusal messages carry no row content).
- All 6 GPT amendments pinned by +14 unit tests (incl. scope-safe-but-no-profile refused w/ zero fetches; scope error => zero provider calls; wire-body projection proof). RED via stash proven; GREEN 14/14.
- Gates: Vitest 183/183 · build OK · lint 12w+0e baseline · full Playwright 48/48 · diff-check clean · GitHub CI smoke/scripts/notify all pass.
- Defect memory (do-not-repeat): (1) supabase mock chains must match the REAL eq-chain depth — isRuntimeApproved has 3 .eq() levels; a 2-level mock silently returns undefined=>false. (2) A clean worktree needs frontend/.env copied before running non-mocked supabase-importing tests (overview/ai-sql suites). (3) Bare-name canonicalization must count collisions first: 'reading' exists in wastewater AND carbon — ambiguity is correct fail-closed, not a bug.
- Status: REVIEW_REQUESTED. GPT owns review/merge. WO-STAB-006 remains serialized behind this PR's verdict.
---

# WO-STAB-006 Execution Record — 2026-08-25

**Work order:** WO-STAB-006 — alert unread optimistic-count double-decrement (P1 #6, `reports/code-review-2026-08-12.md`). Active source: `docs/work-orders/WO-STAB-006-PROPOSAL.md`. Serial precondition met: WO-STAB-009 reached `REVIEW_REQUESTED` on PR #29 before this WO started.

**Status:** `REVIEW_REQUESTED` — implementation checkpoint `8af33dc070457de03309ae9b30fe84728aad8466`, branch `fix/p1-alert-unread-idempotent`, PR #30.

## Implementation summary

- `frontend/src/lib/alerts-unread.ts` (NEW) — pure `applyMarkRead(snapshot, id, now)` per the GPT activation note: one `wasUnread` decision drives both the row flip and the badge decrement; timestamp injected for determinism; returns the SAME reference when the target is not unread (unknown id or already read), making an idempotent second write a full no-op.
- `frontend/src/lib/alerts.ts` — hook `markRead` body extracted module-level as `markReadViaCache(qc, queryKey, id)` typed against `Pick<QueryClient, "getQueryData" | "setQueryData" | "invalidateQueries">`; optimistic write delegates to `applyMarkRead`; invalidation-on-error rollback byte-identical to the pre-extraction inline block. Extraction exists so the rollback path is pinnable in node-env tests (repo has no DOM test infra).
- Bug fixed: optimistic snapshot previously wrote `n: Math.max(0, prev.n - 1)` unconditionally while the row-flip was guarded by `read_at === null` — double-click on dismiss (no debounce in NotificationBell) under-counted the badge until the next 60s poll.

## RED → GREEN evidence

RED-first: the transform was first extracted verbatim with the bug intact; 3 tests failed exactly on the bug surface (double-click idempotency, already-read decrement, unknown-id decrement). Fix applied → all green.

## Tests run (exact results)

- Focused `src/lib/alerts-unread.test.ts`: 10/10 (6 pure-transform + 4 wrapper incl. rollback pin)
- Full Vitest: 179/179 (baseline 169 + 10)
- Build (`tsc -b && vite build`): PASS
- Lint (oxlint): 12 warnings / 0 errors (baseline)
- Full Playwright: 48/48
- `git diff --check`: clean

## Defect memory (do not repeat)

1. Optimistic-cache writes that pair a guarded row transform with a count must derive BOTH from one predicate — a count arithmetic copied "as before" next to a newly-guarded flip is exactly how this bug survived EQ-4's rewrite. When extracting, write the idempotency test BEFORE porting the arithmetic.
2. Node-env fakes typed against `Pick<QueryClient, …>` still need their literal params correctly typed: `invalidateQueries: (filters: { queryKey: unknown[] })` — `unknown` vs `unknown[]` fails `tsc -b` even though vitest (esbuild, no typecheck) passes. Always run the build gate on test files, not just vitest.

## Reviewer focus

1. Same-reference early-return semantics in `applyMarkRead` (no timestamp clobber on repeat click).
2. `markReadViaCache` preserves the old rollback and empty-cache behavior.
3. Unknown-id now does NOT decrement `n` (conservative; matches proposal's gating) — intentional behavior change.

GLM must not merge PR #30. Next owner: GPT reviewer.
