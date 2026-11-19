/**
 * ENV-PARITY-P3-005 — RED-first unit suite for the manuals lib (lane P3.5):
 * the §3.22/§3.26 manual-shelf tables (คู่มือ + คู่มือน้ำประปา) as
 * link-only metadata — the D1-4 file semantics (new-tab anchors ONLY for
 * absolute http(s) refs; legacy relative Drive refs render as plain text
 * + the honest note), payload honesty (blanks ⇒ NULL), the honest
 * water-supply empty state, and the NO-BINARY invariant (the lib moves
 * metadata only — it never fetches/embeds/decodes file content).
 *
 * D2 RED: this file fails-to-collect while `./manuals` does not exist
 * (the honest new-file RED mode — P1.5/P2.4/P3.1–P3.4 precedent).
 */
import { describe, expect, it } from "vitest";
import {
  EMPTY_WATER_SUPPLY_LABEL,
  LEGACY_DRIVE_NOTE,
  MANUAL_TABLES,
  buildManualPayload,
  fileLinkKind,
  isAbsoluteHttpUrl,
} from "./manuals";

describe("D1-4 link-display predicate — absolute http(s) only, never a fake link", () => {
  it("isAbsoluteHttpUrl: absolute https/http refs only (case-insensitive scheme)", () => {
    expect(isAbsoluteHttpUrl("https://example.com/manual.pdf")).toBe(true);
    expect(isAbsoluteHttpUrl("http://example.com/manual.pdf")).toBe(true);
    expect(isAbsoluteHttpUrl("HTTPS://example.com/manual.pdf")).toBe(true);
    expect(isAbsoluteHttpUrl(null)).toBe(false);
    expect(isAbsoluteHttpUrl("")).toBe(false);
  });

  it("legacy relative Drive refs are NOT links (unknown ≠ clickable)", () => {
    expect(isAbsoluteHttpUrl("คู่มือ_Files_/c845e81a.link.062513.pdf")).toBe(false);
    expect(isAbsoluteHttpUrl("คู่มือ_Images/c845e81a.รูป.062513.jpg")).toBe(false);
    expect(isAbsoluteHttpUrl("www.example.com/manual.pdf")).toBe(false);
    expect(isAbsoluteHttpUrl("/docs/manual.pdf")).toBe(false);
    expect(isAbsoluteHttpUrl("ftp://example.com/manual.pdf")).toBe(false);
  });

  it("fileLinkKind: external → anchor; legacy → text + note; blank → none", () => {
    expect(fileLinkKind("https://example.com/m.pdf")).toBe("external");
    expect(fileLinkKind("คู่มือ_Files_/cb424d42.link.044324.สมพงษ.pdf")).toBe("legacy");
    expect(fileLinkKind("80-กรมควบคุมมลพิษ.pdf")).toBe("legacy");
    expect(fileLinkKind(null)).toBe("none");
    expect(fileLinkKind("   ")).toBe("none");
  });

  it("the honest legacy-ref note ships verbatim (WO §4-2)", () => {
    expect(LEGACY_DRIVE_NOTE).toBe("คำเตือน: ไฟล์อยู่ในไดรฟ์ของระบบเดิม");
  });
});

describe("table binding — the row's คู่มือ ×2 verbatim (D1-2)", () => {
  it("the two domains map to the two AppSheet tables ×2 (never one shared table)", () => {
    expect(Object.keys(MANUAL_TABLES).sort()).toEqual(["watersupply", "wastewater"].sort());
    expect(MANUAL_TABLES.wastewater).toBe("manual_wastewater");
    expect(MANUAL_TABLES.watersupply).toBe("manual_water_supply");
  });

  it("the water-supply empty state ships verbatim — never a fabricated row (D1-10)", () => {
    expect(EMPTY_WATER_SUPPLY_LABEL).toBe("ยังไม่มีข้อมูล — รอแหล่งข้อมูลจากเจ้าของระบบเดิม");
  });
});

describe("buildManualPayload — form honesty (blanks ⇒ NULL)", () => {
  it("blank optional refs become NULL — never '' (unknown ≠ fabricated)", () => {
    const payload = buildManualPayload({ title: "มาตรฐานน้ำทิ้ง", image_ref: "  ", file_ref: "" });
    expect(payload.title).toBe("มาตรฐานน้ำทิ้ง");
    expect(payload.image_ref).toBeNull();
    expect(payload.file_ref).toBeNull();
  });

  it("trims verbatim strings but never rewrites them", () => {
    const payload = buildManualPayload({
      title: " คู่มือการดำเนินงานตามมาตรา 80 ",
      image_ref: " คู่มือ_Images/1b1dc08b.รูป.082856.jpg ",
      file_ref: "คู่มือ_Files_/1b1dc08b.link.082857.80-กรมควบคุมมลพิษ.pdf",
    });
    expect(payload.title).toBe("คู่มือการดำเนินงานตามมาตรา 80");
    expect(payload.image_ref).toBe("คู่มือ_Images/1b1dc08b.รูป.082856.jpg");
    expect(payload.file_ref).toBe("คู่มือ_Files_/1b1dc08b.link.082857.80-กรมควบคุมมลพิษ.pdf");
  });

  it("an empty title throws — รายการ is the AppSheet Label (required)", () => {
    expect(() => buildManualPayload({ title: "   ", image_ref: null, file_ref: null })).toThrow();
    expect(() => buildManualPayload({ title: "", image_ref: null, file_ref: null })).toThrow();
  });

  it("NEW admin entries may carry an absolute http(s) URL in file_ref (D1-4 proposed)", () => {
    const payload = buildManualPayload({
      title: "คู่มือทดสอบ",
      image_ref: null,
      file_ref: "https://example.com/manual.pdf",
    });
    expect(payload.file_ref).toBe("https://example.com/manual.pdf");
  });
});

describe("NO-BINARY invariant — link-only metadata, never file content (D1-4)", () => {
  it("the lib exposes no blob/base64/file-content loader", async () => {
    const mod = await import("./manuals");
    const exports = Object.keys(mod);
    for (const name of exports) {
      const lower = name.toLowerCase();
      expect(lower).not.toContain("blob");
      expect(lower).not.toContain("base64");
      expect(lower).not.toContain("arraybuffer");
      expect(lower).not.toContain("download");
    }
  });

  it("no export returns or accepts binary content — metadata strings only", () => {
    const payload = buildManualPayload({
      title: "ทดสอบ",
      image_ref: "คู่มือ_Images/x.รูป.010101.jpg",
      file_ref: "คู่มือ_Files_/x.link.010101.pdf",
    });
    // every payload value is a string or null — never an ArrayBuffer/Blob
    for (const v of Object.values(payload)) {
      expect(v === null || typeof v === "string").toBe(true);
    }
  });
});
