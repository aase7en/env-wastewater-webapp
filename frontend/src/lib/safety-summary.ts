/**
 * ENV-PARITY-P2-005 — pure safety summary aggregation lib (AppSheet
 * parity lane P2.5: นับปกติ/ผิดปกติถัง + ผ่าน/ไม่ผ่านไฟ on /reports).
 *
 * Ground truth: docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md
 * §3.20 Filter_Firer (ref 3954–4293) + §3.35 Filter_Light (ref 5183–5510)
 * — pinned per WO ENV-PARITY-P2-005 §4.1/§4.2/§4.4.
 *
 * House rules (WO §4.1/§4.2/§4.4, binding):
 *   - CLIENT-SIDE aggregation of recorded rows only (D1-2, the P1.6 D1-1
 *     precedent) — no DB access in this module, no re-derivation.
 *   - จำนวนถังทั้งที่ตรวจ = COUNT(UNIQUE(...QR_CODE...)) — DISTINCT
 *     extinguishers in range (ENV: distinct extinguisher_id).
 *   - จำนวนถังที่มี = the MASTER denominator (distinct master ids). 0
 *     masters → masterAvailable=false and the SOURCE_UNAVAILABLE label
 *     (ยังไม่มีข้อมูลทะเบียนถัง) — never a computed pass rate over 0, never
 *     a fabricated denominator (WO §4.4-3).
 *   - ปกติ = pipe ปกติ ∧ handle ปกติ ∧ tank ปกติ ∧ pressure_gauge ปกติ —
 *     VERBATIM; `barrier` is in NO predicate (D1-4 recorded divergence: a
 *     barrier-ชำรุด-only row counts ปกติ and is never silently reconciled).
 *   - ผิดปกติ = OR(pipe ชำรุด, handle ชำรุด, tank ชำรุด, pressure_gauge
 *     ไม่ปกติ, breakdown_details หมดอายุ) — VERBATIM ∨5 incl. หมดอายุ;
 *     จำนวนถังผิดปกติ (the AppSheet headline) = the same OR count.
 *   - Blank/unknown components fall OUTSIDE both verbatim predicates →
 *     disclosed in the explicit honesty line (never coerced).
 *   - Filter_Light both-value displays (no choice pickers — the numbers
 *     ARE the report): ผ่าน/ไม่ผ่าน headline pair, คงอยู่ มี/ไม่มี,
 *     ตำแหน่ง เหมาะสม/ไม่เหมาะสม, ความต้องการ per the 3 verbatim Status
 *     values + the REQUIRED ไม่ระบุ bucket for blank/off-set Status (D1-5 —
 *     the AppSheet IN() formula silently ignores blanks; ENV discloses).
 *   - Off-vocabulary free-text values in any light column are disclosed
 *     per column (other buckets), never coerced into a class.
 *   - Counts only — inspector/auditor identities are INPUTS, never
 *     summary numbers (PII pin); 13-digit digit-runs must not appear.
 */
import { beYear, thaiMonthFull } from "./report-summary";

/** safety.extinguisher_inspection subset the summary aggregates. */
export interface SafetyExtinguisherRow {
  inspection_date: string;
  extinguisher_id: string;
  pipe: string | null;
  handle: string | null;
  tank: string | null;
  pressure_gauge: string | null;
  barrier: string | null;
  breakdown_details: string | null;
}

/** safety.emergency_light_check subset the summary aggregates. */
export interface SafetyLightRow {
  check_date: string;
  persistency: string;
  position: string;
  test_result: string;
  status: string | null;
}

export interface ExtinguisherSummary {
  /** Rows in range (each inspection record counts once per predicate). */
  totalRows: number;
  /** จำนวนถังทั้งที่ตรวจ — DISTINCT extinguishers inspected in range. */
  inspectedCount: number;
  /** จำนวนถังที่มี — the master denominator (distinct master ids). */
  masterCount: number;
  /** false ⇔ the master register is empty → SOURCE_UNAVAILABLE state. */
  masterAvailable: boolean;
  /** ปกติ — the ∧4 verbatim predicate (barrier excluded, D1-4). */
  normalCount: number;
  /** ผิดปกติ — the ∨5 verbatim predicate incl. หมดอายุ. */
  abnormalCount: number;
  /** จำนวนถังผิดปกติ — the AppSheet headline (= the same OR count). */
  abnormalHeadlineCount: number;
  /** จำนวนรายการที่ค่าไม่ครบตามสูตร — outside BOTH verbatim predicates. */
  incompleteCount: number;
}

export interface LightSummary {
  /** จำนวนที่ตรวจสอบ — total checks in range. */
  totalChecked: number;
  /** จำนวนการทดสอบผ่าน / ไม่ผ่าน — the headline pair. */
  testPass: number;
  testFail: number;
  /** Off-vocabulary test_result values (disclosed, never coerced). */
  testOther: number;
  /** จำนวนการคงอยู่ — มี / ไม่มี. */
  persistencyHas: number;
  persistencyNot: number;
  persistencyOther: number;
  /** จำนวนตำแหน่ง — เหมาะสม / ไม่เหมาะสม. */
  positionSuitable: number;
  positionNot: number;
  positionOther: number;
  /** จำนวนความต้องการ — the 3 verbatim Status values. */
  statusRepair: number;
  statusRelocate: number;
  statusInstall: number;
  /** ไม่ระบุ — blank/off-set Status (D1-5 honesty bucket). */
  statusUnspecified: number;
}

/** The honest master-register empty-state label (WO §4.4-3). */
export const SAFETY_MASTER_UNAVAILABLE_LABEL = "ยังไม่มีข้อมูลทะเบียนถัง";

