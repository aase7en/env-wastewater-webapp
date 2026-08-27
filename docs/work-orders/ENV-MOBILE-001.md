# ENV-MOBILE-001 — Wastewater DailyForm Mobile-First Completion

Status: REVIEW_REQUESTED

Owner: GPT + SunDay-Worker 1 as temporary visual/responsive implementation writer for this bounded slice
Core Engineering: no production data-contract change expected; escalate if source reality requires one
Reviewer / merge owner: GPT

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

## Stop gate

Implementation owner stops at `REVIEW_REQUESTED`. No other module-form cleanup is included.
