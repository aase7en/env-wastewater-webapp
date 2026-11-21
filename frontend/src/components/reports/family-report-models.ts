/**
 * ENV-PARITY-P4-005 — the THREE family print-report layout models
 * (ถังดับเพลิง / ไฟฉุกเฉิน / น้ำประปา — the AppSheet P4 FINAL lane).
 *
 * THE ONE LIB PATH (D1 pin, WO §3/§7): the three families are
 * print-view-only (D1-2 — no new jspdf generators; the browser
 * print-to-PDF path is the sole output). `lib/pdf.ts` stays
 * byte-untouched; this sibling module inside `components/reports/**`
 * is the single model source both the views and the tests read.
 *
 * Layout authorities (D1 enumeration, re-verified live 2026-11-20):
 *   - ถัดดับเพลิง: gdoc `รายงานตรวจสอบถังดับเพลิง`
 *     (1lKL8xgo_JnFcznMxncJ_kBKHgHpYYLgfOkhKy3WLPqg, txt-export sha256
 *     c9f5f439e2b8594b28c56509ee7fec710f5352ff4fee2fc714e32bde5b8fc3a6,
 *     5,143 B) — 9-column table + the COMPUTED ☑/☐ summary pair.
 *   - ไฟฉุกเฉิน: gdoc `รายงานตรวจสอบไฟฉุกเฉิน`
 *     (1MDUy6PHBXPISfnKGXyGnRZPJpT1ef4RHbeODQ9f_Pi4, txt sha256
 *     fad4cef1282fb898dc28763d3f6ce5b3867e71aadfc58e91f4f046c89f1d28df,
 *     4,300 B) — 6-column table + the computed pair.
 *   - น้ำประปา: NO template file exists (honest D1 finding, absence
 *     re-verified live) — the layout authority is the GENERATED SAMPLE
 *     `รายงานน้ำประปา-1.pdf` (1AhI3lkDEYiDHoVPkVjD95RpmG-qrW5FP, sha256
 *     8d0e81c5d97e2f8a9f13381c19e6509489adc6cf26c42f15c81b52bda0c050bd,
 *     116,723 B, 15 pages) + the ref-12 §3.10/§3.8 censuses. The
 *     sample-derived layout is recorded as the divergence (WATER_LAYOUT_NOTE);
 *     if a template file is ever located, the DRIVE FILE wins.
 *
 * Honesty pins (WO §2, binding): unknown ≠ 0 (missing cells stay null —
 * the views render "—"); the extinguisher master register is UNSEEDED
 * (SOURCE_UNAVAILABLE — the honest master note, never a fabricated
 * denominator); the P1.5 water chain/estimate provenance (meter-chain
 * deltas, the ×3.7-class spec estimates per A2, the ÷10 chlorine rule
 * per A3) is carried into the printed model; พ.ศ. years + Thai months
 * (the templates' hardcoded พ.ศ. 2569 renders as the COMPUTED year of
 * the selected month — recorded divergence); NO address header (none of
 * the three templates carries one — `core.address` NOT consumed); the
 * ☑/☐ summary pairs are COMPUTED from recorded rows, never asserted
 * static; personnel identity ONLY via the `core.personnel` display path
 * (full_name by stored ref, the — ไม่ระบุ — fallback) — the templates'
 * hardcoded names never render; signature blocks are blank rule lines.
 * Binaries never enter repo/DB/chat — provenance metadata only.
 */
import {
  beYear,
  buildWaterSupplySummary,
  enumerateCalendarDays,
  thaiMonthFull,
  type WaterSupplySummary,
} from "../../lib/report-summary";
import { thaiDate } from "../../lib/utils";
import { buildExtinguisherSummary } from "../../lib/safety-summary";

// ─── Shared helpers ───────────────────────────────────────────────────────

/** Calendar bounds of a YYYY-MM (inclusive first→last day). */
function monthBounds(month: string): { startISO: string; endISO: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { startISO: `${y}-${pad(m)}-01`, endISO: `${y}-${pad(m)}-${pad(last)}` };
}

/** The personnel display path fallback (WO §2 — the picker's own label). */
export const PERSONNEL_UNSET_LABEL = "— ไม่ระบุ —";

/** core.personnel display-path row subset (id / full_name / position).
 *  `position` optional so the delivered PersonnelOut (position?: null)
 *  passes structurally. */
