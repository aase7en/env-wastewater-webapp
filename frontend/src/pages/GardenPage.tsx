/**
 * MOD-GA — Garden / Landscaping page skeleton. Track Z minimal markup.
 */
import { useRef, useState } from "react";
import { toLocalISODate } from "../lib/utils";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Input, NumberInput, Field, Textarea } from "../components/ui/Input";
import { useGardenRounds, createGardenRound, deleteGardenRound, type GardenInput } from "../lib/garden";

const NUM = (v: string) => (v === "" ? null : Number(v));

const FIELD_IDS = {
  roundDate: "garden-round-date",
  workType: "garden-work-type",
  areaSqm: "garden-area-sqm",
  workerCount: "garden-worker-count",
  fuelUsedL: "garden-fuel-used-l",
  durationHours: "garden-duration-hours",
  equipmentUsed: "garden-equipment-used",
  wasteCollectedKg: "garden-waste-collected-kg",
  note: "garden-note",
} as const;

const ROUND_DATE_ERROR_ID = "garden-round-date-error";
const ROUND_DATE_REQUIRED_ERROR = "กรุณาระบุวันที่ก่อนบันทึก";
const HISTORY_REGION_LABEL = "ประวัติการดูแลสวน";

export function GardenPage() {
  const { data, loading, error, refresh } = useGardenRounds(30);
  const { toast } = useToast();
  const today = toLocalISODate();
  const [form, setForm] = useState<GardenInput>({
    round_date: today, location_id: null, work_type: "ตัดหญ้า",
    area_sqm: null, worker_count: null, fuel_used_l: null,
    duration_hours: null, equipment_used: null, waste_collected_kg: null,
    photo_path: null, note: null,
  });
  const [roundDateError, setRoundDateError] = useState<string | null>(null);
  const roundDateRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<GardenInput>) => setForm({ ...form, ...patch });

  async function submit() {
    if (!form.round_date.trim()) {
      setRoundDateError(ROUND_DATE_REQUIRED_ERROR);
      roundDateRef.current?.focus();
      return;
    }
    setRoundDateError(null);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5 text-sm font-medium text-aura-textMain">
              <label htmlFor={FIELD_IDS.roundDate} className="font-thai">วันที่</label>
              <span aria-hidden="true" className="text-alert-red">*</span>
            </div>
            <Input
              ref={roundDateRef}
              id={FIELD_IDS.roundDate}
              type="date"
              value={form.round_date}
              onChange={(e) => {
                const roundDate = e.target.value;
                set({ round_date: roundDate });
                if (roundDate.trim()) setRoundDateError(null);
              }}
              required
              aria-required="true"
              aria-invalid={roundDateError ? "true" : undefined}
              aria-describedby={roundDateError ? ROUND_DATE_ERROR_ID : undefined}
            />
            {roundDateError && (
              <p id={ROUND_DATE_ERROR_ID} role="alert" className="text-xs text-alert-red font-thai">
                {roundDateError}
              </p>
            )}
          </div>
          <Field label="ประเภทงาน" htmlFor={FIELD_IDS.workType}><Input id={FIELD_IDS.workType} value={form.work_type ?? ""} onChange={(e) => set({ work_type: e.target.value || null })} /></Field>
          <Field label="พื้นที่ (ตร.ม)" htmlFor={FIELD_IDS.areaSqm}><NumberInput id={FIELD_IDS.areaSqm} value={form.area_sqm ?? ""} onChange={(e) => set({ area_sqm: NUM(e.target.value) })} /></Field>
          <Field label="จำนวนคน" htmlFor={FIELD_IDS.workerCount}><NumberInput id={FIELD_IDS.workerCount} value={form.worker_count ?? ""} onChange={(e) => set({ worker_count: NUM(e.target.value) })} /></Field>
          <Field label="น้ำมันที่ใช้ (L)" htmlFor={FIELD_IDS.fuelUsedL}><NumberInput id={FIELD_IDS.fuelUsedL} value={form.fuel_used_l ?? ""} onChange={(e) => set({ fuel_used_l: NUM(e.target.value) })} /></Field>
          <Field label="ชั่วโมงทำงาน" htmlFor={FIELD_IDS.durationHours}><NumberInput id={FIELD_IDS.durationHours} value={form.duration_hours ?? ""} onChange={(e) => set({ duration_hours: NUM(e.target.value) })} /></Field>
          <Field label="อุปกรณ์" htmlFor={FIELD_IDS.equipmentUsed}><Input id={FIELD_IDS.equipmentUsed} value={form.equipment_used ?? ""} onChange={(e) => set({ equipment_used: e.target.value || null })} placeholder="เครื่องตัดหญ้า, เป่าใบ" /></Field>
          <Field label="ขยะที่เก็บ (kg)" htmlFor={FIELD_IDS.wasteCollectedKg}><NumberInput id={FIELD_IDS.wasteCollectedKg} value={form.waste_collected_kg ?? ""} onChange={(e) => set({ waste_collected_kg: NUM(e.target.value) })} /></Field>
        </div>
        <Field label="หมายเหตุ" htmlFor={FIELD_IDS.note}><Textarea id={FIELD_IDS.note} value={form.note ?? ""} onChange={(e) => set({ note: e.target.value || null })} /></Field>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <TableSkeleton rows={5} cols={6} /> : error ? <p className="text-red-400">{error}</p> : (
          <div
            role="region"
            aria-label={HISTORY_REGION_LABEL}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
              event.preventDefault();
              event.currentTarget.scrollBy({ left: Math.max(96, event.currentTarget.clientWidth * 0.75), behavior: "auto" });
            }}
            className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-cyan/70"
          >
            <table className="w-full text-sm">
              <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">งาน</th><th className="text-right p-2">พื้นที่</th><th className="text-right p-2">คน</th><th className="text-right p-2">น้ำมัน L</th><th></th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.round_date}</td><td className="p-2">{r.work_type}</td>
                    <td className="text-right p-2">{r.area_sqm ?? "-"}</td><td className="text-right p-2">{r.worker_count ?? "-"}</td>
                    <td className="text-right p-2">{r.fuel_used_l ?? "-"}</td>
                    <td className="p-2"><button onClick={() => remove(r.id)} className="min-h-[var(--touch-min)] min-w-[var(--touch-min)] px-2 rounded-lg text-red-400 hover:bg-alert-red/10 hover:underline font-thai">ลบ</button></td>
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
