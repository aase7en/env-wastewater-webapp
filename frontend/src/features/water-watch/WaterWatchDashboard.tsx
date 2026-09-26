import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CloudRain,
  Database,
  Hospital,
  ShieldAlert,
  TrendingUp,
  Users,
  Waves,
} from "lucide-react";
import {
  getRiskPresentation,
  getTrendLabel,
  type WaterWatchMetric,
  type WaterWatchSnapshot,
  type WaterWatchStation,
} from "./model";

function MetricIcon({ index }: { index: number }) {
  const icons = [CloudRain, Waves, TrendingUp, Users];
  const Icon = icons[index] ?? Waves;
  return <Icon aria-hidden="true" className="h-6 w-6 text-sky-600" strokeWidth={2.1} />;
}

function MetricCard({ metric, index }: { metric: WaterWatchMetric; index: number }) {
  return (
    <article
      className="min-w-0 rounded-2xl border border-sky-100 bg-white/95 px-4 py-3 shadow-sm"
      data-evidence-kind={metric.evidenceKind}
    >
      <div className="flex items-center gap-2">
        <MetricIcon index={index} />
        <h3 className="truncate text-sm font-semibold text-slate-600">{metric.label}</h3>
      </div>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 lg:text-3xl">{metric.value}</p>
      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{metric.helper}</p>
    </article>
  );
}

function StationMarker({ station }: { station: WaterWatchStation }) {
  const risk = getRiskPresentation(station.risk);
  return (
    <div
      className="absolute top-5 -translate-x-1/2"
      style={{ left: `${station.positionPercent}%` }}
      data-testid={`water-watch-station-${station.id}`}
    >
      <div
        className={`w-[132px] rounded-xl border bg-white/95 px-3 py-2 text-center shadow-lg xl:w-[150px] ${risk.surfaceClass}`}
      >
        <p className="truncate text-[11px] font-semibold text-slate-600">{station.area}</p>
        <p className={`mt-0.5 text-xs font-bold ${risk.textClass}`}>{risk.shortLabel}</p>
        <p className="mt-1 text-lg font-extrabold leading-none text-slate-900">{station.value ?? "—"}</p>
        <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">{station.helper}</p>
        <p className="mt-1 text-[10px] font-semibold text-slate-600">แนวโน้ม: {getTrendLabel(station.trend)}</p>
      </div>
      <div className="mx-auto h-8 w-px bg-slate-300" aria-hidden="true" />
      <div
        className={`mx-auto grid h-8 w-8 place-items-center rounded-full border-4 border-white shadow-md ${risk.dotClass}`}
        aria-hidden="true"
      >
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>
    </div>
  );
}

function RiverStory({ snapshot }: { snapshot: WaterWatchSnapshot }) {
  return (
    <section
      className="relative min-h-[330px] overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-b from-sky-100 via-cyan-50 to-emerald-50 shadow-sm"
      aria-labelledby="water-watch-river-title"
    >
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-3">
        <div>
          <h2 id="water-watch-river-title" className="text-base font-bold text-slate-800 lg:text-lg">
            เส้นเรื่องสถานการณ์น้ำ
          </h2>
          <p className="text-xs text-slate-500">เรียงตามบริบทต้นน้ำ → พื้นที่อุทัย → ปลายน้ำ ไม่ใช่แผนที่ตามมาตราส่วน</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-sky-700 sm:flex">
          <Hospital aria-hidden="true" className="h-4 w-4" />
          โรงพยาบาลอุทัย
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-6 top-[118px]" aria-hidden="true">
        <svg viewBox="0 0 1000 220" className="h-full w-full" preserveAspectRatio="none">
          <path
            d="M0 128 C140 45 235 185 365 112 C490 42 570 184 705 106 C820 40 900 158 1000 86"
            fill="none"
            stroke="rgba(14,165,233,0.22)"
            strokeWidth="38"
            strokeLinecap="round"
          />
          <path
            d="M0 128 C140 45 235 185 365 112 C490 42 570 184 705 106 C820 40 900 158 1000 86"
            fill="none"
            stroke="rgb(14,165,233)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M0 128 C140 45 235 185 365 112 C490 42 570 184 705 106 C820 40 900 158 1000 86"
            fill="none"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="3"
            strokeDasharray="10 16"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="absolute inset-x-0 top-12 bottom-10">
        {snapshot.stations.map((station) => (
          <StationMarker key={station.id} station={station} />
        ))}
      </div>

      <div className="absolute bottom-3 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
        <ArrowRight aria-hidden="true" className="h-4 w-4 text-sky-600" />
        ต้นน้ำ
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-emerald-100 bg-white/95 px-4 py-2 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
          <Building2 aria-hidden="true" className="h-4 w-4" />
          อำเภออุทัย
        </div>
        <p className="text-[10px] text-slate-500">พื้นที่โฟกัสหลัก</p>
      </div>

      <div className="absolute bottom-3 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
        ปลายน้ำ
        <ArrowRight aria-hidden="true" className="h-4 w-4 text-sky-600" />
      </div>
    </section>
  );
}

