/**
 * IMP-3 — Generic bulk import page.
 *
 * Replaces the wastewater-only CSV import with a multi-module, multi-
 * format flow powered by lib/import-engine.ts + lib/import-adapters/*.
 *
 * Flow:
 *   1. User selects target module (dropdown of registered adapters)
 *   2. User drops file (.csv .xlsx .pdf .jpg .png)
 *   3. Engine parses file → ParsedTable {columns, rows, warnings}
 *   4. Adapter maps parsed rows → typed rows + per-row errors
 *   5. User reviews preview + clicks "นำเข้า"
 *   6. Hook from lib/<module>.ts batch-inserts (every module lib has
 *      createX; we loop in batches of 100 with allSettled)
 *
 * Track Z scope: logic + minimal markup. Track F owns polish.
 */
import { useRef, useState } from "react";
import { UploadCloud, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { AuraCard } from "../components/ui/AuraCard";
import { useToast } from "../components/ui/Toast";
import { Field, Select } from "../components/ui/Input";
import { parseFile, sniffFileKind, type ParsedTable, type FileKind } from "../lib/import-engine";
import { ADAPTERS, applyAdapter, type Adapter } from "../lib/import-adapters";
import { supabase } from "../lib/supabase";

interface ImportError { row: number; reason: string; }

export function BulkImportPage() {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [moduleId, setModuleId] = useState<string>(ADAPTERS[0]?.moduleId ?? "wastewater");
  const [filename, setFilename] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [parsed, setParsed] = useState<ParsedTable | null>(null);
  const [adapterErrors, setAdapterErrors] = useState<ImportError[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ inserted: number; failed: number; sampleErrors: string[] } | null>(null);

  const adapter = ADAPTERS.find((a) => a.moduleId === moduleId) as Adapter<unknown> | undefined;

  async function onFile(file: File) {
    setFilename(file.name);
    setReport(null);
    const kind = sniffFileKind(file);
    setFileKind(kind);
    if (kind === "unknown") {
      toast("error", "ไม่รองรับไฟล์นี้ — ใช้ .csv .xlsx .pdf หรือ image");
      setParsed(null);
      return;
    }
    try {
      const result = await parseFile(file);
      setParsed(result);
      if (result.warnings.length > 0) {
        toast("warning", result.warnings[0]!);
      }
      // Apply adapter immediately so user sees valid/error count.
      if (adapter) {
        const a = applyAdapter(result.columns, result.rows, adapter);
        setAdapterErrors(a.errors);
        setValidCount(a.valid.length);
      }
    } catch (e) {
      toast("error", (e as Error).message);
      setParsed(null);
    }
  }

  // Re-run adapter when module changes.
  function onModuleChange(id: string) {
    setModuleId(id);
    setReport(null);
    if (parsed) {
      const next = ADAPTERS.find((a) => a.moduleId === id) as Adapter<unknown> | undefined;
      if (next) {
        const a = applyAdapter(parsed.columns, parsed.rows, next);
        setAdapterErrors(a.errors);
        setValidCount(a.valid.length);
      }
    }
  }

  async function onImport() {
    if (!parsed || !adapter) return;
    setBusy(true);
    try {
      const mapped = applyAdapter(parsed.columns, parsed.rows, adapter);
      if (mapped.valid.length === 0) {
        toast("error", "ไม่มีแถวที่ valid — แก้ errors ก่อน");
        setBusy(false);
        return;
      }
      // Resolve target table + batch-insert.
      const result = await batchInsert(moduleId, mapped.valid);
      setReport(result);
      if (result.failed === 0) {
        toast("success", `นำเข้าสำเร็จ ${result.inserted} แถว`);
      } else if (result.inserted > 0) {
        toast("warning", `นำเข้าบางส่วน: ${result.inserted} สำเร็จ, ${result.failed} ล้มเหลว`);
      } else {
        toast("error", `นำเข้าล้มเหลวทั้งหมด (${result.failed} แถว)`);
      }
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 p-4">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-thai">
          นำเข้าข้อมูล <span className="aura-text-gradient">หลายรูปแบบ</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          CSV / Excel / PDF / Image → เลือก module ปลายทาง → ระบบ map column อัตโนมัติ
        </p>
      </header>

      <AuraCard className="space-y-4 p-4">
        <Field label="Module ปลายทาง">
          <Select value={moduleId} onChange={(e) => onModuleChange(e.target.value)}>
            {ADAPTERS.map((a) => (
              <option key={a.moduleId} value={a.moduleId}>{a.moduleId}</option>
            ))}
          </Select>
        </Field>

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-aura-borderSubtle rounded-2xl p-8 text-center cursor-pointer hover:border-aura-cyan/50 transition-colors"
        >
          <UploadCloud className="w-10 h-10 text-aura-textMuted mx-auto mb-2" />
          {filename ? (
            <div className="font-thai">
              <span className="text-aura-textMain">{filename}</span>
              <span className="text-aura-textMuted"> · {fileKind} · คลิกเพื่อเลือกไฟล์อื่น</span>
            </div>
          ) : (
            <div className="font-thai text-aura-textMuted">
              คลิกเพื่อเลือก .csv .xlsx .pdf .jpg/.png
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>

        {parsed && (
          <>
            <div className="grid grid-cols-3 gap-3 text-center font-thai">
              <div className="rounded-xl p-3 bg-aura-surfaceHigh/40 border border-aura-borderSubtle">
                <div className="text-2xl font-bold font-mono">{parsed.rows.length}</div>
                <div className="text-xs text-aura-textMuted">แถวในไฟล์</div>
              </div>
              <div className="rounded-xl p-3 bg-alert-green/10 border border-alert-green/30">
                <div className="text-2xl font-bold text-alert-green font-mono">{validCount}</div>
                <div className="text-xs text-alert-green">map ได้</div>
              </div>
              <div className={"rounded-xl p-3 border " + (adapterErrors.length > 0 ? "bg-alert-amber/10 border-alert-amber/30" : "bg-aura-surfaceHigh/40 border-aura-borderSubtle")}>
                <div className={"text-2xl font-bold font-mono " + (adapterErrors.length > 0 ? "text-alert-amber" : "text-aura-textMain")}>{adapterErrors.length}</div>
                <div className={"text-xs " + (adapterErrors.length > 0 ? "text-alert-amber" : "text-aura-textMuted")}>map ไม่ได้</div>
              </div>
            </div>

            {parsed.warnings.length > 0 && (
              <div className="rounded-xl border border-alert-amber/40 bg-alert-amber/10 p-3 text-xs font-thai space-y-1">
                {parsed.warnings.slice(0, 5).map((w, i) => <div key={i} className="text-alert-amber">⚠ {w}</div>)}
              </div>
            )}

            {adapterErrors.length > 0 && (
              <div className="rounded-xl border border-alert-amber/40 bg-alert-amber/10 p-3 text-xs font-thai space-y-1 max-h-40 overflow-y-auto">
                {adapterErrors.slice(0, 20).map((e, i) => (
                  <div key={i} className="text-alert-amber">
                    {e.row > 0 ? `บรรทัด ${e.row}: ` : ""}{e.reason}
                  </div>
                ))}
                {adapterErrors.length > 20 && (
                  <div className="text-aura-textMuted">…และอีก {adapterErrors.length - 20} แถว</div>
                )}
              </div>
            )}

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

            <div className="flex gap-2">
              <Button
                onClick={onImport}
                disabled={busy || validCount === 0}
                className="flex-1"
              >
                นำเข้า {validCount > 0 ? `${validCount} แถว` : ""}
              </Button>
            </div>
          </>
        )}
      </AuraCard>
    </div>
  );
}

/**
 * Module-aware batch insert. Each module has its own target table name.
 * Batches of 100 rows via supabase `.insert([...])`. Uses allSettled
 * so one batch failure doesn't lose the rest.
 *
 * NOTE: this is a generic dispatcher — modules that need extra logic
 * (e.g. food.lab_test trigger reagent decrement) still work because
 * the DB triggers fire on INSERT regardless of caller.
 */
async function batchInsert(
  moduleId: string,
  rows: unknown[],
): Promise<{ inserted: number; failed: number; sampleErrors: string[] }> {
  // Map moduleId → supabase table name (no schema prefix; PostgREST).
  const TABLE_MAP: Record<string, string> = {
    wastewater: "reading",
    water_supply: "daily_check",
    fuel: "dispense_log",
    garbage: "collection_log",
    garden: "work_round",
    building: "inspection_round",
    safety: "monthly_check",
    food: "lab_test",
    chemical: "movement",
  };
  const table = TABLE_MAP[moduleId];
  if (!table) {
    return { inserted: 0, failed: rows.length, sampleErrors: [`module ${moduleId} ไม่มี table mapping`] };
  }

  const BATCH = 100;
  const batches: unknown[][] = [];
  for (let i = 0; i < rows.length; i += BATCH) batches.push(rows.slice(i, i + BATCH));

  const results = await Promise.allSettled(
    batches.map((batch) => supabase.from(table).insert(batch)),
  );

  let inserted = 0;
  let failed = 0;
  const sampleErrors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      const err = r.value.error;
      if (err) {
        failed += batches[i]!.length;
        if (sampleErrors.length < 8) sampleErrors.push(`batch ${i + 1}: ${err.message}`);
      } else {
        inserted += batches[i]!.length;
      }
    } else {
      failed += batches[i]!.length;
      if (sampleErrors.length < 8) sampleErrors.push(`batch ${i + 1}: ${r.reason?.message ?? String(r.reason)}`);
    }
  });

  return { inserted, failed, sampleErrors };
}
