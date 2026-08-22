# DT-VIS-P001 Review Evidence

Generated: 2026-08-23
Work: Site-authentic Aeration Diorama Blockout
Branch: `feature/dt-vis-p001`

## Before baseline

- `before-foundation.png` — pre-P001 Digital Twin foundation screenshot copied from the preserved `envww-twin-preview` worktree.
- `before-process.png` — preserved Process view screenshot from the same foundation worktree.

The baseline files are copied evidence only; their source files were not edited or deleted.

## After evidence

Generated deterministically with:

```text
set DT_VIS_EVIDENCE=1&& npx playwright test tests/e2e/digital-twin-visual.spec.ts --retries=0
```

Files:

- `after-desktop-light.png` — latest/manual-snapshot view with unknown water/aerator state preserved.
- `after-desktop-dark.png` — same visual slice under Aura dark theme.
- `after-mobile-360.png` — 360x800 field/mobile composition.
- `after-simulation.png` — explicit simulation state; aggregate aeration cue is allowed only because simulation data says aerator is running.
- `after-reduced-motion.png` — reduced-motion composition with accessible data panel.
- `after-context-loss-fallback.png` — renderer fallback after `webglcontextlost`.
- `after-process.png` — Process recovery reached from the fallback.

## Data-honesty checks represented by the evidence

- latest/manual snapshot is not labeled LIVE;
- unknown water level remains `ไม่มีข้อมูล` and no water level is invented;
- unknown aerator state does not display aeration bubbles;
- simulation is explicitly labeled as simulation;
- Process remains available when WebGL fails;
- reduced motion remains usable;
- mobile shell stays within the 360px viewport.

## Visual intent

P001 changes only the Aeration Tank diorama and presentation-level lighting/grid treatment:

- taller rectangular concrete tank;
- turquoise site pipe;
- red ladder;
- blue sign cue;
- concrete pad with restrained grass/hedge context;
- darker, less ornamental wastewater water material;
- warm daylight key light;
- generic Three.js grid removed.

No new treatment stages, inferred machinery, per-aerator telemetry, schema/Auth/RLS changes, or external hazard/map work are included.
