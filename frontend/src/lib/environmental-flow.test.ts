import { describe, expect, it } from "vitest";
import {
  PROCESS_EXPLANATION,
  toEnvironmentalFlowModel,
  type EnvironmentalFlowReading,
} from "./environmental-flow";

const READING: EnvironmentalFlowReading = {
  reading_date: "2026-09-01",
  water_used_total: 120.5,
  wastewater_in: 82.25,
  excess_sludge_removed: 1.75,
  wastewater_discharged: true,
};

describe("UX-FLOW-P001 environmental flow model", () => {
  it("keeps water use, wastewater influent, and excess sludge as distinct evidence", () => {
    const model = toEnvironmentalFlowModel(READING);

    expect(model.asOf).toBe("2026-09-01");
    expect(model.quantities.waterUse).toMatchObject({
      field: "water_used_total",
      value: 120.5,
      unit: "m³",
      medium: "water",
      period: "daily",
    });
    expect(model.quantities.influent).toMatchObject({
      field: "wastewater_in",
      value: 82.25,
      unit: "m³",
      medium: "water",
      period: "daily",
    });
    expect(model.quantities.excessSludge).toMatchObject({
      field: "excess_sludge_removed",
      value: 1.75,
      unit: "m³",
      medium: "sludge",
      period: "daily",
    });
  });

  it("preserves missing quantities as null instead of zero", () => {
    const model = toEnvironmentalFlowModel({
      ...READING,
      water_used_total: null,
      wastewater_in: null,
      excess_sludge_removed: null,
    });

    expect(model.quantities.waterUse.value).toBeNull();
    expect(model.quantities.influent.value).toBeNull();
    expect(model.quantities.excessSludge.value).toBeNull();
    expect(model.edges.filter((edge) => edge.quantity !== null)).toHaveLength(0);
  });

  it("uses wastewater_in only on the influent-entry edge and never propagates it through treatment stages", () => {
    const model = toEnvironmentalFlowModel(READING);
    const quantifiedWaterEdges = model.edges.filter(
      (edge) => edge.medium === "water" && edge.quantity !== null,
    );

    expect(quantifiedWaterEdges).toHaveLength(1);
    expect(quantifiedWaterEdges[0]).toMatchObject({
      id: "influent-entry",
      quantity: 82.25,
      unit: "m³",
    });

    for (const id of [
      "screening-to-aeration",
      "aeration-to-clarifier",
      "clarifier-to-weir",
      "weir-to-chlorine",
      "chlorine-to-outfall",
    ]) {
      expect(model.edges.find((edge) => edge.id === id)?.quantity).toBeNull();
    }
  });

  it("attaches excess-sludge evidence only to the WAS branch and keeps it a sludge medium", () => {
    const model = toEnvironmentalFlowModel(READING);
    const was = model.edges.find((edge) => edge.id === "was-to-drying-beds");

    expect(was).toMatchObject({
      medium: "sludge",
      quantity: 1.75,
      unit: "m³",
    });
    expect(model.edges.find((edge) => edge.id === "ras-return")?.quantity).toBeNull();
    expect(model.edges.find((edge) => edge.id === "filtrate-return")?.quantity).toBeNull();
  });

  it("keeps chlorine dosing as a separate chemical structural edge with unavailable quantity", () => {
    const model = toEnvironmentalFlowModel(READING);
    expect(model.edges.find((edge) => edge.id === "chlorine-dosing")).toMatchObject({
      from: "chlorine_solution_storage",
      to: "chlorine_contact_tank",
      medium: "chemical",
      kind: "normal",
      activity: "structural",
      quantity: null,
      unit: null,
    });
  });

  it.each([true, false, null] as const)(
    "never converts wastewater_discharged=%s into a discharge volume",
    (recorded) => {
      const model = toEnvironmentalFlowModel({ ...READING, wastewater_discharged: recorded });
      expect(model.discharge.recorded).toBe(recorded);
      expect(model.discharge.quantity).toBeNull();
      expect(model.edges.find((edge) => edge.id === "chlorine-to-outfall")?.quantity).toBeNull();
    },
  );

  it("keeps bypass and emergency paths structural with unknown activity and unavailable quantity", () => {
    const model = toEnvironmentalFlowModel(READING);
    for (const id of ["pump-sump-bypass", "emergency-overflow"]) {
      expect(model.edges.find((edge) => edge.id === id)).toMatchObject({
        kind: "exception",
        activity: "unknown",
        quantity: null,
      });
    }
  });

  it("treats whitespace quantities as unavailable instead of numeric zero", () => {
    const model = toEnvironmentalFlowModel({
      ...READING,
      water_used_total: "   ",
      wastewater_in: "\t",
      excess_sludge_removed: "\n",
    });

    expect(model.quantities.waterUse.value).toBeNull();
    expect(model.quantities.influent.value).toBeNull();
    expect(model.quantities.excessSludge.value).toBeNull();
  });

  it("only claims manual provenance when input_source explicitly says manual", () => {
    expect(toEnvironmentalFlowModel({ ...READING, input_source: "manual" }).sourceType).toBe("manual-latest");
    expect(toEnvironmentalFlowModel({ ...READING, input_source: "iot" }).sourceType).toBe("recorded-latest");
    expect(toEnvironmentalFlowModel({ ...READING }).sourceType).toBe("recorded-latest");
  });

  it("returns an explicit empty model instead of fabricating a reading", () => {
    const model = toEnvironmentalFlowModel(null);
    expect(model.asOf).toBeNull();
    expect(model.quantities.waterUse.value).toBeNull();
    expect(model.quantities.influent.value).toBeNull();
    expect(model.quantities.excessSludge.value).toBeNull();
    expect(model.discharge.recorded).toBeNull();
    expect(model.sourceType).toBe("recorded-latest");
  });
});

