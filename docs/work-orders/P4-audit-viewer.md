# WO-P4-audit-viewer: Audit-log viewer admin page (read-only + basic filters)

Status: done (primary-verified 2026-07-21 — see Checkpoint log)
Lane/files: `frontend/src/lib/admin/audit-log.ts` (new) · `frontend/src/pages/admin/AuditLogPage.tsx` (new) · `frontend/src/App.tsx` (route) · `frontend/src/components/layout/AppShell.tsx` (NAV entry)
Branch: main
Depends on: SCHEMA-4 audit trigger (`20260719000003`), SCHEMA-5 addendum façade `public.audit_log` (`20260719000011`) — both shipped. **No new SQL/migration.**
Model tier: **mid** (new lib + page + route; NAV line touches AppShell = Track F — see Forbidden)
Design: [ADR-0009](../adr/0009-ai-sql-ui-review-gate.md) §3

## Context

`core.audit_log` is populated by the SCHEMA-4 trigger on every
INSERT/UPDATE/DELETE of transactional tables, and exposed as
`public.audit_log` (`security_invoker=on`, admin-gated by the
`audit_log_admin_all` RLS policy, granted to `authenticated`). No page reads it.
This WO adds a read-only admin viewer. Because the façade is already admin-gated
at the DB layer, the page needs **no new SQL** — just query + `RequireAuth requireAdmin`.

Columns on `public.audit_log`: `id` (uuid), `actor` (uuid — `auth.uid()`, NULL
for service-role actions), `action` (`INSERT`/`UPDATE`/`DELETE`), `table_name`
(`schema.table`), `row_id` (text), `old_data` (jsonb), `new_data` (jsonb),
`created_at` (timestamptz). *(Confirm exact column names against
`reports/schema-snapshot-live.md` or `scripts/introspect_schema_api.py` before
coding — treat the list here as the contract, verify the spelling.)*

## Goal + Acceptance

`lib/admin/audit-log.ts` (new — mirror `lib/admin/users.ts` style: typed
helpers over `supabase`, errors as JS `Error`):

```ts
export interface AuditLogRow {
  id: string; actor: string | null; action: string;
  table_name: string; row_id: string | null;
  old_data: unknown; new_data: unknown; created_at: string;
}
export interface AuditLogFilter {
  action?: "INSERT" | "UPDATE" | "DELETE";
  table_name?: string;
  from?: string;   // ISO date (created_at >=)
  to?: string;     // ISO date (created_at <=)
  limit?: number;  // default 100, max 500
}
export async function fetchAuditLog(f?: AuditLogFilter): Promise<AuditLogRow[]>;
```

- `fetchAuditLog` → `supabase.from("audit_log").select(...)`, apply
  `.eq("action", …)` / `.eq("table_name", …)` / `.gte("created_at", from)` /
  `.lte("created_at", to)` when present, `.order("created_at", { ascending: false })`,
  `.limit(clamped)`. Throw on error.

`pages/admin/AuditLogPage.tsx` (new):
- Header `<h1>` (Thai, e.g. "บันทึกการตรวจสอบ (Audit Log)").
- Filter card: date-from / date-to (`type="date"`), `action` `<Select>`
  (`—/INSERT/UPDATE/DELETE`), `table_name` `<Select>` (reuse the `TABLES` list
  shape from `DBAConsolePage.tsx:35` or a `<Input>` free-text), and a **กรอง** button.
- Result: read-only table — columns `เวลา (created_at, Thai date)`, `ผู้กระทำ
  (actor or "ระบบ" when null)`, `การกระทำ (action)`, `ตาราง (table_name)`,
  `row_id`, and an expand toggle per row that reveals `old_data`/`new_data`
  as pretty-printed JSON in a `<pre class="font-mono text-xs">`.
- `TableSkeleton` while loading (SKEL primitive), `EmptyState`/plain text when 0 rows.
- **Read-only** — no edit/delete/mutate controls.

`App.tsx`: add lazy route `/admin/audit` under `RequireAuth requireAdmin` +
`Suspense fallback={<PageSkeleton/>}`, mirroring the `/admin/users` block (`:171`).

