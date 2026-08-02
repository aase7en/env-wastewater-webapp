/**
 * Flow-diagram view model (P21 — 2.5D interactive PFD).
 *
 * This is the ONLY contract between the data layer and
 * `components/flow/WastewaterFlowDiagram.tsx`. The diagram never queries
 * Supabase and never imports `DashboardRow` — it renders whatever
 * `FlowDiagramData` it is handed. That keeps the visual work (PNG layers +
 * animated SVG lines) swappable without touching queries, and lets the
 * component be driven from a Ladle story with no network.
 *
 * Three producers are planned; the shape is identical for all three so the
 * diagram never branches on origin (only the `source` badge does):
 *   1. `DUMMY_FLOW_DATA`  — hand-written fixture (today)
 *   2. `toFlowModel(row)` — a daily `wastewater.reading` row
 *   3. live sensor feed    — `useSensorFeed()` samples (P20d.2)
 *
 * Coordinate space lives here too (`FLOW_VIEWBOX` + `FLOW_ANCHORS`) so the
 * PNG layer and the SVG overlay share one authoring grid — see the component.
 */
import { THRESHOLDS } from "./types";

// ─── Anchors + coordinate space ──────────────────────────────────────────

/**
 * Every point the diagram can draw to. Five are real process stages; the
 * other three are off-stage endpoints that flow lines need (air comes from
 * the blower, waste sludge leaves the system, influent arrives from outside).
 */
export type FlowAnchorKey =
  | "influent"
  | "screening"
  | "aeration"
  | "sediment"
  | "chlorine"
  | "discharge"
  | "blower"
  | "sludge_out";

/** The five keys that carry measured data + equipment. */
export type FlowStageKey = Extract<
  FlowAnchorKey,
  "screening" | "aeration" | "sediment" | "chlorine" | "discharge"
>;

/**
 * Authoring grid for the 2.5D scene. PNG layers are positioned in these
 * units and the SVG overlay uses the same `viewBox`, so a path drawn at
 * (620, 400) lands on the tank PNG placed at (620, 400) at every screen
 * size. 16:9 keeps the isometric artwork from letterboxing.
 */
export const FLOW_VIEWBOX = { width: 1600, height: 900 } as const;

/**
 * Where each anchor sits in `FLOW_VIEWBOX` units. Placeholder layout: a
 * left-to-right process train with the blower above the aeration tank and
 * the sludge outlet below sedimentation. Move these to match the real
 * isometric artwork once the PNGs exist — nothing else needs to change.
 */
export const FLOW_ANCHORS: Record<FlowAnchorKey, { x: number; y: number }> = {
  influent: { x: 80, y: 470 },
  screening: { x: 300, y: 470 },
  aeration: { x: 620, y: 470 },
  sediment: { x: 940, y: 470 },
  chlorine: { x: 1240, y: 470 },
  discharge: { x: 1500, y: 470 },
  blower: { x: 620, y: 170 },
  sludge_out: { x: 940, y: 800 },
};

// ─── Equipment ───────────────────────────────────────────────────────────

/**
 * `unknown` is a first-class state, not a fallback for laziness: the daily
 * form submits partial readings, so "we have no idea whether pump 2 ran" is
 * a real answer and must not render as "off" (ui-brief: operators read this
 * diagram at a glance).
 */
export type EquipmentState = "active" | "idle" | "fault" | "unknown";

export interface FlowEquipment {
  /**
   * Matches `wastewater.equipment.code` and the `<code>_running` boolean on
   * `wastewater.reading` (pump1, aerator1, sludge_pump1, …). Screens are the
   * exception — see SCREEN_CODES below.
   */
  code: string;
  label: string;
  state: EquipmentState;
}

/**
 * Screens have no run state — the reading records whether they were *cleaned*
 * (`screen_cleaned_coarse` / `screen_cleaned_fine`), which is an operator
 * action, not equipment that is on or off. The adapter maps cleaned → active
 * and surfaces it as such; don't read "idle" here as "the screen is broken".
 */
