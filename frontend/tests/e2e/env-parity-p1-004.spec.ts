/**
 * ENV-PARITY-P1-004 — e2e for the AppSheet-parity daily form, honest
 * warnings, the >2.5 chlorine format rule, and the admin equipment-spec
 * page.
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted, so the spec append below never touches ENV_DB
 * (house truth constraint: no durable writes in tests).
 *
 * RED-first: at the RED commit none of these surfaces exist (fields, chips,
 * highlight, /admin/equipment-specs route) — the failures are the evidence.
 */
import { test, expect } from "./fixtures";

const EQUIPMENT_ROWS = [
  { id: "e1", code: "screen_coarse", name_th: "ล้างตะแกรงบ่อสูบ", is_active: true },
  { id: "e2", code: "screen_fine", name_th: "ล้างตะแกรงละเอียด", is_active: true },
  { id: "e3", code: "pump1", name_th: "เครื่องสูบน้ำเสีย 1", is_active: true },
  { id: "e4", code: "pump2", name_th: "เครื่องสูบน้ำเสีย 2", is_active: true },
];

const PERSONNEL_ROWS = [
  { id: "p1", staff_code: "S001", full_name: "สมศรี นักวิชาการ", position: "นักวิชาการสาธารณสุข", status: "ทำงาน" },
  { id: "p2", staff_code: "S002", full_name: "สมชาย บริการ", position: "พนักงานบริการ", status: "ทำงาน" },
  { id: "p3", staff_code: "S003", full_name: "แพทย์ใหญ่", position: "นายแพทย์", status: "ทำงาน" },
  { id: "p4", staff_code: "S004", full_name: "ลาออกแล้ว", position: "พนักงานบริการ", status: "ลาออก" },
];

async function mockFormRefs(page: import("@playwright/test").Page, opts?: {
  dailyCheck?: unknown[];
  meterChain?: unknown[];
}) {
  await page.route("**/rest/v1/equipment**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EQUIPMENT_ROWS) });
  });
  await page.route("**/rest/v1/personnel**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERSONNEL_ROWS) });
  });
  await page.route("**/rest/v1/daily_check**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(opts?.dailyCheck ?? []),
    });
  });
  await page.route("**/rest/v1/v_reading_meter_chain**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(opts?.meterChain ?? []),
    });
  });
}

async function installStaffSession(page: import("@playwright/test").Page) {
  const session = {
    access_token: "fake-staff-access-token",
    refresh_token: "fake-staff-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: "00000000-0000-0000-0000-0000000000aa",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { email: "staff@example.test", full_name: "E2E Staff" },
      aud: "authenticated",
      email: "staff@example.test",
    },
  };
  await page.addInitScript((sess) => {
    localStorage.setItem("sb-gllqtbyofrcjzmbnfoeh-auth-token", JSON.stringify(sess));
  }, session);
  await page.route("**/rest/v1/app_user**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "00000000-0000-0000-0000-0000000000aa", role: "staff", display_name: "E2E Staff", is_active: true },
      ]),
    });
  });
}

test.describe("form parity fields (§2.1 verbatim)", () => {
  test("enum fields render with verbatim labels and value lists", async ({ page }) => {
    await installStaffSession(page);
    await mockFormRefs(page);
    await page.goto("/form");
    await expect(page.getByText("อัตราส่วนผสม(คลอรีน/น้ำ)")).toBeVisible();
    const mixSelect = page.getByTestId("mix-ratio-select");
    await expect(mixSelect).toBeVisible();
    for (const opt of ["1:2", "1:4", "1:9"]) {
      await expect(mixSelect.locator(`option[value="${opt}"]`)).toHaveCount(1);
    }
    // AppSheet initial value 1:4 is the UI default on create.
    await expect(mixSelect).toHaveValue("1:4");
    // Machine enum vocabulary alongside the booleans (ปกติ/เสีย).
    await expect(page.getByTestId("machine-select-pump1_running")).toBeVisible();
    await expect(page.getByTestId("machine-select-pump1_running").locator('option[value="ปกติ"]')).toHaveCount(1);
    await expect(page.getByTestId("machine-select-pump1_running").locator('option[value="เสีย"]')).toHaveCount(1);
    // Screen enum vocabulary (ไม่ล้าง/ล้าง) + verbatim initial values.
    await expect(page.getByTestId("machine-select-screen_cleaned_coarse")).toHaveValue("ไม่ล้าง");
    await expect(page.getByTestId("machine-select-screen_cleaned_fine")).toHaveValue("ล้าง");
    // ตะกอนส่วนเกินที่นำไปกำจัด quick-pick values.
    for (const v of ["1.35", "2.7", "5.4", "8.1"]) {
      await expect(page.getByTestId(`sludge-pick-${v}`)).toBeVisible();
    }
    // ลักษณะสี gains ดำ; ลักษณะกลิ่น gains the two verbatim options.
    await expect(page.getByRole("button", { name: "ดำ", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "กลิ่นเหม็นแก๊สไข้เน่า" })).toBeVisible();
    await expect(page.getByRole("button", { name: "อื่นๆ", exact: true })).toBeVisible();
    // ผู้บันทึก picker filtered to eligible personnel only.
    const recorder = page.getByTestId("recorder-select");
    await expect(recorder).toBeVisible();
    await expect(recorder.locator("option")).toHaveCount(3); // placeholder + 2 eligible
    await expect(recorder.locator('option[value="p3"]')).toHaveCount(0);
    await expect(recorder.locator('option[value="p4"]')).toHaveCount(0);
  });
});

