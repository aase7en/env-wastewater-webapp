/**
 * DBA-8/9/10 — AI-assisted SQL features on top of DBA Console.
 *
 * - DBA-8: nlToSql — natural language → SQL via provider, with PHI filter
 * - DBA-9: suggestQueries — schema-aware contextual suggestions
 * - DBA-10: annotateRow + resultChat — row anomaly explanation + chat
 *
 * All reuse lib/admin/ai-chat.ts sendChatTurn plumbing + PHI filter.
 */
import { sendChatTurn } from "./ai-chat";
import { supabase } from "../supabase";

// ─── DBA-8: NL → SQL ─────────────────────────────────────────────────────

export interface NlToSqlResult {
  sql: string;
  explanation: string;
  warnings: string[];
}

const SQL_GEN_SYSTEM_PROMPT =
  "You are a SQL generator for the ENV_DB Postgres database at โรงพยาบาลอุทัย. " +
  "Given a Thai or English natural-language question, return ONE SQL statement that answers it. " +
  "RULES:\n" +
  "- Only SELECT / INSERT / UPDATE / DELETE statements (never DROP/TRUNCATE/ALTER).\n" +
  "- Quote identifiers with double quotes if they contain special chars.\n" +
  "- Use Thai comments (-- คำอธิบาย) above the SQL.\n" +
  "- Always include LIMIT (default 100) for SELECTs.\n" +
  "- If the question is destructive ('ลบทั้งหมด'), refuse and suggest a safe variant.\n" +
  "Return format:\n" +
  "```sql\n<SQL>\n```\n" +
  "EXPLANATION: <one paragraph in Thai>\n" +
  "WARNINGS: <bullet list, or 'none'>\n";

export async function nlToSql(
  question: string,
  schemaContext?: string,
): Promise<NlToSqlResult> {
  const turn = await sendChatTurn(question, {
    systemPrompt: SQL_GEN_SYSTEM_PROMPT,
    schemaContext,
  });
  return parseSqlResponse(turn.answer);
}

