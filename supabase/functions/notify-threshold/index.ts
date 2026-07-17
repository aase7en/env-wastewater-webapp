// P17 — notify-threshold Edge Function (Deno, runs on Supabase).
//
// Periodically invoked (via Supabase's pg_cron, or a GitHub Actions cron,
// or external scheduler). SELECTs all pending threshold alerts from
// wastewater.v_pending_threshold_alerts, sends each one to Line Notify
// (or Telegram — both accept the same webhook POST shape), then marks
// notified_at so the row leaves the queue.
//
// Webhook URL is stored in Vault under the key 'webhook_threshold_notify'.
// Configure with:
//   SELECT vault.create_secret(
//     'https://notify-api.line.me/api/notify',  -- or Telegram bot URL
//     'webhook_threshold_notify'
//   );
// And put the bearer token under 'webhook_threshold_notify_token'.
//
// This is a stub: wiring pg_cron + Vault happens in the dashboard.
// Invoke locally with:
//   supabase functions serve notify-threshold
//   curl http://localhost:54321/functions/v1/notify-threshold -X POST
//
// Deploy with: supabase functions deploy notify-threshold

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PendingAlert {
  id: string;
  reading_id: string;
  field: string;
  message: string;
  created_at: string;
  reading_date: string;
  reporter: string;
}

Deno.serve(async (_req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const webhookUrl = Deno.env.get("WEBHOOK_THRESHOLD_NOTIFY_URL"); // Vault
  const webhookToken = Deno.env.get("WEBHOOK_THRESHOLD_NOTIFY_TOKEN"); // Vault

  if (!webhookUrl) {
    return json({ skipped: true, reason: "WEBHOOK_THRESHOLD_NOTIFY_URL not set" }, 200);
  }

  const supabase = createClient(url, serviceKey);

  // 1) Pull the work queue.
  const { data: alerts, error: fetchErr } = await supabase
    .from("v_pending_threshold_alerts")
    .select("*")
    .limit(50);
  if (fetchErr) return json({ error: fetchErr.message }, 500);
  if (!alerts || alerts.length === 0) {
    return json({ notified: 0 }, 200);
  }

  // 2) Send each one. Line Notify wants form-urlencoded 'message'; Telegram
  // wants JSON. Both shapes included; the active path depends on webhookUrl.
  let success = 0;
  let failed = 0;
  const notifiedIds: string[] = [];

  for (const a of alerts as PendingAlert[]) {
    const line = `⚠️ ระบบบำบัดน้ำเสีย — ค่าผิดปกติ\nวันที่: ${a.reading_date}\nผู้บันทึก: ${a.reporter}\n${a.message}`;
    try {
      const isLine = webhookUrl.includes("notify-api.line.me");
      const resp = isLine
        ? await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${webhookToken || ""}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ message: line }),
          })
        : await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: line, chat_id: Deno.env.get("TELEGRAM_CHAT_ID") }),
          });
      if (resp.ok) {
        success++;
        notifiedIds.push(a.id);
      } else {
        failed++;
        console.warn(`webhook ${a.id} returned ${resp.status}: ${await resp.text()}`);
      }
    } catch (e) {
      failed++;
      console.warn(`webhook send failed for ${a.id}:`, e);
    }
  }

  // 3) Mark notified rows so they leave the queue. One UPDATE is cheaper
  // than one per row.
  if (notifiedIds.length > 0) {
    const { error: markErr } = await supabase
      .from("threshold_alert")
      .update({ notified_at: new Date().toISOString() })
      .in("id", notifiedIds);
    if (markErr) console.warn("mark notified_at failed:", markErr.message);
  }

  return json({ notified: success, failed, total: alerts.length }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
