/**
 * ENV-PARITY-P2-004 — the coliform ×3 two-step testing flow (น้ำ / อาหาร /
 * พนักงาน / ทั่วไป) as ADDITIVE UI on the /food surface (WO §6: extend the
 * existing FoodPage; the legacy single-step form/list is preserved).
 *
 * Step 1 — บันทึกเก็บตัวอย่าง (collect): sample_source picker gates the
 *   verbatim vocabulary (collect points per source; พนักงาน = personnel
 *   pick, NO collect point); อุปกรณ์ defaults verbatim (read-only legacy
 *   Item ids — core.item does not exist yet); collect_date defaults to
 *   today (พ.ศ. display elsewhere); result fields stay NULL (รอผล).
 * Step 2 — กรอกผลภายหลัง (result, later): pending rows list first; the
 *   verbatim Show If `TODAY()>[Collect_date]` (ref 3656/3838) gates the
 *   result form — a same-day collect renders the รอผล badge and NO
 *   editable result (honest AppSheet parity, D1-7). Result value sets per
 *   source verbatim; suggested +1/+2 วัน chips (food/employee rows only)
 *   are CLICKABLE SUGGESTIONS — never auto-filled; ภาพผลการตรวจ attaches
 *   via the house core.attachment pattern (P2.3 pic_path precedent).
 *
 * Personnel resolution is UUID-or-NULL through core.personnel pickers —
 * verbatim national-ID-class identifiers NEVER enter the UI or storage
 * (PII pin D1-5).
 */
import { useMemo, useState } from "react";
import { thaiDate, toLocalISODate } from "../../lib/utils";
import { useToast } from "../ui/Toast";
import { AuraCard } from "../ui/AuraCard";
import { Button } from "../ui/Button";
import { Field, Input, Select, NumberInput } from "../ui/Input";
import { useInspectors } from "../../lib/hooks";
import { uploadAttachment } from "../../lib/attachments";
import { useItems, formatItemOption, EMPTY_ITEM_PICKER_LABEL } from "../../lib/masters";
import {
  COLIFORM_SOURCES,
  EQUIPMENT_DEFAULTS,
  TEST_TYPE_DEFAULT,
  collectPointsFor,
  createColiformSample,
  eligibleCollectors,
  eligibleReporters,
  eligibleSamplePersons,
  isPendingResult,
  resultSetFor,
  saveColiformResult,
  showResultFields,
  suggestedResultDates,
  suggestsResultDates,
  type ColiformPersonnelOption,
  type ColiformSource,
  type FoodLabTest,
} from "../../lib/food";

const EMPTY = "";
const UNSET = "— ไม่ระบุ —";

function asSource(v: string | null | undefined): ColiformSource {
  return (COLIFORM_SOURCES as readonly string[]).includes(v ?? "") ? (v as ColiformSource) : "ทั่วไป";
}

/** Collect-date DESC + deterministic id tiebreak (the AppSheet
 * re_check/SortKey transcription family — WO §4.5). */
function byNewestFirst(a: FoodLabTest, b: FoodLabTest): number {
  return b.sample_date.localeCompare(a.sample_date) || a.id.localeCompare(b.id);
}

