# WWTP Animated Three.js V3 — archived research prototype

- **State:** ARCHIVED CONCEPT / NOT APPROVED FOR PRODUCTION
- **Captured:** 2026-11-09 from a previously generated conversation HTML asset
- **Entry point:** [UTH_ENV_WWTP_Animated_Digital_Twin_V3.html](./UTH_ENV_WWTP_Animated_Digital_Twin_V3.html)
- **Purpose:** preserve the *interactive source code*, not a static image, for a future ENV Webapp React Three Fiber work order.
- **No use in current live UI:** This file is in documentation, not frontend routes, assets or deployment paths.

## What the prototype demonstrates

Orbit/zoom camera, raised tank walls, illustrated moving water and aeration bubbles, animated flow-direction arrows for water/sludge paths, Thai asset labels and hover details, clipping/cross-section and model layers. Three.js dependencies are via CDN; opening the HTML requires network access and WebGL. Neither its geometry nor its motion is proof of plant operation.

## Critical distinctions before reuse

1. The **current process-topology SSoT** is `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`, **not** this V3 archive. That document records user-sketch annotations of 50 m³ for aeration and 15.42 m³ for clarifier. Earlier concept/drawing discussions also mentioned 62.5 and 56 m³. These are **unreconciled**; verify from approved as-built drawings before claiming civil accuracy or capacity.
2. Existing labeled process connections do not mean flow is currently occurring. **Animation = illustrative explanation**. The emergency/bypass paths must not animate as normal active flow.
3. No sensor or manual daily readings are connected here. An unavailable measurement cannot appear as a realistic synthetic value; unknown != zero/OFF/normal.
4. The V3 React Three Fiber source bundle is archived under [react-source/](./react-source/) (eight source files extracted from the earlier ZIP). It is an **isolated prototype**, not imported into the deployed frontend. Review/port only after an approved work order and stable renderer/domain adapter contract.
5. Drawings, photographs and raw hospital data are not copied into the public repository by this archive.

## Next references

- [Future architecture and roadmap](../../13-WWTP-3D-V3-FUTURE-ARCHITECTURE.md)
- [Backlog work order](../../../../work-orders/ENV-WWTP-3D-V3-FUTURE.md)
- [Resumption handoff](../../../handoffs/ENV-WWTP-3D-V3-FUTURE.md)

Open in a locally served browser environment to inspect. Do not iframe/deploy the standalone demo as a shortcut into the authenticated operational UI.
