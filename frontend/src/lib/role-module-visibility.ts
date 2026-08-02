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
import { useCallback, useEffect, useState } from "react";
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
 * Returns { hidden, loading }. On error, returns an empty set (fail-open
 * for visibility — this is presentation, not security; an empty set means
 * "show everything", which is the safe default).
 */
export function useHiddenModules(role: AppRole | null | undefined): {
  hidden: Set<string>;
  loading: boolean;
} {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) {
      setHidden(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchHiddenModules(role)
      .then((set) => {
        if (!cancelled) setHidden(set);
      })
      .catch(() => {
        // Fail-open: empty hidden set = show everything. Presentation only.
        if (!cancelled) setHidden(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return { hidden, loading };
}

/**
 * useAllVisibility — admin matrix read + mutation helpers. Powers the
 * admin visibility sheet (roles × modules toggles).
 */
export function useAllVisibility() {
  const [rows, setRows] = useState<RoleModuleVisibilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAllVisibility());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setVisibility = useCallback(
    async (role: AppRole, module_key: string, visible: boolean) => {
      await setModuleVisibility(role, module_key, visible);
      // Optimistic local update — the matrix reflects the change immediately.
      setRows((prev) => {
        const i = prev.findIndex(
          (r) => r.role === role && r.module_key === module_key,
        );
        if (i === -1) {
          return [
            ...prev,
            { role, module_key, visible, updated_at: new Date().toISOString() },
          ];
        }
        const next = [...prev];
        next[i] = { ...next[i], visible };
        return next;
      });
    },
    [],
  );

  return { rows, loading, error, refresh, setVisibility };
}
