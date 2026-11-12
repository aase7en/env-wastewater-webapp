import { test, expect } from "./fixtures";

/**
 * ENV-APP-VERSION-001 — D2 RED-first e2e for the app version chip.
 *
 * Binding D1: small persistent chip in the app-shell footer corner; shows
 * the build-injected SemVer (v1.0.0 for the first release); tap/keyboard
 * activation reveals the latest-release summary (version + พ.ศ. date +
 * one-line Thai summary + CHANGELOG pointer). Truth states: the chip never
 * fabricates a release number; unknown stays unknown.
 *
 * Uses the `authed` fixture — the shell (and therefore the chip) renders
 * behind RequireAuth on /.
 */
test.describe("ENV-APP-VERSION-001 — app version chip", () => {
  test("chip is visible in the shell footer corner with the injected SemVer label", async ({
    authed: page,
  }) => {
    await page.goto("/");
    const chip = page.getByTestId("app-version-chip");
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText(/^v\d+\.\d+\.\d+$/);
    // 44px minimum tap target (WCAG 2.2 AA / acceptance criteria).
    const box = await chip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    // Footer corner: pinned to the bottom band of the viewport (persistent,
    // every screen) and horizontally at a corner (the center bottom is the
    // floating ModuleDock's territory).
    const vp = page.viewportSize()!;
    expect(box!.y + box!.height).toBeGreaterThanOrEqual(vp.height - 24);
    const nearLeft = box!.x <= vp.width * 0.25;
    const nearRight = box!.x + box!.width >= vp.width * 0.75;
    expect(nearLeft || nearRight).toBe(true);
  });

  test("activating the chip reveals the latest-release summary (พ.ศ. date + CHANGELOG pointer)", async ({
    authed: page,
  }) => {
    await page.goto("/");
    const chip = page.getByTestId("app-version-chip");
    await chip.click();
    const panel = page.getByTestId("app-version-summary");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/v\d+\.\d+\.\d+/);
    await expect(panel).toContainText("พ.ศ.");
    await expect(
      panel.getByRole("link", { name: /CHANGELOG/i }),
    ).toHaveAttribute("href", /CHANGELOG\.md/);
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await chip.click();
    await expect(panel).not.toBeVisible();
    await expect(chip).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard: focusing the chip and pressing Enter reveals the same summary", async ({
    authed: page,
  }) => {
    await page.goto("/");
    const chip = page.getByTestId("app-version-chip");
    await chip.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("app-version-summary")).toBeVisible();
    await expect(page.getByTestId("app-version-summary")).toContainText("พ.ศ.");
  });

  test("mobile 360px: the chip stays inside the viewport and visible", async ({
    authed: page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    const chip = page.getByTestId("app-version-chip");
    await expect(chip).toBeVisible();
    const box = await chip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  });
});
