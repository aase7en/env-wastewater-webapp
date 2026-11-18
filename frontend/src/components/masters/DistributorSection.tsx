/**
 * ENV-PARITY-P3-001 — distributor master section (§3.15; REACHABLE —
 * seeded 6/6 verbatim from the pond workbook tab, 2026-11-18).
 *
 * EDITABLE reference data (AppSheet Update mode 7): list + create + edit
 * + delete, all admin-gated by RLS (SELECT staff-or-admin; INSERT/
 * UPDATE/DELETE admin — migration 20261118000001). Unlike the append-only
 * equipment_spec history, editing an existing row is legitimate here.
 *
 * Honesty: blanks ⇒ NULL via buildDistributorPayload (unknown ≠ ''); the
 * legacy 8-hex id renders as the row key verbatim; provenance distinguishes
 * seeded vs manual rows. Track Z minimal markup; Track F owns polish.
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
  useCreateDistributor,
  useDeleteDistributor,
  useDistributors,
  useUpdateDistributor,
  buildDistributorPayload,
  createDistributor as createDistributorRow,
  updateDistributor as updateDistributorRow,
  deleteDistributor as deleteDistributorRow,
  EMPTY_DISTRIBUTOR_LABEL,
  type DistributorRow,
} from "../../lib/masters";

const emptyForm = () => ({
  dealer: "",
  dealer_email: "",
  dealer_address: "",
  dealer_tel: "",
  salesname: "",
  line_id: "",
});

export function DistributorSection() {
  const { data: rows, loading, error, refresh } = useDistributors();
  const createMut = useCreateDistributor();
  const updateMut = useUpdateDistributor();
  const deleteMut = useDeleteDistributor();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<DistributorRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const startEdit = (row: DistributorRow) => {
    setEditing(row);
    setForm({
      dealer: row.dealer ?? "",
      dealer_email: row.dealer_email ?? "",
      dealer_address: row.dealer_address ?? "",
      dealer_tel: row.dealer_tel ?? "",
      salesname: row.salesname ?? "",
      line_id: row.line_id ?? "",
    });
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.dealer.trim()) {
      setFormError("ระบุชื่อผู้จัดจำหน่าย (dealer) ก่อนบันทึก");
      return;
    }
    setFormError(null);
    const payload = buildDistributorPayload(form, editing?.legacy_id ?? undefined);
    const { error: mutError } = editing
      ? await updateMut.mutate(() => updateDistributorRow(editing.id, payload))
      : await createMut.mutate(() => createDistributorRow(payload));
    if (mutError) {
      setFormError(mutError);
      toast("error", "บันทึกผู้จัดจำหน่ายไม่สำเร็จ");
      return;
    }
    toast("success", editing ? "แก้ไขผู้จัดจำหน่ายแล้ว" : "เพิ่มผู้จัดจำหน่ายแล้ว");
    reset();
  };

  const onDelete = async (row: DistributorRow) => {
    if (!confirm(`ลบผู้จัดจำหน่าย "${row.dealer ?? row.legacy_id}"?`)) return;
    const { error: mutError } = await deleteMut.mutate(() => deleteDistributorRow(row.id));
    if (mutError) {
      toast("error", `ลบไม่สำเร็จ: ${mutError}`);
      return;
    }
    toast("success", "ลบแล้ว");
    if (editing?.id === row.id) reset();
  };

  return (
    <div data-testid="masters-section-distributor">
    <AuraCard className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
        <MSymbol name="storefront" className="text-[20px] text-aura-cyan" />
        <h2 className="font-bold font-thai text-aura-textMain">ผู้จัดจำหน่าย (distributor)</h2>
        <span className="text-xs text-aura-textMuted font-mono ml-auto">{rows.length} แถว · seed 6 แถวจาก Sheets</span>
      </div>
      {error && <p className="px-4 py-2 text-sm text-alert-red font-thai">โหลดไม่สำเร็จ: {error}</p>}
      {loading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<MSymbol name="storefront" className="text-[32px]" />}
          title={EMPTY_DISTRIBUTOR_LABEL}
          description="เพิ่มด้วยแบบฟอร์มด้านล่าง"
        />
      ) : (
        <div className="overflow-x-auto" data-testid="distributor-empty-anchor">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                <th className="px-4 py-2.5 font-bold font-thai">ผู้จัดจำหน่าย</th>
                <th className="px-4 py-2.5 font-bold font-thai">อีเมล</th>
                <th className="px-4 py-2.5 font-bold font-thai">ที่อยู่</th>
                <th className="px-4 py-2.5 font-bold font-thai">โทร</th>
                <th className="px-4 py-2.5 font-bold font-thai">ผู้ขาย/ไลน์</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-borderSubtle/50">
              {rows.map((r) => (
                <tr key={r.id} data-testid={`distributor-row-${r.legacy_id ?? r.id}`} className="hover:bg-aura-cyan/5">
                  <td className="px-4 py-2.5 font-thai text-aura-textMain">
                    {r.dealer ?? "—"}
                    <span className="block text-[10px] font-mono text-aura-textMuted">{r.legacy_id ?? ""}</span>
                  </td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{r.dealer_email ?? "—"}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted max-w-[16rem] truncate" title={r.dealer_address ?? ""}>{r.dealer_address ?? "—"}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">{r.dealer_tel ?? "—"}</td>
                  <td className="px-4 py-2.5 font-thai text-aura-textMuted">
                    {r.salesname ?? "—"}
                    {r.line_id ? <span className="block font-mono text-[10px]">{r.line_id}</span> : null}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <button
                      data-testid={`distributor-edit-${r.legacy_id ?? r.id}`}
                      onClick={() => startEdit(r)}
                      className="min-h-[var(--touch-min)] px-2 rounded-lg text-aura-cyan hover:bg-aura-cyan/10 font-thai"
                    >
                      แก้ไข
                    </button>
                    <button
                      data-testid={`distributor-delete-${r.legacy_id ?? r.id}`}
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

      <form onSubmit={onSave} className="p-4 space-y-3 border-t border-aura-borderSubtle/60" data-testid="distributor-form">
        <h3 className="font-bold font-thai text-aura-textMain flex items-center gap-2 text-sm">
          <MSymbol name={editing ? "edit" : "add_circle"} className="text-[18px] text-aura-cyan" />
          {editing ? `แก้ไข: ${editing.dealer ?? editing.legacy_id}` : "เพิ่มผู้จัดจำหน่าย"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="ชื่อผู้จัดจำหน่าย (dealer)" required>
            <Input data-testid="distributor-dealer-input" value={form.dealer} onChange={(e) => set({ dealer: e.target.value })} />
          </Field>
          <Field label="อีเมล (dealer_email)">
            <Input data-testid="distributor-email-input" type="email" value={form.dealer_email} onChange={(e) => set({ dealer_email: e.target.value })} />
          </Field>
          <Field label="โทร (dealer_tel)">
            <Input data-testid="distributor-tel-input" type="tel" value={form.dealer_tel} onChange={(e) => set({ dealer_tel: e.target.value })} />
          </Field>
          <Field label="ที่อยู่ (dealer_address)">
            <Input data-testid="distributor-address-input" value={form.dealer_address} onChange={(e) => set({ dealer_address: e.target.value })} />
          </Field>
          <Field label="ชื่อพนักงานขาย (salesname)">
            <Input data-testid="distributor-salesname-input" value={form.salesname} onChange={(e) => set({ salesname: e.target.value })} />
          </Field>
          <Field label="LINE ID (lineID)">
            <Input data-testid="distributor-lineid-input" value={form.line_id} onChange={(e) => set({ line_id: e.target.value })} />
          </Field>
        </div>
        {formError && <p role="alert" className="text-sm text-alert-red font-thai">{formError}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" data-testid="distributor-save" loading={createMut.loading || updateMut.loading}>
            <MSymbol name="save" className="text-[18px]" /> {editing ? "บันทึกการแก้ไข" : "เพิ่มผู้จัดจำหน่าย"}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={reset}>ยกเลิกการแก้ไข</Button>
          )}
          <Button type="button" variant="ghost" onClick={refresh} loading={loading}>
            <MSymbol name="refresh" className="text-[18px]" /> รีเฟรช
          </Button>
          <span className="text-xs text-aura-textMuted font-thai ml-auto">ช่องว่าง = ไม่ระบุ (บันทึกเป็น NULL ตามความจริง)</span>
        </div>
      </form>
    </AuraCard>
    </div>
  );
}
