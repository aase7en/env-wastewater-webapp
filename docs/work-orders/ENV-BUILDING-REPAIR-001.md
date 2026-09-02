# ENV-BUILDING-REPAIR-001 — Building Inspection to Repair Request Contract

Status: DECISION_REQUIRED
Owner / decision packet: GPT-5.6 Ultra campaign with three independent GPT-5.6 Ultra read-only audits
Independent implementation review owner: fresh reviewer bound to the exact pushed implementation SHA
Repository: `aase7en/env-wastewater-webapp`
Decision worktree: `A:\GitHub\envww-building-repair-decision-001`
Decision branch: `docs/building-repair-001-decision`
Authority base: `origin/main@64f9f89cec1e0abe6b81d50a9bc6f26ecc500098`
Initial immutable audit snapshot: `73f76cd42636be0253c0a2e4a9c906d8fe164582`
Companion knowledge snapshot: `A-Wiki origin/main@fc9a981d08785ee684a2f1f0616dc254f6855c0c`
Last updated: 2026-09-02

## Goal

Settle and then close the real contract from a Building inspection marked
`repair_needed` to `core.repair_request` without inventing cause, asset,
reporter, linkage, retry, import, update, or deletion semantics.

This packet is the requirement gate. No production code, migration, or live
write is authorized by this document while its status is `DECISION_REQUIRED`.

## Authority and ownership gate

- The primary checkout was stale and contained unrelated untracked files,
  including `.serena/`; it was inspected read-only and was not cleaned,
  stashed, reset, checked out, or otherwise mutated.
- This docs-only decision worktree was created from the exact current
  `origin/main` above. Its mutable scope is this new work order and local
  A-Loop state only.
- During the audit, `origin/main` advanced from `73f76cd...` to `436dbe7...`
  through the Food closeout, then to `64f9f89...` through the bounded
  ENV-CMD-001/002 contract and Overview work. This decision branch was
  fast-forwarded to `64f9f89...` before publication. The complete intervening
  diff changes Food/command-center/Overview/SSoT files, but no Building page,
  Building/Repair library, import adapter, Repair UI/PDF, schema snapshot, or
  Supabase migration used by this audit.
- Current SSoT explicitly leaves Building `DECISION_REQUIRED` and reserves it
  for this separately launched Ultra campaign:
  `docs/ai/CURRENT-WORK.md:33,52`, `docs/ai/HANDOFF.md:23-27`,
  `docs/ai/ROADMAP.md:134`, and
  `docs/ai/graph/PROJECT-GRAPH.md:225`.
- GitHub PR #72 (`feat/env-int-provenance-001`) is open at head
  `2415607f0572ec1a04aa0237078562dff439f1d1`. Its six-file diff is limited to
  `frontend/src/lib/env-int/core/**` plus its own work order/handoff, so it does
  not own or overlap Building/Repair files. A fresh overlap gate remains
  mandatory before implementation.

## Verified current reality

The implemented flow is flag-only:

```text
BuildingPage.submit()
  -> createBuildingRound(form)
  -> INSERT public.inspection_round
  -> success toast + inspection refresh
```

It does not call `createRepairRequest`, does not insert a repair, and does not
query or display a linked repair:

- `frontend/src/pages/BuildingPage.tsx:13,26-29,75-84`
- `frontend/src/lib/building.ts:42-49`
- `frontend/src/lib/repair.ts:57-76`
- `frontend/src/components/repair/RepairRequestModal.tsx:19-27,55-59`

Bulk import also writes directly to `inspection_round`; it does not traverse a
repair command: `frontend/src/pages/BulkImportPage.tsx:226-282`.

This contradicts durable claims that were marked complete:

- `docs/work-orders/MOD-BL-building.md:11,17`
- `frontend/src/lib/building.ts:1-4`
- `frontend/src/pages/BuildingPage.tsx:43-45`
- `supabase/migrations/20260719000006_mod_columns.sql:83-84`
- companion A-Wiki `wiki/entities/env/building.md:11-20`

The history wrench at `BuildingPage.tsx:83` is only the boolean flag. It is not
evidence that a repair request exists. The user-visible arrow to
`repair_request` is therefore currently false.

## Current live ENV_DB preflight

A read-only metadata/count preflight was run on 2026-09-02 through the
configured Supabase Management API. No secret, PHI, operational row, or row
payload was printed.

