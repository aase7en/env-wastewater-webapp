# UI Design Brief — Wastewater Treatment Monitoring Webapp

> **⚠ Style authority since 2026-07-18: the full `design/` suite** —
> 14 Claude-Design screen exports (`*_aura_dark` / `*_light_mode` folders,
> each `code.html` + `screen.png`) + two token sets:
> - `design/boost_resource_management/DESIGN.md` — **dark** ("Boost", = root
>   `DESIGN.md`)
> - `design/luminous_mint/DESIGN.md` — **light** ("Luminous Mint")
> - `design/uth_ai_evn_system_design_aura_edition.md` — aura-card spec
> - `design/water_management_refined_aura_dark/code.html` — closest reference
>   for this app's dashboard (see also `..._dark_mode_fix`, which fixes the
>   wordmark to **UTH[AI]-ENV** — ENV, not EVN; that spelling is canonical).
>
> **Brand question is closed**: `UTH[AI]-ENV` + `logo 3D_aura.png`
> (optimized copies live in `frontend/public/logo-aura.png` + favicon).
>
> Frontend state: F1 (2026-07-18) made the tokens dual-theme CSS variables
> (`:root` = Luminous Mint light, `.dark` = Boost dark) with a persisted
> toggle; F2 aligned the shell (w-72 sidebar, Material Symbols, top bar,
> user footer) and made all SVG/chart colors token-driven. See MIGRATION.md
> "Two-track F/Z" for how visual (F) and feature (Z) work run in parallel.
>
> **Domain-mapping rules (binding — style ตาม suite, เนื้อหาตามระบบจริง):**
> 1. PFD flow-line semantics are fixed in every theme: 🔵 water in/out,
>    ⚪ air bubbles, 🟤 sludge (RAS/WAS) — neon accents never restyle them.
> 2. No fake telemetry: data is a once-daily manual entry → show
>    "บันทึกล่าสุด <date>", never a pulsing LIVE badge, until real IoT lands.
> 3. No fake actuation: the app monitors and records — no Manage Valves /
>    Optimize Load / Emergency Shutdown controls. The equivalent real action
>    is "แจ้งเหตุผิดปกติ" (system_operating override + mandatory cause →
>    repair request).
> 4. Thai text renders via IBM Plex Sans Thai fallback (Plus Jakarta Sans
>    has no Thai glyphs); telemetry numbers use tabular figures.
> 5. Raw neon (#00F0FF/#CCFF00) is dark-mode-only; light mode uses the
>    Luminous Mint readable pairs (see tokens.css).
> 6. Rotating aura rings are reserved for cards needing operator attention;
>    everything else uses a static ring (`prefers-reduced-motion` stops all).
> 7. ทส.1 / ทส.2 / ใบแจ้งซ่อม print output stays plain black-on-white.
> 8. Never hotlink `lh3.googleusercontent.com` assets from the exports —
>    copy assets into `frontend/public/`.
> 9. The AI-Admin exports contain a real staff name — this repo is private,
>    but do **not** copy `design/` exports into A-Wiki (public).
>
> The rest of this file is kept as a historical record of the brief that
> drove the earlier mockup iterations — the **content/data requirements**
> section at the bottom is still authoritative (the data fields the UI
> must surface have not changed).

Captured 2026-07-06. UI/visual design work is **paused in this repo/session** —
the user plans to continue it in a dedicated design tool (Claude Design,
z.ai design, or similar) so it can keep going across rate-limit windows by
switching tools. This file is the durable, tool-agnostic brief for that.
Read `SPEC.md` and `CONTEXT.md` in this repo first for the underlying data
model and product scope — this brief only covers visual/interaction design.

## Copy-paste prompt (for Claude Design / z.ai design / any other design tool)

```
Design a web dashboard for a hospital wastewater treatment monitoring system.

STYLE: SaaS analytics dashboard — clean data-dense layout, card-based
information hierarchy, professional not playful.

KEY LAYOUT COMPONENT: a Process Flow Diagram (PFD) interface — a literal
diagram of the treatment process (screening → aeration tank → sedimentation
→ chlorination → discharge) as the centerpiece, not just a data table. Water
visibly "flows" through the diagram between stages.

MUST BE READY FOR (not needed today, but design for it):
- Live telemetry data visualization — this is currently a manual daily-entry
  form, but the schema/UI should not preclude real-time IoT sensor feeds
  later without a redesign.
- Gauges, real-time line charts, and dynamic status indicators (traffic-light
  style) for each measured parameter.

DOMAIN CONTEXT (use this to pick palette/iconography — do not default to a
generic tech/SaaS look): water treatment plant, wastewater management,
activated sludge process at a Thai community hospital. Icons and color
choices should read as "industrial water treatment," not "generic startup
dashboard."

ANIMATION / MOTION:
- Prefer Lottie (JSON) or SVG animation (CSS/SMIL) for the flow diagram —
  SVG/CSS is specifically well suited to animating water flow through pipes
  in real time (dashed-line flow, directional particles).
- Add a CSS/JS particle effect in the aeration tank area — small bubbles
  rising continuously, to make it visually unambiguous to the operator that
  the blower is actively injecting oxygen (this is a real equipment state,
  not decoration — it should reflect the aerator's actual on/off status).

STRICT COLOR CODING FOR FLOW LINES (do not mix these up — operators rely on
this to read the diagram at a glance):
- 🔵 Blue: influent/effluent flow (incoming wastewater / treated water out)
- ⚪ White / translucent bubbles: air flow (blower → aeration tank)
- 🟤 Brown/burnt-orange: sludge flow (RAS/WAS — return/waste activated
  sludge being pumped back or out)

BRANDING: no hospital logo/brand kit has been decided yet — treat this as
an open question for whoever builds it (ask the user, or default to a
neutral clinical-teal identity if no answer is available).

REAL DATA FIELDS THE UI MUST SURFACE (see this repo's SPEC.md/CONTEXT.md for
full detail): DO at 3 process stages, pH, TDS at 2 points, temperature,
SV30, free chlorine, 10 equipment on/off checkpoints, chlorine dosing +
mix ratio, 2 electricity submeters, water volumes in/used, overall system
status (auto-derived from equipment, staff can override, and requires a
cause field when abnormal), reporter (auto from login). A mobile-first
daily-entry form is a separate screen from this dashboard — see the
existing form mockup for reference before redesigning it.
```

## Prior iterations (reference, not final — all superseded by whichever
direction gets picked next)

