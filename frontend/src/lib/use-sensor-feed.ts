/**
 * useSensorFeed — subscribe to live telemetry via Supabase Realtime.
 *
 * Returns the most recent N samples per sensor_code, updated live as
 * `wastewater.sensor_reading` INSERT events fire (see P20d migration +
 * ingest-sensor Edge Function). The hook cleans up its channel on
 * unmount.
 *
 * No v1 page consumes this yet — it's a foundation for a future /sensors
 * page (P20d.2) once the design/ suite + F2 styling work settles. Track
 * Z safe: pure logic, no className or page edits.
 */
import { useEffect, useRef, useState } from "react";
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

/**
 * @param limit  Max samples kept per sensor (rolling window).
 */
export function useSensorFeed(limit = 50): SensorFeedState & { refresh: () => void } {
  const [sensors, setSensors] = useState<SensorMeta[]>([]);
  const [samplesBySensor, setSamplesBySensor] = useState<Map<string, SensorSample[]>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // 1) Load sensor master list (active only).
      const { data: sensorRows, error: e1 } = await supabase
        .from("sensor")
        .select("id, code, parameter_code, label_th, unit, is_active")
        .eq("is_active", true)
        .order("code");
      if (e1) {
        setError(e1.message);
        return;
      }
      if (cancelled) return;
      setSensors(sensorRows ?? []);

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
      if (cancelled) return;
      setSamplesBySensor(map);

      // 3) Subscribe to INSERT events on sensor_reading.
      const channel = supabase
        .channel("sensor-reading-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "wastewater", table: "sensor_reading" },
          (payload) => {
            const sample = payload.new as SensorSample;
            setSamplesBySensor((prev) => {
              const next = new Map(prev);
              const list = next.get(sample.sensor_id) ?? [];
              // Prepend + cap to limit.
              next.set(sample.sensor_id, [sample, ...list].slice(0, limit));
              return next;
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            setError(null);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnected(false);
            setError(`realtime: ${status}`);
          }
        });
      channelRef.current = channel;
    }

    void bootstrap();
    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [limit, nonce]);

  return { sensors, samplesBySensor, connected, error, refresh };
}
