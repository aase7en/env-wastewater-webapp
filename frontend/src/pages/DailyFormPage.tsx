import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccordionSection } from "../components/ui/Accordion";
import { MSymbol } from "../components/ui/MSymbol";
import { Button } from "../components/ui/Button";
import { Field, Input, NumberInput, Textarea } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { useCreateReading, useDeleteReading, useEquipment, useReading, useUpdateReading } from "../lib/hooks";
import { checkThresholds } from "../lib/types";
import type { ReadingCreate } from "../lib/types";
import { cn } from "../lib/utils";

/** Today's date as YYYY-MM-DD (for the reading_date default). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Empty form state — every measured field defaults to "" (sent as null). */
function emptyForm(): FormState {
  return {
    reading_date: todayISO(),
    do_aeration: "", do_sedimentation: "", do_before_discharge: "",
    tds_aeration: "", tds_before_discharge: "",
    ph: "", temp_aeration: "", sv30: "", free_chlorine: "",
    screen_cleaned_coarse: null, screen_cleaned_fine: null,
    pump1_running: null, pump2_running: null,
    aerator1_running: null, aerator2_running: null,
    sludge_pump1_running: null, sludge_pump2_running: null,
    chlorine_pump1_running: null, chlorine_pump2_running: null,
    system_operating: true,
    pump1_meter: "", pump2_meter: "",
    water_used_total: "", wastewater_in: "",
    wastewater_discharged: null,
    chlorine_used: "", chlorine_mix_ratio: "", excess_sludge_removed: "",
    color_desc: "", smell_desc: "", note: "",
    electricity_consumption: "", electricity_meter_value: "",
    abnormal_cause: "",
  };
}

type FormState = Omit<ReadingCreate, "reading_date"> & {
  reading_date: string;
  // All numeric fields use "" (empty string) on the form side; converted to
  // null on submit so omitted values don't get coerced to 0.
  [k: string]: unknown;
};

// ─── Equipment checklist config ──────────────────────────────────────────
// Maps the *_running / screen_cleaned_* keys to the core.equipment code,
// so we can pull the Thai name from /api/equipment (fallback to code).
// Quick-pick chips for สี/กลิ่น — the ONLY values that exist in the real
// 907-row dataset (SPEC: สี = น้ำตาลเข้ม 824 / น้ำตาลอ่อน 83; กลิ่น =
// กลิ่นดินปกติ 907). Free-text stays available for new observations.
const COLOR_CHIPS = ["น้ำตาลเข้ม", "น้ำตาลอ่อน"];
const SMELL_CHIPS = ["กลิ่นดินปกติ"];

