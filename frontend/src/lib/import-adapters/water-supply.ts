/** Water supply (groundwater) adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

export const waterSupplyAdapter: Adapter<{
  check_date: string;
  ph?: number | null;
  free_chlorine_residual?: number | null;
  turbidity?: number | null;
  total_coliform?: string | null;
  note?: string | null;
}> = {
  moduleId: "water_supply",
  requiredColumns: ["date"],
  mapRow(raw) {
    const d = date(raw["check_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      check_date: d,
      ph: num(raw["ph"] ?? raw["pH"]),
      free_chlorine_residual: num(raw["free_chlorine_residual"] ?? raw["chlorine"]),
      turbidity: num(raw["turbidity"] ?? raw["ntu"]),
      total_coliform: str(raw["total_coliform"] ?? raw["coliform"]),
      note: str(raw["note"]),
    };
  },
};
