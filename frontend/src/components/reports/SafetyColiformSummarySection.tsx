/**
 * ENV-PARITY-P2-005 — the /reports safety+coliform numeric summary
 * section (AppSheet parity lane P2.5, numbers only — PDF = Phase 4 OUT).
 *
 * Three domains, one additive section (WO §5; the P1.6 summary section +
 * the PDF-template chooser stay byte-untouched):
 *   1. ถังดับเพลิง — Filter_Firer §3.20 verbatim semantics
 *      (lib/safety-summary.ts): distinct-inspected / master denominator
 *      (SOURCE_UNAVAILABLE honest empty state) / ปกติ ∧4 / ผิดปกติ ∨5
 *      incl. หมดอายุ / the blank-components honesty line.
 *   2. ไฟฉุกเฉิน — Filter_Light §3.35 verbatim semantics: the ผ่าน/
 *      ไม่ผ่าน headline pair + both-value displays + the ไม่ระบุ Status
 *      bucket (D1-5).
 *   3. สุขาภิบาลอาหาร (coliform) — §4.3 binding detail spec:
 *      per-source เก็บ/รอผล/มีผล with รอผล as its own number, ผ่าน/
 *      ไม่ผ่าน over the REAL มีผล denominator, Positive ++/invalid/
 *      ค่าอื่น separate, verbatim collect-point breakdowns, monthly
 *      rollups with the month-not-reached NULL pattern.
 *
 * Honesty (WO §4.4): true zeros are honest zeros; empty domains render
 * their empty state, never fabricated numbers; no PHI anywhere (counts
 * only); พ.ศ. everywhere; latest ≠ live vocabulary; read-only.
 */
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
import { toLocalISODate } from "../../lib/utils";
import { AuraCard } from "../ui/AuraCard";
import { Button } from "../ui/Button";
import { MSymbol } from "../ui/MSymbol";
import { Field, Input } from "../ui/Input";
import {
  fetchColiformLabTestRange,
  fetchEmergencyLightCheckRange,
  fetchExtinguisherInspectionRange,
  fetchExtinguisherMasterIds,
} from "../../lib/supabase-queries";
import {
  SAFETY_MASTER_UNAVAILABLE_LABEL,
  buildExtinguisherSummary,
  buildLightSummary,
  type ExtinguisherSummary,
  type LightSummary,
} from "../../lib/safety-summary";
import { buildColiformSummary, type ColiformSummary } from "../../lib/coliform-summary";
import { thaiRangeLabel } from "../../lib/report-summary";

/** AppSheet range pickers init TODAY(); the section default renders the
 *  CURRENT MONTH (start = 1st, end = today) — both endpoints inclusive. */
function currentMonthRange(): { start: string; end: string } {
  const today = toLocalISODate();
  return { start: `${today.slice(0, 8)}01`, end: today };
}

/** ASCII testid slugs for the four coliform sources (stable selectors). */
const SOURCE_SLUGS: Record<string, string> = {
  "น้ำ": "water",
  "อาหาร": "food",
  "พนักงาน": "employee",
  "ทั่วไป": "general",
};

interface SafetyColiformState {
  startISO: string;
  endISO: string;
  ext: ExtinguisherSummary;
  light: LightSummary;
  coliform: ColiformSummary;
}

function StatTile(props: {
  label: string;
  value: string;
  testid?: string;
  tone?: "main" | "danger" | "amber" | "muted";
  sub?: string;
  subTestid?: string;
  subTone?: "main" | "danger" | "amber" | "muted";
}) {
  const toneClass =
    props.tone === "danger"
      ? "text-alert-red"
      : props.tone === "amber"
        ? "text-amber-500"
        : props.tone === "muted"
          ? "text-aura-textMuted"
          : "text-aura-textMain";
  const subToneClass =
    props.subTone === "danger"
      ? "text-alert-red"
      : props.subTone === "amber"
        ? "text-amber-500"
        : props.subTone === "muted"
          ? "text-aura-textMuted"
          : "text-aura-textMain";
  return (
    <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle">
      <div className="text-xs text-aura-textMuted font-thai">{props.label}</div>
      <div className={`text-lg font-bold font-thai ${toneClass}`} data-testid={props.testid}>
        {props.value}
      </div>
      {props.sub && (
        <div className="text-[11px] text-aura-textMuted font-thai mt-1">
          <span className={subToneClass} data-testid={props.subTestid}>
            {props.sub}
          </span>
        </div>
      )}
    </div>
  );
}

