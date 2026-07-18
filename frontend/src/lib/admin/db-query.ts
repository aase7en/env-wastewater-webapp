/**
 * DBA-2 — DBA Console query runner.
 *
 * Client-side query execution layer. Two safety mechanisms (defense in
 * depth — DBA-3 Edge Function re-applies the same checks server-side):
 *
 *   1. Statement whitelist — `isStatementAllowed(sql)` pure function.
 *      Regex-based first pass; fast and unit-testable. Rejects obvious
 *      destructive keywords (DROP/TRUNCATE/ALTER/GRANT/REVOKE/CREATE/
 *      VACUUM/ANALYZE). Allows only SELECT/INSERT/UPDATE/DELETE + WITH
 *      (CTE that resolves to a SELECT).
 *
 *   2. RLS-bounded execution — uses the shared `lib/supabase.ts` client
 *      (publishable/anon key, authenticated session). No service_role
 *      key in the browser. Admin queries run under their own auth.uid()
 *      → underlying table policies gate every read/write.
 *
 * Two modes (per WO-DBA-2):
 *   - Builder mode: structured query → supabase-js `.from().select().eq()` chain.
 *   - Raw mode: raw SQL → supabase `.rpc('admin_run_query', { sql })` which
 *     invokes the DBA-3 Edge Function. (The RPC is a placeholder name until
 *     DBA-3 lands — the client falls back to builder-only until then.)
 *
 * All mutations land in `core.audit_log` automatically via SCHEMA-4 trigger.
 *
 * Track Z scope (lib only — no UI, no className).
 */

import { supabase } from "../supabase";

// ─── Types ───────────────────────────────────────────────────────────────

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  columns: string[];
  elapsedMs: number;
}

export interface ExplainResult {
  text: string;
  estimatedRows: number | null;
}

export type StatementCheck =
  | { ok: true }
  | { ok: false; reason: string };

export interface BuilderQuery {
  table: string;            // e.g. "wastewater.reading"
  columns?: string[];       // default ["*"]
  filters?: Array<{
    column: string;
    operator: "=" | "<>" | "<" | "<=" | ">" | ">=" | "like" | "ilike" | "in" | "is";
    value: unknown;
  }>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;           // default 1000, max 10000
}

// ─── Statement whitelist (layer 1 — pure, unit-testable) ────────────────

const ALLOWED_LEADING = /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|WITH)\b/i;

// Forbidden anywhere in the statement — case-insensitive. Word-boundaried so
// e.g. a column named "dropbox" doesn't trigger. Multi-statement is blocked
// by checking for `;` followed by non-whitespace after the first statement
// (covered separately below).
const FORBIDDEN_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\bDROP\b/i,            label: "DROP" },
  { re: /\bTRUNCATE\b/i,        label: "TRUNCATE" },
  { re: /\bALTER\b/i,           label: "ALTER" },
  { re: /\bGRANT\b/i,           label: "GRANT" },
  { re: /\bREVOKE\b/i,          label: "REVOKE" },
  { re: /\bCREATE\b/i,          label: "CREATE" },
  { re: /\bVACUUM\b/i,          label: "VACUUM" },
  { re: /\bANALYZE\b/i,         label: "ANALYZE" },
  { re: /\bCOPY\b/i,            label: "COPY" },
  { re: /\bCALL\b/i,            label: "CALL" },
  { re: /\bDO\b\s+\$\$/i,       label: "DO (anonymous code block)" },
  // Service-role bypass attempts
  { re: /\bSET\s+ROLE\b/i,      label: "SET ROLE" },
  { re: /\bRESET\s+ROLE\b/i,    label: "RESET ROLE" },
];

