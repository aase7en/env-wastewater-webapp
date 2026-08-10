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
import { useEffect, useRef, useState } from "react";
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
 * @param limit  Max samples kept per sensor (rolling window).
 */
export function useSensorFeed(limit = 50): SensorFeedState & { refresh: () => void } {
  const qc = useQueryClient();
  const queryKey = ["sensor-feed", limit] as const;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [connected, setConnected] = useState(false);

  const q = useQuery<SensorFeedData>({
    queryKey,
    queryFn: async () => {
      // 1) Load sensor master list (active only).
      const { data: sensorRows, error: e1 } = await supabase
        .from("sensor")
        .select("id, code, parameter_code, label_th, unit, is_active")
        .eq("is_active", true)
        .order("code");
      if (e1) throw new Error(e1.message);

      // 2) Seed each sensor's recent samples (last N).
      const map = new Map<string, SensorSample[]>();
      await Promise.all(
        (sensorRows ?? []).map(async (s) => {
          const { data: recent } = await supabase
            .from("sensor_reading")
            .select("id, sensor_id, taken_at, value")
            .eq("sensor_id", s.id)
            .order("taken_at", { ascending: false })
            .limit(limit);
          map.set(s.id, recent ?? []);
        })
      );
      return { sensors: sensorRows ?? [], samplesBySensor: map };
    },
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
