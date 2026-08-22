# UTH[AI]-ENV — Next Design Execution Plan

Last updated: 2026-08-23
Status: READY_FOR_IMPLEMENTATION

## Current checkpoint

- Digital Twin foundation: merged and approved (PR #14, merge `da3b70bdc5338f36c600efb3a3feedea2dee5420`).
- UX scale/mobile readability: merged and approved (PR #15).
- Environmental Intelligence/toolchain plan: merged (PR #18).
- Experience & Visual Intelligence Master Plan: merged (PR #19, merge `2c5d51f08ebb8b282767b505be6e49dce4102966`).
- No production implementation of the new Analytics/Flows/Operations/Map/Network surfaces has started yet.
- Digital Twin visual lane remains the top visual priority.

## Multi-agent split

### Lane A — Digital Twin visual vertical slice

Work order/domain: `DT-VIS-P001`.

Design source: `docs/ai/design/DT-VIS-P001-DESIGN-SPEC.md`.

Owner: GPT/Codex visual engineer; one writer only.

Primary files:

- `frontend/src/components/digital-twin/WastewaterTwin.tsx`
- visual-local helpers under `frontend/src/components/digital-twin/`

Shared `TwinCanvas.tsx`, `DashboardPage.tsx`, or shared UI/tokens require explicit temporary ownership before editing.

Goal: site-authentic Aeration Tank diorama; preserve all merged truth/fallback contracts.

### Lane B — GLM engineering lane

Work order: `docs/work-orders/WO-UX-AN-P001-GLM.md`.

Owner: GLM 5.3.

Primary files:

- new `frontend/src/components/analytics/**`
- analytics-specific tests/stories

Goal: reusable Situation & Trend presentation kit. No production route, data-source, Twin, or shared-token changes.

This lane is intentionally non-overlapping with Lane A and can proceed in parallel.

## Why this split

GPT/Codex retains work that needs stronger visual/spatial judgment:

- 3D composition;
- camera;
- site-authentic silhouette;
- materials/lighting;
- responsive visual balance;
- final UX review.

GLM gets a larger but deterministic engineering task where semantics are already decided:

- reusable React component architecture;
- typed props;
- explicit unknown/stale/source states;
- Ladle stories;
- unit tests;
- lint/build/test evidence.

GLM must not invent new risk formulas, thresholds, navigation, or visual semantics.

## File-collision rule

Lane A and Lane B may run concurrently only while they remain within their owned paths.

Parallel reporting must use lane-specific handoffs:

- Lane A: `docs/ai/handoffs/DT-VIS-P001.md`
- Lane B: `docs/ai/handoffs/WO-UX-AN-P001-GLM.md`

The coordinating/reviewer agent owns the shared `docs/ai/HANDOFF.md` until both lanes are reviewed/consolidated.

If either lane needs:

- `frontend/src/components/ui/**`;
- `frontend/src/styles/**`;
- `frontend/src/pages/DashboardPage.tsx`;
- routing/navigation;

then that lane must stop and request temporary ownership before editing.

## Next lanes after review

Do not start automatically. After Lane A and Lane B are reviewed:

1. `DT-VIS-P002` — Aeration water/system-level motion language;
2. `DT-VIS-P003` — operational panel hierarchy/responsive polish;
3. `UX-FLOW-P001` — wastewater Sankey vertical slice design + truthful quantity inventory;
4. `ENV-INT-P001` — GISTDA endpoint/source inventory and normalized external-data contract;
5. Operations board only after incident/action data contracts are inventoried.

## Tool usage

GPT/reviewer may use available repo workers/plugins for inspection, scoped documentation edits, diagnostics, and test verification.

Current toolchain source of truth: `docs/ai/tooling/AI-DEVELOPER-TOOLCHAIN.md`.

Do not make a tool connection itself part of product behavior. MCP/plugin output is supporting evidence; repository code/docs remain the SSoT.
