# ENV-BUILDING-REPAIR-001-IMPL — Building inspection → linked repair (C1 implementation slice)

Status: CLAIMED / BOOTSTRAP_CONTROL (registered by this claim transition; authority begins when the transition merges)
Risk: HIGH — schema/RLS/RPC mutation + import semantics + truthful history; every clause of the C1 package is binding.
Repository: aase7en/env-wastewater-webapp.

## Assignment

- Claim `ENV-BUILDING-REPAIR-001-C1`, generation 1, holder
  `zcode-env-building-repair-001-g1-primary` (GLM-5.3 MAX lane under the
  supervisor; external cointh/Kilo dispatch remains disabled).
- Worktree `A:\GitHub\_worktrees\env-building-repair-001-20261008`, branch
  `feat/env-building-repair-001`, cut from merged main at transition-merge
  time (claim transition's own branch point: `origin/main@e6bb3f0…`).
- Binding decision packet: `docs/work-orders/ENV-BUILDING-REPAIR-001.md`
  (owner C1 decision record + 11-clause package + RED-first implementation
  graph D1–D11 + adjacent defects list). Every clause is mandatory; none is
  optional; Option B remains permanently rejected.
- Reviewer: independent exact-SHA reviewer per the owner routing policy
  2026-10-07 — R2 ordinary: fresh GLM-5.3 MAX reviewer context; R3/critical:
  GPT-6.1 Sol preferred with GPT-5.6 Sol as the designated fallback
  cross-model reviewer (GPT-6 Astra prohibited for every ENV purpose). This
  lane is R3 (auth/RLS/RPC/schema + replay/idempotency), so its reviews use
  the cross-model route. The implementing lane must not merge its own PR.

## Dispatch exception (owner-authorized) — durable risk record

Architecture `docs/ai/architecture/ENV-COORDINATION-GUARD.md` §11.6/§12
keeps North-Star production lanes paused until the activation ladder
(ENV-COORD-003..009) completes; the registry remains `BOOTSTRAP_CONTROL` /
`AUTONOMY_NOT_READY` / `ENFORCEMENT_NOT_ACTIVE`.

Authorization: the project owner's explicit C1 decision (2026-10-07,
recorded durably in the decision packet) plus the standing ENV-roadmap
continuation instruction — the same owner-authorized exception pattern as
ENV-OPS-001A-C1. Pre-enforcement limitations (no server-side coordination
enforcement; checks informational only; no shadow-CI tuple; hooks not
activated) remain true throughout this lane.

Compensating controls: this reviewed claim transition with predecessor
fences; the packet's 11 non-negotiable clauses; RED-first contract tests
(D2) before any migration exists; single-migration scope; forbidden-scope
locks (Operations surface, env-int, guard/autonomy scripts, data, .env);
independent exact-SHA cross-model review before merge; expected-head merge
+ post-main verification; LIVE ENV_DB application held at a
HUMAN_AUTHORIZATION_REQUIRED gate; reviewed closeout transition.

## Execution graph (from the decision packet; binding)

D1 product decision — DONE (owner C1, 2026-10-07).
D2 schema/RLS/RPC contract tests RED — author
`scripts/building_repair_contract.py` + `scripts/test_building_repair_contract.py`
covering: atomic rollback; same-key retry idempotency; concurrent
double-submit; same-key/different-payload rejection; reporter spoof denial;
pending-role denial; source-link uniqueness/immutability (at most one origin
between reading_id and inspection_round_id); cancellation lifecycle;
delete/unlink restrictions; strict Thai/English import booleans; historical
import policy (no silent promotion, no heuristic backfill); facade/PostgREST
exposure; audit capture; truthful linked status in Building history.
D3 migration + rollback/postflight proof — author
`supabase/migrations/20261008000001_building_repair_c1.sql` implementing the
11 clauses (nullable `core.repair_request.inspection_round_id` FK →
`building.inspection_round(id) ON DELETE RESTRICT`, unique when non-null,
single-origin constraint, one transactional RPC with stable client key,
server-derived `reported_by` via `auth.uid()`, RLS alignment, locked
`search_path` if definer, revoke/grant, facade view recreation, audit).
LIVE application = HUMAN_AUTHORIZATION_REQUIRED (below).
D4 Building data-layer RED→GREEN (`frontend/src/lib/building.ts`,
`repair.ts`: RPC path replaces direct insert; select includes the link).
D5 import parser/promotion RED→GREEN (`BulkImportPage.tsx`; strict parsing,
preview, explicit operator promotion only).
D6 minimal truthful Building UX + mobile/a11y RED→GREEN (`BuildingPage.tsx`,
`RepairRequestModal.tsx`: wrench/"แจ้งซ่อมแล้ว" renders ONLY from the durable
link; explicit repair cause field; 360/390/430 px; ≥44px targets; programmatic
labels; keyboard flow; no clipped overflow; persistent/focused conditional
errors; value-preserving retry).
D7 focused + full Vitest/TypeScript/lint/build/Playwright
(`frontend/tests/e2e/building-repair.spec.ts`).
D8 independent Standards + Spec/UX + security exact-SHA review (R3
cross-model route).
D9 PR/CI/merge (expected-head; supervisor execution per standing owner
authorization).
D10 exact-main CI/E2E/Pages + live DB postflight + deployed smoke (live DB
steps only after the human gate).
D11 SSoT closeout + next-node selection.

## Hard gates (no autonomous crossing)

- **LIVE ENV_DB application of the migration (and any live RPC/RLS
  verification against production) requires explicit owner authorization**
  (HUMAN_AUTHORIZATION_REQUIRED): one compact ask presenting the exact
  migration SQL, rollback plan, and postflight checks. Everything before
  that gate (D2 contract tests, migration authoring, D4–D7 against
  mocked/local surfaces, review, code merge) proceeds autonomously.
- No real environmental writes in tests; no PHI; `.env`/`data/**` never
  touched; user-facing dates พ.ศ.

## Mutable scope (exactly)

As registered in the claim (11 paths). Everything else forbidden — notably
the Operations surface (OperationsPage/operations.spec — read-only reuse of
`repair.ts` changes must not alter that page's behavior), env-int, guard and
autonomy scripts, `data/**`, `.env`.

## Acceptance

All D2 contract cases green with honest evidence; migration reviewed
line-by-line against the 11 clauses; UI truthful from the durable link only;
independent R3 review APPROVED at the exact final SHA; expected-head merge;
post-main CI/Pages verification; live-DB steps executed only after the human
gate; claim closed through a reviewed closeout transition.
