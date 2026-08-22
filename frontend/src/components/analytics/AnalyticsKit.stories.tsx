import { ProvenanceBadge } from "./ProvenanceBadge";
import { SituationChartFrame } from "./SituationChartFrame";
import { SituationMetricCard } from "./SituationMetricCard";

function ThemePanel({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-[22rem] bg-aura-bg p-4 text-aura-textMain sm:p-6">
        <p className="mb-4 font-thai text-xs font-semibold uppercase tracking-[0.18em] text-aura-textMuted">
          {dark ? "Aura Dark" : "Aura Light"}
        </p>
        {children}
      </div>
    </div>
  );
}

function StorySurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ThemePanel dark={false}>{children}</ThemePanel>
      <ThemePanel dark>{children}</ThemePanel>
    </div>
  );
}

function DemoChart() {
  return (
    <div
      className="grid h-44 grid-cols-8 items-end gap-2 rounded-xl border border-aura-borderSubtle/70 bg-aura-surface-low/35 p-4"
      aria-label="ตัวอย่างพื้นที่กราฟแบบคงที่ ไม่มีข้อมูลจริง"
    >
      {[34, 46, 41, 57, 51, 63, 60, 72].map((height, index) => (
        <div key={index} className="rounded-t bg-aura-cyan/45" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export const CurrentObserved = () => (
  <StorySurface>
    <div className="grid gap-4">
      <SituationMetricCard
        label="PM2.5"
        value={36}
        unit="µg/m³"
        trend={{ direction: "up", label: "เพิ่มขึ้นจากค่าก่อนหน้า (ข้อมูลสาธิต)" }}
        provider="GISTDA — fixture"
        sourceType="observation"
        observedAt="22 ส.ค. 2026 18:00 (ข้อมูลสาธิต)"
        freshness="current"
      />
      <SituationChartFrame
        title="แนวโน้ม PM2.5"
        periodLabel="24 ชั่วโมงล่าสุด — fixture เท่านั้น"
        seriesSummary="เส้นทึบ = การสังเกต"
        sourceSummary={<ProvenanceBadge sourceType="observation" provider="GISTDA — fixture" freshness="current" />}
      >
        <DemoChart />
      </SituationChartFrame>
    </div>
  </StorySurface>
);

export const StaleObserved = () => (
  <StorySurface>
    <SituationMetricCard
      label="ระดับน้ำแม่น้ำ"
      value={2.74}
      unit="m"
      provider="ThaiWater — fixture"
      sourceType="observation"
      observedAt="ข้อมูลสาธิตย้อนหลัง 5 ชม."
      freshness="stale"
      freshnessLabel="ล้าสมัย 5 ชม. — fixture"
    />
  </StorySurface>
);

export const ForecastValue = () => (
  <StorySurface>
    <SituationMetricCard
      label="ดัชนีความร้อน"
      value={41}
      unit="°C"
      trend={{ direction: "up", label: "สูงขึ้นตาม forecast fixture" }}
      provider="TMD — fixture"
      sourceType="forecast"
      observedAt="ใช้ได้สำหรับ 23 ส.ค. 2026 14:00 (fixture)"
      freshness="current"
      statusLabel="ตัวอย่างพยากรณ์"
      statusTone="cyan"
    />
  </StorySurface>
);

export const SatelliteAndModelEstimate = () => (
  <StorySurface>
    <div className="grid gap-4 sm:grid-cols-2">
      <SituationMetricCard
        label="PM2.5 ดาวเทียม"
        value={32}
        unit="µg/m³"
        provider="GISTDA — fixture"
        sourceType="satellite_estimate"
        freshness="current"
      />
      <SituationMetricCard
        label="แบบจำลองความเสี่ยงตัวอย่าง"
        value="Demo"
        provider="Model fixture"
        sourceType="model_estimate"
        freshness="unknown"
      />
    </div>
  </StorySurface>
);

export const MissingUnknown = () => (
  <StorySurface>
    <div className="grid gap-4">
      <SituationMetricCard
        label="DO ถังเติมอากาศ"
        value={null}
        unit="mg/L"
        sourceType="manual_latest"
        freshness="unknown"
        unknownLabel="ยังไม่มีค่าที่เชื่อถือได้"
      />
      <SituationChartFrame title="ประวัติ DO" empty emptyLabel="ไม่มีข้อมูลที่ยืนยันได้สำหรับช่วงเวลานี้" />
    </div>
  </StorySurface>
);

export const ManualLatest = () => (
  <StorySurface>
    <SituationMetricCard
      label="TDS ถังเติมอากาศ"
      value={522}
      unit="mg/L"
      provider="บันทึกผู้ปฏิบัติงาน — fixture"
      sourceType="manual_latest"
      observedAt="บันทึกล่าสุด — fixture"
      freshness="current"
    />
  </StorySurface>
);

export const MinimalMetadata = () => (
  <StorySurface>
    <SituationMetricCard label="ค่าทั่วไป" value={7.2} />
  </StorySurface>
);
