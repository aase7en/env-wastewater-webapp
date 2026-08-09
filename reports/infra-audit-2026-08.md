# Infra Audit — Caching + Logging (2026-08-09)

> **Scope**: full sweep of caching layers (frontend + DB + CDN) and
> logging/audit trail (who-did-what + error tracking + intrusion signals)
> on the live stack — React 19 SPA → GitHub Pages → Supabase
> (PostgREST + Realtime + Auth + 2 Edge Functions). Audit run by GLM
> (Track Z), 2026-08-09, against HEAD `a6dcab0`.
> **Method**: read source directly (no agent-trust); cite file:line for
> every claim. Findings grouped by severity.

## Stack recap (one line)

No application server. Frontend (Vite-bundled SPA on GitHub Pages) talks
to Supabase directly via `@supabase/supabase-js` v2. Two Edge Functions
(`ingest-sensor`, `notify-threshold`) run service-role. All write paths
go through PostgREST (RLS-gated).

---

# Part 1 — CACHING

## 1.1 Inventory (what exists)

| Layer | What | Where |
|---|---|---|
| Service Worker | Hand-rolled `sw.js`, name `uth-env-v1`, 2-tier: HTML network-first, assets stale-while-revalidate | `frontend/public/sw.js:16,43-91` |
| SW registration | prod-only, `updateViaCache:"none"`, dispatches `sw-update-available` CustomEvent | `frontend/src/lib/sw-register.ts:12-43` |
| PWA manifest | full: standalone, icons 192/512, shortcuts | `frontend/public/manifest.webmanifest` |
| Vite chunk hashing | filename-hash 8 chars on every asset | `frontend/dist/assets/*-<hash>.{js,css}` |
| Route-level code-split | lazy per-route + heavy vendors split out (`exceljs`, `html2canvas`, `papaparse`) | Vite default + dynamic `import()` |
| localStorage | 5 namespaces: `theme`, `dock:v1`, `draft:*`, sessionStorage OAuth stashes, Supabase session | `lib/theme.ts:11`, `dock-prefs.ts:19`, `draft-storage.ts:16`, `main.tsx:22`, `lib/supabase.ts:27` |
| Polling | `useThresholdAlerts` 60s, `usePendingUsers` 60s, `useCarbonRollupRealtime` 10s backstop | `lib/alerts.ts:92`, `lib/admin/users.ts:90`, `lib/carbon-rollup.ts:169` |
| Realtime subscriptions | 2 channels: `sensor-reading-live` (INSERT prepend), `carbon-rollup-realtime` (refetch on `*`) | `lib/use-sensor-feed.ts:87-112`, `lib/carbon-rollup.ts:143-159` |
| Manual refresh | every data hook returns `refresh` callback; buttons in Dashboard/Readings/FlowDiagram; mutation → `refresh()` in every form page | `lib/hooks.ts:36-53` etc. |

## 1.2 What's missing

| Layer | Status | Why it matters |
|---|---|---|
| **HTTP `Cache-Control` headers** | not set anywhere — `deploy-frontend.yml:75-87` uses default `upload-pages-artifact`/`deploy-pages` | new deploys serve stale `index.html` from GitHub CDN for up to ~10 min; smoke-test doesn't verify headers |
| **Cross-page in-memory cache (React Query / SWR / TanStack Query)** | none — every hook is `useState`+`useEffect` ad-hoc | jumping dashboard ↔ readings ↔ reports re-fetches `v_dashboard_14day` 3×; no request dedupe; no optimistic UI (except `markAlertRead`) |
| **Materialized view for `carbon.v_unified_co2e`** | none — every rollup is plain `VIEW`, recompute on every query | UNION ALL of 5 sources JOINed to `carbon.emission_factor` is heavy; would benefit from `MATERIALIZED VIEW` + `pg_cron` daily refresh (no cron in migrations today) |
| **`useFormDraft` wired** | code present but not imported anywhere | `use-form-draft.ts:5,13` JSDoc says "intended for DailyFormPage"; DailyFormPage doesn't import → staff lose long-form data on browser refresh |
| **`role-module-visibility` realtime/caching** | none | admin toggles dock visibility → other users don't see it until manual browser refresh |
| **SW version bump automation** | `sw.js:16` `VERSION = "uth-env-v1"` literal | new deploy doesn't bump SW cache key; new HTML may serve cached old assets until SWR catches up |

## 1.3 Stale / over-cache risks