export interface FamilyPersonnelEntry {
  id: string;
  full_name: string | null;
  position?: string | null;
}

/** id → full_name map (the ONLY personnel identity path for the printed
 *  output; a missing/blank full_name falls back to PERSONNEL_UNSET_LABEL
 *  at lookup — never a hardcoded name). */
export type FamilyPersonnelMap = Map<string, string>;

export function buildPersonnelNameMap(rows: FamilyPersonnelEntry[]): FamilyPersonnelMap {
  const m: FamilyPersonnelMap = new Map();
  for (const r of rows) {
    const name = (r.full_name ?? "").trim();
    if (r.id && name) m.set(r.id, name);
  }
  return m;
}

function personnelName(map: FamilyPersonnelMap, id: string | null | undefined): string {
  if (!id) return PERSONNEL_UNSET_LABEL;
  return map.get(id) ?? PERSONNEL_UNSET_LABEL;
}

/** Render a number without trailing-zero noise (75 → "75", 40.5 → "40.5");
 *  null/undefined/NaN → "—" (unknown stays unknown, never 0). */
function trimNum(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
}

// ─── ถัดดับเพลิง (the extinguisher gdoc authority) ────────────────────────

/** The 9 template columns — verbatim gdoc order. */
export const EXT_COLUMNS: string[] = [
  "ลำดับ",
  "สถานที่ติดตั้ง",
  "สายฉีด",
  "คันบีบ",
  "ตัวถัง",
  "มาตรวัดแรงดัน",
  "สิ่งกีดขวาง",
  "รายละเอียดการชำรุด",
  "ผู้ตรวจสอบ",
];

/** THE HONEST MASTER NOTE — the extinguisher master register is UNSEEDED
 *  (P2.1 SOURCE_UNAVAILABLE; the master sheet was absent). Rendered
 *  whenever the master denominator is unavailable; the report shows the
 *  AVAILABLE inspection history only. */
export const EXTINGUISHER_MASTER_NOTE = "ยังไม่มีข้อมูลทะเบียนถังดับเพลิง (master)";

/** safety.extinguisher_inspection subset the print model reads. */
export interface ExtinguisherInspectionInput {
  id: string;
  inspection_date: string;
  extinguisher_id: string;
  location_snapshot: string | null;
  pipe: string | null;
  handle: string | null;
  tank: string | null;
  pressure_gauge: string | null;
  barrier: string | null;
  breakdown_details: string | null;
  inspector_id: string | null;
}

export interface ExtinguisherPrintRow {
  seq: number;
  /** From location_snapshot (the master's location column is UNAVAILABLE —
   *  unknown renders honest absence, never a fabricated location). */
  location: string | null;
  pipe: string | null;
  handle: string | null;
  tank: string | null;
  pressureGauge: string | null;
  barrier: string | null;
  breakdownDetails: string | null;
  inspector: string;
}

export interface ExtinguisherPrintModel {
  title: string;
  monthThai: string;
  yearThai: number;
  columns: string[];
  rows: ExtinguisherPrintRow[];
  /** จำนวนถังทั้งที่ตรวจ — DISTINCT extinguishers inspected in month
   *  (the delivered P2.5 Filter_Firer ruling). */
  totalInspected: number;
  /** จำนวนถังผิดปกติ — the ∨5 verbatim predicate count. */
  abnormalCount: number;
  /** Rows outside BOTH verbatim predicates (disclosed, never ปกติ). */
  incompleteCount: number;
  masterAvailable: boolean;
  /** The COMPUTED ☑/☐ lines (null when the month has no inspections —
   *  never ☑-ready without data). */
  summaryReady: string | null;
  summaryAction: string | null;
  notes: string[];
}

