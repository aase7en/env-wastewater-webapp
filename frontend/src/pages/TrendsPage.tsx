import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { AuraCard } from "../components/ui/AuraCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { supabase } from "../lib/supabase";
import { cssVar, cssVarRGB } from "../lib/theme";
import { useAuraTheme } from "../lib/useAuraTheme";
import { fmt, thaiDate } from "../lib/utils";

interface ReadingPoint {
  reading_date: string;
  do_average: number | null;
  ph: number | null;
  free_chlorine: number | null;
  wastewater_in: number | null;
  water_used_total: number | null;
  tds_aeration: number | null;
}

const NUM = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? null : n;
};

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                     "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function monthLabel(iso: string): string {
  const d = new Date(iso);
  return `${THAI_MONTHS[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`;
}

export function TrendsPage() {
  const [data, setData] = useState<ReadingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 365 days pulls ~12 months of daily points — plenty for trend lines.
  const [days, setDays] = useState(365);

  // Recharts takes color strings (SVG attributes), so token colors are
  // resolved at render; useAuraTheme re-renders this page on toggle.
  const theme = useAuraTheme();
  const tok = useMemo(
    () => ({
      grid: cssVarRGB("--aura-border-subtle"),
      axis: cssVarRGB("--aura-text-muted"),
      tooltip: {
        background: cssVar("--aura-body-bg"),
        border: `1px solid ${cssVarRGB("--aura-border-subtle")}`,
        borderRadius: 8,
        color: cssVarRGB("--aura-text-main"),
      },
      cyan: cssVarRGB("--aura-cyan"),
      lime: cssVarRGB("--aura-lime"),
    }),
    [theme]
  );

  useEffect(() => {
    setLoading(true);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    supabase
      .from("v_dashboard_14day")
      .select("reading_date, do_average, ph, free_chlorine, wastewater_in, water_used_total, tds_aeration")
      .gte("reading_date", cutoff.toISOString().slice(0, 10))
      .order("reading_date", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else {
          setData(
            (data ?? []).map((r: ReadingPoint) => ({
              reading_date: r.reading_date,
              do_average: NUM(r.do_average),
              ph: NUM(r.ph),
              free_chlorine: NUM(r.free_chlorine),
              wastewater_in: NUM(r.wastewater_in),
              water_used_total: NUM(r.water_used_total),
              tds_aeration: NUM(r.tds_aeration),
            }))
          );
        }
        setLoading(false);
      });
  }, [days]);

  const chartData = useMemo(() => data, [data]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">แนวโน้ม</span>
            <span className="aura-text-gradient"> รายเดือน</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            กราฟแสดงค่าคุณภาพน้ำย้อนหลัง · {chartData.length} จุด
          </p>
        </div>
        <div className="flex gap-2">
          {[90, 180, 365].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={
                "px-3 py-1.5 rounded-lg text-xs font-thai font-medium border transition-colors " +
                (days === d
                  ? "aura-bg-gradient text-aura-bg border-transparent"
                  : "bg-aura-bg/40 border-aura-borderSubtle text-aura-textMuted hover:text-aura-textMain")
              }
            >
              {d} วัน
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
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : chartData.length === 0 ? (
        <AuraCard>
          <EmptyState
            title="ยังไม่มีข้อมูล"
            description="ต้องมีการบันทึกค่าคุณภาพน้ำอย่างน้อย 1 วันจึงจะแสดงแนวโน้มได้"
          />
        </AuraCard>
      ) : (
        <>
          {/* Water quality chart */}
          <AuraCard>
            <h2 className="font-display font-semibold text-aura-textMain mb-3 font-thai">
              คุณภาพน้ำ (DO, pH, Cl, TDS)
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={tok.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="reading_date" tickFormatter={monthLabel} stroke={tok.axis} tick={{ fontSize: 10 }} />
                  <YAxis stroke={tok.axis} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={tok.tooltip}
                    labelFormatter={(v) => thaiDate(String(v))}
                    formatter={(v) => fmt(NUM(v), 2)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={2.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "DO min 2.0", fontSize: 9, fill: "#ef4444" }} />
                  <Line type="monotone" dataKey="do_average" name="DO เฉลี่ย (mg/L)" stroke={tok.cyan} dot={false} strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="ph" name="pH" stroke={tok.lime} dot={false} strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="free_chlorine" name="Cl อิสระ (mg/L)" stroke="#f59e0b" dot={false} strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AuraCard>

          {/* Volume chart */}
          <AuraCard>
            <h2 className="font-display font-semibold text-aura-textMain mb-3 font-thai">
              ปริมาณน้ำ (เข้าระบบ / ใช้)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={tok.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="reading_date" tickFormatter={monthLabel} stroke={tok.axis} tick={{ fontSize: 10 }} />
                  <YAxis stroke={tok.axis} tick={{ fontSize: 10 }} unit=" m³" />
                  <Tooltip
                    contentStyle={tok.tooltip}
                    labelFormatter={(v) => thaiDate(String(v))}
                    formatter={(v) => fmt(NUM(v), 1)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="wastewater_in" name="น้ำเข้าระบบ (m³)" stroke="#0ea5e9" dot={false} strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="water_used_total" name="น้ำที่ใช้ (m³)" stroke="#22c55e" dot={false} strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AuraCard>
        </>
      )}
    </div>
  );
}
