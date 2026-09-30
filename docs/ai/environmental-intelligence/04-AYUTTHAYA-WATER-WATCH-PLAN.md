# Ayutthaya Water Watch — Detailed Product and Delivery Plan

Status: ACTIVE PLAN FOR ENV-WATER-WATCH-001
Checked: 2026-09-26
Parent product: UTH[AI]-ENV — Hospital Environmental Intelligence Platform
Repository: `aase7en/env-wastewater-webapp`

## 1. Product intent

Build a public-safety communication surface for water/flood context around Uthai District, Phra Nakhon Si Ayutthaya.

This is intentionally **not a GIS expert screen**. Geospatial computation may happen behind the scenes, but the public experience should read like a professional infographic that answers, in seconds:

- ตอนนี้เสี่ยงหรือไม่
- น้ำกำลังเพิ่ม/ลดอย่างไร
- จุดไหนต้องเฝ้าระวัง
- ควรทำอะไรต่อ
- ข้อมูลล่าสุดเมื่อไรและมาจากไหน

The first implementation is a standalone route inside the ENV codebase. It later connects to the ENV Command Center and Hazard Intelligence surfaces without creating a second application.

## 2. Visual North Star

Use the user-approved water dashboard concept as the visual target:

### Above the fold
- Hospital / product identity
- title: สถานการณ์น้ำ พื้นที่อำเภออุทัย
- timestamp/freshness
- one large risk statement
- four simple KPI cards: rain / water / trend / impact
- persistent data-mode indicator

### Main story
A stylized river corridor rather than a literal GIS map:
- upstream → Uthai/local → downstream
- station/area cards anchored to the river story
- explicit risk word and icon
- short distance-to-bank/trend evidence when scientifically valid
- Uthai Hospital visually anchored as the local point of interest

The river story is a communication diagram, not a geographic map and must not imply exact distance/scale.

### Advice panel
Plain-language summary:
- current status
- one or two evidence reasons
- 2–3 curated actions
- source/freshness note

AI is not required for v1. A deterministic template is safer and free.

### Supporting evidence
- compact trend/forecast graphic
- rainfall summary
- priority watch areas
- optional auto-rotation cue for the next regional slide

## 3. Information hierarchy

Order of importance:
1. Situation/risk
2. Action/advice
3. Trend
4. Local/upstream/downstream context
5. Freshness/source
6. Compact evidence
7. Technical detail only on deeper screens later

Do not lead with:
- raw lat/lon
- GIS layers
- station codes
- engineering tables
- dense legends
- technical API/provider terms

## 4. Display modes

### 4.1 Hospital TV mode
Target: 1920×1080, unattended display.

Requirements:
- one viewport, no primary scrolling;
- readable at 3–5 m;
- automatic refresh;
- future auto-rotation among regional stories;
- recover from network/provider errors;
- stale-data warning overrides cosmetic polish;
- do not keep a false-green screen when sources are stale.

### 4.2 Desktop web
Same first-glance composition with optional deeper links later.

### 4.3 Mobile public mode
Status and advice first. Mobile may scroll because the public task differs from unattended TV display.

Future CTA:
`ตรวจความเสี่ยงบริเวณที่ฉันอยู่`

### 4.4 Personal-location mode — later
- Browser Geolocation API only after explicit permission.
- HTTPS required in production.
- Coordinates are ephemeral by default.
- Do not persist to database/analytics without separate explicit consent.
- GPS accuracy must be considered; low-accuracy results cannot imply precise parcel-level safety.
- Result must state source/model/freshness and uncertainty.

## 5. Data and safety architecture

```text
Official/public providers
 HII/ThaiWater
 GISTDA FloodCheck / Disaster
 TMD
 RID / official warning sources
        ↓
server-side provider adapters
        ↓
normalized ENV observation contract
        ↓
freshness + quality guard
        ↓
deterministic risk engine
        ↓
curated advice playbook
        ↓
WaterWatchSnapshot
        ↓
public infographic UI
        ↓
optional AI wording layer
```

### AI boundary

AI may:
- rewrite validated facts in simpler Thai;
- summarize source-backed trends;
- explain stale/missing inputs;
- translate technical wording.

AI must not:
- invent measurements;
- choose official emergency status;
- invent thresholds;
- claim an observation from a forecast;
- issue evacuation/medical/engineering instructions beyond approved playbook;
- treat missing data as normal.

## 6. Risk-state design

These labels are reserved as a product contract, but production thresholds remain TO_VERIFY.

### NORMAL — ปกติ
Evidence says no defined watch/high condition is active.

### WATCH — เฝ้าระวัง
Validated rules detect rising concern but not a high-risk condition.

### HIGH — เสี่ยงสูง
Validated multi-source or authoritative source rule meets the future reviewed HIGH criteria.

### OFFICIAL_WARNING — แจ้งเตือนทางการ
Only when an identified official warning source actually issues a warning applicable to the location/time.

### UNAVAILABLE — ประเมินไม่ได้
Inputs required for a trustworthy result are missing/stale/failed.

Never collapse UNAVAILABLE into NORMAL.

## 7. Geographic model

Primary display focus:
- Uthai District

Context candidates:
- Mueang Phra Nakhon Si Ayutthaya
- Bang Ban
- Nakhon Luang
- Phachi
- Wang Noi
- Bang Pa-in
- downstream/control references such as Bang Sai when hydrologically relevant

