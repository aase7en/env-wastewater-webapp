import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * ENV-OPS-001A — Operations Attention Board (A1–A16 acceptance matrix).
 *
 * Two independent source families, never normalized into one incident
 * object: unresolved core.repair_request work items (open/in_progress) and
 * wastewater.threshold_alert events (read_at = presentation acknowledgement
 * only). Data-honesty invariants: empty ≠ normal, polling ≠ live, no
 * fabricated severity, partial-source failure stays visible.
 *
 * All REST/session traffic is intercepted (A16). No real writes.
 */

const REPAIR_ROUTE = "**/rest/v1/repair_request**";
const ALERT_ROUTE = "**/rest/v1/threshold_alert**";

const repairs = [
  {
    id: "rep-open-1",
    equipment_id: null,
    reading_id: null,
    reported_by: null,
    cause: "ปั๊มเป่าอากาศมีเสียงผิดปกติ",
    status: "open",
    created_at: "2026-10-07T01:15:00.000Z",
    resolved_at: null,
  },
  {
    id: "rep-inprogress-1",
    equipment_id: "11111111-1111-4111-8111-111111111111",
    reading_id: null,
    reported_by: "22222222-2222-4222-8222-222222222222",
    cause: "ท่อจ่ายน้ำยารั่วที่ข้อต่อ",
    status: "in_progress",
    created_at: "2026-10-06T04:30:00.000Z",
    resolved_at: null,
  },
  {
    id: "rep-resolved-1",
    equipment_id: null,
    reading_id: null,
    reported_by: null,
    cause: "เปลี่ยนไส้กรองครบกำหนด",
    status: "resolved",
    created_at: "2026-09-30T02:00:00.000Z",
    resolved_at: "2026-10-01T06:00:00.000Z",
  },
  {
    id: "rep-cancelled-1",
    equipment_id: null,
    reading_id: null,
    reported_by: null,
    cause: "งานซ้ำกับรายการอื่น",
    status: "cancelled",
    created_at: "2026-09-28T08:00:00.000Z",
    resolved_at: null,
  },
];

const alerts = [
  {
    id: "alert-unread-1",
    reading_id: "33333333-3333-4333-8333-333333333333",
    field: "do_mg_l",
    message: "DO ต่ำกว่าเกณฑ์ (ค่าที่วัด: 1.2)",
    created_at: "2026-10-07T00:45:00.000Z",
    notified_at: "2026-10-07T00:46:00.000Z",
    read_at: null,
  },
  {
    id: "alert-read-1",
    reading_id: "44444444-4444-4444-8444-444444444444",
    field: "cl_mg_l",
    message: "คลอรีนต่ำกว่าเกณฑ์ (ค่าที่วัด: 0.3)",
    created_at: "2026-10-05T22:10:00.000Z",
    notified_at: "2026-10-05T22:11:00.000Z",
    read_at: "2026-10-06T01:00:00.000Z",
  },
];

