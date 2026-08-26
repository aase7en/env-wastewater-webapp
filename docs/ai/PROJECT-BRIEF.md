# PROJECT BRIEF

## Project

**env-wastewater-webapp / UTH[AI]-ENV**

Repository for hospital environmental monitoring, with wastewater treatment as the original and most mature workflow.

## Goal

Maintain a reliable environmental monitoring application and evolve it incrementally into a **Hospital Environmental Intelligence Platform** that combines Environmental Operations, Digital Twin views, and source-aware Environmental Hazard Intelligence without rewriting working production features.

## Users

- Hospital environmental staff using operational forms, dashboards, history, alerts, reports, and related ENV modules.
- Admin users with additional administration and review capabilities.
- TODO: confirm the complete stakeholder list and role-specific UX needs before a major information-architecture redesign.

## Product Vision

A trustworthy Thai-language environmental operations system that combines operational records, sensors, reports, alerts, and eventually optional 3D Digital Twin views while keeping conventional Process/Data views available.

The Digital Twin must represent operational data honestly: missing values stay unknown, manual daily records are not mislabeled as realtime, and visual presentation must not invent engineering meaning.

The shared product/visual direction is defined in `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`. All agents doing non-trivial product, UI, visualization, Digital Twin, map, analytics, flow, or operations-surface work must read it. The plan preserves the existing Digital Twin as the spatial/visual core and treats new 2D intelligence surfaces as complementary rather than replacements.

The user-confirmed end-state experience is recorded in `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md` with preserved prototype thumbnails under `docs/ai/design/references/`: dashboard/command-center surfaces use those prototypes as a visual north star, while operational data-entry/form surfaces are mobile-first. Every materially changed panel/layer must define responsive + interactive behavior across desktop, tablet, and mobile rather than merely shrinking the desktop layout.

The project operating entry point is `docs/ai/PROJECT-OPERATING-MAP.md`. Current runtime/component architecture is consolidated in `docs/ai/architecture/SYSTEM-ARCHITECTURE.md`, dependency/ownership/risk/evidence/data-lineage relationships in `docs/ai/graph/PROJECT-GRAPH.md`, and milestone/critical-path sequencing in `docs/ai/ROADMAP.md`. These files point to deeper SSoT rather than replacing domain-specific documents.

## Current State

High-confidence repository facts:

- Production frontend is live on GitHub Pages.
- Frontend talks directly to Supabase; the retired FastAPI backend is no longer the production architecture.
- Wastewater monitoring includes a dashboard, daily-entry form, recent readings/history, reports, process-flow visualization, thresholds, and related environmental modules.
- React Query is used for frontend data fetching/caching.
- Repository contains design documents, ADR/work-order documentation, migrations/scripts, tests, and an A-Wiki companion reference described in `AGENTS.md`.
- Digital Twin foundation PR #14 is merged on `main`; Three.js, React Three Fiber, Drei, and Zustand are present in `frontend/package.json`.
- The foundation preserves truthful `latest` vs future `live` semantics, unknown-first Aeration telemetry, renderer fallback/resilience, and Process-view fallback.
- A parallel Environmental Health & Climate Resilience planning track now covers PM2.5, heat/heat index, river level, flood context, and future geospatial hazard layers. See `docs/ai/environmental-intelligence/`.

## Tech Stack

### Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack React Query
- Recharts
- Radix Slot / class-variance-authority / clsx / tailwind-merge
- jsPDF / jspdf-autotable / pdfjs-dist / ExcelJS / PapaParse

### Backend

- No dedicated application server in the current production path.
- Frontend communicates directly with Supabase.
- Python is used for repository scripts/migration/schema tooling, not as the live web backend.

### Database

- Supabase Postgres
- Supabase Auth / RLS are part of the current architecture.
- Operational migrations and schema tooling live in repository migration/script areas.

### 3D / Rendering

- Three.js 0.185.x
- React Three Fiber 9.x
- Drei 10.x
- Zustand 5.x for Twin interaction/simulation state only
- Digital Twin rendering remains optional and fallback-safe; Process/Data views stay available
- `latest` manual snapshots and future `live` sensor telemetry are separate contracts

### Hosting

- GitHub Pages for the frontend.
- Supabase for managed backend/database services.

### Environmental Intelligence / External Data

