# ENV-OPS-001A — Read-only Operations Attention Board (implementation slice)

Status: CLOSED 2026-10-07 (implemented and merged via PR #107 as bf9bc539; claim ENV-OPS-001A-C1 closed at generation 1 by the reviewed closeout transition)
Risk: MEDIUM — new public read-only surface; no schema/data/provider changes.
Repository: aase7en/env-wastewater-webapp.

## Assignment

- Claim `ENV-OPS-001A-C1`, generation 1, holder `zcode-env-ops-001a-g1-primary`
  (GLM-5.3 MAX lane; external cointh/Kilo dispatch remains disabled, so the
  admitted route is the in-session GLM lane under the supervisor).
- Worktree `A:\GitHub\_worktrees\env-ops-001a-20261007`, branch
  `feat/env-ops-001a-c1`, cut from current merged main at transition-merge
  time (the claim transition's own branch point is recorded as
  `origin/main@08c08ebf888b9ec90169e91f4df12d2379f7f110`).
- Contract: `docs/work-orders/ENV-OPS-001.md` (reviewed and merged; its
  archaeology, data-honesty invariants, UX contract, A1–A16 acceptance matrix,
  no-touch list, and gate battery are binding for this slice).
- Reviewer: independent exact-SHA reviewer per the owner routing policy
  2026-10-07 — R2 ordinary: fresh GLM-5.3 MAX reviewer context (separate
  read-only execution); R3/critical: GPT-6.1 Sol preferred with GPT-5.6 Sol
  as the designated fallback cross-model reviewer (GPT-6 Astra prohibited
  for every ENV purpose). The implementing lane must not merge its own PR.

## Dispatch exception (owner-authorized) — durable risk record

The frontier bullet "READY BUT DISPATCH-PAUSED … until later coordination
enforcement gates permit it" and architecture
`docs/ai/architecture/ENV-COORDINATION-GUARD.md` §11.6/§12 keep North-Star
production lanes paused until the activation ladder (ENV-COORD-003 shadow
CI → … → ENV-COORD-009 HARDENED activation) completes. The registry remains
`BOOTSTRAP_CONTROL` / `AUTONOMY_NOT_READY` / `ENFORCEMENT_NOT_ACTIVE`.

Authorization: the project owner's explicit 2026-10-07 ENV-roadmap
continuation instruction directing that ENV-OPS-001A implementation proceed
once its claim transition merges. This is an owner-authorized exception
bounded to this claim — the same reconciliation pattern as the
owner-authorized ENV-COORD-002 C1 release with its durable risk record.

Pre-enforcement limitations that remain true during this lane:

- no server-side coordination enforcement (main unprotected, rulesets empty);
- coordination checks are informational only (scripts/notify);
- no shadow-CI trusted evidence tuple (ENV-COORD-003 not started);
- hooks/autonomy dispatch not activated; runtime truthfully AUTONOMY_NOT_READY.

Compensating controls applied instead:

- this reviewed claim transition (fresh ownership gate the ENV-OPS-001
  contract requires) with predecessor fences pinned to current main;
- read-only product scope (no schema/RLS/provider/mutation surface);
- forbidden-scope locks (lib, Building, env-int, supabase, scripts, data);
- RED-first acceptance matrix (A1–A16), full gate battery, frozen exact SHA;
- independent exact-SHA review by a policy-valid reviewer before merge;
- expected-head merge guard + post-main CI/Pages verification + reviewed
  closeout transition.

This exception does NOT activate other production lanes, does not change
enforcement mode, and does not confer authority beyond the registered scope.

## Pre-existing unreconciled work — preserve, never clean (R3 round-3 finding)

`feat/env-ops-001a` (the ORIGINAL branch name considered for this lane) is
already checked out at the legacy contract-era worktree
`A:/GitHub/envww-ops-001a`, whose HEAD `685037e5…` is a fully merged
ancestor of main (no unpushed commits) but which is DIRTY with an earlier
unclaimed implementation attempt:

- modified: `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`,
  `docs/ai/ROADMAP.md`, `docs/ai/graph/PROJECT-GRAPH.md`,
  `docs/ai/handoffs/ENV-OPS-001-SOL.md`, `docs/work-orders/ENV-OPS-001.md`,
  `frontend/src/App.tsx`, `frontend/src/pages/OverviewPage.tsx`;
- untracked: `frontend/src/pages/OperationsPage.tsx`,
  `frontend/tests/e2e/operations-attention.spec.ts`.

Reconciliation rules (binding on this lane):

1. Per `AGENTS.md` git safety, that worktree must never be cleaned, reset,
   stashed, deleted, moved, or overwritten — it is unclaimed work of
   unknown provenance/quality, and several dirty files
   (`OverviewPage.tsx`, the docs set) are OUTSIDE this claim's mutable
   scope and are not admitted by it.
2. To avoid the checked-out-branch conflict, this claim's implementation
   uses the FRESH branch `feat/env-ops-001a-c1` in the registered isolated
   worktree, cut from merged main.
3. The legacy worktree's content may be consulted as REFERENCE ONLY
   (e.g., the draft OperationsPage/spec); nothing from it may be committed
   as-is into this lane — all implementation must satisfy the RED-first
   A1–A16 contract from scratch.
4. Disposition of the legacy worktree/branch is a separate future
   owner-decided cleanup; this claim neither authorizes nor performs it.

## Mutable scope (exactly)

- `frontend/src/pages/OperationsPage.tsx` (new)
- `frontend/src/App.tsx` (route wiring to `/operations` only)
- `frontend/tests/e2e/operations.spec.ts` (focused E2E)
- this Work Order
- `docs/ai/handoffs/ENV-OPS-001A-GLM.md` (lane handoff)

Everything else is forbidden — notably `frontend/src/lib/**` (read-only reuse
of `repair.ts`, `alerts.ts`, `hooks.ts`, Aura primitives), Building page/lib,
`frontend/src/lib/env-int/**`, supabase/schema, scripts, coordination files,
`.env`, `data/`.

## Execution contract

1. RED-first: reproduce the A1–A16 matrix as truthful failing tests/specs on
   the isolated worktree before implementation (mocked REST/session; no real
   writes).
2. Implement the two-source board exactly per the contract: unresolved
   `core.repair_request` (`open` + `in_progress`) and
   `wastewater.threshold_alert` (read_at = presentation acknowledgement only),
   never normalized into a fabricated incident object; no invented severity;
   empty ≠ normal; polling ≠ live; partial-source failure stays visible.
3. Responsive per contract (desktop two-panel, mobile 360–430 recompose,
   ≥44px targets, accessible DOM states); Thai-first labels consistent with
   the app.
4. Full gate battery per the contract's verification list (focused Operations
   Playwright, full Vitest, tsc, lint, build, diff-check, changed/forbidden
   scope audit), freeze exact SHA, stop at REVIEW_REQUESTED.
5. Independent exact-SHA review per the owner routing policy 2026-10-07
   (R2 fresh GLM reviewer; R3 GPT-6.1 Sol preferred / GPT-5.6 Sol fallback)
   → repair loop → CI → expected-head merge (owner-authorized supervisor
   execution) → post-main verification (CI + deployed Pages smoke with
   mocked REST) → closeout.

## Acceptance

All A1–A16 matrix items green with honest evidence; independent review
APPROVED at the exact final SHA; post-main verification passed; claim closed
through a reviewed closeout transition.
