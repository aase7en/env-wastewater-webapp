export type WaterWatchEvidenceKind =
  | "OBSERVED"
  | "FORECAST"
  | "DERIVED"
  | "SIMULATED"
  | "UNAVAILABLE";

export type WaterWatchRisk =
  | "NORMAL"
  | "WATCH"
  | "HIGH"
  | "OFFICIAL_WARNING"
  | "UNAVAILABLE";

export type WaterWatchTrend = "RISING" | "STEADY" | "FALLING" | "UNKNOWN";

export interface WaterWatchMetric {
  label: string;
  value: string;
  helper: string;
  evidenceKind: WaterWatchEvidenceKind;
}

export interface WaterWatchStation {
  id: string;
  name: string;
  area: string;
  risk: WaterWatchRisk;
  value: string | null;
  helper: string;
  trend: WaterWatchTrend;
  positionPercent: number;
}

export interface WaterWatchArea {
  name: string;
  detail: string;
  risk: WaterWatchRisk;
}

export interface WaterWatchForecastPoint {
  label: string;
  value: number;
  kind: "SIMULATED";
}

export interface WaterWatchSnapshot {
  mode: "SIMULATED";
  risk: WaterWatchRisk;
  eyebrow: string;
  title: string;
  summary: string;
  updatedLabel: string;
  sourceLabel: string;
  metrics: WaterWatchMetric[];
  stations: WaterWatchStation[];
  advice: string[];
  watchAreas: WaterWatchArea[];
  forecast: WaterWatchForecastPoint[];
  rainfallBars: Array<{ label: string; value: number; kind: "SIMULATED" }>;
}

export interface RiskPresentation {
  label: string;
  shortLabel: string;
  surfaceClass: string;
  textClass: string;
  dotClass: string;
}