| Fact | Current result |
|---|---:|
| `building.inspection_round` rows | 0 |
| `repair_needed = true` rows | 0 |
| `core.repair_request` rows | 0 |
| Building-to-repair FK/link | none |
| Building-to-repair uniqueness/idempotency constraint | none |
| Repair reporter population trigger/default | none |
| Relevant triggers | generic audit triggers only |

Live schema confirms:

- `building.inspection_round.repair_needed` is a required boolean defaulting
  to false, but has no implication constraint or repair link.
- `core.repair_request.cause` is required. Its only optional source/actor
  columns are `equipment_id`, `reading_id`, and `reported_by`; there is no
  inspection source.
- `reported_by` is nullable with no default, although
  `frontend/src/lib/repair.ts:52-70` claims a database trigger fills it. The
  current client therefore creates `reported_by = NULL` unless another caller
  supplies a value.
- Building RLS uses the staff/admin helper. Repair RLS is still broad
  `authenticated ALL USING (true) WITH CHECK (true)`, so pending users and
  direct REST provenance remain a security gap.
- Public facade views are `security_invoker`, but adding a base-table column
  requires recreating `public.repair_request` because its existing `select *`
  column set was fixed when the view was created.

There is no historical backfill to perform now, and no relationship may be
inferred from timestamps, prose, equipment, reporter, or cause.

## Semantic blockers

The historical auto-seed requirement is not implementable truthfully from the
current fields alone:

1. `findings` is an optional observation, not a repair `cause`.
2. `assigned_to` is a person/team label, not an affected `equipment_id`.
3. `repair_needed=true` is currently allowed with `issues_found=false`, blank
   findings, no location, no equipment, and no stable repair description.
4. One inspection covers floor, wall, electrical, water, and sanitation. It is
   undefined whether one round produces one aggregate request or several
   independently actionable issue requests.
5. Retries, double taps, refreshes, and two tabs have no durable idempotency
   identity.
6. `false -> true`, `true -> false`, cause edits, repair cancellation, and hard
   deletion have no agreed lifecycle.
7. Historical import and operational work issuance are different events, but
   current import has no mode distinction. Worse,
   `Boolean(rawValue)` at
   `frontend/src/lib/import-adapters/building.ts:22-23` turns non-empty strings
   such as `"false"` and `"0"` into true.
8. The supposed Building manual fallback does not exist: persisted repair
   creation is Dashboard-only; Equipment links to Reports, whose PDF action
   does not persist a repair.

## Options evaluated

| Option | Contract | Verdict | Required consequence |
|---|---|---|---|
| A — flag only | `repair_needed` is a follow-up signal; no automatic request | Safe only if auto creation is explicitly rescinded | Correct the false SSoT/comments/UI, show “needs follow-up” rather than “repair created,” and add a discoverable persisted manual Building action if operations require one |
| B — auto without durable link | Client creates an unlinked repair after inspection save | REJECTED | Cannot prove origin, roll back partial success, deduplicate retries, reconcile edits/deletes, or distinguish a manual repair |
| C1 — one linked repair per round | One aggregate repair request at most for each inspection | Smallest enforceable auto contract, but cardinality is an explicit product decision | Typed FK + uniqueness + explicit repair description + atomic/idempotent server command + lifecycle/RLS/import rules |
| C2 — issue-level linked repairs | One inspection has durable issues; each issue may create one repair | Most truthful when several defects become separate jobs, but broader | New issue identity/model, issue-level UX, issue-to-repair FK/uniqueness, plus all C1 safety controls |

Option B is permanently out of scope. Existing wastewater client-side
reading-then-repair code already demonstrates why: the reading can commit,
repair failure is swallowed, and edits can create duplicates
(`frontend/src/lib/supabase-queries.ts:231-273`). It must not be copied.

## Recommended bounded decision package

Recommended answer for this slice is **C1**, only if operations confirm that
one Building inspection round represents at most one aggregate repair job.
Approval of C1 means approval of the complete package below; individual safety
clauses are not optional:

1. The database invariant is: `repair_needed=true` if and only if exactly one
   repair exists with `inspection_round_id = inspection.id`; every linked
   repair points to a true inspection. Cancellation keeps the historical link
   and true flag while changing the repair lifecycle status.
2. A true `repair_needed` requires `issues_found=true`, a durable premise
   scope such as `location_id`, and a new explicit nonblank repair
   cause/problem field. `findings` remains a separate observation.
3. Add nullable `core.repair_request.inspection_round_id` referencing
   `building.inspection_round(id) ON DELETE RESTRICT`, unique whenever non-null.
   `equipment_id` remains an optional affected asset, never the source link.