test.describe("validation rules (verbatim Thai errors)", () => {
  test("free chlorine out of 0–100 shows แน่ใจหรือที่จะลงข้อมูลนี้", async ({ page }) => {
    await installStaffSession(page);
    await mockFormRefs(page);
    await page.goto("/form");
    await page.getByTestId("free-chlorine-input").fill("150");
    await page.getByRole("button", { name: "บันทึก" }).click();
    await expect(page.getByText("แน่ใจหรือที่จะลงข้อมูลนี้")).toBeVisible();
  });
  test("electricity <=0 shows ตรวจสอบข้อมูลดีๆนะจ๊ะ", async ({ page }) => {
    await installStaffSession(page);
    await mockFormRefs(page);
    await page.goto("/form");
    await page.getByTestId("electricity-input").fill("-5");
    await page.getByRole("button", { name: "บันทึก" }).click();
    await expect(page.getByText("ตรวจสอบข้อมูลดีๆนะจ๊ะ")).toBeVisible();
  });
  test("wastewater-in negative shows ข้อมูลผิดพลาด", async ({ page }) => {
    await installStaffSession(page);
    await mockFormRefs(page);
    await page.goto("/form");
    await page.getByTestId("wastewater-in-input").fill("-1");
    await page.getByRole("button", { name: "บันทึก" }).click();
    await expect(page.getByText("ข้อมูลผิดพลาด")).toBeVisible();
  });
});

test.describe("honest warnings (unknown ≠ 0 — no fallback 60)", () => {
  test("missing water record + missing meters → chips, values stay EMPTY", async ({ page }) => {
    await installStaffSession(page);
    await mockFormRefs(page, { dailyCheck: [], meterChain: [] });
    await page.goto("/form");
    await expect(page.getByTestId("chip-water-missing")).toBeVisible();
    await expect(page.getByTestId("chip-water-missing")).toContainText("ยังไม่มีบันทึกน้ำประปาของวัน");
    await expect(page.getByTestId("chip-meter-missing")).toBeVisible();
    await expect(page.getByTestId("chip-meter-missing")).toContainText("ยังไม่มีมิเตอร์สูบ");
    // THE INVARIANT: no fallback value injected — never 60, never 0.
    await expect(page.getByTestId("water-used-input")).toHaveValue("");
    const formText = await page.locator("form").innerText();
    expect(formText).not.toContain("อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ");
  });
  test("a present water record fills the record's own value (not 60)", async ({ page }) => {
    await installStaffSession(page);
    await mockFormRefs(page, {
      dailyCheck: [{ id: "w1", check_date: "2026-11-16", water_in: 45 }],
      meterChain: [
        {
          id: "r1",
          reading_date: "2026-11-15",
          meter_boundary_flag: false,
          spec_missing: false,
          prev_pump1_meter: 100,
          prev_pump2_meter: 200,
        },
      ],
    });
    await page.goto("/form");
    await expect(page.getByTestId("water-used-input")).toHaveValue("45");
    await expect(page.getByTestId("chip-water-missing")).toHaveCount(0);
    await expect(page.getByTestId("chip-meter-missing")).toHaveCount(0);
  });
});

