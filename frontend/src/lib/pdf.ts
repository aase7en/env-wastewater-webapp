/**
 * Client-side PDF generation for the three starter templates required by
 * SPEC.md §ข้อ 5: ทส.1 (daily log), ทส.2 (monthly summary), ใบแจ้งซ่อม
 * (repair request). Generated in the browser via jsPDF + autotable — no
 * server round-trip, no Edge Function. Thai text renders via the Sarabun
 * font bundled as base64 (Thai support is not built into jsPDF default
 * fonts). For a future chunk we may swap to a server-side generator if
 * richer layouts are needed.
 *
 * ENV-PARITY-P4-001 — ทส.1/ทส.2 UPGRADED (AppSheet P4.1, owner B4):
 *   - the binding layouts come from the D1 DRIVE enumeration
 *     (docs/ai/handoffs/ENV-PARITY-P4-001-GLM.md §5 D1):
 *       ทส.1 = `261109_PDF_TEMPLATE_ทส1_V5.1.3_หมอปรัช.docx`
 *              (1ptC4G55ftF3Dv74RaL8Vd-yNFgqWsTcc, sha256 378be461…, 2,657,668 B)
 *       ทส.2 = `ทส.2_Template_หมอปรัช` (Google Docs,
 *              1Wj16uu2q5pTbWTeOs-U6rOpH7X79h6zP2yDudEGkU80,
 *              txt-export sha256 c6e67afa…, 8,684 B)
 *     — field layouts mirrored as code (drive-file-wins; never binaries).
 *   - buildTs1PrintModel / buildTs2PrintModel are the pure layout models:
 *     the React print views AND the jsPDF fallback render THE SAME models,
 *     so the printed output carries the honesty pins (unknown ≠ 0,
 *     estimate provenance, พ.ศ., no personnel identity) in both paths.
 *   - the primary production mechanism is the dedicated print-ready view +
 *     browser print-to-PDF (window.print(), A4 print CSS); the jspdf
 *     export remains the fallback per what exists (same dynamic-import
 *     pattern). generateRepairRequest / downloadPDF / header / footer are
 *     byte-untouched.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardRow } from "./types";
import type {
  ReportMeterChainRow,
  ReportReadingRow,
  ReportWaterChainRow,
} from "./report-summary";
import {
  ENERGY_DELTA_PROVENANCE,
  REPORT_CHLORINE_LITTER_FACTOR,
  beYear,
  buildWastewaterSummary,
  buildWaterSupplySummary,
  enumerateCalendarDays,
  thaiMonthFull,
} from "./report-summary";
import type { ReadingRunStatusRow } from "./supabase-queries";
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

// ─── P4.1 shared model helpers ────────────────────────────────────────────

/** Calendar bounds of a YYYY-MM (inclusive first→last day). */
function monthBounds(month: string): { startISO: string; endISO: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { startISO: `${y}-${pad(m)}-01`, endISO: `${y}-${pad(m)}-${pad(last)}` };
}