/**
 * Pure statement whitelist check. Layer 1 of defense in depth.
 *
 * Rules:
 *  1. Must start with SELECT / INSERT INTO / UPDATE / DELETE FROM / WITH.
 *  2. Must NOT contain any FORBIDDEN keyword (word-boundaried).
 *  3. Must NOT contain `;` followed by another statement (multi-statements
 *     blocked — the only `;` allowed is the trailing terminator or none).
 *  4. Comments stripped before check — SQL line and block comments are
 *     removed so attackers can't hide keywords inside comments. (Layer 2
 *     in the Edge Function uses a real parser as stronger guarantee.)
 *
 * Returns `{ ok: false, reason }` on rejection — caller shows toast.
 */
export function isStatementAllowed(rawSql: string): StatementCheck {
  if (!rawSql || !rawSql.trim()) {
    return { ok: false, reason: "SQL ว่างเปล่า" };
  }

  // Strip comments before checking keywords.
  const sql = stripComments(rawSql);

  // Rule 1: leading keyword whitelist.
  if (!ALLOWED_LEADING.test(sql)) {
    return {
      ok: false,
      reason:
        "คำสั่งต้องเริ่มด้วย SELECT / INSERT INTO / UPDATE / DELETE FROM / WITH เท่านั้น",
    };
  }

  // Rule 2: forbidden keyword scan.
  for (const { re, label } of FORBIDDEN_PATTERNS) {
    if (re.test(sql)) {
      return {
        ok: false,
        reason: `คำสั่งต้องห้าม: ${label}. อนุญาตเฉพาะ SELECT/INSERT/UPDATE/DELETE`,
      };
    }
  }

  // Rule 3: multi-statement rejection. A single trailing `;` is allowed;
  // any `;` followed by more SQL is not.
  const trimmed = sql.trim().replace(/;\s*$/, "");
  if (trimmed.includes(";")) {
    // Any remaining `;` indicates stacked queries — reject.
    return {
      ok: false,
      reason: "ห้ามหลายคำสั่งในครั้งเดียว (stacked queries)",
    };
  }

  return { ok: true };
}

/**
 * Strip SQL line comments (`-- ...`) and block comments (slash-star to
 * star-slash). Used by isStatementAllowed so keyword scanning can't be
 * evaded by hiding keywords inside comments.
 *
 * NOT a security boundary by itself — the Edge Function (DBA-3) re-parses
 * with a real SQL parser as the authoritative check.
 */
export function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")   // block comments
    .replace(/--[^\n]*/g, " ");           // line comments
}

// ─── Builder mode (structured, supabase-js chain) ───────────────────────

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 10_000;

/**
 * Run a structured builder query via supabase-js. RLS-bounded — runs under
 * the current authenticated session, so admin sees exactly what their
 * table policies permit (currently `true`/`true` for authenticated → all
 * rows of every table they can access).
 */
