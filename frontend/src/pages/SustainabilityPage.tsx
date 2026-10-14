import { AuraCard } from "../components/ui/AuraCard";
import { MSymbol } from "../components/ui/MSymbol";
import { useCarbonRollup, type RollupSummary } from "../lib/carbon-rollup";
import { useGarbageLogs } from "../lib/garbage";
import {
  deriveFamilyStates,
  deriveTverReadiness,
  READINESS_DOM_STATUS_UNAVAILABLE,
  type FamilyName,
  type TverReadinessItem,
} from "../lib/sustainability/family-state";

const FAMILY_DISPLAY: Record<FamilyName, { label: string; context: string; icon: string }> = {
  electricity: { label: "ไฟฟ้า", context: "จากบันทึกการใช้ไฟฟ้า", icon: "bolt" },
  fuel: { label: "เชื้อเพลิง", context: "ดีเซล เบนซิน และ LPG", icon: "local_gas_station" },
  garden_fuel: { label: "เชื้อเพลิงงานสวน", context: "บันทึกการใช้ในงานสวน", icon: "park" },
  waste: { label: "ขยะ", context: "บันทึกการคัดแยกขยะ", icon: "recycling" },
  chemical: { label: "สารเคมี", context: "บันทึกการใช้สารเคมี", icon: "science" },
  plastic: { label: "พลาสติก", context: "ยังไม่มีหมวดและน้ำหนักเฉพาะ", icon: "category" },
};

const SEGREGATION_LABELS: Record<string, string> = {
  general: "ทั่วไป",
  infectious: "ติดเชื้อ",
  recyclable: "รีไซเคิล",
  chemical: "เคมี",
  unclassified: "ไม่ระบุประเภท",
};

const READINESS_LABELS: Record<TverReadinessItem["status"], string> = {
  DOCUMENTED: "มีหลักฐาน",
  PARTIAL: "มีบางส่วน",
  ABSENT: "ยังไม่มีหลักฐาน",
};

// This shape is used only while the query has no result. Its numeric field is
// never displayed; the page labels the data as loading or unavailable.
const NO_ROLLUP: RollupSummary = {
  rows: [],
  byScope: [],
  grandTotalKg: 0,
  incompleteSources: [],
  unavailableSources: [],
  hasUnavailableContribution: false,
};

