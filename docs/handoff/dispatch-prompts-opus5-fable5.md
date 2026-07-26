# Dispatch Prompts — Opus 5 + Fable5 (PAYG $70 allocation)

> **วันที่**: 2026-07-25
> **สร้างโดย**: GLM Track Z (a-think analysis)
> **วัตถุปัตถ์**: allocate $70 credit หลัง Fable5 เปลี่ยน PAYG + Opus 5 เปิดตัว
>
> **ความสำคัญ**: scope เปลี่ยนจากวางแผนเดิม — MOD-*-b, F5, F6
> **ทำเสร็จแล้วทั้งหมด** (`c87fc81`/`130b53d`+visual/`a04df47`).
> backlog จริง = V1+V2 verify (ใหญ่) + 4-5 Track F polish เล็ก.

---

## 🥇 STEP 1 — Opus 5: V1+V2 security/CI verify (เริ่มก่อน, ~$10-15)

**ทำไม่ Opus 5**: security-sensitive (HMAC, auto-rollback gate, RLS,
supply-chain pin) — Opus เก่ง security review และราคาเท่าเดิม = คุ้มที่สุด.
**code review only** (อ่าน diff + run probes) → ไม่มี PHI risk.

### Copy-paste prompt ด้านล่างไปให้ Opus 5:

```
You are reviewing a batch of security/CI commits in the repo
A:\GitHub\env-wastewater-webapp (env-wastewater-webapp — wastewater
treatment data migration + webapp for โรงพยาบาลอุทัย, Supabase ENV_DB).

SCOPE: code review only. Read diffs + run read-only SQL probes.
DO NOT access patient data, DO NOT route any data through cloud models.
วันที่ = พ.ศ. (Buddhist Era = CE + 543) เสมอ.

CONTEXT (read first):
- AGENTS.md (repo rules — PHI boundary, .env/data/raw gitignored)
- docs/handoff/2026-07-19-track-z-complete.md (full history — skim
  §"CI Telegram Alert", §"CI-Hermes L2 protocol", §"a-debug multi-dimension
  audit", §"GLM OAUTH-4")
- docs/adr/0008-rls-self-reference-recursion.md (RLS recursion pattern —
  OAUTH-4 mirrors this)
- docs/adr/0010-ci-alert-hermes-protocol.md (HMAC + zero-data rationale)
- docs/adr/0012-rls-pending-deny.md (OAUTH-4 decision)

VERIFY these commits (security-sensitive only — skip the docs/handoff/
research commits in the list):

1. 8427fa1 — ci(test,e2e): add Telegram notify job
   - Check: fork-PR gate present + correct (only same-repo PRs alert)
   - Check: failure-only logic on push (silent on push+pass)

2. b420202 — ci(notify): structured JSON + HMAC payload for Hermes
   - Check: HMAC computation correct (canonical JSON sort_keys, hmac.new)
   - Check: zero-data contract — payload has metadata ONLY (no logs,
     no diffs, no file content, no stack traces)
   - Check: error_class is a SAFE enum, never raw error text
   - Check: defensive gate (no HERMES_HMAC_SECRET → human-only HTML,
     workflow stays green)

3. c827431 — ci(deploy): add smoke-test + opt-in auto-rollback
   - CRITICAL: rollback gate must be `needs.smoke-test.result == 'failure'`
     NOT `failure()` (workflow-wide form would revert on build-fail where
     nothing deployed — a-debug found this blocker)
   - Check: loop guard (skips if HEAD already a "Revert " commit)
   - Check: ENABLE_AUTO_ROLLBACK opt-in (disabled by default — one-way door)
   - Check: permissions scoped (contents: write only on rollback job)

4. 015538f — ci(a-debug): 4 bug fixes from multi-dimension audit
   - Verify the 4 fixes are correct:
     (a) rollback gate fix (needs.X.result not failure()) — see #3
     (b) appleboy/telegram-action pinned to SHA not @master (supply-chain)
     (c) fork-PR gate added to test.yml + e2e.yml notify
     (d) permissions: contents: read at top-level

5. 659fc96 — OAUTH-4: deny pending-role on transactional RLS [ADR-0012]
   - INDEPENDENT CONFIRM (most important — RLS belt):
   - Run: uv run python scripts/test_oauth4_rls_probe.py --mode helper
     → expect 3/3 roles PASS + 11/11 policy bodies PASS
   - Check: core.fn_is_staff_or_admin() is SECURITY DEFINER + STABLE +
     search_path set (mirrors fn_is_admin — must NOT recurse)
   - Check: all 11 transactional tables repolicied (water_supply.daily_check,
     garbage.collection_log, fuel.dispense_log, garden.work_round,
     building.inspection_round, safety.monthly_check, food.lab_test,
     chemical.movement, chemical.master, wastewater.threshold_alert,
     core.regulation)
   - Check: core.ai_query_log intentionally left open (INSERT-only
     telemetry, no PHI — scoped out, NOT a gap)

SKIP (docs/handoff/research — no security surface):
- 2d9b569, 2535d82 (notify first attempts — superseded by b420202/015538f)
- 6d636bf (merge), b30538f, 04865f0, bb540a9, f5bd60e (docs/handoff)
- bad50cb (research — confidence LOW, 5 must-resolve, not ready)
- 4a7117a, f6310d7 (docs/handoff/runbook)

OUTPUT:
- Per commit: PASS / DEFECT (with file:line) / NOTE
- For OAUTH-4: include the probe script output verbatim
- End with: "REVIEW COMPLETE — N commits verified, M defects found"
  (if defects: open issues or note for GLM Track Z to fix)

If you find a defect in OAUTH-4 RLS or the rollback gate, STOP and report
immediately — those are the two highest-risk items.

Do NOT commit anything. This is read-only review.
```

