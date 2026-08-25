/**
 * WO-STAB-006 — RED-first unit tests for the optimistic mark-read path.
 *
 * Bug being pinned (P1 #6): optimistic markRead decremented `n`
 * unconditionally while the row-flip was guarded by `read_at === null`.
 * Double-click on dismiss = badge under-count until the next poll.
 *
 * Two layers:
 * - applyMarkRead — pure transform (form-hydration pattern)
 * - markReadViaCache — optimistic write + invalidation rollback, driven
 *   through a fake cache client (repo has no DOM test infra, so the hook
 *   body was extracted module-level to keep this node-env testable)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyMarkRead, type AlertsSnapshot } from "./alerts-unread";
import { markReadViaCache, type AlertsCacheClient } from "./alerts";
import type { ThresholdAlert } from "./alerts";

// markAlertRead chain: supabase.from().update().eq().is() → { error }
const h = vi.hoisted(() => ({ updateError: null as string | null, calls: 0 }));
vi.mock("./supabase", () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => ({
          is: () => {
            h.calls += 1;
            return Promise.resolve(
              h.updateError ? { error: { message: h.updateError } } : { error: null },
            );
          },
        }),
      }),
    }),
  },
}));

const T0 = "2026-08-25T10:00:00.000Z";
const KEY = ["threshold-alerts", 20] as const;

function alert(id: string, read_at: string | null): ThresholdAlert {
  return {
    id,
    reading_id: `reading-${id}`,
    field: "do_average",
    message: `breach ${id}`,
    created_at: T0,
    notified_at: null,
    read_at,
  };
}

describe("applyMarkRead (pure optimistic transform)", () => {
  it("unread target: flips read_at to the injected timestamp and decrements n once", () => {
    const a = alert("a", null);
    const b = alert("b", T0);
    const next = applyMarkRead({ rows: [a, b], n: 2 }, "a", new Date(T0));
    expect(next.n).toBe(1);
    expect(next.rows[0]).toEqual({ ...a, read_at: T0 });
    expect(next.rows[1]).toBe(b); // untouched row keeps its reference
  });

  it("second click on the already-flipped snapshot: idempotent no-op (same reference)", () => {
    const first = applyMarkRead({ rows: [alert("a", null)], n: 1 }, "a", new Date(T0));
    const second = applyMarkRead(first, "a", new Date(T0));
    expect(second).toBe(first);
    expect(second.n).toBe(first.n);
  });

  it("target already read from the start: n unchanged (the double-decrement bug)", () => {
    const snap: AlertsSnapshot = { rows: [alert("a", T0)], n: 1 };
    const next = applyMarkRead(snap, "a", new Date(T0));
    expect(next.n).toBe(1);
    expect(next.rows[0]!.read_at).toBe(T0); // original timestamp preserved
  });

  it("unknown id: snapshot returned unchanged", () => {
    const snap: AlertsSnapshot = { rows: [alert("a", null)], n: 1 };
    expect(applyMarkRead(snap, "nope", new Date(T0))).toBe(snap);
  });

  it("n=0 floor: unread target with n already 0 stays 0", () => {
    const next = applyMarkRead({ rows: [alert("a", null)], n: 0 }, "a", new Date(T0));
    expect(next.n).toBe(0);
    expect(next.rows[0]!.read_at).toBe(T0);
  });

  it("flips only the matching row when several are unread", () => {
    const rows = [alert("a", null), alert("b", null), alert("c", null)];
    const next = applyMarkRead({ rows, n: 3 }, "b", new Date(T0));
    expect(next.n).toBe(2);
    expect(next.rows[0]!.read_at).toBeNull();
    expect(next.rows[1]!.read_at).toBe(T0);
    expect(next.rows[2]!.read_at).toBeNull();
  });
});

function makeFakeClient(initial: AlertsSnapshot | undefined) {
  let current = initial;
  const writes: AlertsSnapshot[] = [];
  const invalidated: unknown[][] = [];
  const client = {
    getQueryData: () => current,
    setQueryData: (_key: unknown, value: AlertsSnapshot) => {
      writes.push(value);
      current = value;
    },
    invalidateQueries: (filters: { queryKey: unknown[] }) => {
      invalidated.push(filters.queryKey);
      return Promise.resolve();
    },
  } as unknown as AlertsCacheClient;
  return { client, writes, invalidated };
}

describe("markReadViaCache (optimistic write + rollback)", () => {
  beforeEach(() => {
    h.updateError = null;
    h.calls = 0;
  });

  it("writes the transformed snapshot optimistically, then the server write succeeds", async () => {
    const { client, writes, invalidated } = makeFakeClient({ rows: [alert("a", null)], n: 1 });
    await markReadViaCache(client, KEY, "a");
    expect(writes).toHaveLength(1);
    expect(writes[0]!.n).toBe(0);
    expect(writes[0]!.rows[0]!.read_at).not.toBeNull();
    expect(h.calls).toBe(1); // server write attempted exactly once
    expect(invalidated).toHaveLength(0); // success → no invalidation
  });

  it("double invocation (double-click simulation): second write is the same snapshot — n cannot fall twice", async () => {
    const { client, writes } = makeFakeClient({ rows: [alert("a", null)], n: 1 });
    await markReadViaCache(client, KEY, "a");
    await markReadViaCache(client, KEY, "a");
    expect(writes).toHaveLength(2);
    expect(writes[1]!).toBe(writes[0]!); // same reference → no re-decrement, no timestamp clobber
    expect(writes[1]!.n).toBe(0);
  });

  it("server error → invalidates the query for rollback (pinned existing behavior)", async () => {
    h.updateError = "boom";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { client, invalidated } = makeFakeClient({ rows: [alert("a", null)], n: 1 });
      await markReadViaCache(client, KEY, "a");
      expect(invalidated).toEqual([KEY]);
    } finally {
      warn.mockRestore();
    }
  });

  it("empty cache: no optimistic write, still attempts the server write", async () => {
    const { client, writes, invalidated } = makeFakeClient(undefined);
    await markReadViaCache(client, KEY, "a");
    expect(writes).toHaveLength(0);
    expect(h.calls).toBe(1);
    expect(invalidated).toHaveLength(0);
  });
});
