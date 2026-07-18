/**
 * CRB-1..4 — Carbon rollup data layer (Scope 1+2+3 unified).
 *
 * Reads `carbon.v_unified_co2e` (SCHEMA-3 view) which UNIONs every
 * carbon-contributing table across all schemas. Per-scope + per-source
 * aggregation done server-side; client just shapes for display.
 *
 * Scope 1 (direct): fuel + garden
 * Scope 2 (indirect electricity): carbon.reading
 * Scope 3 (other indirect): waste + chemical
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface RollupRow {
  month: string;       // YYYY-MM-01
  scope: number;       // 1, 2, 3
  source: string;
  kg_co2e: number;
  row_count: number;
}

export interface ScopeSummary {
  scope: number;
  total_kg_co2e: number;
  source_count: number;
  has_data: boolean;
}

export interface RollupSummary {
  rows: RollupRow[];
  byScope: ScopeSummary[];
  grandTotalKg: number;
  /** Sources still without data — UI shows "ข้อมูล incomplete" flag. */
  incompleteSources: string[];
}

const EXPECTED_SOURCES = [
  // Scope 1
  "diesel", "gasoline", "lpg", "garden_fuel",
  // Scope 2
  "electricity",
  // Scope 3
  "waste_general", "waste_infectious", "waste_recyclable",
  "chemical_chlorine", "chemical_alum", "chemical_kmno4",
];

export async function fetchRollup(months = 12): Promise<RollupSummary> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - (months - 1));
  cutoff.setDate(1);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("v_unified_co2e")
    .select("month, scope, source, kg_co2e, row_count")
    .gte("month", cutoffIso)
    .order("month", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as unknown[]) as RollupRow[];

  // Aggregate by scope.
  const scopeMap = new Map<number, ScopeSummary>();
  for (const r of rows) {
    const cur = scopeMap.get(r.scope) ?? {
      scope: r.scope, total_kg_co2e: 0, source_count: 0, has_data: false,
    };
    cur.total_kg_co2e += Number(r.kg_co2e);
    cur.has_data = true;
    scopeMap.set(r.scope, cur);
  }
  const byScope = Array.from(scopeMap.values()).map((s) => {
    const sources = new Set<string>();
    for (const r of rows) if (r.scope === s.scope) sources.add(r.source);
    return {
      ...s,
      source_count: sources.size,
      total_kg_co2e: Math.round(s.total_kg_co2e * 1000) / 1000,
    };
  }).sort((a, b) => a.scope - b.scope);

  const grandTotalKg = Math.round(byScope.reduce((s, x) => s + x.total_kg_co2e, 0) * 1000) / 1000;

  const seenSources = new Set(rows.map((r) => r.source));
  const incompleteSources = EXPECTED_SOURCES.filter((s) => !seenSources.has(s));

  return { rows, byScope, grandTotalKg, incompleteSources };
}

export function useCarbonRollup(months = 12) {
  const [data, setData] = useState<RollupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRollup(months)
      .then((d) => { setData(d); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [months]);

  return { data, loading, error };
}
