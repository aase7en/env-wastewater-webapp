# Research: PHI/PII scrubbing for LLM pipelines

**Date**: 2026-07-23
**Method**: research-pipeline skill — gather → analyze → critique
**Purpose**: inform the ADR-0010 §"L3+ requirements" PHI scrubber design that gates Hermes (cloud LLM, Z.ai/GLM) from reading actual CI logs (`gh run view`) at L3. Current L2 is zero-data (no scrubber needed); L3 wants diagnosis from real logs.

**Confidence (post-critique)**: **low** — directionally sound, but three load-bearing recommendations are broken as written (see Critique). Not ready to implement without another iteration.

---

## Context — the specific use case

Hospital ENV wastewater monitoring webapp (โรงพยาบาลอุทัย). CI failure alerts flow:

```
GitHub Actions → Telegram bot → Hermes (Pi5) → cloud LLM (Z.ai/GLM, Chinese jurisdiction)
```

Hard rule (ADR-0010, handoff doc rule 6): *"Z.ai/GLM cloud อยู่ใต้กฎหมายจีน → ห้าม route PHI แม้ indirect."* The PHI boundary is stricter than HIPAA — a leak is not just a fine, it's exposure of patient data to a foreign-jurisdiction cloud.

The scrubber being researched sits on the Pi5 between the `gh run view` fetch and the Z.ai/GLM cloud call. It is the sole gate enforcing the rule once L3 lets Hermes read real logs.

**Known PHI committed to the repo** (from 2026-07-22 audit):
- 9 real Thai staff full names (`นาย X Y` format) in `reports/phase2-batch-*.sql`
- 2 thirteen-digit national-ID-shaped codes in `reports/phase1-analysis.md:62-72`
- 8-hex legacy facility IDs + real meter/chlorine operational values

---

## Findings (Stage 1 — GATHER)

Tooling landscape (15 findings, 4 sources):

### Presidio (Microsoft, open-source, de-facto standard)
- **Architecture**: `AnalyzerEngine` runs an NlpEngine (spaCy/stanza/transformers) for NER + 3 recognizer types: `PatternRecognizer` (regex + deny-list + checksum), `SpacyRecognizer` (NER), `PredefinedRecognizer`. Pluggable via registry, parallel execution. Each result carries `start/end/entity_type/score`. *(Presidio analyzer docs)*
- **Audit traceability**: `analyze()` accepts `return_decision_process=True` → emits the recognizer + pattern + score for each flagged span. **Load-bearing for regulated LLM pipelines** — this is the evidence trail proving *why* each span was scrubbed. *(Presidio analyzer docs)*
- **Locale gap**: built-in recognizers cover ~50 types (PERSON, EMAIL, PHONE, US_SSN, etc.) but **locale-specific IDs (Thai national ID) are NOT built-in** — must add as a custom `PatternRecognizer` with checksum logic. *(Presidio analyzer docs)*
- **Custom recognizer shape**: `PatternRecognizer` takes `name`, `patterns` (regex + score), `supported_entity`, `supported_language`, optional `context` list (e.g. `['id','บัตร','passport']`) that boosts score when nearby words match. *(Presidio custom recognizer docs)*
- **Replacement strategy is caller's choice** (Presidio Anonymizer operators): `replace` (`<PERSON>`), `mask` (keep first 2 + last 2 chars), `hash`, `redact`, `encrypt`. Replace = max privacy, loses fidelity. Mask preserves analytical utility. *(Presidio + AWS Comprehend Medical docs)*

### AWS Comprehend Medical (managed alternative)
- `DetectPHI` returns up to 18 HIPAA Safe Harbor categories (DATE, NAME, ADDRESS, PHONE, EMAIL, ID incl SSN/MRN, …), each with `Score` (0-1), offsets, text. Designed for HIPAA de-identification of free text. *(AWS docs)*
- For LLM guardrails: call `DetectPHI` on the prompt/completion, mask entities above threshold before the downstream model call. *(AWS docs)*

