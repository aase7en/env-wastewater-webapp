/**
 * ENV-PARITY-P4-001 — the ทส.2 print-ready view.
 *
 * Layout authority: the D1 DRIVE enumeration — `ทส.2_Template_หมอปรัช`
 * (Google Docs, 1Wj16uu2q5pTbWTeOs-U6rOpH7X79h6zP2yDudEGkU80,
 * txt-export sha256 c6e67afa…, 8,684 B), field layouts mirrored as code.
 * Honesty pins carried into the printed output: the §๑ address header
 * reads the B7 address TABLE (missing row → honest notice, never the
 * template constants masquerading as data); พ.ศ. heading; estimate/
 * provenance flags (meter-delta energy, ×1.2 chlorine litter); §๓(๔)+(๖)
 * are COMPUTED from recorded rows (never the template's asserted ☑);
 * NO personnel identity (signature rule lines only).
 */
import type { Ts2PrintModel } from "../../lib/pdf";
import { fmt } from "../../lib/utils";
import "./report-print.css";

export function Tos2PrintView({ model }: { model: Ts2PrintModel }) {
  const addr = model.addressHeader;
  const s3 = model.section3;
  return (
    <div className="tos-print-area" data-testid="tos-print-view">
      <h1>แบบ ทส.2</h1>
      <h2>รายงานสรุปผลการทำงานของระบบบำบัดน้ำเสีย</h2>

      <div className="tos-print-meta">
        <h3>๑.ข้อมูลทั่วไป</h3>
        <p>
          แหล่งกำเนิดมลพิษ ตั้งอยู่ที่ {addr.hospital} เลขที่ {addr.houseNo} หมู่ที่ {addr.moo}{" "}
          ซอย {addr.soi} ถนน {addr.road} แขวง/ตำบล{" "}
          <span data-testid="tos2-addr-tambon">{addr.missing ? "ยังไม่พบข้อมูลในตารางที่อยู่" : addr.tambon}</span>{" "}
          เขต/อำเภอ{" "}
          <span data-testid="tos2-addr-district">{addr.missing ? "ยังไม่พบข้อมูลในตารางที่อยู่" : addr.district}</span>{" "}
          จังหวัด{" "}
          <span data-testid="tos2-addr-province">{addr.missing ? "ยังไม่พบข้อมูลในตารางที่อยู่" : addr.province}</span>{" "}
          โทรศัพท์ {addr.phone}
        </p>
        <p>ประกอบกิจการประเภท {addr.businessType}</p>
        <p>
          ในการนี้ขอรายงานสรุปผลการทำงานของระบบบำบัดน้ำเสียของแหล่งกำเนิดมลพิษสำหรับเดือน{" "}
          <span data-testid="tos2-month-year">
            {model.monthThai} พ.ศ. {model.yearThai}
          </span>{" "}
          ตามที่ได้กำหนดในมาตรา ๘๐ แห่งพระราชบัญญัติส่งเสริมและรักษาคุณภาพสิ่งแวดล้อมแห่งชาติ พ.ศ. ๒๕๓๕
        </p>
        <p data-testid="tos2-daycount">
          มีบันทึก {model.recordedDays} วัน · ไม่มีบันทึก {model.missingDays} วัน — วันที่ไม่มีบันทึกไม่ถูกนับเป็น 0
        </p>
      </div>

      <div className="tos-print-sign">
        <p>………………………………………………………เจ้าของหรือผู้ครอบครองแหล่งกำเนิดมลพิษ</p>
        <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
        <p>……………………………………………………..ผู้ควบคุมระบบบำบัดน้ำเสีย</p>
        <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
        <p>ใบอนุญาตเลขที่………………………………….หมดอายุ……………………………………………</p>
        <p>ออกให้โดย…………………………………………………………………………………………………..</p>
        <p>……………………………………………….…..ผู้รับจ้างให้บริการบำบัดน้ำเสีย</p>
        <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
        <p>ใบอนุญาตเลขที่………………………………….หมดอายุ……………………………………………</p>
        <p>ออกให้โดย…………………………………………………………………………………………………..</p>
      </div>

      <div className="tos-print-meta">
        <h3>๒.ข้อมูลเกี่ยวกับระบบบำบัดน้ำเสีย และแหล่งรองรับน้ำทิ้ง</h3>
        <p>(๑) ประเภท/ชนิดของระบบบำบัดน้ำเสีย {model.section2.systemType} ความสามารถในการรองรับน้ำเสีย {model.section2.capacity}</p>
        <p>(๒) การทำงานของระบบบำบัดน้ำเสีย ☑ {model.section2.operation}</p>
        <p>(๓) อุปกรณ์และเครื่องมือที่ใช้ {model.section2.equipment.map((e) => `☑ ${e}`).join(" ")}</p>
        <p>(๔) แหล่งรองรับน้ำทิ้ง (ระบุ) {model.section2.receivingWater}</p>
        <p>(๕) วิธีจัดการตะกอนที่เกิดขึ้นจากระบบบำบัดน้ำเสียและวิธีกำจัด {model.section2.sludgeMgmt}</p>
      </div>

      <div className="tos-print-meta">
        <h3>๓.สรุปผลการทำงานของระบบบำบัดน้ำเสียเป็นรายเดือน</h3>
        <p data-testid="tos2-energy">
          (๑) ปริมาณการใช้ไฟฟ้าของระบบบำบัดน้ำเสีย (หน่วย) {fmt(s3.sumEnergy, 1)}
        </p>
        <p className="tos-print-notes" data-testid="tos2-energy-note">
          · {s3.sumEnergyProvenance}
        </p>
        <p data-testid="tos2-sum-water">
          (๒) ปริมาณน้ำใช้ทุกกกิจกรรมในแหล่งกำเนิดมลพิษ (ลบ.ม.) {fmt(s3.sumWater, 1)}
        </p>
        <p className="tos-print-notes">· {s3.sumWaterProvenance}</p>
        <p data-testid="tos2-sum-wastewater">
          (๓) ปริมาณน้ำเสียที่เข้าระบบบำบัดน้ำเสีย (ลบ.ม.) {fmt(s3.sumWasteWater, 1)}
        </p>
        <p data-testid="tos2-discharge">(๔) การระบายน้ำทิ้งจากระบบบำบัดน้ำเสีย {s3.dischargeLine}</p>
        <p data-testid="tos2-chlorine">
          (๕) ปริมาณสารเคมีหรือสารสกัดชีวภาพที่ใช้ (ลิตร) {fmt(s3.chlorineLitter, 2)} ลิตร (คลอรีนที่ใช้จริง{" "}
          {fmt(s3.chlorineReal, 2)} กก.)
        </p>
        <p className="tos-print-notes" data-testid="tos2-chlorine-note">
          · {s3.chlorineProvenance}
        </p>
        <p>(๖) การทำงานของระบบบำบัดน้ำเสียและอุปกรณ์</p>
        <ul data-testid="tos2-operations">
          {s3.operations.map((o) => (
            <li key={o.label}>
              {o.label}: {o.status}
            </li>
          ))}
        </ul>
        <p data-testid="tos2-sludge">
          (๗) ปริมาณตะกอนส่วนเกินจากระบบบำบัดน้ำเสียที่นำไปกำจัด (ลบ.ม.) {fmt(s3.sludge, 1)}
        </p>
        <p>(๘) ปัญหา อุปสรรค์ และแนวทางแก้ไข ………………………………………………</p>
      </div>

      <div className="tos-print-notes">
        <p style={{ fontWeight: 700, margin: "2mm 0 1mm" }}>คำเตือน</p>
        {model.warnings.map((w) => (
          <p key={w.slice(0, 4)}>{w}</p>
        ))}
      </div>
    </div>
  );
}
