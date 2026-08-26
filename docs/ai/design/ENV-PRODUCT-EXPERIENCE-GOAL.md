# UTH[AI]-ENV — Product Experience Goal

Last updated: 2026-08-27
Status: USER-CONFIRMED DESIGN NORTH STAR

## 1. Purpose

This document records the user-confirmed end-state experience for `env-wastewater-webapp` before the next design and implementation planning cycle. It is a durable product/design goal, not a blanket implementation authorization.

The target is one coherent **Hospital Environmental Intelligence Platform** with two different but connected usage modes:

1. **Dashboard / Command Center surfaces** — high-information, coordinated environmental intelligence inspired by the preserved prototype references in `docs/ai/design/references/`.
2. **Operational data-entry surfaces** — mobile-first field workflows because hospital staff will primarily record operational data on phones.

Both modes must feel like the same product and must preserve the Digital Twin, data-honesty, privacy, accessibility, and agent-ownership rules already defined in the repository.

## 2. Prototype set = dashboard north star

The user-confirmed prototype set is preserved as compressed reference thumbnails under `docs/ai/design/references/`:

- `prototype-dashboard-command-center.webp` — Overview / environmental command center.
- `prototype-waste-carbon-tver.webp` — Waste, plastics, Carbon Footprint, T-VER, flow/provenance view.
- `prototype-digital-twin-command-center.webp` — Digital Twin operational command center with process context, trends, operations, network, and resource panels.
- `prototype-hazard-map-green-intelligence.webp` — Hazard Map / PM2.5 / heat / river / flood / green-area intelligence.

These images define **visual hierarchy, information density, panel relationships, and interaction ambition**. They are not database/schema specifications and their sample values, labels, thresholds, maps, telemetry, or generated details must never be treated as validated production facts.

Production behavior must continue to follow source reality:

- unknown is not zero, normal, or stopped;
- stale is not live;
- forecast is not observation;
- simulation is not observed reality;
- external-source provenance/freshness must remain visible where decision-relevant;
- the existing Digital Twin remains the spatial/visual core rather than being replaced by a conventional 2D dashboard.

## 3. Two-mode responsive product rule

### 3.1 Dashboard / intelligence surfaces

Dashboard pages may be **desktop-led** because large screens are best for coordinated views, but they must remain genuinely responsive and interactive on tablet/mobile.

Desktop may use:

- coordinated multi-column panels;
- Digital Twin / map as a dominant spatial surface;
- KPI + trend + alert + provenance relationships visible together;
- side-by-side Operations, Flow, Network, Resource, or evidence panels.

Tablet should be treated as a first-class operations surface. Use split views where useful and allow the selected detail to coexist with a map/twin/chart when space permits.

Mobile must **recompose hierarchy**, not shrink the desktop grid. Appropriate patterns include:

- vertical stacking by operational priority;
- tabs or segmented views;
- collapsible/accordion sections;
- drill-down detail routes;
- bottom sheets or drawers for secondary context;
- progressive disclosure so current situation and required action appear before supporting detail.

### 3.2 Operational data-entry surfaces

Forms and field-recording workflows are **mobile-first**. The primary design question is: can a staff member standing at the work site record accurate data quickly and safely with one hand?

Future form work orders must consider:

- 360–430 px phone widths as first-class targets;
- 44 px+ touch targets;
- no required horizontal scrolling for form completion;
- short, task-focused flows with minimal unnecessary typing;
- appropriate numeric/date/select/native-friendly inputs;
- clear required/optional status and units;
- persistent validation context without losing entered values;
- clear save/success/error/retry states;
- sticky primary action only when it improves completion without covering content;
- accessible labels, focus order, keyboard behavior, and outdoor-readable typography;
- large tables converted to mobile-appropriate cards/details rather than squeezed columns where necessary.

Do not claim offline capability, background sync, autosave, sensor linkage, or automatic derivation unless an approved engineering contract actually implements it.

## 4. Panel / layer interaction rule

Every new or materially changed panel/layer must define its behavior for desktop, tablet, and mobile. “Responsive” means changing composition and interaction when necessary, not only changing CSS width.

For each panel specify at least:

- primary question it answers;
- priority in the page hierarchy;
- loading / empty / unavailable / stale / error states;
- source/freshness/provenance when relevant;
- desktop placement;
- tablet behavior;
- mobile behavior;
- touch interaction and keyboard alternative;
- drill-down / cross-surface destination where applicable;
- reduced-motion behavior when animation is present.

Examples of valid cross-surface interactions remain:

- incident → affected Digital Twin asset;
- KPI/trend → detailed Analytics;
- PM2.5/river/heat status → relevant Hazard Map layer;
- Sankey/flow node → its source/history detail;
- Digital Twin asset → evidence/trend/provenance panel.

