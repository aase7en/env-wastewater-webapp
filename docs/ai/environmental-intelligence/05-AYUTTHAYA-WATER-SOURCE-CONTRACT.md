# Ayutthaya Water Watch — External Data Source Contract

Status: DISCOVERY / PARTIALLY VERIFIED
Checked date: 2026-09-26
Owner: ENV-WATER-WATCH-001
Production ingestion: NOT AUTHORIZED BY THIS DOCUMENT

## Contract rule

A provider may be used in production only after both:
1. official documentation/catalog evidence is verified; and
2. the exact endpoint/request/response needed by ENV is exercised or otherwise confirmed against the user's actual entitlement/access.

A specification path is not automatically a production endpoint.

No provider credential may be committed to Git or exposed in the browser bundle.

## Evidence status vocabulary

- VERIFIED_DOC — official provider documentation/catalog verified.
- VERIFIED_RESPONSE — exact endpoint/request shape exercised and sanitized response verified.
- CANDIDATE — plausible source, but production contract not yet proven.
- UNVERIFIED — no sufficient evidence yet.
- BLOCKED — cannot proceed without access/terms/decision.

## 1. GISTDA FloodCheck

Provider: Geo-Informatics and Space Technology Development Agency (GISTDA)
Official catalog: https://opendata.gistda.or.th/dataset/floodcheck
Checked: 2026-09-26
Documentation status: VERIFIED_DOC
Exact production endpoint/payload: TO_VERIFY
Authentication: API key required per official catalog
License/redistribution: UNVERIFIED / not specified in the catalog evidence reviewed
Production use in Slice 1: NO

Official catalog capabilities relevant to this program:
- hourly flood-risk query for a specified latitude/longitude;
- hourly weather query for a specified latitude/longitude;
- hourly flood-forecast WMS;
- latest flood interpretation imagery/layer;
- short-horizon rainfall forecast service;
- water-level station-related resources.

Intended role:
- personal-location flood-risk candidate;
- modeled/forecast flood context;
- geospatial back-end evidence.

Required proof before use:
- exact lat/lon request endpoint + parameters;
- exact risk vocabulary/range;
- issue/valid time semantics;
- model/source classification;
- spatial resolution;
- update cadence;
- rate limit/quota;
- license/attribution;
- sanitized sample response;
- behavior outside coverage / missing result.

Important:
A future GISTDA model result is not an official emergency declaration unless the provider explicitly defines it as such.

## 2. GISTDA Disaster Open API

Official docs: https://disaster.gistda.or.th/services/open-api
Checked: 2026-09-26
Documentation status: VERIFIED_DOC
Authentication/usage details: TO_VERIFY against current service/key requirements
Production use in Slice 1: NO

Official documented JSON feature resources include:
- `GET /features/flood/1day`
- `GET /features/flood/3days`
- `GET /features/flood/7days`
- `GET /features/flood/30days`

Official page also documents geospatial map services including WMS/WMTS/TMS products.

Intended role:
- observed/interpreted flood-extent context from provider products;
- regional overlay/back-end spatial intersection;
- cross-check against point/station evidence.

Required proof:
- exact API base URL and current authentication flow;
- response GeoJSON/schema;
- event/acquisition/processing timestamps;
- meaning of 1/3/7/30 day products;
- attribution/license;
- coverage/update behavior;
- sanitized response for Ayutthaya.

## 3. HII Open Government Water-Level Dataset

Provider: Hydro-Informatics Institute (Public Organization), HII
Official catalog: https://data.go.th/th/dataset/water-level
Checked: 2026-09-26
Documentation/catalog status: VERIFIED_DOC
Historical/archive access: VERIFIED_DOC
Live production JSON endpoint: TO_VERIFY
Production use in Slice 1: NO

Official catalog facts reviewed:
- water level at 10-minute intervals;
- unit documented as metres relative to mean sea level / `ม.รทก.`;
- from February 2026, output follows ThaiWater.Standard format;
- station metadata and station-specific CSV/archive resources are available;
- missing markers include values such as `-999`, `999999`, `9999`, and `-` depending on resource.

Intended role:
- water-level history/fallback;
- station inventory;
- observed ground-station evidence.

Mandatory normalization:
- missing sentinels → unavailable/null, never zero;
- preserve source station ID/name;
- preserve source timestamp;
- preserve unit exactly;
- do not infer bank level/threshold from water level.

## 4. ThaiWater.Standard API specification

Official docs:
- Runoff: https://standard.thaiwater.net/
- API family includes standardized `/Runoff`, `/Rainfall`, and `/StationInfo` resources.