const RISK_PRESENTATION: Record<WaterWatchRisk, RiskPresentation> = {
  NORMAL: {
    label: "ปกติ",
    shortLabel: "ปกติ",
    surfaceClass: "border-emerald-200 bg-emerald-50",
    textClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  WATCH: {
    label: "เฝ้าระวัง",
    shortLabel: "เฝ้าระวัง",
    surfaceClass: "border-amber-200 bg-amber-50",
    textClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
  HIGH: {
    label: "เฝ้าระวังสูง",
    shortLabel: "เสี่ยงสูง",
    surfaceClass: "border-rose-200 bg-rose-50",
    textClass: "text-rose-700",
    dotClass: "bg-rose-500",
  },
  OFFICIAL_WARNING: {
    label: "แจ้งเตือนทางการ",
    shortLabel: "แจ้งเตือน",
    surfaceClass: "border-red-300 bg-red-100",
    textClass: "text-red-800",
    dotClass: "bg-red-600",
  },
  UNAVAILABLE: {
    label: "ประเมินไม่ได้",
    shortLabel: "ไม่มีข้อมูล",
    surfaceClass: "border-slate-200 bg-slate-100",
    textClass: "text-slate-600",
    dotClass: "bg-slate-400",
  },
};

export function getRiskPresentation(risk: WaterWatchRisk): RiskPresentation {
  return RISK_PRESENTATION[risk];
}

export function getTrendLabel(trend: WaterWatchTrend): string {
  switch (trend) {
    case "RISING":
      return "เพิ่มขึ้น";
    case "FALLING":
      return "ลดลง";
    case "STEADY":
      return "ทรงตัว";
    default:
      return "ยังไม่ทราบแนวโน้ม";
  }
}

/**
 * Visual-only scenario for ENV-WATER-WATCH-001.
 *
 * Every number below is intentionally SIMULATED and must never be used as
 * current environmental evidence. Keeping the demo data in one typed module
 * makes the later provider-backed snapshot replacement explicit and testable.
 */
export const simulatedWaterWatchSnapshot: WaterWatchSnapshot = {
  mode: "SIMULATED",
  risk: "HIGH",
  eyebrow: "ตัวอย่างหน้าจอสำหรับโรงพยาบาลอุทัย",
  title: "สถานการณ์น้ำ พื้นที่อำเภออุทัย",
  summary:
    "ตัวอย่างจำลองแสดงวิธีสื่อสารเมื่อระดับน้ำมีแนวโน้มเพิ่มขึ้นและพื้นที่ลุ่มต่ำต้องเฝ้าระวัง",
  updatedLabel: "ยังไม่เชื่อมข้อมูลจริง",
  sourceLabel: "SIMULATED · UI PROTOTYPE",
  metrics: [
    {
      label: "ปริมาณฝนวันนี้",
      value: "48 มม.",
      helper: "ตัวอย่าง: มากกว่าค่าฐานจำลอง",
      evidenceKind: "SIMULATED",
    },
    {
      label: "ระดับน้ำจุดหลัก",
      value: "2.85 ม.",
      helper: "ตัวอย่าง: ต่ำกว่าระดับอ้างอิง 0.30 ม.",
      evidenceKind: "SIMULATED",
    },
    {
      label: "แนวโน้ม",
      value: "เพิ่มขึ้น",
      helper: "ตัวอย่าง: +0.15 ม. / 3 ชม.",
      evidenceKind: "SIMULATED",
    },
    {
      label: "ผลกระทบ",
      value: "ยังไม่ท่วม",
      helper: "ตัวอย่าง: เฝ้าระวังพื้นที่ลุ่มต่ำ",
      evidenceKind: "SIMULATED",
    },
  ],
  stations: [
    {
      id: "demo-upstream",
      name: "จุดเฝ้าระวังต้นน้ำ",
      area: "บางบาล",
      risk: "NORMAL",
      value: "2.10 ม.",
      helper: "ต่ำกว่าระดับอ้างอิง 1.20 ม.",
      trend: "STEADY",
      positionPercent: 8,
    },
    {
      id: "demo-ayutthaya",
      name: "จุดเฝ้าระวังเมือง",
      area: "พระนครศรีอยุธยา",
      risk: "WATCH",
      value: "2.45 ม.",
      helper: "ต่ำกว่าระดับอ้างอิง 0.50 ม.",
      trend: "RISING",
      positionPercent: 29,
    },
    {
      id: "demo-uthai",
      name: "จุดเฝ้าระวังอุทัย",
      area: "อุทัย",
      risk: "HIGH",
      value: "2.85 ม.",
      helper: "ต่ำกว่าระดับอ้างอิง 0.30 ม.",
      trend: "RISING",
      positionPercent: 50,
    },
    {
      id: "demo-bang-pa-in",
      name: "จุดเฝ้าระวังปลายน้ำ",
      area: "บางปะอิน",
      risk: "WATCH",
      value: "2.60 ม.",
      helper: "ต่ำกว่าระดับอ้างอิง 0.40 ม.",
      trend: "RISING",
      positionPercent: 71,
    },
    {
      id: "demo-bang-sai",
      name: "จุดอ้างอิงปลายน้ำ",
      area: "บางไทร",
      risk: "NORMAL",
      value: "1.90 ม.",
      helper: "ต่ำกว่าระดับอ้างอิง 1.50 ม.",
      trend: "STEADY",
      positionPercent: 92,
    },
  ],
  advice: [
    "ติดตามข้อมูลจากหน่วยงานทางการและเวลาที่อัปเดตล่าสุด",
    "เตรียมของสำคัญให้พร้อม หากพื้นที่จริงถูกจัดเป็นเขตเฝ้าระวัง",
    "หลีกเลี่ยงเส้นทางลุ่มต่ำเมื่อมีประกาศหรือพบสถานการณ์น้ำท่วมจริง",
  ],
  watchAreas: [
    {
      name: "พื้นที่ริมคลอง/ทางน้ำในอุทัย",
      detail: "ตัวอย่างพื้นที่ลำดับแรกของ scenario",
      risk: "HIGH",
    },
    {
      name: "พื้นที่ลุ่มต่ำรอบอุทัย",
      detail: "ตัวอย่างพื้นที่เฝ้าระวัง",
      risk: "WATCH",
    },
    {
      name: "ตัวเมืองพระนครศรีอยุธยา",
      detail: "ตัวอย่างบริบทพื้นที่เชื่อมโยง",
      risk: "WATCH",
    },
    {
      name: "บางปะอิน / บางไทร",
      detail: "ตัวอย่างบริบทปลายน้ำ",
      risk: "NORMAL",
    },
  ],
  forecast: [
    { label: "ตอนนี้", value: 42, kind: "SIMULATED" },
    { label: "+6 ชม.", value: 53, kind: "SIMULATED" },
    { label: "+12 ชม.", value: 66, kind: "SIMULATED" },
    { label: "+18 ชม.", value: 72, kind: "SIMULATED" },
    { label: "+24 ชม.", value: 78, kind: "SIMULATED" },
  ],
  rainfallBars: [
    { label: "06:00", value: 14, kind: "SIMULATED" },
    { label: "12:00", value: 34, kind: "SIMULATED" },
    { label: "16:00", value: 68, kind: "SIMULATED" },
    { label: "20:00", value: 45, kind: "SIMULATED" },
    { label: "พรุ่งนี้", value: 26, kind: "SIMULATED" },
  ],
};
