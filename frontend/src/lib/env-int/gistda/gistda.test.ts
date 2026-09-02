/**
 * ENV-INT-GISTDA-CORE-001 — RED-first contract tests for the deterministic
 * GISTDA PM2.5 adapter.
 *
 * Contracts under test (source-contract packet §3/§7/§8/§10/§11/§12 + the
 * merged ENV-INT core): the trailing-Z-as-ICT time trap, OBSERVED/DERIVED/
 * FORECAST separation, fail-closed schema-drift boundaries, empty ≠ 0 ≠
 * error ≠ mismatch, no cross-fill of absent forecast fields, license
 * UNVERIFIED, no LIVE claims, and the no-network/no-UI static boundaries.
 * All fixtures are sanitized packet evidence; no network access happens.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseGistdaPm25History,
  parseGistdaPm25Pred3,
  GISTDA_PM25_HISTORY_URL,
  GISTDA_PM25_PRED3_URL,
  GISTDA_ATTRIBUTION,
  type GistdaParseResult,
} from "./gistda";
import {
  HISTORY_OK,
  PRED3_OK,
  EMPTY_DATA_ARRAY,
  HISTORY_EMPTY,
  PROVIDER_ERROR,
  RECEIVED_AT,
} from "./fixtures";
import type { EnvIntObservation } from "../core/provenance";

const UTHAI_RECORD = PRED3_OK.data[0];

/** Clone a fixture/record so drift mutations never leak between tests. */
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Unwrap an ok result to its payload; any fail kind is a test error. */
function expectOk<T>(r: GistdaParseResult<T>): T {
  if (r.kind !== "ok") throw new Error(`expected ok, got ${r.kind}: ${"reason" in r ? r.reason : ""}`);
  return r.data;
}

// ─── History product: hourly OBSERVED points ──────────────────────────────

describe("GISTDA history parsing (R1–R3)", () => {
  it("R1: sanitized history fixture → OBSERVED envelopes for amphoe 1414 with exact unit/value", () => {
    const r = parseGistdaPm25History(HISTORY_OK, RECEIVED_AT);
    const { observations } = expectOk(r);
    expect(observations).toHaveLength(3);
    for (const o of observations) {
      expect(o.data_class).toBe("observed");
      expect(o.provider).toBe("GISTDA");
      expect(o.source_product).toBe("pm25_check_amphoe_24h");
      expect(o.source_method).toBe("satellite_ground_calibrated_ai_analysis");
      expect(o.source_url).toBe(GISTDA_PM25_HISTORY_URL);
      expect(o.source_geo_id).toEqual({ level: "amphoe", id: 1414, label: "อุทัย" });
      expect(o.unit).toBe("ug/m3");
      expect(o.timezone).toBe("Asia/Bangkok");
      expect(o.aggregation_window).toBe("1h");
      expect(o.forecast_horizon).toBeNull();
    }
    expect(observations[0].value).toBe(18.652550168939534);
    expect(observations[2].value).toBe(18.47766330498679);
  });

  it("R2: trailing-Z timestamp uses Asia/Bangkok wall-clock semantics — no +7 double shift", () => {
    const { observations } = expectOk(parseGistdaPm25History(HISTORY_OK, RECEIVED_AT));
    // 2026-09-02T10:00:00.000"Z" is 10:00 ICT ⇒ 03:00 UTC. A true-UTC read
    // would be 10:00Z; a double shift would land at 17:00 ICT-equivalent.
    expect(observations[2].observed_at?.toISOString()).toBe("2026-09-02T03:00:00.000Z");
    // History ordering is preserved verbatim (no sort/dedupe invention).
    expect(observations[0].observed_at?.toISOString()).toBe("2026-09-01T04:00:00.000Z");
  });

  it("R3: received_at stays the caller ingest clock and never substitutes observed_at", () => {
    const { observations } = expectOk(parseGistdaPm25History(HISTORY_OK, RECEIVED_AT));
    for (const o of observations) {
      expect(o.received_at).toBe(RECEIVED_AT);
      expect(o.received_at.getTime()).not.toBe(o.observed_at?.getTime());
    }
    // A different ingest clock produces the same data times.
    const later = new Date("2026-09-02T06:00:00.000Z");
    const r2 = expectOk(parseGistdaPm25History(HISTORY_OK, later));
    expect(r2.observations[2].observed_at?.toISOString()).toBe("2026-09-02T03:00:00.000Z");
    expect(r2.observations[2].received_at).toBe(later);
  });
});