### หลัง Opus 5 เสร็จ — แจ้งผลกลับมา
GLM Track Z จะรับ defects (ถ้ามี) + fix ตาม a-debug chain.

### STEP 1 — RESULT (Opus review, 2026-07-25) ✅

**REVIEW COMPLETE — 5 commits verified, 4 defects found (all LOW, 0 ใน critical path).**
2 รายการเสี่ยงสูงสุด PASS ทั้งคู่: OAUTH-4 RLS + rollback gate (ยืนยันอิสระ ไม่เชื่อเอกสาร).

- **OAUTH-4 (659fc96)** — probe `--mode helper`: 3/3 roles + 11/11 policy bodies PASS.
  Independent catalog audit (`pg_get_functiondef` + `pg_policies` + `relrowsecurity`):
  `fn_is_staff_or_admin` = SECURITY DEFINER + STABLE + `search_path=core,public`;
  ตารางละ 1 policy ที่ gate ด้วย helper ทั้ง USING+WITH CHECK; leftover-permissive = 0;
  RLS เปิด 11/11. ไม่มี policy เก่าตกค้าง.
- **rollback gate (c827431 → 015538f)** — `needs.smoke-test.result == 'failure'` ยืนยันแล้ว
  (blocker `failure()` แก้แล้ว). loop-guard + opt-in + scoped `contents: write` ครบ.
- **HMAC/zero-data (b420202)** — canonical JSON (`sort_keys`) + `hmac.new` ถูก; payload =
  metadata เท่านั้น; `error_class` เป็น safe enum; defensive gate (no secret → HTML-only) OK.

**Defects → GLM Track Z (cheap-ok, ไม่มีอันไหนบล็อก):**

| # | fix | file | sev |
|---|---|---|---|
| D1 | repin telegram-action → `221e6b684967abe813051ee4a37dd61770a83ad3` (v1.0.1) **หรือ** แก้ comment — SHA ที่ pin (`78c9ef35…`) เป็น untagged commit (ahead 10 จาก v1.0.1); `# v1.1.0` ไม่มีอยู่จริง upstream | 3 workflows | LOW |
| D2 | probe: assert บน `pg_get_functiondef` text แทน mirror expression (`_probe_helper_logic` ทดสอบ Postgres `IN` ไม่ใช่ฟังก์ชันที่ deploy) | `test_oauth4_rls_probe.py:135` | LOW |
| D3 | `ai_query_log` INSERT policy → `WITH CHECK (actor = auth.uid())` (ปัจจุบัน `true` — pending เขียนได้ + `actor` ปลอมได้; read-side ถูกต้องแล้ว) | migration ใหม่ | LOW |
| D4 | escape/ตัด `github.event.head_commit.message` ก่อน Telegram `format: html` (`<`/`>`/`&` ใน commit msg → parse error → เสีย alert; ยังไม่มีใน 60 commit ล่าสุด) | 3 workflows | LOW |

