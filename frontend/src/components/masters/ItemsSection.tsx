/**
 * ENV-PARITY-P3-001 — Items master section (§3.29; SOURCE_UNAVAILABLE at
 * base — schema ships, seed NOTHING, never fabricated).
 *
 * EDITABLE reference data (list + create + edit + delete, admin-gated by
 * RLS). The Category enum stays a UI-restricted verbatim list
 * (w6hwsyj/72b68b19/9a7ebdaf — legacy Categories ID tokens, ref 4792) OR a
 * resolved Categories row; the vendor picker reads core.vendor. Empty
 * master ⇒ honest empty state (never a fabricated option).
 */
import { useState, type FormEvent } from "react";
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { Button } from "../ui/Button";
import { Field, Input, NumberInput, Select } from "../ui/Input";
import { TableSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import {
  useCreateItem,
  useDeleteItem,
  useItemCategories,
  useItems,
  useUpdateItem,
  useVendors,
  buildItemPayload,
  CATEGORY_TOKENS,
  EMPTY_ITEM_PICKER_LABEL,
  type ItemPayload,
  type ItemRow,
} from "../../lib/masters";
import { createItem, updateItem, deleteItem } from "../../lib/masters";

const emptyForm = () => ({
  name: "",
  description: "",
  category_token: "" as string,
  category_id: "" as string,
  vendor_id: "" as string,
  purchase_cost: "",
  unit_count_num: "",
  unit_count: "",
  unit_formula: "",
  unit_use_num: "",
  unit_calculate: "",
  min_qty: "",
  max_qty: "",
});

export function ItemsSection() {
  const { data: rows, loading, error } = useItems();
  const { data: categories } = useItemCategories();
  const { data: vendors } = useVendors();
  const createMut = useCreateItem();
  const updateMut = useUpdateItem();
  const deleteMut = useDeleteItem();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<ItemRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const startEdit = (row: ItemRow) => {
    setEditing(row);
    setForm({
      name: row.name ?? "",
      description: row.description ?? "",
      category_token: row.category_legacy ?? "",
      category_id: row.category_id ?? "",
      vendor_id: row.vendor_id ?? "",
      purchase_cost: row.purchase_cost?.toString() ?? "",
      unit_count_num: row.unit_count_num?.toString() ?? "",
      unit_count: row.unit_count ?? "",
      unit_formula: row.unit_formula ?? "",
      unit_use_num: row.unit_use_num?.toString() ?? "",
      unit_calculate: row.unit_calculate ?? "",
      min_qty: row.min_qty?.toString() ?? "",
      max_qty: row.max_qty?.toString() ?? "",
    });
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("ระบุชื่ออุปกรณ์ (Name) ก่อนบันทึก");
      return;
    }
    setFormError(null);
    let payload: ItemPayload;
    try {
      payload = buildItemPayload(form);
    } catch (err) {
      setFormError((err as Error).message);
      return;
    }
    const { error: mutError } = editing
      ? await updateMut.mutate(() => updateItem(editing.id, payload))
      : await createMut.mutate(() => createItem(payload));
    if (mutError) {
      setFormError(mutError);
      toast("error", "บันทึกอุปกรณ์ไม่สำเร็จ");
      return;
    }
    toast("success", editing ? "แก้ไขอุปกรณ์แล้ว" : "เพิ่มอุปกรณ์แล้ว");
    reset();
  };

  const onDelete = async (row: ItemRow) => {
    if (!confirm(`ลบอุปกรณ์ "${row.name ?? row.legacy_id}"?`)) return;
    const { error: mutError } = await deleteMut.mutate(() => deleteItem(row.id));
    if (mutError) {
      toast("error", `ลบไม่สำเร็จ: ${mutError}`);
      return;
    }
    toast("success", "ลบแล้ว");
    if (editing?.id === row.id) reset();
  };

  const categoryDisplay = (r: ItemRow): string => {
    if (r.category_id) {
      const c = categories.find((x) => x.id === r.category_id);
      return c?.category ?? r.category_id;
    }
    return r.category_legacy ?? "—";
  };

  return (
    <div data-testid="masters-section-items">
    <AuraCard className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
        <MSymbol name="construction" className="text-[20px] text-aura-cyan" />
        <h2 className="font-bold font-thai text-aura-textMain">อุปกรณ์ (Items)</h2>
        <span className="text-xs text-aura-textMuted font-mono ml-auto">{rows.length} แถว · master ยังไม่มีข้อมูลจาก Sheets</span>
      </div>
      {error && <p className="px-4 py-2 text-sm text-alert-red font-thai">โหลดไม่สำเร็จ: {error}</p>}
      {loading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : rows.length === 0 ? (
        <div data-testid="items-empty">
          <EmptyState
            icon={<MSymbol name="construction" className="text-[32px]" />}
            title={EMPTY_ITEM_PICKER_LABEL}
            description="master Items ยังไม่มีข้อมูลจาก Sheets (SOURCE_UNAVAILABLE) — เพิ่มด้วยแบบฟอร์มด้านล่างได้ ระบบจะไม่เดาค่าแทน"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                <th className="px-4 py-2.5 font-bold font-thai">ชื่อ</th>
                <th className="px-4 py-2.5 font-bold font-thai">หมวดหมู่</th>
                <th className="px-4 py-2.5 font-bold font-thai">ผู้ขาย</th>
                <th className="px-4 py-2.5 font-bold font-thai">ราคา/หน่วย</th>
                <th className="px-4 py-2.5 font-bold font-thai">min/max</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-borderSubtle/50">
              {rows.map((r) => (
                <tr key={r.id} data-testid={`item-row-${r.legacy_id ?? r.id}`} className="hover:bg-aura-cyan/5">
                  <td className="px-4 py-2.5 font-thai text-aura-textMain">
                    {r.name ?? "—"}
                    <span className="block text-[10px] font-mono text-aura-textMuted">{r.legacy_id ?? ""}</span>
                  </td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{categoryDisplay(r)}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{vendors.find((v) => v.id === r.vendor_id)?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">
                    {r.purchase_cost ?? "—"}
                    {r.unit_count ? <span className="block text-[10px] font-thai">ต่อ {r.unit_count}</span> : null}
                  </td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{r.min_qty ?? "—"} / {r.max_qty ?? "—"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <button
                      data-testid={`item-edit-${r.legacy_id ?? r.id}`}
                      onClick={() => startEdit(r)}
                      className="min-h-[var(--touch-min)] px-2 rounded-lg text-aura-cyan hover:bg-aura-cyan/10 font-thai"
                    >
                      แก้ไข
                    </button>
                    <button
                      data-testid={`item-delete-${r.legacy_id ?? r.id}`}
                      onClick={() => onDelete(r)}
                      className="min-h-[var(--touch-min)] px-2 rounded-lg text-red-400 hover:bg-alert-red/10 font-thai"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={onSave} className="p-4 space-y-3 border-t border-aura-borderSubtle/60" data-testid="item-form">
        <h3 className="font-bold font-thai text-aura-textMain flex items-center gap-2 text-sm">
          <MSymbol name={editing ? "edit" : "add_circle"} className="text-[18px] text-aura-cyan" />
          {editing ? `แก้ไข: ${editing.name ?? editing.legacy_id}` : "เพิ่มอุปกรณ์"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="ชื่ออุปกรณ์ (Name)" required>
            <Input data-testid="item-name-input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="หมวดหมู่ (Category — ชุดค่าเดิมจาก AppSheet)">
            <Select data-testid="item-category-select" value={form.category_token} onChange={(e) => set({ category_token: e.target.value, category_id: "" })}>
              <option value="">— ไม่ระบุ —</option>
              {CATEGORY_TOKENS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          {categories.length > 0 && (
            <Field label="หมวดหมู่ (แถวจากตาราง Categories)">
              <Select data-testid="item-category-row-select" value={form.category_id} onChange={(e) => set({ category_id: e.target.value, category_token: "" })}>
                <option value="">— ไม่ระบุ —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.category ?? c.legacy_id ?? c.id}</option>
                ))}
              </Select>
            </Field>
          )}
          {vendors.length > 0 && (
            <Field label="ผู้ขาย (Vendor)">
              <Select data-testid="item-vendor-select" value={form.vendor_id} onChange={(e) => set({ vendor_id: e.target.value })}>
                <option value="">— ไม่ระบุ —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name ?? v.legacy_id ?? v.id}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="ราคาซื้อ (Purchase Cost)">
            <NumberInput data-testid="item-cost-input" value={form.purchase_cost} onChange={(e) => set({ purchase_cost: e.target.value })} />
          </Field>
          <Field label="จำนวนต่อหน่วย (unit_count_num)">
            <NumberInput value={form.unit_count_num} onChange={(e) => set({ unit_count_num: e.target.value })} />
          </Field>
          <Field label="หน่วยนับ (unit_count)">
            <Input value={form.unit_count} onChange={(e) => set({ unit_count: e.target.value })} />
          </Field>
          <Field label="สูตรหน่วย (unit_formula)">
            <Input value={form.unit_formula} onChange={(e) => set({ unit_formula: e.target.value })} />
          </Field>
          <Field label="จำนวนที่ใช้ (unit_use_num)">
            <NumberInput value={form.unit_use_num} onChange={(e) => set({ unit_use_num: e.target.value })} />
          </Field>
          <Field label="วิธีคิด (unit_calculate)">
            <Input value={form.unit_calculate} onChange={(e) => set({ unit_calculate: e.target.value })} />
          </Field>
          <Field label="ค่าน้อยสุด (min)">
            <NumberInput data-testid="item-min-input" value={form.min_qty} onChange={(e) => set({ min_qty: e.target.value })} />
          </Field>
          <Field label="ค่ามากสุด (max)">
            <NumberInput data-testid="item-max-input" value={form.max_qty} onChange={(e) => set({ max_qty: e.target.value })} />
          </Field>
          <Field label="คำอธิบาย (Description)">
            <Input value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </div>
        {formError && <p role="alert" className="text-sm text-alert-red font-thai">{formError}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" data-testid="item-save" loading={createMut.loading || updateMut.loading}>
            <MSymbol name="save" className="text-[18px]" /> {editing ? "บันทึกการแก้ไข" : "เพิ่มอุปกรณ์"}
          </Button>
          {editing && <Button type="button" variant="ghost" onClick={reset}>ยกเลิกการแก้ไข</Button>}
          <span className="text-xs text-aura-textMuted font-thai ml-auto">ชุดค่าหมวดหมู่ตามเดิม (w6hwsyj / 72b68b19 / 9a7ebdaf)</span>
        </div>
      </form>
    </AuraCard>
    </div>
  );
}
