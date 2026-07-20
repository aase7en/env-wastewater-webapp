/**
 * AI-1 + AI-3 — AI Admin page (provider config + scope).
 * Admin-only route /admin/ai.
 *
 * Combines provider CRUD with ai_scope patient_safe flag toggle.
 */
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../components/ui/Toast";
import { AuraCard } from "../../components/ui/AuraCard";
import { Button } from "../../components/ui/Button";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { Input, Field } from "../../components/ui/Input";
import { Toggle } from "../../components/ui/Toggle";
import {
  fetchAdminProviders, upsertProvider, deleteProvider, type AiProviderFull,
} from "../../lib/admin/ai-providers";
import { supabase } from "../../lib/supabase";

interface AiScopeRow {
  id: string;
  view_name: string;
  description: string | null;
  patient_safe: boolean;
  is_enabled: boolean;
}

export function AIAdminPage() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<AiProviderFull[]>([]);
  const [scopes, setScopes] = useState<AiScopeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        fetchAdminProviders(),
        supabase.from("ai_scope").select("id, view_name, description, patient_safe, is_enabled").order("view_name"),
      ]);
      setProviders(p);
      setScopes((s.data ?? []) as AiScopeRow[]);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const blank: AiProviderFull = {
    id: "", name: "", base_url: "", model: "", model_id: null,
    api_url: null, priority: 100, is_enabled: true,
    key_env_var: "", key_value: null,
  };
  const [draft, setDraft] = useState<AiProviderFull>(blank);
  const set = (patch: Partial<AiProviderFull>) => setDraft({ ...draft, ...patch });

  async function save() {
    if (!draft.name || !draft.base_url || !draft.model) {
      toast("error", "ต้องมี name + base_url + model");
      return;
    }
    try {
      await upsertProvider(draft);
      toast("success", "บันทึก provider แล้ว");
      setDraft(blank);
      refresh();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("ลบ provider?")) return;
    try { await deleteProvider(id); refresh(); }
    catch (e) { toast("error", (e as Error).message); }
  }

  async function edit(p: AiProviderFull) { setDraft(p); }

  async function toggleScope(s: AiScopeRow, field: "patient_safe" | "is_enabled", value: boolean) {
    try {
      const { error } = await supabase
        .from("ai_scope")
        .update({ [field]: value })
        .eq("id", s.id);
      if (error) throw new Error(error.message);
      setScopes((prev) => prev.map((r) => r.id === s.id ? { ...r, [field]: value } : r));
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">AI — ตั้งค่า Provider + Scope</h1>

      <AuraCard className="p-4 space-y-3">
        <h2 className="font-semibold font-thai">
          {draft.id ? "แก้ไข Provider" : "เพิ่ม Provider ใหม่"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="ชื่อ"><Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="OpenRouter Free" /></Field>
          <Field label="Base URL"><Input value={draft.base_url} onChange={(e) => set({ base_url: e.target.value })} placeholder="https://openrouter.ai/api" /></Field>
          <Field label="API URL (chat)"><Input value={draft.api_url ?? ""} onChange={(e) => set({ api_url: e.target.value || null })} placeholder="https://openrouter.ai/api/v1/chat/completions" /></Field>
          <Field label="Model label"><Input value={draft.model} onChange={(e) => set({ model: e.target.value })} placeholder="Meta Llama 3.1 8B" /></Field>
          <Field label="Model ID"><Input value={draft.model_id ?? ""} onChange={(e) => set({ model_id: e.target.value || null })} placeholder="meta-llama/llama-3.1-8b-instruct:free" /></Field>
          <Field label="Priority"><Input type="number" value={String(draft.priority)} onChange={(e) => set({ priority: Number(e.target.value) || 100 })} /></Field>
          <Field label="Key env var name"><Input value={draft.key_env_var} onChange={(e) => set({ key_env_var: e.target.value })} placeholder="OPENROUTER_API_KEY" /></Field>
          <Field label="Key value (admin-only)"><Input type="password" value={draft.key_value ?? ""} onChange={(e) => set({ key_value: e.target.value || null })} placeholder="sk-or-v1-…" /></Field>
          <div className="flex items-center pt-6">
            <Toggle checked={draft.is_enabled} onChange={(v) => set({ is_enabled: v })} label="เปิดใช้งาน" />
          </div>
        </div>
        <Button onClick={save}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        <h2 className="font-semibold mb-2 font-thai">Providers ({providers.length})</h2>
        {loading ? <TableSkeleton rows={5} cols={5} /> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">ชื่อ</th><th className="text-left p-2">Model</th><th className="text-right p-2">Priority</th><th className="text-left p-2">เปิด</th><th></th></tr></thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.model_id ?? p.model}</td>
                  <td className="text-right p-2">{p.priority}</td>
                  <td className="p-2">{p.is_enabled ? "✓" : "—"}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => edit(p)} className="text-aura-cyan hover:underline font-thai">แก้</button>
                    <button onClick={() => remove(p.id)} className="text-red-400 hover:underline font-thai">ลบ</button>
                  </td>
                </tr>
              ))}
              {providers.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-aura-textMuted font-thai">ยังไม่มี provider — เพิ่มด้านบน</td></tr>}
            </tbody>
          </table>
        )}
      </AuraCard>

      <AuraCard className="p-4">
        <h2 className="font-semibold mb-2 font-thai">AI Scope ({scopes.length}) — PHI filter</h2>
        <table className="w-full text-sm">
          <thead><tr><th className="text-left p-2">View</th><th className="text-left p-2">คำอธิบาย</th><th className="text-left p-2">ปลอดภัย PHI</th><th className="text-left p-2">เปิดใช้</th></tr></thead>
          <tbody>
            {scopes.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2 font-mono text-xs">{s.view_name}</td>
                <td className="p-2 font-thai">{s.description ?? "-"}</td>
                <td className="p-2">
                  <Toggle checked={s.patient_safe} onChange={(v) => toggleScope(s, "patient_safe", v)} label={s.patient_safe ? "ปลอดภัย" : "จำกัด"} />
                </td>
                <td className="p-2">
                  <Toggle checked={s.is_enabled} onChange={(v) => toggleScope(s, "is_enabled", v)} label={s.is_enabled ? "on" : "off"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AuraCard>
    </div>
  );
}
