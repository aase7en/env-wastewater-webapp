import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WaterWatchDashboard } from "./WaterWatchDashboard";
import {
  getRiskPresentation,
  simulatedWaterWatchSnapshot,
  type WaterWatchSnapshot,
} from "./model";

describe("Water Watch demo contract", () => {
  it("keeps the first visual slice explicitly simulated", () => {
    expect(simulatedWaterWatchSnapshot.mode).toBe("SIMULATED");
    expect(simulatedWaterWatchSnapshot.metrics.every((metric) => metric.evidenceKind === "SIMULATED")).toBe(true);
    expect(simulatedWaterWatchSnapshot.forecast.every((point) => point.kind === "SIMULATED")).toBe(true);
  });

  it("never presents unavailable as normal", () => {
    expect(getRiskPresentation("UNAVAILABLE").label).toBe("ประเมินไม่ได้");
    expect(getRiskPresentation("UNAVAILABLE").label).not.toBe(getRiskPresentation("NORMAL").label);
  });

  it("renders a persistent simulated-data disclosure and no LIVE claim", () => {
    const html = renderToStaticMarkup(
      <WaterWatchDashboard snapshot={simulatedWaterWatchSnapshot} />,
    );

    expect(html).toContain('data-mode="SIMULATED"');
    expect(html).toContain("ข้อมูลทุกตัวเลขในหน้านี้เป็นข้อมูลจำลอง");
    expect(html).toContain("ไม่ใช่สถานการณ์น้ำจริง");
    expect(html).not.toContain(">LIVE<");
  });

  it("renders unavailable risk honestly without inventing a safe status", () => {
    const unavailable: WaterWatchSnapshot = {
      ...simulatedWaterWatchSnapshot,
      risk: "UNAVAILABLE",
      summary: "แหล่งข้อมูลที่จำเป็นไม่พร้อม จึงยังประเมินสถานการณ์ไม่ได้",
    };
    const html = renderToStaticMarkup(<WaterWatchDashboard snapshot={unavailable} />);

    expect(html).toContain("ประเมินไม่ได้");
    expect(html).toContain("แหล่งข้อมูลที่จำเป็นไม่พร้อม");
  });
});
