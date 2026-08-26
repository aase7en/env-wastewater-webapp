# HANDOFF

Status: APPROVED — PR #33 / WO-STAB-009 remediation-3 passed independent GPT re-review and merged as `b33c630d6a10a262aa6cd16469efbf475c4338fd`. ENV-P1-STABILIZATION is closed for the two activated work orders; deferred lanes remain inactive.

## Active P1 Stabilization Queue — 2026-08-24

Decision source: GPT review of PR #26 (`e98df9057bd2cbb4ba879371dd82b7164d7da91a`).

### GPT Final Re-Review / Merge Record — PR #33 / WO-STAB-009 remediation-3 — 2026-08-26

- Verdict: **APPROVED / MERGED**.
- Reviewed exact PR head: `468a3fec1808b4020d81e79df4d6ec7a03d459a9`; merge: `b33c630d6a10a262aa6cd16469efbf475c4338fd`.
- Exact profile verification: `wastewater.reading` = `[id, reading_date, free_chlorine, sv30, wastewater_in, wastewater_discharged, system_operating]` and nothing else. All five provider-safe profiles were reconciled against `reports/schema-snapshot-live.md`; later `202608*.sql` migrations do not alter those five tables. R1/R2 removals remain excluded.
- Independent RED-proof: reviewer re-added stale `ph_tank` in an isolated worktree. Both remediation-3 tests failed: exact-key-set contract detected the extra key, and captured provider body contained `ph_tank` plus `ผู้ป่วย สมชาย ใจดี HN 12345`. Reviewer restored the reviewed file immediately; tracked diff returned clean.
- Independent GREEN/gates: focused boundary **23/23 PASS**; full Vitest **202/202 PASS** with non-secret dummy Supabase env; build PASS; lint **12 warnings / 0 errors**; `git diff --check` clean.
- Playwright evidence: exact-head GitHub `smoke` SUCCESS; `.github/workflows/e2e.yml` executes full `npx playwright test`. Exact-head `scripts` and both `notify` checks also SUCCESS.
- Fixture audit: stale metric names appear only in comments/negative-test payloads; positive fixtures use live-schema-backed `sv30` / `free_chlorine`.
- Reconciliation audit: merge commit `277b0857e33c24a55eb88225e9816cac04d41e14` preserved the earlier GPT PR #33 CHANGES_REQUIRED record and has `main@5b1f88ea5d1a7c3ffb5604b58c931b94e15e46bf` as its second parent.
- Fail-closed behavior remains unchanged: runtime `ai_scope` ∩ static profile, canonical-name ambiguity refusal, scope-error zero provider calls, projection before prompt construction, refusal paths without raw row values, and prior R1/R2 exclusions.
- WO-STAB-009 is closed. Additional real provider-visible wastewater metrics (for example `do_aeration`, `ph`, `tds_aeration`) require a separate explicit authorization decision.

### GPT Re-Review Record — PR #33 / WO-STAB-009 remediation-2 — 2026-08-26