Checked: 2026-09-26
Status: VERIFIED_DOC for the standard/specification
Provider production base URL: TO_VERIFY
Production use in Slice 1: NO

Verified specification concepts:
- `GET /Runoff`
- `GET /Rainfall`
- `GET /StationInfo`
- station/province filtering concepts are part of the standard documentation.

Important:
The standard allows provider-specific base URLs. Therefore ENV must not hard-code a guessed `api-v3` or other production host based only on the standard documentation.

Discovery task:
- inspect ThaiWater/HII official client traffic or documented provider endpoint;
- exercise current public request;
- capture sanitized response;
- pin station IDs relevant to Uthai/Ayutthaya;
- verify CORS/auth/rate/terms;
- document fallback to HII archive if live access is unavailable.

## 5. ThaiWater / HII station selection for Uthai/Ayutthaya

Status: TO_VERIFY

Selection must use hydrological relevance, not only nearest straight-line distance.

Candidate classification:
- UPSTREAM
- LOCAL
- DOWNSTREAM
- CONTROL_REFERENCE
- RAIN

For each selected station record:
- provider station ID
- official Thai/English name
- latitude/longitude
- river/canal/basin
- administrative area
- variables
- bank/reference level only if officially supplied
- cadence
- last verified availability
- upstream/downstream relation evidence

Do not place a real station name beside a simulated measurement in production-looking UI without an explicit SIMULATED label.

## 6. Thai Meteorological Department (TMD)

Provider: Thai Meteorological Department
Official open-data catalog: https://data.go.th/
Checked: 2026-09-26
Catalog status: VERIFIED_DOC for candidate weather/forecast resources
Exact ENV endpoint/payload: TO_VERIFY
Production use in Slice 1: NO

Intended role:
- rainfall observation/forecast context;
- weather context;
- secondary evidence for risk engine.

Required proof:
- select exact official API product;
- observed vs forecast distinction;
- location/grid semantics;
- issue/valid times;
- update cadence;
- rainfall units/aggregation interval;
- missing/quality fields;
- attribution/terms;
- sanitized response for Ayutthaya.

Do not combine forecast rainfall with observed rainfall under one unlabeled number.

## 7. Royal Irrigation Department (RID)

Status: CANDIDATE / TO_VERIFY
Production use in Slice 1: NO

Potential role:
- authoritative station/control-structure context;
- cross-check for important river/control points;
- official thresholds only where the exact source defines them.

Required proof:
- exact public/API resource;
- station identifiers;
- current access method;
- units/timestamps/cadence;
- license/attribution;
- source semantics.

## 8. Official warning source

Status: UNVERIFIED
Production use in Slice 1: NO

Required before `OFFICIAL_WARNING` can exist in production:
- name the issuing authority and exact feed/API;
- define geographic applicability;
- issue/expiry timestamps;
- severity vocabulary;
- cancellation/update semantics;
- attribution and terms.

Until this contract is verified, the production system must never label a derived model state as `OFFICIAL_WARNING`.

## 9. Browser geolocation

Source: browser Geolocation API
Status: FUTURE FEATURE
Credential: none
Privacy rule: permission required; ephemeral use by default.

Production contract requirements:
- HTTPS;
- user permission;
- accuracy value considered;
- coordinates not written to logs/database/analytics by default;
- no PHI association;
- deny/timeout/low-accuracy states handled;
- geolocation is a lookup input, not itself risk evidence.

## 10. Normalized observation minimum

Every real environmental observation passed to Water Watch should be able to answer:

```text
provider
product
source_type
metric
value
unit
location/station/geometry
observed_at OR issued_at + valid_at
ingested_at
freshness
quality_status
attribution
license_status
```

Allowed source-type vocabulary should reuse existing ENV environmental-intelligence semantics rather than create conflicting meanings.

## 11. Provider failure requirements

Adapters must distinguish:
- input/caller error;
- provider/auth error;
- timeout/transport error;
- empty result;
- target not found;
- schema mismatch;
- stale data;
- unsupported location.

No failure becomes zero/normal.

## 12. Source verification queue

Priority:
1. HII/ThaiWater station inventory + live current-value access for Ayutthaya/Uthai.
2. GISTDA FloodCheck exact lat/lon risk request.
3. GISTDA Disaster flood feature response.
4. TMD exact rainfall/weather product.
5. RID/control-point source.
6. Official warning feed.

Output of each verification:
- sanitized fixture
- request contract
- field dictionary
- time/unit/missing semantics
- legal/attribution note
- reliability/fallback note
- checked date
