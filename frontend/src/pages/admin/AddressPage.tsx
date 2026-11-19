/**
 * ENV-PARITY-P3-005 — address admin page (lane P3.5): the §3.6 report-
 * header reference (8 cols, key TambonID — D1-9 RULED verbatim 8) as the
 * B7 admin-EDITABLE reference (2026-11-15: หัวรายงาน = ตารางแก้ไขได้ —
 * ไม่ฝังในเทมเพลต): search + pagination over the seeded 7,436-row national
 * tambon census + admin add/edit/delete.
 *
 * Honesty pins (WO §5):
 *  - the census is NEVER rendered unpaginated (client-side pages of 50);
 *  - Address_Key renders display-time from the row's live Thai names
 *    (the §3.6 virtual formula verbatim) — the virtual is NEVER stored
 *    (no column, no generated column, no trigger — contract-tested);
 *  - the Phase-4 report-header consumption is NOTED on-screen (หัวรายงาน
 *    ทส. จะอ่านจากตารางนี้ใน Phase 4 — ยังไม่เชื่อมในเลนนี้) and is never
 *    built here;
 *  - the float-id lesson: ids entering the payload are integer-coerced
 *    (non-integral values reject, never a silent store).
 *
 * Pattern: copy MastersPage/EquipmentSpecPage structure (hooks + toast +
 * TableSkeleton). Track Z: minimal markup; Track F owns polish.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AuraCard } from "../../components/ui/AuraCard";
import { MSymbol } from "../../components/ui/MSymbol";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import {
  ADDRESS_PAGE_SIZE,
  ADDRESS_PHASE4_NOTE,
  type AddressRow,
  addressKey,
  buildAddressPayload,
  filterAddressRows,
  paginateAddressRows,
  useAddressCensus,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from "../../lib/address";

const emptyForm = () => ({
  tambon_id: "",
  tambon_thai: "",
  district_id: "",
  district_thai: "",
  province_id: "",
  province_thai: "",
});

export function AddressPage() {
  const { data: census, loading, error, refresh } = useAddressCensus();
  const toastCtx = useToast();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState<AddressRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const createMut = useCreateAddress();
  const updateMut = useUpdateAddress(editing?.id ?? "");
  const deleteMut = useDeleteAddress();

  const filtered = useMemo(() => filterAddressRows(census, query), [census, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / ADDRESS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => paginateAddressRows(filtered, safePage, ADDRESS_PAGE_SIZE),
    [filtered, safePage],
  );

  // Snap the page back into range when the search narrows the census.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const startEdit = (row: AddressRow) => {
    setEditing(row);
    setForm({
      tambon_id: String(row.tambon_id),
      tambon_thai: row.tambon_thai,
      district_id: String(row.district_id),
      district_thai: row.district_thai,
      province_id: String(row.province_id),
      province_thai: row.province_thai,
    });
    setFormError(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let payload: Record<string, unknown>;
    try {
      payload = buildAddressPayload(form);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
      return;
    }
    setFormError(null);
    const res = editing ? await updateMut.mutate(payload) : await createMut.mutate(payload);
    if (res.error) {
      // Honest failure — RLS denials surface with the server's message.
      setFormError(res.error);
      toastCtx.error(editing ? "แก้ไขข้อมูลไม่สำเร็จ" : "เพิ่มข้อมูลไม่สำเร็จ");
      return;
    }
    toastCtx.success(editing ? "แก้ไขข้อมูลแล้ว" : "เพิ่มข้อมูลแล้ว");
    resetForm();
  };

  const onDelete = async (row: AddressRow) => {
    if (!window.confirm(`ลบข้อมูลตำบล ${row.tambon_thai} (รหัส ${row.tambon_id}) หรือไม่?`)) return;
    const res = await deleteMut.mutate(row.id);
    if (res.error) {
      toastCtx.error("ลบข้อมูลไม่สำเร็จ");
      return;
    }
    toastCtx.success("ลบข้อมูลแล้ว");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-24" data-testid="address-page">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="aura-text-gradient">จัดการข้อมูลที่อยู่ (ตำบล/อำเภอ/จังหวัด)</span>
          <span className="text-aura-textMain"> (แอดมิน)</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          ตารางอ้างอิงหัวรายงานตามระบบเดิม — แก้ไขได้ตามเจ้าของระบบ (คำตอบ B7 2569-11-15);
          ข้อมูลตั้งต้นคือทะเบียนตำบลทั้งประเทศ {census.length.toLocaleString("th-TH")} รายการ
        </p>
      </header>

      <AuraCard className="p-3">
        <p className="text-xs text-aura-textMuted font-thai" data-testid="address-phase4-note">
          <MSymbol name="info" className="text-[14px] align-[-2px]" /> {ADDRESS_PHASE4_NOTE}
        </p>
      </AuraCard>

      {error && (
        <AuraCard>
          <p className="text-sm text-alert-red font-thai">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        </AuraCard>
      )}

      <AuraCard className="p-3">
        <Field label="ค้นหา (ตำบล / อำเภอ / จังหวัด / รหัสตำบล)">
          <Input
            data-testid="address-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="เช่น อุทัยธานี หรือ 610101"
            type="search"
          />
        </Field>
        <p className="text-xs text-aura-textMuted font-thai mt-2">
          พบ {filtered.length.toLocaleString("th-TH")} รายการ · หน้า {safePage}/{pageCount} (หน้าละ {ADDRESS_PAGE_SIZE} รายการ)
        </p>
      </AuraCard>

      {loading ? (
        <AuraCard className="p-0">
          <TableSkeleton rows={8} cols={5} />
        </AuraCard>
      ) : filtered.length === 0 ? (
        <AuraCard>
          <EmptyState
            icon={<MSymbol name="location_on" className="text-[32px]" />}
            title="ไม่พบข้อมูลที่ค้นหา"
            description="ลองค้นหาด้วยชื่อตำบล อำเภอ จังหวัด หรือรหัสตำบล"
          />
        </AuraCard>
      ) : (
        <AuraCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                  <th className="px-3 py-2.5 font-bold font-thai">รหัสตำบล</th>
                  <th className="px-3 py-2.5 font-bold font-thai">ตำบล</th>
                  <th className="px-3 py-2.5 font-bold font-thai">อำเภอ</th>
                  <th className="px-3 py-2.5 font-bold font-thai">จังหวัด</th>
                  <th className="px-3 py-2.5 font-bold font-thai">Address_Key</th>
                  <th className="px-3 py-2.5 font-bold font-thai">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-borderSubtle/50">
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    data-testid={`address-row-${row.tambon_id}`}
                    className="hover:bg-aura-cyan/5"
                  >
                    <td className="px-3 py-2 font-mono text-aura-textMain">{row.tambon_id}</td>
                    <td className="px-3 py-2 font-thai text-aura-textMain">{row.tambon_thai}</td>
                    <td className="px-3 py-2 font-thai text-aura-textMuted">{row.district_thai}</td>
                    <td className="px-3 py-2 font-thai text-aura-textMuted">{row.province_thai}</td>
                    <td className="px-3 py-2 font-thai text-xs text-aura-cyan" data-testid={`address-key-${row.tambon_id}`}>
                      {addressKey(row)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        data-testid={`address-edit-${row.tambon_id}`}
                        onClick={() => startEdit(row)}
                      >
                        <MSymbol name="edit" className="text-[16px]" /> แก้ไข
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        data-testid={`address-delete-${row.tambon_id}`}
                        onClick={() => onDelete(row)}
                      >
                        <MSymbol name="delete" className="text-[16px]" /> ลบ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination — the census is never rendered unpaginated. */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-aura-borderSubtle/60" data-testid="address-pagination">
            <Button type="button" variant="ghost" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              <MSymbol name="chevron_left" className="text-[18px]" /> ก่อนหน้า
            </Button>
            <span className="text-xs font-thai text-aura-textMuted">
              หน้า {safePage} จาก {pageCount}
            </span>
            <Button type="button" variant="ghost" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
              ถัดไป <MSymbol name="chevron_right" className="text-[18px]" />
            </Button>
          </div>
        </AuraCard>
      )}

      {/* Add/edit form — admin-only (the route + RLS both gate admin). */}
      <AuraCard>
        <form onSubmit={onSubmit} className="space-y-3" data-testid="address-form">
          <h2 className="font-bold font-thai text-aura-textMain flex items-center gap-2">
            <MSymbol name={editing ? "edit" : "add_circle"} className="text-[20px] text-aura-cyan" />
            {editing ? `แก้ไข: ${editing.tambon_thai} (รหัส ${editing.tambon_id})` : "เพิ่มข้อมูลตำบลใหม่"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="รหัสตำบล (TambonID)" required>
              <Input
                data-testid="address-tambon-id-input"
                value={form.tambon_id}
                onChange={(e) => set("tambon_id", e.target.value)}
                inputMode="numeric"
                placeholder="เช่น 610101"
              />
            </Field>
            <Field label="ชื่อตำบล" required>
              <Input
                data-testid="address-tambon-thai-input"
                value={form.tambon_thai}
                onChange={(e) => set("tambon_thai", e.target.value)}
              />
            </Field>
            <Field label="รหัสอำเภอ" required>
              <Input
                data-testid="address-district-id-input"
                value={form.district_id}
                onChange={(e) => set("district_id", e.target.value)}
                inputMode="numeric"
                placeholder="เช่น 6101"
              />
            </Field>
            <Field label="ชื่ออำเภอ" required>
              <Input
                data-testid="address-district-thai-input"
                value={form.district_thai}
                onChange={(e) => set("district_thai", e.target.value)}
              />
            </Field>
            <Field label="รหัสจังหวัด" required>
              <Input
                data-testid="address-province-id-input"
                value={form.province_id}
                onChange={(e) => set("province_id", e.target.value)}
                inputMode="numeric"
                placeholder="เช่น 61"
              />
            </Field>
            <Field label="ชื่อจังหวัด" required>
              <Input
                data-testid="address-province-thai-input"
                value={form.province_thai}
                onChange={(e) => set("province_thai", e.target.value)}
              />
            </Field>
          </div>
          {formError && (
            <p role="alert" className="text-sm text-alert-red font-thai" data-testid="address-form-error">
              {formError}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <Button type="submit" loading={createMut.loading || updateMut.loading}>
              <MSymbol name="save" className="text-[18px]" /> {editing ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                ยกเลิกการแก้ไข
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={refresh} loading={loading}>
              <MSymbol name="refresh" className="text-[18px]" /> รีเฟรช
            </Button>
            <span className="text-xs text-aura-textMuted font-thai ml-auto">
              เข้าถึงได้เฉพาะแอดมิน · แก้ไขได้ตามคำตอบ B7 (ตารางแก้ไขได้)
            </span>
          </div>
        </form>
      </AuraCard>
    </div>
  );
}
