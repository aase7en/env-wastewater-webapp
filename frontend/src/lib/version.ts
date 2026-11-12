/**
 * ENV-APP-VERSION-001 — single read point for the app version.
 *
 * D1 binding (docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md §D1): SemVer
 * vMAJOR.MINOR.PATCH; the ONLY source of the number is
 * `frontend/package.json` field `version`, injected at build time by the
 * `__APP_VERSION__` Vite define in vite.config.ts. This module must never
 * hardcode a release number (guarded by scripts/check_release_version.py).
 *
 * Truth states:
 * - When the define is absent (raw vitest runs — vitest.config.ts has no
 *   define), APP_VERSION is null and getAppVersionLabel() communicates the
 *   unset state; it never fabricates a release number (unknown ≠ 0).
 * - The tap-through release summary is parsed from CHANGELOG.md bundled at
 *   build time (?raw import) — the app never claims a release that has not
 *   happened. User-facing dates in the CHANGELOG are พ.ศ.; git tags stay
 *   ค.ศ./SemVer.
 */
import changelogRaw from "../../../CHANGELOG.md?raw";

// Replaced textually by the Vite `define` in vite.config.ts (both dev and
// build). Absent everywhere else, hence the typeof guard.
declare const __APP_VERSION__: string | undefined;

export const CHANGELOG_RAW: string = changelogRaw;

/** Injected app version, or null when unset (no define). */
export const APP_VERSION: string | null =
  typeof __APP_VERSION__ === "undefined" ? null : __APP_VERSION__;

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export interface ChangelogEntry {
  /** Bare SemVer string, e.g. "1.0.0" (no v prefix). */
  version: string;
  /** Thai พ.ศ. date as written in the CHANGELOG heading. */
  dateTH: string;
  /** First non-empty summary line under the heading (one-line Thai). */
  summary: string;
}

/** Stable pointer to the full user-facing CHANGELOG (shown by the chip). */
export const CHANGELOG_URL =
  "https://github.com/aase7en/env-wastewater-webapp/blob/main/CHANGELOG.md";

/** Strict plain X.Y.Z SemVer parse — null for anything else (never guess). */
export function parseSemVer(value: string): SemVer | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/** UI/git-tag display form of a bare SemVer string. */
export function formatVersionLabel(version: string): string {
  return `v${version}`;
}

/** CE year → พ.ศ. (Buddhist Era) year, per the repo date convention. */
export function ceToBuddhistYear(ceYear: number): number {
  return ceYear + 543;
}

/**
 * Parse the LATEST (topmost `## vX.Y.Z — …`) release entry out of the
 * bundled CHANGELOG. Returns null when no release entry exists — callers
 * must treat that as unknown, never substitute a placeholder release.
 */
export function firstChangelogEntry(raw: string): ChangelogEntry | null {
  const heading = /^##\s+v(\d+\.\d+\.\d+)\s+—\s+(.+)$/m.exec(raw);
  if (!heading) return null;
  const after = raw.slice(heading.index + heading[0].length);
  const summary = after
    .split(/^##\s/m)[0]!
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return {
    version: heading[1]!,
    dateTH: heading[2]!.trim(),
    summary: summary ?? "",
  };
}

/**
 * Truthful display label: the injected version, or a non-release marker
 * when the build define is missing. Never a fabricated release number.
 */
export function getAppVersionLabel(): string {
  return APP_VERSION === null ? "DEV (ไม่มีเลขเวอร์ชัน)" : formatVersionLabel(APP_VERSION);
}

/** Latest known release (from the bundled CHANGELOG), or null if unknown. */
export function getLatestRelease(): ChangelogEntry | null {
  return firstChangelogEntry(CHANGELOG_RAW);
}
