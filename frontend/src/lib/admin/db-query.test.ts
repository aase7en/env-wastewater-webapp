import { describe, it, expect } from "vitest";
import { isStatementAllowed, stripComments, type StatementCheck } from "./db-query";

/** Type-narrow helper: extract reason when ok=false (throws if ok=true). */
function reasonOf(r: StatementCheck): string {
  if (r.ok) throw new Error("expected rejection but got ok=true");
  return r.reason;
}

/**
 * TEST-2: unit tests for the DBA Console statement whitelist.
 *
 * `isStatementAllowed` is defense-in-depth layer 1 — pure client-side check
 * that runs before the SQL is sent to the DBA-3 Edge Function (which re-runs
 * the same checks with a real SQL parser as authoritative layer 2).
 *
 * Test surface (4 rules + comment stripping):
 *   - Rule 1: leading-keyword whitelist (SELECT / INSERT INTO / UPDATE /
 *     DELETE FROM / WITH) — case-insensitive, leading whitespace tolerant.
 *   - Rule 2: forbidden keyword scan anywhere in statement (DROP/TRUNCATE/
 *     ALTER/GRANT/REVOKE/CREATE/VACUUM/ANALYZE/COPY/CALL/DO $$/SET ROLE/
 *     RESET ROLE) — word-boundaried.
 *   - Rule 3: multi-statement rejection — single trailing `;` ok; stacked
 *     queries rejected.
 *   - Rule 4: comment stripping — keywords hidden in comments must NOT
 *     trigger rejection.
 *
 * Security-critical: if any of these regress, an admin user could execute
 * destructive SQL via DBA Console. The Edge Function still gates server-
 * side, but client-side is the cheap fast path + UX feedback layer.
 */

// ─── Rule 1: leading-keyword whitelist ──────────────────────────────────

describe("isStatementAllowed — Rule 1 (leading-keyword whitelist)", () => {
  it("allows SELECT", () => {
    expect(isStatementAllowed("SELECT 1")).toEqual({ ok: true });
    expect(isStatementAllowed("SELECT * FROM core.app_user")).toEqual({ ok: true });
  });

  it("allows INSERT INTO", () => {
    expect(isStatementAllowed("INSERT INTO core.app_user DEFAULT VALUES")).toEqual({ ok: true });
  });

  it("allows UPDATE", () => {
    expect(isStatementAllowed("UPDATE core.app_user SET display_name='x' WHERE id='x'")).toEqual({ ok: true });
  });

  it("KNOWN BUG: UPDATE on a column named `role` is over-rejected (SET role pattern matches)", () => {
    // Documented production bug (TEST-2 discovery): the FORBIDDEN_PATTERNS
    // entry `/\bSET\s+ROLE\b/i` matches `UPDATE ... SET role='staff'` —
    // legitimate UPDATE on any column named "role" gets flagged as a
    // privilege-escalation attempt. Fix in a follow-up (tighten regex to
    // require `^SET ROLE` or leading-statement context, OR re-order rules
    // so Rule 1 pass short-circuits before Rule 2 sees `SET`).
    // For now: assert the (buggy) current behavior so the fix is detected.
    const r = isStatementAllowed("UPDATE core.app_user SET role='staff' WHERE id='x'");
    expect(r.ok).toBe(false);
    expect(reasonOf(r)).toContain("SET ROLE");
  });

  it("allows DELETE FROM", () => {
    expect(isStatementAllowed("DELETE FROM core.app_user WHERE id='x'")).toEqual({ ok: true });
  });

  it("allows WITH (CTE resolving to SELECT)", () => {
    expect(isStatementAllowed("WITH x AS (SELECT 1) SELECT * FROM x")).toEqual({ ok: true });
  });

  it("rejects bare INSERT (without INTO)", () => {
    // INSERT alone is not a complete statement — regex requires INSERT INTO.
    const r = isStatementAllowed("INSERT core.app_user VALUES (1)");
    expect(r.ok).toBe(false);
  });

  it("rejects bare DELETE (without FROM)", () => {
    const r = isStatementAllowed("DELETE core.app_user");
    expect(r.ok).toBe(false);
  });
});

// ─── Case-insensitivity + whitespace ────────────────────────────────────

