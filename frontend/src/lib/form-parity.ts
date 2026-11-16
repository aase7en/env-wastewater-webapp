/**
 * ENV-PARITY-P1-004 — pure form-parity lib (no React, no I/O).
 *
 * Translates the AppSheet daily-form contract (reference doc 12 §3.3,
 * ตาราง ข้อมูลคุณภาพน้ำ — lines pinned per WO §2.1) onto the ENV
 * storage model:
 *   - enum value lists + AppSheet initial values (UI defaults on CREATE
 *     only — never DB defaults, per P1.1 "unknown ≠ any value")
 *   - boolean ↔ enum mapping: the booleans REMAIN the source of truth;
 *     the enums are the UI vocabulary, and the P1.1 `*_status` text
 *     columns are mirrors written alongside on save (sync by
 *     construction — buildStatusMirror derives from the booleans)
 *   - Valid If / Min-Max / Invalid-value-error rules with the verbatim
 *     Thai error texts
 *   - the >2.5 free-chlorine FORMAT rule (reference §10 Format Rules,
 *     line 6429) as a fresh frontend display predicate — the plan-named
 *     `flag_free_chlorine` never existed as a repo migration/view; the
 *     live-only legacy `v_reading_detail` flag is threshold-driven
 *     (0.5/1, the Critical rules) and cannot express this rule
 *   - honest warnings replacing AppSheet fallbacks (unknown ≠ 0): the
 *     fallback-60 water formula (ref 616–622) becomes EMPTY + chip, and
 *     the text-prompt-into-value behavior (ref 629–637) is never
 *     mirrored — missing pump meters surface as the "ยังไม่มีมิเตอร์สูบ"
 *     chip instead
 */

// ─── Enum vocabularies (verbatim §3.3) ──────────────────────────────────

/** อัตราส่วนผสม(คลอรีน/น้ำ) — ref 750–761; P1.1 CHECK enforces on DB. */
export const MIX_RATIO_OPTIONS = ["1:2", "1:4", "1:9"] as const;
export type MixRatio = (typeof MIX_RATIO_OPTIONS)[number];
/** AppSheet initial value =1:4 — UI default on create only (ref 756). */
export const MIX_RATIO_DEFAULT: MixRatio = "1:4";

/** ล้างตะแกรงบ่อสูบ / ล้างตะแกรงละเอียด — ref 476–499. */
export const SCREEN_CLEAN_OPTIONS = ["ไม่ล้าง", "ล้าง"] as const;
export type ScreenClean = (typeof SCREEN_CLEAN_OPTIONS)[number];

/** The 10 machine/equipment columns — ref 500–595. */
export const MACHINE_STATUS_OPTIONS = ["ปกติ", "เสีย"] as const;
export type MachineStatus = (typeof MACHINE_STATUS_OPTIONS)[number];

/** การระบายน้ำทิ้งออกจากระบบ — ref 646–657. */
export const DISCHARGE_OPTIONS = ["ระบาย", "ไม่ระบาย"] as const;
export type DischargeState = (typeof DISCHARGE_OPTIONS)[number];

/** การทำงานของระบบบำบัดน้ำเสีย — ref 658–669. */
export const SYSTEM_OPERATING_OPTIONS = ["ปกติ", "ผิดปกติ"] as const;
export type SystemOperatingState = (typeof SYSTEM_OPERATING_OPTIONS)[number];

/** ตะกอนส่วนเกินที่นำไปกำจัด — ref 670–675 (quick-pick values). */
export const EXCESS_SLUDGE_OPTIONS = ["1.35", "2.7", "5.4", "8.1"] as const;

/** ลักษณะสี — value SET verbatim from ref 676–687 (น้ำตาลอ่อน / น้ำตาลเข้ม /
 *  ดำ). Chip DISPLAY order keeps the house frequency ordering (น้ำตาลเข้ม
 *  first — 824 of 907 rows; also the AppSheet initial value) so the
 *  pre-existing quick-pick keyboard flow is preserved; nothing added,
 *  nothing dropped. */
export const COLOR_OPTIONS = ["น้ำตาลเข้ม", "น้ำตาลอ่อน", "ดำ"] as const;
/** ลักษณะกลิ่น — value SET verbatim from ref 688–699; กลิ่นดินปกติ first
 *  (907 of 907 rows + the AppSheet initial value). */
