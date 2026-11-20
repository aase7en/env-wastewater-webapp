# GLM Handoff — ENV-PARITY-P4-005 (Claim ENV-PARITY-P4-005-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p4-005` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p4-005` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — B4's five-family answer, minus what P4.1 delivered

AppSheet parity **Phase 4 — ระบบอัตโนมัติ + BI — the FINAL lane: the 3 remaining PDF report families รายงานตรวจสอบถังดับเพลิง / รายงานตรวจสอบไฟฉุกเฉิน / รายงานน้ำประปา** (owner B4 plan §5.3 line 195 VERBATIM: ทส.1/ทส.2/ถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา — **ทำ**; ทส.1/ทส.2 delivered P4.1 v1.14.0; the P4.4 closeout frontier PR #248 named the remaining three the final ungated pre-Phase-5 work). ONE lane, the SAME P4.1 print-view + browser print-to-PDF mechanism ×3, release **v1.15.0 MINOR**. WO `docs/work-orders/ENV-PARITY-P4-005.md` holds the full binding pins (§0 the claim-time enumeration + D1 decisions, §1 authorization, §2 the per-family data+layout contract, §3 no-migration, §4 v1.15.0, §5 D-phases, §6 D1 items, §7 scope). Read it before writing anything. Summary:

- **Deliver:** three print-ready monthly report views on the ReportsPage print-view pattern — (1) ตรวจสอบถังดับเพลิง (9-column per-tank table + computed ☑/☐ summary + the SOURCE_UNAVAILABLE master note — `safety.fire_extinguisher` stays UNSEEDED), (2) ไฟฉุกเฉิน (6-column check table + computed ☑/☐ pair; the delivered 332-row `safety.emergency_light_check` history rendered as-is), (3) น้ำประปา (5-column daily-read table + the two monthly totals + the P1.5 chain/estimate provenance flags). `window.print()`, Thai/พ.ศ., unknown ≠ 0.
- **NOT this lane:** ทส.1/ทส.2 rework; the bots' Telegram steps (P4.2's channel; the P4.4 dormant EF untouched); P4.3 BI; Phase 5 (OWNER-GATED); ANY migration/DB object (`supabase/` diff MUST be EMPTY); master re-seeding; any Drive write; template/PDF binaries (never enter repo/DB/chat — sha256+byte-size metadata only).

## 1. The scope-lure guards (memorize)

