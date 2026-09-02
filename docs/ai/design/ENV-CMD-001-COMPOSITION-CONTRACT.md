# ENV-CMD-001 — Responsive Command-Center Composition Contract

Status: CLOSED — CANONICAL CONTRACT (PR #70 / merge c9542b2fc51e25bf30b2b0e68b38a91c35192b92)
Date: 2026-09-02
Authority: `docs/work-orders/ENV-CMD-001.md`
Source baseline: `origin/main@436dbe77095cdc9c8e205ba5438a3850392d3c7c`

## 1. Purpose

Define the reusable composition contract for the UTH[AI]-ENV Hospital Environmental Command Center before any production page rewrite.

This contract translates the user-confirmed prototype direction into an implementable hierarchy using existing Aura, analytics, routing, and Digital Twin foundations while preserving current data truth.

It intentionally does **not** define new environmental measurements, thresholds, provider payloads, schema, or live telemetry.

## 2. Core Product Question

The command center must let an operator answer, in this order:

1. **What situation is known?**
2. **What requires attention or action?**
3. **How current and trustworthy is that statement?**
4. **Where do I inspect evidence, history, process context, or take action?**

If the UI cannot answer #3, it must not visually overstate #1 or #2.

## 3. Non-Negotiable Data-Honesty Rules

- `latest` is not `live`.
- a recent browser fetch is not proof that the underlying observation is fresh.
- `observed/valid time` is not interchangeable with `received/fetched time`.
- missing/unknown is not zero, normal, safe, stopped, or compliant.
- stale information may still be useful evidence, but it must remain visibly stale.
- forecast, satellite/model estimate, manual/latest record, live sensor, and simulation remain distinguishable.
- no synthetic `0–100 health score` without a separately approved formula and authority.
- no “all systems normal” summary when a material source is unavailable, errored, stale, or unknown unless the statement is explicitly scoped to available sources.
- a status color is presentation, not evidence. Every meaningful state requires text.
- prototype sample values/status labels are never production facts.

## 4. Existing Foundations to Reuse

### Production routes

- `/` — authenticated `OverviewPage`; target for the first future Hospital Overview command-center slice.
- `/dashboard` — authenticated wastewater Dashboard + Digital Twin / Process.
- `/carbon` / `/carbon-rollup` — carbon/energy evidence surfaces.
- existing module routes such as `/garbage`, `/fuel`, `/safety`, `/food`, `/water-supply`, `/garden`, etc. remain the current drill-down destinations where relevant.

No broad navigation rewrite is part of `ENV-CMD-001` or the default `ENV-CMD-002` slice.

### UI / analytics primitives

Reuse before creating alternatives:

- Aura cards/buttons/chips/skeletons and existing theme tokens;
- `SituationMetricCard` for a known/unknown metric with optional trend, source type, provider, reference time, freshness and caller-supplied status;
- `ProvenanceBadge` for source type/provider/freshness presentation;
- `SituationChartFrame` for trend/evidence framing with caller-supplied source/threshold descriptions;
- existing accessible route links and button primitives.

### Digital Twin

The existing Digital Twin remains the spatial core and is already lazy-loaded inside `/dashboard`.

**Command Center rule:** `/` must not eagerly import or mount a second `TwinCanvas`/R3F Canvas merely to resemble a prototype.

The overview should provide a lightweight, accessible **Digital Twin / Process entry panel** that summarizes what is truthfully known and drills into `/dashboard`. A future visual preview may use a static/DOM/SVG/image treatment if approved, but the heavy interactive 3D runtime stays on its dedicated surface unless a separate performance-backed work order proves otherwise.

## 5. Four Orthogonal State Dimensions

Do not collapse all state into one badge.

### 5.1 Availability

Availability answers: **Can this panel currently present usable data/content?**

Canonical presentation states:

| State | Meaning | Required treatment |
|---|---|---|
| `loading` | request/content is pending | skeleton/status; do not invent prior status |
| `ready` | usable content exists | render value/evidence plus applicable metadata |
| `empty` | source/query succeeded but no record exists for the relevant scope | explicit “no data for this scope”; not zero |
| `unavailable` | capability/source is not currently available or not yet integrated | explicit unavailable treatment; no fake placeholder metric |
| `error` | retrieval/processing failed | error text + retry/drill path where meaningful |

`stale` is **not** an availability state; stale content can remain available evidence.

A domain may additionally expose a schema/license-specific reason through its own data contract later, but the composition layer must not invent those reasons.

### 5.2 Freshness

Freshness answers: **How current is the evidence relative to an approved domain/provider policy?**

Presentation vocabulary aligned with the existing analytics kit:

- `current`
- `stale`
- `unknown`

Rules:

- only claim `current` when a meaningful reference timestamp and freshness policy support it;
- otherwise use `unknown`;
- manual latest may be current according to its policy but must still remain labeled manual/latest, never live-sensor;
- `stale` remains visibly distinct even when the last known operational status was normal.

### 5.3 Provenance completeness

Provenance answers: **What evidence can the user inspect about origin and time?**

This is a display-completeness contract, not a replacement for the GLM Environmental Intelligence data model.

Use these presentation outcomes:

- **known** — source type and the decision-relevant origin/time metadata required by that domain are available;
- **partial** — some trustworthy origin/time metadata exists but the full provenance contract is not available;
- **unknown** — reliable provenance metadata is absent.

Rules:

- show only metadata the source actually supplies;
- never infer provider/source from a route, icon, or field name;
- “partial” and “unknown” must not silently disappear when provenance matters to a decision;
- when the GLM provenance lane establishes canonical provider-independent types, production implementation should adapt to them rather than create a competing global data contract.

### 5.4 Operational status

Operational status answers: **What does the owning domain say about the condition?**

The composition layer does not calculate domain status.

A panel may display a caller/domain-supplied status label and semantic tone only when evidence exists. The existing analytics tone vocabulary (`neutral/cyan/green/amber/red`) may be reused as presentation.

Rules:

- no status inference from color, trend direction, missingness, or age alone;
- no generic “normal” from `value != null`;
- `stale + last-known-normal` must read as stale historical evidence, not current normal;
- `unknown`/absent status stays explicit;
- alert/action priority is separate from the numeric metric value.

## 6. Panel Anatomy Contract

Every command-center panel must declare or make inferable from its component contract:

1. stable panel/domain id;
2. **primary question** answered;
3. hierarchy priority;
4. availability state;
5. primary value/statement, if any;
6. unit/aggregation/period where applicable;
7. freshness/reference time where applicable;
8. source/provenance where decision-relevant;
9. caller/domain-owned operational status, if applicable;
10. action/alert, if applicable;
11. drill-down destination;
12. desktop placement;
13. tablet behavior;
14. mobile behavior;
15. keyboard/touch behavior;
16. empty/unavailable/error behavior.

A card is not complete merely because it has a number and icon.

## 7. Command-Center Page Zones

The future `/` page should compose the following zones in priority order. A vertical slice may omit a zone when no truthful data/capability exists; it must not fill the gap with fictional content.

### Zone A — Context header

Answers: **What scope am I viewing?**

Contains:

- product/page title;
- hospital/environmental scope;
- optional refresh action when it has a real effect;
- no generic blinking “LIVE” indicator;
- no single global timestamp unless all displayed content genuinely shares that temporal meaning.

If source times differ, provenance remains panel-local.

### Zone B — Situation strip

Answers: **What is most important now?**

A compact set of decision-relevant situation cards using existing analytics primitives where appropriate.

Prioritize:

- actionable or abnormal known conditions;
- key domain situation metrics;
- stale/unknown state visibility.

Do not maximize card count. Initial `ENV-CMD-002` should use only domains whose current data semantics can be stated honestly.

### Zone C — Action / attention lane

Answers: **What needs human attention?**

May include authoritative alerts, required follow-up, or clearly scoped unavailable/stale-source warnings.

Rules:

- no fabricated incident/repair request;
- no automatic Building repair semantics while the Building contract is owned separately;
- a “nothing requires action” message is allowed only when its scope is explicit and the relevant sources are sufficiently available to support that statement;
- stale/unavailable source warnings are not automatically operational incidents.

### Zone D — Spatial/process anchor

Answers: **Where in the physical/process system should I look?**

For the first slice this is an accessible entry to the existing wastewater Digital Twin / Process experience.

Requirements:

- no second/eager Canvas;
- retain meaningful non-3D alternative;
- expose state text outside any future visual preview;
- primary action drills to `/dashboard`;
- if no trustworthy preview metric exists, use neutral descriptive content instead of a fake operating animation.

### Zone E — Trend / evidence lane

Answers: **How is the situation changing, and what evidence supports it?**

Use `SituationChartFrame` or equivalent existing patterns.

Requirements:

- clear period/aggregation;
- explicit empty state;
- supplied source/threshold description only;
- observed vs forecast distinction if both are present;
- no decorative chart without an operational question.

### Zone F — Domain situation modules

Answers: **Which environmental domains need deeper inspection?**

Cards link into existing real routes. A module may show:

- known metric/status with honest metadata;
- `unavailable`/`unknown` if the capability exists but trustworthy summary data does not;
- simple route entry without fake KPI if no summary contract exists.

### Zone G — Supporting evidence / quick actions

Answers: **Where do I record, review history, or open reports?**

Preserve high-value existing actions such as wastewater recording/history/trends/reports where they remain relevant. Do not let quick actions outrank current situation/action-required content on mobile.

## 8. Responsive Composition

“Responsive” means hierarchy recomposition, not shrinking a desktop bento grid.

### 8.1 Phone — 360 / 390 / 430 px

Priority order:

1. Context header;
2. Situation strip as one-column or swipe-free stacked cards;
3. Action/attention lane;
4. freshness/source information tied to each situation;
5. lightweight Digital Twin/Process entry;
6. one compact trend/evidence section at a time;
7. domain modules;
8. supporting quick actions/details.

Rules:

- no required horizontal page scrolling;
- critical state/action cannot depend on hover;
- do not hide source/freshness behind hover-only UI;
- important actions >=44px target;
- tables are not the primary command-center mobile pattern;
- secondary evidence may use disclosure/drawer/detail route, but current situation and required action remain immediately reachable.

### 8.2 Tablet — 768 px class

Tablet is a first-class operations surface.

Recommended composition:

- two-column situation cards where readable;
- action lane remains high in hierarchy;
- spatial/process preview may coexist beside selected evidence/detail when space permits;
- avoid desktop-density 12-column assumptions;
- touch remains first-class.

### 8.3 Desktop — 1024 / 1440 px

Use space for coordinated relationships, not simply larger cards.

Recommended 12-column conceptual composition:

```text
[ Context header ............................................... ]
[ Situation A ][ Situation B ][ Situation C ][ Situation D .... ]
[ Spatial / Process anchor ................ ][ Action / Attention ]
[ Trend / Evidence ........................ ][ Provenance / Detail]
[ Domain modules / cross-surface entries ....................... ]
[ Supporting quick actions / evidence .......................... ]
```

This grid is a hierarchy contract, not a requirement to reproduce the prototype's exact spans or ornamental styling.

## 9. Prototype Translation Rules

The preserved prototype may inform **hierarchy, density, panel relationships, and restrained operational visual direction**.

Translate, do not copy:

| Prototype motif | Contract translation |
|---|---|
| full-width carbon hero | high-priority situation/evidence band only when current carbon data supports the statement |
| Solar / Electricity / Water KPI cards | domain situation cards using real current contracts; unavailable when unsupported |
| glowing `OPTIMAL/STABLE/FLOWING` chips | caller/domain-authoritative status only; never copy status words |
| animated pulse | use only when motion conveys a verified state; never as generic fake-live decoration |
| topology illustration | spatial/process/Twin entry or future System Network only when real relationships exist |
| Waste/Fuel minor cards | module summaries only with truthful units/period/source; otherwise route entry/unavailable |
| dark high-density bento layout | Aura-based command-center hierarchy with light/dark support and responsive recomposition |

## 10. Situation Card Contract

Prefer the existing `SituationMetricCard` where its semantics fit.

Required display order:

1. metric/domain label;
2. caller-supplied operational status if any;
3. known value + unit OR explicit unknown label;
4. supplied trend, if any;
5. reference/observed time, if available;
6. provenance/freshness.

Known gaps for future implementation:

- `SituationMetricCard` does not itself own loading/empty/unavailable/error states; page/composition wrappers must handle them or a separately approved extension can add them;
- current provenance props are intentionally compact and may be superseded/adapted by the GLM provider-independent provenance core;
- production routes currently do not use this kit, so `ENV-CMD-002` must add focused component/page coverage rather than assuming story coverage is production evidence.

## 11. Alert / Action Rules

### Alert hierarchy

Use the owning domain's authoritative meaning and label.

Presentation priority can distinguish:

- critical/urgent known action;
- attention/follow-up;
- informational state;
- unknown/not evaluated.

But the command center must not invent this classification from raw numbers unless a verified domain rule already does so.

### Stale and unavailable data

Stale/unavailable data changes confidence, not automatically equipment status.

Examples of correct phrasing patterns:

- “ข้อมูลล่าสุดเก่า — ตรวจสอบก่อนตัดสินใจ”
- “ยังไม่มีข้อมูลที่เชื่อถือได้”
- “โหลดข้อมูลไม่สำเร็จ”

Avoid:

- “ปกติ” when the latest evidence is too old to support current normality;
- red alarm styling simply because a provider request failed unless provider failure itself is an operational incident contract.

## 12. Drill-Down / Cross-Surface Contract

Use existing real routes first. Do not create dead links to planned surfaces.

Initial route mapping for future `ENV-CMD-002` may use:

| Summary | Existing destination |
|---|---|
| wastewater / treatment process | `/dashboard` |
| wastewater trend/history | `/trends`, `/readings` |
| wastewater recording | `/form` |
| reports | `/reports` |
| energy/carbon | `/carbon` or `/carbon-rollup` according to the evidence shown |
| garbage/waste | `/garbage` |
| fuel | `/fuel` |
| water supply | `/water-supply` |
| safety | `/safety` |
| food / chemical / garden | their existing module routes when included |

Future Hazard Map, Operations, Resource Explorer, and System/Data Network links activate only after those real routes/contracts exist.

For future asset/source-level deep links, prefer stable ids/query contracts supplied by the owning feature; never route by matching translated visible labels.

## 13. Carbon / Energy Guardrails from Current Source

Current `public.v_overview_carbon` client contract exposes:

- month;
- row-count-like `days` aggregate field;
- kWh total;
- tCO2e.

It does not currently expose panel-level provider/source/observed timestamp metadata.

Therefore `ENV-CMD-002` must not invent provider/freshness labels for those values. It may:

- display the explicit month period already present;
- label provenance/freshness as unknown/unavailable if decision-relevant;
- or wait for a separately approved data-contract extension.

Do not interpret `days` as proof of complete unique-day coverage without source/schema evidence.

## 14. Wastewater Guardrails from Current Source

Current Overview/Dashboard use the newest row from a 14-day query as the primary wastewater record.

Rules for command-center implementation:

- call it latest/newest record unless exact date logic proves “today”;
- preserve the actual reading date;
- if the latest record is outside an approved current window, show stale/age context rather than current normality;
- `do_average` is a derived average field and must not be relabeled as a direct Aeration DO sensor reading;
- `input_source=iot` or similar storage metadata must not be promoted to `live_sensor` without a verified live telemetry contract.

## 15. Digital Twin Performance Contract

`DashboardPage` already lazy-loads `TwinCanvas`.

For `/` command-center work:

- preserve that code-splitting boundary;
- no eager import of Three.js/R3F/Drei just for overview chrome;
- no duplicate WebGL context;
- no continuous animation required to understand current situation;
- critical operational state remains in accessible DOM;
- reduced-motion remains respected;
- if a future static preview is added, measure its asset/init cost and keep it disposable without changing data semantics.

`ENV-CMD-002` acceptance must inspect the production build graph/output to prove the Overview slice did not accidentally pull the Twin runtime into the initial Overview bundle.

## 16. Accessibility Contract

- one clear page `h1`;
- section headings in logical order;
- cards/regions have understandable accessible names;
- color is never sole evidence of status/freshness;
- all interactive destinations keyboard reachable;
- >=44px important touch targets;
- no hover-only critical information;
- loading uses appropriate status semantics without noisy repeated announcements;
- error state gives readable recovery/action;
- source/time labels are understandable in Thai-first UI;
- charts require textual period/series/source context;
- any motion respects reduced-motion and does not imply unverified equipment operation.

## 17. Interaction Contract

- a summary card that is clickable must have one clear primary destination;
- nested action controls inside a whole-card link should be avoided unless semantics/keyboard behavior are explicit;
- drill-down preserves user's mental context (domain, period, asset/source id when supported);
- refresh must not reset navigation or falsely mark stale data as live;
- retry affects only the failing source/panel when architecture permits; one failed source should not blank unrelated command-center domains.

## 18. `ENV-CMD-002` First Vertical Slice Boundary

After this contract is approved/merged, `ENV-CMD-002` may incrementally upgrade the existing `/` route.

### Allowed initial implementation outcome

A responsive Hospital Overview that:

- reuses existing Aura + analytics primitives;
- shows a bounded truthful situation summary from currently supported internal data;
- exposes action/attention only from verified existing states;
- exposes reference date/source/freshness where current data contracts support them and explicit unknown/partial treatment where they do not;
- links to the existing wastewater Twin/Process surface rather than embedding a new Canvas;
- links to real domain routes;
- preserves existing auth and AppShell navigation;
- recomposes at 360/390/430/768/1024/1440.

### Explicitly out of scope for CMD-002 unless separately activated

- Building repair contract;
- GISTDA/TMD/HII production panels;
- Hazard Map route;
- Operations board;
- System/Data Network;
- Resource Explorer;
- T-VER eligibility/status;
- new carbon factors;
- schema/RLS changes;
- route architecture rewrite;
- second Twin Canvas;
- universal “hospital health score”.

### Dependency with GLM Environmental Intelligence lane

`ENV-CMD-002` does **not** need to wait for the entire external intelligence roadmap to improve current internal overview composition.

However any panel that claims normalized external provider provenance/freshness must consume the approved GLM provenance contract after it merges. Until then external hazard panels remain unavailable/deferred rather than mocked as production.

## 19. Acceptance Matrix for CMD-002

Future production implementation must prove at least:

| Width | Required behavior |
|---:|---|
| 360 | one-column operational hierarchy, no required horizontal page scroll, situation/action/source reachable first |
| 390 | same contract; 44px actions; no clipped status/provenance |
| 430 | same hierarchy with efficient spacing; no desktop-grid squeeze |
| 768 | tablet first-class split/2-column composition where useful, touch-safe |
| 1024 | coordinated desktop/tablet-landscape relationships without hidden critical state |
| 1440 | high-information coordinated layout; no gratuitous card stretching |

Also prove:

- loading;
- empty;
- unavailable;
- error + retry;
- fresh/current where evidence permits;
- stale;
- unknown value/source;
- independent source failure;
- keyboard order;
- reduced motion;
- no fake live status;
- no real writes in browser acceptance tests;
- production build keeps Twin runtime lazy from Overview.

## 20. Component Mapping for CMD-002 Planning

| Need | Reuse / likely seam | Rule |
|---|---|---|
| page surface | existing `OverviewPage` | modify incrementally; no greenfield route |
| metric situation | `SituationMetricCard` | reuse; wrapper/extension only if state requirements prove necessary |
| provenance | `ProvenanceBadge` | consume truthful metadata; adapt to GLM core later |
| trend frame | `SituationChartFrame` | no invented series/thresholds |
| loading | existing Skeleton/CardGridSkeleton patterns | panel-local where possible |
| status chip | existing Chip/status tone | caller/domain supplied |
| action | existing Button/Link patterns | 44px+ where important |
| spatial anchor | existing `/dashboard` Twin/Process | drill down; no second Canvas |
| current simple overview data | `useOverview` | read existing semantics; do not silently expand data contract |
| domain routes | current Router/AppShell | preserve; no broad IA rewrite |

## 21. Review Questions

Independent review should answer:

1. Does the contract protect the Digital Twin spatial-core rule?
2. Can a visual implementer follow it without inventing data semantics?
3. Are availability/freshness/provenance/operational state kept independent?
4. Does stale/unknown data avoid false reassurance?
5. Are prototype fake values/statuses explicitly excluded?
6. Is mobile genuinely recomposed?
7. Can CMD-002 ship independently of Building and external hazard integrations?
8. Does the contract reuse existing analytics/Aura architecture rather than create a parallel system?
9. Does it preserve code splitting/no duplicate Canvas?
10. Are cross-surface destinations real and stable enough for the first slice?

## 22. Decision

**Recommended contract:** approve the hierarchy/state model above and implement `ENV-CMD-002` as an incremental `/` vertical slice after exact-diff review/merge of this contract.

No additional human product decision is required for `ENV-CMD-001` based on current repository authority. Any new semantic requirement discovered during CMD-002 that would change a data contract, Building workflow, external provider provenance, or route architecture becomes a separate `DECISION_REQUIRED` / bounded Core work order rather than being silently absorbed into the visual implementation.