const SCREEN_CODES = {
  screen_cleaned_coarse: "ตะแกรงหยาบ",
  screen_cleaned_fine: "ตะแกรงละเอียด",
} as const;

// ─── Metrics ─────────────────────────────────────────────────────────────

export interface FlowMetric {
  /** Column name on `wastewater.reading` — keeps the UI traceable to the DB. */
  key: string;
  label: string;
  value: number | null;
  unit: string;
  digits: number;
  /** True when the value breaches a THRESHOLDS rule. See alertFor(). */
  alert: boolean;
}

/**
 * Threshold check per metric key. Mirrors `THRESHOLDS` in types.ts.
 *
 * Caveat worth knowing before you trust a red DO node: the database's
 * `do_alert` (v_dashboard_14day) tests the *average* of the three DO stages
 * against doMin. Here each stage's DO is tested individually, because the
 * diagram's job is to point at which stage is starving. One stage can flag
 * while the row-level `do_alert` is false — that is intended, not a bug.
 */
function alertFor(key: string, value: number | null): boolean {
  if (value === null) return false;
  switch (key) {
    case "do_aeration":
    case "do_sedimentation":
    case "do_before_discharge":
      return value < THRESHOLDS.doMin;
    case "free_chlorine":
      return value < THRESHOLDS.chlorineMin;
    case "ph":
      return value < THRESHOLDS.phMin || value > THRESHOLDS.phMax;
    default:
      return false;
  }
}

/** Metric spec per stage — label/unit/digits live here, values come from data. */
const METRIC_SPECS: Record<
  FlowStageKey,
  ReadonlyArray<{ key: string; label: string; unit: string; digits: number }>
> = {
  screening: [],
  aeration: [
    { key: "do_aeration", label: "DO", unit: "mg/L", digits: 2 },
    { key: "ph", label: "pH", unit: "", digits: 2 },
    { key: "tds_aeration", label: "TDS", unit: "mg/L", digits: 0 },
    { key: "temp_aeration", label: "อุณหภูมิ", unit: "°C", digits: 1 },
  ],
  sediment: [
    { key: "do_sedimentation", label: "DO", unit: "mg/L", digits: 2 },
    { key: "sv30", label: "SV30", unit: "mL/L", digits: 0 },
  ],
  chlorine: [
    { key: "free_chlorine", label: "Free Cl", unit: "mg/L", digits: 2 },
    { key: "chlorine_used", label: "ปริมาณใช้", unit: "L", digits: 1 },
  ],
  discharge: [
    { key: "do_before_discharge", label: "DO", unit: "mg/L", digits: 2 },
    { key: "tds_before_discharge", label: "TDS", unit: "mg/L", digits: 0 },
  ],
};

/** Equipment attached to each stage, by reading-column code. */
const STAGE_EQUIPMENT: Record<FlowStageKey, ReadonlyArray<{ code: string; label: string }>> = {
  screening: [
    { code: "screen_cleaned_coarse", label: SCREEN_CODES.screen_cleaned_coarse },
    { code: "screen_cleaned_fine", label: SCREEN_CODES.screen_cleaned_fine },
  ],
  aeration: [
    { code: "aerator1", label: "เครื่องเติมอากาศ 1" },
    { code: "aerator2", label: "เครื่องเติมอากาศ 2" },
  ],
  sediment: [
    { code: "sludge_pump1", label: "ปั๊มตะกอน 1" },
    { code: "sludge_pump2", label: "ปั๊มตะกอน 2" },
  ],
  chlorine: [
    { code: "chlorine_pump1", label: "ปั๊มคลอรีน 1" },
    { code: "chlorine_pump2", label: "ปั๊มคลอรีน 2" },
  ],
  discharge: [
    { code: "pump1", label: "ปั๊มน้ำ 1" },
    { code: "pump2", label: "ปั๊มน้ำ 2" },
  ],
};

