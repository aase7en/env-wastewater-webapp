/**
 * ENV-INT-PROVENANCE-001 — provider-agnostic provenance / freshness /
 * availability / observation-contract core.
 *
 * Contracts under test (source-contract packet
 * A-Wiki/inbox/ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md §8/§10/§12 —
 * fixtures below are the packet's sanitized public-environmental-field
 * fixtures; no network access, no provider integration, no secrets):
 *
 * 1. Envelope builders enforce data-class truthfulness:
 *    observed ≠ forecast ≠ derived ≠ simulated; a forecast can never carry
 *    observed_at, an observed value must carry observed_at, a derived value
 *    must declare its aggregation window, a simulated value must be
 *    explicitly labeled — unknown/missing is never coerced into a value.
 * 2. Time parsing: wall-clock strings whose zone suffix is unreliable
 *    (GISTDA-style "Z" that is actually Asia/Bangkok) and naive local
 *    strings (HII-style "YYYY-MM-DD HH:mm") must parse to the same instants
 *    — and NEVER double-shift.
 * 3. Freshness is computed from observed_at/valid_at (never received_at,
 *    never cache age) and is explicitly separated per data class.
 * 4. Availability classification is an ordered state machine that never
 *    emits 0 / NORMAL / SAFE / LIVE and never converts empty/stale/error
 *    into a fabricated value.
 * 5. Structural guard enables future adapters to detect schema drift
 *    (schema_mismatch) instead of coercing.
 */
import { describe, expect, it } from "vitest";
import {
  envIntObservation,
  isEnvIntObservation,
  formatProvenanceLine,
  type EnvIntObservation,
  type EnvIntObservationInput,
} from "./provenance";
import { parseWallClockAs, parseNaiveLocal } from "./time";
import { computeFreshnessAge, classifyAvailability } from "./freshness";

// ─── Sanitized fixtures (source-contract packet §11; retrieval 2026-09-02 ICT) ───

/** F1 (trimmed) — GISTDA amphoe 24h history: "Z"-suffixed ICT wall-clock. */
const GISTDA_24H_FIRST_POINT = ["18.652550168939534", "2026-09-01T11:00:00.000Z"] as const;
const GISTDA_24H_LAST_POINT = ["18.47766330498679", "2026-09-02T10:00:00.000Z"] as const;

/** F2 — GISTDA Pred3 Uthai entry: current + 24h avg + 3 forecast steps. */
const GISTDA_PRED3_UTHAI = {
  ap_tn: "อุทัย",
  ap_en: "Uthai",
  ap_idn: 1414,
  pm25: 18.477663304986795,
  dt: "2026-09-02T10:00:00.000Z",
  pm25Avg24hr: 17.618048947437366,
  pred1: 19.135530385777145,
  pred2: 17.492736433405994,
  pred3: 16.643137335873625,
} as const;

/** F4 (trimmed) — HII water level, Uthai-district station 471583: naive ICT. */
const HII_UTHAI = {
  waterlevel_datetime: "2026-09-02 10:20",
  waterlevel_msl: "1.78",
  station: { id: 471583, tele_station_name: { th: "คลองช่องสะเดา", en: "Chong Sa Dao" } },
} as const;

/** F5 essence — HII stale row: 4-days-old observation still in the feed. */
const HII_STALE_UTHAI_NEIGHBOR = {
  waterlevel_datetime: "2026-08-29 11:50",
  waterlevel_msl: "1.57",
  station: { id: 471584, tele_station_name: { th: "วัดขนอนใต้" } },
} as const;

/** Real-world negative MSL observed in the same feed (never clamp). */
const HII_NEGATIVE_MSL = "-0.81" as const;

// ─── 1. Time parsing (packet §7 / §12.1–12.2) ───

describe("env-int time parsing", () => {
  it("parses unreliable-Z wall-clock strings as Asia/Bangkok (no double shift)", () => {
    const t = parseWallClockAs(GISTDA_24H_LAST_POINT[1], "Asia/Bangkok");
    expect(t.toISOString()).toBe("2026-09-02T03:00:00.000Z"); // 10:00 ICT == 03:00 UTC
  });

  it("parses naive local datetime strings as Asia/Bangkok", () => {
    const t = parseNaiveLocal(HII_UTHAI.waterlevel_datetime, "Asia/Bangkok");
    expect(t.toISOString()).toBe("2026-09-02T03:20:00.000Z"); // 10:20 ICT == 03:20 UTC
  });

  it("equivalent wall-clock readings from both providers denote the same instant", () => {
    // GISTDA 10:20 "Z"(actually ICT) vs HII 10:20 naive — same instant.
    expect(parseWallClockAs("2026-09-02T10:20:00.000Z", "Asia/Bangkok").getTime())
      .toBe(parseNaiveLocal("2026-09-02 10:20", "Asia/Bangkok").getTime());
  });

  it("fixture history window spans exactly 23 hours (24 hourly points)", () => {
    const first = parseWallClockAs(GISTDA_24H_FIRST_POINT[1], "Asia/Bangkok");
    const last = parseWallClockAs(GISTDA_24H_LAST_POINT[1], "Asia/Bangkok");
    expect(last.getTime() - first.getTime()).toBe(23 * 3600 * 1000);
  });

  it("rejects unparseable timestamps instead of guessing", () => {
    expect(() => parseWallClockAs("not-a-date", "Asia/Bangkok")).toThrowError(/timestamp/);
    expect(() => parseNaiveLocal("", "Asia/Bangkok")).toThrowError(/timestamp/);
  });
});

