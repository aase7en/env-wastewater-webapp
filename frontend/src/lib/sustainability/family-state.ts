import type { GarbageLog } from "../garbage";
import type { RollupSummary } from "../carbon-rollup";

/**
 * ENV-WASTE-CARBON-001-C1 D1 contract — family-state derivation.
 *
 * Pure derivation over the delivered read-only contracts
 * (`useCarbonRollup` RollupSummary + `useGarbageLogs` GarbageLog[]).
 * NO new data sources, NO inference, NO invented factors. Unknown is never
 * zero: 0-row families render ไม่มีข้อมูล, never a number.
 *
 * Truth table (pinned by family-state.test.ts):
 * - electricity: CONTRIBUTING on electricity-row evidence (badge LATEST,
 *   manual-snapshot semantics); the card value is the family's known
 *   subtotal — grandTotalKg belongs to the page's overall-total display
 *   only. knownOnlyTotal flags NULL-kg rows in the family (001B).
 * - fuel / garden_fuel / waste / chemical: UNAVAILABLE today (0 rows) →
 *   ไม่มีข้อมูล, never numeric. Waste derives the same way from waste-mapped
 *   rows (every label carbon.v_unified_co2e can emit) and may still show a
 *   segregation summary from garbage rows without fabricating carbon.
 * - plastic: ABSENT — no plastic category/mass/unit/factor exists anywhere
 *   (001A A–K); waste_recyclable is NOT plastic and is never relabeled.
 */

export const FAMILY_ORDER = [
  "electricity",
  "fuel",
  "garden_fuel",
  "waste",
  "chemical",
  "plastic",
] as const;

export type FamilyName = (typeof FAMILY_ORDER)[number];

export type FamilyState =
  | "CONTRIBUTING"
  | "UNAVAILABLE"
  | "ABSENT";

export type FamilyBadge = "LATEST" | "UNAVAILABLE" | "ABSENT";

export interface SegregationSummaryItem {
  label: string;
  weightKg: number | null;
}

export interface FamilyStateView {
  family: FamilyName;
  state: FamilyState;
  badge: FamilyBadge;
  /** Thai display label for the value; never numeric for unknown states. */
  valueLabel: string;
  /** Carbon contribution state — distinct from data-state. */
  contribution?: "CONTRIBUTING" | "UNAVAILABLE";
  /** True when grandTotalKg is a known subtotal, not a complete total. */
  knownOnlyTotal?: boolean;
  detail?: {
    segregation?: SegregationSummaryItem[];
  };
}

export interface TverReadinessItem {
  input: string;
  status: "DOCUMENTED" | "ABSENT" | "PARTIAL";
}

/**
 * The page renders exactly one status value beyond the readiness union
 * (while the query has no result). Pinned here so the DOM attribute value
 * cannot drift from the lib contract (001B P3).
 */
export const READINESS_DOM_STATUS_UNAVAILABLE = "UNAVAILABLE" as const;

export type ReadinessDomStatus = TverReadinessItem["status"] | typeof READINESS_DOM_STATUS_UNAVAILABLE;

const UNAVAILABLE_LABEL = "ไม่มีข้อมูล";

/**
 * Map rollup source labels onto the five A–K carbon source families.
 * Waste labels mirror exactly what `carbon.v_unified_co2e` can emit:
 * `'waste_' || segregation_type | 'unclassified'` over the GARBAGE-CORE-001
 * canonical set (general / infectious / recyclable / chemical / NULL).
 * A future canonical type must be added here or it silently falls out of
 * the waste family (001B R3 P2 finding: waste_infectious and
 * waste_unclassified were missing).
 */
const SOURCE_FAMILY: Record<string, FamilyName> = {
  diesel: "fuel",
  gasoline: "fuel",
  lpg: "fuel",
  garden_fuel: "garden_fuel",
  waste: "waste",
  waste_recyclable: "waste",
  waste_general: "waste",
  waste_infectious: "waste",
  waste_chemical: "waste",
  waste_unclassified: "waste",
  chemical: "chemical",
  electricity: "electricity",
};

/** Family-local kg evidence: known subtotal + NULL (factor-unavailable) presence. */
interface FamilyKgEvidence {
  /** Sum of non-NULL kg_co2e rows in this family — a known subtotal only. */
  subtotal: number;
  /** True when at least one family row had kg_co2e NULL (unknown, not zero). */
  hasNull: boolean;
  /** True when at least one family row carried a known kg value. */
  hasKnown: boolean;
}

function familyKgEvidence(rollup: RollupSummary, family: FamilyName): FamilyKgEvidence {
  let subtotal = 0;
  let hasNull = false;
  let hasKnown = false;
  for (const row of rollup.rows) {
    if (SOURCE_FAMILY[row.source] !== family) continue;
    if (row.kg_co2e === null) {
      hasNull = true;
    } else {
      hasKnown = true;
      subtotal += row.kg_co2e;
    }
  }
  return { subtotal, hasNull, hasKnown };
}

