/**
 * ENV-PARITY-P3-003 — the maintenance/calibration lib (lane P3.3): log
 * reads/entry + the per-tool ครั้งล่าสุด grouping. Track Z owns logic;
 * Track F owns polish.
 *
 * Surface: public.item_calibration (security_invoker view over
 * core.item_calibration — migration 20261118000005_parity_p3_003.sql).
 *
 * Ground truth: reference 12 §3.30 `maintenance` (READ-ONLY doc, ref
 * 4864-4884 — 7 columns, key `maintenanceID`, the ONLY formula being
 * `Cal_date` Init `TODAY()`) + the sheet-side `maintaining` tab (the
 * guarded 11-row seed; compare_ref carried verbatim in cal_result per the
 * D1-2 ruling).
 *
 * Honesty rules (WO §4/§5 + the D2 rulings):
 *   - D1-5: NO next-due is computed anywhere in this lib — the AppSheet
 *     table has no next-due column or formula, and the maintaining cycle
 *     fields (calibrate_range/calibrate_unit) are MEASURED VALUES
 *     (12.7 % / 319.0 ppm / 7.1 pH …), not intervals. The UI shows
 *     ครั้งล่าสุด + จำนวนครั้ง per tool and states the absence honestly.
 *     NEXT_DUE_PINNED_ABSENT pins this contract.
 *   - Verbatim validations = the §3.30 pins ONLY (Cal_date defaults to
 *     today). Every other validation is house-level, never presented as
 *     AppSheet.
 *   - blanks ⇒ NULL (unknown ≠ ''); a blank result renders ยังไม่ทราบ,
 *     never ผ่าน; พ.ศ. user-facing dates are the render layer's job
 *     (lib/utils thaiDate), storage is CE ISO.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { toLocalISODate } from "./utils";

// ─── Honesty pins ────────────────────────────────────────────────────────

/** D1-5 (D2 ruling): no next-due computation exists in this lib BY DESIGN.
 * The legacy system has no next-due counterpart; ENV must not invent one. */
export const NEXT_DUE_PINNED_ABSENT = true as const;

/** The verbatim honest empty state (WO §5). */
export const EMPTY_CALIBRATIONS_LABEL = "ยังไม่มีรายการสอบเทียบ";

// ─── Row / form types ────────────────────────────────────────────────────

export interface CalibrationRow {
  id: string;
  item_id: string | null;
  tool_legacy_id: string | null;
  item_name: string | null;
  calibration_date: string;
  cal_method: string | null;
  cal_result: string | null;
  calibrate_range: string | null;
  calibrate_unit: string | null;
  source_provenance: string | null;
  legacy_id: string | null;
  note: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface CalibrationForm {
  item_id: string;
  tool_legacy_id: string;
  item_name: string;
  calibration_date: string;
  cal_method: string;
  cal_result: string;
  calibrate_range: string;
  calibrate_unit: string;
}

/** Local-tz today (the Cal_date Init TODAY() translation — never the UTC
 * slice; the toLocalISODate off-by-one fix applies to form defaults). */
export function todayISO(): string {
  return toLocalISODate();
}

const blankToNull = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

/**
 * Form → payload. The ONLY verbatim AppSheet validation is the Cal_date
 * Init TODAY() default (the column is NOT NULL in ENV too, so a cleared
 * date is rejected — house-level, mirroring the same pin). Everything else:
 * blanks ⇒ NULL. House-level guard (recorded as house-level, never as
 * AppSheet): an entry must carry at least one tool identity
 * (item_id / tool_legacy_id / item_name) — a calibration of nothing is
 * not a record.
 */
export function buildCalibrationPayload(
  form: Partial<CalibrationForm>
): Record<string, unknown> {
  const date = blankToNull(form.calibration_date) ?? todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      "วันที่สอบเทียบต้องเป็นวันที่ (ค่าเริ่มต้นคือวันนี้ ตามระบบเดิม Cal_date = TODAY())"
    );
  }
  const item_id = blankToNull(form.item_id);
  const tool_legacy_id = blankToNull(form.tool_legacy_id);
  const item_name = blankToNull(form.item_name);
  if (!item_id && !tool_legacy_id && !item_name) {
    throw new Error(
      "ต้องระบุเครื่องมืออย่างน้อยหนึ่งช่อง (อุปกรณ์ในระบบ / รหัสเครื่องมือเดิม / ชื่อรายการ) — ระบบไม่บันทึกรายการสอบเทียบของ 'ไม่มีเครื่องมือ'"
    );
  }
  return {
    item_id,
    tool_legacy_id,
    item_name,
    calibration_date: date,
    cal_method: blankToNull(form.cal_method),
    cal_result: blankToNull(form.cal_result),
    calibrate_range: blankToNull(form.calibrate_range),
    calibrate_unit: blankToNull(form.calibrate_unit),
    source_provenance: "manual admin entry (ENV-PARITY-P3-003 calibration UI)",
  };
}