- GISTDA API access is available to the user; exact endpoint/product entitlement still requires inventory and must not expose the API key in frontend/Git/chat.
- TMD and ThaiWater/HII are planned research sources for heat/weather and river/flood data respectively.
- External hazard data must preserve source type, valid/observed time, ingestion time, freshness, and provenance.
- See `docs/ai/environmental-intelligence/` for the durable plan.

### Other Important Tools

- Vitest for unit tests.
- Playwright for end-to-end tests.
- oxlint for linting.
- Ladle is available for component-oriented UI development.
- Companion A-Wiki repository is referenced by `AGENTS.md` for domain context.

## Major Repository Areas

- `frontend/` — production SPA and tests
- `docs/` — architecture/work orders/coordination/research
- `docs/ai/environmental-intelligence/` — hazard-intelligence vision, source/provenance rules, and implementation board
- `docs/ai/tooling/` — AI/MCP developer-toolchain source of truth
- `design/` — design-system and UI direction
- `scripts/` — migration/introspection/utility tooling
- `data/` — data working area; real raw operational exports are governed by repository data policy
- `reports/` — review/audit/generated reports
- `supabase/` / migration-related areas where present — Supabase infrastructure and migrations

## Architecture Principles

- Inspect before changing.
- Reuse existing code before creating new systems.
- **REUSE → MODIFY → EXTEND → CREATE**.
- Preserve working behavior unless the requirement explicitly changes it.
- Avoid unnecessary dependencies.
- Avoid broad rewrites.
- Keep components modular.
- Security/privacy first.
- Test meaningful changes.
- Repository is the source of truth, not chat history.
- Source reality overrides stale planning notes; report mismatches instead of silently ignoring them.
- Keep 3D optional and fallback-safe; critical operational information must remain accessible outside Canvas.
- Do not fabricate missing operational values or infer business semantics in the visual layer.
- Missing data is never automatically safe/normal/zero; stale data is never `live`.
- Observation, satellite estimate, forecast, model output, manual record, sensor telemetry, and simulation must remain distinguishable.
- Private external-provider credentials must stay server-side or in approved client credential stores; never commit them or expose them in the browser bundle.

## Agent Roles

### ChatGPT / GPT

**Role:** Architect + UX/UI Designer + 3D/Visual Designer + Reviewer

Responsibilities:

- understand product goals
- architecture and technical planning
- UX flows
- interaction design
- visual direction
- 3D scene/asset specifications
- implementation work orders
- review implementation
- identify regressions and risks
- issue `PASS` or `CHANGES_REQUIRED`

GPT should inspect actual source/diffs before making technical review claims.

### GLM 5.3

**Role:** Implementation Engineer

Responsibilities:

- inspect repository
- implement approved `CURRENT-WORK.md`
- reuse existing architecture
- write/refactor code
- test/debug
- document changes in `HANDOFF.md`
- provide branch + exact commit HEAD
- stop at `REVIEW_REQUESTED`

GLM must not silently expand scope beyond `CURRENT-WORK.md`.

## Shared Workflow

The binding project-wide process is `docs/ai/ENV-ENGINEERING-LOOP.md`.

Canonical loop:

`GOAL → SSoT/FRESHNESS → GRILL WITH DOCS → SHAPE/RESEARCH/PROTOTYPE as needed → SPECIFY → VERTICAL-SLICE PLAN + OWNERSHIP → RED/BASELINE → IMPLEMENT → DEBUG → TEST/E2E → RESPONSIVE/ACCESSIBILITY/DATA-HONESTY REVIEW → REPORT/SSoT/DEFECT MEMORY → INDEPENDENT DIFF REVIEW → PR → EXACT-SHA CI → RE-AUDIT → MERGE → FETCH MAIN/DEPLOY VERIFY → CLOSE`

GPT owns goal/spec/architecture/coordination and independent final review/merge. GLM owns approved Core Engineering implementation and stops at `REVIEW_REQUESTED`; Codex/visual engineering owns approved visual/responsive implementation and also stops at the review gate. Capability-dependent subagents may research/brainstorm/review in parallel but must not overlap writes.

Shared state and reusable defect lessons must live in repository files (`CURRENT-WORK.md`, `HANDOFF.md`, `ENV-ENGINEERING-LOOP.md`, `DEFECT-MEMORY.md`, and the relevant domain/design documents). Chat/model memory may point to these files but is never the project SSoT.

