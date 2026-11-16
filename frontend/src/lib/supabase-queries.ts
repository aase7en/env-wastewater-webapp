/**
 * Supabase query layer — replaces lib/api-client.ts (which hit FastAPI).
 *
 * Every query goes through the shared `supabase` client, which auto-attaches
 * the user's session token. RLS policies on the DB side gate what each row
 * is allowed to read/write.
 *
 * Computed fields (do_average, threshold flags, date_thai_be) are
 * pre-computed in the v_dashboard_14day / v_reading_detail views (see
 * supabase/migrations/20260718000000_p12_frontend_views.sql).
 */
import { supabase } from "./supabase";
import { toLocalISODate } from "./utils";
import { buildStatusMirror, pickStatusMirror } from "./form-parity";
import type {
  DashboardRow,
  EquipmentOut,
  LocationCategoryOut,
  LocationOut,
  PersonnelOut,
  ReadingCreate,
  ReadingDetail,
  ReadingListItem,
  ReadingUpdate,
} from "./types";

// ─── Equipment-spec types (P1.4; core.equipment_spec shape from the P1.2
// migration — kept here because types.ts is outside this lane's scope) ───

/** core.equipment_spec_kind enum values (verbatim, P1.2 migration). */
export const EQUIPMENT_SPEC_KINDS = [
  "pump_wastewater_1",
  "pump_wastewater_2",
  "pump_groundwater",
  "chlorine_mix_groundwater",
] as const;
export type EquipmentSpecKind = (typeof EQUIPMENT_SPEC_KINDS)[number];

export interface EquipmentSpec {
  id: string;
  kind: EquipmentSpecKind;
  flow_m3_per_h: number | string | null;
  energy_kwh_per_h: number | string | null;
  mix_part_chlorine: number | string | null;
  mix_part_water: number | string | null;
  valid_from: string;
  valid_to: string | null;
  note: string | null;
  source: string | null;
  created_at?: string;
}

export type EquipmentSpecInsert = Omit<EquipmentSpec, "id" | "created_at">;

/** One row of wastewater.v_reading_meter_chain (read-only; P1.2 owns the
 *  shape — only the columns the form consumes are typed). */
export interface MeterChainRow {
  id: string;
  reading_date: string;
  pump1_meter: number | string | null;
  pump2_meter: number | string | null;
  prev_pump1_meter: number | string | null;
  prev_pump2_meter: number | string | null;
  prev_electric_meter: number | string | null;
  delta_kwh: number | string | null;
  avg_westwater_4d: number | string | null;
  wastewater_in_derived: number | string | null;
  meter_boundary_flag: boolean | null;
  meter_boundary_reason: string | null;
  spec_missing: boolean | null;
  spec_missing_kinds: string | null;
}

/** Result of the น้ำประปา Water_In lookup for one reading_date. */
export interface WaterUsedLookup {
  /** The record's own Water_In value, or null when absent/unknown. */
  value: number | null;
  /** True when a daily_check row exists for the date. */
  hasRecord: boolean;
}

// ─── Read paths ──────────────────────────────────────────────────────────

/** Dashboard rollup (last N days, newest first). Replaces /api/dashboard. */
export async function fetchDashboard(days = 14): Promise<DashboardRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  // C3 (2026-08-03): compare against the DB's local reading_date column,
  // not a UTC slice — otherwise at 00:00–06:59 ICT "today UTC" is still
  // yesterday and today's reading falls outside the window.
  const { data, error } = await supabase
    .from("v_dashboard_14day")
    .select(
      "reading_date, do_average, ph, free_chlorine, tds_aeration, water_used_total, wastewater_in, system_operating, wastewater_discharged, do_alert, chlorine_alert, ph_alert"
    )
    .gte("reading_date", toLocalISODate(cutoff))
    .order("reading_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DashboardRow[];
}

/** Dashboard rows for a specific calendar month (YYYY-MM), oldest first.
 *
 * Fixes the Reports-page "cap 60 days" bug: ReportsPage previously filtered
 * a useDashboard(60) client-side cache by month, so any month older than 60
 * days came back empty (toast "ไม่มีข้อมูล") even when the DB had the rows.
 * This fetches the exact month directly, so any historical month works.
 *
 * monthYear is the `<input type="month">` value "YYYY-MM".
 */
