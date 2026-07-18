/**
 * WO-V1a — Repair-request data layer.
 *
 * Talks to `core.repair_request` (Supabase, RLS-gated — see acceptance
 * verify log in `docs/work-orders/V1a-repair-data.md`). Mirrors the
 * pattern in `supabase-queries.ts` (plain async functions) + the read
 * hooks in `hooks.ts` (loading/error/refresh).
 *
 * Schema (verified live 2026-07-17 against ENV_DB):
 *   id            uuid       PK, default gen_random_uuid()
 *   equipment_id  uuid       NULL → core.equipment(id)
 *   reading_id    uuid       NULL → wastewater.reading(id)
 *   reported_by   uuid       NULL → core.app_user(id) — filled by trigger/auth.uid()
 *   cause         text       NOT NULL  (the only required user input)
 *   status        repair_status  NOT NULL, default 'open'
 *   created_at    timestamptz   NOT NULL, default now()
 *   resolved_at   timestamptz   NULL
 *
 * NOTE: there is NO `reported_date` column — the older `createReading`
 * flow in supabase-queries.ts still sends one; that insert fails but is
 * swallowed by a try/catch. This module intentionally omits it.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────

export type RepairStatus = "open" | "in_progress" | "resolved" | "cancelled";

export interface RepairRequest {
  id: string;
  equipment_id: string | null;
  reading_id: string | null;
  reported_by: string | null;
  cause: string;
  status: RepairStatus;
  created_at: string;
  resolved_at: string | null;
}

/** Input for createRepairRequest. `cause` is required (NOT NULL in DB). */
export interface RepairRequestInput {
  equipment_id?: string | null;
  reading_id?: string | null;
  cause: string;
}

// ─── Async functions ─────────────────────────────────────────────────────

/**
 * Insert a new repair_request row. `reported_by` is filled by a DB trigger
 * or RLS default — do NOT set it client-side (would be spoofable).
 *
 * Returns the inserted row (status defaults to 'open' server-side).
 */
export async function createRepairRequest(
  input: RepairRequestInput,
): Promise<RepairRequest> {
  const cause = input.cause?.trim();
  if (!cause) throw new Error("cause is required");

  const { data, error } = await supabase
    .from("repair_request")
    .insert({
      equipment_id: input.equipment_id ?? null,
      reading_id: input.reading_id ?? null,
      cause,
      // status defaults to 'open' in DB; don't send to avoid overriding
    })
    .select("id, equipment_id, reading_id, reported_by, cause, status, created_at, resolved_at")
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("repair_request insert returned no row");
  return data as RepairRequest;
}

/**
 * Fetch repair requests, newest first. Default limit 50 — the table is
 * expected to stay small (manual entries only).
 *
 * `includeResolved` defaults to true (the list page wants history). The
 * notification bell (V3a/V3b) will filter on status='open' separately.
 */
export async function fetchRepairRequests(
  limit = 50,
  includeResolved = true,
): Promise<RepairRequest[]> {
  let q = supabase
    .from("repair_request")
    .select("id, equipment_id, reading_id, reported_by, cause, status, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includeResolved) {
    q = q.eq("status", "open");
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as RepairRequest[];
}

/** Mark a request as resolved (sets resolved_at via DB default on status change
 * only if a trigger handles it; we set it explicitly to be safe). */
export async function resolveRepairRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from("repair_request")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Hooks (mirror the style of hooks.ts) ────────────────────────────────

/**
 * useRepairRequests — read hook with refresh. Pass `includeResolved=false`
 * to get only open requests (e.g. for the notification bell).
 */
export function useRepairRequests(
  limit = 50,
  includeResolved = true,
) {
  const [data, setData] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    fetchRepairRequests(limit, includeResolved)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, includeResolved, nonce]);

  return { data, loading, error, refresh };
}
