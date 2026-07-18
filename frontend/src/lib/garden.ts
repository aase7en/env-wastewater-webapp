/**
 * MOD-GA — garden module data layer.
 * CRUD over `garden.work_round`. Scope 1 carbon feed via fuel_used_l.
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface GardenWorkRound {
  id: string;
  round_date: string;
  location_id: string | null;
  work_type: string | null;
  area_sqm: number | null;
  worker_count: number | null;
  fuel_used_l: number | null;
  duration_hours: number | null;
  equipment_used: string | null;
  waste_collected_kg: number | null;
  photo_path: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type GardenInput = Omit<GardenWorkRound, "id" | "recorded_by" | "created_at">;

const COLUMNS =
  "id, round_date, location_id, work_type, area_sqm, worker_count, fuel_used_l, duration_hours, equipment_used, waste_collected_kg, photo_path, recorded_by, note, created_at";

export async function fetchGardenRounds(limit = 30): Promise<GardenWorkRound[]> {
  const { data, error } = await supabase
    .from("work_round")
    .select(COLUMNS)
    .order("round_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as GardenWorkRound[];
}

export async function createGardenRound(input: GardenInput): Promise<GardenWorkRound> {
  const { data, error } = await supabase
    .from("work_round")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as GardenWorkRound;
}

export async function deleteGardenRound(id: string): Promise<void> {
  const { error } = await supabase.from("work_round").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useGardenRounds(limit = 30) {
  const [data, setData] = useState<GardenWorkRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchGardenRounds(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}
