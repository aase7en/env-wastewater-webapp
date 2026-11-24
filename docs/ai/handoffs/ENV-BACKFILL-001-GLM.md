# Handoff — ENV-BACKFILL-001-GLM (Claim ENV-BACKFILL-001-C1, gen 1)

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the
claim-transition PR merges.** Until then this document is the binding brief.
Worktree `_worktrees/env-backfill-001` (clean, off the post-merge main tip);
implementation branch off that tip (house `feat/env-backfill-001` form, name
pinned at D1). STOP at REVIEW_REQUESTED — you never merge; the authorized
reviewer owns approval + merge of every PR in this lane's chain. WO
`docs/work-orders/ENV-BACKFILL-001.md` holds the full binding pins (§0
authorization + the R1–R10 evidence record, §1 the five seed groups table, §2
the count contracts, §3 the data-honesty rules incl. the derivation ruling,
§4 NO BUMP, §5 D-phases, §6 D1 items, §7 scope guards). Read it before
writing anything. Summary:

## 1. Deliver THIS lane (Phase-5 backfill seed from the owner's newly shared sources)

ONE guarded idempotent migration `supabase/migrations/20261124000000_backfill_001.sql`
+ ONE read-only D2 contract suite `scripts/test_parity_backfill_001.py` +
this handoff + the WO + the registry record. Five seed groups per WO §1:

1. **fire_extinguisher master (DERIVED-FROM-LOG)** — `safety.fire_extinguisher`
   is 0 rows (SOURCE_UNAVAILABLE since P2.1); derive it from the ตรวจสอบถัง
   log per the WO §3.3 ruling (latest-per-QR_CODE snapshot of the six master
   fields; census 30 distinct QR_CODEs; `source_provenance` records the
   DERIVED-FROM-LOG provenance verbatim — this is honest provenance, NOT a
   claim of a standalone master the owner never had).
2. **extinguisher inspection history** — all 882 log rows →
   `safety.extinguisher_inspection` (`legacy_id` = `row_ID`); the master is
   seeded FIRST in the same migration so the P2.2 FK-block (858-row-era
   history never seeded, no master existed) no longer applies.
3. **emergency-light deltas** — master set-diff vs the 48 live rows
   (guarded; the instruction's "+1 row 48→49" resolves as the header-count
   artifact class per WO §3.1, but the set-diff is still mandatory); Check
   351 data rows → `safety.emergency_light_check` guarded append (+19 net-new
   expected; the P2.3 NULL-`light_id` precedent stands for unresolved QRs).
4. **Items/Vendors/Categories + Inventory + maintenance** — 24/6/3 →
   `core.item`/`core.vendor`/`core.item_category` (seed Categories/Vendors
   before Items; vendor business contacts verbatim per the P3.1 D1-6 ruling,
   MASKED in receipts); 38 → `chemical.inventory_lot` (MFG/EXP mostly empty
   → NULL; ค.ศ. US M/D/Y per-source calendar); 40 → `core.item_calibration`
   (11 already seeded — the `legacy_id UNIQUE` + `WHERE NOT EXISTS` guard
   makes dupes impossible; D1-4 reports the exact set intersection).
5. **NOT in this lane** — coliform ×4 + น้ำประปา AppSheet-DB tables
   (login-walled per Appendix A; follow-up lane when the owner exports CSVs).

## 2. Authorization basis

Owner standing Goal-mode instruction + the owner's 2026-11-24 sharing action
(in-chat links; all three sheet-backed links verified link-shared OK 200
read-only) + the parity plan §7 backfill inventory explicitly listing these
tables as pre-cutover backfill (`docs/ai/APPSHEET-PARITY-PLAN.md:280-283`)
+ the verification evidence Appendix A (attached VERBATIM below). The
Phase-5-READY closeout frontier recorded "each share pivots its domain from
ยังไม่มีแหล่ง into the parity table" — the owner HAS shared; this claim IS
that pivot for the served domains.

## 3. The three binding honesty notes (do not lose these)

