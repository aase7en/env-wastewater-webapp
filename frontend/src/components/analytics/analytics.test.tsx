import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { SituationChartFrame } from "./SituationChartFrame";
import { SituationMetricCard } from "./SituationMetricCard";

function renderMetric(props: React.ComponentProps<typeof SituationMetricCard>) {
  return renderToStaticMarkup(<SituationMetricCard {...props} />);
}

describe("SituationMetricCard", () => {
  it("renders missing values explicitly and never substitutes zero", () => {
    const html = renderMetric({ label: "DO", value: null, unit: "mg/L" });
    expect(html).toContain("ไม่ทราบค่า");
    expect(html).toContain('data-state="unknown"');
    expect(html).not.toContain(">0<");
  });

  it("preserves an actual numeric zero as a known value", () => {
    const html = renderMetric({ label: "ค่าทดสอบ", value: 0, unit: "mg/L" });
    expect(html).toContain('data-state="known"');
    expect(html).toContain(">0<");
  });

  it("labels stale data explicitly", () => {
    const html = renderMetric({
      label: "ระดับน้ำ",
      value: 2.5,
      sourceType: "observation",
      freshness: "stale",
    });
    expect(html).toContain("ข้อมูลล้าสมัย");
  });

  it("renders the supplied source type and provider", () => {
    const html = renderMetric({
      label: "PM2.5",
      value: 36,
      sourceType: "satellite_estimate",
      provider: "GISTDA",
    });
    expect(html).toContain("ประมาณการจากดาวเทียม");
    expect(html).toContain("GISTDA");
  });

  it("keeps forecast distinct from observation", () => {
    const forecast = renderMetric({ label: "Heat", value: 41, sourceType: "forecast" });
    const observed = renderMetric({ label: "Heat", value: 41, sourceType: "observation" });
    expect(forecast).toContain("พยากรณ์");
    expect(forecast).not.toContain("การสังเกต");
    expect(observed).toContain("การสังเกต");
    expect(observed).not.toContain("พยากรณ์");
  });

  it("renders only caller-supplied trend semantics", () => {
    const withTrend = renderMetric({
      label: "PM2.5",
      value: 36,
      trend: { direction: "up", label: "เพิ่มขึ้น" },
    });
    const withoutTrend = renderMetric({ label: "PM2.5", value: 36 });
    expect(withTrend).toContain('data-role="trend"');
    expect(withTrend).toContain("เพิ่มขึ้น");
    expect(withoutTrend).not.toContain('data-role="trend"');
  });

  it("renders safely when optional metadata is absent", () => {
    const html = renderMetric({ label: "pH", value: 7.2 });
    expect(html).toContain("pH");
    expect(html).toContain("7.2");
    expect(html).not.toContain("แหล่งที่มาและความสดใหม่ของข้อมูล");
  });
});

describe("ProvenanceBadge", () => {
  it("keeps manual latest and live sensor as different labels", () => {
    const manual = renderToStaticMarkup(<ProvenanceBadge sourceType="manual_latest" freshness="current" />);
    const live = renderToStaticMarkup(<ProvenanceBadge sourceType="live_sensor" freshness="current" />);
    expect(manual).toContain("บันทึกล่าสุดโดยผู้ปฏิบัติงาน");
    expect(live).toContain("เซนเซอร์สด");
    expect(manual).not.toContain("เซนเซอร์สด");
  });
});

describe("SituationChartFrame", () => {
  it("renders an explicit empty state without inventing chart data", () => {
    const html = renderToStaticMarkup(<SituationChartFrame title="แนวโน้ม" empty />);
    expect(html).toContain('data-state="empty"');
    expect(html).toContain("ยังไม่มีข้อมูลสำหรับช่วงเวลานี้");
  });

  it("renders caller-provided series and threshold descriptions", () => {
    const html = renderToStaticMarkup(
      <SituationChartFrame
        title="แนวโน้ม"
        seriesSummary="เส้นทึบ = observation · เส้นประ = forecast"
        thresholdDescription="ตัวอย่างเท่านั้น — caller supplied"
      >
        <div>chart-child</div>
      </SituationChartFrame>,
    );
    expect(html).toContain('data-state="ready"');
    expect(html).toContain("observation");
    expect(html).toContain("forecast");
    expect(html).toContain("caller supplied");
    expect(html).toContain("chart-child");
  });
});
