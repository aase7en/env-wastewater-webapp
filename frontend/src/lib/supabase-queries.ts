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
