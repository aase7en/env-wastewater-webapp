# Work Order — ENV-REPAIR-P4-LEDGER-001 (Claim ENV-REPAIR-P4-LEDGER-001-C1, gen 1)

Post-Phase-4 quality repair sweep — ONE lane sweeping the P4.5 closeout frontier's
NON-OWNER REPAIR-LANE CANDIDATES **(a) + (b) + (c)**: the P4.2 wastewater-view
resolution investigation/fix, the README truth refresh, and the ledger P3s.
NO Phase 5. NO feature surfaces. NO CI.

## 0. Lane identity — the frontier candidates pinned VERBATIM (PR #251 closeout frontier, base `97764e2`)

> NON-OWNER REPAIR-LANE CANDIDATES (optional, each its own NEW reviewed claim
> transition, no silent fix): (a) the P4.2 wastewater-view repair candidate —
> wastewater.v_pending_threshold_alerts exists in schema wastewater while
> notify-threshold/index.ts:142 reads it via the default-schema supabase-js
> client (the P4.4 D5-confirmed REAL finding, carried); (b) README staleness —
> the Pages list lacks the parity-delivered routes (masters/manuals/address/
> job-log etc.) and the migration example path says db/migrations/ while the
> house path is supabase/migrations/; (c) the ledger P3s carried across lanes.

### 0.1 Investigation record (repo-side evidence at base — LIVE re-verification still REQUIRED at implementation D1)

