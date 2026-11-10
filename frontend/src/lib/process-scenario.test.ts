import { describe, expect, it } from "vitest";

import { PROCESS_EXPLANATION } from "./environmental-flow";
import type {
  EnvironmentalFlowModel,
  ProcessExplanationEdgeId,
  ProcessExplanationStageId,
} from "./environmental-flow";
import {
  deriveScenarioSensitivities,
  deriveScenarioState,
  deriveScenarioWasDifference,
  formatScenarioFactorVersion,
  formatScenarioNumber,
  type ScenarioActivityBaseEvidence,
  type ScenarioDefinition,
  type ScenarioNumericEffects,
} from "./process-scenario";
import { NUMERIC_EFFECT_EMISSION_FACTORS } from "./process-scenarios";
import { PROCESS_SCENARIOS } from "./__fixtures__/process-scenarios";

/**
 * ENV-VIS-STORY-001B-C1 — deterministic scenario contract (RED-first).
 * Pins the frozen D1 contract table: the six SSoT rule-5 scenarios,
 * never-blends semantics, zero numeric effects, and purity. The
 * domain-owner numeric gate stays UNPASSED — nothing here may introduce
 * quantities, units, or observed timestamps.
 */

describe("ENV-VIS-STORY-001B scenario inventory (rule 5)", () => {
  it("exposes exactly the six SSoT simulation scenarios with Thai labels", () => {
    expect(PROCESS_SCENARIOS.map((s) => s.id)).toEqual([
      "pump-sump-bypass-active",
      "emergency-overflow-active",
      "loss-of-aeration",
      "ras-interruption",
      "excess-sludge-wasting",
      "chlorine-dosing-interruption",
    ]);
    for (const scenario of PROCESS_SCENARIOS) {
      expect(scenario.label.length).toBeGreaterThan(0);
      expect(scenario.label).toMatch(/[\u0E00-\u0E7F]/);
      expect(scenario.provenance).toEqual({ source: "simulation", observedAt: null });
      expect(scenario.assumptions.length).toBeGreaterThan(0);
    }
  });

  it("every edgeOverride key is a known topology edge id", () => {
    const known = new Set<string>(PROCESS_EXPLANATION.edges.map((e) => e.id));
    for (const scenario of PROCESS_SCENARIOS) {
      for (const key of Object.keys(scenario.edgeOverrides ?? {})) {
        expect(known.has(key)).toBe(true);
      }
    }
  });

  it("the exported literal id unions stay pinned to the live topology", () => {
    // Pins the frozen TOPOLOGY_* tuples to PROCESS_EXPLANATION so the
    // compile-time unions can never drift from the actual edges/stages.
    const edgeIdSample: ProcessExplanationEdgeId = PROCESS_EXPLANATION.edges[0].id;
    const stageIdSample: ProcessExplanationStageId = PROCESS_EXPLANATION.stages[0].id;
    expect(typeof edgeIdSample).toBe("string");
    expect(typeof stageIdSample).toBe("string");
    expect(new Set(PROCESS_EXPLANATION.edges.map((e) => e.id)).size).toBe(13);
    expect(new Set(PROCESS_EXPLANATION.stages.map((s) => s.id)).size).toBe(8);
  });

  it("rejects unknown edge ids at runtime (fail closed)", () => {
    const bad = {
      ...PROCESS_SCENARIOS[0],
      edgeOverrides: { "not-an-edge": "active-path" },
    } as unknown as ScenarioDefinition;
    expect(() => deriveScenarioState(bad)).toThrow(/UNKNOWN_SCENARIO_EDGE/);
  });
});

