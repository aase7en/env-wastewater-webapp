/**
 * MOD-WS — water_supply module data layer.
 *
 * Skeleton CRUD over `water_supply.daily_check` (SCHEMA-1 + MOD-batch column
 * extensions). Pattern mirrors lib/repair.ts / lib/alerts.ts.
 */

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface WaterSupplyCheck {
  id: string;
  check_date: string;
  location_id: string | null;
  ph: number | null;
  free_chlorine_residual: number | null;
  turbidity: number | null;
  total_coliform: string | null;
  fecal_coliform: string | null;
  iron: number | null;
  manganese: number | null;
  hardness: number | null;
  tds: number | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type WaterSupplyInput = Omit<WaterSupplyCheck, "id" | "recorded_by" | "created_at">;

const COLUMNS =
  "id, check_date, location_id, ph, free_chlorine_residual, turbidity, total_coliform, fecal_coliform, iron, manganese, hardness, tds, recorded_by, note, created_at";

export async function fetchWaterSupplyDaily(limit = 30): Promise<WaterSupplyCheck[]> {
  const { data, error } = await supabase
    .from("daily_check")
    .select(COLUMNS)
    .order("check_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as WaterSupplyCheck[];
}

export async function createWaterSupplyDaily(input: WaterSupplyInput): Promise<WaterSupplyCheck> {
  const { data, error } = await supabase
    .from("daily_check")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as WaterSupplyCheck;
}

export async function deleteWaterSupplyDaily(id: string): Promise<void> {
  const { error } = await supabase.from("daily_check").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useWaterSupplyDaily(limit = 30) {
  const [data, setData] = useState<WaterSupplyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchWaterSupplyDaily(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}
