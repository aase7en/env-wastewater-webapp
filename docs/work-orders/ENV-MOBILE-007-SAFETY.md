# ENV-MOBILE-007 — Safety Mobile Convergence

Status: REVIEW_REQUESTED
Owner / implementer: GPT-5.6 Sol via Serena (Visual Engineering fallback)
Independent review owner: external GLM-5.3 MAX or fresh independent reviewer; review must bind to the frozen pushed head
Parent roadmap: `ENV-MOBILE-002+` Domain form convergence
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-007-safety`
Branch: `feat/env-mobile-007-safety`
Base: `origin/main@59224e9482ade4d740cfb4c1fffc62880575204b`
Exact HEAD: freeze from the actual pushed branch/PR head immediately after this checkpoint commit; any head change invalidates review
Last updated: 2026-09-02

## Goal

Make `/safety` practical and accessible on 360–430 px phones while preserving the existing Safety monthly-check data contract, due-date semantics, import behavior, RLS, and useful tablet/desktop density.

## Selection rationale

Fresh read-only audit on exact main compared the remaining Roadmap group Food / Safety / Building:

- Safety currently exposes the densest field workflow: 6 grid fields + 5 toggles + issues textarea (12 visible controls before Save), monthly cadence, and `next_check_due` alert semantics.
- Food exposes 9 visible controls but `food.lab_test` has an AFTER INSERT reagent → `chemical.movement` trigger; that cross-domain stock side effect raises data-contract risk and is deferred to its own bounded slice.
- Building exposes roughly 8 visible controls and its durable contract says `repair_needed=true` feeds `core.repair_request` at app-layer; that side-effect/business-flow question should not be mixed into a visual convergence slice without separate source review.
- Safety `createSafetyCheck()` / delete path is direct single-domain CRUD. DB requires `check_date`; counts/due date are nullable, booleans have defaults. Import adapter separately validates date and remains read-only.

Therefore Safety is the highest operational/control-density slice with the cleanest visual-only seam.

## Source reality

- Route: `/safety`; page: `frontend/src/pages/SafetyPage.tsx`; data layer: `frontend/src/lib/safety.ts`.
- Current page uses `grid grid-cols-2 md:grid-cols-4`, so phones receive two controls per row.
- Current visible input controls have no page-local stable ID + programmatic label associations through `Field htmlFor`.
- Five boolean controls use the existing `Toggle` primitive and must retain their current meanings.
- Delete is a text-only action; 44 px touch size is unproven.
- History is a raw 5-column table; measure local/document containment before adding a wrapper.
- `check_date` is DB-required and import-required; current page has no explicit local blank-date recovery gate.
- `next_check_due` is used by `useUpcomingSafetyChecks`; its default/date semantics are read-only in this visual lane.
- No dedicated Safety mobile Playwright spec exists.

## Mutable scope

May edit only:

- `frontend/src/pages/SafetyPage.tsx`
- `frontend/tests/e2e/safety-mobile.spec.ts` (new)
- this work order
- `docs/ai/handoffs/ENV-MOBILE-007-SOL.md`
- bounded status/claim/closure entries in `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, `docs/ai/ROADMAP.md`, `docs/ai/graph/PROJECT-GRAPH.md`

## Forbidden scope

- `frontend/src/lib/safety.ts`
- Safety import adapter/tests
- Supabase migrations/schema/RLS
- `check_date`, `next_check_due`, count/boolean business semantics
- upcoming-alert behavior
- shared Input/Button/Toggle/Field/UI primitives/AppShell/ModuleDock/styles
- Food/Building/other modules or Digital Twin
- dependencies/workflows
- `.serena/**`
- real environmental/safety writes or hospital operational data

## Mobile contract — 360–430 px