describe("deriveScenarioState — contract table semantics", () => {
  it("returns all 13 edges in stable topology order with topology fields retained", () => {
    const state = deriveScenarioState(PROCESS_SCENARIOS[2]);
    expect(state.edges.map((e) => e.id)).toEqual(PROCESS_EXPLANATION.edges.map((e) => e.id));
    for (let i = 0; i < state.edges.length; i += 1) {
      const out = state.edges[i];
      const topo = PROCESS_EXPLANATION.edges[i];
      expect(out.from).toBe(topo.from);
      expect(out.to).toBe(topo.to);
      expect(out.medium).toBe(topo.medium);
      expect(out.kind).toBe(topo.kind);
      expect(out.activity).toBe(topo.activity);
      expect(out.tieIn).toBe(topo.tieIn);
    }
  });

  it("untouched edges are baseline; overridden edges carry their scenario condition", () => {
    const bypass = deriveScenarioState(PROCESS_SCENARIOS[0]);
    const target = bypass.edges.find((e) => e.id === "pump-sump-bypass");
    expect(target?.scenarioState).toBe("active-path");
    // Hypothetical activation NEVER resolves the as-built uncertainty.
    expect(target?.tieIn).toBe("needs_confirmation");
    expect(target?.activity).toBe("unknown");
    for (const edge of bypass.edges.filter((e) => e.id !== "pump-sump-bypass")) {
      expect(edge.scenarioState).toBe("baseline");
    }
  });

  it("loss-of-aeration interrupts the aeration_tank process and touches NO water edge", () => {
    const state = deriveScenarioState(PROCESS_SCENARIOS[2]);
    const aeration = state.stages.find((s) => s.id === "aeration_tank");
    expect(aeration?.scenarioProcess).toBe("process-interrupted");
    for (const stage of state.stages.filter((s) => s.id !== "aeration_tank")) {
      expect(stage.scenarioProcess).toBeUndefined();
    }
    for (const edge of state.edges) {
      expect(edge.scenarioState).toBe("baseline");
    }
  });

  it("ras-interruption and chlorine-dosing-interruption mark only their edges", () => {
    const ras = deriveScenarioState(PROCESS_SCENARIOS[3]);
    expect(ras.edges.find((e) => e.id === "ras-return")?.scenarioState).toBe("interrupted");
    const chlorine = deriveScenarioState(PROCESS_SCENARIOS[5]);
    expect(chlorine.edges.find((e) => e.id === "chlorine-dosing")?.scenarioState).toBe("interrupted");
  });
});

describe("never-blends and purity invariants", () => {
  it("carries simulation provenance and zero numeric vocabulary", () => {
    for (const scenario of PROCESS_SCENARIOS) {
      const state = deriveScenarioState(scenario);
      expect(state.provenance).toEqual({ source: "simulation", observedAt: null });
      const serialized = JSON.stringify(state);
      expect(serialized).not.toMatch(/"unit"|"quantity"|"value"|"do"|"kg"|co2e|mg\/l/i);
      expect(serialized).not.toMatch(/"latest"|"live"|"historical"/i);
    }
  });

  it("is deterministic and does not mutate its input", () => {
    const scenario = PROCESS_SCENARIOS[4];
    const snapshot = JSON.parse(JSON.stringify(scenario)) as ScenarioDefinition;
    const first = deriveScenarioState(scenario);
    const second = deriveScenarioState(scenario);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(JSON.parse(JSON.stringify(scenario))).toEqual(snapshot);
  });

  it("scenario output cannot be assigned to the operational flow model (no adapter)", () => {
    const state = deriveScenarioState(PROCESS_SCENARIOS[0]);
    // Compile-time never-blends: the scenario state lacks the operational
    // model's required evidence fields, so no adapter can silently exist.
    // @ts-expect-error — ScenarioState is not an EnvironmentalFlowModel
    const blended: EnvironmentalFlowModel = state;
    expect(blended).toBe(state);
  });

  it("unknown edge ids are rejected at the type level", () => {
    // @ts-expect-error — "not-an-edge" is not a ProcessExplanationEdgeId
    const bad: ScenarioDefinition = { ...PROCESS_SCENARIOS[0], edgeOverrides: { "not-an-edge": "active-path" } };
    expect(bad).toBeDefined();
    // @ts-expect-error — only the aeration_tank qualitative override exists in C1
    const badStage: ScenarioDefinition = { ...PROCESS_SCENARIOS[0], stageOverrides: { fine_screen: { aeration: "interrupted" } } };
    expect(badStage).toBeDefined();
  });
});

