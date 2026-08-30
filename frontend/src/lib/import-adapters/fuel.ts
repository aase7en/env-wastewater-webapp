/** Fuel dispense adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

/**
 * FUEL-CORE-001 — the only imported fuel types the carbon rollup can match
 * to an emission factor (they mirror the canonical `carbon.source_type`
 * fuel values). Missing/blank stays `null` (unknown ≠ diesel); anything
 * else non-empty fails the row here, before any REST write.
 */
const CANONICAL_FUEL_TYPES = ["diesel", "gasoline", "lpg", "other"] as const;

function mapFuelType(raw: Record<string, unknown>): string | null {
  const token = str(raw["fuel_type"] ?? raw["type"]);
  if (token === null) return null;
  const normalized = token.toLowerCase();
  if (!(CANONICAL_FUEL_TYPES as readonly string[]).includes(normalized)) {
    throw new Error(
      `ประเภทน้ำมันไม่รองรับ (ต้องเป็น diesel/gasoline/lpg/other หรือเว้นว่าง): ${token}`,
    );
  }
  return normalized;
}

export const fuelAdapter: Adapter<{
  log_date: string;
  fuel_type?: string | null;
  litres?: number | null;
  meter_before?: number | null;
  meter_after?: number | null;
  vehicle_id?: string | null;
  cost_baht?: number | null;
}> = {
  moduleId: "fuel",
  requiredColumns: ["date"],
  mapRow(raw) {
    const d = date(raw["log_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      log_date: d,
      fuel_type: mapFuelType(raw),
      litres: num(raw["litres"] ?? raw["volume"] ?? raw["litre"]),
      meter_before: num(raw["meter_before"]),
      meter_after: num(raw["meter_after"]),
      vehicle_id: str(raw["vehicle_id"] ?? raw["plate"] ?? raw["ทะเบียน"]),
      cost_baht: num(raw["cost_baht"] ?? raw["cost"] ?? raw["price"]),
    };
  },
};