const KG_FORMAT = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function SustainabilityPage() {
  const rollup = useCarbonRollup(12);
  const garbage = useGarbageLogs(30);
  const source = rollup.data ?? NO_ROLLUP;
  const garbageRows = garbage.error ? [] : garbage.data;
  const families = deriveFamilyStates(source, garbageRows);
  const readiness = deriveTverReadiness(source, garbageRows);
  const hasKnownValue = rollup.data?.rows.some(
    (row) => row.kg_co2e !== null && Number.isFinite(row.kg_co2e),
  ) ?? false;
  const incomplete = !rollup.data || rollup.data.hasUnavailableContribution ||
    rollup.data.incompleteSources.length > 0;
  const loading = rollup.loading || garbage.loading;
  const loadError = Boolean(rollup.error || garbage.error);

  return (
    <div className="mx-auto max-w-6xl min-w-0 space-y-7 font-thai text-aura-textMain">
      <header className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-aura-cyan">
          Environmental intelligence
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          ความ<span className="aura-text-gradient">ยั่งยืน</span>
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-aura-textMuted">
          ภาพรวมข้อมูลคาร์บอนและขยะจากบันทึกที่มีอยู่ ย้อนหลัง 12 เดือน
          สถานะข้อมูลแสดงแยกตามแหล่งกำเนิด
        </p>
      </header>

      {(loading || loadError) && (
        <p role={loadError ? "alert" : "status"} className="rounded-xl border border-aura-borderSubtle bg-aura-surface/60 px-4 py-3 text-sm text-aura-textMuted">
          {loadError
            ? "โหลดข้อมูลบางส่วนไม่ได้ สถานะที่ไม่มีผลลัพธ์ยังตรวจสอบไม่ได้"
            : "กำลังโหลดข้อมูล สถานะที่ยังไม่มีผลลัพธ์เป็นข้อมูลชั่วคราว"}
        </p>
      )}

      <AuraCard className="min-w-0 space-y-3 border border-aura-borderSubtle p-5 sm:p-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-aura-textMuted">ภาพรวมการปล่อยจากแหล่งที่มีข้อมูล</p>
          <span className="rounded-full border border-aura-cyan/30 bg-aura-cyan/10 px-3 py-1 text-xs font-semibold text-aura-cyan">
            {hasKnownValue ? "LATEST · จากบันทึก" : "UNAVAILABLE · ไม่มีข้อมูล"}
          </span>
        </div>
        <div data-testid="sustainability-total" className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">ยอดรวมที่ทราบ</p>
          {hasKnownValue ? (
            <p className="break-words font-mono text-3xl font-bold text-aura-cyan sm:text-4xl">
              {KG_FORMAT.format(source.grandTotalKg)} <span className="text-base font-medium">kg CO₂e</span>
            </p>
          ) : (
            <p className="text-xl font-semibold text-aura-textMuted">ไม่มีข้อมูล</p>
          )}
          {incomplete && (
            <p className="text-sm text-aura-textMuted">
              ข้อมูลไม่ครบ · ยอดรวมที่ทราบนับเฉพาะค่าที่คำนวณได้
            </p>
          )}
        </div>
      </AuraCard>

      <section aria-labelledby="sustainability-families-title" className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h2 id="sustainability-families-title" className="text-xl font-bold">แหล่งข้อมูลและหมวดขยะ</h2>
          <p className="text-sm text-aura-textMuted">สถานะข้อมูลแยกตามแหล่งกำเนิด ค่าที่ไม่มีข้อมูลจะไม่แสดงเป็นศูนย์</p>
        </div>
        <div
          data-testid="sustainability-families"
          aria-busy={loading}
          className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {families.map((item) => {
            const display = FAMILY_DISPLAY[item.family];
            const contributing = item.state === "CONTRIBUTING" && rollup.data !== null;
            return (
              <article key={item.family} data-family={item.family} data-family-state={item.state} className="min-w-0">
                <AuraCard className="flex h-full min-w-0 flex-col gap-4 p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-aura-cyan/10 text-aura-cyan">
                      <MSymbol name={display.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold">{display.label}</h3>
                      <p className="break-words text-xs leading-relaxed text-aura-textMuted">{display.context}</p>
                    </div>
                  </div>
                  <div className="mt-auto min-w-0 space-y-2">
                    <span className="inline-flex max-w-full rounded-full border border-aura-borderSubtle px-3 py-1 text-xs font-semibold text-aura-textMuted">
                      {contributing ? "LATEST · จากบันทึก" : item.state === "ABSENT" ? "ABSENT · ไม่มีหมวดข้อมูล" : "UNAVAILABLE · ไม่มีข้อมูล"}
                    </span>
                    {contributing ? (
                      <p className="break-words font-mono text-2xl font-bold text-aura-cyan">
                        {item.valueLabel} <span className="text-sm font-medium">kg CO₂e</span>
                      </p>
                    ) : (
                      <p className="text-lg font-semibold text-aura-textMuted">ไม่มีข้อมูล</p>
                    )}
                    {item.contribution === "UNAVAILABLE" && (
                      <p className="text-xs text-aura-textMuted">ค่าการปล่อยยังคำนวณไม่ได้</p>
                    )}
                    {item.family === "waste" && item.detail?.segregation && item.detail.segregation.length > 0 && (
                      <div className="space-y-1 border-t border-aura-borderSubtle pt-3">
                        <p className="text-xs text-aura-textMuted">หมวดที่มีบันทึกการคัดแยก</p>
                        <ul className="flex flex-wrap gap-1.5" aria-label="หมวดขยะที่มีบันทึก">
                          {item.detail.segregation.map(({ label }) => (
                            <li key={label} className="max-w-full break-all rounded-lg bg-aura-surfaceHighest px-2 py-1 text-xs">
                              {SEGREGATION_LABELS[label] ?? "ไม่ระบุประเภท"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AuraCard>
              </article>
            );
          })}
        </div>
      </section>

      <section data-testid="tver-readiness" aria-labelledby="tver-readiness-title" className="min-w-0">
        <AuraCard className="min-w-0 space-y-4 p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-aura-cyan">T-VER · EVIDENCE</p>
            <h2 id="tver-readiness-title" className="text-xl font-bold">ความพร้อมของหลักฐาน</h2>
            <p className="text-sm text-aura-textMuted">รายการข้อมูลที่บันทึกหรือมีเอกสารรองรับในขณะนี้</p>
          </div>
          <ul className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {readiness.map((item) => (
              <li
                key={item.input}
                data-readiness-status={rollup.data ? item.status : READINESS_DOM_STATUS_UNAVAILABLE}
                className="flex min-w-0 flex-wrap items-start justify-between gap-2 rounded-xl border border-aura-borderSubtle bg-aura-surface/40 p-4"
              >
                <span className="min-w-0 flex-1 break-words text-sm leading-relaxed">{item.input}</span>
                <span className="rounded-full border border-aura-borderSubtle px-2.5 py-1 text-xs font-semibold text-aura-textMuted">
                  {rollup.data ? READINESS_LABELS[item.status] : "ตรวจสอบไม่ได้"}
                </span>
              </li>
            ))}
          </ul>
        </AuraCard>
      </section>
    </div>
  );
}
