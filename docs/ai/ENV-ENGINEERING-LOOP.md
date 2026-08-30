# UTH[AI]-ENV — Goal-First Engineering Loop

Last updated: 2026-08-27
Status: BINDING ENGINEERING PROCESS SSoT

## 1. Core rule

Every significant ENV workstream begins with a **GOAL** and ends only after the exact reviewed change is merged, verified, recorded in repository SSoT, and closed.

> **Repository SSoT is authoritative. Chat/model/Serena memory may point to it, but may not replace it.**

`docs/ai/CURRENT-WORK.md` remains the execution authority. This process never activates deferred work by itself.

## 2. Sources reconciled into this loop

The user-confirmed ENV process combines the repo's existing Loop Engineer practice with these upstream patterns:

- AI Hero / Matt Pocock main flow: `grill-with-docs → to-spec → to-tickets → implement → code-review`.
- `grill-with-docs`: read answers from the repo instead of asking the user to repeat them.
- `research`: use primary/first-party sources for version-sensitive facts.
- `prototype`: answer one unresolved design question with bounded throwaway evidence.
- `diagnosing-bugs`: repro → minimise → hypotheses → instrument → fix → regression.
- `handoff`: when work moves between agents/harnesses, reference durable specs/commits instead of duplicating settled facts.
- GitHub: PR review/status checks must apply to the latest relevant SHA/diff before merge.

References:
- User-supplied share pointer for “The Main Flow”: https://share.google/nRzOV2aCtYQIBJSVN (opaque share link; use the canonical upstream pages below for verification when accessible)
- https://www.aihero.dev/skills
- https://www.aihero.dev/skills-grill-with-docs
- https://www.aihero.dev/skills-to-spec
- https://www.aihero.dev/skills-to-tickets
- https://www.aihero.dev/skills-implement
- https://www.aihero.dev/skills-code-review
- https://www.aihero.dev/skills-diagnosing-bugs
- https://www.aihero.dev/skills-research
- https://www.aihero.dev/skills-prototype
- https://www.aihero.dev/skills-handoff
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/pull-requests/reference/status-checks

## 3. Canonical ENV loop

```text
GOAL
→ SSoT + FRESHNESS / SOURCE REALITY
→ GRILL ME / GRILL WITH DOCS
→ SHAPE UNKNOWNS (research / brainstorm / prototype, only if useful)
→ SPECIFY
→ VERTICAL-SLICE PLAN / WORK ORDERS
→ OWNERSHIP + RISK + BRANCH/WORKTREE GATE
→ BASELINE / RED / FAILURE EVIDENCE
→ IMPLEMENT
↔ DEBUG TIGHT LOOP when needed
→ FOCUSED TESTS
→ SYSTEM TEST / E2E LIKE REAL USE
→ RESPONSIVE + INTERACTION + ACCESSIBILITY + DATA-HONESTY + SECURITY REVIEW
→ REPORT + SSoT + DEFECT MEMORY
→ INDEPENDENT EXACT-DIFF REVIEW
→ OPEN / UPDATE PR
→ APPLICABLE CI ON EXACT HEAD SHA
→ RE-AUDIT HEAD + CURRENT BASE
→ AUTHORIZED MERGE
→ FETCH MAIN + VERIFY MERGE / DEPLOY / SMOKE
→ CLOSE
→ NEXT GOAL / NEXT BOUNDED SLICE
```

Use three nested loops, not one giant session:

1. **Program loop** — goal → roadmap → slices → milestone audit → next goal.
2. **Work-order loop** — one vertical slice through merge/verification.
3. **Debug loop** — repro → isolate → test hypotheses → fix → regression.

---

# A. GOAL / SHAPING

## 4. GOAL first

Before implementation discussion, write a Goal Contract:

```text
GOAL ID:
User outcome:
Why this matters:
Current pain/opportunity:
Success evidence:
Non-goals:
Safety/privacy constraints:
Dependencies:
Decision owner:
Target users/devices:
```

For ENV product work also obey:

- `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md`;
- `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`;
- relevant `docs/ai/` domain knowledge and A-Wiki.

A Goal Contract is not production authorization. Convert it into a bounded active work order.

## 5. SSoT + freshness / source-reality gate

Before grilling, planning, implementing, or reviewing:

1. `git fetch origin main`;
2. verify `origin/main`, branch HEAD, ancestry, and dirty/untracked state;
3. if the primary checkout is stale/dirty, use an isolated current worktree;
4. read `AGENTS.md` + mandatory SSoT chain;
5. check relevant A-Wiki ENV knowledge;
6. inspect actual source/schema/tests/workflows instead of trusting chat claims;
7. verify version-sensitive external facts from current first-party docs/source.

