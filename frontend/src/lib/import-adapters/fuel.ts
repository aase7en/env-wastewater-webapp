/** Fuel dispense adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

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
      fuel_type: str(raw["fuel_type"] ?? raw["type"]) ?? "diesel",
      litres: num(raw["litres"] ?? raw["volume"] ?? raw["litre"]),
      meter_before: num(raw["meter_before"]),
      meter_after: num(raw["meter_after"]),
      vehicle_id: str(raw["vehicle_id"] ?? raw["plate"] ?? raw["ทะเบียน"]),
      cost_baht: num(raw["cost_baht"] ?? raw["cost"] ?? raw["price"]),
    };
  },
};
