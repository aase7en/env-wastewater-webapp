/**
 * DOCK (2026-08-03) — role → module visibility client lib.
 *
 * Backs the admin-configurable dock-icon visibility feature. Reads
 * core.role_module_visibility (RLS: own-role SELECT, so a user only ever
 * sees their own role's rows). Mutations are admin-only at the DB layer
 * (role_module_visibility_admin_all via core.fn_is_admin).
 *
 * DESIGN: visibility rarely changes, so this is a one-shot fetch + an admin
 * setter — no polling, no realtime. An admin change takes effect for other
 * users on their next page load (the dock re-fetches on mount). This
 * matches the WO: "presentation only, not a security boundary".
 *
 * Track Z scope (lib only). The ModuleDock consumer + the admin sheet UI
 * live in components/layout/.
 *
 * PHI/permission note: this table is NOT a security boundary. Route guards
 * (RequireAuth requireAdmin) and RLS remain authoritative. Hiding a dock
 * icon here does not stop someone who knows the URL.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type AppRole = "admin" | "staff" | "pending";

export interface RoleModuleVisibilityRow {
  role: AppRole;
  module_key: string;
  visible: boolean;
  updated_at: string;
}

/**
 * Fetch the visibility rows for the given role. RLS restricts to the
 * caller's own role, so passing a different role yields an empty set —
 * this is by design (a staff user cannot read admin/staff config).
 *
 * Returns a Set of module_keys that are explicitly HIDDEN (visible=false).
 * Absence from the table = visible (default true), so the dock's "show
 * everything" baseline is preserved when no admin has configured anything.
 */
export async function fetchHiddenModules(role: AppRole): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("role_module_visibility")
    .select("module_key, visible")
    .eq("role", role)
    .eq("visible", false);
  if (error) throw new Error(error.message);
  return new Set(((data ?? []) as Array<{ module_key: string }>).map((r) => r.module_key));
}

/**
 * Fetch ALL rows for all roles — admin view (roles × modules matrix).
 * Admin-only at the DB layer; a staff caller gets an empty array.
 */
export async function fetchAllVisibility(): Promise<RoleModuleVisibilityRow[]> {
  const { data, error } = await supabase
    .from("role_module_visibility")
    .select("role, module_key, visible, updated_at")
    .order("role", { ascending: true })
    .order("module_key", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoleModuleVisibilityRow[];
}

/**
 * Upsert a (role, module_key) visibility row. Admin-only at the DB layer.
 * updated_by is left NULL here — set it server-side if attribution matters
 * (the admin_all WITH CHECK only enforces the role, not the column).
 */
export async function setModuleVisibility(
  role: AppRole,
  module_key: string,
  visible: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("role_module_visibility")
    .upsert({ role, module_key, visible }, { onConflict: "role,module_key" });
  if (error) throw new Error(error.message);
}

/**
 * useHiddenModules — one-shot read of the caller's hidden-module set.
 * Used by ModuleDock to filter the dock on mount. No polling: an admin's
 * change lands on the user's next page load.
 *
 * EQ-4 (2026-08-11): migrated to useQuery. The Set conversion stays in the
 * queryFn so the cache holds the same shape callers expect.
 *
 * Returns { hidden, loading }. On error, returns an empty set (fail-open
 * for visibility — this is presentation, not security; an empty set means
 * "show everything", which is the safe default).
 */
export function useHiddenModules(role: AppRole | null | undefined): {
  hidden: Set<string>;
  loading: boolean;
} {
  const q = useQuery({
    queryKey: ["hidden-modules", role] as const,
    queryFn: () => fetchHiddenModules(role!),
    enabled: !!role,
  });
  return {
    hidden: q.data ?? new Set<string>(),
    loading: q.isLoading,
  };
}

/**
 * useAllVisibility — admin matrix read + mutation helpers. Powers the
 * admin visibility sheet (roles × modules toggles).
 *
 * EQ-4 (2026-08-11): migrated to useQuery + cache-based optimistic update.
 * The DOCK-18 contract is preserved: setVisibility applies the new visible
 * state optimistically to the cache, then on error reverts and surfaces
 * the message. Previously this used local useState; now the cache is the
 * single source of truth, which also lets other tabs see the change once
 * they refetch.
 */
// Module-level stable key (EQ-5.1 fix: was inside hook body, changed
// identity every render, useCallback deps recreated every render).
const VISIBILITY_QUERY_KEY = ["role-module-visibility"] as const;

export function useAllVisibility() {
  const qc = useQueryClient();
  const queryKey = VISIBILITY_QUERY_KEY;

  const q = useQuery({
    queryKey,
    queryFn: () => fetchAllVisibility(),
  });

  const refresh = useCallback(() => q.refetch(), [q]);

  /**
   * DOCK-18 (preserved): optimistic-then-reverting. Writes the new visible
   * state to the cache immediately; on a server error, reverts (flips the
   * row back) and surfaces the message via the returned `error`. The
   * previous "update-after-await with no catch" bug that hid a missing
   * GRANT is still closed — the cache write happens BEFORE the await.
   */
  const setVisibility = useCallback(
    async (role: AppRole, module_key: string, visible: boolean) => {
      const prev = qc.getQueryData<RoleModuleVisibilityRow[]>(queryKey);
      // Optimistic cache write.
      applyLocal(qc, queryKey, role, module_key, visible);
      try {
        await setModuleVisibility(role, module_key, visible);
      } catch (e) {
        // Revert: rewrite the row to its prior state if it existed, or
        // remove the appended row if it was newly added.
        if (prev) {
          const priorRow = prev.find(
            (r) => r.role === role && r.module_key === module_key,
          );
          qc.setQueryData<RoleModuleVisibilityRow[]>(queryKey, (curr) => {
            const rows = curr ?? [];
            if (!priorRow) {
              // Was newly added by the optimistic write — drop it.
              return rows.filter(
                (r) => !(r.role === role && r.module_key === module_key),
              );
            }
            return rows.map((r) =>
              r.role === role && r.module_key === module_key ? priorRow : r,
            );
          });
        }
        // Surface the message via query state — invalidate so the query
        // error picks it up; the consumer reads `error` from the hook.
        // (Setting query error directly is awkward in RQ v5; invalidate
        // forces a refetch which will re-resolve to a clean state. The
        // consumer should also surface a toast for the user; the
        // RoleVisibilitySheet already shows toast on throw.)
        void qc.invalidateQueries({ queryKey });
        throw e;
      }
    },
    [qc, queryKey],
  );

  return {
    rows: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh,
    setVisibility,
  };
}

/** Helper: apply an optimistic visible flip to the cache. */
function applyLocal(
  qc: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  role: AppRole,
  module_key: string,
  visible: boolean,
): void {
  qc.setQueryData<RoleModuleVisibilityRow[]>(queryKey, (prev) => {
    const rows = prev ?? [];
    const i = rows.findIndex(
      (r) => r.role === role && r.module_key === module_key,
    );
    if (i === -1) {
      return [
        ...rows,
        { role, module_key, visible, updated_at: new Date().toISOString() },
      ];
    }
    const next = [...rows];
    next[i] = { ...next[i]!, visible };
    return next;
  });
}