**ต้องทดสอบก่อนเปิด Hermes:** Telegram HTML parse mode รับ trailing `<!--sig:{sig}-->` comment
ไหม? (uncertain ~55% — ถ้าไม่รับ จะพังทุก signed notify เมื่อ set `HERMES_HMAC_SECRET`).
ยิง `curl` ไป sendMessage 1 ครั้งยืนยันได้.

---

## 🥈 STEP 2 — Fable5: Track F polish บน component ใหม่ (~$8-12)

**ทำไม่ Fable5**: Track F owner (className/colors/fonts/animation),
เก่ง visual polish. PAYG = ไม่ติด week-limit.

**สำคัญ**: sync track-f worktree ก่อน! Track F worktree
(`A:\GitHub\envww-trackf`) อยู่ที่ `8427fa1` (ตามหลัง main). ต้อง
`git fetch origin && git merge origin/main` ใน worktree ก่อนเริ่ม.

### Copy-paste prompt ด้านล่างไปให้ Fable5:

```
You are doing Track F visual polish on new admin components in
A:\GitHub\envww-trackf (the track-f worktree for env-wastewater-webapp,
wastewater treatment webapp for โรงพยาบาลอุทัย).

PRE-FLIGHT (do this FIRST):
1. cd A:\GitHub\envww-trackf
2. git status (must be clean)
3. git fetch origin
4. git merge origin/main (sync — main is at 659fc96, track-f is behind)
   If conflicts: resolve keeping main's logic + track-f's className where
   they touch the same line. Ask user if unsure.
5. Confirm HEAD now includes the OAUTH-2/3 + P4 trio components.

SCOPE: Track F ONLY (className/colors/fonts/animation/transition).
ห้ามแตะ logic/hooks/SQL/lib (.ts logic files) — that's Track Z (GLM).
วันที่ = พ.ศ. เสมอ.
ห้าม git reset --hard (rule 6).

POLISH these 4 items (all from handoff §"GLM P4 trio close — Polish"):

1. AiQueryBox (frontend/src/components/admin/AiQueryBox.tsx)
   - Result panel: add subtle fade-in/slide-down on appearance
   - Warnings block: stronger amber emphasis (currently minimal)
   - Keep review-gate intact (NO execute button — that's Track Z boundary)

2. AiSuggestions (frontend/src/components/admin/AiSuggestions.tsx)
   - Chip hover: add cyan glow + subtle scale (currently minimal)
   - Keep the "รีเฟรช" button + empty-state logic intact

3. AuditLogPage (frontend/src/pages/admin/AuditLogPage.tsx)
   - Expand row: slide-down animation (currently plain)
   - JSON in expanded row: syntax emphasis (keys vs values color)

4. NAV "บันทึกตรวจสอบ" icon (frontend/src/components/layout/AppShell.tsx)
   - history_edu icon next to "รออนุมัติ" in ผู้ดูแล section
   - Verify section reads well visually (spacing/alignment)

REFERENCE (golden pattern):
- CarbonPage (frontend/src/pages/CarbonPage.tsx) = F4.5 conform + Aura polish
- Match its animation/transition density (don't over-do)

CONSTRAINTS:
- Material Symbols subset: if you add a new icon, regen via
  node scripts/gen-msymbol-subset.mjs (run from frontend/ — scans src/ for
  literal MSymbol/icon names, fetches Google Fonts, writes the woff2 subset;
  `--check` exits 1 on drift). Icon names must be scannable literals — never
  template strings or DB values. (NOTE: there is no `npm run gen:msymbol`.)
- npm run build ผ่าน
- npx playwright test — all pass (don't break existing tour)
- Brand tokens only (text-aura-*, aura-text-gradient) — no raw hex colors

OUTPUT:
- Commit on track-f branch: "polish(track-f): P4+OAUTH visual — AiQueryBox
  + AiSuggestions + AuditLogPage + NAV"
- After commit, report what you changed per item + screenshot-ready state

If logic in a component blocks your polish (e.g. need a className prop
that doesn't exist), STOP — that's Track Z, hand back to GLM with note.
```

