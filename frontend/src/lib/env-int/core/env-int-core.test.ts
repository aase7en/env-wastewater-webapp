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
  type EnvIntAvailability,
} from "./provenance";
import { parseWallClockAs, parseNaiveLocal } from "./time";
import { computeFreshnessAge, classifyAvailability, classifyFreshness } from "./freshness";

// F1 type contract (checked by `tsc -b`): canonical CMD-001 semantics —
// `stale` is a FRESHNESS state, never an availability state. RED at the
// reviewed head: EnvIntAvailability still includes "stale".
type StaleIsNotAvailability = Extract<EnvIntAvailability, "stale"> extends never ? true : never;
const _staleIsNotAvailability: StaleIsNotAvailability = true;
void _staleIsNotAvailability;

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

  // F5 (review finding 5): impossible wall clocks must THROW — never return
  // an Invalid Date, never silently normalize. RED at the reviewed head: the
  // prefix regex accepted these and new Date(...) produced Invalid Date.
  it("rejects impossible calendar components instead of returning Invalid Date", () => {
    const impossible = [
      "2026-00-05T10:00", // month 00
      "2026-13-05T10:00", // month 13
      "2026-09-00T10:00", // day 00
      "2026-02-31T10:00", // Feb 31
      "2023-02-29T10:00", // invalid leap day (2023 is not a leap year)
    ];
    for (const s of impossible) {
      expect(() => parseWallClockAs(s, "Asia/Bangkok"), s).toThrowError(/timestamp/);
      expect(() => parseNaiveLocal(s.replace("T", " "), "Asia/Bangkok"), s).toThrowError(/timestamp/);
    }
  });

  it("rejects impossible time components (hour 24/25, minute 60, second 60)", () => {
    expect(() => parseWallClockAs("2026-09-02T24:00", "Asia/Bangkok")).toThrowError(/timestamp/);
    expect(() => parseWallClockAs("2026-09-02T25:10", "Asia/Bangkok")).toThrowError(/timestamp/);
    expect(() => parseWallClockAs("2026-09-02T10:60", "Asia/Bangkok")).toThrowError(/timestamp/);
    expect(() => parseWallClockAs("2026-09-02T10:20:60", "Asia/Bangkok")).toThrowError(/timestamp/);
  });

  it("rejects trailing junk and malformed suffix/offset instead of silently normalizing", () => {
    expect(() => parseWallClockAs("2026-09-02 10:20junk", "Asia/Bangkok")).toThrowError(/timestamp/);
    // A syntactically impossible offset used to be silently stripped and the
    // string re-parsed as valid ICT — that is silent normalization.
    expect(() => parseWallClockAs("2026-09-02T10:00+99:99", "Asia/Bangkok")).toThrowError(/timestamp/);
    // The naive-local contract carries NO zone designator at all.
    expect(() => parseNaiveLocal("2026-09-02 10:20Z", "Asia/Bangkok")).toThrowError(/timestamp/);
  });

  it("accepts a real leap day and preserves compact/valid offset forms (unreliable suffix ignored)", () => {
    expect(parseWallClockAs("2024-02-29T10:00", "Asia/Bangkok").toISOString())
      .toBe("2024-02-29T03:00:00.000Z");
    // +0700/-05:30 are syntactically valid suffixes; the wall-clock contract
    // ignores them (products using this parser have unreliable suffixes).
    expect(parseWallClockAs("2026-09-02T10:00+0700", "Asia/Bangkok").toISOString())
      .toBe("2026-09-02T03:00:00.000Z");
    expect(parseWallClockAs("2026-09-02T10:00-05:30", "Asia/Bangkok").toISOString())
      .toBe("2026-09-02T03:00:00.000Z");
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

  // F3 (review finding 3): explicit unavailability must NEVER carry a value —
  // fail closed at the builder instead of silently discarding it. RED at the
  // reviewed head: unavailable + value 18.4 built without complaint.
  it("UNAVAILABLE + non-null value is rejected by the builder (fail closed)", () => {
    const base = {
      provider: "GISTDA",
      source_product: "pm25_check_amphoe",
      source_method: "satellite_ground_calibrated_ai_analysis",
      source_url: "https://pm25.gistda.or.th/rest/getPM25byAmphoe24hrs?ap_idn=1414",
      source_geo_id: { level: "amphoe" as const, id: 1414, label: "อุทัย" },
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok" as const,
      unit: "ug/m3" as const,
    };
    expect(() =>
      envIntObservation({ ...base, data_class: "unavailable", value: 18.4 }),
    ).toThrowError(/unavailable.*value|value.*unavailable/);
    // Explicit zero is equally contradictory: unavailable ≠ measured zero.
    expect(() =>
      envIntObservation({ ...base, data_class: "unavailable", value: 0 }),
    ).toThrowError(/unavailable.*value|value.*unavailable/);
    const u = envIntObservation({ ...base, data_class: "unavailable" });
    expect(u.data_class).toBe("unavailable");
    expect(u.value).toBeNull();
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

  // F4 (review finding 4): the guard is the provider-adapter boundary — it
  // must validate TYPES and ranges, not just key presence. Every case below
  // must be `false` so malformed payloads map to schema_mismatch upstream
  // instead of passing as observations. RED at the reviewed head.
  describe("structural guard hardening (F4)", () => {
    const VALID_OBSERVED = envIntObservation({
      provider: "HII",
      source_product: "thaiwater30_waterlevel",
      source_method: "telemetry_observation",
      source_url: "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load",
      source_geo_id: { level: "station", id: 471583, label: "คลองชองสะเดา" },
      data_class: "observed",
      observed_at: parseNaiveLocal(HII_UTHAI.waterlevel_datetime, "Asia/Bangkok"),
      received_at: RECEIVED_AT,
      timezone: "Asia/Bangkok",
      unit: "m_msl",
      value: 1.78,
    });
    const mutate = (over: Record<string, unknown>): unknown =>
      ({ ...VALID_OBSERVED, ...over });

    it("accepts the valid envelope (control)", () => {
      expect(isEnvIntObservation(VALID_OBSERVED)).toBe(true);
    });

    it("value must be a finite number or null — never string/NaN/Infinity/object/array", () => {
      expect(isEnvIntObservation(mutate({ value: "18.4" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ value: Number.NaN }))).toBe(false);
      expect(isEnvIntObservation(mutate({ value: Number.POSITIVE_INFINITY }))).toBe(false);
      expect(isEnvIntObservation(mutate({ value: Number.NEGATIVE_INFINITY }))).toBe(false);
      expect(isEnvIntObservation(mutate({ value: { v: 18.4 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ value: [18.4] }))).toBe(false);
      expect(isEnvIntObservation(mutate({ value: true }))).toBe(false);
      expect(isEnvIntObservation(mutate({ value: null }))).toBe(true); // null is the honest unknown
    });

    it("timezone must be a verified EnvIntZone (Asia/Bangkok only today)", () => {
      expect(isEnvIntObservation(mutate({ timezone: "Asia/Tokyo" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ timezone: "asia/bangkok" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ timezone: "UTC" }))).toBe(false);
    });

    it("identity strings must be non-empty; url/unit/license must be strings", () => {
      expect(isEnvIntObservation(mutate({ provider: "" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ provider: "   " }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_product: "" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_method: "" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_url: 123 }))).toBe(false);
      expect(isEnvIntObservation(mutate({ unit: 5 }))).toBe(false);
      expect(isEnvIntObservation(mutate({ license: 5 }))).toBe(false);
    });

    it("source_geo_id must be an object with a valid level and number/null id, ranged lat/lng, string/null label", () => {
      expect(isEnvIntObservation(mutate({ source_geo_id: null }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: "station" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "country", id: 1 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { id: 1 } }))).toBe(false); // no level
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "station", id: "1414" } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "point", lat: 90.0001, lng: 100 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "point", lat: -91, lng: 100 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "point", lat: 14.3, lng: 180.5 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "point", lat: 14.3, lng: -181 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "point", lat: "14.3", lng: 100 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "point", lat: Number.POSITIVE_INFINITY, lng: 100 } }))).toBe(false);
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "station", id: 471583, label: 7 } }))).toBe(false);
      // Boundary coordinates are legitimate.
      expect(isEnvIntObservation(mutate({ source_geo_id: { level: "point", lat: 90, lng: -180 } }))).toBe(true);
    });

    it("Dates must be valid Dates — Invalid Date is malformed, not data", () => {
      expect(isEnvIntObservation(mutate({ received_at: new Date("not-a-date") }))).toBe(false);
      expect(isEnvIntObservation(mutate({ received_at: "2026-09-02T04:30:00.000Z" }))).toBe(false);
      expect(isEnvIntObservation(mutate({ observed_at: new Date(Number.NaN) }))).toBe(false);
      expect(isEnvIntObservation(mutate({ issued_at: new Date(Number.NaN) }))).toBe(false);
      expect(isEnvIntObservation(mutate({ valid_at: "2026-09-02" }))).toBe(false);
    });

    it("class-contract string fields must be string or null (never numbers)", () => {
      expect(isEnvIntObservation(mutate({ aggregation_window: 24 }))).toBe(false);
      expect(isEnvIntObservation(mutate({ forecast_horizon: 3 }))).toBe(false);
      expect(isEnvIntObservation(mutate({ simulation_ref: 42 }))).toBe(false);
      expect(isEnvIntObservation(mutate({ data_class: "estimated" }))).toBe(false);
    });

    it("unavailable carrying a value is rejected by the guard too (F3)", () => {
      const contradictory = { ...VALID_OBSERVED, data_class: "unavailable", value: 5 };
      expect(isEnvIntObservation(contradictory)).toBe(false);
    });
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
    staleBeyondMs: 6 * 3600 * 1000,
  };

  it("classifies a healthy observation as ready", () => {
    expect(classifyAvailability(READY_INPUT)).toBe("ready");
  });

  it("provider empty array is empty — never zero, never ready", () => {
    expect(classifyAvailability({ ...READY_INPUT, dataPresent: false })).toBe("empty");
  });

  it("the 4-days-old HII row stays AVAILABLE (ready); staleness is a freshness fact, not availability (F1)", () => {
    const observedAt = parseNaiveLocal(HII_STALE_UTHAI_NEIGHBOR.waterlevel_datetime, "Asia/Bangkok");
    const age = RECEIVED_AT.getTime() - observedAt.getTime(); // ~4 days
    // Old data with a valid factor chain is still usable evidence — canonical
    // CMD-001: "stale is not an availability state".
    expect(classifyAvailability({ ...READY_INPUT, ageMs: age })).toBe("ready");
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

  // F2 (review finding 2): `loading` was declared but unreachable — an
  // unknown/not-started transport fell through to `unavailable`. RED at the
  // reviewed head: classifyAvailability({loading:true}) returned "unavailable".
  it("loading input → loading (declared states must be reachable)", () => {
    expect(classifyAvailability({ loading: true })).toBe("loading");
    expect(classifyAvailability({ ...READY_INPUT, loading: true })).toBe("loading");
  });

  it("loading never masks a KNOWN license/schema/transport failure", () => {
    expect(classifyAvailability({ ...READY_INPUT, loading: true, licenseBlocked: true }))
      .toBe("license_blocked");
    expect(classifyAvailability({ ...READY_INPUT, loading: true, httpState: "error" }))
      .toBe("error");
    expect(classifyAvailability({ ...READY_INPUT, loading: true, schemaValid: false }))
      .toBe("schema_mismatch");
  });

  it("never returns 0 / NORMAL / SAFE / LIVE under any input", () => {
    const forbidden = new Set(["0", "NORMAL", "SAFE", "LIVE", "normal", "safe", "live"]);
    const probes = [
      {}, { httpState: "ok" }, { httpState: "error" }, { schemaValid: false },
      { dataPresent: false }, { ageMs: null }, { ageMs: 0 }, { licenseBlocked: true },
      { loading: true },
      { httpState: "timeout", dataPresent: true, schemaValid: false },
    ];
    for (const p of probes) {
      const s = classifyAvailability(p as Parameters<typeof classifyAvailability>[0]);
      expect(forbidden.has(s)).toBe(false);
      expect(typeof s).toBe("string");
    }
  });
});

