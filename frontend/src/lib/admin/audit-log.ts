/**
 * P4-audit-viewer (2026-07-21, ADR-0009 §3) — read-only audit-log data layer.
 *
 * `core.audit_log` is populated by the SCHEMA-4 trigger on every
 * INSERT/UPDATE/DELETE of transactional tables, exposed read-only as
 * `public.audit_log` (`security_invoker=on`, admin-gated by the
 * `audit_log_admin_all` RLS policy, granted to `authenticated`). A non-admin
 * gets 401/42501 at the DB layer; the route is `RequireAuth requireAdmin` on
 * top of that. **No new SQL** — this lib is pure supabase-client reads.
 *
 * Pattern: mirror lib/admin/users.ts — typed helpers over `supabase`, errors
 * surfaced as JS Error for the page's toast.
 *
 * Column contract (verified against reports/schema-snapshot-live.md
 * `core.audit_log` 2026-07-21): `id bigint, actor uuid, action text,
 * table_name text, row_id text, changed_at timestamptz, old_data jsonb,
 * new_data jsonb`. NOTE: the time column is `changed_at`, NOT `created_at`
 * (the WO's draft column list named it `created_at` — corrected here against
 * the live snapshot).
 */
import { supabase } from "../supabase";

export interface AuditLogRow {
  /** bigint in DB; PostgREST returns it as a string to preserve precision. */
  id: string;
  actor: string | null;
  action: string;
  table_name: string;
  row_id: string | null;
  changed_at: string;
  old_data: unknown;
  new_data: unknown;
}

export interface AuditLogFilter {
  action?: "INSERT" | "UPDATE" | "DELETE";
  table_name?: string;
  /** ISO date — `changed_at >= start of this day`. */
  from?: string;
  /** ISO date — `changed_at <= end of this day`. */
  to?: string;
  /** Default 100, clamped to [1, 500]. */
  limit?: number;
}

const MIN_LIMIT = 1;
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

function clampLimit(n: number | undefined): number {
  if (!Number.isFinite(n) || n === undefined) return DEFAULT_LIMIT;
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(n)));
}

/**
 * Fetch recent audit rows, newest-first. Throws on DB/RLS error (the page's
 * toast surfaces the message). The `audit_log_admin_all` policy filters
 * non-admins to 401 at the DB — no client-side admin check needed here.
 */
export async function fetchAuditLog(f?: AuditLogFilter): Promise<AuditLogRow[]> {
  let q = supabase
    .from("audit_log")
    .select("id, actor, action, table_name, row_id, changed_at, old_data, new_data")
    .order("changed_at", { ascending: false })
    .limit(clampLimit(f?.limit));

  if (f?.action) q = q.eq("action", f.action);
  if (f?.table_name) q = q.eq("table_name", f.table_name);
  if (f?.from) q = q.gte("changed_at", f.from);
  if (f?.to) q = q.lte("changed_at", `${f.to}T23:59:59.999Z`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLogRow[];
}
