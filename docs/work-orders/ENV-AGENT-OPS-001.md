# ENV-AGENT-OPS-001 - minimal multi-agent governance foundation

Status: CLOSED
Owner: GPT-5.6 Sol (lead / governance author)
Review owner: fresh independent reviewer; implementation author must not self-merge
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-agent-ops-001`
Branch: `docs/env-agent-ops-001`
Base: `origin/main@817266d4ee74b95fbf23ee97c96bf8367715d615`
Exact reviewed HEAD: `784c75a6df42e6c43ad45ade9674515fe43a46a4`
Last updated: 2026-08-30

## Objective

Create the smallest durable Agent-Ops foundation needed for future GPT / GLM-5.3 / Codex / SunDay-worker collaboration without relying on chat memory or human copy/paste between agents. Extend existing SSoT; do not build a second control-plane.

## Dependencies

- `SEC-DEPS-001` closed and post-merge verified.
- PR #53 Security docs closeout merged on current base.
- Existing authority: `AGENTS.md`, `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`, `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, `docs/ai/ENV-ENGINEERING-LOOP.md`.

## Mutable scope

- `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`
- `docs/work-orders/ENV-AGENT-OPS-001.md`

## Forbidden scope

- `frontend/**`
- Supabase/schema/RLS/migrations/carbon/domain contracts
- workflows/runtime scripts
- Fuel/Garbage implementation
- `.serena/**`
- unrelated historical cleanup

## Required governance contract

1. `CURRENT-WORK.md` remains the one canonical active-task/ownership registry.
2. Each active lane exposes Task, Owner, Agent/Model, Worktree, Branch, Base, Exact HEAD, Status, Mutable/Forbidden Scope, Dependencies, Acceptance, Verification, Evidence, Review Owner, Handoff Path, Last Updated, and One Next Safe Action across CURRENT-WORK + its WO.
3. Explicit task state machine: READY -> CLAIMED -> IMPLEMENTING -> VERIFYING -> REVIEW_REQUESTED -> CHANGES_REQUIRED/APPROVED -> MERGE_READY -> MERGED -> POSTMERGE_VERIFY -> CLOSED, plus BLOCKED / DECISION_REQUIRED / HUMAN_ACTION_REQUIRED.
4. One writer per mutable file/scope; parallelism only for independent READY lanes or explicit reconciliation.
5. External transport lifecycle: REQUESTED -> RESULT_WRITTEN -> INGESTED_TO_SSOT -> ARCHIVED/CLEARED. User never copies agent output between models.
6. Reviewer verdict binds to exact SHA; head change invalidates approval.
7. Exact-head CI/review/remote-diff/expected-head merge/post-merge verification are part of closure where applicable.
8. Model assignment records current task-fit evidence/rationale when material; benchmarks are evidence, not universal ranking.
9. Session rotation persists a complete resume packet and one next safe action.
10. No new shadow registry, agent database, daemon, dependency, or runtime service in this foundation.

## Acceptance

- A fresh agent with no chat history can determine who owns the active lane, where it may write, exact repo/worktree/branch/base, current status, review owner, and next safe action from repo SSoT.
- An external GLM/Codex review can be launched with a tiny prompt pointing to one bounded transport file, then lead can ingest the result without human copy/paste.
- Existing GPT/GLM/Codex responsibility split remains intact.
- Historical task statuses remain readable; canonical new lifecycle is additive/compatible.
- `git diff --check` passes and diff is docs-only/bounded.

## Verification

- inspect actual diff and changed-file list;
- search for duplicate/conflicting active-task authority;
- verify CURRENT-WORK points to this WO and no second registry was created;
- verify forbidden paths untouched;
- exact-head GitHub CI required before merge;
- fresh independent review must bind to exact pushed SHA.

## Evidence required before REVIEW_REQUESTED

- exact pushed HEAD frozen from actual git/remote state in PR/review evidence (do not create a self-referential SHA-only commit);
- `git status`;
- `git diff --check`;
- changed-file list/diff summary;
- self-review against all 10 governance requirements;
- PR URL and exact-head CI status.

## One next safe action

Complete the bounded docs implementation, verify the diff, checkpoint/push exact HEAD, open PR, then stop at `REVIEW_REQUESTED` for fresh independent review.

## Pre-review verification - 2026-08-30

- `git diff --check`: PASS.
- Mutable diff is limited to the collaboration protocol, CURRENT-WORK, HANDOFF, and this Work Order.
- No production code, schema/RLS/migrations/carbon/domain UI, workflow/runtime script, or `.serena/**` file changed.
- Self-review against all 10 governance requirements: PASS; no shadow active-task registry introduced.
- Literal review SHA must be frozen from actual pushed remote state in PR/review evidence before the independent reviewer starts.


## Final closure - 2026-08-30

- Fresh independent review: GLM-5.3 MAX **APPROVED** exact SHA `784c75a6df42e6c43ad45ade9674515fe43a46a4`; no blockers.
- Reviewer verified all 10 governance requirements, no shadow registry, state-machine compatibility, one-writer/disjoint-scope safety, external transport lifecycle, exact-SHA invalidation, self-referential SHA handling, model-fit rationale, resume packet, and no forbidden scope leak.
- Exact-head CI: scripts + notify SUCCESS.
- PR #54 merged with expected-head protection as `a1aafb00696253d386446fb518508e9a6753e71c`; reviewed-head ancestry into `origin/main` verified.
- Post-merge test run `33306776806` SUCCESS at exact merge SHA. Docs-only path set did not require E2E/Pages.
- State: **CLOSED / MERGED / POST-MERGE VERIFIED**.
- One next safe action: activate Fuel Core on a fresh branch/worktree from current main.
