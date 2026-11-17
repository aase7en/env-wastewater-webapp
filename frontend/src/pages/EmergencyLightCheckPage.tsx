/**
 * ENV-PARITY-P2-003 — ตรวจไฟฉุกเฉิน (emergency-light check, staff).
 *
 * AppSheet Check flow (ref 12 §3.33; WO §4/§6):
 *   สแกน QR → resolve (RPC) → persistency/position/test_result →
 *   broken_detail/pic/status (Show If gates) → save.
 *
 * Form field visibility follows the verbatim Show If gates; enum lists +
 * initial values are verbatim (lib/emergency-light-check.ts); Thai labels
 * are the verbatim AppSheet column names; dates render พ.ศ. Unknown stays
 * unknown — no zero substitution anywhere; the historical unresolved '31'
 * row renders verbatim with the explicit ไม่พบอ้างอิง state (never
 * normalized, never hidden).
 *
 * Status display styling = house UI (D1-5 — no verbatim AppSheet format
 * rules exist for this table). Mobile-first 360/390/430 (house mobile
 * contract); Track Z minimal markup, Track F owns polish.
 */
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Input";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { QrScanner } from "../components/extinguisher/QrScanner";
import { uploadAttachment } from "../lib/attachments";
import {
  BROKEN_DETAIL_OPTIONS,
  PERSISTENCY_DEFAULT,
  PERSISTENCY_OPTIONS,
  POSITION_DEFAULT,
  POSITION_OPTIONS,
  STATUS_OPTIONS,
  TEST_RESULT_DEFAULT,
  TEST_RESULT_OPTIONS,
  generateCheckId,
  showBrokenDetail,
  showPicAndStatus,
  showTestResult,
  unresolvedLightLabel,
} from "../lib/emergency-light-check";
import {
  resolveEmergencyLightQr,
  fetchEmergencyLightChecksByLight,
  type EmergencyLightCheckInsert,
  type EmergencyLightCheckRow,
  type EmergencyLightResolveResult,
} from "../lib/supabase-queries";
import {
  useCreateEmergencyLightCheck,
  useEmergencyLights,
} from "../lib/hooks";
import { thaiDate } from "../lib/utils";

/** ISO date → พ.ศ. d mmm yyyy (house thaiDate). */
function thaiDateOnly(d: string): string {
  if (!d) return "—";
  return thaiDate(d);
}

/** today as YYYY-MM-DD (LOCAL) for the date input default (AppSheet
 * Date_time init =now(); date-only at source). */
function todayInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MASTER_IDS = new Set<string>(
  Array.from({ length: 49 }, (_, i) => String(i + 1).padStart(3, "0")).filter((s) => s !== "044"),
);

