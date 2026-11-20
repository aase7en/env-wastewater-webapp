// ENV-PARITY-P4-004 — notify-monthly-report Edge Function (Deno, Supabase).
//
// AppSheet parity Phase 4 lane P4.4 (งานตามเวลา — รายงานรายเดือนอัตโนมัติ).
// THE HONESTY PIN (WO §0): reference 12 §9 records ZERO scheduled AppSheet
// bots — this month-boundary notice is the documented ENV-new divergence
// (an honest improvement AppSheet never had), never schedule parity of a
// nonexistent schedule. It announces that the P4.1-delivered ทส.1/ทส.2
// print-ready report views (/reports) are ready for the PREVIOUS month.
//
// Contract (WO §2, D1 pins):
//   - Covered month = the PREVIOUS calendar month, pinned ICT (UTC+7;
//     ICT_OFFSET_HOURS = 7). The pg_cron job fires 17:05 UTC on the 1st =
//     00:05 ICT on the 2nd, so the covered ICT month is unambiguous.
//   - Readiness = data presence in the covered month, mirroring the P4.1
//     range query (public.reading + reading_date gte/lte). Data exists →
//     ready; an honest no-data month is recorded status 'skipped' with
//     reason 'no-reading-data' — no fake notice is ever sent.
//   - State = the monthly-cycle state table added by this lane's migration
//     (RLS fail-closed; service-role path): idempotent per month_key;
//     notified_at is marked on SUCCESS only; already-sent months return an
//     honest no-op; failed sends stay 'pending' for retry; no retroactive
//     rows are fabricated for pre-activation months.
//   - Message = ONE Thai/พ.ศ. notice per month cycle, bounded to in-lane
//     facts (covered month + report-ready statement + where to print).
//     reference 12 records no AppSheet webhook templates — no byte-exact
//     reconstruction is attempted. No PHI, no personnel lookup.
//   - Credentials (owner-set via the Supabase secrets env — NEVER in the
//     repo): supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
//     Unset credentials = honest-dormant: the function returns
//     {"skipped":true,…} BEFORE any state-table work. No bot token is ever
//     embedded in a URL — the Bot API Authorization-header form is used.
//
// Auth: the platform JWT gate stays ON (verify_jwt default TRUE — the house
// convention, cf. ingest-sensor's service-role bearer docstring and
// notify-threshold's README anon-bearer manual test). The pg_cron job posts
// a bearer read from vault.decrypted_secrets (name 'service_role') at
// execution time — see supabase/migrations/20261120000000_parity_p4_004.sql.
//
// Invoke (dormant probe):
//   curl -X POST https://gllqtbyofrcjzmbnfoeh.functions.supabase.co/notify-monthly-report \
//     -H "Authorization: Bearer <anon-key>" -H "Content-Type: application/json" -d '{}'
//   → {"skipped":true,…} while Telegram credentials are unset.
//
// Deploy with: supabase functions deploy notify-monthly-report --project-ref gllqtbyofrcjzmbnfoeh

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ICT = UTC+7 (the covered month is pinned ICT per WO D1-2/D1-3).
export const ICT_OFFSET_HOURS = 7;

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

// Header-form Bot API endpoint: the token rides in the Authorization
// header, never in the URL (keeps it out of logs and proxies).
const TELEGRAM_API = "https://api.telegram.org/bot/sendMessage";

export interface CoveredMonth {
  year: number;
  month: number;
  key: string;
  thai: string;
  start: string;
  end: string;
}

export interface TelegramSendResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/** Shift a UTC instant into ICT (UTC+7) by pure ms arithmetic — the covered
 * month is read from the shifted calendar, never from the UTC clock. */
export function toIctInstant(nowIso: string): Date {
  const ms = Date.parse(nowIso);
  if (Number.isNaN(ms)) throw new Error(`unparseable instant: ${nowIso}`);
  return new Date(ms + ICT_OFFSET_HOURS * 60 * 60 * 1000);
}

/** The covered month = the PREVIOUS calendar month of the ICT "now".
 * UTC-math only (the shifted date is read via UTC getters), so the result
 * is deterministic regardless of the runtime's local timezone. */