Final monitoring points must be selected by hydrological relevance, not administrative proximity alone.

A later station-selection matrix should classify each point:
- UPSTREAM
- LOCAL
- DOWNSTREAM
- RAIN
- CONTROL_REFERENCE
- OFFICIAL_WARNING_AREA

## 8. Data pipeline phases

### Phase A — source verification
For every provider/product collect:
- provider and product name;
- official URL/docs;
- authentication;
- exact endpoint;
- method/parameters;
- response shape;
- observed/forecast/model/satellite classification;
- units;
- station/location identifiers;
- timezone;
- update cadence;
- rate limits;
- missing-value semantics;
- quality flags;
- attribution;
- license/redistribution;
- fallback;
- checked date.

### Phase B — deterministic fixtures
Store only sanitized fixtures. Never commit secrets or raw sensitive operational exports.

### Phase C — provider adapters
One provider adapter owns one raw contract. Raw provider fields do not leak into presentation components.

### Phase D — normalized observations
Use existing ENV environmental-intelligence provenance/freshness primitives when compatible.

### Phase E — risk engine
Pure deterministic functions with tests for:
- normal
- rising water
- near-bank condition
- high rainfall context
- source disagreement
- missing/stale provider
- official warning
- geolocation outside coverage
- low GPS accuracy

### Phase F — production snapshot
A snapshot selects only the facts required by the public UI.

## 9. Public advice playbook

Advice must be curated and reviewed before production. Candidate categories:
- ติดตามประกาศทางการ
- เตรียมของจำเป็น
- ยกของสำคัญขึ้นที่สูง
- หลีกเลี่ยงเส้นทางลุ่มต่ำ/น้ำท่วมซ้ำซาก
- เตรียมเส้นทางสำรอง
- ติดต่อหน่วยงานเมื่อมี official warning

Exact trigger-to-advice mappings are not approved in ENV-WATER-WATCH-001 and must not be inferred from demo data.

## 10. Failure-mode UX

### Stale source
Show:
`ข้อมูลล่าสุดล่าช้า — ยังไม่สามารถยืนยันสถานการณ์ปัจจุบันได้`

### One provider unavailable
Show partial evidence and clearly label unavailable source. Never silently reuse old data as current.

### All critical providers unavailable
Risk becomes UNAVAILABLE.

### Conflicting sources
Do not let AI choose the “more alarming” answer. Deterministic contract must define how to surface disagreement.

### Network outage on hospital TV
Keep last-known evidence only when its original timestamp remains visible, plus an offline/stale banner.

### Location denied
Public district dashboard still works; no repeated permission nagging.

## 11. Auto-slide future design

Hospital display story sequence:
1. อุทัย — current situation
2. ต้นน้ำ/พื้นที่เชื่อมโยง
3. ฝน + flood extent + forecast
4. nearby districts/provinces
5. official notices / public advice

Default future rotation: 15–30 seconds per story, adjustable after field testing.
Official warning may interrupt the rotation.

## 12. Performance / reliability

- no heavy 3D requirement for this public surface;
- no map library in Slice 1;
- use CSS/SVG/DOM river story;
- lazy-load public page from App.tsx;
- no new dependency unless existing stack cannot satisfy a proven need;
- avoid continuous decorative animation;
- respect reduced motion;
- hospital display should survive repeated long-running navigation/rotation tests.

## 13. Privacy

Personal-location mode later follows least-data-needed:
- browser asks permission;
- coordinate used for one risk request;
- coordinate not stored by default;
- no precise location in logs/analytics/error payloads;
- user can use district mode without location sharing.

## 14. Verification plan by milestone

### Visual slice
- TypeScript
- focused tests
- build
- desktop 1920×1080 no-scroll check
- mobile 390px first-status check
- a11y/semantic smoke
- screenshot review
- no secret/network call check

### Source adapters
- sanitized fixture contract tests
- schema-drift fail-closed
- timestamp/unit/missing tests
- no-network unit tests
- server-side secret boundary

### Risk engine
- deterministic decision-table tests
- missing/stale/conflict adversarial cases
- independent public-safety review
- Astra6 only if the reviewed risk policy is consequential enough to benefit from a second high-reasoning challenger

### Production release
- exact-SHA CI
- provider failure smoke
- hospital-display soak
- post-deploy freshness/provenance check

## 15. Astra6 decision gate

Astra6 is **not required for the visual/demo slice**.

Request Astra6 only at the Risk Contract freeze if:
- official and derived risk signals can disagree;
- HIGH/watch thresholds require cross-source adjudication;
- public advice triggers carry material safety consequences;
- the deterministic decision table needs an adversarial second opinion.

Do not spend Astra6 on routine styling, routing, component implementation, or straightforward provider parsing.

## 16. Exit criteria for program MVP

MVP is acceptable only when:
- a general user identifies situation + trend + action quickly;
- hospital TV display operates unattended;
- no fake live state;
- stale/missing states are explicit;
- every public risk can be traced to evidence + rule;
- forecast/observation/satellite/model remain distinct;
- public location mode does not retain coordinates by default;
- source outage does not create false reassurance;
- source licenses/attribution permit the deployed use;
- the feature integrates into ENV through the same stable feature package.
