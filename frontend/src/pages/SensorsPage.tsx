import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { AuraCard } from "../components/ui/AuraCard";
import { MSymbol } from "../components/ui/MSymbol";
import { EmptyState } from "../components/ui/EmptyState";
import { useSensorFeed, type SensorSample } from "../lib/use-sensor-feed";
import { EMISSION_FACTOR_KGCO2E_PER_KWH } from "../lib/carbon";
import { useAuraTheme } from "../lib/useAuraTheme";
import { cssVar, cssVarRGB } from "../lib/theme";
import { fmt } from "../lib/utils";

/**
 * SensorsPage (P20d.2) — live telemetry dashboard.
 *
 * Built specifically for the ESP32 + SCT-013 AC power monitor (ADR-0011):
 * the device writes cumulative kWh per sample; this page computes deltas
 * to derive per-bucket consumption, peak vs downtime windows, and the
 * monthly carbon footprint per AC unit.
 *
 * Iron Law #6 (A-Wiki): no real <HOSPITAL>/<ROOM> strings here — sensor
 * codes carry the placeholder themselves (PWR-AC-<ROOM>-NN).
 */

const THAI_HOURS = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "20", "21", "22", "23",
];

/** Peak window 13:00–15:00 (hospital AC afternoon surge). */
const PEAK_HOURS = new Set([13, 14, 15]);
/** Downtime 00:00–05:00. */
const DOWNTIME_HOURS = new Set([0, 1, 2, 3, 4, 5]);

interface HourBucket {
  hour: string;
  kwh: number;
  isPeak: boolean;
  isDowntime: boolean;
}

/** Convert cumulative-kWh samples into hourly kWh buckets by delta. */
function samplesToHourly(samples: SensorSample[]): HourBucket[] {
  // newest-first → chronological for delta math
  const chrono = [...samples].sort(
    (a, b) => +new Date(a.taken_at) - +new Date(b.taken_at),
  );
  const byHour = new Map<number, number>();
  for (let i = 1; i < chrono.length; i++) {
    const prev = chrono[i - 1];
    const curr = chrono[i];
    const delta = curr.value - prev.value;
    if (delta < 0 || delta > 100) continue; // rollover / glitch — skip
    const h = new Date(curr.taken_at).getHours();
    byHour.set(h, (byHour.get(h) ?? 0) + delta);
  }
  return THAI_HOURS.map((label, h) => ({
    hour: label,
    kwh: byHour.get(h) ?? 0,
    isPeak: PEAK_HOURS.has(h),
    isDowntime: DOWNTIME_HOURS.has(h),
  }));
}

function formatKwh(n: number): string {
  return fmt(n, 3);
}

function formatTco2e(kwh: number): string {
  return fmt((kwh * EMISSION_FACTOR_KGCO2E_PER_KWH) / 1000, 3);
}

