# Handoff — ENV-REPAIR-P4-LEDGER-001-GLM (Claim ENV-REPAIR-P4-LEDGER-001-C1, gen 1)

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the
claim-transition PR merges.** Until then this document is the binding brief.
Worktree `_worktrees/env-repair-p4-ledger-001` (clean, off the post-merge main
tip); implementation branch `feat/env-repair-p4-ledger-001` off that tip.
STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns
approval + merge of every PR in this lane's chain.
WO `docs/work-orders/ENV-REPAIR-P4-LEDGER-001.md` holds the full binding pins
(§0 the investigation record + the stale-comment rider, §1 authorization,
§2 the ledger inventory, §3 out-of-scope guards, §4 NO BUMP, §5 D-phases,
§6 D1 items, §7 scope). Read it before writing anything. Summary:

## 1. Deliver THIS lane (the P4.5 closeout frontier candidates a+b+c, ONE sweep)

- **(a) The P4.2 wastewater-view resolution** — the real bug candidate:
  `wastewater.v_pending_threshold_alerts` (queue) and `wastewater.threshold_alert`
  (mark table) are wastewater-schema objects while
  `supabase/functions/notify-threshold/index.ts:132` builds a DEFAULT-schema
  supabase-js client (`createClient(url, serviceKey)`, no `db.schema`) — the
  queue read (`:141-144`) resolves to `public.v_pending_threshold_alerts`,
  which has never existed (E6: the schema5 façade batch created
  `public.threshold_alert` but NOT the queue view). Repo-side conclusion:
  **the EF genuinely cannot see the queue** — at owner activation the poll
  errors out before any send. Binding: the live D1 probe (catalog + REST
  profile) must CONFIRM before any fix; a contradiction pivots the lane to
  document-why + regression pin-test with `index.ts` code-untouched. The mark
  path (E5) is fixed by the same ruling (D1-2): schema-scoped client (1-line,
  both paths) vs ONE additive public façade migration
  (`public.v_pending_threshold_alerts with (security_invoker=on)` per the
  schema5/P1.7 precedent — E7's PG-42501-vs-PGRST205 evidence suggests
  `wastewater` is NOT profile-reachable, favoring the façade form). Record the
  live before/after probes in this handoff D3.