export function buildExtinguisherPrintModel(input: {
  month: string;
  inspections: ExtinguisherInspectionInput[];
  masterIds: string[];
  personnel: FamilyPersonnelMap;
}): ExtinguisherPrintModel {
  const { month, inspections, masterIds, personnel } = input;
  const { startISO, endISO } = monthBounds(month);
  const monthThai = thaiMonthFull(Number(month.slice(5, 7)));
  const yearThai = beYear(startISO);

  // In-range rows for the TABLE (sorted by inspection date); the summary
  // counts come from the delivered P2.5 Filter_Firer builder — the SAME
  // verbatim predicates, never re-derived here.
  const inRange = inspections
    .filter((r) => (r.inspection_date ?? "").slice(0, 10) >= startISO && (r.inspection_date ?? "").slice(0, 10) <= endISO)
    .slice()
    .sort((a, b) => a.inspection_date.localeCompare(b.inspection_date) || a.id.localeCompare(b.id));
  const summary = buildExtinguisherSummary({ startISO, endISO, rows: inspections, masterIds });

  const rows: ExtinguisherPrintRow[] = inRange.map((r, i) => ({
    seq: i + 1,
    location: r.location_snapshot,
    pipe: r.pipe,
    handle: r.handle,
    tank: r.tank,
    pressureGauge: r.pressure_gauge,
    barrier: r.barrier,
    breakdownDetails: r.breakdown_details,
    inspector: personnelName(personnel, r.inspector_id),
  }));

  const has = summary.inspectedCount > 0;
  let summaryReady: string | null = null;
  let summaryAction: string | null = null;
  if (has && summary.abnormalHeadlineCount === 0 && summary.incompleteCount === 0) {
    summaryReady = "☑ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน";
    summaryAction = "☐ มีถังดับเพลิงที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 0 ถัง (ตามรายละเอียดในตาราง)";
  } else if (has && summary.abnormalHeadlineCount === 0) {
    summaryReady = `⚠ ยังสรุปความพร้อมใช้งานไม่ได้ — มี ${summary.incompleteCount} รายการที่ค่าไม่ครบตามสูตร`;
    summaryAction = "☐ มีถังดับเพลิงที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 0 ถัง (ตามรายละเอียดในตาราง)";
  } else if (has) {
    summaryReady = "☐ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน";
    summaryAction = `☑ มีถังดับเพลิงที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน ${summary.abnormalHeadlineCount} ถัง (ตามรายละเอียดในตาราง)`;
  }

  const notes: string[] = [];
  if (!summary.masterAvailable) notes.push(EXTINGUISHER_MASTER_NOTE);
  if (inRange.length === 0) notes.push("ไม่มีรายการตรวจสอบในเดือนนี้ (ค่าว่าง — ไม่ถูกนับเป็น 0)");
  if (summary.incompleteCount > 0)
    notes.push(
      `มี ${summary.incompleteCount} รายการที่ค่าไม่ครบตามสูตร — นับแยกต่างหาก ไม่ถูกนับเป็นปกติ (unknown ≠ ปกติ)`,
    );
  notes.push(
    "หมายเหตุตามสูตรเดิม: สิ่งกีดขวาง (barrier) ไม่ถูกนับในสรุปผล — บันทึกไว้ในตารางเท่านั้น",
  );

  return {
    title: `แบบฟอร์มรายงานผลการตรวจสอบถังดับเพลิงโรงพยาบาลอุทัย ประจำเดือน ${monthThai} พ.ศ. ${yearThai}`,
    monthThai,
    yearThai,
    columns: EXT_COLUMNS,
    rows,
    totalInspected: summary.inspectedCount,
    abnormalCount: summary.abnormalHeadlineCount,
    incompleteCount: summary.incompleteCount,
    masterAvailable: summary.masterAvailable,
    summaryReady,
    summaryAction,
    notes,
  };
}

// ─── ไฟฉุกเฉิน (the light gdoc authority) ─────────────────────────────────

/** The 6 template columns — verbatim gdoc order. */
export const LIGHT_COLUMNS: string[] = [
  "ลำดับ",
  "สถานที่ติดตั้ง",
  "ผลการทดสอบ",
  "จุดติดตั้ง",
  "สถานะร้องขอ",
  "ผู้ตรวจสอบ",
];

/** safety.emergency_light_check subset the print model reads (the
 *  delivered 332-row history renders AS-IS — the 1 NULL light_id row is
 *  never normalized away). */
export interface LightCheckInput {
  id: string;
  check_date: string;
  light_id: string | null;
  location_snapshot: string | null;
  test_result: string;
  position: string;
  status: string | null;
  auditor_id: string | null;
}

export interface LightPrintRow {
  /** The source emergency_light_check row id (stable cell keys in the view). */
  id: string;
  seq: number;
  location: string | null;
  testResult: string | null;
  position: string | null;
  status: string | null;
  auditor: string;
}

