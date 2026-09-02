/**
 * MOD-FO — Food Sanitation (coliform) page skeleton.
 * ⚠️ PHI boundary: water/food/environment samples only, NOT patient samples.
 */
import { useRef, useState } from "react";
import { toLocalISODate } from "../lib/utils";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Input, Field, Textarea, Select, NumberInput } from "../components/ui/Input";
import { useFoodLabTests, createFoodLabTest, deleteFoodLabTest, type FoodInput } from "../lib/food";

const NUM = (v: string) => (v === "" ? null : Number(v));

const FIELD_IDS = {
  sampleDate: "food-sample-date",
  reportedDate: "food-reported-date",
  sampleType: "food-sample-type",
  samplePoint: "food-sample-point",
  testType: "food-test-type",
  mpnValue: "food-mpn-value",
  result: "food-result",
  technician: "food-technician",
  followUpAction: "food-follow-up-action",
} as const;

const SAMPLE_DATE_ERROR_ID = "food-sample-date-error";
const SAMPLE_DATE_REQUIRED_ERROR = "กรุณาระบุวันที่เก็บตัวอย่างก่อนบันทึก";
const HISTORY_REGION = "ประวัติผลตรวจอาหาร";

export function FoodPage() {
  const { data, loading, error, refresh } = useFoodLabTests(30);
  const { toast } = useToast();
  const today = toLocalISODate();
  // FOOD-CORE-001: canonical categoricals only; reagent_used is never
  // written (dormant trigger) and is not part of FoodInput.
  const [form, setForm] = useState<FoodInput>({
    sample_date: today, sample_type: "น้ำประปา", test_type: "total_coliform",
    result: null, reported_date: null, technician: null, sample_point: null,
    mpn_value: null, reported_by_lab_tech: null,
    follow_up_action: null, note: null,
  });
  const [sampleDateError, setSampleDateError] = useState<string | null>(null);
  const sampleDateRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<FoodInput>) => setForm({ ...form, ...patch });

  async function submit() {
    if (!form.sample_date.trim()) {
      setSampleDateError(SAMPLE_DATE_REQUIRED_ERROR);
      sampleDateRef.current?.focus();
      return;
    }
    setSampleDateError(null);
    try { await createFoodLabTest(form); toast("success", "บันทึกสำเร็จ"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteFoodLabTest(id); toast("success", "ลบแล้ว"); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">ตรวจ</span>
            <span className="aura-text-gradient">ครัวและอาหาร</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            ห้องครัวโรงพยาบาล — แหล่งอาหาร / ล้างจาน / ตรวจแลป / reagent
          </p>
        </div>
      </header>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5 text-sm font-medium text-aura-textMain">
              <label htmlFor={FIELD_IDS.sampleDate} className="font-thai">วันที่เก็บตัวอย่าง</label>
              <span aria-hidden="true" className="text-alert-red">*</span>
            </div>
            <Input
              ref={sampleDateRef}
              id={FIELD_IDS.sampleDate}
              type="date"
              value={form.sample_date}
              onChange={(e) => {
                const sampleDate = e.target.value;
                set({ sample_date: sampleDate });
                if (sampleDate.trim()) setSampleDateError(null);
              }}
              required
              aria-required="true"
              aria-invalid={sampleDateError ? "true" : undefined}
              aria-describedby={sampleDateError ? SAMPLE_DATE_ERROR_ID : undefined}
            />
            {sampleDateError && (
              <p id={SAMPLE_DATE_ERROR_ID} role="alert" className="text-xs text-alert-red font-thai">
                {sampleDateError}
              </p>
            )}
          </div>
          <Field label="วันที่รายงานผล" htmlFor={FIELD_IDS.reportedDate}><Input id={FIELD_IDS.reportedDate} type="date" value={form.reported_date ?? ""} onChange={(e) => set({ reported_date: e.target.value || null })} /></Field>
          <Field label="ประเภทตัวอย่าง" htmlFor={FIELD_IDS.sampleType}>
            <Select id={FIELD_IDS.sampleType} value={form.sample_type ?? ""} onChange={(e) => set({ sample_type: e.target.value || null })}>
              <option value="น้ำประปา">น้ำประปา</option>
              <option value="น้ำบาดาล">น้ำบาดาล</option>
              <option value="อาหาร">อาหาร</option>
              <option value="ผัก">ผัก</option>
              <option value="น้ำแข็ง">น้ำแข็ง</option>
            </Select>
          </Field>
          <Field label="จุดเก็บ" htmlFor={FIELD_IDS.samplePoint}><Input id={FIELD_IDS.samplePoint} value={form.sample_point ?? ""} onChange={(e) => set({ sample_point: e.target.value || null })} /></Field>
          <Field label="การทดสอบ" htmlFor={FIELD_IDS.testType}>
            <Select id={FIELD_IDS.testType} value={form.test_type ?? ""} onChange={(e) => set({ test_type: e.target.value || null })}>
              <option value="total_coliform">Total coliform</option>
              <option value="e_coli">E. coli</option>
              <option value="fecal_coliform">Fecal coliform</option>
            </Select>
          </Field>
          <Field label="MPN/100ml" htmlFor={FIELD_IDS.mpnValue}><NumberInput id={FIELD_IDS.mpnValue} value={form.mpn_value ?? ""} onChange={(e) => set({ mpn_value: NUM(e.target.value) })} /></Field>
          <Field label="ผลลัพธ์" htmlFor={FIELD_IDS.result}><Input id={FIELD_IDS.result} value={form.result ?? ""} onChange={(e) => set({ result: e.target.value || null })} placeholder="ไม่พบ / พบ" /></Field>
          <Field label="เทคนิค" htmlFor={FIELD_IDS.technician}><Input id={FIELD_IDS.technician} value={form.technician ?? ""} onChange={(e) => set({ technician: e.target.value || null })} /></Field>
        </div>
        <Field label="การติดตามผล" htmlFor={FIELD_IDS.followUpAction}><Textarea id={FIELD_IDS.followUpAction} value={form.follow_up_action ?? ""} onChange={(e) => set({ follow_up_action: e.target.value || null })} rows={2} /></Field>
        <Button onClick={submit}>บันทึก</Button>
        <p className="text-xs text-aura-textMuted font-thai">หมายเหตุ: ปัจจุบันแบบฟอร์ม/การนำเข้าไม่บันทึก reagent_used — trigger หักสต๊อก reagent (chemical.movement) จึงยังไม่ทำงาน (FOOD-CORE-001)</p>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <TableSkeleton rows={5} cols={6} /> : error ? <p className="text-red-400">{error}</p> : (
          <div role="region" aria-label={HISTORY_REGION} tabIndex={0} className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">วันเก็บ</th><th className="text-left p-2">ตัวอย่าง</th><th className="text-left p-2">การทดสอบ</th><th className="text-left p-2">ผล</th><th className="text-left p-2">วันรายงาน</th><th></th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.sample_date}</td>
                  <td className="p-2">{r.sample_type}</td>
                  <td className="p-2">{r.test_type}</td>
                  <td className="p-2">{r.result ?? "-"}</td>
                  <td className="p-2">{r.reported_date ?? "-"}</td>
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
