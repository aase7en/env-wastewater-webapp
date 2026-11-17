/**
 * ENV-PARITY-P2-003 — pure form-parity lib for the emergency-light check
 * flow (no React, no I/O).
 *
 * Transcribes the AppSheet ตรวจไฟฉุกเฉิน Check contract (reference doc 12
 * §3.33, pins per WO §3.1/§6) onto the ENV storage model:
 *   - verbatim enum value lists + AppSheet initial values (UI defaults on
 *     CREATE only — never DB defaults, per the P1.1 "unknown ≠ any value"
 *     rule)
 *   - the QR_CODE resolved gate (init 'สแกน QR CODE'; ref 5022-5043) —
 *     placeholder/blank payloads are unusable; unknown ids fail-closed in
 *     the RPC with the honest Thai error (reference 12 pins NO
 *     Check-specific error text — the §3.13-family verbatim is the house
 *     safety-flow error; D1-5 spirit, recorded in the handoff)
 *   - the Show If gates (ref 5079-5081 / 5112-5114 / 5124-5134) as pure
 *     predicates
 *   - the AppSheet sort order (SortKey) transcribed as the history list
 *     ordering rule name (check_date DESC + deterministic id tiebreak)
 *   - id generator: check id = 8-hex UNIQUEID() shape; QR derives from
 *     erl_id and is NEVER stored
 */

// ─── Enum vocabularies (verbatim §3.33) ─────────────────────────────────

/** Persistency — ref 5045-5055 (init =มี). */
export const PERSISTENCY_OPTIONS = ["มี", "ไม่มี"] as const;
export const PERSISTENCY_DEFAULT = "มี";

/** Position — ref 5057-5067 (init =เหมาะสม). */
export const POSITION_OPTIONS = ["เหมาะสม", "ไม่เหมาะสม"] as const;
export const POSITION_DEFAULT = "เหมาะสม";

/** test_result — ref 5069-5085 (init =ผ่าน; Show If persistency=มี). */
export const TEST_RESULT_OPTIONS = ["ผ่าน", "ไม่ผ่าน"] as const;
export const TEST_RESULT_DEFAULT = "ผ่าน";

/** status — ref 5128-5138 (blank ⇒ NULL). */
export const STATUS_OPTIONS = ["แจ้งซ่อม", "แจ้งย้ายตำแหน่ง", "ขอติดตั้ง"] as const;

/** broken_detail — the 5 documented EnumList values verbatim (ref
 * 5108-5118). Free-text tokens beyond this list are ACCEPTED (observed:
 * น๊อตหลุด, ถอดปลั๊กออก — no hard CHECK); AppSheet " , " joins preserved. */
export const BROKEN_DETAIL_OPTIONS = [
  "ไม่มีหัตถการ",
  "มีแสงสว่างจากธรรมชาติ",
  "ไม่มีเวรดึก",
  "ไฟไม่สว่าง",
  "ไม่เก็บไฟ",
] as const;

// ─── Verbatim validation error text ─────────────────────────────────────

/** The safety-flow verbatim QR error (ref §3.13 family; the double space
 * after "!!" is verbatim). Reference 12 pins no Check-specific error —
 * the house reuses this for the resolve RPC fail-closed path. */
export const ERR_QR_NOT_FOUND = "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ";

/** The AppSheet QR_CODE placeholder init (ref 5022-5028) — never a usable
 * value. */
export const QR_PLACEHOLDER = "สแกน QR CODE";

export function isQrPayloadUsable(v: string | null | undefined): boolean {
  const s = (v ?? "").trim();
  return s !== "" && s !== QR_PLACEHOLDER;
}

// ─── Show If gates (verbatim) ───────────────────────────────────────────

/** test_result visibility — Show If [Persistency]="มี" (ref 5079-5081).
 * Unknown persistency never reveals the gate. */
export function showTestResult(persistency: string | null | undefined): boolean {
  return persistency === "มี";
}

/** broken_detail visibility — Show If OR(test_result=ไม่ผ่าน,
 * position=ไม่เหมาะสม) (ref 5112-5114). */
export function showBrokenDetail(opts: {
  testResult?: string | null;
  position?: string | null;
}): boolean {
  return opts.testResult === "ไม่ผ่าน" || opts.position === "ไม่เหมาะสม";
}

/** pic + status visibility — Show If OR(test_result=ไม่ผ่าน,
 * position=ไม่เหมาะสม, persistency=ไม่มี) (ref 5124-5134). */
export function showPicAndStatus(opts: {
  testResult?: string | null;
  position?: string | null;
  persistency?: string | null;
}): boolean {
  return (
    opts.testResult === "ไม่ผ่าน" ||
    opts.position === "ไม่เหมาะสม" ||
    opts.persistency === "ไม่มี"
  );
}

// ─── Unresolved-reference honest state (the seeded '31' row) ────────────

/** The verbatim unresolved-reference label (D1-1: never normalized, never
 * hidden). An unresolved payload renders verbatim with the explicit
 * ไม่พบอ้างอิง marker; a resolved payload renders bare. */
export function unresolvedLightLabel(payload: string, resolved: boolean): string {
  return resolved ? payload : `${payload} (ไม่พบอ้างอิง)`;
}

// ─── Id generator (the row_ID UNIQUEID() shape) ─────────────────────────

const HEX = "0123456789abcdef";
/** AppSheet check row_ID = 8-hex UNIQUEID() (e.g. 'c33588cf'). */
export function generateCheckId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => HEX[b % 16]).join("");
}