### Thai national ID (the load-bearing locale detail)
- **13 digits with checksum**: digits `d1..d12` weighted `13,12,11,10,9,8,7,6,5,4,3,2`; sum them; check = `11 - (sum mod 11)`; `d13` must equal the check (mod 10). **Pure regex over-matches** — a checksum validator is required to avoid flagging every long number. *(Thai national ID Wikipedia)*
- **Format `1-xxxx-xxxxx-xx-x`**: first digit = region (1-5 Thai by region, 8 foreign). Digits 2-5 = province/amphur. Region-province plausibility check cuts false positives further.

### Fail-safe design
- **Fail-closed (default-deny)**: on redactor error/timeout/ambiguous score, BLOCK or redact wholesale — don't pass through. Healthcare LLM = fail-closed is the safe choice (HIPAA penalties >> dropped-record cost). Implement: `try/except` → dead-letter queue + alert, never forward raw on exception. *(Fail-safe engineering + HIPAA practice)*
- **Gray-zone handling**: fail-closed still needs explicit guardrails for unparseable encoding, recognizer timeout (>N ms → treat as leak), and gray-zone scores (0.3-0.7) typically masked not dropped while hard-deny above threshold. Document the threshold decision for HIPAA audits.

### NER vs regex tradeoffs
- Regex = high precision, low recall for structured IDs (emails, phones, credit cards with Luhn, national IDs with checksum). Misses unstructured PII (names, addresses, novel formats). NER = high recall, lower precision, locale-dependent. **Best practice: NER as wide net + regex as precision layer + checksum as false-positive killer.** *(general knowledge)*
- Transformer NER reaches ~85-92 F1 on CoNLL person names but drops to 60-75 F1 on clinical notes. Regex = effectively 100% precision when format+checksum both match; recall degrades on OCR/voice (O→0, 1→l). Ensemble NER+regex+deny-list of org-known MRN prefixes = best operational recall.

### PHI leak case patterns (where real leaks happen)
- **(1)** raw prompt to provider that logs prompts (OpenAI/Anthropic 30-day retention); **(2)** model memorization from fine-tuning on patient records; **(3)** system prompts containing sample records; **(4)** RAG retrieval returning un-redacted chunks; **(5)** **logs/metrics/telemetry shipping raw text to Datadog/Sentry — often the actual leak vector, not the model itself.** *(case patterns)*
- **Mitigations beyond scrubbing**: Zero Data Retention enterprise tiers (Azure OpenAI no-prompt-retention, AWS Bedrock, Vertex AI CMEK); hash/tokenize identifiers with a vault (FPE token, mapping in HIPAA store); **run scrubber on completion output too, not just input** — catches memorized PHI surfacing in responses.

---

## Analysis (Stage 2 — ANALYZE)

### Synthesis
L3's log-consuming posture means the scrubber is the sole gate between `gh run view` output and the Z.ai/GLM cloud call. The committed PHI maps to three recognizer classes: (1) Thai staff names — closed finite set, deny-list; (2) 13-digit Thai IDs — custom checksum recognizer; (3) 8-hex legacy IDs + meter values — regex. Pi5 hardware likely rules out transformer NER at alert latency, so regex+checksum+deny-list is the realistic primary stack. Fail-closed is mandatory (Chinese-law boundary stricter than HIPAA). `return_decision_process=True` is the audit artifact proving PHI-non-exfiltration. Completion-side scrubbing catches hallucinated PHI.

### Key takeaways
- The leak surface is `gh run view` log output, not the model itself
- Thai national ID is NOT covered by built-in Presidio → custom checksum recognizer required
- Known Thai staff names = closed finite set → deny-list directly rather than depend on NER
- Pi5 budget likely rules out transformer NER → regex+checksum+deny-list primary
- Fail-closed is mandatory, not a preference
- `return_decision_process=True` is the L3 audit artifact, not a debug flag
- Completion-side scrubbing is required (LLM can hallucinate plausible IDs/names)

