# GPT 5.6 Sol UltraMAX — PR #29 / WO-STAB-009 Remediation

/goal Remediate the blocking PHI/provider-boundary finding in PR #29 without expanding scope. Keep the existing runtime `core.ai_scope` ∩ static-profile design, but make the static payload profile genuinely safe against arbitrary free-text patient identifiers before requesting GPT re-review.

## Repository

`A:\GitHub\env-wastewater-webapp`

PR: https://github.com/aase7en/env-wastewater-webapp/pull/29
Branch: `fix/p1-annotate-phi-boundary`
Reviewed branch tip: `703e371b8d8dbde38f698b0371d6ece9ecd7dbc7`
Implementation checkpoint: `1fbb33f8703ae1dd0373f039e090d8fa22b3a45a`

## Role

You are GLM 5.3 MAX acting only as the remediation implementation owner for `WO-STAB-009`.

Do not merge PR #29. GPT/reviewer remains the merge owner.

## Source of Truth — READ FIRST

1. `AGENTS.md`
2. `docs/ai/PROJECT-BRIEF.md`
3. `docs/ai/CURRENT-WORK.md`
4. `docs/ai/HANDOFF.md`
5. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
6. `docs/work-orders/WO-STAB-009-PROPOSAL.md`
7. This remediation file

Repository state + current SSoT override chat memory.

Expected PR #29 status: `CHANGES_REQUIRED`.

## Verified Reviewer Evidence

Reviewer independently verified at PR #29 tip `703e371`:

- GitHub checks `smoke`, `scripts`, and both `notify` checks: SUCCESS.
- Vitest with isolated non-secret dummy Supabase env: **183/183 PASS**.
- `npm run build`: PASS.
- `npm run lint`: **12 warnings / 0 errors** baseline.
- `git diff --check`: PASS.
- Effective authorization is correctly wired as runtime `ai_scope` approval AND static table profile.
- Unknown / ambiguous / unmapped table names fail closed; bare `reading` is ambiguous across `wastewater.reading` and `carbon.reading`.
- `ai_scope` read failure produces zero provider calls.
- `STATIC_PHI_DENY` is not reused as the positive allowlist.
- `projectSafeRow()` executes before prompt construction.
- Refusal paths do not embed raw row contents.

### Blocking finding — free-text fields are incorrectly classified as provider-safe

`frontend/src/lib/admin/annotate-boundary.ts` currently includes these fields in `TABLE_SAFE_FIELDS["wastewater.reading"]`:

- `color_desc`
- `smell_desc`
- `note`

Production UI proves all three can contain arbitrary user-entered text:

- `DailyFormPage.tsx` says color/smell may be typed manually (`พิมพ์เอง`) and binds each to a free `Input`.
- `note` is a free `Textarea`.

The current scrubber only targets email, phone, and Thai national-ID shapes. It cannot reliably remove patient names, HN/MRN-like identifiers, or other identifying free text. Therefore a value such as `ผู้ป่วย สมชาย ใจดี HN 12345` can survive projection/scrubbing and reach the external provider.

This violates the binding rule: **PHI never leaves the system**.

## Required Remediation

1. Remove `color_desc`, `smell_desc`, and `note` from the static provider-safe profile for `wastewater.reading`.
2. Do **not** fix this by adding a name-regex or broader best-effort scrubber and leaving arbitrary free text allowlisted. Content scrubbing remains defense-in-depth, never the authorization boundary.
3. Keep the existing runtime `ai_scope` ∩ static-profile intersection, fail-closed canonicalization, and scope-error zero-provider-call behavior unchanged.
4. Keep unknown columns omitted by default.
5. Add deterministic regression tests proving arbitrary non-regex identifying free text is absent from the projected row and from the actual captured provider request body. At minimum cover:
   - `note: "ผู้ป่วย สมชาย ใจดี HN 12345"`
   - arbitrary custom `color_desc`
   - arbitrary custom `smell_desc`
6. Preserve existing tests for email/phone/Thai-ID scrubbing as defense-in-depth on any remaining allowlisted string values.
7. Audit the remaining static profiles during this remediation only to confirm there are no other unrestricted free-text fields. Controlled enum/date/UUID-like fields may remain if their use is already bounded by the existing application contract; do not redesign unrelated forms or schemas.
8. No component/UI changes, no schema migration, no unrelated AI/chat changes.

## RED → GREEN Evidence

Before the code fix, add focused tests that demonstrate the blocking behavior by failing because the free-text values appear in `projectSafeRow()` / captured provider body.

Then implement the smallest safe correction and show those tests GREEN.

Do not weaken the tests to merely verify email/phone/Thai-ID redaction.

## Required Gates

Run and record exact results:

```bash
npm test
npm run build
npm run lint
git diff --check
```

Also run the full Playwright suite required by the active WO if the branch/environment supports it, and verify GitHub PR checks after push.

If an isolated worktree has no `.env`, use non-secret dummy `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` values for unit/build verification. Do not copy or print real secrets.

## Update Existing PR #29

Commit only the remediation scope to `fix/p1-annotate-phi-boundary` and push to the existing PR #29.

Update `docs/ai/CURRENT-WORK.md` and `docs/ai/HANDOFF.md` with:

- root cause
- exact fields removed/validated
- RED evidence
- GREEN/full-gate evidence
- GitHub CI result
- new exact implementation checkpoint
- PR #29 URL

Set PR #29 / WO-STAB-009 to `RE-REVIEW_REQUESTED` only when all required gates are green.

## STOP GATE

When PR #29 is updated, green, and repository SSoT says `RE-REVIEW_REQUESTED`, STOP.

Final report:

```text
WO-STAB-009
STATUS: RE-REVIEW_REQUESTED
ROOT CAUSE: unrestricted wastewater free-text fields were incorrectly included in the external-provider safe-field profile
BRANCH: fix/p1-annotate-phi-boundary
IMPLEMENTATION CHECKPOINT: <sha>
PR: https://github.com/aase7en/env-wastewater-webapp/pull/29
VITEST: <count/pass>
BUILD: PASS
LINT: <warnings/errors>
GITHUB CI: PASS
NEXT OWNER: GPT 5.6 Sol UltraMAX
```

Do not start another work order.
Do not merge PR #29.
