# ENV-MOBILE-007-SAFETY — Implementation / Review Handoff

Status: CLAIMED
Date: 2026-09-01
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-007-safety`
Branch: `feat/env-mobile-007-safety`
Base: `origin/main@59224e9482ade4d740cfb4c1fffc62880575204b`
Activation SHA: PENDING_CHECKPOINT
Review SHA: resolve from actual pushed branch/PR head; any head change invalidates review.

## Objective

Converge `/safety` for 360–430 px field use without changing Safety Core/date/count/boolean/import/RLS/alert semantics.

## Selection evidence

Fresh exact-main read-only audit selected Safety from Food / Safety / Building:

- Safety: 12 visible input controls before Save, monthly cadence + next-due workflow, direct single-domain CRUD.
- Food: 9 visible controls, but `lab_test` AFTER INSERT may decrement reagent inventory into `chemical.movement` when `reagent_used` is present.
- Building: lower control density, but durable contract includes `repair_needed` → `core.repair_request` app-layer intent.

Safety therefore has the highest control density and cleanest visual-only seam. Food/Building remain inactive/read-only.

## Allowed mutable scope

- `frontend/src/pages/SafetyPage.tsx`
- `frontend/tests/e2e/safety-mobile.spec.ts`
- `docs/work-orders/ENV-MOBILE-007-SAFETY.md`
- this handoff
- bounded CURRENT-WORK/HANDOFF/ROADMAP/PROJECT-GRAPH entries

No-touch: Safety lib/import/schema/RLS/alerts/business semantics, shared UI/AppShell/ModuleDock/styles, Food/Building/other modules, `.serena/**`, real hospital data.

## Current source findings

- phone form uses two columns (`grid-cols-2 md:grid-cols-4`);
- six grid fields + five Toggles + issues textarea;
- non-Toggle controls lack stable `id`/`htmlFor` associations;
- Delete target is text-only/unproven for 44 px;
- history is a raw 5-column table; containment must be measured;
- `check_date` is DB/import-required but page has no explicit local blank-date recovery;
- `next_check_due` default and alert semantics are read-only.

## Verification target

Focused RED/baseline first, then smallest page-local repair. Require 360/390/430/768/1024 evidence, labels/toggles, 44 px actions, history containment, keyboard/touch, failed-save retry equality, blank-date zero POST/error/focus, full deterministic suites, exact-SHA independent review, CI, merge, Pages and production mocked-REST smoke.

## One next safe action

Freeze activation docs checkpoint, then establish Safety mobile RED/baseline before editing production page behavior.
