# ENV-DEFECT-TYPEDWAIT-001 — Typed External-Wait Rule, #101 loop-doc slice (Work Order)

Status: CLOSED — delivered via PR #149 (merged dd2a095); closeout transition pending. Task: `ENV-DEFECT-TYPEDWAIT-001` (the recorded follow-up from the ENV-DEFECT-LEGACYLOOKUP-001 closeout — GitHub issue #101's typed-external-wait rule). Claim: `ENV-DEFECT-TYPEDWAIT-001-C1` (generation 1). Base: claim base dcdf7dfcd5a42aadf6a0309174d46f68138f65b1; implementation branch feat/env-defect-typedwait-001 cut from 3d269cd8e9625aa51ad100b563553b3562c9c6cb (claim transition merge). Registered by: GLM-5.3 MAX coordinator (claim-transition author). Review owner (implementation PR): independent exact-SHA review — R2 default fresh GLM-5.3 MAX reviewer context per the owner routing policy 2026-10-07 (cross-model R3 unavailable in this execution session; recorded honestly in the handoff; GPT-6 Astra prohibited; never author-and-approve; never silent downgrade).

## Authorization basis (adversarially reviewed at the transition)

GitHub issue #101 is an OPEN recorded defect whose "Required invariant" and the owner's 2026-10-07 extension state the exact rule text this slice delivers — the issue is the content authority, not implementation authorization by itself. The authority basis is the recorded follow-up chain: the ENV-DEFECT-STOPHOOK-001 closeout first recorded "#101 typed-wait rule = SEPARATE coordinator-owned slice" (PR #144 `d8334a2`), and the ENV-DEFECT-LEGACYLOOKUP-001 closeout re-recorded it ("The #101 typed-wait rule remains a separate recorded slice", PR #147 `dcdf7df`). The claim transition PR #148 (`82f5a90`, merged as `3d269cd8`) passed independent exact-SHA review with the basis judged SUFFICIENT (verdict recorded at pull/148#issuecomment-6720851403). Executed through the full reviewed-claim process; never issue-driven silent mutation.

## Defect (issue #101, 2026-10-06 + owner extension 2026-10-07)

On 2026-10-06 the long-running ENV Zcode Goal entered a polling livelock while waiting for independent review of PR #100: PR head `275612f` was CI-SUCCESS, the Codex reviewer had hit its usage limit with a named retry time, and no new repository/CI state existed to consume — yet the same Goal turn made 56 `CronList` calls, roughly every 22–27 s, advancing iterations while durable PR/CI/review state never changed (automation `3c1e2099…`, session `sess_272219b6…`, turn `turn_48ee557a…`, model GLM-5.3; example window 09:22:03Z–09:26:22Z). Root cause: external dependency/quota exhaustion was treated as an active polling condition rather than a typed external wait.

Owner extension (comment 2026-10-07T00:14:30Z): while the lane correctly showed `WAITING_EXTERNAL_PROVIDER_RESET` (boundary Oct 10 04:11), the queue still enqueued recurring night-watch items, a failed response paused the queue with duplicate entries behind it, and each duplicate exposed a `Steer` control — same defect family: external wait must suppress duplicate continuation enqueue, not merely tool polling inside a turn. Required invariant extension: (1) typed wait suppresses new recurring queue items until the boundary or material durable state change; (2) at most one pending wake per blocked lane; (3) response failure while externally waiting must not stack identical continuations; (4) `Steer` only for genuine human steering; (5) dedupe key = lane/task + blocker fingerprint + next-valid-wake boundary — handled in the scheduler/watchdog layer, never by consuming model iterations.

## Deliverable design (D1) — §24A, frozen text

Insertion point: `docs/ai/ENV-ENGINEERING-LOOP.md`, section `# F. STOP RULES` — new `## 24A. Typed external waits — pause the loop, never poll it`, placed between §24 (Stop/escalate when) and §25 (Operating state progression). Lettered insertion follows the §3A/§3B/§3C precedent; §25–§27 keep their numbers and every existing cross-reference ("engineering-loop §25", "§24–27") stays valid. Header `Last updated:` bumped to the delivery date. The frozen deliverable is pinned by the delivered loop-doc text at the reviewed frozen head 1de3dfa495557619d167eb8a61b684ac5380ab5e (the §24A section as merged), with the coverage table below mapping every invariant clause to that delivered text.

### Invariant → clause coverage table (frozen)