function QuickChips({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-thai border transition-colors min-h-[36px]",
            value === o
              ? "aura-bg-gradient border-transparent font-semibold"
              : "bg-aura-surfaceHigh/40 border-aura-borderSubtle text-aura-textMuted hover:text-aura-textMain hover:border-aura-cyan/40"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const EQUIPMENT_CHECKS: { key: keyof FormState; code: string }[] = [
  { key: "screen_cleaned_coarse", code: "screen_coarse" },
  { key: "screen_cleaned_fine", code: "screen_fine" },
  { key: "pump1_running", code: "pump1" },
  { key: "pump2_running", code: "pump2" },
  { key: "aerator1_running", code: "aerator1" },
  { key: "aerator2_running", code: "aerator2" },
  { key: "sludge_pump1_running", code: "sludge_pump1" },
  { key: "sludge_pump2_running", code: "sludge_pump2" },
  { key: "chlorine_pump1_running", code: "chlorine_pump1" },
  { key: "chlorine_pump2_running", code: "chlorine_pump2" },
];

export function DailyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [banner, setBanner] = useState<{ kind: "success" | "error" | "warning"; msg: string } | null>(null);

  const { data: existing, loading: loadingExisting } = useReading(isEdit ? id : null);
  const { data: equipment } = useEquipment();
  const createMut = useCreateReading();
  const updateMut = useUpdateReading();
  const deleteMut = useDeleteReading();

  // Edit mode: populate the form once the existing record loads.
  useEffect(() => {
    if (!existing) return;
    setForm({
      ...emptyForm(),
      ...Object.fromEntries(
        Object.entries(existing).map(([k, v]) => [k, v === null ? "" : v])
      ),
      abnormal_cause: "",
    } as FormState);
  }, [existing]);

  // equipment code → Thai label lookup
  const equipLabel = useMemo(() => {
    const map = new Map(equipment.map((e) => [e.code, e.name_th]));
    return (code: string) => map.get(code) ?? code;
  }, [equipment]);

  // Inline threshold warnings (computed live from current form values).
  const thresholdAlerts = useMemo(
    () => checkThresholds({ ...form, system_operating: form.system_operating } as never),
    [form]
  );

  // SPEC §6: abnormal_cause required when system_operating === false.
  const causeMissing = form.system_operating === false && !String(form.abnormal_cause ?? "").trim();

  // Helper to update a single field.
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Convert form-state strings to the API shape ("" → null, numbers stay).
  const buildPayload = (): ReadingCreate => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (typeof v === "string") out[k] = v.trim() === "" ? null : v;
      else out[k] = v;
    }
    // abnormal_cause is only sent when relevant (avoids seeding spurious
    // repair_request on edits that don't touch the field).
    if (form.system_operating !== false) out.abnormal_cause = null;
    return out as unknown as ReadingCreate;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (causeMissing) {
      setBanner({ kind: "error", msg: "กรุณาระบุสาเหตุที่ระบบผิดปกติ" });
      return;
    }
    setBanner(null);
    const payload = buildPayload();
    if (isEdit && id) {
      const res = await updateMut.mutate(id, payload);
      if (res) {
        setBanner({ kind: "success", msg: "อัปเดตรายการสำเร็จ" });
        setTimeout(() => navigate("/readings"), 900);
      } else {
        setBanner({ kind: "error", msg: updateMut.error ?? "อัปเดตไม่สำเร็จ" });
      }
    } else {
      const res = await createMut.mutate(payload);
      if (res) {
        setBanner({ kind: "success", msg: "บันทึกรายการสำเร็จ" });
        setTimeout(() => navigate("/readings"), 900);
      } else {
        setBanner({ kind: "error", msg: createMut.error ?? "บันทึกไม่สำเร็จ" });
      }
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!window.confirm("ยืนยันการลบรายการนี้? การกระทำนี้ย้อนกลับไม่ได้")) return;
    const ok = await deleteMut.mutate(id);
    if (ok !== null) navigate("/readings");
    else setBanner({ kind: "error", msg: deleteMut.error ?? "ลบไม่สำเร็จ" });
  };

  if (loadingExisting) {
    return <div className="text-aura-textMuted font-thai p-8">กำลังโหลดรายการ…</div>;
  }

  const submitting = createMut.loading || updateMut.loading;

  return (
    <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-4 pb-28">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="aura-text-gradient">{isEdit ? "แก้ไข" : "บันทึก"}</span>
            <span className="text-aura-textMain"> ประจำวัน</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            ระบบบำบัดน้ำเสีย · WWTP-1
          </p>
        </div>
      </header>

      {/* Banner */}
      {banner && (
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm font-thai flex items-center gap-2 border",
            banner.kind === "success" && "bg-alert-green/10 border-alert-green/40 text-alert-green",
            banner.kind === "error" && "bg-alert-red/10 border-alert-red/40 text-alert-red",
            banner.kind === "warning" && "bg-alert-amber/10 border-alert-amber/40 text-alert-amber"
          )}
        >
          <MSymbol name={banner.kind === "success" ? "check_circle" : "warning"} className="text-[18px]" />
          {banner.msg}
        </div>
      )}

      {/* Threshold warning banner (live, pre-submit) */}
      {thresholdAlerts.length > 0 && (
        <div className="rounded-2xl px-4 py-3 text-sm font-thai bg-alert-amber/10 border border-alert-amber/40 text-alert-amber space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <MSymbol name="warning" className="text-[18px]" /> ค่าผิดปกติ ({thresholdAlerts.length})
          </div>
          {thresholdAlerts.map((a, i) => (
            <div key={i} className="pl-6">• {a.message}</div>
          ))}
        </div>
      )}

      {/* SECTION 1 — ข้อมูลทั่วไป */}
      <AccordionSection title="ข้อมูลทั่วไป" subtitle="วันที่บันทึกและสถานะระบบ" defaultOpen>
        <Field label="วันที่บันทึก" required htmlFor="reading_date">
          <Input
            id="reading_date"
            type="date"
            value={String(form.reading_date)}
            onChange={(e) => set("reading_date", e.target.value)}
            required
          />
        </Field>
        <div className="rounded-xl p-4 bg-aura-surfaceHigh/40 border border-aura-borderSubtle space-y-3">
          <Toggle
            checked={(form.system_operating ?? null) as boolean | null}
            onChange={(v) => set("system_operating", v)}
            label="ระบบทำงานปกติ"
            description={form.system_operating === false ? "⚠ ทำเครื่องหมายว่าระบบผิดปกติ — ต้องระบุสาเหตุด้านล่าง" : "เปิดอยู่/ทำงานปกติ"}
          />
          {form.system_operating === false && (
            <div className="space-y-1.5 pl-14">
              <Field
                label="สาเหตุที่ผิดปกติ"
                required
                error={causeMissing ? "จำเป็นต้องระบุเมื่อระบบผิดปกติ" : undefined}
                hint="จะสร้างใบแจ้งซ่อม (core.repair_request) ในธุรกรรมเดียวกัน"
                htmlFor="abnormal_cause"
              >
                <Textarea
                  id="abnormal_cause"
                  rows={2}
                  value={String(form.abnormal_cause ?? "")}
                  onChange={(e) => set("abnormal_cause", e.target.value)}
                  placeholder="เช่น เครื่องเติมอากาศ 2 ขัดข้อง, ปั๊มน้ำเสีย 1 หยุดทำงาน"
                />
              </Field>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* SECTION 2 — คุณภาพน้ำ */}
      <AccordionSection title="คุณภาพน้ำ" subtitle="DO, pH, TDS, อุณหภูมิ, SV30, คลอรีนอิสระ">
        <div className="grid grid-cols-2 gap-3">
          <Field label="DO ถังเติมอากาศ" unit="mg/L">
            <NumberInput value={String(form.do_aeration)} onChange={(e) => set("do_aeration", e.target.value)} />
          </Field>
          <Field label="DO ถังตกตะกอน" unit="mg/L">
            <NumberInput value={String(form.do_sedimentation)} onChange={(e) => set("do_sedimentation", e.target.value)} />
          </Field>
          <Field label="DO ก่อนระบาย" unit="mg/L">
            <NumberInput value={String(form.do_before_discharge)} onChange={(e) => set("do_before_discharge", e.target.value)} />
          </Field>
          <Field label="pH">
            <NumberInput value={String(form.ph)} onChange={(e) => set("ph", e.target.value)} />
          </Field>
          <Field label="TDS ถังเติมอากาศ" unit="mg/L">
            <NumberInput value={String(form.tds_aeration)} onChange={(e) => set("tds_aeration", e.target.value)} />
          </Field>
          <Field label="TDS ก่อนระบาย" unit="mg/L">
            <NumberInput value={String(form.tds_before_discharge)} onChange={(e) => set("tds_before_discharge", e.target.value)} />
          </Field>
          <Field label="อุณหภูมิ" unit="°C">
            <NumberInput value={String(form.temp_aeration)} onChange={(e) => set("temp_aeration", e.target.value)} />
          </Field>
          <Field label="SV30" unit="mL/L">
            <NumberInput value={String(form.sv30)} onChange={(e) => set("sv30", e.target.value)} />
          </Field>
          <Field label="คลอรีนอิสระ" unit="mg/L">
            <NumberInput value={String(form.free_chlorine)} onChange={(e) => set("free_chlorine", e.target.value)} />
          </Field>
        </div>
      </AccordionSection>

      {/* SECTION 3 — คลอรีนและสารเคมี */}
      <AccordionSection title="คลอรีนและสารเคมี" subtitle="ปริมาณคลอรีนที่ใช้, อัตราผสม, ตะกอนส่วนเกิน">
        <div className="grid grid-cols-2 gap-3">
          <Field label="คลอรีนที่ใช้" unit="ลิตร">
            <NumberInput value={String(form.chlorine_used)} onChange={(e) => set("chlorine_used", e.target.value)} />
          </Field>
          <Field label="อัตราส่วนผสม">
            <Input value={String(form.chlorine_mix_ratio ?? "")} onChange={(e) => set("chlorine_mix_ratio", e.target.value)} placeholder="เช่น 1:5" />
          </Field>
          <Field label="ตะกอนส่วนเกินที่เก็บออก" unit="m³">
            <NumberInput value={String(form.excess_sludge_removed)} onChange={(e) => set("excess_sludge_removed", e.target.value)} />
          </Field>
        </div>
      </AccordionSection>

      {/* SECTION 4 — เช็คลิสต์อุปกรณ์ */}
      <AccordionSection title="เช็คลิสต์อุปกรณ์ (10 ตัว)" subtitle="ตรวจสอบการทำงานของอุปกรณ์แต่ละชิ้น">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EQUIPMENT_CHECKS.map(({ key, code }) => (
            <div key={code} className="rounded-xl p-3 bg-aura-surfaceHigh/30 border border-aura-borderSubtle/60">
              <Toggle
                checked={(form[key] ?? null) as boolean | null}
                onChange={(v) => set(key, v as never)}
                label={equipLabel(code)}
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* SECTION 5 — มิเตอร์ + ปริมาณน้ำ */}
      <AccordionSection title="มิเตอร์ + ปริมาณน้ำ + ไฟฟ้า" subtitle="มิเตอร์ปั๊ม, ปริมาณน้ำเข้า/ออก, ไฟฟ้า">
        <div className="grid grid-cols-2 gap-3">
          <Field label="มิเตอร์ปั๊ม 1" unit="kWh">
            <NumberInput value={String(form.pump1_meter)} onChange={(e) => set("pump1_meter", e.target.value)} />
          </Field>
          <Field label="มิเตอร์ปั๊ม 2" unit="kWh">
            <NumberInput value={String(form.pump2_meter)} onChange={(e) => set("pump2_meter", e.target.value)} />
          </Field>
          <Field label="น้ำที่ใช้รวม" unit="m³">
            <NumberInput value={String(form.water_used_total)} onChange={(e) => set("water_used_total", e.target.value)} />
          </Field>
          <Field label="น้ำเข้าระบบ" unit="m³">
            <NumberInput value={String(form.wastewater_in)} onChange={(e) => set("wastewater_in", e.target.value)} />
          </Field>
          <Field label="เลขมิเตอร์ไฟฟ้า" unit="kWh">
            <NumberInput value={String(form.electricity_meter_value)} onChange={(e) => set("electricity_meter_value", e.target.value)} />
          </Field>
          <Field label="ไฟฟ้าที่ใช้วันนี้" unit="kWh">
            <NumberInput value={String(form.electricity_consumption)} onChange={(e) => set("electricity_consumption", e.target.value)} />
          </Field>
        </div>
        <div className="rounded-xl p-4 bg-aura-surfaceHigh/40 border border-aura-borderSubtle">
          <Toggle
            checked={(form.wastewater_discharged ?? null) as boolean | null}
            onChange={(v) => set("wastewater_discharged", v)}
            label="มีการระบายน้ำทิ้งวันนี้"
            description="บันทึกสถานะการระบายน้ำที่ผ่านการบำบัดแล้ว"
          />
        </div>
      </AccordionSection>

      {/* SECTION 6 — หมายเหตุ */}
      <AccordionSection title="หมายเหตุ" subtitle="สี, กลิ่น, ข้อสังเกตอื่นๆ">
        <Field label="สีของน้ำ" hint="แตะเลือกค่าที่พบบ่อย หรือพิมพ์เอง">
          <QuickChips options={COLOR_CHIPS} value={String(form.color_desc ?? "")} onPick={(v) => set("color_desc", v)} />
          <Input value={String(form.color_desc ?? "")} onChange={(e) => set("color_desc", e.target.value)} placeholder="เช่น น้ำตาลเข้ม" />
        </Field>
        <Field label="กลิ่น" hint="แตะเลือกค่าที่พบบ่อย หรือพิมพ์เอง">
          <QuickChips options={SMELL_CHIPS} value={String(form.smell_desc ?? "")} onPick={(v) => set("smell_desc", v)} />
          <Input value={String(form.smell_desc ?? "")} onChange={(e) => set("smell_desc", e.target.value)} placeholder="เช่น กลิ่นดินปกติ" />
        </Field>
        <Field label="หมายเหตุเพิ่มเติม">
          <Textarea rows={3} value={String(form.note ?? "")} onChange={(e) => set("note", e.target.value)} />
        </Field>
      </AccordionSection>

      {/* Sticky submit bar — left offset matches the F2 sidebar (w-72) */}
      <div className="fixed bottom-0 inset-x-0 md:left-72 border-t border-aura-borderSubtle bg-aura-bgDeep/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 z-30">
        <Button type="submit" loading={submitting} size="lg" className="flex-1 sm:flex-none sm:min-w-40">
          {isEdit ? "อัปเดต" : "บันทึก"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
          ยกเลิก
        </Button>
        {isEdit && (
          <Button type="button" variant="danger" size="lg" onClick={onDelete} loading={deleteMut.loading} className="ml-auto">
            <MSymbol name="delete" className="text-[18px]" /> ลบ
          </Button>
        )}
      </div>
    </form>
  );
}
