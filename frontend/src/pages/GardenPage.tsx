/**
 * MOD-GA — Garden / Landscaping page skeleton. Track Z minimal markup.
 */
import { useState } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Input, NumberInput, Field, Textarea } from "../components/ui/Input";
import { useGardenRounds, createGardenRound, deleteGardenRound, type GardenInput } from "../lib/garden";

const NUM = (v: string) => (v === "" ? null : Number(v));

export function GardenPage() {
  const { data, loading, error, refresh } = useGardenRounds(30);
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<GardenInput>({
    round_date: today, location_id: null, work_type: "ตัดหญ้า",
    area_sqm: null, worker_count: null, fuel_used_l: null,
    duration_hours: null, equipment_used: null, waste_collected_kg: null,
    photo_path: null, note: null,
  });
  const set = (patch: Partial<GardenInput>) => setForm({ ...form, ...patch });

  async function submit() {
    try { await createGardenRound(form); toast("success", "บันทึกสำเร็จ"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteGardenRound(id); toast("success", "ลบแล้ว"); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">งาน</span>
            <span className="aura-text-gradient">สวนและภูมิทัศน์</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            บันทึกรอบตรวจและดูแลพื้นที่สีเขียว — ปุ๋ย / ยาฆ่าแมลง / อุปกรณ์
          </p>
        </div>
      </header>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่"><Input type="date" value={form.round_date} onChange={(e) => set({ round_date: e.target.value })} /></Field>
          <Field label="ประเภทงาน"><Input value={form.work_type ?? ""} onChange={(e) => set({ work_type: e.target.value || null })} /></Field>
          <Field label="พื้นที่ (ตร.ม)"><NumberInput value={form.area_sqm ?? ""} onChange={(e) => set({ area_sqm: NUM(e.target.value) })} /></Field>
          <Field label="จำนวนคน"><NumberInput value={form.worker_count ?? ""} onChange={(e) => set({ worker_count: NUM(e.target.value) })} /></Field>
          <Field label="น้ำมันที่ใช้ (L)"><NumberInput value={form.fuel_used_l ?? ""} onChange={(e) => set({ fuel_used_l: NUM(e.target.value) })} /></Field>
          <Field label="ชั่วโมงทำงาน"><NumberInput value={form.duration_hours ?? ""} onChange={(e) => set({ duration_hours: NUM(e.target.value) })} /></Field>
          <Field label="อุปกรณ์"><Input value={form.equipment_used ?? ""} onChange={(e) => set({ equipment_used: e.target.value || null })} placeholder="เครื่องตัดหญ้า, เป่าใบ" /></Field>
          <Field label="ขยะที่เก็บ (kg)"><NumberInput value={form.waste_collected_kg ?? ""} onChange={(e) => set({ waste_collected_kg: NUM(e.target.value) })} /></Field>
        </div>
        <Field label="หมายเหตุ"><Textarea value={form.note ?? ""} onChange={(e) => set({ note: e.target.value || null })} /></Field>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <p className="font-thai">กำลังโหลด…</p> : error ? <p className="text-red-400">{error}</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">งาน</th><th className="text-right p-2">พื้นที่</th><th className="text-right p-2">คน</th><th className="text-right p-2">น้ำมัน L</th><th></th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.round_date}</td><td className="p-2">{r.work_type}</td>
                  <td className="text-right p-2">{r.area_sqm ?? "-"}</td><td className="text-right p-2">{r.worker_count ?? "-"}</td>
                  <td className="text-right p-2">{r.fuel_used_l ?? "-"}</td>
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
