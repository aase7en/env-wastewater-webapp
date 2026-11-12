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

  test("mobile 360/390/430: the chip never overlaps the bottom ModuleDock", async ({
    authed: page,
  }) => {
    // ENV-MAINT-001 item 1 (recorded P3, ENV-APP-VERSION-001-C1 D5).
    // Guard-pin semantics per house precedent (ENV-VIS-STORY-001-NUM).
    // D2 measurement record: the dock <nav> is a horizontally scrollable
    // strip whose container box has non-interactive padding zones reaching
    // the corner band by design (its box intersects the chip rect at all
    // three widths while no dock control ever does), so the guarded
    // invariant is chip↔dock-control separation + chip tap-target
    // integrity — not the transparent container's phantom box.
    for (const viewport of [
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 430, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const chip = page.getByTestId("app-version-chip");
      await expect(chip).toBeVisible();
      const dock = page.getByRole("navigation", { name: "โมดูล" });
      await expect(dock.getByRole("link").first()).toBeVisible();
      const chipBox = await chip.boundingBox();
      expect(chipBox).not.toBeNull();
      const slots = await dock.getByRole("link").all();
      expect(slots.length).toBeGreaterThan(0);
      for (const slot of slots) {
        const slotBox = await slot.boundingBox();
        expect(slotBox).not.toBeNull();
        const separated =
          chipBox!.x + chipBox!.width <= slotBox!.x ||
          slotBox!.x + slotBox!.width <= chipBox!.x ||
          chipBox!.y + chipBox!.height <= slotBox!.y ||
          slotBox!.y + slotBox!.height <= chipBox!.y;
        expect(
          separated,
          `chip ${JSON.stringify(chipBox)} must not intersect dock slot ${JSON.stringify(slotBox)} at ${viewport.width}px`,
        ).toBe(true);
      }
      // Tap-target integrity: the chip's center must resolve to the chip
      // itself, never to a ModuleDock layer (occlusion guard).
      const centerIsChip = await chip.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return hit !== null && (hit === el || el.contains(hit));
      });
      expect(centerIsChip, `chip center occluded at ${viewport.width}px`).toBe(true);
    }
  });
});
