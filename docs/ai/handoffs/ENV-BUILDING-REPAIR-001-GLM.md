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

- 2026-10-09 (D8 COMPLETE, APPROVED @`ac92ac7` after 8 review rounds by
  GPT-5.6 Sol fallback; verdict issuecomment-6072799538; exact-head CI
  green incl. 4m41s smoke; reviewer independently mutation-tested the
  static pins — 16/16 killed). Full trail: R1 10P1+4P2 → R2 7P1+2P2 →
  R3 6P1+2P2 → R4 3P1+P2 → R5 3P1+P2 → R6 2P1+P2 → R7 2P2 → R8
  APPROVED; every round repaired with the full battery green. Per the
  WO hard gates, D9 (merge) is BLOCKED on human Gate 1 (live expand
  application) — the compact ask (exact SQL + rollback + postflight)
  was presented to the owner in the canonical session
  (sess_272219b6). Next: on Gate-1 authorization → apply expand via
  the Management API → live matrix GATE1_EXPAND_APPLY → expected-head
  merge of PR #111 → D9b positive-quiescence window → Gate-2 ask →
  D10 → D11 closeout.
- 2026-10-08 (D6+D7 done, commits `2fddeb5`+`abbb555`): BuildingPage
  truthful UI (wrench/status ONLY from the durable link; legacy
  flag-only honest; linked rows undeletable; cause+location client
  gates; RPC submit w/ stable client key + double-submit lock;
  a11y/mobile incl. 360/390/430 no overflow) + sw-register reload
  wiring + sw.js v2 bump; focused E2E 6/6 green; full battery green
  (Vitest 25/364, tsc, lint 0, pytest 388+491 subtests, 14 typed
  live-window skips). ALL CODE NODES D2–D7 COMPLETE. Next: D8
  independent cross-model review (GPT-6.1 Sol preferred → GPT-5.6 Sol
  fallback) of the frozen exact SHA covering BOTH migrations + client
  + wiring + tests; then the compact human Gate-1 ask (exact expand
  SQL + rollback + postflight) — LIVE application never autonomous.
- 2026-10-08 (D4+D5 done, commit `d8fd815`): building.ts gains the
  linked-repair embed + createBuildingRoundWithRepair() RPC wrapper
  (stable client key); repair.ts exposes read-only
  inspection_round_id in selects; import adapter booleans now STRICT
  (adjacent truthy-coercion defect fixed; building.test.ts 7 tests
  incl. regression). Gates: tsc clean, lint 0 errors, Vitest 25/364
  green, D2 contract suite green. Next: D6 truthful UI (wrench only
  from the durable link; explicit cause field; mobile/a11y) +
  stale-client wiring (sw-register listener + sw.js VERSION bump) →
  D7 focused E2E + gate battery → D8 cross-model review → Gate 1 ask.
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
