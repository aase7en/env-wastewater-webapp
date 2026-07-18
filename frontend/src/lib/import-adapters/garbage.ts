/** Garbage collection adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

export const garbageAdapter: Adapter<{
  log_date: string;
  segregation_type?: string | null;
  weight_kg?: number | null;
  disposal_route?: string | null;
  contractor?: string | null;
}> = {
  moduleId: "garbage",
  requiredColumns: ["date"],
  mapRow(raw) {
    const d = date(raw["log_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      log_date: d,
      segregation_type: str(raw["segregation_type"] ?? raw["type"] ?? raw["ประเภท"]) ?? "general",
      weight_kg: num(raw["weight_kg"] ?? raw["weight"] ?? raw["kg"]),
      disposal_route: str(raw["disposal_route"] ?? raw["route"]),
      contractor: str(raw["contractor"]),
    };
  },
};