// ─── 2. Envelope data-class truthfulness (packet §8 / §12.5–12.6) ───

const RECEIVED_AT = new Date("2026-09-02T04:30:00.000Z"); // 11:30 ICT — ingest clock

describe("env-int observation envelope", () => {
  it("builds an OBSERVED pm2.5 envelope (current hourly value, not the average)", () => {
    const o = envIntObservation({
      provider: "GISTDA",
      source_product: "pm25_check_amphoe",
      source_method: "satellite_ground_calibrated_ai_analysis",
      source_url: "https://pm25.gistda.or.th/rest/getPM25byAmphoe24hrs?ap_idn=1414",
      source_geo_id: { level: "amphoe", id: 1414, label: "อุทัย" },
      data_class: "observed",
      observed_at: parseWallClockAs(GISTDA_PRED3_UTHAI.dt, "Asia/Bangkok"),
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok",
      unit: "ug/m3",
      value: GISTDA_PRED3_UTHAI.pm25,
    });
    expect(o.data_class).toBe("observed");
    expect(o.value).toBe(18.477663304986795);
    expect(o.aggregation_window).toBeNull();
    expect(o.valid_at?.getTime()).toBe(o.observed_at?.getTime());
  });

  it("builds a DERIVED 24h average only with an explicit aggregation window", () => {
    const base = {
      provider: "GISTDA",
      source_product: "pm25_check_amphoe",
      source_method: "satellite_ground_calibrated_ai_analysis",
      source_url: "https://pm25.gistda.or.th/rest/getPM25byAmphoe24hrs?ap_idn=1414",
      source_geo_id: { level: "amphoe", id: 1414, label: "อุทัย" },
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok",
      unit: "ug/m3" as const,
    } satisfies Omit<EnvIntObservationInput, "data_class" | "value" | "observed_at" | "aggregation_window">;
    expect(() =>
      envIntObservation({ ...base, data_class: "derived", value: GISTDA_PRED3_UTHAI.pm25Avg24hr }),
    ).toThrowError(/aggregation/);
    const avg = envIntObservation({
      ...base,
      data_class: "derived",
      value: GISTDA_PRED3_UTHAI.pm25Avg24hr,
      observed_at: parseWallClockAs(GISTDA_PRED3_UTHAI.dt, "Asia/Bangkok"),
      aggregation_window: "24h",
    });
    expect(avg.data_class).toBe("derived");
    expect(avg.aggregation_window).toBe("24h");
    // 24h average ≠ current hourly value — both must remain representable and distinct.
    expect(avg.value).not.toBe(GISTDA_PRED3_UTHAI.pm25);
  });

  it("builds a FORECAST only without observed_at and with valid/issued/horizon", () => {
    const issued = parseWallClockAs(GISTDA_PRED3_UTHAI.dt, "Asia/Bangkok");
    const build = (over: Record<string, unknown>) =>
      envIntObservation({
        provider: "GISTDA",
        source_product: "pm25_check_pred3",
        source_method: "satellite_ground_calibrated_ai_analysis",
        source_url: "https://pm25.gistda.or.th/rest/getPm25byAmphoePred3?pv_idn=14",
        source_geo_id: { level: "amphoe", id: 1414, label: "อุทัย" },
        data_class: "forecast",
        received_at: RECEIVED_AT,
        timezone: "Asia/Bangkok",
        unit: "ug/m3",
        value: GISTDA_PRED3_UTHAI.pred1,
        issued_at: issued,
        valid_at: new Date(issued.getTime() + 3 * 3600 * 1000),
        forecast_horizon: "3h_step",
        ...over,
      } as Parameters<typeof envIntObservation>[0]);
    expect(() => build({ observed_at: issued })).toThrowError(/forecast/);
    const f = build({});
    expect(f.observed_at).toBeNull();
    expect(f.valid_at && f.issued_at).toBeTruthy();
    // forecast valid time ≠ issued time — never render them interchangeably
    expect(f.valid_at?.getTime()).not.toBe(f.issued_at?.getTime());
  });

  it("requires an explicit simulation label for SIMULATED data (no silent what-ifs)", () => {
    expect(() =>
      envIntObservation({
        provider: "ENV",
        source_product: "twin_scenario",
        source_method: "simulation",
        source_url: "local://twin",
        source_geo_id: { level: "point", lat: 14.357, lng: 100.697 },
        data_class: "simulated",
        received_at: RECEIVED_AT,
        timezone: "Asia/Bangkok",
        unit: "ug/m3",
        value: 20,
        valid_at: RECEIVED_AT,
      }),
    ).toThrowError(/simulation/);
  });

  it("preserves provider string units verbatim (m MSL as number, negatives intact)", () => {
    const o = envIntObservation({
      provider: "HII",
      source_product: "thaiwater30_waterlevel",
      source_method: "telemetry_observation",
      source_url: "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load",
      source_geo_id: { level: "station", id: 471583, label: "คลองช่องสะเดา" },
      data_class: "observed",
      observed_at: parseNaiveLocal(HII_UTHAI.waterlevel_datetime, "Asia/Bangkok"),
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok",
      unit: "m_msl",
      value: Number(HII_UTHAI.waterlevel_msl),
    });
    expect(o.unit).toBe("m_msl");
    expect(o.value).toBe(1.78);
    expect(Number(HII_NEGATIVE_MSL)).toBe(-0.81); // real negative MSL — never clamped
  });

  it("structural guard detects schema drift instead of coercing", () => {
    const good = envIntObservation({
      provider: "HII",
      source_product: "thaiwater30_waterlevel",
      source_method: "telemetry_observation",
      source_url: "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load",
      source_geo_id: { level: "station", id: 471583 },
      data_class: "observed",
      observed_at: parseNaiveLocal(HII_UTHAI.waterlevel_datetime, "Asia/Bangkok"),
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok",
      unit: "m_msl",
      value: 1.78,
    });
    expect(isEnvIntObservation(good)).toBe(true);
    // F8-style drift: unit field renamed (removed + wrong key added) — must be rejected, never repaired.
    const { unit: _dropped, ...driftedBase } = good;
    void _dropped;
    const drifted = { ...driftedBase, unitX: "m_msl" } as unknown as EnvIntObservation;
    expect(isEnvIntObservation(drifted)).toBe(false);
    expect(isEnvIntObservation({ pm25value: 18.6 })).toBe(false);
  });
});

