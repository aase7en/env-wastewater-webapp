/**
 * DOC-3 — Attachments (SOP/manuals) page.
 *
 * Lists attachments filterable by entity_type. Admin can upload new
 * file → links to entity (regulation/equipment/module).
 *
 * NOTE: requires Supabase Storage bucket "attachments" created in
 * dashboard. If missing, upload fails with clear error.
 */
import { useState, useEffect } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Field, Select, Input } from "../components/ui/Input";
import {
  fetchAttachments, uploadAttachment, deleteAttachment, attachmentUrl,
  type Attachment,
} from "../lib/attachments";

const ENTITY_TYPES = [
  "regulation", "equipment", "location", "wastewater", "water_supply",
  "garbage", "fuel", "garden", "building", "safety", "food", "chemical",
];

export function AttachmentsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Attachment[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploadEntityType, setUploadEntityType] = useState(ENTITY_TYPES[0]!);
  const [uploadEntityId, setUploadEntityId] = useState("");

  async function refresh() {
    setLoading(true);
    try { setItems(await fetchAttachments(filter || undefined)); }
    catch (e) { toast("error", (e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [filter]);

  async function onUpload(file: File) {
    if (!uploadEntityId.trim()) {
      toast("error", "ต้องระบุ entity_id");
      return;
    }
    try {
      await uploadAttachment(file, uploadEntityType, uploadEntityId);
      toast("success", `อัปโหลด ${file.name} สำเร็จ`);
      refresh();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  async function remove(a: Attachment) {
    if (!confirm(`ลบ ${a.file_path}?`)) return;
    try { await deleteAttachment(a.id, a.file_path); refresh(); }
    catch (e) { toast("error", (e as Error).message); }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">SOP / เอกสาร / คู่มือ</h1>

      <AuraCard className="p-4 space-y-3">
        <h2 className="font-semibold font-thai">อัปโหลดไฟล์</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Entity type">
            <Select value={uploadEntityType} onChange={(e) => setUploadEntityType(e.target.value)}>
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Entity ID (UUID)"><Input value={uploadEntityId} onChange={(e) => setUploadEntityId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" /></Field>
        </div>
        <input
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onUpload(f);
          }}
          className="block text-sm font-thai"
        />
      </AuraCard>

      <Field label="กรองตาม entity_type">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">ทั้งหมด</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>

      <AuraCard className="p-4">
        {loading ? <TableSkeleton rows={5} cols={5} /> : items.length === 0 ? (
          <p className="text-aura-textMuted font-thai">ยังไม่มีเอกสาร</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">Path</th><th className="text-left p-2">Entity</th><th className="text-left p-2">Kind</th><th className="text-left p-2">สร้าง</th><th></th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">
                    <a href={attachmentUrl(a.file_path)} target="_blank" rel="noreferrer" className="text-aura-cyan hover:underline font-mono text-xs">{a.file_path}</a>
                  </td>
                  <td className="p-2">{a.entity_type}/{a.entity_id.slice(0, 8)}…</td>
                  <td className="p-2">{a.kind}</td>
                  <td className="p-2 text-xs">{a.created_at.slice(0, 10)}</td>
                  <td className="p-2"><button onClick={() => remove(a)} className="text-red-400 hover:underline font-thai">ลบ</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AuraCard>
    </div>
  );
}
