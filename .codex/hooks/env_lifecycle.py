#!/usr/bin/env python3
"""Codex project-hook entrypoint for the ENV autonomy runtime."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    try:
        root_text = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=Path.cwd(), stderr=subprocess.DEVNULL, text=True,
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        print('{"systemMessage":"ENV autonomy hook cannot identify the repository; mutation must stop."}')
        return 2
    root = Path(root_text).resolve()
    sys.path.insert(0, str(root / "scripts"))
    from env_autonomy_runtime import main as runtime_main

    return runtime_main(["hook", *sys.argv[1:], "--root", str(root)])


if __name__ == "__main__":
    raise SystemExit(main())
