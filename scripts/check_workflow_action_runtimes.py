"""Reject known GitHub Action references older than their Node-24 generation."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


# These minimum majors were verified from the official action manifests on
# 2026-08-29. Keep this map narrow: an action belongs here only when its
# JavaScript/composite runtime has been inspected, not because its name looks
# similar to another action.
MINIMUM_NODE24_MAJOR = {
    "actions/checkout": 7,
    "actions/setup-node": 7,
    "actions/upload-artifact": 7,
    "actions/upload-pages-artifact": 5,
    "actions/deploy-pages": 5,
    "astral-sh/setup-uv": 10,
}

# A full commit pin is stronger supply-chain evidence than a mutable tag, but
# it cannot reveal its runtime generation syntactically. Accept only SHAs that
# were matched to the official release manifest during review.
VERIFIED_NODE24_SHAS = {
    "astral-sh/setup-uv": {
        "20cfd1bf945f4377ade1205e4dbc17946fc9a30d",  # v10.0.1
    },
}

# Major upgrades can change defaults even when the input schema remains
# compatible. These explicit inputs preserve the pre-upgrade behavior that is
# part of this repository's release contract.
REQUIRED_STEP_INPUTS = {
    "astral-sh/setup-uv": {
        "enable-cache": "false",
        "download-from-astral-mirror": "false",
    },
    "actions/upload-pages-artifact": {"include-hidden-files": "true"},
}

MAPPED_ACTION_TOKEN_PATTERN = re.compile(
    r"(?P<reference>(?:"
    + "|".join(re.escape(action) for action in MINIMUM_NODE24_MAJOR)
    + r")@[A-Za-z0-9._-]+)",
    re.IGNORECASE,
)

BLOCK_USES_PATTERN = re.compile(
    r"^\s*(?:-\s*)?uses:\s*['\"]?(?P<reference>[^'\"\s#]+)",
    re.MULTILINE,
)
FLOW_USES_PATTERN = re.compile(
    r"^\s*-\s*\{[^\n}]*?\buses\s*:\s*['\"]?(?P<reference>[^,'\"}\s#]+)",
    re.MULTILINE,
)
VERSION_PATTERN = re.compile(r"^v(?P<major>\d+)(?:\..*)?$")


@dataclass(frozen=True)
class RuntimeViolation:
    path: Path
    line: int
    reference: str
    reason: str

    def render(self) -> str:
        return f"{self.path}:{self.line}: {self.reference}: {self.reason}"


def workflow_files(workflows_dir: Path) -> Iterable[Path]:
    """Yield YAML workflow files deterministically."""

    yield from sorted(
        path
        for path in workflows_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in {".yml", ".yaml"}
    )


def _step_block(text: str, match: re.Match[str]) -> str:
    """Return the YAML text for the step containing a matched ``uses`` line."""

    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())
    if line_end == -1:
        return text[line_start:]

    uses_line = text[line_start:line_end]
    uses_indent = len(uses_line) - len(uses_line.lstrip())
    step_indent = uses_indent if uses_line.lstrip().startswith("-") else max(0, uses_indent - 2)
    cursor = line_end + 1
    while cursor < len(text):
        next_end = text.find("\n", cursor)
        if next_end == -1:
            next_end = len(text)
        line = text[cursor:next_end]
        stripped = line.lstrip()
        indent = len(line) - len(stripped)
        if stripped.startswith("- ") and indent <= step_indent:
            break
        cursor = next_end + 1
    return text[line_start:cursor]


def _missing_required_inputs(action: str, step: str) -> list[str]:
    missing: list[str] = []
    for name, value in REQUIRED_STEP_INPUTS.get(action.lower(), {}).items():
        pattern = re.compile(
            rf"^\s*{re.escape(name)}:\s*['\"]?{re.escape(value)}['\"]?\s*(?:#.*)?$",
            re.MULTILINE | re.IGNORECASE,
        )
        if pattern.search(step) is None:
            missing.append(f"{name}: {value}")
    return missing


def _uses_matches(text: str) -> list[re.Match[str]]:
    """Find block-style and YAML flow-style ``uses`` entries."""

    return sorted(
        [*BLOCK_USES_PATTERN.finditer(text), *FLOW_USES_PATTERN.finditer(text)],
        key=lambda match: match.start(),
    )


def _is_in_yaml_comment(text: str, position: int) -> bool:
    line_start = text.rfind("\n", 0, position) + 1
    return "#" in text[line_start:position]


def find_runtime_violations(workflows_dir: Path) -> list[RuntimeViolation]:
    """Return stale or unverifiable references for actions in the policy map."""

    violations: list[RuntimeViolation] = []
    for path in workflow_files(workflows_dir):
        text = path.read_text(encoding="utf-8")
        uses_matches = _uses_matches(text)
        covered_reference_spans = {
            (match.start("reference"), match.end("reference"))
            for match in uses_matches
        }
        for match in uses_matches:
            reference = match.group("reference")
            if "@" not in reference:
                continue
            action, version = reference.rsplit("@", 1)
            minimum = MINIMUM_NODE24_MAJOR.get(action.lower())
            if minimum is None:
                continue
            line = text.count("\n", 0, match.start()) + 1
            version_match = VERSION_PATTERN.fullmatch(version)
            if version_match is None:
                runtime_verified = version.lower() in VERIFIED_NODE24_SHAS.get(
                    action.lower(), set()
                )
            else:
                actual = int(version_match.group("major"))
                runtime_verified = actual >= minimum

            if not runtime_verified:
                if version_match is None:
                    reason = "cannot prove a Node-24-era major from this ref"
                else:
                    reason = (
                        f"major v{actual} is below verified Node-24 minimum v{minimum}"
                    )
                violations.append(
                    RuntimeViolation(path, line, reference, reason)
                )
                continue

            missing_inputs = _missing_required_inputs(
                action, _step_block(text, match)
            )
            if missing_inputs:
                violations.append(
                    RuntimeViolation(
                        path,
                        line,
                        reference,
                        "missing behavior-preserving input(s): "
                        + ", ".join(missing_inputs),
                    )
                )

        # YAML permits compact arrays and block scalars that do not match the
        # canonical one-line uses forms above. Reject mapped action tokens in
        # such encodings rather than silently treating valid YAML as clean.
        for token_match in MAPPED_ACTION_TOKEN_PATTERN.finditer(text):
            span = (token_match.start("reference"), token_match.end("reference"))
            if span in covered_reference_spans or _is_in_yaml_comment(
                text, token_match.start("reference")
            ):
                continue
            line = text.count("\n", 0, token_match.start()) + 1
            violations.append(
                RuntimeViolation(
                    path,
                    line,
                    token_match.group("reference"),
                    "unsupported YAML encoding for mapped action; use a "
                    "canonical one-line uses entry",
                )
            )
    return violations


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    repo_root = Path(args[0]).resolve() if args else Path(__file__).resolve().parents[1]
    workflows_dir = repo_root / ".github" / "workflows"
    if not workflows_dir.is_dir():
        print(f"ERROR: workflow directory not found: {workflows_dir}", file=sys.stderr)
        return 2

    violations = find_runtime_violations(workflows_dir)
    if violations:
        print("GitHub Action runtime regression detected:", file=sys.stderr)
        for violation in violations:
            print(violation.render(), file=sys.stderr)
        return 1

    checked = sum(1 for _ in workflow_files(workflows_dir))
    print(
        f"PASS: {checked} workflow files contain no mapped pre-Node-24 "
        "action refs or guarded semantic drift"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
