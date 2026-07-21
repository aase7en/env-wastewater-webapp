/**
 * P4-nl-sql (2026-07-21, ADR-0009) — NL→SQL box for the DBA Console.
 *
 * Execution model is REVIEW-GATE: this component NEVER runs SQL. It calls
 * `nlToSql()` to generate a statement + explanation + warnings, then offers
 * actions that hand the SQL off to the page's existing raw-SQL editor:
 *
 *   - ส่ง SQL ไปที่ Editor → `onUseSql(sql)` (page does setMode("raw") + setRawSql)
 *   - คัดลอก SQL             → navigator.clipboard
 *   - ปิด / ถามใหม่           → clears the result panel
 *
 * There is intentionally NO `[รันเลย]` button. ADR-0009 §1: the admin must
 * be the executor — the AI only proposes. The actual run still flows through
 * DBA-2 `isStatementAllowed()` + DBA-3 `admin_run_query`, unchanged.
 *
 * Track Z: logic + minimal markup (AuraCard / pre / font-mono / font-thai).
 * Track F owns visual polish (animation, hero emphasis, layout tweaks).
 */
import { useState } from "react";
import { useToast } from "../ui/Toast";
import { AuraCard } from "../ui/AuraCard";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { nlToSql, buildSchemaContext, type NlToSqlResult } from "../../lib/admin/ai-sql";

interface AiQueryBoxProps {
  /** Page callback: load generated SQL into the raw editor for review. */
  onUseSql: (sql: string) => void;
}

export function AiQueryBox({ onUseSql }: AiQueryBoxProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NlToSqlResult | null>(null);

  async function submit() {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    try {
      const ctx = await buildSchemaContext();
      const res = await nlToSql(q, ctx);
      setResult(res);
      if (!res.sql) {
        toast("warning", "AI ไม่สามารถสร้าง SQL จากคำถามนี้ได้ — ลองถามใหม่");
      }
    } catch (e) {
      // Provider down, parse fail, scope block — keep the panel open so the
      // question isn't lost; the admin can retry without retyping.
      toast("error", `สร้าง SQL ไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result?.sql) return;
    navigator.clipboard
      .writeText(result.sql)
      .then(() => toast("success", "คัดลอก SQL แล้ว"))
      .catch(() => toast("error", "คัดลอกไม่ได้ — เลือกแล้ว Ctrl+C เอง"));
  }

  function clear() {
    setResult(null);
    setQuestion("");
  }

  return (
    <AuraCard className="p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold font-thai">ถามด้วยภาษาธรรมดา (NL → SQL)</h2>
        <span className="text-xs text-aura-textMuted font-thai">review-gate · ไม่รันอัตโนมัติ</span>
      </div>

      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={2}
        placeholder='ถามภาษาไทย เช่น "แสดงค่า DO ที่ต่ำกว่า 2 ล่าสุด 30 วัน"'
        className="font-thai text-sm"
        onKeyDown={(e) => {
          // Ctrl/Cmd+Enter = quick submit (does NOT run SQL — just generates).
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !loading) {
            e.preventDefault();
            void submit();
          }
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={submit} disabled={loading || !question.trim()}>
          {loading ? "กำลังสร้าง…" : "สร้าง SQL"}
        </Button>
        {result && (
          <Button variant="ghost" onClick={clear} disabled={loading}>
            ปิด / ถามใหม่
          </Button>
        )}
      </div>

      {loading && !result && (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {result.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 space-y-1">
              <div className="text-xs font-semibold text-amber-300 font-thai">คำเตือน</div>
              <ul className="text-xs text-amber-200/90 list-disc pl-4 space-y-0.5 font-thai">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.sql ? (
            <div className="space-y-2">
              <div className="text-xs text-aura-textMuted font-thai">SQL ที่สร้าง</div>
              <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto font-mono whitespace-pre-wrap break-words">
                {result.sql}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-aura-textMuted font-thai">
              ไม่สามารถสร้าง SQL จากคำถามนี้ — ลอกคำถามใหม่ด้านบน
            </div>
          )}

          {result.explanation && (
            <div className="space-y-1">
              <div className="text-xs text-aura-textMuted font-thai">คำอธิบาย</div>
              <p className="text-sm font-thai text-aura-textMain/90 leading-relaxed">
                {result.explanation}
              </p>
            </div>
          )}

          {result.sql && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="primary" onClick={() => onUseSql(result.sql)}>
                ส่ง SQL ไปที่ Editor
              </Button>
              <Button size="sm" variant="secondary" onClick={copy}>
                คัดลอก SQL
              </Button>
            </div>
          )}
        </div>
      )}
    </AuraCard>
  );
}
