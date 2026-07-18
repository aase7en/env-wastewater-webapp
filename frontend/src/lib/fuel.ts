/**
 * MOD-FU — fuel module data layer.
 * CRUD over `fuel.dispense_log`. Includes computeDelta helper to warn
 * when meter_after - meter_before ≠ litres. Legacy migration MIG-FU
 * BLOCKED on AppSheet CSV export.
 * Scope 1 carbon feed — fuel_type maps to carbon.emission_factor.
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface FuelLog {
  id: string;
  log_date: string;
  fuel_type: string | null;
  litres: number | null;
  meter_before: number | null;
  meter_after: number | null;
  vehicle_or_use: string | null;
  vehicle_id: string | null;
  odometer: number | null;
  purpose: string | null;
  cost_baht: number | null;
  supplier: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type FuelInput = Omit<FuelLog, "id" | "recorded_by" | "created_at">;

const COLUMNS =
  "id, log_date, fuel_type, litres, meter_before, meter_after, vehicle_or_use, vehicle_id, odometer, purpose, cost_baht, supplier, recorded_by, note, created_at";

export async function fetchFuelLogs(limit = 30): Promise<FuelLog[]> {
  const { data, error } = await supabase
    .from("dispense_log")
    .select(COLUMNS)
    .order("log_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as FuelLog[];
}

export async function createFuelLog(input: FuelInput): Promise<FuelLog> {
  const { data, error } = await supabase
    .from("dispense_log")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as FuelLog;
}

export async function deleteFuelLog(id: string): Promise<void> {
  const { error } = await supabase.from("dispense_log").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useFuelLogs(limit = 30) {
  const [data, setData] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchFuelLogs(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}

/**
 * Compute the meter delta and compare to declared litres.
 * Returns null if either meter reading is missing.
 * Returns { delta, litres, mismatch, diff } otherwise.
 */
export function computeDelta(
  meterBefore: number | null,
  meterAfter: number | null,
  litres: number | null,
): { delta: number; litres: number; mismatch: boolean; diff: number } | null {
  if (meterBefore == null || meterAfter == null || litres == null) return null;
  const delta = meterAfter - meterBefore;
  const diff = Math.round((delta - litres) * 100) / 100;
  return { delta, litres, mismatch: Math.abs(diff) > 0.1, diff };
}
