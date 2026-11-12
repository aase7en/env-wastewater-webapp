/**
 * ENV-APP-VERSION-001 — D2 RED-first unit tests for the version lib.
 *
 * Binding D1 scheme (handoff D1 section): SemVer vMAJOR.MINOR.PATCH,
 * first release v1.0.0, version source = frontend/package.json "version",
 * injected at build time via the `__APP_VERSION__` Vite define.
 *
 * Layering with the other D2 gates:
 * - the python checker (scripts/check_release_version.py) verifies
 *   package.json ↔ CHANGELOG ↔ tag consistency on the real files;
 * - THESE tests verify the pure lib logic + the honesty fallbacks;
 * - tests/e2e/env-app-version-001.spec.ts verifies the real app where the
 *   define IS active (dev server + build).
 *
 * NOTE: vitest.config.ts (deliberately untouchable) has no `define`, so
 * `__APP_VERSION__` is genuinely UNSET inside vitest. That makes the
 * unset-fallback honesty pins real, not simulated.
 */
import { describe, expect, it } from "vitest";
import {
  APP_VERSION,
  CHANGELOG_RAW,
  ceToBuddhistYear,
  firstChangelogEntry,
  formatVersionLabel,
  getAppVersionLabel,
  parseSemVer,
} from "./version";

describe("parseSemVer", () => {
  it("accepts a plain X.Y.Z SemVer", () => {
    expect(parseSemVer("1.0.0")).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(parseSemVer("2.13.7")).toEqual({ major: 2, minor: 13, patch: 7 });
  });

  it("rejects non-SemVer shapes (returns null — never a guess)", () => {
    expect(parseSemVer("1.0")).toBeNull();
    expect(parseSemVer("1.0.0.0")).toBeNull();
    expect(parseSemVer("v1.0.0")).toBeNull(); // the v belongs to the label, not the value
    expect(parseSemVer("")).toBeNull();
    expect(parseSemVer("1.0.x")).toBeNull();
    expect(parseSemVer("1.0.0-beta")).toBeNull(); // scheme pins plain X.Y.Z only
  });
});

describe("formatVersionLabel", () => {
  it("prefixes the v used in the UI and git tags", () => {
    expect(formatVersionLabel("1.0.0")).toBe("v1.0.0");
  });
});

describe("ceToBuddhistYear", () => {
  it("converts CE → พ.ศ. (CE + 543)", () => {
    expect(ceToBuddhistYear(2026)).toBe(2569);
    expect(ceToBuddhistYear(2025)).toBe(2568);
  });
});

describe("APP_VERSION (build-time injected)", () => {
  it("is either null (unset — vitest has no define) or a valid SemVer", () => {
    if (APP_VERSION === null) {
      expect(APP_VERSION).toBeNull();
    } else {
      expect(parseSemVer(APP_VERSION)).not.toBeNull();
    }
  });

  // In the real dev server/build the define IS present; there the injected
  // version must equal the first CHANGELOG entry (single-source, no drift).
  // Inside vitest (no define) the invariant is enforced instead by
  // scripts/check_release_version.py on the real files.
  it.skipIf(APP_VERSION === null)(
    "matches the first CHANGELOG entry when injected",
    () => {
      const entry = firstChangelogEntry(CHANGELOG_RAW);
      expect(entry).not.toBeNull();
      expect(entry!.version).toBe(APP_VERSION);
    },
  );
});

describe("firstChangelogEntry (bundled CHANGELOG, known at build time)", () => {
  it("parses the first release entry: version, พ.ศ. date, Thai summary", () => {
    const entry = firstChangelogEntry(CHANGELOG_RAW);
    expect(entry).not.toBeNull();
    expect(parseSemVer(entry!.version)).not.toBeNull();
    expect(entry!.dateTH).toContain("พ.ศ.");
    expect(entry!.summary.length).toBeGreaterThan(0);
  });

  it("finds the LATEST entry first (topmost ## heading)", () => {
    const raw = [
      "# บันทึกการเปลี่ยนแปลง",
      "",
      "## v9.9.9 — 1 มกราคม พ.ศ. 2600",
      "",
      "รุ่นใหม่ล่าสุด",
      "",
      "## v1.0.0 — 12 พฤศจิกายน พ.ศ. 2569",
      "",
      "รุ่นแรก",
      "",
    ].join("\n");
    expect(firstChangelogEntry(raw)?.version).toBe("9.9.9");
  });

  it("returns null for a CHANGELOG with no release entries (unknown ≠ fabricated)", () => {
    expect(firstChangelogEntry("# บันทึกการเปลี่ยนแปลง\n\nยังไม่มี release\n")).toBeNull();
  });
});

describe("getAppVersionLabel (truth states)", () => {
  it("when the version is unset, the label communicates unset — never a fabricated release number", () => {
    if (APP_VERSION === null) {
      const label = getAppVersionLabel();
      expect(label).not.toMatch(/^v\d+\.\d+\.\d+$/);
      expect(label.length).toBeGreaterThan(0);
    } else {
      expect(getAppVersionLabel()).toBe(formatVersionLabel(APP_VERSION));
    }
  });
});
