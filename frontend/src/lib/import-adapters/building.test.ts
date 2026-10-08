/**
 * ENV-BUILDING-REPAIR-001 C1 — D5 strict boolean contract for the
 * Building import adapter (the authoritative parsing seam).
 *
 * Mirrors the D2 contract in scripts/building_repair_contract.py:
 * only the canonical Thai/English token sets parse; the historical
 * truthy-coercion defect ("false"/"0" read as true) is forbidden;
 * unrecognized tokens throw the row. Clause 9: imported operational
 * TRUE rows are rejected (preview-visible) — promotion goes through
 * the BuildingPage RPC, never a direct import.
 */
import { describe, expect, it } from "vitest";
import { buildingAdapter, parseBuildingImportBoolean } from "./building";

function mapRow(raw: Record<string, unknown>) {
  return buildingAdapter.mapRow({ date: "2026-10-08", ...raw }, 0);
}

describe("parseBuildingImportBoolean", () => {
  it("accepts the canonical true tokens", () => {
    for (const t of ["true", "TRUE", " 1 ", "yes", "ใช่", "มี"]) {
      expect(parseBuildingImportBoolean(t, "c")).toBe(true);
    }
  });

  it("parses false tokens as FALSE — never truthy (the adjacent defect)", () => {
    for (const t of ["false", "FALSE", " 0 ", "no", "ไม่", "ไม่มี"]) {
      expect(parseBuildingImportBoolean(t, "c")).toBe(false);
    }
  });

  it("throws on unrecognized tokens — strict, never coerced", () => {
    for (const t of ["n/a", "-", "2", "unknown", "จริง", "พบ"]) {
      expect(() => parseBuildingImportBoolean(t, "c")).toThrow();
    }
  });

  it("accepts NUMERIC 0/1 from CSV dynamicTyping / XLSX cells (D8 R3 P2-8)", () => {
    expect(parseBuildingImportBoolean(1, "c")).toBe(true);
    expect(parseBuildingImportBoolean(0, "c")).toBe(false);
    expect(() => parseBuildingImportBoolean(2, "c")).toThrow();
  });
});

describe("buildingAdapter.mapRow", () => {
  it("keeps booleans optional-blank as false without throwing", () => {
    const row = mapRow({});
    expect(row.issues_found).toBe(false);
    expect(row.repair_needed).toBe(false);
  });

  it("parses the Thai columns strictly", () => {
    expect(mapRow({ พบปัญหา: "ไม่มี", ต้องซ่อม: "ไม่" }).repair_needed).toBe(false);
    expect(mapRow({ ต้องซ่อม: "ไม่มี" }).repair_needed).toBe(false);
  });

  it("throws the row when the boolean token is unrecognized", () => {
    expect(() => mapRow({ repair_needed: "n/a" })).toThrow(
      /ต้องซ่อม\/repair_needed/,
    );
  });

  it("regression: CSV 'false'/'0' strings parse as FALSE (the old defect)", () => {
    expect(mapRow({ issues_found: "false" }).issues_found).toBe(false);
    expect(mapRow({ repair_needed: "0" }).repair_needed).toBe(false);
  });

  it("regression: NUMERIC cells — issues_found=1 imports, repair_needed=1 rejected (clause 9)", () => {
    expect(mapRow({ issues_found: 1 }).issues_found).toBe(true);
    expect(() => mapRow({ repair_needed: 1 })).toThrow(/หน้า ตรวจอาคารสถานที่/);
    expect(mapRow({ repair_needed: 0 }).repair_needed).toBe(false);
  });

  it("clause 9: imported repair-needed TRUE rows are rejected — never auto-issued", () => {
    for (const v of ["true", "1", "ใช่", "มี"]) {
      expect(() => mapRow({ repair_needed: v })).toThrow(/หน้า ตรวจอาคารสถานที่/);
    }
  });

  it("issues_found TRUE without repair_needed remains importable (no repair implied)", () => {
    const row = mapRow({ issues_found: "true" });
    expect(row.issues_found).toBe(true);
    expect(row.repair_needed).toBe(false);
  });
});
