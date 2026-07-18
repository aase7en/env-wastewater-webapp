/**
 * MOD-BL — building inspection module data layer.
 * CRUD over `building.inspection_round`. repair_needed=true seeds
 * core.repair_request via app-layer (V1b UI) — NOT a SQL trigger.
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface BuildingInspection {
  id: string;
  round_date: string;
  location_id: string | null;
  inspector: string | null;
  findings: string | null;
  issues_found: boolean;
  repair_needed: boolean;
  round_type: string | null;
  checklist: Record<string, unknown> | null;
  photos: string[] | null;
  severity: string | null;
  assigned_to: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type BuildingInput = Omit<BuildingInspection, "id" | "recorded_by" | "created_at">;

const COLUMNS =
  "id, round_date, location_id, inspector, findings, issues_found, repair_needed, round_type, checklist, photos, severity, assigned_to, recorded_by, note, created_at";

export async function fetchBuildingRounds(limit = 30): Promise<BuildingInspection[]> {
  const { data, error } = await supabase
    .from("inspection_round")
    .select(COLUMNS)
    .order("round_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as BuildingInspection[];
}

export async function createBuildingRound(input: BuildingInput): Promise<BuildingInspection> {
  const { data, error } = await supabase
    .from("inspection_round")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as BuildingInspection;
}

export async function deleteBuildingRound(id: string): Promise<void> {
  const { error } = await supabase.from("inspection_round").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useBuildingRounds(limit = 30) {
  const [data, setData] = useState<BuildingInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchBuildingRounds(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}
