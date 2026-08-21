# Digital Twin Master Architecture

Status: FOUNDATION IMPLEMENTED

## Data Flow

```text
Supabase / manual daily records / future sensors
                    ↓
              React Query
                    ↓
       typed adapters and provenance
                    ↓
          WastewaterTwinState
                    ↓
       selectors + scenario overrides
                    ↓
   ┌────────────────┼────────────────┐
   │                │                │
3D renderer    Process schematic   DOM data panel
 optional        existing PFD       accessible
```

## Ownership Boundaries

### Core Engineering

- `frontend/src/lib/twin/**`
- data adapters and semantic types
- metric provenance/freshness
- historical/realtime/scenario contracts
- Supabase, Auth/RLS, React Query
- business rules and validated normalization

### Visual Experience

- `frontend/src/components/digital-twin/**`
- scene composition, procedural geometry, camera, lights, materials
- water/bubble/flow visual behavior
- selection, responsive presentation, reduced-motion rendering
- accessible DOM alternatives and screenshot QA

### Shared/high-conflict

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/package.json`
- design tokens and shared UI components

One work order owns a shared file at a time.

## Current Domain Model

- `TwinMode`: `live | historical | simulation`
- UI semantics: non-sensor daily data is labeled latest/manual, never LIVE
- `TwinAssetId`: generic stable asset identifier
- `TwinMetric<T>`: value, source, observedAt, acquisition provenance, freshness
- simulation overrides: discriminated by asset type
- current implemented asset: Aeration Tank only

## Store Boundary

Zustand stores:

- mode
- selected asset
- simulation overrides

It must not become a second source of truth for the React Query snapshot.

## Resilience Boundary

The 3D renderer is lazy-loaded and optional. Capability failure, renderer initialization failure, render errors, and WebGL context loss must lead to a Thai fallback with access to Process view.

## Visual Contract Boundary

The renderer may stylize known physical structure, but it must not infer operational meaning from unrelated values. Examples:

- do not derive water level from `wastewater_in`
- do not derive aerator state from `system_operating`
- do not convert a date into an observation timestamp
- do not show individual aerator status when only an aggregate field exists
