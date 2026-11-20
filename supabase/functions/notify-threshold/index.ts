// P17/P4.2 — notify-threshold Edge Function (Deno, runs on Supabase).
//
// ENV-PARITY-P4-002 (AppSheet parity Phase 4 lane P4.2, owner B5: Telegram)
// — Telegram dispatcher for wastewater.v_pending_threshold_alerts:
// periodically invoked, polls pending threshold alerts ASC (batch limit 50),
// sends one Thai/พ.ศ. message per alert, marks notified_at on SUCCESS only.
// Failed sends stay queued (never dropped, never coerced); the queue view
// re-exposes them on the next invocation (at-least-once delivery).
//
// Credentials (owner-set via the Supabase secrets env — NEVER in the repo):
//   supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
// Unset credentials = the channel is honest-dormant: the function returns
// {"skipped":true,…} BEFORE touching the queue. No bot token is ever
// embedded in a URL — the Bot API Authorization-header form is used.
//
// Schedule: notify-threshold itself stays invocation-based by design (no
// in-repo schedule; owner activation options live in
// supabase/functions/README.md). pg_cron/pg_net ARE installed since P4.4
// (PR #247): cron.job jobid=1 "notify-monthly-report" runs '5 17 1 * *'
// (UTC) = 00:05 ICT on the 2nd — that job drives notify-monthly-report,
// not this function.
//
// Invoke locally with:
//   supabase functions serve notify-threshold
//   curl http://localhost:54321/functions/v1/notify-threshold -X POST
//
// Deploy with: supabase functions deploy notify-threshold --project-ref gllqtbyofrcjzmbnfoeh

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PendingAlert {
  id: string;
  reading_id: string;
  field: string;
  message: string;
  created_at: string;
  reading_date: string;
  reporter: string;
}

interface TelegramSendResult {
  ok: boolean;
  status?: number;
  retryAfter?: number;
  error?: string;
}

// Header-form Bot API endpoint: the token rides in the Authorization
// header, never in the URL (keeps it out of logs and proxies).
const TELEGRAM_API = "https://api.telegram.org/bot/sendMessage";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const BATCH_LIMIT = 50;

// 429 batch back-off (ENV-REPAIR-P4-LEDGER-001 D1-3): honor Telegram's
// retry_after between batch items with bounded waits only — a per-wait cap
// and a per-invocation total budget; an exhausted budget skips further
// waits (failed sends stay queued for the next invocation: at-least-once
// preserved, never unbounded blocking).
const RETRY_AFTER_MAX_SECONDS = 30;
const BACKOFF_BUDGET_SECONDS = 60;

/** Bounded delay before the next batch item after a 429:
 * min(retry_after, per-wait cap, remaining budget); 0 when nothing to wait. */
export function computeBackoffDelayMs(
  retryAfterSeconds: number,
  remainingBudgetMs: number,
): number {
  if (!(retryAfterSeconds > 0) || !(remainingBudgetMs > 0)) return 0;
  const cappedMs = Math.min(retryAfterSeconds, RETRY_AFTER_MAX_SECONDS) * 1000;
  return Math.floor(Math.min(cappedMs, remainingBudgetMs));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Render an ISO date (yyyy-mm-dd…) as a Thai พ.ศ. date, e.g. 9 มกราคม 2567.
 * Unparseable input renders raw — never fabricated. */
export function formatThaiBEDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  const month = m ? THAI_MONTHS[Number(m[2]) - 1] : undefined;
  if (!m || !month) return iso ?? "";
  return `${Number(m[3])} ${month} ${Number(m[1]) + 543}`;
}

/** Per-alert Thai message from the queue view's own columns only. */
export function buildAlertMessage(a: PendingAlert): string {
  return [
    "⚠️ ระบบบำบัดน้ำเสีย — ค่าผิดปกติ",
    `รายการ: ${a.field}`,
    `วันที่: ${formatThaiBEDate(a.reading_date)}`,
    `ผู้บันทึก: ${a.reporter}`,
    a.message,
  ].join("\n");
}

