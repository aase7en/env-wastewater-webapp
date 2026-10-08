/**
 * Building inspection adapter.
 *
 * ENV-BUILDING-REPAIR-001 C1 (2026-10-08, clause 9): booleans parse
 * STRICTLY — only the canonical Thai/English token sets are accepted;
 * anything else (including "n/a", "2", or blank-with-content) throws
 * the row through the adapter's row-error path so the preview shows it
 * and an operator must fix or explicitly promote it. Never truthy-
 * coerce: the previous `Boolean(raw)` turned the strings "false" and
 * "0" into true.
 */
import type { Adapter } from "./types";
import { str, date } from "./types";

const TRUE_TOKENS = new Set(["true", "1", "yes", "ใช่", "มี"]);
const FALSE_TOKENS = new Set(["false", "0", "no", "ไม่", "ไม่มี"]);

export function parseBuildingImportBoolean(raw: unknown, column: string): boolean {
  if (typeof raw === "boolean") return raw;
  if (typeof raw !== "string") {
    throw new Error(`คอลัมน์ ${column} ต้องเป็น true/false เท่านั้น`);
  }
  const token = raw.trim().toLowerCase();
  if (TRUE_TOKENS.has(token)) return true;
  if (FALSE_TOKENS.has(token)) return false;
  throw new Error(
    `คอลัมน์ ${column} อ่านค่าไม่ได้ ("${raw.trim()}") — ใช้ได้เฉพาะ true/false/1/0/yes/no/ใช่/ไม่/มี/ไม่มี`,
  );
}

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
      issues_found: (() => {
        const v = raw["issues_found"] ?? raw["พบปัญหา"];
        return v === undefined || v === null || v === ""
          ? false
          : parseBuildingImportBoolean(v, "พบปัญหา/issues_found");
      })(),
      repair_needed: (() => {
        const v = raw["repair_needed"] ?? raw["ต้องซ่อม"];
        if (v === undefined || v === null || v === "") return false;
        const parsed = parseBuildingImportBoolean(v, "ต้องซ่อม/repair_needed");
        // ENV-BUILDING-REPAIR-001 C1 clause 9: imported operational TRUE
        // rows are NEVER auto-issued. They are rejected here so the row
        // lands in the preview error list; an operator promotes them
        // through the SAME server command (BuildingPage submit ->
        // create_building_repair RPC) — no silent promotion, no orphan.
        if (parsed === true) {
          throw new Error(
            "แถวนี้ระบุ 'ต้องซ่อม' — ระบบไม่นำเข้าอัตโนมัติ กรุณาบันทึกผ่านหน้า ตรวจอาคารสถานที่ เพื่อสร้างใบแจ้งซ่อมที่เชื่อมโยงถูกต้อง",
          );
        }
        return false;
      })(),
      round_type: str(raw["round_type"] ?? raw["type"]) ?? "monthly",
    };
  },
};