function json(route: { fulfill: (r: unknown) => Promise<void> }, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockBoard(page: Page, repairBody: unknown = repairs, alertBody: unknown = alerts, repairStatus = 200, alertStatus = 200) {
  await page.route(REPAIR_ROUTE, (route) => json(route, repairBody, repairStatus));
  await page.route(ALERT_ROUTE, (route) => json(route, alertBody, alertStatus));
}

/** A16: fail the test if any non-GET request leaves the page (read-only board). */
function forbidWrites(page: Page) {
  page.on("request", (req) => {
    if (req.url().includes("/rest/v1/") && req.method() !== "GET") {
      throw new Error(`Unexpected write to Supabase REST: ${req.method()} ${req.url()}`);
    }
  });
}

test.describe("Operations Attention Board — A1–A16", () => {
  test("A1/A2/A3/A4/A15: unresolved repairs only, distinct statuses, unavailable context, source identity + timestamps", async ({ authed }) => {
    forbidWrites(authed);
    await mockBoard(authed);
    await authed.goto("/operations");

    const repairSection = authed.locator("section[data-source='repair_request']");
    await expect(repairSection).toBeVisible();
    const alertSection = authed.locator("section[data-source='threshold_alert']");
    await expect(alertSection).toBeVisible();

    // A1: open repair renders as an unresolved work item with exact app status text.
    await expect(repairSection.getByText("ปั๊มเป่าอากาศมีเสียงผิดปกติ")).toBeVisible();
    await expect(repairSection.getByText("รอดำเนินการ")).toBeVisible();
    // A2: in_progress stays distinct from open.
    await expect(repairSection.getByText("ท่อจ่ายน้ำยารั่วที่ข้อต่อ")).toBeVisible();
    await expect(repairSection.getByText("กำลังซ่อม")).toBeVisible();
    // A3: resolved/cancelled are never unresolved attention.
    await expect(repairSection.getByText("เปลี่ยนไส้กรองครบกำหนด")).toHaveCount(0);
    await expect(repairSection.getByText("งานซ้ำกับรายการอื่น")).toHaveCount(0);
    await expect(repairSection.getByText("ซ่อมเสร็จ")).toHaveCount(0);
    await expect(repairSection.getByText("ยกเลิก")).toHaveCount(0);
    // A4: null equipment/reading stays unavailable — no guessed linkage.
    await expect(repairSection.getByText("ไม่ระบุอุปกรณ์")).toBeVisible();
    await expect(repairSection.getByText("ไม่ระบุจุดวัด").or(repairSection.getByText("ไม่เกี่ยวกับจุดวัด"))).toHaveCount(1);
    // A15: timestamps visible on decision-relevant rows.
    await expect(repairSection.locator("time[datetime='2026-10-07T01:15:00.000Z']")).toBeVisible();
    await expect(alertSection.locator("time[datetime='2026-10-07T00:45:00.000Z']")).toBeVisible();
  });

  test("A5/A6/A7: threshold read state is presentation-only; no fabricated severity", async ({ authed }) => {
    await mockBoard(authed);
    await authed.goto("/operations");
    const alertSection = authed.locator("section[data-source='threshold_alert']");
    await expect(alertSection).toBeVisible();

    // A5: unread = unacknowledged presentation state, not an unresolved incident.
    await expect(alertSection.getByText("DO ต่ำกว่าเกณฑ์ (ค่าที่วัด: 1.2)")).toBeVisible();
    await expect(alertSection.getByText("ยังไม่อ่าน")).toBeVisible();
    // A6: read threshold remains a historical event, never "resolved".
    await expect(alertSection.getByText("คลอรีนต่ำกว่าเกณฑ์ (ค่าที่วัด: 0.3)")).toBeVisible();
    await expect(alertSection.getByText("อ่านแล้ว")).toBeVisible();
    await expect(alertSection.getByText("แก้ไขแล้ว")).toHaveCount(0);
    await expect(alertSection.getByText("ซ่อมเสร็จ")).toHaveCount(0);
    // A7: no invented severity anywhere in the threshold panel.
    await expect(alertSection.getByText(/วิกฤต|รุนแรง|ปานกลาง|ระดับต่ำ/)).toHaveCount(0);
  });

  test("A8/A11: repair source failure renders independently while thresholds stay usable", async ({ authed }) => {
    await mockBoard(authed, { message: "boom" }, alerts, 500, 200);
    await authed.goto("/operations");

    const alertSection = authed.locator("section[data-source='threshold_alert']");
    await expect(alertSection.getByText("DO ต่ำกว่าเกณฑ์ (ค่าที่วัด: 1.2)")).toBeVisible();

    const repairSection = authed.locator("section[data-source='repair_request']");
    await expect(repairSection.getByText(/โหลดรายการซ่อมไม่สำเร็จ|ไม่สามารถโหลดรายการซ่อมได้/)).toBeVisible();
    // A11: failure is explicit — not silently presented as an empty board.
    await expect(repairSection.getByText(/ไม่มีรายการซ่อม/)).toHaveCount(0);
  });

  test("A8/A11 (inverse): threshold source failure renders independently while repairs stay usable", async ({ authed }) => {
    await mockBoard(authed, repairs, { message: "boom" }, 200, 500);
    await authed.goto("/operations");

    const repairSection = authed.locator("section[data-source='repair_request']");
    await expect(repairSection.getByText("ปั๊มเป่าอากาศมีเสียงผิดปกติ")).toBeVisible();

    const alertSection = authed.locator("section[data-source='threshold_alert']");
    await expect(alertSection.getByText(/โหลดเหตุการณ์ค่าเกินเกณฑ์ไม่สำเร็จ|ไม่สามารถโหลดเหตุการณ์ได้/)).toBeVisible();
    await expect(alertSection.getByText(/ไม่มีเหตุการณ์/)).toHaveCount(0);
  });

  test("A9/A10: successful empty queries never claim normal/safe", async ({ authed }) => {
    await mockBoard(authed, [], []);
    await authed.goto("/operations");

    await expect(authed.getByText(/ไม่มีรายการซ่อมที่ยังไม่เสร็จ|ไม่มีคำขอซ่อมที่ยังไม่เสร็จ/)).toBeVisible();
    await expect(authed.getByText(/ไม่มีเหตุการณ์ค่าเกินเกณฑ์/)).toBeVisible();
    // Empty ≠ normal: no hospital-wide safety claim anywhere on the page.
    await expect(authed.getByText(/สถานการณ์ปกติ|ทุกระบบปกติ|ปลอดภัย|ไม่มีข้อผิดพลาด/)).toHaveCount(0);
  });

  test("A12: on-load data is never labelled live/realtime", async ({ authed }) => {
    await mockBoard(authed);
    await authed.goto("/operations");
    await expect(authed.locator("main")).toBeVisible();
    await expect(authed.getByText(/LIVE|สด|เรียลไทม์|realtime/i)).toHaveCount(0);
    await expect(authed.locator("[data-freshness='on-load']")).toBeVisible();
  });

  test("A13: 360/390/430 have no horizontal document overflow", async ({ authed }) => {
    await mockBoard(authed);
    for (const width of [360, 390, 430]) {
      await authed.setViewportSize({ width, height: 844 });
      await authed.goto("/operations");
      await expect(authed.locator("section[data-source='repair_request']")).toBeVisible();
      const noOverflow = await authed.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(noOverflow, `no horizontal overflow at ${width}px`).toBeTruthy();
    }
  });

  test("A14: keyboard navigation reaches page content", async ({ authed }) => {
    await mockBoard(authed);
    await authed.goto("/operations");
    await expect(authed.locator("section[data-source='repair_request']")).toBeVisible();

    for (let i = 0; i < 15; i++) {
      await authed.keyboard.press("Tab");
      const inBoard = await authed.evaluate(() => {
        const el = document.activeElement;
        return !!el && !!el.closest("section[data-source='repair_request'], section[data-source='threshold_alert']");
      });
      if (inBoard) return;
    }
    expect(false, "Tab never reached the board sections").toBeTruthy();
  });
});
