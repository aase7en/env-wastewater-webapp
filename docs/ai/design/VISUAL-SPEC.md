# VISUAL SPEC

## Design Direction

Current production UI uses the repository's UTH[AI]-ENV / Aura visual language. Any task-specific visual direction should be defined here before implementation.

For future Digital Twin work, existing coordination docs describe a natural/cozy physical 3D world paired with a precise professional operational UI. Treat that as context, not as permission to change production visuals without an approved work order.

## References

- Existing repository design system under `design/`
- Existing coordination docs under `docs/agent-handoff/`
- TODO: add task-specific references.

## Color / Lighting

TODO

## Typography

Existing UI uses Plus Jakarta Sans with Thai fallback documented in repository design materials.

TODO: add task-specific typography rules only when needed.

## Layout

TODO

## UI Surfaces

TODO

## Depth / Materials

TODO

## 3D Scene Direction

TODO: no active 3D implementation task is authorized by this file alone.

## Camera

TODO

## Environment

TODO

## Lighting

TODO

## Materials

TODO

## Animation

TODO

Constraint: animated experiences must respect `prefers-reduced-motion`.

## Effects

TODO

## Performance Constraints

- Avoid unnecessary dependencies and large assets.
- 3D, when implemented, should be optional/lazy-loaded and must not block Process/Data fallbacks.
- TODO: record task-specific measured bundle/FPS/asset budgets after baseline measurement.

## Responsive / Device Considerations

- Phone/tablet usability matters.
- Preserve readable operational information on low-end devices and poor connections.
- TODO: add viewport-specific requirements for the active work order.

## Visual Acceptance Criteria

- [ ] Visual direction matches the approved work order/spec.
- [ ] Critical operational meaning is not fabricated or hidden by styling.
- [ ] Accessible non-Canvas/non-color paths remain available where required.
- [ ] TODO: add screenshot/device-specific criteria for the active task.

---

This file exists so an implementation agent can reproduce approved visual intent without relying on chat history. Unresolved design choices must remain TODO rather than being guessed.
