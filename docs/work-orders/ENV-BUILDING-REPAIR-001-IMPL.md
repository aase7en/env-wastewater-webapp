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
(D2) before any migration exists; two-migration expand/contract scope (paths exact in the registry); forbidden-scope
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
keep working unchanged after expand applies.
D3b CONTRACT migration — authored NOW, alongside D3a (so D8's single
exact-SHA review covers BOTH migration files and all code; only its
LIVE application is deferred): author
`supabase/migrations/20261010000001_building_repair_c1_contract.sql`
which in ONE transaction: (1) takes ACCESS EXCLUSIVE locks on
`building.inspection_round` and `core.repair_request`; (2) re-asserts
the clause-1 invariant in BOTH directions — (i) ZERO
`repair_needed=true` inspections without their linked repair, AND
(ii) ZERO linked repairs whose inspection has `repair_needed=false`
(a direct writer can flip a linked flag false during the expand
window; FK/uniqueness cannot see this cross-table mismatch) — any
violation aborts the whole migration with a typed error,
self-defending against the preflight race since legacy direct writes
remain enabled until this commit; (3) installs a DURABLE bidirectional
direct-write ban (enforced by triggers on `building.inspection_round`,
not just a one-time assertion — R3 round 6): (a) direct REST/view
writes that would create or update `repair_needed=true` outside the
RPC are rejected; (b) direct writes that would flip `repair_needed`
from true to false on a LINKED inspection are likewise rejected —
there is NO true→false route: clause 7's explicit cancellation
PRESERVES the true flag and the historical link, changing only the
repair's lifecycle status (cancelled, with actor/time/reason); the
flag stays true forever after a linked repair exists (packet clause
1). Rejections in both directions RAISE a distinct greppable
SQLSTATE + readable message, which is durably captured in the
PostgreSQL server log (an in-transaction audit-table insert would
roll back with the rejected statement — R3 round 7 — so rejected
attempts are captured via the server log, while COMMITTED RPC-path
operations (create/cancel) remain audit-logged via the existing
AFTER-DML audit mechanism). D2's RED tests cover BOTH rejection
directions post-contract (a direct true-set and a direct linked
true→false flip must both fail with the pinned SQLSTATEs) AND the
cancellation semantics (flag stays true, link intact, repair status
cancelled). (R3 rounds 4–5: a normalizing-trigger compatibility
option was analyzed and is INFEASIBLE — the legacy direct write lacks
the clause-2 mandatory values (explicit cause, issues_found premise,
durable location) and carries no stable retry key, so a trigger would
have to fabricate data, reject anyway, or lose idempotency; the hard
ban is the only contract-faithful path.) No standalone preflight is
trusted for correctness.
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
errors; value-preserving retry) — AND stale-client mitigation wiring:
`frontend/src/lib/sw-register.ts` gains the listener for the existing
`sw-update-available` CustomEvent + reload on `controllerchange`, and
`frontend/public/sw.js` gets a VERSION bump so any tab that reloads or
navigates (HTML is network-first) immediately picks up the new worker
and bundle. ACKNOWLEDGED LIMIT (R3 round 4): a pre-deploy tab that
NEVER navigates still runs old JS with no listener — no new code can
reach it; the residual risk is handled by the Gate-2 owner decision
below, not assumed away.
D7 focused + full Vitest/TypeScript/lint/build/Playwright
(`frontend/tests/e2e/building-repair.spec.ts`).
D8 independent Standards + Spec/UX + security exact-SHA review (R3
cross-model route) — covers BOTH migration files, the client, the
sw-register wiring, and the tests at one frozen SHA.
Gate 1 → D9 PR/CI/merge — ONLY after Gate 1 (expected-head; supervisor
execution per standing owner authorization) — Pages then serves the RPC
client with the forced-update wiring.
D9b quiescence/monitoring window for cached old clients — POSITIVE
evidence, not absence of traffic: (a) the deployed bundle provably
contains the sw-update reload wiring; (b) at least one RPC-path
Building submission observed (new client active in production); (c)
≥48h elapsed since deploy; (d) zero legacy direct-write repair-needed
attempts observed in the window (audit/monitoring query defined in the
migration postflight). All four recorded, never assumed.
Gate 2 preflight — orphan reconciliation (BOTH clause-1 violation
classes; early-warning listing only — correctness is enforced
atomically inside D3b, never by this preflight): class (i)
`repair_needed=true` inspections without their linked repair
(old-client submissions between Gate 1 and D9b succeed by design yet
create no repair) — each is listed in the Gate-2 ask for owner-
directed promotion through the same server RPC (the packet's explicit
operator-promotion path — never heuristic backfill, never silent
rewriting); class (ii) linked repairs whose inspection flag was later
flipped `false` by a direct writer during the expand window — each is
listed for owner-directed disposition under clause 7 (explicit
cancellation with actor/time/reason, or the owner directs flag
restoration through the RPC). Gate 2 cannot be presented while any
unreconciled row of either class remains.
Gate 2 → apply the CONTRACT migration (from the reviewed+MERGED main
blob; applied-file blob must equal merged main, per repo precedent).
**Gate-2 authorization content (R3 rounds 4–5): since D3b is frozen,
reviewed, and merged BEFORE Gate 2 opens, the ask carries no
post-hoc design choice — it is an informed authorization: the exact
SQL, rollback, postflight, the D9b positive-evidence record, both
preflight orphan lists (if any), and the RESIDUAL stale-client risk
stated plainly — a pre-deploy tab that never navigated will have its
first legacy `repair_needed=true` write after Gate 2 rejected with a
visible, readable error (captured in the DB server log); reload loads the new bundle
(network-first HTML + versioned SW) and the new client's
value-preserving retry recovers the submission. The owner authorizes
or withholds/delays Gate 2; autonomous agents never choose.**
D10 exact-main CI/E2E/Pages + live DB postflight + deployed smoke.
D11 SSoT closeout + next-node selection.

