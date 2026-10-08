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

- 2026-10-08 (D3a+D3b authored, commit `e9f8509`): both migrations
  written per the 8-round-hardened WO — expand = additive link (FK
  RESTRICT + unique-when-non-null + single-origin CHECK) + the ONE
  transactional idempotent RPC `core.create_building_repair` (stable
  client key, same-key/different-cause rejection, auth.uid() reporter,
  locked search_path, in-function staff/admin role gate, facade
  recreation); contract = per-table ACCESS EXCLUSIVE locks +
  both-direction clause-1 assert + durable bidirectional ban trigger
  (pinned 42501 / ENV_C1_BAN_* messages, RPC passes at trigger
  depth>1, no true→false route). D2 static contract tests GREEN (6
  passed + 9 subtests; 14 typed live-window skips). Not yet applied
  anywhere live. Next: D4 data layer (building.ts/repair.ts RPC
  path), D5 import adapter/promotion, D6 truthful UI + stale-client
  wiring, D7 gate battery, D8 cross-model review, Gate 1 ask.
- 2026-10-08 (D2 RED recorded, commit `15daa1f`): claim merged via PR
  #109 as `cc524dc` after the 8-round R3 trail (final APPROVED
  @cfeae2d); ownership gate PASSED in this worktree (identity_preflight
  True). RED evidence: 3 FAILED / 3 PASSED / 14 SKIPPED (typed
  NO_LIVE_GATE_WINDOW).
- Historical: lane opened after the claim transition merged; D2 was
  the first node per the WO.
