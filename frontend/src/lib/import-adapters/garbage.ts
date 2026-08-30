/** Garbage collection adapter. */
import type { Adapter } from "./types";
import { num, str, date } from "./types";

/**
 * GARBAGE-CORE-001 — `segregation_type` is the canonical classification.
 * Only these four values (mirroring the DB CHECK constraint) are accepted;
 * missing/blank stays `null` (unknown ≠ general). The Thai labels below are
 * the ONLY verified synonyms (A-Wiki garbage entity page, 2026-08-31) — no
 * other synonym is invented. Anything else non-empty fails the row here,
 * before any REST write. Legacy `waste_type` is never written.
 */
const CANONICAL_SEGREGATION = ["general", "infectious", "recyclable", "chemical"] as const;
const VERIFIED_THAI_LABELS: Record<string, string> = {
  "ทั่วไป": "general",
  "ติดเชื้อ": "infectious",
  "รีไซเคิล": "recyclable",
  "เคมี": "chemical",
};

function mapSegregationType(raw: Record<string, unknown>): string | null {
  const token = str(raw["segregation_type"] ?? raw["type"] ?? raw["ประเภท"]);
  if (token === null) return null;
  const normalized = token.toLowerCase();
  if ((CANONICAL_SEGREGATION as readonly string[]).includes(normalized)) return normalized;
  const thai = VERIFIED_THAI_LABELS[token];
  if (thai !== undefined) return thai;
  throw new Error(
    `ประเภทขยะไม่รองรับ (ต้องเป็น general/infectious/recyclable/chemical หรือเว้นว่าง): ${token}`,
  );
}

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
      segregation_type: mapSegregationType(raw),
      weight_kg: num(raw["weight_kg"] ?? raw["weight"] ?? raw["kg"]),
      disposal_route: str(raw["disposal_route"] ?? raw["route"]),
      contractor: str(raw["contractor"]),
    };
  },
};