export function SafetyColiformSummarySection() {
  const defaultRange = currentMonthRange();
  const [rangeStart, setRangeStart] = useState(defaultRange.start);
  const [rangeEnd, setRangeEnd] = useState(defaultRange.end);
  const [generating, setGenerating] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SafetyColiformState | null>(null);

  const onGenerate = async () => {
    if (generating) return;
    if (rangeStart > rangeEnd) {
      setRangeError("วันเริ่มต้องไม่เกินวันสิ้นสุด");
      return;
    }
    setGenerating(true);
    setRangeError(null);
    try {
      const [inspectionRows, masterIds, lightRows, coliformRows] = await Promise.all([
        fetchExtinguisherInspectionRange(rangeStart, rangeEnd),
        fetchExtinguisherMasterIds(),
        fetchEmergencyLightCheckRange(rangeStart, rangeEnd),
        fetchColiformLabTestRange(rangeStart, rangeEnd),
      ]);
      setSummary({
        startISO: rangeStart,
        endISO: rangeEnd,
        ext: buildExtinguisherSummary({
          startISO: rangeStart,
          endISO: rangeEnd,
          rows: inspectionRows,
          masterIds,
        }),
        light: buildLightSummary({ startISO: rangeStart, endISO: rangeEnd, rows: lightRows }),
        coliform: buildColiformSummary({ startISO: rangeStart, endISO: rangeEnd, rows: coliformRows }),
      });
    } catch (e) {
      setRangeError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div data-testid="safety-summary-controls">
      <AuraCard className="space-y-4">
        <div>
          <h2 className="font-display font-semibold text-aura-textMain font-thai flex items-center gap-2">
            <MSymbol name="verified_user" className="text-[18px] text-aura-cyan" />
            สรุปความปลอดภัยและสุขาภิบาลอาหาร (ตัวเลข)
          </h2>
          <p className="text-xs text-aura-textMuted font-thai mt-1">
            ถังดับเพลิง · ไฟฉุกเฉิน · coliform — นับจากบันทึกจริงในช่วงวันที่เลือกเท่านั้น
            (ตัวเลขอย่างเดียว — ยังไม่มี PDF ตามแผน Phase 4)
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <Field label="วันเริ่ม" required>
            <Input
              type="date"
              data-testid="safety-range-start"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            />
          </Field>
          <Field label="วันสิ้นสุด" required>
            <Input
              type="date"
              data-testid="safety-range-end"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
            />
          </Field>
          <Button onClick={onGenerate} disabled={generating} data-testid="safety-generate">
            <MSymbol name="calculate" className="text-[16px]" /> สรุปข้อมูล
          </Button>
        </div>

        {rangeError && (
          <p className="text-sm text-alert-red font-thai" data-testid="safety-range-error">
            สรุปข้อมูลไม่สำเร็จ: {rangeError}
          </p>
        )}
      </AuraCard>

      {summary && (
        <div className="space-y-4 mt-4" data-testid="safety-summary-section">
          <p className="text-sm text-aura-textMuted font-thai" data-testid="safety-range-label">
            ช่วงวันที่: {thaiRangeLabel(summary.startISO, summary.endISO)} (พ.ศ.)
          </p>

          {/* ── 1. ถังดับเพลิง (Filter_Firer §3.20 — verbatim predicates;
                 barrier is in NO predicate, D1-4) ── */}
          <AuraCard>
            <div data-testid="safety-ext-card">
              <h3 className="font-display font-semibold text-aura-textMain font-thai mb-3">
                ถังดับเพลิง (นับปกติ/ผิดปกติ)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm font-thai">
                <StatTile
                  label="จำนวนถังทั้งที่ตรวจ (ถังที่ไม่ซ้ำกัน)"
                  value={String(summary.ext.inspectedCount)}
                  testid="safety-ext-inspected"
                  sub={`จากบันทึกการตรวจ ${summary.ext.totalRows} รายการ`}
                />
                {summary.ext.masterAvailable ? (
                  <StatTile
                    label="จำนวนถังที่มี (ทะเบียนถัง)"
                    value={String(summary.ext.masterCount)}
                    testid="safety-ext-master"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle">
                    <div className="text-xs text-aura-textMuted font-thai">จำนวนถังที่มี (ทะเบียนถัง)</div>
                    <div className="text-lg font-bold text-alert-red font-thai" data-testid="safety-ext-master-unavailable">
                      {SAFETY_MASTER_UNAVAILABLE_LABEL}
                    </div>
                    <div className="text-[11px] text-aura-textMuted font-thai mt-1">
                      SOURCE_UNAVAILABLE — ยังไม่มีข้อมูลมาสเตอร์ถัง จึงไม่มีตัวเลขทะเบียนให้แสดง
                      (ไม่คำนวณอัตราส่วนจากทะเบียนว่าง)
                    </div>
                  </div>
                )}
                <StatTile
                  label="ปกติ (ท่อ ∧ หูจับ ∧ ถัง ∧ มาตรวัด — ตามสูตรเดิม ไม่รวมแผงกั้น)"
                  value={String(summary.ext.normalCount)}
                  testid="safety-ext-normal"
                />
                <StatTile
                  label="ผิดปกติ (ชำรุด/ไม่ปกติ/หมดอายุ อย่างใดอย่างหนึ่ง)"
                  value={String(summary.ext.abnormalCount)}
                  testid="safety-ext-abnormal"
                  tone={summary.ext.abnormalCount > 0 ? "danger" : "main"}
                  sub={`จำนวนถังผิดปกติ ${summary.ext.abnormalHeadlineCount}`}
                />
                <StatTile
                  label="จำนวนรายการที่ค่าไม่ครบตามสูตร"
                  value={String(summary.ext.incompleteCount)}
                  testid="safety-ext-incomplete"
                  tone={summary.ext.incompleteCount > 0 ? "amber" : "muted"}
                  sub="อยู่นอกทั้งสองสูตรเดิม — แสดงตามจริง ไม่เดาค่าแทน"
                />
              </div>
              <p className="text-[11px] text-aura-textMuted font-thai mt-2">
                หมายเหตุ: ปกติ/ผิดปกติใช้สูตรเดิมตรงตัว (ท่อ/หูจับ/ถัง/มาตรวัด + หมดอายุ) —
                แผงกั้น (barrier) ไม่ได้อยู่ในสูตรเดิม จึงไม่ถูกนับในทั้งสองชั้น
              </p>
            </div>
          </AuraCard>

          {/* ── 2. ไฟฉุกเฉิน (Filter_Light §3.35 — both-value displays +
                 the ไม่ระบุ Status bucket, D1-5) ── */}
          <AuraCard>
            <div data-testid="safety-light-card">
              <h3 className="font-display font-semibold text-aura-textMain font-thai mb-3">
                ไฟฉุกเฉิน (ผ่าน/ไม่ผ่านการทดสอบ)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm font-thai">
                <StatTile
                  label="จำนวนที่ตรวจสอบ"
                  value={String(summary.light.totalChecked)}
                  testid="safety-light-total"
                />
                <StatTile
                  label="จำนวนการทดสอบผ่าน"
                  value={String(summary.light.testPass)}
                  testid="safety-light-pass"
                />
                <StatTile
                  label="จำนวนการทดสอบไม่ผ่าน"
                  value={String(summary.light.testFail)}
                  testid="safety-light-fail"
                  tone={summary.light.testFail > 0 ? "danger" : "main"}
                />
                <StatTile
                  label="จำนวนการคงอยู่ — มี"
                  value={String(summary.light.persistencyHas)}
                  testid="safety-light-persistency-has"
                  sub={`ไม่มี ${summary.light.persistencyNot}`}
                  subTestid="safety-light-persistency-not"
                />
                <StatTile
                  label="จำนวนตำแหน่ง — เหมาะสม"
                  value={String(summary.light.positionSuitable)}
                  testid="safety-light-position-ok"
                  sub={`ไม่เหมาะสม ${summary.light.positionNot}`}
                  subTestid="safety-light-position-not"
                />
                <StatTile
                  label="จำนวนความต้องการ — แจ้งซ่อม"
                  value={String(summary.light.statusRepair)}
                  testid="safety-light-status-repair"
                />
                <StatTile
                  label="จำนวนความต้องการ — แจ้งย้ายตำแหน่ง"
                  value={String(summary.light.statusRelocate)}
                  testid="safety-light-status-relocate"
                />
                <StatTile
                  label="จำนวนความต้องการ — ขอติดตั้ง"
                  value={String(summary.light.statusInstall)}
                  testid="safety-light-status-install"
                />
                <StatTile
                  label="สถานะ — ไม่ระบุ"
                  value={String(summary.light.statusUnspecified)}
                  testid="safety-light-status-unspecified"
                  tone={summary.light.statusUnspecified > 0 ? "amber" : "muted"}
                  sub="บันทึกที่ไม่ได้ระบุสถานะ — นับแยกต่างหาก ไม่ถูกใส่ซ้ำในชั้นความต้องการ"
                />
              </div>
              {(summary.light.testOther > 0 ||
                summary.light.persistencyOther > 0 ||
                summary.light.positionOther > 0) && (
                <p className="text-[11px] text-amber-500 font-thai mt-2" data-testid="safety-light-other">
                  ค่าที่อยู่นอกชุดค่ามาตรฐาน — ผลทดสอบ {summary.light.testOther} · คงอยู่{" "}
                  {summary.light.persistencyOther} · ตำแหน่ง {summary.light.positionOther} (แสดงตามจริง ไม่เดาค่าแทน)
                </p>
              )}
            </div>
          </AuraCard>

          {/* ── 3. สุขาภิบาลอาหาร — สรุป coliform (§4.3 binding detail
                 spec; รอผล its own number; counts only) ── */}
          <AuraCard>
            <div data-testid="coliform-summary-section">
              <h3 className="font-display font-semibold text-aura-textMain font-thai mb-1">
                สุขาภิบาลอาหาร — สรุป coliform
              </h3>
              <p className="text-[11px] text-aura-textMuted font-thai mb-3">
                นับจากตัวอย่างที่บันทึกจริง — รอผลเป็นตัวเลขของตัวเอง ไม่ถูกนับรวมในผ่าน/ไม่ผ่าน
                · แสดงเฉพาะจำนวน ไม่แสดงชื่อบุคคล
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-thai mb-3">
                <StatTile
                  label="จำนวนตัวอย่างที่เก็บ"
                  value={String(summary.coliform.totalCollected)}
                  testid="coliform-total-collected"
                />
                <StatTile
                  label="รอผล"
                  value={String(summary.coliform.totalPending)}
                  testid="coliform-total-pending"
                  tone={summary.coliform.totalPending > 0 ? "amber" : "muted"}
                />
                <StatTile
                  label="มีผล (ตัวเลขจริงของผ่าน/ไม่ผ่าน)"
                  value={String(summary.coliform.totalResulted)}
                  testid="coliform-total-resulted"
                />
                <StatTile
                  label="ผลผ่าน (Negative)"
                  value={String(summary.coliform.totalPass)}
                  testid="coliform-total-pass"
                />
                <StatTile
                  label="ผลไม่ผ่าน (Positive / Positive ++)"
                  value={String(summary.coliform.totalFail)}
                  testid="coliform-total-fail"
                  tone={summary.coliform.totalFail > 0 ? "danger" : "main"}
                />
                <StatTile
                  label="Positive ++ แยกต่างหาก"
                  value={String(summary.coliform.totalPlusPlus)}
                  testid="coliform-total-plusplus"
                />
                <StatTile
                  label="invalid แยกต่างหาก"
                  value={String(summary.coliform.totalInvalid)}
                  testid="coliform-total-invalid"
                />
                <StatTile
                  label="ค่าอื่น (นอกชุดค่ามาตรฐาน)"
                  value={String(summary.coliform.totalOther)}
                  testid="coliform-total-other"
                  tone={summary.coliform.totalOther > 0 ? "amber" : "muted"}
                />
              </div>

              {/* Per-source rows — เก็บ/รอผล/มีผล/ผ่าน/ไม่ผ่าน + points */}
              <div className="space-y-2">
                {summary.coliform.sources.map((src) => {
                  const slug = SOURCE_SLUGS[src.source] ?? src.source;
                  return (
                    <div
                      key={src.source}
                      className="p-3 rounded-xl bg-aura-bg/40 border border-aura-borderSubtle"
                      data-testid={`coliform-source-${slug}`}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-thai text-sm">
                        <span className="font-semibold text-aura-textMain">{src.source}</span>
                        <span className="text-aura-textMuted text-xs">
                          เก็บ <span className="font-bold text-aura-textMain">{src.collected}</span> · รอผล{" "}
                          <span className="font-bold text-amber-500">{src.pending}</span> · มีผล{" "}
                          <span className="font-bold text-aura-textMain">{src.resulted}</span>
                        </span>
                        <span className="text-aura-textMuted text-xs">
                          ผ่าน <span className="font-bold text-aura-textMain">{src.pass}</span> · ไม่ผ่าน{" "}
                          <span className="font-bold text-alert-red">{src.fail}</span>
                        </span>
                        {(src.plusPlus > 0 || src.invalid > 0 || src.other > 0) && (
                          <span className="text-aura-textMuted text-xs">
                            {src.plusPlus > 0 && <>Positive ++ {src.plusPlus} · </>}
                            {src.invalid > 0 && <>invalid {src.invalid} · </>}
                            {src.other > 0 && <>ค่าอื่น {src.other}</>}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 font-thai text-[11px] text-aura-textMuted mt-1">
                        {src.points.map((p) => (
                          <span key={p.label}>
                            {p.label} <span className="font-bold text-aura-textMuted">{p.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly rollups — month-not-reached NULL pattern:
                  เดือนที่ไม่มีบันทึก (รวมเดือนที่ยังไม่ถึง) แสดง "—" ไม่ใช่ 0 */}
              <h4 className="font-display font-semibold text-aura-textMain font-thai mt-4 mb-2 text-sm">
                จำนวนตัวอย่างรายเดือน (พ.ศ.)
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs font-thai mb-3">
                {summary.coliform.monthly.map((m) => (
                  <div
                    key={m.ym}
                    className="p-2 rounded-lg bg-aura-bg/40 border border-aura-borderSubtle"
                    data-testid={`coliform-month-cell-${m.ym}`}
                  >
                    <div className="text-[10px] text-aura-textMuted">{m.label}</div>
                    <div className="font-bold text-aura-textMain">{m.total === null ? "—" : m.total}</div>
                  </div>
                ))}
              </div>
              <div className="h-48" data-testid="coliform-monthly-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.coliform.monthly} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--aura-border-subtle)" />
                    <XAxis
                      dataKey="label"
                      stroke="var(--aura-text-muted)"
                      tick={{ fontSize: 9 }}
                      tickFormatter={(l: string) => l.replace(" ", "\n")}
                    />
                    <YAxis stroke="var(--aura-text-muted)" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--aura-body-bg)",
                        border: "1px solid var(--aura-border-subtle)",
                        borderRadius: 8,
                        color: "var(--aura-text-main)",
                      }}
                      formatter={(v) => (v === null || v === undefined ? "—" : `${v} ตัวอย่าง`)}
                    />
                    <Bar dataKey="total" name="ตัวอย่าง (จำนวน)" fill="var(--aura-cyan)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AuraCard>

          <p className="text-[11px] text-aura-textMuted font-thai">
            หมายเหตุ: ตัวเลขทั้งหมดนับจากบันทึกจริงในช่วงวันที่เลือก — ค่าว่าง/ไม่ระบุแสดงแยกต่างหาก
            ไม่ถูกแทนด้วยศูนย์ · วันที่เป็น พ.ศ. · PDF ของส่วนนี้อยู่ใน Phase 4
          </p>
        </div>
      )}
    </div>
  );
}
