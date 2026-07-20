import { test as base, expect } from "@playwright/test";

/**
 * E2E-2: baseURL-aware navigation. Playwright resolves goto("/x") against
 * the ORIGIN, dropping any subpath in baseURL (GitHub Pages serves the app
 * under /env-wastewater-webapp/). Rewriting "/x" -> "./x" resolves relative
 * to the baseURL directory instead, so specs keep writing app-root paths.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = (url, options) =>
      goto(typeof url === "string" && url.startsWith("/") ? "." + url : url, options);
    await use(page);
  },
});
export { expect };
