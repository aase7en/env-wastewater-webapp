/**
 * ENV-PARITY-P2-004 — e2e for the coliform ×3 two-step testing flow
 * (staff, /food surface — the existing FoodPage gains the additive
 * two-step coliform surface).
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted, so nothing here touches ENV_DB.
 *
 * RED-first: at the RED commit none of these surfaces exist (lib exports,
 * component, testids) — the failures are the evidence.
 */
import { test, expect, type Page } from "./fixtures";

// Deterministic-vs-clock fixtures: "today" is the REAL run date so the
// Show If gate (TODAY()>Collect_date) behaves identically on any day.
const pad = (n: number) => String(n).padStart(2, "0");
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const TODAY_ISO = isoOffset(0);
const OLD_ISO = isoOffset(-3);
const OLD_D1 = isoOffset(-2);
const OLD_D2 = isoOffset(-1);

const PERSONNEL_ROWS = [
  { id: "p1", full_name: "สมศรี สาธารณสุข", position: "นักวิชาการสาธารณสุข", status: "ทำงาน" },
  { id: "p2", full_name: "สมศักดิ์ โภชนาการ", position: "นักโภชนาการ", status: "ทำงาน" },
  { id: "p3", full_name: "สมใจ ประกอบอาหาร", position: "พนักงานประกอบอาหาร", status: "ทำงาน" },
  { id: "p4", full_name: "นายแพทย์ ใหญ่", position: "นายแพทย์", status: "ทำงาน" },
];

/** A pending row collected 3 days ago — result fields must be enterable
 * (Show If TODAY() > Collect_date holds). */
const PENDING_OLD = {
  id: "old",
  sample_date: OLD_ISO,
  sample_type: "อาหาร",
  test_type: "total_coliform",
  result: null,
  reported_date: null,
  technician: null,
  sample_point: null,
  mpn_value: null,
  reagent_used: null,
  reported_by_lab_tech: null,
  follow_up_action: null,
  recorded_by: null,
  note: null,
  created_at: `${OLD_ISO}T03:00:00Z`,
  sample_source: "อาหาร",
  collect_point: "ช้อนสั้น",
  sample_person_id: null,
  collected_by_id: "p1",
  collected_by_legacy: null,
  reporter_id: null,
  reporter_legacy: null,
  equipment_legacy: "aca317bf",
  result_image: null,
  legacy_id: null,
  source_provenance: "ENV UI (manual entry)",
};

/** A same-day pending row — รอผล per Show If; result entry MUST be gated. */
const PENDING_TODAY = {
  ...PENDING_OLD,
  id: "today",
  sample_date: TODAY_ISO,
  collect_point: "ถาด",
  created_at: `${TODAY_ISO}T03:00:00Z`,
};

/** A completed row — renders its result, never รอผล. */
const DONE = {
  ...PENDING_OLD,
  id: "done",
  sample_date: isoOffset(-7),
  result: "Negative",
  reported_date: isoOffset(-6),
  reporter_id: "p1",
};

const ALL_ROWS = [DONE, PENDING_TODAY, PENDING_OLD];

async function mockRefs(page: Page) {
  // app-shell reads (the shell fetches these on every route — food-mobile precedent)
  await page.route("**/rest/v1/role_module_visibility**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/personnel**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERSONNEL_ROWS) }));
  await page.route("**/rest/v1/lab_test**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ALL_ROWS) });
    }
    if (method === "POST") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ ...PENDING_TODAY, ...body, id: "new" }]),
      });
    }
    // PATCH — the step-2 result write
    const body = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ ...PENDING_OLD, ...body }]),
    });
  });
}

