/**
 * MOD-WA — waste/garbage module data layer.
 * CRUD over `garbage.collection_log`. Legacy data migration MIG-WA is
 * BLOCKED on AppSheet CSV export (separate chunk).
 */
import { useQuery } from "@tanstack/react-query";
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

/**
 * GARBAGE-CORE-001 — `segregation_type` is the canonical write/classification
 * field. Legacy `waste_type` stays readable (GarbageLog/COLUMNS keep it for
 * display fallback of historical rows) but is NOT writable: new UI/import
 * flows must never set it, and canonical data is never auto-copied into it.
 */
export type GarbageInput = Omit<
  GarbageLog,
  "id" | "recorded_by" | "created_at" | "waste_type"
>;

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
  const q = useQuery({
    queryKey: ["garbage-logs", limit] as const,
    queryFn: () => fetchGarbageLogs(limit),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}