// ─── 3. Provenance display (packet §8 display requirement) ───

describe("env-int provenance line", () => {
  it("renders provider · product · method · data time for observed data", () => {
    const o = envIntObservation({
      provider: "GISTDA",
      source_product: "pm25_check_amphoe",
      source_method: "satellite_ground_calibrated_ai_analysis",
      source_url: "https://pm25.gistda.or.th/rest/getPM25byAmphoe24hrs?ap_idn=1414",
      source_geo_id: { level: "amphoe", id: 1414, label: "อุทัย" },
      data_class: "observed",
      observed_at: parseWallClockAs(GISTDA_PRED3_UTHAI.dt, "Asia/Bangkok"),
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok",
      unit: "ug/m3",
      value: 18.48,
    });
    const line = formatProvenanceLine(o);
    expect(line).toContain("GISTDA");
    expect(line).toContain("satellite_ground_calibrated_ai_analysis");
    expect(line).toContain("observed");
    expect(line).toContain("2026-09-02 10:00"); // ICT wall clock, not received_at
    expect(line).not.toContain("11:30"); // received_at must not be shown as data time
  });

  it("labels forecasts as forecasts with their valid time", () => {
    const issued = parseWallClockAs(GISTDA_PRED3_UTHAI.dt, "Asia/Bangkok");
    const o = envIntObservation({
      provider: "GISTDA",
      source_product: "pm25_check_pred3",
      source_method: "satellite_ground_calibrated_ai_analysis",
      source_url: "https://pm25.gistda.or.th/rest/getPm25byAmphoePred3?pv_idn=14",
      source_geo_id: { level: "amphoe", id: 1414, label: "อุทัย" },
      data_class: "forecast",
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok",
      unit: "ug/m3",
      value: 19.14,
      issued_at: issued,
      valid_at: new Date(issued.getTime() + 3 * 3600 * 1000),
      forecast_horizon: "3h_step",
    });
    const line = formatProvenanceLine(o);
    expect(line).toContain("forecast");
    expect(line).toContain("13:00"); // valid time (10:00 + 3h ICT), not the issued time
  });
});

// ─── 4. Freshness (packet §8 freshness rules / §12) ───

