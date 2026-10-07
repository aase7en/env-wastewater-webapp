---
name: env-fleet-router
description: Route ENV task categories by bounded model fit and verified provider availability without treating labels as authorization.
---

# ENV-Fleet-Router

Use `python scripts/env_autonomy_runtime.py route --task-category <category>` to report task fit. The command never calls a provider. For `independent_review`, `--review-risk-tier R2` (the default) reports the fresh GLM-5.3 MAX reviewer route and `--review-risk-tier R3` reports the required GPT-6.1 Sol cross-model route.

| Task category | Candidate route | Boundary |
| --- | --- | --- |
| `orchestration`, `routine_integration`, `low_risk_analysis` | GPT-6 Luna MAX | Owner-supervisor/control work under the active mission |
| `core_engineering`, `security`, `data_contract`, `bounded_implementation` | GLM-5.3 MAX via `cointh-glm` | Requires separately refreshed proxy-quota and upstream readiness evidence |
| `read_only_analysis` | GLM-5.3 Flash via `cointh-glm` | Read-only; same live admission and durable receipt requirements |
| `independent_review` (R2 ordinary) | Fresh GLM-5.3 MAX reviewer context | Separate read-only execution from the authoring lane; frozen exact SHA; adversarial; never the author's own run/session. Do not escalate ordinary R2 to a cross-model reviewer merely for model diversity |
| `independent_review` (R3 critical) | GPT-6.1 Sol | REQUIRED for deterministic R3 scope: auth/security/secrets, durable claim/protocol authority, concurrency/leases/retries/replay safety, provider admission/quota logic, release trust paths, high-blast-radius shared state, ambiguous destructive/data-loss risk. Advisory input (JEV) must not downgrade an R3 classification. Also required after two genuine failed GLM diagnose/repair cycles on one root cause |
| `read_only_advisory` | JEV | Strictly read-only; currently report `UNAVAILABLE` without a supported live route. Advisory only — never decides claim ownership, SAFE_TO_MUTATE, review acceptance, merge, completion, or risk-tier downgrade |

Owner routing policy (effective 2026-10-07):

- GPT-6 Astra is not an approved ENV route for any purpose (implementation, planning, review, escalation). Never dispatch it; never reintroduce it from stale prompts, memories, or handoffs. Historical Astra evidence in already-merged work remains valid history.
- Cost-aware route preference (cheapest safe route first): GLM-5.3 Flash → JEV advisory → GLM-5.3 MAX → GPT-6.1 Sol.
- Provider failure: if the R3 reviewer is unavailable (quota or entitlement), ordinary R2 work still proceeds with the fresh GLM-5.3 MAX reviewer; deterministic R3 review waits and is surfaced as a human gate, not as a timer. A provider-stated reset timestamp is a fallback boundary, not immutable truth; material external evidence of change permits exactly one fresh probe.

- Routing metadata is not an authenticated identity, claim, quota, or dispatch permission.
- Treat missing, stale, reused, or contradictory provider evidence as `UNKNOWN` and fail closed. HTTP 401/403 is an authentication or entitlement result, not proof of quota exhaustion.
- Do not use Kilo's general account balance, CLI presence, a prior session export, or an online-worker indicator as proof that the `cointh-glm` proxy quota and selected upstream model are both ready.
- Never route patient-identifying data, `.env` values, or raw hospital exports to an external provider. Do not claim JEV proof by substituting another model.
- This adapter currently has no verified secret-safe live admission probe or provider dispatch implementation. Its result remains `AUTONOMY_NOT_READY`; a route selection cannot launch work.
