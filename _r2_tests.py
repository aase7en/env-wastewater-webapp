import io

TESTS = '''

    def test_cross_root_command_rejected(self):
        """D5 R2 P1: a --root targeting another worktree is denied."""
        with tempfile.TemporaryDirectory() as folder:
            temp_dir = Path(folder)
            active = self._context_claim_fixture(temp_dir)
            other_dir = Path(tempfile.mkdtemp())
            try:
                actual = {"repo": runtime.REPO_SLUG, "worktree": str(temp_dir),
                          "branch": "feat/env-defect-legacylookup-001",
                          "head_sha": "b" * 40,
                          "claim_base_ancestor": True, "current_policy_ancestor": True}
                with patch.object(runtime, "load_trusted_policy",
                                  return_value=(policy(active), "")), \\
                     patch.object(runtime, "_run_git",
                                  return_value=str(temp_dir)), \\
                     patch.object(runtime, "_actual_context", return_value=actual):
                    result = runtime.hook_pretool({
                        "tool_name": "Bash",
                        "tool_input": {"command": f"python script.py --root {other_dir}"},
                        "session_id": "s", "turn_id": "t",
                        "tool_use_id": "u", "model": "GLM-5.3 MAX",
                    }, temp_dir)
            finally:
                other_dir.rmdir()
        self.assertEqual(result.get("permissionDecision"), "deny")
        self.assertEqual(result.get("reason"), "CROSS_ROOT_TARGET_MISMATCH")

    def test_same_branch_unresolvable_fail_closed(self):
        """D5 R2 P2: a match + a same-branch unresolvable worktree = unproven
        uniqueness = fail closed."""
        with tempfile.TemporaryDirectory() as folder:
            temp_dir = Path(folder)
            matching = claim("T-OK", "T-OK-C1", "CLAIMED", ["docs/ai/handoffs/T-OK.md"])
            matching.update({"worktree": str(temp_dir).replace("\\\\", "/"), "branch": "feat/x"})
            stale = claim("T-STALE", "T-STALE-C1", "CLAIMED", ["docs/ai/handoffs/T-STALE.md"])
            stale.update({"worktree": "Z:/nonexistent/wt", "branch": "feat/x"})
            with self.assertRaises(runtime.AutonomyFailure) as raised:
                runtime._select_context_claim(policy(matching, stale), temp_dir, "feat/x")
            self.assertIn("CLAIM_IDENTITY_UNESTABLISHABLE", raised.exception.reason)

    def test_diff_branch_unresolvable_does_not_block(self):
        """D5 R2 P2: a missing worktree on a DIFFERENT branch does not
        affect uniqueness for the executing branch."""
        with tempfile.TemporaryDirectory() as folder:
            temp_dir = Path(folder)
            matching = claim("T-OK", "T-OK-C1", "CLAIMED", ["docs/ai/handoffs/T-OK.md"])
            matching.update({"worktree": str(temp_dir).replace("\\\\", "/"), "branch": "feat/x"})
            other_branch = claim("T-OTHER", "T-OTHER-C1", "CLAIMED", ["docs/ai/handoffs/T-OTHER.md"])
            other_branch.update({"worktree": "Z:/nonexistent/wt", "branch": "feat/other"})
            result = runtime._select_context_claim(policy(matching, other_branch), temp_dir, "feat/x")
        self.assertEqual(result["claim_id"], "T-OK-C1")

    def test_cli_task_defaults_context_selected(self):
        """D5 R2 P2: the CLI --task defaults are None (context-selected),
        not the closed ENV-AUTONOMY-001."""
        source = Path(runtime.__file__).read_text(encoding="utf-8")
        self.assertNotIn('default="ENV-AUTONOMY-001"', source,
                         "CLI defaults must not name the closed task")
'''

path = 'scripts/test_env_autonomy_runtime.py'
t = io.open(path, encoding='utf-8', newline='').read()
anchor = t.rfind('    def test_')
# Find the end of the last test method (the next blank line + def or class end)
end = t.find(NL + NL + 'if __name__', anchor)
if end == -1:
    end = t.rfind(NL + NL)
NL = '\r\n' if '\r\n' in t[:500] else '\n'
tests_crlf = TESTS.replace('\n', NL).replace('\\\\', '\\')
t = t[:end] + tests_crlf + t[end:]
io.open(path, 'w', encoding='utf-8', newline='').write(t)
print('R2 regression tests added')
