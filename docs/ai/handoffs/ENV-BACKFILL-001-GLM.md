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

---

## Implementation receipts — C1 gen 1 (delivered 2026-11-24, STOP at REVIEW_REQUESTED)

Lane: Track-Z GLM, `_worktrees/env-backfill-001`, branch `feat/env-backfill-001`
off `8e317d8` (post-merge main tip). Delivered: the ONE migration
`supabase/migrations/20261124000000_backfill_001.sql` (1,417 guarded INSERT
statements + the `notify pgrst` trailer; generated PROGRAMMATICALLY — never
hand-typed — by a /tmp throwaway generator cited here per the P2.1 precedent,
sha256 `9473ac5ed50ff598a3aac76e2b4aeb7ce81e5a212f2489fcd13fad0b716f2c8a`,
NOT committed) + `scripts/test_parity_backfill_001.py` (the D2 read-only
contract suite). CURRENT-WORK.md untouched (its registry fence is hash-pinned
at the claim transition — registry updates belong to the reviewed
transitions, never the implementation lane).

### D1 re-census + rulings (drift pivots — recorded, never silent)

The 2026-11-24 CSVs re-censused at implementation time: **882 / 48 / 351 /
24 / 6 / 3 / 38 / 40 data rows** — exactly the §2 binding counts (no drift).
Live-DB before-state re-probed read-only: fe 0 / ei 0 / el 48 / elc 332 /
item 0 / vendor 0 / category 0 / distributor 6 / inventory_lot 0 /
calibration 11 / personnel 9 / reading 907 / equipment_spec 4.

- **D1-1** `legacy_row_id` = `QR_CODE` verbatim (all 30 values verified
  22-char PackedUUID — the P2.2 scan-payload-is-this-column direction);
  `legacy_id` = the QR trace. QR is NOT a stored column (P2.1 D1-3 pin
  stands — QR_CODE IS the id bytes).
- **D1-2** latest-per-QR by max `Date_time` (พ.ศ. D/M/Y HH:MM:SS → ISO);
  tie-break = first occurrence in export order — **0 ties observed**; 0 QRs
  with all-master-fields-empty; every derived master row has all five fields
  non-NULL (location/type/packed/expiry/size — 0 NULLs).
- **D1-3** PII resolution: the 6 distinct non-empty ผู้ตรวจสอบ values
  (829 of 882 rows non-empty) were matched against `core.personnel.full_name`
  by EXACT full-name — **0 of 6 matched** ⇒ `inspector_id` NULL on ALL 882
  rows (names never printed, never committed; the D2 suite probes all seeded
  text columns per name at runtime — 0 hits). The Check tab's single
  distinct Auditor value is the known 13-digit account; the **19 net-new
  rows carry Auditor blank** ⇒ `auditor_id`/`auditor_legacy_id` NULL
  everywhere in the delta (the P2.3 STAFF-001 mapping evidence tab is not in
  this lane's source set — no match attempted beyond exact-full-name, per
  the deterministic-only pin).
- **D1-4** calibration sets: |seeded (P3.3 `maintaining` ids)| = 11, |CSV
  `maintenanceID`| = 40, **∩ = ∅** (the guard makes the outcome
  deterministic); union = 51 rows post-apply. All 40 present
  (contract-asserted set equality).
- **D1-5** ONE migration confirmed (no split).
- **D1-6** NO BUMP honored (CHANGELOG.md + frontend/package.json untouched;
  checker OK v1.15.1).
- **D1-7 DEVIATION (the honest pivot — binding):** `chemical.inventory_lot`
  seeds **33 of the 38 census rows**. Five source rows are unrepresentable
  in the SHIPPED NOT NULL/CHECK shape without a forbidden DDL change (WO §1:
  "NO DDL beyond the seed statements"; existing migrations byte-untouched):
  | row | reason (values verbatim at source) |
  |---|---|
  | `e102936e` | Amount `0` — violates `inventory_lot_amount_positive` (> 0) |
  | `be012199` | Amount `−25`, deduct `−625` — negative correction |
  | `67f9a938` | Amount `−15`, deduct `−375` — negative correction |
  | `27bae2e0` | deduct `20` > Amount `1` — violates `inventory_lot_remaining_nonnegative` |
  | `8ad18e5a` | deduct `2` > Amount `1` — same CHECK (NOTE: a REAL lot — LotNo `6530-024-0001/3`, MFG 4/8/2025, EXP 4/8/2028 — disclosed for a follow-up owner decision) |
  Never coerced (unknown ≠ zero; a sign-flip is fabrication; the P2.3 D5-R1
  lesson). The D2 suite asserts these 5 legacy_ids ABSENT and 33 present.
  The prose "38 rows" was the census expectation; CSV truth + shipped
  constraints win (the §3.1 CSV-truth-wins precedent). A follow-up additive
  lane + owner decision can admit them (relaxing the CHECK is an owner
  adjudication, not a lane call).
