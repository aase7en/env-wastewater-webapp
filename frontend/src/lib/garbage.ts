/**
 * MOD-WA — waste/garbage module data layer.
 * CRUD over `garbage.collection_log`. Legacy data migration MIG-WA is
 * BLOCKED on AppSheet CSV export (separate chunk).
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface GarbageLog {
  id: string;
  log_date: string;
  location_id: string | null;
  waste_type: string | null;
  weight_kg: number | null;
  disposal_route: string | null;
  segregation_type: string | null;
  contractor: string | null;
  vehicle_plate: string | null;
  manifest_no: string | null;
  destination: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type GarbageInput = Omit<GarbageLog, "id" | "recorded_by" | "created_at">;

const COLUMNS =
  "id, log_date, location_id, waste_type, weight_kg, disposal_route, segregation_type, contractor, vehicle_plate, manifest_no, destination, recorded_by, note, created_at";

export async function fetchGarbageLogs(limit = 30): Promise<GarbageLog[]> {
  const { data, error } = await supabase
    .from("collection_log")
    .select(COLUMNS)
    .order("log_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as GarbageLog[];
}

export async function createGarbageLog(input: GarbageInput): Promise<GarbageLog> {
  const { data, error } = await supabase
    .from("collection_log")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as GarbageLog;
}

export async function deleteGarbageLog(id: string): Promise<void> {
  const { error } = await supabase.from("collection_log").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useGarbageLogs(limit = 30) {
  const [data, setData] = useState<GarbageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchGarbageLogs(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}