1. **Phase 5 คัทโอเวอร์ is OWNER-GATED** (dual-run ≥14 วัน + the 5-condition DoD + the AppSheet-retirement checklist — the owner's action). Completing this lane completes Phase 4 — it does NOT unlock Phase 5.
2. **No report-ready notices:** the AppSheet family bots pair each PDF with `Send Telegram` — that channel is P4.2's, and the P4.4 `notify-monthly-report` EF stays byte-untouched. This lane produces the report DOCUMENT only.
3. **The extinguisher master is UNSEEDED on purpose** (P2.1 SOURCE_UNAVAILABLE — the master sheet was absent from the public folder). Do NOT re-seed, reconstruct, or zero-substitute master facts; render the honest master note + the available inspection history. The sheet-share remains owner-pending.
4. **The 332-row light history is DELIVERED data** (P2.3, including the 1 NULL `light_id` row never normalized) — render as-is; never re-derive or normalize.

## 2. D1 FIRST — re-verify the Drive enumeration (READ-ONLY) before D2

The claim transition ALREADY enumerated the Content folder (WO §0 D1-3 table — the provenance metadata). Your D1: re-run the cheap public GETs and byte-match: Content folder `1p0nSwVa9wQD03rety6ltjkQW1FnX143l` (via parent `1HBhuEaBeQLz8jlj0VxPXvbM03It1bNre`), `รายงานตรวจสอบถังดับเพลิง` gdoc `1lKL8xgo_JnFcznMxncJ_kBKHgHpYYLgfOkhKy3WLPqg` txt-export sha256 `c9f5f439e2b8594b28c56509ee7fec710f5352ff4fee2fc714e32bde5b8fc3a6` (5,143 B), `รายงานตรวจสอบไฟฉุกเฉิน` gdoc `1MDUy6PHBXPISfnKGXyGnRZPJpT1ef4RHbeODQ9f_Pi4` txt sha256 `fad4cef1282fb898dc28763d3f6ce5b3867e71aadfc58e91f4f046c89f1d28df` (4,300 B), and confirm the น้ำประปา template file is STILL ABSENT (sample `รายงานน้ำประปา-1.pdf` `1AhI3lkDEYiDHoVPkVjD95RpmG-qrW5FP` sha256 `8d0e81c5d97e2f8a9f13381c19e6509489adc6cf26c42f15c81b52bda0c050bd` 116,723 B, 15 pages = the layout authority + ref-12 §3.10/§3.8 censuses). Any mismatch = drive-file-wins + recorded divergence (never silent). ห้ามเขียน Drive ทุกกรณี; binaries to /tmp only, deleted after verification. Then pin the exact new-file names + the ONE lib path (`pdf.ts` additive vs sibling lib inside `components/reports/**` — ONE, never both) + the per-family fetch shapes.

## 3. Honesty rules in the PRINTED output (D1-5 — reviewer pins)

unknown ≠ zero (ค่าว่าง/ไม่มีข้อมูล, never 0); the extinguisher SOURCE_UNAVAILABLE master note; the water chain/estimate provenance carried into the print (meter-chain deltas, ×3.7-class per A2, ÷10 chlorine per A3); the ☑/☐ summary pairs COMPUTED from recorded rows (never static); พ.ศ. years + Thai months (+543) — the templates' hardcoded พ.ศ. 2569 renders as the COMPUTED year of the selected month (divergence recorded); **NO address header in any of the three** (honest template fact — `core.address` NOT consumed; B7 stays the ทส.2-only feature); personnel columns render ONLY via the delivered `core.personnel` display path (full_name by stored ref, `— ไม่ระบุ —` fallback) — the templates' hardcoded personnel names NEVER render; signature blocks = blank rule lines + date slots; no Telegram step.

## 4. D-phases (per WO §5)

D1 re-verification above → D2 RED (counts verbatim; legacy passes disclosed) → D3 implement (scope-exact vs WO §7; Tos1/Tos2PrintView + the P4.1 print region + P1.6/P2.5 sections + the delivered family pages byte-untouched) → D4 battery (vitest FULL; tsc -b; oxlint; Playwright FULL workers=1 incl. the new e2e; guard 344/344; runtime 62/62; checker `--tag v1.15.0` OK; `git diff --check` clean; 13-digit grep 0; `supabase/` EMPTY) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED**. Release v1.15.0 MINOR in the implementation PR (CHANGELOG Thai พ.ศ. entry + package.json 1.14.0→1.15.0); annotated tag at the deployed merge SHA post-deploy per ENV-APP-VERSION-001 D6.

## 5. D-phase log (implementation lane fills this in)

### D1 — Drive re-verification (2026-11-20, READ-ONLY; no Drive write; binaries never left /tmp)

- `รายงานตรวจสอบถังดับเพลิง` gdoc `1lKL8xgo_JnFcznMxncJ_kBKHgHpYYLgfOkhKy3WLPqg` — public txt export re-downloaded: **sha256 `c9f5f439e2b8594b28c56509ee7fec710f5352ff4fee2fc714e32bde5b8fc3a6`, 5,143 B — BYTE-MATCH** the WO §0 record. Layout read from the export (9 columns + computed ☑/☐ pair + signature rules).
- `รายงานตรวจสอบไฟฉุกเฉิน` gdoc `1MDUy6PHBXPISfnKGXyGnRZPJpT1ef4RHbeODQ9f_Pi4` — txt export: **sha256 `fad4cef1282fb898dc28763d3f6ce5b3867e71aadfc58e91f4f046c89f1d28df`, 4,300 B — BYTE-MATCH**. Layout read (6 columns + computed pair).
- น้ำประปา template file: **STILL ABSENT** — Content folder `1p0nSwVa9wQD03rety6ltjkQW1FnX143l` re-listed live: the same 10 file entries (no น้ำประปา entry; `รายงานน้ำประปา` string-count 0); output folder `PDFน้ำประปา` `1ueYJSiwiOwoZqlfWC6ItIM5iQfdPrseu` holds exactly the one sample `รายงานน้ำประปา-1.pdf` (id `1AhI3lkDEYiDHoVPkVjD95RpmG-qrW5FP`, byte-size 116,723 visible in Drive metadata). The sample PDF + censuses remain the layout authority — the divergence is RECORDED in the shipped view (WATER_LAYOUT_NOTE), never silent. drive-file-wins intact.
- **D1 pins:** ONE lib path = NEW sibling `frontend/src/components/reports/family-report-models.ts` (+ its 3 co-located test files); `lib/pdf.ts` BYTE-UNTOUCHED (the 3 families are print-view-only — D1-2: no new jspdf generators). Views: `ExtinguisherPrintView.tsx` / `LightPrintView.tsx` / `WaterPrintView.tsx` (reuse `report-print.css` classes — CSS file untouched). Fetch shapes: existing `fetchExtinguisherInspectionRange` / `fetchExtinguisherMasterIds` / `fetchEmergencyLightCheckRange` / `fetchInspectors` reused byte-untouched; ONE new additive `fetchWaterSupplyPrintRange` (v_daily_check_chain + the recorded daily-log columns the sample prints: hour_meter / chlorine_usage / recorded_by — genuinely required, WO §7 "additive report-reads only if genuinely required"). Personnel display path: buildPersonnelNameMap over core.personnel (— ไม่ระบุ — fallback).

### D2 — RED (2026-11-20, commit ea4a07f, counts verbatim)

- vitest FULL: **3 failed-to-collect suites** (`Cannot find module './family-report-models'` ×3 — extinguisher/light/water) / **0 new tests**; **legacy 967 passed + 1 designed skip** (50 files) — disclosed green. Note: the fresh worktree initially showed 8 extra fail-to-collect files (address/manuals/masters/overview/parity-fixtures-p2/p3/admin-ai-sql + 2 behavioral water-supply-parity) — ROOT CAUSE = the gitignored `frontend/.env` missing in the fresh worktree (Missing VITE_SUPABASE_URL); after copying the local `.env` (never committed/printed), those went green — environment issue, NOT base regressions.
- e2e new spec (`env-parity-p4-005-family-reports.spec.ts`): **6 failed / 0 passed** (behavioral — family controls absent at RED).
- tsc at RED: exactly **3× TS2307** on the absent module (expected for the fail-to-collect house class; disclosed).
- RED commit: `ea4a07f` (4 files: 3 model test files + 1 e2e spec; 732 insertions).

### D3 — implement (2026-11-20, commit f3ea985)

- The ONE sibling lib + 3 views + ReportsPage additive mounts + `fetchWaterSupplyPrintRange` + release v1.15.0 (package.json 1.14.0→1.15.0 + CHANGELOG Thai พ.ศ. entry). Scope-exact vs WO §7 — changed files vs base: CHANGELOG.md, frontend/package.json, components/reports/** (lib + 3 views + 3 tests), lib/supabase-queries.ts, pages/ReportsPage.tsx, tests/e2e/env-parity-p4-005-family-reports.spec.ts. Byte-untouched pins held: pdf.ts / Tos1/Tos2PrintView / report-print.css / water-supply.ts / safety-summary.ts / report-summary.ts / the delivered family pages / CURRENT-WORK.md / supabase/.
- Honesty pins shipped: the extinguisher SOURCE_UNAVAILABLE master note (`ยังไม่มีข้อมูลทะเบียนถังดับเพลิง (master)`) + history-only rows; unknown ≠ 0 everywhere ("—", ค่าว่าง notes); the ☑/☐ pairs COMPUTED from recorded rows (never static; no-row months never assert ☑); the P1.5 water provenance in print (÷10 chlorine per A3, ค่าประมาณจากสเปก/ประมาณจากชั่วโมงปั๊ม per A2, meter-chain boundary disclosure, missing days counted); พ.ศ. computed year (the templates' hardcoded 2569 divergence recorded); NO address header (none of the 3 templates carries one — core.address NOT consumed); personnel ONLY via the core.personnel display path (— ไม่ระบุ — fallback); the hardcoded template names never render; signature blank rules + date slots; no Telegram step; WATER_LAYOUT_NOTE carries the sample-PDF authority honestly.

### D4 — battery (2026-11-20)

- **Head note:** the D3 commit f3ea985 missed one 2-line water-test fixture edit (spec_missing_kinds — required by the WaterChainInput/ReportWaterChainRow contract); the working tree carried the fix during the first battery pass, and it was committed as `79bef5e` with the fix's provenance stated in the commit message. **The FULL battery below was RE-RUN at 79bef5e** (the code-freeze head before the docs-only receipt commits) — no ambiguity between tree and commit.
- vitest FULL at 79bef5e: **990 passed | 1 skipped** (53 files) — legacy + new all green.
- `tsc -b`: clean. oxlint: **exit 0** (19 pre-existing warnings repo-wide, 0 in the new/changed files).
- Playwright FULL chromium workers=1 at 79bef5e: **335 passed** (7.4 min) — includes the 6 new family tests AND the untouched P4.1/P1.6/P2.5 suites (no-regression gate).
- guard at 79bef5e: **344 passed + 450 subtests**; validate-registry `{ok:true, BOOTSTRAP_CONTROL}`; claim ENV-PARITY-P4-005-C1 CLAIMED.
- runtime at 79bef5e: **62 passed + 32 subtests**.
- release checker at 79bef5e: `--tag v1.15.0` **exit 0** (`OK (v1.15.0; CHANGELOG entry v1.15.0)`); `--tag v1.14.0` exit 1 (correct reject).
- `git diff --check` 0323fe3..79bef5e: clean. `supabase/` diff: **EMPTY** (D1-6 held).
- 13-digit PII digit-run grep of all changed files: **0 hits in added lines** (3 pre-existing migration-timestamp literals at base, not IDs).
- Diff vs base ⊆ WO §7 mutable scope (the 12 code files above; the docs receipt commits add exactly the 2 doc files + the fixture-fix commit).

### D5 — fresh-GLM independent review — APPROVED (receipt issuecomment-7029784131, 2026-11-20)

**VERDICT: APPROVED** — 0×P1, 0×P2, **3×P3-informational carried** (never silently fixed): (1) `WATER_COLUMNS` ships `"วัน/เดือน/ปี"` + `"Hour_meter"` while the sample-PDF authority's recorded extraction reads `"วัน/เดือน/ปี อ่านได้"` / `"(Hour_meter)"` — micro-fidelity divergence, the sample's Thai glyphs are not machine-re-extractable (subsetted font, no `/ToUnicode`); a 2-string change if the owner wants exactness. (2) Reviewer battery note: the first FULL Playwright run hit the known garbage-mobile load-flake (334/1); 3×9/9 isolated reruns → flake, no action. (3) RED-e2e reproduction note for future reviewers: `playwright.config.ts` skips its webServer when `E2E_BASE_URL` is set — run WITHOUT it (free :5173) for the true behavioral RED.

D5's OWN verification at the exact head `aecea6f`: template authorities BYTE-MATCHED (extinguisher gdoc `c9f5f439…`/5,143 B; light gdoc `fad4cef1…`/4,300 B; sample `รายงานน้ำประปา-1.pdf` `8d0e81c5…`/116,723 B/15 pages; Content folder live-re-listed = 10 entries, the น้ำประปา template absence re-confirmed); column censuses `EXT_COLUMNS`(9)/`LIGHT_COLUMNS`(6)/`WATER_COLUMNS`(5) verbatim; the ☑/☐ pairs COMPUTED (unit-pinned both flips + null on empty months); the extinguisher master note pinned exact-string in unit + e2e; NO address header (grep 0); hardcoded personnel names never render (grep 0); RED truthfulness reproduced at isolated `ea4a07f` (3 failed-to-collect suites + exactly 3×TS2307 + family e2e 6 failed / 0 passed); own battery: vitest FULL 990 passed / 1 skipped (53 files), `tsc -b` clean, oxlint exit 0, Playwright FULL workers=1 334 passed + flake, guard 344 + 450 subtests, runtime 62 + 32 subtests, checker `--tag v1.15.0` exit 0, `git diff --check` clean, 13-digit digit-run grep of ALL added lines = 0.

### STOP

**REVIEW_REQUESTED → CLOSED (see §6).** The implementing lane never merged; PR #250 was merged by the authorized merge-executor after D5 APPROVED — the closeout receipt is §6 below.

## 6. D6 CLOSEOUT RECEIPT (closeout lane, 2026-11-20)

### Full delivery chain (claim transition → implementation → closeout)

1. **Claim transition PR #249** merged `0323fe397ff0e1f40fe5b9a3a59bdcde82e7220f` (docs-only, base `14b5296f5a3cbc607d62a21601c9d37796a2d6fd` = the P4.4 closeout merge) — authorized this lane.
2. **Implementation PR #250** merged `826ac8f8d836f4ce3a35dbbbbc22153cb710954f` — merge commit, no squash; second parent EXACTLY the D5-APPROVED head `aecea6f57d77d46c366c5d047bab834c5e718c27` (verified post-merge: `git log -1 --format='%H %P' origin/main` → parents `0323fe39…` + `aecea6f5…`); expected-head discipline `--match-head-commit aecea6f…`; PR OPEN → MERGEABLE/CLEAN → MERGED; checks green pre-merge (notify ×2 + scripts + smoke 9m28s); merge-executor review trail **issuecomment-7029833078** pinning the D5 receipt + expected head + merge policy + tag plan; implementation branch kept on remote; merge stat = exactly 14 files 1785+/2− (`supabase/` EMPTY, CURRENT-WORK.md untouched at merge); local main ff-only `0323fe3`→`826ac8f` clean.
3. **D5 fresh-GLM APPROVED issuecomment-7029784131** at the exact frozen head `aecea6f` — full receipt in §5 above.
4. **Release v1.15.0 MINOR DELIVERED:** Pages run **44670468981 SUCCESS** @ `826ac8f`; live markers verified fresh: `index-Eevdb2Y0.js` (last-modified 2026-11-20 03:51:49 GMT) carries the version constant `1.15.0` ×2 (the constant + the CHANGELOG heading `## v1.15.0 — 20 พฤศจิกายน พ.ศ. 2569`) + `app-version-chip` + `app-version-summary` + `ข้อมูลเวอร์ชันแอป`; the lazy chunk `ReportsPage-ZsMq8QwQ.js` (HTTP 200, same freshness) carries all three family print-view titles `แบบฟอร์มรายงานผลการตรวจสอบถังดับเพลิงโรงพยาบาลอุทัย` / `แบบฟอร์มรายงานผลการตรวจโคมไฟฉุกเฉินโรงพยาบาลอุทัย` / `แบบรายงานการใช้น้ำประปาบาดาลโรงพยาบาลอุทัย` + the SOURCE_UNAVAILABLE master note `ยังไม่มีข้อมูลทะเบียนถังดับเพลิง (master)`; annotated tag **v1.15.0** dereferences the deployed merge SHA `826ac8f`; `check_release_version.py --tag v1.15.0` → `OK (v1.15.0; CHANGELOG entry v1.15.0)`, exit 0.
5. **Closeout transition = THIS PR** (docs-only, 3 files: CURRENT-WORK.md fence ×2 + status CLOSED + `one_next_safe_action` rewrite + the CLOSED frontier bullet; WO status → DELIVERED—CLOSED; this §6). Fence: expected_policy_revision = `826ac8f8d836f4ce3a35dbbbbc22153cb710954f`, expected_registry_hash = `dce38c59ed6d5aa2fa8d55bc6ecd37ce59a459badab170e8c9cb726fd0e61d5b` (guard validate-registry registry_hash AT `826ac8f` — the empirically cross-checked PR #166/#169 method). Programmatic claim-by-claim JSON diff vs `826ac8f`: exactly 1 of 48 claims changed (ENV-PARITY-P4-005-C1 → CLOSED), the other 47 byte-identical.

### PHASE 4 COMPLETION RECORD — ALL OWNER GATES + PLAN ROWS DELIVERED ✅

| Gate / row | Surface | Delivered via | Release |
|---|---|---|---|
| **B4 — รายงาน PDF ×5** | ทส.1/ทส.2 print views + families ถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา ×3 | P4.1 (PR #241) + THIS lane (PR #250) | v1.14.0 + **v1.15.0** |
| **B5 — Telegram** | notify-threshold EF dormant-live + OWNER ACTIVATION runbook; notify-monthly-report via pg_cron | P4.2 (PR #244) + P4.4 (PR #247) | no-bump (dormant) |
| **B6 — คลอรีน save paths** | both chlorine save paths wired per owner "เปิด ถ้าทำได้จริง" | P3.2 (PR #226) | v1.10.0 |
| **B7 — หัวรายงานจาก address** | core.address headers (ทส.2; none of the 3 family templates carries one — honest template fact) | P3.5 (PR #235) | v1.13.0 |
| **P4.3 — BI** | chlorine BI = pre-existing live content (delivered via P3.2) | — | — |
| **P4.4 — งานตามเวลา** | pg_cron + pg_net + monthly_report_cycle + notify-monthly-report dormant-live (`cron.job` jobid=1 @ 00:05 ICT on the 2nd) | P4.4 (PR #247) | no-bump (dormant) |

**PHASE 4 IS COMPLETE.**

### The honest remaining — the PHASE 5 OWNER-GATED cutover checklist (the owner's action, NOT agent-actionable)

1. **Telegram credentials** — plug `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` via `supabase secrets` (+ the vault `service_role` secret) per the P4.2 §OWNER ACTIVATION runbook; then verify ONE monthly cron send manually (the failed-month retry note = one owner-runbook line).
2. **Owner sheet-shares** for the SOURCE_UNAVAILABLE masters — `safety.fire_extinguisher`, `core.manual_water_supply`, Items/Vendors/Categories, the coliform history (guarded P2.1/P2.3 re-seed recipe; schema + `legacy_id` + `source_provenance` already shipped; never fabricated).
3. **START THE DUAL-RUN (the Phase 5 signal)** — AppSheet + ENV บันทึกคู่ขนาน ≥ 14 วัน per plan §6 P5.1 line 271 + the 5-condition DoD line 276; then the AppSheet retirement checklist with read-access kept ≥ 90 วัน as rollback.
4. Owner-manual standing items — hooks #155 approved-not-started; #156 OPENROUTER_API_KEY renewal.

**FRONTIER: NO active claim.** The parity program's remaining work is Phase 5 คัทโอเวอร์ which is OWNER-ACTION-GATED (the dual-run start signal above); no agent lane is authorized until the owner acts.

### NON-OWNER REPAIR-LANE CANDIDATES (optional — each its own NEW reviewed claim transition, no silent fix)

- **(a) the P4.2 wastewater-view repair candidate** — `wastewater.v_pending_threshold_alerts` exists in schema `wastewater` while `notify-threshold/index.ts:142` reads it via the default-schema supabase-js client (the P4.4 D5-confirmed REAL finding, carried from the P4.4 closeout).
- **(b) README staleness** — the Pages list lacks the parity-delivered routes (`/masters`, `/manuals`, `/address`, `/job-log`, …) and the migration example path says `db/migrations/` while the house path is `supabase/migrations/`.
- **(c) the ledger P3s carried across lanes** — the WATER_COLUMNS 2-string fidelity option (D5 P3-1 above), the failed-month retry gap + the anon-JWT post-activation surface + the redundant cron-schema grant (P4.4), the fetchMeterChainBefore same-day edge (P1.4), the checker vSemVer false-positive mode + the mobile-360 dock-overlap pin (v1.0.0), the P2.5 e2e header-comment staleness, the vacuous anon fail-closed probe re-raise note + docs-precision nits (P3.6) — see each lane's D6 in its handoff.

### Ledger (this lane's carried P3s — recorded, never silently fixed)

The 3 D5 P3-informational items (§5 above) are carried to the frontier/repair-lane ledger. Standing: ENV-BUILDING-REPAIR-001-C1 WAITING_EXTERNAL; Phase-1 dual-run PENDING OWNER ACTION. Scope lock released at generation 1; CLOSED confers no fresh mutation authority; all other work still requires a NEW claim transition.
