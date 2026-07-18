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
 * Build a schema context string for the AI from current table list +
 * row counts (used by DBA-8/9 to give the model useful grounding).
 */
export async function buildSchemaContext(): Promise<string> {
  const tables = [
    "wastewater.reading", "carbon.reading", "carbon.emission_factor",
    "water_supply.daily_check", "garbage.collection_log", "fuel.dispense_log",
    "garden.work_round", "building.inspection_round", "safety.monthly_check",
    "food.lab_test", "chemical.master", "chemical.movement",
    "core.repair_request", "core.personnel",
  ];
  const lines: string[] = [];
  for (const t of tables) {
    const name = t.split(".")[1];
    try {
      const { count } = await supabase.from(name!).select("*", { count: "exact", head: true });
      lines.push(`${t}: ~${count ?? 0} rows`);
    } catch {
      lines.push(`${t}: ?`);
    }
  }
  return "Tables (approx row counts):\n" + lines.join("\n");
}
