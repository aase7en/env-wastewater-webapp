/**
 * ENV-PARITY-P4-005 — the น้ำประปา print-ready view.
 *
 * Layout authority (THE HONEST DIVERGENCE): no น้ำประปา template FILE
 * exists — the layout authority is the GENERATED SAMPLE
 * `รายงานน้ำประปา-1.pdf` (1AhI3lkDEYiDHoVPkVjD95RpmG-qrW5FP, sha256
 * 8d0e81c5d97e2f8a9f13381c19e6509489adc6cf26c42f15c81b52bda0c050bd,
 * 116,723 B, 15 pages) + the ref-12 §3.10/§3.8 censuses — recorded via
 * the layout-authority note, never presented as a mirrored template.
 * The two monthly totals come from the delivered P1.5 surface
 * (buildWaterSupplySummary) with the estimate/chain provenance flags
 * carried into the print (÷10 chlorine per A3; the spec/pump-hour
 * estimates per A2); unknown ≠ 0; พ.ศ.; personnel display path only.
 */
import type { WaterPrintModel } from "./family-report-models";
import "./report-print.css";

function cell(v: number | string | null | undefined): string {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

export function WaterPrintView({ model }: { model: WaterPrintModel }) {
  const [waterLine, chlorineLine] = model.summaryLines;
  return (
    <div className="tos-print-area" data-testid="family-print-view">
      <h1 data-testid="family-print-title">{model.title}</h1>

      <p className="tos-print-notes" data-testid="family-water-layout-note" style={{ marginTop: "2mm" }}>
        · {model.layoutAuthorityNote}
      </p>

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
                <td colSpan={model.columns.length}>ไม่มีบันทึกในเดือนนี้</td>
              </tr>
            )}
            {model.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.dateThai}</td>
                <td>{cell(r.hourMeter)}</td>
                <td data-testid={`water-cell-water-${r.id}`}>{cell(r.waterIn)}</td>
                <td>{cell(r.chlorineLiters)}</td>
                <td data-testid={`water-cell-recorder-${r.id}`}>{cell(r.recorder)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tos-print-meta" style={{ marginTop: "4mm" }}>
        <p style={{ fontWeight: 700 }}>สรุปผลการตรวจสอบ:</p>
        <p data-testid="family-water-total-water">{waterLine}</p>
        <p data-testid="family-water-total-chlorine">{chlorineLine}</p>
      </div>

      <div className="tos-print-notes">
        <p style={{ fontWeight: 700, margin: "2mm 0 1mm" }}>หมายเหตุ</p>
        {model.notes.map((n) => (
          <p key={n.slice(0, 24)}>· {n}</p>
        ))}
        <p>· ตัวเลขรวมมาจากมุมมองน้ำประปา P1.5 เดิม (บันทึกจริง) — ค่าประมาณทั้งหมดมีธงกำกับแยกต่างหาก ไม่ถูกรวมเข้ายอดบันทึกจริง</p>
      </div>

      <div className="tos-print-sign">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p>ลงชื่อ………………………………………ผู้ตรวจสอบ</p>
            <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
            <p>วันที่ตรวจสอบ …....../…....../.........</p>
          </div>
          <div>
            <p>ลงชื่อ………………………………………หัวหน้างาน</p>
            <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
            <p>วันที่รับทราบ …....../…....../.........</p>
          </div>
        </div>
      </div>
    </div>
  );
}
