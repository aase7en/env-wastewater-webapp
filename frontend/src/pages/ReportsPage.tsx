import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { toLocalISODate, fmt } from "../lib/utils";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { MSymbol } from "../components/ui/MSymbol";
import { Field, Input, Select, Textarea } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import {
  fetchDashboardByMonth,
  fetchOverviewCarbon,
  fetchReadingDetailRange,
  fetchMeterChainRange,
  fetchCriticalFlagsRange,
  fetchWaterSupplyChainRange,
  type OverviewCarbonRow,
} from "../lib/supabase-queries";
import {
  ENERGY_DELTA_PROVENANCE,
  buildMonthlyEnergy,
  buildWastewaterSummary,
  buildWaterSupplySummary,
  countFlagHits,
  summarizeCarbonOverview,
  thaiRangeLabel,
  type CarbonOverviewSummary,
  type FlagClassCounts,
  type MonthlyPoint,
  type ReportCriticalFlagRow,
  type WaterSupplySummary,
  type WastewaterSummary,
} from "../lib/report-summary";
// Type-only import stays static (no runtime bundle cost). Functions are
// dynamically imported inside onDownload so jspdf/html2canvas only load
// when the user actually clicks "ดาวน์โหลด PDF".
import type { RepairRequestInput } from "../lib/pdf";
// ENV-PARITY-P2-005 — the additive safety+coliform numeric summary
// section (own state + fetch, mounted after the P1.6 summary block).
import { SafetyColiformSummarySection } from "../components/reports/SafetyColiformSummarySection";

const THRESHOLD_FLAG_LABELS: Array<{ key: keyof FlagClassCounts; label: string }> = [
  { key: "critical_do1", label: "Critical DO-1 (บ่อเติมอากาศ)" },
  { key: "critical_do2", label: "Critical DO-2 (บ่อตกตะกอน)" },
  { key: "critical_do3", label: "Critical DO-3 (น้ำก่อนทิ้ง)" },
  { key: "critical_free_chlorine_low", label: "Critical คลอรีนอิสระต่ำ" },
  { key: "critical_free_chlorine_high", label: "Critical คลอรีนอิสระสูง" },
  { key: "critical_tds2", label: "Critical TDS-2" },
  { key: "critical_ph", label: "Critical pH" },
  { key: "immediate_sv30", label: "ทันที: SV30 ผิดปกติ" },
  { key: "immediate_wastewater_in", label: "ทันที: น้ำเข้า overload" },
];

/** AppSheet range pickers init TODAY() (ref 1632–1646 / 2756–2770); the
 *  lane default renders the CURRENT MONTH (เดือนปัจจุบัน): start = 1st,
 *  end = today — both endpoints inclusive and user-editable. */
function currentMonthRange(): { start: string; end: string } {
  const today = toLocalISODate();
  return { start: `${today.slice(0, 8)}01`, end: today };
}

interface RangeSummaryState {
  startISO: string;
  endISO: string;
  ww: WastewaterSummary;
  ws: WaterSupplySummary;
  monthly: MonthlyPoint[];
  flags: FlagClassCounts | null;
  flagsError: string | null;
  carbon: CarbonOverviewSummary | null;
  carbonError: string | null;
}

const TEMPLATES = [
  {
    key: "ts1",
    code: "ทส.1",
    title: "บันทึกการตรวจวัดรายวัน",
    description: "ตารางค่า DO/pH/Cl/TDS/ปริมาณน้ำ รายวันของเดือนที่เลือก",
  },
  {
    key: "ts2",
    code: "ทส.2",
    title: "สรุปการตรวจวัดรายเดือน",
    description: "ค่าเฉลี่ย + จำนวนวันผิดปกติ + ปริมาณน้ำรวมของเดือน",
  },
  {
    key: "repair",
    code: "ใบแจ้งซ่อม",
    title: "ใบแจ้งซ่อมอุปกรณ์",
    description: "ฟอร์มแจ้งซ่อมแบบ standalone — กรอกเอง + ดาวน์โหลด PDF",
  },
] as const;

type TemplateKey = (typeof TEMPLATES)[number]["key"];

