# WO-P4-suggest-chip: AiSuggestions — schema-aware query-suggestion chips in DBA Console

Status: open
Lane/files: `frontend/src/components/admin/AiSuggestions.tsx` (new) · `frontend/src/pages/admin/DBAConsolePage.tsx` (wire-in only)
Branch: main
Depends on: DBA-9 lib (`lib/admin/ai-sql.ts::suggestQueries` — shipped `ec4bc0d`), and ideally `P4-nl-sql` landed first (shares the `onUseSql` seam)
Model tier: **cheap-ok** (thin reuse of an existing lib + the same seam as P4-nl-sql; GLM/Sonnet)
Design: [ADR-0009](../adr/0009-ai-sql-ui-review-gate.md) §1, §4

## Context

`lib/admin/ai-sql.ts::suggestQueries(schemaContext?)` already returns
`{ title_th, sql, rationale_th }[]` and caches for 5 min. The `AiSuggestions.tsx`
UI (DBA-9) was never built (`components/admin/` didn't exist). This WO adds a
small panel of suggestion chips. **Review-gate (ADR-0009): clicking a chip loads
its SQL into the editor — it does not run.**

## Goal + Acceptance

`AiSuggestions.tsx` (new — small panel/card, rendered in `DBAConsolePage`, e.g.
beside or below `AiQueryBox`):

- On mount (or a **แนะนำ query** refresh button): `const ctx = await
  buildSchemaContext(); const s = await suggestQueries(ctx);` (the lib's 5-min
  cache means re-renders don't re-call — do not add a second cache).
- Render each suggestion as a chip/card: `title_th` (bold), `rationale_th`
  (muted, small). Clicking it calls prop `onUseSql(suggestion.sql)` → page does
  `setMode("raw"); setRawSql(sql)` for review (same callback as `P4-nl-sql`).
- Loading → `Skeleton` chips (SKEL primitive). Empty → the DBA-9 copy:
  `ยังไม่มีคำแนะนำ — ลองรัน query หรือ save query ก่อน`.
- Provider error → `toast("error", …)`, panel shows the empty state.
- **No run/execute button** — chip click only loads into the editor.

`DBAConsolePage.tsx` wire-in: render `<AiSuggestions onUseSql={(sql) => {
setMode("raw"); setRawSql(sql); }} />`. Reuse the exact `onUseSql` handler from
`P4-nl-sql` if that landed (hoist it to one function).

## Reference pattern

- **Lib**: `lib/admin/ai-sql.ts::suggestQueries` + `buildSchemaContext` (do not modify).
- **Chip styling**: the `QuickChips` pattern in `pages/DailyFormPage.tsx:58`
  (rounded chips with `font-thai`, existing tokens) — reuse classes, add none.
- **Seam**: identical `onUseSql` as [P4-nl-sql](./P4-nl-sql.md); land that first.
- **Skeleton**: `components/ui/Skeleton.tsx::Skeleton`.

## Forbidden

- ❌ No auto-run — chip click loads into editor only (ADR-0009 §1).
- ❌ Do not modify `lib/admin/ai-sql.ts` (incl. no second suggestions cache).
- ❌ Do not change colors/fonts/`index.css`/`tailwind.config` (Track F).
- ❌ No row data to the provider — only `buildSchemaContext()` output.
- ❌ No `git reset --hard` / `git clean`.

## Verify

1. `cd frontend && npm run build` passes.
2. `npx vitest run` — no new failures.
3. `npx playwright test` — existing suite green.
4. Manual (AI provider configured + admin login): open `/admin/db` → suggestion
   chips render (3–5) → click one → editor flips to raw mode with the SQL loaded
   → existing **รัน** executes it. Re-render within 5 min → no new provider call
   (cache hit).
5. `git grep -nE "\.rpc\(|runRawQuery|runQuery" frontend/src/components/admin/AiSuggestions.tsx`
   → 0 hits (proves the component never executes).

## Checkpoint log
