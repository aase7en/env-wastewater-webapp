# PROJECT BRIEF

## Project

**env-wastewater-webapp / UTH[AI]-ENV**

Repository for hospital environmental monitoring, with wastewater treatment as the original and most mature workflow.

## Goal

Maintain a reliable environmental monitoring application and evolve it incrementally toward an **Environmental Operations Digital Twin** without rewriting working production features.

## Users

- Hospital environmental staff using operational forms, dashboards, history, alerts, reports, and related ENV modules.
- Admin users with additional administration and review capabilities.
- TODO: confirm the complete stakeholder list and role-specific UX needs before a major information-architecture redesign.

## Product Vision

A trustworthy Thai-language environmental operations system that combines operational records, sensors, reports, alerts, and eventually optional 3D Digital Twin views while keeping conventional Process/Data views available.

The Digital Twin must represent operational data honestly: missing values stay unknown, manual daily records are not mislabeled as realtime, and visual presentation must not invent engineering meaning.

## Current State

High-confidence repository facts:

- Production frontend is live on GitHub Pages.
- Frontend talks directly to Supabase; the retired FastAPI backend is no longer the production architecture.
- Wastewater monitoring includes a dashboard, daily-entry form, recent readings/history, reports, process-flow visualization, thresholds, and related environmental modules.
- React Query is used for frontend data fetching/caching.
- Repository contains design documents, ADR/work-order documentation, migrations/scripts, tests, and an A-Wiki companion reference described in `AGENTS.md`.
- `main` does **not** currently list Three.js / React Three Fiber in `frontend/package.json`.
- Existing coordination docs reference planned/separate Digital Twin work. TODO: confirm the exact current branch/HEAD before any 3D implementation task.

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

- No Three.js / React Three Fiber dependency detected on `main` at workspace initialization.
- TODO: confirm and preserve any separate/unpushed Digital Twin branch before future implementation or rebase work.

### Hosting

- GitHub Pages for the frontend.
- Supabase for managed backend/database services.

### Other Important Tools

- Vitest for unit tests.
- Playwright for end-to-end tests.
- oxlint for linting.
- Ladle is available for component-oriented UI development.
- Companion A-Wiki repository is referenced by `AGENTS.md` for domain context.

## Major Repository Areas

- `frontend/` — production SPA and tests
- `docs/` — architecture/work orders/coordination/research
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

### ChatGPT / GPT

`DISCOVER → DESIGN → SPECIFY → REVIEW`

### GLM

`READ → IMPLEMENT → TEST → REPORT`

Shared state must live in repository files.

## Coordination Precedence

For day-to-day work, use this precedence:

1. Actual current source / branch reality.
2. Security, privacy, and data integrity constraints.
3. `docs/ai/CURRENT-WORK.md` — authoritative definition of the active task and allowed scope.
4. Latest reviewer decision recorded in `docs/ai/CURRENT-WORK.md` or `docs/ai/HANDOFF.md`.
5. `docs/ai/PROJECT-BRIEF.md` and relevant `docs/ai/design/*` specifications.
6. Older/deeper coordination documents under `docs/agent-handoff/`.

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

> Read `docs/ai/PROJECT-BRIEF.md`, `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, and relevant files under `docs/ai/design/`.
>
> Act as Architect + UX/UI + 3D/Visual Designer + Reviewer.
>
> Inspect the actual repository before making technical assumptions.
>
> If implementation work is needed: update `CURRENT-WORK.md` with a concrete work order.
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
> `docs/ai/PROJECT-BRIEF.md`
> `docs/ai/CURRENT-WORK.md`
> and relevant `docs/ai/design/*` files.
>
> Inspect the repository before implementing.
>
> `CURRENT-WORK.md` is the authoritative task.
>
> Execution: `READ → IMPLEMENT → TEST → REPORT`
>
> Reuse existing code before creating new systems. Do not expand scope.
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
