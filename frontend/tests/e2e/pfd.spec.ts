import { test, expect } from "@playwright/test";

/**
 * PFD interactive (F5 logic-half) smoke tests.
 *
 * Scope: verify the click + keyboard handlers and panel render without
 * crashing. Field values are read from a Record bag — when no dashboard
 * row exists, fields render "—". We assert on *structure* not values,
 * since the dashboard is public but today's data may be empty.
 */

test.describe("PFD interactive drill-down", () => {
  test("dashboard renders 5 stage nodes in the PFD", async ({ page }) => {
    await page.goto("/dashboard");
    // 5 stage <g role='button'> nodes — screening/aeration/sediment/chlorine/discharge
    const nodes = page.locator("svg g[role='button']");
    await expect(nodes).toHaveCount(5);
    // Each has a Thai aria-label describing the stage
    const labels = await nodes.evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") ?? ""),
    );
    expect(labels.some((l) => l.startsWith("ตะแกรง"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("เติมอากาศ"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("ตกตะกอน"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("คลอรีน"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("ระบาย"))).toBeTruthy();
  });

  test("clicking a stage node toggles the panel", async ({ page }) => {
    await page.goto("/dashboard");
    const aeration = page
      .locator("svg g[role='button']")
      .filter({ hasText: "เติมอากาศ" });
    // Panel is absent before any click.
    await expect(page.getByText("ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์")).toHaveCount(0);
    await aeration.click();
    // After click, the stage description appears (panel rendered).
    await expect(page.getByText("ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์")).toBeVisible();
    // Click the same node again → panel closes.
    await aeration.click();
    await expect(page.getByText("ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์")).toHaveCount(0);
  });

  test("keyboard Enter on focused stage node selects it", async ({ page }) => {
    await page.goto("/dashboard");
    const aeration = page
      .locator("svg g[role='button']")
      .filter({ hasText: "เติมอากาศ" });
    await aeration.focus();
    await expect(aeration).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์")).toBeVisible();
    // Space toggles back off.
    await page.keyboard.press("Space");
    await expect(page.getByText("ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์")).toHaveCount(0);
  });
});
