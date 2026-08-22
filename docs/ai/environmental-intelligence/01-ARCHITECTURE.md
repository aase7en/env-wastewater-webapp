# Environmental Intelligence Architecture

Last updated: 2026-08-22

## Architecture Goal

Create a source-aware environmental data plane that can ingest external hazard information without leaking provider secrets into the browser or confusing estimates/forecasts with observed operational data.

## Target Flow

```text
External Sources
  GISTDA
  TMD
  ThaiWater / HII
  future validated providers
        |
        v
Server-side ingestion / proxy
  Supabase Edge Functions or equivalent trusted runtime
        |
        +-- credential isolation
        +-- provider-specific validation
        +-- retries / timeout / rate limits
        +-- source metadata capture
        v
Raw provider payloads (optional, policy-controlled)
        |
        v
Normalized environmental observations
        |
        +-- source
        +-- source_type
        +-- metric
        +-- value / unit
        +-- location / geometry
        +-- observed_at
        +-- forecast_for
        +-- ingested_at
        +-- freshness
        +-- quality/status
        v
Hazard Intelligence layer
        |
        +-- trend computation
        +-- source/freshness rules
        +-- threshold/risk policy
        +-- proximity / spatial joins
        v
UI / Map / Reports / Alerts / AI summaries
```

## Frontend Boundary

The React/Vite frontend must never contain private provider credentials. Do not commit private API keys and do not expose them through `VITE_*` variables unless the provider explicitly defines the key as public/browser-safe.

Preferred pattern:

```text
Browser -> our Edge Function -> external provider
                         |
                         +-> secret stored in managed server-side secrets
```

## Normalized Observation Contract

The exact database schema requires a separate reviewed work order, but normalized records should preserve at least these concepts:

- `domain`: air | heat | water | flood | fire | weather
- `metric`: provider-neutral metric identifier
- `value` and `unit`
- `source_provider`
- `source_product` / endpoint or layer identifier
- `source_type`: ground-observation | satellite-estimate | forecast | model | manual | sensor
- `observed_at` when it is an observation
- `forecast_for` when it is a forecast
- `ingested_at`
- `location` / station identifier / geometry
- `quality_status` where supplied by the source
- raw-source reference or checksum where retention is justified

## Freshness Model

Freshness must be metric/source-specific. Do not use a universal assumption that hourly data is always current.

Suggested presentation states:

- `fresh`
- `aging`
- `stale`
- `unknown`

The thresholds for these states must be documented per provider/product before implementation.

## Map Architecture

Preferred future map stack:

- MapLibre GL JS for the map/navigation/base vector-raster layer.
- deck.gl for larger geospatial point, heatmap, polygon, tile, and analytic overlays when needed.
- Three.js/R3F remains for the operational Digital Twin; do not force hazard mapping into the 3D Twin when a 2D geospatial view is more truthful and usable.

## AI Boundary

AI may:

- summarize current source-backed observations;
- compare trends;
- explain provenance/freshness;
- identify missing/stale inputs;
- draft operational checklists for human review.

AI must not:

- fabricate missing measurements;
- promote forecasts to observations;
- issue an official disaster declaration;
- invent clinical or emergency thresholds;
- execute physical controls without a separate validated safety architecture.

## Reliability Requirements

External-provider integration should eventually include:

- timeout and bounded retry policy;
- provider rate-limit awareness;
- caching with explicit timestamps;
- idempotent ingestion;
- duplicate protection;
- partial-source failure handling;
- observable ingestion status;
- deterministic test fixtures that do not depend on live external APIs.
