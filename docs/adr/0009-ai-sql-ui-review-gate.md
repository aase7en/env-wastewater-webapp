# ADR-0009: AI-assisted SQL UI (NL→SQL + suggestions) with a review-gate execution model, and audit-log viewer over the existing façade

- **Status**: Accepted (2026-07-21) — design for P4 chunks `P4-nl-sql`, `P4-suggest-chip`, `P4-audit-viewer`
- **Context**: [WO P4-nl-sql](../work-orders/P4-nl-sql.md) · [WO P4-suggest-chip](../work-orders/P4-suggest-chip.md) · [WO P4-audit-viewer](../work-orders/P4-audit-viewer.md)
- **Related**: DBA-2 (`db-query.ts` whitelist), DBA-3 (`admin_run_query` Edge Function), DBA-8/DBA-9 (`ai-sql.ts` lib — libs shipped in `ec4bc0d`, UI never built), SCHEMA-4 (audit trigger `20260719000003`), SCHEMA-5 addendum (`public.audit_log` façade `20260719000011`), ADR-0005 (public-definer-aggregate), ADR-0007 (admin RLS via `role='admin'`)

## Context

Three P4 UI ideas sit on top of infrastructure that already landed but was never surfaced:

1. **AI NL→SQL** — `lib/admin/ai-sql.ts::nlToSql(question, schemaContext?)` returns `{ sql, explanation, warnings }`. The DBA-8 WO specced an `AiQueryBox.tsx` component, but `frontend/src/components/admin/` does not exist — only the lib shipped.
2. **AI query suggestions** — `ai-sql.ts::suggestQueries(schemaContext?)` returns `{ title_th, sql, rationale_th }[]` with a 5-min cache. The DBA-9 `AiSuggestions.tsx` was likewise never built.
3. **Audit-log viewer** — `core.audit_log` is populated by the SCHEMA-4 trigger and exposed as `public.audit_log` (a `security_invoker=on` view, admin-gated by the `audit_log_admin_all` RLS policy, granted to `authenticated`). No page reads it yet.

The app is a hospital ENV system. Its data is operational / PHI-adjacent (water/food/environment samples, repair requests, attachments). Two hard constraints shape the design:

- **PHI boundary** (MIGRATION.md §Two-track rule): patient data must never be routed to an AI provider; Z.ai/GLM cloud is out of bounds even indirectly.
- **Destructive-SQL risk**: `nlToSql`'s system prompt permits `INSERT/UPDATE/DELETE`, not just `SELECT`. An AI that both writes *and* executes DML against a hospital DB is an unacceptable blast radius.

The original DBA-8 WO drew the modal with a `[รันเลย]` (run-now) button. That is the decision this ADR overrides.

## Decision

### 1. Review-gate execution — the AI proposes, a human runs

Neither AI feature executes SQL. Both land generated SQL into the **existing** DBA Console raw-SQL editor for human review, then the admin clicks the console's existing **รัน** button, which already routes through `db-query.ts::isStatementAllowed()` (layer 1 whitelist) → `runRawQuery()` → the DBA-3 `admin_run_query` Edge Function (layer 2, real parser, server-side). The AI path adds **zero** new execution surface.

Concretely, the integration seam is `DBAConsolePage.tsx`'s existing state:

```ts
setMode("raw");
setRawSql(generatedSql);   // NL→SQL result, or a clicked suggestion
```

The admin sees the SQL, the explanation, and any warnings before anything runs. `EXPLAIN` (already wired) is available for mutations.

### 2. NL→SQL never sends row data to the provider

`nlToSql` sends only the **schema context** — table names + approximate row counts from `buildSchemaContext()` — never actual rows. Combined with review-gate (§1), the AI never reads or writes hospital data; it only reads a table catalog and emits text.

**Known limitation, documented not fixed here**: the DBA-8 WO promised a dynamic PHI filter (drop tables flagged `core.ai_scope.patient_safe=false` from the context). The shipped `buildSchemaContext()` instead hardcodes an env-only table list, so the promised dynamic filter is absent. This is *safe today* because ENV_DB holds no patient tables — every table in the list is environmental — but it is a latent gap if a PHI-adjacent table is ever added. Tracked as a follow-up (`AISQL-phi-filter`, cheap-ok) rather than folded into these UI WOs, to keep the UI chunks pure-frontend.

### 3. Audit viewer reuses `public.audit_log` — no new SQL

The viewer is a read-only admin page querying `supabase.from("audit_log")`. The `security_invoker=on` façade + `audit_log_admin_all` policy already make it admin-only at the DB layer — a non-admin gets `401/42501`, and the route is `RequireAuth requireAdmin` on top. No migration, no new RPC. Columns: `id, actor, action, table_name, row_id, old_data, new_data, created_at`. Basic filters only (date range, `action`, `table_name`); `old_data`/`new_data` shown as expandable JSON. No PHI risk — audit rows carry env-domain diffs, and `actor` is a UUID.

### 4. Scope split into three independently-shippable WOs

`P4-nl-sql` (mid) → `P4-audit-viewer` (mid) → `P4-suggest-chip` (cheap-ok). Priority order reflects value×risk: NL→SQL is highest-value and needs the review-gate decision baked in; the audit viewer is standalone; the suggest-chip is a thin reuse of the same seam.

## Alternatives considered

- **A. Auto-run, SELECT-only whitelist.** Rejected. Relies on the AI reliably emitting only `SELECT`, but the prompt itself allows DML, and hallucinated `WHERE` clauses on an `UPDATE` are silent data corruption. The whitelist is a backstop, not a license to auto-execute AI output.
- **B. Auto-run with a confirm dialog.** Rejected. Confirm-fatigue turns the gate into a rubber stamp, and the action is still AI-*initiated*. Review-gate makes the human the initiator, which is the safer default posture for a hospital DB.
- **C. Review-gate (chosen).** One extra click; the admin is always the executor.
- **Audit viewer via a dedicated `SECURITY DEFINER` RPC** (like the OAUTH-3 approve/reject fns). Rejected — unnecessary. The invoker façade + existing admin RLS already scope reads correctly; a bespoke RPC would duplicate that gate with more surface.
- **Fold the PHI dynamic-filter fix into `P4-nl-sql`.** Rejected — it is a lib/SQL concern (`ai_scope` introspection), not UI, and mixing it in would make a clean frontend chunk straddle two lanes. Split out.

## Consequences

**Positive:**
- No new SQL-execution path; the AI features inherit DBA-2/DBA-3 defense-in-depth unchanged.
- The AI provider never receives row data — only a table catalog — so the PHI boundary holds structurally, not by convention.
- Audit viewer is pure-additive frontend over an already-exposed, already-gated view.
- Three small chunks; two are mid (Sonnet), one cheap-ok (GLM/Sonnet) — no primary-tier execution needed.

**Negative:**
- One extra click vs auto-run (accepted).
- NL→SQL's *run* step depends on DBA-3 (`admin_run_query`) being deployed; if it is not, `runRawQuery` throws `PGRST202` and the admin can still copy the SQL out but not run it in-app. The WO calls this out; NL→SQL's *generate + review + copy/EXPLAIN* value survives regardless.
- The `ai_scope.patient_safe` dynamic filter remains unimplemented (safe today, tracked separately).
