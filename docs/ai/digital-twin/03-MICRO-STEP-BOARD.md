# Digital Twin Micro-Step Board

Last updated: 2026-08-21

## Status Vocabulary

`BACKLOG → READY → IMPLEMENTING → TESTING → REVIEW_REQUESTED → APPROVED → DONE`

Use `WAITING_FOR_INPUT` when a task specifically requires user-provided reference material or a product decision.

## Active

### DT-VIS-P000 — Site visual direction and durable handoff

- Status: DONE when documentation commit is recorded
- Owner: Codex
- Scope: documentation only
- Result: site observations, visual decisions, work queue, and resume procedure stored in repo
- Tests: `git diff --check`; intended-file review
- Stop: do not begin scene implementation

## Proposed Next

### DT-REF-P001 — Confirm treatment-zone reference pack

- Status: WAITING_FOR_INPUT — private raw archive complete; annotation/drawings remain optional pending input
- Owner: User supplies references; Codex catalogs them
- Dependencies: none
- Completed:
  - archived 6 ground and 3 drone photographs in the private Drive reference folder
  - verified source/destination SHA-256 for all 9 files
  - created private `README.md` and `MANIFEST.sha256`
- Optional next inputs, highest value first:
  - annotated drone image showing exact treatment-zone boundary
  - closest available top-down drone crop
  - general arrangement/site plan if available
  - Aeration Tank plan/section and basic dimensions if available
- Privacy: do not commit originals without permission
- Acceptance: uncertainty and confirmed facts are separated in `09-SITE-VISUAL-REFERENCE.md`

### DT-VIS-P001 — Site-authentic Aeration Diorama Blockout

- Status: BACKLOG — requires explicit user approval
- Owner: Codex
- Reviewer: Architecture/UX reviewer
- Dependencies: foundation `e79073d`; visual brief; reference pack may remain partial if uncertainty is documented
- Allowed:
  - `frontend/src/components/digital-twin/WastewaterTwin.tsx`
  - local visual helpers under `frontend/src/components/digital-twin/`
  - visual tests/fixtures directly required by the task
- Shared files require explicit temporary ownership:
  - `TwinCanvas.tsx`
  - `DashboardPage.tsx`
  - shared tokens/UI components
- Forbidden:
  - `frontend/src/lib/twin/**`
  - Supabase/Auth/RLS/schema
  - `ProcessFlowDiagram.tsx`
  - Blender/GLTF
  - new treatment stages
- Visual scope:
  - reshape the generic tank toward the real tall rectangular Aeration Tank
  - add site-identity geometry only where it improves recognition: turquoise pipe, red ladder/rail, blue sign, small grass/hedge context
  - use a three-quarter diorama camera and warm daylight
  - keep geometry procedural and intentionally minimal
  - do not add the full hospital campus or operations building
- Data behavior:
  - preserve unknown level and aerator state
  - preserve explicit demo/scenario labeling
  - do not attach per-unit ON/OFF status to visible equipment
- Acceptance:
  - tank is recognizable against the supplied site description
  - desktop and mobile composition remains readable
  - Process fallback remains accessible
  - no new operational inference
  - reduced motion remains functional
  - build, lint baseline, unit tests, full Playwright, and `git diff --check` reported
  - before/after screenshots recorded

### DT-VIS-P002 — Aeration water and system-level motion language

- Status: BACKLOG
- Owner: Codex
- Dependency: DT-VIS-P001 approved
- Scope: water material, aggregate aeration/turbulence cue, and reduced-motion still state
- Constraint: water must not resemble a clear ornamental pond; animation reflects only validated aggregate state or explicit scenario data
- Stop: no per-equipment telemetry or process formulas

### DT-VIS-P003 — Operational panel hierarchy and responsive polish

- Status: BACKLOG
- Owner: Codex
- Dependency: DT-VIS-P001 approved
- Scope: visual hierarchy of the existing DOM panel only
- Constraint: preserve Aura, Thai labels, source/provenance text, keyboard focus, Escape close, and 44px touch targets

### DT-QA-P001 — Visual/resilience acceptance pass

- Status: BACKLOG
- Owner: Codex with reviewer
- Dependency: approved visual implementation
- Evidence:
  - desktop light/dark screenshots
  - mobile portrait screenshot
  - unknown/latest state
  - explicit simulation state
  - reduced motion
  - WebGL unavailable/context-loss fallback
  - Process view switch
  - bundle comparison against foundation baseline

## Core-Engineering Request Only If Needed

### DT-DATA-P001 — Per-aerator renderer contract

- Status: DEFERRED
- Owner: Core Engineering
- Trigger: product owner requests individual Aerator #1/#2 state visualization and a validated source exists
- Current rule: aggregate `aeratorRunning` is insufficient for per-unit status
- Do not implement from photographs or checklist assumptions alone
