/** Food lab test adapter. */
import type { Adapter } from "./types";
import { str, date } from "./types";

/**
 * FOOD-CORE-001 — canonical categorical honesty. Missing/blank
 * `sample_type`/`test_type` stay `null` (unknown ≠ น้ำประปา/total_coliform).
 * Only the canonical value sets below (mirroring the DB CHECK constraints
 * and the FoodPage selects) are accepted; the ONLY verified synonyms are
 * the A-Wiki food-entity display labels for the three test types — no
 * other synonym is invented. Anything else non-empty fails the row here,
 * before any REST write. `reagent_used` is never written by this adapter,
 * keeping the cross-domain chemical.movement decrement trigger dormant.
 */
const CANONICAL_SAMPLE_TYPES = ["น้ำประปา", "น้ำบาดาล", "อาหาร", "ผัก", "น้ำแข็ง"] as const;
const CANONICAL_TEST_TYPES = ["total_coliform", "e_coli", "fecal_coliform"] as const;
// Verified display labels (A-Wiki food entity page, 2026-09-02), lowercase.
const VERIFIED_TEST_LABELS: Record<string, string> = {
  "total coliform": "total_coliform",
  "e. coli": "e_coli",
  "fecal coliform": "fecal_coliform",
};

function mapSampleType(raw: Record<string, unknown>): string | null {
  const token = str(raw["sample_type"] ?? raw["type"] ?? raw["ตัวอย่าง"]);
  if (token === null) return null;
  if ((CANONICAL_SAMPLE_TYPES as readonly string[]).includes(token)) return token;
  throw new Error(
    `ประเภทตัวอย่างไม่รองรับ (ต้องเป็น น้ำประปา/น้ำบาดาล/อาหาร/ผัก/น้ำแข็ง หรือเว้นว่าง): ${token}`,
  );
}

function mapTestType(raw: Record<string, unknown>): string | null {
  const token = str(raw["test_type"] ?? raw["test"]);
  if (token === null) return null;
  const normalized = token.toLowerCase();
  if ((CANONICAL_TEST_TYPES as readonly string[]).includes(normalized)) return normalized;
  const label = VERIFIED_TEST_LABELS[normalized];
  if (label !== undefined) return label;
  throw new Error(
    `การทดสอบไม่รองรับ (ต้องเป็น total_coliform/e_coli/fecal_coliform หรือเว้นว่าง): ${token}`,
  );
}

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
      sample_type: mapSampleType(raw),
      test_type: mapTestType(raw),
      result: str(raw["result"] ?? raw["ผล"]),
      technician: str(raw["technician"] ?? raw["เทคนิค"]),
    };
  },
};