const STAGE_LABELS: Record<FlowStageKey, { label: string; description: string }> = {
  screening: { label: "ตะแกรง", description: "ตะแกรงดักขยะก่อนเข้าระบบ" },
  aeration: { label: "เติมอากาศ", description: "ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์" },
  sediment: { label: "ตกตะกอน", description: "ถังตกตะกอน — แยกตะกอนจุลินทรีย์" },
  chlorine: { label: "คลอรีน", description: "เติมคลอรีนฆ่าเชื้อก่อนระบาย" },
  discharge: { label: "ระบาย", description: "จุดระบายน้ำที่บำบัดแล้ว" },
};

export const FLOW_STAGE_ORDER: readonly FlowStageKey[] = [
  "screening",
  "aeration",
  "sediment",
  "chlorine",
  "discharge",
];

// ─── Stages + links ──────────────────────────────────────────────────────

export interface FlowStage {
  key: FlowStageKey;
  label: string;
  description: string;
  metrics: FlowMetric[];
  equipment: FlowEquipment[];
  /** Any metric alerting, or any attached equipment in fault. */
  attention: boolean;
}

/**
 * Flow-line kinds. The colour of each kind is FIXED across both themes —
 * operators read the diagram by colour (design/ui-brief.md, "STRICT COLOR
 * CODING FOR FLOW LINES"). Do not recolour these to fit a palette.
 */
export type FlowKind = "water" | "air" | "sludge";

/**
 * 🔵 water in/out · ⚪ air from blower · 🟤 RAS/WAS sludge.
 *
 * FLOW-1 (2026-08-02): these were hardcoded hex, which broke two ways — air
 * was near-white and therefore invisible on the light theme's #f3fbf7 page,
 * and sludge had drifted to #b45309 while tokens.css said #92400e. Both now
 * point at the CSS variables, so styles/tokens.css is the single source and
 * air can be theme-scoped. SVG `stroke` and CSS `background` both accept
 * var(), so no call site changes.
 */
export const FLOW_KIND_COLORS: Record<FlowKind, string> = {
  water: "var(--flow-water)",
  air: "var(--flow-air)",
  sludge: "var(--flow-sludge)",
};

export interface FlowLink {
  from: FlowAnchorKey;
  to: FlowAnchorKey;
  kind: FlowKind;
  /**
   * Whether medium is actually moving. Drives whether the SVG line animates —
   * a still line means "this pump is off", which is information. Never
   * animate an inactive link just because it looks better.
   */
  active: boolean;
}

export interface FlowDiagramData {
  /** reading_date (YYYY-MM-DD) or a sample timestamp. null = nothing to show. */
  asOf: string | null;
  /** Provenance — the component renders this as a badge. */
  source: "dummy" | "daily-reading" | "live-sensor";
  systemOperating: boolean | null;
  stages: FlowStage[];
  links: FlowLink[];
}

// ─── Adapter: reading row → view model ───────────────────────────────────

/**
 * Permissive input shape. Both `DashboardRow` and `ReadingDetail` satisfy it,
 * and every field is optional so a partial reading maps cleanly to
 * null/`unknown` instead of throwing.
 */
export type FlowSource = Record<string, number | string | boolean | null | undefined>;

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? null : n;
}

/** A missing boolean is `unknown`, never `idle`. */
function equipmentState(v: unknown): EquipmentState {
  if (v === true) return "active";
  if (v === false) return "idle";
  return "unknown";
}

/**
 * Map a reading row onto the diagram's view model.
 *
 * NOTE — not yet wired to the dashboard query: `fetchDashboard()` selects a
 * narrow column list from `v_dashboard_14day`, which carries neither the
 * per-stage DO/TDS values nor any of the 10 `*_running` booleans. Feeding
 * this adapter a `DashboardRow` therefore yields mostly `unknown`/null. To
 * drive the diagram from real data, query `v_reading_with_computed` (it is
 * `reading.*` plus computed fields) or widen the fetchDashboard select list.
 */
