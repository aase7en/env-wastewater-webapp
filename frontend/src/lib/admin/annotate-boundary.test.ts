/**
 * WO-STAB-009 — annotateRow PHI/provider boundary tests.
 *
 * GPT activation amendments are acceptance criteria (see
 * docs/work-orders/WO-STAB-009-PROPOSAL.md):
 *   1. runtime ai_scope approval is necessary but NOT sufficient
 *   2. static safe-field profile required; effective auth = intersection
 *   3. canonical schema.table keys; unknown/ambiguous => fail closed
 *   4. STATIC_PHI_DENY never used as allowlist fallback
 *   5. projection before prompt; scrub as defense-in-depth
 *   6. refusal paths leak no raw row; scope error => zero provider calls
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const state = {
  scopeResult: { data: null as unknown, error: null as unknown },
  insertShouldError: false,
  fetchBodies: [] as string[],
};

vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: vi.fn((table: string) => {
      if (table === "ai_scope") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => state.scopeResult,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "ai_provider") {
        return {
          select: () => ({
            order: async () => ({
              data: [
                { id: "p1", name: "Mock", model: "m", is_enabled: true, priority: 1,
                  api_url: "https://mock.local/v1/chat/completions", base_url: "https://mock.local", key_value: "sk-mock" },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "ai_query_log") {
        return {
          insert: () => ({
            select: () => ({
              data: null,
              error: state.insertShouldError ? { message: "deny" } : null,
            }),
          }),
        };
      }
      throw new Error("unmocked " + table);
    }),
  },
}));

import {
  canonicalizeTableName,
  isRuntimeApproved,
  projectSafeRow,
} from "./annotate-boundary";
import { annotateRow } from "./ai-sql";

function stubFetchCapture() {
  state.fetchBodies = [];
  globalThis.fetch = vi.fn(async (_u: unknown, init?: RequestInit) => {
    state.fetchBodies.push(String(init?.body ?? ""));
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: { total_tokens: 1 } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  state.scopeResult = { data: null, error: null };
  state.fetchBodies = [];
  state.insertShouldError = false;
  stubFetchCapture();
});

// ─── pure helpers ─────────────────────────────────────────────────────────

describe("canonicalizeTableName (amendment 3)", () => {
  it("passes through qualified canonical keys that have a profile", () => {
    expect(canonicalizeTableName("wastewater.reading")).toBe("wastewater.reading");
  });
  it("rejects qualified keys without a profile (fail closed)", () => {
    expect(canonicalizeTableName("core.audit_log")).toBeNull();
  });
  it("resolves an unambiguous bare name", () => {
    expect(canonicalizeTableName("dispense_log")).toBe("fuel.dispense_log");
  });
  it("bare name colliding across schemas stays ambiguous => null (fail closed)", () => {
    // "reading" exists as both wastewater.reading and carbon.reading
    expect(canonicalizeTableName("reading")).toBeNull();
  });
  it("rejects unknown bare names", () => {
    expect(canonicalizeTableName("audit_log")).toBeNull();
  });
});

describe("projectSafeRow (amendments 2+5)", () => {
  it("keeps only allowlisted fields; unknown columns omitted", () => {
    const out = projectSafeRow(
      { id: "x", reading_date: "2026-08-01", secret_note: "a@b.co", old_data: { email: "x@y.co" } },
      "wastewater.reading",
    );
    expect(out).toHaveProperty("id", "x");
    expect(out).toHaveProperty("reading_date");
    expect(out).not.toHaveProperty("secret_note");
    expect(out).not.toHaveProperty("old_data");
  });
  it("scrubs email/Thai-ID/phone shapes in safe string fields (defense-in-depth)", () => {
    // PR29 remediation moved this onto a still-permitted string field:
    // note/color_desc/smell_desc are no longer projected at all, but any
    // allowlisted string value is still regex-scrubbed as defense-in-depth.
    const out = projectSafeRow(
      { id: "ติดต่อ a@hospital.co หรือ 0891234567 / เลข 1234567890123" },
      "wastewater.reading",
    ) as { id: string };
    expect(out.id).not.toContain("a@hospital.co");
    expect(out.id).not.toContain("0891234567");
    expect(out.id).not.toContain("1234567890123");
    expect(out.id).toContain("[REDACTED]");
  });
});

describe("isRuntimeApproved (amendments 1+4+6)", () => {
  it("true only when scope row exists patient_safe+enabled", async () => {
    state.scopeResult = { data: { view_name: "wastewater.reading" }, error: null };
    expect(await isRuntimeApproved("wastewater.reading")).toBe(true);
  });
  it("false on scope error — no STATIC_PHI_DENY allowlist fallback", async () => {
    state.scopeResult = { data: null, error: { message: "rls deny" } };
    expect(await isRuntimeApproved("wastewater.reading")).toBe(false);
  });
  it("false on exception (fail closed)", async () => {
    // force exception path by pointing scopeResult access to throw
    const orig = state.scopeResult;
    (state as unknown as { scopeResult: never }).scopeResult = new Proxy(
      orig,
      { get() { throw new Error("net down"); } },
    ) as never;
    expect(await isRuntimeApproved("wastewater.reading")).toBe(false);
    state.scopeResult = { data: null, error: null };
  });
});

// ─── annotateRow integration (the actual boundary) ────────────────────────

describe("annotateRow boundary", () => {
  it("refuses a table with NO static profile even if runtime scope says safe (amendment 2)", async () => {
    // scope approves audit_log, but audit_log has no static profile
    state.scopeResult = { data: { view_name: "core.audit_log" }, error: null };
    await expect(
      annotateRow({ id: "1", old_data: { email: "x@y.co" } }, "core.audit_log"),
    ).rejects.toThrow(/safe-field profile/);
    expect(state.fetchBodies.length).toBe(0); // zero provider calls
  });

  it("refuses a profiled table when runtime scope is closed/unreadable => ZERO provider calls (amendment 6)", async () => {
    state.scopeResult = { data: null, error: { message: "connection reset" } };
    await expect(
      annotateRow({ id: "1", reading_date: "2026-08-01" }, "wastewater.reading"),
    ).rejects.toThrow(/scope/);
    expect(state.fetchBodies.length).toBe(0);
  });

  it("approved table: prompt body contains ONLY projected safe fields (amendment 5)", async () => {
    state.scopeResult = { data: { view_name: "wastewater.reading" }, error: null };
    await annotateRow(
      { id: "r1", reading_date: "2026-08-01", ph_tank: 7.2, internal_flag: "secret-value" },
      "wastewater.reading",
    );
    expect(state.fetchBodies.length).toBe(1);
    const body = state.fetchBodies[0]!;
    expect(body).toContain("r1");
    expect(body).toContain("7.2");
    expect(body).not.toContain("internal_flag");
    expect(body).not.toContain("secret-value");
  });

  it("refusal error messages never embed raw row content (amendment 6)", async () => {
    state.scopeResult = { data: null, error: { message: "down" } };
    const secret = "TOPSECRET-VALUE-9";
    const p = annotateRow({ id: "1", note: secret }, "wastewater.reading");
    await expect(p).rejects.toThrow();
    await p.catch(() => {});
    // message asserted not to contain the secret
    let msg = "";
    try { await annotateRow({ id: "1", note: secret }, "wastewater.reading"); }
    catch (e) { msg = (e as Error).message; }
    expect(msg).not.toContain(secret);
  });
});

// ─── PR #29 remediation — unrestricted free-text is NOT provider-safe ──────
//
// DailyFormPage permits arbitrary typed text in color_desc / smell_desc /
// note ("พิมพ์เอง" inputs + free Textarea). Regex scrubbing (email/phone/
// Thai-ID) cannot guarantee removal of patient names or other identifiers,
// so these fields must be absent from the projection entirely — the
// profile is the authorization boundary, scrubbing is defense-in-depth.

const PHI_NOTE = "ผู้ป่วย สมชาย ใจดี HN 12345";
const CUSTOM_COLOR = "สีน้ำตาลอ่อน มีฟองเลือดจากตึกผู้ป่วยใน";
const CUSTOM_SMELL = "กลิ่นเปรี้ยวผิดปกติ แจ้งคุณหมอสมศักดิ์ที่หอผ่าตัดพิเศษ";

const FREE_TEXT_ROW = {
  id: "r-free",
  reading_date: "2026-08-26",
  do_tank: 4.1,
  color_desc: CUSTOM_COLOR,
  smell_desc: CUSTOM_SMELL,
  note: PHI_NOTE,
};

describe("PR29 remediation: unrestricted free-text fields never reach the provider", () => {
  it("projectSafeRow omits note/color_desc/smell_desc from wastewater.reading", () => {
    const out = projectSafeRow(FREE_TEXT_ROW, "wastewater.reading");
    expect(out).not.toHaveProperty("note");
    expect(out).not.toHaveProperty("color_desc");
    expect(out).not.toHaveProperty("smell_desc");
    expect(JSON.stringify(out)).not.toContain("สมชาย"); // patient-name fragment no regex catches
    expect(JSON.stringify(out)).not.toContain(CUSTOM_COLOR);
    expect(JSON.stringify(out)).not.toContain(CUSTOM_SMELL);
    expect(out).toHaveProperty("id", "r-free"); // bounded fields still projected
  });

  it("captured provider request body contains no free-text field or value (PHI cannot leave)", async () => {
    state.scopeResult = { data: { view_name: "wastewater.reading" }, error: null };
    await annotateRow(FREE_TEXT_ROW, "wastewater.reading");
    expect(state.fetchBodies.length).toBe(1);
    const body = state.fetchBodies[0]!;
    expect(body).not.toContain("color_desc");
    expect(body).not.toContain("smell_desc");
    expect(body).not.toContain('"note"');
    expect(body).not.toContain("สมชาย");
    expect(body).not.toContain(CUSTOM_COLOR);
    expect(body).not.toContain(CUSTOM_SMELL);
    expect(body).toContain("r-free"); // annotation still works on safe fields
    expect(body).toContain("4.1");
  });
});

// ─── WO-STAB-009 remediation 2 — all-profile unbounded-text audit ──────────
//
// Post-merge all-five-profile audit (GPT 2026-08-26,
// docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION-2.md):
//   - fuel.dispense_log.fuel_type: unrestricted `text`, no CHECK; the bulk
//     import adapter (import-adapters/fuel.ts) accepts arbitrary strings.
//   - garbage.collection_log.waste_type: unrestricted legacy `text`.
//   - wastewater.threshold_alert.severity: stale entry — no such column
//     exists in the current schema (dormant future-safe-field hazard).
// None of these may stay in a provider-safe profile.

const R2_PHI = "ผู้ป่วย สมชาย ใจดี HN 12345";

describe("Remediation-2: fuel/garbage/threshold profiles carry no unbounded text", () => {
  it("fuel.dispense_log: fuel_type value/field never projected", () => {
    const out = projectSafeRow(
      { id: "f1", log_date: "2026-08-26", litres: 40.5, fuel_type: R2_PHI },
      "fuel.dispense_log",
    );
    expect(out).not.toHaveProperty("fuel_type");
    expect(JSON.stringify(out)).not.toContain("สมชาย");
    expect(out).toHaveProperty("litres", 40.5); // bounded fields still pass
  });

  it("fuel.dispense_log: captured provider body has no fuel_type key or value", async () => {
    state.scopeResult = { data: { view_name: "fuel.dispense_log" }, error: null };
    await annotateRow(
      { id: "f1", log_date: "2026-08-26", litres: 40.5, fuel_type: R2_PHI },
      "fuel.dispense_log",
    );
    expect(state.fetchBodies.length).toBe(1);
    const body = state.fetchBodies[0]!;
    expect(body).not.toContain("fuel_type");
    expect(body).not.toContain("สมชาย");
    expect(body).toContain("40.5");
  });

  it("garbage.collection_log: waste_type value/field never projected", () => {
    const out = projectSafeRow(
      { id: "g1", log_date: "2026-08-26", weight_kg: 12.3, waste_type: R2_PHI },
      "garbage.collection_log",
    );
    expect(out).not.toHaveProperty("waste_type");
    expect(JSON.stringify(out)).not.toContain("สมชาย");
    expect(out).toHaveProperty("weight_kg", 12.3);
  });

  it("garbage.collection_log: captured provider body has no waste_type key or value", async () => {
    state.scopeResult = { data: { view_name: "garbage.collection_log" }, error: null };
    await annotateRow(
      { id: "g1", log_date: "2026-08-26", weight_kg: 12.3, waste_type: R2_PHI },
      "garbage.collection_log",
    );
    expect(state.fetchBodies.length).toBe(1);
    const body = state.fetchBodies[0]!;
    expect(body).not.toContain("waste_type");
    expect(body).not.toContain("สมชาย");
    expect(body).toContain("12.3");
  });

  it("wastewater.threshold_alert: stale severity entry is not projected", () => {
    const out = projectSafeRow(
      { id: "t1", created_at: "2026-08-26T00:00:00Z", read_at: null, severity: R2_PHI },
      "wastewater.threshold_alert",
    );
    expect(out).not.toHaveProperty("severity");
    expect(JSON.stringify(out)).not.toContain("สมชาย");
  });
});
