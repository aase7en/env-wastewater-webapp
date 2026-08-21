# Digital Twin Cross-Agent Continuity

Last updated: 2026-08-21

## Purpose

Allow a new agent to continue the Digital Twin stream when a prior session or weekly limit ends, without depending on chat memory.

## Mandatory Startup

```text
1. Confirm repository and branch.
2. Read AGENTS.md.
3. Read docs/ai/PROJECT-BRIEF.md.
4. Read docs/ai/CURRENT-WORK.md.
5. Read docs/ai/HANDOFF.md.
6. Read docs/ai/digital-twin/README.md and every linked file.
7. Inspect current source and tests named by the work order.
8. Run git status and worktree checks before editing.
```

Do not trust a recorded commit, test count, bundle size, or branch status without cheaply verifying it when the task depends on it.

## Private Site Reference

When Google Drive is mounted, read-only source photographs are available at:

`L:\My Drive\A-Wiki-Data\raw\environment\env-wastewater-webapp\digital-twin\site-reference\2026-08-21`

Verify files against `MANIFEST.sha256` when integrity matters. Never copy these originals into Git, a PR, screenshots shared publicly, or the frontend bundle without explicit authorization. Use `docs/ai/digital-twin/09-SITE-VISUAL-REFERENCE.md` when the private Drive is unavailable.

## Ownership

### Core Engineering

- Twin types/contracts/adapters/selectors
- Supabase, React Query, Auth/RLS
- metric provenance/freshness and scenario semantics
- business rules and tests for data correctness

### Visual Experience

- `frontend/src/components/digital-twin/**`
- procedural geometry/assets
- camera, lighting, materials, animation, selection, responsive composition
- accessible DOM alternatives and visual QA

### Shared files

`DashboardPage.tsx`, package manifests, tokens, and shared UI components require explicit temporary ownership in the work order.

## Never Infer

- water level from volume/flow
- aerator state from overall system status
- individual equipment state from aggregate state
- timestamp from date-only data
- freshness without a policy
- discharge route from the canal's proximity
- normal/healthy status from missing data

## Work-Order Completion

Before stopping:

1. Update `docs/ai/HANDOFF.md`.
2. Append `docs/ai/digital-twin/10-SESSION-LEDGER.md`.
3. Record files, tests, screenshots, limitations, branch, and exact HEAD.
4. Commit only explicit files; never use `git add .`.
5. Stop at the work order's stop condition.

## Copy/Paste Resume Prompt

> Continue the Digital Twin work in `env-wastewater-webapp`. Do not rely on previous chat memory. First read `AGENTS.md`, `docs/ai/PROJECT-BRIEF.md`, `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, every file under `docs/ai/digital-twin/`, and `docs/agent-handoff/DIGITAL_TWIN_CONTINUITY.md`. Inspect current branch/status/source before acting. Follow the active micro task only. Preserve React Query/Supabase as source of truth, unknown-first semantics, ProcessFlowDiagram, accessibility, reduced motion, and WebGL fallback. Do not commit private site references or invent operational data.
