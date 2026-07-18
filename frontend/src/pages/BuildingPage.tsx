/**
 * MOD-BL — Building inspection page skeleton. Track Z minimal markup.
 * repair_needed=true seeds core.repair_request via app-layer (future -b).
 */
import { useState } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Input, Field, Textarea, Select } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { useBuildingRounds, createBuildingRound, deleteBuildingRound, type BuildingInput } from "../lib/building";

export function BuildingPage() {
  const { data, loading, error, refresh } = useBuildingRounds(30);
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<BuildingInput>({
    round_date: today, location_id: null, inspector: null, findings: null,
    issues_found: false, repair_needed: false, round_type: "monthly",
    checklist: null, photos: null, severity: null, assigned_to: null, note: null,
  });
  const set = (patch: Partial<BuildingInput>) => setForm({ ...form, ...patch });

  async function submit() {
    try { await createBuildingRound(form); toast("success", "บันทึกสำเร็จ"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteBuildingRound(id); toast("success", "ลบแล้ว"); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">ตรวจอาคารสถานที่</h1>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่ตรวจ"><Input type="date" value={form.round_date} onChange={(e) => set({ round_date: e.target.value })} /></Field>
          <Field label="ประเภทรอบตรวจ">
            <Select value={form.round_type ?? "monthly"} onChange={(e) => set({ round_type: e.target.value })}>
              <option value="monthly">ประจำเดือน</option>
              <option value="quarterly">ไตรมาส</option>
              <option value="annual">ประจำปี</option>
            </Select>
          </Field>
          <Field label="ผู้ตรวจ"><Input value={form.inspector ?? ""} onChange={(e) => set({ inspector: e.target.value || null })} /></Field>
          <Field label="ระดับความรุนแรง">
            <Select value={form.severity ?? ""} onChange={(e) => set({ severity: e.target.value || null })}>
              <option value="">—</option><option value="low">ต่ำ</option><option value="medium">กลาง</option><option value="high">สูง</option>
            </Select>
          </Field>
          <Field label="มอบหมายให้"><Input value={form.assigned_to ?? ""} onChange={(e) => set({ assigned_to: e.target.value || null })} /></Field>
          <div className="flex items-center gap-4 pt-6">
            <Toggle checked={form.issues_found} onChange={(v) => set({ issues_found: v })} label="พบปัญหา" />
            <Toggle checked={form.repair_needed} onChange={(v) => set({ repair_needed: v })} label="ต้องแจ้งซ่อม" />
          </div>
        </div>
        <Field label="สิ่งที่พบ"><Textarea value={form.findings ?? ""} onChange={(e) => set({ findings: e.target.value || null })} rows={3} /></Field>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <p className="font-thai">กำลังโหลด…</p> : error ? <p className="text-red-400">{error}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">ผู้ตรวจ</th><th className="text-left p-2">ปัญหา</th><th className="text-left p-2">ซ่อม</th><th></th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.round_date}</td><td className="p-2">{r.inspector ?? "-"}</td>
                  <td className="p-2">{r.issues_found ? "⚠️" : "—"}</td>
                  <td className="p-2">{r.repair_needed ? "🔧" : "—"}</td>
                  <td className="p-2"><button onClick={() => remove(r.id)} className="text-red-400 hover:underline font-thai">ลบ</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AuraCard>
    </div>
  );
}
