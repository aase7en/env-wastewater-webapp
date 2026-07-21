# WO-P4-nl-sql: AiQueryBox — NL→SQL modal in DBA Console (review-gate)

Status: open
Lane/files: `frontend/src/components/admin/AiQueryBox.tsx` (new) · `frontend/src/pages/admin/DBAConsolePage.tsx` (wire-in only)
Branch: main
Depends on: DBA-8 lib (`lib/admin/ai-sql.ts` — shipped `ec4bc0d`), DBA-2 (`db-query.ts`), DBA-3 Edge Function (`admin_run_query`) for the *run* step
Model tier: **mid** (UI + logic over an existing lib; Track Z logic + minimal markup — Track F owns visual polish)
Design: [ADR-0009](../adr/0009-ai-sql-ui-review-gate.md) §1, §2

## Context

`lib/admin/ai-sql.ts::nlToSql(question, schemaContext?)` already returns
`{ sql, explanation, warnings }` and `buildSchemaContext()` already builds the
grounding string. **The UI was never built** — `frontend/src/components/admin/`
does not exist. This WO adds the component and wires it into the console.

**Execution model = review-gate (ADR-0009): the box NEVER runs SQL.** It lands
the generated SQL into the console's existing raw-SQL editor for the admin to
review and run via the existing **รัน** button. No `[รันเลย]` button (this
supersedes the DBA-8 WO's original draft).

## Goal + Acceptance

`AiQueryBox.tsx` (new component, rendered at the top of `DBAConsolePage`):

- Textarea + submit: placeholder `ถามภาษาไทย เช่น "แสดงค่า DO ที่ต่ำกว่า 2 ล่าสุด 30 วัน"`.
- On submit: `setLoading(true)` → `const ctx = await buildSchemaContext()` →
  `const res = await nlToSql(question, ctx)` → show a result panel/modal with:
  - the generated **SQL** in a `<pre class="font-mono">` block,
  - the **explanation** (Thai) below it,
  - **warnings** (if `res.warnings.length`) in an amber block.
- Actions in the result panel (review-gate):
  - **ส่ง SQL ไปที่ Editor** → calls a prop callback `onUseSql(sql: string)`;
    the page implementation does `setMode("raw"); setRawSql(sql)` and scrolls to
    / focuses the editor. Admin then reviews and clicks the existing **รัน**.
  - **คัดลอก SQL** → `navigator.clipboard.writeText(res.sql)` + success toast.
  - **ปิด / ถามใหม่** → clears the panel.
  - **NO run/execute button in this component.**
- Errors from `nlToSql` (provider down, parse fail) → `toast("error", …)`, panel
  stays open so the question isn't lost.
- Empty/whitespace question → disabled submit (no call).

`DBAConsolePage.tsx` wire-in (minimal):
- Import + render `<AiQueryBox onUseSql={(sql) => { setMode("raw"); setRawSql(sql); }} />`
  above the Builder/Raw mode toggle.
- No change to `runRaw` / `runBuilder` / whitelist logic.

## Reference pattern

- **Component shape / toast / AuraCard**: `pages/admin/AIAdminPage.tsx` (admin
  card + form + toast idioms) and `pages/admin/DBAConsolePage.tsx` (the
  `result` panel with `<pre>` + `font-mono` is the visual template for the SQL block).
- **Lib call**: `lib/admin/ai-sql.ts` — `nlToSql` + `buildSchemaContext` (do not
  modify the lib in this WO).
- **Integration seam**: `DBAConsolePage.tsx:47` (`mode` state) + `:64` (`rawSql`
  state) — `onUseSql` sets both.

## Forbidden

- ❌ No auto-run / execute inside `AiQueryBox` — review-gate only (ADR-0009 §1).
- ❌ Do not modify `lib/admin/ai-sql.ts`, `lib/admin/db-query.ts`, or the
  whitelist (`isStatementAllowed`).
- ❌ Do not change colors/fonts/`index.css`/`tailwind.config` — Track F scope.
  Use existing tokens/classes (`aura-*`, `font-thai`, `font-mono`) only.
- ❌ Do not send row data to the provider — only `buildSchemaContext()` output.
- ❌ No `git reset --hard` / `git clean` in the shared tree.

## Verify

1. `cd frontend && npm run build` passes.
2. `npx vitest run` — no new failures (4 pre-existing daysSince timezone fails
   are unrelated; do not "fix" them here).
3. `npx playwright test` — existing suite green; add nothing unless trivial.
4. Manual (needs an AI provider configured in `/admin/ai` + admin login):
   ask "แสดงค่า DO ที่ต่ำกว่า 2 ล่าสุด 30 วัน" → SQL + explanation render →
   **ส่ง SQL ไปที่ Editor** flips to raw mode with the SQL loaded → existing
   **รัน** executes it (or shows the DBA-3-not-deployed message if the Edge
   Function is absent — expected, see ADR-0009 §Consequences).
5. `git grep -n "รันเลย" frontend/src/components/admin/AiQueryBox.tsx` → 0 hits
   (proves no auto-run button).

## Checkpoint log
