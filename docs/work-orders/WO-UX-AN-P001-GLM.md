# WO-UX-AN-P001 — Reusable Situation Analytics Presentation Kit

Status: READY_FOR_IMPLEMENTATION
Owner: GLM 5.3
Reviewer: GPT architecture/UX reviewer
Parallel safety: MAY RUN IN PARALLEL with DT-VIS-P001 because owned production files do not overlap.

## Objective

Build a reusable, data-honest analytics presentation kit that implements the approved `Analytics — Situation & Trend` pattern from `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` without changing production routes or inventing new environmental semantics.

This is a bounded engineering task suitable for GLM: the visual semantics and acceptance rules are already specified. GLM should implement the components, states, stories/tests, and accessibility behavior exactly; it should not redesign the product or create new risk formulas.

## Required Reading

1. `AGENTS.md`
2. `docs/ai/PROJECT-BRIEF.md`
3. `docs/ai/CURRENT-WORK.md`
4. `docs/ai/HANDOFF.md`
5. `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`
6. this work order
7. existing Aura UI primitives and Ladle stories

## Owned Files

GLM may create/edit only:

- `frontend/src/components/analytics/**`
- `frontend/src/components/analytics/*.test.tsx` or colocated tests
- analytics-specific Ladle story files under `frontend/src/components/analytics/**`
- `docs/ai/handoffs/WO-UX-AN-P001-GLM.md` for its lane completion report

If a shared token/UI primitive change appears necessary, STOP and request review instead of editing shared files.

## Forbidden / No-Touch

- `frontend/src/components/digital-twin/**`
- `frontend/src/lib/twin/**`
- `frontend/src/pages/DashboardPage.tsx`
- router/navigation files
- Supabase schema/migrations/Auth/RLS
- GISTDA/TMD/ThaiWater integration
- `ProcessFlowDiagram.tsx`
- shared Aura tokens/components unless separately approved

## Component Set

Implement a coherent small kit, not a page rewrite.

### 1. `SituationMetricCard`

Inputs should support:

- label;
- value;
- unit;
- trend label/direction when explicitly supplied;
- source/provider;
- source type;
- observed/valid time;
- freshness/staleness state;
- optional risk/status label supplied by caller;
- missing/unknown state.

Rules:

- no computed 0–100 score;
- no inferred trend when caller does not provide it;
- unknown value renders explicit Thai/neutral unknown treatment, not `0`;
- stale must be visibly distinguishable from current/latest;
- forecast/satellite/model/manual/live/simulation labels must remain distinguishable when supplied.

### 2. `ProvenanceBadge` / source-status primitive

Provide compact presentation for source type and freshness.

It must not rely on color alone; include readable text/icon/accessibility name.

### 3. `SituationChartFrame`

A reusable layout/frame for a future Recharts time-series visualization.

For this work order it may accept chart content via `children`; do not invent or fetch data.

Frame should provide slots/props for:

- title;
- period label;
- legend/source summary;
- observed vs forecast distinction supplied by caller;
- empty/unknown state;
- optional threshold annotation description supplied by caller.

Do not hard-code domain-specific thresholds.

### 4. Composite demonstration story

Create Ladle stories using sanitized/static fixtures only for:

- current observed value;
- stale observed value;
- forecast value;
- satellite/model estimate label;
- missing/unknown value;
- internal manual/latest operational value.

Use examples such as PM2.5, river level, pH, or TDS only as presentation fixtures; do not claim authoritative thresholds unless the fixture explicitly marks them as demo text.

## Visual Direction

Follow existing Aura tokens and components.

Target pattern:

```text
[ Current value ] [ Trend ] [ Freshness ] [ Source ]
----------------------------------------------------
[             Situation / trend chart              ]
```

Desktop may use a compact multi-card row. Mobile must stack/reflow without horizontal overflow.

No new color system. No excessive neon/glow. Use existing typography scale and touch/accessibility conventions.

## Accessibility

- semantic headings/labels where appropriate;
- source/freshness/state text available to screen readers;
- color is never the sole state signal;
- interactive controls, if any, meet current 44px touch-target rule;
- story/demo must remain usable in both light and dark Aura themes.

## Tests

At minimum test:

- missing value does not become `0`;
- stale state is explicitly labeled;
- source type is rendered/readable;
- forecast vs observation can be distinguished;
- supplied trend is rendered, absent trend is not invented;
- component renders safely without optional metadata.

Run:

- focused component tests;
- `npm run lint` (baseline or better);
- `npm run build`;
- `npm test -- --run`;
- `git diff --check`.

Full Playwright is required only if GLM changes production surfaces, which this work order forbids.

## Definition of Done

- components and stories exist under owned paths;
- no production route changed;
- no external data fetching added;
- no synthetic health/risk score added;
- unknown/stale/source semantics are explicit;
- tests and build pass at baseline or better;
- `docs/ai/handoffs/WO-UX-AN-P001-GLM.md` updated with files/tests/branch/exact HEAD;
- stop at `REVIEW_REQUESTED`.
