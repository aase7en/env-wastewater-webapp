# Digital Twin Decision Log

Last updated: 2026-08-21

## D001 — Repository documentation is durable memory

Decision: Material project state, decisions, active tasks, and handoffs live in repository files rather than chat history.

Reason: Multiple agents and weekly/session limits require a stable continuation point.

## D002 — Existing app evolves; it is not rewritten

Decision: Preserve React/Vite/TypeScript, Supabase/Auth/RLS, React Query, routes, forms, reports, sensors, Aura, and ProcessFlowDiagram.

## D003 — React Query/Supabase remains the source of truth

Decision: Zustand stores interaction and scenario state only. It does not mirror the complete latest/live snapshot.

## D004 — Unknown-first operational semantics

Decision: Missing level, aerator state, temperature, provenance, timestamp, or freshness remains unknown.

Reason: Unknown cannot be rendered as zero, normal, stopped, or off.

## D005 — Latest manual snapshot is not LIVE

Decision: Daily/manual data uses latest snapshot/date semantics. LIVE is reserved for actual sensor telemetry.

## D006 — Generic asset identity from Phase 1

Decision: Selection uses `TwinAssetId` even though only Aeration is implemented.

## D007 — Asset-specific scenario overrides

Decision: Simulation overrides are discriminated by asset type. Future screening, sedimentation, chlorination, and discharge assets may define different shapes without weakening TypeScript safety.

## D008 — 3D renderer is optional and fallback-safe

Decision: Lazy-load 3D. WebGL capability, renderer initialization, render errors, and context loss must preserve access to the Process view.

## D009 — Visual direction: UTH Environmental Treatment Garden

Decision: Use site-authentic physical features inside a warm, low-poly, three-quarter diorama while keeping Aura UI professional.

Borrow from the supplied game references only:

- composition
- warm light
- simplified friendly forms
- readable depth layers
- natural framing

Do not copy game assets, characters, HUD, controls, textures, maps, or exact layouts.

## D010 — Aeration water is not an ornamental pond

Decision: Use a muted teal/olive/brown wastewater material with restrained highlights rather than clear saturated pond water.

Reason: A crystal-clear blue pond could falsely imply clean or potable water.

## D011 — Physical equipment does not create telemetry

Decision: Site photographs may justify neutral geometry for two visible aeration-equipment positions, but the current aggregate `aeratorRunning` field cannot drive individual unit states.

When aggregate state is true, any animation is a system-level aeration cue. When state is unknown, do not animate it as running and keep the DOM value as `ไม่มีข้อมูล`.

## D012 — Canal is context until engineering evidence exists

Decision: The nearby คลองข้าวเม่า may appear as distant spatial context in later site work. Do not draw a discharge connection or hydraulic path until a plan/validated contract confirms it.

## D013 — Phase 1 remains procedural and small

Decision: The first site-authentic blockout uses procedural Three.js geometry. Blender/GLTF, the full hospital campus, other treatment stages, and visual polish are separate later work.

## D014 — Site imagery and drawings are controlled references

Decision: Original ground/drone photographs and scanned engineering drawings are not committed to the public repository without explicit permission and privacy/security review. Durable written observations live in `09-SITE-VISUAL-REFERENCE.md`.