describe("isStatementAllowed — case-insensitive + leading whitespace", () => {
  it("accepts lowercase leading keyword", () => {
    expect(isStatementAllowed("select 1")).toEqual({ ok: true });
  });

  it("accepts mixed case leading keyword", () => {
    expect(isStatementAllowed("Select 1")).toEqual({ ok: true });
    expect(isStatementAllowed("sElEcT 1")).toEqual({ ok: true });
  });

  it("tolerates leading spaces / tabs / newlines", () => {
    expect(isStatementAllowed("   SELECT 1")).toEqual({ ok: true });
    expect(isStatementAllowed("\tSELECT 1")).toEqual({ ok: true });
    expect(isStatementAllowed("\n\nSELECT 1")).toEqual({ ok: true });
  });
});

// ─── Empty / whitespace-only ────────────────────────────────────────────

describe("isStatementAllowed — empty / whitespace-only", () => {
  it("rejects empty string", () => {
    const r = isStatementAllowed("");
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, reason: "SQL ว่างเปล่า" });
  });

  it("rejects whitespace-only string", () => {
    const r = isStatementAllowed("   \n\t  ");
    expect(r.ok).toBe(false);
    expect(r).toEqual({ ok: false, reason: "SQL ว่างเปล่า" });
  });

  it("rejects null/undefined coerced to empty (defensive)", () => {
    // TS types say string only — but JS callers could pass falsy.
    // The `!rawSql` guard catches it.
    expect(isStatementAllowed("" as string)).toEqual({ ok: false, reason: "SQL ว่างเปล่า" });
  });
});

// ─── Rule 2: forbidden keyword scan ─────────────────────────────────────

describe("isStatementAllowed — Rule 2 (forbidden keyword scan)", () => {
  const forbidden = [
    "DROP",
    "TRUNCATE",
    "ALTER",
    "GRANT",
    "REVOKE",
    "CREATE",
    "VACUUM",
    "ANALYZE",
    "COPY",
    "CALL",
  ];
  for (const kw of forbidden) {
    it(`rejects ${kw} as leading keyword`, () => {
      const r = isStatementAllowed(`${kw} something`);
      expect(r.ok).toBe(false);
      // Either Rule 1 fires (most cases — only SELECT/INSERT/UPDATE/DELETE/WITH
      // pass) or Rule 2 fires with the keyword label. Either way: not ok.
    });
  }

  it("rejects DROP hidden mid-statement (Rule 2)", () => {
    const r = isStatementAllowed("SELECT * FROM core.app_user; DROP TABLE x");
    // Note: actually rejected by Rule 3 (stacked queries) before Rule 2 has
    // a chance to flag DROP. The test confirms rejection regardless of rule.
    expect(r.ok).toBe(false);
  });

  it("rejects ALTER as a real statement (not in string literal)", () => {
    // ALTER leading keyword fails Rule 1 (not in whitelist). The earlier
    // test using UPDATE...WHERE flag='ALTER' is over-rejected by Rule 2
    // (string literal), not by ALTER detection — see KNOWN OVER-REJECTION test.
    const r = isStatementAllowed("ALTER TABLE x ADD COLUMN y int");
    expect(r.ok).toBe(false);
  });

  it("rejects SET ROLE (privilege escalation attempt)", () => {
    // Must come through as a leading keyword to escape Rule 1 — but the
    // SET ROLE pattern is forbidden regardless. The regex catches it
    // mid-statement too.
    const r = isStatementAllowed("SELECT 1; SET ROLE postgres");
    expect(r.ok).toBe(false);
  });

  it("rejects RESET ROLE", () => {
    const r = isStatementAllowed("SELECT 1; RESET ROLE");
    expect(r.ok).toBe(false);
  });

  it("rejects DO $$ (anonymous code block)", () => {
    const r = isStatementAllowed("SELECT 1; DO $$ BEGIN PERFORM 1; END $$");
    expect(r.ok).toBe(false);
  });

  it("does NOT false-positive on word-fragment matches (word boundary)", () => {
    // "dropbox" contains "drop" but \bDROP\b should not match.
    expect(isStatementAllowed("SELECT * FROM app.dropbox_files")).toEqual({ ok: true });
  });

  it("KNOWN OVER-REJECTION: forbidden keyword inside string literal fires Rule 2", () => {
    // Documented limitation (TEST-2 discovery): regex-based scan doesn't
    // parse string literals, so '%copy%' or 'CREATE' inside a WHERE clause
    // triggers the forbidden-keyword rule. Same root cause as the `;` in
    // string literal (Rule 3 test below). The Edge Function (DBA-3) uses
    // a real SQL parser server-side as authoritative check, so this is a
    // UX annoyance only — not a security gap.
    expect(isStatementAllowed("SELECT * FROM core.app_user WHERE email LIKE '%copy%'").ok).toBe(false);
    expect(isStatementAllowed("UPDATE x SET col = 1 WHERE flag = 'CREATE'").ok).toBe(false);
  });
});

