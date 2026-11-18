import { test, expect } from "./fixtures";

/**
 * ENV-PARITY-P3-002 — the admin inventory surface (lane P3.2, v1.10.0):
 * รับเข้า lot entry per ถัง (LotNo/MFG/EXP) + stock view with per-lot
 * remaining, at /admin/inventory (RequireAuth requireAdmin — the P1.4 +
 * P3.1 MastersPage pattern; route-only, no dock entry — the /admin/masters
 * precedent: admin nav lives in AppShell which is outside this lane's
 * scope).
 *
 * Honesty pins (WO §5): no lots ⇒ the verbatim honest empty state
 * "ยังไม่มีล็อตสต๊อก — รอการรับเข้าจริง" — never a fabricated stock
 * number; anonymous users bounce to /login.
 *
 * D2 RED: the route/surface does not exist yet — the authenticated
 * assertions fail truthfully over the NotFound catch-all.
 */

test.describe("ENV-PARITY-P3-002 inventory surface", () => {
  test("anonymous /admin/inventory bounces to /login (admin-gated route)", async ({ page }) => {
    await page.goto("/admin/inventory");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Finventory/);
  });

  test("admin sees the inventory page with lot receipt + stock view sections", async ({ authedAdmin: page }) => {

    // Deterministic honest empty state: no lots yet (SOURCE_UNAVAILABLE at
    // this lane — 0 seeded rows; the view also returns 0 for a fresh read).
    await page.route("**/rest/v1/inventory_lot**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/rest/v1/master**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "00000000-0000-0000-0000-00000000c10a", name: "คลอรีน 10%", unit: "kg", is_active: true },
        ]),
      });
    });

    await page.goto("/admin/inventory");

    await expect(page.getByTestId("inventory-page")).toBeVisible();
    await expect(page.getByTestId("inventory-lot-receipt")).toBeVisible();
    await expect(page.getByTestId("inventory-stock-view")).toBeVisible();
    await expect(page.getByText("สต๊อกคลอรีน", { exact: false }).first()).toBeVisible();
  });

  test("stock view shows the honest empty state — never a fabricated stock number", async ({ authedAdmin: page }) => {

    await page.route("**/rest/v1/inventory_lot**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/rest/v1/master**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "00000000-0000-0000-0000-00000000c10a", name: "คลอรีน 10%", unit: "kg", is_active: true },
        ]),
      });
    });

    await page.goto("/admin/inventory");
    await expect(page.getByTestId("inventory-stock-empty")).toBeVisible();
    await expect(page.getByText("ยังไม่มีล็อตสต๊อก — รอการรับเข้าจริง")).toBeVisible();
  });

  test("lot receipt form carries the per-ถัง fields (LotNo/MFG/EXP + kg amount)", async ({ authedAdmin: page }) => {

    await page.route("**/rest/v1/inventory_lot**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/rest/v1/master**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "00000000-0000-0000-0000-00000000c10a", name: "คลอรีน 10%", unit: "kg", is_active: true },
        ]),
      });
    });

    await page.goto("/admin/inventory");
    await expect(page.getByTestId("lot-receipt-form")).toBeVisible();
    await expect(page.getByLabel(/ล็อต/i).first()).toBeVisible();
    await expect(page.getByLabel(/วันที่ผลิต|MFG/i).first()).toBeVisible();
    await expect(page.getByLabel(/วันหมดอายุ|EXP/i).first()).toBeVisible();
    await expect(page.getByLabel(/จำนวนรับเข้า/i).first()).toBeVisible();
  });
});