export interface LightPrintModel {
  title: string;
  monthThai: string;
  yearThai: number;
  columns: string[];
  rows: LightPrintRow[];
  /** จำนวนที่ตรวจสอบ — the month's recorded checks. */
  totalChecked: number;
  /** จำนวนการทดสอบไม่ผ่าน — verbatim "ไม่ผ่าน" count. */
  failCount: number;
  /** Off-vocabulary test_result values (disclosed, never coerced). */
  otherCount: number;
  summaryReady: string | null;
  summaryAction: string | null;
  notes: string[];
}

export function buildLightPrintModel(input: {
  month: string;
  checks: LightCheckInput[];
  personnel: FamilyPersonnelMap;
}): LightPrintModel {
  const { month, checks, personnel } = input;
  const { startISO, endISO } = monthBounds(month);
  const monthThai = thaiMonthFull(Number(month.slice(5, 7)));
  const yearThai = beYear(startISO);

  const inRange = checks
    .filter((r) => (r.check_date ?? "").slice(0, 10) >= startISO && (r.check_date ?? "").slice(0, 10) <= endISO)
    .slice()
    .sort((a, b) => a.check_date.localeCompare(b.check_date) || a.id.localeCompare(b.id));

  const rows: LightPrintRow[] = inRange.map((r, i) => ({
    id: r.id,
    seq: i + 1,
    location: r.location_snapshot,
    testResult: r.test_result,
    position: r.position,
    status: r.status,
    auditor: personnelName(personnel, r.auditor_id),
  }));

  const failCount = inRange.filter((r) => r.test_result === "ไม่ผ่าน").length;
  const otherCount = inRange.filter((r) => r.test_result !== "ผ่าน" && r.test_result !== "ไม่ผ่าน").length;

  const has = inRange.length > 0;
  let summaryReady: string | null = null;
  let summaryAction: string | null = null;
  if (has && failCount === 0 && otherCount === 0) {
    summaryReady = "☑ โคมไฟฉุกเฉินทุกจุดอยู่ในสภาพพร้อมใช้งาน";
    summaryAction = "☐ มี โคมไฟฉุกเฉินที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 0 เครื่อง (ตามรายละเอียดในตาราง)";
  } else if (has && failCount === 0) {
    summaryReady = `⚠ ยังสรุปความพร้อมใช้งานไม่ได้ — มี ${otherCount} รายการผลการทดสอบนอกคำศัพท์ (ผ่าน/ไม่ผ่าน)`;
    summaryAction = "☐ มี โคมไฟฉุกเฉินที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 0 เครื่อง (ตามรายละเอียดในตาราง)";
  } else if (has) {
    summaryReady = "☐ โคมไฟฉุกเฉินทุกจุดอยู่ในสภาพพร้อมใช้งาน";
    summaryAction = `☑ มี โคมไฟฉุกเฉินที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน ${failCount} เครื่อง (ตามรายละเอียดในตาราง)`;
  }

  const notes: string[] = [];
  if (!has) notes.push("ไม่มีรายการตรวจสอบในเดือนนี้ (ค่าว่าง — ไม่ถูกนับเป็น 0)");
  if (otherCount > 0)
    notes.push(
      `มี ${otherCount} รายการผลการทดสอบนอกคำศัพท์ (ผ่าน/ไม่ผ่าน) — แสดงตามที่บันทึกจริง ไม่ถูกแทนค่า`,
    );
  const nullLight = inRange.filter((r) => !r.light_id).length;
  if (nullLight > 0)
    notes.push(
      `มี ${nullLight} รายการที่ยังไม่ผูกกับทะเบียนโคม (light_id ค่าว่าง) — แสดงตามประวัติที่บันทึกจริง ไม่ถูกตัดออกหรือเติมค่า`,
    );

  return {
    title: `แบบฟอร์มรายงานผลการตรวจโคมไฟฉุกเฉินโรงพยาบาลอุทัย ประจำเดือน ${monthThai} พ.ศ. ${yearThai}`,
    monthThai,
    yearThai,
    columns: LIGHT_COLUMNS,
    rows,
    totalChecked: inRange.length,
    failCount,
    otherCount,
    summaryReady,
    summaryAction,
    notes,
  };
}

