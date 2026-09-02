# ENV-OPS-001 - Operations attention board contract

Status: MERGE_READY (contract reviewed at c830672b1e31b178970937fe18666f862788004a; production mutation not yet started)
Owner / architect: GPT-5.6 Sol
Implementation/review owner: assigned per bounded slice
Repository: `aase7en/env-wastewater-webapp`
Contract worktree: `A:\GitHub\envww-ops-001`
Contract branch: `docs/env-ops-001-contract`
Base: `origin/main@b39964498f585c1f1b10c01f5477ad6042d498e2`

## Goal

Create a truthful Operations surface that answers **what needs attention or action now** using only durable operational entities that already exist in the repository. Do not invent a generic incident model, lifecycle, severity, assignee, evidence relationship, or cross-domain linkage to make the board look complete.

## Contract archaeology

Source reality verified from current main, live-schema snapshot, migrations, production TypeScript, tests, repo SSoT, and A-Wiki companion context.

### REAL: `core.repair_request`

- Durable lifecycle: `open | in_progress | resolved | cancelled`.
- Fields available to UI: `id`, optional `equipment_id`, optional `reading_id`, optional `reported_by`, required `cause`, `status`, `created_at`, optional `resolved_at`.
- Existing `frontend/src/lib/repair.ts` provides read/create/resolve boundaries.
- Equipment page already renders repair status and proves this is an operational work-item concept.
### REAL: `wastewater.threshold_alert`

- One persisted row represents one threshold breach on one wastewater reading.
- Fields available to UI: `id`, `reading_id`, `field`, `message`, `created_at`, optional `notified_at`, optional `read_at`.
- `notified_at` means notification-delivery staging state.
- `read_at` means whether a user has dismissed/read the alert in the UI.
- **Unread is not unresolved.** There is no repair/resolution lifecycle on this table.
- There is no verified `severity` column; prior stale allowlisting was explicitly removed.
- Existing `frontend/src/lib/alerts.ts` is polling/focus refresh, not environmental realtime telemetry.

### REAL BUT BLOCKED FROM THIS SLICE: `building.inspection_round`

- Actual schema contains inspection date, location, inspector, findings, `issues_found`, `repair_needed`, photos, severity and free-text `assigned_to` among other fields.
- Actual `BuildingPage.submit()` currently creates only the inspection row.
- Repo/A-Wiki intent says `repair_needed=true` should feed `core.repair_request`, but actual durable linkage is not implemented.
- `ENV-BUILDING-REPAIR-001` remains Ultra-owned / `DECISION_REQUIRED`; its worktree is protected.
- Therefore Building inspection rows MUST NOT be presented as linked repair requests in ENV-OPS-001A.

### CAPABILITY ONLY, NOT A SETTLED RELATION: `core.attachment`

- Generic `entity_type + entity_id` attachment storage exists.
- No FK binds the target and no canonical Operations `entity_type` convention was found.
- ENV-OPS-001A must not claim repair/threshold evidence linkage from this generic capability.
## Not present as durable contracts

The current repo does **not** prove any of these as unified Operations entities:

- generic incident / case record;
- corrective-action or preventive-action record;
- generic cross-domain responsible unit/person relation;
- repair-request severity;
- repair-request assignee;
- generic Operations evidence relation;
- one lifecycle shared by alerts, repairs and inspections.

These remain unavailable rather than fabricated.

## First implementable vertical slice - `ENV-OPS-001A`

Build a **read-only Operations Attention Board** from exactly two independent source families:

1. unresolved repair requests (`open` + `in_progress`), with resolved/cancelled history secondary or omitted from the initial attention surface;
2. wastewater threshold events, preserving `read_at` as read/dismiss state only.

The two families may share page composition but MUST NOT be normalized into a fake generic incident object with invented fields.

Primary route target: `/operations`.

Primary question: **What requires review or follow-up now, and what evidence does the system actually have?**
## Data-honesty invariants