| # | Issue requirement | §24A clause |
|---|---|---|
| R1 | classify lane `WAITING_EXTERNAL_PROVIDER_RESET` (typed, never untyped keep-trying) | clause 1 |
| R2 | record blocked task, provider/model, durable state fingerprint (PR head+CI+review position), earliest retry trigger — in durable record, not chat | clause 2 |
| R3 | end/pause the iteration; no `CronList`/PR-status/CI-status/unchanged probes from the reasoning loop | clause 2 |
| R4 | at most one scheduled wake at/after the boundary, or event-driven wake on material durable state change | clause 3 |
| R5 | never invoke the worker model merely to poll a timer/cron list; timers belong to the scheduler/watchdog layer | clause 4 |
| R6 | re-pin exact PR head + CI before retrying review; verify no valid review result already exists | clause 5 |
| R7 | head moved ⇒ review the new exact SHA (loop-doc §18/§20/§21), prior coverage never carries | clause 5 |
| A1 | unchanged blocker fingerprint must not consume successive iterations; sub-minute model-driven external-wait polling = defect | clause 3 |
| Q1 | typed wait suppresses new recurring queue items until boundary or material durable state change | clause 6 bullet 1 |
| Q2 | at most one pending wake per blocked lane | clause 6 bullet 2 |
| Q3 | response failure while externally waiting must not stack identical continuations | clause 6 bullet 3 |
| Q4 | `Steer` surfaced only for genuine human steering, never as a duplicate-entry side effect | clause 6 bullet 4 |
| Q5 | dedupe key = lane/task + blocker fingerprint + next-valid-wake boundary | clause 6 bullet 5 |
| S1 | no broad-kill / session-DB delete / cron-storage edit / repeated resume | clause 7 |
| X1 | relation to §25 progression, §3C/§17 durable-record placement, §20 legitimate CI wait | closing paragraph |

## Coverage-RED contract (D2)

Docs-only RED = proven absence on the base, recorded in the handoff: the D2 greps ran at the branch tip `3d269cd8` (the loop doc was byte-identical to the claim base `dcdf7df` at that point — the claim transition touched only `docs/ai/CURRENT-WORK.md`), and `docs/ai/ENV-ENGINEERING-LOOP.md` contains zero occurrences of `WAITING_EXTERNAL_PROVIDER_RESET`, no external-wait/no-polling/single-wake/dedupe discipline anywhere in the doc, and no section references issue #101. D4 requires the post-change inverse: every row of the coverage table verifiably present in the delivered §24A (grep-able markers: the lane literal, `CronList`, "at most one", the dedupe-key phrase), insertion exactly between §24 and §25 with §25–§27 unrenumbered, header `Last updated:` bumped, `git diff --check` clean, and `git diff --name-only` exactly the three mutable files. No frontend E2E applies (§20 path-filtered; docs-only change).

## Frozen §24A record

The frozen deliverable text is pinned by the delivered loop doc itself: `## 24A. Typed external waits — pause the loop, never poll it` in `docs/ai/ENV-ENGINEERING-LOOP.md` at the reviewed frozen head `1de3dfa495557619d167eb8a61b684ac5380ab5e` (PR #149 head; byte-identical on main via the expected-head merge `dd2a095`). The coverage table above is the clause-by-clause map onto that delivered text and is the frozen design record. (An earlier revision pointed at "this work order's git history at the D3 commit" — circular, because the implementation branch carries a single commit and no pre-delivery WO revision exists in its history; replaced with the truthful pinning at closeout, review P2.)

## Scope (mutable, exactly)

- `docs/ai/ENV-ENGINEERING-LOOP.md` — insert §24A + bump `Last updated:`
- `docs/work-orders/ENV-DEFECT-TYPEDWAIT-001.md` (this WO)
- `docs/ai/handoffs/ENV-DEFECT-TYPEDWAIT-001-GLM.md`

## Forbidden

Everything else — including `docs/ai/CURRENT-WORK.md` (registry edited only via reviewed claim transitions), `docs/ai/HANDOFF.md`, `docs/ai/DEFECT-MEMORY.md` (the §24A rule itself is the durable prevention record for this failure class), `scripts/**`, `frontend/**`, `supabase/**`, `AGENTS.md`, `.github/**`, `data/**`, `.env`.

## D-plan

D1 (this WO + frozen §24A + coverage table) → D2 coverage-RED (absence proof at base, GLM) → D3 deliver §24A into the loop doc (GLM, verbatim frozen text) → D4 verification battery (coverage-table greps + scope-exact + diff-check, recorded in the handoff) → D5 review at the exact frozen head (fresh-GLM R2 floor; cross-model R3 where admission allows) → D6 expected-head merge + exact-main verify + closeout transition (registry fence/hash moved, frontier bullet reconciled).

## Acceptance

Every coverage-table row present in the delivered §24A; insertion exactly between §24 and §25 with no renumbering; header date bumped; zero forbidden files touched; D2 absence proof + D4 verification receipts durable in the handoff; the implementing lane never merges its own PR.

## Dispatch-exception risk record

Owner-authorization basis above (recorded follow-up chain + reviewed-claim process, verdict pull/148#issuecomment-6720851403); GLM implements the docs-only lane; independent review per the 2026-10-07 routing policy (never author-and-approve). No production data writes; no schema/RLS/Building involvement; no runtime behavior change (the loop doc is process SSoT; enforcement of the wait discipline remains each harness's own runtime concern, out of this slice's scope).
