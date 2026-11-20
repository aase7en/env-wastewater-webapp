-- ENV-PARITY-P4-004 C1 — monthly ทส.1/ทส.2 report-ready automation (AppSheet
-- parity Phase 4 lane P4.4). THE ONE claimed migration of this lane.
--
-- THE HONESTY PIN (WO §0): reference 12 §9 records ZERO scheduled AppSheet
-- bots — the monthly cadence is the reports' operational cadence, and this
-- month-boundary trigger is the documented ENV-new divergence (an honest
-- improvement AppSheet never had), never schedule parity of a nonexistent
-- schedule. No data-rollover job is created here.
--
-- Contents (WO §3 — nothing beyond §2/§3):
--   1. Enable pg_cron + pg_net (guarded; the P4.2 D5 finding: AVAILABLE but
--      NOT INSTALLED on ENV_DB — pg_cron 1.6.4 / pg_net 0.20.3).
--   2. public.monthly_report_cycle — the monthly-cycle state table: one row
--      per covered month (month_key 'YYYY-MM' PK), status CHECK
--      ('pending'|'sent'|'skipped', default 'pending'), the honesty CHECK
--      notified_at set exactly when status='sent' (mark-on-success-only
--      queue honesty; pending cycles stay retryable; a retried month never
--      silently duplicates a sent notice), reason (why skipped/failed),
--      provenance (who recorded the row), timestamps. RLS enabled with NO
--      policies — fail-closed; the Edge Function path uses the service role
--      (bypasses RLS); there is no anon surface. No seed rows are inserted
--      (unknown ≠ zero — no retroactive cycle rows for months before
--      activation; the schedule starts from its activation month).
--   3. cron.schedule 'notify-monthly-report' — idempotent (unschedule-first
--      guard), posting net.http_post to the notify-monthly-report Edge
--      Function on the ICT-pinned monthly boundary:
--
--        5 17 1 * *  (UTC, Supabase DB timezone = UTC)
--        = 17:05 UTC on the 1st
--        = 00:05 ICT on the 2nd  (ICT = UTC+7 — the ICT clock is AHEAD)
--
--      A literal "00:05 ICT on the 1st" would need 17:05 UTC on the
--      PREVIOUS month's last day, which vixie cron cannot express (no L
--      field). The pinned cycle point 00:05 ICT on the 2nd is ≥24h inside
--      the new month, so the covered month = the PREVIOUS calendar month
--      (ICT) is unambiguous and day-1 readings have all landed. (The
--      instruction-quoted 5 18 1 * * = 01:05 ICT on the 2nd failed
--      conversion verification and was rejected.)
--
--      Auth: the EF keeps the platform JWT gate (verify_jwt default TRUE —
--      the house convention: ingest-sensor's "callers must present the
--      service_role key (set as the bearer)", notify-threshold's README
--      anon-bearer manual test). The cron command reads the bearer from
--      vault.decrypted_secrets (name = 'service_role') AT EXECUTION TIME —
--      the Supabase-documented cron→EF pattern — so NO key literal is
--      committed here. OWNER ACTIVATION (one-time, documented in
--      supabase/functions/README.md):
--        select vault.create_secret('<service-role-key>', 'service_role');
--        supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
--      Until then the job fires, the bearer is empty, the JWT gate returns
--      401, nothing is sent and no state row is written — honest dormant,
--      retried next month.
--
-- Preflight receipts (run before apply, recorded in the handoff): extension
-- availability re-check, name-collision check, zero-DML-on-user-data grep.
-- Rollback (documented, not applied by this migration):
--   select cron.unschedule('notify-monthly-report')
--     where exists (select 1 from cron.job where jobname='notify-monthly-report');
--   drop table if exists public.monthly_report_cycle;
--   drop extension if exists pg_net;   -- drops in-flight pg_net requests
--   drop extension if exists pg_cron;

create extension if not exists pg_cron;

create extension if not exists pg_net;

grant usage on schema cron to postgres;

grant all privileges on all tables in schema cron to postgres;

create table if not exists public.monthly_report_cycle (
  month_key text not null primary key,
  status text not null default 'pending'
    constraint monthly_report_cycle_status_check
    check (status in ('pending', 'sent', 'skipped')),
  reason text,
  notified_at timestamptz,
  provenance text not null default 'pg_cron',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_report_cycle_honesty_check
    check ((status = 'sent') = (notified_at is not null))
);

comment on table public.monthly_report_cycle is
  'ENV-PARITY-P4-004 — monthly ทส.1/ทส.2 report-ready cycle state: one row '
  'per covered month (month_key = YYYY-MM, previous calendar month ICT); '
  'notified_at is marked on SUCCESS only (queue honesty); skipped/failed '
  'cycles stay retryable; no retroactive rows for pre-activation months.';

alter table public.monthly_report_cycle enable row level security;

-- No RLS policy is created: fail-closed by construction. The monthly EF
-- reaches this table with the service role (bypasses RLS); staff/anon have
-- no surface.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify-monthly-report') then
    perform cron.unschedule('notify-monthly-report');
  end if;
end
$$;

select cron.schedule(
  'notify-monthly-report',
  '5 17 1 * *',
  $$
  select
    net.http_post(
      url := 'https://gllqtbyofrcjzmbnfoeh.functions.supabase.co/notify-monthly-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(
          (select decrypted_secret from vault.decrypted_secrets where name = 'service_role'),
          ''
        )
      ),
      body := '{"provenance":"pg_cron"}'::jsonb
    ) as http_response;
  $$
);
