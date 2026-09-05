# UTH[AI]-ENV — Project Operating Map

Last updated: 2026-09-05
Status: PROJECT OPERATING SSoT INDEX

## Purpose

This is the shortest durable entry point for a new agent or engineer joining `env-wastewater-webapp`.
It does not duplicate detailed domain documentation. It tells the reader where truth lives, how the project is organized, what is active, and how to resume work without chat history.

## Resume order — progressive context

Do not read the entire project history to solve a bounded task.

### Level 1 — establish authority and the execution frontier

1. `AGENTS.md` — repository rules + freshness gate.
2. this Operating Map — route the task and choose the process depth.
3. the active/frontier portion of `docs/ai/CURRENT-WORK.md`.
4. the exact Work Order/spec/contract for the task.
5. a relevant `HANDOFF.md` checkpoint only when resuming inherited or partial work.

### Level 2–5 — expand only as required

- **L2 current task:** relevant acceptance criteria, dependency/ownership state, live PR/branch evidence.
- **L3 architecture/domain:** only the architecture, ADR, graph, roadmap, design, domain, A-Wiki, or defect-memory sections that govern the task.
- **L4 implementation:** only relevant source/tests/schema/workflows.
- **L5 deep history:** closed Work Orders, old handoffs, review evidence, and historical reports only for ambiguity, regression archaeology, audit, or conflict resolution.

If live repository/PR state disagrees materially with canonical task status, classify it as **STATE_DRIFT**. Reconcile the active frontier before relying on either side; do not silently treat an old status line or an agent claim as current truth.

## Risk-based delivery selector

The canonical engineering loop is a **superset**, not a checklist that every task must execute.

### FAST PATH — low-risk, isolated, reversible

Typical: typo/copy/docs correction, small styling/config change, isolated low-blast-radius bug.

`UNDERSTAND → CHANGE → TARGETED TEST/VERIFY → COMPLETE`

- no heavyweight spec or deep audit unless the task crosses a session/agent boundary or exposes a hidden contract;
- automated/deterministic verification may be sufficient;
- do not run full Playwright solely for a docs-only change.

### STANDARD PATH — normal feature / bug / refactor

`REQUIREMENT → DESIGN AT STABLE SEAM → IMPLEMENT → TARGETED + RELEVANT FULL TESTS → REVIEW → MERGE`

Use a durable Work Order for multi-context/multi-agent work. Independent review is required for material implementation changes.

### HIGH-RISK PATH — high blast radius or hard-to-reverse

Typical: auth/RLS, PHI/provider boundary, schema/data migration, destructive operation, infrastructure/release control, shared app shell, core business/data semantics.

`IMPACT + ROLLBACK → DESIGN REVIEW → IMPLEMENT → AUTOMATED + ADVERSARIAL/E2E VERIFY → INDEPENDENT REVIEW → REGRESSION/ROLLBACK VERIFY → RELEASE/POST-VERIFY`

Never downgrade security/data-integrity verification merely to save time.

## Definition of Ready

For STANDARD/HIGH-RISK implementation, establish at least:

- problem / expected behavior;
- bounded scope + non-goals;
- acceptance criteria;
- material dependencies/ownership;
- risk level and verification seam.

Safe assumptions may be recorded and used; do not block on retrievable or low-consequence details.

## Definition of Done

Apply only the gates justified by the path/risk:

- requested behavior/contract satisfied;
- deterministic verification passed;
- relevant regression/E2E/a11y/security/data-honesty checks passed;
- independent review passed when required;
- exact diff/SHA and release state verified where applicable;
- durable SSoT updated only where future work needs it;
- no critical blocker; next safe action is explicit if work remains.

Code existing or an agent saying DONE is not sufficient evidence.

## WIP / execution frontier

Finish before starting. Prioritize P0 → P1 → P2 → P3, then choose the highest-value unblocked work.

Parallel mutation is allowed only for independent READY lanes with explicit owner, branch/worktree, file scope, dependencies, and reconciliation plan. Shared SSoT/hotspot files serialize unless temporary ownership is explicit.

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
