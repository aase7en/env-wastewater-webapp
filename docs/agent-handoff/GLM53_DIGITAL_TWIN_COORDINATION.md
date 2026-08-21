# UTH[AI]-ENV — GPT ↔ GLM 5.3 Coordination Brief

> Purpose: durable coordination file for GPT and GLM 5.3 while planning and implementing the Environmental Operations Digital Twin.
>
> Current task: **planning only**. Do not implement Digital Twin code from this document yet.

## 1. Product direction

Evolve the current production app from a wastewater monitoring webapp into:

**UTH[AI]-ENV — Environmental Operations Digital Twin**

Wastewater is the first complete vertical slice. Future domains may include water supply, energy/solar, carbon, buildings, waste, green areas, PM2.5/air quality, equipment and environmental sensors.

Do **not** rewrite the existing app. Preserve the working React/Vite/TypeScript + Supabase/RLS + React Query architecture, forms, reports, auth, tests and the existing SVG Process Flow Diagram.

## 2. Agent ownership

### GLM 5.3 — Core Engineering Owner

Own correctness and system behavior:

- domain architecture and TypeScript contracts
- Supabase/Postgres, RLS and query/data layer
- React Query behavior
- Twin state / snapshot / adapters
- provenance and freshness semantics
- historical state
- realtime sensor integration
- simulation / what-if scenario logic
- privacy, PHI boundaries, security and reliability
- unit/integration/backend-facing tests
- performance architecture and fallback contracts

GLM should **not** own art direction or visual polish.

### Codex — Visual Experience Owner

Codex will later own:

- React Three Fiber / Three.js scene implementation
- procedural 3D assets and GLB integration
- sprites / SVG visual assets
- materials, lighting, camera and scene composition
- water / bubble / flow / particle animation
- UI visual hierarchy and responsive polish
- cozy environmental art direction
- visual accessibility and visual regression

Codex must consume stable contracts from GLM. Codex must not invent data semantics or business rules.

### GPT / Chat — Architecture + Coordination + Review

GPT coordinates the agents, reviews architecture and UX, creates work orders, resolves scope conflicts and checks that visual design never fabricates operational data.

## 3. Required separation

Target data flow:

```text
Supabase / Realtime Sensors
        ↓
React Query
        ↓
Domain Adapters
        ↓
Twin Snapshot / Twin State
        ↓
Selectors
        ↓
┌──────────────┬───────────────┬─────────────┐
│ 3D Renderer  │ Process View  │ Charts/Data │
│    Codex     │ existing PFD  │  existing   │
└──────────────┴───────────────┴─────────────┘
```

The 3D renderer must **never** interpret raw Supabase records directly.

## 4. Data-honesty rules

These rules are mandatory:

- Never fabricate missing values.
- `null` / unavailable must remain unknown, not zero.
- Do not infer `waterLevelPercent` from `wastewater_in` unless a validated domain mapping exists.
- Do not infer `aeratorRunning` from `system_operating` unless explicitly defined by the domain model.
- Do not create timestamps when only a date exists.
- Manual daily readings are **LATEST**, not LIVE.
- LIVE is reserved for actual realtime sensor telemetry.
- Historical and Simulation states must be visually and semantically distinct from real/latest data.

Suggested modes to evaluate:

```ts
type TwinMode = "latest" | "live" | "historical" | "simulation";
```

Do not adopt this blindly; simplify if the current architecture does not need all modes yet.

## 5. Twin metric direction

Evaluate a minimal robust contract similar to:

```ts
interface TwinMetric<T> {
  value: T | null;
  source: "manual" | "sensor" | "derived" | "simulation" | "unknown";
  observedAt: string | null;
  freshness: "fresh" | "stale" | "unknown";
  provenance?: {
    acquisition:
      | "manual-daily-snapshot"
      | "realtime-sensor"
      | "derived"
      | "simulation"
      | "unknown";
  };
}
```

Use the real repository and real data model to decide the final shape.

## 6. Wastewater Digital Twin scope

First complete domain:

```text
Screening
   ↓
Aeration
   ↓
Sedimentation / Clarifier
   ↓
Chlorination
   ↓
Discharge
```

Potential supporting assets later: pumps, aerators, diffusers, sludge pumps, chlorine pumps, pipes and sensors.

Keep the existing SVG `ProcessFlowDiagram` as a fallback / alternate process renderer. Do not delete it.

Future UI may expose views such as:

```text
3D Plant | Process | Data / Trends
```

## 7. Simulation rule

Separate **animation** from **simulation**.

Animation example:

```text
aerator ON → renderer shows bubbles
```

Simulation example:

```text
Aerator #2 fails → scenario engine creates synthetic Twin state → renderer shows that state
```

Process formulas and scenario rules belong in Core Engineering, not inside React Three Fiber components.

