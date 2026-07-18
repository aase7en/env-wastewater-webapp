/** Garden work round adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

export const gardenAdapter: Adapter<{
  round_date: string;
  work_type?: string | null;
  area_sqm?: number | null;
  worker_count?: number | null;
  fuel_used_l?: number | null;
}> = {
  moduleId: "garden",
  requiredColumns: ["date"],
  mapRow(raw) {
    const d = date(raw["round_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      round_date: d,
      work_type: str(raw["work_type"] ?? raw["type"] ?? raw["งาน"]) ?? "ตัดหญ้า",
      area_sqm: num(raw["area_sqm"] ?? raw["area"]),
      worker_count: num(raw["worker_count"] ?? raw["workers"]),
      fuel_used_l: num(raw["fuel_used_l"] ?? raw["fuel"]),
    };
  },
};
