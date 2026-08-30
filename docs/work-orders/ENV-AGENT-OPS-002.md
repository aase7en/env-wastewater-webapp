# ENV-AGENT-OPS-002 — human-launch multi-agent orchestration

Status: CLOSED
Owner / lead: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-agent-ops-002`
Branch: `docs/env-agent-ops-002`
Base: `origin/main@8e53d5c0dbc9237f511ec9e530f52eb553a44559`
Reviewed exact SHA: `c603a25e7dbc19f9e17e5300b91e5f35446485f8`
Review owner: independent exact-diff reviewer chosen by lead
Last updated: 2026-08-30

## Goal

Make GPT/GLM/Codex/future-agent collaboration resumable from repository + one temporary transport packet so the human is never used as project memory and never has to copy an agent's result back into another agent.

The human may remain the launch bridge when two AI products cannot invoke each other directly, but the human launch instruction must contain direction only, not project state.

## Why now

`FUEL-CORE-001` is merged and post-merge CI/E2E/Pages are green but remains `HUMAN_ACTION_REQUIRED` until authenticated Supabase access is restored and the already-merged migration is applied/live-verified. Garbage Core must not bypass that gate.

This docs-only governance lane is independent of the Fuel production gate and may proceed because it changes no runtime/schema/data surface.

## Model-fit evidence snapshot — 2026-08-30

For material delegation, task fit must be based on current evidence and recorded as dated evidence rather than model folklore.

- Z.ai, “GLM-5.3: Frontier Coding with Emergent Cyber Capabilities” (2026-08-14): reports major gains on long-horizon coding, Terminal Bench, DeepSWE, CyberGym and agentic tasks.
  - https://z.ai/blog/glm-5.3
- Artificial Analysis, GLM-5.3 (max), checked 2026-08-30: Intelligence Index 60, 1M context, with slower-than-frontier-average generation in some comparisons.
  - https://artificialanalysis.ai/models/glm-5-3/

Task-fit conclusion for ENV:
- GLM-5.3 MAX remains a strong candidate for bounded Core Engineering, security/privacy, SQL/data-contract and long-horizon terminal/debug lanes.
- GPT remains lead for goal decomposition, cross-domain synthesis, ownership arbitration, independent exact-SHA review and merge judgment.
- Codex/visual agents remain candidates for approved UI/responsive/3D implementation where visual iteration/evidence is the primary task.
- These are routing defaults, not universal rankings. Re-check current credible evidence when the material task or available model changes.

## Upstream engineering-loop freshness — 2026-08-30

Current Matt Pocock / AIHero engineering docs still support the main chain:

`grill-with-docs -> to-spec -> to-tickets -> implement -> code-review`

and current `diagnosing-bugs` guidance still emphasizes a deterministic red-capable feedback loop before theorizing.

Primary upstream:
- https://github.com/mattpocock/skills/blob/main/docs/engineering/to-spec.md
- https://github.com/mattpocock/skills/blob/main/docs/engineering/to-tickets.md
- https://github.com/mattpocock/skills/blob/main/docs/engineering/implement.md
- https://github.com/mattpocock/skills/blob/main/docs/engineering/code-review.md
- https://github.com/mattpocock/skills/blob/main/docs/engineering/diagnosing-bugs.md

ENV keeps its stronger repository-safety, SSoT, post-merge, E2E, defect-memory and deployment gates.

## Mutable scope

- `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
- `docs/ai/ENV-ENGINEERING-LOOP.md`
- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`
- this Work Order

## Forbidden scope

- production source under `frontend/`
- Supabase migrations/schema/RLS/data
- Fuel or Garbage implementation
- workflows/packages/dependencies
- `.serena/**`
- A-Wiki contents except temporary external transport files created by a future bounded delegation
- secrets/tokens/session material

## Required orchestration contract

1. Lead derives the execution frontier from Roadmap + CURRENT-WORK + dependencies.
2. Only independent READY lanes may run in parallel.
3. Each lane has one owner, isolated worktree/branch, disjoint mutable scope, acceptance/evidence, review owner and handoff path.
4. Lead records dated model-fit evidence for material cross-model delegation.
5. For an external agent that cannot be directly invoked, lead creates/reuses exactly one bounded temporary transport file.
6. Human launch prompt is minimal: repo/worktree + “read this packet” + “execute only this lane” + “write result back to same packet” + stop state.
7. External agent reads repo SSoT itself, verifies actual git/ownership state, and writes its result to the same packet. It must not require the human to copy its output.
8. Human only sends a direction signal such as `GLM เสร็จแล้ว`; this signal is never evidence of completion.
9. Lead reads the packet directly, then independently reconciles packet claims against repo/remote/test/PR state.
10. Lead ingests durable facts into CURRENT-WORK/HANDOFF/WO/DEFECT-MEMORY as appropriate, then archives/clears the temporary packet.
11. Any head drift invalidates exact-SHA review evidence.
12. Shared-file collisions serialize by default; explicit integration ownership is required before overlapping writes.
13. Implementer never self-merges; lead/reviewer owns final merge and post-merge verification.

## Acceptance

- No new shadow task registry.
- Protocol explicitly defines human-launch-only orchestration and result ingestion.
- Human is not project memory and never has to copy agent result text.
- Parallel lane arbitration and shared-file collision rules are explicit.
- Model-fit evidence rule requires date/source/task mapping/limitations.
- Loop Engineer remains adaptive but covers source reality -> grill/shape -> spec/plan -> implement/debug -> focused/full/E2E -> report/defect memory -> independent review -> PR/CI -> re-audit -> merge -> post-merge verification.
- Fuel production gate remains blocking for Garbage Core.
- `git diff --check` passes.
- Actual changed files are exactly the docs mutable scope above.

## Verification

- inspect actual diff against `origin/main`
- check protocol references point to existing SSoT roles
- check no duplicate/shadow status system is introduced
- `git diff --check`
- exact-head GitHub docs CI after push/PR
- independent review before merge

## Stop state

Implementation stops at `REVIEW_REQUESTED`; implementation author does not merge.

## Closeout evidence

- Independent reviewer: GLM-5.3 MAX — APPROVED exact SHA `c603a25e7dbc19f9e17e5300b91e5f35446485f8`.
- PR #58 merged as `077a18d59d605f8b0f50fe7d67cce8771b296fa2`.
- Reviewed head is an ancestor of `origin/main`.
- Exact-main test run `33329666902` — SUCCESS.
- Scope remained docs-only; no runtime/schema/data/workflow/package/`.serena/**` changes.
- External review packet may now be marked `INGESTED_TO_SSOT` and cleared after this closeout reaches main.

## One next safe action

Restore authenticated Supabase access and finish `FUEL-CORE-001` live migration/read-only verification before Garbage Core.
