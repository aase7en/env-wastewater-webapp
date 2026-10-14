import type { ScenarioDefinition } from "../process-scenario";

/**
 * ENV-VIS-STORY-001B-C1 — the six SSoT modeling-rule-5 simulation fixtures.
 * Isolated test/lib data: production code paths must NEVER import this file.
 * Every scenario is qualitative only — no numeric effects, units, or
 * observed timestamps (the domain-owner numeric gate stays UNPASSED).
 */
export const PROCESS_SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: "pump-sump-bypass-active",
    label: "เปิดเส้นทางรองบ่อพัก (สมมุติ)",
    provenance: { source: "simulation", observedAt: null },
    assumptions: [
      "สมมุติการเปิดใช้เส้นทางรองในโหมดจำลองเท่านั้น",
      "การเชื่อมต่อ as-built ยังเป็น needs_confirmation เสมอ",
    ],
    edgeOverrides: { "pump-sump-bypass": "active-path" },
  },
  {
    id: "emergency-overflow-active",
    label: "เปิดเส้นทางล้นฉุกเฉิน (สมมุติ)",
    provenance: { source: "simulation", observedAt: null },
    assumptions: [
      "สมมุติการเปิดใช้เส้นทางล้นฉุกเฉินในโหมดจำลองเท่านั้น",
      "การเชื่อมต่อ as-built ยังเป็น needs_confirmation เสมอ",
    ],
    edgeOverrides: { "emergency-overflow": "active-path" },
  },
  {
    id: "loss-of-aeration",
    label: "หยุดการเติมอากาศ (บ่อเติมอากาศ)",
    provenance: { source: "simulation", observedAt: null },
    assumptions: [
      "สมมุติการหยุดเติมอากาศเชิงกระบวนการเท่านั้น",
      "ไม่อ้างผลเชิงเลขหรือคุณภาพน้ำใด ๆ (รอการอนุมัติของเจ้าของโดเมน)",
    ],
    edgeOverrides: {},
    stageOverrides: { aeration_tank: { aeration: "interrupted" } },
  },
  {
    id: "ras-interruption",
    label: "หยุดส่งตะกอนไหลกลับ (RAS)",
    provenance: { source: "simulation", observedAt: null },
    assumptions: ["สมมุติการหยุดลูป RAS ในโหมดจำลองเท่านั้น"],
    edgeOverrides: { "ras-return": "interrupted" },
  },
  {
    id: "excess-sludge-wasting",
    label: "การทิ้งตะกอนส่วนเกิน (WAS)",
    provenance: { source: "simulation", observedAt: null },
    assumptions: [
      "สมมุติเงื่อนไขเน้นการทิ้งตะกอนส่วนเกินเชิงคุณภาพ",
      "ไม่อ้างปริมาณหรืออัตราใด ๆ",
    ],
    edgeOverrides: { "was-to-drying-beds": "active-path" },
  },
  {
    id: "chlorine-dosing-interruption",
    label: "หยุดจ่ายคลอรีน (สมมุติ)",
    provenance: { source: "simulation", observedAt: null },
    assumptions: ["สมมุติการหยุดจ่ายคลอรีนในโหมดจำลองเท่านั้น ไม่อ้างค่าคลอรีนคงเหลือ"],
    edgeOverrides: { "chlorine-dosing": "interrupted" },
  },
];
