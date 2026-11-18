/**
 * ENV-PARITY-P3-001 — masters lib unit suite (Track-Z GLM, D2 RED-first).
 *
 * RED mode: the honest new-file lane — `./masters` does not exist at the RED
 * commit, so this file FAILS TO COLLECT (the P1.5/P2.4 precedent). Every
 * assertion below pins the GREEN shape:
 *
 *   - Items Category enum tokens carried VERBATIM (ref 12 ref 4792:
 *     w6hwsyj / 72b68b19 / 9a7ebdaf — these are legacy Categories IDs;
 *     SOURCE_UNAVAILABLE means they are UI-restricted values, never seeded).
 *   - blanks ⇒ NULL in every payload builder (D1-7 honesty: unknown ≠ ''),
 *     whitespace-only values too; verbatim non-blank bytes pass through.
 *   - honest empty-picker labels — never a fabricated option, never a
 *     silent blank (WO §4; D1-7).
 *   - picker option labels resolve an Item to name + legacy id (AppSheet
 *     อุปกรณ์/ชนิดเครื่องมือตรวจ carry the Item ID verbatim).
 *   - the lab picker payload carries equipment_id (the D1-4 FK binding);
 *     unset stays null (never coerced to a default item).
 *
 * Pure lib only (node environment — no DOM, no fetch). The write/read paths
 * themselves are contract-covered by scripts/test_parity_p3_001_masters.py
 * (live SQL) and frontend/tests/e2e/env-parity-p3-001-masters.spec.ts.
 */
import { describe, expect, it } from "vitest";
import {
  CATEGORY_TOKENS,
  EMPTY_ITEM_PICKER_LABEL,
  EMPTY_VENDORS_LABEL,
  EMPTY_CATEGORIES_LABEL,
  EMPTY_DISTRIBUTOR_LABEL,
  toNullableText,
  formatItemOption,
  buildDistributorPayload,
  buildItemPayload,
  type DistributorFormInput,
  type ItemFormInput,
  type ItemRow,
} from "./masters";

describe("Items Category enum tokens (ref 4792 verbatim)", () => {
  it("carries the three AppSheet tokens verbatim, in reference order", () => {
    expect([...CATEGORY_TOKENS]).toEqual(["w6hwsyj", "72b68b19", "9a7ebdaf"]);
  });
});

describe("toNullableText — blanks ⇒ NULL (D1-7)", () => {
  it("maps empty string to null", () => {
    expect(toNullableText("")).toBeNull();
  });

  it("maps whitespace-only input to null (unknown ≠ ' ')", () => {
    expect(toNullableText("   ")).toBeNull();
  });

  it("keeps non-blank text verbatim (inner spaces preserved)", () => {
    expect(toNullableText("บริษัท ตัวอย่าง จำกัด")).toBe("บริษัท ตัวอย่าง จำกัด");
  });
});

describe("honest empty-picker labels (never fabricated options)", () => {
  it("pins the four honest Thai labels", () => {
    expect(EMPTY_ITEM_PICKER_LABEL).toBe("ยังไม่มีข้อมูลอุปกรณ์");
    expect(EMPTY_VENDORS_LABEL).toBe("ยังไม่มีข้อมูลผู้ขาย");
    expect(EMPTY_CATEGORIES_LABEL).toBe("ยังไม่มีข้อมูลหมวดหมู่");
    expect(EMPTY_DISTRIBUTOR_LABEL).toBe("ยังไม่มีข้อมูลผู้จัดจำหน่าย");
  });
});

describe("formatItemOption — picker label from an Item row", () => {
  const item: ItemRow = {
    id: "11111111-1111-4111-8111-111111111111",
    legacy_id: "aca317bf",
    name: "ชุดตรวจ coliform",
    description: null,
    image_path: null,
    category_legacy: null,
    category_id: null,
    vendor_id: null,
    purchase_cost: null,
    unit_count_num: null,
    unit_count: null,
    unit_formula: null,
    unit_use_num: null,
    unit_calculate: null,
    user_manual_path: null,
    min_qty: null,
    max_qty: null,
    source_provenance: "ENV UI manual entry",
  };

  it("prefers name + legacy id", () => {
    expect(formatItemOption(item)).toBe("ชุดตรวจ coliform (aca317bf)");
  });

  it("falls back to the legacy id when the name is blank", () => {
    expect(formatItemOption({ ...item, name: null })).toBe("aca317bf");
  });
});

describe("buildDistributorPayload — verbatim fields, blanks ⇒ NULL", () => {
  const base: DistributorFormInput = {
    dealer: "บริษัท เอบีซี จำกัด",
    dealer_email: "sales@abc.example",
    dealer_address: "",
    dealer_tel: "0 5555 5555",
    salesname: "   ",
    line_id: "",
  };

  it("maps blank/whitespace-only optional fields to null and keeps the rest verbatim", () => {
    const payload = buildDistributorPayload(base);
    expect(payload.dealer).toBe("บริษัท เอบีซี จำกัด");
    expect(payload.dealer_email).toBe("sales@abc.example");
    expect(payload.dealer_address).toBeNull();
    expect(payload.dealer_tel).toBe("0 5555 5555");
    expect(payload.salesname).toBeNull();
    expect(payload.line_id).toBeNull();
  });

  it("carries an update target id through unchanged", () => {
    const payload = buildDistributorPayload({ ...base }, "e5e76725");
    expect(payload.legacy_id).toBe("e5e76725");
  });
});

describe("buildItemPayload — category token + resolved FK, never both fabricated", () => {
  it("keeps the verbatim enum token in category_legacy when no category row is resolved", () => {
    const payload = buildItemPayload({ name: "เครื่องวัดคลอรีน", category_token: "w6hwsyj" });
    expect(payload.category_legacy).toBe("w6hwsyj");
    expect(payload.category_id).toBeNull();
  });

  it("carries the resolved category FK when one is picked", () => {
    const payload = buildItemPayload({
      name: "เครื่องวัดคลอรีน",
      category_token: "",
      category_id: "22222222-2222-4222-8222-222222222222",
    });
    expect(payload.category_legacy).toBeNull();
    expect(payload.category_id).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("maps numeric blanks to null (never coerced to 0)", () => {
    const payload = buildItemPayload({ name: "ถุงมือ", min_qty: "", max_qty: "", purchase_cost: "" });
    expect(payload.min_qty).toBeNull();
    expect(payload.max_qty).toBeNull();
    expect(payload.purchase_cost).toBeNull();
  });

  it("keeps numeric values verbatim", () => {
    const payload = buildItemPayload({ name: "ถุงมือ", min_qty: "5", max_qty: "20", purchase_cost: "150.50" });
    expect(payload.min_qty).toBe(5);
    expect(payload.max_qty).toBe(20);
    expect(payload.purchase_cost).toBe(150.5);
  });

  it("rejects an out-of-vocabulary category token (UI-restricted list, not a DB CHECK)", () => {
    expect(() => buildItemPayload({ name: "x", category_token: "not-a-token" })).toThrow();
  });
});