## Hard gates (no autonomous crossing)

- **Gate 1 — LIVE ENV_DB application of the EXPAND migration (and any
  live RPC/RLS verification against production) requires explicit owner
  authorization** (HUMAN_AUTHORIZATION_REQUIRED): one compact ask with
  the exact migration SQL, rollback plan, and postflight checks.
- **Gate 2 — LIVE ENV_DB application of the CONTRACT migration**: same
  form; presented only after ALL of: new client deployed (D9), the four
  D9b positive-evidence items, and the Gate-2 preflight showing ZERO
  unreconciled rows in BOTH clause-1 violation classes (class (i)
  promoted via the RPC; class (ii) dispositioned per clause 7). The
  ask is an informed authorization (SQL + rollback + postflight + D9b
  record + residual stale-tab rejection risk stated plainly); the
  applied file must be the reviewed, merged-main blob; D3b itself
  re-asserts both invariant directions atomically under table locks.
- **Rollout ordering (expand/contract — R3 rounds 1–5): code-before-schema
  breaks the new client; schema-with-ban-before-code breaks the old
  client; absence-of-traffic proves nothing about stale clients;
  unreviewed SQL never touches production; a compatibility trigger is
  infeasible without fabricating clause-2 values; and the clause-1
  invariant must hold in BOTH directions.** Therefore: BOTH migrations
  are authored and reviewed (D8) and merged (D9) as one exact SHA; only
  their APPLICATION is split — expand at Gate 1 (before merge/deploy),
  contract at Gate 2 (after deploy + positive quiescence + both-class
  orphan reconciliation). No gate is crossed autonomously.
- No real environmental writes in tests; no PHI; `.env`/`data/**` never
  touched; user-facing dates พ.ศ.

## Mutable scope (exactly)

As registered in the claim (16 paths — including
`frontend/src/lib/sw-register.ts` for the stale-client reload wiring).
Everything else forbidden — notably
the Operations surface (OperationsPage/operations.spec — read-only reuse of
`repair.ts` changes must not alter that page's behavior), env-int, guard and
autonomy scripts, `data/**`, `.env`.

## Acceptance

All D2 contract cases green with honest evidence; migration reviewed
line-by-line against the 11 clauses; UI truthful from the durable link only;
independent R3 review APPROVED at the exact final SHA; expected-head merge;
post-main CI/Pages verification; live-DB steps executed only after the human
gate; claim closed through a reviewed closeout transition.
