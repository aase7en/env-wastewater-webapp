---
name: env-fleet-router
description: Route ENV task categories by bounded model fit and verified provider availability without treating labels as authorization.
---

# ENV-Fleet-Router

Use `python scripts/env_autonomy_runtime.py route --task-category <category>` to report task fit. The command never calls a provider.

| Task category | Candidate route | Boundary |
| --- | --- | --- |
| `orchestration`, `routine_integration`, `low_risk_analysis` | GPT-6 Luna MAX | Owner-supervisor/control work under the active mission |
| `core_engineering`, `security`, `data_contract`, `bounded_implementation` | GLM-5.3 MAX via `cointh-glm` | Requires separately refreshed proxy-quota and upstream readiness evidence |
| `read_only_analysis` | GLM-5.3 Flash via `cointh-glm` | Read-only; same live admission and durable receipt requirements |
| `independent_review` | GPT-6 Sol | Exact-SHA reviewer must be independent from author/run/session |
| `read_only_advisory` | JEV | Strictly read-only; currently report `UNAVAILABLE` without a supported live route |

- Routing metadata is not an authenticated identity, claim, quota, or dispatch permission.
- Treat missing, stale, reused, or contradictory provider evidence as `UNKNOWN` and fail closed. HTTP 401/403 is an authentication or entitlement result, not proof of quota exhaustion.
- Do not use Kilo's general account balance, CLI presence, a prior session export, or an online-worker indicator as proof that the `cointh-glm` proxy quota and selected upstream model are both ready.
- Never route patient-identifying data, `.env` values, or raw hospital exports to an external provider. Do not claim JEV proof by substituting another model.
- This adapter currently has no verified secret-safe live admission probe or provider dispatch implementation. Its result remains `AUTONOMY_NOT_READY`; a route selection cannot launch work.
