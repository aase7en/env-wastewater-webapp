# ENV-DEFECT-STOPHOOK-001 — Stop-Hook Worktree-Context Defect, repo-side fix (Work Order)

Status: CLAIMED (transition pending R3 review + merge)
Task: `ENV-DEFECT-STOPHOOK-001` (repo-side remediation of GitHub issue #94,
first defect)
Claim: `ENV-DEFECT-STOPHOOK-001-C1` (generation 1)
Base: `9db59fa84e53105b4db9ec8cf6943eb0226d6b1e`
Registered by: GLM-5.3 MAX coordinator (claim-transition author)
Review owner (this transition): deterministic R3 cross-model — Codex `gpt-6-sol`
@ max read-only (live per-review admission evidence = the R1 dispatch itself,
recorded in the handoff; designated fallback `gpt-5.6-sol`; GPT-6 Astra
prohibited; never author-and-approve).

## Authorization basis (R3-gated, stated plainly)

GitHub issue #94 is an OPEN recorded defect. The issue itself states it "does
not create a task claim … or authorize source mutation" — i.e. the ISSUE is a
record, not authority. The authority basis here is the owner's standing
explicit instruction "ทำงานต่อที่ค้างให้จบ โดยใช้ JEV AI และ GPT6-Sol ช่วยในงานที่
เหมาะสม" (finish pending work), repeated for the EIGHTH time on 2026-10-15
after the coordinator's reports enumerated the remaining lanes — an open
defect issue being the most literal pending work — combined with this full
reviewed-claim process (the designed counter-path to the issue's
non-authorization clause: a work order + R3-reviewed registry transition, not
issue-driven silent mutation). The basis is submitted to this transition's R3
as an explicit adversarial check; insufficient basis ⇒ the claim parks
unmerged and a one-line ask is presented exactly once. JEV: UNAVAILABLE per
the fleet router (checked, recorded, not probed, no substitution).

## Defect (issue #94, first defect — repo side)

`scripts/env_autonomy_runtime.py` hardcodes `claim_by_task("ENV-AUTONOMY-001")`
in six effective places; the Stop path (`_cmd_hook`, lookup at ~line 2474)
verifies the checkpoint against that CLOSED claim's registered branch from
WHATEVER worktree the hook fires in. In any foreign worktree (every lane
worktree since 2026-10-05) verification reports `REMOTE_HEAD_MISMATCH` and
the Stop hook emits "The Goal is still open; durable checkpoint failed" with
a BLOCKING continuation decision — reproducing in Codex Desktop as an
apparent user message the human did not type.

## Fix design (Role A consult 2026-10-15, gpt-6-sol read-only, incorporated in full)

1. **`_select_stop_claim(policy, root, branch)`** inside `_cmd_hook`, before
   the Stop decision and its invalid-input fallback: select exactly ONE
   unreleased (non-CLOSED) claim from the trusted registry whose registered
   worktree AND branch match the executing context. Closed claims (incl.
   ENV-AUTONOMY-001-C1) are INELIGIBLE. No module-level CURRENT_TASK —
   selection is per hook invocation.
2. **Behavior table**:
   - unique eligible claim, worktree+branch match → existing enforcement
     PRESERVED (verify_published_checkpoint, refill, stop_hook_active; a
     checkpoint failure still blocks — regression-pinned);
   - foreign worktree / wrong or detached branch / closed-claims-only →
     **exit 0 with `{}`** — no verifier call, no `reason`/`systemMessage`/
     `continue` (a neutral result; `decision: "block"` is what Codex turns
     into a new continuation prompt — the defect's vector);
   - identity un-establishable OR multiple eligible claims match → FAIL
     CLOSED with a typed reason (uncertainty is never classified foreign).
3. **Path comparison**: resolve both roots via existing-path resolution +
   `os.path.samefile`; exact branch-name equality; HEAD equality stays
   inside checkpoint verification, NOT the context gate.
4. **Scope guard**: only the Stop-critical `_cmd_hook` selection changes in
   this slice. The other legacy lookups (lines ~874/1417/1553/1853/2221)
   serve non-Stop paths and get a SEPARATE audit later — recorded as a
   follow-up, not touched here. Mutation-path hooks stay fail-closed.

## Owner-territory parts (PROPOSAL ONLY — never implemented in this slice)

- `~/.codex/hooks.json` user-state hook consolidation and the secondary
  A-Wiki root's own hooks are owner decisions (the issue records them as
  trusted owner state). The WO deliverable includes a short proposal
  section addressed to the owner; no edits to either location.

## RED-first contract (D2)

Reproduce #94 through `_cmd_hook`: foreign root/branch, closed
ENV-AUTONOMY-001 present, checkpoint stubbed `REMOTE_HEAD_MISMATCH` →
assert output `{}`, exit 0, and NO verifier invocation. Matching-context
failure still blocks (incl. the `stop_hook_active` branch). Predicate unit
cases: `A:/` vs `A:\`, case differences, different directory, wrong branch,
detached branch, closed-only registry, ambiguous multi-match (fail closed).
Existing publication/checkpoint tests (~lines 540/664) stay green (there is
currently NO Stop-entrypoint regression test — this slice adds it).

## Scope (mutable, exactly — identical to the registry claim entry)

- `scripts/env_autonomy_runtime.py` — Track Z GLM (sole writer)
- `scripts/test_env_autonomy_runtime.py` — Track Z GLM (sole writer)
- `docs/work-orders/ENV-DEFECT-STOPHOOK-001.md` (this WO)
- `docs/ai/handoffs/ENV-DEFECT-STOPHOOK-001-GLM.md`

## Forbidden

Everything else — including `scripts/env_coordination_guard.py` (the generic
claim_by_task API is consumed read-only), `.codex/**` (hook entrypoint
consumer — NOT touched in this slice), `docs/ai/ENV-ENGINEERING-LOOP.md`
(#101's typed-wait rule is a SEPARATE coordinator-owned slice), all frontend,
`supabase/**`, `docs/ai/CURRENT-WORK.md` (via reviewed transitions only),
`data/**`, `.env`.

## D-plan

D1 (this WO + handoff design table) → D2 RED (GLM) → D3 GLM implementation
→ D4 battery (focused + full runtime suite + guard regression 344 +
exact-SHA diff-check) → D5 fresh-GLM review at the exact frozen head
(Track-Z-only slice; ordinary R2 floor — cross-model Sol review is reserved
to this claim transition) → D6 expected-head merge + exact-main CI verify +
closeout transition.

## Acceptance

The #94 reproduction passes (foreign context neutral), matching-context
enforcement unchanged (regression), ambiguity fails closed, no forbidden
file touched, receipts durable in the handoff, and the owner-territory
proposal section delivered in the WO.

## Dispatch-exception risk record

Owner-authorization basis above; GLM implements (Track Z scripts); Codex
`gpt-6-sol` consults (done) and reviews this transition only
(never author-and-approve). No production data writes; no Building/schema/
RLS involvement.
