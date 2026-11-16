/**
 * ENV-PARITY-P2-002 — pure form-parity lib for the extinguisher per-unit
 * inspection flow (no React, no I/O).
 *
 * Transcribes the AppSheet ตรวจสอบถัง contract (reference doc 12 §3.13,
 * pins per WO §3.1/§7) onto the ENV storage model:
 *   - verbatim enum value lists + AppSheet initial values (UI defaults on
 *     CREATE only — never DB defaults, per the P1.1 "unknown ≠ any value"
 *     rule)
 *   - the QR_CODE Valid If + verbatim Thai error (ref 3158-3166) — the
 *     placeholder 'สแกน QR CODE' and blank payloads are unusable; the
 *     unknown-id case fail-closes in the RPC with the same error
 *   - the ผู้ตรวจสอบ Valid If staff filter (ref 3358-3382) VERBATIM:
 *     position ∈ {นักวิชาการสาธารณสุข, พนักงานบริการ} ∧ status ≠ ลาออก —
 *     deliberately NOT the P1.4 recorder's =ทำงาน form (the reference
 *     says ≠ลาออก; the legacy 'active' status passes the verbatim rule)
 *   - the Show If gates (ref 3343/3351/3389) as pure predicates
 *   - the breakdown_details auto-label IF(chem_exp<=Date_time,
 *     "หมดอายุ","ไม่หมดอายุ") (ref 3336-3338) — missing dates stay empty
 *     (unknown never becomes a label)
 *   - id generators: inspection id = 8-hex UNIQUEID() shape; the admin
 *     master-entry legacy_row_id = 22-char PackedUUID shape (the real
 *     format observed in the ตรวจสอบถัง QR_CODE column, e.g.
 *     'vtiHJw6wpw4c6f4553dms5') — TEXT, never numeric; QR derives from
 *     the id and is NEVER stored
 */

// ─── Enum vocabularies (verbatim §3.13) ─────────────────────────────────

/** AppSheet type enum on the INSPECTION table — 6 values verbatim (ref
 * 3198). Recorded divergence: the MASTER table's enum has 5 (see
 * MASTER_TYPE_OPTIONS). Blank master values propagate as NULL (2/858
 * blanks in the real sheet — blank ⇒ NULL, never ''). */
export const TYPE_SNAPSHOT_OPTIONS = [
  "เคมีแห้ง (Dry Chemical Extinguishers)",
  "สารเหลวระเหย BF2000",
  "น้ำยาโฟม (Foam Extinguishers)",
  "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
  "น้ำ (Water Extinguishers)",
  "น้ำ (Best Drop แบบ Low Pressure Water Mist)",
] as const;

/** The MASTER table's 5-value enum verbatim (P2.1 migration header) —
 * admin master-entry select only. */
export const MASTER_TYPE_OPTIONS = [
  "เคมีแห้ง (Dry Chemical Extinguishers)",
  "สารเหลวระเหย BF2000",
  "น้ำยาโฟม (Foam Extinguishers)",
  "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
  "น้ำ (Best Drop)",
] as const;

/** pipe / handle / tank — ref 3242-3294. */
export const ITEM_OPTIONS = ["ปกติ", "ชำรุด"] as const;
export const ITEM_DEFAULT = "ปกติ";

/** pressure_gauge — semantics differ from pipe/handle/tank verbatim (ref
 * 3296-3312). */
export const PRESSURE_OPTIONS = ["ปกติ", "ไม่ปกติ"] as const;

/** barrier — ref 3314-3330. */
export const BARRIER_OPTIONS = ["มี", "ไม่มี"] as const;
export const BARRIER_DEFAULT = "ไม่มี";

/** cause_of_damaged — ref 3354-3356. */
export const CAUSE_OPTIONS = ["เกิดจากการใช้งาน", "หมดอายุ"] as const;

// ─── Verbatim validation error text ─────────────────────────────────────

/** QR_CODE Invalid value error (ref 3158-3166) — the double space after
 * "!!" is verbatim. Used for placeholder/blank/unresolved payloads. */
export const ERR_QR_NOT_FOUND = "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ";

/** The AppSheet QR_CODE placeholder init (ref 3148) — never a usable value. */
export const QR_PLACEHOLDER = "สแกน QR CODE";

export function isQrPayloadUsable(v: string | null | undefined): boolean {
  const s = (v ?? "").trim();
  return s !== "" && s !== QR_PLACEHOLDER;
}

// ─── ผู้ตรวจสอบ eligibility (Valid If ref 3358-3382) ─────────────────────

/** The only eligible positions — never นายแพทย์ (the Valid If's
 * position≠นายแพทย์ clause is implied by this set, kept verbatim). */
export const INSPECTOR_POSITIONS = ["นักวิชาการสาธารณสุข", "พนักงานบริการ"] as const;
/** The only INELIGIBLE status per the verbatim rule (≠ลาออก). */
export const INELIGIBLE_STATUS = "ลาออก";

export interface InspectorCandidate {
  position?: string | null;
  status?: string | null;
}

/** AppSheet Valid If replicated VERBATIM: position ∈ {นักวิชาการสาธารณสุข,
 * พนักงานบริการ} ∧ status ≠ ลาออก. Note the deliberate difference from the
 * P1.4 isEligibleRecorder (=ทำงาน): the ตรวจสอบถัง rule is ≠ลาออก, so the
 * legacy 'active' status (and ย้ายกลุ่มงาน / ลาศึกษาต่อ) stays eligible. */
