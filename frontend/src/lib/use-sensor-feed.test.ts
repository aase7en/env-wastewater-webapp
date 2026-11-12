/**
 * ENV-PERF-001 item 2 — RED-first: the sensor feed must seed ALL sensors'
 * recent samples with ONE `.in("sensor_id", ids)` query, then group
 * per-sensor client-side (previously: one HTTP query per sensor — N+1).
 *
 * The seeding body is extracted module-level (`fetchSensorFeedData`) so
 * this node-env test can drive it directly (alerts-unread pattern); the
 * realtime incremental-cache path (channel INSERT → setQueryData) is
 * untouched by the extraction and keeps its existing behavior.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

interface RecordedQuery {
  table: string;
  ops: unknown[];
}

const h = vi.hoisted(() => ({
  queries: [] as RecordedQuery[],
  sensorRows: [] as unknown[],
  readingRows: [] as unknown[],
}));

vi.mock("./supabase", () => ({
  supabase: {
    from: (table: string) => {
      const ops: unknown[] = [];
      const builder = {
        select: (...a: unknown[]) => {
          ops.push(["select", ...a]);
          return builder;
        },
        eq: (...a: unknown[]) => {
          ops.push(["eq", ...a]);
          return builder;
        },
        in: (...a: unknown[]) => {
          ops.push(["in", ...a]);
          return builder;
        },
        order: (...a: unknown[]) => {
          ops.push(["order", ...a]);
          return builder;
        },
        limit: (...a: unknown[]) => {
          ops.push(["limit", ...a]);
          return builder;
        },
        then: (
          resolve: (v: unknown) => unknown,
          reject: (e: unknown) => unknown,
        ) => {
          h.queries.push({ table, ops });
          const data = table === "sensor" ? h.sensorRows : h.readingRows;
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return builder;
    },
  },
}));

const SENSOR_A = "00000000-0000-0000-0000-000000000001";
const SENSOR_B = "00000000-0000-0000-0000-000000000002";

function sample(sensorId: string, takenAt: string): {
  id: string;
  sensor_id: string;
  taken_at: string;
  value: number;
} {
  return { id: `reading-${sensorId.slice(-2)}-${takenAt}`, sensor_id: sensorId, taken_at: takenAt, value: 1 };
}

beforeEach(() => {
  h.queries.length = 0;
  h.sensorRows = [
    { id: SENSOR_A, code: "PH-01", parameter_code: "ph", label_th: null, unit: "pH", is_active: true },
    { id: SENSOR_B, code: "DO-01", parameter_code: "do", label_th: null, unit: "mg/L", is_active: true },
  ];
  h.readingRows = [];
});

describe("fetchSensorFeedData (ENV-PERF-001 single-query seeding)", () => {
  it("seeds samples with exactly ONE sensor_reading query (N+1 fixed)", async () => {
    const { fetchSensorFeedData } = await import("./use-sensor-feed");
    h.readingRows = [sample(SENSOR_A, "2026-11-12T01:00:00Z")];
    await fetchSensorFeedData(50);
    const readingQueries = h.queries.filter((q) => q.table === "sensor_reading");
    expect(readingQueries).toHaveLength(1);
  });

  it("the single query filters with .in(sensor_id, all-ids) newest-first", async () => {
    const { fetchSensorFeedData } = await import("./use-sensor-feed");
    h.readingRows = [sample(SENSOR_A, "2026-11-12T01:00:00Z")];
    await fetchSensorFeedData(50);
    const q = h.queries.find((x) => x.table === "sensor_reading");
    expect(q).toBeDefined();
    expect(q!.ops).toContainEqual(["in", "sensor_id", [SENSOR_A, SENSOR_B]]);
    expect(q!.ops).toContainEqual(["order", "taken_at", { ascending: false }]);
  });

  it("groups rows per sensor client-side, newest-first, capped at the per-sensor limit", async () => {
    const { fetchSensorFeedData } = await import("./use-sensor-feed");
    h.readingRows = [
      sample(SENSOR_A, "2026-11-12T03:00:00Z"),
      sample(SENSOR_A, "2026-11-12T02:00:00Z"),
      sample(SENSOR_A, "2026-11-12T01:00:00Z"),
    ];
    const { samplesBySensor } = await fetchSensorFeedData(2);
    // limit=2: sensor A keeps only the 2 newest; B has no rows → empty list.
    expect(samplesBySensor.get(SENSOR_A)).toHaveLength(2);
    expect(samplesBySensor.get(SENSOR_A)![0]!.taken_at).toBe("2026-11-12T03:00:00Z");
    expect(samplesBySensor.get(SENSOR_A)![1]!.taken_at).toBe("2026-11-12T02:00:00Z");
    expect(samplesBySensor.get(SENSOR_B)).toEqual([]);
  });

  it("scales the combined query limit with the sensor count (ids.length × per-sensor limit)", async () => {
    const { fetchSensorFeedData } = await import("./use-sensor-feed");
    await fetchSensorFeedData(50);
    const q = h.queries.find((x) => x.table === "sensor_reading");
    expect(q!.ops).toContainEqual(["limit", 2 * 50]);
  });
});
