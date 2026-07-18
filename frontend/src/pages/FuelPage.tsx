/**
 * MOD-FU — Fuel dispense page skeleton. Scope 1 carbon feed.
 */
import { useState } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Input, NumberInput, Field, Select, Textarea } from "../components/ui/Input";
import { useFuelLogs, createFuelLog, deleteFuelLog, computeDelta, type FuelInput } from "../lib/fuel";

const NUM = (v: string) => (v === "" ? null : Number(v));

export function FuelPage() {
  const { data, loading, error, refresh } = useFuelLogs(30);
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FuelInput>({
    log_date: today, fuel_type: "diesel", litres: null,
    meter_before: null, meter_after: null, vehicle_or_use: null,
    vehicle_id: null, odometer: null, purpose: null, cost_baht: null,
    supplier: null, note: null,
  });
  const set = (patch: Partial<FuelInput>) => setForm({ ...form, ...patch });

  const deltaCheck = computeDelta(form.meter_before, form.meter_after, form.litres);

  async function submit() {
    if (deltaCheck?.mismatch) {
      if (!confirm(`⚠️ meter delta (${deltaCheck.delta}) ≠ litres (${deltaCheck.litres}). diff=${deltaCheck.diff}. บันทึกต่อ?`)) return;
    }
    try { await createFuelLog(form); toast("success", "บันทึกสำเร็จ"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteFuelLog(id); toast("success", "ลบแล้ว"); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">น้ำมันเชื้อเพลิง</h1>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่"><Input type="date" value={form.log_date} onChange={(e) => set({ log_date: e.target.value })} /></Field>
          <Field label="ประเภท">
            <Select value={form.fuel_type ?? "diesel"} onChange={(e) => set({ fuel_type: e.target.value })}>
              <option value="diesel">ดีเซล</option><option value="gasoline">เบนซิน</option>
              <option value="lpg">LPG</option><option value="other">อื่นๆ</option>
            </Select>
          </Field>
          <Field label="ปริมาณ (L)"><NumberInput value={form.litres ?? ""} onChange={(e) => set({ litres: NUM(e.target.value) })} /></Field>
          <Field label="มิเตอร์ก่อน"><NumberInput value={form.meter_before ?? ""} onChange={(e) => set({ meter_before: NUM(e.target.value) })} /></Field>
          <Field label="มิเตอร์หลัง"><NumberInput value={form.meter_after ?? ""} onChange={(e) => set({ meter_after: NUM(e.target.value) })} /></Field>
          <Field label="ทะเบียนรถ"><Input value={form.vehicle_id ?? ""} onChange={(e) => set({ vehicle_id: e.target.value || null })} /></Field>
          <Field label="ไมล์"><NumberInput value={form.odometer ?? ""} onChange={(e) => set({ odometer: NUM(e.target.value) })} /></Field>
          <Field label="วัตถุประสงค์"><Input value={form.purpose ?? ""} onChange={(e) => set({ purpose: e.target.value || null })} /></Field>
          <Field label="ราคา (บาท)"><NumberInput value={form.cost_baht ?? ""} onChange={(e) => set({ cost_baht: NUM(e.target.value) })} /></Field>
          <Field label="Supplier"><Input value={form.supplier ?? ""} onChange={(e) => set({ supplier: e.target.value || null })} /></Field>
        </div>
        {deltaCheck?.mismatch && (
          <p className="text-yellow-400 font-thai">⚠️ meter delta ({deltaCheck.delta}) ≠ litres ({deltaCheck.litres}) — diff={deltaCheck.diff}</p>
        )}
        <Field label="หมายเหตุ"><Textarea value={form.note ?? ""} onChange={(e) => set({ note: e.target.value || null })} rows={2} /></Field>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <p className="font-thai">กำลังโหลด…</p> : error ? <p className="text-red-400">{error}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">ประเภท</th><th className="text-right p-2">L</th><th className="text-left p-2">รถ</th><th className="text-right p-2">ราคา</th><th></th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.log_date}</td><td className="p-2">{r.fuel_type}</td>
                  <td className="text-right p-2">{r.litres ?? "-"}</td><td className="p-2">{r.vehicle_id ?? "-"}</td>
                  <td className="text-right p-2">{r.cost_baht ?? "-"}</td>
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