1. Primary Safety text/date/number controls render one control per row on phones; useful multi-column density returns at larger breakpoints.
2. No settled document-level horizontal overflow.
3. History remains contained; add local horizontal scrolling only if measured need exists, and if added it must be named/focusable/keyboard-reachable.
4. Save/Delete touch targets used in the workflow meet the project 44 px minimum.
5. All visible non-Toggle form controls have stable page-local IDs and programmatic labels; existing Toggle labels remain programmatically operable and keyboard reachable.
6. Keyboard traversal reaches all controls/toggles and Enter activates Save.
7. Deterministic mocked save failure preserves all entered values; retry sends the same complete `SafetyInput` body.
8. Blank required `check_date` fails locally, makes zero POSTs, exposes a persistent associated error and focus recovery before retry.
9. Pixel-class touch save completes a representative synthetic Safety check without changing due-date/count/boolean semantics.
10. Existing `next_check_due` value/default behavior is preserved exactly.

## Tablet / desktop contract

- Preserve useful multi-column density at 768 and 1024 px.
- Toggle group remains readable and operable.
- History remains readable/actions reachable.
- Do not degrade desktop density to solve phone layout.

## Baseline / RED plan

Against unchanged activation head measure honestly:

- 360 px first/second field x-axis delta;
- stable/programmatic label association count for non-Toggle controls;
- Toggle keyboard/programmatic semantics as an already-green or red condition;
- Save/Delete dimensions;
- document + history-card containment with representative synthetic history;
- 1024 px multi-column density;
- blank-date POST/error/focus behavior;
- save-error/retry value/body stability where deterministic.

Record already-green conditions; do not manufacture RED.

## Verification

- focused `safety-mobile.spec.ts`, retries 0, worker 1;
- representative Pixel/touch context;
- keyboard/focus path including toggles;
- save failure/retry exact-body equality;
- required-date zero-POST/error/focus path;
- 360/390/430/768/1024 layout evidence;
- full Vitest;
- standalone `tsc -b`;
- lint (no new warnings/errors);
- production build;
- full Playwright;
- `git diff --check` + actual changed-file/scope review;
- deployed-bundle post-merge mobile smoke with all REST mocked/no real writes.

If a Safety business/data/import/schema/alert defect appears, stop that subproblem and route it to a separate Core WO. Do not broaden this visual slice.

## Implementation / verification checkpoint — 2026-09-02

- Truthful RED after harness correction: 5 FAIL / 5 PASS. REDs were phone two-column composition (154 px x-delta), 0/7 programmatic non-Toggle labels, 19.125 px Delete width, blank required `check_date` issuing 1 POST, and keyboard traversal blocked by the missing label seam. Existing Toggle semantics/touch rows, history containment, tablet/desktop density, retry-body preservation, Pixel touch semantics, and due-date/count/boolean values were already green.
- Page-local repair only: stable IDs/labels for 7 non-Toggle controls; one-column phone grid with `sm`/`md` density restoration; local required-date guard with persistent associated error and focus recovery; Delete >=44 px. No history wrapper was added because measured containment was already green.
- Fresh focused Playwright: 10/10 PASS (`--workers=1 --retries=0`) across 360/390/430/768/1024, keyboard, Pixel 7 touch, failed-save retry equality, zero-POST blank-date recovery, history containment, and preserved `next_check_due`/count/boolean semantics.
- Full deterministic gates: Vitest 229/229 PASS; standalone `tsc -b` PASS; lint 12 pre-existing warnings / 0 errors; production build PASS; `git diff --check` PASS.
- Full Playwright: 115/115 PASS, exit 0, one worker/retries 0. Local fresh-shell false failures were classified `ENVIRONMENT_FAILURE`: missing Vite Supabase config first crashed app boot; a localhost synthetic URL then changed the Supabase storage namespace and redirected the seeded fixture to `/login`. Re-run used the canonical project-ref URL plus a fake process-only anon value; all Safety REST remained mocked and no real safety/environmental writes occurred.
- Self-review found no forbidden production changes. `.serena/**` remains protected/untracked and must not be staged.

## Stop condition

Implementation stops at `REVIEW_REQUESTED` with exact pushed SHA, remote diff, focused/full verification, known limitations, and one next safe action. Implementer does not self-merge.

## One next safe action

Explicitly stage only the allowed Safety implementation/test/SSoT files, commit and push them, freeze the exact remote SHA, open the PR, audit the actual remote diff, then request independent Standards + Spec/UX review against that exact SHA. Do not merge before exact-head review and required CI are valid.