// ─── Rule 3: multi-statement rejection ──────────────────────────────────

describe("isStatementAllowed — Rule 3 (multi-statement rejection)", () => {
  it("allows single trailing semicolon", () => {
    expect(isStatementAllowed("SELECT 1;")).toEqual({ ok: true });
  });

  it("allows no trailing semicolon", () => {
    expect(isStatementAllowed("SELECT 1")).toEqual({ ok: true });
  });

  it("allows trailing semicolon + whitespace", () => {
    expect(isStatementAllowed("SELECT 1;   ")).toEqual({ ok: true });
    expect(isStatementAllowed("SELECT 1;\n")).toEqual({ ok: true });
  });

  it("rejects stacked queries (two SELECTs)", () => {
    const r = isStatementAllowed("SELECT 1; SELECT 2");
    expect(r.ok).toBe(false);
    expect(reasonOf(r)).toContain("stacked");
  });

  it("rejects stacked queries with trailing semicolon too", () => {
    const r = isStatementAllowed("SELECT 1; SELECT 2;");
    expect(r.ok).toBe(false);
  });

  it("rejects SELECT followed by semicolon in string literal? (no — string content)", () => {
    // String literal `';'` is not a statement separator at the SQL level,
    // but our regex-based check doesn't parse string literals — it sees the
    // `;` and rejects. This is over-rejection in a rare case; the Edge
    // Function parser handles it correctly server-side. Document the
    // behavior here so a future "fix" doesn't silently weaken security.
    const r = isStatementAllowed("SELECT ';'");
    expect(r.ok).toBe(false);
  });
});

// ─── Rule 4: comment stripping ──────────────────────────────────────────

describe("isStatementAllowed — Rule 4 (comment stripping)", () => {
  it("allows DROP inside a line comment (it gets stripped)", () => {
    const r = isStatementAllowed("-- DROP TABLE secrets\nSELECT 1");
    expect(r.ok).toBe(true);
  });

  it("allows DROP inside a block comment", () => {
    const r = isStatementAllowed("/* DROP TABLE x */ SELECT 1");
    expect(r.ok).toBe(true);
  });

  it("still catches DROP when comment is unclosed (block)", () => {
    // Unclosed block comment — stripComments only matches /*...*/ pairs,
    // so an unclosed one leaves the rest as live SQL → DROP fires Rule 2.
    const r = isStatementAllowed("/* comment SELECT 1; DROP TABLE x");
    expect(r.ok).toBe(false);
  });

  it("handles multiple line comments in sequence", () => {
    const r = isStatementAllowed(
      "-- first line\n-- second line DROP\nSELECT 1",
    );
    expect(r.ok).toBe(true);
  });
});

// ─── stripComments (direct unit tests) ───────────────────────────────────

describe("stripComments", () => {
  it("strips line comments", () => {
    expect(stripComments("SELECT 1 -- hi").trim()).toBe("SELECT 1");
  });

  it("strips block comments", () => {
    expect(stripComments("SELECT /* x */ 1").replace(/\s+/g, " ").trim()).toBe("SELECT 1");
  });

  it("preserves # not treated as comment (PostgreSQL uses -- only)", () => {
    // PostgreSQL line comment is `--`; `#` is not. Our regex shouldn't strip it.
    expect(stripComments("SELECT '#'")).toContain("#");
  });

  it("handles text without comments unchanged (modulo whitespace)", () => {
    expect(stripComments("SELECT 1").trim()).toBe("SELECT 1");
  });
});

// ─── Reason message sanity (Thai) ───────────────────────────────────────

describe("isStatementAllowed — reason messages (Thai)", () => {
  it("empty rejection uses Thai 'SQL ว่างเปล่า'", () => {
    expect(reasonOf(isStatementAllowed(""))).toBe("SQL ว่างเปล่า");
  });

  it("forbidden keyword includes the keyword label in reason", () => {
    const r = isStatementAllowed("UPDATE x SET col = 1 WHERE flag = 'CREATE'");
    expect(reasonOf(r)).toContain("CREATE");
  });

  it("multi-statement uses Thai 'stacked' message", () => {
    const r = isStatementAllowed("SELECT 1; SELECT 2");
    expect(reasonOf(r)).toMatch(/stacked|หลายคำสั่ง/);
  });
});