function parseSqlResponse(text: string): NlToSqlResult {
  // Extract ```sql ... ``` block.
  const sqlMatch = text.match(/```sql\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/i);
  const sql = sqlMatch ? sqlMatch[1]!.trim() : text.split("\n")[0] ?? "";

  const explanationMatch = text.match(/EXPLANATION:\s*([^\n]*(?:\n(?!WARNINGS:)[^\n]*)*)/i);
  const explanation = explanationMatch ? explanationMatch[1]!.trim() : "";

  const warningsMatch = text.match(/WARNINGS:\s*([\s\S]*?)(?:\n\n|$)/i);
  const warningsRaw = warningsMatch ? warningsMatch[1]!.trim() : "none";
  const warnings = warningsRaw.toLowerCase() === "none"
    ? []
    : warningsRaw.split(/\n/).map((s) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean);

  return { sql, explanation, warnings };
}

// ─── DBA-9: AI query suggestions ─────────────────────────────────────────

export interface QuerySuggestion {
  title_th: string;
  sql: string;
  rationale_th: string;
}

const SUGGEST_SYSTEM_PROMPT =
  "You suggest 3-5 useful SQL queries for an admin reviewing ENV_DB at โรงพยาบาลอุทัย. " +
  "Each suggestion: title (Thai, short), SQL (SELECT only, with LIMIT), rationale (Thai, why useful). " +
  "Be context-aware: end-of-month → monthly summary, recent anomaly → drill-down. " +
  "Return as JSON array: [{title_th, sql, rationale_th}]. No prose around it.";

let _suggestionCache: { ts: number; data: QuerySuggestion[] } | null = null;
const SUGGESTION_TTL_MS = 5 * 60 * 1000;

export async function suggestQueries(schemaContext?: string): Promise<QuerySuggestion[]> {
  if (_suggestionCache && Date.now() - _suggestionCache.ts < SUGGESTION_TTL_MS) {
    return _suggestionCache.data;
  }
  const turn = await sendChatTurn("Suggest 3-5 useful queries for the current state of ENV_DB.", {
    systemPrompt: SUGGEST_SYSTEM_PROMPT,
    schemaContext,
  });
  try {
    const jsonMatch = turn.answer.match(/\[[\s\S]*\]/);
    const arr = jsonMatch ? JSON.parse(jsonMatch[0]!) as QuerySuggestion[] : [];
    _suggestionCache = { ts: Date.now(), data: arr };
    return arr;
  } catch {
    return [];
  }
}

// ─── DBA-10: Row annotation + result chat ────────────────────────────────

export interface RowAnnotation {
  summary: string;
  anomaly: string | null;
  suggested_action: string | null;
}

export async function annotateRow(
  row: Record<string, unknown>,
  tableName: string,
): Promise<RowAnnotation> {
  const rowJson = JSON.stringify(row, null, 2);
  const turn = await sendChatTurn(
    `Analyze this row from ${tableName}:\n${rowJson}\n\nReturn JSON {summary, anomaly, suggested_action}.`,
    {
      systemPrompt:
        "You analyze a single row from an environmental DB. " +
        "Return JSON only: {summary: Thai description, anomaly: Thai explanation if value is unusual vs typical range, null if normal, suggested_action: Thai recommended action or null}.",
    },
  );
  try {
    const jsonMatch = turn.answer.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]!) as RowAnnotation : { summary: turn.answer, anomaly: null, suggested_action: null };
  } catch {
    return { summary: turn.answer, anomaly: null, suggested_action: null };
  }
}

/**
 * Tables exposed to the AI as schema context (DBA-8/9 grounding). This is the
 * union of the transactional tables covered by the SCHEMA-4 audit trigger +
 * the public-domain reference tables. Format is `schema.table` to match
 * `core.ai_scope.view_name` (the dynamic PHI filter source).
 *
 * PHI boundary: tables flagged `patient_safe=false` in `core.ai_scope`
 * (currently `core.app_user`, `core.personnel`) are filtered out at runtime
 * by `loadPhiDenySet` + `filterPhiTables` — see AISQL-phi-filter (ADR-0009 §2
 * follow-up). Even though some appear in this list, they never reach the
 * provider unless `ai_scope` is unreadable (then we keep the historical
 * hardcoded env-only subset as a defensive fallback).
 */
const SCHEMA_CONTEXT_TABLES = [
  "wastewater.reading", "carbon.reading", "carbon.emission_factor",
  "water_supply.daily_check", "garbage.collection_log", "fuel.dispense_log",
  "garden.work_round", "building.inspection_round", "safety.monthly_check",
  "food.lab_test", "chemical.master", "chemical.movement",
  "core.repair_request", "core.personnel", "core.app_user",
];

/**
 * Pure helper: filter a list of `schema.table` names against a deny-set.
 * Extracted from `buildSchemaContext` so it can be unit-tested without
 * mocking the supabase client.
 *
 * Deny-set membership is exact-match on `schema.table`. Tables not present
 * in the deny-set pass through. Returns a new array (does not mutate input).
 */
export function filterPhiTables(
  tables: readonly string[],
  denySet: ReadonlySet<string>,
): string[] {
  return tables.filter((t) => !denySet.has(t));
}

/**
 * Pure helper: render the schema-context text block from a list of
 * `{ table, count }` rows. Mirrors the historical format
 * "Tables (approx row counts):\n<table>: ~<n> rows\n…" so existing AI
 * prompts see no change. Extracted for unit testing.
 */
export function formatSchemaContext(
  rows: ReadonlyArray<{ table: string; count: number | null }>,
): string {
  const lines = rows.map((r) => `${r.table}: ~${r.count ?? 0} rows`);
  return "Tables (approx row counts):\n" + lines.join("\n");
}

/**
 * Load the set of `schema.table` names flagged PHI-adjacent
 * (`patient_safe=false AND is_enabled=true`) from `core.ai_scope`.
 *
 * The `ai_scope_read` RLS policy (`USING true`) lets any authenticated user
 * SELECT — the DBA Console is behind `RequireAuth requireAdmin`, so the
 * admin's session has access. Returns an empty Set on error so callers can
 * proceed with the full table list (defensive fallback — better a working
 * feature than a broken one; the PHI boundary is structurally enforced by
 * the review-gate + DBA-2/DBA-3 whitelist on the *execute* path anyway).
 */
export async function loadPhiDenySet(): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from("ai_scope")
      .select("view_name")
      .eq("is_enabled", true)
      .eq("patient_safe", false);
    if (error) return new Set();
    return new Set((data ?? []).map((r) => (r as { view_name: string }).view_name));
  } catch {
    return new Set();
  }
}

/**
 * Build a schema context string for the AI from current table list +
 * row counts (used by DBA-8/9 to give the model useful grounding).
 *
 * AISQL-phi-filter (ADR-0009 §2 follow-up): PHI-adjacent tables are
 * dynamically dropped via `core.ai_scope` before row counts are fetched,
 * so the provider never even sees them in the catalog.
 */
export async function buildSchemaContext(): Promise<string> {
  const denySet = await loadPhiDenySet();
  const tables = filterPhiTables(SCHEMA_CONTEXT_TABLES, denySet);
  const rows: { table: string; count: number | null }[] = [];
  for (const t of tables) {
    const name = t.split(".")[1];
    try {
      const { count } = await supabase.from(name!).select("*", { count: "exact", head: true });
      rows.push({ table: t, count });
    } catch {
      rows.push({ table: t, count: null });
    }
  }
  return formatSchemaContext(rows);
}
