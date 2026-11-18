/**
 * ENV-PARITY-P3-002 — RED-first unit suite for the chlorine inventory lib
 * (lane P3.2): the ÷SWITCH real-usage derivation, the truthful deduction
 * badges (incl. the P3-2 already-deducted idempotent flag), the RPC arg
 * shapes, and the lot payload honesty rules (blanks ⇒ NULL).
 *
 * D2 RED: this file fails-to-collect while `./inventory` does not exist
 * (the honest new-file RED mode — P1.5/P2.4/P3.1 precedent).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHLORINE_LEGACY_ITEM_ID,
  SOURCE_WASTEWATER,
  SOURCE_WATER_SUPPLY,
  buildLotPayload,
  chlorineUsedReal,
  deductChlorineStock,
  formatDeductionBadge,
  revokeChlorineDeduction,
  type DeductionResult,
} from "./inventory";

const h = vi.hoisted(() => ({
  rpcCalls: [] as { fn: string; args: Record<string, unknown> }[],
  rpcData: null as unknown,
  rpcError: null as { message: string } | null,
}));

vi.mock("./supabase", () => ({
  supabase: {
    rpc: (fn: string, args: Record<string, unknown>) => {
      h.rpcCalls.push({ fn, args });
      return Promise.resolve({ data: h.rpcData, error: h.rpcError });
    },
  },
}));

beforeEach(() => {
  h.rpcCalls.length = 0;
  h.rpcData = null;
  h.rpcError = null;
});

describe("chlorineUsedReal — the verbatim ÷SWITCH derivation (ref 12 ~767; wastewater.v_reading_meter_chain)", () => {
  it("divides by 2 for ratio 1:2", () => {
    expect(chlorineUsedReal(4, "1:2")).toBe(2);
  });
  it("divides by 4 for ratio 1:4", () => {
    expect(chlorineUsedReal(8, "1:4")).toBe(2);
  });
  it("divides by 9 for ratio 1:9", () => {
    expect(chlorineUsedReal(9, "1:9")).toBe(1);
  });
  it("unknown ratio → NULL, never 0 (blank/unknown ⇒ honest unknown)", () => {
    expect(chlorineUsedReal(4, "1:5")).toBeNull();
  });
  it("blank ratio → NULL", () => {
    expect(chlorineUsedReal(4, null)).toBeNull();
  });
  it("NULL usage value → NULL, never 0", () => {
    expect(chlorineUsedReal(null, "1:4")).toBeNull();
  });
});

describe("formatDeductionBadge — truthful statuses (WO §5 verbatim intent + R2 P3-2 pin)", () => {
  const base: DeductionResult = {
    status: "deducted",
    deducted_total: 2.5,
    shortfall: 0,
    already_recorded: false,
    allocated: [{ lot_id: "l1", lot_no: "L2511-01", quantity: 2.5, movement_id: "m1" }],
    reason: null,
  };

  it("deducted → 'หักสต๊อกแล้ว N kg (FEFO ล็อต …)' naming the consumed lots", () => {
    const msg = formatDeductionBadge(base);
    expect(msg).toContain("หักสต๊อกแล้ว 2.5 kg");
    expect(msg).toContain("FEFO");
    expect(msg).toContain("L2511-01");
  });

  it("multi-lot split names every consumed lot", () => {
    const msg = formatDeductionBadge({
      ...base,
      deducted_total: 5,
      allocated: [
        { lot_id: "l1", lot_no: "LOT-B", quantity: 3, movement_id: "m1" },
        { lot_id: "l2", lot_no: "LOT-A", quantity: 2, movement_id: "m2" },
      ],
    });
    expect(msg).toContain("LOT-B");
    expect(msg).toContain("LOT-A");
    expect(msg).toContain("5 kg");
  });

  it("skipped (no stock) → the WO verbatim fail-closed text with the shortfall", () => {
    const msg = formatDeductionBadge({ ...base, status: "skipped", deducted_total: 0, shortfall: 5, allocated: [] });
    expect(msg).toContain("ไม่มีสต๊อกพอ");
    expect(msg).toContain("บันทึกการใช้แล้ว แต่ยังไม่ได้หักสต๊อก");
    expect(msg).toContain("5");
  });

  it("partial → shows both what WAS deducted and the honest shortfall", () => {
    const msg = formatDeductionBadge({
      ...base,
      status: "partial",
      deducted_total: 2,
      shortfall: 3,
      allocated: [{ lot_id: "l1", lot_no: "LOT-B", quantity: 2, movement_id: "m1" }],
    });
    expect(msg).toContain("2 kg");
    expect(msg).toContain("ขาด 3");
  });

  it("already-deducted (R2 P3-2) → idempotent success, never re-reported as a new deduction", () => {
    const msg = formatDeductionBadge({
      ...base,
      status: "already-deducted",
      deducted_total: 4,
      already_recorded: true,
      allocated: [],
    });
    expect(msg).toContain("ถูกหักสต๊อกไปแล้ว");
    expect(msg).toContain("4 kg");
    expect(msg).toContain("ไม่หักซ้ำ");
  });

  it("already-skipped → truthful that the earlier attempt found no stock", () => {
    const msg = formatDeductionBadge({
      ...base,
      status: "already-skipped",
      deducted_total: 0,
      shortfall: 2,
      already_recorded: true,
      allocated: [],
    });
    expect(msg).toContain("เคยพยายามหักสต๊อกแล้ว");
    expect(msg).toContain("ขาด 2");
  });

  it("reversed → states what was restored to which lots", () => {
    const msg = formatDeductionBadge({
      ...base,
      status: "reversed",
      deducted_total: 0,
      shortfall: 0,
      restored_total: 4,
      allocated: [{ lot_id: "l1", lot_no: "LOT-B", quantity: 4, movement_id: "m9" }],
    });
    expect(msg).toContain("ย้อนหักสต๊อกแล้ว 4 kg");
    expect(msg).toContain("LOT-B");
  });

  it("nothing-to-reverse → honest no-op text (never a fabricated restore)", () => {
    const msg = formatDeductionBadge({ ...base, status: "nothing-to-reverse", deducted_total: 0, allocated: [] });
    expect(msg).toContain("ไม่มีรายการหักสต๊อกให้ย้อน");
  });

  it("noop → honest no-quantity text", () => {
    const msg = formatDeductionBadge({ ...base, status: "noop", deducted_total: 0, shortfall: 0, allocated: [] });
    expect(msg).toContain("ไม่ต้องหักสต๊อก");
  });

  it("reason carries the mapping-absent honesty line when the config row is missing", () => {
    const msg = formatDeductionBadge({
      ...base,
      status: "skipped",
      reason: "mapping config absent: no active chemical.master row with legacy_item_id '0c0e6a47'",
    });
    expect(msg).toContain("ยังไม่ได้ตั้งค่ารายการคลอรีนในระบบ");
  });
});

describe("deductChlorineStock / revokeChlorineDeduction — RPC arg shapes", () => {
  it("deduct calls fn_deduct_chlorine_stock with the pinned parameter names", async () => {
    h.rpcData = { status: "deducted", deducted_total: 1, shortfall: 0, already_recorded: false, allocated: [] };
    const res = await deductChlorineStock({
      sourceTable: SOURCE_WASTEWATER,
      sourceId: "11111111-1111-1111-1111-111111111111",
      quantity: 1,
      movementDate: "2026-11-18",
    });
    expect(h.rpcCalls).toHaveLength(1);
    expect(h.rpcCalls[0]!.fn).toBe("fn_deduct_chlorine_stock");
    expect(h.rpcCalls[0]!.args.p_source_table).toBe("wastewater.reading");
    expect(h.rpcCalls[0]!.args.p_source_id).toBe("11111111-1111-1111-1111-111111111111");
    expect(h.rpcCalls[0]!.args.p_quantity).toBe(1);
    expect(h.rpcCalls[0]!.args.p_movement_date).toBe("2026-11-18");
    expect(res.status).toBe("deducted");
  });

  it("deduct RPC failure propagates with the real message (never swallowed)", async () => {
    h.rpcError = { message: "permission denied" };
    await expect(
      deductChlorineStock({ sourceTable: SOURCE_WATER_SUPPLY, sourceId: "22222222-2222-2222-2222-222222222222", quantity: 1 })
    ).rejects.toThrow(/permission denied/);
  });

  it("revoke calls fn_revoke_chlorine_deduction with the pinned parameter names", async () => {
    h.rpcData = { status: "reversed", restored_total: 2, allocated: [] };
    const res = await revokeChlorineDeduction({
      sourceTable: SOURCE_WASTEWATER,
      sourceId: "33333333-3333-3333-3333-333333333333",
      reversalDate: "2026-11-18",
    });
    expect(h.rpcCalls[0]!.fn).toBe("fn_revoke_chlorine_deduction");
    expect(h.rpcCalls[0]!.args.p_source_table).toBe("wastewater.reading");
    expect(h.rpcCalls[0]!.args.p_source_id).toBe("33333333-3333-3333-3333-333333333333");
    expect(h.rpcCalls[0]!.args.p_reversal_date).toBe("2026-11-18");
    expect(res.status).toBe("reversed");
  });

  it("exposes the verbatim AppSheet anchor item id (ref 6014) + the two source tables", () => {
    expect(CHLORINE_LEGACY_ITEM_ID).toBe("0c0e6a47");
    expect(SOURCE_WASTEWATER).toBe("wastewater.reading");
    expect(SOURCE_WATER_SUPPLY).toBe("water_supply.daily_check");
  });
});

describe("buildLotPayload — lot entry honesty (blanks ⇒ NULL, D1-7 kg numerics)", () => {
  it("blank strings become NULL, numbers parse, ถัง count stays a note (never a conversion invention)", () => {
    const payload = buildLotPayload({
      master_id: "",
      item_id: "",
      item_legacy_id: "0c0e6a47",
      receipt_date: "2026-11-18",
      lot_no: "L2511-01",
      mfg_date: "",
      expiry_date: "2027-01-31",
      lifetime_note: "",
      amount_received: "4",
      note: "รับเข้า 2 ถัง (ถังละ 2 kg)",
    });
    expect(payload.master_id).toBeNull();
    expect(payload.item_id).toBeNull();
    expect(payload.item_legacy_id).toBe("0c0e6a47");
    expect(payload.mfg_date).toBeNull(); // unparseable/blank MFG stays NULL — never coerced
    expect(payload.expiry_date).toBe("2027-01-31");
    expect(payload.amount_received).toBe(4);
    expect(payload.note).toContain("2 ถัง");
  });

  it("rejects a non-positive amount (never fabricates stock)", () => {
    expect(() => buildLotPayload({ receipt_date: "2026-11-18", amount_received: "0" })).toThrow(/จำนวนรับเข้า/);
    expect(() => buildLotPayload({ receipt_date: "2026-11-18", amount_received: "-1" })).toThrow(/จำนวนรับเข้า/);
    expect(() => buildLotPayload({ receipt_date: "2026-11-18", amount_received: "" })).toThrow(/จำนวนรับเข้า/);
  });
});