- **D1-8** Vendors `SalesName`/`LineID` (4 / 2 non-empty at source) have NO
  column in `core.vendor` (the P3.1 schema split put sales/line on
  `core.distributor`, a different legacy-id space seeded 2026-11-18, out of
  this lane's target list) — NOT seeded; values masked here (never printed);
  disclosed so nothing is silently dropped.
- **D1-9** log datetimes (`Date_time`) interpreted Thai-local ICT:
  `TIMESTAMPTZ '…+07'` (the source carries no offset; +07 pinned).
- **D1-10** รูปชำรุด (98 non-empty Drive-relative refs) is not a column of
  `extinguisher_inspection` (the house attachment pattern) — not seeded;
  disclosed.
- **D1-11** `extinguisher_inspection.id` = `sha256(legacy_id)[:8]`
  (deterministic ENV-style 8-hex UI-crypto shape; 882 distinct verified;
  house traceability keeps `legacy_id` = row_ID verbatim).
- Enum reconciliation (flag-never-reject, no CHECK exists): derived master
  types = 4 distinct values; **1/30 out of the P2.1 documented 5-value
  master enum** (`น้ำ (Best Drop แบบ Low Pressure Water Mist)` — a member of
  the P2.2 inspection-side 6-value enum) — flagged, inserted verbatim.
  `cause_of_damaged` shows 4 observed values vs the 2 documented — verbatim,
  no CHECK, reported.

### D2 RED (truthful, pre-apply)

`scripts/test_parity_backfill_001.py` — house live-DB gate (Management-API
access path, SUPABASE_ACCESS_TOKEN from Drive secrets, never printed).

- **RED-A** (migration file absent): **14 failed / 5 passed / 3 skipped** —
  every failure a truthful live-count mismatch (e.g. `fire_extinguisher`
  live 0 ≠ pinned 30; `item_calibration` live 11 ≠ pinned 51); the passes
  are the pre-existing baselines (counts/policies/no-anon) + the two vacuous
  pins (PII-absence over an empty table, master-undrifted at 48=48).
- **RED-B** (file generated, UNAPPLIED): **15 failed / 7 passed** — adds the
  static guard contract pass (all 1,417 INSERTs guarded, zero DDL/grant in
  the seed block, DERIVED-FROM-LOG marker present) + the idempotency canary
  FAILING truthfully (sample re-send hits the FK — master rows absent
  pre-apply).

### D3 apply + post-verify

Preflight: ENV_DB gate (project `gllqtbyofrcjzmbnfoeh`), filename unique,
live before-snapshot, and the trigger no-op verified live (`auth.uid()` IS
NULL in the Management-API context ⇒ `core.fn_is_staff_or_admin()` false ⇒
`trg_extinguisher_update_expdate` bumps nothing — derived master expiry stays
byte-exact; re-verified GREEN by the full-derivation equality contract).

Apply: `scripts/apply_migration_api.py` per-statement run hit the Management-
API ThrottlerException at ~statement 630 (630 OK / 788 throttled — nothing
partial: every statement is guarded and atomic); recovered per the script's
documented idempotent re-run path via a /tmp throttled resume runner
(client-side skip of already-inserted keys + 429 backoff): **588/588 OK,
0 FAIL**. Zero unanticipated writes: every non-target counter byte-identical
before/after.

**Count reconciliation (plan §7 rule 3) — CSV truth vs DB before → after:**

| table | CSV | before | after | Δ |
|---|---|---|---|---|
| safety.fire_extinguisher | 30 QRs | 0 | **30** | +30 |
| safety.extinguisher_inspection | 882 | 0 | **882** | +882 |
| safety.emergency_light | 48 | 48 | **48** | 0 (guarded set-diff — the "+1" prose count = §3.1 header artifact) |
| safety.emergency_light_check | 351 | 332 | **351** | +19 net-new |
| core.item_category | 3 | 0 | **3** | +3 |
| core.vendor | 6 | 0 | **6** | +6 |
| core.item | 24 | 0 | **24** | +24 |
| core.distributor | — | 6 | **6** | 0 (untouched) |
| chemical.inventory_lot | 38 − 5 skips | 0 | **33** | +33 (D1-7) |
| core.item_calibration | 40 + 11 seeded | 11 | **51** | +40 (∩ = ∅) |
| wastewater.reading / core.personnel / core.equipment_spec | — | 907/9/4 | 907/9/4 | 0 |

Post-verify GREEN: the contract suite **22/22 passed** — full-table
field-by-field equality vs the CSV bytes (superset of the 3-rows-per-family
spot-check pin: inspections 882/882, master 30/30, checks 19/19 net-new +
48/48 master no-drift, items/vendors/categories, lots 33/33, calibration
40/40), id-shape pin, blanks-NULL pin (0 empty-strings), PII-absence
full-table probes (0 hits), idempotency canary (guarded re-send inserts
ZERO), baselines + policies undrifted.

### D4 battery (all green)

| check | result |
|---|---|
| contract suite | 22/22 GREEN (post-apply) |
| vitest FULL | 53 files — 998 passed / 1 skipped (the 2 env-wiring failures seen before copying the gitignored `frontend/.env` into the worktree were environmental, resolved by that copy — no code relation) |
| tsc -b | clean |
| oxlint | exit 0 (19 pre-existing warnings, baseline noise) |
| Playwright FULL workers=1 | **336/336 passed (7.7m)** |
| guard | **344/344** + 450 subtests |
| runtime | **62/62** + 32 subtests |
| checker | OK (v1.15.1; NO BUMP — no tag, no CHANGELOG entry) |
| `git diff --check` | clean |
| diff ⊆ claimed scope | exactly the migration + the contract suite + the 2 docs files (CURRENT-WORK.md untouched) |
| PII/token grep over ALL changed files | never-committable class (inspector names ×6, Auditor 13-digit ×1): **0 hits**; vendor Phone/Email present in the migration VALUES by the D1-6 committable ruling (6 phones / 3 emails — MASKED in every receipt; SalesName/LineID 0, D1-8) |
| guard `scope-check` machine pass | `ok:false UNKNOWN_CHANGE_KIND` on both code + docs paths — the R2 P3-advisory (annotated scope entries don't machine-match); fail-closed direction only; the PR diff itself is the scope evidence |

Rollback: documented in the migration header (reverse-FK-order DELETEs by
the exact provenance markers + seeded key sets) — NEVER executed without an
owner order.

### PII masking note (binding for every reader of this receipt)

This receipt contains NO inspector name, NO Auditor value, NO vendor phone /
email / sales-name / LineID value, NO personnel identifier. Counts and row
ids only. The `/tmp/env-links-2026-11-24/` raw sources stay /tmp-only. The
migration VALUES carry vendor business contacts verbatim per the P3.1 D1-6
ruling (committable) — masked in THIS receipt and every chat surface. The
19 net-new check rows carry no Auditor value at all (blank at source). The
882 inspection rows carry zero inspector-name bytes (NULL `inspector_id`
everywhere; D1-3 disclosure: 0/6 deterministic full-name matches against the
9-row `core.personnel`).

**STOP at REVIEW_REQUESTED.** The implementing lane never merges; the D5
fresh-GLM independent review + the authorized reviewer own approval + merge.

### D6 CLOSEOUT RECEIPT (docs-only closeout transition, 2026-11-24 — STOP at REVIEW_REQUESTED)

Executed by `docs/env-backfill-001-closeout` off main @ `dfec9f075436f801ef4a419d44e9e72f31edfb7a`; the closeout lane never merges — the authorized reviewer owns approval + merge. This receipt re-records the delivered counts, the derivation, and the named deviations so the lane closes with a self-contained ledger.

**The chain (all receipts verified live before writing):**
- Claim transition PR #267 merged `8e317d8618121b28f118bcacd2b55b39d32309a7` (docs-only, base `9919c8b76a904a9c805df3883beb4e57839d2faa` = the Phase-5-READY closeout merge).
- Implementation PR #268 merged `dfec9f075436f801ef4a419d44e9e72f31edfb7a` — parents EXACTLY (`8e317d8618121b28f118bcacd2b55b39d32309a7`, `6ab113b2b0f453764024aea835ee7097aab0268f` = the D5-APPROVED head); merge commit, no squash, expected-head discipline `--match-head-commit`; branch kept.
- D5 fresh-GLM APPROVED issuecomment-7131444943 at the exact frozen head `6ab113b` — 0 P1 / 0 P2, **1417/1417 field-verified, 0 mismatches**; merge-executor review trail issuecomment-7131502260 (expected head + merge policy + P3 carry + the no-bump/no-tag/no-Pages ruling). PR gates at merge: OPEN + MERGEABLE + checks green (notify + scripts).
- Merge stat = exactly 4 files 2512+/1−: the ONE migration +1574, the contract suite NEW +760, this handoff +177, the WO +1/−1. `frontend/` EMPTY, CURRENT-WORK.md untouched at merge.
- Deploy honest note: **NO Pages run at the merge** — DB+scripts+docs only, `deploy-frontend.yml` paths do not match; only the main `test` workflow executed at `dfec9f0` (success). **NO BUMP — v1.15.1 stays, no tag, no CHANGELOG entry** (D1-6).
- Post-merge re-verification at `dfec9f0` (executed by this closeout transition): guard **344/344** + 450 subtests passed; validate-registry **{ok:true, claims:54, BOOTSTRAP_CONTROL}** with C1 still CLAIMED pre-closeout.

**The D5 P3s carried to the ledger (both informational):**
1. **DateStyle-replay hardening note** — `chemical.inventory_lot` INSERTs put raw US-format date literals (`'10/4/2024'`, `'11/4/2024'`) into DATE columns relying on the default session `DateStyle` (ISO,MDY), while `receipt_date` in the same statements uses explicit `DATE 'YYYY-MM-DD'` casts. Landed values verified correct/coherent (e.g. `f9884183` EXP `2024-11-04` after receipt `2024-10-10`), but a DMY-DateStyle client re-running the file would land different dates. Deterministic-replay hardening (explicit casts) = follow-up-lane candidate; no action required for merge.
2. **amount_deducted-0 disclosure** — 3 seeded lots carry `amount_deducted = 0` where source `Amount_unit_deduct` is blank — consistent with the pre-existing shipped P3_002 ruling (`Amount_unit_deduct → amount_deducted numeric NOT NULL DEFAULT 0`; `Total_deduct` explicitly not persisted), so not a new deviation; recorded so the blank→default mapping is named in the ledger.

**THE COUNT TABLE (delivered — CSV truth vs DB before → after; plan §7 rule 3):**

| table | CSV | before | after | Δ |
|---|---|---|---|---|
| safety.fire_extinguisher | 30 QRs (latest-per-QR of the 882-row log) | 0 | **30** | +30 |
| safety.extinguisher_inspection | 882 | 0 | **882** | +882 |
| safety.emergency_light | 48 | 48 | **48** | 0 (guarded set-diff — the "+1" prose count = §3.1 header artifact) |
| safety.emergency_light_check | 351 | 332 | **351** | +19 net-new |
| core.item_category | 3 | 0 | **3** | +3 |
| core.vendor | 6 | 0 | **6** | +6 |
| core.item | 24 | 0 | **24** | +24 |
| core.distributor | — | 6 | **6** | 0 (untouched) |
| chemical.inventory_lot | 38 − 5 skips (D1-7) | 0 | **33** | +33 |
| core.item_calibration | 40 + 11 seeded | 11 | **51** | +40 (∩ = ∅) |
| wastewater.reading / core.personnel / core.equipment_spec | — | 907/9/4 | 907/9/4 | 0 |

Post-verify GREEN: the contract suite **22/22 passed** — full-table field-by-field equality vs the CSV bytes (the D5 1417/1417 basis: 1,417 guarded INSERTs = 30+882+19+24+6+3+33+40 seed rows; plus 48/48 master no-drift and baselines), blanks-NULL pin (0 empty-strings), PII-absence full-table probes (0 hits), idempotency canary (guarded re-send inserts ZERO).

**THE DERIVATION (durable record):** `safety.fire_extinguisher` is **DERIVED-FROM-LOG** — for each of the **30 distinct QR_CODEs** in the 882-row ตรวจสอบถัง log, take the row with max `Date_time` (tie-break = first occurrence in export order; **0 ties observed**) and copy the six embedded master fields (`QR_CODE/location/type/packing_date/chem_exp/packing_weight` — the export's own column names) into the P2.1 master columns. `source_provenance` records the DERIVED-FROM-LOG provenance verbatim incl. the derivation date + the 882-row basis — honest provenance, NOT a standalone master the owner never had. `legacy_row_id` = `QR_CODE` verbatim (all 30 values verified 22-char PackedUUID); QR is NOT a stored column (the P2.1 D1-3 pin stands). `extinguisher_inspection.id` = `sha256(legacy_id)[:8]` (D1-11, 882 distinct). The master seeds FIRST in the same migration so the P2.2 FK-block retires. Enum reconciliation flag-never-reject: 1/30 derived types out of the documented 5-value master enum (a member of the P2.2 inspection-side 6-value enum) — inserted verbatim; `cause_of_damaged` 4 observed vs 2 documented — verbatim, no CHECK, reported.

**THE D1-7 / D1-8 / D1-10 DEVIATIONS (verbatim carry from § D1):**
- **D1-7 — `chemical.inventory_lot` seeded 33 of the 38 census rows.** Five source rows are unrepresentable in the SHIPPED NOT NULL/CHECK shape without a forbidden DDL change (WO §1: NO DDL beyond the seed statements; existing migrations byte-untouched). The owner follow-up list:

| row | reason (values verbatim at source) |
|---|---|
| `e102936e` | Amount `0` — violates `inventory_lot_amount_positive` (> 0) |
| `be012199` | Amount `−25`, deduct `−625` — negative correction |
| `67f9a938` | Amount `−15`, deduct `−375` — negative correction |
| `27bae2e0` | deduct `20` > Amount `1` — violates `inventory_lot_remaining_nonnegative` |
| `8ad18e5a` | deduct `2` > Amount `1` — same CHECK (**a REAL lot** — LotNo `6530-024-0001/3`, MFG 4/8/2025, EXP 4/8/2028 — disclosed for a follow-up owner decision) |

  Never coerced (unknown ≠ zero; a sign-flip is fabrication; the P2.3 D5-R1 lesson). The D2 suite asserts these 5 legacy_ids ABSENT and 33 present. CSV truth + shipped constraints win over the prose "38 rows" census expectation (the §3.1 CSV-truth-wins precedent). A follow-up additive lane + owner decision can admit them — relaxing the CHECK is an owner adjudication, not a lane call.
- **D1-8 — Vendors `SalesName`/`LineID` (4 / 2 non-empty at source) NOT seeded.** No column exists in `core.vendor` (the P3.1 schema split put sales/line on `core.distributor`, a different legacy-id space seeded 2026-11-18, outside this lane's target list). Values masked here (never printed); disclosed so nothing is silently dropped.
- **D1-10 — รูปชำรุด (98 non-empty Drive-relative refs) NOT seeded.** Not a column of `extinguisher_inspection` (the house attachment pattern); disclosed.
- Related honesty records: D1-9 log datetimes interpreted Thai-local ICT (`TIMESTAMPTZ '…+07'` — the source carries no offset); D1-3 `inspector_id` NULL on ALL 882 rows (0/6 exact-full-name matches vs the 9-row `core.personnel`; names never printed/committed; the 19 net-new check rows carry Auditor blank → NULL everywhere).

**Fence re-pinned by this closeout:** `expected_policy_revision = dfec9f075436f801ef4a419d44e9e72f31edfb7a` (the PR #268 merge SHA); `expected_registry_hash = 6cd430a71961fe1707f6f1922c29072d177452bd733171c959cbf95703892de1` = the guard `registry_hash` AT `dfec9f0` (validate-registry output at that SHA; same method as the prior closeout fences). Claim-by-claim JSON diff vs `dfec9f0` = **exactly 1 claim changed** (this one → CLOSED); `git diff --check` clean.

**Frontier after this closeout merges:** backfill PART 1 delivered (the owner's 24/11 shares). REMAINING: coliform ×4 + น้ำประปา AppSheet-DB exports (LOGIN-WALLED — the owner will drop CSVs; follow-up lane when they arrive); the 5 inventory-lot rejects (D1-7 owner follow-up list); Phase-5 **dual-run STILL the critical path** (dual-run start/acceptance + AppSheet freeze/read-only/retirement OWNER-GATED — plan P5.1/P5.3 + the checklist decision points; the seed does NOT start dual-run); standing items (Building WAITING_EXTERNAL, SUNDAYMCP owner-side, hooks #155 / #156 owner-manual; extinguisher log LIVE — 858→877→882 count-evolution honesty, future re-sync = own lane). Scope lock released at generation 1; CLOSED confers no fresh mutation authority; all other work still requires a NEW claim transition.
