/**
 * P4-suggest-chip (2026-07-21, ADR-0009 §1, §4) — AI query suggestions panel.
 *
 * On mount: `const ctx = await buildSchemaContext(); const s = await
 * suggestQueries(ctx);` (the lib's 5-min cache means re-renders don't re-call
 * — do NOT add a second cache). Renders each suggestion as a chip: title_th
 * (bold) + rationale_th (muted). Clicking a chip → `onUseSql(sql)` → page
 * flips to raw editor for review.
 *
 * REVIEW-GATE (ADR-0009 §1): the chip click **loads SQL into the editor only**.
 * It never executes. The admin still clicks the existing รัน button, which
 * routes through DBA-2 `isStatementAllowed` + DBA-3 `admin_run_query`.
 *
 * Seam: identical `onUseSql` as AiQueryBox — DBAConsolePage hoists a single
 * `useAiSql(sql)` handler so both panels share it.
 *
 * Track Z: minimal markup. Track F owns polish (chip hover animation,
 * layout/grid emphasis).
 */
import { useState } from "react";
import { useToast } from "../ui/Toast";
import { AuraCard } from "../ui/AuraCard";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import {
  suggestQueries, buildSchemaContext, type QuerySuggestion,
} from "../../lib/admin/ai-sql";

interface AiSuggestionsProps {
  /** Page callback: load the suggestion's SQL into the raw editor for review. */
  onUseSql: (sql: string) => void;
}

export function AiSuggestions({ onUseSql }: AiSuggestionsProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<QuerySuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const ctx = await buildSchemaContext();
      const s = await suggestQueries(ctx);
      setItems(s);
    } catch (e) {
      // Provider down / parse fail — keep the panel in the empty state.
      toast("error", `โหลดคำแนะนำไม่ได้: ${(e as Error).message}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // REVIEW-9: no auto-load on mount. Loading calls the paid AI provider
  // (plus N row-count queries) — that egress must be an explicit admin
  // action, matching the "คลิกเพื่อโหลด" caption and the cost-first rule.
  // The lib's 5-min cache still dedupes repeat clicks within the window.

  return (
    <AuraCard className="p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold font-thai">คำแนะนำ Query</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-aura-textMuted font-thai">review-gate · คลิกเพื่อโหลด ไม่รัน</span>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            รีเฟรช
          </Button>
        </div>
      </div>

      {loading && items === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : items === null ? (
        <div className="text-sm text-aura-textMuted font-thai">
          กด "รีเฟรช" เพื่อขอคำแนะนำจาก AI (เรียก provider เมื่อสั่งเท่านั้น)
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-aura-textMuted font-thai">
          ยังไม่มีคำแนะนำ — ลองรัน query หรือ save query ก่อน แล้วรีเฟรชใหม่
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onUseSql(s.sql)}
                className="w-full text-left p-3 rounded-lg border border-aura-borderSubtle hover:border-aura-cyan/60 hover:bg-aura-cyan/5 transition-colors space-y-1"
                title="คลิกเพื่อโหลด SQL ลง Editor (ไม่รันอัตโนมัติ)"
              >
                <div className="font-semibold font-thai text-sm text-aura-textMain">
                  {s.title_th}
                </div>
                {s.rationale_th && (
                  <div className="text-xs text-aura-textMuted font-thai leading-relaxed">
                    {s.rationale_th}
                  </div>
                )}
                <pre className="text-[11px] bg-black/30 p-2 rounded font-mono whitespace-pre-wrap break-words mt-1 max-h-24 overflow-y-auto">
                  {s.sql}
                </pre>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AuraCard>
  );
}