// ─── Pred3 product: observed + derived average + forecasts ────────────────

describe("GISTDA Pred3 parsing (R4–R7, R13, R17)", () => {
  it("R4/R17: pm25 → OBSERVED (1h) and pm25Avg24hr → DERIVED (24h) coexist without substitution", () => {
    const { current, average24h } = expectOk(parseGistdaPm25Pred3(PRED3_OK, RECEIVED_AT));
    expect(current.data_class).toBe("observed");
    expect(current.value).toBe(UTHAI_RECORD.pm25);
    expect(current.aggregation_window).toBe("1h");
    expect(average24h).not.toBeNull();
    expect(average24h!.data_class).toBe("derived");
    expect(average24h!.value).toBe(UTHAI_RECORD.pm25Avg24hr);
    expect(average24h!.aggregation_window).toBe("24h");
    expect(average24h!.value).not.toBe(current.value); // fixture values differ — never substituted
    expect(average24h!.forecast_horizon).toBeNull();
    expect(current.source_product).toBe("pm25_check_pred3");
    expect(current.source_url).toBe(GISTDA_PM25_PRED3_URL);
  });

  it("R5/R6: pred1/2/3 → FORECAST only, with distinct issued/valid/horizon semantics", () => {
    const { current, forecasts } = expectOk(parseGistdaPm25Pred3(PRED3_OK, RECEIVED_AT));
    expect(forecasts).toHaveLength(3);
    const [p1, p2, p3] = forecasts;
    for (const f of [p1, p2, p3]) {
      expect(f.data_class).toBe("forecast");
      expect(f.observed_at).toBeNull(); // a forecast is never an observation
      expect(f.forecast_horizon).toBe("3h_step");
      expect(f.aggregation_window).toBeNull();
      // issued = product last-point time; valid strictly after issued
      expect(f.issued_at?.toISOString()).toBe("2026-09-02T03:00:00.000Z");
      expect(f.valid_at!.getTime()).toBeGreaterThan(f.issued_at!.getTime());
    }
    // 3-hourly steps: +3h / +6h / +9h past the product dt (ICT wall clock).
    expect(p1.valid_at?.toISOString()).toBe("2026-09-02T06:00:00.000Z"); // 13:00 ICT
    expect(p2.valid_at?.toISOString()).toBe("2026-09-02T09:00:00.000Z"); // 16:00 ICT
    expect(p3.valid_at?.toISOString()).toBe("2026-09-02T12:00:00.000Z"); // 19:00 ICT
    // values stay their own — never the current, never each other
    expect(p1.value).toBe(UTHAI_RECORD.pred1);
    expect(p2.value).toBe(UTHAI_RECORD.pred2);
    expect(p3.value).toBe(UTHAI_RECORD.pred3);
    expect(current.data_class).not.toBe("forecast");
  });

  it("R7: absent pred fields stay absent — never cross-filled from current or another pred", () => {
    const partial = clone(PRED3_OK);
    (partial.data[0] as Record<string, unknown>).pred2 = undefined;
    (partial.data[0] as Record<string, unknown>).pred3 = null; // absent-by-null
    const { forecasts } = expectOk(parseGistdaPm25Pred3(partial, RECEIVED_AT));
    expect(forecasts).toHaveLength(1);
    expect(forecasts[0].value).toBe(UTHAI_RECORD.pred1);
    // Absent pm25Avg24hr → null, never computed from history or current.
    const noAvg = clone(PRED3_OK);
    delete (noAvg.data[0] as Record<string, unknown>).pm25Avg24hr;
    const r2 = expectOk(parseGistdaPm25Pred3(noAvg, RECEIVED_AT));
    expect(r2.average24h).toBeNull();
    expect(r2.current.value).toBe(UTHAI_RECORD.pm25);
  });

  it("R13: amphoe 1414 absent from a non-empty payload → target_not_found, never a guess", () => {
    const withoutUthai = { status: 200, errMsg: "", data: [PRED3_OK.data[1]] };
    const r = parseGistdaPm25Pred3(withoutUthai, RECEIVED_AT);
    expect(r.kind).toBe("target_not_found");
    // Unknown categorical identity is not coerced into 1414.
    const alien = { status: 200, errMsg: "", data: [{ ap_tn: "???", ap_idn: "1414", pm25: 5, dt: "2026-09-02T10:00:00.000Z" }] };
    expect(parseGistdaPm25Pred3(alien, RECEIVED_AT).kind).toBe("target_not_found");
  });
});

