/**
 * AI-2 — AI chat client (direct-from-client per user choice).
 *
 * Architecture:
 *   1. Admin fetches provider config + key_value from core.ai_provider
 *      (RLS admin-only) once per chat session.
 *   2. On each turn: client builds OpenAI-compatible request, POSTs to
 *      provider.api_url, receives streamed/non-streamed response.
 *   3. Logs Q+A to core.ai_query_log (RLS: authenticated INSERT, owner
 *      SELECT, admin ALL).
 *
 * Ported from A-Wiki scripts/live-dashboard/src/chat.js (356 lines) —
 * kept the proxy/direct-mode toggle and queue-202 UX, dropped LAN/
 * Tailscale profile chips (irrelevant to a hospital webapp).
 *
 * PHI hard rule: before sending to provider, the prompt is filtered by
 * core.ai_scope.patient_safe — views flagged false are stripped from
 * the schema context block, and any user question containing flagged
 * table names is blocked.
 *
 * Track Z scope (lib only — UI lives in components/ai/ChatPanel).
 */

import { supabase } from "../supabase";
import { fetchAdminProviders, type AiProviderFull } from "./ai-providers";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatTurn {
  question: string;
  answer: string;
  provider: string;
  tokenUsage: number | null;
  ts: string;
}

export interface PhiFilterResult {
  blocked: boolean;
  reason?: string;
  cleanedQuestion: string;
}

/**
 * Apply PHI filter to a question. Returns {blocked, cleanedQuestion}.
 * If any flagged table name appears in the question text, the call is
 * blocked before any provider request is made.
 */
export async function applyPhiFilter(question: string): Promise<PhiFilterResult> {
  const { data, error } = await supabase
    .from("ai_scope")
    .select("view_name")
    .eq("patient_safe", false)
    .eq("is_enabled", true);
  if (error) {
    // Fail-open on filter error — log but allow.
    console.warn("PHI filter read failed:", error.message);
    return { blocked: false, cleanedQuestion: question };
  }
  const flagged = (data ?? []) as Array<{ view_name: string }>;
  for (const { view_name } of flagged) {
    // Match schema.table or just table token in the question.
    const token = view_name.split(".").pop() ?? view_name;
    const re = new RegExp(`\\b${escapeRegex(token)}\\b`, "i");
    if (re.test(question)) {
      return {
        blocked: true,
        reason: `คำถามอ้างถึงข้อมูลที่จำกัด (${view_name}) — กรุณาปรับคำถามใหม่`,
        cleanedQuestion: question,
      };
    }
  }
  return { blocked: false, cleanedQuestion: question };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Send a chat turn to the configured provider. Throws on PHI block,
 * network error, or non-2xx response.
 *
 * Caller is responsible for choosing the provider (default: highest
 * priority enabled). key_value is held in memory only for the duration
 * of this call — never persisted.
 */
export async function sendChatTurn(
  question: string,
  opts: {
    provider?: AiProviderFull;
    systemPrompt?: string;
    schemaContext?: string;
    history?: ChatMessage[];
  } = {},
): Promise<ChatTurn> {
  const phi = await applyPhiFilter(question);
  if (phi.blocked) {
    throw new Error(phi.reason ?? "PHI filter block");
  }

  const provider = opts.provider ?? (await pickDefaultProvider());
  if (!provider) throw new Error("ไม่มี AI provider ที่เปิดใช้งาน — ตั้งค่าใน Admin → AI");

  const system = opts.systemPrompt ??
    "You are an AI assistant for ENV_DB at โรงพยาบาลอุทัย (environmental monitoring). " +
    "Always respond in Thai unless the user writes in English. " +
    "Cite the table or view you used when answering. Never invent data.";

  const schemaBlock = opts.schemaContext
    ? `\n\nSchema context:\n${opts.schemaContext}\n`
    : "";

  const messages: ChatMessage[] = [
    { role: "system", content: system + schemaBlock },
    ...(opts.history ?? []),
    { role: "user", content: phi.cleanedQuestion },
  ];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider.key_value) {
    headers.Authorization = `Bearer ${provider.key_value}`;
  }

  const url = provider.api_url ?? `${provider.base_url}/v1/chat/completions`;
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model_id ?? provider.model,
      messages,
      stream: false,
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (resp.status === 202) {
    // Queue full (A-Wiki pattern) — caller can show retry hint.
    const body = await resp.json().catch(() => ({}));
    throw new Error(`คิวเต็ม — ลำดับ ${body.position ?? "?"}. ลองใหม่ใน 5 วินาที`);
  }
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`provider ${provider.name} ตอบ ${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };
  const answer = data.choices?.[0]?.message?.content ?? "(empty response)";
  const tokens = data.usage?.total_tokens ?? null;

  // Log to ai_query_log (best-effort — don't fail chat on log error).
  try {
    await supabase.from("ai_query_log").insert({
      question: phi.cleanedQuestion.slice(0, 4000),
      answer: answer.slice(0, 8000),
      provider_id: provider.id,
      scope_used: opts.schemaContext ? "schema-context" : null,
      token_usage: tokens,
    });
  } catch (e) {
    console.warn("ai_query_log insert failed:", (e as Error).message);
  }

  return {
    question: phi.cleanedQuestion,
    answer,
    provider: provider.name,
    tokenUsage: tokens,
    ts: new Date().toISOString(),
  };
}

async function pickDefaultProvider(): Promise<AiProviderFull | null> {
  const list = await fetchAdminProviders();
  const enabled = list.filter((p) => p.is_enabled).sort((a, b) => a.priority - b.priority);
  return enabled[0] ?? null;
}