- Verdict: **CHANGES_REQUIRED — DO NOT MERGE**.
- Reviewed exact PR head: `44c35ee8d08863d88243da99c6ea851ac98b7d7d`; base at review `origin/main@0f549f17d70b44f70ff6f09aa7f0ea86a2d71ef7`; PR merge state CLEAN; exact-head GitHub `smoke`, `scripts`, and both `notify` checks SUCCESS.
- Valid remediation confirmed: PR #33 removes `fuel.dispense_log.fuel_type`, `garbage.collection_log.waste_type`, and stale `wastewater.threshold_alert.severity` from provider-safe profiles.
- Independent RED proof for GLM's new remediation-2 coverage: reviewer restored the pre-remediation-2 field list in an isolated worktree and reproduced exactly **5 failures**; captured provider bodies contained `ผู้ป่วย สมชาย ใจดี HN 12345` under `fuel_type` / `waste_type`, and `severity` was projected. Reviewer restored PR #33 code immediately; focused boundary tests returned **21/21 PASS**.
- Independent full gates on the reviewed head: Vitest **200/200 PASS**, build PASS, lint **12 warnings / 0 errors**, `git diff --check` clean.
- New blocking audit finding: `TABLE_SAFE_FIELDS["wastewater.reading"]` still contains 12 keys absent from the current live `wastewater.reading` schema: `do_inlet`, `do_tank`, `do_outlet`, `ph_inlet`, `ph_tank`, `ph_outlet`, `tds_inlet`, `tds_tank`, `tds_outlet`, `temperature`, `sludge_level_cm`, `wastewater_out`. `reports/schema-snapshot-live.md` was introspected from ENV_DB on 2026-08-03; later migrations do not add these keys. Repository search finds them only in the annotation allowlist/tests, not an enforceable DB/write contract.
- Independent blocker reproducer on PR #33 head: reviewer temporarily passed `ph_tank = "ผู้ป่วย สมชาย ใจดี HN 12345"` through the existing approved-row test; the captured provider request contained the full value and the assertion `not.toContain("สมชาย")` failed. The reviewer test modification was restored immediately and tracked diff returned clean.
- This is the same stale positive-allowlist hazard class that PR #33 correctly fixes for `severity`; therefore the PR's all-five-profile audit claim is incomplete.
- Remediation contract: `docs/ai/prompts/GPT56-REVIEW-PR33-REMEDIATION.md`.
- Next owner when GLM 5.3 MAX capacity returns: continue the **existing** branch `fix/p1-annotate-phi-boundary-remediation-2` / PR #33, fetch and integrate latest reviewer SSoT from `main`, remove the 12 stale wastewater keys using the smallest fail-closed correction, replace stale-field fixtures with actual schema-backed fields, add stale-key RED→GREEN protection, rerun all-five-profile live-schema audit + full gates, update to `RE-REVIEW_REQUESTED`, push, and STOP. GPT remains independent review/merge owner.

### GPT Post-Merge Re-Re-Review Record — PR #29 / WO-STAB-009 — 2026-08-26

- Verdict: **CHANGES_REQUIRED (post-merge discovery)**.
- Source reality: PR #29 had already been merged before this re-re-review. Reviewed exact head `676b432452ad1754708907fb0c1fbef9c77d325e`; merge `590f41303ba7c949eb44b9844ccc8dab4675b34a`. Do not rewrite/reopen the merged PR; remediation-2 must use a fresh branch/PR from current `origin/main`.
- Original remediation remains valid: `wastewater.reading` no longer allowlists `color_desc`, `smell_desc`, or `note`.
- Independent RED-proof: temporarily restoring those three fields makes the two remediation tests fail exactly as intended; the captured provider body includes `ผู้ป่วย สมชาย ใจดี HN 12345`. Source was restored immediately and tracked diff returned clean.
- All-five-profile audit found remaining blockers: `fuel.dispense_log.fuel_type` is allowlisted although DB contract is unrestricted `text`, and `frontend/src/lib/import-adapters/fuel.ts` accepts arbitrary imported strings before `BulkImportPage` inserts them; `garbage.collection_log.waste_type` is allowlisted although it is unrestricted legacy `text`; both tables are runtime-enabled/patient-safe in `core.ai_scope`. `wastewater.threshold_alert.severity` is statically allowlisted but no such column exists in the current threshold-alert schema, making it a dormant future-safe-field hazard.
- Good behavior preserved and independently verified: runtime `ai_scope` ∩ static profile, canonicalization fail-closed, unknown columns omitted, scope-read failure produces zero provider calls, projection precedes provider payload construction, refusal paths do not echo raw rows.
- Gates at reviewed head: focused boundary **16/16 PASS**, full Vitest **195/195 PASS**, build PASS, lint **12 warnings / 0 errors**, `git diff --check` clean; exact-head GitHub `smoke`, `scripts`, and both `notify` checks SUCCESS. Local Playwright interruption was transport/tool failure, not an assertion failure; remote exact-head evidence is accepted.
- Required remediation contract: `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION-2.md`.
- Next owner: **GLM 5.3 MAX** implements remediation-2 on a fresh branch/PR and stops at `RE-REVIEW_REQUESTED`; GPT remains independent review/merge owner.

