# Work Order — ENV-BACKFILL-001 (Phase-5 backfill seed from the owner's newly shared sources)

**Status: REVIEW_REQUESTED (C1, generation 1) — implementation delivered 2026-11-24 on `feat/env-backfill-001`; D2 RED + D3 apply (all counts exact: 30/882/48/351/3/6/24/33-d1-7/51) + D4 battery receipts in the lane handoff (`docs/ai/handoffs/ENV-BACKFILL-001-GLM.md` § Implementation receipts). The implementing lane NEVER merges — the D5 fresh-GLM independent review + the authorized reviewer own approval + merge.** Claim transition `docs/env-backfill-001-claim`, base `9919c8b76a904a9c805df3883beb4e57839d32309a7` (= origin/main tip at transition authoring; clean, fetched, ff verified).
**Routing:** Track-Z GLM (GLM-5.3 MAX). **STOP at REVIEW_REQUESTED — the implementing lane never merges.**

---

## 0. Purpose

Seed the now-available AppSheet source data into the existing ENV_DB tables, per the parity plan §7 backfill inventory (`docs/ai/APPSHEET-PARITY-PLAN.md:280-283`: Phase 2 → master+ประวัติ `ข้อมูลถังดับเพลิง`/`ตรวจสอบถัง`/`Emergency light`/`Check`; Phase 3 → `Items`/`Inventory`/`Vendors`/`maintenance`), honoring the §7 transfer rules verbatim: **อ่านอย่างเดียวจาก export, อนุมานไม่ได้ → ค่าว่างคงค่าว่าง, ทุกรอบต้องมีรายงานนับเทียบก่อน/หลัง**.

This lane is a plan P5.2 backfill slice bounded EXACTLY to the sources the owner shared on 2026-11-24 and that the read-only verification receipt (`/tmp/env-links-2026-11-24/FINDINGS.md`, attached verbatim as the lane handoff Appendix A) verdicts SERVED or PARTIAL-derivable. The login-walled AppSheet-DB tables (coliform ×4 — link 3; น้ำประปา — link 5) are **NOT in this lane** (INACCESSIBLE-WITHOUT-OWNER-SESSION per the receipt; a follow-up lane when the owner exports CSVs).

## 0.1 Authorization basis (adversarial check item — insufficient basis parks the claim unmerged)

