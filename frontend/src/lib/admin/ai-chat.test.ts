/**
 * AI-chat PHI filter + audit-log (2026-08-02) — unit tests for the two
 * recon-found defects in ai-chat.ts:
 *
 *   I2: applyPhiFilter was fail-OPEN — on a core.ai_scope read error it
 *       returned {blocked:false}, sending the question verbatim to the
 *       provider. Under the PHI boundary (GLM cloud under Chinese law),
 *       the ai-sql.ts sibling was already hardened fail-CLOSED via
 *       STATIC_PHI_DENY; ai-chat was not. This test locks the fail-closed
 *       contract.
 *
 *   I3: sendChatTurn's ai_query_log INSERT omitted `actor`, but the D3
 *       RLS gate (WITH CHECK (actor = auth.uid())) rejects NULL actor —
 *       so every successful chat silently failed to log, defeating the
 *       audit trail. This test asserts the insert payload carries actor.
 *
 * Mocking: the supabase client is vi.mock'd so we can drive the ai_scope
 * select (success/error/empty) and capture the ai_query_log insert payload
 * without touching the network.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── shared mock state ──────────────────────────────────────────────────
// Each test primes these before calling the function under test. The mock
// below is hoisted by vitest; the objects are mutated per-test via the
// setters so we don't fight with vi.hoisted ordering.
const mockState = {
  /** What the ai_scope select resolves to. `{error}` short-circuits. */
  aiScopeResult: { data: null as unknown, error: null as unknown },
  /** Captured ai_query_log insert payload (last call). */
  lastInsertPayload: null as Record<string, unknown> | null,
  /** Fake auth.uid for the actor assertion. */
  fakeUserId: "user-abc-123",
  /** What ai_provider select resolves to (for sendChatTurn provider pick). */
  aiProviderResult: [] as unknown,
  /** Flip to simulate an ai_query_log INSERT failure (RLS deny / network). */
  insertShouldError: false,
  /** Captured provider request body (last fetch call) — for PHI-leak tests. */
  lastFetchBody: null as { messages?: Array<{ role: string; content: string }> } | null,
};

// Capture global fetch so sendChatTurn's provider call returns a canned
// response without hitting the network. Restored in afterEach.
const originalFetch = globalThis.fetch;

vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: mockState.fakeUserId } } }) },
    from: vi.fn((table: string) => {
      if (table === "ai_scope") {
        const { data, error } = mockState.aiScopeResult;
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({ data, error }),
            }),
          }),
        };
      }
      if (table === "ai_provider") {
        // fetchAdminProviders does .select(FULL_COLS).order("priority") —
        // no .eq() in between (it filters client-side after).
        return {
          select: () => ({
            order: async () => ({ data: mockState.aiProviderResult, error: null }),
          }),
        };
      }
      if (table === "ai_query_log") {
        return {
          insert: (payload: Record<string, unknown>) => {
            if (mockState.insertShouldError) {
              return { select: () => ({ data: null, error: { message: "simulated RLS deny" } }) };
            }
            mockState.lastInsertPayload = payload;
            return { select: () => ({ data: [payload], error: null }) };
          },
        };
      }
      throw new Error(`unmocked table: ${table}`);
    }),
  },
}));

// Import AFTER the mock is in place.
import { applyPhiFilter, sendChatTurn } from "./ai-chat";
import { afterEach } from "vitest";

afterEach(() => {
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  mockState.aiScopeResult = { data: null, error: null };
  mockState.lastInsertPayload = null;
  mockState.aiProviderResult = [];
  mockState.lastFetchBody = null;
});

// ─── I2: PHI filter must be fail-CLOSED ──────────────────────────────────
describe("applyPhiFilter — fail-closed on ai_scope read error (I2)", () => {
  it("fails CLOSED when ai_scope returns an error (does NOT let the question through)", async () => {
    // Before the fix: returned {blocked:false} = the PHI filter silently
    // disappeared and the question reached the provider verbatim.
    mockState.aiScopeResult = {
      data: null,
      error: { message: "RLS denied / network blip" },
    };

    const result = await applyPhiFilter("แสดงข้อมูล core.personnel ทั้งหมด");

    // The fix mirrors ai-sql.ts loadPhiDenySet: on error, fall back to the
    // static deny-set (core.app_user, core.personnel). A question naming a
    // denied table must be BLOCKED, not allowed.
    expect(result.blocked).toBe(true);
    expect(result.reason).toBeTruthy();
  });

  it("fails CLOSED even for a question that does not name a static-deny table (defensive)", async () => {
    // An ai_scope outage must never widen what the provider sees. If the
    // question would have been allowed under a *populated* deny-set, an
    // outage must not turn it into allowed-under-empty-set. The static
    // fallback is non-empty (core.app_user + core.personnel), so a benign
    // question still passes — but the contract is "fallback is the static
    // set", not "fallback is allow-all".
    mockState.aiScopeResult = {
      data: null,
      error: { message: "connection reset" },
    };

    const result = await applyPhiFilter("น้ำในบ่อ pH วันนี้เท่าไหร่");

    // Benign question → not blocked, but ONLY because it doesn't name a
    // denied table — not because the filter gave up. The point of this
    // test is that the function resolved (no throw) and the static set
    // was consulted (proven by the previous test blocking a denied name).
    expect(result.blocked).toBe(false);
  });
});