4. At most one origin is permitted between `reading_id` and
   `inspection_round_id`; genuinely manual requests may have neither.
5. Use one transactional Postgres command/RPC, not two browser inserts. The
   client supplies a stable inspection/request UUID retained across ambiguous
   retry; same key with different payload is rejected. UI submission is also
   locked while pending. Direct REST/view writes must not be able to create or
   update `repair_needed=true` outside this invariant-preserving path.
6. Run with caller privileges where possible. Derive `reported_by` from
   `auth.uid()` server-side, align Repair RLS to staff/admin, and deny reporter,
   status, timestamp, link, and delete spoofing. If a definer function becomes
   unavoidable, lock `search_path`, schema-qualify every reference, revoke
   default `PUBLIC`/`anon` execution, grant narrowly, and repeat the role check
   inside the function.
7. Creation with true and `false -> true` creates exactly once. Repeating true
   returns the same pair. `true -> false` does not delete or unlink history;
   an explicit repair cancellation with actor, time, and reason records the
   no-work decision.
8. Linked inspections and repairs cannot be hard-deleted or unlinked. No
   cascade and no `SET NULL`; use an explicit void/cancel lifecycle.
9. Historical imports do not silently open current work. Strictly parse
   booleans/enums, reject imported operational true rows unless an operator
   explicitly promotes them through the same server command, and show the
   result in preview. A historical true value is never silently rewritten to
   false; it remains rejected/pending until promoted or a separate historical
   evidence field is explicitly approved. No heuristic backfill.
10. Recreate and verify the public facade view, audit rows, grants, policies,
   PostgREST visibility, and live counts after migration.
11. Building history displays a real linked request ID/status. A wrench or
    “แจ้งซ่อมแล้ว” may render only from the durable link, never from the flag.

If an inspection can produce multiple independently assigned jobs, do not
approve C1. Choose C2 and define durable `building.inspection_issue` identity
before any implementation work.

## RED-first implementation graph after decision

No node below may start before the package above is accepted or replaced by an
equally explicit decision.

```text
D1 product decision
  -> D2 schema/RLS/RPC contract tests RED
  -> D3 migration + rollback/postflight proof
  -> D4 Building data-layer RED and implementation
  -> D5 import parser/promotion RED and implementation
  -> D6 minimal truthful Building UX + mobile/a11y RED
  -> D7 focused + full Vitest/TypeScript/lint/build/Playwright
  -> D8 independent Standards + Spec/UX + security exact-SHA review
  -> D9 PR/CI/merge
  -> D10 exact-main CI/E2E/Pages + live DB postflight + deployed smoke
  -> D11 SSoT closeout and next-node selection
```

Mandatory RED cases include atomic rollback, same-key retry, concurrent
double-submit, same-key/different-payload rejection, reporter spoof denial,
pending-role denial, source-link uniqueness/immutability, cancellation and
delete restrictions, strict Thai/English import booleans, historical import
policy, facade exposure, audit capture, and real linked status in Building
history. Mobile acceptance includes 360/390/430 px, programmatic labels,
>=44 px actions, keyboard flow, no clipped overflow, persistent/focused
conditional errors, and value-preserving retry.

## Adjacent defects recorded, not silently absorbed

- Repair active filtering excludes `in_progress`; status transitions and
  resolution actor/reason are not enforced.
- The existing repair PDF formats an already Thai-formatted date a second time,
  hardcodes wastewater equipment, omits persisted request/source identity, and
  does not register the claimed Thai font. Building must not reuse it as proof
  of a durable repair. If printing becomes an acceptance criterion, open a
  bounded Repair PDF repair node and visibly verify Thai rendering.
- The tracked migration set does not contain the original
  `core.repair_request` CREATE migration, reducing fresh-environment
  reproducibility.
- The current API migration runner sends statements separately and continues
  after failures; it is not an atomic deployment boundary for interdependent
  DDL.

## Decision question

Approve the complete recommended C1 package above — **one inspection round can
create at most one aggregate repair request** — or reject it because one round
must support several independently actionable repair issues?

Recommended answer: approve C1 for this bounded slice only if that one-job
cardinality matches the real Building workflow; otherwise answer “multiple”
and C2 becomes the requirement-design task before implementation.

## Stop condition

This campaign remains `DECISION_REQUIRED`. Do not create the implementation
worktree, write RED tests, modify production code/schema, open an implementation
PR, or perform a live write until the decision question has an authoritative
answer. The A-Loop goal remains active and resumes from D1 after that answer.