1. **v1 — industrial control-room/HMI, green-grey palette.** Rejected: too
   heavy/dark for a form staff fill out daily on a phone.
2. **3 palette variants** (clinical blue / fresh water blue / dark SCADA),
   same layout, comparison-only artifact.
3. **Live-dashboard-style variant** — copied A-Wiki's own Live Dashboard
   visual language (gradient text, glass-cards, glowing pulsing status,
   animated flow between DO stages) in dark, then a light "green-white"
   version with animation trimmed to what's contextually meaningful (only
   the DO stage needing attention pulses; flow lines animate because they
   represent real flow; removed anything implying real-time telemetry that
   doesn't exist yet, like a "LIVE" badge or a chat-typing-style caret).

None of these were locked in as final — this brief (SaaS/PFD direction) is a
new, more ambitious direction requested 2026-07-06 and supersedes the
"which palette do you like" framing of the earlier three variants.

## Open questions for whoever builds this next

- Logo / brand asset — not decided.
- Exact Lottie vs. hand-authored SVG/CSS choice for the flow animation —
  Lottie needs an asset pipeline (After Effects/Bodymovin export or a
  library like LottieFiles' free assets); SVG/CSS is zero-dependency and
  can be built directly in an artifact. Recommend starting with SVG/CSS
  (as the existing mockups already do) and only reaching for Lottie if a
  specific complex asset (e.g. a detailed equipment icon) needs it.
- Whether live telemetry (real sensors) is a real near-term roadmap item or
  purely "don't paint ourselves into a corner" — affects how much gauge/
  real-time-chart infrastructure is worth building now vs. later.