describe("ENV-VIS-STORY-001B-VIEW production catalog (RED-first)", () => {
  it("exposes PROCESS_SCENARIO_CATALOG as the single six-scenario source", async () => {
    const catalog = await import("./process-scenarios");
    expect(catalog.PROCESS_SCENARIO_CATALOG).toHaveLength(6);
    expect(catalog.PROCESS_SCENARIO_CATALOG.map((s) => s.id)).toEqual(
      PROCESS_SCENARIOS.map((s) => s.id),
    );
  });

  it("the fixture export IS the catalog (re-export, not a copy)", async () => {
    const catalog = await import("./process-scenarios");
    expect(PROCESS_SCENARIOS).toBe(catalog.PROCESS_SCENARIO_CATALOG);
  });

  it("production source never imports __fixtures__", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      });
    const srcRoot = path.resolve(__dirname, "..");
    // Pins actual IMPORT/EXPORT statements (named, dynamic, bare
    // side-effect, re-export, .js-suffixed) — doc-comment mentions of the
    // fixture path are explanatory, not dependencies.
    const importPattern =
      /(?:^|\n)\s*(?:import|export)[^;\n]*["'][^"']*__fixtures__\/process-scenarios(?:\.js)?["']/;
    const offenders = walk(srcRoot).filter(
      (file) =>
        !file.includes("__fixtures__") &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".spec.ts") &&
        importPattern.test(fs.readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});

// ── ENV-VIS-STORY-001-NUM: simulated numeric effects N3 + N4 (RED-first) ──
//
// Owner numeric gate decision 2026-11-10 (issue #110): N3 (WAS difference,
// simulated − recorded) APPROVED with the recorded-value-precedence rule;
// N4 (resource/emission sensitivities) APPROVED contingent on cited-versioned
// GHG-management factors; no factor = no effect (render nothing, not zero);
// unknown stays unknown — ห้ามแทนค่าศูนย์. Everything here stays SIMULATED
// and separate from the frozen qualitative ScenarioState contract above.

function numericEffectsProbe(scenario: ScenarioDefinition): ScenarioNumericEffects | undefined {
  return scenario.numericEffects;
}

const numericScenario = (id: string) => {
  const found = PROCESS_SCENARIOS.find((scenario) => scenario.id === id);
  expect(found).toBeDefined();
  return found!;
};

/** D5 P2-3: typed activity-base evidence envelope (confirmed, per-day). */
const confirmedDailyBase = (value: number): { aerationBlowerRuntimeKwh: ScenarioActivityBaseEvidence } => ({
  aerationBlowerRuntimeKwh: {
    sourceId: "relay-duty-cycle-reference",
    status: "confirmed-by-owner",
    period: "daily",
    value,
  },
});

/**
 * D5 P2-3 fixture: the loss-of-aeration spec with its DECLARED base flipped
 * to confirmed-by-owner (the shipped catalog stays pending → omitted).
 */
const confirmedAerationFixture = (): ScenarioDefinition => {
  const base = numericScenario("loss-of-aeration");
  const spec = base.numericEffects?.sensitivities?.[0];
  expect(spec).toBeDefined();
  return {
    ...base,
    numericEffects: {
      sensitivities: [
        {
          ...spec!,
          activityBase: { ...spec!.activityBase, status: "confirmed-by-owner" },
        },
      ],
    },
  };
};

