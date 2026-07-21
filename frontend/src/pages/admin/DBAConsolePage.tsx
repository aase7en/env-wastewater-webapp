/**
 * DBA-4..7 — DBA Console page skeleton.
 *
 * Single-page admin database management UI. Combines:
 *   - DBA-5 QueryBuilder + ResultTable + RowEditor
 *   - DBA-6 SqlEditor Advanced toggle (raw SQL with whitelist)
 *   - DBA-7 SavedQueryPanel (list/save/share)
 *
 * Uses lib/admin/db-query.ts (DBA-2) + saved-query.ts (DBA-7 lib).
 * All mutations land in core.audit_log via SCHEMA-4 trigger.
 *
 * Track Z scope: logic + minimal markup. Track F owns polish (Modal, layout).
 */
import { useEffect, useState } from "react";
import { useToast } from "../../components/ui/Toast";
import { AuraCard } from "../../components/ui/AuraCard";
import { Button } from "../../components/ui/Button";
import { Input, Field, Select, Textarea } from "../../components/ui/Input";
import {
  isStatementAllowed,
  runBuilderQuery,
  runRawQuery,
  runExplain,
  type QueryResult,
  type BuilderQuery,
} from "../../lib/admin/db-query";
import {
  listSavedQueries,
  saveQuery,
  deleteQuery,
  incrementRunCount,
  type SavedQuery,
} from "../../lib/admin/saved-query";
import { AiQueryBox } from "../../components/admin/AiQueryBox";
import { AiSuggestions } from "../../components/admin/AiSuggestions";

const TABLES = [
  "wastewater.reading", "carbon.reading", "carbon.emission_factor",
  "core.personnel", "core.equipment", "core.location", "core.app_user",
  "core.repair_request", "core.saved_query", "core.audit_log",
  "water_supply.daily_check", "garbage.collection_log", "fuel.dispense_log",
  "garden.work_round", "building.inspection_round", "safety.monthly_check",
  "food.lab_test", "chemical.master", "chemical.movement",
  "wastewater.threshold_alert",
];

