/**
 * ENV-PARITY-P2-005 — pure coliform summary aggregation lib (AppSheet
 * parity lane P2.5: สรุป coliform on /reports).
 *
 * Ground truth: docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md
 * §3.37 Filter_ColiformBac (ref 5523–5574 — the date-range report builder)
 * + the per-table result/collect-point semantics §3.11 (ทั่วไป), §3.16
 * (น้ำ), §3.17 (อาหาร), §3.19 (พนักงาน) — pinned per WO
 * ENV-PARITY-P2-005 §4.3/§4.4.
 *
 * House rules (WO §4.3/§4.4, binding):
 *   - CLIENT-SIDE aggregation of recorded rows only (D1-2, the P1.6 D1-1
 *     precedent) — no DB access in this module, no re-derivation of any
 *     stored value.
 *   - รอผล is its OWN number (never folded into ผ่าน/ไม่ผ่าน, never
 *     zero-coerced): the pending gate CONSUMES the house predicate
 *     `isPendingResult` from ./food (handoff §2.1 — CONSUME, never
 *     re-derive).
 *   - ผ่าน ⇔ Negative; ไม่ผ่าน ⇔ Positive ∨ Positive ++; Positive ++ and
 *     invalid counted SEPARATELY; any other stored value → the explicit
 *     ค่าอื่น bucket (free-text compat, P2.4 D1-12) — never coerced.
 *   - The ผ่าน/ไม่ผ่าน pair reports over its REAL denominator (มีผล).
 *   - Collect-point breakdowns follow the verbatim per-source vocabularies
 *     (water 4 / food 5 / general 2, via the shared constants in ./food);
 *     employee rows carry NO collect point → the single
 *     "ตัวอย่างจากบุคลากร" entry (COUNTS ONLY — no person identity, PII
 *     pin); blank points → ไม่ระบุ; off-vocabulary points → อื่นๆ.
 *   - Monthly rollups follow the P1.6 month-not-reached pattern: a month
 *     with no records (incl. a month not yet reached) is honest NULL —
 *     NEVER 0.
 *   - พ.ศ. labels via the P1.6 helpers (thaiMonthFull / beYear).
 *   - Counts only — no names, no Employee_id values anywhere (PII pin).
 */
import {
  COLIFORM_SOURCES,
  FOOD_COLLECT_POINTS,
  GENERAL_COLLECT_POINTS,
  WATER_COLLECT_POINTS,
  isPendingResult,
  type ColiformSource,
} from "./food";
import { beYear, thaiMonthFull } from "./report-summary";

/** The lab_test subset this summary aggregates (the public.lab_test
 *  security_invoker façade exposes all P2.4 columns; this module reads
 *  only the summary-relevant five). */
export interface ColiformReportRow {
  sample_date: string;
  sample_source: string | null;
  collect_point: string | null;
  result: string | null;
  reported_date: string | null;
}

/** One collect-point breakdown entry (counts only). */
export interface ColiformPointCount {
  label: string;
  count: number;
}

/** Per-source summary — เก็บ / รอผล / มีผล + the result classes. */
export interface ColiformSourceSummary {
  source: ColiformSource;
  /** จำนวนตัวอย่างที่เก็บ (rows in range by sample_date). */
  collected: number;
  /** รอผล — the isPendingResult house predicate (its own number). */
  pending: number;
  /** มีผล — result AND reported_date present (the real denominator). */
  resulted: number;
  /** ผลผ่าน (Negative). */
  pass: number;
  /** ผลไม่ผ่าน (Positive ∨ Positive ++). */
  fail: number;
  /** Positive ++ แยกต่างหาก (a subset of fail). */
  plusPlus: number;
  /** invalid แยกต่างหาก. */
  invalid: number;
  /** ค่าอื่น — stored values outside the documented sets (never coerced). */
  other: number;
  /** Collect-point breakdown (verbatim vocabulary; counts only). */
  points: ColiformPointCount[];
}

/** One monthly rollup point — honest NULL when the month has no records. */
export interface ColiformMonthlyPoint {
  ym: string; // YYYY-MM
  label: string; // Thai full month + พ.ศ.
  total: number | null;
}

export interface ColiformSummary {
  startISO: string;
  endISO: string;
  totalCollected: number;
  totalPending: number;
  totalResulted: number;
  totalPass: number;
  totalFail: number;
  totalPlusPlus: number;
  totalInvalid: number;
  totalOther: number;
  /** All four sources, always present (in COLIFORM_SOURCES order). */
  sources: ColiformSourceSummary[];
  /** Monthly rollups over the range's months (NULL when no records). */
  monthly: ColiformMonthlyPoint[];
}

const RESULT_PLUS_PLUS = "Positive ++";
const RESULT_INVALID = "invalid";
const POINT_UNSET_LABEL = "ไม่ระบุ";
const POINT_OTHER_LABEL = "อื่นๆ";
const EMPLOYEE_POINT_LABEL = "ตัวอย่างจากบุคลากร";

/** Verbatim collect-point vocabulary per source (พนักงาน carries none). */
function pinnedPointsFor(source: ColiformSource): readonly string[] {
  switch (source) {
    case "น้ำ":
      return WATER_COLLECT_POINTS;
    case "อาหาร":
      return FOOD_COLLECT_POINTS;
    case "ทั่วไป":
      return GENERAL_COLLECT_POINTS;
    case "พนักงาน":
      return [];
  }
}

