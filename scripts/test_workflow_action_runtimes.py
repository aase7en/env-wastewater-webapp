"""Unit tests for the GitHub Action runtime regression checker."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from check_workflow_action_runtimes import find_runtime_violations


class WorkflowActionRuntimeTests(unittest.TestCase):
    def scan(self, content: str, suffix: str = ".yml"):
        with tempfile.TemporaryDirectory() as directory:
            workflows = Path(directory)
            (workflows / f"sample{suffix}").write_text(content, encoding="utf-8")
            return find_runtime_violations(workflows)

    def test_current_node24_generations_pass(self):
        violations = self.scan(
            """
steps:
  - uses: actions/checkout@v7
  - uses: actions/setup-node@v7.0.0
  - uses: actions/upload-artifact@v7
  - uses: actions/upload-pages-artifact@v5
    with:
      include-hidden-files: true
  - uses: actions/deploy-pages@v5.0.0
  - uses: astral-sh/setup-uv@20cfd1bf945f4377ade1205e4dbc17946fc9a30d
    with:
      enable-cache: false
      download-from-astral-mirror: false
"""
        )
        self.assertEqual([], violations)

    def test_stale_generations_fail_with_lines_and_minimums(self):
        violations = self.scan(
            """steps:
  - uses: actions/checkout@v4
  - uses: astral-sh/setup-uv@v3
"""
        )
        self.assertEqual(2, len(violations))
        self.assertEqual([2, 3], [violation.line for violation in violations])
        self.assertIn("minimum v7", violations[0].reason)
        self.assertIn("minimum v10", violations[1].reason)

    def test_unverifiable_mapped_ref_fails_closed(self):
        violations = self.scan("steps:\n  - uses: actions/checkout@main\n")
        self.assertEqual(1, len(violations))
        self.assertIn("cannot prove", violations[0].reason)

    def test_unknown_full_sha_for_mapped_action_fails_closed(self):
        violations = self.scan(
            "steps:\n  - uses: astral-sh/setup-uv@0000000000000000000000000000000000000000\n"
        )
        self.assertEqual(1, len(violations))
        self.assertIn("cannot prove", violations[0].reason)

    def test_setup_uv_requires_explicit_disabled_cache(self):
        violations = self.scan(
            "steps:\n"
            "  - uses: astral-sh/setup-uv@20cfd1bf945f4377ade1205e4dbc17946fc9a30d\n"
            "    with:\n"
            "      download-from-astral-mirror: false\n"
        )
        self.assertEqual(1, len(violations))
        self.assertIn("enable-cache: false", violations[0].reason)

    def test_setup_uv_requires_original_download_source(self):
        violations = self.scan(
            "steps:\n"
            "  - uses: astral-sh/setup-uv@20cfd1bf945f4377ade1205e4dbc17946fc9a30d\n"
            "    with:\n"
            "      enable-cache: false\n"
        )
        self.assertEqual(1, len(violations))
        self.assertIn("download-from-astral-mirror: false", violations[0].reason)

    def test_pages_artifact_requires_hidden_files(self):
        violations = self.scan(
            "steps:\n  - uses: actions/upload-pages-artifact@v5\n"
        )
        self.assertEqual(1, len(violations))
        self.assertIn("include-hidden-files: true", violations[0].reason)

    def test_unmapped_or_local_actions_are_ignored(self):
        violations = self.scan(
            """steps:
  - uses: ./local-action
  - uses: vendor/container-action@0123456789abcdef
"""
        )
        self.assertEqual([], violations)

    def test_yaml_extension_and_quoted_ref_are_scanned(self):
        violations = self.scan(
            "steps:\n  - uses: 'actions/deploy-pages@v4' # stale\n",
            suffix=".yaml",
        )
        self.assertEqual(1, len(violations))
        self.assertEqual("actions/deploy-pages@v4", violations[0].reference)

    def test_flow_style_uses_cannot_bypass_runtime_guard(self):
        violations = self.scan(
            "steps:\n  - { name: checkout, uses: actions/checkout@v4 }\n"
        )
        self.assertEqual(1, len(violations))
        self.assertEqual("actions/checkout@v4", violations[0].reference)

    def test_current_flow_style_non_semantic_action_passes(self):
        violations = self.scan(
            "steps:\n  - { name: checkout, uses: actions/checkout@v7 }\n"
        )
        self.assertEqual([], violations)

    def test_inline_steps_array_cannot_bypass_guard(self):
        violations = self.scan(
            "steps: [{ uses: actions/checkout@v4 }]\n"
        )
        self.assertEqual(1, len(violations))
        self.assertIn("unsupported YAML encoding", violations[0].reason)

    def test_block_scalar_uses_cannot_bypass_guard(self):
        violations = self.scan(
            "steps:\n  - uses: >-\n      actions/checkout@v4\n"
        )
        self.assertEqual(1, len(violations))
        self.assertIn("unsupported YAML encoding", violations[0].reason)

    def test_action_reference_in_yaml_comment_is_ignored(self):
        violations = self.scan(
            "steps:\n  # historical: actions/checkout@v4\n  - uses: actions/checkout@v7\n"
        )
        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