export function coveredMonth(nowIso: string): CoveredMonth {
  const shifted = toIctInstant(nowIso);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const mm = String(pm).padStart(2, "0");
  const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  return {
    year: py,
    month: pm,
    key: `${py}-${mm}`,
    thai: `${THAI_MONTHS[pm - 1]} ${py + 543}`,
    start: `${py}-${mm}-01`,
    end: `${py}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** The ONE monthly notice (D1-3 bounds: month + ready statement + where to
 * print). พ.ศ. year (+543) + Thai full month per the AGENTS.md dates rule. */
export function buildMonthlyMessage(c: CoveredMonth): string {
  return [
    "📄 ระบบบำบัดน้ำเสีย — แจ้งเตือนอัตโนมัติ",
    `รายงาน ทส.1/ทส.2 ประจำเดือน ${c.thai} พร้อมแล้ว`,
    "พิมพ์ได้ที่เมนู รายงาน (/reports) → เลือก ทส.1 หรือ ทส.2",
  ].join("\n");
}

/** One Telegram sendMessage via the Authorization-header form. Success
 * requires BOTH HTTP ok and the Bot-API body ok flag (same contract as the
 * P4.2 dispatcher, re-declared here — notify-threshold stays byte-untouched). */
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
    if (resp.ok && body?.["ok"] === true) return { ok: true };
    return {
      ok: false,
      status: resp.status,
      error: `HTTP ${resp.status}`,
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

Deno.serve(async (req) => {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    // Honest-dormant: owner plugs credentials later via `supabase secrets
    // set`. Nothing is sent and NO state row is written (the cycle stays
    // unknown — unknown ≠ zero, never fabricated).
    return json(
      { skipped: true, reason: "TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — channel dormant" },
      200,
    );
  }
  let provenance = "edge-function";
  try {
    const body = await req.json() as { provenance?: unknown } | null;
    if (typeof body?.provenance === "string" && body.provenance.length <= 40) {
      provenance = body.provenance;
    }
  } catch {
    // empty/non-JSON body → default provenance
  }
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, serviceKey);
  return runMonthlyCycle(supabase, (text) => sendTelegram(token, chatId, text), provenance);
});

/** One monthly cycle: idempotent per month_key, honesty end-to-end. */
export async function runMonthlyCycle(
  supabase: SupabaseClient,
  send: (text: string) => Promise<TelegramSendResult>,
  provenance: string,
): Promise<Response> {
  const covered = coveredMonth(new Date().toISOString());

  // Idempotency gate: an already-sent month is an honest no-op (a retried
  // month never silently duplicates a sent notice).
  const { data: existing, error: readErr } = await supabase
    .from("monthly_report_cycle")
    .select("month_key, status, notified_at, reason, provenance")
    .eq("month_key", covered.key)
    .maybeSingle();
  if (readErr) return json({ error: readErr.message }, 500);
  if (existing?.status === "sent") {
    return json(
      {
        ok: true,
        monthKey: covered.key,
        thai: covered.thai,
        idempotentNoop: true,
        notifiedAt: existing.notified_at,
      },
      200,
    );
  }

  // Readiness = data presence in the covered month, mirroring the P4.1
  // range query (public.reading + reading_date gte/lte). Unknown counts as
  // NOT ready — never fabricated.
  const { count, error: presenceErr } = await supabase
    .from("reading")
    .select("id", { count: "exact", head: true })
    .gte("reading_date", covered.start)
    .lte("reading_date", covered.end);
  if (presenceErr) return json({ error: presenceErr.message }, 500);

  if ((count ?? 0) === 0) {
    // Honest no-data month: recorded, skipped, NO fake notice.
    const { error: skipErr } = await supabase
      .from("monthly_report_cycle")
      .upsert(
        {
          month_key: covered.key,
          status: "skipped",
          reason: "no-reading-data",
          notified_at: null,
          provenance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "month_key" },
      );
    if (skipErr) return json({ error: skipErr.message }, 500);
    return json(
      { ok: true, monthKey: covered.key, thai: covered.thai, status: "skipped", reason: "no-reading-data" },
      200,
    );
  }

  const result = await send(buildMonthlyMessage(covered));
  if (!result.ok) {
    // Failed send stays pending for retry (never dropped, never coerced).
    const { error: pendErr } = await supabase
      .from("monthly_report_cycle")
      .upsert(
        {
          month_key: covered.key,
          status: "pending",
          reason: `send-failed: ${result.error ?? "unknown"}`,
          notified_at: null,
          provenance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "month_key" },
      );
    if (pendErr) return json({ error: pendErr.message }, 500);
    console.warn(`telegram send failed for ${covered.key}: ${result.error ?? "unknown"}`);
    return json(
      { ok: true, monthKey: covered.key, thai: covered.thai, sent: false, reason: "send-failed" },
      200,
    );
  }

  // Mark SUCCESS only — notified_at is set here and nowhere else.
  const notifiedAt = new Date().toISOString();
  const { error: markErr } = await supabase
    .from("monthly_report_cycle")
    .upsert(
      {
        month_key: covered.key,
        status: "sent",
        reason: null,
        notified_at: notifiedAt,
        provenance,
        updated_at: notifiedAt,
      },
      { onConflict: "month_key" },
    );
  if (markErr) {
    // The notice WAS sent; record honestly that the mark failed so the
    // reviewer sees the divergence instead of a coerced success.
    console.error("mark notified_at failed:", markErr.message);
    return json(
      { ok: true, monthKey: covered.key, thai: covered.thai, sent: true, marked: false, error: markErr.message },
      200,
    );
  }
  return json(
    { ok: true, monthKey: covered.key, thai: covered.thai, sent: true, marked: true },
    200,
  );
}
