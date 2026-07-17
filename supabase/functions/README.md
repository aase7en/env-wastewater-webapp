# Supabase Edge Functions — env-wastewater-webapp

These run on Supabase's free Edge Function tier (Deno + TypeScript, 500k
invocations/month free). They are NOT part of the GitHub Pages frontend
deployment — they live in Supabase.

## notify-threshold

Sends pending threshold alerts (DO < 2.0 / Cl < 0.5 / pH 6.5–8.5) to
Line Notify or Telegram.

**Required env / Vault secrets:**
- `SUPABASE_URL` — auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — auto-set
- `WEBHOOK_THRESHOLD_NOTIFY_URL` — full URL (Line Notify: `https://notify-api.line.me/api/notify`, Telegram: `https://api.telegram.org/bot<TOKEN>/sendMessage`)
- `WEBHOOK_THRESHOLD_NOTIFY_TOKEN` — Line Notify bearer token (omit for Telegram — token is in the URL)
- `TELEGRAM_CHAT_ID` — required only if using Telegram

**Schedule it** (one of):
- pg_cron in SQL: `SELECT cron.schedule('notify-threshold', '* */1 * * *', $$SELECT net.http_post(...)$$);` — see supabase/migrations/20260718000001_p17_threshold_alerts.sql for the staging table; the schedule itself is a follow-up chunk.
- External cron hitting the Function URL with the anon key
- GitHub Actions cron (workflow_dispatch + on: schedule)

**Deploy:**
```bash
supabase login
supabase functions deploy notify-threshold --project-ref gllqtbyofrcjzmbnfoeh
supabase secrets set WEBHOOK_THRESHOLD_NOTIFY_URL=... WEBHOOK_THRESHOLD_NOTIFY_TOKEN=...
```

**Manual test:**
```bash
curl -X POST https://gllqtbyofrcjzmbnfoeh.functions.supabase.co/notify-threshold \
  -H "Authorization: Bearer <anon-key>"
# {"notified":0} when no pending alerts
```

**How the staging table fills:**
A BEFORE INSERT trigger on `wastewater.reading` calls
`wastewater.fn_check_thresholds(new.id)` and writes each violation into
`wastewater.threshold_alert`. Rows stay in the queue until `notified_at`
is set (this Function does that after a successful webhook send).
