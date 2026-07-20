import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vitest config (TEST-1 foundation).
 *
 * Separate from vite.config.ts so test-runner settings don't bleed into the
 * build (and vice-versa). Reuses the React plugin + `@` alias so component
 * tests (if added later) drop in without extra config.
 *
 * environment: node — lib/ functions are pure (no DOM, no fetch). Switch to
 * jsdom if a component test needs window/document.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Co-located sibling tests (*.test.ts next to the module) — Vitest default.
  },
});
