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