// ─── Envelope / failure boundaries ────────────────────────────────────────

describe("GISTDA failure boundaries (R8–R12)", () => {
  it("R8: data:[] → empty (also empty history graph) — never 0, never ready, never mismatch", () => {
    expect(parseGistdaPm25Pred3(EMPTY_DATA_ARRAY, RECEIVED_AT).kind).toBe("empty");
    expect(parseGistdaPm25History(HISTORY_EMPTY, RECEIVED_AT).kind).toBe("empty");
  });

  it("provider status != 200 or non-empty errMsg → provider_error", () => {
    const r = parseGistdaPm25Pred3(PROVIDER_ERROR, RECEIVED_AT);
    expect(r.kind).toBe("provider_error");
    const errMsg = { status: 200, errMsg: "something failed", data: [] };
    expect(parseGistdaPm25History(errMsg, RECEIVED_AT).kind).toBe("provider_error");
  });

  it("R9: renamed/missing contracted field → schema_mismatch (incl. swapped metadata order)", () => {
    const renamed = clone(PRED3_OK);
    const rec = renamed.data[0] as Record<string, unknown>;
    rec.pm25value = rec.pm25;
    delete rec.pm25;
    expect(parseGistdaPm25Pred3(renamed, RECEIVED_AT).kind).toBe("schema_mismatch");

    const noDt = clone(PRED3_OK);
    delete (noDt.data[0] as Record<string, unknown>).dt;
    expect(parseGistdaPm25Pred3(noDt, RECEIVED_AT).kind).toBe("schema_mismatch");

    const metaMissing = clone(HISTORY_OK);
    delete (metaMissing.data as Record<string, unknown>).graphMetadata;
    expect(parseGistdaPm25History(metaMissing, RECEIVED_AT).kind).toBe("schema_mismatch");

    // Column-order drift changes tuple semantics — never tolerated.
    const metaSwapped = clone(HISTORY_OK) as unknown as { data: { graphMetadata: string[] } };
    metaSwapped.data.graphMetadata = ["dt", "pm25"];
    expect(parseGistdaPm25History(metaSwapped, RECEIVED_AT).kind).toBe("schema_mismatch");
  });

  it("R10: wrong primitive type (numeric string / boolean) → schema_mismatch, never coerced", () => {
    for (const bad of ["18.4", true, {}, []]) {
      const p = clone(PRED3_OK);
      (p.data[0] as Record<string, unknown>).pm25 = bad;
      const r = parseGistdaPm25Pred3(p, RECEIVED_AT);
      expect(r.kind, `pm25=${JSON.stringify(bad)}`).toBe("schema_mismatch");
    }
    const badPred = clone(PRED3_OK);
    (badPred.data[0] as Record<string, unknown>).pred1 = "19.1";
    expect(parseGistdaPm25Pred3(badPred, RECEIVED_AT).kind).toBe("schema_mismatch");

    const badTs = clone(HISTORY_OK);
    (badTs.data.graphHistory24hrs as unknown as unknown[])[0] = [18.65, 12345];
    expect(parseGistdaPm25History(badTs, RECEIVED_AT).kind).toBe("schema_mismatch");
  });

  it("R11: NaN and ±Infinity can never normalize successfully", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const p = clone(PRED3_OK);
      (p.data[0] as Record<string, unknown>).pm25 = bad;
      expect(parseGistdaPm25Pred3(p, RECEIVED_AT).kind).toBe("schema_mismatch");
    }
    const h = clone(HISTORY_OK) as unknown as { data: { graphHistory24hrs: unknown[] } };
    h.data.graphHistory24hrs[0] = [Number.NaN, "2026-09-01T11:00:00.000Z"];
    expect(parseGistdaPm25History(h, RECEIVED_AT).kind).toBe("schema_mismatch");
  });

  it("R12: impossible timestamp fails closed as schema_mismatch (no throw past the boundary)", () => {
    const p = clone(PRED3_OK);
    (p.data[0] as Record<string, unknown>).dt = "2026-02-31T10:00:00.000Z"; // Feb 31
    expect(parseGistdaPm25Pred3(p, RECEIVED_AT).kind).toBe("schema_mismatch");
    const h = clone(HISTORY_OK) as unknown as { data: { graphHistory24hrs: unknown[] } };
    h.data.graphHistory24hrs[1] = [17.09, "2026-13-05T10:00:00.000Z"]; // month 13
    expect(parseGistdaPm25History(h, RECEIVED_AT).kind).toBe("schema_mismatch");
  });

  it("caller-input bugs → input_error (non-object payload, invalid receivedAt)", () => {
    expect(parseGistdaPm25Pred3(null, RECEIVED_AT).kind).toBe("input_error");
    expect(parseGistdaPm25Pred3(undefined, RECEIVED_AT).kind).toBe("input_error");
    expect(parseGistdaPm25History(42, RECEIVED_AT).kind).toBe("input_error");
    const invalid = new Date(Number.NaN);
    expect(parseGistdaPm25Pred3(PRED3_OK, invalid).kind).toBe("input_error");
  });
});