export function isEligibleInspector(p: InspectorCandidate): boolean {
  if (p.status === INELIGIBLE_STATUS) return false;
  return (INSPECTOR_POSITIONS as readonly string[]).includes(p.position ?? "");
}

// ─── Show If gates (verbatim) ───────────────────────────────────────────

export interface InspectionItems {
  pipe?: string | null;
  handle?: string | null;
  tank?: string | null;
  pressure_gauge?: string | null;
  barrier?: string | null;
}

/** OR(pipe≠ปกติ, handle≠ปกติ, tank≠ปกติ, pressure_gauge≠ปกติ, barrier≠ไม่มี)
 * — ref 3351/3389. Unknown values are never judged abnormal. */
export function anyItemAbnormal(items: InspectionItems): boolean {
  return (
    (items.pipe !== null && items.pipe !== undefined && items.pipe !== "" && items.pipe !== "ปกติ") ||
    (items.handle !== null && items.handle !== undefined && items.handle !== "" && items.handle !== "ปกติ") ||
    (items.tank !== null && items.tank !== undefined && items.tank !== "" && items.tank !== "ปกติ") ||
    (items.pressure_gauge !== null &&
      items.pressure_gauge !== undefined &&
      items.pressure_gauge !== "" &&
      items.pressure_gauge !== "ปกติ") ||
    (items.barrier !== null && items.barrier !== undefined && items.barrier !== "" && items.barrier !== "ไม่มี")
  );
}

/** cause_of_damaged + รูปชำรุด visibility — any item abnormal (ref
 * 3351/3389 verbatim). */
export function showCauseAndPhoto(items: InspectionItems): boolean {
  return anyItemAbnormal(items);
}

/** breakdown_details visibility — OR(any-abnormal, expired, resolved)
 * (ref 3343 verbatim: the [QR_CODE]<>placeholder gate's ENV equivalent is
 * "the extinguisher is resolved"). */
export function showBreakdownDetails(opts: {
  resolved: boolean;
  items: InspectionItems;
  expired: boolean;
}): boolean {
  return opts.resolved || opts.expired || anyItemAbnormal(opts.items);
}

// ─── Date parsing (robust) ──────────────────────────────────────────────

/** Parse a date/datetime string. datetime-local values ("YYYY-MM-DDTHH:mm")
 * parse as LOCAL; a bare "+HH" offset (V8 rejects it) is normalized to
 * "+HH:00" (datetime strings only — a bare date's "-13" day suffix must
 * never match). Returns null when unparseable — callers keep unknown
 * unknown. */
function parseDate(v: string): Date | null {
  const m = v.includes("T") ? /([+-]\d{2})$/.exec(v) : null;
  const s = m ? `${v.slice(0, m.index)}${m[1]}:00` : v;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ─── breakdown_details auto-label (init ref 3336-3338) ──────────────────

/**
 * IF(chem_exp <= Date_time, "หมดอายุ", "ไม่หมดอายุ") — comparison at the
 * DAY level (chem_exp is a date, Date_time a datetime at source; the
 * AppSheet date<=datetime comparison truncates to the day). Missing
 * either date → "" (unknown stays unknown — never a fabricated label).
 */
export function deriveBreakdownLabel(
  chemExp: string | null | undefined,
  inspectionDate: string | null | undefined,
): string {
  if (!chemExp || !inspectionDate) return "";
  const exp = parseDate(chemExp);
  const insp = parseDate(inspectionDate);
  if (!exp || !insp) return "";
  const expDay = Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const inspDay = Date.UTC(insp.getFullYear(), insp.getMonth(), insp.getDate());
  return expDay <= inspDay ? "หมดอายุ" : "ไม่หมดอายุ";
}

// ─── Master expiry status (honest — unknown stays unknown) ──────────────

/** expiry <= today → หมดอายุ; later → ไม่หมดอายุ; NULL expiry → null
 * (never guessed). `today` is injectable for tests. */
export function expiryStatusOf(
  expiryDate: string | null | undefined,
  today: string,
): "หมดอายุ" | "ไม่หมดอายุ" | null {
  if (!expiryDate) return null;
  const exp = parseDate(expiryDate);
  const now = parseDate(today);
  if (!exp || !now) return null;
  const expDay = Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return expDay <= nowDay ? "หมดอายุ" : "ไม่หมดอายุ";
}

// ─── Id generators (D1-9) ───────────────────────────────────────────────

const HEX = "0123456789abcdef";
/** AppSheet inspection row_ID = 8-hex UNIQUEID() (e.g. 'fc7e2741'). */
export function generateInspectionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => HEX[b % 16]).join("");
}

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
/** Master legacy_row_id — 22-char PackedUUID shape (the real format
 * observed in the source QR_CODE column; e.g. 'vtiHJw6wpw4c6f4553dms5').
 * TEXT, never numeric; legacy_id mirrors it; nothing QR-related is
 * stored. */
export function generateLegacyRowId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(22));
  return Array.from(bytes, (b) => ALNUM[b % ALNUM.length]).join("");
}
