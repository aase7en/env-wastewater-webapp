# ENV-ARCH-001 — Project Operating Architecture + Graph + Unified Roadmap

Status: REVIEW_REQUESTED
Owner: GPT + SunDay-Worker 1
Reviewer: independent read-only reviewer
Merge owner: GPT

## Goal

Make ENV resumable from repository SSoT without chat history. A new capable agent should be able to understand runtime architecture, active work, dependencies, ownership, risks, evidence, and the next bounded step.

## Scope

Create only the missing operating artifacts: operating index, system architecture map, project graph, unified roadmap, current-state inventory, and SSoT cross-links.

## Out of scope

No production frontend changes, schema/RLS changes, or broad feature activation in this documentation slice.

## Source reality

Base: `origin/main@9abf1b02d09a14f5328fd03fac32c837c3d89bc2`.

Verified against current routes, layout, domain libraries, Supabase client, package scripts, live schema snapshot, test suites, and existing design/domain SSoT.

## Deliverables

- `docs/ai/PROJECT-OPERATING-MAP.md`
- `docs/ai/architecture/SYSTEM-ARCHITECTURE.md`
- `docs/ai/graph/PROJECT-GRAPH.md`
- `docs/ai/ROADMAP.md`
- `docs/ai/research/CURRENT-STATE-INVENTORY-2026-08-27.md`
- required SSoT cross-links

## Acceptance

No production source change; links resolve; route/schema claims match source reality; roadmap preserves Digital Twin/data-honesty rules; `git diff --check` clean; applicable CI green; independent review before merge.

## Stop gate

Stop at `REVIEW_REQUESTED`. After approval and merge, activate only the next eligible bounded production slice.
