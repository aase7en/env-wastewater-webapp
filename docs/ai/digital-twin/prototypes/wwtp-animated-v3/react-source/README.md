# ENV WWTP Animated Process Digital Twin — V3 Concept Component

**Deliverable:** React 19 / @react-three/fiber 9 / Three.js scene component for the existing ENV Webapp; **not merged or deployed**.

Interactive scene includes orbit/zoom, Thai asset labels + hover details, animated arrows along the actual modeled flow curves, waving water surfaces, aeration bubbles, raised (+0.78 m) concrete parapets and ground openings under tanks. Layout is reorganized per the user's hand-drawn site/process schematic (pump left; control building middle; aeration upper right; clarifier right-middle; sludge beds lower middle; chlorine tank lower right). Geometry is **schematic**; as-built dimensions/orientation/elevations and hydraulic gradients require survey.

**Motion ≠ telemetry:** arrows do not imply a pump is ON or represent measured flow rate. Aeration bubbles do not imply a blower is running. When `prefers-reduced-motion` is active, motion freezes. Unknown readings remain unavailable, never zero/OFF.

## Integration

1. Copy files to an authorized feature worktree under `frontend/src/components/digital-twin/wwtp-concept/` only after the approved Work Order, ownership claim and safe-mutation gate are satisfied. Do not overwrite the existing `WastewaterTwin.tsx`.
2. Import `WWTPDigitalTwin` or the example component. It uses already-installed dependencies `three`, `@react-three/fiber`, `@react-three/drei`, React.
3. Supply `snapshot: WWTPViewSnapshot` through a Core Engineering-approved adapter to the existing `src/lib/twin` contracts. A sample placeholder adapter is provided. Do **not** map readings directly in rendering code.
4. The component has a built-in 2D/process fallback when WebGL 2 is unavailable.
5. Verify build, rendering and interaction in an actual browser, low-end device and existing route, then request independent review before any merge.

## Verify

Pure model test: `wwtp-model.test.ts` (Vitest in frontend). TypeScript type/build checks should run from the authorized ENV worktree; they were **not run against the repository** in this package generation session. JS/TS transpilation syntax can be checked with TypeScript.

# UTH[AI]-ENV WWTP 3D React component — isolated integration candidate

This archive **does not modify** `A:\GitHub\env-wastewater-webapp`. It is a reviewable visual-only component prototype for the existing React + Vite + TypeScript + React Three Fiber app.

## Contents
- `WWTPDigitalTwin.tsx` — reusable React + R3F 3D wastewater view with Thai labels, hover details, selection callback, slicer, layer controls, bookmarks and fallback
- `WWTPDigitalTwin.css` — scoped responsive styles
- `wwtp-model.ts` — presentation-only asset catalogue and metrics interface
- `WWTPDigitalTwin.example.tsx` — minimal preview usage, with no fabricated readings
- `wwtp-env-adapter.example.ts` — typed optional boundary into existing `frontend/src/lib/twin/types.ts` (requires Core Engineering review)
- `wwtp-model.test.ts` — focused data-honesty tests for Vitest

## Integration approach

1. **Do not copy into a dirty or claimed repo worktree.** Current visual owner is Codex, current data owner is GLM; use the existing Work Order / claim gates.
2. In an authorized visual implementation branch, place these files under `frontend/src/components/digital-twin/wwtp-concept/`. Use current repository `@react-three/fiber`, `@react-three/drei`, `three`, `react` dependencies. Do not add CDN imports or a second Three.js runtime.
3. Existing `TwinCanvas`, `WastewaterTwin`, `TwinRendererBoundary`, Process diagram, and `frontend/src/lib/twin/**` should remain untouched until a stable integration contract is reviewed. Place this view behind an opt-in experimental tab or existing 3D affordance, not as a replacement for current primary workflows.
4. Have the Core Engineering owner build a pure, tested adapter **from existing `TwinMetric`/selectors** to `WWTPViewSnapshot`; do not parse raw Supabase records in the renderer. The asset catalogue is presentation-only; do not create a competing domain SSoT.
5. Preserve provenance: `manual-snapshot` on a calendar date is **LATEST**, never LIVE; realtime sensor telemetry alone may be LIVE. Unknown remains null and displays `ไม่มีข้อมูล`.
6. Add tests for null/not-zero semantics, manual date-only observations, mobile view, reduced motion, WebGL fallback and selection click/hover.

## Important limitations
- This is a schematic review candidate, **not surveyed BIM/as-built**. Coordinates, accessory dimensions, pipe routes and water levels are representative. The 60 m³ descriptor is from project context; its design basis/time basis is not yet verified and must not be asserted to mean per-day flow or individual tank capacity.
- Visual bubble motion is illustrative and MUST NOT be used to imply that an aerator is currently ON.
- Sensor and form data are NOT connected; all readings are initially unavailable. Do not infer DO from `do_average`, or infer equipment operation from `system_operating`.
- Optional extra metrics require a reviewed source/location/units mapping and a new adapter contract. Do not silently substitute similar-looking columns.

## Manual demonstration

```tsx
import { WWTPDigitalTwinExample } from './components/digital-twin/wwtp-concept/WWTPDigitalTwin.example';

export default function PreviewPage() {
  return <WWTPDigitalTwinExample />;
}
```

## Proposed next action (after ownership clearance)
Codex compares the 3D geometry visually with the supplied engineering drawings, GLM defines/validates the snapshot adapter, then independent review + CI + mobile/WebGL E2E verify the integration. Do not replace existing Digital Twin foundation by default.