export function toFlowModel(
  row: FlowSource,
  source: FlowDiagramData["source"] = "daily-reading",
): FlowDiagramData {
  const stages: FlowStage[] = FLOW_STAGE_ORDER.map((key) => {
    const metrics: FlowMetric[] = METRIC_SPECS[key].map((spec) => {
      const value = num(row[spec.key]);
      return { ...spec, value, alert: alertFor(spec.key, value) };
    });
    const equipment: FlowEquipment[] = STAGE_EQUIPMENT[key].map((eq) => ({
      ...eq,
      // Run-state columns are `<code>_running`; the screen columns already
      // carry their full column name in `code`.
      state: equipmentState(
        eq.code.startsWith("screen_") ? row[eq.code] : row[`${eq.code}_running`],
      ),
    }));
    return {
      key,
      ...STAGE_LABELS[key],
      metrics,
      equipment,
      attention: metrics.some((m) => m.alert) || equipment.some((e) => e.state === "fault"),
    };
  });

  const systemOperating =
    row.system_operating === true ? true : row.system_operating === false ? false : null;

  return {
    asOf: typeof row.reading_date === "string" ? row.reading_date : null,
    source,
    systemOperating,
    stages,
    links: deriveLinks(stages, systemOperating),
  };
}

/**
 * Derive which lines are moving from equipment state. Water flows unless the
 * system is explicitly abnormal; air flows when a blower/aerator is running;
 * sludge flows when a sludge pump is running.
 */
export function deriveLinks(
  stages: FlowStage[],
  systemOperating: boolean | null,
): FlowLink[] {
  const running = (stageKey: FlowStageKey) =>
    stages.find((s) => s.key === stageKey)?.equipment.some((e) => e.state === "active") ?? false;

  const water = systemOperating !== false;
  const air = running("aeration");
  const sludge = running("sediment");

  return [
    { from: "influent", to: "screening", kind: "water", active: water },
    { from: "screening", to: "aeration", kind: "water", active: water },
    { from: "aeration", to: "sediment", kind: "water", active: water },
    { from: "sediment", to: "chlorine", kind: "water", active: water },
    { from: "chlorine", to: "discharge", kind: "water", active: water },
    { from: "blower", to: "aeration", kind: "air", active: air },
    // RAS returns settled sludge to aeration; WAS leaves the system.
    { from: "sediment", to: "aeration", kind: "sludge", active: sludge },
    { from: "sediment", to: "sludge_out", kind: "sludge", active: sludge },
  ];
}

// ─── Dummy fixture ───────────────────────────────────────────────────────

/**
 * Hand-written row used until the diagram is pointed at real data. Values are
 * plausible for this plant and deliberately exercise every render branch:
 * pump1 active / pump2 idle, aerator2 unknown (partial reading), a DO that
 * sits just above doMin, and a free-chlorine value that does NOT alert.
 *
 * Anything reading this must show source="dummy" — never let a fixture pass
 * for a real measurement on an operator's screen.
 */
export const DUMMY_FLOW_ROW: FlowSource = {
  reading_date: "2026-07-30",
  system_operating: true,
  // Water quality
  do_aeration: 2.5,
  do_sedimentation: 3.1,
  do_before_discharge: 4.0,
  ph: 7.2,
  tds_aeration: 480,
  tds_before_discharge: 410,
  temp_aeration: 29.4,
  sv30: 220,
  free_chlorine: 0.8,
  chlorine_used: 12.5,
  // Equipment checklist — pump2 off, aerator2 not recorded (stays `unknown`)
  screen_cleaned_coarse: true,
  screen_cleaned_fine: true,
  pump1_running: true,
  pump2_running: false,
  aerator1_running: true,
  sludge_pump1_running: true,
  sludge_pump2_running: false,
  chlorine_pump1_running: true,
  chlorine_pump2_running: false,
};

/** Ready-to-render dummy view model. */
export const DUMMY_FLOW_DATA: FlowDiagramData = toFlowModel(DUMMY_FLOW_ROW, "dummy");

/** Empty-state model — no reading at all. Used by the hook before data lands. */
export const EMPTY_FLOW_DATA: FlowDiagramData = toFlowModel({}, "daily-reading");
