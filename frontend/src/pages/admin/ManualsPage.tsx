/**
 * ENV-PARITY-P3-005 — manuals admin page (lane P3.5): the two AppSheet
 * manual-shelf tables (§3.22 คู่มือ / §3.26 คู่มือน้ำประปา) as domain
 * tabs (บ่อบำบัด | น้ำประปา) — list + link display + admin add/edit.
 *
 * D1-4 link semantics (THE pin): the รูป/link cells are VERBATIM legacy
 * metadata — a new-tab anchor renders ONLY for absolute http(s) refs
 * (target="_blank" rel="noopener noreferrer"); legacy relative Drive
 * refs render as plain text + the honest note (คำเตือน: ไฟล์อยู่ในไดรฟ์
 * ของระบบเดิม) — never a fake link, never an embed, never a fetched
 * binary (the actual files stay in the AppSheet Drive folders; the
 * AppSheet gettablefileurl resolution is infrastructure NOT replicated —
 * the P3.4 L.Image precedent).
 *
 * Honesty (D1-10): the น้ำประปา table carries 0 rows at delivery
 * (SOURCE_UNAVAILABLE — the owner sheet-share obligation is carried) and
 * renders the verbatim honest empty state, never a fabricated row.
 *
 * Pattern: copy MastersPage/EquipmentSpecPage structure (hooks + toast +
 * TableSkeleton). Track Z: minimal markup; Track F owns polish.
 */
import { useState, type FormEvent } from "react";
import { AuraCard } from "../../components/ui/AuraCard";
import { MSymbol } from "../../components/ui/MSymbol";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import {
  EMPTY_WATER_SUPPLY_LABEL,
  LEGACY_DRIVE_NOTE,
  MANUAL_DOMAIN_LABELS,
  type ManualDomain,
  type ManualRow,
  buildManualPayload,
  fileLinkKind,
  useCreateManual,
  useManuals,
  useUpdateManual,
} from "../../lib/manuals";
import { thaiDate } from "../../lib/utils";

type Tab = ManualDomain;

const DOMAINS: Tab[] = ["wastewater", "watersupply"];

const emptyForm = () => ({ title: "", image_ref: "", file_ref: "" });

function ManualFileCell({ row }: { row: ManualRow }) {
  const kind = fileLinkKind(row.file_ref);
  if (kind === "none") return <span className="text-aura-textMuted">—</span>;
  if (kind === "external") {
    return (
      <a
        href={row.file_ref ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`manual-link-${row.legacy_id ?? row.id}`}
        className="text-aura-cyan underline break-all"
      >
        เปิดไฟล์ (แท็บใหม่) <span className="font-mono text-xs">{row.file_ref}</span>
      </a>
    );
  }
  return (
    <span className="text-aura-textMuted break-all" data-testid={`manual-link-${row.legacy_id ?? row.id}`}>
      <span className="font-mono text-xs">{row.file_ref}</span>
      <span className="block text-xs">{LEGACY_DRIVE_NOTE}</span>
    </span>
  );
}

