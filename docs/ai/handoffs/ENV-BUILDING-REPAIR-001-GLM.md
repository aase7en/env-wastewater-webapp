# ENV-BUILDING-REPAIR-001 — Lane handoff

## Assignment — 2026-10-08

- Claim `ENV-BUILDING-REPAIR-001-C1`, generation 1, status `CLAIMED`,
  holder `zcode-env-building-repair-001-g1-primary`.
- Worktree `A:\GitHub\_worktrees\env-building-repair-001-20261008`, branch
  `feat/env-building-repair-001` (fresh branch cut from merged main at
  transition-merge time).
- Implementation Work Order:
  `docs/work-orders/ENV-BUILDING-REPAIR-001-IMPL.md`; binding decision
  packet: `docs/work-orders/ENV-BUILDING-REPAIR-001.md` (owner C1 decision
  + 11-clause package + D1–D11 graph).
- Objective: durable `inspection_round -> repair_request` linkage per the
  C1 package — schema/RLS/RPC + Building data layer + import promotion +
  truthful UI/history, RED-first per the graph.
- Dispatch basis: owner-authorized exception (risk record in the
  implementation WO). LIVE ENV_DB application of the migration is a
  HUMAN_AUTHORIZATION_REQUIRED gate — never crossed autonomously.

## Checkpoint

- Lane not yet started; authority begins when the claim transition merges.
  Next action: create the isolated `feat/env-building-repair-001` worktree
  from merged main, re-run the ownership gate, then execute D2 RED-first
  (schema/RLS/RPC contract tests) before any migration is authored.
