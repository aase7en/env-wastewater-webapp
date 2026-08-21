# PROJECT BRIEF — Environmental Operations Digital Twin

Last updated: 2026-08-21

## Project

`env-wastewater-webapp` / UTH[AI]-ENV is the hospital environmental monitoring application for โรงพยาบาลอุทัย. Wastewater is the first operational domain.

## Product Direction

Evolve the existing application into an **Environmental Operations Digital Twin** without rewriting working production features.

The target is a professional operational system with a stylized, understandable 3D representation. It is not a game and not a decorative 3D dashboard.

## Binding Constraints

- Preserve React, Vite, TypeScript, Supabase, Auth/RLS, React Query, existing forms, reports, sensors, routes, and the UTH[AI]-ENV Aura design system.
- Keep `ProcessFlowDiagram` as the existing schematic view and fallback.
- React Query/Supabase remains the source of truth for operational data.
- Zustand stores interaction state and scenario overrides, not a duplicate live snapshot.
- Unknown is not zero, normal, stopped, or off.
- Manual daily readings are **latest snapshots**, not LIVE telemetry.
- Do not invent timestamps, sensor provenance, equipment state, water level, or engineering meaning.
- WebGL/3D failure must not break the Dashboard or Process view.
- Preserve accessibility, keyboard operation, DOM alternatives, and reduced-motion behavior.
- Keep Phase 1 procedural and minimal; Blender/GLTF is deferred.

## Current Branch

Digital Twin foundation branch: `feature/digital-twin-v3`

Foundation implementation checkpoint before this documentation pass: `e79073d`.

This branch is intentionally separate from current production stabilization work. Do not merge or rebase it while another active work order owns shared files without coordination.

## Current Visual Direction

Working name: **UTH Environmental Treatment Garden**.

Use the real treatment plant for physical truth and the supplied cozy game references only for high-level presentation qualities:

- three-quarter/isometric readability
- warm daylight
- simplified, friendly low-poly forms
- natural landscaping and a compact diorama composition

Do not copy characters, game HUD, textures, maps, assets, or exact layouts.

The operational UI remains Aura: calm, professional, data-dense, and scannable.

## Domain Context

Relevant A-Wiki references:

- `wiki/entities/env/env-webapp-project.md`
- `wiki/entities/env/activated-sludge-system.md`
- `wiki/concepts/env/hospital-wastewater-treatment.md`

The current deployed data model and application source override older design documents when they conflict.

Private raw site-reference material is stored outside Git under:

`L:\My Drive\A-Wiki-Data\raw\environment\env-wastewater-webapp\digital-twin\site-reference\2026-08-21`

Agents may inspect it when the Drive is mounted, but must not copy the originals into Git or the frontend bundle without explicit authorization.

## Continuity Rule

Repository documentation is the durable memory layer. Chat is temporary.

Every new agent must read:

1. `AGENTS.md`
2. this file
3. `docs/ai/CURRENT-WORK.md`
4. `docs/ai/HANDOFF.md`
5. `docs/ai/digital-twin/README.md`
6. the remaining files under `docs/ai/digital-twin/`
7. `docs/agent-handoff/DIGITAL_TWIN_CONTINUITY.md`
