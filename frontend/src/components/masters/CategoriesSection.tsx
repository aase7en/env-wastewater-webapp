/**
 * ENV-PARITY-P3-001 — Categories master section (§3.27; SOURCE_UNAVAILABLE
 * at base — schema ships, seed NOTHING, never fabricated; the three
 * AppSheet Items.Category enum tokens stay UI-restricted values in
 * core.item.category_legacy and are NOT fabricated into rows here).
 *
 * EDITABLE reference data (list + create + edit + delete, admin-gated by
 * RLS). Empty master ⇒ honest empty state.
 */
import { useState, type FormEvent } from "react";
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Input";
import { TableSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import {
  useCreateItemCategory,
  useDeleteItemCategory,
  useItemCategories,
  useUpdateItemCategory,
  EMPTY_CATEGORIES_LABEL,
  toNullableText,
  type ItemCategoryRow,
} from "../../lib/masters";
import { createItemCategory, updateItemCategory, deleteItemCategory } from "../../lib/masters";

const emptyForm = () => ({ category: "", icon_path: "" });

type CategoryForm = ReturnType<typeof emptyForm>;

function categoryPayload(form: CategoryForm) {
  return {
    category: toNullableText(form.category),
    icon_path: toNullableText(form.icon_path),
  };
}

export function CategoriesSection() {
  const { data: rows, loading, error } = useItemCategories();
  const createMut = useCreateItemCategory();
  const updateMut = useUpdateItemCategory();
  const deleteMut = useDeleteItemCategory();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<ItemCategoryRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (patch: Partial<CategoryForm>) => setForm({ ...form, ...patch });

  const startEdit = (row: ItemCategoryRow) => {
    setEditing(row);
    setForm({ category: row.category ?? "", icon_path: row.icon_path ?? "" });
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.category.trim()) {
      setFormError("ระบุชื่อหมวดหมู่ (Category) ก่อนบันทึก");
      return;
    }
    setFormError(null);
    const payload = categoryPayload(form);
    const { error: mutError } = editing
      ? await updateMut.mutate(() => updateItemCategory(editing.id, payload))
      : await createMut.mutate(() => createItemCategory(payload));
    if (mutError) {
      setFormError(mutError);
      toast("error", "บันทึกหมวดหมู่ไม่สำเร็จ");
      return;
    }
    toast("success", editing ? "แก้ไขหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว");
    reset();
  };

  const onDelete = async (row: ItemCategoryRow) => {
    if (!confirm(`ลบหมวดหมู่ "${row.category ?? row.legacy_id}"?`)) return;
    const { error: mutError } = await deleteMut.mutate(() => deleteItemCategory(row.id));
    if (mutError) {
      toast("error", `ลบไม่สำเร็จ: ${mutError}`);
      return;
    }
    toast("success", "ลบแล้ว");
    if (editing?.id === row.id) reset();
  };

  return (
    <div data-testid="masters-section-categories">
    <AuraCard className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
        <MSymbol name="category" className="text-[20px] text-aura-cyan" />
        <h2 className="font-bold font-thai text-aura-textMain">หมวดหมู่ (Categories)</h2>
        <span className="text-xs text-aura-textMuted font-mono ml-auto">{rows.length} แถว · master ยังไม่มีข้อมูลจาก Sheets</span>
      </div>
      {error && <p className="px-4 py-2 text-sm text-alert-red font-thai">โหลดไม่สำเร็จ: {error}</p>}
      {loading ? (
        <TableSkeleton rows={2} cols={3} />
      ) : rows.length === 0 ? (
        <div data-testid="categories-empty">
          <EmptyState
            icon={<MSymbol name="category" className="text-[32px]" />}
            title={EMPTY_CATEGORIES_LABEL}
            description="master Categories ยังไม่มีข้อมูลจาก Sheets (SOURCE_UNAVAILABLE) — ชุดค่าหมวดหมู่เดิมของฟอร์ม Items ยังใช้โทเคนเดิม w6hwsyj / 72b68b19 / 9a7ebdaf ตามความจริง"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                <th className="px-4 py-2.5 font-bold font-thai">หมวดหมู่</th>
                <th className="px-4 py-2.5 font-bold font-thai">ไอคอน (อ้างอิง)</th>
                <th className="px-4 py-2.5 font-bold font-thai">legacy id</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-borderSubtle/50">
              {rows.map((r) => (
                <tr key={r.id} data-testid={`category-row-${r.legacy_id ?? r.id}`} className="hover:bg-aura-cyan/5">
                  <td className="px-4 py-2.5 font-thai text-aura-textMain">{r.category ?? "—"}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{r.icon_path ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-aura-textMuted">{r.legacy_id ?? ""}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <button
                      data-testid={`category-edit-${r.legacy_id ?? r.id}`}
                      onClick={() => startEdit(r)}
                      className="min-h-[var(--touch-min)] px-2 rounded-lg text-aura-cyan hover:bg-aura-cyan/10 font-thai"
                    >
                      แก้ไข
                    </button>
                    <button
                      data-testid={`category-delete-${r.legacy_id ?? r.id}`}
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

      <form onSubmit={onSave} className="p-4 space-y-3 border-t border-aura-borderSubtle/60" data-testid="category-form">
        <h3 className="font-bold font-thai text-aura-textMain flex items-center gap-2 text-sm">
          <MSymbol name={editing ? "edit" : "add_circle"} className="text-[18px] text-aura-cyan" />
          {editing ? `แก้ไข: ${editing.category ?? editing.legacy_id}` : "เพิ่มหมวดหมู่"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ชื่อหมวดหมู่ (Category)" required>
            <Input data-testid="category-name-input" value={form.category} onChange={(e) => set({ category: e.target.value })} />
          </Field>
          <Field label="ไอคอน (Icon — path/รูปอ้างอิง)">
            <Input value={form.icon_path} onChange={(e) => set({ icon_path: e.target.value })} />
          </Field>
        </div>
        {formError && <p role="alert" className="text-sm text-alert-red font-thai">{formError}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" data-testid="category-save" loading={createMut.loading || updateMut.loading}>
            <MSymbol name="save" className="text-[18px]" /> {editing ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}
          </Button>
          {editing && <Button type="button" variant="ghost" onClick={reset}>ยกเลิกการแก้ไข</Button>}
        </div>
      </form>
    </AuraCard>
    </div>
  );
}