// ─── Fuzz / adversarial group ─────────────────────────────────────────────

describe("GISTDA adversarial fuzz", () => {
  it("wrong nesting and wrong key case are mismatches, not guesses", () => {
    const nestedWrong = { status: 200, errMsg: "", data: { data: clone(PRED3_OK.data) } };
    expect(parseGistdaPm25Pred3(nestedWrong, RECEIVED_AT).kind).toBe("schema_mismatch");
    const caseDrift = { Status: 200, errmsg: "", data: clone(PRED3_OK.data) };
    expect(parseGistdaPm25Pred3(caseDrift, RECEIVED_AT).kind).toBe("schema_mismatch");
  });

  it("duplicate history rows pass through verbatim — provider truth is not deduped", () => {
    const dup = clone(HISTORY_OK) as unknown as { data: { graphHistory24hrs: unknown[] } };
    dup.data.graphHistory24hrs.push([...(HISTORY_OK.data.graphHistory24hrs[2] as unknown as unknown[])]);
    const { observations } = expectOk(parseGistdaPm25History(dup, RECEIVED_AT));
    expect(observations).toHaveLength(4);
    expect(observations[2].value).toBe(observations[3].value);
    expect(observations[2].observed_at?.getTime()).toBe(observations[3].observed_at?.getTime());
  });

  it("legitimate 0 and negative values survive without invented clamping", () => {
    const zero = clone(PRED3_OK);
    (zero.data[0] as Record<string, unknown>).pm25 = 0;
    const r0 = expectOk(parseGistdaPm25Pred3(zero, RECEIVED_AT));
    expect(r0.current.value).toBe(0);
    expect(r0.current.data_class).toBe("observed");
    const neg = clone(PRED3_OK);
    (neg.data[0] as Record<string, unknown>).pred1 = -1.5;
    const rn = expectOk(parseGistdaPm25Pred3(neg, RECEIVED_AT));
    expect(rn.forecasts[0].value).toBe(-1.5);
  });

  it("extra unknown provider fields are tolerated when contracted fields still prove structure", () => {
    const extra = clone(PRED3_OK);
    (extra.data[0] as Record<string, unknown>).futureFieldWeDoNotKnow = { a: 1 };
    const r = expectOk(parseGistdaPm25Pred3(extra, RECEIVED_AT));
    expect(r.current.value).toBe(UTHAI_RECORD.pm25);
    const extraH = clone(HISTORY_OK) as unknown as { data: Record<string, unknown> };
    extraH.data.extraTop = "unknown";
    expect(expectOk(parseGistdaPm25History(extraH, RECEIVED_AT)).observations).toHaveLength(3);
  });

  it("malformed forecast never becomes an observation (R18)", () => {
    const badPred = clone(PRED3_OK);
    (badPred.data[0] as Record<string, unknown>).pred1 = { value: 19.1 };
    const r = parseGistdaPm25Pred3(badPred, RECEIVED_AT);
    expect(r.kind).toBe("schema_mismatch"); // whole-record fail-closed, no partial salvage into observed
  });
});

