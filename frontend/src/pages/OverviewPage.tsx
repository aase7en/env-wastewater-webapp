import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AuraCard } from "../components/ui/AuraCard";
import { Skeleton } from "../components/ui/Skeleton";
import { MSymbol } from "../components/ui/MSymbol";
import { useOverview } from "../lib/overview";
import { cn, fmt, thaiDate } from "../lib/utils";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function thaiMonth(month: string | null | undefined): string | null {
  if (!month) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return month;
  return `${THAI_MONTHS[monthIndex]} ${year + 543}`;
}

/**
 * ENV-CMD-002 — Hospital Overview command-center vertical slice.
 *
 * Composition only: it reuses existing Overview data and real routes. It does
 * not create new source semantics, thresholds, provider metadata, or a second
 * Digital Twin Canvas. Latest/manual evidence stays explicitly scoped to its
 * reference date and is never promoted to live/current without a freshness
 * contract.
 */
export function OverviewPage() {
  const { water, energy, carbon } = useOverview();

  const waterAttention = water.status === false || water.anyAlert;
  const waterStatus = waterAttention
    ? { label: "บันทึกล่าสุด: ผิดปกติ", cls: "text-alert-red border-alert-red/50 bg-alert-red/10" }
    : water.status === true
      ? { label: "บันทึกล่าสุด: ปกติ", cls: "text-alert-green border-alert-green/50 bg-alert-green/10" }
      : { label: "ยังไม่ทราบสถานะ", cls: "text-aura-textMuted border-aura-borderSubtle" };

  const energyMonthLabel = thaiMonth(energy.latest?.month);
  const carbonMonthLabel = thaiMonth(carbon.latest?.month);

  return (
    <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold font-display tracking-tight md:text-3xl">
          <span className="aura-text-gradient">UTH[AI]-ENV</span>
          <span className="text-aura-textMain"> ศูนย์บัญชาการสิ่งแวดล้อม</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai">
          งานอนามัยสิ่งแวดล้อม โรงพยาบาลอุทัย · แสดงหลักฐานล่าสุดตามแต่ละแหล่งข้อมูล ไม่ใช่สถานะ Live รวมทั้งโรงพยาบาล
        </p>
      </header>

      <section data-testid="overview-situation-grid" aria-labelledby="overview-situation-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="overview-situation-title" className="font-display text-lg font-semibold text-aura-textMain font-thai">
              สถานการณ์จากหลักฐานที่มี
            </h2>
            <p className="text-xs text-aura-textMuted font-thai">ดูวัน/ช่วงเวลาอ้างอิงของแต่ละการ์ดก่อนใช้ตัดสินใจ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SystemCard
            testId="overview-water-card"
            to="/dashboard"
            icon="water_drop"
            title="บ่อบำบัดน้ำเสีย"
            attention={waterAttention}
            chip={
              water.loading ? (
                <Skeleton className="h-7 w-28 shrink-0 rounded-full" />
              ) : (
                <Chip className={waterStatus.cls}>{waterStatus.label}</Chip>
              )
            }
            error={water.error}
          >
            {water.loading ? (
              <MetricSkeleton />
            ) : (
              <>
                <Metric value={fmt(water.today?.do_average, 2)} unit="mg/L" caption="DO เฉลี่ยล่าสุด" />
                <EvidenceLine>
                  {water.lastDate ? `วันที่อ้างอิง ${thaiDate(water.lastDate)}` : "ยังไม่มีวันที่อ้างอิงที่เชื่อถือได้"}
                </EvidenceLine>
              </>
            )}
          </SystemCard>

          <SystemCard
            testId="overview-energy-card"
            to="/carbon"
            icon="bolt"
            title="พลังงานไฟฟ้า"
            chip={
              energy.latest ? (
                <Chip className="border-aura-cyan/40 bg-aura-cyan/10 text-aura-cyan">
                  {energy.latest.days} รายการ
                </Chip>
              ) : null
            }
            error={energy.error}
          >
            {energy.loading ? (
              <MetricSkeleton />
            ) : (
              <>
                <Metric value={fmt(energy.latest?.kwh_total, 0)} unit="kWh" caption="ยอดรวมของเดือนล่าสุด" />
                <EvidenceLine>{energyMonthLabel ? `ช่วงเวลา ${energyMonthLabel}` : "ยังไม่มีช่วงเวลาอ้างอิง"}</EvidenceLine>
              </>
            )}
          </SystemCard>

          <SystemCard
            testId="overview-carbon-card"
            to="/carbon"
            icon="co2"
            title="Carbon Footprint"
            chip={
              carbon.latest?.mom_change_pct != null ? (
                <Chip
                  className={cn(
                    carbon.latest.mom_change_pct > 0
                      ? "border-alert-amber/50 bg-alert-amber/10 text-alert-amber"
                      : "border-alert-green/50 bg-alert-green/10 text-alert-green",
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
              <MetricSkeleton />
            ) : (
              <>
                <Metric value={fmt(carbon.latest?.tco2e, 4)} unit="tCO₂e" caption="เดือนล่าสุด" />
                <EvidenceLine>
                  {carbonMonthLabel ? `ช่วงเวลา ${carbonMonthLabel} · provenance ระดับ provider ยังไม่พร้อมใน view นี้` : "ยังไม่มีช่วงเวลาอ้างอิง"}
                </EvidenceLine>
              </>
            )}
          </SystemCard>
        </div>
      </section>

      <section data-testid="overview-attention" aria-labelledby="overview-attention-title">
        <AuraCard className={cn("p-4 sm:p-5", waterAttention ? "border-alert-red/35" : "border-aura-borderSubtle")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 id="overview-attention-title" className="font-display text-base font-semibold text-aura-textMain font-thai">
                สิ่งที่ต้องตรวจสอบ
              </h2>
              {water.error ? (
                <p className="mt-1 text-sm text-alert-red font-thai">โหลดข้อมูลระบบบำบัดไม่สำเร็จ จึงยังประเมินสถานะจากแหล่งนี้ไม่ได้</p>
              ) : waterAttention ? (
                <p className="mt-1 text-sm text-alert-red font-thai">บันทึกล่าสุดของระบบบำบัดมีสถานะผิดปกติหรือ alert ที่ต้องตรวจสอบ</p>
              ) : water.status === true ? (
                <p className="mt-1 text-sm text-aura-textMuted font-thai">
                  บันทึกล่าสุดของระบบบำบัดไม่พบ alert ที่ระบบยืนยัน{water.lastDate ? ` ณ ${thaiDate(water.lastDate)}` : ""} — ข้อความนี้ไม่ใช่การยืนยันสถานะปัจจุบัน
                </p>
              ) : (
                <p className="mt-1 text-sm text-aura-textMuted font-thai">ยังไม่มีหลักฐานเพียงพอสำหรับสรุปสถานะระบบบำบัด</p>
              )}
            </div>
            {(waterAttention || water.error) && (
              <Link
                to="/dashboard"
                data-command-action="true"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-aura-cyan/40 px-4 py-2 text-sm font-semibold text-aura-cyan transition-colors hover:bg-aura-cyan/10 font-thai"
              >
                ตรวจสอบระบบบำบัด
                <MSymbol name="arrow_forward" className="text-[18px]" />
              </Link>
            )}
          </div>
        </AuraCard>
      </section>

      <section data-testid="overview-spatial-entry" aria-labelledby="overview-spatial-title">
        <AuraCard className="p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <MSymbol name="view_in_ar" className="text-[24px] text-aura-cyan" />
                <h2 id="overview-spatial-title" className="font-display text-lg font-semibold text-aura-textMain font-thai">Digital Twin / Process</h2>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-aura-textMuted font-thai">
                เปิดบริบทเชิงพื้นที่และผังกระบวนการของระบบบำบัดน้ำเสียในหน้าที่มี 3D runtime โดยตรง หน้าภาพรวมนี้ไม่สร้าง Canvas หรือจำลองสถานะการเดินเครื่อง
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
              <Link
                to="/dashboard"
                data-command-action="true"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-aura-cyan px-4 py-2 text-sm font-semibold text-aura-onAccent transition-opacity hover:opacity-90 font-thai"
              >
                เปิดมุมมอง Digital Twin / Process
                <MSymbol name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                to="/flow"
                data-command-action="true"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-aura-cyan/40 px-4 py-2 text-sm font-semibold text-aura-cyan transition-colors hover:bg-aura-cyan/10 font-thai"
              >
                เปิด Environmental Flow
                <MSymbol name="account_tree" className="text-[18px]" />
              </Link>
            </div>
          </div>
        </AuraCard>
      </section>

      <section data-testid="overview-domain-links" aria-labelledby="overview-domains-title" className="space-y-3">
        <div>
          <h2 id="overview-domains-title" className="font-display text-lg font-semibold text-aura-textMain font-thai">ระบบสิ่งแวดล้อมอื่น</h2>
          <p className="text-xs text-aura-textMuted font-thai">เข้าสู่ข้อมูลจริงของแต่ละโมดูล โดยยังไม่สร้าง KPI สรุปที่ไม่มี contract รองรับ</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DomainLink to="/garbage" icon="delete" title="ขยะ" description="บันทึกและหลักฐานการจัดการขยะ" />
          <DomainLink to="/fuel" icon="local_gas_station" title="เชื้อเพลิง" description="บันทึกการใช้เชื้อเพลิง" />
          <DomainLink to="/water-supply" icon="water" title="น้ำประปา" description="บันทึกการใช้น้ำและคุณภาพงานที่เกี่ยวข้อง" />
          <DomainLink to="/safety" icon="health_and_safety" title="ความปลอดภัย" description="ตรวจสอบและบันทึกงานความปลอดภัย" />
        </div>
      </section>

      <section data-testid="overview-supporting-actions" aria-labelledby="overview-actions-title" className="space-y-3">
        <h2 id="overview-actions-title" className="font-display text-base font-semibold text-aura-textMain font-thai">บันทึกและหลักฐานสนับสนุน</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickLink to="/form" icon="edit_note" label="บันทึกประจำวัน" />
          <QuickLink to="/readings" icon="history" label="ประวัติ" />
          <QuickLink to="/trends" icon="monitoring" label="แนวโน้ม" />
          <QuickLink to="/reports" icon="description" label="เอกสาร ทส.1/ทส.2" />
        </div>
      </section>
    </div>
  );
}

function SystemCard({
  testId,
  to,
  icon,
  title,
  chip,
  attention = false,
  error,
  children,
}: {
  testId: string;
  to: string;
  icon: string;
  title: string;
  chip?: ReactNode;
  attention?: boolean;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <Link to={to} data-testid={testId} className="block min-w-0 group">
      <AuraCard aura={attention ? "animated" : "static"} className="h-full min-w-0 transition-transform group-hover:-translate-y-0.5">
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <MSymbol name={icon} className="shrink-0 text-[22px] text-aura-cyan" />
            <span className="min-w-0 font-display font-semibold text-aura-textMain font-thai">{title}</span>
          </div>
          <MSymbol name="arrow_forward" className="shrink-0 text-[18px] text-aura-textMuted transition-colors group-hover:text-aura-cyan" />
        </div>
        {error ? (
          <p className="text-xs text-alert-red font-thai">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">{children}</div>
              {chip}
            </div>
          </div>
        )}
      </AuraCard>
    </Link>
  );
}

function Metric({ value, unit, caption }: { value: string; unit: string; caption: string }) {
  return (
    <div className="min-w-0">
      <div className="break-words text-3xl font-display font-bold text-aura-textMain tabular-nums">
        {value}
        <span className="ml-1 text-sm font-normal text-aura-textMuted">{unit}</span>
      </div>
      <div className="mt-0.5 text-[11px] text-aura-textMuted font-thai">{caption}</div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function EvidenceLine({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs leading-relaxed text-aura-textMuted font-thai">{children}</p>;
}

function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold font-thai", className)}>{children}</span>
  );
}

function DomainLink({ to, icon, title, description }: { to: string; icon: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group flex min-h-20 items-start gap-3 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/30 p-4 transition-colors hover:border-aura-cyan/40"
    >
      <MSymbol name={icon} className="shrink-0 text-[22px] text-aura-cyan" />
      <span className="min-w-0">
        <span className="block font-display text-sm font-semibold text-aura-textMain font-thai">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-aura-textMuted font-thai">{description}</span>
      </span>
    </Link>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center gap-2.5 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/30 px-4 py-3 text-sm text-aura-textMuted transition-colors hover:border-aura-cyan/40 hover:text-aura-cyan font-thai"
    >
      <MSymbol name={icon} className="text-[20px]" />
      {label}
    </Link>
  );
}