function unavailableFamily(family: FamilyName): FamilyStateView {
  return {
    family,
    state: "UNAVAILABLE",
    badge: "UNAVAILABLE",
    valueLabel: UNAVAILABLE_LABEL,
  };
}

export function deriveFamilyStates(
  rollup: RollupSummary,
  garbage: readonly GarbageLog[],
): FamilyStateView[] {
  const states: FamilyStateView[] = [];

  // Electricity: CONTRIBUTING only on electricity-row evidence — the card's
  // value is the family's known subtotal, never the rollup-wide grand total
  // (001B: a waste-only contribution must not label electricity).
  const electricityEvidence = familyKgEvidence(rollup, "electricity");
  if (electricityEvidence.hasKnown && electricityEvidence.subtotal > 0) {
    states.push({
      family: "electricity",
      state: "CONTRIBUTING",
      badge: "LATEST",
      valueLabel: String(electricityEvidence.subtotal),
      contribution: "CONTRIBUTING",
      knownOnlyTotal: electricityEvidence.hasNull,
    });
  } else {
    states.push(unavailableFamily("electricity"));
  }

  // Fuel / garden_fuel / chemical: families with 0 rows today.
  for (const family of ["fuel", "garden_fuel", "chemical"] as const) {
    states.push(unavailableFamily(family));
  }

  // Waste: carbon contribution from waste-row evidence only — the card's
  // value is the waste-family known subtotal (001B: never grandTotalKg); a
  // segregation summary from garbage rows never fabricates carbon.
  const wasteEvidence = familyKgEvidence(rollup, "waste");
  const wasteUnavailableContribution = rollup.unavailableSources.some(
    (source) => SOURCE_FAMILY[source] === "waste",
  );
  const waste: FamilyStateView =
    wasteEvidence.hasKnown && wasteEvidence.subtotal > 0
      ? {
          family: "waste",
          state: "CONTRIBUTING",
          badge: "LATEST",
          valueLabel: String(wasteEvidence.subtotal),
          contribution: "CONTRIBUTING",
          knownOnlyTotal: wasteEvidence.hasNull,
        }
      : {
        ...unavailableFamily("waste"),
        ...(wasteUnavailableContribution
          ? { contribution: "UNAVAILABLE" as const }
          : {}),
      };
  if (garbage.length > 0) {
    const summary = new Map<string, SegregationSummaryItem>();
    for (const row of garbage) {
      const key = row.segregation_type ?? "unclassified";
      const existing = summary.get(key);
      const weight =
        row.weight_kg === null || row.weight_kg === undefined
          ? null
          : Number(row.weight_kg) || null;
      if (existing) {
        if (existing.weightKg !== null && weight !== null) {
          existing.weightKg += weight;
        } else if (weight !== null && existing.weightKg === null) {
          existing.weightKg = weight;
        }
      } else {
        summary.set(key, { label: key, weightKg: weight });
      }
    }
    waste.detail = { segregation: [...summary.values()] };
  }
  states.push(waste);

  // Plastic: ABSENT — no plastic contract exists (001A A–K); recyclable
  // garbage rows never make plastic CONTRIBUTING.
  states.push({
    family: "plastic",
    state: "ABSENT",
    badge: "ABSENT",
    valueLabel: UNAVAILABLE_LABEL,
  });

  return states;
}

export function deriveTverReadiness(
  rollup: RollupSummary,
  _garbage: readonly GarbageLog[],
): TverReadinessItem[] {
  // Readiness-only: statuses describe whether documented inputs exist.
  // NO eligibility, status, credit estimate, or registration progress.
  void _garbage;
  // Electricity documentation derives from electricity-row evidence, not the
  // rollup-wide grand total (001B: a waste-only rollup documents nothing
  // about electricity).
  const electricityDocumented = familyKgEvidence(rollup, "electricity").hasKnown;
  // Factor basis: a non-NULL kg_co2e row is direct evidence a factor was
  // applied to real data → PARTIAL; with no such row anywhere → ABSENT.
  // DOCUMENTED is never claimed by this derivation while any EXPECTED_SOURCES
  // label lacks an applied-factor row in-window.
  const anyFactorApplied = rollup.rows.some(
    (row) => row.kg_co2e !== null && Number.isFinite(row.kg_co2e),
  );
  const factorStatus: TverReadinessItem["status"] = anyFactorApplied
    ? "PARTIAL"
    : "ABSENT";
  return [
    {
      input: "ข้อมูลการใช้ไฟฟ้า (electricity consumption)",
      status: electricityDocumented ? "DOCUMENTED" : "ABSENT",
    },
    {
      input: "องค์ประกอบขยะตามหมวด (waste composition by category)",
      status: "ABSENT",
    },
    {
      input: "ค่าการปล่อยต่อแหล่งกำเนิด (per-source emission factors)",
      status: factorStatus,
    },
    {
      input: "เอกสารขอบเขต/ช่วงเวลาสำหรับการตรวจสอบ (boundary/period evidence)",
      status: "ABSENT",
    },
  ];
}