export function SensorsPage() {
  const { sensors, samplesBySensor, connected, error } = useSensorFeed(288); // 24h @ 5min
  // Recharts takes color strings, not classes — resolve tokens at render time
  // and re-resolve when the theme flips (same pattern as CarbonPage).
  const theme = useAuraTheme();
  const tok = useMemo(
    () => ({
      primary: cssVarRGB("--aura-cyan-dim"),
      grid: cssVarRGB("--aura-border-subtle"),
      axis: cssVarRGB("--aura-text-muted"),
      tooltipBg: cssVar("--aura-body-bg"),
    }),
    [theme],
  );

  // restrict to power/kwh sensors (the only ones this page interprets)
  const powerSensors = useMemo(
    () => sensors.filter((s) => s.parameter_code === "kwh"),
    [sensors],
  );

  const perSensor = useMemo(() => {
    return powerSensors.map((s) => {
      const samples = samplesBySensor.get(s.id) ?? [];
      const hourly = samplesToHourly(samples);
      const totalKwhToday = hourly.reduce((acc, b) => acc + b.kwh, 0);
      const peakKwh = hourly.filter((b) => b.isPeak).reduce((a, b) => a + b.kwh, 0);
      const downtimeKwh = hourly.filter((b) => b.isDowntime).reduce((a, b) => a + b.kwh, 0);
      const lastSample = samples[0];
      return { sensor: s, hourly, totalKwhToday, peakKwh, downtimeKwh, lastSample };
    });
  }, [powerSensors, samplesBySensor]);

  if (error) {
    return (
      <AuraCard>
        <h2 className="font-display font-semibold text-aura-textMain font-thai mb-2">
          เซนเซอร์ (Live)
        </h2>
        <EmptyState
          icon={<MSymbol name="error" className="text-[32px]" />}
          title="เชื่อมต่อ Realtime ไม่ได้"
          description={error}
        />
      </AuraCard>
    );
  }

  if (powerSensors.length === 0) {
    return (
      <AuraCard>
        <h2 className="font-display font-semibold text-aura-textMain font-thai mb-2">
          เซนเซอร์ (Live)
        </h2>
        {/* "bolt" not "sensor" — the Material Symbols subset is generated from
            literal names in src/ (FONTS-1); "sensor" is not in it. */}
        <EmptyState
          icon={<MSymbol name="bolt" className="text-[32px]" />}
          title="ยังไม่มีเซนเซอร์ไฟฟ้าลงทะเบียน"
          description={
            "รอ migration 20260724000001 (PWR-AC-<ROOM>-01) และอุปกรณ์ ESP32 เริ่มส่งข้อมูลเข้า ingest-sensor"
          }
        />
      </AuraCard>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            <MSymbol name="bolt" className="mr-2 inline" />
            เซนเซอร์ไฟฟ้าแอร์ (Live)
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            ข้อมูลจาก ESP32 + SCT-013 → ingest-sensor → Supabase Realtime
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs ${
            connected
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {connected ? "● LIVE" : "● กำลังเชื่อมต่อ"}
        </span>
      </header>

      {perSensor.map(({ sensor, hourly, totalKwhToday, peakKwh, downtimeKwh, lastSample }) => (
        <AuraCard key={sensor.id}>
          <h2 className="font-display font-semibold text-aura-textMain font-thai mb-3">
            {sensor.label_th ?? sensor.code}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Stat label="kWh วันนี้" value={formatKwh(totalKwhToday)} />
            <Stat label="Peak (13–15 น.)" value={formatKwh(peakKwh)} />
            <Stat label="Downtime (0–5 น.)" value={formatKwh(downtimeKwh)} />
            <Stat
              label="Carbon (kgCO₂e)"
              value={formatTco2e(totalKwhToday)}
              hint={`EF=${EMISSION_FACTOR_KGCO2E_PER_KWH}/kWh (TGO 2023)`}
            />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={tok.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={tok.primary} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={tok.grid} />
                <XAxis dataKey="hour" stroke={tok.axis} fontSize={11} />
                <YAxis stroke={tok.axis} fontSize={11} width={48} />
                <Tooltip
                  contentStyle={{ background: tok.tooltipBg, borderRadius: 8 }}
                  // recharts types the value as ValueType | undefined; narrow
                  // here rather than lying with a `number` annotation.
                  formatter={(v) => [
                    `${formatKwh(typeof v === "number" ? v : NaN)} kWh`,
                    "ในชั่วโมงนี้",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="kwh"
                  stroke={tok.primary}
                  fill={`url(#grad-${sensor.id})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-2">
            {lastSample
              ? `อัปเดตล่าสุด ${new Date(lastSample.taken_at).toLocaleString("th-TH")}`
              : "ยังไม่มีข้อมูล"}
            {" · "}
            <code>{sensor.code}</code> · หน่วย {sensor.unit}
          </p>
        </AuraCard>
      ))}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <div className="text-[10px] text-[var(--text-muted)] mt-1">{hint}</div>}
    </div>
  );
}