/** Collect-point breakdown for one source: the pinned vocabulary in
 *  verbatim order (0-count entries stay visible), blanks → ไม่ระบุ,
 *  off-vocabulary free text → อื่นๆ; พนักงาน → the single บุคลากร entry. */
function buildPointBreakdown(source: ColiformSource, rows: ColiformReportRow[]): ColiformPointCount[] {
  if (source === "พนักงาน") {
    return [{ label: EMPLOYEE_POINT_LABEL, count: rows.length }];
  }
  const pinned = pinnedPointsFor(source);
  const counts = new Map<string, number>();
  let unset = 0;
  let other = 0;
  for (const r of rows) {
    const point = (r.collect_point ?? "").trim();
    if (point === "") {
      unset += 1;
    } else if ((pinned as readonly string[]).includes(point)) {
      counts.set(point, (counts.get(point) ?? 0) + 1);
    } else {
      other += 1;
    }
  }
  const out: ColiformPointCount[] = pinned.map((label) => ({ label, count: counts.get(label) ?? 0 }));
  if (unset > 0) out.push({ label: POINT_UNSET_LABEL, count: unset });
  if (other > 0) out.push({ label: POINT_OTHER_LABEL, count: other });
  return out;
}

/** Result classification per row — source-independent (the pin: ไม่ผ่าน ⇔
 *  Positive ∨ Positive ++ on every surface; invalid separate; anything
 *  else non-blank → ค่าอื่น). */
function classifyResult(result: string | null): "pass" | "fail" | "plusplus" | "invalid" | "other" {
  const value = (result ?? "").trim();
  if (value === "Negative") return "pass";
  if (value === RESULT_PLUS_PLUS) return "plusplus";
  if (value === "Positive") return "fail";
  if (value === RESULT_INVALID) return "invalid";
  return "other";
}

/** Calendar months of the range, inclusive (YYYY-MM ascending). */
function enumerateMonths(startISO: string, endISO: string): string[] {
  const [sy, sm] = startISO.split("-").map(Number);
  const [ey, em] = endISO.split("-").map(Number);
  const months: string[] = [];
  let y = sy as number;
  let m = sm as number;
  while (y < (ey as number) || (y === (ey as number) && m <= (em as number))) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

/** Aggregate the coliform date-range summary from recorded lab_test rows
 *  (client-side, D1-2; counts only). Rows outside [startISO, endISO] by
 *  sample_date contribute nothing. */
export function buildColiformSummary(input: {
  startISO: string;
  endISO: string;
  rows: ColiformReportRow[];
}): ColiformSummary {
  const { startISO, endISO, rows } = input;
  const inRange = rows.filter((r) => {
    const d = (r.sample_date ?? "").slice(0, 10);
    return d >= startISO && d <= endISO;
  });

  const sources: ColiformSourceSummary[] = COLIFORM_SOURCES.map((source) => {
    const sourceRows = inRange.filter((r) => (r.sample_source ?? "") === source);
    let pending = 0;
    let resulted = 0;
    let pass = 0;
    let fail = 0;
    let plusPlus = 0;
    let invalid = 0;
    let other = 0;
    for (const r of sourceRows) {
      // รอผล via the HOUSE predicate — consumed, never re-derived here.
      if (isPendingResult(r)) {
        pending += 1;
        continue;
      }
      resulted += 1;
      switch (classifyResult(r.result)) {
        case "pass":
          pass += 1;
          break;
        case "plusplus":
          plusPlus += 1;
          fail += 1;
          break;
        case "fail":
          fail += 1;
          break;
        case "invalid":
          invalid += 1;
          break;
        case "other":
          other += 1;
          break;
      }
    }
    return {
      source,
      collected: sourceRows.length,
      pending,
      resulted,
      pass,
      fail,
      plusPlus,
      invalid,
      other,
      points: buildPointBreakdown(source, sourceRows),
    };
  });

  const monthly: ColiformMonthlyPoint[] = enumerateMonths(startISO, endISO).map((ym) => {
    const count = inRange.filter((r) => (r.sample_date ?? "").slice(0, 7) === ym).length;
    const [, m] = ym.split("-").map(Number);
    return {
      ym,
      label: `${thaiMonthFull(m as number)} ${beYear(`${ym}-01`)}`,
      // Honest NULL when the month carries no records (never 0) — the
      // P1.6 month-not-reached pattern.
      total: count === 0 ? null : count,
    };
  });

  const sum = (get: (s: ColiformSourceSummary) => number) =>
    sources.reduce((acc, s) => acc + get(s), 0);

  return {
    startISO,
    endISO,
    totalCollected: sum((s) => s.collected),
    totalPending: sum((s) => s.pending),
    totalResulted: sum((s) => s.resulted),
    totalPass: sum((s) => s.pass),
    totalFail: sum((s) => s.fail),
    totalPlusPlus: sum((s) => s.plusPlus),
    totalInvalid: sum((s) => s.invalid),
    totalOther: sum((s) => s.other),
    sources,
    monthly,
  };
}