const THIS_MONTH = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${months[(m || 1) - 1]} ${y + 543}`;
}

export function ReportsPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<TemplateKey>("ts1");
  const [month, setMonth] = useState(THIS_MONTH);
  // C3 follow-up (2026-08-03): the previous useDashboard(60) capped the page
  // at the latest 60 days, so any month older than ~2 months came back empty
  // ("ไม่มีข้อมูล") even when the DB had the rows. Fetch the exact month on
  // download instead — any historical month works now.
  const [downloading, setDownloading] = useState(false);

  // ─── P1.6 date-range summary state (รายงานสรุปช่วงวัน) ───
  const defaultRange = currentMonthRange();
  const [rangeStart, setRangeStart] = useState(defaultRange.start);
  const [rangeEnd, setRangeEnd] = useState(defaultRange.end);
  const [generating, setGenerating] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RangeSummaryState | null>(null);

  // Repair request form state
  const [repair, setRepair] = useState<RepairRequestInput>({
    date: toLocalISODate(),
    cause: "",
    equipment: "",
    reporter: "",
    status: "open",
  });

  const onDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      // Fetch the exact selected month (YYYY-MM) — no rolling-window cap.
      const monthRows = (selected === "ts1" || selected === "ts2")
        ? await fetchDashboardByMonth(month)
        : [];
      if ((selected === "ts1" || selected === "ts2") && monthRows.length === 0) {
        toast.warning(`ไม่มีข้อมูลในเดือน ${monthLabel(month)}`);
        return;
      }
      const label = monthLabel(month);
      // Dynamic import — pdf.ts pulls jspdf + html2canvas (~600KB). Loading
      // only on demand keeps the Reports page bundle small.
      const { downloadPDF, generateRepairRequest, generateTs1, generateTs2 } =
        await import("../lib/pdf");
      if (selected === "ts1") {
        downloadPDF(generateTs1(monthRows, label), `ทส.1_${month}.pdf`);
        toast.success(`ดาวน์โหลด ทส.1 เดือน ${label} แล้ว`);
      } else if (selected === "ts2") {
        downloadPDF(generateTs2(monthRows, label), `ทส.2_${month}.pdf`);
        toast.success(`ดาวน์โหลด ทส.2 เดือน ${label} แล้ว`);
      } else {
        if (!repair.cause.trim()) {
          toast.error("กรุณากรอกสาเหตุการแจ้งซ่อม");
          return;
        }
        downloadPDF(generateRepairRequest(repair), `ใบแจ้งซ่อม_${repair.date}.pdf`);
        toast.success("ดาวน์โหลดใบแจ้งซ่อมแล้ว");
      }
    } catch (e) {
      toast.error(`สร้าง PDF ไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDownloading(false);
    }
  };

  /** P1.6 — aggregate the date-range summary from the existing views
   *  (client-side per WO D1-1; the lib only aggregates view-provided
   *  values, never re-derives). Threshold flags / CO2 failures render as
   *  honest inline notices instead of silently disappearing. */
  const onGenerate = async () => {
    if (generating) return;
    if (rangeStart > rangeEnd) {
      toast.warning("วันเริ่มต้องไม่เกินวันสิ้นสุด");
      return;
    }
    setGenerating(true);
    setRangeError(null);
    try {
      let flagsError: string | null = null;
      const [readings, chain, waterChain, flagRows, carbonRows] = await Promise.all([
        fetchReadingDetailRange(rangeStart, rangeEnd),
        fetchMeterChainRange(rangeStart, rangeEnd),
        fetchWaterSupplyChainRange(rangeStart, rangeEnd),
        fetchCriticalFlagsRange(rangeStart, rangeEnd).catch((e): ReportCriticalFlagRow[] | null => {
          // D1-5 (recorded deviation): the flags view has no public façade
          // yet — the notice states this honestly, never a silent absence.
          flagsError =
            e instanceof Error && /not found|404/i.test(e.message)
              ? "ยังไม่พร้อมใช้ — ต้องมี public façade ของ v_reading_critical_flags (รอการอนุมัติเป็น migration แยก)"
              : `ดึงข้อมูลธงวิกฤตไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`;
          return null;
        }),
        fetchOverviewCarbon().catch((): OverviewCarbonRow[] | null => null),
      ]);
      const yearCE = Number(rangeStart.slice(0, 4));
      setSummary({
        startISO: rangeStart,
        endISO: rangeEnd,
        ww: buildWastewaterSummary({ startISO: rangeStart, endISO: rangeEnd, readings, chain }),
        ws: buildWaterSupplySummary({ startISO: rangeStart, endISO: rangeEnd, chain: waterChain }),
        monthly: buildMonthlyEnergy(chain, yearCE),
        flags: flagRows ? countFlagHits(flagRows) : null,
        flagsError: flagRows ? null : flagsError,
        carbon: carbonRows ? summarizeCarbonOverview(carbonRows, yearCE, yearCE - 1) : null,
        carbonError: carbonRows ? null : "ดึงข้อมูลคาร์บอนไม่สำเร็จ",
      });
    } catch (e) {
      setRangeError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="text-aura-textMain">เอกสาร</span>
          <span className="aura-text-gradient"> รายงาน</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          สร้างและดาวน์โหลดเอกสารรายงานในรูปแบบ PDF — ทำงานในเบราว์เซอร์ ไม่ต้องส่งข้อมูลออกเซิร์ฟเวอร์
        </p>
      </header>

      {/* ─── P1.6 date-range numeric summary (รายงานสรุปช่วงวัน) ───
          AppSheet Filter_Water / tap water_Filter numeric layer (ref
          1544–2383 / 2708–2960). Aggregates view-provided values only;
          missing days counted, never 0-filled. NO PDF here (Phase 4). */}
      <div data-testid="report-summary-controls">
      <AuraCard className="space-y-4">
        <div>
          <h2 className="font-display font-semibold text-aura-textMain font-thai flex items-center gap-2">
            <MSymbol name="summarize" className="text-[18px] text-aura-cyan" />
            สรุปช่วงวัน (ตัวเลข)
          </h2>
          <p className="text-xs text-aura-textMuted font-thai mt-1">
            รวมตัวเลขช่วงวันที่เลือกจากบันทึกจริง — วันที่ไม่มีบันทึกจะถูกนับแยกต่างหาก ไม่ถูกแทนด้วยศูนย์
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <Field label="วันเริ่ม" required>
            <Input
              type="date"
              data-testid="report-range-start"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            />
          </Field>
          <Field label="วันสิ้นสุด" required>
            <Input
              type="date"
              data-testid="report-range-end"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
            />
          </Field>
          <Button onClick={onGenerate} disabled={generating} data-testid="report-generate">
            <MSymbol name="calculate" className="text-[16px]" /> สรุปข้อมูล
          </Button>
        </div>

        {rangeError && (
          <p className="text-sm text-alert-red font-thai" data-testid="report-range-error">
            สรุปข้อมูลไม่สำเร็จ: {rangeError}
          </p>
        )}
      </AuraCard>
      </div>

      {summary && (
        <div className="space-y-4" data-testid="report-summary-section">
          <p className="text-sm text-aura-textMuted font-thai" data-testid="report-range-label">
            ช่วงวันที่: {thaiRangeLabel(summary.startISO, summary.endISO)} (พ.ศ.)
          </p>

          {/* Honesty line — missing days counted and shown (WO §2.4-1) */}
          <AuraCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-thai" data-testid="report-honesty-card">
              <div>
                <span className="text-aura-textMuted">บ่อบำบัด: </span>
                มีบันทึก <span className="font-bold text-aura-textMain" data-testid="report-recorded-days-w">{summary.ww.recordedDays}</span> วัน ·
                ไม่มีบันทึก <span className="font-bold text-alert-red" data-testid="report-missing-days-w">{summary.ww.missingDays}</span> วัน
                <span className="text-aura-textMuted"> (ทั้งหมด {summary.ww.totalDays} วัน)</span>
              </div>
              <div>
                <span className="text-aura-textMuted">น้ำประปา: </span>
                มีบันทึก <span className="font-bold text-aura-textMain" data-testid="report-recorded-days-ws">{summary.ws.recordedDays}</span> วัน ·
                ไม่มีบันทึก <span className="font-bold text-alert-red" data-testid="report-missing-days-ws">{summary.ws.missingDays}</span> วัน
                <span className="text-aura-textMuted"> (ทั้งหมด {summary.ws.totalDays} วัน)</span>
              </div>
            </div>
          </AuraCard>

          {/* บ่อบำบัด aggregates (Filter_Water §3.7) */}
          <AuraCard>
            <h3 className="font-display font-semibold text-aura-textMain font-thai mb-3">
              บ่อบำบัดน้ำเสีย (รวมช่วงวัน)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm font-thai">
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-energy-total-card">
                <div className="text-xs text-aura-textMuted">{ENERGY_DELTA_PROVENANCE}</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-energy-total">
                  {fmt(summary.ww.sumEnergy, 1)} <span className="text-xs font-normal">kWh</span>
                </div>
                <div className="text-[11px] text-aura-textMuted mt-1">
                  {summary.ww.energyDays} วันที่มีค่า
                  {summary.ww.energyBoundaryExcluded > 0 &&
                    ` · ยกเว้นวันเปลี่ยน/รีเซ็ตมิเตอร์ ${summary.ww.energyBoundaryExcluded} วัน`}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-wastewater-in-total-card">
                <div className="text-xs text-aura-textMuted">ปริมาณน้ำเข้ารวม (บันทึกจริง)</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-wastewater-in-total">
                  {fmt(summary.ww.sumWastewaterIn, 1)} <span className="text-xs font-normal">m³</span>
                </div>
                <div className="text-[11px] text-aura-textMuted mt-1">
                  เฉลี่ย{" "}
                  <span data-testid="report-wastewater-in-avg">
                    {summary.ww.avgWastewaterIn.mean === null
                      ? "—"
                      : `${fmt(summary.ww.avgWastewaterIn.mean, 1)} m³/วัน (${summary.ww.avgWastewaterIn.days} วันที่มีค่า)`}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle">
                <div className="text-xs text-aura-textMuted">คลอรีนน้ำ ที่ใช้ (บันทึกจริง)</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-chlorine-total">
                  {fmt(summary.ww.sumChlorine, 2)} <span className="text-xs font-normal">กก.</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle">
                <div className="text-xs text-aura-textMuted">คลอรีนน้ำที่ใช้จริง (÷อัตราผสม)</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-chlorine-real-total">
                  {fmt(summary.ww.sumChlorineReal, 2)} <span className="text-xs font-normal">กก.</span>
                </div>
                <div className="text-[11px] text-aura-textMuted mt-1" data-testid="report-chlorine-litter">
                  W/V คลอรีน (ลิตร) = ×1.2 = {fmt(summary.ww.chlorineLitter, 2)} ลิตร
                </div>
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle">
                <div className="text-xs text-aura-textMuted">ตะกอนส่วนเกินรวม</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-sludge-total">
                  {fmt(summary.ww.sumSludge, 1)} <span className="text-xs font-normal">m³</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-pump-volume">
                <div className="text-xs text-aura-textMuted">ปริมาณสูบรวม (จากสเปกอุปกรณ์)</div>
                <div className="text-lg font-bold text-aura-textMain">
                  {fmt(summary.ww.pumpVolumeTotal, 1)} <span className="text-xs font-normal">m³</span>
                </div>
                <div className="text-[11px] mt-1 text-amber-500 font-thai">
                  {summary.ww.pumpVolumeFlagged}
                </div>
                <div className="text-[11px] text-aura-textMuted">
                  วันที่สเปกไม่ครบ <span data-testid="report-spec-missing-days">{summary.ww.specMissingDays}</span> วัน (ไม่ถูกนับเป็น 0)
                </div>
              </div>
              <div className="col-span-2 md:col-span-3 text-[11px] text-aura-textMuted">
                วันที่มิเตอร์เปลี่ยน/รีเซ็ต (boundary){" "}
                <span data-testid="report-boundary-days">{summary.ww.boundaryDays}</span> วัน — ค่าวันนั้นถูกยกเว้น ไม่ถูกแทนด้วยศูนย์
              </div>
            </div>

            {/* Quality averages — real denominators (จำนวนวันที่มีค่า) */}
            <h4 className="font-display font-semibold text-aura-textMain font-thai mt-4 mb-2 text-sm">
              ค่าเฉลี่ยคุณภาพน้ำช่วงวัน (เฉลี่ยเฉพาะวันที่มีค่า)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-thai">
              {summary.ww.quality.map((q) => (
                <div
                  key={q.key}
                  className="p-2 rounded-lg bg-aura-bg/40 border border-aura-borderSubtle"
                  data-testid={`report-quality-${q.key}`}
                >
                  <div className="text-[11px] text-aura-textMuted">{q.label}</div>
                  <div className="font-bold text-aura-textMain">
                    {q.mean === null ? "—" : fmt(q.mean, 2)}
                    <span className="text-[11px] font-normal text-aura-textMuted">
                      {" "}({q.days} วัน)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AuraCard>

          {/* น้ำประปา aggregates (tap water_Filter §3.10) */}
          <AuraCard>
            <h3 className="font-display font-semibold text-aura-textMain font-thai mb-3">
              น้ำประปา (รวมช่วงวัน)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm font-thai">
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-water-in-total-card">
                <div className="text-xs text-aura-textMuted">ปริมาณน้ำเข้ารวม (บันทึกจริง)</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-water-in-total">
                  {fmt(summary.ws.sumWaterIn, 1)} <span className="text-xs font-normal">m³</span>
                </div>
                <div className="text-[11px] text-aura-textMuted">
                  วันที่มิเตอร์ชั่วโมงเปลี่ยน {summary.ws.boundaryDays} วัน (ถูกยกเว้น)
                </div>
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-water-in-estimate-card">
                <div className="text-xs text-aura-textMuted">ปริมาณน้ำเข้า (ประมาณจากชั่วโมงปั๊ม)</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-water-in-estimate">
                  {fmt(summary.ws.sumWaterInEstimate, 1)} <span className="text-xs font-normal">m³</span>
                </div>
                {summary.ws.sumWaterInEstimate > 0 && (
                  <div className="text-[11px] mt-1 text-amber-500 font-thai">
                    {summary.ws.waterInEstimateFlagged}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle">
                <div className="text-xs text-aura-textMuted">คลอรีนจริงรวม (÷อัตราผสม 1:9)</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-ws-chlorine-real">
                  {fmt(summary.ws.sumChlorineReal, 2)} <span className="text-xs font-normal">กก.</span>
                </div>
                <div className="text-[11px] text-aura-textMuted mt-1" data-testid="report-ws-kg-chlorine">
                  คลอรีน (กก.) = ×1.2 = {fmt(summary.ws.kgChlorine, 2)} กก.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-ws-energy-estimate-card">
                <div className="text-xs text-aura-textMuted">ไฟฟ้ารวม (ประมาณจากสเปก)</div>
                <div className="text-lg font-bold text-aura-textMain" data-testid="report-ws-energy-estimate">
                  {fmt(summary.ws.sumEnergyEstimate, 1)} <span className="text-xs font-normal">kWh</span>
                </div>
                {summary.ws.sumEnergyEstimate > 0 && (
                  <div className="text-[11px] mt-1 text-amber-500 font-thai">
                    {summary.ws.energyEstimateFlagged}
                  </div>
                )}
                <div className="text-[11px] text-aura-textMuted">
                  วันที่สเปกไม่ครบ {summary.ws.specMissingDays} วัน (ถูกยกเว้น)
                </div>
              </div>
            </div>
          </AuraCard>

          {/* Monthly energy breakdown — the VC_CY_01..12 honesty: months with
              no usable value render "—" (never 0); chart = native Recharts
              (plan §4 DIVERGE retires the QuickChart URL). */}
          <AuraCard>
            <h3 className="font-display font-semibold text-aura-textMain font-thai mb-1">
              การใช้ไฟฟ้ารายเดือน ปี {Number(summary.startISO.slice(0, 4)) + 543}
            </h3>
            <p className="text-[11px] text-aura-textMuted font-thai mb-3">
              เดือนที่ไม่มีค่าแสดงเป็น “—” (ไม่แทนด้วยศูนย์ ตามระบบเดิม)
            </p>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs font-thai mb-3">
              {summary.monthly.map((m) => (
                <div
                  key={m.month}
                  className="p-2 rounded-lg bg-aura-bg/40 border border-aura-borderSubtle"
                  data-testid={`report-month-cell-${m.month}`}
                >
                  <div className="text-[10px] text-aura-textMuted">{m.label}</div>
                  <div className="font-bold text-aura-textMain">
                    {m.total === null ? "—" : fmt(m.total, 1)}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64" data-testid="report-monthly-energy-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthly} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--aura-border-subtle)" />
                  <XAxis
                    dataKey="label"
                    stroke="var(--aura-text-muted)"
                    tick={{ fontSize: 9 }}
                    tickFormatter={(l: string) => l.replace(" ", "\n")}
                  />
                  <YAxis stroke="var(--aura-text-muted)" tick={{ fontSize: 10 }} unit=" kWh" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--aura-body-bg)",
                      border: "1px solid var(--aura-border-subtle)",
                      borderRadius: 8,
                      color: "var(--aura-text-main)",
                    }}
                    formatter={(v) => (v === null || v === undefined ? "—" : `${fmt(Number(v), 1)} kWh`)}
                  />
                  <Bar dataKey="total" name="ไฟฟ้า (kWh)" fill="var(--aura-cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AuraCard>

          {/* Threshold-hit counts — from v_reading_critical_flags ONLY
              (WO §2.4-4). Unavailable (no façade yet, D1-5) → honest notice. */}
          <AuraCard>
            <div data-testid="report-threshold-card">
            <h3 className="font-display font-semibold text-aura-textMain font-thai mb-3">
              จำนวนครั้งที่ติดธงวิกฤตในช่วงวัน
            </h3>
            {summary.flagsError ? (
              <p className="text-sm text-amber-500 font-thai" data-testid="report-threshold-unavailable">
                {summary.flagsError}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-thai">
                {THRESHOLD_FLAG_LABELS.map(({ key, label }) => (
                  <div key={key} className="p-2 rounded-lg bg-aura-bg/40 border border-aura-borderSubtle">
                    <div className="text-[11px] text-aura-textMuted">{label}</div>
                    <div className="font-bold text-aura-textMain" data-testid={`report-threshold-${key.replace(/_/g, "-")}`}>
                      {summary.flags?.[key] ?? 0} ครั้ง
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </AuraCard>

          {/* CO2 — surfaced from carbon.v_overview_carbon (display ONLY, no
              recompute; WO §2.2). พ.ศ. years. */}
          <AuraCard>
            <div data-testid="report-co2-card">
            <h3 className="font-display font-semibold text-aura-textMain font-thai mb-3">
              คาร์บอนไดออกไซด์รวม (จากระบบคาร์บอนเดิม)
            </h3>
            {summary.carbonError ? (
              <p className="text-sm text-amber-500 font-thai">{summary.carbonError}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm font-thai">
                <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-co2-cy">
                  <div className="text-xs text-aura-textMuted">รวมปีนี้ ({Number(summary.startISO.slice(0, 4)) + 543})</div>
                  <div className="text-lg font-bold text-aura-textMain">
                    {summary.carbon?.cy === null || summary.carbon === null ? "—" : `${fmt(summary.carbon.cy, 2)} tCO2e`}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle" data-testid="report-co2-ly">
                  <div className="text-xs text-aura-textMuted">รวมปีก่อน ({Number(summary.startISO.slice(0, 4)) + 543 - 1})</div>
                  <div className="text-lg font-bold text-aura-textMain">
                    {summary.carbon?.ly === null || summary.carbon === null ? "—" : `${fmt(summary.carbon.ly, 2)} tCO2e`}
                  </div>
                </div>
                <div className="col-span-2 text-[11px] text-aura-textMuted">
                  แสดงค่าจากมุมมองคาร์บอนเดิมโดยตรง (ไม่คำนวณซ้ำ) · ข้อมูล ณ วันที่บันทึก ไม่ใช่ค่าเรียลไทม์
                </div>
              </div>
            )}
            </div>
          </AuraCard>

          <p className="text-[11px] text-aura-textMuted font-thai">
            หมายเหตุ: ตัวเลขทั้งหมดรวมเฉพาะวันที่มีบันทึกจริงในช่วงวัน — วันที่ไม่มีบันทึกไม่ถูกนับเป็น 0 ·
            ค่าที่ประมาณจากสเปกอุปกรณ์แสดงธงกำกับชัดเจน · วันที่เป็น พ.ศ. · PDF ทส.1/ทส.2 ของส่วนนี้อยู่ใน Phase 4
          </p>
        </div>
      )}

      {/* ─── P2.5 safety+coliform numeric summary (additive section —
           AppSheet Filter_Firer / Filter_Light / Filter_ColiformBac
           numeric layer). Aggregates recorded rows client-side; รอผล its
           own number; master SOURCE_UNAVAILABLE empty state; NO PDF
           here (Phase 4). */}
      <SafetyColiformSummarySection />

      {/* Template chooser */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSelected(t.key)}
            className={
              "text-left p-4 rounded-2xl border transition-all font-thai " +
              (selected === t.key
                ? "bg-aura-cyan/10 border-aura-cyan/50 shadow-aura-glow-cyan"
                : "bg-aura-bg/40 border-aura-borderSubtle hover:border-aura-cyan/30")
            }
          >
            <div className="flex items-center gap-2 mb-2">
              <MSymbol name="description" className={"text-[20px] " + (selected === t.key ? "text-aura-cyan" : "text-aura-textMuted")} />
              <span className="text-xs font-bold text-aura-textMuted">{t.code}</span>
            </div>
            <div className="font-semibold text-aura-textMain">{t.title}</div>
            <div className="text-xs text-aura-textMuted mt-1">{t.description}</div>
            <div className="mt-3 pt-2 border-t border-aura-borderSubtle/50 text-[11px] text-aura-textMuted">
              ดาวน์โหลดเป็น PDF
            </div>
          </button>
        ))}
      </div>

      {/* Parameters + download */}
      <AuraCard className="space-y-4">
        {(selected === "ts1" || selected === "ts2") && (
          <Field label="เดือนที่ต้องการรายงาน" required>
            <div className="relative">
              <MSymbol name="calendar_month" className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-aura-textMuted pointer-events-none" />
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="pl-10"
              />
            </div>
          </Field>
        )}

        {selected === "repair" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่แจ้ง" required>
                <Input
                  type="date"
                  value={repair.date}
                  onChange={(e) => setRepair({ ...repair, date: e.target.value })}
                />
              </Field>
              <Field label="อุปกรณ์ที่ชำรุด">
                <Input
                  value={repair.equipment ?? ""}
                  onChange={(e) => setRepair({ ...repair, equipment: e.target.value })}
                  placeholder="เช่น เครื่องเติมอากาศ 2"
                />
              </Field>
            </div>
            <Field label="ผู้แจ้ง">
              <Input
                value={repair.reporter ?? ""}
                onChange={(e) => setRepair({ ...repair, reporter: e.target.value })}
                placeholder="ชื่อ-สกุล"
              />
            </Field>
            <Field label="สถานะ">
              <Select
                value={repair.status ?? "open"}
                onChange={(e) => setRepair({ ...repair, status: e.target.value as RepairRequestInput["status"] })}
              >
                <option value="open">รอดำเนินการ</option>
                <option value="in_progress">กำลังซ่อม</option>
                <option value="resolved">ซ่อมเสร็จ</option>
                <option value="cancelled">ยกเลิก</option>
              </Select>
            </Field>
            <Field label="สาเหตุ / อาการ" required>
              <Textarea
                rows={3}
                value={repair.cause}
                onChange={(e) => setRepair({ ...repair, cause: e.target.value })}
                placeholder="อธิบายอาการชำรุด / สาเหตุที่ตรวจพบ"
              />
            </Field>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-aura-textMuted font-thai">
          <MSymbol name="info" className="text-[12px]" />
          {selected === "repair"
            ? "ใบแจ้งซ่อมนี้เป็นการสร้างเอกสารแบบ standalone — หากต้องการบันทึกในระบบ ให้ใช้ฟอร์มบันทึกประจำวันและเลือก 'ระบบผิดปกติ'"
            : "ข้อมูลมาจาก wastewater.reading ของเดือนที่เลือก — รวมเฉพาะวันที่มีบันทึกจริง"}
        </div>

        <Button size="lg" className="w-full" onClick={onDownload} disabled={downloading}>
          <MSymbol name="download" className="text-[18px]" /> ดาวน์โหลด PDF
        </Button>
      </AuraCard>
    </div>
  );
}
