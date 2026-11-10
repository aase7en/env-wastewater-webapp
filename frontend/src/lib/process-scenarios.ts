import type {
  EmissionFactor,
  ScenarioDefinition,
} from "./process-scenario";

/**
 * ENV-VIS-STORY-001B-VIEW — the PRODUCTION scenario catalog (the single
 * six-scenario source, promoted from the C1 fixtures). The test fixture
 * module (`__fixtures__/process-scenarios.ts`) RE-EXPORTS this catalog, so
 * production code paths never import `__fixtures__/`.
 *
 * Qualitative labels only — no numeric effects in labels/assumptions. The
 * NUMERIC-EFFECT declarations (ENV-VIS-STORY-001-NUM, owner gate N3+N4
 * decision 2026-11-10 on issue #110) live in `numericEffects` and derive
 * ONLY through `deriveScenarioWasDifference` / `deriveScenarioSensitivities`
 * as SIMULATED outputs. N1 is rejected and N2 stays deferred (relay
 * duty-cycle reference pending owner values), so neither appears here.
 * Every label uses explicit hypothetical (สมมุติ) wording.
 */
export const PROCESS_SCENARIO_CATALOG: readonly ScenarioDefinition[] = [
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
    numericEffects: {
      sensitivities: [
        {
          id: "aeration-blower-electricity",
          label: "ไฟฟ้าเครื่องเติมอากาศ (SIMULATED)",
          factorId: "tgo-grid-th-2022-2024",
          activityBase: {
            kind: "aeration-blower-runtime-kwh",
            sourceId: "relay-duty-cycle-reference",
            status: "pending-owner-values",
          },
          formula: "activityBaseKwh × factorKgCo2ePerKwh",
        },
      ],
    },
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
    numericEffects: {
      wasDifference: {
        proposed: {
          value: 1.5,
          unit: "m³/วัน",
          assumptionClass: "declared-model-assumption",
          assumptionId: "001-NUM-v1",
          note:
            "ค่าที่เสนอเป็นสมมติฐานแบบจำลองเพื่อสาธิตผลต่าง WAS — ไม่ใช่ค่าบันทึกจริง ไม่ใช่ค่าที่เจ้าของกำหนด และต้องไม่ใช้ตีความการดำเนินงานจริง",
        },
      },
    },
  },
  {
    id: "chlorine-dosing-interruption",
    label: "หยุดจ่ายคลอรีน (สมมุติ)",
    provenance: { source: "simulation", observedAt: null },
    assumptions: ["สมมุติการหยุดจ่ายคลอรีนในโหมดจำลองเท่านั้น ไม่อ้างค่าคลอรีนคงเหลือ"],
    edgeOverrides: { "chlorine-dosing": "interrupted" },
  },
];

/**
 * ENV-VIS-STORY-001-NUM — cited-versioned emission-factor registry (N4).
 * Only factors with an explicit source document + version/publication
 * identity are admitted (owner contingency). The TGO grid-electricity
 * factor is the multi-source-corroborated organizational (CFO/CFP) factor:
 * 0.5562 kgCO2e/kWh for the Thai grid mix, data years 2022–2024, effective
 * 2026-01-01 by the TGO board announcement (Scope 2 generation part 0.4750
 * + Scope 3 upstream fuel-chain part 0.0812; GWP set IPCC AR5). The IPCC
 * entry is a declared FALLBACK CLASS only — it binds no value until a
 * wastewater activity base (e.g. BOD) exists in a future reviewed slice.
 */
export const NUMERIC_EFFECT_EMISSION_FACTORS: readonly EmissionFactor[] = [
  {
    id: "tgo-grid-th-2022-2024",
    kind: "grid-electricity",
    name: "ค่าการปล่อยก๊าซเรือนกระจก ไฟฟ้า grid mix ของประเทศไทย (Scope 2 + Scope 3)",
    value: 0.5562,
    unit: "kgCO2e/kWh",
    source:
      "องค์การบริหารจัดการก๊าซเรือนกระจก (อบก. / TGO) — ค่าการปล่อยก๊าซเรือนกระจกจากการผลิต/ใช้ไฟฟ้า (ประกาศ ธ.ค. 2568 มีผล 1 ม.ค. 2569); ตารางแฟกทอร์ CFP/CFO อบก. (Update_April2026, ข้อมูลร่วม Thai National LCI Database, TIIS-MTEC-NSTDA)",
    version:
      "grid mix ปีข้อมูล 2022–2024 (Scope 2 = 0.4750 + Scope 3 upstream = 0.0812 kgCO2e/kWh; GWP คู่ขนาน IPCC AR5)",
    uncertaintyClass: "official-national-factor",
    applicability:
      "ไฟฟ้าจากสายส่งระดับประเทศไทย สำหรับการประเมินก๊าซเรือนกระจกระดับองค์กร (CFO); อบก. ไม่ระบุชัดว่ารวมค่าสูญเสียการส่ง/จำหน่าย (T/D) หรือไม่ — ตีความเป็นค่าปล่อยฝั่งผลิต+ห่วงโซ่เชื้อเพลิงเท่านั้น",
    sourceUrl: "https://thaicarbonlabel.tgo.or.th/",
  },
  {
    id: "ipcc-2006-vol5-ch6-fallback",
    kind: "fallback-class",
    name: "คลาสค่าสำรอง (fallback class) — 2006 IPCC Guidelines Vol.5 Waste Ch.6 defaults",
    value: null,
    unit: null,
    source:
      "2006 IPCC Guidelines for National Greenhouse Gas Inventories, Volume 5: Waste, Chapter 6 (Wastewater Treatment and Discharge)",
    version:
      "2006 IPCC Guidelines (มาตรฐานเดียวกับที่ประเทศไทยใช้ในรายงานบัญชีก๊าซเรือนกระจกแห่งชาติ BUR4)",
    uncertaintyClass: "tier-1-default-high",
    applicability:
      "คลาสสำรองสำหรับผลกระทบก๊าซเรือนกระจกภาคน้ำเสีย/ตะกอน ในอนาคตเมื่อมีฐานกิจกรรม (เช่น BOD) รองรับ — ปัจจุบันไม่ผูกกับฐานกิจกรรมใดและไม่ถูกนำไปคำนวณ",
  },
];