| Risk | Where | Mitigation |
|---|---|---|
| `draft:*` localStorage has **no TTL** | `draft-storage.ts:16,30,48` | stale drafts persist forever on shared kiosk; sensitive (water-quality values) |
| Supabase JWT session in localStorage | `lib/supabase.ts:27` (`persistSession: true` default) | live credential on shared device; consider opt-in `persistSession` for kiosk mode |
| SW stale-while-revalidate on `.js/.css` | `sw.js:75-91` | could serve old JS briefly even though filename-hash protects the long-term cache |
| `useCarbonRollupRealtime` 10s backstop retries forever | `lib/carbon-rollup.ts:184` | long network outage hammers API (free-tier) — needs capped retries / exponential backoff |
| `useCarbonRollupRealtime` not actually used | `CarbonRollupPage.tsx:8,17` calls non-realtime variant | dead realtime path; either wire it or delete |
| Realtime covers only 2 tables | migrations `20260718000002`, `20260719000012` | Scope 1/3 changes (fuel/garbage/garden/chemical) don't invalidate carbon rollup → stale until manual refresh |

## 1.4 PHI/PHI-adjacent in cache

| Item | PHI risk | Verdict |
|---|---|---|
| Supabase session JWT in localStorage | credential live on shared device | medium — kiosk risk; mitigation: opt-in `persistSession` |
| `draft:*` water-quality form values | PHI-adjacent (operational data, not patient) | low-medium — TTL would solve |
| `v_overview_carbon` (anon-accessible) | comment `20260720000000:5-9` confirms no PHI | safe — electricity usage only |
| AI chat history cache | `ai-chat.ts` has no client cache layer | none today; if added, must respect `STATIC_PHI_DENY` |
| SW bypasses cross-origin Supabase | `sw.js:50-51` | correct — never cache API responses |

---

# Part 2 — LOGGING + AUDIT

## 2.1 Inventory (what exists)

| Layer | What | Where |
|---|---|---|
| `core.audit_log` table | full DML capture: `actor uuid, action text, table_name, row_id, changed_at, old_data/new_data jsonb` | snapshot `reports/schema-snapshot-live.md:243-254` |
| Trigger `core.fn_audit_log()` | `AFTER INSERT/UPDATE/DELETE FOR EACH ROW`, captures `auth.uid()`, full row jsonb | `supabase/migrations/20260719000003_v2_audit_trigger.sql:30-70` |
| `public.audit_log` view | security_invoker façade | `20260719000011_schema5_audit_log_exposure.sql:12-13` |
| `core.ai_query_log` table | NL→SQL audit: `actor, question, provider_id, scope_used, answer, token_usage, asked_at` | snapshot `:195-206` |
| RLS on audit_log | own-SELECT + admin-FOR-ALL + I1 INSERT gate `actor = auth.uid()` | `20260719000003_v2_audit_trigger.sql:80-107`, `20260803000000_i1_audit_log_insert_gate.sql` |
| RLS on ai_query_log | own-SELECT + admin-FOR-ALL + D3 INSERT gate | `20260725000000_d3_ai_query_log_insert_gate.sql` |
| Frontend `console.warn` (10 sites) | all best-effort / debug-context, no `console.log/error/debug` in src | grep verified |
| Supabase Auth events | platform logs (Dashboard only) — `onAuthStateChange` consumed just for UI sync | `AuthProvider.tsx:166` |

## 2.2 Trigger coverage (16/24+ tables)

**Audited (16):** `wastewater.reading`, `carbon.reading`, `core.repair_request`, `wastewater.threshold_alert`, `water_supply.daily_check`, `garbage.collection_log`, `fuel.dispense_log`, `garden.work_round`, `building.inspection_round`, `safety.monthly_check`, `food.lab_test`, `chemical.movement`, `chemical.master`, `core.saved_query`, `core.app_user`, `core.regulation`.

**Skipped (gap — these should have triggers):**

| Table | Why it matters | Misleading comment? |
|---|---|---|
| **`core.attachment`** | regulation PDF swap = phish vector | — |
| **`core.personnel`** | PHI-adjacent (phone/nickname) | — |
| **`core.ai_provider`** | stores `key_value` (API key) | **YES** — `20260719000008_dba_ai_columns.sql:27` claims "Audit log captures every SELECT on ai_provider" but no `CREATE TRIGGER` exists in repo |
| `core.pdf_template` | admin-edit sensitive layout | — |
| `core.role_module_visibility` | DOCK admin config | — |
| `core.ai_scope` | AI filter config | — |
| `wastewater.sensor`, `wastewater.sensor_reading` | telemetry write-heavy (intentional skip per `20260719000003:14-16`) | — |

## 2.3 What's missing (the gaps)