describe("ENV-VIS-STORY-001A process explanation topology contract", () => {
  it("exposes exactly the eight SSoT main-path stages with Thai teaching labels", () => {
    expect(PROCESS_EXPLANATION.stages.map((s) => s.id)).toEqual([
      "influent_collection",
      "pump_sump",
      "fine_screen",
      "aeration_tank",
      "secondary_clarifier",
      "flow_measurement_weir",
      "chlorine_contact_tank",
      "treated_effluent_outfall",
    ]);
    for (const stage of PROCESS_EXPLANATION.stages) {
      expect(stage.label.length).toBeGreaterThan(0);
      expect(stage.label).toMatch(/[\u0E00-\u0E7F]/); // Thai teaching label
    }
  });

  it("carries exactly the thirteen SSoT edges with water/sludge/chemical separation", () => {
    expect(PROCESS_EXPLANATION.edges).toHaveLength(13);
    expect(PROCESS_EXPLANATION.edges.map((e) => e.id)).toEqual([
      "influent-entry",
      "pump-sump-to-screening",
      "screening-to-aeration",
      "aeration-to-clarifier",
      "clarifier-to-weir",
      "weir-to-chlorine",
      "chlorine-to-outfall",
      "ras-return",
      "was-to-drying-beds",
      "filtrate-return",
      "chlorine-dosing",
      "pump-sump-bypass",
      "emergency-overflow",
    ]);
    const mediums = new Set(PROCESS_EXPLANATION.edges.map((e) => e.medium));
    expect(mediums.has("water")).toBe(true);
    expect(mediums.has("sludge")).toBe(true);
    expect(mediums.has("chemical")).toBe(true);
    // Modeling rule 1: RAS/WAS are sludge edges, never collapsed into water.
    expect(PROCESS_EXPLANATION.edges.find((e) => e.id === "ras-return")?.medium).toBe("sludge");
    expect(PROCESS_EXPLANATION.edges.find((e) => e.id === "was-to-drying-beds")?.medium).toBe("sludge");
    expect(PROCESS_EXPLANATION.edges.find((e) => e.id === "chlorine-dosing")?.medium).toBe("chemical");
  });

  it("marks ONLY bypass and emergency as unknown-activity needs_confirmation tie-ins", () => {
    const uncertain = PROCESS_EXPLANATION.edges.filter((e) => e.tieIn === "needs_confirmation");
    expect(uncertain.map((e) => e.id).sort()).toEqual(["emergency-overflow", "pump-sump-bypass"]);
    for (const edge of uncertain) {
      expect(edge.activity).toBe("unknown");
      expect(edge.kind).toBe("exception");
    }
    for (const edge of PROCESS_EXPLANATION.edges.filter((e) => e.tieIn !== "needs_confirmation")) {
      expect(edge.activity).toBe("structural");
    }
  });

  it("contains no observed/simulated semantics — explanation only", () => {
    const serialized = JSON.stringify(PROCESS_EXPLANATION);
    expect(serialized).not.toMatch(/SIMULATED|simulated|real-time|live|LIVE|observed|reading|timestamp/i);
    // The explanation carries no quantities, rates, or equipment states.
    expect(serialized).not.toMatch(/"quantity"|"rate"|"running"|"level"/);
  });

  it("derives the flow model's edge identities/endpoints from the shared topology (one authority)", () => {
    const model = toEnvironmentalFlowModel(READING);
    expect(model.edges).toHaveLength(PROCESS_EXPLANATION.edges.length);
    for (const explanationEdge of PROCESS_EXPLANATION.edges) {
      const modelEdge = model.edges.find((e) => e.id === explanationEdge.id);
      expect(modelEdge).toBeDefined();
      expect(modelEdge?.from).toBe(explanationEdge.from);
      expect(modelEdge?.to).toBe(explanationEdge.to);
      expect(modelEdge?.medium).toBe(explanationEdge.medium);
      expect(modelEdge?.kind).toBe(explanationEdge.kind);
      expect(modelEdge?.activity).toBe(explanationEdge.activity);
    }
  });

  it("keeps quantity semantics byte-identical under the shared-topology derivation", () => {
    const model = toEnvironmentalFlowModel(READING);
    const influentEdge = model.edges.find((e) => e.id === "influent-entry");
    expect(influentEdge?.quantity).toBe(82.25);
    expect(influentEdge?.unit).toBe("m³");
    const wasEdge = model.edges.find((e) => e.id === "was-to-drying-beds");
    expect(wasEdge?.quantity).toBe(1.75);
    expect(wasEdge?.unit).toBe("m³");
    const bypassEdge = model.edges.find((e) => e.id === "pump-sump-bypass");
    expect(bypassEdge?.quantity).toBeNull();
    expect(bypassEdge?.unit).toBeNull();
  });
});
