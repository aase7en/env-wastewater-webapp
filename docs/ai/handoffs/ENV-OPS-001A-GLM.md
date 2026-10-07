# ENV-OPS-001A — Lane handoff

## Assignment — 2026-10-07

- Claim `ENV-OPS-001A-C1`, generation 1, status `CLAIMED`, holder
  `zcode-env-ops-001a-g1-primary`.
- Worktree `A:\GitHub\_worktrees\env-ops-001a-20261007`, branch
  `feat/env-ops-001a-c1` (fresh branch cut from merged main — see the
  Work Order's pre-existing-unreconciled-work record about the legacy
  dirty worktree `A:/GitHub/envww-ops-001a` on branch
  `feat/env-ops-001a`, which must be preserved untouched).
- Work Order: `docs/work-orders/ENV-OPS-001A.md`; binding contract:
  `docs/work-orders/ENV-OPS-001.md`.
- Objective: read-only two-source Operations Attention Board at
  `/operations` (unresolved repairs + threshold events) with the contract's
  full data-honesty invariants and A1–A16 acceptance matrix.
- External cointh/Kilo dispatch remains disabled (`UNKNOWN` quota/upstream);
  the admitted GLM route is this supervisor session's lane under the
  registered claim.

## Checkpoint

- 2026-10-07 (GREEN frozen): RED-first acceptance spec committed first
  (`3c395c5`; 8/8 truthful missing-board failures with shell+auth rendering),
  then implementation: `OperationsPage.tsx` (two-source read-only board,
  data-honesty invariants per contract), `/operations` route wiring in
  `App.tsx` (RequireAuth, no nav/AppShell changes), spec refinements
  (in_progress fixture gains real reading linkage; Tab depth 40 through
  shell nav; HEAD count allowed in the read-only guard).
  Gates: operations Playwright 8/8; full Vitest 24 files / 357 tests;
  `tsc -b` clean; lint 0 errors; build success; `git diff --check` clean;
  changed files exactly the claim's mutable scope. Status:
  REVIEW_REQUESTED — awaiting independent exact-SHA review (R2 fresh
  GLM-5.3 MAX reviewer context per owner routing policy 2026-10-07);
  implementing lane must not merge its own PR.
- Lane basis: owner-authorized dispatch exception (risk record in the Work
  Order). Legacy unclaimed attempt in the dirty worktree
  `A:/GitHub/envww-ops-001a` (branch `feat/env-ops-001a`) preserved
  untouched — reference-only, never committable as-is.
