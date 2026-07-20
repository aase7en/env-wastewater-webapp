/**
 * OAUTH-3 (2026-07-21) — admin approval data layer.
 *
 * Lists pending OAuth users + promotes / rejects via SECURITY DEFINER
 * RPCs. Pattern mirrors lib/admin/ai-providers.ts: typed helpers over
 * supabase client, errors surfaced as JS Error for the page's toast.
 *
 * Scope: pure Track Z (no UI, no className). The PendingUsersPage is
 * the consumer.
 */
import { supabase } from "../supabase";

export interface PendingUser {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  is_active: boolean;
}

/**
 * Fetch users awaiting admin approval (role='pending', is_active=true).
 * Ordered oldest-first so admins work through the queue in arrival order.
 */
export async function fetchPendingUsers(): Promise<PendingUser[]> {
  const { data, error } = await supabase
    .from("app_user")
    .select("id, display_name, email, created_at, is_active")
    .eq("role", "pending")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingUser[];
}

/**
 * Promote a pending user to staff. Calls public.fn_approve_user (thin
 * wrapper over core.fn_approve_user SECURITY DEFINER) — admin check is
 * enforced server-side. Throws on permission denied or RPC error.
 */
export async function approveUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("fn_approve_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
}

/**
 * Deactivate a user (is_active=false). Does NOT delete the auth.users
 * row — one-way door. Calls public.fn_reject_user (same pattern as
 * approve). Throws on permission denied or RPC error.
 */
export async function rejectUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("fn_reject_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
}
