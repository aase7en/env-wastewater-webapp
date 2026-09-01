/**
 * MOD-WA — Waste / Garbage page skeleton.
 */
import { useRef, useState } from "react";
import { toLocalISODate } from "../lib/utils";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Input, NumberInput, Field, Select, Textarea } from "../components/ui/Input";
import { useGarbageLogs, createGarbageLog, deleteGarbageLog, type GarbageInput } from "../lib/garbage";

const NUM = (v: string) => (v === "" ? null : Number(v));

const FIELD_IDS = {
  logDate: "garbage-log-date",
  segregationType: "garbage-segregation-type",
  weightKg: "garbage-weight-kg",
  disposalRoute: "garbage-disposal-route",
  contractor: "garbage-contractor",
  vehiclePlate: "garbage-vehicle-plate",
  manifestNo: "garbage-manifest-no",
  destination: "garbage-destination",
  note: "garbage-note",
} as const;

const LOG_DATE_ERROR_ID = "garbage-log-date-error";
const LOG_DATE_REQUIRED_ERROR = "กรุณาระบุวันที่ก่อนบันทึก";
const HISTORY_REGION_LABEL = "ประวัติการจัดการขยะ";

export function GarbagePage() {
  const { data, loading, error, refresh } = useGarbageLogs(30);
  const { toast } = useToast();
  const today = toLocalISODate();
  // GARBAGE-CORE-001: segregation_type is the only classification write.
  // Legacy waste_type is no longer initialized or written by this form.
  const [form, setForm] = useState<GarbageInput>({
    log_date: today, location_id: null,
    weight_kg: null, disposal_route: null, segregation_type: "general",
    contractor: null, vehicle_plate: null, manifest_no: null,
    destination: null, note: null,
  });
  const [logDateError, setLogDateError] = useState<string | null>(null);
  const logDateRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<GarbageInput>) => setForm({ ...form, ...patch });

  async function submit() {
    if (!form.log_date.trim()) {
      setLogDateError(LOG_DATE_REQUIRED_ERROR);
      logDateRef.current?.focus();
      return;
    }
    setLogDateError(null);
    try { await createGarbageLog(form); toast("success", "บันทึกสำเร็จ"); refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteGarbageLog(id); toast("success", "ลบแล้ว"); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">การ</span>
            <span className="aura-text-gradient">จัดการขยะ</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            บันทึกปริมาณขยะแยกตามประเภท — ทั่วไป / ติดเชื้อ / รีไซเคิล
          </p>
        </div>
      </header>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5 text-sm font-medium text-aura-textMain">
              <label htmlFor={FIELD_IDS.logDate} className="font-thai">วันที่</label>
              <span aria-hidden="true" className="text-alert-red">*</span>
            </div>
            <Input
              ref={logDateRef}
              id={FIELD_IDS.logDate}
              type="date"
              value={form.log_date}
              onChange={(e) => {
                const logDate = e.target.value;
                set({ log_date: logDate });
                if (logDate.trim()) setLogDateError(null);
              }}
              required
              aria-required="true"
              aria-invalid={logDateError ? "true" : undefined}
              aria-describedby={logDateError ? LOG_DATE_ERROR_ID : undefined}
            />
            {logDateError && (
              <p id={LOG_DATE_ERROR_ID} role="alert" className="text-xs text-alert-red font-thai">
                {logDateError}
              </p>
            )}
          </div>
          <Field label="ประเภท" htmlFor={FIELD_IDS.segregationType}>
            <Select id={FIELD_IDS.segregationType} value={form.segregation_type ?? "general"} onChange={(e) => set({ segregation_type: e.target.value })}>
              <option value="general">ทั่วไป</option><option value="infectious">ติดเชื้อ</option>
              <option value="recyclable">รีไซเคิล</option><option value="chemical">เคมี</option>
            </Select>
          </Field>
          <Field label="น้ำหนัก (kg)" htmlFor={FIELD_IDS.weightKg}><NumberInput id={FIELD_IDS.weightKg} value={form.weight_kg ?? ""} onChange={(e) => set({ weight_kg: NUM(e.target.value) })} /></Field>
          <Field label="เส้นทางกำจัด" htmlFor={FIELD_IDS.disposalRoute}><Input id={FIELD_IDS.disposalRoute} value={form.disposal_route ?? ""} onChange={(e) => set({ disposal_route: e.target.value || null })} placeholder="ทอจ. / บริษัท / เผา" /></Field>
          <Field label="ผู้รับเก็บ" htmlFor={FIELD_IDS.contractor}><Input id={FIELD_IDS.contractor} value={form.contractor ?? ""} onChange={(e) => set({ contractor: e.target.value || null })} /></Field>
          <Field label="ทะเบียนรถ" htmlFor={FIELD_IDS.vehiclePlate}><Input id={FIELD_IDS.vehiclePlate} value={form.vehicle_plate ?? ""} onChange={(e) => set({ vehicle_plate: e.target.value || null })} /></Field>
          <Field label="เลข manifest" htmlFor={FIELD_IDS.manifestNo}><Input id={FIELD_IDS.manifestNo} value={form.manifest_no ?? ""} onChange={(e) => set({ manifest_no: e.target.value || null })} /></Field>
          <Field label="ปลายทาง" htmlFor={FIELD_IDS.destination}><Input id={FIELD_IDS.destination} value={form.destination ?? ""} onChange={(e) => set({ destination: e.target.value || null })} /></Field>
        </div>
        <Field label="หมายเหตุ" htmlFor={FIELD_IDS.note}><Textarea id={FIELD_IDS.note} value={form.note ?? ""} onChange={(e) => set({ note: e.target.value || null })} rows={2} /></Field>
        <Button onClick={submit}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <TableSkeleton rows={5} cols={5} /> : error ? <p className="text-red-400">{error}</p> : (
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
              <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">ประเภท</th><th className="text-right p-2">kg</th><th className="text-left p-2">กำจัด</th><th></th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.log_date}</td><td className="p-2">{r.segregation_type ?? r.waste_type}</td>
                    <td className="text-right p-2">{r.weight_kg ?? "-"}</td><td className="p-2">{r.disposal_route ?? "-"}</td>
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