export const SMELL_OPTIONS = ["กลิ่นดินปกติ", "กลิ่นเหม็นแก๊สไข้เน่า", "อื่นๆ"] as const;
/** AppSheet initial values (UI defaults on create only). */
export const COLOR_DEFAULT = "น้ำตาลเข้ม";
export const SMELL_DEFAULT = "กลิ่นดินปกติ";

// ─── Verbatim validation error texts ────────────────────────────────────

/** Free Chlorine Invalid value error (ref 461); bounds Min 0 / Max 100. */
export const ERR_FREE_CHLORINE = "แน่ใจหรือที่จะลงข้อมูลนี้";
/** ปริมาณการใช้ไฟฟ้าของระบบ Invalid value error (ref 613); Valid If >0. */
export const ERR_ELECTRICITY = "ตรวจสอบข้อมูลดีๆนะจ๊ะ";
/** ปริมาณน้ำเสียที่เข้าระบบบำบัด Invalid value error (ref 643). */
export const ERR_WASTEWATER_IN = "ข้อมูลผิดพลาด";

// ─── Honest-warning chip texts ──────────────────────────────────────────

/** Missing น้ำประปา Water_In record for the day (replaces fallback 60). */
export const CHIP_NO_WATER_RECORD = "ยังไม่มีบันทึกน้ำประปาของวัน";
/** Missing previous pump meters on the meter chain (replaces the AppSheet
 *  text prompt "อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ" — never written into a
 *  value). */
export const CHIP_NO_PUMP_METERS = "ยังไม่มีมิเตอร์สูบ";

// ─── ผู้บันทึก eligibility (Valid If, ref 716–720) ──────────────────────

/** Verbatim AppSheet display names (§3.3) keyed by the core.equipment code
 *  the checklist uses — the form labels MUST match these exactly. */
export const APPSHEET_EQUIPMENT_LABELS: Record<string, string> = {
  screen_coarse: "ล้างตะแกรงบ่อสูบ",
  screen_fine: "ล้างตะแกรงละเอียด",
  pump1: "เครื่องสูบน้ำเสีย 1",
  pump2: "เครื่องสูบน้ำเสีย 2",
  aerator1: "เครื่องเติมอากาศ 1",
  aerator2: "เครื่องเติมอากาศ 2",
  sludge_pump1: "เครื่องสูบตะกอน 1",
  sludge_pump2: "เครื่องสูบตะกอน 2",
  chlorine_pump1: "เครื่องจ่ายคลอรีน 1",
  chlorine_pump2: "เครื่องจ่ายคลอรีน 2",
};

/** Which enum family a checklist code belongs to (screen vs machine). */
export const SCREEN_CODES = ["screen_coarse", "screen_fine"] as const;
/** The only eligible positions — never นายแพทย์, never others. */
export const RECORDER_POSITIONS = ["นักวิชาการสาธารณสุข", "พนักงานบริการ"] as const;
/** The only eligible สถานะ. */
export const RECORDER_STATUS_ACTIVE = "ทำงาน";

export interface RecorderCandidate {
  position?: string | null;
  status?: string | null;
}

/** AppSheet Valid If replicated: position ∈ {นักวิชาการสาธารณสุข,
 *  พนักงานบริการ} ∧ สถานะ = ทำงาน. */
export function isEligibleRecorder(p: RecorderCandidate): boolean {
  if (p.status !== RECORDER_STATUS_ACTIVE) return false;
  return (RECORDER_POSITIONS as readonly string[]).includes(p.position ?? "");
}

// ─── AppSheet initial values (create-only UI defaults) ──────────────────

/**
 * Initial values per §2.1 (verbatim): อัตราส่วนผสม =1:4; ล้างตะแกรงบ่อสูบ
 * =ไม่ล้าง; ล้างตะแกรงละเอียด =ล้าง; the 10 machine columns =ปกติ;
 * การระบายน้ำทิ้ง =ระบาย; ระบบบำบัด =ปกติ; ลักษณะสี =น้ำตาลเข้ม;
 * ลักษณะกลิ่น =กลิ่นดินปกติ. Measured values (free chlorine, water used,
 * wastewater in, …) stay EMPTY — AppSheet never initialized them and
 * unknown ≠ zero. Applied on CREATE only; edit mode hydrates from the
 * record.
 */
