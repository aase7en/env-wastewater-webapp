import { useRef, useState } from "react";
import { UploadCloud, FileText, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { AuraCard } from "../components/ui/AuraCard";
import { useToast } from "../components/ui/Toast";
import { bulkInsertReadings, csvTemplate, parseReadingCsv, type ParseResult } from "../lib/csv-import";
import { bulkInsertReadingRows } from "../lib/supabase-queries";

/**
 * Bulk CSV import — Track Z feature, no styling beyond what's needed to be
 * usable. F2 (Fable5) will restyle when it gets here; do not lock the
 * className on this page.
 */
export function BulkImportPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ inserted: number; failed: number; sampleErrors: string[] } | null>(null);

  const onFile = async (file: File) => {
    setFilename(file.name);
    setReport(null);
    const text = await file.text();
    const result = parseReadingCsv(text);
    setParse(result);
    if (result.fatalErrors.length > 0) {
      toast.error(`Parse ล้มเหลว: ${result.fatalErrors.join("; ")}`);
    } else {
      toast.info(`Parse สำเร็จ: ${result.rows.length} แถว (${result.rows.filter((r) => r.errors.length === 0).length} ถูกต้อง, ${result.rows.filter((r) => r.errors.length > 0).length} มี error)`);
    }
  };

  const onImport = async () => {
    if (!parse || parse.fatalErrors.length > 0) {
      toast.error("ยังไม่มีข้อมูลที่ parse ได้ — เลือกไฟล์ CSV ที่ถูกต้องก่อน");
      return;
    }
    setBusy(true);
    try {
      const r = await bulkInsertReadings(bulkInsertReadingRows, parse.rows);
      setReport(r);
      if (r.failed === 0) {
        toast.success(`นำเข้าสำเร็จทั้งหมด ${r.inserted} แถว`);
      } else if (r.inserted > 0) {
        toast.warning(`นำเข้าบางส่วน: ${r.inserted} สำเร็จ, ${r.failed} ล้มเหลว`);
      } else {
        toast.error(`นำเข้าล้มเหลวทั้งหมด (${r.failed} แถว)`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDownloadTemplate = () => {
    const blob = new Blob([csvTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wastewater-reading-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validCount = parse ? parse.rows.filter((r) => r.errors.length === 0).length : 0;
  const errorCount = parse ? parse.rows.filter((r) => r.errors.length > 0).length : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="text-aura-textMain">นำเข้าข้อมูล</span>
          <span className="aura-text-gradient"> CSV</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          bulk import หลายวันในครั้งเดียว — คอลัมน์ต้องตรงตาม template
        </p>
      </header>

      <AuraCard className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-aura-cyan" />
          <button onClick={onDownloadTemplate} className="text-aura-cyan hover:underline font-thai">
            ดาวน์โหลด CSV template
          </button>
          <span className="text-aura-textMuted font-thai">— ใช้เป็นแบบฟอร์มเปล่าแล้วกรอกใน Excel/Google Sheets</span>
        </div>

        {/* Dropzone-ish input */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-aura-borderSubtle rounded-2xl p-8 text-center cursor-pointer hover:border-aura-cyan/50 transition-colors"
        >
          <UploadCloud className="w-10 h-10 text-aura-textMuted mx-auto mb-2" />
          {filename ? (
            <div className="font-thai">
              <span className="text-aura-textMain">{filename}</span>
              <span className="text-aura-textMuted"> · คลิกเพื่อเลือกไฟล์อื่น</span>
            </div>
          ) : (
            <div className="font-thai text-aura-textMuted">
              คลิกเพื่อเลือกไฟล์ CSV (หรือลากวาง)
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>

        {/* Parse summary */}
        {parse && parse.fatalErrors.length === 0 && (
          <div className="grid grid-cols-3 gap-3 text-center font-thai">
            <div className="rounded-xl p-3 bg-aura-surfaceHigh/40 border border-aura-borderSubtle">
              <div className="text-2xl font-bold text-aura-textMain font-mono">{parse.totalLines}</div>
              <div className="text-xs text-aura-textMuted">แถวในไฟล์</div>
            </div>
            <div className="rounded-xl p-3 bg-alert-green/10 border border-alert-green/30">
              <div className="text-2xl font-bold text-alert-green font-mono">{validCount}</div>
              <div className="text-xs text-alert-green">ถูกต้อง</div>
            </div>
            <div className={"rounded-xl p-3 border " + (errorCount > 0 ? "bg-alert-amber/10 border-alert-amber/30" : "bg-aura-surfaceHigh/40 border-aura-borderSubtle")}>
              <div className={"text-2xl font-bold font-mono " + (errorCount > 0 ? "text-alert-amber" : "text-aura-textMain")}>{errorCount}</div>
              <div className={"text-xs " + (errorCount > 0 ? "text-alert-amber" : "text-aura-textMuted")}>มี error</div>
            </div>
          </div>
        )}

        {/* Error samples */}
        {parse && parse.rows.some((r) => r.errors.length > 0) && (
          <div className="rounded-xl border border-alert-amber/40 bg-alert-amber/10 p-3 text-xs font-thai space-y-1 max-h-40 overflow-y-auto">
            {parse.rows.filter((r) => r.errors.length > 0).slice(0, 20).map((r) => (
              <div key={r.lineNumber} className="text-alert-amber">
                บรรทัด {r.lineNumber}: {r.errors.join("; ")}
              </div>
            ))}
            {parse.rows.filter((r) => r.errors.length > 0).length > 20 && (
              <div className="text-aura-textMuted">…และอีก {parse.rows.filter((r) => r.errors.length > 0).length - 20} แถว</div>
            )}
          </div>
        )}

        {/* Import report */}
        {report && (
          <div className={"rounded-xl border p-3 text-sm font-thai " + (report.failed === 0 ? "border-alert-green/40 bg-alert-green/10 text-alert-green" : report.inserted > 0 ? "border-alert-amber/40 bg-alert-amber/10 text-alert-amber" : "border-alert-red/40 bg-alert-red/10 text-alert-red")}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              {report.failed === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              นำเข้า {report.inserted} สำเร็จ · {report.failed} ล้มเหลว
            </div>
            {report.sampleErrors.length > 0 && (
              <ul className="text-xs space-y-0.5 pl-6">
                {report.sampleErrors.slice(0, 8).map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onImport} loading={busy} disabled={!parse || parse.fatalErrors.length > 0 || validCount === 0} size="lg" className="flex-1">
            <Download className="w-4 h-4" /> นำเข้า {validCount > 0 ? `${validCount} แถว` : ""}
          </Button>
        </div>
      </AuraCard>
    </div>
  );
}