### Recommendations (as proposed — see Critique for defects)
1. Presidio `PatternRecognizer` `THAI_NATIONAL_ID` with 13-digit regex + weighted checksum + context list `['บัตร','id','reported_by','reporter','phase1']`
2. Deny-list `PatternRecognizer` `THAI_STAFF_NAME` populated from `reports/phase2-batch-*.sql` นาย-tokens, shipped as static asset
3. `PatternRecognizer` for 8-hex legacy facility IDs (regex `\b[0-9a-f]{8}\b`)
4. `try/except` + 500ms timeout → on exception/timeout/unparseable, replace log line with `<REDACTED_FAILCLOSED>` + dead-letter to Pi-local file
5. `score_threshold=0.5` + MASK replacement (keep first 2 + last 2 chars)
6. `return_decision_process=True` + persist decision JSON to Pi-local audit log
7. Run scrubber on BOTH input (log chunk) AND completion (LLM response) before Telegram post
8. Pre-classify meter/chlorine values as PHI or operational in ADR-0010

---

## Critique (Stage 3 — red-team)

**Revised confidence: LOW** — directionally right but **not ready to implement**. Three load-bearing recommendations are broken as written.

### Defect 1 (blocker): 8-hex recognizer collides catastrophically with git SHAs
The bare `\b[0-9a-f]{8}\b` regex matches every short git SHA in CI logs (`c827431b`, `bb540a9d`, …). `gh run view` output is saturated with these. The recognizer as written will redact **every commit reference** in every CI log — blinding the LLM to exactly the diagnostic signal (which commit, which file, which check) it needs. This inverts L3's value proposition. **Verified locally**: this very repo's logs would trip it on every line. Fix: allow-list against the repo's known short-SHA set, or drop this recognizer in favor of context-gated matching (legacy IDs only appear in specific log contexts).

### Defect 2 (blocker): checksum recognizer misses half the real surface
The critique verified the Thai checksum against the **actual repo values**:
```
1234567890678: checksum PASS
2122222222029: checksum FAIL   ← recognizer would MISS this
```
Half the committed 13-digit surface fails the checksum — so the keystone recognizer would miss it. Worse, the repeated-digit pattern of `2122222222029` suggests **placeholder/test data, not a real national ID**. The "committed 13-digit national-ID-shaped codes" leak claim is thinner than asserted — the design may be guarding a non-risk with a recognizer that doesn't even cover it. Needs: validate whether these are real IDs before building a recognizer for them; if real, the recognizer must catch checksum-failing variants too (e.g. regex-only fallback).

### Defect 3 (blocker): deny-list ships with no refresh contract
The analysis lists "is the 10-name deny-list truly closed?" as an open question but ships the deny-list as a static asset anyway. There are already multiple distinct committers in this repo; the moment a new one commits (or a new staff row lands in `phase2-batch-12`), the list silently goes stale and the new name flows to Z.ai. Additionally, the extraction rule ("นาย-tokens") is buggy — the actual name surface contains `นางสาวอริศรา` (no space) and no-space variants like `นายวิลาส` that a `'นาย '` token scan misses. **The closed-finite-set premise breaks on title-prefix variance alone.**

### Defect 4 (major): fail-closed + 500ms timeout self-defeats on Pi5
The scrubber must parse 100KB+ `gh run view` logs within 500ms on a Pi5 while also running Presidio's analyzer with `return_decision_process=True` (which materializes per-span decision trees). If the timeout is realistic, most real alerts trip fail-closed and L3 "degrades" to the same zero-data L2 posture it was supposed to beat. The recommendation does not address this interaction. Needs: **measure Pi5 latency before setting thresholds**.

### Defect 5 (major): completion-side scrubbing is a policy aspiration, not a control
Hermes + the Telegram bot live off-repo on the Pi5. There is no code, hook, or contract in this repo proving the completion path is in the loop. Without a demonstrated chokepoint (a single `send_to_telegram()` function the scrubber wraps), this is unenforceable. A hallucinated name in a Telegram message is the highest-variance leak and the design provides no enforcement evidence for it.