### GPT Review Record — PR #29 / WO-STAB-009 — 2026-08-26

- Verdict: **CHANGES_REQUIRED — DO NOT MERGE**.
- Reviewed branch tip: `703e371b8d8dbde38f698b0371d6ece9ecd7dbc7`; implementation checkpoint `1fbb33f8703ae1dd0373f039e090d8fa22b3a45a`.
- Verified gates: Vitest **183/183 PASS** (isolated worktree with non-secret dummy Supabase env), build PASS, lint **12 warnings / 0 errors**, diff-check PASS; GitHub `smoke`, `scripts`, both `notify` checks SUCCESS.
- Verified good boundary behavior: runtime `ai_scope` approval intersects static profile; ambiguous/unknown scope fails closed; `projectSafeRow()` precedes prompt construction; scope read failure produces zero provider calls; `STATIC_PHI_DENY` is not used as positive allowlist fallback; refusal messages do not include raw row values.
- Blocking PHI finding: `wastewater.reading` static profile includes `color_desc`, `smell_desc`, and `note`, and `DailyFormPage.tsx` permits arbitrary text for all three. Regex scrubbing only covers email/phone/Thai-ID shapes, so patient names/other non-regex identifiers can survive into the provider request.
- Required remediation: remove unrestricted free-text fields from the provider-safe profile; do not use name-regex as the authorization boundary; add project + captured-body regressions using non-regex identifying text; audit remaining profiles for unrestricted free text only within this WO scope.
- Remediation prompt: `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION.md`.
- Next owner for PR #29: GLM 5.3 remediation, then STOP at `RE-REVIEW_REQUESTED`; GPT remains merge owner.

### GPT Re-Review / Merge Record — PR #29 / WO-STAB-009 — 2026-08-26

- Verdict: **APPROVED / MERGED**.
- Remediation `26713f0`; reviewed exact head `676b432452ad1754708907fb0c1fbef9c77d325e`; merge `590f41303ba7c949eb44b9844ccc8dab4675b34a`.
- Reviewer gates: focused **16/16**, Vitest **195/195**, build PASS, lint **12 warnings / 0 errors**, diff-check clean; exact-head GitHub checks SUCCESS.
- Local reviewer Playwright transport terminated; GLM recorded **48/48 PASS**.
- Worker 5 was used only as shell transport for final merge/SSoT after Worker 3 terminated; Worker 5 active project was not changed.
- Closed.

### 1. WO-STAB-009 — provider boundary

- Historical PR #29 merge remains `590f41303ba7c949eb44b9844ccc8dab4675b34a`.
- Final decision: **APPROVED / MERGED** on remediation PR #33.
- Reviewed exact PR #33 head: `468a3fec1808b4020d81e79df4d6ec7a03d459a9`; merge: `b33c630d6a10a262aa6cd16469efbf475c4338fd`.
- Implementation/remediation owner: GLM 5.3 MAX; independent reviewer/merge owner: GPT.
- Final provider-safe `wastewater.reading` profile is intentionally minimal: `id`, `reading_date`, `free_chlorine`, `sv30`, `wastewater_in`, `wastewater_discharged`, `system_operating`.
- Independent GPT RED-proof + gates are recorded in the final re-review record above.
- Closed. Do not add additional provider-visible wastewater metric names without a separate explicit authorization/review.

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

