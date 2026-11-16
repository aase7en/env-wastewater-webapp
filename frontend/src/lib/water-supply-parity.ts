/**
 * ENV-PARITY-P1-005 — pure water-supply parity lib (no React, no I/O).
 *
 * Translates the AppSheet น้ำประปา daily-form contract (reference doc 12
 * §3.8, ref 2384–2677 — pinned per WO §2) onto the ENV storage model:
 *   - the activity enum (verbatim values ref 2519) + its init default
 *     (UI default on create only — never a DB default, per P1.1
 *     "unknown ≠ any value")
 *   - the Water_In Valid If >0 rule with the verbatim Invalid value error
 *     (ref 2561–2571); empty passes — NULL ≠ violation (AppSheet blank
 *     handling)
 *   - the §2.3 Show-If groups: the usage group (Chlorine usage / Hour_meter
 *     / derived Chlorine_usage_realy — ref 2501–2527/2673–2677, keyed on
 *     activity = ลงข้อมูลการใช้น้ำประจำวัน ∧ สถานที่ resolves โรงจ่ายคลอรีน,
 *     where an unset location resolves to the AppSheet init default at the
 *     UI layer) and Water_In (ref 2573–2577)
 *   - the estimate flag labels verbatim (owner A2 / D1-5): "ค่าประมาณจากสเปก"
 *     for the spec-driven energy estimate and "ประมาณจากชั่วโมงปั๊ม" for the
 *     spec-flow-driven water_in estimate
 *   - the VIEW-MATH MIRRORS (WO §3.3 — testability only, never a second
 *     write path; water_supply.v_daily_check_chain owns the real math):
 *     spec-at-date pick (half-open [valid_from, valid_to), latest start
 *     wins), the hour-delta guard (delta ≤ 0 or missing prev → NULL +
 *     boundary flag — never 0, never negative; the AppSheet clamp-to-zero
 *     is never replicated), energy = hours × spec-at-date energy, the
 *     water_in estimate from spec flow (the AppSheet ×8 constant ref
 *     2547–2553 is recorded in the WO and NEVER replicated), and the
 *     chlorine ÷(1+9) derivation from the mix spec parts (D1-4 — the
 *     AppSheet ÷10 ref 2603–2609/2665–2671 stays in the WO verbatim; the
 *     divisor is derived, never hardcoded)
 *   - no-fallback invariants (WO §2.4-4): never 60, never the ×8 silent
 *     store, never 0-fill — unknown stays NULL + flagged
 */

// ─── activity enum (verbatim §3.8 ref 2519) ─────────────────────────────

export const ACTIVITY_OPTIONS = ["ลงข้อมูลการใช้น้ำประจำวัน", "ฟรีคลอรีน / TDS"] as const;
export type WaterActivity = (typeof ACTIVITY_OPTIONS)[number];
/** The usage-recording mode (Show-If key ref 2501–2527). */
export const ACTIVITY_USAGE_MODE: WaterActivity = "ลงข้อมูลการใช้น้ำประจำวัน";
/** The quality-recording mode (water-in Show-If key ref 2573–2577). */
export const ACTIVITY_QUALITY_MODE: WaterActivity = "ฟรีคลอรีน / TDS";
/** AppSheet initial value (ref 2509–2515) — UI default on create only;
 *  the DB column has NO default. */
export const ACTIVITY_DEFAULT: WaterActivity = ACTIVITY_USAGE_MODE;

// ─── Verbatim column labels + Thai prompts ──────────────────────────────

/** Form labels = the AppSheet column names, verbatim (WO §3.2). */
export const LABEL_ACTIVITY = "activity";
export const LABEL_HOUR_METER = "Hour_meter";
export const LABEL_CHLORINE_USAGE = "Chlorine usage";
export const LABEL_WATER_IN = "Water_In";
/** AppSheet Thai value prompts preserved as display vocabulary
 *  (Energy_use init ref 2541–2545; Water_In init ref 2555–2559). */
export const PROMPT_ENERGY = "ไฟฟ้าที่ใช้";
export const PROMPT_WATER_IN = "บริมาณน้ำเข้า";

// ─── Verbatim validation error (ref 2567–2571) ──────────────────────────

/** Water_In Invalid value error — VERBATIM. */
export const ERR_WATER_IN = "ตรวจสอบข้อมูลดีๆก่อน";

// ─── Estimate flags + honest chips (A2 / D1-5) ──────────────────────────

/** Energy estimate flag — shown ALWAYS with energy_use_estimate. */
export const FLAG_ENERGY_ESTIMATE = "ค่าประมาณจากสเปก";
/** Water-in estimate flag — shown ONLY with a water_in_estimate value. */
export const FLAG_WATER_IN_ESTIMATE = "ประมาณจากชั่วโมงปั๊ม";
/** Honest-unknown chip: the pump spec carries no flow value yet (live
 *  seed reality) — water_in_estimate stays NULL, never ×8, never 0. */
export const CHIP_NO_FLOW_SPEC = "ยังไม่มีค่าอัตราการไหลในสเปก";

// ─── Show-If groups (§2.3 verbatim) ─────────────────────────────────────

/** The AppSheet init default for สถานที่ (ref 2455–2461) — applies at the
 *  UI layer when the form has no location set (display only). */
export const CHLORINE_STATION_DEFAULT = "โรงจ่ายคลอรีน";

export function isUsageMode(activity: string | null | undefined): boolean {
  return activity === ACTIVITY_USAGE_MODE;
}

/** An unset location resolves to the AppSheet init default (UI display
 *  only — never stored). */
export function resolveLocationDisplay(locationName: string | null | undefined): string {
  return locationName ?? CHLORINE_STATION_DEFAULT;
}

