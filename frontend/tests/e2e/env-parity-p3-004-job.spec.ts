import { test, expect } from "./fixtures";

/**
 * ENV-PARITY-P3-004 — the staff job log surface (lane P3.4, v1.12.0):
 * list + QR-scan entry at /safety/job-log (RequireAuth staff — the
 * /safety + P2.2/P2.3 scan-flow precedent; the practician Valid If = the
 * P1.4 ผู้บันทึก gate verbatim).
 *
 * Honesty pins (WO §4/§5): no rows ⇒ the verbatim honest empty state
 * "ยังไม่มีรายการงาน" — never a fabricated entry; the QR placeholder
 * "สแกน QR CODE" / blank payloads fail with the verbatim poem; the
 * geofence verdict surfaces the verbatim error ฮั่นแน่...เข้ามาทำงานก่อน
 * and the out-of-range write never happens (honest reject, no write);
 * dates render พ.ศ.; anonymous users bounce to /login.
 *
 * D2 RED: the route/surface does not exist yet — the authenticated
 * assertions fail truthfully over the NotFound catch-all.
 */

const AREA_ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  legacy_id: "d9423cc0",
  area_name: "ต้นไม้และสนามหญ้า บ่อบำบัด",
  qr_url: null,
  image_ref: null,
  source_provenance: "seed",
  created_at: "2026-11-19T00:00:00Z",
};

const emptyList = async (route: { fulfill: (opts: { status: number; contentType: string; body: string }) => Promise<void> }) => {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
};

test.describe("ENV-PARITY-P3-004 job log surface", () => {
  test("anonymous /safety/job-log bounces to /login (staff-gated route)", async ({ page }) => {
    await page.goto("/safety/job-log");
    await expect(page).toHaveURL(/\/login\?next=%2Fsafety%2Fjob-log/);
  });

  test("staff sees the job log page with the history list + entry form sections", async ({ authed: page }) => {
    await page.route("**/rest/v1/location_area**", emptyList);
    await page.route("**/rest/v1/job_log**", emptyList);
    await page.route("**/rest/v1/personnel**", emptyList);

    await page.goto("/safety/job-log");
    await expect(page.getByTestId("job-log-page")).toBeVisible();
    await expect(page.getByTestId("job-list")).toBeVisible();
    await expect(page.getByTestId("job-form")).toBeVisible();
  });

  test("honest empty state — never a fabricated job entry", async ({ authed: page }) => {
    await page.route("**/rest/v1/location_area**", emptyList);
    await page.route("**/rest/v1/job_log**", emptyList);
    await page.route("**/rest/v1/personnel**", emptyList);

    await page.goto("/safety/job-log");
    await expect(page.getByTestId("job-list-empty")).toBeVisible();
    await expect(page.getByText("ยังไม่มีรายการงาน")).toBeVisible();
  });

  test("form carries the §3.24 verbatim surfaces: QR placeholder + 4-value working vocabulary", async ({
    authed: page,
  }) => {
    await page.route("**/rest/v1/location_area**", emptyList);
    await page.route("**/rest/v1/job_log**", emptyList);
    await page.route("**/rest/v1/personnel**", emptyList);

    await page.goto("/safety/job-log");
    await expect(page.getByTestId("job-qr-input")).toHaveValue("");
    await expect(page.getByTestId("job-qr-input")).toHaveAttribute("placeholder", "สแกน QR CODE");
    for (const v of ["รดน้ำ", "ตัดหญ้า", "กวาด", "เก็บขยะ"]) {
      await expect(page.getByTestId(`job-working-${v}`)).toBeVisible();
    }
  });

  test("scanning a placeholder/blank payload fails with the verbatim poem — no write", async ({ authed: page }) => {
    await page.route("**/rest/v1/location_area**", emptyList);
    await page.route("**/rest/v1/job_log**", emptyList);
    await page.route("**/rest/v1/personnel**", emptyList);
    let jobInserts = 0;
    await page.route("**/rest/v1/job_log**", async (route) => {
      if (route.request().method() === "POST") {
        jobInserts += 1;
        await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/safety/job-log");
    await page.getByTestId("job-qr-input").fill("สแกน QR CODE");
    await page.getByTestId("job-submit").click();
    await expect(page.getByTestId("job-form-error")).toContainText(
      "*ต้องมีอะไรผิดพลาดตรงไหน ไม่เข้าใจเลยสักครั้ง"
    );
    expect(jobInserts).toBe(0);
  });

  test("out-of-range geofence fails with the verbatim error — honest reject, no write", async ({ authed: page }) => {
    await page.route("**/rest/v1/location_area**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([AREA_ROW]),
      });
    });
    await page.route("**/rest/v1/job_log**", emptyList);
    await page.route("**/rest/v1/personnel**", emptyList);
    let jobInserts = 0;
    await page.route("**/rest/v1/job_log**", async (route) => {
      if (route.request().method() === "POST") {
        jobInserts += 1;
        await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/safety/job-log");
    await page.getByTestId("job-qr-input").fill("d9423cc0");
    await page.getByTestId("job-geo-lat").fill("14.6");
    await page.getByTestId("job-geo-lng").fill("100.9");
    await page.getByTestId(`job-working-รดน้ำ`).check();
    await page.getByTestId("job-submit").click();
    await expect(page.getByTestId("job-form-error")).toContainText("ฮั่นแน่...เข้ามาทำงานก่อน");
    expect(jobInserts).toBe(0);
  });

  test("history rows render พ.ศ. dates + the joined working text verbatim", async ({ authed: page }) => {
    await page.route("**/rest/v1/location_area**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([AREA_ROW]),
      });
    });
    await page.route("**/rest/v1/job_log**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "22222222-2222-2222-2222-222222222222",
            legacy_id: "96e09afe",
            scanned_at: "2024-02-29T13:46:58+07:00",
            location_area_id: AREA_ROW.id,
            qr_legacy_id: "d9423cc0",
            location_name: "ต้นไม้และสนามหญ้า บ่อบำบัด",
            lat: 14.361284,
            lng: 100.645649,
            practitioner_id: null,
            practitioner_legacy_id: null,
            working: "รดน้ำ , เก็บขยะ",
            image_ref: "job_1234.jpg",
            issue: null,
            source_provenance: "seed",
            created_at: "2026-11-19T00:00:00Z",
          },
        ]),
      });
    });
    await page.route("**/rest/v1/personnel**", emptyList);

    await page.goto("/safety/job-log");
    await expect(page.getByTestId("job-row-96e09afe")).toBeVisible();
    // พ.ศ. render: CE 2024-02-29 → 29 ก.พ. 2567
    await expect(page.getByTestId("job-row-96e09afe")).toContainText("29 ก.พ. 2567");
    await expect(page.getByTestId("job-row-96e09afe")).toContainText("รดน้ำ , เก็บขยะ");
    // unknown practitioner renders ยังไม่ทราบ — never a fabricated name
    await expect(page.getByTestId("job-row-96e09afe")).toContainText("ยังไม่ทราบ");
  });
});