1. **Owner standing Goal-mode instruction** (continue per the laid plan/roadmap).
2. **The owner's 2026-11-24 sharing action** — three links shared in-chat; all three sheet-backed links verified link-shared OK (200) read-only by the verification subagent (receipt verbatim in the handoff Appendix A; raw CSVs/XLSX under `/tmp/env-links-2026-11-24/`).
3. **The parity plan §7 backfill inventory** explicitly lists these tables as pre-cutover backfill (plan line 281 quoted in §0).
4. The Phase-5-READY closeout frontier (PR #262 → `da962480248d91f7aa2166962d608d4e0662a5cd`) recorded "Step 1 the owner shares the … sheets … — each share pivots its domain from ยังไม่มีแหล่ง into the parity table" — the owner HAS shared; this claim IS the pivot for the served domains.

**Deviation recorded vs the transition instruction ("registry 53 claims, NO active claim"):** the registry at this base has 53 claims with TWO standing non-CLOSED entries — `ENV-BUILDING-REPAIR-001-C1` CLAIMED (owner-deferred 2026-10-12, PR #111 issuecomment-6127497707, WAITING_EXTERNAL; frontend/DB scope, disjoint) and `ENV-SUNDAYMCP-ROUTING-001-C1` CLAIMED (owner-side routing lane; its SKILL/worktree scope is disjoint from this lane's files). File-level overlap with THIS lane's mutable scope = ZERO; the only shared surface is `docs/ai/CURRENT-WORK.md` itself, which every claim transition appends to by protocol (docs-only, merge-ordered, JSON-diff exactly one new claim each). No conflicting active claim exists for this lane's files.

## 0.2 Repo evidence at base (R1–R10)

- R1 `safety.fire_extinguisher` = 0 rows live — the P2.1 SOURCE_UNAVAILABLE ruling (`20261116000004_parity_p2_001.sql:99-120`: schema shipped with `legacy_row_id text PRIMARY KEY` + the D1-3 pin "QR CODE is an app formula derived from legacy_row_id → NOT stored" + the in-file seed-time reconciliation note "when the master becomes fetchable"). The master sheet tab was NEVER shared until 2026-11-24; FINDINGS verdict for the master = PARTIAL (derivable: latest-per-QR).
- R2 `safety.extinguisher_inspection` = 0 rows — P2.2 shipped the table+RPC+trigger with NO seed (`20261116000005_parity_p2_002.sql`, "NO seed rows"); the 858-row-era history was never seeded (FK-blocked: no master existed to satisfy the extinguisher FK). The Phase-5-READY smoke (2026-11-21) measured the sheet side at 877 rows then; the 2026-11-24 export measures 882 data rows (see §2 count table + the count-evolution note in §3.2).
- R3 `safety.emergency_light` = 48 rows seeded at P2.1 (48/48 byte-verified); the 2026-11-24 export holds 48 data rows (FINDINGS' "49" = line-count incl. header — §3.1).
- R4 `safety.emergency_light_check` = 332 rows seeded at P2.3 (331 resolved + 1 NULL `light_id` for the non-padded `31` row never normalized); the 2026-11-24 export holds 351 data rows (+19 real new rows vs the seed; FINDINGS' "352" = header-count artifact; the Phase-5-READY smoke measured "+10" on 2026-11-21 — the log is LIVE in AppSheet, the owner's staff still record inspections).
- R5 `core.item` / `core.vendor` / `core.item_category` exist (P3.1, `20261118000001_parity_p3_001.sql`) with verbatim 8-hex `UNIQUEID()` legacy ids UNIQUE + `source_provenance` shipped for exactly this deferred seed; seeded 0 rows (sheet absent then).
- R6 `chemical.inventory_lot` exists (P3.2, `20261118000002_parity_p3_002.sql` — dedicated lot-level table per ref 12 §3.28; seed SOURCE_UNAVAILABLE verdict honored 0 rows).
- R7 `core.item_calibration` exists (P3.3, `20261118000005_parity_p3_003.sql`) with `legacy_id UNIQUE` + `tool_legacy_id` verbatim + `source_provenance`; **11 rows already seeded** (Phase-5-READY smoke: item_calibration 11/11 ตรงกัน on 2026-11-21).
- R8 The verification receipt's CSV censuses (transition-time recount, method disclosed in §3.1): ตรวจสอบถัง 882 data rows × 27 declared cols (18 used + 9 trailing empty) with headers row_ID/Date_time/QR_CODE/location/type/packing_date/chem_exp/packing_weight/pipe/handle/tank/pressure_gauge/barrier/breakdown_details/cause_of_damaged/ผู้ตรวจสอบ/รูปชำรุด/Filter_Firer_ID; Emergency light 48 × 7 (ERL_ID/location/Pic/QR/Receive_date/location_floor/Providers); Check 351 × 19 declared (11 used); Items 24 × 15; Vendors 6 × 9; Categories 3 × 3; Inventory 38 × 10; maintenance 40 × 6.
- R9 Derivation ground truth: ref 12 §3.12 (`docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md:3044-3096`) defines the master `ข้อมูลถังดับเพลิง` (9 cols: Location / ประเภทถังดับเพลิง enum 5 values / รูปถ่ายถังดับเพลิง / QR CODE / วันที่บรรจุ / วันที่หมดอายุ / ขนาดบรรจุ) — and ref 12 §3.13 (`:3098+`) shows the log `ตรวจสอบถัง` embeds the SAME master fields per row (`QR_CODE/location/type/packing_date/chem_exp/packing_weight` — byte-identical column names in the 2026-11-24 export headers, R8).
- R10 House idempotency precedents: P2.1 `INSERT … SELECT … WHERE NOT EXISTS` per seed row; P3.3 "the guarded re-send inserts ZERO rows (WHERE NOT EXISTS …)" (`scripts/test_parity_p3_003_calibration.py:40`); blanks ⇒ NULL + พ.ศ. D/M/Y → ISO per-source normalization (P2.1 `5/6/2568`→`2025-06-05`; P2.3 พ.ศ. 2568×144/2569×188).

## 1. Scope — the five seed groups (binding)

**ONE migration** `supabase/migrations/20261124000000_backfill_001.sql` (filename pinned here; house naming; any numbered-set split is an explicit D1 adjudicated deviation per the instruction "prefer ONE"), applied to ENV_DB ONLY via `scripts/apply_migration_api.py` with the ENV_DB gate, per-statement row counts, and a before/after count reconciliation report (plan §7 rule 3). All inserts guarded (`WHERE NOT EXISTS` on the table's legacy key), idempotent by construction, re-apply inserts ZERO rows. NO DDL beyond the seed statements (every target table exists — §0.2); NO RLS/policy/grant/facade change (the P2.x/P3.x shipped RLS governs the writes); rollback SQL documented in-header (DELETE by the exact seeded key sets + `source_provenance` marker), never executed without an owner order.

| # | Source (2026-11-24 export) | Target | Key + guards | Notes |
|---|---|---|---|---|
| 1a | ตรวจสอบถัง 882 rows → latest-per-QR_CODE snapshot | `safety.fire_extinguisher` (0 live) | one master row per distinct QR_CODE (**30 census** at transition); `legacy_row_id` per the P2.1 D1-3 app-formula direction (D1 pins the exact byte mapping — never invented), `legacy_id` = the QR_CODE trace | **DERIVED-FROM-LOG provenance** (`source_provenance` records it verbatim, incl. the derivation date + the 882-row basis) — NOT a standalone master the owner never had; §3.3 |
| 1b | ตรวจสอบถัง 882 rows (history, ALL rows) | `safety.extinguisher_inspection` (0 live) | `legacy_id` = `row_ID` (882 distinct); master seeded FIRST in the same migration → the P2.2 FK-block no longer applies | pipe/handle/tank/pressure_gauge/barrier + หมดอายุ trigger fields verbatim; ผู้ตรวจสอบ → personnel-UUID-or-NULL per the P2.3 auditor precedent, NEVER verbatim names |
| 2a | Emergency light 48 rows | `safety.emergency_light` (48 live) | `erl_id`/`legacy_id` = ERL_ID; `WHERE NOT EXISTS` → the D2 set-diff decides (expected 0 new rows unless a genuinely new ERL_ID exists; a changed row is NOT silently updated — drift pivots to the coordinator) | the instruction's "master 48→49 (+1 verify not dup)" resolves as the §3.1 header-count artifact class, BUT the set-diff is still mandatory — never assume |
| 2b | Check 351 rows | `safety.emergency_light_check` (332 live) | `legacy_id` = `row_ID`; guarded append → expected +19 net new (351 sheet-distinct − 332 seeded overlap assumed NONE seeded from this export; D2 reconciles exactly) | seed master 2a BEFORE 2b; the P2.3 `31`-row NULL-`light_id` precedent stands — a check whose QR does not resolve inserts with NULL `light_id`, never normalized, never dropped |
| 3a | Items 24 / Vendors 6 / Categories 3 | `core.item` / `core.vendor` / `core.item_category` | 8-hex legacy ids UNIQUE + `source_provenance`; seed Categories/Vendors BEFORE Items (FK refs) | **Vendor business contacts (Phone/Email/SalesName/LineID/URL/Address) commit VERBATIM per the P3.1 D1-6 ruling — but MASK in every receipt/report**; vendor names are business-public and stay verbatim in the DB per the same ruling |
| 3b | Inventory 38 rows | `chemical.inventory_lot` (0 live) | lot legacy key per the P3.2 schema; MFG/EXP mostly empty → **NULL honesty** (ค่าว่างคงค่าว่าง — never 1970/epoch/current-date) | dates are **ค.ศ. US M/D/Y** (FINDINGS: provable via 9/19, 9/20, 6/20 values) — per-source normalization pinned; LotNo/Amount/deduct/LifeTime verbatim |
| 3c | maintenance 40 rows | `core.item_calibration` (11 live) | `legacy_id` UNIQUE (`maintenanceID`, 40 distinct); guarded `WHERE NOT EXISTS` → ZERO dupes regardless of overlap with the 11 seeded | the instruction's "the 41-row sheet includes those?" reconcile: the 11 seeded rows carry `source_provenance` from the P3.3 seed (2026-11-18 export basis); D2 reports the exact set intersection/union counts — the guard makes the outcome deterministic either way |
| — | coliform ×4 (link 3) + น้ำประปา (link 5) | — | — | **OUT — login-walled** (INACCESSIBLE-WITHOUT-OWNER-SESSION); follow-up lane when the owner exports CSVs |

## 2. Count contracts (D2 pins) — CSV truth vs the FINDINGS line-count method

**§3.1 THE COUNT DIVERGENCE (recorded, binding):** the verification receipt FINDINGS.md and the transition instruction quote 883/49/352/25/7/4/39/41 — a consistent +1 vs the actual CSV data rows in ALL eight tabs. Transition-time recount (method: `csv.reader` on the gviz exports; `csv.reader` records = physical lines; header line included): every file has exactly ONE header row, no embedded newlines, no trailing partial row → **the quoted counts are physical-line counts including the header**. The truthful DATA-ROW counts bind this lane: **882 / 48 / 351 / 24 / 6 / 3 / 38 / 40**. CSV truth wins over the prose counts (the P1.3 verbatim-formula-wins precedent); FINDINGS.md stays attached verbatim WITH this §3.1 divergence note — never silently corrected. D2 re-censuses at implementation time (drift pivots, never assumes — the AppSheet side is LIVE; the Filter_Firer bot tab shows pdfCount 747 with Trigger today 24/11/2569).

- derived master census: **30 distinct QR_CODE** (dup max 41 inspections per QR) → group 1a pins exactly 30 master rows (unless a latest-row master-field census proves any QR's fields all-empty — D1 rules the honest handling per unknown ≠ zero, never a fabricated row).
- count-evolution honesty: extinguisher log 858 (P2.2-era sheet) → 877 (Phase-5-READY smoke 2026-11-21) → 882 (this export) — the source is live; D2's before/after report records all three eras.

## 3. Binding data-honesty rules

### 3.1 Per-source date normalization (พ.ศ.↔ค.ศ. as pinned)

- Fire + emergency-light sheets (groups 1/2): ALL user dates D/M/Y **พ.ศ.** (2564–2569) → ISO ค.ศ. = พ.ศ. − 543 (P2.1 `5/6/2568`→`2025-06-05` precedent); the Feb-29 unparsable-cell lesson from the Phase-5-READY D5 applies (honest skip + report, never a run abort, never a guess).
- Items-sheet Inventory/maintenance (groups 3b/3c): **ค.ศ. US M/D/Y** (FINDINGS: order provable via 9/19, 9/20, 6/20) → ISO as-is.
- Blanks ⇒ NULL everywhere (ค่าว่างคงค่าว่าง; MFG/EXP mostly empty; 38 NULL providers + 8 NULL pics precedent at P2.1). Unknown ≠ zero ≠ epoch ≠ current-date.

### 3.2 PII rules (binding)

- **ผู้ตรวจสอบ / Auditor columns** (inspector names) and **personnel IDs of ANY form**: NEVER seeded verbatim, NEVER committed, NEVER printed — resolve to `personnel_id` UUID-or-NULL per the P2.2/P2.3 auditor precedents (deterministic match only; no match → NULL, never guessed; exact-full-name matching recorded, partial-data errors honestly disclosed — the P2.3 D5-R1 P1 lesson).
- **Vendor business contacts** (Phone/Email/SalesName/LineID): committable verbatim per the P3.1 D1-6 ruling, **MASKED in every receipt/report/chat surface**.
- `.env`, `data/raw/`, Telegram credentials — never committed, never printed (owner B5). The `/tmp/env-links-2026-11-24/` evidence stays /tmp-only; only FINDINGS.md (already PII-masked by its own method) attaches to the handoff, verbatim, WITH the §3.1 divergence note.

### 3.3 The derivation ruling (fire_extinguisher master = DERIVED-FROM-LOG)

The P2.1 ruling ("nothing reconstructed from the inspection table" — recorded because the master sheet was absent AND a derivation was then un-evidenced) is **superseded by the owner's 2026-11-24 share of the log itself**, which §7 explicitly lists for backfill ("master+ประวัติ"). The derivation is WO-pinned: **latest-per-QR_CODE snapshot** — per distinct QR_CODE, take the row with max `Date_time` (deterministic tie-break: the export's row order / first occurrence, pinned at D1) and copy the six master fields (`QR_CODE/location/type/packing_date/chem_exp/packing_weight` — the export's own column names) into the P2.1 master columns (`location/extinguisher_type/packed_date/expiry_date/size_label` + the id/QR mapping). `source_provenance` reads verbatim as a DERIVED-FROM-LOG marker incl. date + row basis. The master's `extinguisher_type` keeps the documented 5-value enum (ref 12 §3.12) with NO hard CHECK — an out-of-enum latest value is flagged in the report, never rejected (the P2.1 in-file reconciliation note, executed at last). Honest limits recorded: `photo_path` and the master `รูปถ่าย` have no log source → NULL; the P2.1 D1-3 pin "QR derived-from-id, NOT stored" stays.

## 4. Release ruling

**NO BUMP — v1.15.1 STAYS, no tag, no CHANGELOG entry.** DB-only data seeding surfaced through EXISTING UIs (the P2.1/P4.4/C8 precedents — backend-only paths, no Pages run expected; the deploy filter does not match docs+migrations).

## 5. D-phases

- **D1** (implementation worktree `_worktrees/env-backfill-001` off the post-merge main tip): re-census the CSVs + live DB counts read-only (drift pivots, never silent); pin the exact column mappings incl. the `legacy_row_id`↔QR_CODE byte mapping; pin the tie-break; adjudicate any empty-master-field QR. Filename drift or a numbered-set split = recorded deviation.
- **D2 RED-first** `scripts/test_parity_backfill_001.py` — read-only SQL contract suite (house live-DB gate per `test_parity_p1_001_schema.py`): per-table count/shape contracts (§2), the derivation-rule census (30), delta reconciliations (+19 net-new expected on checks; the calibration 11∩40 set report), blanks-NULL pins, date-normalization pins per source calendar, PII absence pins (no name token from the ผู้ตรวจสอบ/Auditor columns anywhere in seeded rows), idempotency (guarded re-send inserts ZERO). Must FAIL truthfully pre-apply.
- **D3** the ONE migration: preflight receipts (ENV_DB gate, live counts before, name-collision check) → apply via `scripts/apply_migration_api.py` with per-statement OK/FAIL → post-verify counts + spot-checks vs the CSVs (field-by-field on a deterministic sample) → the before/after count reconciliation report (plan §7 rule 3) → rollback documented never executed.
- **D4** battery: FULL vitest + `tsc -b` + oxlint + Playwright FULL workers=1 + guard 344/344 + runtime 62/62 + checker OK v1.15.1 (no-bump) + `git diff --check` clean + the PII/token grep over ALL changed files (0 hits).
- **D5** fresh-GLM independent review at the exact frozen head (own battery rerun where possible incl. the contract suite + the count report). STOP at REVIEW_REQUESTED — implementer never merges.

## 6. Explicit adjudication items (D1)

- **D1-1** the `legacy_row_id`↔QR_CODE byte mapping (the P2.1 D1-3 formula direction; adversarial — an invented id format = P1).
- **D1-2** the latest-per-QR tie-break + the empty-master-field handling (unknown ≠ zero).
- **D1-3** the ผู้ตรวจสอบ/Auditor personnel resolution policy (deterministic-only; NULL-honest; never verbatim — adversarial).
- **D1-4** the calibration 11∩40 reconciliation report shape (the guard makes it deterministic; the report must show the sets, not just totals).
- **D1-5** the ONE-migration ruling (any split = adjudicated deviation).
- **D1-6** the release ruling NO BUMP (adversarial).

## 7. Scope guards

FORBIDDEN: frontend/** (zero diff); existing migrations byte-untouched; RLS/policies/grants/facades; supabase/functions/ + config.toml + seed/; CI/.github; the coliform + น้ำประปา scope; Phase-5 dual-run/retirement (owner-gated); reference/plan docs READ-ONLY (`docs/ai/APPSHEET-PARITY-PLAN.md`, ref 12, AGENTS.md, design docs); CHANGELOG.md + package.json (no bump); PHI + personnel names/IDs; Telegram credentials; .env + data/raw/; every file not in the claim's mutable_scope. The two standing CLAIMED claims (BUILDING-REPAIR-001, SUNDAYMCP-ROUTING-001) are scope-disjoint — their files stay byte-untouched.
