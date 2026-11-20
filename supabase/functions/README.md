# Supabase Edge Functions — env-wastewater-webapp

These run on Supabase's free Edge Function tier (Deno + TypeScript, 500k
invocations/month free). They are NOT part of the GitHub Pages frontend
deployment — they live in Supabase. Deployed pair: `notify-threshold` and
`notify-monthly-report`.

## notify-threshold

Sends pending threshold alerts (DO < 2.0 / Cl < 0.5 / pH 6.5–8.5) from
`wastewater.v_pending_threshold_alerts` to **Telegram** (one Thai/พ.ศ.
message per alert, batch limit 50, pending-ASC order). Failed sends stay
queued — at-least-once delivery, never dropped.

**Required env (Supabase secrets — set by the owner, never in the repo):**
- `SUPABASE_URL` — auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — auto-set
- `TELEGRAM_BOT_TOKEN` — bot token from @BotFather
- `TELEGRAM_CHAT_ID` — destination chat/channel id

Until both `TELEGRAM_*` secrets are set the function is honest-dormant: it
answers `{"skipped":true,…}` before touching the queue. Sends use the
Authorization-header Bot API form — the token never rides in a URL.

**Queue + mark paths (as deployed):** the queue read resolves via the
public façade view `public.v_pending_threshold_alerts`
(`supabase/migrations/20261120000001_repair_p4_ledger_queue_facade.sql`;
the source view lives in schema `wastewater`, which PostgREST does not
expose). Successful sends mark `notified_at` through the
`public.threshold_alert` façade; the response's `marked` field reports only
rows that UPDATE actually affected (a mark failure surfaces an additive
`markError` and leaves the rows queued).

**Schedule:** none — this function is invocation-based by design (call it
from any scheduler once credentials are active). The pg_cron schedule
installed on ENV_DB drives `notify-monthly-report`, not this function.

**Deploy:**
```bash
supabase login
supabase functions deploy notify-threshold --project-ref gllqtbyofrcjzmbnfoeh
supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
```

**Manual test:**
```bash
curl -X POST https://gllqtbyofrcjzmbnfoeh.functions.supabase.co/notify-threshold \
  -H "Authorization: Bearer <anon-key>"
# {"skipped":true,…} while credentials are unset (honest-dormant);
# {"notified":0} once credentials are set and no alerts are pending.
```

**How the queue fills:**
An AFTER INSERT trigger on `wastewater.reading`
(`wastewater.fn_persist_threshold_alerts`) calls
`wastewater.fn_check_thresholds(new.id)` and writes each violation into
`wastewater.threshold_alert`. Rows stay in the queue until `notified_at`
is set (this Function does that after a successful Telegram send).

## notify-monthly-report

Monthly ทส.1/ทส.2 report pusher. Driven by pg_cron on ENV_DB: cron job
`notify-monthly-report`, schedule `'5 17 1 * *'` (UTC) = **00:05 ICT on the
2nd** of each month (jobid=1; installed 2026-11 by P4.4, PR #247). The
covered month = the previous calendar month in ICT; cycle state lives in
`public.monthly_report_cycle` (sent/pending/skipped + notified_at honesty
CHECK). Env contract mirrors `notify-threshold`: unset `TELEGRAM_*`
secrets → honest `{"skipped":true,…}` before any state work. The cron's
Bearer comes from `vault.decrypted_secrets where name = 'service_role'` at
execution time (owner activation = one `select vault.create_secret(
'<service-role-key>', 'service_role')` alongside the Telegram secrets).

**Failed-month retry (owner runbook):** a failed send keeps its month
honestly `pending`; the automatic retry is the next monthly fire — to retry
sooner, re-invoke the Function URL manually (same anon-bearer curl form as
above) at a chosen time; `runMonthlyCycle` reads "now", so re-invoke while
still inside the calendar month that follows the failed cycle (a later
re-invocation covers the then-previous month instead).
