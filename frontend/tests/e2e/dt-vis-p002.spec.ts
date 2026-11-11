import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

/**
 * DT-VIS-P002 — aeration-tank water-surface motion language (RED-first).
 *
 * D1 contract pinned by this spec (bounded first slice):
 * - Motion derives ONLY from the validated aggregate `aeratorRunning`
 *   (`TwinMetric<boolean>` on `asset:aeration-tank-1`) or explicit SIMULATED
 *   scenario data already exposed to the Twin. No per-equipment telemetry,
 *   no process formulas, no real-speed/real-flow claims, no new data paths.
 * - Pure derivation `deriveWaterMotionState(aeratorRunning, reducedMotion)`
 *   exported from WastewaterTwin.tsx:
 *     true  + motion allowed  → "active"        (animated treatment surface)
 *     true  + reduced motion  → "active-still"  (meaningful still, not broken)
 *     false (± reduced)       → "stopped-still" (still, reads as treatment basin)
 *     null  (± reduced)       → "unknown-still" (still; never fabricated motion)
 * - Shell pins `data-water-motion="<state>"` and renders a DOM truth chip
 *   `twin-water-motion-status` (Thai, meaning survives outside the Canvas):
 *     active        → "ผิวน้ำ: เติมอากาศกำลังทำงาน"
 *     active-still  → "ผิวน้ำ: เติมอากาศทำงาน (หยุดภาพเคลื่อนไหว)"
 *     stopped-still → "ผิวน้ำ: เติมอากาศหยุดทำงาน"
 *     unknown-still → "ผิวน้ำ: ไม่ทราบสถานะการเติมอากาศ"
 * - Vocabulary: the chip never claims LIVE/sensor telemetry; simulation is
 *   labeled only by the existing SIMULATION badge.
 *
 * Truthful reachability note: in latest/historical modes the dashboard
 * adapter maps aeratorRunning to unavailable (null) and the only scenario
 * surface is AERATION_DEMO_OVERRIDES (aeratorRunning: true). The validated
 * `false` case is therefore pinned through the pure derivation import, not
 * through an invented UI data path.
 */

const DASHBOARD_ROW = {
  reading_date: "2026-08-14",
  do_average: 4.5,
  ph: 7.2,
  free_chlorine: 0.8,
  tds_aeration: 420,
  water_used_total: 100,
  wastewater_in: 80,
  system_operating: true,
  wastewater_discharged: true,
  do_alert: false,
  chlorine_alert: false,
  ph_alert: false,
};

async function mockDashboard(page: Page) {
  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([DASHBOARD_ROW]),
    });
  });
}

async function waitForTwinReady(page: Page) {
  await expect(page.getByTestId("dashboard-twin-panel")).toHaveAttribute(
    "data-twin-status",
    "ready",
    { timeout: 30_000 },
  );
}

async function openSimulation(page: Page) {
  await page.getByRole("button", { name: "เปิดข้อมูลจำลอง" }).click();
  await expect(page.getByText("SIMULATION — ข้อมูลจำลอง")).toBeVisible();
}

const WATER_MOTION_CHIP = "twin-water-motion-status";

/**
 * Installs a draw-call counter for the Twin renderer canvas (identified by
 * the app's own `data-twin-renderer-canvas` dataset marker). This measures
 * the render loop itself, which is the mechanism that makes a state move or
 * stay still: "demand" frameloop (all still states) draws no frames once
 * settled, while "always" (the active treatment state) draws continuously.
 * Unlike canvas byte comparisons, this is deterministic under load.
 */
