/** Building inspection adapter. */
import type { Adapter } from "./types";
import { str, date } from "./types";

export const buildingAdapter: Adapter<{
  round_date: string;
  inspector?: string | null;
  findings?: string | null;
  issues_found?: boolean;
  repair_needed?: boolean;
  round_type?: string | null;
}> = {
  moduleId: "building",
  requiredColumns: ["date"],
  mapRow(raw) {
    const d = date(raw["round_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      round_date: d,
      inspector: str(raw["inspector"] ?? raw["ผู้ตรวจ"]),
      findings: str(raw["findings"] ?? raw["notes"]),
      issues_found: Boolean(raw["issues_found"] ?? raw["พบปัญหา"]),
      repair_needed: Boolean(raw["repair_needed"] ?? raw["ต้องซ่อม"]),
      round_type: str(raw["round_type"] ?? raw["type"]) ?? "monthly",
    };
  },
};