## Coordination Precedence

For day-to-day work, use this precedence:

1. Actual current source / branch reality.
2. Security, privacy, and data integrity constraints.
3. `docs/ai/CURRENT-WORK.md` — authoritative definition of the active task and allowed scope.
4. Latest reviewer decision recorded in `docs/ai/CURRENT-WORK.md` or `docs/ai/HANDOFF.md`.
5. `docs/ai/ENV-ENGINEERING-LOOP.md` — binding execution/review/merge process.
6. `docs/ai/DEFECT-MEMORY.md` — relevant verified prevention rules.
7. `docs/ai/PROJECT-BRIEF.md`.
8. `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` for all non-trivial product/visual work, plus relevant domain/design specifications.
9. Older/deeper coordination documents under `docs/agent-handoff/`.

The lightweight `docs/ai/` workflow is now the **primary operational collaboration workflow**. The older `WORK ORDER COMPLETE` text format in `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md` is optional legacy guidance; for active work, GLM must report through `docs/ai/HANDOFF.md` and stop at `REVIEW_REQUESTED` or `RE-REVIEW_REQUESTED` as applicable.

Do not silently override older architectural rules. If an older coordination document conflicts materially with an active `CURRENT-WORK.md`, report the conflict in `HANDOFF.md` or request GPT review.

## Related Existing Coordination Docs

These predate this lightweight workspace and may contain deeper Digital Twin decisions:

- `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
- `docs/agent-handoff/GLM53_DIGITAL_TWIN_COORDINATION.md`

Use them for deeper historical/domain decisions when relevant, but use `docs/ai/` as the lightweight day-to-day source for active task state.

# Agent Usage

## Prompt for ChatGPT / GPT

Use:

> Read `AGENTS.md`, `docs/ai/PROJECT-BRIEF.md`, `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, `docs/ai/ENV-ENGINEERING-LOOP.md`, `docs/ai/DEFECT-MEMORY.md`, `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`, `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md`, and the relevant domain/design files.
>
> Act as Architect + UX/UI + 3D/Visual Designer + Reviewer.
>
> Start from GOAL. Fetch current source reality before asking questions, grill only unresolved decisions, and inspect the actual repository before making technical assumptions.
>
> If implementation work is needed: convert the settled goal/spec into a bounded vertical-slice work order in `CURRENT-WORK.md` with ownership, RED/baseline evidence, tests/E2E, and stop/review gate.
>
> If reviewing implementation: inspect the actual branch/diff/code and return either:
>
> `PASS`
>
> or
>
> `CHANGES_REQUIRED`
>
> If changes are required, write specific actionable findings.

## Prompt for GLM 5.3

Use:

> Read:
> `AGENTS.md`
> `docs/ai/PROJECT-BRIEF.md`
> `docs/ai/CURRENT-WORK.md`
> `docs/ai/HANDOFF.md`
> `docs/ai/ENV-ENGINEERING-LOOP.md`
> `docs/ai/DEFECT-MEMORY.md`
> `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`
> `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md`
> and the relevant domain/design files.
>
> Inspect/fetch repository source reality before implementing.
>
> `CURRENT-WORK.md` is the authoritative task.
>
> Execute only the already-settled implementation slice: `OWNERSHIP/FRESHNESS → RED/BASELINE → IMPLEMENT → DEBUG → FOCUSED TESTS → SYSTEM/E2E → REPORT/SSoT/DEFECT MEMORY → REVIEW_REQUESTED`.
>
> Reuse existing code before creating new systems. Do not reopen the product goal or expand scope unless source reality contradicts the work order; if so, stop and escalate.
>
> When finished, update `docs/ai/HANDOFF.md` with:
> - implementation summary
> - files changed
> - tests
> - known issues
> - branch
> - exact HEAD
>
> Then STOP at `REVIEW_REQUESTED`.
>
> Do not begin unrelated work.

## Prompt for GLM after reviewer changes

Use:

> Read the latest `CURRENT-WORK.md`, `HANDOFF.md`, and reviewer findings.
>
> Fix all `CHANGES_REQUIRED` findings only.
>
> Test the affected behavior and regressions.
>
> Update `HANDOFF.md`.
>
> Push normally if this repository workflow allows it.
>
> Then STOP at `RE-REVIEW_REQUESTED`.
