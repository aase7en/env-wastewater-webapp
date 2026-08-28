# ENV-MOBILE-001 — Wastewater DailyForm Mobile-First Completion

Status: COMPLETE

Final independent reviewer / merge owner: GPT-5.6 Sol (fresh reviewer context, 2026-08-28)
UX remediation owner: GPT-5.6 Sol MAX via `ENV-MOBILE-001A-SOLMAX-UX-REMEDIATION.md`
Verification owner: GLM-5.3 via `ENV-MOBILE-001B-GLM53-VERIFICATION.md`
Core Engineering: no production data-contract change expected; escalate if source reality requires one

## Goal

Make the existing wastewater daily recording workflow practical, safe, and readable on 360–430 px phones while preserving all existing data, validation, hydration, threshold, repair-request, null/unknown, and delete semantics.

## User value

Hospital field staff primarily record operational data on phones. The current form is functionally strong but several dense sections force unconditional two-column layouts at phone width.

## Source baseline

`frontend/src/pages/DailyFormPage.tsx` currently contains multiple `grid grid-cols-2 gap-3` sections for water quality, chlorine/chemical, and meters/water/electricity. Existing phone E2E covers the global header, and `daily-form-dirty.spec.ts` covers edit hydration, but there is no dedicated full mobile completion flow.

## In scope

- responsive form layout only where needed for phone completion;
- mobile-first hierarchy for dense numeric fields;
- keep compact two-column layout only where labels/units remain comfortably usable at the relevant breakpoint;
- sticky submit/cancel/delete bar must remain reachable and must not cover the final form content;
- touch targets remain at least current project minimum;
- no required horizontal scrolling at 360 px;
- add deterministic Playwright coverage at phone width for real form interaction;
- capture visual evidence if repository workflow supports it.

## Out of scope

- schema/RLS changes;
- renaming or redefining wastewater metrics;
- changing threshold formulas;
- changing edit hydration semantics;
- adding autosave/offline/background sync;
- adding sensors/realtime semantics;
- redesigning AppShell/navigation;
- changing other ENV module forms in this WO.

## Owned files

Primary:

- `frontend/src/pages/DailyFormPage.tsx`
- a new focused E2E spec or bounded additions under `frontend/tests/e2e/`
- lane-specific evidence/handoff files

No-touch without explicit escalation:

- `frontend/src/App.tsx`
- AppShell / ModuleDock
- Supabase/query/data-contract files
- DB migrations/RLS
- shared UI primitives unless a concrete blocker is proven
- Digital Twin files

## Responsive contract

### 360–430 px

- primary reading fields should generally be one control per row when half-width labels/units would be compressed;
- related short controls may share a row only when tap/readability evidence passes;
- accordion hierarchy remains usable and does not hide required validation context;
- the full form has no horizontal page overflow;
- sticky actions remain visible but do not prevent reaching/reading the last field;
- validation/error messages remain adjacent to the relevant context;
- entering values and scrolling between sections must not reset data.

### Tablet / desktop

- preserve useful two-column density where it already works;
- no regression to desktop composition.

## Data-honesty contract

- empty numeric values remain null, never zero;
- `system_operating` meaning unchanged;
- `wastewater_discharged` meaning unchanged;
- no new automatic values;
- no change to manual/latest/live semantics.

## RED / baseline evidence

Before implementation, create or verify a phone-width test that demonstrates at least one current mobile layout failure/undesired condition or records measurable baseline behavior. Do not fabricate RED if source evidence and screenshot baseline are the correct proof.

## Test plan

Focused:

- existing form hydration unit/E2E stays green;
- new mobile DailyForm E2E at 360 px;
- assert document width does not exceed viewport;
- fill representative fields across multiple accordions;
- verify entered values persist after accordion/scroll interaction;
- exercise abnormal-system required cause validation;
- verify sticky actions remain inside viewport and do not cover final field;
- verify submit success or deterministic mocked submit path;
- verify error path preserves entered data where practical.

Full gates:

- `npm run lint`
- `npm run build`
- `npm test`
- full Playwright
- `git diff --check`

## Implementation evidence — 2026-08-27

RED/baseline:

- Added `frontend/tests/e2e/daily-form-mobile.spec.ts` at 360×800.
- Before responsive implementation, the first two water-quality controls rendered 149 px apart on the x-axis, proving the unconditional two-column phone layout.
- A second baseline run exposed a separate interaction collision: the floating `ModuleDock` intercepted pointer events over the fixed submit bar. This was fixed within the owned `DailyFormPage.tsx` scope by lifting the action bar above the dock and increasing bottom completion clearance; AppShell/ModuleDock were not modified.

Implementation:

- Implementation checkpoint: `a99629935b68dac58a3e7fb8c1498e923fe5a174`.
- The three dense numeric groups now use one column below `sm` and preserve two-column density from `sm` upward.
- The form bottom clearance increased so the final fields can scroll above the elevated action bar.
- The action bar is lifted above the floating dock and given the higher local stacking order needed for reliable phone taps.
- No schema, query, threshold, hydration, repair-request, null/unknown, AppShell, navigation, or Digital Twin contract changed.

GREEN evidence:

- focused ENV-MOBILE-001 Playwright: 3/3 PASS (360 px layout, desktop two-column preservation, real phone interaction/save/validation path);
- full Playwright: 51/51 PASS, including the existing 34.7 s dirty-form hydration/reconnect regression;
- Vitest: 202/202 PASS;
- production build: PASS;
- oxlint: 0 errors, 12 pre-existing warnings;
- `git diff --check`: PASS.