describe("ENV-VIS-STORY-001-NUM — N3 WAS difference (RED-first)", () => {
  it("declares a versioned simulated proposed volume on exactly the WAS scenario", () => {
    const effects = numericEffectsProbe(numericScenario("excess-sludge-wasting"));
    const proposed = effects?.wasDifference?.proposed;
    expect(proposed?.value).toBe(1.5);
    expect(proposed?.unit).toBe("m³/วัน");
    expect(proposed?.assumptionClass).toBe("declared-model-assumption");
    expect(proposed?.assumptionId).toBe("001-NUM-v1");
    expect(proposed?.note).toMatch(/สมมุติ|สมมติ/);
    expect(proposed?.note).toMatch(/ไม่ใช่ค่าบันทึก/);
    for (const other of PROCESS_SCENARIOS.filter((s) => s.id !== "excess-sludge-wasting")) {
      expect(numericEffectsProbe(other)?.wasDifference).toBeUndefined();
    }
  });

  it("recorded precedence: recorded value kept separate, never overwritten, difference = proposed − recorded", () => {
    const definition = numericScenario("excess-sludge-wasting");
    const snapshot = JSON.stringify(definition);
    const effect = deriveScenarioWasDifference(definition, 1.75);
    expect(effect).toBeTruthy();
    expect(effect?.recorded?.value).toBe(1.75);
    expect(effect?.recorded?.field).toBe("excess_sludge_removed");
    expect(effect?.recorded?.unit).toBe("m³");
    expect(effect?.difference).toBeCloseTo(1.5 - 1.75, 6);
    expect(effect?.displayPrecedence).toBe("recorded");
    expect(effect?.formula).toMatch(/proposed/);
    expect(effect?.provenance).toEqual({ source: "simulation", observedAt: null });
    // The recorded evidence input is never mutated; the definition is untouched.
    expect(JSON.stringify(definition)).toBe(snapshot);
  });

  it("unknown recorded never becomes zero: difference stays null, precedence falls to simulated", () => {
    const definition = numericScenario("excess-sludge-wasting");
    const effect = deriveScenarioWasDifference(definition, null);
    expect(effect?.recorded).toBeNull();
    expect(effect?.difference).toBeNull();
    expect(effect?.displayPrecedence).toBe("simulated");
    const serialized = JSON.stringify(effect);
    // ห้ามแทนค่าศูนย์: neither side may be coerced to zero.
    expect(serialized).not.toMatch(/"difference":\s*0[,}]/);
    expect(serialized).not.toMatch(/"value":\s*0[,}]/);
  });

  it("no proposed declaration → no effect; derivation is deterministic, pure and never blends vocabulary", () => {
    expect(deriveScenarioWasDifference(numericScenario("pump-sump-bypass-active"), 1.75)).toBeNull();
    expect(deriveScenarioWasDifference(numericScenario("loss-of-aeration"), 1.75)).toBeNull();
    const first = deriveScenarioWasDifference(numericScenario("excess-sludge-wasting"), 2.4);
    const second = deriveScenarioWasDifference(numericScenario("excess-sludge-wasting"), 2.4);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    const serialized = JSON.stringify(first);
    expect(serialized).toContain("simulation");
    expect(serialized).not.toMatch(/"latest"|"live"|"historical"/i);
    // Scenario-derived numeric output is not the operational model: it carries
    // no observed-evidence fields (asOf/sourceType/discharge are model-only).
    expect(serialized).not.toMatch(/asOf|sourceType|discharge/);
  });
});

describe("ENV-VIS-STORY-001-NUM — N4 emission sensitivities (RED-first)", () => {
  it("registry pins the cited-versioned TGO grid factor and the IPCC fallback class", () => {
    const registry = NUMERIC_EFFECT_EMISSION_FACTORS;
    const tgo = registry.find((factor) => factor.id === "tgo-grid-th-2022-2024");
    expect(tgo?.kind).toBe("grid-electricity");
    expect(tgo?.value).toBe(0.5562);
    expect(tgo?.unit).toBe("kgCO2e/kWh");
    expect(tgo?.source).toMatch(/TGO|อบก/);
    expect(tgo?.version).toMatch(/2022\s*–\s*2024|2022-2024/);
    expect(tgo?.uncertaintyClass).toBeTruthy();
    expect((tgo?.applicability ?? "").length).toBeGreaterThan(10);
    const ipcc = registry.find((factor) => factor.id === "ipcc-2006-vol5-ch6-fallback");
    expect(ipcc?.kind).toBe("fallback-class");
    // A declared fallback CLASS binds no value until an activity base exists.
    expect(ipcc?.value).toBeNull();
    expect(ipcc?.source).toMatch(/2006 IPCC Guidelines/);
  });

  it("loss-of-aeration declares an aeration-electricity sensitivity spec; other scenarios declare none", () => {
    const spec = numericEffectsProbe(numericScenario("loss-of-aeration"))?.sensitivities?.[0];
    expect(spec?.id).toBe("aeration-blower-electricity");
    expect(spec?.factorId).toBe("tgo-grid-th-2022-2024");
    expect(spec?.activityBase.kind).toBe("aeration-blower-runtime-kwh");
    expect(spec?.activityBase.sourceId).toBe("relay-duty-cycle-reference");
    expect(spec?.activityBase.status).toBe("pending-owner-values");
    expect(spec?.formula).toMatch(/activityBaseKwh/);
    for (const other of PROCESS_SCENARIOS.filter((s) => s.id !== "loss-of-aeration")) {
      expect(numericEffectsProbe(other)?.sensitivities).toBeUndefined();
    }
  });

  it("no activity base → omitted (never zero), rendered empty", () => {
    const result = deriveScenarioSensitivities(
      numericScenario("loss-of-aeration"),
      { aerationBlowerRuntimeKwh: null },
      NUMERIC_EFFECT_EMISSION_FACTORS,
    );
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.id).toBe("aeration-blower-electricity");
    expect(result.omitted[0]?.reason).toBe("no-activity-base");
    expect(JSON.stringify(result.omitted[0])).not.toMatch(/"value":\s*0[,}]/);
  });

  it("unknown factor id → omitted no-factor (fail closed)", () => {
    const base = numericScenario("loss-of-aeration");
    const bad = {
      ...base,
      numericEffects: {
        sensitivities: [
          {
            id: "aeration-blower-electricity",
            label: "ไฟฟ้าเครื่องเติมอากาศ (SIMULATED)",
            factorId: "not-in-registry",
            activityBase: { kind: "aeration-blower-runtime-kwh", sourceId: "relay-duty-cycle-reference", status: "pending-owner-values" },
            formula: "activityBaseKwh × factorKgCo2ePerKwh",
          },
        ],
      },
    } as unknown as ScenarioDefinition;
    const result = deriveScenarioSensitivities(bad, confirmedDailyBase(10), NUMERIC_EFFECT_EMISSION_FACTORS);
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reason).toBe("no-factor");
  });

  it("confirmed daily activity base + cited factor → rendered effect with formula, unit and full citation (fixture)", () => {
    // Fixture: the shipped catalog declares the base pending-owner-values, so
    // the computed path needs a fixture whose DECLARED base is confirmed too.
    const definition = confirmedAerationFixture();
    const result = deriveScenarioSensitivities(definition, confirmedDailyBase(10), NUMERIC_EFFECT_EMISSION_FACTORS);
    expect(result.rendered).toHaveLength(1);
    const effect = result.rendered[0];
    expect(effect?.kind).toBe("electricity-grid-emission");
    expect(effect?.id).toBe("aeration-blower-electricity");
    expect(effect?.baseKwh).toBe(10);
    expect(effect?.value).toBeCloseTo(10 * 0.5562, 6);
    expect(effect?.unit).toBe("kgCO2e/วัน");
    expect(effect?.formula).toMatch(/activityBaseKwh/);
    expect(effect?.factor.id).toBe("tgo-grid-th-2022-2024");
    expect(effect?.factor.version).toBeTruthy();
    expect(effect?.factor.source).toBeTruthy();
    expect(effect?.provenance).toEqual({ source: "simulation", observedAt: null });
  });
});