## 5. Visual direction

The dashboard target should feel like a restrained premium environmental command center:

- dark operational canvas as a strong reference direction while preserving existing dark/light theme support;
- clear hierarchy and compact information density;
- restrained cyan/teal/green/amber/red status accents with semantic meaning;
- charts and panels chosen to answer operational questions rather than decorate the page;
- Digital Twin / map / flow visualizations used as meaningful spatial or relationship surfaces;
- Thai-first readability;
- avoid excessive glow, ornamental sci-fi UI, fake live states, or animation that implies equipment operation without validated telemetry.

Reuse existing Aura tokens/components before creating a parallel design system.

## 6. Agent ownership

### GPT / ChatGPT

Owns:

- product architecture and information architecture;
- page hierarchy and cross-surface UX;
- prototype-to-spec translation;
- responsive interaction requirements;
- work-order boundaries and dependency order;
- screenshot/prototype review;
- final PASS / CHANGES_REQUIRED and merge ownership where repository rules assign it.

### GLM 5.3

Owns approved Core Engineering work such as:

- data contracts and adapters;
- Supabase/RLS/query/cache correctness;
- provenance/freshness semantics;
- calculations/business rules;
- deterministic unit/integration/security tests;
- performance/reliability engineering.

GLM must not invent visual semantics or start a deferred workstream without activation.

### Codex / Visual Engineer

Owns approved visual implementation such as:

- dashboard composition/polish;
- responsive visual behavior;
- Digital Twin/Three.js presentation;
- interaction polish and accessible DOM alternatives;
- visual-regression/screenshot evidence.

Shared files such as page shells, routing, shared UI/tokens, and `DashboardPage.tsx` require explicit temporary ownership before editing.

## 7. Engineer loop for future work

Future implementation must be broken into bounded vertical slices and follow an evidence-driven loop:

```text
DISCOVER
→ BASELINE / SOURCE-REALITY CHECK
→ DESIGN / SPECIFY
→ PLAN + OWNERSHIP GATE
→ RED / FAILURE EVIDENCE WHEN TESTABLE
→ IMPLEMENT
→ DEBUG
→ TEST
→ RESPONSIVE + INTERACTION QA
→ DATA-HONESTY / ACCESSIBILITY REVIEW
→ REPORT / SSoT
→ INDEPENDENT REVIEW
→ MERGE
```

For design-only slices, RED may be replaced by explicit **baseline evidence** such as current screenshots, route/component inventory, accessibility findings, or measured responsive defects. Do not fabricate a failing automated test merely to satisfy the loop.

Implementation agents stop at the repository review gate; they do not self-approve their own implementation.

## 8. Planning sequence toward the north star

This is a planning sequence only. Each implementation slice still requires an explicit bounded work order.

### Phase A — Current-state inventory

- map existing routes/pages/components to the four prototype target families;
- inventory current mobile data-entry pages and concrete field-use pain points;
- identify reusable Aura/analytics/Digital-Twin components before proposing new ones;
- inventory shared-file ownership risks.

### Phase B — Responsive product contracts

- define reusable page/panel responsive behavior;
- define mobile form interaction/validation patterns;
- define breakpoint evidence and acceptance format;
- avoid a broad visual rewrite.

### Phase C — Dashboard vertical slices

Advance one bounded surface at a time, preserving the existing Digital Twin board and dependencies. Candidate surfaces remain those already recorded in the master plan: Digital Twin continuation, Analytics, Flows, Operations, Hazard Map, Resource Explorer, System/Data Network.

### Phase D — Mobile operational vertical slices

Improve one high-frequency recording workflow at a time, beginning only after actual usage path/component inventory. Each slice must prove mobile completion and preserve existing data contracts unless a separately reviewed Core Engineering change is required.

## 9. Definition of done for a future page/slice

A page/slice is not done because it visually resembles the prototype. Completion requires applicable evidence for:

- user task and information hierarchy;
- source/data semantics;
- desktop layout;
- tablet layout;
- 360–430 px mobile behavior;
- loading/empty/error/stale/unavailable states;
- touch + keyboard interaction;
- accessibility and reduced motion;
- data honesty and provenance;
- automated tests where behavior is testable;
- screenshot/visual evidence for responsive work;
- repository SSoT + reviewer verdict.

## 10. Scope / activation gate

This document records the destination and planning constraints only. It **does not activate** `WO-STAB-008`, `DT-VIS-P002`, `DT-VIS-P003`, `UX-FLOW-P001`, `ENV-INT-P001`, navigation rewrite, external API production integration, or any P2 backlog item.

The next action is for GPT to convert this goal into a prioritized, bounded roadmap/work-order sequence after inspecting current route/component/form reality. Each production lane must then be activated explicitly according to `CURRENT-WORK.md` and the collaboration protocol.
