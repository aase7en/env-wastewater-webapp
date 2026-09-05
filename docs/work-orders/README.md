# Work Orders — หน่วยงานที่ agent ไหนก็หยิบทำต่อได้

## Current authority

For new work, use this order:

1. `AGENTS.md` + repository freshness/ownership gate.
2. `docs/ai/PROJECT-OPERATING-MAP.md` for FAST / STANDARD / HIGH-RISK routing.
3. the active/frontier section of `docs/ai/CURRENT-WORK.md`.
4. the exact Work Order.
5. `docs/ai/ENV-ENGINEERING-LOOP.md` sections required by the selected risk path.

Do not use the historical queue or vendor table later in this file as current activation authority.

Every meaningful multi-context chunk should remain resumable from its Work Order. Small FAST-PATH work may use the explicit user instruction + existing active scope without manufacturing a heavyweight ticket solely for ceremony.

## Capability-first model routing

Route by the work's dominant capability, then select the cheapest/fastest currently available model that satisfies the task and verification contract.

| Capability | Use for |
|---|---|
| **LIGHT / deterministic executor** | classify, format, summarize, lint, mechanical edits, bounded repetitive checks |
| **CODING** | implementation, debugging, refactor, regression tests |
| **REASONING** | architecture, incident/root-cause analysis, cross-system trade-offs, security/privacy, critical review |
| **VISION** | screenshot/UI/diagram/visual regression and rendered-behavior analysis |

Escalation: `light/fast → capable coding → specialist → strongest reasoning`.

- Do not route by vendor reputation alone; use current task-fit evidence where material.
- Independent review for material/high-risk work should use a different agent/model/context from the implementer when practical.
- Verification depth is chosen by risk, not by model price.
- Each delegated mutable lane still needs bounded scope, owner, dependencies, acceptance criteria, verification, and no overlapping writer.

## Historical model tier (legacy — do not use for new dispatch)

The table below is retained only to interpret older Work Orders. It reflects the July 2026 tool/model setup and is **not** current routing authority.

| Legacy tier | Historical model | Historical intended use |
|---|---|---|
| **cheap-ok** | GLM (ZCode) / Claude Sonnet 5 | mechanical work with a complete reference pattern |
| **mid** | Claude Opus 4.8 | moderate reasoning with a closed spec |
| **primary-only** | Fable5 | new design/security/cross-system/protocol review |

Older `cheap-ok/mid` Work Orders expected `Reference pattern`, `Forbidden`, and copy-paste `Verify commands`; preserve those contracts when resuming historical work.

## Historical dispatch prompts (legacy reference)

**ZCode (GLM):**
```
อ่าน MIGRATION.md section "Two-track F/Z" + docs/work-orders/<id>.md
claim ในตาราง In-progress ก่อนเริ่ม แล้วทำตาม Steps เฉพาะ Lane/files ที่ระบุ
ห้ามเกิน Forbidden; เสร็จ = Verify commands ผ่าน → commit → push → set done
ห้าม git reset --hard (rule 6)
```

**Claude Sonnet 5 / Opus 4.8** (เปิด session ใหม่ใน repo นี้, เลือก model ก่อน):
```
อ่าน MIGRATION.md section "Two-track F/Z" + docs/work-orders/<id>.md
claim ในตาราง In-progress ก่อนเริ่ม (commit+push แถว claim)
ทำตาม Steps ทีละข้อ เฉพาะ Lane/files ที่ระบุ — ห้ามเกิน Forbidden
ติดปัญหา/เจอสิ่งนอก spec: อย่าเดา — commit งานที่ผ่าน build + append
Checkpoint + Status ⏸ paused แล้วจบ
เสร็จ: Verify commands ผ่านครบ → commit ตาม convention chunk(<id>) →
push → Status done + ปลด claim
```

**Resume/handoff (agent ไหนก็ได้ เมื่อมี ⏸ paused):**
```
อ่าน MIGRATION.md section "Two-track F/Z" + docs/work-orders/<id>.md
ทำต่อจาก Checkpoint ล่าสุด เฉพาะใน Lane/files ที่ระบุ
เริ่มจาก branch ที่ work order ระบุ; เสร็จแล้ว merge เข้า main + set done
```

## Pause protocol (ใกล้ 5-hr limit / ต้องสลับ agent)

commit งานค้าง (build ผ่าน → branch ปกติ; ไม่ผ่าน → `wip/<id>`) → append
Checkpoint (commit hash + เหลืออะไร + กับดัก) → Status `⏸ paused` →
อัปเดตตาราง claim ใน MIGRATION.md → push — **ห้ามทิ้ง uncommitted**

ZCode รับงานที่ค้างบน `track-f`: merge `track-f` เข้า tree ตัวเอง —
**ห้าม checkout `track-f` ตรง ๆ** (mount อยู่ใน worktree `A:\GitHub\envww-trackf`)

## Historical queue snapshot (2026-07-20 — not current activation authority)

- **cheap-ok แบบมีเงื่อนไข (ต้อง Fable5 WO verbatim ก่อน — Track F scope)**:
  - `Material Symbols subset keep-axes` (3.9MB → subset; nit Fable5 review #5)
    — asset + index.css = Lane ห้าม GLM ปกติ; GLM ทำได้เฉพาะถ้า Fable5
    เขียน WO แบบ F6/MOD-*-b (formula verbatim + Reference pattern)
- **Sonnet/Fable5 tier (out of GLM scope)**:
  - E2E authenticated integration profile (P11 follow-up — ต้องมี real seeded session)
- **mid เปิดอยู่**: (ว่าง)
- **ปิดแล้ว (ประวัติ)**: F1 · F2 · F3 · F4.1–F4.5 · F5 (ทั้ง logic+visual) ·
  F6 (+ F6.5 hotfix + F8 NAV pass) · SCHEMA-1..6 · DBA-1..10 · MOD-*-a ·
  MOD-*-b · CRB-2-realtime · F7-stale-data · FASTAPI-removal (Approach C) ·
  CI-1 (Node 24) · AUTH-1 · STAT-1 · E2E-2 (prod CI basename) ·
  UTILS-1 (momPct extract) · INTROSPECT-1 (SCHEMAS 3→11) · V1a..V4b ·
  AI-1..3 · IMP-1..3 · PDF-1..3 · DOC-3
- Protocol เต็ม + กติกา 8 ข้อ: MIGRATION.md §Two-track และ A-Wiki
  `docs/protocols/cross-agent-work-orders.md`
