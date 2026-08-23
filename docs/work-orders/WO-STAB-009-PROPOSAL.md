# WO PROPOSAL — WO-STAB-009: annotateRow PHI boundary (allowlist + safe-field projection)

> **Status: ACTIVE — READY_FOR_IMPLEMENTATION.** GPT activation decision recorded 2026-08-24 after PR #26 review.
> Execution order: **1 of 2** (run before WO-STAB-006).
> Owner: GLM 5.3 (lib/data-boundary work). Stop at `REVIEW_REQUESTED`; GLM must not merge its implementation PR.

## Source finding (still open on main)

`reports/code-review-2026-08-12.md` **P1 #9 (nuanced)** —
`frontend/src/lib/admin/ai-sql.ts` `annotateRow` ships
`JSON.stringify(row)` to the provider inside the prompt. Mitigation today:
the prompt names `${tableName}` and routes through `sendChatTurn`'s
`applyPhiFilter`, which blocks table-NAME hits against the deny-set. Gap:
PHI content inside rows of non-flagged tables (e.g. emails inside
`audit_log.old_data`) still passes.

## Approved direction (recorded on main, STAB-INTEGRATE-001 notes)

> "For AI row annotation policy: explicit AI-safe allowlist + safe-field
> projection first; content scrubber only as defense-in-depth."

This proposal operationalizes that direction — no new decision required,
only activation.

## GPT activation amendments — mandatory

The proposal direction is approved with these boundary-tightening amendments:

1. `core.ai_scope` with `patient_safe=true AND is_enabled=true` is a **necessary runtime gate, not sufficient authorization by itself**. An admin toggle must not be able to widen the row payload sent to an external provider.
2. Row annotation must also require an explicit static per-table safe-field profile in code. Effective authorization is the **intersection** of runtime `ai_scope` approval and the static safe-field profile.
3. Use canonical fully-qualified `schema.table` keys for the static profile. Unknown, ambiguous, unqualified-without-an-explicit-hardcoded-map, disabled, missing, or unreadable scope => **fail closed locally with zero provider calls**.
4. Do **not** fall back to `STATIC_PHI_DENY` for this positive allowlist decision. That fallback only protects the deny-list path; using it as an allowlist fallback could widen exposure when scope lookup fails.
5. Project the row to the static safe fields **before** prompt construction / `JSON.stringify`. Unknown columns are omitted by default. Apply the PII regex scrubber to projected string values as defense-in-depth before the provider request.
6. Refusal/error paths must not include or log the raw row. Tests must prove a table marked safe in `ai_scope` but absent from the static safe-field profile is still refused, and that an `ai_scope` read failure causes zero provider requests.

These amendments are part of the active acceptance criteria.

## Proposed fix (three layers, runtime gate + static profile first)

1. **Runtime scope gate**: `annotateRow` refuses unless canonical `tableName`
   is enabled and marked `patient_safe = true` in `core.ai_scope`. This is
   necessary but not sufficient authorization. Non-listed/disabled/unreadable
   scope → immediate local refusal (no provider call).
2. **Static safe-field profile (authoritative payload boundary)**: the same
   canonical table must exist in an explicit in-code safe-field map. Project
   only declared safe columns (id/dates/quantities/status fields as reviewed);
   everything else is omitted by default. Unknown column → omitted
   (Unknown ≠ shared). A runtime/admin scope toggle cannot create a new
   payload profile by itself.
3. **Defense-in-depth scrubber**: regex redaction of obvious PII shapes
   (email/phone/Thai national-ID patterns) applied to projected values
   before send. Best-effort, logged, never the only gate.

## Proposed tests (RED-first)

Unit (node-env, mock supabase):
- non-allowlisted table → refused, zero provider calls
- ai_scope read error → refused (fail-closed)
- allowlisted table with unsafe column → column absent from prompt body
- scrubber redacts email/phone patterns in safe columns
- capture-fetched-body pattern (existing ai-chat tests) to prove what
  leaves the browser

E2E optional (admin-gated UI): defer; unit + captured body is
deterministic and sufficient for the boundary.

## Files (ownership)

- `frontend/src/lib/admin/ai-sql.ts` (annotateRow + allowlist read)
- `frontend/src/lib/admin/ai-sql.test.ts` (extend)
- No component/visual change; no schema migration (reuses ai_scope).

## Gates

lint baseline · build · Vitest · full Playwright · diff-check ·
PR → GPT review. No merge by GLM.
