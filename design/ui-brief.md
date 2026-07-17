# UI Design Brief — Wastewater Treatment Monitoring Webapp

> **⚠ Direction locked in 2026-07-17 — UTH[AI]-EVN Aura Edition.**
> The SaaS/PFD direction described in the copy-paste prompt below is
> **superseded** by the UTH[AI]-EVN Aura Edition design system (dark
> deep-teal foundation, neon cyan/lime accents, glassmorphism cards with
> a rotating conic-gradient aura border, Plus Jakarta Sans display font).
> See:
> - `design/uth_ai_evn_system_design_aura_edition.md` — the authoritative spec.
> - `design/DESIGN.md` — full color/typography token table (Boost variant).
> - `design/luminous_mint/DESIGN.md` — the paired light-mode variant.
> - `design/water_management_refined_aura_dark/code.html` — reference
>   implementation (Tailwind config + `.glass-card` CSS pattern).
>
> The Aura foundation landed in the frontend as `chunk(P10.6.1)` (tailwind
> palette + `.aura-card` + UI primitives); the daily-entry form (P10.6.4)
> and readings list (P10.6.5) ship on it. The PFD dashboard (P10.1–4)
> still uses the legacy clinical-teal palette and migrates in P10.7.
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