function AdvicePanel({ snapshot }: { snapshot: WaterWatchSnapshot }) {
  const risk = getRiskPresentation(snapshot.risk);
  return (
    <aside className="flex min-h-[330px] flex-col rounded-3xl border border-sky-100 bg-white/95 p-5 shadow-sm" aria-labelledby="water-watch-advice-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Public summary</p>
          <h2 id="water-watch-advice-title" className="mt-1 text-xl font-extrabold text-slate-900">
            สรุปสำหรับประชาชน
          </h2>
        </div>
        <div className="rounded-2xl bg-sky-50 p-2.5">
          <ShieldAlert aria-hidden="true" className="h-6 w-6 text-sky-600" />
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border p-4 ${risk.surfaceClass}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className={`h-5 w-5 ${risk.textClass}`} />
          <p className={`text-lg font-extrabold ${risk.textClass}`}>ตัวอย่าง: {risk.label}</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">{snapshot.summary}</p>
      </div>

      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {snapshot.advice.map((advice, index) => (
          <li key={advice} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-700">
              {index + 1}
            </span>
            <span className="leading-6">{advice}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">
        ข้อความนี้เป็น Rule-based demo เพื่อทดสอบการสื่อสาร ไม่ใช่ AI, คำเตือน หรือคำแนะนำจากหน่วยงานทางการ
      </div>
    </aside>
  );
}

function ForecastCard({ snapshot }: { snapshot: WaterWatchSnapshot }) {
  const points = snapshot.forecast;
  const width = 400;
  const height = 108;
  const xStep = width / (points.length - 1);
  const polyline = points
    .map((point, index) => {
      const x = index * xStep;
      const y = height - (point.value / 100) * (height - 20) - 8;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">แนวโน้มจำลอง 24 ชั่วโมง</h2>
          <p className="text-[11px] text-slate-500">ใช้ทดสอบ layout เท่านั้น ไม่ใช่การพยากรณ์จริง</p>
        </div>
        <TrendingUp aria-hidden="true" className="h-5 w-5 text-sky-600" />
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-24 w-full overflow-visible"
        role="img"
        aria-label="กราฟแนวโน้มจำลองเพิ่มขึ้นตลอด 24 ชั่วโมง"
      >
        <line x1="0" y1={height - 8} x2={width} y2={height - 8} stroke="rgb(226 232 240)" strokeWidth="1" />
        <polyline points={polyline} fill="none" stroke="rgb(14 165 233)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const x = index * xStep;
          const y = height - (point.value / 100) * (height - 20) - 8;
          return <circle key={point.label} cx={x} cy={y} r="5" fill="white" stroke="rgb(14 165 233)" strokeWidth="3" />;
        })}
      </svg>
      <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-medium text-slate-500">
        {points.map((point) => <span key={point.label}>{point.label}</span>)}
      </div>
    </article>
  );
}

function RainCard({ snapshot }: { snapshot: WaterWatchSnapshot }) {
  const max = Math.max(...snapshot.rainfallBars.map((bar) => bar.value), 1);
  return (
    <article className="rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">ตัวอย่างปริมาณฝน</h2>
          <p className="text-[11px] text-slate-500">SIMULATED · ไม่ใช่ข้อมูลตรวจวัด</p>
        </div>
        <CloudRain aria-hidden="true" className="h-5 w-5 text-sky-600" />
      </div>
      <div className="mt-4 flex h-24 items-end justify-between gap-2" aria-label="แผนภูมิแท่งปริมาณฝนจำลอง">
        {snapshot.rainfallBars.map((bar) => (
          <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-bold text-sky-700">{bar.value}</span>
            <div
              className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-sky-500 to-cyan-300"
              style={{ height: `${Math.max(10, (bar.value / max) * 62)}px` }}
            />
            <span className="text-[9px] font-medium text-slate-500">{bar.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function WatchAreasCard({ snapshot }: { snapshot: WaterWatchSnapshot }) {
  return (
    <article className="rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">พื้นที่ที่ควรเฝ้าระวังเป็นพิเศษ</h2>
          <p className="text-[11px] text-slate-500">ลำดับตัวอย่างเพื่อทดสอบการสื่อสาร</p>
        </div>
        <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-500" />
      </div>
      <ol className="mt-3 space-y-2">
        {snapshot.watchAreas.map((area, index) => {
          const risk = getRiskPresentation(area.risk);
          return (
            <li key={area.name} className="grid grid-cols-[24px_1fr_auto] items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700">{area.name}</p>
                <p className="truncate text-[10px] text-slate-500">{area.detail}</p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${risk.surfaceClass} ${risk.textClass}`}>
                {risk.shortLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

export function WaterWatchDashboard({ snapshot }: { snapshot: WaterWatchSnapshot }) {
  const risk = getRiskPresentation(snapshot.risk);

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-[1920px] flex-col gap-3 bg-gradient-to-b from-sky-50 via-white to-cyan-50 p-3 text-slate-900 sm:p-4 lg:h-[100svh] lg:min-h-0 lg:overflow-hidden lg:p-5"
      data-testid="water-watch-dashboard"
      data-mode={snapshot.mode}
    >
      <header className="grid shrink-0 gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <Hospital aria-hidden="true" className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-700">โรงพยาบาลอุทัย · UTH[AI]-ENV</p>
            <p className="truncate text-sm text-slate-500">ระบบสื่อสารสถานการณ์น้ำสำหรับประชาชน</p>
          </div>
        </div>

        <div className="text-left lg:text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{snapshot.eyebrow}</p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">{snapshot.title}</h1>
        </div>

        <div className="flex items-center justify-start gap-3 lg:justify-end">
          <div className="text-left lg:text-right">
            <p className="text-xs font-bold text-slate-700">{snapshot.updatedLabel}</p>
            <p className="text-[11px] text-slate-500">{snapshot.sourceLabel}</p>
          </div>
          <Database aria-hidden="true" className="h-6 w-6 text-sky-600" />
        </div>
      </header>

      <div
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-center text-xs font-bold text-violet-800"
        role="status"
        data-testid="water-watch-simulated-banner"
      >
        <Database aria-hidden="true" className="h-4 w-4" />
        SIMULATED · ข้อมูลทุกตัวเลขในหน้านี้เป็นข้อมูลจำลองเพื่อทดสอบหน้าจอ — ไม่ใช่สถานการณ์น้ำจริง
      </div>

      <section className="grid shrink-0 gap-3 lg:grid-cols-[1.7fr_repeat(4,minmax(0,1fr))]" aria-label="สรุปสถานการณ์">
        <article className={`rounded-2xl border px-5 py-3 shadow-sm ${risk.surfaceClass}`}>
          <div className="flex h-full items-center gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/80 ${risk.textClass}`}>
              <AlertTriangle aria-hidden="true" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">สถานการณ์จำลอง (อุทัย)</p>
              <p className={`mt-0.5 text-2xl font-black ${risk.textClass}`}>{risk.label}</p>
              <p className="text-[11px] text-slate-600">Scenario สำหรับทดสอบ UI/การสื่อสารเท่านั้น</p>
            </div>
          </div>
        </article>
        {snapshot.metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      <section className="grid min-h-[330px] flex-1 gap-3 lg:min-h-0 lg:grid-cols-[minmax(0,2.25fr)_minmax(310px,0.75fr)]">
        <RiverStory snapshot={snapshot} />
        <AdvicePanel snapshot={snapshot} />
      </section>

      <section className="grid shrink-0 gap-3 lg:h-[235px] lg:grid-cols-[1.15fr_0.9fr_1fr]" aria-label="หลักฐานสนับสนุนตัวอย่าง">
        <ForecastCard snapshot={snapshot} />
        <RainCard snapshot={snapshot} />
        <WatchAreasCard snapshot={snapshot} />
      </section>
    </main>
  );
}
