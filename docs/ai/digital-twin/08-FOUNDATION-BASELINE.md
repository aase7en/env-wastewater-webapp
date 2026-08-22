# Digital Twin Foundation Baseline

Verified from source on 2026-08-21.

## Git

- Branch: `feature/digital-twin-v3`
- Foundation checkpoint: `e79073d`
- Foundation commits:
  - `9d7f208 feat: add aeration digital twin foundation`
  - `e79073d fix: harden digital twin foundation`

## Dependencies

- `three`: declared `^0.185.1`, lockfile `0.185.1`
- `@react-three/fiber`: declared `^9.7.0`, lockfile `9.7.0`
- `@react-three/drei`: declared `^10.7.8`, lockfile `10.7.8`
- `zustand`: declared `^5.0.15`, lockfile `5.0.15`

Re-check the lockfile/package manager after any dependency update before making version-specific claims.

## Domain Files

```text
frontend/src/lib/twin/
├── dashboard-adapter.test.ts
├── dashboard-adapter.ts
├── demo-state.ts
├── selectors.ts
├── store.ts
├── types.ts
└── webgl.ts
```

## Renderer Files

```text
frontend/src/components/digital-twin/
├── TwinCanvas.tsx
├── TwinRendererBoundary.tsx
└── WastewaterTwin.tsx
```

## Current Behavior

- DO and TDS map from `DashboardRow` into manual-snapshot metrics.
- Water level, aerator running state, and temperature remain unavailable from the current Dashboard contract.
- Demo overrides are explicit simulation values.
- Tank click/DOM button opens a keyboard-accessible data panel.
- Bubbles render only when `aeratorRunning.value === true`.
- Reduced motion freezes continuous bubble animation and uses demand rendering.
- 3D readiness is signaled after a rendered frame.
- WebGL unavailable/init failure/render failure/context loss falls back to Thai UI with a Process-view action.
- `ProcessFlowDiagram.tsx` remains untouched by the foundation.

## Test Coverage Present

- unit tests for mapping, invalid values, historical mode, simulation labeling, asset-specific override typing, and Zustand boundaries
- Playwright tests for lazy readiness, unknown/latest semantics, real Canvas click, animated demo, keyboard interaction, reduced motion, WebGL unavailable/init failure/context loss, and Process fallback

## Last Recorded Performance Baseline

The foundation-hardening run recorded approximately:

- lazy TwinCanvas chunk: 909 KB raw / 242 KB gzip
- main application chunk: 710 KB raw / 194 KB gzip
- CSS: about 10.7 KB gzip

Treat these as the Phase 1 comparison baseline, not permanent budgets. Re-run `npm run build` before and after visual implementation and report exact current output.

## Known Dependency Warning

The application source does not instantiate `THREE.Clock`. A deprecation warning observed during foundation verification originated in the current R3F/Drei dependency path. Do not patch third-party code; re-evaluate when dependencies are intentionally updated.

## Verification Caveat

This documentation pass inspected source but did not rerun the full frontend test suite because it changed documentation only. The next source-changing work order must rerun all required gates.
