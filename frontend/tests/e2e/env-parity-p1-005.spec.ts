/**
 * ENV-PARITY-P1-005 — e2e for the water-supply (น้ำประปาบาดาล) daily usage
 * parity: activity enum, Hour_meter / Chlorine usage / Water_In fields, the
 * §2.3 Show-If groups, the verbatim Water_In error, and the chain-view
 * derived displays (energy / water_in / chlorine real) WITH their estimate
 * flags — reference doc 12 §3.8 (ref 2384–2677), pinned per WO §2.
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted, including the daily_check POST, so this spec
 * never touches ENV_DB (house truth constraint: no durable writes in
 * tests — recorded honestly per WO §3.4).
 *
 * RED-first: at the RED commit none of these surfaces exist (activity
 * select, usage fields, estimate displays, validation) — the failures are
 * the evidence.
 */
import { test, expect } from "./fixtures";

const CHAIN_ROWS_OK = [
  {
    id: "c2",
    check_date: "2026-11-16",
    location_id: null,
    recorded_by: null,
    note: null,
    created_at: "2026-11-16T03:00:00Z",
    activity: "ลงข้อมูลการใช้น้ำประจำวัน",
    hour_meter: 10,
    prev_hour_meter: 6,
    hour_work: 4,
    hour_boundary_flag: false,
    hour_boundary_reason: null,
    water_in: null,
    water_in_estimate: null,
    chlorine_usage: 5,
    chlorine_usage_realy: 0.5,
    chlorine_concentrated: 0.5,
    energy_use_estimate: 14.8,
    spec_energy_kwh_per_h: 3.7,
    spec_flow_m3_per_h: null,
    mix_part_chlorine: 1,
    mix_part_water: 9,
    spec_missing: false,
    spec_missing_kinds: null,
  },
];

async function mockWaterSupplyRest(
  page: import("@playwright/test").Page,
  opts?: {
    dailyCheck?: unknown[];
    chain?: unknown[];
    capturePost?: (payload: Record<string, unknown>) => void;
  },
) {
  await page.route("**/rest/v1/daily_check**", async (route) => {
    if (route.request().method() === "POST") {
      opts?.capturePost?.(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: "new-1" }]),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(opts?.dailyCheck ?? []),
    });
  });
  await page.route("**/rest/v1/v_daily_check_chain**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(opts?.chain ?? []),
    });
  });
}