1. **WO §2 count divergence** — FINDINGS.md (and the transition instruction)
   quote 883/49/352/25/7/4/39/41; the transition-time `csv.reader` recount
   proves those are physical-line counts INCLUDING the header (one header
   row per file; no embedded newlines). The truthful data-row counts bind:
   **882/48/351/24/6/3/38/40**. FINDINGS.md stays attached verbatim with the
   divergence note — never silently corrected. D2 re-censuses at
   implementation time (the AppSheet side is LIVE — Filter_Firer pdfCount
   747 with a trigger today 24/11/2569).
2. **Per-source calendars** — fire + light sheets: D/M/Y พ.ศ. (−543 → ISO);
   Items-sheet Inventory/maintenance: ค.ศ. US M/D/Y (order provable via
   9/19, 9/20, 6/20 per Appendix A). Blanks ⇒ NULL (ค่าว่างคงค่าว่าง) —
   MFG/EXP mostly empty stays NULL, never epoch/current-date.
3. **PII** — ผู้ตรวจสอบ/Auditor name columns + personnel IDs: never seeded
   verbatim, never committed, never printed (personnel-UUID-or-NULL per the
   P2.2/P2.3 precedents). Vendor business contacts committable per the P3.1
   D1-6 ruling but MASKED in every receipt. The `/tmp/env-links-2026-11-24/`
   raw files stay /tmp-only.

Battery: FULL vitest + tsc -b + oxlint + Playwright FULL workers=1 + guard
344/344 + runtime 62/62 + checker OK v1.15.1 (NO BUMP — v1.15.1 stays, no
tag, no CHANGELOG entry) + `git diff --check` clean + PII/token grep 0.
Then D5 fresh-GLM at the exact frozen head. STOP at REVIEW_REQUESTED.

---

## Appendix A — READ-ONLY link verification — 2026-11-24 (raw findings) [VERBATIM ATTACHMENT]

