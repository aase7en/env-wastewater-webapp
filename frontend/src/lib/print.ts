/**
 * PDF-2 — usePrintReport hook + render engine.
 *
 * Renders a PdfTemplate + data object → jsPDF document → triggers
 * browser download. Uses jsPDF + autotable (already in deps).
 *
 * Flow:
 *   1. Caller: const { print } = usePrintReport();
 *   2. print(templateId, dataObject) → fetches template → renders → saves
 *
 * Track Z scope (lib only).
 */
import { useState, useCallback } from "react";
import { fetchTemplate, type PdfLayout } from "./pdf-template";

type PrintResult = { ok: true; bytes: number } | { ok: false; error: string };

export function usePrintReport() {
  const [busy, setBusy] = useState(false);

  const print = useCallback(async (
    templateId: string,
    data: Record<string, unknown>,
    filename?: string,
  ): Promise<PrintResult> => {
    setBusy(true);
    try {
      const tpl = await fetchTemplate(templateId);
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        unit: "mm",
        format: tpl.paper_size,
        orientation: tpl.orientation,
      });

      const layout = tpl.layout as PdfLayout;

      // Title block.
      doc.setFontSize(16);
      doc.text(layout.title, layout.fields[0]?.x ?? 20, 15);
      if (layout.subtitle) {
        doc.setFontSize(10);
        doc.text(layout.subtitle, 20, 22);
      }

      // Fields.
      doc.setFontSize(10);
      for (const f of layout.fields) {
        doc.setFont("helvetica", "bold");
        doc.text(`${f.label}:`, f.x, f.y);
        doc.setFont("helvetica", "normal");
        const val = String(data[f.key] ?? "-");
        doc.text(val, f.x + 30, f.y);
      }

      // Optional table.
      if (layout.table) {
        const rows = (data[layout.table.rowsKey] as Record<string, unknown>[]) ?? [];
        autoTable(doc, {
          startY: Math.max(...layout.fields.map((f) => f.y)) + 10,
          head: [layout.table.columns],
          body: rows.map((r) => layout.table!.columns.map((c) => String(r[c] ?? ""))),
          theme: "grid",
          styles: { font: "helvetica", fontSize: 9 },
        });
      }

      const name = filename ?? `${tpl.name}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(name);
      return { ok: true, bytes: Math.round(doc.output("arraybuffer").byteLength) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    } finally {
      setBusy(false);
    }
  }, []);

  return { print, busy };
}

/** Render without template lookup (used by starter templates in PDF-3). */
export async function printLayout(
  layout: PdfLayout,
  paperSize: "a4" | "a5",
  orientation: "portrait" | "landscape",
  data: Record<string, unknown>,
  filename: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: paperSize, orientation });

  doc.setFontSize(16);
  doc.text(layout.title, 20, 15);
  doc.setFontSize(10);
  for (const f of layout.fields) {
    doc.setFont("helvetica", "bold");
    doc.text(`${f.label}:`, f.x, f.y);
    doc.setFont("helvetica", "normal");
    doc.text(String(data[f.key] ?? "-"), f.x + 30, f.y);
  }
  if (layout.table) {
    const rows = (data[layout.table.rowsKey] as Record<string, unknown>[]) ?? [];
    autoTable(doc, {
      startY: Math.max(...layout.fields.map((f) => f.y)) + 10,
      head: [layout.table.columns],
      body: rows.map((r) => layout.table!.columns.map((c) => String(r[c] ?? ""))),
    });
  }
  doc.save(filename);
}