| # | Evidence | File:line | Fact |
|---|----------|-----------|------|
| E1 | The queue view is created in `wastewater` | `supabase/migrations/20260718000001_p17_threshold_alerts.sql:62` | `CREATE OR REPLACE VIEW wastewater.v_pending_threshold_alerts` |
| E2 | The mark table is `wastewater.threshold_alert` | same migration `:18` | `CREATE TABLE IF NOT EXISTS wastewater.threshold_alert` |
| E3 | The EF client is default-schema supabase-js | `supabase/functions/notify-threshold/index.ts:132` | `createClient(url, serviceKey)` — NO `db: { schema }` option ⇒ PostgREST `Accept-Profile: public` |
| E4 | The queue read resolves via that client | `index.ts:141-144` | `.from("v_pending_threshold_alerts")` ⇒ `public.v_pending_threshold_alerts` |
| E5 | The mark path resolves via that client | `index.ts:171-174` | `.from("threshold_alert").update({ notified_at })` |
| E6 | NO `public.v_pending_threshold_alerts` façade exists | `supabase/migrations/20260719000010_schema5_rest_exposure.sql:41-45` | façades created for `reading/sensor/sensor_reading/threshold_alert/carbon_reading` only — the queue view is NOT among them; no later migration adds one |
| E7 | PostgREST exposes `public` only (house precedent) | the P1.7 façade-lane record (PR #202 chain) | the `public.v_reading_critical_flags` façade was REACHABLE (PG 42501 under security_invoker, anon) — not PGRST205 — proving `wastewater` is not in the exposed-schemas set for the REST surface |
| E8 | Independent confirmation the mismatch is REAL | P4.4 D5 APPROVED issuecomment-7027119917, deviation (e) | "the latent P4.2 view mismatch independently confirmed REAL" |

**Working conclusion:** the EF genuinely cannot see the queue — at owner
activation the queue read returns the PostgREST schema-cache error (PGRST205
class) and the function answers `500 {error}` before any send; the mark path
relies on the schema5 `public.threshold_alert` façade view (auto-updatable
simple `select *`), whose UPDATE behavior under service_role has never been
exercised live. **This is evidence-based, not blind change:** the live
catalog + REST probe at implementation D1 must CONFIRM before any fix; if the
live probe contradicts E1–E8 (resolution fine), the lane pivots to
document-why + a regression pin-test with `index.ts` code-untouched.

### 0.2 The stale-schedule-comment rider (docs-side, inside the claimed EF file)

`index.ts:16-18` still says "pg_cron/pg_net are not installed on ENV_DB" —
stale since P4.4 (PR #247) installed them and shipped the monthly cron
(`cron.job` jobid=1 `notify-monthly-report` `'5 17 1 * *'` = 00:05 ICT on the
2nd; notify-threshold itself remains invocation-based by design). Comment-only
truth refresh, rides the same claimed file.

## 1. Authorization basis

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้").
2. Owner instruction 2026-11-19 "งานของฉันค้างไว้ก่อน ให้ทำงานอื่นที่เหลือก่อน"
   (proceed with the remaining non-owner work; the owner's own pending items
   stay parked).
3. **The P4.5 closeout frontier** (PR #251 merged as `97764e2` = this base)
   explicitly naming candidates (a)/(b)/(c) as the non-owner successor work,
   "each its own NEW reviewed claim transition, no silent fix" — THIS claim IS
   that transition (one lane sweeping a+b+c, scoped in §2/§7).
4. The P4.4 D5 independent confirmation (issuecomment-7027119917) + the P4.2
   D5 ledger (issuecomment-7019648574) + the P4.1/P4.4/P4.5 handoff D6 ledgers.

## 2. The ledger inventory — every carried P3 adjudicated (none silently dropped)

| Item | Source | Ruling | Where it lands |
|------|--------|--------|----------------|
| (a) wastewater-view mismatch (E1–E8) | P4.4 P3-4 / P4.5 frontier (a) | **INVESTIGATE → FIX** (schema-scoped client or ONE public façade migration, D1-2 decides on live evidence; mark path fixed by the same ruling) | implementation D1–D3 + regression test |
| P4.2 P3-1 marked-count warn-only overstatement (`index.ts:179` reports `marked: notifiedIds.length` even when the `notified_at` UPDATE failed — `:175` warns only; queue stays safe) | P4.2 D5 ledger | **TINY HARDENING FIX** (minimal honest fix WITH tests: surface the mark error honestly in the response payload — e.g. a `markError` field / honest `marked` semantics; never fake success) | implementation D2 RED + D3 |
| P4.2 P3-2 429 no batch back-off (`retry_after` surfaced but the send loop continues immediately) | P4.2 D5 ledger | **TINY HARDENING FIX** (minimal: honor `retry_after` with a bounded wait between batch items; cap + budget semantics pinned at D1-3; never block unbounded) | implementation D2 RED + D3 |
| P4.2 P3-3 2-vs-4-files prose staleness | P4.2 D5 ledger | NO ACTION — already RECONCILED by the P4.2 D6 | — |
| P4.1 P3-1 CHANGELOG v1.14.0 trail line cites "PR ของ ENV-PARITY-P4-001" without the PR number | P4.1 D6 ledger | **DOC-SIDE FIX** (cite PR #241 inside the EXISTING v1.14.0 entry; never a new entry, never a bump) | implementation D3 |
| P4.1 P3-2 file-count prose | P4.1 D6 ledger | NO ACTION — already RECONCILED by the P4.1 D6 | — |
| P4.1 P3-3 ทส.1 ORDERBY micro-divergence (template sorts daily rows DESC; view renders ASC — zero data impact) | P4.1 D6 ledger | **LEAVE-WITH-LEDGER** (optional successor visual micro-lane; `pdf.ts` NOT in claimed scope — no silent expansion) | stays on the ledger |
| P4.1 carry: jspdf Thai-font doc-comment inaccuracy (`pdf.ts:5-6` claims a bundled Sarabun base64 never wired) | P4.1 D6 | **LEAVE-WITH-LEDGER** (`pdf.ts` NOT in claimed scope; disclosure retained) | stays on the ledger |
| P4.4 P3-1 failed-month retry gap (`notify-monthly-report` keeps a failed send honestly `pending`; auto-retry only at next monthly fire) | P4.4 D5 ledger | **DOC-SIDE FIX** (one owner-runbook line in `supabase/functions/README.md`: a manually timed Function-URL re-invocation = the retry, `runMonthlyCycle` reads "now") + the day-2 ICT cron record restated in the runbook | implementation D3 |
| P4.4 P3-2 post-activation anon-JWT surface | P4.4 D5 ledger | **LEAVE-WITH-LEDGER** (matches the house anon-bearer convention; informational) | stays on the ledger |
| P4.4 P3-3 redundant cron-schema grant (migration `:69`) | P4.4 D5 ledger | **LEAVE-WITH-LEDGER** (harmless; postgres owns the cron schema; a DB-side cleanup migration is NOT docs-sweep material) | stays on the ledger |
| P4.5 P3-informational trio (WATER_COLUMNS 2-string fidelity option; garbage-mobile load-flake note; E2E_BASE_URL RED-reproduction note) | P4.5 D5 | **LEAVE-WITH-LEDGER** (recorded in the P4.5 handoff; informational) | stays on the ledger |
| Older carries: fetchMeterChainBefore same-day edge; checker vSemVer false-positive mode; mobile-360 dock-overlap pin; P2.5 e2e header-comment staleness; the vacuous anon probe re-raise note; docs-precision nits | P1.4/P1.7-versioning/DT/N2/P2.4/P3.6 D5 ledgers | **LEAVE-WITH-LEDGER** (inventoried here per frontier (c); each judged on its own merits in a successor lane — never silently swept in) | stay on the ledger |
| README staleness — root `README.md`: `db/migrations/` example path (line 71) vs the house `supabase/migrations/`; the Pages list missing the parity routes (`/safety/extinguisher-inspections`, `/safety/emergency-light-checks`, `/safety/job-log`, `/admin/equipment-specs`, `/admin/extinguishers`, `/admin/inventory`, `/admin/calibration`, `/admin/masters`, `/admin/manuals`, `/admin/address` — verified against `frontend/src/App.tsx` at base); the version-chip "footer corner" wording vs the delivered shell chip | P4.5 frontier (b) | **DOC-SIDE FIX** (bounded truth refresh; NO rebrand, NO invented features; re-verify the Pages list against `App.tsx` at the IMPLEMENTATION head) | implementation D3 |
| `supabase/functions/README.md` — the July-era `WEBHOOK_THRESHOLD_NOTIFY_URL`/`WEBHOOK_THRESHOLD_NOTIFY_TOKEN` Line-Notify-era env names vs the delivered `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` Authorization-header contract (P4.2 finding); the schedule section predates the P4.4 pg_cron reality | P4.2 finding / frontier (b) | **DOC-SIDE FIX** (truth refresh to the delivered P4.2 contract + the P4.4 schedule reality + the P4.4 retry runbook line) | implementation D3 |

## 3. Out-of-scope guards (lure traps — each excluded item needs its own NEW reviewed claim transition)

1. **Phase 5 cutover of any kind** — dual-run, backfill, AppSheet retirement:
   OWNER-GATED (the owner's action), never this lane.
2. **Feature surfaces** — every delivered frontend page/lib byte-untouched;
   the FULL frontend battery is the no-regression gate.
3. **CI** — `.github/**` untouched; no new workflows.
4. **Reference/plan docs** — `APPSHEET-PARITY-PLAN.md`, reference 12, AGENTS.md,
   design docs: read-only.
5. **The frozen P4.2 dispatcher contract** is NOT frozen against REPAIR here —
   it was frozen during P4.4 to keep that lane's diff clean; THIS lane may
   touch `supabase/functions/notify-threshold/` ONLY per D1-1/D1-2 (fix +
   adjudicated hardening + comment truth). `notify-monthly-report/**` and
   `ingest-sensor/**` stay byte-untouched.
6. **The Telegram channel stays dormant** — no credentials are created,
   read, committed, or printed (ห้าม commit ทุกกรณี, owner B5). The EF suite's
   no-token-literal guard must stay green.
7. **No blind schema change** — the (a) fix form ships ONLY after the live
   D1 probe confirms the repo conclusion; a contradiction pivots to pin-test.
8. **No release bump** — §4.

## 4. Release decision — NO BUMP (D1-5 recommends; reviewer confirms)

**v1.15.0 STAYS, no tag, no new CHANGELOG entry.** Justification: the (a)/(b)/(c)
deliverables are backend-only (a dormant Edge Function + optional façade
migration) + docs — no user-visible frontend change; this mirrors the P4.2
D1-6 dormant-channel ruling and the P3.6 test-only ruling. The CHANGELOG touch
edits prose INSIDE the existing v1.14.0 entry (the trail-line PR number) and
must never alter version strings; `check_release_version.py` must stay `OK
(v1.15.0)` exit 0 at the implementation head.

## 5. D-phase plan (Track-Z GLM)

- **D1 — live evidence + rulings:** the catalog probe (`pg_views` /
  `information_schema` for `v_pending_threshold_alerts` + `threshold_alert` in
  both schemas; service_role privileges) + the REST profile probe; the fix-form
  ruling (D1-2); the hardening rulings (D1-3); the README inventory re-verified
  against `frontend/src/App.tsx` at the implementation head; the release ruling
  confirmation (D1-5). Probe failure/contradiction = pivot per §0.1.
- **D2 — truthful RED:** the view-resolution regression test + the hardening
  tests against the UNMODIFIED base behavior (counts verbatim; legacy passes
  disclosed per the P2.4 P3-1 convention). Under the pivot ruling: the
  pin-test ships failing-or-pinning per the true resolution and D3 makes NO
  code change.
- **D3 — implement:** the adjudicated fix form + the adjudicated hardening
  fixes + the two README refreshes + the CHANGELOG trail-line fix + the EF
  header-comment truth refresh (§0.2). Scope ⊆ §7.
- **D4 — battery:** the EF contract suite (`scripts/test_parity_p4_002_notify.py`,
  extended only for shipped changes); FULL vitest + `tsc -b` + oxlint +
  Playwright FULL chromium workers=1 (no-regression gate); guard 344/344;
  runtime 62/62; checker `OK (v1.15.0)` exit 0; `git diff --check` clean;
  13-digit grep 0; token/JWT-literal grep 0; diff vs base ⊆ §7. EF deploy
  receipt ONLY if `index.ts` changed (`functions deploy notify-threshold` per
  README; `SUPABASE_ACCESS_TOKEN` never printed).
- **D5 — fresh-GLM independent review** at the exact frozen head.
- **STOP at REVIEW_REQUESTED** — implementer never merges.

## 6. D1 adjudication items (reviewer)

- **D1-1 the investigation ruling (THE adversarial item):** does the live
  evidence confirm E1–E8 (the EF cannot see the queue) or contradict it
  (resolution fine)? The pivot rule of §0.1 is binding either way; no blind fix.
- **D1-2 the fix form:** schema-scoped client
  (`createClient(url, key, { db: { schema: "wastewater" } })` — 1-line, fixes
  BOTH the queue read and the mark path) vs ONE additive public façade
  migration (`public.v_pending_threshold_alerts with (security_invoker=on)` +
  grants, per the schema5/P1.7 house precedent — the mark path then rides the
  existing `public.threshold_alert` façade). Decided on live evidence
  (incl. whether `wastewater` is reachable via the REST profile for
  service_role; E7 suggests it is NOT, which favors the façade form). Either
  form ships with the regression test + live before/after probes recorded.
- **D1-3 the two hardening P3s:** marked-count honesty + 429 bounded back-off
  — FIX-WITH-TESTS recommended (minimal, dormant-channel risk ≈ 0) or
  honest LEAVE-WITH-LEDGER with justification; decide at D1, never both-neither.
- **D1-4 README truth bounds:** no rebrand; every route/env/path claim in the
  refreshed READMEs verified against the repo at the implementation head; the
  env-name section must name the DELIVERED contract only (`TELEGRAM_*`;
  the Line-Notify-era `WEBHOOK_THRESHOLD_NOTIFY_*` names never presented as live).
- **D1-5 the release ruling:** NO BUMP per §4 (adversarial check: any
  user-visible behavior change that would force PATCH — the expected answer is
  none; the channel is dormant until owner activation).
- **D1-6 the ledger completeness:** §2 above — every item FIXED / DOC-SIDE /
  LEAVE-WITH-LEDGER with its justification; none silently dropped.

## 7. Registry-scope summary (mirrors the CURRENT-WORK claim append)

Claimed: `supabase/functions/notify-threshold/index.ts` + its test script
`scripts/test_parity_p4_002_notify.py` + (conditionally, per D1-2) ONE additive
`supabase/migrations/` façade file + `README.md` + `supabase/functions/README.md`
+ `CHANGELOG.md` (trail-line only, no bump) + this lane's WO/handoff +
`docs/ai/CURRENT-WORK.md`. Everything else FORBIDDEN (§3).