export function ColiformFlow({ rows, onChanged }: { rows: FoodLabTest[]; onChanged: () => void }) {
  const { toast } = useToast();
  const { data: personnel } = useInspectors();
  const today = toLocalISODate();

  // ── step 1 (collect) state ──
  const [source, setSource] = useState<ColiformSource>("น้ำ");
  const [collectDate, setCollectDate] = useState(today);
  const [collectPoint, setCollectPoint] = useState<string>("");
  const [samplePersonId, setSamplePersonId] = useState(EMPTY);
  const [collectorId, setCollectorId] = useState(EMPTY);
  const [collectBusy, setCollectBusy] = useState(false);
  // ENV-PARITY-P3-001 (D1-4) — the อุปกรณ์ picker over core.item; unset
  // stays NULL (the verbatim legacy default keeps carrying equipment_legacy).
  const [equipmentId, setEquipmentId] = useState(EMPTY);
  const { data: items } = useItems();

  const points = collectPointsFor(source);
  const equipment = EQUIPMENT_DEFAULTS[source];
  const persons: ColiformPersonnelOption[] = eligibleSamplePersons(personnel);
  const collectors = eligibleCollectors(personnel);

  // ── step 2 (pending rows) state ──
  const pending = useMemo(
    () => rows.filter((r) => isPendingResult(r)).sort(byNewestFirst),
    [rows],
  );
  const [resultByRow, setResultByRow] = useState<Record<string, string>>({});
  const [resultDateByRow, setResultDateByRow] = useState<Record<string, string>>({});
  const [mpnByRow, setMpnByRow] = useState<Record<string, string>>({});
  const [reporterByRow, setReporterByRow] = useState<Record<string, string>>({});
  const [imageByRow, setImageByRow] = useState<Record<string, File | null>>({});
  const [resultBusy, setResultBusy] = useState(false);

  async function submitCollect() {
    if (!collectDate.trim()) {
      toast("error", "กรุณาระบุวันที่เก็บตัวอย่างก่อนบันทึก");
      return;
    }
    if (source === "พนักงาน" && samplePersonId === EMPTY) {
      toast("error", "กรุณาเลือกผู้ถูกตรวจ (พนักงาน)");
      return;
    }
    if (source !== "พนักงาน" && points.length > 0 && collectPoint === EMPTY) {
      toast("error", "กรุณาเลือกจุดเก็บตัวอย่าง");
      return;
    }
    setCollectBusy(true);
    try {
      await createColiformSample({
        sample_source: source,
        collect_point: source === "พนักงาน" || points.length === 0 ? null : collectPoint,
        sample_person_id: source === "พนักงาน" ? samplePersonId : null,
        collected_by_id: collectorId === EMPTY ? null : collectorId,
        equipment_id: equipmentId === EMPTY ? null : equipmentId,
        equipment_legacy: equipment,
        sample_date: collectDate,
        test_type: TEST_TYPE_DEFAULT,
        source_provenance: "ENV UI manual entry (P2.4 coliform two-step)",
      });
      toast("success", "บันทึกการเก็บตัวอย่างแล้ว — รอผล");
      setCollectPoint(EMPTY);
      setSamplePersonId(EMPTY);
      onChanged();
    } catch (e) {
      toast("error", `ผิดพลาด: ${(e as Error).message}`);
    } finally {
      setCollectBusy(false);
    }
  }

  async function submitResult(row: FoodLabTest) {
    const result = resultByRow[row.id] ?? EMPTY;
    const resultDate = resultDateByRow[row.id] ?? today;
    if (!result) {
      toast("error", "กรุณาเลือกผลการตรวจ");
      return;
    }
    if (!resultDate) {
      toast("error", "กรุณาระบุวันที่ผล");
      return;
    }
    setResultBusy(true);
    try {
      let imagePath: string | undefined;
      const file = imageByRow[row.id];
      if (file) {
        imagePath = (await uploadAttachment(file, "coliform_lab_test", row.id, "result-image")).file_path;
      }
      const mpn = mpnByRow[row.id];
      await saveResultPatch(row.id, {
        result,
        reported_date: resultDate,
        mpn_value: mpn ? Number(mpn) : null,
        reporter_id: reporterByRow[row.id] === EMPTY || !reporterByRow[row.id] ? null : reporterByRow[row.id],
        result_image: imagePath,
      });
      toast("success", "บันทึกผลตรวจแล้ว");
      onChanged();
    } catch (e) {
      toast("error", `ผิดพลาด: ${(e as Error).message}`);
    } finally {
      setResultBusy(false);
    }
  }

  async function saveResultPatch(id: string, patch: {
    result: string;
    reported_date: string;
    mpn_value: number | null;
    reporter_id: string | null;
    result_image?: string;
  }) {
    await saveColiformResult(id, patch);
  }

  return (
    <AuraCard className="p-4 space-y-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold font-display tracking-tight text-aura-textMain">
          ตรวจ coliform — เก็บตัวอย่าง → กรอกผลภายหลัง
        </h2>
        <p className="text-xs text-aura-textMuted font-thai mt-1">
          น้ำ / อาหาร / พนักงาน / ทั่วไป — บันทึกผลได้ตั้งแต่วันรองจากวันเก็บ (ตามเงื่อนไขเดิมของ AppSheet)
        </p>
      </div>

      {/* ── STEP 1 — collect ── */}
      <div className="space-y-3 rounded-xl border border-aura-border/60 p-3">
        <p className="text-sm font-semibold font-thai text-aura-textMain">1) บันทึกเก็บตัวอย่าง</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="แหล่งตัวอย่าง" htmlFor="coliform-source">
            <Select
              id="coliform-source"
              data-testid="coliform-source"
              value={source}
              onChange={(e) => {
                setSource(e.target.value as ColiformSource);
                setCollectPoint(EMPTY);
                setSamplePersonId(EMPTY);
                setEquipmentId(EMPTY);
              }}
            >
              {COLIFORM_SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="วันที่เก็บ" htmlFor="coliform-collect-date">
            <Input
              id="coliform-collect-date"
              data-testid="coliform-collect-date"
              type="date"
              value={collectDate}
              onChange={(e) => setCollectDate(e.target.value)}
            />
          </Field>
          {points.length > 0 && (
            <Field label="จุดเก็บตัวอย่าง" htmlFor="coliform-collect-point">
              <Select
                id="coliform-collect-point"
                data-testid="coliform-collect-point"
                value={collectPoint}
                onChange={(e) => setCollectPoint(e.target.value)}
              >
                <option value="">— เลือกจุดเก็บ —</option>
                {points.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </Field>
          )}
          {source === "พนักงาน" && (
            <Field
              label="ผู้ถูกตรวจ (พนักงาน)"
              htmlFor="coliform-sample-person"
              hint="แสดงเฉพาะตำแหน่ง นักโภชนาการ / พนักงานประกอบอาหาร"
            >
              <Select
                id="coliform-sample-person"
                data-testid="coliform-sample-person"
                value={samplePersonId}
                onChange={(e) => setSamplePersonId(e.target.value)}
              >
                <option value={EMPTY}>{UNSET}</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.position})</option>
                ))}
              </Select>
            </Field>
          )}
          <Field
            label="ผู้เก็บตัวอย่าง"
            htmlFor="coliform-collector"
            hint="แสดงเฉพาะตำแหน่ง นักวิชาการสาธารณสุข ที่ไม่ใช่สถานะลาออก"
          >
            <Select
              id="coliform-collector"
              data-testid="coliform-collector"
              value={collectorId}
              onChange={(e) => setCollectorId(e.target.value)}
            >
              <option value={EMPTY}>{UNSET}</option>
              {collectors.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.position})</option>
              ))}
            </Select>
          </Field>
          {equipment && (
            <Field label="อุปกรณ์ (legacy)" htmlFor="coliform-equipment" hint="รหัสอุปกรณ์เดิมจาก AppSheet Items — เชื่อม master จริงใน Phase 3">
              <Input
                id="coliform-equipment"
                data-testid="coliform-equipment"
                value={equipment}
                readOnly
                aria-readonly="true"
              />
            </Field>
          )}
          {items.length > 0 ? (
            <Field
              label="อุปกรณ์ (Items master)"
              htmlFor="coliform-equipment-select"
              hint="เลือกจาก master Items — ค่าว่าง = ใช้ค่าเริ่มต้น legacy"
            >
              <Select
                id="coliform-equipment-select"
                data-testid="coliform-equipment-select"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
              >
                <option value="">{UNSET}</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{formatItemOption(it)}</option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="อุปกรณ์ (Items master)">
              <p
                data-testid="coliform-equipment-empty"
                className="text-xs text-aura-textMuted font-thai rounded-lg border border-aura-borderSubtle/60 px-3 py-2"
              >
                {EMPTY_ITEM_PICKER_LABEL} — master Items ยังไม่มีข้อมูลจาก Sheets (ผู้ดูแลระบบเพิ่มได้ที่ /admin/masters); ระบบจะไม่แสดงรายการแทน
              </p>
            </Field>
          )}
        </div>
        <Button onClick={submitCollect} disabled={collectBusy} data-testid="coliform-collect-save">
          บันทึกเก็บตัวอย่าง
        </Button>
      </div>

      {/* ── STEP 2 — pending rows + result entry ── */}
      <div className="space-y-3 rounded-xl border border-aura-border/60 p-3">
        <p className="text-sm font-semibold font-thai text-aura-textMain">
          2) กรอกผลภายหลัง — รายการที่ยังรอผล ({pending.length})
        </p>
        {pending.length === 0 ? (
          <p className="text-sm text-aura-textMuted font-thai" data-testid="coliform-pending-empty">
            ไม่มีรายการรอผล
          </p>
        ) : (
          <div className="space-y-3" data-testid="coliform-pending-list" role="region" aria-label="รายการรอผล coliform">
            {pending.map((row) => {
              const rowSource = asSource(row.sample_source);
              const gate = showResultFields(row.sample_date, today);
              const rowReporters = eligibleReporters(personnel, rowSource);
              const suggests = suggestsResultDates(rowSource);
              const [d1, d2] = suggests ? suggestedResultDates(row.sample_date) : ["", ""];
              return (
                <div
                  key={row.id}
                  data-testid={`coliform-pending-row-${row.id}`}
                  className="rounded-lg border border-aura-border/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-thai text-aura-textMain">
                      <span className="font-semibold">{rowSource}</span>
                      {row.collect_point ? ` · ${row.collect_point}` : ""}
                      {row.sample_person_id
                        ? ` · ${persons.find((p) => p.id === row.sample_person_id)?.full_name ?? "พนักงาน"}`
                        : ""}
                      {" · เก็บ "}
                      {thaiDate(row.sample_date)}
                    </p>
                    {!gate && (
                      <span
                        data-testid={`coliform-รอผล-${row.id}`}
                        className="text-xs font-thai px-2 py-0.5 rounded-full bg-aura-border/30 text-aura-textMuted"
                      >
                        รอผล
                      </span>
                    )}
                  </div>
                  {gate ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <Field label="ผลการตรวจ" htmlFor={`coliform-result-select-${row.id}`}>
                        <Select
                          id={`coliform-result-select-${row.id}`}
                          data-testid="coliform-result-select"
                          value={resultByRow[row.id] ?? EMPTY}
                          onChange={(e) => setResultByRow({ ...resultByRow, [row.id]: e.target.value })}
                        >
                          <option value="">{UNSET}</option>
                          {resultSetFor(rowSource).map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="วันที่ผล" htmlFor={`coliform-result-date-${row.id}`}>
                        <Input
                          id={`coliform-result-date-${row.id}`}
                          data-testid="coliform-result-date"
                          type="date"
                          value={resultDateByRow[row.id] ?? today}
                          onChange={(e) => setResultDateByRow({ ...resultDateByRow, [row.id]: e.target.value })}
                        />
                        {suggests && (
                          <div className="flex gap-2 mt-1" data-testid={`coliform-suggest-${row.id}`}>
                            <button
                              type="button"
                              data-testid="coliform-suggest-chip-1"
                              className="text-xs font-thai px-2 py-1 rounded-full border border-aura-border/60 text-aura-textMuted hover:bg-aura-border/20"
                              onClick={() => setResultDateByRow({ ...resultDateByRow, [row.id]: d1 })}
                            >
                              +1 วัน ({d1})
                            </button>
                            <button
                              type="button"
                              data-testid="coliform-suggest-chip-2"
                              className="text-xs font-thai px-2 py-1 rounded-full border border-aura-border/60 text-aura-textMuted hover:bg-aura-border/20"
                              onClick={() => setResultDateByRow({ ...resultDateByRow, [row.id]: d2 })}
                            >
                              +2 วัน ({d2})
                            </button>
                          </div>
                        )}
                      </Field>
                      <Field label="MPN/100ml (ถ้ามี)" htmlFor={`coliform-result-mpn-${row.id}`}>
                        <NumberInput
                          id={`coliform-result-mpn-${row.id}`}
                          data-testid="coliform-result-mpn"
                          value={mpnByRow[row.id] ?? EMPTY}
                          onChange={(e) => setMpnByRow({ ...mpnByRow, [row.id]: e.target.value })}
                        />
                      </Field>
                      <Field
                        label="ผู้รายงาน"
                        htmlFor={`coliform-result-reporter-${row.id}`}
                        hint={rowSource === "อาหาร" || rowSource === "พนักงาน" ? "ตำแหน่ง นักวิชาการสาธารณสุข" : "ทุกตำแหน่งยกเว้น นายแพทย์"}
                      >
                        <Select
                          id={`coliform-result-reporter-${row.id}`}
                          data-testid="coliform-result-reporter"
                          value={reporterByRow[row.id] ?? EMPTY}
                          onChange={(e) => setReporterByRow({ ...reporterByRow, [row.id]: e.target.value })}
                        >
                          <option value={EMPTY}>{UNSET}</option>
                          {rowReporters.map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name} ({p.position})</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="ภาพผลการตรวจ (ถ้ามี)" htmlFor={`coliform-result-image-${row.id}`}>
                        <Input
                          id={`coliform-result-image-${row.id}`}
                          data-testid="coliform-result-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageByRow({ ...imageByRow, [row.id]: e.target.files?.[0] ?? null })}
                        />
                      </Field>
                      <div className="flex items-end">
                        <Button
                          onClick={() => submitResult(row)}
                          disabled={resultBusy}
                          data-testid="coliform-result-save"
                        >
                          บันทึกผล
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-aura-textMuted font-thai">
                      กรอกผลได้ตั้งแต่วันรองจากวันเก็บ (แนะนำ +1/+2 วัน) — วันเก็บวันนี้ยังรอผลตามเงื่อนไขเดิม
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuraCard>
  );
}
