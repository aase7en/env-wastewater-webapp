export type SituationSourceType =
  | "observation"
  | "forecast"
  | "satellite_estimate"
  | "model_estimate"
  | "manual_latest"
  | "live_sensor"
  | "simulation";

export type FreshnessState = "current" | "stale" | "unknown";

export type TrendDirection = "up" | "down" | "stable";

export interface SituationTrend {
  direction: TrendDirection;
  /** Caller-supplied, domain-aware label. The component never derives a trend. */
  label: string;
}

export type SituationStatusTone = "neutral" | "cyan" | "green" | "amber" | "red";

export const SOURCE_TYPE_LABELS: Record<SituationSourceType, string> = {
  observation: "การสังเกต",
  forecast: "พยากรณ์",
  satellite_estimate: "ประมาณการจากดาวเทียม",
  model_estimate: "ผลจากแบบจำลอง",
  manual_latest: "บันทึกล่าสุดโดยผู้ปฏิบัติงาน",
  live_sensor: "เซนเซอร์สด",
  simulation: "สถานการณ์จำลอง",
};

export const FRESHNESS_LABELS: Record<FreshnessState, string> = {
  current: "ข้อมูลล่าสุด",
  stale: "ข้อมูลล้าสมัย",
  unknown: "ไม่ทราบความสดใหม่",
};
