/**
 * MOD-WS — water_supply module data layer.
 *
 * CRUD over `water_supply.daily_check` (SCHEMA-1 + MOD-batch column
 * extensions) + the P1.5 usage columns (activity / hour_meter / water_in /
 * chlorine_usage) + the chain-view read over `v_daily_check_chain`
 * (ENV-PARITY-P1-005 — derived values come from the VIEW, never
 * re-derived client-side). Pattern mirrors lib/repair.ts / lib/alerts.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
// ENV-PARITY-P3-002 — ADDITIVE deduction/reversal wiring (D1-3 BOTH-IN + the D2 P3-1 reversal ruling)
import { deductForWaterSupplyCheck, revokeForUsageRow, type DeductionBadge } from "./inventory";

export interface WaterSupplyCheck {
  id: string;
  check_date: string;
  location_id: string | null;
  activity: string | null;
  hour_meter: number | null;
  water_in: number | null;
  chlorine_usage: number | null;
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

export const COLUMNS =
  "id, check_date, location_id, activity, hour_meter, water_in, chlorine_usage, ph, free_chlorine_residual, turbidity, total_coliform, fecal_coliform, iron, manganese, hardness, tds, recorded_by, note, created_at";

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

export async function deleteWaterSupplyDaily(id: string): Promise<string | null> {
  const { error } = await supabase.from("daily_check").delete().eq("id", id);
  if (error) throw new Error(error.message);

  // ENV-PARITY-P3-002 (D2 P3-1 reversal ruling, ADDITIVE wiring only):
  // after the usage row is durably deleted, compensate its recorded
  // chlorine deduction (provenance-reversal RPC — lot stock restored
  // FEFO-inverse). Best-effort: the delete already succeeded, so a
  // reversal failure returns an honest warning string (never thrown,
  // never silent — the caller toasts it).
  return revokeForUsageRow({ sourceTable: "water_supply.daily_check", sourceId: id });
}

/**
 * ENV-PARITY-P3-002 (D1-3 BOTH-IN, ADDITIVE wiring only): create the daily
 * check, then — when the save carries a chlorine usage — call the FEFO
 * deduction RPC with the VIEW-owned real quantity (chlorine_usage_realy
 * read back from v_daily_check_chain for the saved row; never re-derived
 * client-side). The result travels as `deductionBadge` (truthful badge
 * text + its variant — success for a clean deduction, warning otherwise,
 * the D5 P3-4 repair; never thrown; the usage save already succeeded and
 * must never be misreported as failed by the deduction).
 * The plain createWaterSupplyDaily stays byte-identical for existing
 * callers.
 */
export async function createWaterSupplyDailyWithDeduction(
  input: WaterSupplyInput
): Promise<{ row: WaterSupplyCheck; deductionBadge: DeductionBadge | null }> {
  const row = await createWaterSupplyDaily(input);
  const usage = Number((input as { chlorine_usage?: number | string | null }).chlorine_usage ?? 0);
  let deductionBadge: DeductionBadge | null = null;
  if (Number.isFinite(usage) && usage > 0) {
    deductionBadge = await deductForWaterSupplyCheck({
      checkId: row.id,
      checkDate: row.check_date,
    });
  }
  return { row, deductionBadge };
}

export function useWaterSupplyDaily(limit = 30) {
  const q = useQuery({
    queryKey: ["water-supply-daily", limit] as const,
    queryFn: () => fetchWaterSupplyDaily(limit),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

// ─── ENV-PARITY-P1-005 — chain-view read (derived values are view-owned) ─

/** The exposed PostgREST surface: public.v_daily_check_chain
 *  (security_invoker façade — caller RLS gates every row). */
export const WATER_SUPPLY_CHAIN_TABLE = "v_daily_check_chain";

export interface WaterSupplyChainRow {
  id: string;
  check_date: string;
  location_id: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
  activity: string | null;
  hour_meter: number | null;
  prev_hour_meter: number | null;
  hour_work: number | null;
  hour_boundary_flag: boolean | null;
  hour_boundary_reason: string | null;
  water_in: number | null;
  water_in_estimate: number | null;
  chlorine_usage: number | null;
  chlorine_usage_realy: number | null;
  chlorine_concentrated: number | null;
  energy_use_estimate: number | null;
  spec_energy_kwh_per_h: number | null;
  spec_flow_m3_per_h: number | null;
  mix_part_chlorine: number | null;
  mix_part_water: number | null;
  spec_missing: boolean | null;
  spec_missing_kinds: string | null;
}

const CHAIN_COLUMNS =
  "id, check_date, location_id, recorded_by, note, created_at, activity, hour_meter, prev_hour_meter, hour_work, hour_boundary_flag, hour_boundary_reason, water_in, water_in_estimate, chlorine_usage, chlorine_usage_realy, chlorine_concentrated, energy_use_estimate, spec_energy_kwh_per_h, spec_flow_m3_per_h, mix_part_chlorine, mix_part_water, spec_missing, spec_missing_kinds";

export async function fetchWaterSupplyChain(limit = 30): Promise<WaterSupplyChainRow[]> {
  const { data, error } = await supabase
    .from(WATER_SUPPLY_CHAIN_TABLE)
    .select(CHAIN_COLUMNS)
    .order("check_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as WaterSupplyChainRow[];
}

export function useWaterSupplyChain(limit = 30) {
  const q = useQuery({
    queryKey: ["water-supply-chain", limit] as const,
    queryFn: () => fetchWaterSupplyChain(limit),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}