### Biases flagged
- **Presidio-default bias**: reached for Presidio without justifying it against a simpler bespoke scrubber. The PHI surface is tiny (9 names, 2 ID values, meter numbers) and entirely known at rest — a bespoke exact-match deny-list + one regex + meter-regex may be far lighter on the Pi5 than pulling Presidio's analyzer pipeline.
- **Treating own open questions as benign backlog** rather than design blockers. Four of eight open questions (deny-list drift, Pi5 latency, meter/chlorine classification, mosaic/inference) are each individually capable of making L3 unsafe or useless — for a boundary stricter than HIPAA, unresolved = unsafe.
- **Pi5 NER-feasibility claim is a guess** ("likely rules out"). If a small Flair model is feasible (Pi5 has 8GB, latency budget is seconds not ms for an async alert), the false-positive pain of the regex approach is unjustified. No number was measured.
- **MASK replacement is weak for hospital names** — first-2 + last-2 chars plus job context may re-identify a person among 9 known staff. Should default to full token replacement, not partial.
- **Fail-closed availability cost unanalyzed** — a fail-closed default that fires on the 8-hex SHA false-positives (Defect 1) makes the feature die on first real use, pushing operators to disable the scrubber entirely (LESS safe).

### Missing evidence (must resolve before L3 ships)
1. **Pi5 latency measurement** for Presidio analyzer + `return_decision_process=True` on a realistic 100KB+ `gh run view` payload — the single number determining architectural viability
2. **Validation** that the two 13-digit values are REAL Thai national IDs vs placeholder/test data (checksum-fail + repeated-digit patterns suggest the latter)
3. **Allow-list / collision analysis** for any hex-based recognizer against git short-SHAs and content hashes
4. **Completion-path chokepoint evidence** — a single `send_to_telegram()` the scrubber wraps, not an aspiration
5. **Z.ai/GLM prompt-retention/training-data policy** confirmed — without it, scrubbing may still leave a Chinese-jurisdiction data footprint
6. **Refresh mechanism** for the staff-name deny-list (CI hook on phase2-batch changes? git pre-commit? generation script?)
7. **Meter/chlorine PHI classification** under Chinese law — currently unspecified, so the recognizer set is undetermined

### Verdict
The architecture (regex+checksum+deny-list on Pi5 between fetch and cloud call, fail-closed, dual-sided scrubbing) is **directionally right** but needs another iteration:
- (a) measure Pi5 latency
- (b) replace 8-hex with an allow-listed SHA-aware recognizer (or drop it)
- (c) re-justify Presidio vs a tiny bespoke scrubber given the narrow PHI surface
- (d) tie the deny-list to a regeneration hook
- (e) validate the 13-digit values are real IDs before building a recognizer for them

Until then, **stay at L2 (zero-data)** — the current posture, which needs no scrubber and is provably PHI-safe.

---

## What this means for the repo

- **No code change** from this research. It's input to a future L3 scrubber design, gated behind the 5 must-resolve items above.
- **ADR-0010 §"L3+ requirements"** is reinforced: the critique confirms L3+ needs a mature scrubber, and the current zero-data L2 posture is the correct floor.
- The critique's verification (Thai checksum on real repo values, SHA collision count) is itself a useful audit artifact — the "13-digit PHI" assumption is weaker than the 2026-07-22 audit implied. Worth re-examining in ADR-0010 if the PHI surface is re-audited.

## Sources

- Presidio analyzer docs: https://data-privacy-stack.github.io/presidio/analyzer/
- Presidio custom recognizer docs: https://data-privacy-stack.github.io/presidio/customize_recognizers/
- AWS Comprehend Medical: https://docs.aws.amazon.com/comprehend-medical/latest/dev/what-is-comprehend-medical.html
- AWS DetectPHI: https://docs.aws.amazon.com/comprehend-medical/latest/dev/protecting-phi-using-phi-detection.html
- Thai national ID card: https://en.wikipedia.org/wiki/Thai_national_id_card
- Fail-safe (engineering): https://en.wikipedia.org/wiki/Fail-safe
