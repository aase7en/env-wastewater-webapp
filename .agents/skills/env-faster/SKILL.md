---
name: env-faster
description: Reconcile ENV's canonical frontier and select the highest-priority safe READY lane without creating a parallel task registry.
---

# ENV-Faster

Use this skill when deciding what ENV work can safely start or refill.

1. Fetch `origin/main`; use its `docs/ai/ROADMAP.md`, `docs/ai/CURRENT-WORK.md`, and the candidate's bounded Work Order as the only queue authority.
2. Read the Coordination Guard status and `python scripts/env_autonomy_runtime.py refill --root .`. The runtime selects; it does not claim, schedule, or dispatch.
3. Count no more than 3 active mutable lanes and 1 independent review lane. A `WAITING_EXTERNAL` or `PARKED` lane frees capacity only after its exact claim, generation, holder, lifecycle checkpoint, and remote publication are verified.
4. Require the canonical claim to be `READY`, the Work Order and source references to match, dependencies to be resolved, and the proposed scope to pass the existing Coordination Guard. Preserve the guard's shared-path policy.
5. Select the highest-priority eligible candidate. If none qualifies, report `AUTO_REFILL_REQUIRED=false` with the runtime's reason. Never invent a task to consume spare capacity.
6. Request the existing canonical control transition before work. Keep the selected lane bound to repo, worktree, branch, base/head, task, Work Order, claim generation/holder, scope, dependencies, lane kind, provider/model/variant, and run identity.

Model names and local hooks do not prove provider identity or server enforcement. Keep `ENFORCEMENT_NOT_ACTIVE` and `AUTONOMY_NOT_READY` until their separately defined live gates pass.