// ── D5 REPAIRS (cross-model review, GPT-6.1 Terra, verdict CHANGES_REQUIRED) ──
//
// Findings → repairs are mapped 1:1 in the handoff D5 REPAIR RECORD:
// P2-1 honest delta display, P2-2 factor admission validation, P2-3 typed
// activity-base evidence envelope, P3-4 banner truth precision, P3-plus
// Buddhist-Era factor-version formatting.

describe("D5 P2-1 — formatScenarioNumber never renders a nonzero value as zero", () => {
  it("exact zero is the only case that displays 0", () => {
    expect(formatScenarioNumber(0)).toBe("0");
    expect(formatScenarioNumber(-0)).toBe("0");
  });

  it("small positive difference keeps real precision (0.0004 → '0.0004', never '0')", () => {
    expect(formatScenarioNumber(0.0004)).toBe("0.0004");
    expect(formatScenarioNumber(0.0004)).not.toBe("0");
  });

  it("small negative difference keeps real precision (-0.0004 → '-0.0004', never '0'/'-0')", () => {
    expect(formatScenarioNumber(-0.0004)).toBe("-0.0004");
    expect(formatScenarioNumber(-0.0004)).not.toBe("0");
    expect(formatScenarioNumber(-0.0004)).not.toBe("-0");
  });

  it("extremely small nonzero values fall to the compact scientific-ish form, never zero", () => {
    expect(formatScenarioNumber(1e-15)).toBe("1e-15");
    expect(formatScenarioNumber(-1e-15)).toBe("-1e-15");
  });

  it("regular magnitudes stay the established 3-decimal display rounding", () => {
    expect(formatScenarioNumber(1.5)).toBe("1.5");
    expect(formatScenarioNumber(-0.25)).toBe("-0.25");
    expect(formatScenarioNumber(1.5 - 2.4)).toBe("-0.9");
    expect(formatScenarioNumber(0.9299)).toBe("0.93");
  });

  it("null and non-finite values render nothing (no 'NaN', no '0')", () => {
    expect(formatScenarioNumber(null)).toBeNull();
    expect(formatScenarioNumber(Number.NaN)).toBeNull();
    expect(formatScenarioNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("a genuinely nonzero WAS difference survives display (integration through the derivation)", () => {
    const effect = deriveScenarioWasDifference(numericScenario("excess-sludge-wasting"), 1.4996);
    expect(effect?.difference).not.toBeNull();
    expect(effect?.difference).not.toBe(0);
    const displayed = formatScenarioNumber(effect?.difference ?? null);
    expect(displayed).toBe("0.0004");
    expect(displayed).not.toBe("0");
    // The dishonest historical shape "= 0 m³/วัน" must be reconstructible-proof:
    // the formatted text plus unit can never equal the bare-zero pattern.
    expect(`${displayed} m³/วัน`.replace(/\s/g, "")).not.toBe("=0m³/วัน");
  });
});

describe("D5 P2-2 — factor admission validation (fail closed on bad metadata)", () => {
  const registryWith = (overrides: Partial<Record<"source" | "version" | "unit", string>>) =>
    NUMERIC_EFFECT_EMISSION_FACTORS.map((factor) =>
      factor.id === "tgo-grid-th-2022-2024" ? { ...factor, ...overrides } : factor,
    );

  const derive = (registry: Parameters<typeof deriveScenarioSensitivities>[2]) =>
    deriveScenarioSensitivities(confirmedAerationFixture(), confirmedDailyBase(10), registry);

  it("uncited factor (source: '') → omitted invalid-factor-metadata, never computed", () => {
    const result = derive(registryWith({ source: "" }));
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reason).toBe("invalid-factor-metadata");
    expect(result.omitted[0]?.note).toMatch(/ไม่แสดงผลกระทบ/);
  });

  it("versionless factor (version: '') → omitted invalid-factor-metadata, never computed", () => {
    const result = derive(registryWith({ version: "" }));
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reason).toBe("invalid-factor-metadata");
  });

  it("wrong-unit factor (unit ≠ kgCO2e/kWh) → omitted invalid-factor-metadata, never computed", () => {
    const result = derive(registryWith({ unit: "tCO2/MWh" }));
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reason).toBe("invalid-factor-metadata");
  });

  it("whitespace-only source/version is also rejected (trimmed check)", () => {
    const result = derive(registryWith({ source: "   " }));
    expect(result.rendered).toEqual([]);
    expect(result.omitted[0]?.reason).toBe("invalid-factor-metadata");
  });

  it("a valid factor still passes admission (control)", () => {
    const result = derive(registryWith({}));
    expect(result.rendered).toHaveLength(1);
    expect(result.omitted).toEqual([]);
  });
});

