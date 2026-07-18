import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { AuraCard } from "../components/ui/AuraCard";
import { MSymbol } from "../components/ui/MSymbol";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { EMISSION_FACTOR_KGCO2E_PER_KWH, useCarbonMonthly } from "../lib/carbon";
import { cssVar, cssVarRGB } from "../lib/theme";
import { useAuraTheme } from "../lib/useAuraTheme";
import { cn, fmt } from "../lib/utils";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                     "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** "YYYY-MM" → "ม.ค. 69" (Thai-BE short). */
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${THAI_MONTHS[(m ?? 1) - 1]} ${String(y + 543).slice(-2)}`;
}

/**
 * Carbon Footprint page (WO-V2b) — per design/carbon_footprint_* screens.
 * All numbers come from carbon.reading via useCarbonMonthly (V2a):
 * tCO₂e = kWh × TGO grid EF. No LIVE badge (manual daily data) and no
 * mock activity cards — only data that exists.
 */
export function CarbonPage() {
  const [months, setMonths] = useState(12);
  const { data, loading, error } = useCarbonMonthly(months);

  const theme = useAuraTheme();
  const tok = useMemo(
    () => ({
      grid: cssVarRGB("--aura-border-subtle"),
      axis: cssVarRGB("--aura-text-muted"),
      bar: cssVarRGB("--aura-cyan-dim"),
      tooltip: {
        background: cssVar("--aura-body-bg"),
        border: `1px solid ${cssVarRGB("--aura-border-subtle")}`,
        borderRadius: 8,
        color: cssVarRGB("--aura-text-main"),
      },
    }),
    [theme]
  );

  const latest = data?.months.length ? data.months[data.months.length - 1] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">Carbon</span>
            <span className="aura-text-gradient"> Footprint</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            คำนวณจากไฟฟ้าระบบบำบัด × ค่า EF {EMISSION_FACTOR_KGCO2E_PER_KWH} kgCO₂e/kWh (TGO)
            {latest && <> · ข้อมูลถึง {monthLabel(latest.month)}</>}
          </p>
        </div>
        <div className="flex gap-2">
          {[6, 12, 24].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-thai font-medium border transition-colors",
                months === m
                  ? "aura-bg-gradient border-transparent"
                  : "bg-aura-bg/40 border-aura-borderSubtle text-aura-textMuted hover:text-aura-textMain"
              )}
            >
              {m} เดือน
            </button>
          ))}
        </div>
      </header>

      {error && (
        <AuraCard>
          <p className="text-sm text-alert-red font-thai">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        </AuraCard>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : !data || data.months.length === 0 ? (
        <AuraCard>
          <EmptyState
            icon={<MSymbol name="co2" className="text-[32px]" />}
            title="ยังไม่มีข้อมูลไฟฟ้า"
            description="เมื่อมีการบันทึกค่าไฟฟ้าในแบบฟอร์มประจำวัน ระบบจะคำนวณ carbon footprint ให้อัตโนมัติ"
          />
        </AuraCard>
      ) : (
        <>
          {/* KPI cards — per the carbon screens (3 tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AuraCard aura={latest && (latest.mom_change_pct ?? 0) > 10 ? "animated" : "static"}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-aura-textMuted font-thai">
                  เดือนล่าสุด
                </span>
                <MSymbol name="co2" className="text-[20px] text-aura-textMuted" />
              </div>
              <div className="mt-2 text-3xl font-display font-bold text-aura-textMain tabular-nums">
                {fmt(latest?.tco2e, 4)}
                <span className="text-sm font-normal text-aura-textMuted ml-1">tCO₂e</span>
              </div>
              {latest?.mom_change_pct != null && (
                <div
                  className={cn(
                    "mt-1 text-xs font-thai flex items-center gap-1",
                    latest.mom_change_pct > 0 ? "text-alert-amber" : "text-alert-green"
                  )}
                >
                  <MSymbol
                    name={latest.mom_change_pct > 0 ? "trending_up" : "trending_down"}
                    className="text-[16px]"
                  />
                  {latest.mom_change_pct > 0 ? "+" : ""}
                  {fmt(latest.mom_change_pct, 1)}% เทียบเดือนก่อน
                </div>
              )}
            </AuraCard>

            <AuraCard>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-aura-textMuted font-thai">
                  ไฟฟ้าเดือนล่าสุด
                </span>
                <MSymbol name="bolt" className="text-[20px] text-aura-textMuted" />
              </div>
              <div className="mt-2 text-3xl font-display font-bold text-aura-textMain tabular-nums">
                {fmt(latest?.kwh_total, 0)}
                <span className="text-sm font-normal text-aura-textMuted ml-1">kWh</span>
              </div>
              <div className="mt-1 text-xs text-aura-textMuted font-thai">
                {latest?.days ?? 0} วันที่มีการบันทึก
              </div>
            </AuraCard>

            <AuraCard>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-aura-textMuted font-thai">
                  รวม {months} เดือน
                </span>
                <MSymbol name="monitoring" className="text-[20px] text-aura-textMuted" />
              </div>
              <div className="mt-2 text-3xl font-display font-bold text-aura-textMain tabular-nums">
                {fmt(data.tco2e_total_period, 3)}
                <span className="text-sm font-normal text-aura-textMuted ml-1">tCO₂e</span>
              </div>
              <div className="mt-1 text-xs text-aura-textMuted font-thai">
                จากไฟฟ้า {fmt(data.kwh_total_period, 0)} kWh
              </div>
            </AuraCard>
          </div>

          {/* Monthly emissions bar chart */}
          <AuraCard>
            <h2 className="font-display font-semibold text-aura-textMain mb-3 font-thai">
              การปล่อย tCO₂e รายเดือน
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.months} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={tok.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} stroke={tok.axis} tick={{ fontSize: 10 }} />
                  <YAxis stroke={tok.axis} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={tok.tooltip}
                    labelFormatter={(v) => monthLabel(String(v))}
                    formatter={(v: unknown) => [`${fmt(Number(v), 4)} tCO₂e`, "การปล่อย"]}
                    cursor={{ fill: cssVarRGB("--aura-cyan", 0.08) }}
                  />
                  <Bar dataKey="tco2e" fill={tok.bar} radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AuraCard>
        </>
      )}
    </div>
  );
}
