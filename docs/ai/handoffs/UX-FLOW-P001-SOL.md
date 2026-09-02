# UX-FLOW-P001 — GPT-5.6 Sol Handoff

Status: IMPLEMENTING
Date: 2026-09-02
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-flow-p001`
Branch: `feat/ux-flow-p001`
Base: `origin/main@64f9f89cec1e0abe6b81d50a9bc6f26ecc500098`
Owner: GPT-5.6 Sol via Serena

## Objective

Build the first truthful wastewater Environmental Flow vertical slice as a production-accessible `/flow` surface, without promoting the existing dummy P21 scaffold or inventing missing Sankey quantities.

## Settled source reality

- `/flow` is absent from current `App.tsx`; `FlowDiagramPage.tsx` is orphaned.
- existing `useFlowData()` defaults to dummy; non-dummy modes throw.
- user-confirmed Activated Sludge topology is durable in `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`.
- daily reading supports `water_used_total` m³, `wastewater_in` m³, `excess_sludge_removed` m³, and boolean `wastewater_discharged`.
- no verified numeric final-discharge, RAS, filtrate, bypass, or emergency-flow quantity exists.

## Data-honesty decisions

- PFD/process topology and environmental quantity flow are complementary, not interchangeable.
- no dummy data on production route.
- no quantity propagation through treatment stages.
- water use and wastewater influent are separate evidence, not a mass balance.
- sludge m³ is a different medium from water m³.
- boolean discharge is status only; discharge quantity remains unavailable.
- structural branch existence does not imply active flow.

## Concurrent no-touch lanes

- Ultra owns Building/Repair decision work.
- GLM owns `frontend/src/lib/env-int/**` PR #72 remediation.
- ENV-WASTE-CARBON-001A is under GPT MAX release review at exact implementation `9882f29...` / PR #76; carbon rollup files and migration are no-touch.

## Next safe action

Create RED pure-model + browser contract before implementing the new production Flow model/component/route. Keep edits inside the bounded work order and do not mutate old dummy flow-model/use-flow-data unless a separately reproduced defect makes it necessary.