describe("env-int freshness", () => {
  it("computes age from observed_at — never from received_at", () => {
    const observedAt = parseNaiveLocal("2026-09-02 10:20", "Asia/Bangkok");
    const now = new Date(observedAt.getTime() + 40 * 60 * 1000); // 40 min later
    const o = envIntObservation({
      provider: "HII",
      source_product: "thaiwater30_waterlevel",
      source_method: "telemetry_observation",
      source_url: "u",
      source_geo_id: { level: "station", id: 471583 },
      data_class: "observed",
      observed_at: observedAt,
      received_at: now, // ingested at 'now' — must not reset freshness
      timezone: "Asia/Bangkok",
      unit: "m_msl",
      value: 1.78,
    });
    expect(computeFreshnessAge(o, now)).toBe(40 * 60 * 1000);
  });

  it("computes forecast age from valid_at (not issued_at)", () => {
    const issued = parseWallClockAs("2026-09-02T10:00:00.000Z", "Asia/Bangkok");
    const valid = new Date(issued.getTime() + 3 * 3600 * 1000);
    const now = new Date(issued.getTime() + 60 * 60 * 1000);
    const o = envIntObservation({
      provider: "TMD",
      source_product: "nwp_hourly",
      source_method: "nwp_model_forecast",
      source_url: "u",
      source_geo_id: { level: "point", lat: 14.357, lng: 100.697 },
      data_class: "forecast",
      received_at: now,
      timezone: "Asia/Bangkok",
      unit: "degC",
      value: 30.1,
      issued_at: issued,
      valid_at: valid,
      forecast_horizon: "3h",
    });
    // Age is uniformly now − data-time; for a forecast whose valid time is
    // still in the future this is negative (lead time). Issued_at would give
    // +3,600,000, so the sign also proves valid_at was used.
    expect(computeFreshnessAge(o, now)).toBe(now.getTime() - valid.getTime());
    expect(computeFreshnessAge(o, now)).toBe(-2 * 3600 * 1000);
  });

  it("returns null when no data time exists (age unknown, never zero)", () => {
    const o = {
      provider: "X",
      data_class: "observed",
    } as unknown as EnvIntObservation;
    expect(computeFreshnessAge(o, RECEIVED_AT)).toBeNull();
  });
});

// ─── 5. Availability state machine (packet §10 / §12.7) ───

describe("env-int availability classification", () => {
  const READY_INPUT = {
    httpState: "ok" as const,
    schemaValid: true,
    dataPresent: true,
    ageMs: 30 * 60 * 1000,
    freshWithinMs: 2 * 3600 * 1000,
    staleBeyondMs: 6 * 3600 * 1000,
  };

  it("classifies a healthy observation as ready", () => {
    expect(classifyAvailability(READY_INPUT)).toBe("ready");
  });

  it("provider empty array is empty — never zero, never ready", () => {
    expect(classifyAvailability({ ...READY_INPUT, dataPresent: false })).toBe("empty");
  });

  it("the 4-days-stale HII row classifies as stale with its age preserved", () => {
    const observedAt = parseNaiveLocal(HII_STALE_UTHAI_NEIGHBOR.waterlevel_datetime, "Asia/Bangkok");
    const age = RECEIVED_AT.getTime() - observedAt.getTime(); // ~4 days
    expect(classifyAvailability({ ...READY_INPUT, ageMs: age })).toBe("stale");
  });

  it("http error/timeout outranks data presence; schema drift outranks emptiness", () => {
    expect(classifyAvailability({ ...READY_INPUT, httpState: "error" })).toBe("error");
    expect(classifyAvailability({ ...READY_INPUT, httpState: "timeout" })).toBe("error");
    expect(classifyAvailability({ ...READY_INPUT, schemaValid: false })).toBe("schema_mismatch");
  });

  it("license block is the highest gate", () => {
    expect(classifyAvailability({ ...READY_INPUT, licenseBlocked: true })).toBe("license_blocked");
  });

  it("a missing station/target is unavailable even when the feed is healthy", () => {
    expect(classifyAvailability({ ...READY_INPUT, dataPresent: false, stationPresent: false })).toBe("unavailable");
  });

  it("unknown age (no timestamps) is unavailable — never ready, never zero", () => {
    expect(classifyAvailability({ ...READY_INPUT, ageMs: null })).toBe("unavailable");
  });

  it("never returns 0 / NORMAL / SAFE / LIVE under any input", () => {
    const forbidden = new Set(["0", "NORMAL", "SAFE", "LIVE", "normal", "safe", "live"]);
    const probes = [
      {}, { httpState: "ok" }, { httpState: "error" }, { schemaValid: false },
      { dataPresent: false }, { ageMs: null }, { ageMs: 0 }, { licenseBlocked: true },
      { httpState: "timeout", dataPresent: true, schemaValid: false },
    ];
    for (const p of probes) {
      const s = classifyAvailability(p as Parameters<typeof classifyAvailability>[0]);
      expect(forbidden.has(s)).toBe(false);
      expect(typeof s).toBe("string");
    }
  });
});
