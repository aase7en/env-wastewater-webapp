# Environmental Operations Digital Twin Roadmap

Last updated: 2026-08-21

## Phase 0 — Repository and workflow alignment

Status: IN PROGRESS across branches

- durable documentation and agent handoff
- branch/worktree isolation
- production stabilization has priority

## Phase 1A — Digital Twin foundation

Status: IMPLEMENTED AND HARDENED on `feature/digital-twin-v3`

- Twin domain/types/adapters/selectors
- manual-snapshot provenance and unknown-first mapping
- interaction/scenario Zustand store
- lazy R3F renderer
- Aeration procedural proof of concept
- explicit simulation demo
- accessibility and reduced motion
- deterministic readiness and WebGL resilience
- temporary `3D Plant | Process` switch

This is not merged to `main`.

## Phase 1B — Site-authentic Aeration visual vertical slice

Status: DESIGNING

- document real-site references
- procedural diorama blockout
- site-authentic Aeration Tank proportions and visual identity
- wastewater-appropriate water material
- aggregate aeration motion language
- operational panel hierarchy and mobile composition
- visual/resilience QA

Do not add other treatment stages in this phase.

## Phase 2 — Wastewater plant twin

Status: FUTURE

Potential stages after separate domain and visual work orders:

- screening/pre-treatment
- sedimentation/clarifier
- chlorination
- discharge

Site drawings should determine topology and dimensions. Do not infer a complete plant from generic diagrams.

## Phase 3 — Realtime telemetry

Status: FUTURE

Only actual sensor streams may use LIVE semantics. Realtime is metric/source-level until a coherent snapshot contract exists.

## Phase 4 — Historical replay

Status: FUTURE

Requires a historical selection contract and explicit UI; it is not part of the current visual pass.

## Phase 5 — What-if scenarios

Status: FUTURE

Use `สมมติสถานการณ์ (What-if Scenario)` until a scientifically validated predictive model exists.

## Phase 6 — Multi-domain environmental world

Status: FUTURE

- solar
- water supply
- waste
- air quality
- buildings

## Phase 7 — AI Environmental Operator

Status: FUTURE

AI-assisted operation must remain auditable and must not become the authority for official measurements or controls.
