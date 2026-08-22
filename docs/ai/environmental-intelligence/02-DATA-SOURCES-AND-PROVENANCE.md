# Environmental Intelligence Data Sources and Provenance

Last updated: 2026-08-22

## Policy

Provider documentation and the actual API response shape are authoritative. Do not infer undocumented fields or silently normalize incompatible products.

Credentials must never be stored in this repository.

## GISTDA

Status: AVAILABLE TO USER — API access/key exists outside the repository. Endpoint inventory not yet verified against the user's entitlement.

Planned uses to investigate:

- PM2.5 and related satellite/ground-fusion products;
- hotspot/fire context where licensed/available;
- flood/disaster layers and services where licensed/available;
- geospatial tiles/WMS/vector services where useful.

Required before production implementation:

1. inventory the exact endpoints/products available to the user's account;
2. record rate limits, units, spatial resolution, update cadence, attribution, and license/redistribution terms;
3. classify each product as observation, satellite estimate, forecast, model, or map layer;
4. store the API key only in a server-side secret store;
5. create deterministic fixtures from sanitized sample responses.

Do not paste the GISTDA key into chat or commit it to Git.

## Thai Meteorological Department (TMD)

Status: RESEARCH REQUIRED.

Potential role:

- air temperature;
- relative humidity;
- weather observations/forecasts;
- authoritative or source-backed heat-index inputs/products where available.

Do not implement a heat-risk band until the chosen data source and threshold policy are documented.

## ThaiWater / Hydro-Informatics Institute (HII)

Status: RESEARCH REQUIRED.

Potential role:

- river/water level;
- discharge;
- rainfall;
- station metadata and time series.

Before implementation, verify station coverage relevant to Uthai/Ayutthaya and the update cadence/API access method.

## Source Classification

Every surfaced value should be able to answer:

- Who produced this value?
- What product/station/layer produced it?
- Is it observed, estimated, forecast, modeled, manual, or sensor-derived?
- What location does it represent?
- When was it observed/valid for?
- When did our system ingest it?
- How old is it now?
- What quality/status metadata did the provider supply?

## Display Requirements

A hazard card/map popup should eventually include, where available:

```text
Metric: PM2.5
Value: ... µg/m³
Source: GISTDA <product>
Source type: satellite estimate / observation / forecast
Valid/observed: <timestamp>
Ingested: <timestamp>
Freshness: fresh | aging | stale | unknown
Location/resolution: <station/grid/area>
```

The UI must not hide provenance behind a generic "live" badge.
