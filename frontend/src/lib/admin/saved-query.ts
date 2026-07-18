/**
 * DBA-7 — Saved query CRUD lib.
 * Backed by core.saved_query table (DBA-1) with owner/shared/admin RLS.
 */
import { supabase } from "../supabase";

export interface SavedQuery {
  id: string;
  name: string;
  sql_text: string;
  description: string | null;
  created_by: string;
  is_shared: boolean;
  tags: string[];
  last_run_at: string | null;
  run_count: number;
  created_at: string;
}

export type SavedQueryInput = Pick<SavedQuery, "name" | "sql_text" | "is_shared"> & {
  description?: string | null;
  tags?: string[];
};

const COLS = "id, name, sql_text, description, created_by, is_shared, tags, last_run_at, run_count, created_at";

export async function listSavedQueries(): Promise<SavedQuery[]> {
  const { data, error } = await supabase
    .from("saved_query")
    .select(COLS)
    .order("updated_at", { ascending: false });
  // Some RLS setups may not expose updated_at; fall back to created_at.
  if (error && error.code === "42703") {
    const retry = await supabase
      .from("saved_query")
      .select(COLS)
      .order("created_at", { ascending: false });
    if (retry.error) throw new Error(retry.error.message);
    return (retry.data ?? []) as SavedQuery[];
  }
  if (error) throw new Error(error.message);
  return (data ?? []) as SavedQuery[];
}

export async function saveQuery(input: SavedQueryInput): Promise<SavedQuery> {
  const { data, error } = await supabase
    .from("saved_query")
    .insert({
      name: input.name,
      sql_text: input.sql_text,
      description: input.description ?? null,
      is_shared: input.is_shared,
      tags: input.tags ?? [],
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as SavedQuery;
}

export async function deleteQuery(id: string): Promise<void> {
  const { error } = await supabase.from("saved_query").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function incrementRunCount(id: string): Promise<void> {
  // Atomic increment via PG function (migration 20260719000007).
  // Non-critical — failures are swallowed (last_run_at still updates on next save).
  try {
    await supabase.rpc("increment_saved_query_run", { q_id: id });
  } catch {
    /* swallow */
  }
}

/** Toggle is_shared on a saved query (owner or admin only via RLS). */
export async function toggleShared(id: string, isShared: boolean): Promise<void> {
  const { error } = await supabase
    .from("saved_query")
    .update({ is_shared: isShared })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
