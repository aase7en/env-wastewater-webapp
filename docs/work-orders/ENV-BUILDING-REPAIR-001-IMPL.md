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
D3a EXPAND migration + rollback/postflight proof — author
`supabase/migrations/20261008000001_building_repair_c1_expand.sql` with
ONLY additive schema: nullable `core.repair_request.inspection_round_id`
FK → `building.inspection_round(id) ON DELETE RESTRICT`, unique index
when non-null, single-origin constraint, the one transactional RPC with
stable client key, server-derived `reported_by` via `auth.uid()`, RLS
alignment, locked `search_path` if definer, revoke/grant, facade view
recreation, audit. **No direct-write ban in this phase** — the
currently deployed client (direct insert in `building.ts:42-47`) must
keep working unchanged after expand applies. LIVE application =
HUMAN_AUTHORIZATION_REQUIRED Gate 1 (below).
D4 Building data-layer RED→GREEN (`frontend/src/lib/building.ts`,
`repair.ts`: RPC path replaces direct insert; select includes the link).
D5 import parser/promotion RED→GREEN (`frontend/src/lib/import-adapters/building.ts`
— the authoritative parsing seam, including its strict Thai/English boolean
handling (adjacent defect: values like "false"/"0" must parse strictly) —
plus a new focused `building.test.ts` following the sibling adapter test
convention, and `BulkImportPage.tsx` promotion flow: preview, explicit
operator promotion only, no silent historical promotion).
D6 minimal truthful Building UX + mobile/a11y RED→GREEN (`BuildingPage.tsx`,
`RepairRequestModal.tsx`: wrench/"แจ้งซ่อมแล้ว" renders ONLY from the durable
link; explicit repair cause field; 360/390/430 px; ≥44px targets; programmatic
labels; keyboard flow; no clipped overflow; persistent/focused conditional
errors; value-preserving retry).
D7 focused + full Vitest/TypeScript/lint/build/Playwright
(`frontend/tests/e2e/building-repair.spec.ts`).
D8 independent Standards + Spec/UX + security exact-SHA review (R3
cross-model route).
D9 PR/CI/merge — ONLY after Gate 1 (expected-head; supervisor execution
per standing owner authorization) — Pages then serves the RPC client.
D9b quiescence/monitoring window for cached old clients: after deploy,
observe legacy direct-write attempts (audit/monitoring query defined in
the migration postflight); window = at least 48h AND zero observed
legacy repair-needed write attempts from the old path before
proceeding (staff usage is periodic, not realtime; the app is a
refreshed SPA, so a short measured window suffices — evidence recorded,
never assumed).
D3b CONTRACT migration — author
`supabase/migrations/20261010000001_building_repair_c1_contract.sql`
enforcing the clause-5 ban (direct REST/view writes can no longer
create or update `repair_needed=true` outside the invariant-preserving
RPC) plus any residual constraints. LIVE application =
HUMAN_AUTHORIZATION_REQUIRED Gate 2 — presented only after D9b's
evidence threshold is met.
D10 exact-main CI/E2E/Pages + live DB postflight + deployed smoke.
D11 SSoT closeout + next-node selection.

## Hard gates (no autonomous crossing)

- **Gate 1 — LIVE ENV_DB application of the EXPAND migration (and any
  live RPC/RLS verification against production) requires explicit owner
  authorization** (HUMAN_AUTHORIZATION_REQUIRED): one compact ask with
  the exact migration SQL, rollback plan, and postflight checks.
- **Gate 2 — LIVE ENV_DB application of the CONTRACT migration**: same
  form; presented only after the new client is deployed (D9) AND the D9b
  quiescence evidence threshold (≥48h + zero legacy direct-write
  attempts) is recorded.
- **Rollout ordering (expand/contract — R3 rounds 1+2): code-before-schema
  breaks the new client; schema-with-ban-before-code breaks the old
  client.** Therefore: expand is purely additive and safe under the old
  client; the implementation PR merges only after Gate 1; the direct-write
  ban lands only via Gate 2 after deploy + measured quiescence. Autonomous
  work proceeds through D8, the prepared Gate-1 ask, and (after D9/D9b
  evidence) the prepared Gate-2 ask; no gate is crossed autonomously.
- No real environmental writes in tests; no PHI; `.env`/`data/**` never
  touched; user-facing dates พ.ศ.

## Mutable scope (exactly)

As registered in the claim (14 paths). Everything else forbidden — notably
the Operations surface (OperationsPage/operations.spec — read-only reuse of
`repair.ts` changes must not alter that page's behavior), env-int, guard and
autonomy scripts, `data/**`, `.env`.

## Acceptance

All D2 contract cases green with honest evidence; migration reviewed
line-by-line against the 11 clauses; UI truthful from the durable link only;
independent R3 review APPROVED at the exact final SHA; expected-head merge;
post-main CI/Pages verification; live-DB steps executed only after the human
gate; claim closed through a reviewed closeout transition.
