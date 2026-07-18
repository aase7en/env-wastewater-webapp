/**
 * DOC-1/2 — Regulatory reference data layer.
 * Reads core.regulation (RLS authenticated-rw).
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface Regulation {
  id: string;
  name: string;
  citation: string;
  summary_th: string | null;
  applies_to: string[];
  official_url: string | null;
  effective_date: string | null;
  is_active: boolean;
}

export async function fetchRegulations(moduleFilter?: string): Promise<Regulation[]> {
  let q = supabase
    .from("regulation")
    .select("id, name, citation, summary_th, applies_to, official_url, effective_date, is_active")
    .eq("is_active", true)
    .order("name");
  if (moduleFilter) {
    q = q.contains("applies_to", [moduleFilter]);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]) as Regulation[];
}

export function useRegulations(moduleFilter?: string) {
  const [data, setData] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegulations(moduleFilter)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [moduleFilter]);

  return { data, loading, error };
}
