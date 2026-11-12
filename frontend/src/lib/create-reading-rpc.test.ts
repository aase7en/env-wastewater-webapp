/**
 * ENV-PERF-001 item 3 — RED-first: createReading must go through ONE
 * atomic RPC (`fn_create_reading`) instead of 3 sequential table inserts,
 * and a failing repair_request step must PROPAGATE as a rejection
 * (previously swallowed with console.warn at supabase-queries.ts:240-243).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createReading } from "./supabase-queries";
import type { ReadingCreate } from "./types";

interface RecordedRpc {
  fn: string;
  args: Record<string, unknown>;
}

const h = vi.hoisted(() => ({
  fromCalls: [] as string[],
  rpcCalls: [] as RecordedRpc[],
  rpcData: null as unknown,
  rpcError: null as { message: string } | null,
}));

vi.mock("./supabase", () => ({
  supabase: {
    from: (table: string) => {
      h.fromCalls.push(table);
      const builder = {
        insert: () => builder,
        select: () => builder,
        update: () => builder,
        eq: () => builder,
        single: () => Promise.resolve({ data: { id: "legacy-insert-row" }, error: null }),
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(resolve),
      };
      return builder;
    },
    rpc: (fn: string, args: Record<string, unknown>) => {
      h.rpcCalls.push({ fn, args });
      return Promise.resolve({ data: h.rpcData, error: h.rpcError });
    },
  },
}));

const PAYLOAD: ReadingCreate = {
  reading_date: "2026-11-12",
  do_aeration: "2.4",
  ph: "7.2",
  electricity_meter_value: "100",
  electricity_consumption: "42",
  abnormal_cause: "ปั้มส่งน้ำเสียงดังผิดปกติ",
  system_operating: false,
};

beforeEach(() => {
  h.fromCalls.length = 0;
  h.rpcCalls.length = 0;
  h.rpcData = { id: "rpc-reading-row", reading_date: "2026-11-12" };
  h.rpcError = null;
});

describe("createReading via atomic RPC (ENV-PERF-001)", () => {
  it("issues exactly ONE rpc('fn_create_reading') and zero direct table writes", async () => {
    await createReading(PAYLOAD);
    expect(h.rpcCalls).toHaveLength(1);
    expect(h.rpcCalls[0]!.fn).toBe("fn_create_reading");
    // No client-side insert round trips: carbon_reading / reading /
    // repair_request writes all happen inside the RPC transaction.
    expect(h.fromCalls).toEqual([]);
  });

  it("passes the full form payload (incl. abnormal_cause + electricity) inside p_payload", async () => {
    await createReading(PAYLOAD);
    const payload = h.rpcCalls[0]!.args.p_payload as Record<string, unknown>;
    expect(payload.reading_date).toBe("2026-11-12");
    expect(payload.abnormal_cause).toBe("ปั้มส่งน้ำเสียงดังผิดปกติ");
    expect(payload.electricity_meter_value).toBe("100");
    expect(payload.electricity_consumption).toBe("42");
    expect(payload.system_operating).toBe(false);
  });

  it("RPC failure propagates — the repair_request step is no longer swallowed", async () => {
    h.rpcError = { message: "repair_request insert failed: duplicate key" };
    await expect(createReading(PAYLOAD)).rejects.toThrow(/repair_request insert failed/);
  });

  it("returns the RPC's reading row as ReadingDetail", async () => {
    const detail = await createReading(PAYLOAD);
    expect(detail.id).toBe("rpc-reading-row");
  });
});