async function installTwinDrawCounter(page: Page) {
  await page.addInitScript(() => {
    const windowWithCounter = window as typeof window & { __twinDrawCount?: number };
    windowWithCounter.__twinDrawCount = 0;
    const bump = (this_arg: unknown) => {
      const canvas = (this_arg as { canvas?: HTMLCanvasElement } | null)?.canvas;
      if (canvas?.dataset.twinRendererCanvas === "true") windowWithCounter.__twinDrawCount! += 1;
    };
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      for (const method of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"] as const) {
        const original = proto[method] as (this: WebGLRenderingContext, ...args: unknown[]) => void;
        if (!original) continue;
        proto[method] = function (this: WebGLRenderingContext, ...args: unknown[]) {
          bump(this);
          return original.apply(this, args);
        } as typeof original;
      }
    }
  });
}

async function twinDrawCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const windowWithCounter = window as typeof window & { __twinDrawCount?: number };
    return windowWithCounter.__twinDrawCount ?? -1;
  });
}

async function resetTwinDrawCount(page: Page) {
  await page.evaluate(() => {
    const windowWithCounter = window as typeof window & { __twinDrawCount?: number };
    windowWithCounter.__twinDrawCount = 0;
  });
}

/** Samples Twin renderer draw activity over an observation window. */
async function observeTwinDrawActivity(page: Page, windowMs = 600): Promise<number> {
  await resetTwinDrawCount(page);
  await page.waitForTimeout(windowMs);
  return twinDrawCount(page);
}

