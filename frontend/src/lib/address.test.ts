/**
 * ENV-PARITY-P3-005 — RED-first unit suite for the address lib (lane P3.5):
 * the §3.6 report-header reference table (8 cols, key TambonID) as
 * `core.address` — the D1-5/D1-9 Address_Key virtual semantics (display-
 * time concatenation ONLY, never stored/generated), the P2.3 float-id
 * integer-coercion lesson (sheet floats 910104.0 → bigint 910104),
 * client-side census search + pagination (7,436 rows are never rendered
 * unpaginated), and payload honesty (blanks ⇒ NULL; integer-coerced ids).
 *
 * D2 RED: this file fails-to-collect while `./address` does not exist
 * (the honest new-file RED mode — P1.5/P2.4/P3.1–P3.4 precedent).
 */
import { describe, expect, it } from "vitest";
import {
  ADDRESS_PAGE_SIZE,
  type AddressRow,
  addressKey,
  buildAddressPayload,
  coerceAddressInt,
  filterAddressRows,
  paginateAddressRows,
} from "./address";

/** A verbatim census spot row (markad workbook tab address, R2 receipt):
 *  610101 อุทัยใหม่ / อำเภอเมืองอุทัยธานี / อุทัยธานี. */
const UTHAI_ROW: AddressRow = {
  id: "00000000-0000-0000-0000-00000000a001",
  tambon_id: 610101,
  tambon_thai: "อุทัยใหม่",
  district_id: 6101,
  district_thai: "อำเภอเมืองอุทัยธานี",
  province_id: 61,
  province_thai: "อุทัยธานี",
  source_provenance: "test fixture",
  created_at: "2026-11-19T00:00:00Z",
};

describe("D1-5/D1-9 Address_Key — display-time verbatim formula, NEVER stored", () => {
  it("concatenates TambonThai-DistrictThai-ProvinceThai (AppSheet &[\"-\"]& verbatim)", () => {
    expect(addressKey(UTHAI_ROW)).toBe("อุทัยใหม่-อำเภอเมืองอุทัยธานี-อุทัยธานี");
  });

  it("derives from the row's live values — no cached/stored key exists on the row type", () => {
    const keys = Object.keys(UTHAI_ROW);
    expect(keys).not.toContain("address_key");
    expect(keys).not.toContain("Address_Key");
    // recomputed from parts each call — editing a part changes the key
    const edited = { ...UTHAI_ROW, tambon_thai: "น้ำซึม" };
    expect(addressKey(edited)).toBe("น้ำซึม-อำเภอเมืองอุทัยธานี-อุทัยธานี");
  });
});

describe("P2.3 float-id integer coercion (mandatory at seed/payload generation)", () => {
  it("sheet floats coerce to plain integers (910104.0 → 910104)", () => {
    expect(coerceAddressInt(910104.0)).toBe(910104);
    expect(coerceAddressInt(100101.0)).toBe(100101);
    expect(coerceAddressInt(61.0)).toBe(61);
  });

  it("integer strings coerce too ('100101' → 100101)", () => {
    expect(coerceAddressInt("100101")).toBe(100101);
    expect(coerceAddressInt(" 610101 ")).toBe(610101);
  });

  it("true integers pass through", () => {
    expect(coerceAddressInt(610101)).toBe(610101);
  });

  it("non-integral values REJECT — never a silent float store", () => {
    expect(() => coerceAddressInt(910104.5)).toThrow();
    expect(() => coerceAddressInt("abc")).toThrow();
    expect(() => coerceAddressInt(null)).toThrow();
    expect(() => coerceAddressInt("")).toThrow();
  });
});

describe("census search + pagination — 7,436 rows never rendered unpaginated (WO §5)", () => {
  const rows: AddressRow[] = [
    UTHAI_ROW,
    { ...UTHAI_ROW, id: "…a002", tambon_id: 610102, tambon_thai: "น้ำซึม" },
    { ...UTHAI_ROW, id: "…a003", tambon_id: 100101, tambon_thai: "แขวงพระบรมมหาราชวัง", district_thai: "เขตพระนคร", province_id: 10, province_thai: "กรุงเทพมหานคร" },
    { ...UTHAI_ROW, id: "…a004", tambon_id: 910104, tambon_thai: "บ้านควน", district_thai: "อำเภอเมืองสตูล", province_id: 91, province_thai: "สตูล" },
  ];

  it("the page size is a bounded constant (> 0, well under the census)", () => {
    expect(ADDRESS_PAGE_SIZE).toBeGreaterThan(0);
    expect(ADDRESS_PAGE_SIZE).toBeLessThan(7436);
  });

  it("search matches tambon / district / province substrings", () => {
    expect(filterAddressRows(rows, "อุทัยธานี").length).toBe(2);
    expect(filterAddressRows(rows, "เขตพระนคร").map((r) => r.tambon_id)).toEqual([100101]);
    expect(filterAddressRows(rows, "บ้านควน").map((r) => r.tambon_id)).toEqual([910104]);
  });

  it("search matches the numeric id as digits", () => {
    expect(filterAddressRows(rows, "610101").map((r) => r.tambon_id)).toEqual([610101]);
    expect(filterAddressRows(rows, "9101").map((r) => r.tambon_id).sort()).toEqual([910104]);
  });

  it("empty/blank query returns everything", () => {
    expect(filterAddressRows(rows, "").length).toBe(4);
    expect(filterAddressRows(rows, "   ").length).toBe(4);
  });

  it("pagination slices by page — page 1 of 3 rows at size 2 returns 2 rows", () => {
    const page = paginateAddressRows(rows, 1, 2);
    expect(page.length).toBe(2);
    expect(paginateAddressRows(rows, 2, 2).length).toBe(2);
    expect(paginateAddressRows(rows, 3, 2).length).toBe(0);
  });
});

describe("buildAddressPayload — B7 editable-reference honesty", () => {
  it("coerces the three id fields to integers; trims the Thai names verbatim", () => {
    const payload = buildAddressPayload({
      tambon_id: "610101",
      tambon_thai: " อุทัยใหม่ ",
      district_id: 6101.0,
      district_thai: "อำเภอเมืองอุทัยธานี",
      province_id: "61",
      province_thai: "อุทัยธานี",
    });
    expect(payload.tambon_id).toBe(610101);
    expect(payload.district_id).toBe(6101);
    expect(payload.province_id).toBe(61);
    expect(payload.tambon_thai).toBe("อุทัยใหม่");
  });

  it("all four named fields are required — an empty tambon id/name throws", () => {
    expect(() =>
      buildAddressPayload({
        tambon_id: "",
        tambon_thai: "อุทัยใหม่",
        district_id: "6101",
        district_thai: "อำเภอเมืองอุทัยธานี",
        province_id: "61",
        province_thai: "อุทัยธานี",
      }),
    ).toThrow();
    expect(() =>
      buildAddressPayload({
        tambon_id: "610101",
        tambon_thai: "  ",
        district_id: "6101",
        district_thai: "อำเภอเมืองอุทัยธานี",
        province_id: "61",
        province_thai: "อุทัยธานี",
      }),
    ).toThrow();
  });

  it("the payload NEVER carries an address_key field (the virtual is never stored)", () => {
    const payload = buildAddressPayload({
      tambon_id: "610101",
      tambon_thai: "อุทัยใหม่",
      district_id: "6101",
      district_thai: "อำเภอเมืองอุทัยธานี",
      province_id: "61",
      province_thai: "อุทัยธานี",
    });
    expect(Object.keys(payload)).not.toContain("address_key");
    expect(Object.keys(payload)).not.toContain("Address_Key");
  });
});
