/**
 * MOD-FO — food sanitation (coliform) module data layer.
 * CRUD over `food.lab_test`. AFTER INSERT trigger fn_decrement_reagent
 * auto-decrements chemical.movement — see SCHEMA MOD-batch migration.
 *
 * ⚠️ PHI boundary: coliform tests at รพ.อุทัย = water/food/environment
 * samples — NOT patient samples. If patient-adjacent samples are added
 * later, they MUST NOT route through AI providers (ZCode/GLM China law).
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface FoodLabTest {
  id: string;
  sample_date: string;
  sample_type: string | null;
  test_type: string | null;
  result: string | null;
  reported_date: string | null;
  technician: string | null;
  sample_point: string | null;
  mpn_value: number | null;
  reagent_used: { name?: string; qty?: number; unit?: string } | null;
  reported_by_lab_tech: string | null;
  follow_up_action: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type FoodInput = Omit<FoodLabTest, "id" | "recorded_by" | "created_at">;

const COLUMNS =
  "id, sample_date, sample_type, test_type, result, reported_date, technician, sample_point, mpn_value, reagent_used, reported_by_lab_tech, follow_up_action, recorded_by, note, created_at";

export async function fetchFoodLabTests(limit = 30): Promise<FoodLabTest[]> {
  const { data, error } = await supabase
    .from("lab_test")
    .select(COLUMNS)
    .order("sample_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as FoodLabTest[];
}

export async function createFoodLabTest(input: FoodInput): Promise<FoodLabTest> {
  const { data, error } = await supabase
    .from("lab_test")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as FoodLabTest;
}

export async function deleteFoodLabTest(id: string): Promise<void> {
  const { error } = await supabase.from("lab_test").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useFoodLabTests(limit = 30) {
  const [data, setData] = useState<FoodLabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchFoodLabTests(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}

/**
 * useReagentUsage(months) — aggregate reagent consumption for report.
 * Joins via chemical.movement (written by fn_decrement_reagent trigger).
 */
export async function fetchReagentUsage(monthsBack = 3): Promise<
  Array<{ chemical_name: string; total_qty: number; unit: string }>
> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("movement")
    .select("chemical_name, quantity, unit")
    .eq("direction", "out")
    .like("purpose", "auto: food.lab_test%")
    .gte("movement_date", cutoffIso);
  if (error) throw new Error(error.message);

  const byName = new Map<string, { qty: number; unit: string }>();
  for (const row of (data ?? []) as Array<{ chemical_name: string; quantity: number; unit: string }>) {
    const key = row.chemical_name;
    const prev = byName.get(key) ?? { qty: 0, unit: row.unit };
    prev.qty += Number(row.quantity);
    byName.set(key, prev);
  }
  return Array.from(byName.entries()).map(([chemical_name, v]) => ({
    chemical_name,
    total_qty: Math.round(v.qty * 1000) / 1000,
    unit: v.unit,
  }));
}