- PR #29 historical merge remains `590f41303ba7c949eb44b9844ccc8dab4675b34a`.
- PR #33 final GPT verdict at exact head `468a3fec1808b4020d81e79df4d6ec7a03d459a9`: **APPROVED / MERGED** as `b33c630d6a10a262aa6cd16469efbf475c4338fd`; prior CHANGES_REQUIRED at `44c35ee` remains preserved as history.
- PR #30 verdict: APPROVED and merged `72bd8f6088b177fb28017beda95c70a778d872e1`.
- Dirty/stale primary worktree was not reset, cleaned, stashed, or mutated.
- Worker 3 transport terminated during final local Playwright for PR #29; this was transport failure, not test failure. Unit/build/lint/diff gates were independently green; GLM recorded Playwright 48/48; exact-head GitHub checks were green.
- Worker 5 was used only as shell transport for final merge and SSoT closure; its active project was not changed.
- Next safe action: no P1 stabilization implementation is active. `WO-STAB-008` remains inactive until explicit user go-ahead + Codex coordination. Additional real provider-visible wastewater metrics require a separate authorization decision.

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

---

# WO-STAB-009 Remediation Record — 2026-08-26

**Work order:** WO-STAB-009 remediation per
`docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION.md` (GPT verdict
CHANGES_REQUIRED on PR #29 tip `703e371`).

**Status:** `RE-REVIEW_REQUESTED` — branch `fix/p1-annotate-phi-boundary`,
merge-reconcile commit `1f6f1b2` (main `1c40340` merged in additively),
remediation commit `26713f0`, PR #29.

## Branch reconciliation (was CONFLICTING/DIRTY)

Main-side taken for `CURRENT-WORK.md` (newer verdicts superseded the
branch's stale `REVIEW_REQUESTED` lines). Both sides kept in
`HANDOFF.md`: the PR #29 execution record (branch-only) followed by
main's PR #30 record + GPT review records. No record dropped; GitHub
reports the PR mergeable again after push.

## Root cause

`TABLE_SAFE_FIELDS["wastewater.reading"]` classified unrestricted
free-text UI inputs (`color_desc`, `smell_desc`, `note` — DailyFormPage
"พิมพ์เอง" inputs + free Textarea) as provider-safe. The regex scrubber
only recognizes email/phone/Thai-ID shapes, so free-text identifiers
(e.g. `ผู้ป่วย สมชาย ใจดี HN 12345` — the name fragment matches no
scrubber) survived projection and reached the external provider request
body. Violates the binding rule: PHI never leaves the system.

## RED → GREEN evidence

- RED: 2 new regressions failed against the reviewed profile —
  `projectSafeRow` returned the three fields, and the captured provider
  wire body contained the patient-name fragment and both custom
  color/smell values. (14 pre-existing tests stayed green.)
- FIX: removed `color_desc`, `smell_desc`, `note` from the profile; only
  bounded numeric/date/uuid/enum-contract fields remain allowlisted.
  Existing email/phone/Thai-ID scrubber test moved onto a
  still-permitted string field (`id`) — scrubbing stays
  defense-in-depth, never the authorization boundary.
- GREEN: focused 16/16.
- Profile audit (remediation item 7): `carbon.reading`
  (id/date/meter_value/consumption), `fuel.dispense_log`
  (id/date/fuel_type/litres), `garbage.collection_log`
  (id/date/waste_type/weight_kg), `wastewater.threshold_alert`
  (id/created_at/read_at/severity) — all typed or enum-bounded; no other
  unrestricted free-text field exists in any static profile.
- Architecture preserved: runtime `ai_scope` ∩ static profile,
  fail-closed unknown/ambiguous/missing/disabled/unreadable, zero
  provider calls on refusal, unknown columns omitted, no
  `STATIC_PHI_DENY` allowlist fallback, `projectSafeRow()` before prompt.

## Gates (exact results)

- Vitest: **195/195** (183 reviewed baseline + 2 remediation + 10 from
  merged PR #30)
- `npm run build`: PASS
- `npm run lint`: 12 warnings / 0 errors (baseline)
- `git diff --check`: clean
- Full Playwright: **48/48**
- GitHub CI on new PR #29 head: recorded below after push.

## Defect memory (do not repeat)

1. A field-level allowlist compiled from schema column names is NOT a
   safety classification — the classifier must be "how does the
   production UI populate this field?", not "what is the column type?".
   Free-text-able inputs (even ones that LOOK like enums, e.g. color/smell
   dropdowns with a "พิมพ์เอง" escape hatch) are unbounded by contract.
2. Pattern scrubbers (email/phone/ID regex) only remove identifiers that
   SHAPE-match known formats. Natural-language identifiers (names, room
   references, HN-prefixed numbers) are invisible to them — which is why
   scrubbing must never be load-bearing for authorization decisions.

## Reviewer focus

1. The three removed fields are absent from projection AND wire body
   (both pinned by the 2 new regressions).
2. No new free-text field snuck into any other profile (audit above).
3. All previously-verified fail-closed behavior untouched (the fix is
   field-list-only + tests).

GLM must not merge PR #29. Next owner: GPT 5.6 Sol UltraMAX re-review.

---

# WO-STAB-009 Remediation-2 Record — 2026-08-26

**Work order:** WO-STAB-009 remediation-2 per
`docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION-2.md` (GPT post-merge
re-re-review of PR #29 merge `590f41303ba7c949eb44b9844ccc8dab4675b34a`).

**Status:** `RE-REVIEW_REQUESTED` — fresh branch
`fix/p1-annotate-phi-boundary-remediation-2` off `origin/main` `0f549f1`,
fix commit `105ce8d`. PR #29 itself untouched (merged history preserved).

## Root cause (remediation-2 scope)

The remediation-1 field audit accepted three remaining profile entries on
"enum-like" appearances without verifying the enforceable write contract:

1. `fuel.dispense_log.fuel_type` — schema `text`, NO CHECK constraint
   (`20260719000000_v2_schemas.sql:82`); bulk-import adapter accepts
   arbitrary strings (`import-adapters/fuel.ts:21`
   `str(raw["fuel_type"] ?? raw["type"])`); `core.ai_scope` seeds the table
   patient_safe+enabled → arbitrary identifying text could reach the
   provider.
2. `garbage.collection_log.waste_type` — schema `text`, NO CHECK, legacy
   field (`v2_schemas.sql:67`); authenticated writes allowed.
3. `wastewater.threshold_alert.severity` — stale profile entry: the table
   (`20260718000001_p17_threshold_alerts.sql:18-26`, V3a read_at add) has
   no `severity` column. Dormant hazard: a future same-named plain-text
   column would silently become provider-visible.

## RED → GREEN evidence

- RED: 5 new regressions in `annotate-boundary.test.ts`
  ("Remediation-2" describe) failed against the merged behavior —
  `ผู้ป่วย สมชาย ใจดี HN 12345` in `fuel_type`/`waste_type` survived BOTH
  `projectSafeRow()` and the captured provider wire body; `severity` was
  projected. 16 pre-existing tests stayed green.
- FIX (smallest fail-closed correction, field-list only):
  `fuel.dispense_log` → `[id, log_date, litres]`;
  `garbage.collection_log` → `[id, log_date, weight_kg]`;
  `wastewater.threshold_alert` → `[id, created_at, read_at]`.
- GREEN: focused 21/21.

## All-five-profile audit (post-fix, every surviving field verified)

| Profile | Surviving fields | Structural bound (evidence) |
|---|---|---|
| wastewater.reading | id, reading_date, 17 numeric sensor fields, system_operating | uuid PK / date / numeric; `system_operating` boolean (`supabase-queries.ts:267` `=== false` contract) |
| carbon.reading | id, reading_date, meter_value, consumption | uuid/date; meter_value + consumption `numeric` (`carbon.ts:9-10`) |
| fuel.dispense_log | id, log_date, litres | uuid PK / date / `numeric(10,2)` (`v2_schemas.sql:79-88`) |
| garbage.collection_log | id, log_date, weight_kg | uuid PK / date / `numeric(10,2)` (`v2_schemas.sql:64-72`) |
| wastewater.threshold_alert | id, created_at, read_at | uuid / timestamptz ×2 (`p17_threshold_alerts.sql`, V3a) |

No surviving provider-safe path can carry arbitrary identifying text.
Unbounded schema columns that are NOT in any profile (e.g.
`vehicle_or_use`, `disposal_route`, `note`, `field`, `message`) stay
unprojected — omitted by default.

## Gates (exact results)

- Vitest: **200/200** (195 merged baseline + 5)
- `npm run build`: PASS
- `npm run lint`: 12 warnings / 0 errors (baseline)
- `git diff --check`: clean
- Full Playwright: **48/48**. First run 47/48 —
  `ux-scale-mobile.spec.ts:85` (brand target 44x44, Codex visual lane,
  untouched by this change) failed once, passed 3/3 on
  `--repeat-each=3 --retries=0`, and the full-suite rerun returned 48/48.
  Classified ENVIRONMENTAL/timing flake, not a regression.
- GitHub CI on the exact PR head: recorded in CURRENT-WORK after push.

## Defect memory (do not repeat)

1. "Enum-like" is not a contract. A comment listing suggested values
   (`-- diesel / gasoline / lpg / other`) or a dropdown in ONE UI is not
   an enforceable bound. The audit question is: can ANY write path
   (import adapter, SQL, future API) store arbitrary text? If yes, the
   field is not provider-safe regardless of intended usage.
2. Allowlist entries for columns that do not exist yet are latent
   hazards: a stale entry (`severity`) auto-exposes any future
   same-named column without a privacy review. Profiles must be diffed
   against the live schema, not just maintained additively.

## Reviewer focus

1. The 5 RED regressions pin projection AND captured wire body (incl.
   the non-regex patient-name fragment).
2. Audit table above — every surviving field has schema-level evidence.
3. Remediation-1 exclusions and all fail-closed behavior untouched
   (fix is field-list-only + tests).

GLM must not merge the remediation-2 PR. Next owner: GPT 5.6 Sol
reviewer / merge owner.

---

# WO-STAB-009 Remediation-3 Record — 2026-08-26

**Work order:** WO-STAB-009 continuation per
`docs/ai/prompts/GPT56-REVIEW-PR33-REMEDIATION.md` (GPT re-review of
PR #33 head `44c35ee` = CHANGES_REQUIRED: 12 stale
`wastewater.reading` allowlist keys).

**Status:** `RE-REVIEW_REQUESTED` — existing branch
`fix/p1-annotate-phi-boundary-remediation-2` / PR #33. Reviewer SSoT
integrated from main `5b1f88e` first (merge commit `277b085`, GPT verdict
records preserved additively), then remediation-3 fix commit `3b85a3c`.

## Root cause

The remediation-2 all-five-profile audit verified TYPES but never diffed
the pre-existing `wastewater.reading` allowlist keys against the LIVE
schema. 12 keys (`do_inlet, do_tank, do_outlet, ph_inlet, ph_tank,
ph_outlet, tds_inlet, tds_tank, tds_outlet, temperature,
sludge_level_cm, wastewater_out`) exist nowhere in
`reports/schema-snapshot-live.md` (real names: `do_aeration`, `ph`,
`tds_aeration`, `temp_aeration`, ...) nor in any later migration — they
survived from an assumed schema. Because `projectSafeRow()` authorizes by
field NAME with no type validation, any caller row carrying a stale key
leaks its full value to the provider (GPT reproduced with
`ph_tank = "ผู้ป่วย สมชาย ใจดี HN 12345"`).

## RED → GREEN evidence

- RED (2 new regressions on the reviewed head, 21 existing green):
  1. row carrying PHI under all 12 stale keys (+ the R1-removed
     color/smell/note) projected them — only the audited 7-key set was
     expected;
  2. captured provider wire body contained `ph_tank` and `สมชาย`.
- FIX: `wastewater.reading` profile → `[id, reading_date, free_chlorine,
  sv30, wastewater_in, wastewater_discharged, system_operating]` — each
  key backed by a live column + bounded type. NO replacement metric
  names added (separate authorization decision per contract item 2).
  Stale test fixtures replaced (`ph_tank: 7.2` → `sv30: 7.2`;
  `do_tank: 4.1` → `free_chlorine: 4.1`).
- GREEN: focused 23/23.

## All-five-profile audit vs live snapshot + later migrations

| Profile | Allowlisted key | Live column (snapshot §) | Type | Free-text storable? | Disposition |
|---|---|---|---|---|---|
| wastewater.reading | id | §488 row 2 | uuid | no | KEEP |
| wastewater.reading | reading_date | §489 | date | no | KEEP |
| wastewater.reading | free_chlorine | §499 | numeric(6,3) | no | KEEP |
| wastewater.reading | sv30 | §498 | numeric(6,2) | no | KEEP |
| wastewater.reading | wastewater_in | §516 | numeric(12,2) | no | KEEP |
| wastewater.reading | wastewater_discharged | §517 | boolean | no | KEEP |
| wastewater.reading | system_operating | §512 | boolean | no | KEEP |
| carbon.reading | id | §93 | uuid | no | KEEP |
| carbon.reading | reading_date | §95 | date | no | KEEP |
| carbon.reading | meter_value | §96 | numeric(14,2) | no | KEEP |
| carbon.reading | consumption | §97 | numeric(14,2) | no | KEEP |
| fuel.dispense_log | id | §407 | uuid | no | KEEP |
| fuel.dispense_log | log_date | §408 | date | no | KEEP |
| fuel.dispense_log | litres | §410 | numeric(10,2) | no | KEEP |
| garbage.collection_log | id | §427 | uuid | no | KEEP |
| garbage.collection_log | log_date | §428 | date | no | KEEP |
| garbage.collection_log | weight_kg | §431 | numeric(10,2) | no | KEEP |
| wastewater.threshold_alert | id | §568 | uuid | no | KEEP |
| wastewater.threshold_alert | created_at | §572 | timestamptz | no | KEEP |
| wastewater.threshold_alert | read_at | V3a migration add (pre-snapshot 2026-08-03) | timestamptz | no | KEEP |

No stale/nonexistent field remains in any positive allowlist. Removed
this round: the 12 keys above. (Prior rounds: color_desc/smell_desc/note
[R1], fuel_type/waste_type/severity [R2] — all stay removed.)

## Gates (exact results)

- Vitest: **202/202** (200 + 2)
- `npm run build`: PASS · lint: **12 warnings / 0 errors** ·
  `git diff --check`: clean · full Playwright: **48/48**
- GitHub CI on the final PR head: see CURRENT-WORK (recorded after push).

## Defect memory (do not repeat)

1. An allowlist audit that verifies TYPES is incomplete — every key must
   be diffed against the LIVE schema (snapshot/introspection), because
   name-based authorization makes a stale key an immediate leak path for
   any caller that supplies it, not just a dormant hazard.
2. Test fixtures that repeat production allowlist names
   (`ph_tank: 7.2`) silently validate the stale entries — fixtures must
   come from the schema-backed set, and a profile-contract regression
   (all stale keys in one test) must pin the exact audited key set.

## Reviewer focus

1. RED reproduction: re-add any of the 12 keys → the profile-contract
   regression fails (key-set equality assertion).
2. No new provider-visible fields added; payload narrowed only.
3. All R1/R2 removals and fail-closed behavior untouched.

GLM must not merge PR #33. Next owner: GPT 5.6 Sol reviewer / merge owner.
