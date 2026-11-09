# ENV WWTP 3D V3 — Future Architecture and Integration Plan

**Status:** `FUTURE_BACKLOG / DESIGN_ONLY`, not an admitted implementation claim. **Updated:** 2026-11-09.
**Decision:** preserve the interactive concept and integrate incrementally with ENV's existing Digital Twin; no parallel application or database.

## 1. Scope and source hierarchy

The requested experience is a clean high-angle isometric 3D model reflecting the user's plant sketch: influent/pump sump on the left, control building in the middle, aeration upper-right, secondary clarifier right-middle, sludge drying beds lower-center, chlorine contact/final discharge lower-right. Raised concrete parapets above ground, visible water, pipes, equipment and accessible Thai labels are desired.
The archival concept (standalone HTML plus extracted `prototypes/wwtp-animated-v3/react-source/` source files) is **not survey-grade BIM** and its coordinates/elevations/pipe diameters/volumes are provisional. Before building process behavior, consult:
- `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` (user-confirmed topology);
- `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md` (P002 water motion backlog; P003 callouts completed);
- `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` and `ENV-PRODUCT-EXPERIENCE-GOAL.md`;
- actual source: `frontend/src/components/digital-twin/`, `frontend/src/lib/twin/`, `frontend/src/components/flow/`, `frontend/src/components/pfd/`, current schemas/tests;
- the existing A-Wiki ENV domain material as context, not a substitute for current schema.

**Unresolved engineering discrepancies:** diagram annotations of **50 m³ aeration** and **15.42 m³ clarifier** differ from concept references **62.5/56 m³**. Treat as disputed `ANNOTATION_UNVERIFIED`; neither figure is a confirmed as-built design volume or plant throughput. Request survey/as-built confirmation as the later feature's engineering gate.

## 2. Proposed architecture

```text
Manual forms + future approved sensors
     -> existing Supabase/Auth/RLS source
     -> React Query / domain adapters (Track Z)
     -> typed Twin snapshot / selectors (Track Z)
     -> presentation contract: assetId, metrics, source, observedAt,
        dataDate, freshness, mode, unit, equipment state (nullable)
     -> existing Digital Twin shell (Track F)
         |-> lazy-loaded R3F / Three.js scene (optional)
         |-> equivalent Process/Schematic DOM view
         |-> accessible Data/Evidence panel and Thai status list
```

`frontend/src/lib/twin/**` is authoritative for semantic state; **never** read raw Supabase rows in the scene or guess metrics from similarly named columns. Reuse existing camera, renderer boundary, callout/evidence and Process view where possible.

## 3. Visualization contracts

- **Structure:** map the canonical assets/edges to visual primitives. Normal path: influent → sump/screen → aeration → clarifier → flow weir → chlorine contact → discharge. Distinct edges for RAS back to aeration, WAS to drying beds, filtrate to sump, chemical dose, bypass and emergency overflow.
- **Motion:** illustrative gentle ripples, aeration particles and directional markers may run only in clearly marked `PROCESS_EXPLANATION` or `SIMULATED` mode; **never imply actual pump ON, current flow or real-time speed**. Bypass/emergency stay static by default.
- **Telemetry:** source classification `REAL/LIVE/LATEST/HISTORICAL/DERIVED/SIMULATED/UNAVAILABLE`; manual daily reading = `LATEST`, only actual sensor stream = `LIVE`; unknown = unavailable, not 0. Show source + date/freshness + unit and approved thresholds.
- **Equipment:** per-pump/blower/chlorine-doser timing, spec, operating state, duty/standby remain unknown until backed by an approved asset catalogue and telemetry contract. Aggregate system status cannot be projected onto individual devices.
- **Interaction:** orbit/zoom and bookmarked cameras; hover details plus keyboard, click and touch equivalents; accessible anchored callouts and evidence panel. Clipping X/Y/Z reveals sectional geometry without hiding crucial status evidence.
- **Resilience:** optional renderer behind lazy loading; preserve current Process/Data access when WebGL fails, context is lost, reduced motion is enabled, or device/network is low-end. Cap particle/pixel workloads and dispose geometries/materials/timers on unmount.

## 4. Staged roadmap (not authorization)

| Stage | Outcome | Owner | Exit gate |
|---|---|---|---|
| A — Preservation | Store source V3, docs, explicit limitations in a reviewable remote PR | Documentation/architecture owner | archive checksum, complete diff and review |
| B — As-built validation | Verify layout, datum, levels, dimensions, flow/weir/hopper/pipe geometry against signed drawings and site observations | Civil/environmental domain owner | approved geometry/uncertainty register |
| C — Semantic contract | Map canonical `assetId`, flow edges and optional metrics to existing Twin domain types; test null/source semantics | Track Z / GLM | typed adapter and tests; separate structural vs active flow |
| D — R3F scene | Port 3D to an opt-in view *inside* existing Twin; do not replace `WastewaterTwin` or shell | Track F / Codex | orbit, clipping, Thai labels, flow routes, non-WebGL and reduced-motion fallback |
| E — Verification | Mobile/tablet/desktop, keyboard, WebGL error, stale data, low-end GPU, CPU/memory cleanup, actual browser | Independent review + CI | frozen exact SHA, checks and reviewed performance |
| F — Sensor integration | Connect validated equipment/quality telemetry with provenance and freshness | Track Z + domain owner | authorization, live source proof, regression/E2E |

Dependencies: `DT-VIS-P002` owns aeration water-motion quality; `DT-VIS-P003` callout/evidence work is already delivered. `ENV-VIS-STORY-001A/001B` explain-process and scenario contracts should be reused, never duplicated. Activation requires a new canonical Work Order/claim and shared-hotspot ownership proof.

## 5. External design research interpreted conservatively

Reviewed `https://www.aihero.dev/skills`, `/skills-handoff`, `/skills-writing-for-agents`, `/skills-to-spec` on 2026-11-09. Useful patterns: targeted /handoff only when work crosses sessions/tools, specification written from agreed decisions, review focused on diff/spec, agent instructions short and durable. **Adapt**, do not install a competing workflow or copy third-party skill bodies: ENV already has `AGENTS.md`, `PROJECT-OPERATING-MAP`, `CURRENT-WORK`, `ROADMAP`, Work Orders and handoffs. The `/init` entry must route to those sources, not create a shadow registry.
