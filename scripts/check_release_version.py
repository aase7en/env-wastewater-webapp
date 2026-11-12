"""Release version consistency checker (ENV-APP-VERSION-001).

Read-only. Enforces the D1-binding scheme (SemVer vMAJOR.MINOR.PATCH,
single source = frontend/package.json "version"):

  1. package.json version parses as plain SemVer
  2. the first (latest) CHANGELOG.md entry version == package.json version
  3. no hardcoded `vX.Y.Z` literals in frontend/src outside *.test.ts(x)
     fixtures (CHANGELOG-facing fixtures are exempt); the scan matches only
     STANDALONE vSemVer tokens — a token embedded in a longer path/package
     reference (e.g. an asset URL segment) is benign and not flagged
  4. frontend/src/lib/version.ts reads the injected __APP_VERSION__ define
     rather than any literal
  5. --tag mode (run when cutting a release): the given tag name must equal
     v<package.json version> — full-string equality after normalization
     (the only normalization is stripping ONE leading lowercase 'v';
     uppercase 'V' is not stripped; whitespace is never normalized away;
     no prefix matching, e.g. v1.0.10 never matches version 1.0.1)

Usage:
  python3 scripts/check_release_version.py
  python3 scripts/check_release_version.py --tag v1.0.0 [--root /path/to/repo]

Exit 0 = consistent; 1 = drift or violation found. Never mutates anything;
no CI workflow is wired to this script (out of scope for the claim).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

SEMVER_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")
# Standalone v-prefixed SemVer literal (the display/tag form). ENV-MAINT-001
# hardening: full three-component form, and the lookarounds require the
# token to stand alone — not embedded in a longer path/package reference
# (preceded by a word char, '/', '.' or '-', or followed by a word char,
# '.' or '-'). A URL segment like cdn.example.com/v1.2.3/lib.js or a
# package ref like lib-v1.2.3 is benign; a quoted "v1.2.3" literal is a
# hardcoded version and must stay flagged (no false-negative for the
# version-literal pattern this guard exists for).
HARDCODED_RE = re.compile(r"(?<![\w/.\-])v\d+\.\d+\.\d+(?![\w.\-])")
CHANGELOG_HEADING_RE = re.compile(r"^##\s+v(\d+\.\d+\.\d+)\s+—\s+(.+)$", re.MULTILINE)
TEST_FILE_RE = re.compile(r"\.test\.tsx?$")
VERSION_TS_RE = "__APP_VERSION__"


def parse_semver(value: str) -> tuple[int, int, int] | None:
    """Strict plain X.Y.Z parse. Returns None for anything else (no guesses)."""
    m = SEMVER_RE.match(value)
    if not m:
        return None
    return (int(m.group(1)), int(m.group(2)), int(m.group(3)))


def package_json_version(path: Path) -> str | None:
    """Read the "version" field; None when absent/malformed (never a guess)."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    version = data.get("version")
    return version if isinstance(version, str) else None


@dataclass(frozen=True)
class ChangelogEntry:
    version: str
    dateTH: str
    summary: str


def first_changelog_entry(raw: str) -> ChangelogEntry | None:
    """Latest (topmost `## vX.Y.Z — …`) entry, or None when there is none."""
    heading = CHANGELOG_HEADING_RE.search(raw)
    if not heading:
        return None
    after = raw[heading.end():]
    body = re.split(r"^##\s", after, maxsplit=1)[0]
    summary = ""
    for line in body.splitlines():
        line = line.strip()
        if line:
            summary = line
            break
    return ChangelogEntry(version=heading.group(1), dateTH=heading.group(2).strip(), summary=summary)


def find_hardcoded_versions(src_dir: Path) -> list[Path]:
    """frontend/src files (outside test fixtures) containing vSEMVER literals.

    The version lib (lib/version.ts) reads the injected define and must stay
    literal-free; colocated *.test.ts(x) fixtures are exempt — they pin the
    CHANGELOG-facing expectations and are checked by their own suites.
    """
    violations: list[Path] = []
    for path in sorted(src_dir.rglob("*")):
        if not path.is_file() or path.suffix not in {".ts", ".tsx"}:
            continue
        if TEST_FILE_RE.search(path.name):
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if HARDCODED_RE.search(text):
            violations.append(path)
    return violations


def normalize_release_tag(tag: str) -> str:
    """Sole permitted tag normalization (ENV-MAINT-001): strip ONE leading
    lowercase 'v'. Case-sensitive by design — 'V1.0.1' is not normalized;
    whitespace is never normalized away; everything else passes through."""
    return tag[1:] if tag.startswith("v") else tag


def tag_matches(version: str, tag: str) -> bool:
    """--tag mode: tag must be exactly v<version> (ค.ศ./SemVer, never พ.ศ.).

    Full-string equality after normalization — no prefix matching, so
    v1.0.10 never matches version 1.0.1 and vice versa; the lowercase
    'v' prefix is mandatory (bare '1.0.1' is still rejected)."""
    return tag.startswith("v") and normalize_release_tag(tag) == version


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--tag", help="release tag to verify, e.g. v1.0.0")
    parser.add_argument(
        "--root",
        default=str(Path(__file__).resolve().parent.parent),
        help="repo root (default: the checkout this script lives in)",
    )
    args = parser.parse_args(argv)

    root = Path(args.root)
    problems: list[str] = []

    # 1) package.json version is valid SemVer
    pj = root / "frontend" / "package.json"
    version = package_json_version(pj)
    if version is None:
        problems.append(f"cannot read a version field from {pj}")
    elif parse_semver(version) is None:
        problems.append(f"package.json version {version!r} is not plain SemVer X.Y.Z")

    # 2) CHANGELOG first entry matches package.json
    changelog_path = root / "CHANGELOG.md"
    try:
        entry = first_changelog_entry(changelog_path.read_text(encoding="utf-8"))
    except OSError:
        entry = None
        problems.append(f"cannot read {changelog_path}")
    if entry is None and not problems:
        problems.append("CHANGELOG.md has no `## vX.Y.Z — …` release entry")
    if entry is not None and version is not None and entry.version != version:
        problems.append(
            f"CHANGELOG latest entry v{entry.version} != package.json v{version}"
        )

    # 3) no hardcoded vX.Y.Z literals in src (test fixtures exempt)
    src = root / "frontend" / "src"
    if src.is_dir():
        for path in find_hardcoded_versions(src):
            problems.append(f"hardcoded version literal in {path.relative_to(root)}")
    else:
        problems.append(f"missing source directory {src}")

    # 4) version.ts reads the injected define
    version_ts = src / "lib" / "version.ts"
    if not version_ts.is_file():
        problems.append(f"missing {version_ts.relative_to(root)}")
    else:
        text = version_ts.read_text(encoding="utf-8", errors="replace")
        if VERSION_TS_RE not in text:
            problems.append(f"{version_ts.relative_to(root)} does not read __APP_VERSION__")

    # 5) optional --tag equality (for use at tag time)
    if args.tag is not None and version is not None:
        if not tag_matches(version, args.tag):
            problems.append(f"tag {args.tag} != v{version} (package.json)")

    if problems:
        print("RELEASE VERSION CHECK: FAIL")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print(f"RELEASE VERSION CHECK: OK (v{version}; CHANGELOG entry v{entry.version if entry else '?'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