### หลัง Fable5 เสร็จ
- review visual บน track-f branch
- merge track-f → main (user ตัดสินใจ timing)

---

## 💡 STEP 3 (optional, ถ้าเหลือ budget) — GLM Track Z ทำเอง (ไม่ใช้ credit)

งานที่ GLM ทำได้เลย ไม่ต้องรอ Fable5/Opus:

- **Unit test CI-alert JSON logic**: port inline Python ใน workflows →
  pure fn + pytest (lock canonical JSON + HMAC round-trip + error_class
  enum contract). ~$0 cost, regression safety.
- **A-Wiki entity fill**: sync wiki/entities/env/env-webapp-project.md
  ให้สะท้อนสถานะปัจจุบัน (P4 trio, OAUTH-1/2/3/4, AISQL, CI-Hermes).

ถ้าอยากให้ผมทำ STEP 3 บอกได้เลยหลัง dispatch Opus5 + Fable5 ออกไปแล้ว.

---

### GLM Track Z — D1-D4 fixes (2026-07-25, after Opus STEP 1 review)

Opus 5 STEP 1 verify complete (commit `410bc5d`): OAUTH-4 RLS + rollback
gate independently confirmed PASS. 4 LOW defects handed back → GLM fixed
all 4 in this chunk per a-debug chain (RED → fix → GREEN where testable).

| # | fix | how verified | status |
|---|---|---|---|
| D1 | telegram-action comment SHA: `# v1.1.0` → `# v1.0.1-era commit, pinned 2026-07-23` (SHA `78c9ef35…` is untagged commit ahead 10 of v1.0.1; v1.1.0 doesn't exist upstream) | grep all 3 workflows | ✅ comment corrected (NOT repinned — same SHA, accurate label) |
| D2 | probe `_probe_helper_logic` (mirrored `IN` expr via CTE — tested Postgres, not fn) → `_probe_helper_body` (asserts on `pg_get_functiondef` of deployed fn) | probe run: 3/3 contract clauses PASS | ✅ real regression guard now |
| D3 | `ai_query_log_authenticated_insert` WITH CHECK: `(true)` → `(actor = auth.uid())` | migration 2/2 OK + probe RED (`OPEN (true)`) → GREEN (`actor=uid`) | ✅ |
| D4 | escape commit msg in Telegram HTML: `${{ github.event.head_commit.message }}` → `${{ steps.payload.outputs.COMMIT_MSG_ESC }}` (html.escape + first-line + 160-char truncate); added `COMMIT_MSG` env + Python escape in payload step of all 3 workflows | YAML validate 3/3 + grep (head_commit only in env: now) | ✅ |

**a-debug chain (D3 — the only code-fix with a real RED)**:
1. RED: extended probe with `_probe_ai_query_log_insert` → reported
   `ai_query_log_authenticated_insert OPEN (true) FAIL`
2. FIX: migration `20260725000000_d3_ai_query_log_insert_gate.sql`
3. GREEN: same probe → `actor=uid PASS`

D1/D2/D4 are comment/probe/CI-config — no DB state, no unit test possible
(CI logic runs only in runner). Verified by YAML parse + grep + live probe
re-run (all 3 sub-probes GREEN: helper body 3 + 11 policy bodies +
ai_query_log INSERT).

**Files this chunk**:
- `supabase/migrations/20260725000000_d3_ai_query_log_insert_gate.sql` (new, D3)
- `scripts/test_oauth4_rls_probe.py` (D2 rewrite + D3 assertion added)
- `.github/workflows/deploy-frontend.yml` (D4 + D1)
- `.github/workflows/test.yml` (D4 + D1)
- `.github/workflows/e2e.yml` (D4 + D1)
- `docs/handoff/dispatch-prompts-opus5-fable5.md` (this close note)

**Still open (handoff for user)**:
- Telegram HTML parse-mode test with trailing `<!--sig:…-->` comment — needs
  `curl` sendMessage probe before enabling HERMES_HMAC_SECRET (Opus flagged
  ~55% uncertainty). Not code — runtime verification only.

*GLM5.2 D1-D4, 2026-07-25 — 4 defects closed · a-debug chain on D3 · probe 3+11+1 PASS · CI YAML 3/3 valid.*
