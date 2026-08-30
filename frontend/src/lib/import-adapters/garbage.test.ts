/**
 * GARBAGE-CORE-001 — canonical waste classification + carbon data honesty.
 *
 * Contracts under test:
 *
 * 1. Import adapter: `segregation_type` is the canonical classification.
 *    Missing/blank imports stay `null` (never fabricated into `general`);
 *    the four canonical English values pass (trim/case normalized); ONLY the
 *    verified Thai labels (ทั่วไป/ติดเชื้อ/รีไซเคิล/เคมี — A-Wiki garbage
 *    entity page) map to canonical English; any other non-empty token fails
 *    the row through the adapter's throw-based row-error path before any
 *    REST write.
 *
 * 2. Rollup migration static contract: the additive GARBAGE-CORE-001
 *    migration must (a) add an idempotent CHECK constraint enforcing the
 *    canonical value set on `garbage.collection_log.segregation_type`, and
 *    (b) redefine `carbon.v_unified_co2e`'s waste branch to read canonical
 *    `c.segregation_type` (never legacy `c.waste_type`), with explicit
 *    general/infectious/recyclable factor mapping and ELSE NULL — so
 *    `chemical`, missing, or unsupported classifications match NO factor
 *    (kg_co2e NULL = UNAVAILABLE) and are never silently mapped to the
 *    general-waste factor. Missing classification must not be labeled
 *    `waste_general`. Every non-Garbage UNION branch (including the merged
 *    FUEL-CORE-001 fuel join fix) stays equivalent; no data is mutated.
 *
 * 3. Type contract (checked by `tsc -b`, which vitest does not run): legacy
 *    `waste_type` must not be a writable field of `GarbageInput`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { garbageAdapter } from "./garbage";
import type { GarbageInput } from "../garbage";

const VALID_DATE = "2026-01-01"; // synthetic test-only value

function mapRow(raw: Record<string, unknown>) {
  return garbageAdapter.mapRow({ log_date: VALID_DATE, ...raw }, 0);
}

// GARBAGE-CORE-001 type contract: legacy `waste_type` must not be writable.
// RED at activation base: GarbageInput still includes waste_type, so tsc
// fails here. GREEN after the Omit fix in lib/garbage.ts.
type WasteTypeNotWritable = GarbageInput extends { waste_type: unknown } ? never : true;
const _wasteTypeNotWritable: WasteTypeNotWritable = true;
void _wasteTypeNotWritable;

describe("garbage adapter classification honesty (GARBAGE-CORE-001)", () => {
  it("missing segregation_type stays null — never fabricated into general", () => {
    expect(mapRow({}).segregation_type).toBeNull();
  });

  it("blank segregation_type variants stay null", () => {
    expect(mapRow({ segregation_type: "" }).segregation_type).toBeNull();
    expect(mapRow({ segregation_type: "   " }).segregation_type).toBeNull();
  });

  it("canonical English values are accepted as-is", () => {
    for (const t of ["general", "infectious", "recyclable", "chemical"]) {
      expect(mapRow({ segregation_type: t }).segregation_type).toBe(t);
    }
  });

  it("whitespace/case-equivalent canonical tokens normalize to canonical form", () => {
    expect(mapRow({ segregation_type: " General " }).segregation_type).toBe("general");
    expect(mapRow({ segregation_type: "INFECTIOUS" }).segregation_type).toBe("infectious");
    expect(mapRow({ segregation_type: "Recyclable" }).segregation_type).toBe("recyclable");
    expect(mapRow({ segregation_type: "CHEMICAL" }).segregation_type).toBe("chemical");
  });

  it("verified Thai labels map to canonical English", () => {
    expect(mapRow({ segregation_type: "ทั่วไป" }).segregation_type).toBe("general");
    expect(mapRow({ segregation_type: "ติดเชื้อ" }).segregation_type).toBe("infectious");
    expect(mapRow({ segregation_type: "รีไซเคิล" }).segregation_type).toBe("recyclable");
    expect(mapRow({ segregation_type: "เคมี" }).segregation_type).toBe("chemical");
  });

  it("unsupported non-empty tokens fail the row before any write", () => {
    for (const bad of ["hazardous", "ขยะอันตราย", "generalx", "organics"]) {
      expect(() => mapRow({ segregation_type: bad }), `token: ${bad}`).toThrowError(
        /ประเภทขยะไม่รองรับ/,
      );
    }
  });

  it("legacy waste_type is never written by the adapter", () => {
    const row = mapRow({ segregation_type: "ทั่วไป", type: "ติดเชื้อ" }) as Record<string, unknown>;
    expect(row).not.toHaveProperty("waste_type");
  });
});

describe("garbage rollup migration contract (GARBAGE-CORE-001)", () => {
  // __dirname = <repo>/frontend/src/lib/import-adapters → repo root is 4 up.
  const migrationsDir = join(__dirname, "..", "..", "..", "..", "supabase", "migrations");
  const fileName = readdirSync(migrationsDir).find((f) =>
    /garbage[_-]core[_-]001/i.test(f),
  );
  // Contract applies to EXECUTABLE SQL: strip `--` comments first.
  const sql = fileName
    ? readFileSync(join(migrationsDir, fileName), "utf-8")
        .replace(/--[^\n]*/g, " ")
        .replace(/\s+/g, " ")
    : null;

  it("additive hardening migration exists", () => {
    expect(fileName, `no *garbage-core-001* file under ${migrationsDir}`).toBeTruthy();
  });

  it("adds an idempotent canonical CHECK constraint on segregation_type", () => {
    expect(sql).toContain("ALTER TABLE garbage.collection_log");
    expect(sql).toContain("DROP CONSTRAINT IF EXISTS collection_log_segregation_type_check");
    expect(sql).toContain("ADD CONSTRAINT collection_log_segregation_type_check");
    expect(sql).toContain(
      "CHECK (segregation_type IS NULL OR segregation_type IN ('general','infectious','recyclable','chemical'))",
    );
  });

  it("alters no table other than garbage.collection_log (DROP+ADD constraint pair)", () => {
    expect(sql?.match(/ALTER TABLE garbage\.collection_log /g)?.length).toBe(2);
    expect(sql?.match(/ALTER TABLE (?!garbage\.collection_log )/g)).toBeNull();
  });

  it("redefines carbon.v_unified_co2e idempotently", () => {
    expect(sql).toContain("CREATE OR REPLACE VIEW carbon.v_unified_co2e");
  });

  it("waste branch reads canonical segregation_type, never legacy waste_type", () => {
    expect(sql).toContain("CASE c.segregation_type");
    expect(sql).not.toContain("CASE c.waste_type");
    expect(sql).toContain("COALESCE(c.segregation_type, 'unclassified')");
    expect(sql).not.toContain("COALESCE(c.waste_type");
  });

  it("maps only general/infectious/recyclable to factors — chemical/missing/unknown get NO factor", () => {
    expect(sql).toContain("WHEN 'general' THEN 'kg (general_waste)'");
    expect(sql).toContain("WHEN 'infectious' THEN 'kg (infectious_waste)'");
    expect(sql).toContain("WHEN 'recyclable' THEN 'kg (recyclable)'");
    expect(sql).toContain("ELSE NULL");
    expect(sql).not.toContain("ELSE 'kg (general_waste)'");
  });

  it("preserves the merged FUEL-CORE-001 fuel join fix and every non-garbage branch", () => {
    expect(sql).toContain("'electricity'");
    expect(sql).toContain("ef.unit = 'kWh'");
    expect(sql).toContain("ef.source::text = d.fuel_type"); // FUEL-CORE-001 fix stays
    expect(sql).toContain("ef.unit = 'L'");
    expect(sql).toContain("'garden_fuel'");
    expect(sql).toContain("ON ef.source = 'gasoline'");
    expect(sql).toContain("'kg (chlorine)'");
    expect(sql).toContain("m.direction = 'out'");
    expect(sql?.split("UNION ALL").length).toBe(5); // 5 branches
  });

  it("does not mutate emission-factor or application data", () => {
    expect(sql).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(sql).not.toMatch(/\bUPDATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\b/i);
  });
});