Reviewer note: the deterministic submit mock confirms the existing form/API boundary preserves typed measurement values as numeric strings (for example `"2.5"`) before PostgREST coercion. This WO intentionally preserves that existing data contract rather than expanding into numeric-payload normalization.

## Acceptance criteria

1. 360 px phone can complete the form without horizontal scrolling.
2. Dense numeric labels/units are not compressed into unusable half-width controls.
3. Sticky action bar remains usable without obscuring completion.
4. Existing data/validation/hydration behavior is preserved.
5. New phone E2E proves the real workflow, not only static CSS.
6. Desktop/tablet behavior does not materially regress.
7. Exact-head CI is green and independent review returns APPROVED.

## Independent exact-diff review — 2026-08-27

Verdict: `CHANGES_REQUIRED — DO NOT MERGE`

- Reviewed PR: #40.
- Reviewed head: `87fdc7c0b014ed7279df93de7b4bdc539926debb`.
- Reviewed base: `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`.
- Remote state at review: OPEN, CLEAN/MERGEABLE, no branch protection/ruleset, and no server-required checks.
- Visible `smoke`, `scripts`, and `notify` checks succeeded. The E2E job checked out GitHub's synthetic PR merge commit `e330b26ce966620c6e84bbb482746a5c68bf3a53`, not the literal reviewed head SHA, so the strict exact-head evidence gate remains unresolved.
- The review is recorded on PR #40 as commit-anchored review `5038101969`. GitHub rejected a formal `REQUEST_CHANGES` event because the authenticated repository owner opened the PR; the review comment is therefore the durable blocking record.

Blocking findings:

1. `QuickChips` uses `min-h-[36px]`, below the binding 44 px touch-target minimum.
2. The focused E2E does not prove the applicable 430 px/tablet, touch-target, keyboard/touch, save-failure/retry, repair-request, edit-action, or visual-evidence gates.
3. The current success-only submit mock does not prove the required error lifecycle or value preservation after a failed save; existing SSoT overstates this coverage.
4. The prior ownership record named GPT as both implementation writer and final reviewer/merge owner, violating the independent-review gate.
5. CURRENT-WORK/HANDOFF and the PR body did not record the actual PR head/remote evidence packet.

Remediation is sequential and file ownership must not overlap:

1. GPT-5.6 Sol MAX owns only the production UX correction in `DailyFormPage.tsx` and its lane handoff.
2. After that commit is pushed, GLM-5.3 owns only `daily-form-mobile.spec.ts` plus its lane handoff and verification evidence.
3. GPT-5.6 Sol Ultra performs a fresh exact-SHA review only after both lanes stop at `RE-REVIEW_REQUESTED`.
4. Any HEAD change invalidates the review evidence above; do not reuse it as approval.

## Final closure evidence — 2026-08-28

Verdict: `APPROVED / MERGED / DEPLOYED / PRODUCTION-SMOKED`.

- Final reviewed PR head: `f7af3027dafe52f06719a2e08de993a31045162f` against base `08db62c821cf7b95aaeb373c603d77ccc4d9b98a`.
- Final production remediation: `b7c2623168da4d6fac8990a7f90180ee1b1326f1`; the following `f7af302...` checkpoint was docs/evidence only.
- Independent local verification at final head: failed-save regression **20/20 PASS**; full mobile DailyForm spec **11/11 PASS**; Vitest **202/202 PASS**; build PASS; lint **12 baseline warnings / 0 errors**; `git diff --check` PASS.
- Full local Playwright under parallel load produced **58 PASS / 1 navigation timeout** in unrelated `modules.spec.ts` while loading `/chemical`; the exact failed test then passed **10/10** in isolated reproduction, so it is classified as a resource/navigation flake rather than an ENV-MOBILE-001 regression.
- Final PR CI: `smoke`, `scripts`, and both `notify` checks SUCCESS. GitHub checked PR merge ref `05b101344c3e23d1deb28f00f8778cf6a6433d00`, recorded as `Merge f7af302... into 08db62c...`.
- PR #40 merged to `main` as `74675a532a871c7bba78de15eccb35b6b0ba433b`; final feature head is an ancestor of that merge.
- Post-merge main workflows: `test` run `33142966683` SUCCESS; E2E smoke run `33142966680` SUCCESS; GitHub Pages deploy run `33142966767` SUCCESS.
- GitHub Pages deployment `6135815691` reports `success` for exact main SHA `74675a5...` at `https://aase7en.github.io/env-wastewater-webapp/`.
- Live 390×844 production smoke: HTTP 200; login UI renders; protected `/form` routes to `login?next=/form`; no horizontal overflow and no browser console/page errors. Deployed JS bundle `assets/index-52kKWH_i.js` contains the new DailyForm remediation markers.
- Data-honesty invariants remain unchanged: no schema/RLS/query/payload-normalization/manual-vs-live semantics were modified.
- Residual non-blocking risk: the page-local action-bar guard observes ModuleDock's existing `z-[35]` scrim implementation detail because shared AppShell/ModuleDock were intentionally outside this WO. The regression suite pins the required interaction contract.

All seven acceptance criteria are satisfied. Any future DailyForm behavior change requires a new bounded work order and fresh evidence.

## Stop gate — CLOSED

ENV-MOBILE-001 is complete. No other module-form cleanup is included in this work order; domain-form convergence continues only through a new `ENV-MOBILE-002+` bounded slice.