test.describe("usage fields (§2.1 verbatim labels + §2.3 groups)", () => {
  test("activity select carries the two verbatim values with the usage-mode default", async ({ authed: page }) => {
    await mockWaterSupplyRest(page);
    await page.goto("/water-supply");
    const sel = page.getByTestId("activity-select");
    await expect(sel).toBeVisible();
    for (const v of ["ลงข้อมูลการใช้น้ำประจำวัน", "ฟรีคลอรีน / TDS"]) {
      await expect(sel.locator(`option[value="${v}"]`)).toHaveCount(1);
    }
    await expect(sel).toHaveValue("ลงข้อมูลการใช้น้ำประจำวัน");
  });

  test("usage mode shows Hour_meter + Chlorine usage + Water_In with verbatim labels", async ({ authed: page }) => {
    await mockWaterSupplyRest(page);
    await page.goto("/water-supply");
    await expect(page.getByTestId("hour-meter-input")).toBeVisible();
    await expect(page.getByText("Hour_meter", { exact: true })).toBeVisible();
    await expect(page.getByTestId("chlorine-usage-input")).toBeVisible();
    await expect(page.getByText("Chlorine usage", { exact: true })).toBeVisible();
    await expect(page.getByTestId("water-in-input")).toBeVisible();
    await expect(page.getByText("บริมาณน้ำเข้า", { exact: true })).toBeVisible();
  });

  test("quality mode (ฟรีคลอรีน / TDS) hides the usage fields; quality fields stay", async ({ authed: page }) => {
    await mockWaterSupplyRest(page);
    await page.goto("/water-supply");
    await page.getByTestId("activity-select").selectOption("ฟรีคลอรีน / TDS");
    await expect(page.getByTestId("hour-meter-input")).toHaveCount(0);
    await expect(page.getByTestId("chlorine-usage-input")).toHaveCount(0);
    await expect(page.getByTestId("water-in-input")).toHaveCount(0);
    // The 9 quality fields keep their current behavior (untouched).
    // (pH appears twice — form label + the pre-existing list header.)
    await expect(page.getByText("pH", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("คลอรีนอิสระ (mg/L)")).toBeVisible();
    await expect(page.getByText("TDS (mg/L)")).toBeVisible();
    // Switching back restores the usage group.
    await page.getByTestId("activity-select").selectOption("ลงข้อมูลการใช้น้ำประจำวัน");
    await expect(page.getByTestId("hour-meter-input")).toBeVisible();
    await expect(page.getByTestId("water-in-input")).toBeVisible();
  });
});

test.describe("Water_In validation (Valid If >0 — error verbatim)", () => {
  test("0 or negative shows ตรวจสอบข้อมูลดีๆก่อน and blocks the submit", async ({ authed: page }) => {
    let posted: Record<string, unknown> | null = null;
    await mockWaterSupplyRest(page, { capturePost: (p) => (posted = p) });
    await page.goto("/water-supply");
    await page.getByTestId("water-in-input").fill("-1");
    await expect(page.getByTestId("water-in-error")).toContainText("ตรวจสอบข้อมูลดีๆก่อน");
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect.poll(() => posted, { timeout: 3000 }).toBe(null); // blocked
    await page.getByTestId("water-in-input").fill("0");
    await expect(page.getByTestId("water-in-error")).toContainText("ตรวจสอบข้อมูลดีๆก่อน");
  });

  test("empty passes (NULL ≠ violation) and a positive value submits", async ({ authed: page }) => {
    let posted: Record<string, unknown> | null = null;
    await mockWaterSupplyRest(page, { capturePost: (p) => (posted = p) });
    await page.goto("/water-supply");
    await expect(page.getByTestId("water-in-error")).toHaveCount(0);
    await page.getByTestId("water-in-input").fill("5");
    await expect(page.getByTestId("water-in-error")).toHaveCount(0);
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect.poll(() => posted, { timeout: 5000 }).not.toBe(null);
    expect(posted!["water_in"]).toBe(5);
    expect(posted!["activity"]).toBe("ลงข้อมูลการใช้น้ำประจำวัน");
  });
});

test.describe("derived displays from the chain view (flags + spec provenance)", () => {
  test("energy estimate shows WITH ค่าประมาณจากสเปก + provenance; chlorine real ÷(1+9); no-flow → honest chip", async ({ authed: page }) => {
    await mockWaterSupplyRest(page, { chain: CHAIN_ROWS_OK });
    await page.goto("/water-supply");
    const derived = page.getByTestId("derived-chain-card");
    await expect(derived).toBeVisible();
    await expect(derived).toContainText("4"); // hour_work
    await expect(derived).toContainText("14.8"); // 4 × 3.7 spec-at-date
    await expect(derived).toContainText("ค่าประมาณจากสเปก");
    await expect(derived).toContainText("3.7"); // spec provenance shown
    await expect(derived).toContainText("0.5"); // chlorine_usage_realy = 5 ÷ (1+9)
    await expect(derived).toContainText("6"); // prev_hour_meter
    // water_in_estimate: the live spec has NO flow → NULL + honest chip;
    // the estimate badge appears ONLY when an estimate value exists.
    await expect(derived).toContainText("ยังไม่มีค่าอัตราการไหลในสเปก");
    await expect(derived).not.toContainText("ประมาณจากชั่วโมงปั๊ม");
    // No boundary on this row.
    await expect(derived).not.toContainText("delta <= 0");
  });

  test("water_in estimate appears WITH the ประมาณจากชั่วโมงปั๊ม flag when the spec flow exists", async ({ authed: page }) => {
    await mockWaterSupplyRest(page, {
      chain: [{ ...CHAIN_ROWS_OK[0], id: "c4", water_in_estimate: 32, spec_flow_m3_per_h: 8 }],
    });
    await page.goto("/water-supply");
    const derived = page.getByTestId("derived-chain-card");
    await expect(derived).toContainText("32");
    await expect(derived).toContainText("ประมาณจากชั่วโมงปั๊ม");
    await expect(derived).not.toContainText("ยังไม่มีค่าอัตราการไหลในสเปก");
  });

  test("boundary row: delta ≤ 0 → no numeric hour_work/energy, boundary reason shown", async ({ authed: page }) => {
    await mockWaterSupplyRest(page, {
      chain: [
        {
          ...CHAIN_ROWS_OK[0],
          id: "c3",
          hour_meter: 6,
          prev_hour_meter: 10,
          hour_work: null,
          hour_boundary_flag: true,
          hour_boundary_reason: "delta <= 0 (meter reset/swap suspected)",
          // The view never derives these when hour_work is NULL.
          energy_use_estimate: null,
          water_in_estimate: null,
        },
      ],
    });
    await page.goto("/water-supply");
    const derived = page.getByTestId("derived-chain-card");
    await expect(derived).toContainText("delta <= 0 (meter reset/swap suspected)");
    // The invariants: never 0, never negative — no fabricated hour/energy.
    await expect(derived).not.toContainText("14.8");
    await expect(derived).not.toContainText("-4");
  });

  test("empty chain (no rows yet) shows no fabricated numbers", async ({ authed: page }) => {
    await mockWaterSupplyRest(page, { chain: [] });
    await page.goto("/water-supply");
    await expect(page.getByTestId("derived-chain-card")).toHaveCount(0);
  });
});

test.describe("regression guard + no-durable-write", () => {
  test("quality form + list still render (untouched surface)", async ({ authed: page }) => {
    await mockWaterSupplyRest(page, {
      dailyCheck: [
        {
          id: "q1",
          check_date: "2026-11-15",
          location_id: null,
          ph: 7.2,
          free_chlorine_residual: 0.6,
          turbidity: 1.1,
          total_coliform: "ไม่พบ",
          fecal_coliform: null,
          iron: null,
          manganese: null,
          hardness: null,
          tds: 120,
          recorded_by: null,
          note: null,
          created_at: "2026-11-15T03:00:00Z",
        },
      ],
    });
    await page.goto("/water-supply");
    await expect(page.getByText("วันที่ตรวจ")).toBeVisible();
    await expect(page.getByText("ความขุ่น (NTU)")).toBeVisible();
    await expect(page.getByText("2026-11-15")).toBeVisible(); // list row
    await expect(page.getByText("ไม่พบ")).toBeVisible();
  });

  test("submit posts the usage fields to a MOCKED endpoint (no real write)", async ({ authed: page }) => {
    let posted: Record<string, unknown> | null = null;
    await mockWaterSupplyRest(page, { capturePost: (p) => (posted = p) });
    await page.goto("/water-supply");
    await page.getByTestId("hour-meter-input").fill("10");
    await page.getByTestId("chlorine-usage-input").fill("5");
    await page.getByTestId("water-in-input").fill("45");
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect.poll(() => posted, { timeout: 5000 }).not.toBe(null);
    expect(posted!["hour_meter"]).toBe(10);
    expect(posted!["chlorine_usage"]).toBe(5);
    expect(posted!["water_in"]).toBe(45);
    expect(posted!["activity"]).toBe("ลงข้อมูลการใช้น้ำประจำวัน");
    // The view-derived fields are NEVER part of a write payload.
    expect(posted!["energy_use_estimate"]).toBeUndefined();
    expect(posted!["chlorine_usage_realy"]).toBeUndefined();
    expect(posted!["water_in_estimate"]).toBeUndefined();
  });
});