export async function runBuilderQuery(
  q: BuilderQuery,
): Promise<QueryResult> {
  const limit = Math.min(Math.max(q.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const columns = (q.columns ?? ["*"]).join(", ");

  const start = performance.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chain: any = supabase.from(stripSchemaFromPostgrest(q.table)).select(columns);

  for (const f of q.filters ?? []) {
    chain = applyFilter(chain, f);
  }
  if (q.orderBy) {
    chain = chain.order(q.orderBy.column, {
      ascending: q.orderBy.ascending ?? false,
    });
  }
  chain = chain.limit(limit);

  const { data, error, count } = await chain;
  const elapsedMs = Math.round(performance.now() - start);

  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as unknown[]).map((r) => r as Record<string, unknown>);
  const columnsOut = rows.length > 0 ? Object.keys(rows[0]!) : [];

  return {
    rows,
    rowCount: count ?? rows.length,
    columns: columnsOut,
    elapsedMs,
  };
}

/**
 * PostgREST addresses tables as `<table>` (no schema prefix). The browser
 * only sees the exposed tables via the anon-key API. We strip the schema
 * prefix here so `wastewater.reading` becomes `reading` — this matches
 * how every existing lib/*.ts query is written.
 */
function stripSchemaFromPostgrest(table: string): string {
  const idx = table.indexOf(".");
  return idx >= 0 ? table.slice(idx + 1) : table;
}

/**
 * Apply a structured filter to the supabase-js chain. Uses `any` because
 * the supabase-js builder types change shape after every method call
 * (PostgrestFilterBuilder → PostgrestOrderBuilder → etc.) and threading
 * the full generic signature through is impractical for a dynamic UI.
 * Runtime correctness is verified by integration tests; type safety lives
 * in the BuilderQuery input contract.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain: any,
  f: NonNullable<BuilderQuery["filters"]>[number],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  switch (f.operator) {
    case "=":    return chain.eq(f.column, f.value);
    case "<>":   return chain.neq(f.column, f.value);
    case "<":    return chain.lt(f.column, f.value);
    case "<=":   return chain.lte(f.column, f.value);
    case ">":    return chain.gt(f.column, f.value);
    case ">=":   return chain.gte(f.column, f.value);
    case "like": return chain.like(f.column, String(f.value));
    case "ilike":return chain.ilike(f.column, String(f.value));
    case "in":   return chain.in(f.column, Array.isArray(f.value) ? f.value : [f.value]);
    case "is":   return chain.is(f.column, f.value);
  }
}

// ─── Raw SQL mode (via DBA-3 Edge Function RPC) ─────────────────────────

/**
 * Run a raw SQL string. First checks `isStatementAllowed`; then dispatches
 * to the `admin_run_query` Postgres function (installed by DBA-3 Edge
 * Function) which re-validates server-side before executing.
 *
 * If DBA-3 hasn't shipped yet, throws a clear "raw mode disabled" error
 * so the UI can fall back to builder mode gracefully.
 */
export async function runRawQuery(sql: string): Promise<QueryResult> {
  const check = isStatementAllowed(sql);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  const start = performance.now();
  const { data, error } = await supabase.rpc("admin_run_query", { sql_text: sql });
  const elapsedMs = Math.round(performance.now() - start);

  if (error) {
    // PGRST202 = function not found → DBA-3 not deployed yet.
    if (error.code === "PGRST202") {
      throw new Error(
        "Raw SQL mode ยังใช้ไม่ได้ — DBA-3 Edge Function ยังไม่ deploy. ใช้ Builder mode ก่อน.",
      );
    }
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as { rows?: Record<string, unknown>[]; rowCount?: number };
  const rows = payload.rows ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]!) : [];

  return {
    rows,
    rowCount: payload.rowCount ?? rows.length,
    columns,
    elapsedMs,
  };
}

/**
 * EXPLAIN preview for mutations. Shows the planner's row estimate so
 * admin can sanity-check an UPDATE/DELETE before committing.
 *
 * Wraps the SQL in `EXPLAIN <stmt>` and routes through runRawQuery
 * (same whitelist applies — EXPLAIN itself isn't allowed by the
 * whitelist, so this is a privileged internal helper).
 */
export async function runExplain(sql: string): Promise<ExplainResult> {
  const check = isStatementAllowed(sql);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  // Route directly to admin_explain RPC (DBA-3). Throws if not deployed.
  const { data, error } = await supabase.rpc("admin_explain", { sql_text: sql });
  if (error) {
    if (error.code === "PGRST202") {
      throw new Error("EXPLAIN ยังไม่พร้อม — DBA-3 ยังไม่ deploy");
    }
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as { text?: string; estimatedRows?: number | null };
  return {
    text: payload.text ?? "(no explain output)",
    estimatedRows: payload.estimatedRows ?? null,
  };
}

/**
 * Convenience: choose builder vs raw based on whether the user is using
 * the structured UI or the SQL editor.
 */
export async function runQuery(
  source: BuilderQuery | { raw: string },
): Promise<QueryResult> {
  if ("raw" in source) {
    return runRawQuery(source.raw);
  }
  return runBuilderQuery(source);
}