export function EmergencyLightCheckPage() {
  const { data: lights } = useEmergencyLights();
  const createMut = useCreateEmergencyLightCheck();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── resolve state (the [QR_CODE] gate — nothing shows before a resolve)
  const [resolved, setResolved] = useState<EmergencyLightResolveResult | null>(null);
  const [qrText, setQrText] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // ── form state (AppSheet init values verbatim)
  const [checkDate, setCheckDate] = useState(todayInput);
  const [persistency, setPersistency] = useState<string>(PERSISTENCY_DEFAULT);
  const [position, setPosition] = useState<string>(POSITION_DEFAULT);
  const [testResult, setTestResult] = useState<string>(TEST_RESULT_DEFAULT);
  const [brokenChecked, setBrokenChecked] = useState<string[]>([]);
  const [brokenFree, setBrokenFree] = useState("");
  const [status, setStatus] = useState("");
  const [picFile, setPicFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // ── per-light history (the re_check REF_ROWS semantics)
  const [history, setHistory] = useState<EmergencyLightCheckRow[] | null>(null);

  const abnormal = useMemo(
    () => showPicAndStatus({ testResult, position, persistency }),
    [testResult, position, persistency],
  );

  const resolve = async (payload: string) => {
    setQrError(null);
    setResolving(true);
    try {
      const result = await resolveEmergencyLightQr(payload.trim());
      setResolved(result);
      // reset the check fields to the verbatim inits for the new entry
      setPersistency(PERSISTENCY_DEFAULT);
      setPosition(POSITION_DEFAULT);
      setTestResult(TEST_RESULT_DEFAULT);
      setBrokenChecked([]);
      setBrokenFree("");
      setStatus("");
      setPicFile(null);
      setHistory(null);
      try {
        setHistory(await fetchEmergencyLightChecksByLight(result.master.erl_id));
      } catch {
        // history is display-only — a load failure never blocks the form
        setHistory(null);
      }
    } catch (e) {
      setResolved(null);
      setHistory(null);
      // the RPC's honest Thai error surfaces as-is — fail-closed, no
      // auto-fill, no invented rows
      setQrError(e instanceof Error ? e.message : String(e));
    } finally {
      setResolving(false);
    }
  };

  const onManualPick = (id: string) => {
    if (!id) return;
    void resolve(id);
  };

  const toggleBroken = (v: string) => {
    setBrokenChecked((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const resetForm = () => {
    setResolved(null);
    setQrText("");
    setCheckDate(todayInput());
    setPersistency(PERSISTENCY_DEFAULT);
    setPosition(POSITION_DEFAULT);
    setTestResult(TEST_RESULT_DEFAULT);
    setBrokenChecked([]);
    setBrokenFree("");
    setStatus("");
    setPicFile(null);
    setHistory(null);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!resolved) {
      setFormError("ยังไม่ได้ระบุไฟฉุกเฉิน — สแกน QR หรือเลือกจากรายการก่อน");
      return;
    }
    if (!checkDate) {
      setFormError("ระบุวันที่ตรวจสอบก่อน");
      return;
    }
    const id = generateCheckId();
    // AppSheet EnumList " , " join verbatim + free-text tail (no CHECK —
    // free text observed at source); blanks ⇒ NULL
    const brokenParts = [...brokenChecked, ...(brokenFree.trim() ? [brokenFree.trim()] : [])];
    const brokenJoined = brokenParts.join(" , ");
    const payload: EmergencyLightCheckInsert = {
      id,
      legacy_id: null,
      check_date: checkDate,
      erl_payload: resolved.master.erl_id,
      light_id: resolved.master.erl_id,
      location_snapshot: resolved.master.location ?? null,
      persistency,
      position,
      test_result: testResult,
      auditor_id: null,
      auditor_legacy_id: null,
      broken_detail: brokenJoined === "" ? null : brokenJoined,
      pic_path: null,
      status: abnormal && status !== "" ? status : null,
      source_provenance: "manual entry (ENV-PARITY-P2-003)",
    };
    // pic (Show If abnormal): upload first so the row carries the real
    // Storage path; an upload failure is an honest warning — the check row
    // still saves without a fabricated path
    let warning: string | null = null;
    if (abnormal && picFile) {
      try {
        const att = await uploadAttachment(picFile, "emergency_light_check", id, "check_pic");
        payload.pic_path = att.file_path;
      } catch (attErr) {
        warning = attErr instanceof Error ? attErr.message : String(attErr);
      }
    }
    const { error: saveError } = await createMut.mutate(payload);
    if (saveError) {
      setFormError(saveError);
      return;
    }
    toast(warning ? "warning" : "success", warning ? `บันทึกแล้ว แต่อัปโหลดรูปไม่สำเร็จ: ${warning}` : "บันทึกการตรวจสอบเรียบร้อย");
    setSavedId(id);
    resetForm();
    void qc.invalidateQueries({ queryKey: ["emergency-light-checks"] });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-3 sm:p-4">
      <h1 className="text-lg font-semibold font-thai">ตรวจไฟฉุกเฉิน</h1>

      <AuraCard>
        <h2 className="font-bold font-thai text-aura-textMain mb-3">บันทึกการตรวจสอบ</h2>
        <form onSubmit={(e) => void onSave(e)} className="space-y-4" data-testid="light-check-form">
          {/* สแกน QR + เลือกจากรายการ + กรอกรหัส — the AppSheet scan/manual
              duality; manual paths are ALWAYS available */}
          <QrScanner onDetected={(payload) => void resolve(payload)} scanButtonTestId="light-qr-scan-btn" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="สแกนแล้วยังไม่ออก? กรอกรหัสใต้ QR" htmlFor="light-qr-input">
              <Input
                id="light-qr-input"
                data-testid="light-qr-input"
                value={qrText}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQrText(e.target.value)}
                placeholder="รหัสไฟฉุกเฉิน (เช่น 001)"
                autoComplete="off"
              />
            </Field>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={resolving || qrText.trim() === ""}
                onClick={() => void resolve(qrText)}
                data-testid="light-qr-resolve-btn"
              >
                ค้นหาไฟฉุกเฉิน
              </Button>
            </div>
            <Field label="เลือกจากรายการไฟฉุกเฉิน (manual)" htmlFor="light-manual-pick">
              <Select
                id="light-manual-pick"
                data-testid="light-manual-pick"
                value=""
                onChange={(e) => onManualPick(e.target.value)}
              >
                <option value="">— เลือกไฟฉุกเฉิน —</option>
                {lights.map((x) => (
                  <option key={x.erl_id} value={x.erl_id}>
                    {x.location} · {x.erl_id}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {qrError ? (
            <p className="text-sm text-alert-red font-thai" data-testid="light-qr-error" role="alert">
              {qrError}
            </p>
          ) : null}

          {/* snapshot auto-fill — READ-ONLY display; Show If: the light is
              resolved (ref 5038-5043). The historical unresolved payload
              (the seeded '31' row's shape) renders verbatim + ไม่พบอ้างอิง
              honestly — never normalized, never hidden. */}
          {resolved ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-aura-cyan/30 p-3" data-testid="light-resolved-card">
              <div>
                <p className="text-xs text-aura-textMuted font-thai">รหัส</p>
                <p className="text-sm font-mono" data-testid="light-snap-erl-id">
                  {unresolvedLightLabel(resolved.master.erl_id, MASTER_IDS.has(resolved.master.erl_id))}
                </p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">ตำแหน่ง</p>
                <p className="text-sm font-thai" data-testid="light-snap-location">
                  {resolved.master.location ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">ชั้น</p>
                <p className="text-sm font-thai" data-testid="light-snap-floor">
                  {resolved.master.location_floor ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">ผู้ติดตั้ง/ผู้ดูแล</p>
                <p className="text-sm font-thai" data-testid="light-snap-providers">
                  {resolved.master.providers ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">วันที่รับ</p>
                <p className="text-sm font-thai" data-testid="light-snap-receive-date">
                  {resolved.master.receive_date ? thaiDateOnly(resolved.master.receive_date) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">การตรวจล่าสุด</p>
                <p className="text-sm font-thai" data-testid="light-prior-summary">
                  {resolved.prior.check_count > 0
                    ? `${resolved.prior.check_count} ครั้ง · ${thaiDateOnly(resolved.prior.latest_check_date ?? "")} · ${resolved.prior.latest_test_result ?? "—"}`
                    : "ยังไม่มีประวัติการตรวจ"}
                </p>
              </div>
            </div>
          ) : null}

          <Field label="วันที่ตรวจสอบ" htmlFor="light-check-date" required>
            <Input
              id="light-check-date"
              data-testid="light-check-date"
              type="date"
              value={checkDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheckDate(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="ความคงทน" htmlFor="light-persistency">
              <Select
                id="light-persistency"
                data-testid="light-persistency"
                value={persistency}
                onChange={(e) => {
                  setPersistency(e.target.value);
                  if (!showTestResult(e.target.value)) setTestResult(TEST_RESULT_DEFAULT);
                }}
              >
                {PERSISTENCY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="ตำแหน่ง" htmlFor="light-position">
              <Select
                id="light-position"
                data-testid="light-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                {POSITION_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            {/* test_result — Show If persistency = มี (ref 5079-5081) */}
            {showTestResult(persistency) ? (
              <Field label="ผลการทดสอบ" htmlFor="light-test-result">
                <Select
                  id="light-test-result"
                  data-testid="light-test-result"
                  value={testResult}
                  onChange={(e) => setTestResult(e.target.value)}
                >
                  {TEST_RESULT_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>

          {/* broken_detail — Show If OR(ไม่ผ่าน, ไม่เหมาะสม) (ref 5112-5114);
              the 5 documented enum values multi-capable + free text */}
          {showBrokenDetail({ testResult, position }) ? (
            <Field
              label="รายละเอียดความเสียหาย"
              htmlFor="light-broken-free"
              hint="เลือกได้หลายรายการ หรือพิมพ์เพิ่ม (ระบบบันทึกตามที่กรอก)"
            >
              <div className="space-y-2" data-testid="light-broken-group">
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {BROKEN_DETAIL_OPTIONS.map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm font-thai">
                      <input
                        type="checkbox"
                        value={o}
                        checked={brokenChecked.includes(o)}
                        onChange={() => toggleBroken(o)}
                        data-testid={`light-broken-${o}`}
                      />
                      {o}
                    </label>
                  ))}
                </div>
                <Input
                  id="light-broken-free"
                  data-testid="light-broken-free"
                  value={brokenFree}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBrokenFree(e.target.value)}
                  placeholder="อื่น ๆ (ระบุเอง)"
                  autoComplete="off"
                />
              </div>
            </Field>
          ) : null}

          {/* pic + status — Show If OR(ไม่ผ่าน, ไม่เหมาะสม, ไม่มี) (ref
              5124-5134) */}
          {abnormal ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="รูปภาพ" htmlFor="light-pic">
                <Input
                  id="light-pic"
                  data-testid="light-pic"
                  type="file"
                  accept="image/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPicFile(e.target.files?.[0] ?? null)}
                />
              </Field>
              <Field label="สถานะ" htmlFor="light-status">
                <Select
                  id="light-status"
                  data-testid="light-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}

          {formError ? (
            <p className="text-sm text-alert-red font-thai" role="alert" data-testid="light-form-error">
              {formError}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button type="submit" size="md" loading={createMut.loading} data-testid="light-save-btn">
              บันทึกการตรวจสอบ
            </Button>
            {savedId ? (
              <span className="text-xs text-aura-textMuted" data-testid="light-save-ok">
                บันทึกแล้ว (รหัส {savedId})
              </span>
            ) : null}
          </div>
        </form>
      </AuraCard>

      {/* per-light history — the re_check REF_ROWS semantics; the
          unresolved '31' row renders verbatim + ไม่พบอ้างอิง (never
          normalized to 031, never hidden) */}
      {resolved ? (
        <AuraCard>
          <h2 className="font-bold font-thai text-aura-textMain mb-3">ประวัติการตรวจของไฟนี้</h2>
          {history === null ? (
            <TableSkeleton rows={2} />
          ) : history.length === 0 ? (
            <EmptyState title="ยังไม่มีประวัติการตรวจ" description="การบันทึกครั้งถัดไปจะปรากฏในรายการนี้" />
          ) : (
            <ul className="divide-y" data-testid="light-history-list">
              {history.map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2">
                  <span className="font-thai text-sm">
                    {thaiDateOnly(r.check_date)}
                    <span className="ml-1 font-mono text-xs text-aura-textMuted">
                      {unresolvedLightLabel(r.erl_payload, MASTER_IDS.has(r.erl_payload))}
                    </span>
                  </span>
                  <span className="text-xs text-aura-textMuted font-thai">
                    {r.test_result}
                    {r.position === "ไม่เหมาะสม" ? ` · ตำแหน่ง${r.position}` : ""}
                    {r.persistency === "ไม่มี" ? ` · ความคงทน${r.persistency}` : ""}
                    {r.broken_detail ? ` · ${r.broken_detail}` : ""}
                    {r.status ? ` · ${r.status}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AuraCard>
      ) : null}
    </div>
  );
}
