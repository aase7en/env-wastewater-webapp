"""Regression tests for check_release_version (ENV-APP-VERSION-001).

Covers the D1-binding consistency gates without touching CI:
  - SemVer parsing (plain X.Y.Z only)
  - package.json version extraction
  - first CHANGELOG entry extraction (version / พ.ศ. date / summary)
  - hardcoded-version grep guard (test-fixture exemption, version.ts clean)
  - release-tag equality (--tag mode)

Run:  python3 scripts/test_check_release_version.py
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_release_version import (  # noqa: E402
    first_changelog_entry,
    find_hardcoded_versions,
    package_json_version,
    parse_semver,
    tag_matches,
)

PASS = 0
FAIL = 0


def check(label: str, actual: object, expected: object) -> None:
    global PASS, FAIL
    if actual == expected:
        PASS += 1
        print(f"  ok   {label}")
    else:
        FAIL += 1
        print(f"  FAIL {label}")
        print(f"       expected: {expected!r}")
        print(f"       actual:   {actual!r}")


def main() -> int:
    # --- parse_semver -------------------------------------------------------
    check("semver 1.0.0", parse_semver("1.0.0"), (1, 0, 0))
    check("semver 2.13.7", parse_semver("2.13.7"), (2, 13, 7))
    check("semver rejects 1.0", parse_semver("1.0"), None)
    check("semver rejects v-prefixed input", parse_semver("v1.0.0"), None)
    check("semver rejects empty", parse_semver(""), None)
    check("semver rejects wildcard", parse_semver("1.0.x"), None)
    check("semver rejects prerelease", parse_semver("1.0.0-beta"), None)
    check("semver rejects negative", parse_semver("1.0.-1"), None)

    # --- package_json_version ----------------------------------------------
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        pj = root / "package.json"
        pj.write_text(json.dumps({"name": "x", "version": "1.0.0"}), encoding="utf-8")
        check("package.json version read", package_json_version(pj), "1.0.0")
        pj.write_text(json.dumps({"name": "x"}), encoding="utf-8")
        check("package.json missing version -> None", package_json_version(pj), None)
        pj.write_text("{not json", encoding="utf-8")
        check("package.json malformed -> None", package_json_version(pj), None)
        check("package.json absent -> None", package_json_version(root / "nope.json"), None)

    # --- first_changelog_entry ----------------------------------------------
    sample = "\n".join(
        [
            "# บันทึกการเปลี่ยนแปลง (CHANGELOG)",
            "",
            "หัวข้ออธิบายเกณฑ์ bump MAJOR/MINOR/PATCH ...",
            "",
            "## v1.0.0 — 12 พฤศจิกายน พ.ศ. 2569",
            "",
            "เปิดตัวระบบเลขเวอร์ชัน: ชิปเวอร์ชันในแอป + CHANGELOG + สคริปต์ตรวจสอบ",
            "- Command Center, ฟอร์ม 8 โดเมน",
            "",
            "## v0.9.0 — 1 มกราคม พ.ศ. 2569",
            "",
            "รุ่นเก่า",
            "",
        ]
    )
    entry = first_changelog_entry(sample)
    check("changelog entry is not None", entry is not None, True)
    if entry is not None:
        check("changelog entry version", entry.version, "1.0.0")
        check("changelog entry dateTH has พ.ศ.", "พ.ศ." in entry.dateTH, True)
        check("changelog entry summary non-empty", len(entry.summary) > 0, True)
        check("changelog entry picks the TOPMOST (latest) heading", entry.version, "1.0.0")
    check("changelog without entries -> None", first_changelog_entry("# header only\n"), None)
    check("empty changelog -> None", first_changelog_entry(""), None)

    # --- find_hardcoded_versions (grep guard) --------------------------------
    with tempfile.TemporaryDirectory() as td:
        src = Path(td) / "src"
        (src / "sub").mkdir(parents=True)
        (src / "version.ts").write_text(
            "declare const __APP_VERSION__: string | undefined;\n"
            "export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;\n",
            encoding="utf-8",
        )
        (src / "oops.ts").write_text('const label = "v1.2.3"; // hardcoded — must be flagged\n', encoding="utf-8")
        (src / "sub" / "oops.tsx").write_text("const s = 'v10.20.30';\n", encoding="utf-8")
        (src / "fixture.test.ts").write_text(
            '// CHANGELOG-facing test fixture — exempt\nconst f = "v9.9.9";\n',
            encoding="utf-8",
        )
        (src / "clean.ts").write_text("const greeting = 'สวัสดี';\n", encoding="utf-8")
        violations = find_hardcoded_versions(src)
        check(
            "guard flags hardcoded versions outside tests",
            sorted(str(v.relative_to(src)) for v in violations),
            ["oops.ts", str(Path("sub") / "oops.tsx")],
        )
        check("guard keeps version.ts clean", "version.ts" in [str(v.relative_to(src)) for v in violations], False)
        check("guard exempts *.test.ts fixtures", "fixture.test.ts" in [str(v.relative_to(src)) for v in violations], False)

    # --- tag_matches (--tag mode) --------------------------------------------
    check("tag v1.0.0 matches version 1.0.0", tag_matches("1.0.0", "v1.0.0"), True)
    check("tag mismatch", tag_matches("1.0.0", "v1.0.1"), False)
    check("tag without v prefix rejected", tag_matches("1.0.0", "1.0.0"), False)
    check("tag not semver rejected", tag_matches("1.0.0", "v2569.11"), False)

    print()
    print(f"check_release_version regression: {PASS} passed, {FAIL} failed")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
