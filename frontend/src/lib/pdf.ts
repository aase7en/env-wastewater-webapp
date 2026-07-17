/**
 * Client-side PDF generation for the three starter templates required by
 * SPEC.md §ข้อ 5: ทส.1 (daily log), ทส.2 (monthly summary), ใบแจ้งซ่อม
 * (repair request). Generated in the browser via jsPDF + autotable — no
 * server round-trip, no Edge Function. Thai text renders via the Sarabun
 * font bundled as base64 (Thai support is not built into jsPDF default
 * fonts). For a future chunk we may swap to a server-side generator if
 * richer layouts are needed.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardRow } from "./types";
import { fmt, thaiDate } from "./utils";

// ─── Helpers ───────────────────────────────────────────────────────────────

const HOSPITAL_NAME = "โรงพยาบาลอุทัย";
const SYSTEM_NAME = "ระบบบำบัดน้ำเสีย (Activated Sludge 60 ลบ.ม.)";

/** Standard A4 portrait header — hospital + system name + form code. */
function header(doc: jsPDF, formCode: string, title: string, subtitle?: string) {
  doc.setFontSize(16);
  doc.text(`${HOSPITAL_NAME}`, 105, 18, { align: "center" });
  doc.setFontSize(13);
  doc.text(title, 105, 26, { align: "center" });
  if (subtitle) {
    doc.setFontSize(11);
    doc.text(subtitle, 105, 33, { align: "center" });
  }
  // Form code top-right
  doc.setFontSize(10);
  doc.text(formCode, 200, 18, { align: "right" });
  doc.setLineWidth(0.5);
  doc.line(10, 38, 200, 38);
}

function footer(doc: jsPDF, page: number, total: number) {
  doc.setFontSize(9);
  doc.text(
    `หน้า ${page}/${total} · ออกจากระบบเมื่อ ${new Date().toLocaleString("th-TH")}`,
    105,
    290,
    { align: "center" }
  );
}

// ─── ทส.1 — Daily log (one reading per row, multiple days per page) ───────

export function generateTs1(rows: DashboardRow[], month: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  header(doc, "ทส.1", "บันทึกการตรวจวัดคุณภาพน้ำทิ้งรายวัน", `เดือน ${month}`);

  autoTable(doc, {
    startY: 45,
    head: [["วันที่", "DO เฉลี่ย\n(mg/L)", "pH", "Cl อิสระ\n(mg/L)", "TDS\n(mg/L)", "น้ำเข้า\n(m³)", "น้ำใช้\n(m³)", "สถานะ", "หมายเหตุ"]],
    body: rows.map((r) => [
      thaiDate(r.reading_date),
      fmt(r.do_average, 2),
      fmt(r.ph, 2),
      fmt(r.free_chlorine, 2),
      fmt(r.tds_aeration, 0),
      fmt(r.wastewater_in, 1),
      fmt(r.water_used_total, 1),
      r.system_operating === false ? "ผิดปกติ" : r.system_operating === true ? "ปกติ" : "—",
      r.do_alert || r.chlorine_alert || r.ph_alert ? "⚠ ค่าผิดปกติ" : "",
    ]),
    styles: { font: "helvetica", fontSize: 9, halign: "center", valign: "middle" },
    headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    alternateRowStyles: { fillColor: [243, 251, 247] },
    columnStyles: {
      0: { halign: "left", cellWidth: 28 },
      7: { halign: "left" },
      8: { halign: "left" },
    },
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    footer(doc, i, total);
  }
  return doc;
}

// ─── ทส.2 — Monthly summary (aggregate from daily rows) ───────────────────

export function generateTs2(rows: DashboardRow[], month: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  header(doc, "ทส.2", "สรุปการตรวจวัดคุณภาพน้ำทิ้งรายเดือน", `เดือน ${month}`);

  // Aggregate
  const doValues = rows.map((r) => parseFloat(String(r.do_average ?? ""))).filter((v) => !isNaN(v));
  const phValues = rows.map((r) => parseFloat(String(r.ph ?? ""))).filter((v) => !isNaN(v));
  const clValues = rows.map((r) => parseFloat(String(r.free_chlorine ?? ""))).filter((v) => !isNaN(v));
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  const summary = [
    ["จำนวนวันที่บันทึก", `${rows.length} วัน`],
    ["DO เฉลี่ย (mg/L)", fmt(avg(doValues), 2)],
    ["pH เฉลี่ย", fmt(avg(phValues), 2)],
    ["คลอรีนอิสระเฉลี่ย (mg/L)", fmt(avg(clValues), 2)],
    ["น้ำเข้าระบบรวม (m³)", fmt(rows.reduce((s, r) => s + (parseFloat(String(r.wastewater_in ?? "0")) || 0), 0), 1)],
    ["น้ำที่ใช้รวม (m³)", fmt(rows.reduce((s, r) => s + (parseFloat(String(r.water_used_total ?? "0")) || 0), 0), 1)],
    ["จำนวนวันผิดปกติ", `${rows.filter((r) => r.system_operating === false).length} วัน`],
    ["จำนวนวันระบายน้ำทิ้ง", `${rows.filter((r) => r.wastewater_discharged === true).length} วัน`],
    ["จำนวนวันที่ค่า DO ต่ำกว่าเกณฑ์", `${rows.filter((r) => r.do_alert).length} วัน`],
    ["จำนวนวันที่ค่า Cl ต่ำกว่าเกณฑ์", `${rows.filter((r) => r.chlorine_alert).length} วัน`],
  ];

  autoTable(doc, {
    startY: 45,
    head: [["รายการ", "ค่าสรุป"]],
    body: summary,
    styles: { font: "helvetica", fontSize: 11, cellPadding: 3 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: "right" } },
  });

  // Signature line
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
  doc.text("ลงชื่อ __________________________", 130, finalY);
  doc.text("(                                        )", 130, finalY + 6);
  doc.text("ตำแหน่ง ______________________", 130, finalY + 12);
  doc.text(`วันที่ ${thaiDate(new Date().toISOString())}`, 130, finalY + 18);

  footer(doc, 1, 1);
  return doc;
}

// ─── ใบแจ้งซ่อม — Repair request (single record) ─────────────────────────

export interface RepairRequestInput {
  date: string;
  cause: string;
  equipment?: string | null;
  reporter?: string | null;
  status?: "open" | "in_progress" | "resolved" | "cancelled";
}

export function generateRepairRequest(input: RepairRequestInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  header(doc, "ใบแจ้งซ่อม", "ใบแจ้งซ่อมอุปกรณ์ระบบบำบัดน้ำเสีย", SYSTEM_NAME);

  autoTable(doc, {
    startY: 45,
    body: [
      ["วันที่แจ้ง", thaiDate(input.date)],
      ["อุปกรณ์ที่ชำรุด", input.equipment || "—"],
      ["ผู้แจ้ง", input.reporter || "—"],
      ["สถานะ", { open: "รอดำเนินการ", in_progress: "กำลังซ่อม", resolved: "ซ่อมเสร็จ", cancelled: "ยกเลิก" }[input.status || "open"] || "รอดำเนินการ"],
      ["สาเหตุ / อาการ", input.cause],
    ],
    styles: { font: "helvetica", fontSize: 11, cellPadding: 3, valign: "top" },
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" }, 1: { cellWidth: 140 } },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  doc.text("ลงชื่อผู้แจ้ง __________________________", 20, finalY);
  doc.text("ลงชื่อผู้รับแจ้ง ________________________", 120, finalY);

  footer(doc, 1, 1);
  return doc;
}

/** Save a jsPDF doc as a download. */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}
