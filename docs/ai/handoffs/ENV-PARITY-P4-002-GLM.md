# GLM Handoff — ENV-PARITY-P4-002 (Claim ENV-PARITY-P4-002-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p4-002` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p4-002` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row + owner B5 ARE the scope

AppSheet parity **Phase 4 — ระบบอัตโนมัติ + BI — lane P4.2** (Phase 4 lane 2; P4.1 delivered v1.14.0 via PR #241, closeout PR #242 = this claim's base `710a7e018e8102687b6b3b82ba6da2d56315d5dd`). Plan §6 row P4.2 line 260 VERBATIM (`dispatcher threshold_alert → Telegram/LINE/Email + นายหน้ารับ secret (env/secret store, ห้าม commit)`) + owner answer B5 of 2026-11-15 (plan §5.3 line 196 + item 2 line 182 VERBATIM: **Telegram** — ใช้แนวทาง bot ของ AppSheet เดิม (bot: telegram); P4.2 อนุมัติ — dispatcher → Telegram; secret ผ่าน store ห้าม commit). WO `docs/work-orders/ENV-PARITY-P4-002.md` holds the full binding pins (§0 the seven claim-time decisions D1-1…D1-7 + D1-8, §1 authorization, §2 the data+message contract, §3 no-migration, §4 release, §5 D-phases, §6 D1 items, §7 scope). Read it before writing anything. Summary:

- **Deliver THIS lane:** upgrade the **EXISTING `notify-threshold` Edge Function** (`supabase/functions/notify-threshold/index.ts`, the P17 design: poll `v_pending_threshold_alerts` ASC limit 50 → POST per alert → mark `notified_at` on success only) into the **Telegram dispatcher** (`sendMessage` + `chat_id` from env), Thai/พ.ศ. per-alert messages from the queue view's own columns, schedule per the documented options adjudicated at D1, deploy per `supabase/functions/README.md` (`supabase functions deploy notify-threshold --project-ref gllqtbyofrcjzmbnfoeh`).
- **Credentials reality (D1-4):** the owner's Drive secrets env enumerates exactly 7 variable NAMES — `SUPABASE_DB_URL`, `AUTH_MODE`, `APP_ENV`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ENV_BACKUP_PASSPHRASE` — **NO Telegram/bot variable exists**. The lane ships the mechanism + mocked/off-credential tests; **the OWNER plugs the bot token + chat id later** via `supabase secrets set`. **NO live send test in-lane** (zero spam by construction); the honest deploy receipt = `functions list` + the no-credentials `{"skipped":true}` probe recorded verbatim.
- **NOT this lane:** P4.3 BI; P4.4 scheduled/monthly reports (รายงานรายเดือนอัตโนมัติ — เฉพาะเมื่อ P4.1/P4.2 อนุมัติ, its own lane); the three other PDF report families; the AppSheet note-broadcast channels (`Signal_notice` + the unconditional `Telegram_noti` — ENV fires VIOLATION alerts only, the D1-1 anti-spam divergence); the disabled bots (stay disabled); Phase 5; ANY migration/DB object (`supabase/migrations/` diff MUST be EMPTY — the P17 alert objects are consumed READ-ONLY); `ingest-sensor` byte-untouched; any frontend edit beyond the D1-5 release files; any Drive write; any token/secret literal in ANY committed file (= P1).

## 1. THE SCOPE-LURE GUARD (memorize)

Phase 4 is the plan's declared scope-lure phase (plan §8 line 293; ความเสี่ยง สูง/ไม่แน่นอน). B5 authorizes **the alert channel** — nothing else. The lure traps: (a) "also wire the monthly report Telegram push" — that is P4.4, its own lane; (b) "also mirror Signal_notice/หมายเหตุ broadcasts" — OUT per D1-1 (noise channel, not a parity target); (c) "also do P4.3 BI while you're in the functions dir" — OUT; (d) "store the token in Vault/a migration/.env.example for convenience" — ห้าม commit (B5 verbatim); the ONLY store is `supabase secrets`/EF env, owner-set. Each excluded item needs its own NEW reviewed claim transition.

## 2. D1 FIRST — verify + pin BEFORE D2

1. **Live EF state, honestly:** `supabase functions list` (project ref `gllqtbyofrcjzmbnfoeh`) — was notify-threshold ever deployed? Never assume; record what IS found.
2. **Scheduler/extension availability, read-only:** does pg_cron/pg_net exist on ENV_DB? (read-only extension/catalog probe via the approved apply-API/SQL path; write nothing). Pin the schedule mechanism from the README options with this evidence; a DB-side schedule (pg_cron SQL + pg_net) = STOP + adjudicated deviation, never silent.
3. **Pin the env-var NAMES** (the README contract: `WEBHOOK_THRESHOLD_NOTIFY_URL` / `WEBHOOK_THRESHOLD_NOTIFY_TOKEN` / `TELEGRAM_CHAT_ID` — keep, rename, or extend; the D1-pinned names go in the handoff + the owner-facing plug-in note).
4. **Pin the test runner + exact file names** (D1-6: ONE of Deno co-located test vs `scripts/test_parity_p4_002_notify.py` Python contract suite — capability evidence recorded; the other path stays untouched) + the exact RED classes.
5. **Pin the D1-5 release ruling** (v1.15.0 MINOR vs dormant-channel no-bump — ONE, with rationale).

## 3. Honesty pins (reviewer-pinned)

unknown ≠ zero; `(ไม่ระบุ)` reporter never fabricated (the queue view's own fallback only — never a new personnel lookup); failed sends stay queued (`notified_at` marked on SUCCESS only; failures logged + left pending; honest non-OK on errors); unconfigured = honest skip (`{"skipped":true,…}`); no SIMULATED vocabulary (real threshold violations, the P1.3 chain is live); พ.ศ. years (+543) + Thai labels in the message; **no patient PHI** (none exists in this chain); ref 12 §9 does NOT record the AppSheet webhook URL/body templates — no byte-exact message reconstruction is attempted (the honesty pin); ห้ามพิมพ์/commit token ทุกกรณี.

## 4. D-phases (per WO §5)

D1 pins above → D2 RED (counts verbatim; legacy passes disclosed) → D3 implement (EF Telegram upgrade + deploy per README with the process-env `SUPABASE_ACCESS_TOKEN` never printed; `ingest-sensor` byte-untouched; scope-exact vs WO §7) → D4 battery (the EF suite; FULL vitest/tsc/oxlint/Playwright as the no-regression gate; guard 344/344; runtime 62/62; checker per D1-5; `git diff --check` clean; 13-digit grep 0; `supabase/migrations/` EMPTY; deploy receipt verbatim) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED**. Release per D1-5 in the implementation PR (CHANGELOG Thai พ.ศ. entry + package.json, or the recorded no-bump ruling); annotated tag at the deployed merge SHA post-deploy per ENV-APP-VERSION-001 D6.

## 5. D-phase log (implementation lane fills this in)

- (to be recorded by the implementing lane, one bullet per phase, with exact SHAs and verbatim counts)
