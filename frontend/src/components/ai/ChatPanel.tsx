/**
 * AI-2 — Chat panel component.
 * Reusable AI chat drawer/panel that any module page can embed.
 * Ported from A-Wiki scripts/live-dashboard/src/chat.js (simplified).
 *
 * Track Z scope: logic + minimal markup. Track F owns polish.
 */
import { useState, useRef, useEffect } from "react";
import { useToast } from "../ui/Toast";
import { AuraCard } from "../ui/AuraCard";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { sendChatTurn, type ChatMessage } from "../../lib/admin/ai-chat";

export interface ChatPanelProps {
  systemPrompt?: string;
  schemaContext?: string;
  /** Title shown above the chat. */
  title?: string;
}

export function ChatPanel({ systemPrompt, schemaContext, title = "ถาม AI" }: ChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: q }]);

    try {
      const turn = await sendChatTurn(q, {
        systemPrompt,
        schemaContext,
        history: messages.slice(-6),
      });
      setMessages((m) => [...m, { role: "assistant", content: turn.answer }]);
    } catch (e) {
      const msg = (e as Error).message;
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
      toast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuraCard className="p-3 flex flex-col h-[500px]">
      <h3 className="font-semibold mb-2 font-thai">{title}</h3>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 text-sm">
        {messages.length === 0 && (
          <p className="text-aura-textMuted font-thai p-4 text-center">
            ถามคำถามเกี่ยวกับข้อมูล ENV — เช่น "สรุปค่า DO 7 วันล่าสุด"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <span className={m.role === "user"
              ? "inline-block bg-aura-cyan/20 px-3 py-1.5 rounded-lg max-w-[80%] text-left"
              : "inline-block bg-white/5 px-3 py-1.5 rounded-lg max-w-[80%] text-left"}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-aura-textMuted font-thai animate-pulse">AI กำลังคิด…</p>}
      </div>
      <div className="flex gap-2 mt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="ถามภาษาไทย…"
          className="font-thai"
        />
        <Button onClick={send} disabled={loading || !input.trim()}>ส่ง</Button>
      </div>
    </AuraCard>
  );
}
