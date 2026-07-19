/**
 * MOD-WS — Water Supply (groundwater) page skeleton.
 * Track Z scope: logic + minimal markup. Track F owns polish (WO MOD-WS-b).
 */
import { useState } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Input, NumberInput, Field } from "../components/ui/Input";
import {
  useWaterSupplyDaily,
  createWaterSupplyDaily,
  deleteWaterSupplyDaily,
  type WaterSupplyInput,
} from "../lib/water-supply";

const NUM = (v: string) => (v === "" ? null : Number(v));

export function WaterSupplyPage() {
  const { data, loading, error, refresh } = useWaterSupplyDaily(30);
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<WaterSupplyInput>({
    check_date: today, location_id: null, ph: null,
    free_chlorine_residual: null, turbidity: null, total_coliform: null,
    fecal_coliform: null, iron: null, manganese: null, hardness: null,
    tds: null, note: null,
  });
  const set = (patch: Partial<WaterSupplyInput>) => setForm({ ...form, ...patch });

  async function submit() {
    try {
      await createWaterSupplyDaily(form);
      toast("success", "บันทึกสำเร็จ");
      refresh();
    } catch (e) {
      toast("error", `ผิดพลาด: ${(e as Error).message}`);
    }
  }
  async function remove(id: string) {
    if (!confirm("ลบแถวนี้?")) return;
    try { await deleteWaterSupplyDaily(id); toast("success", "ลบแล้ว"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">น้ำประปา</span>
            <span className="aura-text-gradient">บาดาล</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            บันทึกคุณภาพน้ำบาดาลรายวัน — pH / คลอรีน / ความขุ่น / coliform
          </p>
        </div>
      </header>

      <AuraCard className="p-4 space-y-3">
        <h2 className="text-lg font-semibold font-thai">กรอกข้อมูล</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่ตรวจ">
            <Input type="date" value={form.check_date} onChange={(e) => set({ check_date: e.target.value })} />
          </Field>
          <Field label="pH">
            <NumberInput value={form.ph ?? ""} onChange={(e) => set({ ph: NUM(e.target.value) })} />
          </Field>
          <Field label="คลอรีนอิสระ (mg/L)">
            <NumberInput value={form.free_chlorine_residual ?? ""} onChange={(e) => set({ free_chlorine_residual: NUM(e.target.value) })} />
          </Field>
          <Field label="ความขุ่น (NTU)">
            <NumberInput value={form.turbidity ?? ""} onChange={(e) => set({ turbidity: NUM(e.target.value) })} />
          </Field>
          <Field label="Total coliform">
            <Input value={form.total_coliform ?? ""} onChange={(e) => set({ total_coliform: e.target.value || null })} placeholder="ไม่พบ / พบ" />
          </Field>
          <Field label="Fecal coliform">
            <Input value={form.fecal_coliform ?? ""} onChange={(e) => set({ fecal_coliform: e.target.value || null })} />
          </Field>
          <Field label="เหล็ก Fe (mg/L)">
            <NumberInput value={form.iron ?? ""} onChange={(e) => set({ iron: NUM(e.target.value) })} />
          </Field>
          <Field label="แมงกานีส Mn (mg/L)">
            <NumberInput value={form.manganese ?? ""} onChange={(e) => set({ manganese: NUM(e.target.value) })} />
          </Field>
          <Field label="ความกระด้าง (mg/L)">
            <NumberInput value={form.hardness ?? ""} onChange={(e) => set({ hardness: NUM(e.target.value) })} />
          </Field>
          <Field label="TDS (mg/L)">
            <NumberInput value={form.tds ?? ""} onChange={(e) => set({ tds: NUM(e.target.value) })} />
          </Field>
        </div>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        <h2 className="text-lg font-semibold mb-3 font-thai">บันทึกล่าสุด 30 วัน</h2>
        {loading ? <p className="font-thai">กำลังโหลด…</p> : error ? <p className="text-red-400 font-thai">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left p-2">วันที่</th><th className="text-right p-2">pH</th><th className="text-right p-2">Cl</th><th className="text-right p-2">NTU</th><th className="text-left p-2">Coliform</th><th></th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.check_date}</td>
                    <td className="text-right p-2">{r.ph ?? "-"}</td>
                    <td className="text-right p-2">{r.free_chlorine_residual ?? "-"}</td>
                    <td className="text-right p-2">{r.turbidity ?? "-"}</td>
                    <td className="p-2">{r.total_coliform ?? "-"}</td>
                    <td className="p-2"><button onClick={() => remove(r.id)} className="text-red-400 hover:underline font-thai">ลบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AuraCard>
    </div>
  );
}