describe("D5 P2-3 — typed activity-base evidence envelope (fail closed)", () => {
  it("pending-owner-values base → omitted activity-base-unconfirmed, never computed", () => {
    const definition = confirmedAerationFixture();
    // Flip ONLY the input evidence back to pending; declaration stays confirmed.
    const result = deriveScenarioSensitivities(definition, {
      aerationBlowerRuntimeKwh: {
        sourceId: "relay-duty-cycle-reference",
        status: "pending-owner-values",
        period: "daily",
        value: 10,
      },
    }, NUMERIC_EFFECT_EMISSION_FACTORS);
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reason).toBe("activity-base-unconfirmed");
    expect(result.omitted[0]?.note).toMatch(/ไม่แสดงผลกระทบ/);
  });

  it("a DECLARED pending base keeps the sensitivity omitted even with a confirmed input", () => {
    // Today's production state: the shipped catalog declares pending, the UI
    // passes null — and even a confirmed input must not activate a pending
    // declaration (declaration must be flipped through a reviewed slice).
    const result = deriveScenarioSensitivities(
      numericScenario("loss-of-aeration"),
      confirmedDailyBase(10),
      NUMERIC_EFFECT_EMISSION_FACTORS,
    );
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reason).toBe("activity-base-unconfirmed");
  });

  it("period mismatch (monthly envelope) → omitted activity-base-period-mismatch, never computed", () => {
    const mismatched = {
      sourceId: "relay-duty-cycle-reference",
      status: "confirmed-by-owner",
      period: "monthly",
      value: 300,
    } as unknown as ScenarioActivityBaseEvidence;
    const result = deriveScenarioSensitivities(
      confirmedAerationFixture(),
      { aerationBlowerRuntimeKwh: mismatched },
      NUMERIC_EFFECT_EMISSION_FACTORS,
    );
    expect(result.rendered).toEqual([]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reason).toBe("activity-base-period-mismatch");
  });

  it("non-finite value inside a confirmed envelope → still omitted no-activity-base", () => {
    const result = deriveScenarioSensitivities(confirmedAerationFixture(), {
      aerationBlowerRuntimeKwh: {
        sourceId: "relay-duty-cycle-reference",
        status: "confirmed-by-owner",
        period: "daily",
        value: Number.NaN,
      },
    }, NUMERIC_EFFECT_EMISSION_FACTORS);
    expect(result.rendered).toEqual([]);
    expect(result.omitted[0]?.reason).toBe("no-activity-base");
  });
});

