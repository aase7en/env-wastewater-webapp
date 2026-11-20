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
