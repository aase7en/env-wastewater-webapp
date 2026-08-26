# UTH[AI]-ENV — Project Operating Map

Last updated: 2026-08-27
Status: PROJECT OPERATING SSoT INDEX

## Purpose

This is the shortest durable entry point for a new agent or engineer joining `env-wastewater-webapp`.
It does not duplicate detailed domain documentation. It tells the reader where truth lives, how the project is organized, what is active, and how to resume work without chat history.

## Resume order

1. `AGENTS.md` — binding repository rules and freshness gate.
2. `docs/ai/PROJECT-BRIEF.md` — stable product/technology intent.
3. `docs/ai/CURRENT-WORK.md` — authoritative active scope.
4. `docs/ai/HANDOFF.md` — exact resumable execution state.
5. `docs/ai/ENV-ENGINEERING-LOOP.md` — goal-first execution/review/release process.
6. `docs/ai/DEFECT-MEMORY.md` — verified reusable prevention rules.
7. `docs/ai/architecture/SYSTEM-ARCHITECTURE.md` — current runtime/component architecture.
8. `docs/ai/graph/PROJECT-GRAPH.md` — dependency, ownership, risk, evidence, and data-lineage graph.
9. `docs/ai/ROADMAP.md` — unified milestone sequence and critical path.
10. Product/domain documents relevant to the active work order.

## Current product destination

The product goal is a trustworthy Thai-first **Hospital Environmental Intelligence Platform**.

- Dashboard / command-center surfaces use the preserved prototypes under `docs/ai/design/references/` as a visual north star.
- The Digital Twin remains the spatial/visual core and must not be replaced by a generic 2D dashboard.
- Operational data-entry surfaces are mobile-first because field staff primarily record data on phones.
- Missing/stale/simulated/forecast data must remain semantically distinct.
- Patient-identifying information must never be sent to an external AI provider.

Authoritative detail:

- `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md`
- `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`
- relevant domain folders under `docs/ai/`

## Runtime architecture in one view

```mermaid
flowchart LR
    U[Hospital user / admin] --> B[Browser]
    B --> SPA[React + Vite SPA]
    SPA --> SHELL[AppShell + ModuleDock + React Router]
    SHELL --> PAGES[Operational / dashboard / admin pages]
    PAGES --> Q[Domain hooks + TanStack React Query]
    Q --> L[Typed domain libs / adapters]
    L --> SB[@supabase/supabase-js]
    SB --> AUTH[Supabase Auth]
    SB --> PG[Supabase Postgres / PostgREST]
    PG --> RLS[RLS / DB constraints / views]
    PAGES --> TWIN[Optional R3F Digital Twin]
    L --> TWIN
    PAGES --> AI[Admin AI boundary]
    AI --> SAFE[PHI-safe projection / scope gate]
    SAFE --> EXT[Configured external AI provider]
    GH[GitHub Actions] --> PAGESDEPLOY[GitHub Pages]
    PAGESDEPLOY --> B
```

## Current implementation surfaces

### Primary routes

- `/` — unified overview.
- `/dashboard` — wastewater dashboard + Process / Digital Twin relationship.
- `/form`, `/form/:id` — wastewater daily operational recording/editing.
- `/readings`, `/trends`, `/reports`, `/equipment`, `/sensors` — wastewater/history/analysis/support.
- `/carbon`, `/carbon-rollup` — carbon surfaces.
- `/water-supply`, `/garbage`, `/fuel`, `/garden`, `/building`, `/safety`, `/food`, `/chemical`, `/regulations` — multi-domain ENV modules.
- `/attachments` — evidence/files.
- `/import`, `/pdf-designer`, `/admin/*` — admin surfaces.

Actual route source: `frontend/src/App.tsx`.

### High-value reusable implementation already present

- Aura UI primitives under `frontend/src/components/ui/`.
- Responsive app shell / ModuleDock under `frontend/src/components/layout/`.
- Situation & Trend analytics kit under `frontend/src/components/analytics/`.
- Digital Twin implementation under `frontend/src/components/digital-twin/`.
- Wastewater flow visualization under `frontend/src/components/flow/` and `pfd/`.
- Domain query/adapters under `frontend/src/lib/`.
- Playwright real-browser coverage under `frontend/tests/e2e/`.

## Project-memory model

```text
Stable intent      -> PROJECT-BRIEF / product & domain plans / ADRs
Current authority  -> CURRENT-WORK
Resumable state    -> HANDOFF + lane-specific handoffs
How we work        -> ENV-ENGINEERING-LOOP
Failure prevention -> DEFECT-MEMORY
Runtime map        -> architecture/SYSTEM-ARCHITECTURE
Dependency map     -> graph/PROJECT-GRAPH
Future sequence    -> ROADMAP
Implementation     -> bounded Work Orders
Proof              -> tests + screenshots + CI + review records
```

Chat/model memory may point to these files, but must never replace them.

## Agent responsibility model

- **GPT / architecture reviewer** — goal, product architecture, IA/UX, work-order boundaries, cross-domain semantics, graph decisions, independent review, merge decision.
- **GLM / Core Engineering** — data/application contracts, Supabase/RLS/query/cache correctness, business logic, security/privacy boundaries, deterministic tests.
- **Codex / Visual Engineering** — approved UI/responsive/interaction/3D implementation and visual evidence.
- **SunDay workers / Serena** — repository intelligence, bounded edits, tests, diagnostics, support; one writer per file.

The detailed precedence and escalation rules remain in `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`.

## Development rule

Every significant slice follows:

`GOAL → fresh SSoT/source reality → Grill With Docs → spec → bounded WO + ownership → baseline/RED → implement/debug → focused tests + system/E2E → responsive/accessibility/data-honesty/security review → SSoT/defect memory → independent exact-diff review → exact-SHA CI → re-audit → authorized merge → fetch/deploy verification → close`

## Current critical path

The project already has strong foundation and stabilization work merged. The next product-development critical path is:

1. current-state UX/component/form inventory against the prototype/mobile north star;
2. establish shared responsive product contracts without a broad rewrite;
3. improve the highest-frequency mobile data-entry flow first;
4. build dashboard intelligence vertical slices around, not instead of, the Digital Twin;
5. add truthful external environmental intelligence only after source/provenance contracts are approved;
6. continue milestone repo-health/graph audits.

Exact milestone sequencing and activation state live in `docs/ai/ROADMAP.md` and `docs/ai/CURRENT-WORK.md`.