| Gap | Severity | Why |
|---|---|---|
| **AI rejected queries not logged** | P1 | DBA-3 whitelist reject (`db-query.ts:100-139`, `20260719000005_dba3_admin_fn.sql:53-75`) and PHI filter block (`ai-chat.ts:124`) raise exceptions but insert no audit row → admin has no signal someone is probing forbidden queries |
| **`core.ai_provider` no trigger** | P1 | admin changes API key, no record of who/when; the code comment actively lies about this |
| **No ErrorBoundary / `unhandledrejection` handler** | P2 | uncaught exceptions in prod vanish into browser console |
| **No error-tracking SaaS** | P2 | no Sentry/LogRocket/Datadog; prod failures are invisible to maintainers |
| **No source maps** | P2 | `vite.config.ts` doesn't set `build.sourcemap` → default false → prod stack traces minified |
| **No UX analytics** | P2 | no PostHog/Plausible/GA → can't reconstruct funnels; only data-side-effects via `audit_log` |
| **No rate limiting (app layer)** | P2 | Edge Functions don't check IP/count; `ingest-sensor` trusts bearer service-role key — key leak = unlimited write; `docs/roadmap.md:75` flags this as to-do |
| **No failed-auth lockout (app layer)** | P3 | relies on GoTrue default (~30/hr/IP); frontend doesn't count attempts |
| **Realtime offline state not logged** | P3 | `useCarbonRollupRealtime` silent fallback; admin can't tell if user is seeing stale data |
| **Log tampering: admin `FOR ALL` on audit_log** | P2 | admin can UPDATE/DELETE audit rows; no second-order audit of audit_log; no hash chain (`pgcrypto` HMAC) |
| **Log tampering: service-role bypass** | P2 | anyone with `SUPABASE_SERVICE_ROLE_KEY` (2 Edge Functions) can bulk rewrite `audit_log` |
| **`audit_log.old_data/new_data` embeds full row** | P3 | for `core.app_user` rows this includes `email` — PHI-adjacent; export of audit_log leaks |
| **`ai_query_log` stores raw text** | P3 | if PHI slips past filter, it's permanent in the log; no redaction policy |

## 2.4 Intrusion-detection surface (what an attacker leaves behind)

Today, an attacker who:
- **probes DBA Console with banned SQL** → silently rejected, no trace.
- **tries AI chat with PHI-adjacent question** → silently blocked by `applyPhiFilter`, no trace.
- **churns failed logins** → counted by GoTrue server-side but not surfaced to admin UI.
- **hits RLS deny on a table** → gets `PGRST`/`42501`, frontend `console.warn`s locally, no central counter.
- **modifies `audit_log` rows as admin** → succeeds silently.

The **only** signal that survives is successful DML on the 16 audited tables. Every *attempt* that fails leaves no app-side trace.

---

# Part 3 — Recommendations (ranked)

## P1 (security/data-integrity — fix first)

1. **Add `trg_audit_log` on `core.ai_provider`** (and fix the lying comment in `20260719000008_dba_ai_columns.sql:27`). Admin changing an AI provider key without audit = unacceptable.
2. **Add audit trigger on `core.attachment`** (regulation PDF swap = phish surface).
3. **Log AI rejected queries** — INSERT into `ai_query_log` (or new `ai_reject_log`) on whitelist reject AND PHI filter block, with `action: 'rejected'`, `reason: 'whitelist'|'phi-filter'`. Without this, probing is invisible.

## P2 (correctness / observability)

4. **Tamper-evidence for `audit_log`** — either (a) drop admin `UPDATE`/`DELETE` (rule: append-only) or (b) hash-chain via `pgcrypto` HMAC on insert.
5. **SW version auto-bump** — generate `VERSION` from build hash in `sw.js` so deploys invalidate the cache.
6. **Wire `sw-update-available` listener** in `App.tsx` — show "new version available" toast so users don't sit on stale SW.
7. **ErrorBoundary + `unhandledrejection`** — at minimum centralize console.error to a buffer; consider Sentry Lite (free tier).
8. **Source maps for prod** — set `build.sourcemap: 'hidden'` in `vite.config.ts`; upload to Sentry or keep private.
9. **Cross-page cache (React Query)** — dedupe fetches across pages; optimistic UI; built-in retry/backoff.
10. **`useFormDraft` actually wire** into `DailyFormPage` — staff lose data on refresh today.
11. **Materialized view for `v_unified_co2e`** + `pg_cron` daily refresh — heavy UNION, currently recompute per query.
12. **Rate-limit Edge Functions** — `ingest-sensor` trusts bearer key; add IP counter (Upstash Redis or Supabase KV).

## P3 (UX / hardening)

13. **`role-module-visibility` Realtime** — broadcast so admin changes propagate without manual refresh.
14. **`draft:*` TTL** — expire after 7 days; sanitize on read.
15. **Kiosk mode opt-out of `persistSession`** — flag for shared devices.
16. **PostHog or Plausible** — basic page-view + funnel; PHI-safe (no user content).

---

# Part 4 — Verdict (one line each)

**Caching**: functional for a static SPA + Supabase, but missing cross-page cache (huge UX cost on slow networks), SW version bump (silent staleness), and materialized view for the heaviest rollup. PHI-safe by design (SW bypasses API).

**Logging**: DB-level audit is solid for the 16 covered tables but has two silent-reject holes (AI path), one false-comment gap (`ai_provider`), no tamper-evidence, and zero frontend error visibility. An attacker probing the system leaves almost no trace today.

**Priority for next chunk**: P1 items (#1–3) are security-relevant and small. P2 #4 (tamper-evidence) is the next-biggest integrity win. Everything else is UX/observability polish.