export function createDefaults(): Record<string, unknown> {
  return {
    chlorine_mix_ratio: MIX_RATIO_DEFAULT,
    color_desc: COLOR_DEFAULT,
    smell_desc: SMELL_DEFAULT,
    screen_cleaned_coarse: false, // ไม่ล้าง
    screen_cleaned_fine: true, // ล้าง
    pump1_running: true, // ปกติ
    pump2_running: true,
    aerator1_running: true,
    aerator2_running: true,
    sludge_pump1_running: true,
    sludge_pump2_running: true,
    chlorine_pump1_running: true,
    chlorine_pump2_running: true,
    wastewater_discharged: true, // ระบาย
    system_operating: true, // ปกติ
    // Measured values EXPLICITLY stay empty — AppSheet initialized none of
    // them, and the fallback-60 formula (ref 616–622) is replaced by the
    // honest-warning chip (unknown ≠ zero; never 60, never 0).
    water_used_total: "",
    wastewater_in: "",
    free_chlorine: "",
    electricity_consumption: "",
  };
}

// ─── Boolean ↔ enum mapping (booleans stay source of truth) ────────────

/** true↔ล้าง / false↔ไม่ล้าง / null↔"" (unknown stays unknown). */
export function screenCleanedToEnum(v: boolean | null | undefined): ScreenClean | "" {
  if (v === null || v === undefined) return "";
  return v ? "ล้าง" : "ไม่ล้าง";
}
export function screenCleanedFromEnum(v: string): boolean | null {
  if (v === "ล้าง") return true;
  if (v === "ไม่ล้าง") return false;
  return null;
}

/** true↔ปกติ / false↔เสีย / null↔"". */
export function runningToEnum(v: boolean | null | undefined): MachineStatus | "" {
  if (v === null || v === undefined) return "";
  return v ? "ปกติ" : "เสีย";
}
export function runningFromEnum(v: string): boolean | null {
  if (v === "ปกติ") return true;
  if (v === "เสีย") return false;
  return null;
}

/** true↔ระบาย / false↔ไม่ระบาย. */
export function dischargeToEnum(v: boolean | null | undefined): DischargeState | "" {
  if (v === null || v === undefined) return "";
  return v ? "ระบาย" : "ไม่ระบาย";
}
export function dischargeFromEnum(v: string): boolean | null {
  if (v === "ระบาย") return true;
  if (v === "ไม่ระบาย") return false;
  return null;
}

/** true↔ปกติ / false↔ผิดปกติ. */
export function systemOperatingToEnum(v: boolean | null | undefined): SystemOperatingState | "" {
  if (v === null || v === undefined) return "";
  return v ? "ปกติ" : "ผิดปกติ";
}
export function systemOperatingFromEnum(v: string): boolean | null {
  if (v === "ปกติ") return true;
  if (v === "ผิดปกติ") return false;
  return null;
}

// ─── *_status mirror columns (P1.1 parity surface) ──────────────────────

/** The 10 P1.1 status-mirror keys on wastewater.reading (plain text,
 *  nullable — P1.1 mapping: true↔'ล้าง'/'ปกติ', false↔'ไม่ล้าง'/'เสีย'). */
export const STATUS_KEYS = [
  "screen_cleaned_coarse_status",
  "screen_cleaned_fine_status",
  "pump1_running_status",
  "pump2_running_status",
  "aerator1_running_status",
  "aerator2_running_status",
  "sludge_pump1_running_status",
  "sludge_pump2_running_status",
  "chlorine_pump1_running_status",
  "chlorine_pump2_running_status",
] as const;

export type StatusKey = (typeof STATUS_KEYS)[number];

interface BooleanSource {
  screen_cleaned_coarse?: boolean | null;
  screen_cleaned_fine?: boolean | null;
  pump1_running?: boolean | null;
  pump2_running?: boolean | null;
  aerator1_running?: boolean | null;
  aerator2_running?: boolean | null;
  sludge_pump1_running?: boolean | null;
  sludge_pump2_running?: boolean | null;
  chlorine_pump1_running?: boolean | null;
  chlorine_pump2_running?: boolean | null;
}

/**
 * Derive the `*_status` mirrors from the booleans (the source of truth)
 * so they are in sync BY CONSTRUCTION on every save. Unknown booleans
 * mirror to NULL — never a guessed status.
 */
export function buildStatusMirror(src: BooleanSource): Record<StatusKey, string | null> {
  return {
    screen_cleaned_coarse_status: screenCleanedToEnum(src.screen_cleaned_coarse) || null,
    screen_cleaned_fine_status: screenCleanedToEnum(src.screen_cleaned_fine) || null,
    pump1_running_status: runningToEnum(src.pump1_running) || null,
    pump2_running_status: runningToEnum(src.pump2_running) || null,
    aerator1_running_status: runningToEnum(src.aerator1_running) || null,
    aerator2_running_status: runningToEnum(src.aerator2_running) || null,
    sludge_pump1_running_status: runningToEnum(src.sludge_pump1_running) || null,
    sludge_pump2_running_status: runningToEnum(src.sludge_pump2_running) || null,
    chlorine_pump1_running_status: runningToEnum(src.chlorine_pump1_running) || null,
    chlorine_pump2_running_status: runningToEnum(src.chlorine_pump2_running) || null,
  };
}

