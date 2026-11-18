/**
 * ENV-PARITY-P3-002 — รับเข้า lot entry per ถัง (lane P3.2): the admin
 * receipt form for chemical.inventory_lot rows (LotNo / MFG / EXP per ถัง,
 * B6's own words "รับคลอรีน 10% มาเป็นจำนวนถัง/ตลับ").
 *
 * Honesty: blanks ⇒ NULL (an unparseable/unknown MFG stays NULL, never
 * coerced — D1-4); amount_received must be > 0 (never fabricated stock);
 * the ถัง count rides in the note (D1-7 receipt-time conversion only, kg
 * is the stored numeric); one receipt ALSO writes its direction='in'
 * movement (the receipt-movement contract — see inventory.ts).
 *
 * Track Z minimal markup; Track F owns polish.
 */
import { useState, type FormEvent } from "react";
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Input";
import { useToast } from "../ui/Toast";
import { useChemicalMasters, buildLotPayload, createInventoryLot } from "../../lib/inventory";
import { toLocalISODate } from "../../lib/utils";

const emptyForm = () => ({
  master_id: "",
  item_id: "",
  item_legacy_id: "",
  receipt_date: toLocalISODate(),
  lot_no: "",
  mfg_date: "",
  expiry_date: "",
  lifetime_note: "",
  amount_received: "",
  note: "",
});

export function LotReceiptSection() {
  const { data: masters, loading: mastersLoading } = useChemicalMasters();
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
      payload = buildLotPayload(form);
    } catch (err) {
      setFormError((err as Error).message);
      return;
    }
    setSaving(true);
    try {
      await createInventoryLot(payload);
      toast("success", "รับเข้าล็อตแล้ว (พร้อม movement รับเข้าในบัญชีคลอรีน)");
      setForm({ ...emptyForm(), master_id: form.master_id });
    } catch (err) {
      setFormError((err as Error).message);
      toast("error", "รับเข้าล็อตไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="inventory-lot-receipt">
      <AuraCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
          <MSymbol name="inventory_2" className="text-[20px] text-aura-cyan" />
          <h2 className="font-bold font-thai text-aura-textMain">รับเข้าล็อต (รับคลอรีนมาเป็นจำนวนถัง/ตลับ)</h2>
        </div>
        <form
          data-testid="lot-receipt-form"
          className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          onSubmit={onSubmit}
        >
          <Field label="รายการคลอรีน (master)">
            <select
              data-testid="lot-master-select"
              className="w-full rounded-md border border-aura-borderSubtle bg-transparent px-2 py-1.5 text-sm"
              value={form.master_id}
              onChange={(e) => set({ master_id: e.target.value })}
            >
              <option value="">{mastersLoading ? "กำลังโหลด…" : "— เลือกรายการ —"}</option>
              {masters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.unit})
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันที่รับเข้า">
            <Input type="date" value={form.receipt_date} onChange={(e) => set({ receipt_date: e.target.value })} />
          </Field>
          <Field label="เลขล็อต (Lot No.)">
            <Input
              aria-label="เลขล็อต (Lot No.)"
              value={form.lot_no}
              onChange={(e) => set({ lot_no: e.target.value })}
              placeholder="เช่น L2569-001"
            />
          </Field>
          <Field label="วันที่ผลิต (MFG) — ไม่ทราบได้">
            <Input
              aria-label="วันที่ผลิต MFG"
              type="date"
              value={form.mfg_date}
              onChange={(e) => set({ mfg_date: e.target.value })}
            />
          </Field>
          <Field label="วันหมดอายุ (EXP)">
            <Input
              aria-label="วันหมดอายุ EXP"
              type="date"
              value={form.expiry_date}
              onChange={(e) => set({ expiry_date: e.target.value })}
            />
          </Field>
          <Field label="จำนวนรับเข้า (kg)">
            <Input
              aria-label="จำนวนรับเข้า (kg)"
              type="number"
              step="0.001"
              min="0"
              value={form.amount_received}
              onChange={(e) => set({ amount_received: e.target.value })}
              placeholder="เช่น 2 ถัง × 2 kg = 4"
            />
          </Field>
          <Field label="หมายเหตุ (จำนวนถัง/ตลับ ใส่ที่นี่)">
            <Textarea
              aria-label="หมายเหตุล็อต"
              value={form.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="เช่น รับเข้า 2 ถัง (ถังละ 2 kg)"
              rows={2}
            />
          </Field>
          <div className="sm:col-span-2 md:col-span-3 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก…" : "รับเข้าล็อต"}
            </Button>
            {formError && (
              <p className="text-sm text-alert-red font-thai" role="alert">
                {formError}
              </p>
            )}
          </div>
          <p className="sm:col-span-2 md:col-span-3 text-xs text-aura-textMuted font-thai">
            MFG ว่าง = ยังไม่ทราบวันผลิต (บันทึกเป็นค่าว่าง ไม่เดาค่าแทน) · การหักสต๊อกอัตโนมัติใช้หลัก FEFO —
            ล็อตที่หมดอายุเร็วที่สุดถูกใช้ก่อน ล็อตที่ไม่ทราบวันหมดอายุใช้ท้ายสุด
          </p>
        </form>
      </AuraCard>
    </div>
  );
}