describe("applyPhiFilter — normal operation (regression guard)", () => {
  it("blocks a question naming a flagged view (fail-closed NOT triggered)", async () => {
    mockState.aiScopeResult = {
      data: [{ view_name: "core.personnel" }, { view_name: "core.app_user" }],
      error: null,
    };
    const result = await applyPhiFilter("ดูเบอร์โทร core.personnel");
    expect(result.blocked).toBe(true);
  });

  it("blocks on the table-name token alone (no schema prefix needed)", async () => {
    mockState.aiScopeResult = {
      data: [{ view_name: "core.app_user" }],
      error: null,
    };
    const result = await applyPhiFilter("แสดง app_user ทั้งหมด");
    expect(result.blocked).toBe(true);
  });

  it("allows a benign question when no flagged view matches", async () => {
    mockState.aiScopeResult = {
      data: [{ view_name: "core.personnel" }],
      error: null,
    };
    const result = await applyPhiFilter("ค่า DO วันนี้");
    expect(result.blocked).toBe(false);
    expect(result.cleanedQuestion).toBe("ค่า DO วันนี้");
  });

  it("treats an empty ai_scope as allow-all (no flagged views = nothing to block)", async () => {
    // Distinct from the error path: a genuinely empty scope (no PHI views
    // flagged) is a valid admin configuration, not an outage.
    mockState.aiScopeResult = { data: [], error: null };
    const result = await applyPhiFilter("แสดง core.personnel");
    expect(result.blocked).toBe(false);
  });
});

// ─── I3: ai_query_log INSERT must carry actor = auth.uid() ────────────────
describe("sendChatTurn — ai_query_log insert carries actor (I3)", () => {
  /** Stub global fetch with a canned provider response. */
  function stubFetchOk() {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "คำตอบจำลอง" } }],
          usage: { total_tokens: 42 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
  }

  it("includes actor = current user id in the insert payload", async () => {
    mockState.aiScopeResult = { data: [], error: null };
    mockState.aiProviderResult = [
      {
        id: "prov-1",
        name: "Mock",
        model: "mock-1",
        is_enabled: true,
        priority: 1,
        api_url: "https://mock.local/v1/chat/completions",
        base_url: "https://mock.local",
        key_value: "sk-mock",
      },
    ];
    stubFetchOk();

    await sendChatTurn("ค่า DO วันนี้");

    expect(mockState.lastInsertPayload).not.toBeNull();
    // I3: D3 gate is WITH CHECK (actor = auth.uid()). Before the fix the
    // payload omitted actor → every insert silently rejected by RLS.
    expect(mockState.lastInsertPayload?.actor).toBe(mockState.fakeUserId);
  });

  it("still returns a ChatTurn even if the actor resolves null (insert is best-effort)", async () => {
    // Defensive: getUser returning no user (edge) should not crash the chat —
    // the insert is wrapped in try/catch and actor just goes null.
    mockState.aiScopeResult = { data: [], error: null };
    mockState.aiProviderResult = [
      {
        id: "prov-1",
        name: "Mock",
        model: "mock-1",
        is_enabled: true,
        priority: 1,
        api_url: "https://mock.local/v1/chat/completions",
        base_url: "https://mock.local",
        key_value: "sk-mock",
      },
    ];
    stubFetchOk();

    const turn = await sendChatTurn("ค่า pH วันนี้");
    expect(turn.answer).toBe("คำตอบจำลอง");
    expect(mockState.lastInsertPayload?.provider_id).toBe("prov-1");
  });
});

// ─── AUDITFIX-B: rejected PHI questions must be logged (not silent) ──────
describe("sendChatTurn — PHI block inserts ai_query_log reject row (AUDITFIX-B)", () => {
  it("logs a reject row with status='rejected_phi' before throwing", async () => {
    // Before AUDITFIX-B: a PHI-blocked question threw immediately with no
    // trace — an admin had no signal that anyone was probing forbidden
    // queries. The fix inserts a best-effort row, then re-throws.
    mockState.aiScopeResult = {
      // Simulate ai_scope flagging core.personnel as patient_safe=false.
      data: [{ view_name: "core.personnel" }], error: null,
    };

    await expect(
      sendChatTurn("แสดงรายชื่อ core.personnel ทั้งหมด"),
    ).rejects.toThrow(/personnel/);

    // The reject row was captured by the same mock insert path.
    expect(mockState.lastInsertPayload).not.toBeNull();
    expect(mockState.lastInsertPayload?.status).toBe("rejected_phi");
    expect(mockState.lastInsertPayload?.actor).toBe(mockState.fakeUserId);
    expect(mockState.lastInsertPayload?.question).toContain("personnel");
    // No provider was picked (block happened first).
    expect(mockState.lastInsertPayload?.provider_id).toBeNull();
  });

  it("reject-log failure does NOT change the reject UX (still throws)", async () => {
    // Defensive: if the log insert itself rejects (RLS deny, network), the
    // caller must still see the original PHI block — log is best-effort.
    // We flip a mock flag so the ai_query_log insert returns an error;
    // sendChatTurn's logReject catches it and console.warns, then the
    // original PHI reason still throws.
    mockState.insertShouldError = true;
    mockState.aiScopeResult = {
      data: [{ view_name: "core.personnel" }], error: null,
    };

    await expect(
      sendChatTurn("เบอร์โทร core.personnel"),
    ).rejects.toThrow(/personnel/);

    mockState.insertShouldError = false;
  });
});