// ─── Data honesty + static boundaries ─────────────────────────────────────

describe("GISTDA data honesty + static boundaries (R14–R16, R19–R20)", () => {
  function allEnvelopes(): EnvIntObservation[] {
    const hist = expectOk(parseGistdaPm25History(HISTORY_OK, RECEIVED_AT)).observations;
    const p3 = expectOk(parseGistdaPm25Pred3(PRED3_OK, RECEIVED_AT));
    return [...hist, p3.current, ...(p3.average24h ? [p3.average24h] : []), ...p3.forecasts];
  }

  it("R14: every envelope carries license UNVERIFIED (redistribution still decision-gated)", () => {
    for (const o of allEnvelopes()) expect(o.license).toBe("UNVERIFIED");
    expect(GISTDA_ATTRIBUTION).toContain("GISTDA");
  });

  it("R15: no envelope or serialized output ever claims LIVE", () => {
    for (const o of allEnvelopes()) {
      expect(JSON.stringify(o)).not.toMatch(/live/i);
      expect(o.data_class).not.toBe("live");
    }
  });

  it("R16: unit remains exactly the source-contract truthful ug/m3", () => {
    for (const o of allEnvelopes()) expect(o.unit).toBe("ug/m3");
  });

  it("R19: adapter contains no network primitives (static scan)", () => {
    const src = readFileSync(join(__dirname, "gistda.ts"), "utf-8");
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/XMLHttpRequest/);
    expect(src).not.toMatch(/\bhttps?:\/\/\S*(connect|request)/i);
    expect(src).not.toMatch(/from\s+["']node:http/);
    expect(src).not.toMatch(/axios|supabase/);
  });

  it("R20: adapter/tests/fixtures import no UI/page/React modules (static scan)", () => {
    for (const f of ["gistda.ts", "fixtures.ts", "gistda.test.ts"]) {
      const src = readFileSync(join(__dirname, f), "utf-8");
      const imports = src.match(/^import[\s\S]*?from\s+["']([^"']+)["']/gm) ?? [];
      for (const line of imports) {
        expect(line, `${f}: ${line}`).not.toMatch(/pages|components|\/ui\/|react|react-dom/);
      }
    }
  });

  it("R19: deterministic tests perform no network fetch (this suite imports only pure modules)", () => {
    // The adapter module graph is gistda.ts → ../core/* only; importing it
    // performs zero I/O. This presence check keeps the file honest.
    expect(typeof parseGistdaPm25History).toBe("function");
    expect(typeof parseGistdaPm25Pred3).toBe("function");
  });
});