const VERBATIM_NORMAL = "ปกติ";
const VERBATIM_BROKEN = "ชำรุด";
const VERBATIM_GAUGE_BAD = "ไม่ปกติ";
const VERBATIM_EXPIRED = "หมดอายุ";

/** ปกติ — the ∧4 verbatim predicate; `barrier` deliberately NOT read
 *  (D1-4: the AppSheet formulas never reference it). */
function isVerbatimNormal(r: SafetyExtinguisherRow): boolean {
  return (
    r.pipe === VERBATIM_NORMAL &&
    r.handle === VERBATIM_NORMAL &&
    r.tank === VERBATIM_NORMAL &&
    r.pressure_gauge === VERBATIM_NORMAL
  );
}

/** ผิดปกติ — the ∨5 verbatim predicate incl. breakdown_details หมดอายุ. */
function isVerbatimAbnormal(r: SafetyExtinguisherRow): boolean {
  return (
    r.pipe === VERBATIM_BROKEN ||
    r.handle === VERBATIM_BROKEN ||
    r.tank === VERBATIM_BROKEN ||
    r.pressure_gauge === VERBATIM_GAUGE_BAD ||
    r.breakdown_details === VERBATIM_EXPIRED
  );
}

/** Aggregate the ถังดับเพลิง summary (Filter_Firer §3.20 semantics).
 *  Predicates are evaluated per-row independently (AppSheet
 *  COUNT(SELECT(...)) semantics); masterIds = the master register's ids. */
export function buildExtinguisherSummary(input: {
  startISO: string;
  endISO: string;
  rows: SafetyExtinguisherRow[];
  masterIds: string[];
}): ExtinguisherSummary {
  const { startISO, endISO, rows, masterIds } = input;
  const inRange = rows.filter((r) => {
    const d = (r.inspection_date ?? "").slice(0, 10);
    return d >= startISO && d <= endISO;
  });
  let normalCount = 0;
  let abnormalCount = 0;
  let incompleteCount = 0;
  for (const r of inRange) {
    const normal = isVerbatimNormal(r);
    const abnormal = isVerbatimAbnormal(r);
    if (normal) normalCount += 1;
    if (abnormal) abnormalCount += 1;
    if (!normal && !abnormal) incompleteCount += 1;
  }
  const distinctMasters = new Set(masterIds.map((id) => (id ?? "").trim()).filter((id) => id !== ""));
  return {
    totalRows: inRange.length,
    inspectedCount: new Set(inRange.map((r) => (r.extinguisher_id ?? "").trim())).size,
    masterCount: distinctMasters.size,
    masterAvailable: distinctMasters.size > 0,
    normalCount,
    abnormalCount,
    abnormalHeadlineCount: abnormalCount,
    incompleteCount,
  };
}

const LIGHT_YES = "มี";
const LIGHT_NO = "ไม่มี";
const LIGHT_PASS = "ผ่าน";
const LIGHT_FAIL = "ไม่ผ่าน";
const LIGHT_POS_OK = "เหมาะสม";
const LIGHT_POS_BAD = "ไม่เหมาะสม";
const LIGHT_STATUS_REPAIR = "แจ้งซ่อม";
const LIGHT_STATUS_RELOCATE = "แจ้งย้ายตำแหน่ง";
const LIGHT_STATUS_INSTALL = "ขอติดตั้ง";

/** Aggregate the ไฟฉุกเฉิน summary (Filter_Light §3.35 semantics) — the
 *  AppSheet choice pickers become fixed both-value displays. */
export function buildLightSummary(input: {
  startISO: string;
  endISO: string;
  rows: SafetyLightRow[];
}): LightSummary {
  const { startISO, endISO, rows } = input;
  const inRange = rows.filter((r) => {
    const d = (r.check_date ?? "").slice(0, 10);
    return d >= startISO && d <= endISO;
  });
  const s: LightSummary = {
    totalChecked: inRange.length,
    testPass: 0,
    testFail: 0,
    testOther: 0,
    persistencyHas: 0,
    persistencyNot: 0,
    persistencyOther: 0,
    positionSuitable: 0,
    positionNot: 0,
    positionOther: 0,
    statusRepair: 0,
    statusRelocate: 0,
    statusInstall: 0,
    statusUnspecified: 0,
  };
  for (const r of inRange) {
    switch (r.test_result) {
      case LIGHT_PASS:
        s.testPass += 1;
        break;
      case LIGHT_FAIL:
        s.testFail += 1;
        break;
      default:
        s.testOther += 1;
    }
    switch (r.persistency) {
      case LIGHT_YES:
        s.persistencyHas += 1;
        break;
      case LIGHT_NO:
        s.persistencyNot += 1;
        break;
      default:
        s.persistencyOther += 1;
    }
    switch (r.position) {
      case LIGHT_POS_OK:
        s.positionSuitable += 1;
        break;
      case LIGHT_POS_BAD:
        s.positionNot += 1;
        break;
      default:
        s.positionOther += 1;
    }
    switch (r.status ?? "") {
      case LIGHT_STATUS_REPAIR:
        s.statusRepair += 1;
        break;
      case LIGHT_STATUS_RELOCATE:
        s.statusRelocate += 1;
        break;
      case LIGHT_STATUS_INSTALL:
        s.statusInstall += 1;
        break;
      default:
        // D1-5: blank/off-set Status disclosed in the ไม่ระบุ bucket —
        // the AppSheet IN() formula silently ignored these.
        s.statusUnspecified += 1;
    }
  }
  return s;
}

/** พ.ศ. month label for the safety/coliform section headers (the P1.6
 *  verbatim helper pair, re-exported shape for the UI). */
export function thaiMonthLabel(ym: string): string {
  const [, m] = ym.split("-").map(Number);
  return `${thaiMonthFull(m as number)} ${beYear(`${ym}-01`)}`;
}
