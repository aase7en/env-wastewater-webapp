/**
 * ENV-PARITY-P4-005 — the ไฟฉุกเฉิน print-ready view.
 *
 * Layout authority: the gdoc `รายงานตรวจสอบไฟฉุกเฉิน`
 * (1MDUy6PHBXPISfnKGXyGnRZPJpT1ef4RHbeODQ9f_Pi4, txt-export sha256
 * fad4cef1282fb898dc28763d3f6ce5b3867e71aadfc58e91f4f046c89f1d28df,
 * 4,300 B), field layouts mirrored as code. The month's
 * `safety.emergency_light_check` records render AS-IS (the delivered
 * history — the 1 NULL light_id row included, never normalized);
 * unknown ≠ 0; the COMPUTED ☑/☐ pair; personnel via the
 * core.personnel display path only; blank signature rules + date slots.
 */
import type { LightPrintModel } from "./family-report-models";
import "./report-print.css";

function cell(v: number | string | null | undefined): string {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

export function LightPrintView({ model }: { model: LightPrintModel }) {
  return (
    <div className="tos-print-area" data-testid="family-print-view">
      <h1 data-testid="family-print-title">{model.title}</h1>

      {model.notes.length > 0 && (
        <div className="tos-print-notes" style={{ marginTop: "2mm" }}>
          {model.notes.map((n) => (
            <p key={n}>· {n}</p>
          ))}
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: "3mm" }}>
        <table className="tos-print-table" data-testid="family-print-columns">
          <thead>
            <tr>
              {model.columns.map((c, i) => (
                <th key={i} data-testid={`family-col-${i}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.length === 0 && (
              <tr>
                <td colSpan={model.columns.length}>ไม่มีรายการตรวจสอบในเดือนนี้</td>
              </tr>
            )}
            {model.rows.map((r) => (
              <tr key={r.id} data-testid={`light-row-${r.seq}`}>
                <td>{r.seq}</td>
                <td data-testid={`light-cell-location-${r.id}`}>{cell(r.location)}</td>
                <td>{cell(r.testResult)}</td>
                <td>{cell(r.position)}</td>
                <td data-testid={`light-cell-status-${r.id}`}>{cell(r.status)}</td>
                <td>{cell(r.auditor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tos-print-meta" style={{ marginTop: "4mm" }}>
        <p style={{ fontWeight: 700 }}>สรุปผลการตรวจสอบ:</p>
        <p data-testid="family-summary-ready">{model.summaryReady ?? "ไม่มีรายการตรวจสอบในเดือนนี้ (ไม่ออกความพร้อมใช้งานจากข้อมูลว่าง)"}</p>
        <p data-testid="family-summary-action">{model.summaryAction ?? ""}</p>
      </div>

      <div className="tos-print-sign">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p>ลงชื่อ………………………………………ผู้ตรวจสอบ</p>
            <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
            <p>วันที่ตรวจสอบ …....../…....../.........</p>
          </div>
          <div>
            <p>ลงชื่อ……………………………………….หัวหน้างาน</p>
            <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
            <p>วันที่รับทราบ …....../…....../.........</p>
          </div>
        </div>
      </div>
    </div>
  );
}
