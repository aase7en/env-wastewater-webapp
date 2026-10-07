# ENV-OPS-001A — Read-only Operations Attention Board (implementation slice)

Status: CLAIMED / BOOTSTRAP_CONTROL (registered by the 2026-10-07 claim transition; authority begins when that transition merges)
Risk: MEDIUM — new public read-only surface; no schema/data/provider changes.
Repository: aase7en/env-wastewater-webapp.

## Assignment

- Claim `ENV-OPS-001A-C1`, generation 1, holder `zcode-env-ops-001a-g1-primary`
  (GLM-5.3 MAX lane; external cointh/Kilo dispatch remains disabled, so the
  admitted route is the in-session GLM lane under the supervisor).
- Worktree `A:\GitHub\_worktrees\env-ops-001a-20261007`, branch
  `feat/env-ops-001a`, base `origin/main@08c08ebf888b9ec90169e91f4df12d2379f7f110`.
- Contract: `docs/work-orders/ENV-OPS-001.md` (reviewed and merged; its
  archaeology, data-honesty invariants, UX contract, A1–A16 acceptance matrix,
  no-touch list, and gate battery are binding for this slice).
- Reviewer: independent GPT-6 Astra via Codex CLI. The implementing lane must
  not merge its own PR.

## Dispatch-pause lift

The frontier bullet "READY BUT DISPATCH-PAUSED … until later coordination
enforcement gates permit it" predates the hardened coordination stack. The
coordination guard and autonomy runtime are now durable on closed main
(`08c08ebf`); this reviewed claim transition is the fresh ownership gate the
ENV-OPS-001 contract requires, and it lifts the pause for exactly the
contract's read-only scope. `BOOTSTRAP_CONTROL` discipline (claim binding,
scope fences, independent review, expected-head merge) applies unchanged.

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
5. Independent exact-SHA review (Astra) → repair loop → CI → expected-head
   merge (owner-authorized supervisor execution) → post-main verification
   (CI + deployed Pages smoke with mocked REST) → closeout.

## Acceptance

All A1–A16 matrix items green with honest evidence; independent review
APPROVED at the exact final SHA; post-main verification passed; claim closed
through a reviewed closeout transition.
