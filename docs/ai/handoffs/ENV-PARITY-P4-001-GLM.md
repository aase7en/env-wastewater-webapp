# GLM Handoff — ENV-PARITY-P4-001 (Claim ENV-PARITY-P4-001-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p4-001` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p4-001` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row + owner B4 ARE the scope

AppSheet parity **Phase 4 — ระบบอัตโนมัติ + BI — lane P4.1, the FIRST Phase-4 lane** (Phase 3 COMPLETE 6/6 as of PR #239). Plan §6 row P4.1 line 259 VERBATIM + owner answer B4 of 2026-11-15 (plan §5.3 line 195 VERBATIM: ทำ — เทมเพลตมีอยู่แล้วในโฟลเดอร์ Drive content ของ AppSheet) + B7 (line 198: หัวรายงานจากตาราง — delivered P3.5). WO `docs/work-orders/ENV-PARITY-P4-001.md` holds the full binding pins (§0 the four claim-time decisions, §1 authorization incl. THE 001C DISTINCTION, §2 the data+layout contract, §3 no-migration, §4 v1.14.0 MINOR, §5 D-phases, §6 D1 items, §7 scope). Read it before writing anything. Summary:

- **Deliver THIS lane:** dedicated print-ready **ทส.1/ทส.2 monthly report views** mirroring the Drive content-folder template layouts + **browser print-to-PDF**, Thai/พ.ศ., report headers from `core.address` (B7), honest unknown/estimate/SIMULATED provenance carried into the printed output — upgrading the existing jspdf/html2canvas export (`frontend/src/lib/pdf.ts` generateTs1 :49 / generateTs2 :87 + `ReportsPage.tsx` onDownload :156-171). Release **v1.14.0 MINOR**.
- **NOT this lane:** รายงานถังดับเพลิง / รายงานไฟฉุกเฉิน / รายงานน้ำประปา (successor lanes); the disabled PDF1.1 bot (stays disabled); P4.2 Telegram (B5); P4.3 BI; Phase 5; ANY migration/DB object (`supabase/` diff MUST be EMPTY); any Drive write (READ-ONLY enumeration only); template binaries (never enter repo/DB/chat — layouts mirrored as code, sha256+byte-size metadata only).

## 1. THE 001C DISTINCTION (memorize — the scope-lure guard)

The 2026-11-12 "not-planned" decision (epic #110) covered the **/flow story VIDEO export ONLY** — it never covered operational PDF reports (plan lines 22/38/181/195; §8 line 293 names Phase 4 as the scope-lure risk with §5.3 as THE gate). The gate is answered (B4): this claim is the authorized Phase-4 reach. Equally: do not let THIS lane lure into P4.2/P4.3 or the other three report families — each needs its own NEW reviewed claim transition.

## 2. D1 FIRST — enumerate the Drive content folder (READ-ONLY) before D2

1. Locate the owner's publicly-shared Drive content folder (the AppSheet `content` folder — the `Mydrive/appsheet/data/ActivatedSludge-29279640/` tree per the ref-12 bot paths; **the physical folder id is NOT durably recorded in-repo** — re-locate it read-only; ห้ามเขียน Drive ทุกกรณี).
2. Enumerate the ทส.1/ทส.2 template files; record the honest format found (Google Docs? HTML? .docx? — record what IS found, never assume).
3. Record sha256 content hashes + byte sizes as provenance metadata in this handoff (the P3.4 D5 P3-3 lesson). **Never copy binaries.**
4. Pin the exact template field layouts (header block per B7; monthly aggregate rows; Thai calendar block; year-comparison columns IF the template carries them) + the exact new-file names for the components/lib/e2e. If a Drive file contradicts the ref-12 §3.7 field census, the DRIVE FILE wins + record the divergence.
5. Folder listings are not sheet enumerations (the P3.5 lesson) — a template FILE is what you mirror; workbook tabs are irrelevant here.

## 3. Honesty rules in the PRINTED output (D1-5 — reviewer pins)

unknown ≠ zero (missing telemetry renders ค่าว่าง/ไม่มีข้อมูล, never 0); estimate-derived values carry their provenance flags into the print (×3.7 energy estimate, ×1.2 chlorine-litter note, CO2 ×0.4999 provenance); latest ≠ live; simulation labeled as simulation; พ.ศ. years + Thai month names (`month_thai` verbatim class, +543); the report header shows `core.address` values only (B7) — NEVER personnel identity; no Telegram step (that is P4.2).

## 4. D-phases (per WO §5)

D1 enumeration above → D2 RED (counts verbatim; legacy passes disclosed) → D3 implement (scope-exact vs WO §7; P2.5 summary sections + `generateRepairRequest` byte-untouched) → D4 battery (vitest FULL; tsc -b; oxlint; Playwright FULL workers=1 incl. the print-view e2e; guard 344/344; runtime 62/62; checker v1.14.0; `git diff --check` clean; 13-digit grep 0; `supabase/` EMPTY) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED**. Release v1.14.0 MINOR in the implementation PR (CHANGELOG Thai พ.ศ. entry + package.json 1.13.0→1.14.0); annotated tag at the deployed merge SHA post-deploy per ENV-APP-VERSION-001 D6.

## 5. D-phase log (implementation lane fills this in)

- (to be recorded by the implementing lane, one bullet per phase, with exact SHAs and verbatim counts)
