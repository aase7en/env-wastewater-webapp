import { describe, expect, it } from "vitest";

import { PROCESS_EXPLANATION } from "./environmental-flow";
import type {
  EnvironmentalFlowModel,
  ProcessExplanationEdgeId,
  ProcessExplanationStageId,
} from "./environmental-flow";
import {
  deriveScenarioState,
  type ScenarioDefinition,
} from "./process-scenario";
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