export async function fetchDashboardByMonth(monthYear: string): Promise<DashboardRow[]> {
  const { data, error } = await supabase
    .from("v_dashboard_14day")
    .select(
      "reading_date, do_average, ph, free_chlorine, tds_aeration, water_used_total, wastewater_in, system_operating, wastewater_discharged, do_alert, chlorine_alert, ph_alert"
    )
    .gte("reading_date", `${monthYear}-01`)
    .lt("reading_date", nextMonthStart(monthYear))
    .order("reading_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DashboardRow[];
}

/** Compute "YYYY-MM-01" for the month AFTER the given YYYY-MM. */
function nextMonthStart(monthYear: string): string {
  const [y, m] = monthYear.split("-").map(Number);
  const next = new Date(y, m, 1); // m is 1-12; new Date(y, 12, 1) rolls to next Jan correctly
  return toLocalISODate(next);
}

/**
 * Latest reading date across all time (no 14-day window) — used by F7
 * stale-data fallback. When fetchDashboard returns [] because the newest
 * record is older than the window, the empty-state card shows
 * "บันทึกล่าสุด <date> (N วันก่อน)" so staff can tell "no one logged"
 * vs "system broken". Returns null when the table is truly empty.
 *
 * Same source as fetchDashboard (v_dashboard_14day) but unfiltered + desc.
 */
export async function fetchLatestReadingDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("v_dashboard_14day")
    .select("reading_date")
    .order("reading_date", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? [])[0]?.reading_date ?? null;
}

// ─── Overview carbon (SCHEMA-6, anon-safe aggregate) ──────────────────────

/** One row per month (YYYY-MM Gregorian) of carbon/energy aggregates. */
export interface OverviewCarbonRow {
  month: string;
  days: number;
  kwh_total: number;
  tco2e: number;
}

/**
 * Public overview carbon aggregate (SCHEMA-6) — anon-safe 12-month slice for
 * the landing-page Energy + Carbon cards. Authenticated CarbonPage keeps
 * using useCarbonMonthly (per-meter detail from carbon.reading + carbon.meter).
 *
 * Returns latest-first (DESC by month). The view already filters to the last
 * 12 months server-side; we still cap with limit(12) defensively.
 */
