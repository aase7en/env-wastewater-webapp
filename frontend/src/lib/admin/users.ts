/**
 * OAUTH-3 (2026-07-21) — admin approval data layer.
 *
 * Lists pending OAuth users + promotes / rejects via SECURITY DEFINER
 * RPCs. Pattern mirrors lib/admin/ai-providers.ts: typed helpers over
 * supabase client, errors surfaced as JS Error for the page's toast.
 *
 * Scope: pure Track Z (no UI, no className). The PendingUsersPage is
 * the consumer.
 *
 * AUTH-7.5 (2026-07-30): added countPendingUsers + usePendingUsers so the
 * new PendingUsersBell can show a live count + queue preview without
 * re-fetching in the page. Mirrors lib/alerts.ts (countUnreadAlerts +
 * useThresholdAlerts) verbatim — poll 60s + window focus / visibility
 * refresh (NOT realtime; free-tier discipline).
 */
import { useCallback, useEffect, useRef, useState } from "react";
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

// ─── AUTH-7.5: count + polling hook (mirror lib/alerts.ts) ───────────────

/** Count users awaiting admin approval (role='pending', is_active=true).
 *  Head-count REST query — same pattern as countUnreadAlerts. Admin-only
 *  by RLS (app_user_admin_all via core.fn_is_admin); staff users get 0. */
export async function countPendingUsers(): Promise<number> {
  const { count, error } = await supabase
    .from("app_user")
    .select("id", { count: "exact", head: true })
    .eq("role", "pending")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * usePendingUsers — read hook with poll + on-focus refresh (NOT realtime).
 *
 * Mirrors useThresholdAlerts (lib/alerts.ts): poll every `pollMs` (default
 * 60s) + refresh on window focus / document visibility → visible. Fetches
 * the queue list (limit 10, oldest-first) AND the exact count in one
 * Promise.all so the bell badge + dropdown preview stay consistent.
 *
 * Returns { users, count, loading, error, refresh }. Mutations
 * (approve/reject) are handled by the page, not here — the poll picks up
 * the resulting state change within pollMs.
 */
export function usePendingUsers(pollMs = 60_000) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // useRef to keep the interval stable across renders without re-subscribing.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [rows, n] = await Promise.all([
        // Dropdown preview: oldest-first, limit 10 (the page shows the full queue).
        supabase
          .from("app_user")
          .select("id, display_name, email, created_at, is_active")
          .eq("role", "pending")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(10)
          .then(({ data, error }) => {
            if (error) throw new Error(error.message);
            return (data ?? []) as PendingUser[];
          }),
        countPendingUsers(),
      ]);
      setUsers(rows);
      setCount(n);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial + interval + focus/visibility refresh.
  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, pollMs);

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, pollMs]);

  return { users, count, loading, error, refresh };
}
