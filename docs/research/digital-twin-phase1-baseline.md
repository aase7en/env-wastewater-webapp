# Digital Twin Phase 1 technical baseline

Measured from a production build on branch `feature/digital-twin-v3`.

## Bundle baseline

| Build | Asset | Minified | Gzip |
|---|---|---:|---:|
| Phase 1 (`9d7f208`) | `TwinCanvas` lazy chunk | 907.73 kB | 241.96 kB |
| Phase 1 (`9d7f208`) | main `index` chunk | 708.71 kB | 193.32 kB |
| Phase 1 (`9d7f208`) | CSS | 50.97 kB | 10.67 kB |
| Foundation Hardening | `TwinCanvas` lazy chunk | 909.19 kB | 242.47 kB |
| Foundation Hardening | main `index` chunk | 710.27 kB | 193.78 kB |
| Foundation Hardening | CSS | 50.99 kB | 10.68 kB |

The 3D renderer remains lazy-loaded. Three.js, React Three Fiber, and Drei are
contained in the `TwinCanvas` chunk rather than loaded on the Process view.
No bundle optimization is planned until real usage data justifies it.

## Known dependency warning

The browser console currently reports:

`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`

This is dependency-owned, not application-owned. Installed
`@react-three/fiber@9.7.0` constructs `new THREE.Clock()` in its renderer store
(`dist/events-*.js`), and installed `three@0.185.1` emits the deprecation
warning. Application source does not instantiate `THREE.Clock`. Do not patch
third-party files; re-check after a compatible React Three Fiber update.
