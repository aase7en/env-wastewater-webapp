/**
 * AI-1 — Provider config data layer.
 * Reads/writes core.ai_provider. key_value is admin-only via RLS.
 *
 * Public projection: core.v_ai_provider_public (omits key_value).
 * Staff sessions use fetchPublicProviders() to list what's available
 * without seeing keys. Admin uses full CRUD.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

export interface AiProviderPublic {
  id: string;
  name: string;
  base_url: string;
  model: string;
  model_id: string | null;
  api_url: string | null;
  priority: number;
  is_enabled: boolean;
}

export interface AiProviderFull extends AiProviderPublic {
  key_env_var: string;
  key_value: string | null;
}

export type AiProviderInput = Omit<AiProviderFull, "id">;

const PUBLIC_COLS = "id, name, base_url, model, model_id, api_url, priority, is_enabled";
const FULL_COLS = PUBLIC_COLS + ", key_env_var, key_value";

/** Public list — anyone authenticated can read (no key_value). */
export async function fetchPublicProviders(): Promise<AiProviderPublic[]> {
  const { data, error } = await supabase
    .from("v_ai_provider_public")
    .select(PUBLIC_COLS)
    .order("priority");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]) as AiProviderPublic[];
}

/** Admin full list — includes key_value (RLS admin-only). */
export async function fetchAdminProviders(): Promise<AiProviderFull[]> {
  const { data, error } = await supabase
    .from("ai_provider")
    .select(FULL_COLS)
    .order("priority");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]) as AiProviderFull[];
}

export async function upsertProvider(input: AiProviderInput & { id?: string }): Promise<AiProviderFull> {
  if (input.id) {
    const { data, error } = await supabase
      .from("ai_provider")
      .update(input)
      .eq("id", input.id)
      .select(FULL_COLS)
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as AiProviderFull;
  }
  const { data, error } = await supabase
    .from("ai_provider")
    .insert(input)
    .select(FULL_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as AiProviderFull;
}

export async function deleteProvider(id: string): Promise<void> {
  const { error } = await supabase.from("ai_provider").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useAdminProviders() {
  const [data, setData] = useState<AiProviderFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    fetchAdminProviders()
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [nonce]);

  return { data, loading, error, refresh };
}
