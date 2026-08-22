# UTH[AI]-ENV — Experience & Visual Intelligence Master Plan

Last updated: 2026-08-23
Status: DESIGN SOURCE OF TRUTH

## 1. Purpose

This document defines the shared product-experience direction for UTH[AI]-ENV. Every AI agent that designs, implements, reviews, or extends the web app must read this file before non-trivial product/UI/visual work.

The goal is to evolve the app into a **Hospital Environmental Intelligence Platform** without discarding the existing Digital Twin direction or rewriting proven operational workflows.

## 2. Non-Negotiable Product Rule

**The existing Digital Twin is the spatial/visual core of the product. It must not be replaced by a conventional 2D dashboard.**

New presentation patterns are additive intelligence layers around the Twin:

```text
UTH[AI]-ENV
Hospital Environmental Intelligence Platform

                    OVERVIEW
                       |
        +--------------+--------------+
        |              |              |
   OPERATIONS       ANALYTICS        FLOWS
        |              |              |
        +--------+-----+------+-------+
                 |            |
            HAZARD MAP     SYSTEM NETWORK
                 \            /
                  \          /
                   DIGITAL TWIN
                 3D Plant / Process
```

Digital Twin work already recorded in `docs/ai/digital-twin/` remains valid and continues on its own micro-step board.

## 3. Design Intent

The interface should feel like a premium operational-control and environmental-intelligence product rather than a collection of unrelated dashboards.

Use these qualities consistently:

- calm, high-information-density operational UI;
- Aura visual language and existing theme tokens;
- strong hierarchy rather than decorative complexity;
- data visualizations that answer a concrete operational question;
- Thai-first readability with mobile/tablet field use in mind;
- source, timestamp, freshness, and provenance visible where decisions depend on them;
- progressive disclosure: overview first, evidence/details on demand;
- 44px+ touch targets and outdoor-readable typography;
- animation only when it conveys valid state or improves spatial comprehension.

## 4. Primary Experience Surfaces

### 4.1 Digital Twin — Spatial Core

Primary question: **Where is it, what is it, and what is happening in the physical system?**

Keep and continue:

- site-authentic 3D diorama;
- Aeration Tank visual vertical slice;
- future wastewater stages only through approved work orders;
- `3D Plant | Process` fallback relationship;
- `latest`, future `live`, `historical`, and `simulation` semantics;
- unknown-first telemetry;
- reduced motion and WebGL fallback;
- site-specific visual identity rather than generic industrial assets.

The 3D view should become the recognizable visual signature of the project, but critical operational information must remain accessible outside Canvas.

Authoritative detail: `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`.

### 4.2 Operations — Action Control

Primary question: **What needs attention or action now?**

Presentation pattern: operational board inspired by expedition/mission-control layouts.

Potential content:

- active incidents;
- threshold events;
- repair requests;
- corrective/preventive actions;
- inspections;
- responsible unit/person;
- age of issue;
- progress/resolution state;
- evidence and linked asset/domain.

Do not gamify safety-critical status. Progress bars/badges may show workflow completion, but severity and operational truth must use explicit labels.

### 4.3 Analytics — Situation & Trend

Primary question: **What is the current value, direction, and evidence?**

Presentation pattern: compact situation cards above a time-series chart.

Example structure:

```text
PM2.5              Trend             Freshness          Source
36 µg/m³           Increasing        18 min             GISTDA

[ observed / forecast / threshold time series ]
```

Use for:

- PM2.5;
- heat / heat index;
- river level / rainfall;
- DO / pH / chlorine / TDS;
- wastewater volume;
- water use;
- electricity / solar generation.

Never invent a synthetic `0–100 health score` unless its formula and authority are explicitly approved. Prefer real measurements, authoritative risk bands, trend, freshness, and provenance.

### 4.4 Environmental Flows — Sankey / Flow Story

Primary question: **Where do water, energy, waste, and process quantities flow?**

This is a high-priority signature 2D visualization.

Candidate flows:

- water use → wastewater → treatment stages → discharge/sludge;
- grid + solar → hospital consumption domains;
- generated waste → waste categories → treatment/disposal routes;
- future carbon/energy accounting where data is validated.

Line width may encode quantity only when units and period are comparable and truthful. Missing quantities must remain missing rather than be inferred to complete a Sankey.

### 4.5 Hazard Map — External Environmental Context

Primary question: **What environmental hazard is around the hospital, where, and how fresh is it?**

Initial domains:

- PM2.5 / smoke;
- heat;
- river level/stations;
- flood extent/proximity;
- rainfall/weather context;
- hotspot/fire context where relevant.

Planned source families include GISTDA, TMD, and ThaiWater/HII. Map design must distinguish observation, satellite estimate, forecast, and model output.

Authoritative detail: `docs/ai/environmental-intelligence/`.

### 4.6 System / Data Network — Constellation View

Primary question: **How are systems, data sources, assets, and downstream decisions connected?**

This is an advanced view, not the default home page.

Useful node types:

- physical assets;
- domains;
- sensors;
- external APIs;
- normalized observations;
- alerts;
- work orders/actions.

Useful edges:

- supplies / flows-to;
- measures;
- derived-from;
- triggers;
- affects;
- depends-on.

This view can double as data-lineage/provenance inspection. Avoid decorative constellations with no interpretable relationship.

### 4.7 Resource Explorer — Hierarchical Contribution View

Primary question: **What is consuming or contributing the most?**

Presentation pattern: expandable hierarchy with proportional horizontal bars.