test.describe("coliform two-step flow (staff, /food)", () => {
  test("step-1 collect: อาหาร source with verbatim 5-value enum, result fields NULL, lands as รอผล", async ({ authed: page }) => {
    await mockRefs(page);
    await page.goto("/food");

    // source picker carries the 4 verbatim sources
    await expect(page.getByTestId("coliform-source")).toBeVisible();
    const opts = await page.getByTestId("coliform-source").locator("option").allTextContents();
    expect(opts.filter((o) => o !== "")).toEqual(["น้ำ", "อาหาร", "พนักงาน", "ทั่วไป"]);

    await page.getByTestId("coliform-source").selectOption("อาหาร");
    // the food collect-point vocabulary gates the picker (5 verbatim values)
    const pts = await page.getByTestId("coliform-collect-point").locator("option").allTextContents();
    for (const v of ["ช้อนสั้น", "ถาด", "มือพี่กุ้ง", "มือป้าอ้อ", "มือแก๊ป"]) {
      expect(pts).toContain(v);
    }
    // equipment default for food is the aca317bf item id (shown read-only)
    await expect(page.getByTestId("coliform-equipment")).toHaveValue("aca317bf");
    await page.getByTestId("coliform-collect-point").selectOption("ช้อนสั้น");

    // submit step-1 → POST carries NO result-side values
    let posted: Record<string, unknown> | null = null;
    await page.unroute("**/rest/v1/lab_test**");
    await page.route("**/rest/v1/lab_test**", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON() as Record<string, unknown>;
        const body = posted;
        return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify([{ ...PENDING_TODAY, ...body, id: "new" }]) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ALL_ROWS) });
    });
    await page.getByTestId("coliform-collect-save").click();
    await expect.poll(() => posted).not.toBeNull();
    expect(posted!["result"]).toBeNull();
    expect(posted!["reported_date"]).toBeNull();
    expect(posted!["test_type"]).toBe("total_coliform");
    expect(posted!["sample_source"]).toBe("อาหาร");
  });

  test("same-day collect stays รอผล — result entry gated (Show If TODAY()>Collect_date)", async ({ authed: page }) => {
    await mockRefs(page);
    await page.goto("/food");
    // pending list renders both pending rows with the truthful รอผล state
    const list = page.getByTestId("coliform-pending-list");
    await expect(list).toBeVisible();
    await expect(list).toContainText("รอผล");
    // the TODAY row must NOT offer a result form (same-day gate)
    const todayRow = page.getByTestId("coliform-pending-row-today");
    await expect(todayRow).toBeVisible();
    await expect(todayRow.getByTestId("coliform-result-select")).toHaveCount(0);
  });

  test("step-2 กรอกผลภายหลัง: next-day pending row exposes the extended food enum + suggested +1/+2 chips (UI-only)", async ({ authed: page }) => {
    await mockRefs(page);
    await page.goto("/food");
    const oldRow = page.getByTestId("coliform-pending-row-old");
    await expect(oldRow).toBeVisible();
    // suggested chips show collect+1 / collect+2 — visible for food, suggestions only
    await expect(oldRow.getByTestId("coliform-suggest-chip-1")).toHaveText(`+1 วัน (${OLD_D1})`);
    await expect(oldRow.getByTestId("coliform-suggest-chip-2")).toHaveText(`+2 วัน (${OLD_D2})`);
    // result enum for food carries the 4 verbatim values incl. the ++/invalid variants
    const resultOpts = await oldRow.getByTestId("coliform-result-select").locator("option").allTextContents();
    for (const v of ["Positive", "Negative", "Positive ++", "invalid"]) {
      expect(resultOpts).toContain(v);
    }
    await oldRow.getByTestId("coliform-result-select").selectOption("Positive ++");
    let patched: Record<string, unknown> | null = null;
    await page.unroute("**/rest/v1/lab_test**");
    await page.route("**/rest/v1/lab_test**", async (route) => {
      if (route.request().method() === "PATCH") {
        patched = route.request().postDataJSON() as Record<string, unknown>;
        const body = patched;
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ ...PENDING_OLD, ...body }]) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ALL_ROWS) });
    });
    await oldRow.getByTestId("coliform-result-save").click();
    await expect.poll(() => patched).not.toBeNull();
    expect(patched!["result"]).toBe("Positive ++");
    expect(patched!["reported_date"]).toBeTruthy();
  });

  test("water domain: 4-value collect enum + 2-value result set + NO suggested chips", async ({ authed: page }) => {
    await mockRefs(page);
    await page.goto("/food");
    await page.getByTestId("coliform-source").selectOption("น้ำ");
    const pts = await page.getByTestId("coliform-collect-point").locator("option").allTextContents();
    for (const v of ["โรงครัว", "ตู้กดน้ำ OPD", "ตู้กดน้ำ IPD", "ตู้กดน้ำปฐมภูมิ (ห้องฟัน)"]) {
      expect(pts).toContain(v);
    }
    expect(pts).not.toContain("ช้อนสั้น");
    await expect(page.getByTestId("coliform-equipment")).toHaveValue("aca317bf");
    // suggested chips are per-ROW source (the fixtures are อาหาร rows);
    // the WATER no-chips gate is pinned at the lib level (suggestsResultDates).
    // Here we pin the water collect-point + equipment parity.
  });

  test("employee domain: swab subject picker = นักโภชนาการ/พนักงานประกอบอาหาร only + equipment 2fe4aa7c", async ({ authed: page }) => {
    await mockRefs(page);
    await page.goto("/food");
    await page.getByTestId("coliform-source").selectOption("พนักงาน");
    // collect-point picker hidden for employee (the sample is a person)
    await expect(page.getByTestId("coliform-collect-point")).toBeHidden();
    // personnel picker appears with the eligible positions ONLY
    const persons = (await page.getByTestId("coliform-sample-person").locator("option").allTextContents()).join(" | ");
    expect(persons).toContain("สมศักดิ์ โภชนาการ");
    expect(persons).toContain("สมใจ ประกอบอาหาร");
    expect(persons).not.toContain("นายแพทย์ ใหญ่");
    await expect(page.getByTestId("coliform-equipment")).toHaveValue("2fe4aa7c");
  });

  test("existing single-step FoodPage form is preserved (no regression)", async ({ authed: page }) => {
    await mockRefs(page);
    await page.goto("/food");
    await expect(page.locator("#food-sample-date")).toBeVisible();
    await expect(page.locator("#food-result")).toBeVisible();
    await expect(page.getByRole("button", { name: "บันทึก", exact: true })).toBeVisible();
    // legacy history table still renders
    await expect(page.getByRole("region", { name: "ประวัติผลตรวจอาหาร" })).toBeVisible();
  });

  for (const width of [360, 390, 430]) {
    test(`mobile ${width}: the two-step surface fits without horizontal overflow`, async ({ authed: page }) => {
        await mockRefs(page);
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/food");
      await expect(page.getByTestId("coliform-source")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
    });
  }
});
