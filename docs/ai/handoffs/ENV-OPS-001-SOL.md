# ENV-OPS-001 - GPT-5.6 Sol contract handoff

Status: CONTRACT_READY_FOR_REVIEW
Date: 2026-09-03
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-ops-001`
Branch: `docs/env-ops-001-contract`
Base: `origin/main@b39964498f585c1f1b10c01f5477ad6042d498e2`

## Objective

Shape the Operations board from actual repository/data contracts before any production UI implementation.

## Verified reality

- `core.repair_request` is a real durable work-item entity with lifecycle `open | in_progress | resolved | cancelled`.
- `wastewater.threshold_alert` is a real persisted threshold-event log with `notified_at` and `read_at`; unread is not unresolved.
- No generic incident/CAPA entity or unified Operations lifecycle was found.
- No verified threshold-alert severity exists.
- `core.attachment` is generic capability only; canonical Operations entity-type linkage is not settled.
- Building inspections are real, but `repair_needed` does not currently create a linked repair request in actual `BuildingPage.submit()`.
## Settled first slice

`ENV-OPS-001A` is a read-only Operations Attention Board with two source-local panels:

1. unresolved repair requests;
2. wastewater threshold events.

They share a page, not a fabricated generic incident model.

## Protected boundaries

- Building/Repair decision lane remains GPT Ultra-owned and no-touch.
- Parallel GLM work may own only its isolated `frontend/src/lib/env-int/gistda/**` contract slice.
- No schema/RLS/provider/Carbon/Twin mutation is part of Operations contract shaping.
- No real environmental/application write was performed.

## Evidence sources read

- current `origin/main` repo rules/SSoT/roadmap/master experience plan;
- `frontend/src/lib/repair.ts`, `alerts.ts`, `building.ts`, `attachments.ts`;
- `EquipmentPage.tsx`, `BuildingPage.tsx` and current route/source inventory;
- `reports/schema-snapshot-live.md` and relevant migrations/work orders;
- A-Wiki `wiki/entities/env/building.md` and `env-webapp-project.md`, reconciled against newer actual repo state.