`AppShell.tsx`: add one NAV item in the "ผู้ดูแล" section (after `/admin/users`):
`{ to: "/admin/audit", label: "บันทึกตรวจสอบ", icon: "history_edu", adminOnly: true }`.

## Reference pattern

- **Lib**: `lib/admin/users.ts` (fetch + typed + Error) — closest mirror.
- **Page/table**: `pages/admin/AIAdminPage.tsx` (admin table + filter card) and
  `DBAConsolePage.tsx` result table (`:218`) for the JSON-in-`<pre>` idiom.
- **Route**: `App.tsx:171` (`/admin/users` lazy admin block) — copy verbatim, swap names.
- **NAV**: `AppShell.tsx:44-48` (existing adminOnly entries).
- **Thai date**: `lib/utils.ts::thaiDate` (as used in `ReadingsListPage`).
- **Skeleton**: `components/ui/Skeleton.tsx::TableSkeleton`.

## Forbidden

- ❌ No new migration / RPC — the façade + RLS already gate reads (ADR-0009 §3).
- ❌ Read-only: no INSERT/UPDATE/DELETE controls on audit rows.
- ❌ `AppShell.tsx` is Track F scope — keep the NAV change to the single
  mechanical `NAV[]` entry mirroring existing `adminOnly` items; **no other
  AppShell edits**. If a Track F chunk is mid-flight on AppShell, coordinate via
  the In-progress table (rule 4) or split the NAV line into a Track F follow-up.
- ❌ Do not change colors/fonts/`index.css`/`tailwind.config`.
- ❌ No `git reset --hard` / `git clean`.

## Verify

1. `cd frontend && npm run build` passes.
2. `npx vitest run` — no new failures.
3. `curl -s "$SUPABASE_URL/rest/v1/audit_log?limit=1" -H "apikey: $ANON"` → `401`
   (`42501`) proving anon cannot read (admin-gated). *(env from `.env`; do not
   print keys to chat.)*
4. `npx playwright test` — existing suite green; the `/admin/audit` route bounces
   for a non-admin (mirror the existing admin-route bounce assertions in
   `modules.spec.ts`).
5. Manual (admin login): open `/admin/audit` → recent rows show; apply an
   `action=UPDATE` + date filter → list narrows; expand a row → old/new JSON renders.

## Checkpoint log

- **2026-07-21 — primary verify (Opus 4.8):** shipped `2a62146`. `npm run build` ✓,
  `vitest` 96/96 ✓, `playwright` 26/26 ✓. Anon REST probe `GET /rest/v1/audit_log`
  → `401 / 42501 permission denied` ✓ (admin-gate holds; façade + RLS working, no new SQL).
  **Column-name gap closed:** this WO's draft named the time column `created_at`; GLM
  corrected the lib to `changed_at` against `reports/schema-snapshot-live.md`.
  Independently confirmed against the live snapshot — col #6 `changed_at timestamptz NOT
  NULL default now()`, plus index `audit_log_table_name_changed_at_idx`. This was the one
  gap no green gate covered (the anon probe 401s *before* PostgREST resolves columns).
  Low-sev nit (not fixed, queued cheap-ok): the `to` filter hardcodes `…T23:59:59.999Z`
  (UTC), so a Thai-local (UTC+7) day boundary is off by ~7h — same family as FIX-1.
  Manual admin walkthrough still pending (needs admin login). **PASS (with noted nit).**

- 2026-07-21 (GLM execute, commit `<TBD>`): lib + page + route + NAV shipped.
  - **Column contract divergence from this WO's draft**: live snapshot
    `reports/schema-snapshot-live.md` `core.audit_log` shows `id bigint`
    (not `uuid`) and `changed_at timestamptz` (not `created_at`). Both
    corrected in `lib/admin/audit-log.ts` (the WO's own contract-check note
    flagged this — verify step caught it).
  - Read-only enforced (no edit/delete controls on the page).
  - Verify: build ✅ · Vitest 96/96 · Playwright 26/26 (incl. extended
    modules.spec — `/admin/users` + `/admin/audit` hidden for anon) ·
    anon GET `/rest/v1/audit_log?limit=1` → `401/42501` (admin gate holds).
  - Side effect: regen Material Symbols subset (51→52 icons, `history_edu`
    added by `gen-msymbol-subset.mjs` auto-scan).
