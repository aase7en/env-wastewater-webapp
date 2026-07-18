/** Safety monthly check adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

export const safetyAdapter: Adapter<{
  check_date: string;
  extinguisher_inspected?: boolean;
  exit_light_functional?: boolean;
  extinguisher_count?: number | null;
  issues_found?: string | null;
}> = {
  moduleId: "safety",
  requiredColumns: ["date"],
  mapRow(raw) {
    const d = date(raw["check_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      check_date: d,
      extinguisher_inspected: Boolean(raw["extinguisher_inspected"] ?? raw["ถังดับเพลิง"]),
      exit_light_functional: Boolean(raw["exit_light_functional"] ?? raw["ไฟฉุกเฉิน"]),
      extinguisher_count: num(raw["extinguisher_count"] ?? raw["count"]),
      issues_found: str(raw["issues_found"] ?? raw["issues"]),
    };
  },
};
