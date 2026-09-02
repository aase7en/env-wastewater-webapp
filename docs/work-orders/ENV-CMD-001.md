# ENV-CMD-001 — Responsive Command-Center Composition Contract

Status: REVIEW_REQUESTED / CONTRACT-ONLY
Owner: GPT-5.6 Sol — product architecture / IA / UX contract
Implementation owner: none in this work order
Independent review: fresh reviewer on exact docs SHA before merge
Parent roadmap: M2 — Shared command-center composition
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-cmd-001`
Branch: `docs/env-cmd-001-contract`
Activation base: `origin/main@436dbe77095cdc9c8e205ba5438a3850392d3c7c`
Date: 2026-09-02

## Goal Contract

**Goal ID:** `ENV-CMD-001`

**User outcome:** a hospital operator can open the future command-center overview and quickly determine (1) what situation is known now, (2) what needs attention, (3) how trustworthy/fresh each statement is, and (4) where to drill down for evidence or action — on desktop, tablet, or phone.

**Why this matters:** the repository already has a unified overview, wastewater dashboard, Digital Twin, Aura primitives, and Situation/Trend components, but they are not yet composed into one cross-domain command-center experience matching the user-confirmed north star.

**Success evidence:** a durable, source-backed page/panel/component contract exists and is specific enough for `ENV-CMD-002` to implement one bounded Hospital Overview slice without inventing data semantics, rewriting navigation, or mounting a second 3D runtime.

**Non-goals:**

- no production UI code changes;
- no route/navigation rewrite;
- no AppShell/ModuleDock changes;
- no Supabase/schema/RLS/query changes;
- no external GISTDA/TMD/HII integration;
- no Building repair changes;
- no new Digital Twin Canvas or Three.js surface on `/`;
- no synthetic health/risk score;
- no fabricated source/freshness/status metadata;
- no prototype sample values copied into production requirements.

**Safety/data-honesty constraints:** unknown != zero/normal/safe; stale != live/current; latest != live; forecast != observation; simulation != observed reality; status may only be shown when the owning domain has an authoritative rule/state.

**Dependencies:** closed `ENV-MOBILE-008`; existing Aura/analytics/Twin foundations. External hazard panels remain gated by the separate Environmental Intelligence provenance/source lane.

## Source-Reality Baseline

Verified on activation main `436dbe77095cdc9c8e205ba5438a3850392d3c7c`:

1. `/` is `OverviewPage` and is authenticated via `RequireAuth`.
2. `/dashboard` is `DashboardPage`, also authenticated, and owns the existing wastewater Digital Twin + Process relationship.
3. Current `OverviewPage` is a 3-card Water/Energy/Carbon summary plus four quick links.
4. `useOverview()` names `water.data[0]` as `today`; it is actually the newest row from a 14-day query. Therefore a command center must not promote that record to current/live without a separate freshness judgment.
5. Public overview carbon rows expose only `month`, `days`, `kwh_total`, and `tco2e`; they do not currently expose provider/source/observed-at provenance.
6. The existing analytics kit provides `SituationMetricCard`, `ProvenanceBadge`, and `SituationChartFrame`; current production pages do not yet consume these components.
7. The analytics kit already distinguishes manual-latest from live-sensor and supports freshness `current | stale | unknown`.
8. `DashboardPage` lazy-loads `TwinCanvas`; Process remains an accessible non-Canvas fallback.
9. The prototype command-center HTML is a structural/visual reference only. Its carbon totals, solar status, water flow, topology, waste/fuel values, animated pulse, thresholds, labels, and status words are not production data contracts.
10. A-Wiki project pointer was checked; it is useful domain context but its project-state section was last verified 2026-08-07 and is stale relative to current repo source, so current repository reality remains authority.

## Mutable Scope

Contract-only files:

- `docs/work-orders/ENV-CMD-001.md`
- `docs/ai/design/ENV-CMD-001-COMPOSITION-CONTRACT.md`
- `docs/ai/handoffs/ENV-CMD-001-SOL.md`

Global SSoT files remain read-only during initial drafting because GPT Ultra Building and GLM Environmental Intelligence may be active concurrently. Reconcile global SSoT only after a fresh ownership gate.

## Forbidden / Read-Only Scope

- `frontend/src/pages/OverviewPage.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/lib/overview.ts`
- `frontend/src/components/analytics/**`
- `frontend/src/components/digital-twin/**`
- `frontend/src/lib/twin/**`
- `frontend/src/App.tsx`
- AppShell / ModuleDock / shared Aura tokens
- all Building/repair files and migrations
- all Environmental Intelligence implementation owned by the GLM lane
- Supabase schema/RLS/migrations
- `.serena/**`
- real hospital/environmental data

## Required Contract Decisions

The companion design contract must settle:

1. page zones and information hierarchy;
2. panel anatomy;
3. orthogonal state dimensions for availability, freshness, provenance completeness, and operational status;
4. alert/action presentation rules;
5. desktop/tablet/mobile recomposition;
6. source/freshness display behavior;
7. unknown/empty/unavailable/error/stale behavior;
8. Digital Twin/Process relationship without a second Canvas;
9. drill-down/cross-surface rules using stable route/entity identifiers where available;
10. accessibility and reduced-motion requirements;
11. performance/code-splitting constraints;
12. exact `ENV-CMD-002` implementation boundary and dependencies.

## Acceptance Evidence

This design-only slice uses source/baseline evidence rather than fabricated failing tests.

Required before review:

- current route/component/data seams independently traced;
- prototype semantics separated from prototype aesthetics;
- analytics-kit reuse/gaps explicitly mapped;
- 360/390/430/768/1024/1440 behavior specified;
- no second R3F Canvas requirement;
- no fake global `LIVE`/`normal`/health score;
- every future panel class defines loading/ready/empty/unavailable/error plus freshness/source behavior where applicable;
- command-center action state cannot say “all normal” when material sources are stale/unavailable/unknown;
- `ENV-CMD-002` can implement without changing Building or GLM provenance contracts.

## Verification

Because this work order is docs-only:

- `git diff --check`;
- changed-file audit;
- forbidden-scope audit;
- source-reference spot check against current main;
- independent Standards review;
- independent Spec/Product/Data-honesty review;
- actual remote diff audit;
- exact-head repository CI required if triggered.

No Playwright/build run is required solely for docs-only changes.

## Stop / Review Gate

Stop at `REVIEW_REQUESTED` after the exact docs candidate is committed/pushed and independently reviewed. Do not begin `ENV-CMD-002` production edits from this worktree until `ENV-CMD-001` is merged/reconciled and a fresh production ownership gate is established.
