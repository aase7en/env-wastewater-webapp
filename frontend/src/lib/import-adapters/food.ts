/** Food lab test adapter. */
import type { Adapter } from "./types";
import { str, date } from "./types";

export const foodAdapter: Adapter<{
  sample_date: string;
  sample_type?: string | null;
  test_type?: string | null;
  result?: string | null;
  technician?: string | null;
}> = {
  moduleId: "food",
  requiredColumns: ["date"],
  mapRow(raw) {
    const d = date(raw["sample_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      sample_date: d,
      sample_type: str(raw["sample_type"] ?? raw["type"] ?? raw["ตัวอย่าง"]) ?? "น้ำประปา",
      test_type: str(raw["test_type"] ?? raw["test"]) ?? "total_coliform",
      result: str(raw["result"] ?? raw["ผล"]),
      technician: str(raw["technician"] ?? raw["เทคนิค"]),
    };
  },
};
