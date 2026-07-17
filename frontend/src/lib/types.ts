/** Types matching the FastAPI Pydantic schemas (from app/schemas/).
 * Manual for now; will be auto-generated from /openapi.json later. */

// ─── Dashboard / list views ──────────────────────────────────────────────

export interface DashboardRow {
  reading_date: string;
  do_average?: number | string | null;
  ph?: number | string | null;
  free_chlorine?: number | string | null;
  tds_aeration?: number | string | null;
  water_used_total?: number | string | null;
  wastewater_in?: number | string | null;
  system_operating?: boolean | null;
  wastewater_discharged?: boolean | null;
  do_alert?: boolean | null;
  chlorine_alert?: boolean | null;
  ph_alert?: boolean | null;
}

export interface ReadingListItem {
  id: string;
  reading_date: string;
  do_average?: number | null;
  ph?: number | string | null;
  free_chlorine?: number | string | null;
  system_operating?: boolean | null;
  date_thai_be?: number | null;
}

export interface ReadingList {
  items: ReadingListItem[];
  total: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  env: string;
  auth_mode: string;
}

// ─── Reference data (form dropdowns / checklist labels) ──────────────────

export interface EquipmentOut {
  id: string;
  code: string; // pump1, aerator1, screen_coarse, etc. — matches the *_running bool keys
  name_th: string;
  name_en?: string | null;
  location_id?: string | null;
  is_active: boolean;
}

export interface LocationOut {
  id: string;
  code: string;
  area_name: string;
  category_id?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}

export interface LocationCategoryOut {
  id: string;
  name: string;
}

export interface PersonnelOut {
  id: string;
  staff_code: string;
  full_name: string;
  position?: string | null;
  status?: string | null;
}

// ─── Daily-form write path (mirror of app/schemas/reading.py) ────────────
// All measured-value fields are optional on the wire (the form may submit
// a partial reading). The backend fills reported_by + location_id.

/** Shared measured fields — used by Create, Update (partial), and Detail. */
export interface ReadingFields {
  reading_date?: string; // YYYY-MM-DD
  // Water quality
  do_aeration?: number | string | null;
  do_sedimentation?: number | string | null;
  do_before_discharge?: number | string | null;
  tds_aeration?: number | string | null;
  tds_before_discharge?: number | string | null;
  ph?: number | string | null;
  temp_aeration?: number | string | null;
  sv30?: number | string | null;
  free_chlorine?: number | string | null;
  // Equipment checklist (10 booleans)
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
  system_operating?: boolean | null;
  // Meters + flow
  pump1_meter?: number | string | null;
  pump2_meter?: number | string | null;
  water_used_total?: number | string | null;
  wastewater_in?: number | string | null;
  wastewater_discharged?: boolean | null;
  // Chlorine
  chlorine_used?: number | string | null;
  chlorine_mix_ratio?: string | null;
  excess_sludge_removed?: number | string | null;
  // Qualitative
  color_desc?: string | null;
  smell_desc?: string | null;
  note?: string | null;
}

/** POST /api/readings body. abnormal_cause is REQUIRED when system_operating
 * is false (SPEC §6) — it seeds a core.repair_request, it is NOT a column. */
export interface ReadingCreate extends ReadingFields {
  reading_date: string; // required on create
  electricity_consumption?: number | string | null; // → carbon.reading.consumption
  electricity_meter_value?: number | string | null; // → carbon.reading.meter_value
  abnormal_cause?: string | null;
}

/** PUT /api/readings/{id} body — all fields optional (partial). */
export type ReadingUpdate = Partial<ReadingCreate>;

/** GET /api/readings/{id} response — full record + computed fields. */
export interface ReadingDetail extends ReadingFields {
  id: string;
  location_id?: string | null;
  carbon_reading_id?: string | null;
  input_source: string;
  reported_by_name_legacy?: string | null;
  // Computed server-side (app.core.computed)
  do_average?: number | null;
  energy_kwh?: number | null;
  sv30_percent?: number | null;
  energy_per_m3?: number | null;
  date_thai_be?: number | null;
}

// ─── Threshold rules (computed client-side for inline form warnings) ─────
// Mirrors app/core/threshold.py + app/core/alert.py:check_thresholds.
export const THRESHOLDS = {
  doMin: 2.0, // DO average below this → alert
  chlorineMin: 0.5, // free chlorine below this → alert
  phMin: 6.5,
  phMax: 8.5,
} as const;

export interface ThresholdAlert {
  field: "do_average" | "free_chlorine" | "ph";
  message: string;
}

/** Replicates check_thresholds so the form can show inline warnings after
 * the user enters values, before the server round-trip. */
export function checkThresholds(r: {
  do_aeration?: number | string | null;
  do_sedimentation?: number | string | null;
  do_before_discharge?: number | string | null;
  ph?: number | string | null;
  free_chlorine?: number | string | null;
}): ThresholdAlert[] {
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return v;
    const n = parseFloat(String(v));
    return Number.isNaN(n) ? null : n;
  };
  const alerts: ThresholdAlert[] = [];

  const doVals = [r.do_aeration, r.do_sedimentation, r.do_before_discharge]
    .map(num)
    .filter((v): v is number => v !== null);
  if (doVals.length > 0) {
    const avg = doVals.reduce((a, b) => a + b, 0) / doVals.length;
    if (avg < THRESHOLDS.doMin) {
      alerts.push({
        field: "do_average",
        message: `DO เฉลี่ย ${avg.toFixed(2)} mg/L ต่ำกว่า ${THRESHOLDS.doMin} — ตรวจสอบระบบเติมอากาศ`,
      });
    }
  }
  const cl = num(r.free_chlorine);
  if (cl !== null && cl < THRESHOLDS.chlorineMin) {
    alerts.push({
      field: "free_chlorine",
      message: `คลอรีนอิสระ ${cl.toFixed(2)} mg/L ต่ำกว่า ${THRESHOLDS.chlorineMin}`,
    });
  }
  const ph = num(r.ph);
  if (ph !== null && (ph < THRESHOLDS.phMin || ph > THRESHOLDS.phMax)) {
    alerts.push({
      field: "ph",
      message: `pH ${ph.toFixed(2)} อยู่นอกช่วงปกติ ${THRESHOLDS.phMin}–${THRESHOLDS.phMax}`,
    });
  }
  return alerts;
}