test.describe("DT-VIS-P002 water-surface motion language", () => {
  test("derivation truth table: validated aggregate → motion/still states (exhaustive, incl. reduced motion)", async () => {
    const { deriveWaterMotionState } = await import(
      "../../src/components/digital-twin/WastewaterTwin"
    );
    expect(deriveWaterMotionState(true, false)).toBe("active");
    expect(deriveWaterMotionState(true, true)).toBe("active-still");
    expect(deriveWaterMotionState(false, false)).toBe("stopped-still");
    expect(deriveWaterMotionState(false, true)).toBe("stopped-still");
    expect(deriveWaterMotionState(null, false)).toBe("unknown-still");
    expect(deriveWaterMotionState(null, true)).toBe("unknown-still");
  });

  test("latest mode: unknown aerator aggregate → still water with truthful UNAVAILABLE semantics, no fabricated motion", async ({
    authed: page,
  }) => {
    await installTwinDrawCounter(page);
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    const shell = page.getByTestId("twin-canvas-shell");
    await expect(shell).toHaveAttribute("data-aerator-running", "unknown");
    await expect(shell).toHaveAttribute("data-water-motion", "unknown-still");

    const chip = page.getByTestId(WATER_MOTION_CHIP);
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText("ผิวน้ำ: ไม่ทราบสถานะการเติมอากาศ");

    // No fabricated motion while the aggregate is unknown: once settled, the
    // Twin renderer draws no frames (still state), yet the surface still
    // reads as a treatment basin via the truthful treatment cue chip.
    const draws = await observeTwinDrawActivity(page);
    expect(draws).toBeLessThanOrEqual(10);
  });

  test("simulation (explicit scenario, labeled): validated running aggregate → active treatment motion on the water surface", async ({
    authed: page,
  }) => {
    await installTwinDrawCounter(page);
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    await openSimulation(page);

    const shell = page.getByTestId("twin-canvas-shell");
    await expect(shell).toHaveAttribute("data-aerator-running", "true");
    await expect(shell).toHaveAttribute("data-water-motion", "active");

    const chip = page.getByTestId(WATER_MOTION_CHIP);
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText("ผิวน้ำ: เติมอากาศกำลังทำงาน");
    // Vocabulary truth: motion presence must not claim live sensor telemetry.
    await expect(chip).not.toContainText("LIVE");
    await expect(chip).not.toContainText("เซนเซอร์");

    // Active treatment surface actually animates continuously (distinct from
    // a static ornamental pond): the renderer keeps drawing frames.
    const draws = await observeTwinDrawActivity(page);
    expect(draws).toBeGreaterThan(100);
  });

  test("reduced motion: validated running aggregate → meaningful still state (active-still), not a broken/blank surface", async ({
    authed: page,
  }) => {
    await installTwinDrawCounter(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    await openSimulation(page);

    const shell = page.getByTestId("twin-canvas-shell");
    await expect(shell).toHaveAttribute("data-reduced-motion", "true");
    await expect(shell).toHaveAttribute("data-water-motion", "active-still");

    const chip = page.getByTestId(WATER_MOTION_CHIP);
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText("ผิวน้ำ: เติมอากาศทำงาน (หยุดภาพเคลื่อนไหว)");
    await expect(chip).not.toContainText("LIVE");

    // Reduced motion keeps the meaning (still running) but suspends the
    // animation loop: once settled, the renderer draws no frames.
    const draws = await observeTwinDrawActivity(page);
    expect(draws).toBeLessThanOrEqual(10);
  });

  test("no ornamental-pond static look: still states keep the truthful treatment cue (DOM hook present)", async ({
    authed: page,
  }) => {
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    const chip = page.getByTestId(WATER_MOTION_CHIP);
    await expect(chip).toBeVisible();
    // The still water surface carries the aeration-treatment vocabulary, so
    // it cannot read as a decorative clear pond.
    await expect(chip).toContainText("ผิวน้ำ");
    await expect(chip).toContainText("เติมอากาศ");
    await expect(page.getByTestId("twin-canvas-shell")).toHaveAttribute(
      "data-water-motion",
      "unknown-still",
    );
  });

  test("mobile 390: the water-motion truth chip stays visible and inside the Twin shell", async ({
    authed: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    const chip = page.getByTestId(WATER_MOTION_CHIP);
    await expect(chip).toBeVisible();
    const chipBox = await chip.boundingBox();
    const shellBox = await page.getByTestId("twin-canvas-shell").boundingBox();
    expect(chipBox).not.toBeNull();
    expect(shellBox).not.toBeNull();
    expect(chipBox!.x).toBeGreaterThanOrEqual(shellBox!.x);
    expect(chipBox!.y).toBeGreaterThanOrEqual(shellBox!.y);
    expect(chipBox!.x + chipBox!.width).toBeLessThanOrEqual(shellBox!.x + shellBox!.width + 1);
    expect(chipBox!.y + chipBox!.height).toBeLessThanOrEqual(shellBox!.y + shellBox!.height + 1);
  });

  test("no new data paths: Twin files keep their existing import surface (no scenario/telemetry/flow/pfd/p003/supabase additions)", async () => {
    const twinDir = resolve(
      fileURLToPath(new URL("../../src/components/digital-twin", import.meta.url)),
    );
    const forbidden = [
      /process-scenario/,
      /env-int/,
      /components\/flow/,
      /components\/pfd/,
      /digital-twin\/p003/,
      /supabase/,
    ];
    const baselines: Record<string, string[]> = {
      "WastewaterTwin.tsx": [
        "../../lib/twin/types",
        "@react-three/fiber",
        "react",
        "three",
      ],
      "TwinCanvas.tsx": [
        "../../lib/theme",
        "../../lib/twin/demo-state",
        "../../lib/twin/selectors",
        "../../lib/twin/store",
        "../../lib/twin/types",
        "../../lib/twin/webgl",
        "../../lib/types",
        "../../lib/useAuraTheme",
        "../../lib/utils",
        "../ui/AuraCard",
        "../ui/Button",
        "./TwinRendererBoundary",
        "./WastewaterTwin",
        "@react-three/drei",
        "@react-three/fiber",
        "react",
        "three",
      ],
    };

    for (const [file, expected] of Object.entries(baselines)) {
      const source = readFileSync(resolve(twinDir, file), "utf8");
      const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]).sort();
      for (const pattern of forbidden) {
        expect(specifiers.some((specifier) => pattern.test(specifier))).toBe(false);
      }
      expect(specifiers).toEqual([...expected].sort());
    }
  });
});
