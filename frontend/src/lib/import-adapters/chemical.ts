/** Chemical movement adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

export const chemicalMovementAdapter: Adapter<{
  movement_date: string;
  chemical_name: string;
  direction: "in" | "out";
  quantity: number;
  unit?: string;
  purpose?: string | null;
}> = {
  moduleId: "chemical",
  requiredColumns: ["date", "name"],
  mapRow(raw) {
    const d = date(raw["movement_date"] ?? raw["date"] ?? raw["วันที่"]);
    if (!d) throw new Error("วันที่ไม่ถูกต้อง");
    const name = str(raw["chemical_name"] ?? raw["name"] ?? raw["เคมี"]);
    if (!name) throw new Error("ชื่อเคมีจำเป็น");
    const qty = num(raw["quantity"] ?? raw["qty"] ?? raw["จำนวน"]);
    if (qty === null) throw new Error("จำนวนไม่ถูกต้อง");
    const dir = String(raw["direction"] ?? raw["ทิศ"] ?? "in").toLowerCase();
    return {
      movement_date: d,
      chemical_name: name,
      direction: dir.startsWith("out") ? "out" : "in",
      quantity: qty,
      unit: str(raw["unit"] ?? raw["หน่วย"]) ?? "kg",
      purpose: str(raw["purpose"] ?? raw["วัตถุประสงค์"]),
    };
  },
};
