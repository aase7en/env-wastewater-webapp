/**
 * useSensorFeed — subscribe to live telemetry via Supabase Realtime.
 *
 * EQ-5 (2026-08-11): migrated the initial fetch to useQuery; realtime
 * INSERT events still arrive via the channel, but now update the cache
 * directly via queryClient.setQueryData (incremental append to the
 * per-sensor rolling window — preserves the exact prior semantics).
 *
 * Returns the most recent N samples per sensor_code, updated live as
 * `wastewater.sensor_reading` INSERT events fire (see P20d migration +
 * ingest-sensor Edge Function). The hook cleans up its channel on
 * unmount.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface SensorSample {
  id: string;
  sensor_id: string;
  taken_at: string;
  value: number;
}

export interface SensorMeta {
  id: string;
  code: string;
  parameter_code: string;
  label_th: string | null;
  unit: string;
  is_active: boolean;
}

export interface SensorFeedState {
  sensors: SensorMeta[];
  /** Newest-first samples keyed by sensor_id. */
  samplesBySensor: Map<string, SensorSample[]>;
  connected: boolean;
  error: string | null;
}

interface SensorFeedData {
  sensors: SensorMeta[];
  samplesBySensor: Map<string, SensorSample[]>;
}

/**
 * Seed the feed: active sensor list + the most recent `limit` samples per
 * sensor.
 *
 * ENV-PERF-001 (2026-11-12): this used to fire ONE query per sensor
 * (Promise.all over sensors — N+1 HTTP requests on first load). It is now a
 * single `.in("sensor_id", ids)` query, newest-first over the whole set with
 * the combined limit scaled by sensor count, grouped client-side and capped
 * per sensor. The existing (sensor_id, taken_at DESC) index
 * `idx_sensor_reading_sensor_time` already serves this shape (snapshot:883)
 * — no new index. Extracted module-level so node-env tests can drive it
 * (alerts-unread pattern); the realtime incremental-cache path below is
 * unchanged.
 *
 * Known trade-off (honest note): with one sensor dominating the newest
 * rows, the combined limit can under-fill the other sensors' windows before
 * grouping; at this project's scale (<10 sensors, 50/sensor window) that is
 * negligible, and the realtime INSERT path keeps appending as before.
 */
export async function fetchSensorFeedData(limit = 50): Promise<SensorFeedData> {
  // 1) Load sensor master list (active only).
  const { data: sensorRows, error: e1 } = await supabase
    .from("sensor")
    .select("id, code, parameter_code, label_th, unit, is_active")
    .eq("is_active", true)
    .order("code");
  if (e1) throw new Error(e1.message);

  const sensors = sensorRows ?? [];
  const ids = sensors.map((s) => s.id);
  const map = new Map<string, SensorSample[]>();

  // 2) ONE query seeds every sensor's recent samples (last N each).
  if (ids.length > 0) {
    const { data: recent, error: e2 } = await supabase
      .from("sensor_reading")
      .select("id, sensor_id, taken_at, value")
      .in("sensor_id", ids)
      .order("taken_at", { ascending: false })
      .limit(ids.length * limit);
    if (e2) throw new Error(e2.message);
    // Rows arrive newest-first globally, so per-sensor order stays
    // newest-first; cap each list at the per-sensor window.
    for (const row of recent ?? []) {
      const list = map.get(row.sensor_id) ?? [];
      if (list.length < limit) list.push(row);
      map.set(row.sensor_id, list);
    }
  }
  // Every sensor gets a list (empty when it has no rows) — same shape the
  // prior per-sensor queries produced.
  for (const s of sensors) {
    if (!map.has(s.id)) map.set(s.id, []);
  }
  return { sensors, samplesBySensor: map };
}

/**
 * @param limit  Max samples kept per sensor (rolling window).
 */
// EQ-5.1 fix: queryKey has a runtime param (limit), so useMemo is the right
// tool (can't be module-level like the param-less cases in alerts.ts /
// role-module-visibility.ts). Without this, useCallback/useEffect deps
// changed identity every render.
export function useSensorFeed(limit = 50): SensorFeedState & { refresh: () => void } {
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["sensor-feed", limit] as const, [limit]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [connected, setConnected] = useState(false);

  const q = useQuery<SensorFeedData>({
    queryKey,
    queryFn: () => fetchSensorFeedData(limit),
  });

  // 3) Subscribe to INSERT events on sensor_reading. The subscription is
  // keyed on `limit` (matching the query) so swapping the limit resubscribes.
  useEffect(() => {
    const channel = supabase
      .channel("sensor-reading-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "wastewater", table: "sensor_reading" },
        (payload) => {
          const sample = payload.new as SensorSample;
          // Incremental cache update — prepend + cap to limit, preserving
          // the exact rolling-window semantics the prior setSamplesBySensor
          // callback had.
          qc.setQueryData<SensorFeedData>(queryKey, (prev) => {
            if (!prev) return prev;
            const next = new Map(prev.samplesBySensor);
            const list = next.get(sample.sensor_id) ?? [];
            next.set(sample.sensor_id, [sample, ...list].slice(0, limit));
            return { ...prev, samplesBySensor: next };
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnected(false);
        }
      });
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnected(false);
    };
  }, [qc, limit, queryKey]);

  return {
    sensors: q.data?.sensors ?? [],
    samplesBySensor: q.data?.samplesBySensor ?? new Map(),
    connected,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}