describe("D5 P3-4 — banner truth precision (observed vs SIMULATED distinction)", () => {
  it("no numeric-declaring scenario flatly denies quantities any more", () => {
    for (const scenario of PROCESS_SCENARIOS) {
      const declaresNumerics = scenario.numericEffects !== undefined;
      const joined = scenario.assumptions.join(" | ");
      if (declaresNumerics) {
        expect(joined).not.toContain("ไม่อ้างปริมาณหรืออัตราใด ๆ");
        expect(joined).not.toContain("ไม่อ้างผลเชิงเลขหรือคุณภาพน้ำใด ๆ");
        // The precise truth: no OBSERVED quantities/rates are claimed, while
        // clearly-labeled SIMULATED values may be shown.
        expect(joined).toMatch(/จริง/);
        expect(joined).toMatch(/SIMULATED|จำลอง|สมมุติ/);
      }
    }
  });

  it("the WAS scenario states the observed-vs-simulated distinction explicitly", () => {
    const was = numericScenario("excess-sludge-wasting");
    const joined = was.assumptions.join(" | ");
    expect(joined).toMatch(/ไม่อ้างปริมาณ.*จริง/);
    expect(joined).toMatch(/SIMULATED|จำลอง|สมมุติ/);
    expect(joined).not.toContain("ไม่อ้างปริมาณหรืออัตราใด ๆ");
  });
});

describe("D5 P3-plus — Buddhist-Era factor-version formatting (พ.ศ. display, CE traceability)", () => {
  it("converts CE year tokens to พ.ศ. while keeping the original CE digits inline", () => {
    const formatted = formatScenarioFactorVersion("grid mix ปีข้อมูล 2022–2024");
    expect(formatted).toContain("2565 พ.ศ. (2022 ค.ศ.)");
    expect(formatted).toContain("2567 พ.ศ. (2024 ค.ศ.)");
    // Traceability: the original identifier digits stay present in the output.
    expect(formatted).toContain("2022");
    expect(formatted).toContain("2024");
  });

  it("never touches quantities or non-year tokens (Scope parts, GWP set, class ids)", () => {
    const formatted = formatScenarioFactorVersion(
      "grid mix ปีข้อมูล 2022–2024 (Scope 2 = 0.4750 + Scope 3 upstream = 0.0812 kgCO2e/kWh; GWP คู่ขนาน IPCC AR5)",
    );
    expect(formatted).toContain("0.4750");
    expect(formatted).toContain("0.0812");
    expect(formatted).toContain("IPCC AR5");
    expect(formatted).not.toContain("5562 พ.ศ.");
    expect(formatted).not.toContain("4750 พ.ศ.");
  });

  it("handles the IPCC fallback version year (2006 → 2549 พ.ศ.)", () => {
    const formatted = formatScenarioFactorVersion("2006 IPCC Guidelines (same basis as BUR4)");
    expect(formatted).toContain("2549 พ.ศ. (2006 ค.ศ.)");
    expect(formatted).toContain("IPCC Guidelines");
  });

  it("a version string without CE years returns unchanged", () => {
    const raw = "ฉบับคงที่ ไม่มีปี ค.ศ.";
    expect(formatScenarioFactorVersion(raw)).toBe(raw);
  });

  it("the registry keeps the raw CE version identifiers untouched (data-level traceability)", () => {
    const tgo = NUMERIC_EFFECT_EMISSION_FACTORS.find((factor) => factor.id === "tgo-grid-th-2022-2024");
    expect(tgo?.version).toContain("2022–2024");
    expect(tgo?.version).not.toContain("พ.ศ.");
  });
});
