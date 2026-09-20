# ENV-COORD-003 — GLM-5.3 MAX implementation packet / lane handoff

Lifecycle: REQUESTED
Status: WAITING_FOR_BOOTSTRAP_CLAIM
Task: `ENV-COORD-003`
Claim ID: `ENV-COORD-003-C1`
Claim generation: `1`
Execution holder: `kilo-glm-env-coord-003-g1-primary`
Repository: `aase7en/env-wastewater-webapp`
Planned worktree: `A:\\GitHub\\envww-coord-003`
Planned branch: `feat/env-coord-003-shadow`
Policy/base at proposal: `94c1a8f9dda5424c0403c69d26e17d6d9e8e38ed`
Work Order: `docs/work-orders/ENV-COORD-003.md`
Coordinator/review owner: GPT-5.6 Sol
Last updated: 2026-09-20

## Start gate

Do not mutate until the claim transition is independently reviewed and merged
into authoritative main, then re-read actual repo/remote/current registry and
prove `SAFE_TO_MUTATE = YES`.
## Scope

Only the five paths listed by the Work Order:
- `.github/workflows/coordination-shadow.yml`
- `scripts/env_coordination_ci.py`
- `scripts/test_env_coordination_ci.py`
- `docs/work-orders/ENV-COORD-003.md`
- this handoff

Do not modify guard core/tests, CURRENT-WORK, architecture, existing workflows,
frontend, Supabase, schema/RLS, data, secrets, GitHub settings or server policy.

## Route preflight

2026-09-20 Windows Kilo roll-call:
- `cointh-glm/glm-5.3`: accessible
- `cointh-glm/glm-5.3-flash`: accessible

Direct provider quota remaining is not exposed through the safe Kilo CLI
surface used here. If provider admission later fails, classify that as a
route/quota/tool blocker for this lane only; do not silently substitute a
different model/provider.
## Result schema — fill before stopping

Record:
- start/end HEAD and authoritative base;
- dirty/untracked state;
- exact changed files;
- RED/baseline evidence;
- implementation decisions that do not alter architecture semantics;
- focused/full GREEN commands and exact counts;
- workflow/static validation;
- adversarial fail-closed probes;
- limitations/blockers;
- exact pushed SHA + PR;
- whether any candidate code was ever executed by privileged CI;
- one next safe action.

Stop at `REVIEW_REQUESTED`; do not merge.

## Exactly one next safe action

Wait for the bootstrap claim transition to reach authoritative main. Then the
coordinator creates/binds the isolated implementation worktree and launches the
single GLM-5.3 MAX holder.
