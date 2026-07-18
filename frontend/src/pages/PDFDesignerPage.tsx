/**
 * PDF-1/3 — PDF Template Designer page.
 *
 * Admin can create/edit/delete PDF templates stored in core.pdf_template.
 * Each template has a layout JSON describing field placements.
 *
 * Track Z scope: logic + minimal markup (Track F owns drag-drop UI polish).
 */
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Input, Field, Select, Textarea } from "../components/ui/Input";
import {
  fetchTemplates, saveTemplate, deleteTemplate, type PdfTemplate, type PdfLayout,
} from "../lib/pdf-template";

const DATA_SOURCES = [
  "wastewater.reading", "carbon.reading", "water_supply.daily_check",
  "garbage.collection_log", "fuel.dispense_log", "garden.work_round",
  "building.inspection_round", "safety.monthly_check", "food.lab_test",
  "chemical.movement", "core.repair_request",
];

const STARTER_LAYOUT = (ds: string): PdfLayout => ({
  title: `รายงาน ${ds}`,
  subtitle: "โรงพยาบาลอุทัย — ส่วนสิ่งแวดล้อม",
  fields: [
    { key: "id", label: "ID", x: 20, y: 30, w: 60, h: 8 },
    { key: "reading_date", label: "วันที่", x: 20, y: 38, w: 60, h: 8 },
    { key: "reported_by", label: "ผู้บันทึก", x: 20, y: 46, w: 60, h: 8 },
  ],
});

export function PDFDesignerPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PdfTemplate | null>(null);
  const [layoutText, setLayoutText] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setTemplates(await fetchTemplates()); }
    catch (e) { toast("error", (e as Error).message); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  function startNew() {
    setEditing({
      id: "", name: "", data_source: DATA_SOURCES[0]!,
      paper_size: "a4", orientation: "portrait",
      layout: STARTER_LAYOUT(DATA_SOURCES[0]!), created_by: null, created_at: "",
    });
    setLayoutText(JSON.stringify(STARTER_LAYOUT(DATA_SOURCES[0]!), null, 2));
  }

  function startEdit(t: PdfTemplate) {
    setEditing(t);
    setLayoutText(JSON.stringify(t.layout, null, 2));
  }

  async function save() {
    if (!editing) return;
    let layout: PdfLayout;
    try { layout = JSON.parse(layoutText); }
    catch (e) { toast("error", `Layout JSON ไม่ถูก: ${(e as Error).message}`); return; }
    try {
      await saveTemplate({ ...editing, layout });
      toast("success", "บันทึก template แล้ว");
      setEditing(null);
      refresh();
    } catch (e) { toast("error", (e as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm("ลบ template?")) return;
    try { await deleteTemplate(id); refresh(); }
    catch (e) { toast("error", (e as Error).message); }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">PDF Template Designer</h1>

      <Button onClick={startNew}>+ เพิ่ม Template</Button>

      {editing && (
        <AuraCard className="p-4 space-y-3">
          <h2 className="font-semibold font-thai">{editing.id ? "แก้ไข" : "เพิ่ม"} Template</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="ชื่อ"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Data source">
              <Select value={editing.data_source} onChange={(e) => setEditing({ ...editing, data_source: e.target.value })}>
                {DATA_SOURCES.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Paper size">
              <Select value={editing.paper_size} onChange={(e) => setEditing({ ...editing, paper_size: e.target.value as "a4" | "a5" })}>
                <option value="a4">A4</option><option value="a5">A5</option>
              </Select>
            </Field>
            <Field label="Orientation">
              <Select value={editing.orientation} onChange={(e) => setEditing({ ...editing, orientation: e.target.value as "portrait" | "landscape" })}>
                <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
              </Select>
            </Field>
          </div>
          <Field label="Layout JSON (fields + table)">
            <Textarea value={layoutText} onChange={(e) => setLayoutText(e.target.value)} rows={12} className="font-mono text-xs" />
          </Field>
          <div className="flex gap-2">
            <Button onClick={save}>บันทึก</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>ยกเลิก</Button>
          </div>
        </AuraCard>
      )}

      <AuraCard className="p-4">
        <h2 className="font-semibold mb-2 font-thai">Templates ({templates.length})</h2>
        {loading ? <p className="font-thai">กำลังโหลด…</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">ชื่อ</th><th className="text-left p-2">Data source</th><th className="text-left p-2">ขนาด</th><th></th></tr></thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.name}</td>
                  <td className="p-2 font-mono text-xs">{t.data_source}</td>
                  <td className="p-2">{t.paper_size} {t.orientation}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => startEdit(t)} className="text-aura-cyan hover:underline font-thai">แก้</button>
                    <button onClick={() => remove(t.id)} className="text-red-400 hover:underline font-thai">ลบ</button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-aura-textMuted font-thai">ยังไม่มี template</td></tr>}
            </tbody>
          </table>
        )}
      </AuraCard>
    </div>
  );
}
