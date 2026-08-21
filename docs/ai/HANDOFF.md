# HANDOFF — Digital Twin Visual Direction

Status: DOCUMENTATION_READY

Last updated: 2026-08-21

## Repository State

- Repository: `env-wastewater-webapp`
- Target branch: `feature/digital-twin-v3`
- Foundation checkpoint before documentation: `e79073d`
- Production stabilization is proceeding separately. Do not mix its shared-file changes into this branch without an explicit integration work order.

## What Exists

### Domain layer

`frontend/src/lib/twin/` contains typed Twin metrics, the Dashboard adapter, selectors, an interaction/simulation store, explicit demo overrides, WebGL capability checks, and unit tests.

React Query/Supabase data is passed into the twin. Zustand stores only mode, selected asset, and simulation overrides; it does not duplicate the full live/latest snapshot.

### 3D layer

`frontend/src/components/digital-twin/` contains:

- `TwinCanvas.tsx`
- `TwinRendererBoundary.tsx`
- `WastewaterTwin.tsx`

The current proof of concept is deliberately minimal: a procedural rectangular tank, conditional water volume, a generic central aeration element, instanced bubbles in simulation/running state, lighting, grid, orbit camera, click selection, and an accessible DOM data panel.

### Dashboard integration

`DashboardPage` lazy-loads the 3D chunk and provides `3D Plant | Process`. The existing `ProcessFlowDiagram` remains available. Renderer readiness is exposed deterministically through `data-twin-status` for Playwright.

## Data Honesty State

Current `DashboardRow` mapping supplies DO and TDS as manual daily snapshot metrics. It does not supply tank level, aerator running state, or a reliable temperature value for the current dashboard contract; those remain unavailable.

Simulation values are explicitly synthetic and visibly labeled. Do not weaken this separation during visual work.

## New Visual Direction

The user supplied:

- six ground photographs of the treatment plant
- three drone photographs showing hospital/canal context
- four cozy fishing-game screenshots as style references

The original media is not committed to the repository. See `docs/ai/digital-twin/09-SITE-VISUAL-REFERENCE.md` for the durable written observations and the privacy/copyright boundary.

Key direction:

- real plant geometry and identity first
- cozy stylized three-quarter diorama presentation
- professional Aura operational UI
- no game mechanics or copied game assets
- aeration water must not look like a clear ornamental pond
- canal is spatial context only until plans verify actual hydraulic connections

## Important Correction to the Current POC

Ground photographs show a tall rectangular aeration basin with visible surface equipment at two positions, red ladder/piping, a blue Thai sign, lawn, hedge, and nearby buildings. The current generic central diffuser is not site-authentic.

This is a visual correction, not permission to invent per-equipment telemetry. The current contract exposes one aggregate `aeratorRunning` metric. Individual aerator ON/OFF states must not be shown unless Core Engineering exposes a validated contract.

## Next Work

Read `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`. The proposed next implementation is `DT-VIS-P001`, but it requires explicit user approval.

## Verification for This Handoff

This work order changes documentation only. Source build/test gates are not required unless source changes appear unexpectedly. Run at minimum:

- `git diff --check`
- confirm only intended documentation files are staged
- record the exact documentation commit below

## Documentation Commit

The documentation checkpoint is the commit containing this file. Verify it from the branch tip with `git log -1 --oneline`; do not attempt to embed a commit's own SHA inside itself.

## Resume Prompt

> Open `feature/digital-twin-v3`. Read `AGENTS.md`, `docs/ai/PROJECT-BRIEF.md`, `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, all files under `docs/ai/digital-twin/`, and `docs/agent-handoff/DIGITAL_TWIN_CONTINUITY.md`. Inspect source before trusting recorded implementation facts. Do not implement until the user approves the active micro task. Preserve unknown-first behavior, the Process view, accessibility, reduced motion, and WebGL fallback.
