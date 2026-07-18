/**
 * MOD-WA — Waste / Garbage page skeleton.
 */
import { useState } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Input, NumberInput, Field, Select, Textarea } from "../components/ui/Input";
import { useGarbageLogs, createGarbageLog, deleteGarbageLog, type GarbageInput } from "../lib/garbage";

const NUM = (v: string) => (v === "" ? null : Number(v));

export function GarbagePage() {
  const { data, loading, error, refresh } = useGarbageLogs(30);
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<GarbageInput>({
    log_date: today, location_id: null, waste_type: "ทั่วไป",
    weight_kg: null, disposal_route: null, segregation_type: "general",
    contractor: null, vehicle_plate: null, manifest_no: null,
    destination: null, note: null,
  });
  const set = (patch: Partial<GarbageInput>) => setForm({ ...form, ...patch });

  async function submit() {
    try { await createGarbageLog(form); toast("success", "บันทึกสำเร็จ"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteGarbageLog(id); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">ขย้า / การเก็บขยะ</h1>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่"><Input type="date" value={form.log_date} onChange={(e) => set({ log_date: e.target.value })} /></Field>
          <Field label="ประเภท">
            <Select value={form.segregation_type ?? "general"} onChange={(e) => set({ segregation_type: e.target.value, waste_type: e.target.value })}>
              <option value="general">ทั่วไป</option><option value="infectious">ติดเชื้อ</option>
              <option value="recyclable">รีไซเคิล</option><option value="chemical">เคมี</option>
            </Select>
          </Field>
          <Field label="น้ำหนัก (kg)"><NumberInput value={form.weight_kg ?? ""} onChange={(e) => set({ weight_kg: NUM(e.target.value) })} /></Field>
          <Field label="เส้นทางกำจัด"><Input value={form.disposal_route ?? ""} onChange={(e) => set({ disposal_route: e.target.value || null })} placeholder="ทอจ. / บริษัท / เผา" /></Field>
          <Field label="ผู้รับเก็บ"><Input value={form.contractor ?? ""} onChange={(e) => set({ contractor: e.target.value || null })} /></Field>
          <Field label="ทะเบียนรถ"><Input value={form.vehicle_plate ?? ""} onChange={(e) => set({ vehicle_plate: e.target.value || null })} /></Field>
          <Field label="เลข manifest"><Input value={form.manifest_no ?? ""} onChange={(e) => set({ manifest_no: e.target.value || null })} /></Field>
          <Field label="ปลายทาง"><Input value={form.destination ?? ""} onChange={(e) => set({ destination: e.target.value || null })} /></Field>
        </div>
        <Field label="หมายเหตุ"><Textarea value={form.note ?? ""} onChange={(e) => set({ note: e.target.value || null })} rows={2} /></Field>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <p className="font-thai">กำลังโหลด…</p> : error ? <p className="text-red-400">{error}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">ประเภท</th><th className="text-right p-2">kg</th><th className="text-left p-2">กำจัด</th><th></th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.log_date}</td><td className="p-2">{r.segregation_type ?? r.waste_type}</td>
                  <td className="text-right p-2">{r.weight_kg ?? "-"}</td><td className="p-2">{r.disposal_route ?? "-"}</td>
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
