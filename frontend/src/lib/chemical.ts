/**
 * MOD-CH — chemical sub-store module data layer.
 * CRUD over `chemical.master` (catalog) + `chemical.movement` (in/out log).
 * Balance auto-recomputed by fn_recompute_balance trigger (MOD-batch).
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface ChemicalMaster {
  id: string;
  name: string;
  cas_no: string | null;
  hazard_class: string | null;
  unit: string;
  reorder_point: number | null;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface ChemicalMovement {
  id: string;
  movement_date: string;
  chemical_name: string;
  direction: "in" | "out";
  quantity: number;
  unit: string;
  balance_after: number | null;
  purpose: string | null;
  lot_no: string | null;
  expiry_date: string | null;
  supplier: string | null;
  unit_cost: number | null;
  master_id: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type ChemicalMasterInput = Omit<ChemicalMaster, "id" | "current_balance" | "created_at">;
export type ChemicalMovementInput = Omit<ChemicalMovement, "id" | "recorded_by" | "created_at">;

const MASTER_COLS =
  "id, name, cas_no, hazard_class, unit, reorder_point, current_balance, is_active, created_at";
const MOVE_COLS =
  "id, movement_date, chemical_name, direction, quantity, unit, balance_after, purpose, lot_no, expiry_date, supplier, unit_cost, master_id, recorded_by, note, created_at";

// ─── Master ──────────────────────────────────────────────────────────────

export async function fetchChemicalStock(): Promise<ChemicalMaster[]> {
  const { data, error } = await supabase
    .from("master")
    .select(MASTER_COLS)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as ChemicalMaster[];
}

export async function createChemicalMaster(input: ChemicalMasterInput): Promise<ChemicalMaster> {
  const { data, error } = await supabase
    .from("master")
    .insert(input)
    .select(MASTER_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as ChemicalMaster;
}

export async function deleteChemicalMaster(id: string): Promise<void> {
  const { error } = await supabase.from("master").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Movement ────────────────────────────────────────────────────────────

export async function fetchChemicalMovements(limit = 50): Promise<ChemicalMovement[]> {
  const { data, error } = await supabase
    .from("movement")
    .select(MOVE_COLS)
    .order("movement_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ChemicalMovement[];
}

export async function createChemicalMovement(input: ChemicalMovementInput): Promise<ChemicalMovement> {
  const { data, error } = await supabase
    .from("movement")
    .insert(input)
    .select(MOVE_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as ChemicalMovement;
}

export async function deleteChemicalMovement(id: string): Promise<void> {
  const { error } = await supabase.from("movement").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Hooks ───────────────────────────────────────────────────────────────

export function useChemicalStock() {
  const [data, setData] = useState<ChemicalMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchChemicalStock()
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [nonce]);

  return { data, loading, error, refresh };
}

export function useChemicalMovements(limit = 50) {
  const [data, setData] = useState<ChemicalMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchChemicalMovements(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}

/**
 * Returns stock rows where current_balance < reorder_point (reorder alert).
 * Caller renders a red chip / toast.
 */
export function useLowStockChemicals() {
  const { data, loading, error } = useChemicalStock();
  const lowStock = data.filter(
    (m) => m.reorder_point !== null && m.current_balance < (m.reorder_point ?? 0),
  );
  return { data: lowStock, loading, error };
}