Potential domains:

- water use by building/process;
- electricity by system/building;
- waste by category/unit;
- maintenance workload by domain;
- emissions only after a validated accounting model exists.

Prefer this pattern over pie charts when users need to compare many categories and drill into hierarchy.

## 5. Navigation Model

Long-term top-level information architecture:

```text
Overview
Operations
Analytics
Flows
Map
Digital Twin
  - 3D Plant
  - Process
System Network
Reports / History
Admin
```

Do not implement this full navigation in one rewrite. Adopt it incrementally through scoped work orders and preserve existing routes until replacements are explicitly approved.

## 6. Cross-Surface Interaction Rules

The surfaces should behave as one product rather than isolated pages.

Examples:

- an Operations incident can deep-link to the affected Digital Twin asset;
- a PM2.5 card can open the Hazard Map at the relevant layer;
- a Sankey node can open its Analytics history;
- a Digital Twin asset can open its trend/provenance panel;
- a System Network source node can open source/freshness details.

Cross-navigation must use stable asset/domain/source identifiers where possible instead of matching visible labels.

## 7. Data-Honesty Rules

Mandatory everywhere:

- Unknown != zero.
- Unknown != normal.
- Unknown != stopped.
- Missing != safe.
- Stale != live.
- Forecast != observation.
- Satellite estimate != ground measurement.
- Model output != official measurement.
- Simulation != observed reality.
- Plant-wide derived value != direct asset measurement.

Every decision-relevant external observation should retain:

- source/provider;
- source type;
- observed/valid time;
- ingestion time;
- freshness/staleness;
- unit;
- location/geometry where relevant;
- provenance/derivation where relevant.

## 8. Responsive Strategy

### Mobile / field

Prioritize:

1. current situation;
2. action required;
3. freshness/source;
4. compact chart/map/twin preview;
5. drill-down details.

Avoid forcing desktop multi-column density into 360–430px widths.

### Tablet

Treat tablet as a first-class field/operations surface. Favor split views where a map/twin/chart can remain visible beside the selected detail panel.

### Desktop

Use the larger canvas for coordinated views, evidence panels, system relationships, and side-by-side comparison—not merely larger cards.

## 9. Visual Language Boundaries

Keep:

- existing Aura theme/tokens;
- dark/light support;
- premium restrained accents;
- clear typography;
- existing accessibility conventions.

Avoid:

- excessive neon/glow that reduces operational readability;
- decorative sci-fi elements with no information meaning;
- copying another product pixel-for-pixel;
- chart overload on the home page;
- using animation to imply equipment operation without validated telemetry.

## 10. Workstream Priority

The following is strategic priority, not permission to bypass `CURRENT-WORK.md`.

1. **Continue existing Digital Twin visual board** — do not pause or replace it.
2. **Analytics situation-card pattern** — reusable for internal and hazard domains.
3. **Environmental Flow / Sankey vertical slice** — wastewater first because domain data is most mature.
4. **Operations board** — unify incidents/repair/corrective actions when data contracts are ready.
5. **Hazard Map** — after source inventory and normalized external-data contract.
6. **Resource Explorer** — after reliable category/breakdown data exists.
7. **System/Data Network** — advanced lineage/topology after identifiers/relationships are stable.

## 11. Agent Collaboration Rules

All agents must follow this precedence for product/visual work:

1. actual repository/source reality;
2. privacy/security/data-integrity constraints;
3. `docs/ai/CURRENT-WORK.md`;
4. `docs/ai/HANDOFF.md`;
5. `docs/ai/PROJECT-BRIEF.md`;
6. **this master plan**;
7. domain-specific plans under `docs/ai/digital-twin/` and `docs/ai/environmental-intelligence/`;
8. older historical design/handoff documents.

If this master plan and an active work order appear to conflict, do not silently reinterpret the task. Record the conflict and request architecture review.

### GPT / architecture reviewer

- owns product architecture, IA, UX direction, cross-domain semantics, and final review;
- protects the Digital Twin spatial-core rule;
- creates scoped work orders before broad UI changes.

### Codex / visual engineer

- owns approved visual implementation, 3D/procedural scene work, responsive polish, and visual evidence;
- continues the existing Digital Twin board rather than starting a replacement 2D redesign;
- must preserve data semantics and accessibility.

### GLM / core implementation engineer

- owns approved data/application implementation and deterministic tests;
- does not invent visual/data semantics beyond the work order;
- stops at review gates defined in repo docs.

### Serena / SunDay workers

- repo intelligence, scoped edits, diagnostics, tests, and review support;
- avoid same-file collisions with another active writer.

## 12. Implementation Gate

This document is a product/design strategy, not a blanket implementation order.

Before production changes, create or activate a scoped work order with:

- objective;
- owned files;
- dependencies;
- data contract;
- UX states;
- mobile/desktop acceptance;
- accessibility requirements;
- tests/evidence;
- reviewer/stop condition.

## 13. Required Reading for New Agents

Before non-trivial UTH[AI]-ENV product work, read at minimum:

1. `AGENTS.md`
2. `docs/ai/PROJECT-BRIEF.md`
3. `docs/ai/CURRENT-WORK.md`
4. `docs/ai/HANDOFF.md`
5. `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`

Then read the relevant domain folder:

- Digital Twin: `docs/ai/digital-twin/`
- Environmental Hazard Intelligence: `docs/ai/environmental-intelligence/`
- Agent/tool integration: `docs/ai/tooling/`

Chat history is context, not the project source of truth.
