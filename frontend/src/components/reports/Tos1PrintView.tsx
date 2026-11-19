/**
 * ENV-PARITY-P4-001 — the ทส.1 print-ready view.
 *
 * Layout authority: the D1 DRIVE enumeration —
 * `261109_PDF_TEMPLATE_ทส1_V5.1.3_หมอปรัช.docx`
 * (1ptC4G55ftF3Dv74RaL8Vd-yNFgqWsTcc, sha256 378be461…, 2,657,668 B),
 * field layouts mirrored as code (drive-file-wins; never binaries).
 * Honesty pins carried into the printed output: unknown ≠ 0 ("—"),
 * พ.ศ. dates, meter-delta energy provenance, the ×1.2 chlorine note,
 * and NO personnel identity (the ผู้บันทึก column stays empty).
 */
import type { Ts1PrintModel } from "../../lib/pdf";
import "./report-print.css";

function cell(v: number | string | null | undefined): string {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

function eq(v: boolean | null): string {
  return v === true ? "ทำงาน" : v === false ? "หยุด" : "—";
}

export function Tos1PrintView({ model }: { model: Ts1PrintModel }) {
  return (
    <div className="tos-print-area" data-testid="tos-print-view">
      <h1>แบบรายงาน ทส.1</h1>
      <h2>
        เดือน {model.monthThai} พ.ศ. {model.yearThai}
      </h2>

      <p className="tos-print-meta" data-testid="tos1-daycount">
        มีบันทึก {model.recordedDays} วัน · ไม่มีบันทึก {model.missingDays} วัน (ทั้งหมด{" "}
        {model.recordedDays + model.missingDays} วัน) — วันที่ไม่มีบันทึกไม่ถูกนับเป็น 0
      </p>

      <div style={{ overflowX: "auto" }}>
        <table className="tos-print-table">
          <thead>
            <tr>
              {model.columns.map((c, i) => (
                <th key={i} data-testid={`tos1-col-${i}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.dateISO}>
                <td>{r.dateThai}</td>
                <td data-testid={`tos1-cell-energy-${r.dateISO}`}>{cell(r.energy)}</td>
                <td data-testid={`tos1-cell-water-${r.dateISO}`}>{cell(r.waterUsed)}</td>
                <td data-testid={`tos1-cell-wwin-${r.dateISO}`}>{cell(r.wastewaterIn)}</td>
                <td data-testid={`tos1-cell-discharged-${r.dateISO}`}>{cell(r.discharged)}</td>
                <td data-testid={`tos1-cell-chlorine-${r.dateISO}`}>{cell(r.chlorine)}</td>
                <td data-testid={`tos1-cell-sludge-${r.dateISO}`}>{cell(r.sludge)}</td>
                <td data-testid={`tos1-cell-tds-${r.dateISO}`}>{cell(r.tds1)}</td>
                <td data-testid={`tos1-cell-do3-${r.dateISO}`}>{cell(r.do3)}</td>
                {r.equipment.map((e, i) => (
                  <td key={i}>{eq(e)}</td>
                ))}
                <td>{cell(r.recorder)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tos-print-notes">
        <p style={{ fontWeight: 700, margin: "2mm 0 1mm" }}>หมายเหตุ</p>
        <p>๑. ให้กรอกสถิติและข้อมูลเฉพาะในกรณีที่มีสถิติและข้อมูลนั้น ๆ ในแต่ละวัน</p>
        <p>
          ๒. ในกรณีระบบบำบัดน้ำเสียที่มีการติดตั้งเครื่องตรวจวัดคุณภาพน้ำทิ้งแบบอัตโนมัติ
          ให้แนบผลการตรวจวัดคุณภาพน้ำทิ้งทุกวันแยกตามพารามิเตอร์ที่ตรวจวัดและทำการสรุปผลเป็นสถิติและข้อมูลรายเดือน
        </p>
        <p style={{ marginTop: "2mm" }} data-testid="tos1-energy-note">
          · {model.energyProvenance} — วันเปลี่ยน/รีเซ็ตมิเตอร์แสดงค่าว่าง (ไม่ถูกนับเป็น 0)
        </p>
        <p>
          · คลอรีนน้ำ: ค่าที่บันทึกเป็นกิโลกรัมตามระบบบันทึกจริง · แสดงเป็นลิตร = ×1.2 (W/V display
          factor ของระบบเดิม)
        </p>
        <p>· คอลัมน์ผู้บันทึกเว้นว่างตามข้อจำกัดข้อมูลส่วนบุคคล (ระบบใหม่ไม่แสดงชื่อบุคคลในรายงาน)</p>
      </div>

      <div className="tos-print-sign">
        <p>ขอรับรองว่าการบันทึกสถิติและข้อมูลตามตารางข้างต้นถูกต้องทุกประการ</p>
        <p>.......................................................เจ้าของหรือผู้ครอบครองแหล่งกำเนิดมลพิษ</p>
        <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
        <p>........................................................ผู้ควบคุมระบบบำบัดน้ำเสีย</p>
        <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
        <p>ใบอนุญาตเลขที่............................หมดอายุ.................................</p>
        <p>ออกให้โดย...................................................................................</p>
      </div>
    </div>
  );
}
