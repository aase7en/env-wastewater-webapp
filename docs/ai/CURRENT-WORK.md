# CURRENT WORK — Digital Twin Visual Direction

Status: DESIGNING

Last updated: 2026-08-21

> This file is the branch-specific authoritative task. It does not authorize source implementation until the user approves the named micro task.

## Work Order

`DT-VIS-P000` — lock site-authentic visual direction and durable handoff

Owner: Codex / Visual Experience Owner

## Goal

Convert the user's ground and drone photographs plus high-level game-style references into a durable, implementation-ready visual brief for the existing Aeration Tank proof of concept.

## Current Outcome

- Visual direction is documented as **UTH Environmental Treatment Garden**.
- Site observations, uncertainty, requested reference material, and data-honesty constraints are recorded in `docs/ai/digital-twin/09-SITE-VISUAL-REFERENCE.md`.
- Implementation is intentionally paused. No scene redesign is authorized by this documentation work order.

## Current Verified Foundation

Branch `feature/digital-twin-v3` at implementation checkpoint `e79073d` contains:

- Three.js, React Three Fiber, Drei, and Zustand
- `frontend/src/lib/twin/**`
- `frontend/src/components/digital-twin/**`
- lazy 3D/Process switch on `DashboardPage`
- manual-snapshot provenance and unknown-first mapping
- explicit simulation/demo state
- WebGL capability, initialization, error-boundary, and context-loss fallback
- accessibility and reduced-motion behavior
- unit and Playwright coverage for the foundation

## Immediate Next Decision

The user chooses whether to proceed with:

`DT-VIS-P001 — Site-authentic Aeration Diorama Blockout`

Before implementation, the assigned agent must state:

- files it will modify
- files it will not modify
- expected visible result
- acceptance criteria
- test and screenshot plan

## Allowed for DT-VIS-P000

- Documentation under `docs/ai/digital-twin/**`
- This branch-specific `PROJECT-BRIEF.md`, `CURRENT-WORK.md`, and `HANDOFF.md`
- `docs/agent-handoff/DIGITAL_TWIN_CONTINUITY.md`

## Forbidden for DT-VIS-P000

- Frontend source changes
- Supabase/schema/Auth/RLS changes
- `ProcessFlowDiagram.tsx`
- Blender/GLTF assets
- New treatment stages
- Realtime, historical, or scenario-engine implementation
- Merging to `main`
- Committing hospital-site photographs or scanned engineering drawings without explicit permission and a privacy/security review

## Acceptance Criteria

- [x] Branch and implementation checkpoint recorded.
- [x] Current foundation summarized from source.
- [x] Visual direction and anti-copy boundary recorded.
- [x] Ground and drone photo observations recorded without pretending uncertain details are verified.
- [x] Reference material request prioritized.
- [x] Micro tasks, ownership, dependencies, tests, and stop conditions recorded.
- [x] A fresh agent can continue from repository files without relying on chat history.
- [ ] User approves `DT-VIS-P001` before any scene implementation begins.

## Stop Condition

Stop after documentation, validation, commit, and handoff. Do not begin `DT-VIS-P001` in the same work order.