/** Pick only the status keys present (non-null) from a mirror — used to
 *  build targeted update payloads without clobbering unknowns. */
export function pickStatusMirror(
  mirror: Record<StatusKey, string | null>
): Partial<Record<StatusKey, string>> {
  const out: Partial<Record<StatusKey, string>> = {};
  for (const k of STATUS_KEYS) {
    const v = mirror[k];
    if (v !== null) out[k] = v;
  }
  return out;
}

// ─── Validation rules (verbatim §2.1 items 1–3) ─────────────────────────

/** Parse a form-side numeric string; "" (empty) and unparseable → null. */
function parseNumber(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Free Chlorine — Min 0 / Max 100 (ref 456–474). Empty → OK (nullable).
 * Out-of-range OR non-numeric → the verbatim Invalid value error.
 */
export function validateFreeChlorine(v: string | number | null | undefined): string | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = parseNumber(s);
  if (n === null || n < 0 || n > 100) return ERR_FREE_CHLORINE;
  return null;
}

/** ปริมาณการใช้ไฟฟ้าของระบบ — Valid If >0 (ref 607) + error (ref 613). */
export function validateElectricity(v: string | number | null | undefined): string | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = parseNumber(s);
  if (n === null || n <= 0) return ERR_ELECTRICITY;
  return null;
}

/**
 * ปริมาณน้ำเสียที่เข้าระบบบำบัด — the Invalid value error (ref 643).
 * ENV is numeric-only (P1.2): the AppSheet text-prompt-into-value behavior
 * is FORBIDDEN; a non-numeric or negative entry is the invalid value.
 */
export function validateWastewaterIn(v: string | number | null | undefined): string | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = parseNumber(s);
  if (n === null || n < 0) return ERR_WASTEWATER_IN;
  return null;
}

// ─── Format rule Cl>2.5 (reference §10 Format Rules, line 6429) ────────

/**
 * Strictly greater than 2.5 — 2.5 exactly is NOT flagged. Missing or
 * non-numeric values are never flagged (unknown ≠ any judgment).
 * Fresh frontend display predicate per WO §2.3: named so a future DB
 * flag can replace it cleanly (isFreeChlorineHigh ↔ a persisted
 * free-chlorine format flag, if one ever lands).
 */
export function isFreeChlorineHigh(v: string | number | null | undefined): boolean {
  const n = parseNumber(v);
  return n !== null && n > 2.5;
}

// ─── Honest warnings (§2.2) ─────────────────────────────────────────────

/**
 * Derive ปริมาณน้ำที่ใช้ในทุกกิจกรรม from the day's น้ำประปา Water_In
 * lookup. Missing record → NULL — NEVER the AppSheet fallback 60, never
 * 0, never any substitute number (unknown ≠ zero). A present record
 * yields the record's own value.
 */
export function deriveWaterUsed(waterIn: string | number | null | undefined): number | null {
  return parseNumber(waterIn);
}

/** Chip condition: the lookup has no usable Water_In value. */
export function needsNoWaterRecordChip(
  waterIn: string | number | null | undefined
): boolean {
  return deriveWaterUsed(waterIn) === null;
}

export interface MeterChainRow {
  meter_boundary_flag?: boolean | null;
  spec_missing?: boolean | null;
  prev_pump1_meter?: number | string | null;
  prev_pump2_meter?: number | string | null;
}

/**
 * Chip condition for "ยังไม่มีมิเตอร์สูบ": no chain row at all (no
 * previous reading exists yet), a boundary/reset flag, missing spec, or
 * either previous pump meter missing. The stored wastewater_in stays
 * whatever the user typed or empty — the warning NEVER enters a value.
 */
export function needsNoPumpMeterChip(row: MeterChainRow | null | undefined): boolean {
  if (!row) return true;
  if (row.meter_boundary_flag === true) return true;
  if (row.spec_missing === true) return true;
  const p1 = parseNumber(row.prev_pump1_meter);
  const p2 = parseNumber(row.prev_pump2_meter);
  return p1 === null || p2 === null;
}
