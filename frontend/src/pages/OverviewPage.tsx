import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AuraCard } from "../components/ui/AuraCard";
import { Skeleton } from "../components/ui/Skeleton";
import { MSymbol } from "../components/ui/MSymbol";
import { useOverview } from "../lib/overview";
import { cn, fmt, thaiDate } from "../lib/utils";

/**
 * Unified Command home (WO-V4b) — landing page per
 * design/unified_central_command_dashboard: one status card per system
 * (Water / Energy / Carbon) with the headline number + status chip,
 * clicking through to the full page. No Emergency Shutdown and no
 * Systems Topology mockup (no-fake-actuation rule) — cards carry only
 * data that exists.
 */
export function OverviewPage() {
  const { water, energy, carbon } = useOverview();

  const waterChip =
    water.status === false || water.anyAlert
      ? { label: "ผิดปกติ", cls: "text-alert-red border-alert-red/50 bg-alert-red/10" }
      : water.status === true
        ? { label: "ปกติ", cls: "text-alert-green border-alert-green/50 bg-alert-green/10" }
        : { label: "ยังไม่บันทึกวันนี้", cls: "text-aura-textMuted border-aura-borderSubtle" };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="aura-text-gradient">UTH[AI]-ENV</span>
          <span className="text-aura-textMain"> ภาพรวมระบบ</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          งานอนามัยสิ่งแวดล้อม โรงพยาบาลอุทัย
          {water.lastDate && <> · บันทึกล่าสุด {thaiDate(water.lastDate)}</>}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── Water ── */}
        <SystemCard
          to="/dashboard"
          icon="water_drop"
          title="บ่อบำบัดน้ำเสีย"
          attention={water.status === false || water.anyAlert}
          chip={
            water.loading ? (
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
            ) : (
              <Chip className={waterChip.cls}>{waterChip.label}</Chip>
            )
          }
          error={water.error}
        >
          <Metric
            value={fmt(water.today?.do_average, 2)}
            unit="mg/L"
            caption="DO เฉลี่ยล่าสุด"
          />
        </SystemCard>

        {/* ── Energy ── */}
        <SystemCard
          to="/carbon"
          icon="bolt"
          title="พลังงานไฟฟ้า"
          chip={
            energy.latest ? (
              <Chip className="text-aura-cyan border-aura-cyan/40 bg-aura-cyan/10">
                {energy.latest.days} วันที่บันทึก
              </Chip>
            ) : null
          }
          error={energy.error}
        >
          {energy.loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <Metric value={fmt(energy.latest?.kwh_total, 0)} unit="kWh" caption="เดือนล่าสุด" />
          )}
        </SystemCard>

        {/* ── Carbon ── */}
        <SystemCard
          to="/carbon"
          icon="co2"
          title="Carbon Footprint"
          chip={
            carbon.latest?.mom_change_pct != null ? (
              <Chip
                className={cn(
                  carbon.latest.mom_change_pct > 0
                    ? "text-alert-amber border-alert-amber/50 bg-alert-amber/10"
                    : "text-alert-green border-alert-green/50 bg-alert-green/10"
                )}
              >
                {carbon.latest.mom_change_pct > 0 ? "+" : ""}
                {fmt(carbon.latest.mom_change_pct, 1)}% MoM
              </Chip>
            ) : null
          }
          error={carbon.error}
        >
          {carbon.loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <Metric value={fmt(carbon.latest?.tco2e, 4)} unit="tCO₂e" caption="เดือนล่าสุด" />
          )}
        </SystemCard>
      </div>

      {/* Quick actions — real destinations only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink to="/form" icon="edit_note" label="บันทึกประจำวัน" />
        <QuickLink to="/readings" icon="history" label="ประวัติ" />
        <QuickLink to="/trends" icon="monitoring" label="แนวโน้ม" />
        <QuickLink to="/reports" icon="description" label="เอกสาร ทส.1/ทส.2" />
      </div>
    </div>
  );
}

function SystemCard({
  to,
  icon,
  title,
  chip,
  attention = false,
  error,
  children,
}: {
  to: string;
  icon: string;
  title: string;
  chip?: ReactNode;
  attention?: boolean;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <Link to={to} className="block group">
      <AuraCard
        aura={attention ? "animated" : "static"}
        className="h-full transition-transform group-hover:-translate-y-0.5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <MSymbol name={icon} className="text-[22px] text-aura-cyan" />
            <span className="font-display font-semibold text-aura-textMain font-thai">{title}</span>
          </div>
          <MSymbol
            name="arrow_forward"
            className="text-[18px] text-aura-textMuted group-hover:text-aura-cyan transition-colors"
          />
        </div>
        {error ? (
          <p className="text-xs text-alert-red font-thai">โหลดไม่สำเร็จ: {error}</p>
        ) : (
          <div className="flex items-end justify-between gap-2">
            {children}
            {chip}
          </div>
        )}
      </AuraCard>
    </Link>
  );
}

function Metric({ value, unit, caption }: { value: string; unit: string; caption: string }) {
  return (
    <div>
      <div className="text-3xl font-display font-bold text-aura-textMain tabular-nums">
        {value}
        <span className="text-sm font-normal text-aura-textMuted ml-1">{unit}</span>
      </div>
      <div className="text-[11px] text-aura-textMuted font-thai mt-0.5">{caption}</div>
    </div>
  );
}

function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-thai font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/30 text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40 transition-colors font-thai text-sm"
    >
      <MSymbol name={icon} className="text-[20px]" />
      {label}
    </Link>
  );
}