/** One Telegram sendMessage via the Authorization-header form.
 * Success requires BOTH HTTP ok and the Bot-API body ok flag; a 429
 * surfaces parameters.retry_after without ever being treated as success. */
export async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<TelegramSendResult> {
  try {
    const resp = await fetch(TELEGRAM_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const body = (await resp.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const bodyOk = body?.["ok"] === true;
    if (resp.ok && bodyOk) return { ok: true };
    const params = body?.["parameters"] as { retry_after?: number } | undefined;
    const retryAfter = typeof params?.retry_after === "number"
      ? params.retry_after
      : undefined;
    return {
      ok: false,
      status: resp.status,
      retryAfter,
      error: `HTTP ${resp.status}${resp.status === 429 && retryAfter !== undefined ? ` (retry_after ${retryAfter}s)` : ""}`,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (_req) => {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    // Honest-dormant: owner plugs credentials later via `supabase secrets set`.
    return json(
      { skipped: true, reason: "TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — channel dormant" },
      200,
    );
  }
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, serviceKey);
  return processQueue(supabase, (text) => sendTelegram(token, chatId, text));
});

/** Poll the pending queue ASC, send per alert, mark successes only. */
export async function processQueue(
  supabase: SupabaseClient,
  send: (text: string) => Promise<TelegramSendResult>,
): Promise<Response> {
  const { data: alerts, error: fetchErr } = await supabase
    .from("v_pending_threshold_alerts")
    .select("*")
    .limit(BATCH_LIMIT);
  if (fetchErr) return json({ error: fetchErr.message }, 500);
  if (!alerts || alerts.length === 0) {
    return json({ notified: 0 }, 200);
  }

  let success = 0;
  let failed = 0;
  let backoffBudgetMs = BACKOFF_BUDGET_SECONDS * 1000;
  let pendingRetryAfter: number | undefined;
  const notifiedIds: string[] = [];

  for (const a of alerts as PendingAlert[]) {
    if (pendingRetryAfter !== undefined) {
      const delay = computeBackoffDelayMs(pendingRetryAfter, backoffBudgetMs);
      pendingRetryAfter = undefined;
      if (delay > 0) {
        await sleep(delay);
        backoffBudgetMs -= delay;
      } else {
        console.warn(
          `429 back-off budget exhausted (${BACKOFF_BUDGET_SECONDS}s) — continuing without wait`,
        );
      }
    }
    const result = await send(buildAlertMessage(a));
    if (result.ok) {
      success++;
      notifiedIds.push(a.id);
    } else {
      failed++;
      if (result.retryAfter !== undefined) {
        pendingRetryAfter = result.retryAfter;
      }
      console.warn(
        `telegram send failed for ${a.id}: ${result.error ?? "unknown"}${
          result.retryAfter !== undefined ? ` retry_after=${result.retryAfter}` : ""
        }`,
      );
    }
  }

  // Mark notified rows so they leave the queue — SUCCESS only, and `marked`
  // reports only rows the UPDATE actually affected (PostgREST count exact /
  // RETURNING); a failed mark surfaces markError and leaves the rows queued
  // (never fake success; at-least-once preserved).
  let marked = 0;
  let markError: string | undefined;
  if (notifiedIds.length > 0) {
    const { count, error: markErr } = await supabase
      .from("threshold_alert")
      .update({ notified_at: new Date().toISOString() }, { count: "exact" })
      .in("id", notifiedIds);
    if (markErr) {
      markError = markErr.message;
      console.warn("mark notified_at failed:", markErr.message);
    } else {
      marked = count ?? 0;
      if (count !== notifiedIds.length) {
        console.warn(
          `mark affected ${count ?? 0} of ${notifiedIds.length} notified rows`,
        );
      }
    }
  }

  const payload: Record<string, unknown> = {
    notified: success,
    failed,
    total: alerts.length,
    marked,
  };
  if (markError !== undefined) payload.markError = markError;
  return json(payload, 200);
}
