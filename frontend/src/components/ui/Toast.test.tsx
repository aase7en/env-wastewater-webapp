import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveToastDurationMs,
  runToastAction,
  ToastCard,
  type ToastAction,
} from "./Toast";

/**
 * ENV-UNDO-001 — Toast minimal-extension contract tests (D2 RED-first).
 *
 * Vitest runs under the house `environment: "node"` config (no DOM library
 * is installed in scope), so these tests pin the Toast extension at the
 * unit seam that IS truthfully testable here:
 *   - the rendered card markup (presentational `ToastCard` — no portal, no
 *     document access, SSR-renderable like the analytics/water-watch
 *     house precedent),
 *   - the option-resolution + action-click contracts (`resolveToastDurationMs`,
 *     `runToastAction`).
 * The literal in-browser click-through (undo button restores the record)
 * is covered end-to-end by tests/e2e/env-undo-001.spec.ts — recorded as an
 * honest environment constraint, not a weaker assertion.
 *
 * Backward-compat bounds (WO): existing consumers keep the exact
 * `(kind, message)` API and the 4s(success)/6s(others) auto-dismiss
 * defaults; options are purely additive.
 */

const baseAction: ToastAction = { label: "ย้อนกลับ", onAction: () => {} };

describe("ENV-UNDO-001 Toast action support", () => {
  describe("resolveToastDurationMs (legacy timing contract)", () => {
    it("keeps the legacy defaults byte-compatible: 4000 success / 6000 others", () => {
      expect(resolveToastDurationMs("success")).toBe(4000);
      expect(resolveToastDurationMs("error")).toBe(6000);
      expect(resolveToastDurationMs("warning")).toBe(6000);
      expect(resolveToastDurationMs("info")).toBe(6000);
    });

    it("lets options.durationMs override the default (10s undo window)", () => {
      expect(resolveToastDurationMs("success", { durationMs: 10_000 })).toBe(10_000);
      expect(resolveToastDurationMs("error", { durationMs: 10_000 })).toBe(10_000);
    });

    it("ignores options that carry no durationMs", () => {
      expect(resolveToastDurationMs("success", { action: baseAction })).toBe(4000);
      expect(resolveToastDurationMs("info", {})).toBe(6000);
    });
  });

  describe("runToastAction (action click contract)", () => {
    it("fires the action callback and then dismisses the toast", () => {
      const onAction = vi.fn();
      const dismiss = vi.fn();
      runToastAction({ label: "ย้อนกลับ", onAction }, dismiss);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(onAction.mock.invocationCallOrder[0]).toBeLessThan(
        dismiss.mock.invocationCallOrder[0]
      );
    });

    it("dismisses even without an action (plain close path)", () => {
      const dismiss = vi.fn();
      runToastAction(undefined, dismiss);
      expect(dismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("ToastCard rendering", () => {
    it("renders the optional action button with the Thai label", () => {
      const html = renderToStaticMarkup(
        <ToastCard
          kind="success"
          message="ลบแล้ว"
          action={baseAction}
          durationMs={10_000}
        />
      );
      expect(html).toContain("ลบแล้ว");
      expect(html).toContain("ย้อนกลับ");
      // The action affordance must be a real <button> (focusable by default).
      expect(html).toMatch(/<button[^>]*>[\s\S]*?ย้อนกลับ[\s\S]*?<\/button>/);
    });

    it("gives the undo action a ≥44px touch target per the house token", () => {
      const html = renderToStaticMarkup(
        <ToastCard
          kind="success"
          message="ลบแล้ว"
          action={baseAction}
          durationMs={10_000}
        />
      );
      // House ≥44px tap-target utilities (same tokens as QuickChips).
      expect(html).toContain("min-h-[var(--touch-min)]");
      expect(html).toContain("min-w-[var(--touch-min)]");
    });

    it("renders the visible seconds countdown when enabled", () => {
      const html = renderToStaticMarkup(
        <ToastCard
          kind="success"
          message="ลบแล้ว"
          action={baseAction}
          durationMs={10_000}
          countdown
        />
      );
      expect(html).toContain("10 วิ");
      // SR users get the toast + button; the ticking number is decoration.
      expect(html).toMatch(/aria-hidden="true"[^>]*>10 วิ</);
    });

    it("renders NO action button and NO countdown when not requested (legacy shape)", () => {
      const html = renderToStaticMarkup(
        <ToastCard kind="success" message="บันทึกรายการสำเร็จ" durationMs={4000} />
      );
      expect(html).toContain("บันทึกรายการสำเร็จ");
      expect(html).not.toContain("ย้อนกลับ");
      expect(html).not.toContain("วิ</span>");
      // The legacy close affordance stays.
      expect(html).toMatch(/ปิด/);
    });

    it("renders multiple cards independently (queue-structure pin for rapid deletes)", () => {
      const html = [
        renderToStaticMarkup(
          <ToastCard kind="success" message="ลบแล้ว" action={{ ...baseAction, onAction: () => {} }} durationMs={10_000} countdown />
        ),
        renderToStaticMarkup(
          <ToastCard kind="success" message="ลบแล้ว" action={{ ...baseAction, onAction: () => {} }} durationMs={10_000} countdown />
        ),
      ];
      // Each card carries its own action button — no shared/mutated state
      // between instances (the provider stacks these 1:1 per toast entry).
      for (const card of html) {
        expect(card).toContain("ย้อนกลับ");
        expect(card).toContain("10 วิ");
      }
    });
  });
});
