/**
 * ENV-PARITY-P4-005 — the ถังดับเพลิง print-ready view.
 *
 * Layout authority: the gdoc `รายงานตรวจสอบถังดับเพลิง`
 * (1lKL8xgo_JnFcznMxncJ_kBKHgHpYYLgfOkhKy3WLPqg, txt-export sha256
 * c9f5f439e2b8594b28c56509ee7fec710f5352ff4fee2fc714e32bde5b8fc3a6,
 * 5,143 B), field layouts mirrored as code. Honesty pins carried into
 * the printed output: the SOURCE_UNAVAILABLE master note (the master
 * register stays UNSEEDED — the inspection history renders, never a
 * fabricated master); unknown ≠ 0 ("—"); the COMPUTED ☑/☐ summary pair;
 * พ.ศ. computed year; personnel via the core.personnel display path
 * only (— ไม่ระบุ — fallback) — the template's hardcoded names NEVER
 * render; blank signature rules + date slots.
 */
import type { ExtinguisherPrintModel } from "./family-report-models";
import "./report-print.css";

function cell(v: number | string | null | undefined): string {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

export function ExtinguisherPrintView({ model }: { model: ExtinguisherPrintModel }) {
  return (
    <div className="tos-print-area" data-testid="family-print-view">
      <h1 data-testid="family-print-title">{model.title}</h1>

      {model.notes.length > 0 && (
        <div className="tos-print-notes" style={{ marginTop: "2mm" }}>
          {model.notes.map((n) =>
            n.includes("master") ? (
              <p key={n} className="text-amber-600" data-testid="family-ext-master-note">
                · {n}
              </p>
            ) : (
              <p key={n}>· {n}</p>
            ),
          )}
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
              <tr key={r.seq}>
                <td>{r.seq}</td>
                <td>{cell(r.location)}</td>
                <td>{cell(r.pipe)}</td>
                <td>{cell(r.handle)}</td>
                <td>{cell(r.tank)}</td>
                <td>{cell(r.pressureGauge)}</td>
                <td>{cell(r.barrier)}</td>
                <td>{cell(r.breakdownDetails)}</td>
                <td data-testid={`ext-row-${r.seq}-inspector`}>{cell(r.inspector)}</td>
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
            <p>ลงชื่อ………………………………………หัวหน้างานทราบ</p>
            <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
            <p>วันที่รับทราบ …....../…....../.........</p>
          </div>
        </div>
      </div>
    </div>
  );
}
