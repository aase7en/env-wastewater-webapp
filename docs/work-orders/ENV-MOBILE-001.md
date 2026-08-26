# ENV-MOBILE-001 — Wastewater DailyForm Mobile-First Completion

Status: READY_FOR_IMPLEMENTATION AFTER ENV-ARCH-001 MERGES

Owner: visual/responsive implementation lane under GPT contract
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