// ─── น้ำประปา (the sample-PDF + census authority — honest divergence) ─────

/** The 5 sample columns — verbatim sample order. */
export const WATER_COLUMNS: string[] = [
  "วัน/เดือน/ปี",
  "Hour_meter",
  "ใช้น้ำ(ลบ.ม.)",
  "คลอรีนที่ใช้(ลิตร)",
  "ผู้บันทึก",
];

/** THE HONEST LAYOUT-AUTHORITY NOTE — the น้ำประปา template FILE is
 *  absent (10/10 Content-folder entries enumerated; absence re-verified
 *  live at D1); the layout authority is the GENERATED SAMPLE PDF. Never
 *  presented as a mirrored template file; a later-located template file
 *  would win (drive-file-wins). */
export const WATER_LAYOUT_NOTE =
  "หมายเหตุ: ไม่พบไฟล์เทมเพลต น้ำประปา ในโฟลเดอร์เทมเพลตของระบบเดิม — เลย์เอาต์นี้อ้างอิงจากตัวอย่างรายงานที่ระบบเดิมสร้างออกมาจริง (รายงานน้ำประปา-1.pdf) ร่วมกับสำมะโนตาราง/ฟิลด์ของระบบเดิม; หากพบไฟล์เทมเพลตจริงในภายหลัง ไฟล์บนไดรฟ์จะเป็นตัวชี้ขาดเสมอ";

/** water_supply.v_daily_check_chain subset the print model reads
 *  (recorded daily-log columns + the P1.5 provenance flags). */
export interface WaterChainInput {
  id: string;
  check_date: string;
  hour_meter: number | string | null;
  hour_work: number | string | null;
  water_in: number | string | null;
  water_in_estimate: number | string | null;
  chlorine_usage: number | string | null;
  chlorine_usage_realy: number | string | null;
  energy_use_estimate: number | string | null;
  hour_boundary_flag: boolean | null;
  spec_missing: boolean | null;
  spec_missing_kinds: string | null;
  recorded_by: string | null;
}

export interface WaterPrintRow {
  /** The source v_daily_check_chain row id (stable cell keys in the view). */
  id: string;
  dateISO: string;
  dateThai: string;
  /** The RECORDED meter reading (not the derived delta). */
  hourMeter: number | string | null;
  /** Σ candidate = the RECORDED Water_In; null renders — (never the
   *  estimate substituted silently). */
  waterIn: number | string | null;
  /** The RECORDED chlorine liters as logged that day. */
  chlorineLiters: number | string | null;
  recorder: string;
}

export interface WaterPrintModel {
  title: string;
  monthThai: string;
  yearThai: number;
  columns: string[];
  rows: WaterPrintRow[];
  /** การบริโภคน้ำประปาบาดาล ตลอดเดือน — Σ recorded Water_In. */
  sumWaterIn: number;
  /** ปริมาณสารเคมี… (คลอรีนน้ำ) — Σ chlorine_usage_realy (the ÷10 P1.5
   *  surface value, per A3). */
  sumChlorineReal: number;
  /** Σ water_in_estimate — flagged ประมาณจากชั่วโมงปั๊ม/ค่าประมาณจากสเปก. */
  sumWaterInEstimate: number;
  /** Σ energy_use_estimate — flagged ค่าประมาณจากสเปก (×3.7-class). */
  sumEnergyEstimate: number;
  totalDays: number;
  recordedDays: number;
  missingDays: number;
  /** Hour-meter boundary days (hour deltas ค่าว่าง — excluded). */
  boundaryDays: number;
  specMissingDays: number;
  layoutAuthorityNote: string;
  summaryLines: string[];
  notes: string[];
  /** Exposed for view provenance labels — the DELIVERED summary object. */
  summary: WaterSupplySummary;
}

