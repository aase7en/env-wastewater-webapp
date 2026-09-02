export type EnvironmentalFlowMedium = "water" | "sludge" | "chemical";
export type EnvironmentalFlowEdgeKind = "normal" | "return" | "exception";
export type EnvironmentalFlowActivity = "structural" | "unknown";

export interface EnvironmentalFlowReading {
  reading_date?: string | null;
  water_used_total?: number | string | null;
  wastewater_in?: number | string | null;
  excess_sludge_removed?: number | string | null;
  wastewater_discharged?: boolean | null;
  input_source?: string | null;
}

export interface EnvironmentalFlowQuantity {
  field: "water_used_total" | "wastewater_in" | "excess_sludge_removed";
  value: number | null;
  unit: "m³";
  medium: EnvironmentalFlowMedium;
  period: "daily";
}

export interface EnvironmentalFlowEdge {
  id: string;
  from: string;
  to: string;
  medium: EnvironmentalFlowMedium;
  kind: EnvironmentalFlowEdgeKind;
  activity: EnvironmentalFlowActivity;
  quantity: number | null;
  unit: "m³" | null;
}

export interface EnvironmentalFlowModel {
  asOf: string | null;
  sourceType: "manual-latest" | "recorded-latest";
  quantities: {
    waterUse: EnvironmentalFlowQuantity;
    influent: EnvironmentalFlowQuantity;
    excessSludge: EnvironmentalFlowQuantity;
  };
  discharge: {
    recorded: boolean | null;
    quantity: null;
  };
  edges: EnvironmentalFlowEdge[];
}

function finiteNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function edge(
  id: string,
  from: string,
  to: string,
  medium: EnvironmentalFlowMedium,
  kind: EnvironmentalFlowEdgeKind = "normal",
  activity: EnvironmentalFlowActivity = "structural",
  quantity: number | null = null,
): EnvironmentalFlowEdge {
  return {
    id,
    from,
    to,
    medium,
    kind,
    activity,
    quantity,
    unit: quantity === null ? null : "m³",
  };
}

/**
 * Build the truthful wastewater environmental-flow model from one latest
 * manual daily reading.
 *
 * The model deliberately distinguishes structural topology from measured
 * quantity. A measured influent volume is attached only to the plant-entry
 * edge; it is never propagated through downstream treatment stages. Likewise,
 * the wastewater_discharged boolean is retained only as a recorded state and
 * is never converted into an effluent volume.
 */
export function toEnvironmentalFlowModel(
  reading: EnvironmentalFlowReading | null,
): EnvironmentalFlowModel {
  const waterUse = finiteNumberOrNull(reading?.water_used_total);
  const influent = finiteNumberOrNull(reading?.wastewater_in);
  const excessSludge = finiteNumberOrNull(reading?.excess_sludge_removed);

  return {
    asOf: reading?.reading_date?.trim() || null,
    sourceType: reading?.input_source === "manual" ? "manual-latest" : "recorded-latest",
    quantities: {
      waterUse: {
        field: "water_used_total",
        value: waterUse,
        unit: "m³",
        medium: "water",
        period: "daily",
      },
      influent: {
        field: "wastewater_in",
        value: influent,
        unit: "m³",
        medium: "water",
        period: "daily",
      },
      excessSludge: {
        field: "excess_sludge_removed",
        value: excessSludge,
        unit: "m³",
        medium: "sludge",
        period: "daily",
      },
    },
    discharge: {
      recorded: reading?.wastewater_discharged ?? null,
      quantity: null,
    },
    edges: [
      edge("influent-entry", "influent_collection", "pump_sump", "water", "normal", "structural", influent),
      edge("pump-sump-to-screening", "pump_sump", "fine_screen", "water"),
      edge("screening-to-aeration", "fine_screen", "aeration_tank", "water"),
      edge("aeration-to-clarifier", "aeration_tank", "secondary_clarifier", "water"),
      edge("clarifier-to-weir", "secondary_clarifier", "flow_measurement_weir", "water"),
      edge("weir-to-chlorine", "flow_measurement_weir", "chlorine_contact_tank", "water"),
      edge("chlorine-to-outfall", "chlorine_contact_tank", "treated_effluent_outfall", "water"),
      edge("ras-return", "secondary_clarifier", "aeration_tank", "sludge", "return"),
      edge("was-to-drying-beds", "secondary_clarifier", "sludge_drying_beds", "sludge", "normal", "structural", excessSludge),
      edge("filtrate-return", "sludge_drying_beds", "pump_sump", "water", "return"),
      edge("chlorine-dosing", "chlorine_solution_storage", "chlorine_contact_tank", "chemical"),
      edge("pump-sump-bypass", "pump_sump", "flow_measurement_weir", "water", "exception", "unknown"),
      edge("emergency-overflow", "pump_sump", "flow_measurement_weir", "water", "exception", "unknown"),
    ],
  };
}
