---
name: env-kilo-lifecycle
description: Bind an authorized external GLM operation to a durable ENV receipt and recover it without copying transcripts or blindly replaying.
---

# ENV-Kilo-Lifecycle

Kilo session list/export is observation only. Use the accepted existing ENV task, claim, handoff, and `ENV-AGENT-OPS-002` transport rules; do not create a second run registry.

Before a material GLM call:

1. Verify the canonical claim is authorized and bind task, claim generation/holder, repository, worktree, branch, exact base/head, scope, dependencies, lane kind, `cointh-glm`, model/variant, and unique run ID.
2. Refresh proxy quota and upstream model readiness through separate, verified, secret-safe evidence sources. Require fresh `READY` for both. Unknown state, stale evidence, or HTTP 401/403 stops dispatch.
3. Record a typed operation intent and admission-evidence digest in the existing lane handoff before invoking the provider. Never include credentials, patient data, raw exports, prompt transcripts, or raw output in the handoff.
4. After execution, record `SUCCEEDED`, `FAILED`, or `UNKNOWN` and a result digest. Unknown remains unresolved and blocks replay until independent provider evidence is reconciled.
5. Verify ingestion into the canonical handoff, publish the fast-forward checkpoint, then record `ARCHIVED/CLEARED`. The ordered transport is `REQUESTED -> RESULT_WRITTEN -> INGESTED_TO_SSOT -> ARCHIVED/CLEARED`.

Do not equate Kilo's general Gateway balance with the `cointh-glm` quota. The current runtime has no configured secret-safe probe or dispatch adapter; report both readiness values as `UNKNOWN` and do not call a model until that gap is resolved through authorized, live evidence.