> Attached verbatim from `/tmp/env-links-2026-11-24/FINDINGS.md` (the
> verification subagent's receipt). The file is PII-masked by its own method
> (inspector names and vendor business contacts masked in the report; no
> name/phone/email value appears). WO §2 records the one known divergence
> (its row counts are physical-line counts including the header row).

# READ-ONLY link verification — 2026-11-24 (raw findings)

Method: htmlview + xlsx-export (tab enumeration) + gviz CSV per tab (headers/rows/samples). No writes, no login attempts.
Files in this dir: per-tab CSVs (`{sheetID}__tab__{name}.csv`), `{sheetID}.xlsx`, `{sheetID}.htmlview.html`, `appsheet_3/5.html` + headers, `summary.json`.

## Link 1 — Sheet "fire_extinguisher" (owner label "!!ถังดับเพลิง")
ID 15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E · title: fire_extinguisher · link-shared OK (200)
Tabs (5):
- **ตรวจสอบถัง** — 883 rows × 27 declared cols (18 used + 9 trailing empty). Headers: row_ID, Date_time, QR_CODE, location, type, packing_date, chem_exp, packing_weight, pipe, handle, tank, pressure_gauge, barrier, breakdown_details, cause_of_damaged, ผู้ตรวจสอบ (PII col), รูปชำรุด, Filter_Firer_ID. Dates: Date_time D/M/Y พ.ศ.+time (all rows); packing_date/chem_exp D/M/Y พ.ศ. (~99%). This is the QR inspection LOG with master-ish fields (QR/type/packing/weight) embedded per row — NOT a standalone master.
- เก็บรูป — 4 rows (id, image path).
- Filter_Firer — 2 rows (AppSheet PDF-filter bot tab; Start 1/11/2569 → End 30/11/2569 พ.ศ.; Trigger_PDF today 24/11/2569 16:51, pdfCount 747 → actively used).
- Menu_Firer — 4 rows (AppSheet menu; links Fire_Dashbord).
- Numbers — 109 rows (1..N helper column).
PII: ผู้ตรวจสอบ column = inspector names (masked in report); QR codes are object QR strings, kept.

## Link 2 — Sheet "ข้อมูลตรวจไฟฉุกเฉิน" (owner label "ไฟฉุกเฉิน")
ID 1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw · link-shared OK
Tabs (4):
- **Emergency light** — 49 rows × 7: ERL_ID, location, Pic, QR (api.qrserver.com URLs), Receive_date (D/M/Y พ.ศ.), location_floor, Providers. = Emergency-light MASTER.
- **Check** — 352 rows × 19 declared (11 used): row_ID, Date_time (พ.ศ.), QR_CODE, location, Persistency, Position, test_result, Auditor (PII col, mostly empty), Broken_detail, Pic, Status. = inspection log.
- ER_light_Menu — 4 rows (AppSheet menu).
- Filter_Light — 2 rows (PDF bot; Trigger today 24/11/2569, pdfCount 516).

## Link 3 — AppSheet DB "coliform bac" (E6OI8PF7fK4-A6VbmoHG0d)
GET (non-auth) → 200 HTML page titled **"Login - AppSheet"** (~43 KB shell; HEAD probe → 405). Login/sign-in/auth markers present. Content data not served without owner session. INACCESSIBLE-WITHOUT-OWNER-SESSION. Saved: appsheet_3.html, appsheet_3_headers.txt.

## Link 4 — Sheet "Items" (owner label "item"; the separate "น่ำประปา" line does NOT match this sheet's content)
ID 1lLKTXEYx83zukwb0JmyVFjB_VFXHtx-lfpiVyJvRaxI · title: Items · link-shared OK
Tabs (5):
- **Items** — 25 rows × 15: Item ID (8-char hex), Name, Description, Image, Category (ref), Vendor (ref), Purchase Cost, unit_count_num, unit_count, unit_formula, unit_use_num, unit_calculate, User manual (file), min, max. Includes the water-test devices (TDS meter HI99300, Free-Chlorine HI701, …) — the Items master target.
- **Vendors** — 7 rows × 9: ID, Name, Logo, URL, Phone, Email, Address, SalesName, LineID. Business-contact PII (phone/email/sales names) — masked in report.
- **Categories** — 4 rows × 3: ID, Category (Tools, Chemicals, …), Icon. 
- Inventory — 39 rows × 10 (lot-level: Amount, deduct, LotNo, MFG, EXP, LifeTime). **Dates here are ค.ศ. US M/D/Y** (e.g. 8/9/2023, 9/19/2023); MFG/EXP mostly empty; filled EXP are ค.ศ.
- maintenance — 41 rows × 6 (calibration: Cal_date **ค.ศ. US M/D/Y**, Cal_method, Cal_result).
Ambiguity resolved: NO น้ำประปา tab/content in this sheet — that label belongs to link 5.

## Link 5 — AppSheet DB "น้ำประปา" (IyZOg2vIpU4yIUrlCvskp0)
GET (non-auth) → same **"Login - AppSheet"** shell, 43 KB, no data. INACCESSIBLE-WITHOUT-OWNER-SESSION. Saved: appsheet_5.html, appsheet_5_headers.txt.

## พ.ศ. observations
- Fire + emergency-light sheets: ALL user dates D/M/Y **พ.ศ.** (2564–2569); AppSheet bot tabs also พ.ศ.
- Items sheet Inventory/maintenance: **ค.ศ. in US M/D/Y** order (M/D/Y provable via 9/19, 9/20, 6/20 values) — era+order divergence vs Thai sheets; ingestion must normalize per-source.

## Verdict vs 6 targets
| Target | Served by | Verdict |
|---|---|---|
| ถังดับเพลิง master | Link 1 only has the ตรวจสอบถัง LOG (883) with master fields embedded; NO standalone master tab | PARTIAL (derivable: latest-per-QR) |
| coliform ×4 | Link 3 AppSheet DB → login wall | UNRESOLVED — INACCESSIBLE |
| Items | Link 4 tab Items (25) | SERVED |
| Vendors | Link 4 tab Vendors (7) | SERVED |
| Categories | Link 4 tab Categories (4) | SERVED |
| คู่มือน้ำประปา / น้ำประปา-related | Link 5 AppSheet DB → login wall; link 4 contains NO น้ำประปา content | UNRESOLVED — INACCESSIBLE |

Bonus usable now: ไฟฉุกเฉิน Emergency-light master (49) + Check log (352) — adjacent fire-safety lane target (not in the 6).

Owner unblocking options for links 3/5: export CSV from AppSheet database UI, or share the backing Google Sheet if the database is sheet-backed, or add link-sharing on the DB's export.

*— END of verbatim attachment —*