Never reset/clean/delete/move/blind-stash unknown user or agent files.

## 6. Grill Me / Grill With Docs

Before asking the user, check whether the answer already exists in:

- source/current `origin/main`;
- SSoT/docs/ADRs/tests;
- live schema snapshot + migrations;
- A-Wiki;
- authoritative upstream GitHub/docs.

**Ask only unresolved decisions**, such as outcome, scope, non-goals, edge cases, acceptance evidence, risk trade-offs, user/device context, or semantics the source cannot prove.

Write settled decisions into the appropriate repo artifact while grilling. Do not wait until session end and dump them from memory.

Use ADRs only for durable decisions worth preventing from being repeatedly re-litigated.

## 7. Shape unknowns only when needed

### Research

Use when an external fact blocks a decision. Prefer primary sources. Record source/version/date and separate verified fact from inference.

### Brainstorm / subagents

If the harness supports independent agents/subagents, use 2–3 **read-only** perspectives when alternatives matter:

- solution/architecture explorer;
- critic/red-team/failure-mode reviewer;
- implementation/testability or UX/accessibility specialist.

No overlapping writes. No architecture by majority vote. GPT/architecture owner synthesizes against goal + SSoT.

If subagents are unavailable, perform deliberately separated review passes; do not claim parallel review occurred.

### Prototype

Use only when one concrete design question cannot be settled reliably in prose. State the question first. Keep exploratory code out of production main; carry the learned decision into the real spec.

---

# B. SPEC / PLAN / OWNERSHIP

## 8. Specify

A good ENV spec contains only settled requirements:

- user/task outcome;
- current vs desired behavior;
- data/source semantics;
- unknown/loading/stale/error behavior;
- desktop/tablet/mobile interaction when UI is involved;
- accessibility/reduced-motion requirements;
- PHI/security boundaries;
- performance/reliability expectations where relevant;
- explicit out-of-scope items;
- acceptance evidence.

Do not invent requirements to fill a template.

## 9. Plan as vertical slices

Use the highest appropriate reasoning effort for planning, but persist only the resulting decisions, assumptions, trade-offs, dependencies, and acceptance criteria — not private scratch reasoning.

Split large specs into user/verifiable vertical slices, not layer-only chores.

Each ticket/work order must state:

```text
Behavior/demo when done:
Blocked by:
Owner:
Allowed files/surfaces:
Forbidden/shared files:
RED/baseline evidence:
GREEN/done evidence:
Responsive/accessibility evidence if UI:
Security/data-honesty gate if relevant:
Stop/review state:
```

A fresh agent should be able to execute one slice without reconstructing the project from chat.

## 10. Ownership + risk + branch/worktree gate

Before first edit:

- confirm active WO in `CURRENT-WORK.md`;
- one primary responsibility owner per risky layer;
- one writer per file;
- shared files require explicit temporary ownership;
- create/verify task branch from current `origin/main`;
- use isolated worktree for parallel agents or dirty primary checkout;
- match review/test depth to risk.

Default ownership:

- **GPT:** goal/spec/architecture/coordination/final independent review + merge.
- **GLM:** Core Engineering — contracts/data/Supabase/RLS/security/calculations/tests.
- **Codex/visual:** approved visual/responsive/3D/interaction implementation + visual evidence.
- **Workers/subagents:** bounded support within assigned scope.

Implementation owner never self-merges an implementation PR.

---

# C. BUILD / DEBUG / TEST

## 11. Baseline / RED / failure evidence

Before changing behavior, establish a signal that can prove improvement.

Preferred evidence:

- failing unit/integration/E2E regression;
- provider-body/security proof;
- schema/source mismatch proof;
- current screenshot at defined viewport;
- measured overflow/touch-target/accessibility defect;
- performance baseline;
- deterministic user-workflow failure.

For visual/design slices, a truthful baseline may replace an artificial failing automated test.

A green test that was never shown capable of catching the defect is weak evidence.

## 12. Implement one bounded slice

Use **REUSE → MODIFY → EXTEND → CREATE**.

- implement only settled scope;
- preserve PHI/security/data-honesty invariants;
- unknown remains unknown;
- `latest` is not `live`; simulation remains labeled;
- do not invent renderer/business semantics;
- keep diff reviewable;
- do not opportunistically modify deferred work.