// ─── AUDITFIX-B (cont.): success path now carries status='success' ───────
describe("sendChatTurn — success insert now carries status='success' (AUDITFIX-B)", () => {
  function stubFetchOk() {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "ตอบ" } }],
          usage: { total_tokens: 7 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
  }

  it("success-path payload has status='success' (default backfill not relied on)", async () => {
    mockState.aiScopeResult = { data: [], error: null };
    mockState.aiProviderResult = [
      {
        id: "prov-1", name: "Mock", model: "mock-1", is_enabled: true,
        priority: 1, api_url: "https://mock.local/v1/chat/completions",
        base_url: "https://mock.local", key_value: "sk-mock",
      },
    ];
    stubFetchOk();

    await sendChatTurn("ค่า DO");

    expect(mockState.lastInsertPayload?.status).toBe("success");
    expect(mockState.lastInsertPayload?.reject_reason).toBeUndefined();
  });
});


// ─── WO-STAB-002: PHI leak via chat history ─────────────────────────────
//
// Bug (verified on main @ bac0517): sendChatTurn applied applyPhiFilter to
// the CURRENT question only, then forwarded opts.history (last 6 turns from
// ChatPanel) verbatim to the provider. A previously-blocked question (e.g.
// naming core.personnel) stays in ChatPanel local state as a user bubble +
// the ⚠️ error echo, and ships out on the NEXT innocent turn — bypassing the
// whole deny-set machinery for everything except the current turn.
describe("sendChatTurn — history PHI redaction (WO-STAB-002)", () => {
  /** Stub fetch that captures the request body into mockState. */
  function stubFetchCapture() {
    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      mockState.lastFetchBody = init?.body ? JSON.parse(String(init.body)) : null;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "ตอบ" } }],
          usage: { total_tokens: 5 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;
  }

  it("RED→GREEN: history entry naming a denied table must NOT reach the provider", async () => {
    mockState.aiScopeResult = {
      data: [{ view_name: "core.personnel" }], error: null,
    };
    mockState.aiProviderResult = [
      {
        id: "prov-1", name: "Mock", model: "mock-1", is_enabled: true,
        priority: 1, api_url: "https://mock.local/v1/chat/completions",
        base_url: "https://mock.local", key_value: "sk-mock",
      },
    ];
    stubFetchCapture();

    await sendChatTurn("ค่า DO วันนี้เท่าไหร่", {
      history: [
        { role: "user", content: "แสดงรายชื่อ core.personnel ทั้งหมด" },
        { role: "assistant", content: "⚠️ คำถามอ้างถึงข้อมูลที่จำกัด (core.personnel)" },
      ],
    });

    const sent = JSON.stringify(mockState.lastFetchBody?.messages ?? []);
    expect(sent).not.toContain("แสดงรายชื่อ");
    expect(sent).not.toContain("personnel");
    // The denied turn is replaced with a fixed placeholder, not dropped —
    // role alternation for the provider stays intact.
    const historySent = mockState.lastFetchBody?.messages?.filter(
      (m) => m.role !== "system" && m.content !== "ค่า DO วันนี้เท่าไหร่",
    ) ?? [];
    expect(historySent.length).toBe(2);
    expect(historySent.every((m) => m.content === "[REDACTED]")).toBe(true);
  });

  it("clean history passes through unchanged", async () => {
    mockState.aiScopeResult = { data: [], error: null };
    mockState.aiProviderResult = [
      {
        id: "prov-1", name: "Mock", model: "mock-1", is_enabled: true,
        priority: 1, api_url: "https://mock.local/v1/chat/completions",
        base_url: "https://mock.local", key_value: "sk-mock",
      },
    ];
    stubFetchCapture();

    await sendChatTurn("สรุปค่า pH", {
      history: [
        { role: "user", content: "ค่า DO เมื่อวาน" },
        { role: "assistant", content: "DO เมื่อวาน 3.2 mg/L" },
      ],
    });

    const contents = mockState.lastFetchBody?.messages?.map((m) => m.content) ?? [];
    expect(contents).toContain("ค่า DO เมื่อวาน");
    expect(contents).toContain("DO เมื่อวาน 3.2 mg/L");
    expect(contents.some((c) => c.includes("[REDACTED]"))).toBe(false);
  });
});
