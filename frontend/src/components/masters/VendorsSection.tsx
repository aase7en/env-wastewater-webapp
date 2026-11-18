/**
 * ENV-PARITY-P3-001 — Vendors master section (§3.31; SOURCE_UNAVAILABLE at
 * base — schema ships, seed NOTHING, never fabricated).
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
  useCreateVendor,
  useDeleteVendor,
  useUpdateVendor,
  useVendors,
  EMPTY_VENDORS_LABEL,
  toNullableText,
  type VendorRow,
} from "../../lib/masters";
import { createVendor, updateVendor, deleteVendor } from "../../lib/masters";

const emptyForm = () => ({
  name: "",
  logo_path: "",
  url: "",
  phone: "",
  email: "",
  address: "",
});

type VendorForm = ReturnType<typeof emptyForm>;

function vendorPayload(form: VendorForm) {
  return {
    name: toNullableText(form.name),
    logo_path: toNullableText(form.logo_path),
    url: toNullableText(form.url),
    phone: toNullableText(form.phone),
    email: toNullableText(form.email),
    address: toNullableText(form.address),
  };
}

export function VendorsSection() {
  const { data: rows, loading, error } = useVendors();
  const createMut = useCreateVendor();
  const updateMut = useUpdateVendor();
  const deleteMut = useDeleteVendor();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<VendorRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (patch: Partial<VendorForm>) => setForm({ ...form, ...patch });

  const startEdit = (row: VendorRow) => {
    setEditing(row);
    setForm({
      name: row.name ?? "",
      logo_path: row.logo_path ?? "",
      url: row.url ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
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
      setFormError("ระบุชื่อผู้ขาย (Name) ก่อนบันทึก");
      return;
    }
    setFormError(null);
    const payload = vendorPayload(form);
    const { error: mutError } = editing
      ? await updateMut.mutate(() => updateVendor(editing.id, payload))
      : await createMut.mutate(() => createVendor(payload));
    if (mutError) {
      setFormError(mutError);
      toast("error", "บันทึกผู้ขายไม่สำเร็จ");
      return;
    }
    toast("success", editing ? "แก้ไขผู้ขายแล้ว" : "เพิ่มผู้ขายแล้ว");
    reset();
  };

  const onDelete = async (row: VendorRow) => {
    if (!confirm(`ลบผู้ขาย "${row.name ?? row.legacy_id}"?`)) return;
    const { error: mutError } = await deleteMut.mutate(() => deleteVendor(row.id));
    if (mutError) {
      toast("error", `ลบไม่สำเร็จ: ${mutError}`);
      return;
    }
    toast("success", "ลบแล้ว");
    if (editing?.id === row.id) reset();
  };

  return (
    <div data-testid="masters-section-vendors">
    <AuraCard className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
        <MSymbol name="local_shipping" className="text-[20px] text-aura-cyan" />
        <h2 className="font-bold font-thai text-aura-textMain">ผู้ขาย (Vendors)</h2>
        <span className="text-xs text-aura-textMuted font-mono ml-auto">{rows.length} แถว · master ยังไม่มีข้อมูลจาก Sheets</span>
      </div>
      {error && <p className="px-4 py-2 text-sm text-alert-red font-thai">โหลดไม่สำเร็จ: {error}</p>}
      {loading ? (
        <TableSkeleton rows={2} cols={4} />
      ) : rows.length === 0 ? (
        <div data-testid="vendors-empty">
          <EmptyState
            icon={<MSymbol name="local_shipping" className="text-[32px]" />}
            title={EMPTY_VENDORS_LABEL}
            description="master Vendors ยังไม่มีข้อมูลจาก Sheets (SOURCE_UNAVAILABLE) — เพิ่มด้วยแบบฟอร์มด้านล่างได้ ระบบจะไม่เดาค่าแทน"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                <th className="px-4 py-2.5 font-bold font-thai">ผู้ขาย</th>
                <th className="px-4 py-2.5 font-bold font-thai">URL</th>
                <th className="px-4 py-2.5 font-bold font-thai">โทร/อีเมล</th>
                <th className="px-4 py-2.5 font-bold font-thai">ที่อยู่</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-borderSubtle/50">
              {rows.map((r) => (
                <tr key={r.id} data-testid={`vendor-row-${r.legacy_id ?? r.id}`} className="hover:bg-aura-cyan/5">
                  <td className="px-4 py-2.5 font-thai text-aura-textMain">
                    {r.name ?? "—"}
                    <span className="block text-[10px] font-mono text-aura-textMuted">{r.legacy_id ?? ""}</span>
                  </td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{r.url ?? "—"}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{r.phone ?? "—"} · {r.email ?? "—"}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted max-w-[16rem] truncate" title={r.address ?? ""}>{r.address ?? "—"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <button
                      data-testid={`vendor-edit-${r.legacy_id ?? r.id}`}
                      onClick={() => startEdit(r)}
                      className="min-h-[var(--touch-min)] px-2 rounded-lg text-aura-cyan hover:bg-aura-cyan/10 font-thai"
                    >
                      แก้ไข
                    </button>
                    <button
                      data-testid={`vendor-delete-${r.legacy_id ?? r.id}`}
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

      <form onSubmit={onSave} className="p-4 space-y-3 border-t border-aura-borderSubtle/60" data-testid="vendor-form">
        <h3 className="font-bold font-thai text-aura-textMain flex items-center gap-2 text-sm">
          <MSymbol name={editing ? "edit" : "add_circle"} className="text-[18px] text-aura-cyan" />
          {editing ? `แก้ไข: ${editing.name ?? editing.legacy_id}` : "เพิ่มผู้ขาย"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="ชื่อผู้ขาย (Name)" required>
            <Input data-testid="vendor-name-input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="เว็บไซต์ (URL)">
            <Input value={form.url} onChange={(e) => set({ url: e.target.value })} />
          </Field>
          <Field label="โทร (Phone)">
            <Input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="อีเมล (Email)">
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="โลโก้ (Logo — path/รูปอ้างอิง)">
            <Input value={form.logo_path} onChange={(e) => set({ logo_path: e.target.value })} />
          </Field>
          <Field label="ที่อยู่ (Address)">
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
        </div>
        {formError && <p role="alert" className="text-sm text-alert-red font-thai">{formError}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" data-testid="vendor-save" loading={createMut.loading || updateMut.loading}>
            <MSymbol name="save" className="text-[18px]" /> {editing ? "บันทึกการแก้ไข" : "เพิ่มผู้ขาย"}
          </Button>
          {editing && <Button type="button" variant="ghost" onClick={reset}>ยกเลิกการแก้ไข</Button>}
          <span className="text-xs text-aura-textMuted font-thai ml-auto">ช่องว่าง = ไม่ระบุ (บันทึกเป็น NULL ตามความจริง)</span>
        </div>
      </form>
    </AuraCard>
    </div>
  );
}
