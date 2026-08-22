# Environmental Operations Digital Twin Roadmap

Last updated: 2026-08-21

## Phase 0 — Repository and workflow alignment

Status: IN PROGRESS across branches

- durable documentation and agent handoff
- branch/worktree isolation
- production stabilization has priority

## Phase 1A — Digital Twin foundation

Status: APPROVED / MERGED TO `main`

Merge checkpoint: PR #14 → `da3b70bdc5338f36c600efb3a3feedea2dee5420`.

- Twin domain/types/adapters/selectors
- truthful `latest` vs future `live` mode separation
- manual-snapshot provenance and unknown-first Aeration DO mapping
- interaction/scenario Zustand store
- lazy R3F renderer
- Aeration procedural proof of concept
- explicit simulation demo
- accessibility and reduced motion
- deterministic readiness and WebGL resilience
- temporary `3D Plant | Process` switch

The foundation review gate is closed. Visual work may continue only through the micro-step board and its explicit dependency/approval rules.

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

## Parallel Track — Environmental Health & Climate Resilience

Status: PLANNING

This track can progress independently of the 3D visual lane when its own work orders are approved. It adds source-aware external hazard intelligence without forcing hazard data into the 3D scene.

Initial domains:

- PM2.5 / smoke context
- heat / heat index
- river level / discharge
- flood extent / proximity
- rainfall/weather context where useful

Planned source families:

- GISTDA
- TMD
- ThaiWater / HII

Architecture and work queue: `docs/ai/environmental-intelligence/`.

Mandatory rules: forecast != observation, satellite estimate != ground measurement, stale != live, missing != safe, credentials remain server-side.

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