export function ManualsPage() {
  const [tab, setTab] = useState<Tab>("wastewater");
  const { data: rows, loading, error, refresh } = useManuals(tab);
  const toastCtx = useToast();
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState<ManualRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const createMut = useCreateManual(tab);
  const updateMut = useUpdateManual(tab, editing?.id ?? "");

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const startEdit = (row: ManualRow) => {
    setEditing(row);
    setForm({
      title: row.title,
      image_ref: row.image_ref ?? "",
      file_ref: row.file_ref ?? "",
    });
    setFormError(null);
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
      payload = buildManualPayload(form);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
      return;
    }
    setFormError(null);
    const res = editing ? await updateMut.mutate(payload) : await createMut.mutate(payload);
    if (res.error) {
      // Honest failure — RLS denials surface with the server's message.
      setFormError(res.error);
      toastCtx.error(editing ? "แก้ไขคู่มือไม่สำเร็จ" : "เพิ่มคู่มือไม่สำเร็จ");
      return;
    }
    toastCtx.success(editing ? "แก้ไขคู่มือแล้ว" : "เพิ่มคู่มือแล้ว");
    resetForm();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24" data-testid="manuals-page">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="aura-text-gradient">จัดการคู่มือ</span>
          <span className="text-aura-textMain"> (แอดมิน)</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          หมวดเอกสารในแอป: รายการ + ไฟล์ + รูป ตามระบบเดิม — เก็บเฉพาะข้อมูลอ้างอิงลิงก์
          ไฟล์จริงอยู่ในไดรฟ์ของระบบเดิม ไม่คัดลอกเข้าระบบใหม่
        </p>
      </header>

      {/* Domain tabs — คู่มือ ×2 (D1-2) */}
      <div className="flex gap-2" role="tablist" aria-label="เลือกประเภทคู่มือ">
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={tab === d}
            data-testid={`manuals-tab-${d}`}
            onClick={() => {
              setTab(d);
              resetForm();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-thai border transition-colors ${
              tab === d
                ? "bg-aura-cyan/15 border-aura-cyan text-aura-cyan font-bold"
                : "border-aura-borderSubtle text-aura-textMuted hover:bg-aura-cyan/5"
            }`}
          >
            {MANUAL_DOMAIN_LABELS[d]}
          </button>
        ))}
      </div>

      {error && (
        <AuraCard>
          <p className="text-sm text-alert-red font-thai">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        </AuraCard>
      )}

      {loading ? (
        <AuraCard className="p-0">
          <TableSkeleton rows={3} cols={4} />
        </AuraCard>
      ) : rows.length === 0 ? (
        <AuraCard>
          <div data-testid={tab === "watersupply" ? "manual-empty-watersupply" : "manual-empty-wastewater"}>
            <EmptyState
              icon={<MSymbol name="menu_book" className="text-[32px]" />}
              title={tab === "watersupply" ? EMPTY_WATER_SUPPLY_LABEL : "ยังไม่มีคู่มือ"}
              description={
                tab === "watersupply"
                  ? "ตารางนี้ยังไม่มีข้อมูลจากชีตต้นทาง (ระบบจะไม่สร้างข้อมูลแทน) — เพิ่มรายการได้จากแบบฟอร์มด้านล่าง"
                  : "เพิ่มคู่มือแรกด้วยแบบฟอร์มด้านล่าง"
              }
            />
          </div>
        </AuraCard>
      ) : (
        <AuraCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-2.5 font-bold font-thai">รายการ</th>
                  <th className="px-4 py-2.5 font-bold font-thai">รูป (อ้างอิง)</th>
                  <th className="px-4 py-2.5 font-bold font-thai">ไฟล์ (ลิงก์)</th>
                  <th className="px-4 py-2.5 font-bold font-thai">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-borderSubtle/50">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    data-testid={`manual-row-${row.legacy_id ?? row.id}`}
                    className="hover:bg-aura-cyan/5 align-top"
                  >
                    <td className="px-4 py-2.5 font-thai text-aura-textMain">{row.title}</td>
                    <td className="px-4 py-2.5 text-xs text-aura-textMuted break-all">
                      {row.image_ref ? <span className="font-mono">{row.image_ref}</span> : "—"}
                    </td>
                    <td className="px-4 py-2.5 max-w-[16rem]">
                      <ManualFileCell row={row} />
                    </td>
                    <td className="px-4 py-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        data-testid={`manual-edit-${row.legacy_id ?? row.id}`}
                        onClick={() => startEdit(row)}
                      >
                        <MSymbol name="edit" className="text-[16px]" /> แก้ไข
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AuraCard>
      )}

      {/* Add/edit form — admin-only (the route + RLS both gate admin). */}
      <AuraCard>
        <form onSubmit={onSubmit} className="space-y-3" data-testid="manual-form">
          <h2 className="font-bold font-thai text-aura-textMain flex items-center gap-2">
            <MSymbol name={editing ? "edit" : "add_circle"} className="text-[20px] text-aura-cyan" />
            {editing ? `แก้ไขคู่มือ: ${editing.title}` : `เพิ่มคู่มือ (${MANUAL_DOMAIN_LABELS[tab]})`}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Field label="รายการ" required>
              <Input
                data-testid="manual-title-input"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="เช่น มาตรฐานน้ำทิ้ง"
              />
            </Field>
            <Field label="รูป (อ้างอิงเดิม หรือ URL)">
              <Input
                data-testid="manual-image-input"
                value={form.image_ref}
                onChange={(e) => set("image_ref", e.target.value)}
                placeholder="คู่มือ_Images/… หรือ https://…"
              />
            </Field>
            <Field label="ไฟล์ (ลิงก์เดิม หรือ URL)">
              <Input
                data-testid="manual-file-input"
                value={form.file_ref}
                onChange={(e) => set("file_ref", e.target.value)}
                placeholder="คู่มือ_Files_/… หรือ https://… (ลิงก์ http(s) เปิดแท็บใหม่ได้)"
              />
            </Field>
          </div>
          <p className="text-xs text-aura-textMuted font-thai">
            ลิงก์จะคลิกเปิดได้เฉพาะที่เป็น URL http(s) เท่านั้น — อ้างอิงเดิมของระบบเดิมแสดงเป็นข้อความตามความจริง
          </p>
          {formError && (
            <p role="alert" className="text-sm text-alert-red font-thai" data-testid="manual-form-error">
              {formError}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <Button type="submit" loading={createMut.loading || updateMut.loading}>
              <MSymbol name="save" className="text-[18px]" /> {editing ? "บันทึกการแก้ไข" : "เพิ่มคู่มือ"}
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
              เข้าถึงได้เฉพาะแอดมิน · เพิ่ม/แก้ไขผ่าน RLS
            </span>
          </div>
        </form>
      </AuraCard>

      <AuraCard className="p-3">
        <p className="text-xs text-aura-textMuted font-thai">
          ทั้งสองตารางอ่านได้สำหรับพนักงาน · หน้านี้สำหรับผู้ดูแลระบบเท่านั้น ·
          อ้างอิงคู่มือล่าสุดเพิ่มเมื่อ {thaiDate(new Date().toISOString().slice(0, 10))}
        </p>
      </AuraCard>
    </div>
  );
}