test.describe("format rule Cl>2.5 (strictly greater)", () => {
  test("form value 3 → red highlight + warning icon; 2.5 → NOT flagged", async ({ page }) => {
    await installStaffSession(page);
    await mockFormRefs(page);
    await page.goto("/form");
    const field = page.getByTestId("free-chlorine-input");
    await field.fill("3");
    await expect(page.getByTestId("free-chlorine-highlight")).toBeVisible();
    await field.fill("2.5");
    await expect(page.getByTestId("free-chlorine-highlight")).toHaveCount(0);
  });
  test("readings list flags >2.5 rows only", async ({ page }) => {
    await installStaffSession(page);
    await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-1/2" },
        body: JSON.stringify([
          { id: "a1", reading_date: "2026-11-16", do_average: 3, ph: 7, free_chlorine: 3, system_operating: true },
          { id: "a2", reading_date: "2026-11-15", do_average: 2, ph: 7, free_chlorine: 2.5, system_operating: true },
        ]),
      });
    });
    await page.goto("/readings");
    await expect(page.getByTestId("cl-high-a1")).toBeVisible();
    await expect(page.getByTestId("cl-high-a2")).toHaveCount(0);
  });
});

test.describe("equipment-spec admin page (/admin/equipment-specs)", () => {
  const SPEC_ROWS = [
    {
      id: "s1",
      kind: "pump_wastewater_1",
      flow_m3_per_h: 34,
      energy_kwh_per_h: null,
      mix_part_chlorine: null,
      mix_part_water: null,
      valid_from: "2024-01-09",
      valid_to: null,
      note: "seed",
      source: "P1.2",
    },
  ];

  async function mockSpecRest(page: import("@playwright/test").Page) {
    await page.route("**/rest/v1/equipment_spec**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SPEC_ROWS) });
        return;
      }
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(SPEC_ROWS) });
        return;
      }
      await route.fulfill({ status: 405, contentType: "application/json", body: "[]" });
    });
  }

  async function installAdminSession(page: import("@playwright/test").Page) {
    const session = {
      access_token: "fake-admin-access-token",
      refresh_token: "fake-admin-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: "00000000-0000-0000-0000-0000000000aa",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: { email: "admin@example.test", full_name: "E2E Admin" },
        aud: "authenticated",
        email: "admin@example.test",
      },
    };
    await page.addInitScript((sess) => {
      localStorage.setItem("sb-gllqtbyofrcjzmbnfoeh-auth-token", JSON.stringify(sess));
    }, session);
    await page.route("**/rest/v1/app_user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "00000000-0000-0000-0000-0000000000aa", role: "admin", display_name: "E2E Admin", is_active: true },
        ]),
      });
    });
  }

  test("non-admin (staff) bounces off the route", async ({ page }) => {
    await installStaffSession(page);
    await mockSpecRest(page);
    await page.goto("/admin/equipment-specs");
    await expect(page).not.toHaveURL(/equipment-specs/);
  });

  test("admin sees the list with Thai kind labels, read-only history", async ({ page }) => {
    await installAdminSession(page);
    await mockSpecRest(page);
    await page.goto("/admin/equipment-specs");
    await expect(page.getByText("ปั๊มน้ำเสีย 1")).toBeVisible();
    await expect(page.getByTestId("spec-row-s1")).toBeVisible();
    // History immutability: no edit/delete affordances anywhere.
    await expect(page.getByRole("button", { name: /แก้ไข|ลบ|แก้ไขสเปก/ })).toHaveCount(0);
  });

  test("append creates a NEW effective-dated row (mocked POST — no real write)", async ({ page }) => {
    await installAdminSession(page);
    let posted: Record<string, unknown> | null = null;
    await page.route("**/rest/v1/equipment_spec**", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify([posted]) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SPEC_ROWS) });
    });
    await page.goto("/admin/equipment-specs");
    await page.getByTestId("spec-kind-select").selectOption("pump_wastewater_2");
    await page.getByTestId("spec-value-input").fill("12");
    await page.getByTestId("spec-valid-from-input").fill("2026-12-01");
    await page.getByRole("button", { name: "เพิ่มสเปกใหม่" }).click();
    expect(posted).not.toBe(null);
    expect(posted!["kind"]).toBe("pump_wastewater_2");
    expect(posted!["valid_from"]).toBe("2026-12-01");
    expect(Number(posted!["flow_m3_per_h"])).toBe(12);
  });
});
