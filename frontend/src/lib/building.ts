/**
 * MOD-BL — building inspection module data layer.
 *
 * ENV-BUILDING-REPAIR-001 C1 (2026-10-08): a repair-needed round is
 * created through the ONE transactional, idempotent server command
 * `core.create_building_repair` (stable client key = the client-generated
 * round UUID, retained across ambiguous retries). Plain rounds with no
 * repair_needed keep the ordinary insert. History renders the linked
 * repair from the durable link — never from the flag alone.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface LinkedRepair {
  id: string;
  status: string;
  cause: string;
}

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
  /** The durable C1 link — null when the round has no repair_needed. */
  repair_request: LinkedRepair[] | null;
}

export type BuildingInput = Omit<BuildingInspection, "id" | "recorded_by" | "created_at" | "repair_request">;

const COLUMNS =
  "id, round_date, location_id, inspector, findings, issues_found, repair_needed, round_type, checklist, photos, severity, assigned_to, recorded_by, note, created_at, repair_request(id, status, cause)";

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

export interface CreateBuildingRepairResult {
  inspection_round_id: string;
  repair_request_id: string;
  already_exists: boolean;
}

/**
 * ENV-BUILDING-REPAIR-001 C1 (clause 5): the ONLY path that creates a
 * repair-needed round. One server transaction creates the round AND its
 * at-most-one linked repair. The client key is generated here ONCE per
 * submission attempt chain and MUST be retained across retries of the
 * same submission (ambiguous network failure → same key, same payload)
 * so the server can return the same pair instead of duplicating it.
 * Caller must have validated: explicit nonblank cause, issues_found
 * premise, and a durable location (clause 2) — the server enforces them
 * again (fail closed).
 */
export async function createBuildingRoundWithRepair(
  input: BuildingInput,
  cause: string,
  clientKey?: string,
  equipmentId?: string | null,
): Promise<CreateBuildingRepairResult> {
  const key = clientKey ?? crypto.randomUUID();
  const { data, error } = await supabase.rpc("create_building_repair", {
    p_client_key: key,
    p_round_date: input.round_date,
    p_location_id: input.location_id,
    p_inspector: input.inspector,
    p_findings: input.findings,
    p_cause: cause,
    p_equipment_id: equipmentId ?? null,
    // D8 R2 P1-4: preserve every inspection field the form accepts.
    p_round_type: input.round_type ?? null,
    p_severity: input.severity ?? null,
    p_assigned_to: input.assigned_to ?? null,
  });
  if (error) throw new Error(error.message);
  // D8 R2 P2-9: the RPC RETURNS TABLE, so PostgREST delivers an array
  // of rows — unwrap the single row (empty only on server bugs).
  const rows = (data ?? []) as CreateBuildingRepairResult[];
  if (!Array.isArray(rows) || rows.length < 1) {
    throw new Error("create_building_repair returned no row");
  }
  return rows[0];
}

export async function deleteBuildingRound(id: string): Promise<void> {
  const { error } = await supabase.from("inspection_round").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useBuildingRounds(limit = 30) {
  const q = useQuery({
    queryKey: ["building-rounds", limit] as const,
    queryFn: () => fetchBuildingRounds(limit),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}
