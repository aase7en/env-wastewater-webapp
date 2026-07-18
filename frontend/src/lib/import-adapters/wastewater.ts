/** Wastewater adapter — imports daily reading rows. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

export const wastewaterAdapter: Adapter<{
  reading_date: string;
  do_aeration?: number | null;
  do_sedimentation?: number | null;
  ph?: number | null;
  tds_aeration?: number | null;
  free_chlorine?: number | null;
  note?: string | null;
}> = {
  moduleId: "wastewater",
  requiredColumns: ["date"],
  optionalColumns: ["do", "ph", "tds", "chlorine", "note"],
  mapRow(raw) {
    const d = date(raw["reading_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    return {
      reading_date: d,
      do_aeration: num(raw["do_aeration"] ?? raw["do"] ?? raw["DO"]),
      do_sedimentation: num(raw["do_sedimentation"]),
      ph: num(raw["ph"] ?? raw["pH"]),
      tds_aeration: num(raw["tds_aeration"] ?? raw["tds"]),
      free_chlorine: num(raw["free_chlorine"] ?? raw["chlorine"]),
      note: str(raw["note"] ?? raw["หมายเหตุ"]),
    };
  },
};
