/**
 * ENV-PARITY-P3-003 — the calibration entry form (lane P3.3). Verbatim
 * AppSheet pins (§3.30): `calibration_date` defaults to TODAY (the Cal_date
 * Init TODAY() translation — the table's ONLY formula); `cal_method` /
 * `cal_result` carry their verbatim names. Every other validation is
 * house-level (≥1 tool identity), never presented as AppSheet. Blanks ⇒
 * NULL — an unknown result renders ยังไม่ทราบ, never ผ่าน.
 *
 * Track Z minimal markup; Track F owns polish.
 */
import { useState, type FormEvent } from "react";
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Input";
import { useToast } from "../ui/Toast";
import { buildCalibrationPayload, createCalibration, todayISO, useItems } from "../../lib/calibration";

const emptyForm = () => ({
  item_id: "",
  tool_legacy_id: "",
  item_name: "",
  calibration_date: todayISO(),
  cal_method: "",
  cal_result: "",
  calibrate_range: "",
  calibrate_unit: "",
});

export function CalibrationFormSection() {
  const { data: items, loading: itemsLoading } = useItems();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    let payload: Record<string, unknown>;
    try {
      payload = buildCalibrationPayload(form);
    } catch (err) {
      setFormError((err as Error).message);
      return;
    }
    setSaving(true);
    try {
      await createCalibration(payload);
      toast("success", "บันทึกรายการสอบเทียบแล้ว");
      setForm({ ...emptyForm(), item_id: form.item_id });
    } catch (err) {
      setFormError((err as Error).message);
      toast("error", "บันทึกรายการสอบเทียบไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="calibration-form-section">
      <AuraCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
          <MSymbol name="edit_calendar" className="text-[20px] text-aura-cyan" />
          <h2 className="font-bold font-thai text-aura-textMain">บันทึกผลสอบเทียบ</h2>
        </div>
        <form
          data-testid="calibration-form"
          className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          onSubmit={onSubmit}
        >
          <Field label="อุปกรณ์ในระบบ (InventoryID)">
            <select
              data-testid="calibration-item-select"
              className="w-full rounded-md border border-aura-borderSubtle bg-transparent px-2 py-1.5 text-sm"
              value={form.item_id}
              onChange={(e) => set({ item_id: e.target.value })}
            >
              <option value="">
                {itemsLoading
                  ? "กำลังโหลด…"
                  : items.length === 0
                    ? "ยังไม่มีรายการอุปกรณ์ในระบบ (รอข้อมูล master จริง)"
                    : "— เลือกอุปกรณ์ —"}
              </option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} {it.legacy_id ? `(${it.legacy_id})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="รหัสเครื่องมือ (เดิม) — ไม่ทราบได้">
            <Input
              aria-label="รหัสเครื่องมือเดิม"
              value={form.tool_legacy_id}
              onChange={(e) => set({ tool_legacy_id: e.target.value })}
              placeholder="เช่น af420125"
            />
          </Field>
          <Field label="ชื่อรายการ — ไม่ทราบได้">
            <Input
              aria-label="ชื่อรายการ"
              value={form.item_name}
              onChange={(e) => set({ item_name: e.target.value })}
              placeholder="เช่น เครื่องวัดออกซิเจนในน้ำ"
            />
          </Field>
          <Field label="วันที่สอบเทียบ (Cal_date) — ค่าเริ่มต้นวันนี้">
            <Input
              aria-label="วันที่สอบเทียบ Cal_date"
              type="date"
              value={form.calibration_date}
              onChange={(e) => set({ calibration_date: e.target.value })}
            />
          </Field>
          <Field label="วิธีสอบเทียบ (Cal_method)">
            <Input
              aria-label="วิธีสอบเทียบ Cal_method"
              value={form.cal_method}
              onChange={(e) => set({ cal_method: e.target.value })}
            />
          </Field>
          <Field label="ผลสอบเทียบ (Cal_result)">
            <Input
              aria-label="ผลสอบเทียบ Cal_result"
              value={form.cal_result}
              onChange={(e) => set({ cal_result: e.target.value })}
              placeholder="เช่น InControl / Higher Ref."
            />
          </Field>
          <Field label="ค่าที่วัดได้ (จากการสอบเทียบ)">
            <Input
              aria-label="ค่าที่วัดได้"
              value={form.calibrate_range}
              onChange={(e) => set({ calibrate_range: e.target.value })}
            />
          </Field>
          <Field label="หน่วยของค่าที่วัดได้">
            <Input
              aria-label="หน่วยของค่าที่วัดได้"
              value={form.calibrate_unit}
              onChange={(e) => set({ calibrate_unit: e.target.value })}
              placeholder="เช่น % / ppm / mg/L / pH"
            />
          </Field>
          <div className="sm:col-span-2 md:col-span-3 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก…" : "บันทึกผลสอบเทียบ"}
            </Button>
            {formError && (
              <p className="text-sm text-alert-red font-thai" role="alert">
                {formError}
              </p>
            )}
          </div>
          <p className="sm:col-span-2 md:col-span-3 text-xs text-aura-textMuted font-thai">
            ช่องใดว่าง = ยังไม่ทราบ (บันทึกเป็นค่าว่าง ไม่เดาค่าแทน) · ผลที่ยังไม่ทราบจะแสดง
            "ยังไม่ทราบ" ไม่ใช่ "ผ่าน" · วันที่สอบเทียบค่าเริ่มต้นวันนี้ตามระบบเดิม (Cal_date =
            TODAY())
          </p>
        </form>
      </AuraCard>
    </div>
  );
}
