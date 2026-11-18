/**
 * ENV-PARITY-P3-003 — the calibration history list (lane P3.3): per-tool
 * ครั้งล่าสุด + จำนวนครั้ง summary + the full 11-row seed history,
 * พ.ศ. dates, honest missing-value rendering.
 *
 * D1-5 honesty (the D2 ruling): NO next-due is computed or shown — the
 * legacy AppSheet table has no next-due column or formula (§3.30's only
 * formula is Cal_date Init TODAY()) and the maintaining cycle fields are
 * measured values, not intervals. The note below states this honestly,
 * never presented as an AppSheet transcription, never a guessed date.
 *
 * Track Z minimal markup; Track F owns polish.
 */
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { TableSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { thaiDate } from "../../lib/utils";
import {
  EMPTY_CALIBRATIONS_LABEL,
  NEXT_DUE_PINNED_ABSENT,
  latestByTool,
  useCalibrations,
} from "../../lib/calibration";

export function CalibrationListSection() {
  const { data: rows, loading, error, refresh } = useCalibrations();
  const summaries = latestByTool(rows);

  return (
    <div data-testid="calibration-list">
      <AuraCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2 flex-wrap">
          <MSymbol name="history" className="text-[20px] text-aura-cyan" />
          <h2 className="font-bold font-thai text-aura-textMain">ประวัติการสอบเทียบเครื่องมือ</h2>
          <span className="text-xs text-aura-textMuted font-mono ml-auto">
            {rows.length} รายการ · {summaries.length} เครื่องมือ
          </span>
          <button className="text-xs text-aura-cyan underline" onClick={() => refresh()} type="button">
            รีเฟรช
          </button>
        </div>
        {error && <p className="px-4 py-2 text-sm text-alert-red font-thai">โหลดไม่สำเร็จ: {error}</p>}
        {loading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : rows.length === 0 ? (
          <div data-testid="calibration-list-empty">
            <EmptyState
              icon={<MSymbol name="verified" className="text-[32px]" />}
              title={EMPTY_CALIBRATIONS_LABEL}
              description="บันทึกรายการแรกด้วยแบบฟอร์ม — ระบบจะไม่เดารายการสอบเทียบแทนของจริง"
            />
          </div>
        ) : (
          <>
            <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border-b border-aura-borderSubtle/40">
              {summaries.map((s) => (
                <div
                  key={s.key}
                  className="rounded-md border border-aura-borderSubtle/60 px-3 py-2"
                  data-testid="calibration-tool-summary"
                >
                  <p className="text-sm font-thai text-aura-textMain font-bold">
                    {s.tool_legacy_id ?? s.item_name ?? "—"}
                  </p>
                  <p className="text-xs text-aura-textMuted font-thai">
                    ครั้งล่าสุด {thaiDate(s.latest_date)} · จำนวน {s.count} ครั้ง
                  </p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle/60">
                    <th className="px-4 py-2 font-thai">วันที่สอบเทียบ</th>
                    <th className="px-4 py-2 font-thai">เครื่องมือ</th>
                    <th className="px-4 py-2 font-thai">วิธีสอบเทียบ</th>
                    <th className="px-4 py-2 font-thai">ผลสอบเทียบ</th>
                    <th className="px-4 py-2 font-thai">ค่าที่วัดได้</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-aura-borderSubtle/40">
                      <td className="px-4 py-2 font-thai">{thaiDate(r.calibration_date)}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {r.tool_legacy_id ?? r.item_name ?? "—"}
                      </td>
                      <td className="px-4 py-2 font-thai">
                        {r.cal_method ?? <span className="text-aura-textMuted">—</span>}
                      </td>
                      <td className="px-4 py-2 font-thai">
                        {r.cal_result ?? <span className="text-aura-textMuted">ยังไม่ทราบ</span>}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {r.calibrate_range
                          ? `${r.calibrate_range} ${r.calibrate_unit ?? ""}`.trim()
                          : <span className="text-aura-textMuted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="px-4 py-2 border-t border-aura-borderSubtle/40">
          <p className="text-xs text-aura-textMuted font-thai" data-testid="next-due-absent-note">
            {NEXT_DUE_PINNED_ABSENT &&
              "หมายเหตุความถูกต้อง: ระบบเดิมไม่มีข้อมูล 'ครั้งถัดไป' (ไม่มีคอลัมน์หรือสูตรวันสอบเทียบถัดไปในตารางเดิม) — ENV จึงแสดงเฉพาะ ครั้งล่าสุด + จำนวนครั้ง และไม่คำนวณวันถัดไปให้ เพื่อไม่เดาค่าแทนของจริง"}
          </p>
        </div>
      </AuraCard>
    </div>
  );
}