Until a model is scientifically validated, call it **What-if Scenario**, not predictive simulation.

## 8. Normalized visual outputs

Where useful, Core Engineering may expose documented normalized semantic values, for example:

```ts
flowIntensity: number;      // 0..1
aerationIntensity: number;  // 0..1
```

Codex renders them. Do not normalize engineering values arbitrarily; mappings must be documented and testable.

## 9. Accessibility / resilience constraints

- Thai-language UI.
- Buddhist Era date presentation where appropriate.
- `prefers-reduced-motion` must disable or substantially reduce continuous animation.
- Critical information must remain available outside Canvas.
- WebGL failure must not break the Dashboard.
- Existing Process/Schematic view must remain usable when 3D is unavailable.
- 3D stack should be lazy-loaded and optional.
- Prioritize phone/tablet, flaky hospital Wi-Fi and low-end hardware.

## 10. Production stabilization comes first

A recent review documented 19 issues including 5 P0 and 4 P1 findings.

Before Digital Twin implementation, GLM must verify each important finding against **current source**, not blindly trust the report.

At minimum verify:

1. delete succeeds but UI reports failure
2. PHI leak through AI chat history
3. React Query cache survives sign-out
4. edit form can be overwritten by window-focus refetch
5. ErrorBoundary remounts AuthProvider on navigation
6. alert unread optimistic-count bug
7. carbon MoM gap calculation bug
8. role visibility write errors fail to surface
9. AI row annotation can bypass PHI protection

Classify each as:

- STILL PRESENT
- ALREADY FIXED
- NO LONGER APPLICABLE
- NEEDS MORE EVIDENCE

Do not begin major Digital Twin implementation with unresolved P0 privacy/security/data-integrity blockers.

## 11. Repository reconnaissance required

Before planning or changing code, GLM must inspect the real repository:

- `AGENTS.md`
- README and current status docs
- relevant ADR/design docs
- current code-review reports
- `frontend/src/lib/`
- wastewater types and queries
- React Query setup
- auth
- sensor/realtime code
- Dashboard / Overview / AppShell
- `ProcessFlowDiagram`
- tests
- git branch/status/recent commits

If A-Wiki is accessible, follow `AGENTS.md` and inspect relevant domain context there.

Source code overrides assumptions in this document.

## 12. Ownership / conflict policy

Likely GLM-owned areas:

```text
frontend/src/lib/**
supabase/**
db/**
scripts/**
```

Likely Codex-owned areas:

```text
frontend/src/components/digital-twin/**
frontend/src/assets/**
design/**
visual/style implementation
```

High-conflict shared files include:

```text
frontend/src/pages/DashboardPage.tsx
frontend/src/pages/OverviewPage.tsx
frontend/src/components/layout/AppShell.tsx
frontend/package.json
```

Only one agent should modify a shared file in a given work order / integration step.

## 13. Work-order format

Do not use one giant implementation prompt. Break work into small Work Orders.

Each Work Order must contain:

- ID
- owner: GLM or CODEX
- objective
- dependencies
- source files to inspect
- files allowed to modify
- files forbidden to modify
- implementation tasks
- tests
- acceptance criteria
- handoff artifact
- stop condition

Example IDs:

```text
WO-STAB-001
WO-TWIN-001
WO-TWIN-002
WO-VIS-001
```

## 14. Current requested deliverable from GLM

**Planning only. Do not edit repository files yet.**

Produce:

1. Current-state verification from source.
2. P0/P1 blocker verification.
3. Target architecture with ASCII diagram.
4. Minimum Twin domain contracts.
5. GLM / Codex / shared ownership matrix.
6. Real repo file-ownership matrix.
7. Safe branch/integration strategy.
8. Phased roadmap covering:
   - stabilization
   - Twin foundation
   - Aeration vertical slice
   - full wastewater plant
   - historical mode
   - what-if scenarios
   - realtime sensors
   - multi-domain environmental Twin
   - AI operator
9. An ordered backlog of roughly 20–30 small Work Orders. Distant work may be marked provisional.
10. Dependency graph between Work Orders.
11. Testing strategy.
12. Initial performance budgets.
13. Risk register covering privacy/PHI, data fabrication, WebGL/mobile, poor Wi-Fi, merge conflicts, simulation overclaiming and free-tier constraints.
14. The **first three GLM Work Orders** you recommend executing after plan review, with reasons.

## 15. Stop condition

For this planning task:

- Do not modify source files.
- Do not create branches.
- Do not commit.
- Do not run database migrations.
- Do not build the 3D scene.

Finish the response with exactly:

`PLAN READY FOR REVIEW`

---

## Coordination log

GPT may update this section later with approved decisions, completed Work Orders and handoff notes. Agents should not silently change architectural rules above; proposed changes must be reported explicitly for review.