/** The unknown≠zero cell display (honest absence, never 0). */
function cell(v: number | string | null | undefined): string {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

/** Coerce a view cell to finite number or null (unknown stays unknown). */
function numOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

// ─── P4.1 ทส.1 model (the V5.1.3 drive-template layout) ───────────────────

export interface Ts1PrintRow {
  dateISO: string;
  dateThai: string;
  energy: number | null;
  waterUsed: number | null;
  wastewaterIn: number | null;
  /** "ระบาย" | "ไม่ระบาย" | null (unknown) */
  discharged: string | null;
  chlorine: number | null;
  sludge: number | null;
  tds1: number | null;
  do3: number | null;
  /** 8 equipment-run booleans in drive-template order (null = unknown). */
  equipment: (boolean | null)[];
  /** ALWAYS null — personnel identity never enters the report (D1-5). */
  recorder: string | null;
}

export interface Ts1PrintModel {
  formCode: "ทส.1";
  monthThai: string;
  yearThai: number;
  /** The 18 drive-template column headers, verbatim order. */
  columns: string[];
  rows: Ts1PrintRow[];
  recordedDays: number;
  missingDays: number;
  energyProvenance: string;
  notes: string[];
}

/** The ทส.1 column census — verbatim from the V5.1.3 drive template
 *  (D1 enumeration; drive-file-wins). */
export const TS1_COLUMNS: string[] = [
  "วันเดือนปี",
  "ปริมาณการใช้ไฟฟ้าของระบบบำบัดน้ำเสีย (หน่วย)",
  "ปริมาณน้ำใช้ในทุกกิจกรรมของแหล่งกำเนิดมลพิษ (ลบ.ม.)",
  "ปริมาณน้ำเสียที่เข้าระบบบ่อบำบัดน้ำเสีย (ลบ.ม.)",
  "การระบายน้ำทิ้งจากระบบบำบัดน้ำเสีย",
  "ปริมาณสารเคมีหรือสารสกัดชีวภาพที่ใช้ (คลอรีนน้ำ ลิตร)",
  "ปริมาณตะกอนส่วนเกินที่นำไปกำจัด (ลบ.ม.)",
  "ปริมาณของแข็งละลายน้ำ (TDS)",
  "ปริมาณออกซิเจนละลายน้ำ OD",
  "การทำงานของอุปกรณ์ — เครื่องสูบน้ำ 1",
  "การทำงานของอุปกรณ์ — เครื่องสูบน้ำ 2",
  "การทำงานของอุปกรณ์ — เครื่องเติมอากาศ 1",
  "การทำงานของอุปกรณ์ — เครื่องเติมอากาศ 2",
  "การทำงานของอุปกรณ์ — เครื่องสูบตะกอน 1",
  "การทำงานของอุปกรณ์ — เครื่องสูบตะกอน 2",
  "การทำงานของอุปกรณ์ — เครื่องจ่ายคลอรีน 1",
  "การทำงานของอุปกรณ์ — เครื่องจ่ายคลอรีน 2",
  "ผู้บันทึก",
];

const TS1_EQUIPMENT_KEYS = [
  "pump1_running",
  "pump2_running",
  "aerator1_running",
  "aerator2_running",
  "sludge_pump1_running",
  "sludge_pump2_running",
  "chlorine_pump1_running",
  "chlorine_pump2_running",
] as const;

/** Build the ทส.1 print model. Rows = RECORDED days only (the AppSheet
 *  START-loop class); unknown cells stay null; missing days are COUNTED,
 *  never 0-filled. */
export function buildTs1PrintModel(input: {
  month: string;
  dashboardRows: DashboardRow[];
  readings: ReportReadingRow[];
  chain: ReportMeterChainRow[];
  runStatus: ReadingRunStatusRow[];
}): Ts1PrintModel {
  const { month, dashboardRows, readings, chain, runStatus } = input;
  const { startISO, endISO } = monthBounds(month);
  const calendar = enumerateCalendarDays(startISO, endISO);
  const dashByDate = new Map(dashboardRows.map((r) => [r.reading_date, r]));
  const chainByDate = new Map(chain.map((r) => [r.reading_date, r]));
  const runByDate = new Map(runStatus.map((r) => [r.reading_date, r]));

  const rows: Ts1PrintRow[] = readings
    .slice()
    .sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    .map((r) => {
      const dash = dashByDate.get(r.reading_date);
      const ch = chainByDate.get(r.reading_date);
      const run = runByDate.get(r.reading_date);
      const discharged =
        dash?.wastewater_discharged === true
          ? "ระบาย"
          : dash?.wastewater_discharged === false
            ? "ไม่ระบาย"
            : null;
      return {
        dateISO: r.reading_date,
        dateThai: thaiDate(r.reading_date),
        energy: ch ? numOrNull(ch.delta_kwh) : null,
        waterUsed: dash ? numOrNull(dash.water_used_total) : null,
        wastewaterIn: numOrNull(r.wastewater_in),
        discharged,
        chlorine: numOrNull(r.chlorine_used),
        sludge: numOrNull(r.excess_sludge_removed),
        tds1: numOrNull(r.tds_aeration),
        do3: numOrNull(r.do_before_discharge),
        equipment: TS1_EQUIPMENT_KEYS.map(
          (k) => (run ? (run[k] as boolean | null) : null),
        ),
        recorder: null,
      };
    });

  const recordedDays = rows.length;
  const missingDays = Math.max(0, calendar.length - recordedDays);

  return {
    formCode: "ทส.1",
    monthThai: thaiMonthFull(Number(month.slice(5, 7))),
    yearThai: beYear(startISO),
    columns: TS1_COLUMNS,
    rows,
    recordedDays,
    missingDays,
    energyProvenance: ENERGY_DELTA_PROVENANCE,
    notes: [
      `มีบันทึก ${recordedDays} วัน · ไม่มีบันทึก ${missingDays} วัน (ทั้งหมด ${calendar.length} วัน) — วันที่ไม่มีบันทึกไม่ถูกนับเป็น 0`,
      `ไฟฟ้ารายวัน: ${ENERGY_DELTA_PROVENANCE} — วันเปลี่ยน/รีเซ็ตมิเตอร์แสดงค่าว่าง`,
      "คลอรีนน้ำ: ค่าที่บันทึกเป็นกิโลกรัมตามระบบบันทึกจริง · แสดงเป็นลิตร = ×1.2 (W/V display factor ของระบบเดิม)",
      "คอลัมน์ผู้บันทึกเว้นว่างตามข้อจำกัดข้อมูลส่วนบุคคล (ระบบใหม่ไม่แสดงชื่อบุคคลในรายงาน)",
    ],
  };
}

// ─── P4.1 ทส.2 model (the ทส.2 gdoc-template layout) ──────────────────────

export interface Ts2AddressHeader {
  /** Template constants (fields NOT held in core.address). */
  hospital: string;
  houseNo: string;
  moo: string;
  soi: string;
  road: string;
  phone: string;
  businessType: string;
  /** The B7 EDITABLE chain — live values from core.address, or null when
   *  the census carries no matching row (missing → honest notice). */
  tambon: string | null;
  district: string | null;
  province: string | null;
  missing: boolean;
}

export interface Ts2Operation {
  label: string;
  status: string;
}

export interface Ts2PrintModel {
  formCode: "ทส.2";
  monthThai: string;
  yearThai: number;
  addressHeader: Ts2AddressHeader;
  /** §๒ static system facts (the drive template's own constants). */
  section2: {
    systemType: string;
    capacity: string;
    operation: string;
    equipment: string[];
    receivingWater: string;
    sludgeMgmt: string;
  };
  section3: {
    sumEnergy: number;
    sumEnergyProvenance: string;
    sumWater: number;
    sumWaterProvenance: string;
    sumWasteWater: number;
    dischargeLine: string;
    chlorineReal: number;
    chlorineLitter: number;
    chlorineProvenance: string;
    operations: Ts2Operation[];
    sludge: number;
    issues: string;
  };
  recordedDays: number;
  missingDays: number;
  warnings: string[];
}

/** All-known rule for an equipment group across recorded days:
 *  any false → ผิดปกติ; at least one true and none false → ปกติ;
 *  no rows / all unknown → ค่าว่าง. */
function groupStatus(
  runStatus: ReadingRunStatusRow[],
  keys: readonly (keyof ReadingRunStatusRow)[],
  totalRecorded: number,
): string {
  const vals = runStatus.flatMap((r) => keys.map((k) => r[k] as boolean | null));
  if (vals.length === 0 && totalRecorded === 0) return "ค่าว่าง (ไม่มีบันทึก)";
  if (vals.every((v) => v === null) || vals.length === 0) return "ค่าว่าง (ไม่มีข้อมูล)";
  if (vals.some((v) => v === false)) return "ผิดปกติ (ระบุ)";
  if (vals.every((v) => v === true)) return "ปกติ";
  return "ค่าว่าง (บันทึกไม่ครบ)";
}

/** The ทส.2 §๓(๖) operation lines — COMPUTED from recorded rows (the
 *  drive template's static ☑ marks are data claims; honesty wins). */
export function buildTs2Operations(
  dashboardRows: DashboardRow[],
  runStatus: ReadingRunStatusRow[],
  totalRecorded: number,
): Ts2Operation[] {
  const sysVals = dashboardRows.map((r) => r.system_operating ?? null);
  const sys =
    sysVals.length === 0
      ? "ค่าว่าง (ไม่มีบันทึก)"
      : sysVals.every((v) => v === null)
        ? "ค่าว่าง (ไม่มีข้อมูล)"
        : sysVals.some((v) => v === false)
          ? "ผิดปกติ (ระบุ)"
          : "ปกติ";
  return [
    { label: "ระบบบำบัดน้ำเสีย", status: sys },
    {
      label: "เครื่องสูบน้ำ",
      status: groupStatus(runStatus, ["pump1_running", "pump2_running"], totalRecorded),
    },
    {
      label: "เครื่องเติมอากาศ",
      status: groupStatus(runStatus, ["aerator1_running", "aerator2_running"], totalRecorded),
    },
    { label: "เครื่องกวน/ผสมน้ำเสีย", status: "ค่าว่าง (ไม่มีช่องบันทึก)" },
    { label: "เครื่องกวน/ผสมสารเคมี", status: "ค่าว่าง (ไม่มีช่องบันทึก)" },
    {
      label: "เครื่องสูบตะกอน",
      status: groupStatus(runStatus, ["sludge_pump1_running", "sludge_pump2_running"], totalRecorded),
    },
    { label: "อื่นๆ", status: "ค่าว่าง (ไม่มีช่องบันทึก)" },
  ];
}

/** Build the ทส.2 print model. The B7 address header reads the address
 *  table (null → honest missing notice); aggregate semantics map 1:1 to
 *  the P1.6 lib (Sum_Energy/Sum_Water/Sum_waste_water/useage_Chlorine/
 *  Sum_excess sludge); §๓(๔)+(๖) are computed from recorded rows. */
export function buildTs2PrintModel(input: {
  month: string;
  startISO: string;
  endISO: string;
  dashboardRows: DashboardRow[];
  readings: ReportReadingRow[];
  chain: ReportMeterChainRow[];
  waterChain: ReportWaterChainRow[];
  runStatus: ReadingRunStatusRow[];
  address: {
    tambon_thai: string;
    district_thai: string;
    province_thai: string;
  } | null;
}): Ts2PrintModel {
  const { month, startISO, endISO, dashboardRows, readings, chain, waterChain, runStatus, address } = input;
  const calendar = enumerateCalendarDays(startISO, endISO);
  const ww = buildWastewaterSummary({ startISO, endISO, readings, chain });
  const ws = buildWaterSupplySummary({ startISO, endISO, chain: waterChain });

  const dischargedVals = dashboardRows.map((r) => r.wastewater_discharged ?? null);
  const dischargedTrue = dischargedVals.filter((v) => v === true).length;
  const recordedTotal = dischargedVals.length;
  const dischargeLine =
    recordedTotal === 0
      ? "ค่าว่าง (ไม่มีบันทึกการระบาย)"
      : dischargedVals.every((v) => v === true)
        ? `ระบายทุกวัน (บันทึกจริง ${recordedTotal} วัน)`
        : `ระบาย ${dischargedTrue} จาก ${recordedTotal} วันที่มีบันทึก`;

  const recordedDays = new Set(readings.map((r) => r.reading_date)).size;

  return {
    formCode: "ทส.2",
    monthThai: thaiMonthFull(Number(month.slice(5, 7))),
    yearThai: beYear(startISO),
    addressHeader: address
      ? {
          hospital: HOSPITAL_NAME,
          houseNo: "15",
          moo: "5",
          soi: "-",
          road: "-",
          phone: "035-356336",
          businessType: "โรงพยาบาล ชุมชนขนาด 30 เตียง",
          tambon: address.tambon_thai,
          district: address.district_thai,
          province: address.province_thai,
          missing: false,
        }
      : {
          hospital: HOSPITAL_NAME,
          houseNo: "15",
          moo: "5",
          soi: "-",
          road: "-",
          phone: "035-356336",
          businessType: "โรงพยาบาล ชุมชนขนาด 30 เตียง",
          tambon: null,
          district: null,
          province: null,
          missing: true,
        },
    section2: {
      systemType: "Activated Sludge",
      capacity: "60 ลบ.ม./วัน",
      operation: "แบบต่อเนื่อง 24 ชั่วโมง/วัน",
      equipment: ["เครื่องสูบน้ำ", "เครื่องเติมอากาศ", "เครื่องสูบตะกอน"],
      receivingWater: "คลองข้าวเม่า",
      sludgeMgmt: "ตากแห้งทำปุ๋ย",
    },
    section3: {
      sumEnergy: ww.sumEnergy,
      sumEnergyProvenance: `${ENERGY_DELTA_PROVENANCE} · วันเปลี่ยน/รีเซ็ตมิเตอร์ ${ww.energyBoundaryExcluded} วันถูกยกเว้น (ไม่ถูกนับเป็น 0)`,
      sumWater: ws.sumWaterIn,
      sumWaterProvenance:
        ws.recordedDays === 0
          ? "ค่าว่าง (ไม่มีบันทึกน้ำประปาในช่วงนี้)"
          : `บันทึกจริง ${ws.recordedDays} วัน · ค่าประมาณจากชั่วโมงปั๊ม ${ws.sumWaterInEstimate > 0 ? fmt(ws.sumWaterInEstimate, 1) + " m³ (แสดงแยก ไม่รวม)" : "ไม่มี"}`,
      sumWasteWater: ww.sumWastewaterIn,
      dischargeLine,
      chlorineReal: ww.sumChlorineReal,
      chlorineLitter: ww.chlorineLitter,
      chlorineProvenance: `คลอรีน (ลิตร) = useage_Chlorine × ${REPORT_CHLORINE_LITTER_FACTOR} (W/V display factor ของระบบเดิม)`,
      operations: buildTs2Operations(dashboardRows, runStatus, recordedTotal),
      sludge: ww.sumSludge,
      issues: "",
    },
    recordedDays,
    missingDays: Math.max(0, calendar.length - recordedDays),
    warnings: [
      "๑.เจ้าของหรือผู้ครอบครองแหล่งกำเนิดมลพิษ ผู้ควบคุมระบบบำบัดน้ำเสีย หรือผู้รับจ้างให้บริการบำบัดน้ำเสียผู้ใดไม่จัดเก็บสถิติ ข้อมูล หรือไม่ทำบันทึกหรือรายงานตามมาตรา ๘๐ ต้องระวังโทษจำคุกไม่เกินหนึ่งเดือน หรือปรับไม่เกินหนึ่งหมื่นบาท หรือทั้งจำทั้งปรับตามมาตรา ๑๐๖",
      "๒.ผู้ควบคุมระบบบำบัดน้ำเสียหรือผู้รับจ้างให้บริการบำบัดน้ำเสียผู้ใดทำบันทึกหรือรายงานโดยแสดงข้อความอันเป็นเท็จ ต้องระวางโทษจำคุกไม่เกินหนึ่งปี หรือปรับไม่เกินหนึ่งแสนบาท หรือทั้งจำทั้งปรับตามมาตรา ๑๐๗",
    ],
  };
}

// ─── ทส.1 — Daily log (one reading per row, multiple days per page) ───────

/** Render the ทส.1 print model to jsPDF (the fallback path; the primary
 *  path is the React print view + window.print()). Same model = same
 *  honesty pins in both outputs. */
export function generateTs1(model: Ts1PrintModel): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  header(doc, "ทส.1", "แบบรายงาน ทส.1", `เดือน ${model.monthThai} พ.ศ. ${model.yearThai}`);

  autoTable(doc, {
    startY: 45,
    head: [model.columns],
    body: model.rows.map((r) => [
      r.dateThai,
      cell(r.energy),
      cell(r.waterUsed),
      cell(r.wastewaterIn),
      cell(r.discharged),
      cell(r.chlorine),
      cell(r.sludge),
      cell(r.tds1),
      cell(r.do3),
      ...r.equipment.map((e) => (e === true ? "ทำงาน" : e === false ? "หยุด" : "—")),
      cell(r.recorder),
    ]),
    styles: { font: "helvetica", fontSize: 7, halign: "center", valign: "middle" },
    headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    alternateRowStyles: { fillColor: [243, 251, 247] },
    columnStyles: {
      0: { halign: "left", cellWidth: 22 },
      4: { halign: "left" },
      17: { halign: "left" },
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

/** Render the ทส.2 print model to jsPDF (the fallback path). */
export function generateTs2(model: Ts2PrintModel): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  header(doc, "ทส.2", "รายงานสรุปผลการทำงานของระบบบำบัดน้ำเสีย", `เดือน ${model.monthThai} พ.ศ. ${model.yearThai}`);

  const addr = model.addressHeader;
  const addrLine = addr.missing
    ? "ยังไม่พบแถวที่อยู่ในตารางที่อยู่ (แขวง/ตำบล เขต/อำเภอ จังหวัด — ค่าว่าง)"
    : `แขวง/ตำบล ${addr.tambon} เขต/อำเภอ ${addr.district} จังหวัด ${addr.province} โทรศัพท์ ${addr.phone}`;
  const s3 = model.section3;

  autoTable(doc, {
    startY: 45,
    body: [
      ["๑.ข้อมูลทั่วไป", ""],
      ["แหล่งกำเนิดมลพิษ", `${addr.hospital} เลขที่ ${addr.houseNo} หมู่ที่ ${addr.moo} ซอย ${addr.soi} ถนน ${addr.road} · ${addrLine}`],
      ["ประกอบกิจการประเภท", addr.businessType],
      ["เดือนที่รายงาน", `${model.monthThai} พ.ศ. ${model.yearThai} (มาตรา ๘๐ แห่งพระราชบัญญัติส่งเสริมและรักษาคุณภาพสิ่งแวดล้อมแห่งชาติ พ.ศ. ๒๕๓๕)`],
      ["๒.ระบบบำบัดน้ำเสีย", `${model.section2.systemType} · ${model.section2.capacity} · ${model.section2.operation} · แหล่งรองรับ ${model.section2.receivingWater} · ตะกอน ${model.section2.sludgeMgmt}`],
      ["๓.(๑) ปริมาณการใช้ไฟฟ้าของระบบบำบัดน้ำเสีย (หน่วย)", `${fmt(s3.sumEnergy, 1)} · ${s3.sumEnergyProvenance}`],
      ["๓.(๒) ปริมาณน้ำใช้ทุกกกิจกรรมในแหล่งกำเนิดมลพิษ (ลบ.ม.)", `${fmt(s3.sumWater, 1)} · ${s3.sumWaterProvenance}`],
      ["๓.(๓) ปริมาณน้ำเสียที่เข้าระบบบำบัดน้ำเสีย (ลบ.ม.)", fmt(s3.sumWasteWater, 1)],
      ["๓.(๔) การระบายน้ำทิ้งจากระบบบำบัดน้ำเสีย", s3.dischargeLine],
      ["๓.(๕) ปริมาณสารเคมีหรือสารสกัดชีวภาพที่ใช้ (ลิตร)", `${fmt(s3.chlorineLitter, 2)} ลิตร · ${s3.chlorineProvenance}`],
      ["๓.(๖) การทำงานของระบบและอุปกรณ์", s3.operations.map((o) => `${o.label}: ${o.status}`).join(" · ")],
      ["๓.(๗) ปริมาณตะกอนส่วนเกินจากระบบบำบัดน้ำเสียที่นำไปกำจัด (ลบ.ม.)", fmt(s3.sludge, 1)],
      ["๓.(๘) ปัญหา อุปสรรค์ และแนวทางแก้ไข", "—"],
      ["จำนวนวันที่บันทึก", `${model.recordedDays} วัน (ไม่มีบันทึก ${model.missingDays} วัน — ไม่ถูกนับเป็น 0)`],
    ],
    styles: { font: "helvetica", fontSize: 10, cellPadding: 3, valign: "top" },
    headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    columnStyles: { 0: { cellWidth: 80, fontStyle: "bold" }, 1: { cellWidth: 110 } },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  doc.text("ลงชื่อ………………………………………เจ้าของหรือผู้ครอบครองแหล่งกำเนิดมลพิษ", 20, finalY);
  doc.text("(                                                       )", 20, finalY + 6);
  doc.text("ลงชื่อ………………………………………ผู้ควบคุมระบบบำบัดน้ำเสีย", 20, finalY + 14);
  doc.text("(                                                       )", 20, finalY + 20);

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