export function DBAConsolePage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"builder" | "raw">("builder");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saveSql, setSaveSql] = useState("");
  const [saveShared, setSaveShared] = useState(false);

  // Builder state
  const [bTable, setBTable] = useState(TABLES[0]!);
  const [bLimit, setBLimit] = useState(100);
  const [bFilterCol, setBFilterCol] = useState("");
  const [bFilterVal, setBFilterVal] = useState("");
  type FilterOp = "=" | "<>" | "<" | "<=" | ">" | ">=" | "like" | "ilike" | "in" | "is";
  const [bFilterOp, setBFilterOp] = useState<FilterOp>("=");

  // Raw SQL state
  const [rawSql, setRawSql] = useState("SELECT * FROM carbon.reading LIMIT 5;");
  const [explainText, setExplainText] = useState<string | null>(null);

  // P4 (ADR-0009 review-gate): shared seam for AiQueryBox + AiSuggestions.
  // Loads generated/suggested SQL into the raw editor for human review —
  // never executes. The admin still clicks the existing รัน button, which
  // routes through DBA-2 `isStatementAllowed` + DBA-3 `admin_run_query`.
  function useAiSql(sql: string) {
    setMode("raw");
    setRawSql(sql);
    toast("info", "โหลด SQL ลง Editor แล้ว — ตรวจสอบก่อนกดรัน");
  }

  useEffect(() => {
    listSavedQueries().then(setSaved).catch((e: Error) => {
      toast("error", `โหลด saved queries ไม่ได้: ${e.message}`);
    });
  }, [toast]);

  async function runBuilder() {
    setRunning(true);
    try {
      const q: BuilderQuery = {
        table: bTable,
        limit: bLimit,
        filters: bFilterCol && bFilterVal
          ? [{ column: bFilterCol, operator: bFilterOp, value: bFilterVal }]
          : undefined,
      };
      const r = await runBuilderQuery(q);
      setResult(r);
      setSaveSql(`-- Builder: ${JSON.stringify(q)}`);
      toast("success", `${r.rowCount} แถว (${r.elapsedMs}ms)`);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function runRaw() {
    const check = isStatementAllowed(rawSql);
    if (!check.ok) {
      toast("error", `ห้าม: ${check.reason}`);
      return;
    }
    setRunning(true);
    try {
      const r = await runRawQuery(rawSql);
      setResult(r);
      setSaveSql(rawSql);
      toast("success", `${r.rowCount} แถว (${r.elapsedMs}ms)`);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function previewExplain() {
    try {
      const r = await runExplain(rawSql);
      setExplainText(r.text);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  async function doSave() {
    if (!saveName.trim() || !saveSql.trim()) {
      toast("error", "ต้องมีชื่อ + SQL");
      return;
    }
    try {
      await saveQuery({ name: saveName, sql_text: saveSql, is_shared: saveShared });
      setSaved(await listSavedQueries());
      toast("success", "บันทึก query แล้ว");
      setSaveName("");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  async function loadSaved(sq: SavedQuery) {
    // Heuristic: builder queries start with `-- Builder:` comment.
    if (sq.sql_text.startsWith("-- Builder:")) {
      setMode("raw"); // can't fully reconstruct BuilderQ object; load as raw for edit
      setRawSql(`-- Loaded from saved: ${sq.name}\n-- Original was builder-mode; edit as raw SQL below.\nSELECT 1;`);
    } else {
      setMode("raw");
      setRawSql(sq.sql_text);
    }
    await incrementRunCount(sq.id);
    setSaved(await listSavedQueries());
    toast("info", `โหลด "${sq.name}"`);
  }

  async function removeSaved(id: string) {
    if (!confirm("ลบ saved query?")) return;
    try {
      await deleteQuery(id);
      setSaved(await listSavedQueries());
      toast("success", "ลบแล้ว");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold font-thai">DBA Console — จัดการ database</h1>

      <AiQueryBox onUseSql={useAiSql} />
      <AiSuggestions onUseSql={useAiSql} />

      <div className="flex gap-2">
        <Button variant={mode === "builder" ? "primary" : "secondary"} onClick={() => setMode("builder")}>Builder</Button>
        <Button variant={mode === "raw" ? "primary" : "secondary"} onClick={() => setMode("raw")}>Raw SQL (Advanced)</Button>
      </div>

      {mode === "builder" ? (
        <AuraCard className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Table">
              <Select value={bTable} onChange={(e) => setBTable(e.target.value)}>
                {TABLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Limit">
              <Input type="number" value={String(bLimit)} onChange={(e) => setBLimit(Number(e.target.value) || 100)} />
            </Field>
            <Field label="Filter column">
              <Input value={bFilterCol} onChange={(e) => setBFilterCol(e.target.value)} placeholder="เช่น reading_date" />
            </Field>
            <Field label="Operator">
              <Select value={bFilterOp} onChange={(e) => setBFilterOp(e.target.value as typeof bFilterOp)}>
                <option value="=">=</option><option value="<>">≠</option>
                <option value="<">&lt;</option><option value=">">&gt;</option>
                <option value="like">like</option><option value="ilike">ilike</option>
              </Select>
            </Field>
            <Field label="Filter value">
              <Input value={bFilterVal} onChange={(e) => setBFilterVal(e.target.value)} placeholder="value" />
            </Field>
          </div>
          <Button onClick={runBuilder} disabled={running}>{running ? "กำลังรัน…" : "รัน Query"}</Button>
        </AuraCard>
      ) : (
        <AuraCard className="p-4 space-y-3">
          <Field label="Raw SQL (SELECT/INSERT/UPDATE/DELETE เท่านั้น)">
            <Textarea
              value={rawSql}
              onChange={(e) => setRawSql(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={runRaw} disabled={running}>{running ? "กำลังรัน…" : "รัน"}</Button>
            <Button variant="secondary" onClick={previewExplain}>EXPLAIN</Button>
          </div>
          {explainText && (
            <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto font-mono">{explainText}</pre>
          )}
        </AuraCard>
      )}

      {result && (
        <AuraCard className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold font-thai">ผลลัพธ์ ({result.rowCount} แถว, {result.elapsedMs}ms)</h2>
            <Button
              variant="ghost"
              onClick={() => {
                const headers = result.columns.join(",");
                const rows = result.rows.map((r) => result.columns.map((c) => JSON.stringify(r[c] ?? "")).join(",")).join("\n");
                const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "query-result.csv"; a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-aura-surface">
                <tr>{result.columns.map((c) => <th key={c} className="text-left p-2 border-b">{c}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-white/5">
                    {result.columns.map((c) => <td key={c} className="p-2 font-mono">{String(row[c] ?? "")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AuraCard>
      )}

      <AuraCard className="p-4 space-y-3">
        <h2 className="font-semibold font-thai">บันทึก Query</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="ชื่อ"><Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="เช่น ค่า DO ต่ำ" /></Field>
          <Field label="แชร์ให้คนอื่น">
            <Select value={saveShared ? "yes" : "no"} onChange={(e) => setSaveShared(e.target.value === "yes")}>
              <option value="no">ส่วนตัว</option>
              <option value="yes">แชร์</option>
            </Select>
          </Field>
        </div>
        <Button onClick={doSave}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        <h2 className="font-semibold mb-2 font-thai">Saved Queries ({saved.length})</h2>
        <ul className="space-y-1 text-sm">
          {saved.map((sq) => (
            <li key={sq.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded">
              <div>
                <span className="font-medium">{sq.name}</span>
                {sq.is_shared && <span className="ml-2 text-xs text-aura-cyan">แชร์</span>}
                <span className="ml-2 text-xs text-aura-textMuted">รัน {sq.run_count} ครั้ง</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadSaved(sq)} className="text-aura-cyan hover:underline font-thai text-xs">โหลด</button>
                <button onClick={() => removeSaved(sq.id)} className="text-red-400 hover:underline font-thai text-xs">ลบ</button>
              </div>
            </li>
          ))}
          {saved.length === 0 && <li className="text-aura-textMuted font-thai">ยังไม่มี saved query</li>}
        </ul>
      </AuraCard>
    </div>
  );
}
