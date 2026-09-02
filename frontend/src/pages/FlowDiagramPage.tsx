import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { EnvironmentalFlowStory } from "../components/flow/EnvironmentalFlowStory";
import { AuraCard } from "../components/ui/AuraCard";
import { MSymbol } from "../components/ui/MSymbol";
import { Skeleton } from "../components/ui/Skeleton";
import { toEnvironmentalFlowModel } from "../lib/environmental-flow";
import { fetchReading, fetchReadings } from "../lib/supabase-queries";

function thaiDate(date: string | null) {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function fetchLatestEnvironmentalFlowReading() {
  const recent = await fetchReadings(1);
  const latest = recent.items[0];
  if (!latest?.id) return null;
  return fetchReading(latest.id);
}

export function FlowDiagramPage() {
  const latest = useQuery({
    queryKey: ["environmental-flow", "latest-reading"],
    queryFn: fetchLatestEnvironmentalFlowReading,
    staleTime: 60_000,
  });

  const model = toEnvironmentalFlowModel(latest.data ?? null);
  const referenceDate = thaiDate(model.asOf);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5 md:space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <MSymbol name="account_tree" className="text-[26px] text-aura-cyan" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-aura-textMain md:text-3xl">
            Environmental Flow · <span className="font-thai">การไหลเชิงสิ่งแวดล้อม</span>
          </h1>
        </div>
        <p className="max-w-4xl text-sm text-aura-textMuted font-thai">
          แสดงหลักฐานจากบันทึกรายวันล่าสุดร่วมกับโครงสร้าง Activated Sludge ที่ยืนยันแล้ว — เป็น latest evidence ไม่ใช่สถานะ Live
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-aura-textMuted font-thai">
          <span className="rounded-full border border-aura-borderSubtle px-3 py-1.5">
            แหล่งข้อมูล: {model.sourceType === "manual-latest" ? "manual latest wastewater reading" : "latest wastewater record"}
          </span>
          <span className="rounded-full border border-aura-borderSubtle px-3 py-1.5">
            {referenceDate ? `วันที่อ้างอิง ${referenceDate}` : "ยังไม่มีวันที่อ้างอิง"}
          </span>
        </div>
      </header>

      {latest.isLoading ? (
        <div className="space-y-3" aria-live="polite" aria-label="กำลังโหลดข้อมูลการไหลเชิงสิ่งแวดล้อม">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {latest.error ? (
            <AuraCard className="border-alert-red/35 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <MSymbol name="error" className="mt-0.5 text-[22px] text-alert-red" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-alert-red font-thai">โหลดหลักฐานล่าสุดไม่สำเร็จ</h2>
                  <p className="mt-1 text-sm text-aura-textMuted font-thai">
                    ยังไม่สามารถแสดงปริมาณจากบันทึกล่าสุดได้ โครงสร้างกระบวนการด้านล่างยังคงเป็นข้อมูล topology ไม่ใช่สถานะ Live
                  </p>
                </div>
              </div>
            </AuraCard>
          ) : null}

          {!latest.error && latest.data === null ? (
            <AuraCard className="p-4 sm:p-5">
              <p className="font-semibold text-aura-textMain font-thai">ยังไม่มีบันทึกข้อมูลการไหลล่าสุด</p>
              <p className="mt-1 text-sm text-aura-textMuted font-thai">
                ปริมาณทุกช่องจะแสดงเป็น — จนกว่าจะมีบันทึกจริง ระบบจะไม่เติมค่าศูนย์หรือค่าตัวอย่างให้เอง
              </p>
            </AuraCard>
          ) : null}

          <EnvironmentalFlowStory model={model} />
        </>
      )}

      <section aria-labelledby="flow-actions-title" className="space-y-3">
        <h2 id="flow-actions-title" className="font-display text-base font-semibold text-aura-textMain font-thai">
          ตรวจสอบและบันทึกต่อ
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FlowAction to="/dashboard" icon="view_in_ar" label="Digital Twin / Process" />
          <FlowAction to="/readings" icon="history" label="ประวัติบันทึกน้ำเสีย" />
          <FlowAction to="/form" icon="edit_note" label="บันทึกข้อมูลประจำวัน" />
        </div>
      </section>
    </div>
  );
}

function FlowAction({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link
      to={to}
      data-flow-action="true"
      className="inline-flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/55 px-4 py-3 text-sm font-semibold text-aura-textMain transition-colors hover:border-aura-cyan/50 hover:bg-aura-cyan/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-cyan/70 font-thai"
    >
      <span className="flex min-w-0 items-center gap-2">
        <MSymbol name={icon} className="shrink-0 text-[20px] text-aura-cyan" aria-hidden="true" />
        <span className="min-w-0">{label}</span>
      </span>
      <MSymbol name="arrow_forward" className="shrink-0 text-[18px] text-aura-textMuted" aria-hidden="true" />
    </Link>
  );
}
