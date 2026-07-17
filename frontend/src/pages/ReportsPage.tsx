import { useState } from "react";
import { FileText, Download, Calendar, AlertCircle } from "lucide-react";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { useDashboard } from "../lib/hooks";
import { downloadPDF, generateRepairRequest, generateTs1, generateTs2 } from "../lib/pdf";
import type { RepairRequestInput } from "../lib/pdf";

const TEMPLATES = [
  {
    key: "ts1",
    code: "ทส.1",
    title: "บันทึกการตรวจวัดรายวัน",
    description: "ตารางค่า DO/pH/Cl/TDS/ปริมาณน้ำ รายวันของเดือนที่เลือก",
  },
  {
    key: "ts2",
    code: "ทส.2",
    title: "สรุปการตรวจวัดรายเดือน",
    description: "ค่าเฉลี่ย + จำนวนวันผิดปกติ + ปริมาณน้ำรวมของเดือน",
  },
  {
    key: "repair",
    code: "ใบแจ้งซ่อม",
    title: "ใบแจ้งซ่อมอุปกรณ์",
    description: "ฟอร์มแจ้งซ่อมแบบ standalone — กรอกเอง + ดาวน์โหลด PDF",
  },
] as const;

type TemplateKey = (typeof TEMPLATES)[number]["key"];

const THIS_MONTH = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${months[(m || 1) - 1]} ${y + 543}`;
}

export function ReportsPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<TemplateKey>("ts1");
  const [month, setMonth] = useState(THIS_MONTH);
  // Pull the latest ~60 days of dashboard rows so we have at least 1–2 months.
  const { data: rows } = useDashboard(60);

  // Repair request form state
  const [repair, setRepair] = useState<RepairRequestInput>({
    date: new Date().toISOString().slice(0, 10),
    cause: "",
    equipment: "",
    reporter: "",
    status: "open",
  });

  const onDownload = () => {
    try {
      // Filter dashboard rows to the selected month (YYYY-MM).
      const monthRows = rows.filter((r) => r.reading_date.startsWith(month));
      if ((selected === "ts1" || selected === "ts2") && monthRows.length === 0) {
        toast.warning(`ไม่มีข้อมูลในเดือน ${monthLabel(month)}`);
        return;
      }
      const label = monthLabel(month);
      if (selected === "ts1") {
        downloadPDF(generateTs1(monthRows, label), `ทส.1_${month}.pdf`);
        toast.success(`ดาวน์โหลด ทส.1 เดือน ${label} แล้ว`);
      } else if (selected === "ts2") {
        downloadPDF(generateTs2(monthRows, label), `ทส.2_${month}.pdf`);
        toast.success(`ดาวน์โหลด ทส.2 เดือน ${label} แล้ว`);
      } else {
        if (!repair.cause.trim()) {
          toast.error("กรุณากรอกสาเหตุการแจ้งซ่อม");
          return;
        }
        downloadPDF(generateRepairRequest(repair), `ใบแจ้งซ่อม_${repair.date}.pdf`);
        toast.success("ดาวน์โหลดใบแจ้งซ่อมแล้ว");
      }
    } catch (e) {
      toast.error(`สร้าง PDF ไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="text-aura-textMain">เอกสาร</span>
          <span className="aura-text-gradient"> รายงาน</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          สร้างและดาวน์โหลดเอกสารรายงานในรูปแบบ PDF — ทำงานในเบราว์เซอร์ ไม่ต้องส่งข้อมูลออกเซิร์ฟเวอร์
        </p>
      </header>

      {/* Template chooser */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSelected(t.key)}
            className={
              "text-left p-4 rounded-2xl border transition-all font-thai " +
              (selected === t.key
                ? "bg-aura-cyan/10 border-aura-cyan/50 shadow-aura-glow-cyan"
                : "bg-aura-bg/40 border-aura-borderSubtle hover:border-aura-cyan/30")
            }
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className={"w-5 h-5 " + (selected === t.key ? "text-aura-cyan" : "text-aura-textMuted")} />
              <span className="text-xs font-bold text-aura-textMuted">{t.code}</span>
            </div>
            <div className="font-semibold text-aura-textMain">{t.title}</div>
            <div className="text-xs text-aura-textMuted mt-1">{t.description}</div>
          </button>
        ))}
      </div>

      {/* Parameters + download */}
      <AuraCard className="space-y-4">
        {(selected === "ts1" || selected === "ts2") && (
          <Field label="เดือนที่ต้องการรายงาน" required>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aura-textMuted pointer-events-none" />
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="pl-10"
              />
            </div>
          </Field>
        )}

        {selected === "repair" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่แจ้ง" required>
                <Input
                  type="date"
                  value={repair.date}
                  onChange={(e) => setRepair({ ...repair, date: e.target.value })}
                />
              </Field>
              <Field label="อุปกรณ์ที่ชำรุด">
                <Input
                  value={repair.equipment ?? ""}
                  onChange={(e) => setRepair({ ...repair, equipment: e.target.value })}
                  placeholder="เช่น เครื่องเติมอากาศ 2"
                />
              </Field>
            </div>
            <Field label="ผู้แจ้ง">
              <Input
                value={repair.reporter ?? ""}
                onChange={(e) => setRepair({ ...repair, reporter: e.target.value })}
                placeholder="ชื่อ-สกุล"
              />
            </Field>
            <Field label="สถานะ">
              <Select
                value={repair.status ?? "open"}
                onChange={(e) => setRepair({ ...repair, status: e.target.value as RepairRequestInput["status"] })}
              >
                <option value="open">รอดำเนินการ</option>
                <option value="in_progress">กำลังซ่อม</option>
                <option value="resolved">ซ่อมเสร็จ</option>
                <option value="cancelled">ยกเลิก</option>
              </Select>
            </Field>
            <Field label="สาเหตุ / อาการ" required>
              <Textarea
                rows={3}
                value={repair.cause}
                onChange={(e) => setRepair({ ...repair, cause: e.target.value })}
                placeholder="อธิบายอาการชำรุด / สาเหตุที่ตรวจพบ"
              />
            </Field>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-aura-textMuted font-thai">
          <AlertCircle className="w-3 h-3" />
          {selected === "repair"
            ? "ใบแจ้งซ่อมนี้เป็นการสร้างเอกสารแบบ standalone — หากต้องการบันทึกในระบบ ให้ใช้ฟอร์มบันทึกประจำวันและเลือก 'ระบบผิดปกติ'"
            : "ข้อมูลมาจาก wastewater.reading ของเดือนที่เลือก — รวมเฉพาะวันที่มีบันทึกจริง"}
        </div>

        <Button size="lg" className="w-full" onClick={onDownload}>
          <Download className="w-4 h-4" /> ดาวน์โหลด PDF
        </Button>
      </AuraCard>
    </div>
  );
}