If source reality invalidates the spec, stop and raise a decision request rather than silently redesigning during implementation.

## 13. Debug tight loop

```text
REPRODUCE
→ MINIMISE
→ RANK 3–5 HYPOTHESES
→ DEFINE FALSIFIABLE PREDICTIONS
→ INSTRUMENT / INSPECT
→ FIX ROOT CAUSE
→ ADD/UPDATE REGRESSION COVERAGE
→ REMOVE TEMP DEBUG INSTRUMENTATION
→ RE-RUN REPRO
```

Do not form a confident theory before reproducing the reported failure.

## 14. Focused feedback while editing

Prefer short loops:

- focused unit/test file;
- diagnostics/typecheck on touched code;
- narrow integration test;
- focused Playwright scenario when appropriate.

Run broad/full suites near completion, not after every line edit.

## 15. System Test / E2E like real use

Applicable gates include:

- focused tests;
- full Vitest;
- TypeScript build;
- lint baseline or better;
- `git diff --check`;
- full Playwright for frontend behavior when applicable;
- happy path + failure/retry path;
- auth/role/RLS where relevant;
- PHI/provider boundary where relevant;
- manual/latest/live/historical/simulation semantics where relevant;
- loading/empty/error/stale/unavailable states;
- keyboard + touch;
- reduced motion if animated;
- mobile 360–430 px + tablet + desktop for materially changed UI;
- representative data density, not empty demo-only states.

For high-risk changes, add adversarial/deep-bug scenarios instead of repeating only happy-path checks.

## 16. ENV UI/data quality review

For changed UI verify:

- correct hierarchy at desktop/tablet/mobile;
- touch targets and one-hand completion for field forms;
- mobile recomposition rather than desktop shrinkage;
- focus order/keyboard alternative;
- units/status/source/freshness readability;
- reduced motion;
- no fabricated live/equipment state;
- no false certainty for unknown/stale data;
- prototype similarity never overrides source truth.

---

# D. REPORT / REVIEW / PR / MERGE

## 17. Report + SSoT + defect memory

Before review, leave enough repo evidence for a fresh agent:

```text
WO / Goal:
Status:
Branch + exact HEAD:
Base/current main:
Files changed:
Behavior delivered:
RED/baseline proof:
GREEN/tests/E2E:
Responsive/accessibility evidence:
Security/data-honesty review:
Known limitations/deferred findings:
Next owner:
```

Update as applicable:

- lane handoff;
- coordinator `docs/ai/HANDOFF.md`;
- `docs/ai/CURRENT-WORK.md`;
- `docs/ai/DEFECT-MEMORY.md` when the root cause is reusable.

Defect memory records **failure class → root cause → detection → prevention → regression evidence**, not every minor bug.

## 18. Independent review

Implementation self-review is not merge approval. Prefer fresh reviewer context/agent.

Review separate axes:

1. **Spec/goal** — right behavior?
2. **Repository standards/architecture** — built well?
3. **Security/privacy/data honesty** — PHI/RLS/secrets/provenance/unknown/latest/live?
4. **UX/accessibility/responsive** — if UI changed.
5. **Failure modes/deep bugs** — retries/races/null/stale/idempotency/error recovery.

Verdict: `APPROVED` or `CHANGES_REQUIRED` with evidence.

Any code-changing push after review requires review of the new exact SHA/diff.

## 19. PR gate

Before PR:

- branch/current-base relationship checked;
- diff matches WO scope;
- no unrelated/untracked files staged;
- no secrets/raw hospital data;
- applicable local gates recorded;
- SSoT/handoff updated.

Then push, open/update PR, inspect **remote diff**, and record exact PR head SHA.

## 20. CI/CD exact-SHA gate

- Wait for all **applicable** checks on latest PR head.
- Green checks on an older SHA do not approve a newer push.
- If main/base changes materially, re-evaluate diff and relevant gates.
- Docs-only PRs may not trigger frontend E2E because `.github/workflows/e2e.yml` is path-filtered; an untriggered job is not a Playwright pass.
- Frontend PR E2E builds the PR and runs full `npx playwright test` against PR code.
- `test.yml` runs script regression checks.
- Frontend merge to main triggers GitHub Pages deploy + production static smoke in `deploy-frontend.yml`.

## 21. Re-audit immediately before merge

On the exact latest PR head:

1. fetch `origin/main`;
2. verify head SHA + remote diff;
3. verify mergeability/current-base relationship;
4. verify applicable checks green;
5. verify no unresolved blocker/review finding;
6. re-check risky PHI/security/schema/data-honesty boundaries if touched;
7. verify SSoT status;
8. merge only by authorized reviewer/merge owner.

For security/high-risk WOs, independently reproduce the critical RED proof where practical.

## 22. Post-merge / post-deploy closure

After merge:

1. fetch `origin/main`;
2. verify PR merged + capture merge SHA;
3. verify intended commit ancestry;
4. update closure SSoT if needed;
5. for frontend production changes, verify deploy + production smoke when applicable;
6. record deploy/rollback anomaly as a defect, never a hidden note;
7. close WO;
8. do not auto-start the next deferred lane.

---

# E. REPO-HEALTH / MILESTONE LOOP

## 23. Repo-health is an outer audit

Historical branch `docs/repo-health-100` is project evidence, not a reusable working base.

Future audits start from then-current `origin/main` on a unique branch, e.g.:

```text
docs/repo-health-100-YYYYMMDD
```

Run at major milestones, after stabilization queues, before broad new programs, or when coordination/source-of-truth has drifted.

Audit:

- SSoT contradictions/staleness;
- active vs deferred clarity;
- branch/worktree hygiene;
- architecture drift;
- PHI/security/secrets/RLS;
- schema/data-contract truth;
- test/CI/CD health;
- responsive/accessibility state;
- performance/bundle signals where relevant;
- dependency/toolchain freshness;
- agent ownership/rule coverage;
- stale research/docs;
- whether defect-memory lessons are enforced by current tests/rules.

Audit branch may fix docs/governance gaps. A production defect found by audit gets evidence + severity + its own bounded WO/implementation branch; do not hide production fixes in a docs-only health branch just to reach “100”.

“100” means no known unrecorded blocker in audited scope, not permanent perfection.

---

# F. STOP RULES

## 24. Stop/escalate when

- goal/spec contradicts verified source reality;
- user decision is genuinely required;
- another agent owns the needed file;
- branch/worktree safety is unclear;
- PHI/secrets could cross an unapproved boundary;
- schema/external-source truth cannot be verified;
- reported defect cannot be reproduced;
- tests pass but actual user workflow fails;
- visual work requires fabricated operational semantics;
- CI is green on a different SHA than review target;
- completing the slice would require an unapproved deferred lane.

## 25. Operating state progression

```text
GOAL_DEFINED
→ GRILLING
→ SPECIFIED
→ READY_FOR_IMPLEMENTATION
→ IMPLEMENTING
→ REVIEW_REQUESTED
→ CHANGES_REQUIRED → RE-REVIEW_REQUESTED   (if needed)
→ APPROVED
→ MERGED
→ VERIFIED
→ CLOSED
```

`CURRENT-WORK.md` remains authoritative; this diagram describes the intended progression.

## 26. One-line rule

> **Goal first. Fetch reality. Grill only the unknown. Specify. Slice vertically. Prove the failure. Build narrowly. Debug from a repro. Test like the real user. Write reusable lessons into SSoT. Review independently on the exact diff. Let CI verify the exact SHA. Re-audit, merge, fetch main, verify production, close — then choose the next goal.**


## 27. Multi-agent orchestration inside the engineering loop

For work split across GPT, GLM, Codex or future agents, treat orchestration as part of engineering evidence rather than chat coordination.

1. The lead derives independent READY lanes from Roadmap + `CURRENT-WORK.md` + Work Order dependencies.
2. Each mutable lane gets one writer, isolated branch/worktree, bounded scope and a review owner.
3. For material model assignment, record dated benchmark/source evidence and its task-fit limitation; do not use model reputation as authority.
4. If the external model cannot be invoked directly, use the human only as a one-way launch bridge. The lead writes one temporary transport packet; the external agent reads it and repo SSoT, executes, and writes its result back to that same packet.
5. The user never needs to copy the external agent's result back. A short completion signal only tells the lead to inspect the packet.
6. The lead independently verifies git/remote/PR/tests rather than trusting the packet, ingests durable facts into canonical SSoT, then archives/clears the temporary transport.
7. Parallel lanes merge only through explicit dependency/integration order. Shared files serialize unless the lead records explicit temporary ownership/reconciliation.
8. The implementation owner stops at `REVIEW_REQUESTED`; independent exact-SHA review, merge and post-merge verification remain separate gates.

This is the preferred human-in-the-loop fallback until the execution environment can directly invoke all participating agents. It deliberately minimizes human prompting without pretending cross-product automation exists when it does not.
