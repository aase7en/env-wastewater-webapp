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
  const { data, error } = await supabase
    .from("v_dashboard_14day")
    .select(
      "reading_date, do_average, ph, free_chlorine, tds_aeration, water_used_total, wastewater_in, system_operating, wastewater_discharged, do_alert, chlorine_alert, ph_alert"
    )
    .gte("reading_date", cutoff.toISOString().slice(0, 10))
    .order("reading_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DashboardRow[];
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
 * Reported_by + location_id are filled by a BEFORE INSERT trigger or by
 * default to the current user / WWTP-1. abnormal_cause (when
 * system_operating=false, SPEC §6) is split off: if present, this helper
 * also inserts a core.repair_request row in the same call sequence.
 */
export async function createReading(payload: ReadingCreate): Promise<ReadingDetail> {
  // Strip abnormal_cause — it's not a column on wastewater.reading; it seeds
  // a repair_request row in the same logical transaction.
  const { abnormal_cause, electricity_consumption, electricity_meter_value, ...readingCols } = payload;

  // 1. Insert the carbon.reading row first (if electricity data present).
  let carbonReadingId: string | null = null;
  if (electricity_meter_value !== null && electricity_meter_value !== undefined && electricity_meter_value !== "") {
    const { data: carbon, error: carbonErr } = await supabase
      .from("carbon_reading") // PostgREST exposes tables as snake_case singular by convention
      .insert({
        meter_id: "b6be4c99-c83a-43f7-b765-72286cc78bd0", // P5b fixed meter
        reading_date: readingCols.reading_date,
        meter_value: electricity_meter_value,
        consumption: electricity_consumption,
        location_id: null, // defaults via trigger
        input_source: "manual",
      })
      .select("id")
      .single();
    if (carbonErr) throw new Error(`carbon insert failed: ${carbonErr.message}`);
    carbonReadingId = carbon.id;
  }

  // 2. Insert wastewater.reading.
  const insertPayload = {
    ...readingCols,
    carbon_reading_id: carbonReadingId,
    input_source: "manual",
  };
  const { data: reading, error: readingErr } = await supabase
    .from("reading")
    .insert(insertPayload)
    .select("*")
    .single();
  if (readingErr) throw new Error(readingErr.message);

  // 3. If abnormal_cause provided, seed a repair_request in the same flow.
  if (abnormal_cause && String(abnormal_cause).trim()) {
    // repair_request has no `reported_date` column — `created_at` defaults
    // to now() server-side. Don't send phantom field (silently swallowed).
    const { error: repairErr } = await supabase.from("repair_request").insert({
      reading_id: reading.id,
      cause: abnormal_cause,
      status: "open",
    });
    if (repairErr) {
      // Don't fail the whole create — the reading succeeded; log and continue.
      console.warn("repair_request insert failed:", repairErr.message);
    }
  }

  return reading as ReadingDetail;
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
