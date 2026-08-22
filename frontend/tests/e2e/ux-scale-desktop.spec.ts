import { test, expect } from "./fixtures";

const DESKTOP = { width: 1440, height: 1000 };

async function captureEvidence(page: import("@playwright/test").Page, name: string) {
  const phase = process.env.PR15_EVIDENCE;
  if (!phase) return;
  await page.screenshot({
    path: `../docs/review-evidence/pr-15/${phase}-${name}.png`,
    fullPage: false,
  });
}

test("WO-UX-SCALE-001 desktop header remains within the 1440px viewport", async ({ authed: page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/dashboard");
  await captureEvidence(page, "desktop-1440-light");

  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noOverflow).toBe(true);

  await page.getByRole("button", { name: /สลับเป็นโหมด/ }).click();
  await captureEvidence(page, "desktop-1440-dark");
  const noOverflowOtherTheme = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noOverflowOtherTheme).toBe(true);
});
