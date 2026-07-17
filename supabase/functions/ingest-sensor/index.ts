// P20d — ingest-sensor Edge Function (Deno, runs on Supabase).
//
// Accepts telemetry from physical IoT sensors (or a simulator) and writes
// one row per sample into wastewater.sensor_reading. The frontend then
// subscribes via Supabase Realtime to receive the inserts as they land —
// no polling.
//
// Auth: callers must present the service_role key (set as the bearer).
// Sensors themselves should be fronted by a thin proxy that injects the
// key; we don't ship the service_role key to devices.
//
// Payload shape (JSON body, or JSON array of the same for batch):
//   {
//     "sensor_code": "DO-AER-01",      // resolves to wastewater.sensor.id
//     "taken_at": "2026-07-18T10:00:00Z",  // optional; defaults to now()
//     "value": 3.42,
//     "raw": { ... }                   // optional debug blob
//   }
//
// If sensor_code doesn't exist, the call fails with 404 (the operator must
// register the sensor in wastewater.sensor first — no implicit creation
// to avoid typos spawning ghost devices).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Sample {
  sensor_code: string;
  taken_at?: string;
  value: number;
  raw?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, serviceKey);

  let body: Sample | Sample[];
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const samples = Array.isArray(body) ? body : [body];

  // Resolve sensor_code → id up front so we can 404 unknown codes
  // instead of failing mid-batch on a FK violation.
  const codes = [...new Set(samples.map((s) => s.sensor_code))];
  const { data: sensors, error: lookupErr } = await supabase
    .from("sensor")
    .select("id, code")
    .in("code", codes);
  if (lookupErr) return json({ error: lookupErr.message }, 500);

  const codeToId = new Map((sensors ?? []).map((s) => [s.code, s.id]));
  const unknown = codes.filter((c) => !codeToId.has(c));
  if (unknown.length > 0) {
    return json({ error: "unknown sensor_code", codes: unknown }, 404);
  }

  // Build insert rows.
  const now = new Date().toISOString();
  const rows = samples.map((s) => ({
    sensor_id: codeToId.get(s.sensor_code)!,
    taken_at: s.taken_at || now,
    value: s.value,
    raw: s.raw ?? null,
  }));

  const { error: insertErr } = await supabase.from("sensor_reading").insert(rows);
  if (insertErr) return json({ error: insertErr.message }, 500);

  // Bump last_seen_at on each sensor so the device list can show recency.
  const sensorIds = [...new Set(rows.map((r) => r.sensor_id))];
  await supabase
    .from("sensor")
    .update({ last_seen_at: now })
    .in("id", sensorIds);

  return json({ inserted: rows.length }, 201);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
