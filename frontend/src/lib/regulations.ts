/**
 * DOC-1/2 — Regulatory reference data layer.
 * Reads core.regulation (RLS authenticated-rw).
 */
import { useQuery } from "@tanstack/react-query";
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
  const q = useQuery({
    queryKey: ["regulations", moduleFilter] as const,
    queryFn: () => fetchRegulations(moduleFilter),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
}
