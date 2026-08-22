# DT-VIS-P001 — Site-authentic Aeration Diorama Design Spec

Last updated: 2026-08-23
Status: APPROVED DESIGN DIRECTION / READY FOR VISUAL IMPLEMENTATION

## Purpose

Define the next Digital Twin visual vertical slice without relying on chat memory. This spec is subordinate to `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` and the Digital Twin data/behavior contracts already merged on `main`.

The Digital Twin remains the spatial/visual core of UTH[AI]-ENV. This task improves the existing Aeration Tank scene; it does not replace the Twin with a 2D dashboard and does not expand into the full treatment plant.

## Scope

Design and implement a recognizable, site-authentic Aeration Tank diorama using the existing React Three Fiber foundation.

In scope:

- Aeration Tank blockout/proportions;
- site-identity geometry: turquoise pipe, red ladder/rail, blue sign, limited grass/hedge context;
- three-quarter camera composition;
- warm natural daylight compatible with Aura UI;
- wastewater-appropriate water surface;
- aggregate aeration/turbulence visual language only when driven by validated aggregate state or explicit simulation;
- responsive composition for phone/tablet/desktop;
- visual states for latest/unknown/simulation;
- before/after screenshot evidence.

Out of scope:

- full hospital campus;
- new wastewater treatment stages;
- Blender/GLTF asset pipeline for this slice;
- per-aerator ON/OFF visualization;
- inferred water level, equipment state, DO, temperature, or flow;
- schema/Auth/RLS changes;
- changes to `ProcessFlowDiagram.tsx`;
- external hazard/map work.

## Visual Goal

The scene should read as a small premium operational diorama rather than a generic Three.js demo.

Target qualities:

- recognizable real-site silhouette;
- cozy/stylized physical world paired with precise professional operational UI;
- restrained detail and clean geometry;
- strong shape/color cues before fine texture;
- no sci-fi decoration that implies nonexistent instrumentation;
- no ornamental-pool water treatment.

## Scene Composition

### Primary mass

The Aeration Tank is the hero object. Use a tall rectangular concrete-basin form rather than a low generic box.

The tank should occupy roughly 55–70% of the visible scene width on desktop and remain readable without clipping on 360–430px mobile widths.

### Site identity cues

Use only cues already recorded by the site-reference workstream:

- turquoise/blue-green pipe;
- red ladder or railing;
- blue site/sign element;
- limited grass/hedge edge context;
- concrete/painted utility surfaces.

Do not invent additional machinery merely to make the scene look busy.

### Ground/environment

Keep the environment deliberately compact:

- small ground pad around the tank;
- limited vegetation border;
- no full hospital buildings;
- no distant skyline unless later site references justify it.

## Camera

Default camera: three-quarter elevated operational view.

Intent:

- show the tank interior/water surface and at least two exterior faces;
- retain recognizable pipe/ladder/sign silhouette;
- preserve a clear click/tap target;
- avoid extreme perspective distortion.

Desktop: hero object centered slightly left or center, leaving breathing room for DOM controls/labels.

Tablet: maintain full tank silhouette with modestly tighter orbit limits.

Mobile: prioritize a stable readable composition over large orbit freedom; the tank must remain visible without requiring the user to rotate immediately.

Do not use cinematic camera animation by default.

## Materials and Color

### Concrete / tank body

- matte to semi-matte;
- soft warm-neutral or site-authentic painted tone;
- enough roughness to avoid toy-plastic appearance;
- no high-frequency texture required for P001.

### Pipe

- turquoise/blue-green as the primary site-recognition accent;
- material should remain operational/painted-metal, not emissive.

### Ladder / rail

- red site-recognition accent;
- non-emissive;
- sufficient contrast in both light and dark Aura themes.

### Sign

- blue panel/sign cue;
- text detail may be simplified at this phase if legibility cannot be guaranteed in Canvas.

### Water

The water surface should look like wastewater-process water, not a clear ornamental pool.

P001 target:

- opaque/semi-opaque dark teal/green-blue surface;
- subtle surface variation;
- no transparency revealing an invented tank bottom;
- no foam/bubble field unless driven by validated aggregate aeration state or explicit simulation.

## Lighting

Use warm natural daylight with soft shadow hierarchy.

- one primary directional/sun-like key;
- restrained ambient/fill;
- preserve visible form in dark Aura mode without turning the 3D world into neon;
- avoid heavy bloom/glow;
- keep material colors stable enough that source/state colors in the DOM UI remain more semantically important than scene lighting.

## Motion

Default latest/unknown state:

- no equipment motion is inferred;
- water may use very subtle non-semantic ambient surface movement only if it does not imply aerator operation;
- if that distinction cannot be made clearly, use a still water surface.

Validated aggregate aeration state or explicit simulation:

- allow system-level turbulence/aeration cue;
- do not assign separate ON/OFF states to visible individual aerators;
- simulation must remain visibly labeled as simulation in the DOM UI.

Reduced motion:

- no continuous camera motion;
- suppress optional ambient animation;
- scene remains informative as a still composition.

## UI Relationship

The DOM operational panel remains the authority for text, units, provenance, and state labels.

Canvas should communicate spatial identity, not replace accessible data presentation.

Preserve:

- `3D Plant | Process` switch;
- Process fallback;
- unknown/latest/simulation labeling;
- keyboard focus and Escape behavior for the data panel;
- 44px+ touch targets;
- WebGL unavailable/context-loss fallback.

## Responsive Acceptance

### Mobile 360–430px

- hero tank remains recognizable without first rotating the camera;
- no horizontal document overflow;
- Canvas controls do not overlap essential UI;
- primary asset interaction target remains practical for touch;
- operational panel remains readable below/adjacent to Canvas;
- no clipped site-recognition cue that is required to identify the tank.

### Tablet

- treat as first-class field view;
- scene and operational panel may use a coordinated split where practical;
- avoid forcing desktop density.

### Desktop 1024px+

- scene should feel intentionally composed rather than simply enlarged;
- allow more breathing room and evidence/detail panels without hiding the hero tank.

## Data-Honesty Acceptance

Must remain true:

- unknown water level stays unknown;
- unknown aerator state stays unknown;
- `do_average` is not direct Aeration Tank DO;
- `latest` is not `live`;
- simulation is explicit;
- no per-equipment telemetry is inferred from site photographs or checklist assumptions.

## Performance / Engineering Guardrails

- keep procedural geometry modest;
- no large textures required for P001;
- no new 3D dependency without review;
- preserve lazy loading;
- preserve current fallback behavior;
- record any meaningful bundle delta;
- avoid unnecessary draw-call growth from decorative props.

## Evidence Required

Before reviewer approval:

- desktop light screenshot;
- desktop dark screenshot;
- mobile portrait screenshot;
- latest/unknown state;
- explicit simulation state;
- reduced-motion evidence;
- WebGL unavailable/context-loss fallback evidence;
- Process switch evidence;
- tests/build/lint baseline/diff-check report.

## Ownership

Visual/scene implementation owner: Codex or GPT visual engineer with one writer at a time.

GLM must not invent scene composition or edit this scene in parallel unless the active work order explicitly transfers file ownership.

Reviewer: GPT architecture/UX reviewer.