export function buildWaterPrintModel(input: {
  month: string;
  chainRows: WaterChainInput[];
  personnel: FamilyPersonnelMap;
}): WaterPrintModel {
  const { month, chainRows, personnel } = input;
  const { startISO, endISO } = monthBounds(month);
  const monthThai = thaiMonthFull(Number(month.slice(5, 7)));
  const yearThai = beYear(startISO);
  const calendar = enumerateCalendarDays(startISO, endISO);

  // The delivered P1.5 summary surface (same semantics as the /reports
  // numeric layer) — the printed totals are NEVER re-derived.
  const ws = buildWaterSupplySummary({ startISO, endISO, chain: chainRows });

  const inRange = chainRows
    .filter((r) => (r.check_date ?? "").slice(0, 10) >= startISO && (r.check_date ?? "").slice(0, 10) <= endISO)
    .slice()
    .sort((a, b) => a.check_date.localeCompare(b.check_date) || a.id.localeCompare(b.id));

  const rows: WaterPrintRow[] = inRange.map((r) => ({
    id: r.id,
    dateISO: r.check_date,
    dateThai: thaiDate(r.check_date),
    hourMeter: r.hour_meter,
    waterIn: r.water_in,
    chlorineLiters: r.chlorine_usage,
    recorder: personnelName(personnel, r.recorded_by),
  }));

  const waterSumLabel = ws.waterInDays === 0 ? "ไม่มีข้อมูล" : `${trimNum(ws.sumWaterIn)} ลบ.ม.`;
  const chlorineSumLabel = ws.chlorineRealDays === 0 ? "ไม่มีข้อมูล" : `${trimNum(ws.sumChlorineReal)} ลิตร`;
  const waterEstimateLabel = ws.waterInEstimateDays === 0 ? "ไม่มีข้อมูล" : `${trimNum(ws.sumWaterInEstimate)} ลบ.ม.`;
  const energyEstimateLabel = ws.energyEstimateDays === 0 ? "ไม่มีข้อมูล" : `${trimNum(ws.sumEnergyEstimate)} kWh`;

  const summaryLines = [
    `การบริโภคน้ำประปาบาดาล ตลอดเดือน ${monthThai} ${waterSumLabel}`,
    `ปริมาณสารเคมีหรือสารสกัดชีวภาพที่ใช้ (คลอรีนน้ำ) ${chlorineSumLabel}`,
  ];

  const notes: string[] = [
    `มีบันทึก ${ws.recordedDays} วัน · ไม่มีบันทึก ${ws.missingDays} วัน (ทั้งหมด ${ws.totalDays || calendar.length} วัน) — วันที่ไม่มีบันทึกไม่ถูกนับเป็น 0`,
    `คลอรีนน้ำ: คลอรีนจริง (ลิตร) = ค่าที่บันทึก ÷10 (อัตราผสม 1:9) ตามมุมมอง P1.5 (v_daily_check_chain) — ตารางรายวันแสดงค่าที่บันทึกตามจริง`,
    `ปริมาณน้ำเข้า (ประมาณจากชั่วโมงปั๊ม ×สเปกอัตราการไหล): ${waterEstimateLabel} — ค่าประมาณจากสเปก แสดงแยกต่างหาก ไม่รวมในยอดบันทึกจริง`,
    `พลังงานไฟฟ้า (ค่าประมาณจากสเปก ×ชั่วโมงการทำงาน): ${energyEstimateLabel} — ค่าประมาณจากสเปก ไม่ใช่ค่ามิเตอร์`,
    `วันที่มิเตอร์ชั่วโมงเปลี่ยน ${ws.boundaryDays} วัน — ค่า delta ชั่วโมงของวันนั้นค่าว่าง (ไม่ถูกนับเป็น 0)`,
    `วันที่สเปกไม่ครบ ${ws.specMissingDays} วัน (ค่าประมาณของวันนั้นถูกยกเว้น ไม่ถูกแทนด้วยศูนย์)`,
  ];

  return {
    title: `แบบรายงานการใช้น้ำประปาบาดาลโรงพยาบาลอุทัย ประจำเดือน ${monthThai} พ.ศ. ${yearThai}`,
    monthThai,
    yearThai,
    columns: WATER_COLUMNS,
    rows,
    sumWaterIn: ws.sumWaterIn,
    sumChlorineReal: ws.sumChlorineReal,
    sumWaterInEstimate: ws.sumWaterInEstimate,
    sumEnergyEstimate: ws.sumEnergyEstimate,
    totalDays: ws.totalDays,
    recordedDays: ws.recordedDays,
    missingDays: ws.missingDays,
    boundaryDays: ws.boundaryDays,
    specMissingDays: ws.specMissingDays,
    layoutAuthorityNote: WATER_LAYOUT_NOTE,
    summaryLines,
    notes,
    summary: ws,
  };
}