// ─── Reads / writes (RLS gates: SELECT+INSERT staff-or-admin) ────────────

const CALIBRATION_COLUMNS =
  "id, item_id, tool_legacy_id, item_name, calibration_date, cal_method, cal_result, calibrate_range, calibrate_unit, source_provenance, legacy_id, note, recorded_by, created_at";

export function useCalibrations() {
  const q = useQuery({
    queryKey: ["item-calibrations"] as const,
    queryFn: async (): Promise<CalibrationRow[]> => {
      const { data, error } = await supabase
        .from("item_calibration")
        .select(CALIBRATION_COLUMNS)
        .order("calibration_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as CalibrationRow[];
    },
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

/** The core.item picker (parity binding for InventoryID). Honest empty
 * state when the master is empty — core.item is 0 rows at base; never a
 * fabricated option list. */
export function useItems() {
  const q = useQuery({
    queryKey: ["core-items-picker"] as const,
    queryFn: async (): Promise<{ id: string; name: string; legacy_id: string | null }[]> => {
      const { data, error } = await supabase
        .from("item")
        .select("id, name, legacy_id")
        .order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; name: string; legacy_id: string | null }[];
    },
  });
  return { data: q.data ?? [], loading: q.isLoading, error: q.error?.message ?? null };
}

export async function createCalibration(payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("item_calibration").insert(payload);
  if (error) throw new Error(error.message);
}

// ─── Display-time grouping (D1-5: ครั้งล่าสุด + จำนวนครั้ง — NO next-due) ──

export interface ToolCalibrationSummary {
  key: string;
  tool_legacy_id: string | null;
  item_name: string | null;
  latest_date: string;
  count: number;
}

/** Group rows per tool identity: ครั้งล่าสุด + จำนวนครั้ง. Rows sharing an
 * explicit tool_legacy_id (or, failing that, the same item_id/item_name)
 * group together; rows with NO identity stay their own entries (never
 * merged into a guessed tool). Latest-first order. Display-time only —
 * nothing here is persisted. */
export function latestByTool(
  rows: Pick<CalibrationRow, "id" | "item_id" | "tool_legacy_id" | "item_name" | "calibration_date">[]
): ToolCalibrationSummary[] {
  type GroupableRow = Pick<
    CalibrationRow,
    "id" | "item_id" | "tool_legacy_id" | "item_name" | "calibration_date"
  >;
  const keyOf = (r: GroupableRow) =>
    r.tool_legacy_id ?? r.item_id ?? r.item_name ?? `row:${r.id}`;
  const acc = new Map<string, ToolCalibrationSummary>();
  for (const r of rows) {
    const key = keyOf(r);
    const cur = acc.get(key);
    if (!cur) {
      acc.set(key, {
        key,
        tool_legacy_id: r.tool_legacy_id,
        item_name: r.item_name,
        latest_date: r.calibration_date,
        count: 1,
      });
    } else {
      cur.count += 1;
      if (r.calibration_date > cur.latest_date) cur.latest_date = r.calibration_date;
    }
  }
  return [...acc.values()].sort(
    (a, b) => (a.latest_date < b.latest_date ? 1 : a.latest_date > b.latest_date ? -1 : 0)
  );
}