// ─── 6. Freshness dimension (F1 split — canonical CMD-001 §5.2) ───

describe("env-int freshness dimension (classifyFreshness)", () => {
  const POLICY = 6 * 3600 * 1000; // 6h verified cadence

  it("current: data time within the verified cadence policy", () => {
    expect(classifyFreshness({ ageMs: 30 * 60 * 1000, staleBeyondMs: POLICY })).toBe("current");
  });

  it("stale: data time strictly beyond the policy", () => {
    expect(classifyFreshness({ ageMs: 4 * 24 * 3600 * 1000, staleBeyondMs: POLICY })).toBe("stale");
  });

  it("boundary: age exactly at the threshold is still current (stale is strictly beyond)", () => {
    expect(classifyFreshness({ ageMs: POLICY, staleBeyondMs: POLICY })).toBe("current");
  });

  it("unknown age → unknown — never zero, never current", () => {
    expect(classifyFreshness({ ageMs: null, staleBeyondMs: POLICY })).toBe("unknown");
    expect(classifyFreshness({ staleBeyondMs: POLICY })).toBe("unknown");
    expect(classifyFreshness({ ageMs: Number.NaN, staleBeyondMs: POLICY })).toBe("unknown");
  });

  it("no verified cadence policy → unknown (current is never claimed without policy support)", () => {
    expect(classifyFreshness({ ageMs: 1000, staleBeyondMs: null })).toBe("unknown");
    expect(classifyFreshness({ ageMs: 1000 })).toBe("unknown");
  });

  it("negative age (future forecast valid time) is legitimate lead time — current, never clamped", () => {
    expect(classifyFreshness({ ageMs: -2 * 3600 * 1000, staleBeyondMs: POLICY })).toBe("current");
  });

  it("orthogonal composition: old-but-valid data is ready availability + stale freshness", () => {
    const age = 4 * 24 * 3600 * 1000;
    const input = {
      httpState: "ok" as const,
      schemaValid: true,
      dataPresent: true,
      ageMs: age,
      staleBeyondMs: POLICY,
    };
    expect(classifyAvailability(input)).toBe("ready");
    expect(classifyFreshness(input)).toBe("stale");
  });

  it("unavailable target composes with unknown freshness (no data time to judge)", () => {
    expect(classifyAvailability({ stationPresent: false })).toBe("unavailable");
    expect(classifyFreshness({ ageMs: null, staleBeyondMs: POLICY })).toBe("unknown");
  });
});