export async function fetchOverviewCarbon(): Promise<OverviewCarbonRow[]> {
  const { data, error } = await supabase
    .from("v_overview_carbon")
    .select("month, days, kwh_total, tco2e")
    .order("month", { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);
  return (data ?? []) as OverviewCarbonRow[];
}

/** Recent readings list (newest first). Replaces /api/readings. */
export async function fetchReadings(limit = 30): Promise<{ items: ReadingListItem[]; total: number }> {
  const { data, error, count } = await supabase
    .from("v_dashboard_14day")
    .select("id, reading_date, do_average, ph, free_chlorine, system_operating, date_thai_be", { count: "exact" })
    .order("reading_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as ReadingListItem[], total: count ?? 0 };
}

/** Single reading for edit mode. Replaces /api/readings/{id}. */
export async function fetchReading(id: string): Promise<ReadingDetail> {
  const { data, error } = await supabase
    .from("v_reading_with_computed")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("reading not found");
  return data as ReadingDetail;
}

// ─── Reference data ─────────────────────────────────────────────────────

export async function fetchEquipment(): Promise<EquipmentOut[]> {
  const { data, error } = await supabase
    .from("equipment")
    // DB column is `name` (singular, Thai). Map to EquipmentOut.name_th via
    // supabase-js alias syntax `name_th:name`. name_en stays null (no column).
    .select("id, code, name_th:name, location_id, is_active")
    .order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as EquipmentOut[];
}

export async function fetchLocations(): Promise<LocationOut[]> {
  const { data, error } = await supabase
    .from("location")
    .select("id, code, area_name, category_id, lat, lng")
    .order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as LocationOut[];
}

export async function fetchLocationCategories(): Promise<LocationCategoryOut[]> {
  const { data, error } = await supabase
    .from("location_category")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as LocationCategoryOut[];
}

export async function fetchPersonnel(): Promise<PersonnelOut[]> {
  const { data, error } = await supabase
    .from("personnel")
    .select("id, staff_code, full_name, position, status")
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as PersonnelOut[];
}

// ─── P1.4 parity reads (meter chain + water-supply lookup) ──────────────

/**
 * Meter-chain row for ONE saved reading (edit mode) — carries the LAG
 * previous meters + boundary/spec-missing flags the honest-warning chip
 * checks. Read-only (the view is P1.2-owned; READ-ONLY for this lane).
 */
export async function fetchMeterChainById(id: string): Promise<MeterChainRow | null> {
  const { data, error } = await supabase
    .from("v_reading_meter_chain")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MeterChainRow) ?? null;
}

/**
 * Latest meter-chain row STRICTLY BEFORE a reading_date (create mode —
 * the row for an unsaved reading does not exist yet). Its own pump meters
 * are what the new reading's deltas will be computed against. Returns
 * null when no previous reading exists at all (first-ever reading → the
 * honest "ยังไม่มีมิเตอร์สูบ" chip).
 */
export async function fetchMeterChainBefore(readingDate: string): Promise<MeterChainRow | null> {
  const { data, error } = await supabase
    .from("v_reading_meter_chain")
    .select("*")
    .lt("reading_date", readingDate)
    .order("reading_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MeterChainRow) ?? null;
}

/**
 * น้ำประปา Water_In lookup for one reading_date (AppSheet LOOKUP parity,
 * ref 616–622). Reads whatever the water_supply.daily_check source
 * currently exposes (P1.5 pending — the Water_In column may not exist
 * yet): select("*") + generic extraction never errors on the missing
 * column, and a missing/blank value honestly yields {value: null} → the
 * "ยังไม่มีบันทึกน้ำประปาของวัน" chip. NEVER substitutes a number.
 */
export async function fetchWaterUsedForDate(readingDate: string): Promise<WaterUsedLookup> {
  const { data, error } = await supabase
    .from("daily_check")
    .select("*")
    .eq("check_date", readingDate)
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    // Source absent (no row, or P1.5 not landed) → honest unknown.
    return { value: null, hasRecord: false };
  }
  const raw = (data as Record<string, unknown>).water_in ?? (data as Record<string, unknown>).Water_In;
  if (raw === null || raw === undefined || raw === "") return { value: null, hasRecord: true };
  const n = Number(raw);
  return { value: Number.isFinite(n) ? n : null, hasRecord: true };
}

// ─── Equipment-spec admin (P1.4; core.equipment_spec via the public
// security_invoker façade; RLS: SELECT staff-or-admin, INSERT admin-only,
// UPDATE/DELETE never granted — append-only) ─────────────────────────────

/** Full spec history, kind-grouped, newest effective-dated row first. */
export async function fetchEquipmentSpecs(): Promise<EquipmentSpec[]> {
  const { data, error } = await supabase
    .from("equipment_spec")
    .select("*")
    .order("kind", { ascending: true })
    .order("valid_from", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EquipmentSpec[];
}

/** Append a NEW effective-dated spec row. Never edits history — no
 *  update/delete path exists here (UI + RLS + grants all enforce). */
export async function createEquipmentSpec(payload: EquipmentSpecInsert): Promise<EquipmentSpec> {
  const { data, error } = await supabase
    .from("equipment_spec")
    .insert(payload as unknown as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as EquipmentSpec;
}

// ─── P1.6 report reads (date-range summary, /reports) ───────────────────
// ENV-PARITY-P1-006 (D1-2 additive section — the P1.4 precedent). The
// aggregation itself is pure client-side (lib/report-summary.ts, D1-1);
// these fetchers only range-fetch the EXISTING views' rows, inclusive both
// endpoints per the AppSheet range predicate (ref 1668–1675:
// [วันที่ บันทึก] >= Start AND <= End). water-supply.ts stays byte-untouched
// (P1.5 surface); hooks.ts untouched.

import type {
  ReportReadingRow,
  ReportMeterChainRow,
  ReportCriticalFlagRow,
  ReportWaterChainRow,
} from "./report-summary";

/**
 * Per-day recorded wastewater rows for the range — v_reading_with_computed
 * (the house detail view; r.* carries DO-1/2/3, pH, TDS-1/2, SV30, FreeCl,
 * wastewater_in, chlorine_used, excess_sludge_removed individually, which
 * v_dashboard_14day does not expose). Read-only.
 */
export async function fetchReadingDetailRange(
  startISO: string,
  endISO: string,
): Promise<ReportReadingRow[]> {
  const { data, error } = await supabase
    .from("v_reading_with_computed")
    .select(
      "id, reading_date, do_aeration, do_sedimentation, do_before_discharge, ph, free_chlorine, tds_aeration, tds_before_discharge, sv30, wastewater_in, chlorine_used, chlorine_mix_ratio, excess_sludge_removed",
    )
    .gte("reading_date", startISO)
    .lte("reading_date", endISO)
    .order("reading_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReportReadingRow[];
}

/**
 * Meter-chain rows for the range — v_reading_meter_chain (public
 * security_invoker façade, P1.4). View-computed deltas/volumes/real-chlorine
 * only; the report never re-derives them.
 */
export async function fetchMeterChainRange(
  startISO: string,
  endISO: string,
): Promise<ReportMeterChainRow[]> {
  const { data, error } = await supabase
    .from("v_reading_meter_chain")
    .select(
      "id, reading_date, delta_kwh, pump1_m3, pump2_m3, chlorine_used_real, meter_boundary_flag, meter_boundary_reason, spec_missing, spec_missing_kinds",
    )
    .gte("reading_date", startISO)
    .lte("reading_date", endISO)
    .order("reading_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReportMeterChainRow[];
}

/**
 * Critical-flag rows for the range — wastewater.v_reading_critical_flags
 * (P1.3 computed view; WO §2.4-4: threshold counts come from THIS view
 * only, never threshold_alert, never client-side re-derivation).
 *
 * RECORDED DEVIATION D1-5 (reviewer adjudicates): this view has NO public
 * PostgREST façade yet — unlike its siblings (public.v_dashboard_14day,
 * public.v_reading_meter_chain, public.v_daily_check_chain, all created by
 * their own lanes as `public.*` security_invoker façades; PostgREST serves
 * public only). Until the adjudicated façade amendment lands, this fetch
 * fails at runtime and the report renders an honest "not available" notice
 * — it never silently substitutes another surface.
 */
export async function fetchCriticalFlagsRange(
  startISO: string,
  endISO: string,
): Promise<ReportCriticalFlagRow[]> {
  const { data, error } = await supabase
    .from("v_reading_critical_flags")
    .select(
      "id, reading_date, critical_do1, critical_do2, critical_do3, critical_free_chlorine_low, critical_free_chlorine_high, critical_tds2, critical_ph, immediate_sv30, immediate_wastewater_in",
    )
    .gte("reading_date", startISO)
    .lte("reading_date", endISO)
    .order("reading_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReportCriticalFlagRow[];
}

/**
 * น้ำประปา chain rows for the range — public.v_daily_check_chain (P1.5
 * security_invoker façade). Read-only (WATER_SUPPLY_CHAIN_TABLE constant
 * lives in water-supply.ts, which this lane must not touch — the same
 * literal table name is pinned here with the cross-reference note).
 */
export async function fetchWaterSupplyChainRange(
  startISO: string,
  endISO: string,
): Promise<ReportWaterChainRow[]> {
  const { data, error } = await supabase
    .from("v_daily_check_chain")
    .select(
      "id, check_date, hour_work, water_in, water_in_estimate, chlorine_usage_realy, energy_use_estimate, hour_boundary_flag, spec_missing, spec_missing_kinds",
    )
    .gte("check_date", startISO)
    .lte("check_date", endISO)
    .order("check_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReportWaterChainRow[];
}

// ─── Write paths ────────────────────────────────────────────────────────

/** Create a new reading. Replaces /api/readings POST.
 *
 * ENV-PERF-001 (2026-11-12): the old client-side sequence — (1) insert
 * carbon_reading when electricity present, (2) insert reading, (3) insert
 * repair_request when abnormal — is now ONE atomic Postgres RPC
 * (`fn_create_reading(p_payload jsonb)`, migration
 * supabase/migrations/20261112000001_fn_create_reading.sql). The same
 * "logical transaction" the old comment intended is now enforced
 * server-side, and a failing repair_request step REJECTS here instead of
 * being swallowed with console.warn (honesty fix).
 *
 * Reported_by + location_id have NO default and NO BEFORE INSERT trigger
 * (live wastewater.reading has only trg_audit_log + trg_persist_threshold_alerts,
 * both AFTER) — they stay NULL when the payload omits them, same as the old
 * PostgREST path; abnormal_cause /
 * electricity_consumption / electricity_meter_value travel inside the
 * payload and are split off server-side.
 */
export async function createReading(payload: ReadingCreate): Promise<ReadingDetail> {
  const { data, error } = await supabase.rpc("fn_create_reading", {
    p_payload: payload as unknown as Record<string, unknown>,
  });
  if (error) throw new Error(error.message);
  return data as ReadingDetail;
}

/**
 * ENV-PARITY-P1-004 — sync the P1.1 `*_status` enum mirrors after a
 * create. fn_create_reading (P12.5, pre-dates the P1.1 status columns)
 * extracts a FIXED key list and drops the mirrors, and the RPC is outside
 * this lane's mutable scope — so the mirrors are synced by an immediately
 * following targeted UPDATE (same generic update path the edit flow uses;
 * booleans remain the source of truth, the mirrors are derived).
 *
 * Called by the create hook AFTER the row is durably saved: a failure is
 * returned as an honest WARNING string (never thrown, never silent — the
 * caller toasts it and a later edit-save re-syncs), because failing the
 * save UX here would misreport a saved reading as lost.
 */
export async function syncReadingStatusMirror(
  readingId: string,
  source: Record<string, unknown>
): Promise<string | null> {
  const mirror = pickStatusMirror(
    buildStatusMirror({
      screen_cleaned_coarse: (source.screen_cleaned_coarse as boolean | null) ?? null,
      screen_cleaned_fine: (source.screen_cleaned_fine as boolean | null) ?? null,
      pump1_running: (source.pump1_running as boolean | null) ?? null,
      pump2_running: (source.pump2_running as boolean | null) ?? null,
      aerator1_running: (source.aerator1_running as boolean | null) ?? null,
      aerator2_running: (source.aerator2_running as boolean | null) ?? null,
      sludge_pump1_running: (source.sludge_pump1_running as boolean | null) ?? null,
      sludge_pump2_running: (source.sludge_pump2_running as boolean | null) ?? null,
      chlorine_pump1_running: (source.chlorine_pump1_running as boolean | null) ?? null,
      chlorine_pump2_running: (source.chlorine_pump2_running as boolean | null) ?? null,
    })
  );
  if (Object.keys(mirror).length === 0) return null;
  const { error } = await supabase.from("reading").update(mirror).eq("id", readingId);
  if (error) {
    // Wording note: must NOT contain the success-toast phrase
    // "บันทึกรายการสำเร็จ" — both toasts can be on screen at once and the
    // warning must stay distinguishable (learned from the mobile e2e).
    return `ค่าสถานะเครื่องจักร (enum) ยังไม่ตรงกับปุ่มที่เลือก — รายการถูกจัดเก็บแล้ว แก้ไขรายการและกดบันทึกซ้ำเพื่อซิงค์ (${error.message})`;
  }
  return null;
}

export async function updateReading(id: string, payload: ReadingUpdate): Promise<ReadingDetail> {
  const { abnormal_cause, ...readingCols } = payload;
  // Don't overwrite nulls for unspecified fields — use only keys that exist.
  const updatePayload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(readingCols)) {
    if (v !== undefined) updatePayload[k] = v;
  }

  const { data, error } = await supabase
    .from("reading")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // If the update flipped system_operating to false + abnormal_cause is set,
  // also seed a repair_request (same as create).
  if (abnormal_cause && String(abnormal_cause).trim() && payload.system_operating === false) {
    await supabase.from("repair_request").insert({
      reading_id: id,
      cause: abnormal_cause,
      status: "open",
    });
  }

  return data as ReadingDetail;
}

export async function deleteReading(id: string): Promise<void> {
  const { error } = await supabase.from("reading").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Bulk insert wrapper used by the CSV import flow (P20a). Returns {error}
 * so the caller in csv-import.ts can keep going through batches without
 * throwing. The fn_persist_threshold_alerts trigger still fires per row
 * inside the batch, so threshold breaches from imported data get staged.
 *
 * P20a — additive only, no change to existing exports.
 */
export async function bulkInsertReadingRows(
  rows: Record<string, unknown>[]
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("reading").insert(rows);
  return { error: error?.message ?? null };
}

// ─── P2.2 extinguisher inspection flow (additive section — P1.4/P1.6
// precedent) ─────────────────────────────────────────────────────────────
// Reads/writes go through the NEW public security_invoker façade views
// (migration 20261116000005) — PostgREST exposes only `public`; base RLS
// (staff read / staff insert on the log; admin write on the master)
// applies to every row. The QR auto-fill RPC resolves a scanned payload
// to the master row + latest inspection + honest expiry status.

export interface ExtinguisherRow {
  legacy_row_id: string;
  location: string | null;
  extinguisher_type: string | null;
  photo_path: string | null;
  packed_date: string | null;
  expiry_date: string | null;
  size_label: string | null;
  source_provenance?: string;
  legacy_id?: string | null;
}

export interface ExtinguisherInspectionRow {
  id: string;
  legacy_id: string | null;
  inspection_date: string;
  extinguisher_id: string;
  location_snapshot: string | null;
  type_snapshot: string | null;
  packed_date_snapshot: string | null;
  chem_exp_snapshot: string | null;
  size_snapshot: string | null;
  pipe: string | null;
  handle: string | null;
  tank: string | null;
  pressure_gauge: string | null;
  barrier: string | null;
  breakdown_details: string | null;
  cause_of_damaged: string | null;
  inspector_id: string | null;
  source_provenance?: string;
  created_at?: string;
}

export type ExtinguisherInspectionInsert = Omit<ExtinguisherInspectionRow, "created_at">;

export type ExtinguisherMasterInsert = Omit<ExtinguisherRow, "source_provenance"> & {
  source_provenance?: string;
};

/** shape of safety.fn_resolve_extinguisher_qr's jsonb return */
export interface ExtinguisherResolveResult {
  master: {
    legacy_row_id: string;
    location: string | null;
    extinguisher_type: string | null;
    packed_date: string | null;
    expiry_date: string | null;
    size_label: string | null;
  };
  latest_inspection: {
    id: string;
    inspection_date: string;
    chem_exp_snapshot: string | null;
    pipe: string | null;
    handle: string | null;
    tank: string | null;
    pressure_gauge: string | null;
    barrier: string | null;
    breakdown_details: string | null;
    created_at: string;
  } | null;
  expiry_status: "หมดอายุ" | "ไม่หมดอายุ" | null;
}

const INSPECTOR_COLS = "id, full_name, position, status";

/**
 * Eligible-inspector lookup for the ผู้ตรวจสอบ picker. Selects the REAL
 * core.personnel columns (id uuid / full_name / position / status) —
 * deliberately NOT reusing fetchPersonnel(), whose `staff_code` column
 * does not exist on the live table (latent P1.4 mismatch recorded in the
 * handoff; outside this lane's scope to fix).
 */
export async function fetchInspectors(): Promise<PersonnelOut[]> {
  const { data, error } = await supabase
    .from("personnel")
    .select(INSPECTOR_COLS)
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as PersonnelOut[];
}

export async function fetchExtinguishers(): Promise<ExtinguisherRow[]> {
  const { data, error } = await supabase
    .from("fire_extinguisher")
    .select("*")
    .order("location");
  if (error) throw new Error(error.message);
  return (data ?? []) as ExtinguisherRow[];
}

export async function fetchExtinguisherInspections(limit = 50): Promise<ExtinguisherInspectionRow[]> {
  const { data, error } = await supabase
    .from("extinguisher_inspection")
    .select("*")
    .order("inspection_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ExtinguisherInspectionRow[];
}

export async function createExtinguisherInspection(
  payload: ExtinguisherInspectionInsert,
): Promise<ExtinguisherInspectionRow> {
  const { data, error } = await supabase
    .from("extinguisher_inspection")
    .insert(payload as unknown as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ExtinguisherInspectionRow;
}

/** Admin master entry (WO §6) — through the UNCHANGED P2.1 admin INSERT
 * policy; no new master policies. legacy_row_id/legacy_id are generated
 * UI-side (PackedUUID shape) and travel with the payload. */
export async function createExtinguisherMaster(payload: ExtinguisherMasterInsert): Promise<ExtinguisherRow> {
  const { data, error } = await supabase
    .from("fire_extinguisher")
    .insert(payload as unknown as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ExtinguisherRow;
}

/** QR auto-fill: resolve a scanned payload (PackedUUID or raw
 * legacy_row_id — the same column) via the RPC. The PostgREST error for
 * blank/unknown ids carries the verbatim Thai message
 * ('ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ') — surfaced as-is. */
export async function resolveExtinguisherQr(qr: string): Promise<ExtinguisherResolveResult> {
  const { data, error } = await supabase.rpc("fn_resolve_extinguisher_qr", { p_qr: qr });
  if (error) throw new Error(error.message);
  return data as ExtinguisherResolveResult;
}