/** §2.3-1 usage group: activity = usage mode ∧ สถานที่ resolves
 *  โรงจ่ายคลอรีน (ref 2501–2507, 2521–2527, 2673–2677). */
export function showUsageFields(
  activity: string | null | undefined,
  locationName: string | null | undefined,
): boolean {
  return isUsageMode(activity) && resolveLocationDisplay(locationName) === CHLORINE_STATION_DEFAULT;
}

/** §2.3-3 Water_In shows when activity ≠ "ฟรีคลอรีน / TDS" (ref 2573–2577);
 *  NULL activity is not the quality mode → shows. */
export function showWaterIn(activity: string | null | undefined): boolean {
  return activity !== ACTIVITY_QUALITY_MODE;
}

// ─── Water_In validation (Valid If >0 — ref 2561–2571) ──────────────────

/** Parse a form-side numeric string; "" (empty) and unparseable → null. */
function parseNumber(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Valid If `=[Water_In]>0`: empty passes (NULL ≠ violation); a non-empty
 *  value must parse to a number > 0 or the VERBATIM error fires. */
export function validateWaterIn(v: string | number | null | undefined): string | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = parseNumber(s);
  if (n === null || n <= 0) return ERR_WATER_IN;
  return null;
}

// ─── View-math mirrors (testability only — never a write path) ──────────

/** The effective-dated equipment-spec shape (core.equipment_spec, P1.2;
 *  consumed READ-ONLY). */
export interface SpecRow {
  kind: string;
  valid_from: string;
  valid_to: string | null;
  flow_m3_per_h: number | null;
  energy_kwh_per_h: number | null;
  mix_part_chlorine: number | null;
  mix_part_water: number | null;
}

/**
 * Spec-at-date pick — mirrors the view's LATERAL join: half-open
 * [valid_from, valid_to), latest valid_from wins; no covering row → NULL
 * (missing spec is flagged downstream, never guessed).
 */
export function pickSpecAtDate(specs: SpecRow[], kind: string, date: string): SpecRow | null {
  const covering = specs
    .filter(
      (s) =>
        s.kind === kind &&
        s.valid_from <= date &&
        (s.valid_to === null || s.valid_to > date),
    )
    .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1));
  return covering[0] ?? null;
}

export interface HourDelta {
  value: number | null;
  boundary: boolean;
  reason: string | null;
}

/**
 * hour_work guard — mirrors the view: delta only when both meters exist
 * and the delta is positive; delta ≤ 0 → NULL + boundary flag + reason
 * (meter reset/swap suspected); missing previous → NULL + boundary (the
 * AppSheet global-MAX bug class is corrected upstream in the view; the
 * mirror NEVER emits 0 or a negative).
 */
export function hourWork(hourMeter: number | null, prevHourMeter: number | null): HourDelta {
  if (hourMeter === null || hourMeter === undefined) {
    return { value: null, boundary: false, reason: null };
  }
  if (prevHourMeter === null || prevHourMeter === undefined) {
    return { value: null, boundary: true, reason: "hour: no previous reading" };
  }
  const delta = hourMeter - prevHourMeter;
  if (delta <= 0) {
    return { value: null, boundary: true, reason: "hour: delta <= 0 (meter reset/swap suspected)" };
  }
  return { value: delta, boundary: false, reason: null };
}

export interface Estimate {
  value: number | null;
  specMissing: boolean;
}

/** energy_use_estimate mirror: hours × spec-at-date energy (owner A2);
 *  missing hours is NOT a spec problem (specMissing false), a missing spec
 *  or energy value is (value NULL + specMissing true). */
export function energyUseEstimate(
  hourWorkValue: number | null,
  spec: { energy_kwh_per_h: number | null } | null,
): Estimate {
  if (hourWorkValue === null) return { value: null, specMissing: false };
  if (spec === null || spec.energy_kwh_per_h === null) {
    return { value: null, specMissing: true };
  }
  return { value: hourWorkValue * spec.energy_kwh_per_h, specMissing: false };
}

/** water_in_estimate mirror (D1-5): hours × spec-at-date flow — NEVER the
 *  AppSheet ×8 constant. No flow seeded (live reality) → NULL +
 *  specMissing, honest unknown. */
export function waterInEstimate(
  hourWorkValue: number | null,
  spec: { flow_m3_per_h: number | null } | null,
): Estimate {
  if (hourWorkValue === null) return { value: null, specMissing: false };
  if (spec === null || spec.flow_m3_per_h === null) {
    return { value: null, specMissing: true };
  }
  return { value: hourWorkValue * spec.flow_m3_per_h, specMissing: false };
}

/**
 * chlorine_usage_realy mirror (D1-4): usage ÷ (mix_part_chlorine +
 * mix_part_water) — the 1:9 mix gives 1+9 = 10 = the "10%" stock, the
 * AppSheet ÷10 semantics derived from the spec row instead of a hardcoded
 * 10. Missing usage → NULL (no flag); missing spec/parts → NULL +
 * specMissing. NULLIF semantics: a zero total divides to NULL.
 */
export function chlorineUsageReal(
  chlorineUsage: number | null,
  spec: { mix_part_chlorine: number | null; mix_part_water: number | null } | null,
): Estimate {
  if (chlorineUsage === null) return { value: null, specMissing: false };
  // SQL-NULL semantics: NULL + anything = NULL → NULLIF(NULL, 0) → NULL, so
  // a single missing part already makes the divisor unknown (missing spec).
  if (
    spec === null ||
    spec.mix_part_chlorine === null ||
    spec.mix_part_water === null ||
    spec.mix_part_chlorine + spec.mix_part_water <= 0
  ) {
    return { value: null, specMissing: true };
  }
  return { value: chlorineUsage / (spec.mix_part_chlorine + spec.mix_part_water), specMissing: false };
}