- Empty repair results mean no matching repair rows in the successful query; do not label the whole hospital "normal".
- Empty threshold results mean no returned threshold events; do not infer all monitored parameters are safe.
- Missing `equipment_id`, `reading_id`, `reported_by` or `resolved_at` stays unavailable.
- `read_at` is presentation acknowledgement only; it is not operational resolution.
- `notified_at` is notification delivery state only; it is not user acknowledgement.
- Do not derive severity from threshold field/message or repair cause text.
- Do not call polling data `LIVE`.
- Do not treat latest/newest as realtime telemetry.
- Do not combine repair and alert counts into a safety score or overall normal/abnormal state.
- Partial-source failure must remain visible: one source may render while the other reports error/unavailable.

## UX contract

Desktop/tablet:
- coordinated two-panel attention view with source identity visible;
- repairs and threshold events remain visually distinct;
- details progressively disclosed without decorative gamification.

Mobile 360-430 px:
- recompose vertically by operational priority;
- no horizontal document overflow;
- touch targets >=44 px when interactive;
- source/status/timestamp text remains legible without relying on color alone.

Accessibility:
- semantic headings/regions;
- keyboard reachable links/actions;
- explicit text labels for repair status and threshold read state;
- loading, empty and error states announced in ordinary readable DOM.
## Proposed bounded implementation scope for `ENV-OPS-001A`

Preferred mutable production scope after this contract is merged:

- `frontend/src/pages/OperationsPage.tsx` (new)
- `frontend/src/App.tsx` (route wiring only)
- one focused E2E spec under `frontend/tests/e2e/`
- reuse existing `frontend/src/lib/repair.ts`, `frontend/src/lib/alerts.ts`, `frontend/src/lib/hooks.ts`, and Aura primitives read-only
- one discoverability link only if needed and ownership is re-verified

No new database table or migration is required for the first slice.

## Strict no-touch / non-goals

- `frontend/src/lib/env-int/**` including the parallel GLM GISTDA lane;
- Building page/lib/schema/work order and the protected Ultra worktree;
- carbon/waste schema or rollups;
- Digital Twin / R3F;
- AppShell/ModuleDock unless separately claimed after ownership audit;
- repair schema/lifecycle changes;
- threshold schema/trigger changes;
- attachment schema or invented entity-type convention;
- generic incident/CAPA schema;
- real environmental writes or production repair/alert mutations during tests.

## RED / acceptance matrix

A1 unresolved `open` repair renders as repair work item with exact status text.
A2 `in_progress` remains distinct from `open`.
A3 resolved/cancelled is never counted as unresolved attention.
A4 repair with null equipment/reading remains valid and shows unavailable context rather than guessed linkage.
A5 unread threshold is labelled unread/unacknowledged presentation state, not unresolved incident.
A6 read threshold remains a historical threshold event, not "resolved".
A7 threshold has no fabricated severity.
A8 repair and threshold source errors render independently.
A9 successful empty repair query does not label the hospital normal/safe.
A10 successful empty threshold query does not claim monitored parameters are safe.
A11 partial-source success remains usable and the failed source is explicit.
A12 newest/latest data is never labelled live.
A13 360/390/430 px have no document overflow after stable rendering.
A14 keyboard navigation reaches page links/actions.
A15 source identity and timestamps are visible for decision-relevant rows.
A16 tests intercept/mock all REST/session traffic; no real write is allowed.

## Verification for implementation slice

Run applicable gates:

- focused Operations Playwright at 360/390/430 and desktop;
- focused unit/component tests if pure shaping logic is introduced;
- full Vitest;
- `npx tsc -b`;
- `npm run lint`;
- `npm run build`;
- full Playwright if route/shared composition changes require it;
- `git diff --check`;
- changed-file / forbidden-scope audit;
- exact remote PR diff + exact-head CI;
- post-merge Pages/deployed root-to-client smoke with mocked REST/no real writes.

## Review / release rule

Implementation author stops at `REVIEW_REQUESTED`. A fresh exact-SHA Standards + Spec/UX/Data-honesty review is required. Any material finding loops to repair -> NEW SHA -> fresh review. Merge uses an expected-head guard and must be followed by exact-main CI/deploy verification.

## Next safe action

After this contract reaches current main, create a fresh isolated `feat/env-ops-001a` worktree, re-run the ownership gate, establish RED browser evidence, then implement the read-only two-source Operations Attention Board without touching Building or ENV-INT provider scope.
