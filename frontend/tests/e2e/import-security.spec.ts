import { jsPDF } from "jspdf";
import { test, expect } from "./fixtures";

test("admin PDF import parses a synthetic file through patched PDF.js without writes", async ({ authedAdmin: page }) => {
  const restWrites: string[] = [];
  page.on("request", (request) => {
    if (/\/rest\/v1\//.test(request.url()) && !["GET", "HEAD"].includes(request.method())) {
      restWrites.push(`${request.method()} ${request.url()}`);
    }
  });

  const pdf = new jsPDF();
  pdf.text("reading_date", 12, 20);
  pdf.text("ph", 90, 20);
  pdf.text("2026-08-29", 12, 32);
  pdf.text("7.2", 90, 32);
  const buffer = Buffer.from(pdf.output("arraybuffer"));

  await page.goto("/import");
  await expect(page).toHaveURL(/\/import$/);
  await expect(page.locator('input[type="file"]')).toHaveCount(1);

  await page.locator('input[type="file"]').setInputFiles({
    name: "synthetic-security.pdf",
    mimeType: "application/pdf",
    buffer,
  });

  await expect(page.getByText("synthetic-security.pdf")).toBeVisible();
  await expect(page.getByText(/PDF table extraction/).first()).toBeVisible();
  const stats = page.locator(".grid.grid-cols-3.gap-3.text-center").first();
  await expect(stats.locator(":scope > div").first().locator("div").first()).toHaveText("1");
  expect(restWrites).toEqual([]);
});
