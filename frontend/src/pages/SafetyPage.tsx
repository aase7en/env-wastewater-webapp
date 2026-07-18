/**
 * MOD-FS — Fire Safety / Emergency Lighting page skeleton.
 * Legal monthly requirement (พ.ร.บ. ป้องกันอัคคีภัย 2542).
 */
import { useState } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Input, NumberInput, Field, Textarea } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { useSafetyMonthly, createSafetyCheck, deleteSafetyCheck, type SafetyInput } from "../lib/safety";

const NUM = (v: string) => (v === "" ? null : Number(v));

export function SafetyPage() {
  const { data, loading, error, refresh } = useSafetyMonthly(12);
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextDue = nextMonth.toISOString().slice(0, 10);
  const [form, setForm] = useState<SafetyInput>({
    check_date: today, location_id: null, extinguisher_inspected: false,
    exit_light_functional: false, issues_found: null,
    extinguisher_count: null, extinguisher_expired_count: null,
    exit_light_count: null, exit_light_broken_count: null,
    fire_alarm_tested: false, sprinkler_tested: false, apd_aed_checked: false,
    next_check_due: nextDue, note: null,
  });
  const set = (patch: Partial<SafetyInput>) => setForm({ ...form, ...patch });

  async function submit() {
    try { await createSafetyCheck(form); toast("success", "บันทึกสำเร็จ"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteSafetyCheck(id); toast("success", "ลบแล้ว"); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">ความปลอดภัย — ถังดับเพลิง / ไฟฉุกเฉิน</h1>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่ตรวจ"><Input type="date" value={form.check_date} onChange={(e) => set({ check_date: e.target.value })} /></Field>
          <Field label="รอบตรวจถัดไป"><Input type="date" value={form.next_check_due ?? ""} onChange={(e) => set({ next_check_due: e.target.value || null })} /></Field>
          <Field label="ถังดับเพลิง (จำนวน)"><NumberInput value={form.extinguisher_count ?? ""} onChange={(e) => set({ extinguisher_count: NUM(e.target.value) })} /></Field>
          <Field label="ถังหมดอายุ"><NumberInput value={form.extinguisher_expired_count ?? ""} onChange={(e) => set({ extinguisher_expired_count: NUM(e.target.value) })} /></Field>
          <Field label="ไฟฉุกเฉิน (จำนวน)"><NumberInput value={form.exit_light_count ?? ""} onChange={(e) => set({ exit_light_count: NUM(e.target.value) })} /></Field>
          <Field label="ไฟฉุกเฉินพัง"><NumberInput value={form.exit_light_broken_count ?? ""} onChange={(e) => set({ exit_light_broken_count: NUM(e.target.value) })} /></Field>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <Toggle checked={form.extinguisher_inspected} onChange={(v) => set({ extinguisher_inspected: v })} label="ตรวจถังดับเพลิง" />
          <Toggle checked={form.exit_light_functional} onChange={(v) => set({ exit_light_functional: v })} label="ไฟฉุกเฉินใช้ได้" />
          <Toggle checked={form.fire_alarm_tested} onChange={(v) => set({ fire_alarm_tested: v })} label="ทดสอบสัญญาณเตือนอัคคี" />
          <Toggle checked={form.sprinkler_tested} onChange={(v) => set({ sprinkler_tested: v })} label="ทดสอบสปริงเกอร์" />
          <Toggle checked={form.apd_aed_checked} onChange={(v) => set({ apd_aed_checked: v })} label="ตรวจ AED" />
        </div>
        <Field label="ปัญหาที่พบ"><Textarea value={form.issues_found ?? ""} onChange={(e) => set({ issues_found: e.target.value || null })} rows={2} /></Field>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <p className="font-thai">กำลังโหลด…</p> : error ? <p className="text-red-400">{error}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">ถังดับเพลิง</th><th className="text-left p-2">ไฟฉุกเฉิน</th><th className="text-left p-2">รอบถัดไป</th><th></th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.check_date}</td>
                  <td className="p-2">{r.extinguisher_inspected ? "✓" : "—"} ({r.extinguisher_count ?? "?"})</td>
                  <td className="p-2">{r.exit_light_functional ? "✓" : "—"} ({r.exit_light_count ?? "?"})</td>
                  <td className="p-2">{r.next_check_due ?? "-"}</td>
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
