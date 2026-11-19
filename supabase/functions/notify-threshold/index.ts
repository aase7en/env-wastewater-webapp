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
// Schedule: none in-repo (pg_cron/pg_net are not installed on ENV_DB and
// enabling them requires a migration — out of scope by WO §3). Owner
// activation options are documented in supabase/functions/README.md.
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
  const notifiedIds: string[] = [];

  for (const a of alerts as PendingAlert[]) {
    const result = await send(buildAlertMessage(a));
    if (result.ok) {
      success++;
      notifiedIds.push(a.id);
    } else {
      failed++;
      console.warn(
        `telegram send failed for ${a.id}: ${result.error ?? "unknown"}${
          result.retryAfter !== undefined ? ` retry_after=${result.retryAfter}` : ""
        }`,
      );
    }
  }

  // Mark notified rows so they leave the queue — SUCCESS only.
  if (notifiedIds.length > 0) {
    const { error: markErr } = await supabase
      .from("threshold_alert")
      .update({ notified_at: new Date().toISOString() })
      .in("id", notifiedIds);
    if (markErr) console.warn("mark notified_at failed:", markErr.message);
  }

  return json(
    { notified: success, failed, total: alerts.length, marked: notifiedIds.length },
    200,
  );
}
