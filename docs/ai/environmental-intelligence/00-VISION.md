# Environmental Health & Climate Resilience Vision

Last updated: 2026-08-22

## Purpose

Extend UTH[AI]-ENV from an Environmental Operations Digital Twin into a broader **Hospital Environmental Intelligence Platform** that can help hospital environmental staff understand both internal operations and external environmental hazards that may affect patients, staff, utilities, access, and continuity of service.

This track is additive. It must not replace or destabilize the wastewater, solar, water, waste, air-quality, building-environment, or Digital Twin work already in the repository.

## Strategic Product Shape

```text
Hospital Environmental Intelligence Platform

                  AI assistance
                       |
      +----------------+----------------+
      |                                 |
Operations Intelligence          Hazard Intelligence
      |                                 |
Wastewater                        PM2.5 / smoke
Solar                             Heat / heat index
Water supply                      River level / discharge
Waste                             Flood extent / proximity
Air quality                       Rainfall / severe weather inputs
Buildings                         Hotspots / fire context
      |
Digital Twin / Process / Data views
```

## Primary Outcomes

The product should eventually help answer operational questions such as:

- What environmental hazards are relevant around the hospital right now?
- Is a value observed, forecast, satellite-estimated, modeled, or simulated?
- How fresh is the source?
- Is the trend improving, stable, or worsening?
- Which operational domains may be affected?
- What information should staff verify before taking action?

The platform is decision support, not an autonomous authority for emergency declarations, medical advice, engineering control, or official government measurements.

## First Hazard Domains

### Air Hazard

- PM2.5
- smoke/hotspot context
- source/freshness and observed-vs-estimated labeling

### Heat Hazard

- temperature
- relative humidity
- heat index where a validated source/formula is explicitly selected
- risk-band presentation only after the authoritative threshold policy is documented

### Water Hazard

- river/water level
- discharge where available
- trend over time
- flood extent/proximity where available
- rainfall context where useful

## Data-Honesty Invariants

These rules are mandatory across UI, database, alerts, maps, AI summaries, and Digital Twin integrations:

- Missing data != zero.
- Missing data != safe.
- Missing data != normal.
- Stale data != live.
- Forecast != observation.
- Satellite estimate != ground-station measurement.
- Model output != official measurement.
- Simulation != observed reality.
- A source timestamp and ingestion timestamp are different facts and must remain distinguishable.

## Human Factors

The target environment includes mobile phones, tablets, desktops, field work, outdoor glare, intermittent connectivity, and users who may need a rapid situational overview. Visual design should therefore favor:

- readable typography and 44px+ touch targets;
- map layers with a clear legend and source attribution;
- explicit freshness and provenance;
- compact risk summaries with drill-down evidence;
- graceful offline/stale-data states;
- conventional 2D data views even when 3D is available.

## Source-of-Truth Rule

This repository is the authoritative memory for this initiative. New agents must read:

1. `docs/ai/PROJECT-BRIEF.md`
2. `docs/ai/CURRENT-WORK.md`
3. `docs/ai/HANDOFF.md`
4. `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`
5. this folder when working on Environmental Intelligence
6. `docs/ai/tooling/AI-DEVELOPER-TOOLCHAIN.md` when changing agent/tool integrations

Chat history is not the project memory.
