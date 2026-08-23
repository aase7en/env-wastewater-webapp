# WO PROPOSAL — WO-STAB-009: annotateRow PHI boundary (allowlist + safe-field projection)

> **Status: PROPOSAL — NOT ACTIVE.** No implementation is authorized yet
> (program gate @ b5f4e76). Requires activation by the coordinating/
> reviewer agent. Proposed owner: GLM 5.3 (lib/data-boundary work).

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

## Proposed fix (two layers, allowlist first)

1. **Allowlist gate (authoritative)**: `annotateRow` refuses unless
   `tableName` is in a new `core.ai_scope`-backed allowlist
   (`patient_safe = true AND is_enabled = true` — reuse the existing
   scope table read, inverted selection). Non-listed table → immediate
   local refusal row (no provider call), surfaced in the UI message.
   Unknown/unreadable scope → fail-closed refusal.
2. **Safe-field projection (default)**: for allowlisted tables, project
   only columns declared safe. Bootstrapping: a static map for known
   operational tables (id/dates/quantities/status fields), everything
   else omitted by default. Unknown column → omitted (Unknown ≠ shared).
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