- **(b) The README truth refresh** — bounded, not a rebrand:
  - Root `README.md`: the `db/migrations/` example path → `supabase/migrations/`;
    the Pages list re-verified against `frontend/src/App.tsx` at the
    implementation head (at base the parity routes
    `/safety/extinguisher-inspections`, `/safety/emergency-light-checks`,
    `/safety/job-log`, `/admin/equipment-specs`, `/admin/extinguishers`,
    `/admin/inventory`, `/admin/calibration`, `/admin/masters`,
    `/admin/manuals`, `/admin/address` are missing); the version-chip wording
    matches the delivered shell chip; the EF inventory + deployment pointer
    reflects the delivered notify-threshold + notify-monthly-report pair.
  - `supabase/functions/README.md`: the July-era `WEBHOOK_THRESHOLD_NOTIFY_URL`
    / `WEBHOOK_THRESHOLD_NOTIFY_TOKEN` Line-Notify-era names → the DELIVERED
    P4.2 contract (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`, Authorization-
    header form, honest-dormant skip); the schedule section reflects the P4.4
    reality (pg_cron jobid=1 `notify-monthly-report` `'5 17 1 * *'` = 00:05 ICT
    on the 2nd) while stating notify-threshold itself stays invocation-based;
    + the ONE owner-runbook retry line (P4.4 ledger P3-1: a manually timed
    Function-URL re-invocation = the failed-month retry, `runMonthlyCycle`
    reads "now").
- **(c) The ledger P3s** — exactly per WO §2: the two P4.2 hardening fixes
  (marked-count honesty `index.ts:179` + the 429 bounded back-off), the P4.1
  CHANGELOG trail-line PR number (#241, inside the EXISTING v1.14.0 entry,
  never a new entry), the EF header-comment truth refresh (`index.ts:16-18`
  still says pg_cron/pg_net "not installed" — stale since P4.4), and every
  remaining item ruled LEAVE-WITH-LEDGER (WO §2 table) — inventoried, never
  silently swept in.

## 2. Lure traps (each excluded item needs its own NEW reviewed claim transition)

1. "Phase 5 is right there, do the cutover too" — OWNER-GATED, OUT.
2. "Fix the dormant Telegram channel by adding credentials" — ห้าม commit
   ทุกกรณี; the channel stays dormant; no token/secret literal anywhere.
3. "Refresh the P4.5 family reports while touching READMEs" — feature
   surfaces byte-untouched; the FULL frontend battery is the gate.
4. "Clean up the redundant cron grant / anon-JWT surface in a migration" —
   DB-side, LEAVE-WITH-LEDGER (WO §2); no opportunistic migrations.
5. "Widen the README rewrite into a product rebrand" — bounded truth only.
6. "Skip the live probe, the repo evidence is enough to ship the fix" — the
   pivot rule (§0.1) is binding; evidence-driven, no blind change.
7. "Bump to v1.15.1 since you touched the EF" — NO BUMP (WO §4): backend-only
   + docs, dormant channel; checker must stay `OK (v1.15.0)` exit 0.

## 3. Honesty pins (reviewer-pinned)

- unknown ≠ zero / missing ≠ fixed — a probe you cannot run is recorded
  UNVERIFIED, never asserted.
- Data honesty: the queue/marking behavior stays at-least-once (failures stay
  pending); the hardening fixes must NEVER fake a successful mark or drop a
  queued alert; `marked` semantics become honest or the mark error is surfaced.
- 429 handling: bounded, budget-capped, no unbounded blocking; `retry_after`
  honored between batch items without changing the pinned contract fields.
- No PHI: none exists in this chain; never route any patient data anywhere.
- Dates Thai พ.ศ. (+543) + Thai months anywhere user-facing text is touched.
- Secrets: `SUPABASE_ACCESS_TOKEN` and any credential never printed to chat,
  logs, or receipts; `.env`/`data/raw/` never committed.
- The P17 queue contract fields (`notified/failed/total/marked`) stay
  backward-compatible — additive honesty fields only, never silent removal.

## 4. D-phase plan (mirrors WO §5 — details there)

D1 live probe + rulings → D2 truthful RED (view-resolution regression +
hardening tests against the UNMODIFIED base; counts verbatim; legacy passes
disclosed) → D3 implement (scope ⊆ WO §7) → D4 battery (EF contract suite;
FULL vitest + tsc -b + oxlint + Playwright FULL workers=1; guard 344/344;
runtime 62/62; checker OK v1.15.0; git diff --check clean; 13-digit grep 0;
token/JWT-literal grep 0; EF deploy receipt ONLY if index.ts changed) →
D5 fresh-GLM → **STOP at REVIEW_REQUESTED**.

## 5. D1 pins (decide + record in this handoff before D2)

1. The live catalog + REST probe results (verbatim terminal/JSON receipts).
2. D1-2 the fix form ruling with its live evidence (schema-scoped client vs
   public façade; the mark-path resolution under the same ruling).
3. D1-3 the two hardening rulings (fix-with-tests recommended) + the back-off
   budget/cap constants, named.
4. D1-4 the README inventory (route-by-route diff vs `App.tsx` at the
   implementation head).
5. D1-5 the release ruling confirmation (NO BUMP).
6. D1-6 the ledger completeness check (WO §2, every row adjudicated).

## 6. Standing (unchanged by this lane)

Phase 5 คัทโอเวอร์ OWNER-GATED (dual-run ≥14 วัน per plan §6 P5.1 line 271 +
the 5-condition DoD line 276 — the owner's action); the dormant-channel OWNER
ACTIVATION runbook (Telegram credentials via `supabase secrets` + the vault
service_role secret); the owner sheet-shares for the SOURCE_UNAVAILABLE
masters; hooks #155 approved-not-started + #156 OPENROUTER_API_KEY renewal
(owner-manual); ENV-BUILDING-REPAIR-001-C1 WAITING_EXTERNAL.

## 7. D-phase log — implementation lane (2026-11-20, Track-Z GLM)

Implementation branch `feat/env-repair-p4-ledger-001` off the post-merge
main tip `3b8ee3692ade0f55ebe078afa1ba952989c997d4` (the merge SHA of the
claim-transition PR #252). STOP at REVIEW_REQUESTED — this lane NEVER
merges. All probes read-only except the idempotent migration apply +
rollback-scoped `begin; … rollback;` service_role emulations (zero durable
writes; queue table counts recorded unchanged). Secrets (`SUPABASE_ACCESS_TOKEN`,
`SUPABASE_ANON_KEY`) resolved from the Drive secrets env, never printed.

### D1 — live probe receipts (verbatim, 2026-11-20 ~04:5xZ)

Management-API SQL probes (read-only, PROJECT_REF `gllqtbyofrcjzmbnfoeh`):

- Catalog `pg_class ⋈ pg_namespace` for the two names → exactly:
  `[{public, threshold_alert, v}, {wastewater, threshold_alert, r},
  {wastewater, v_pending_threshold_alerts, v}]` — **`public.v_pending_threshold_alerts`
  ABSENT** (E6 confirmed), the queue view exists only in `wastewater` (E1).
- `select count(*) from wastewater.v_pending_threshold_alerts` → `0` (and
  `threshold_alert`: total 0 / pending 0 / notified 0) — the queue is EMPTY
  (the table was created 2026-07-18, after the 907-row migration; the
  trigger never fired for historical rows). Honest zero, not assumed.
- E7 restated live: `Accept-Profile: wastewater` REST probe →
  **`406 PGRST106` "Only the following schemas are exposed: public,
  graphql_public"** — `wastewater` is NOT REST-exposed.
- THE EF's exact failure, reproduced at the REST surface:
  `GET /rest/v1/v_pending_threshold_alerts?select=id&limit=1` (anon bearer)
  → **`404 {"code":"PGRST205","hint":"Perhaps you meant the table
  'public.threshold_alert'","message":"Could not find the table
  'public.v_pending_threshold_alerts' in the schema cache"}`** —
  `notify-threshold/index.ts` uses the default-schema client (E3/E4), so
  its `.from("v_pending_threshold_alerts")` resolves exactly here → 500.
  The mark path resolves (E5/E6): `GET /rest/v1/threshold_alert` →
  `401 42501 permission denied` (the façade resolves; security_invoker
  passes through to anon-denied underlying — the P1.7 house pattern).
- EF runtime state (no activations expected — dormant): live invoke →
  `200 {"skipped":true,"reason":"TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not
  set — channel dormant"}`; Management-API secrets NAMES only →
  `['SUPABASE_ANON_KEY','SUPABASE_DB_URL','SUPABASE_JWKS',
  'SUPABASE_PUBLISHABLE_KEYS','SUPABASE_SECRET_KEYS',
  'SUPABASE_SERVICE_ROLE_KEY','SUPABASE_URL']` — `TELEGRAM_*` NOT set;
  `vault.decrypted_secrets` → `[]` (no service_role secret — the cron job
  is equally dormant; owner-gated). Function logs endpoint → 404
  (`Cannot GET /v1/projects/…/functions/notify-threshold/logs`) — recorded
  UNAVAILABLE, not asserted.
- service_role privilege chain (has_*_privilege probes): `usage` on
  schema wastewater = **false**; select on
  `wastewater.v_pending_threshold_alerts` = **false**; select/update on
  `wastewater.threshold_alert` = **false**; select/update on the
  `public.threshold_alert` façade = **true** (Supabase default privileges
  in public). ⇒ even with a façade, the security_invoker chain needs
  explicit service_role grants.

**D1 rulings (WO §6):**

1. **D1-1:** E1–E8 CONFIRMED live; no contradiction; the pivot rule does
   NOT trigger. The bug is REAL: at owner activation the queue read would
   return the PGRST205 schema-cache error → the EF answers `500 {error}`
   before any send.
2. **D1-2 the fix form: ONE additive public façade migration.** The
   schema-scoped client is RULED OUT by live evidence (PGRST106:
   `wastewater` not in the exposed-schemas set — exactly what E7
   predicted); the façade preserves the EF's default-schema client
   unchanged. The mark path rides the existing `public.threshold_alert`
   façade. Migration:
   `supabase/migrations/20261120000001_repair_p4_ledger_queue_facade.sql`
   — `create or replace view public.v_pending_threshold_alerts with
   (security_invoker = on) as select * from
   wastewater.v_pending_threshold_alerts;` + the exact service_role grant
   chain (usage on wastewater; select on the wastewater queue view;
   select+update on wastewater.threshold_alert; select on the façade).
   NO anon/authenticated grant: the façade is the EF's work queue, not a
   user surface (P4.4 P3-2 posture kept).
3. **D1-3 both hardenings FIX-WITH-TESTS.** marked-count: `count: "exact"`
   RETURNING — `marked` = rows the mark UPDATE actually affected (never
   `notifiedIds.length`); a mark failure surfaces an additive `markError`
   (legacy `{notified, failed, total, marked}` preserved; never fake
   success). 429 back-off: `RETRY_AFTER_MAX_SECONDS = 30` (per-wait cap) +
   `BACKOFF_BUDGET_SECONDS = 60` (per-invocation budget) via the pure
   `computeBackoffDelayMs(retryAfterSeconds, remainingBudgetMs)`, awaited
   between batch items after a 429; budget exhausted → logged + no further
   waits (failed sends stay queued; at-least-once preserved; never
   unbounded blocking).
4. **D1-4 README bounds:** Pages list re-verified against
   `frontend/src/App.tsx` at the implementation head — the ten parity
   routes were missing exactly as the WO lists; the version chip is
   `fixed bottom-2 left-2` in the app shell (`VersionChip.tsx:14`, rendered
   from `AppShell.tsx:169`) — the "footer corner" wording was stale;
   root README's migration example said `db/migrations/`; the functions
   README still carried the Line-Notify-era `WEBHOOK_THRESHOLD_NOTIFY_*`
   names and a pre-pg_cron schedule section (both refreshed; the legacy
   names are omitted, never presented as live).
5. **D1-5:** NO BUMP confirmed — backend (dormant EF + façade migration)
   + docs only; `check_release_version.py` stays `OK (v1.15.0)` exit 0
   (D4 receipt below); no version strings touched anywhere.
6. **D1-6 ledger completeness:** every WO §2 row adjudicated — the two
   P4.2 hardenings + (a) + README×2 + CHANGELOG trail-line + the §0.2
   comment rider are FIXED in this lane; every LEAVE-WITH-LEDGER row stays
   untouched (no silent sweeps; `pdf.ts`, `notify-monthly-report/**`,
   `ingest-sensor/**`, DB-side cron-grant cleanup all out of scope).

### D2 — truthful RED (verbatim counts)

Suite `scripts/test_parity_p4_002_notify.py` extended with group 3
(3a–3g, written RED against the UNMODIFIED base + unapplied DB), then:

```
6 failed, 11 passed in 4.27s
FAILED …::test_3a_public_queue_facade_exists          (façade absent — live)
FAILED …::test_3b_service_role_queue_read_resolves    (42P01 relation does not exist — live)
FAILED …::test_3c_service_role_grant_chain            (all false — live)
FAILED …::test_3d_full_path_emulation_rollback_scoped (42P01 — live)
FAILED …::test_3e_ef_marked_count_returning_source_pin (no count:"exact" — source)
FAILED …::test_3f_ef_backoff_bounded_source_pin       (constants missing — source)
```

Legacy groups 1a–1f + 2a–2d and the pure mirror 3g = the 11 disclosed
standing passes (P2.4 P3-1 convention). `git diff --check` clean at RED.

### D3 — implementation + apply + deploy receipts (verbatim)

- Migration applied via the house path
  `uv run python scripts/apply_migration_api.py supabase/migrations/20261120000001_repair_p4_ledger_queue_facade.sql`
  → `Done: 8 OK, 0 FAIL` (final statement list: create-or-replace view +
  6 grants + `notify pgrst, 'reload schema'`; idempotent re-apply after the
  D3 discovery below). First apply was 6 OK 0 FAIL.
- **Mid-GREEN discovery (evidence-based, no silent expansion):** the
  rollback-scoped service_role emulation failed `42501: permission denied
  for schema core` — `wastewater.threshold_alert` carries
  `trg_audit_log → core.fn_audit_log` (SECURITY INVOKER, owner postgres),
  which INSERTs into `core.audit_log` AS THE INVOKER; service_role had no
  core grants, so EVERY mark UPDATE — on any audited table — would fail
  and rows would queue forever. The migration was supplemented (same ONE
  file, WO §7 "+ grants") with the exact write path only:
  `grant usage on schema core to service_role; grant insert on
  core.audit_log to service_role;` (no read/update/delete on audit
  history). Live trigger census receipt: audit triggers exist in
  building/carbon/chemical(2)/core(6)/food/fuel/garbage/garden/safety/
  wastewater(2)/water_supply. **Honest adjacent observation, NOT touched
  (not this lane's scope):** `wastewater.reading` carries the same audit
  trigger, so `ingest-sensor`'s service_role INSERTs would hit the same
  42501 until a successor lane grants the audit chain there too.
- EF `notify-threshold` redeployed (index.ts changed: hardening + comment
  truth) via the P4.4 house path:
  `npx supabase functions deploy notify-threshold --project-ref
  gllqtbyofrcjzmbnfoeh --use-api --yes` → `Deployed Functions on project
  gllqtbyofrcjzmbnfoeh: notify-threshold`; `functions list` →
  `notify-threshold | ACTIVE | VERSION 2 | 2026-11-20 05:01:38` /
  `notify-monthly-report | ACTIVE | VERSION 1 | 2026-11-20 00:20:34`
  (byte-untouched). `SUPABASE_ACCESS_TOKEN` resolved from the Drive env,
  never printed.

### Live before/after (verbatim)

- BEFORE (D1): view-path REST → `404 PGRST205 …Could not find the table
  'public.v_pending_threshold_alerts' in the schema cache` (the EF's
  failure); suite RED.
- AFTER (D3): view-path REST (anon) → `401 42501 permission denied for
  view v_pending_threshold_alerts` — the view now RESOLVES in the schema
  cache (permission-denied, not not-found; the E7 house pattern).
  Suite GREEN 17/17. Live EF invoke post-deploy →
  `200 {"skipped":true,"reason":"TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not
  set — channel dormant"}` — the dormant contract unchanged, now backed
  by a HEALTHY queue read path: the suite's rollback-scoped
  `set local role service_role` emulation read the façade, marked the
  probe row through the `public.threshold_alert` façade (RETURNING
  semantics: exactly 1 row), watched it leave the pending view, and
  rolled back with the queue table count unchanged (0→0).

### D4 — battery (final head `3b6ccfa`, verbatim counts)

- EF contract suite `scripts/test_parity_p4_002_notify.py`: **17 passed**
  (GREEN after D3; RED record 6 failed / 11 passed above)
- Guard: `python3 -m pytest scripts/test_env_coordination_guard.py -q` →
  **344 passed, 450 subtests passed**
- Runtime: `python3 -m pytest scripts/test_env_autonomy_runtime.py -q` →
  **62 passed, 32 subtests passed**
- Release checker: `python3 scripts/check_release_version.py` →
  `RELEASE VERSION CHECK: OK (v1.15.0; CHANGELOG entry v1.15.0)` exit **0**
  — the §4 NO BUMP ruling holds (no version strings touched)
- `git diff --check 3b8ee36..HEAD` → **clean**
- Exact-13-digit grep over the full diff → **0 hits**; token/JWT-literal
  grep (`bot\d{5,}:…` / `eyJ…`) → **0 hits**
- Diff vs base `3b8ee36` = **exactly the 8 claimed files**
  (CHANGELOG.md, README.md, the lane handoff, the WO,
  scripts/test_parity_p4_002_notify.py, supabase/functions/README.md,
  supabase/functions/notify-threshold/index.ts,
  supabase/migrations/20261120000001_repair_p4_ledger_queue_facade.sql);
  `docs/ai/CURRENT-WORK.md` byte-untouched (deviation 3 below)
- Frontend: `tsc -b` exit 0; `oxlint` 0 errors exit 0 (pre-existing
  warnings only); **vitest FULL 53 files: 990 passed / 1 skipped**;
  **Playwright FULL chromium workers=1: 335/335 passed** (first run:
  334 passed + 1 flake — `garbage-mobile.spec.ts:186`, the load-flake the
  P4.5 ledger already recorded; isolated re-run 9/9; the confirmation
  FULL run passed 335/335 clean)
- Worktree-environment note (disclosed): the fresh worktree lacked the
  gitignored machine-local `frontend/.env` — vitest's first run failed
  7 suite collections (`Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY`)
  + 2 water-supply tests; after copying the main checkout's gitignored
  `.env` into the worktree (never committed), FULL vitest passed 990/1.
  Zero frontend code edits in this lane (the diff proves it).

### Deviations (all disclosed, none silent)

1. The migration grew from 6 to 8 statements mid-lane (the audit-chain
   grants) — evidence-based (the 3d emulation receipt above), same ONE
   claimed file, grants were already within the D1-2 façade form.
2. The 3d probe's own SQL was fixed mid-lane: its first version counted
   `pending_after` inside the data-modifying-CTE statement, where all
   parts see the statement-start snapshot (always 1). The fix moved the
   post-mark count to a separate statement in the same rollback-scoped
   transaction; the test's SEMANTICS are unchanged and it was RED before
   the fix (42P01) and is GREEN after. Recorded per honesty pins.
3. `docs/ai/CURRENT-WORK.md` is listed in WO §7 but is left BYTE-UNTOUCHED
   (the registry claim stays CLAIMED — the closeout is a separate reviewed
   transition; same convention as the ENV-FLEET-ROUTER implementation lane
   whose CURRENT-WORK diff was EMPTY). `validate-registry` stays ok:true.
4. supabase CLI emits a deprecation warning for `--project-ref` (v4 will
   rename it); deploy succeeded — cosmetic, recorded.
