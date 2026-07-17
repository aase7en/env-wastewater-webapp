/**
 * Draft storage (P20b foundation) — typed localStorage wrapper for
 * form autosave. Decoupled from any specific form so it can back the
 * daily-entry form, future equipment forms, etc.
 *
 * Design:
 * - Per-form namespace (e.g. 'daily-form') so multiple forms don't collide.
 * - Each draft carries a timestamp + the form values. The UI can show
 *   "มี draft ค้าง (5 นาทีที่แล้ว)" and offer กู้คืน / ละทิ้ง.
 * - All writes are wrapped in try/catch — localStorage failures (private
 *   mode, quota) must NOT break the form.
 *
 * Track Z: pure logic, no UI.
 */

const PREFIX = "draft:";

export interface Draft<T> {
  /** ISO timestamp of the last autosave. */
  savedAt: string;
  /** The form values at the time of save. */
  values: T;
  /** Optional edit-mode context (e.g. the reading_id being edited). */
  context?: string;
}

/** Read a draft. Returns null if missing or unparseable. */
export function readDraft<T>(namespace: string): Draft<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + namespace);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft<T>;
    if (typeof parsed.savedAt !== "string" || !("values" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Write a draft (swallow storage failures). */
export function writeDraft<T>(namespace: string, values: T, context?: string): void {
  try {
    const draft: Draft<T> = {
      savedAt: new Date().toISOString(),
      values,
      context,
    };
    localStorage.setItem(PREFIX + namespace, JSON.stringify(draft));
  } catch (e) {
    // Quota / private mode — autosave is best-effort, not a hard requirement.
    console.warn(`[draft-storage] write failed for ${namespace}:`, e);
  }
}

/** Remove a draft (after successful submit or explicit discard). */
export function clearDraft(namespace: string): void {
  try {
    localStorage.removeItem(PREFIX + namespace);
  } catch {
    // ignore
  }
}

/** Human-readable "X นาทีที่แล้ว" label for the draft banner. */
export function relativeTimeThai(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return `${diffSec} วินาทีที่แล้ว`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diffSec / 86400)} วันที่แล้ว`;
}
