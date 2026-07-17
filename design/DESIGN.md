---
name: Boost Resource Management
colors:
  surface: '#00161b'
  surface-dim: '#00161b'
  surface-bright: '#243d42'
  surface-container-lowest: '#001114'
  surface-container-low: '#041f24'
  surface-container: '#082328'
  surface-container-high: '#142e33'
  surface-container-highest: '#1f383e'
  on-surface: '#cce7ee'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#cce7ee'
  inverse-on-surface: '#1b3439'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ffffff'
  on-secondary: '#283500'
  secondary-container: '#c3f400'
  on-secondary-container: '#556d00'
  tertiary: '#e2faff'
  on-tertiary: '#00363d'
  tertiary-container: '#6eeaff'
  on-tertiary-container: '#006975'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#9cf0ff'
  tertiary-fixed-dim: '#58d7eb'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#00161b'
  on-background: '#cce7ee'
  surface-variant: '#1f383e'
  background-deep: '#03181C'
  border-subtle: '#13383E'
  text-main: '#FFFFFF'
  text-muted: '#A1B5BB'
typography:
  hero-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  section-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  card-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-main:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  data-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-stakes hospital resource management, where data precision meets futuristic operational efficiency. The brand personality is **reliable, high-tech, and clinical**, evoking an emotional response of absolute control and real-time awareness.

The design style is a hybrid of **Futuristic Minimalism and Bento-box Grids**. It utilizes a deep dark-mode foundation to reduce eye strain for 24/7 monitoring staff while employing vibrant neon accents to signal growth, energy flow, and critical status updates. Visuals are dominated by abstract UI mockups, glowing strokes, and glass-like surfaces that suggest a sophisticated, API-driven infrastructure. Every element is designed to feel like a digital twin of the hospital’s physical resources.

## Colors

The palette is anchored in a specialized dark mode specifically optimized for data-centric monitoring environments.

*   **Primary & Secondary:** A high-contrast pairing of Cyan (`#00F0FF`) and Lime (`#CCFF00`). These are used exclusively for active states, data trends (growth/generation), and primary calls to action.
*   **Neutral Layers:** The background utilizes Deep Teal (`#03181C`) for maximum depth, while surfaces use a slightly lighter `#092429` to create a hierarchical separation of content.
*   **Gradients:** Use linear gradients from Cyan to Lime (45-degree angle) for "Active" or "Positive" status indicators, such as solar generation or water purity levels.
*   **Functional Colors:** Use Tertiary Light Blue for informational icons and data points that require visibility without the urgency of the primary neon accents.

## Typography

This design system uses **Plus Jakarta Sans** across all levels to maintain a clean, approachable, yet technical feel. 

- **Headlines:** Use tight letter-spacing (tracking) for large titles to create a high-impact, modern look. 
- **Data Display:** For metric-heavy dashboards (e.g., Watts/Liters), use the `data-display` style to ensure numbers are the focal point.
- **Hierarchy:** Maintain a clear distinction between `text-main` (White) for primary information and `text-muted` (Teal-Gray) for secondary descriptions and labels.
- **Mobile Scaling:** On mobile devices, `hero-title` should scale down to 40px and `section-title` to 32px to maintain readability within the grid constraints.

## Layout & Spacing

The layout follows a **Strict Bento-style Grid** model, which is ideal for organizing disparate data streams like water, energy, and inventory in a unified view.

- **Grid System:** A 12-column fluid grid for desktop, transitioning to a 1-column layout for mobile.
- **Bento Modules:** Content is housed in modular cards that span varying column counts (e.g., 3-column for small status metrics, 6-column for charts, 12-column for inventory tables).
- **Rhythm:** An 8px base unit drives all padding and margins. Gutters are fixed at 24px to provide enough breathing room between high-density data cards.
- **Reflow:** On tablets, the grid should shift to an 8-column system, prioritizing energy and water monitoring cards at the top of the stack.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering and Glow Effects** rather than traditional shadows.

- **Surface Tiers:** The `background-deep` acts as the floor. `surface` cards sit directly on top, distinguished by their `border-subtle` stroke.
- **Inner Glows:** Critical cards or "Active" modules feature a 1px inner border using the Cyan-to-Lime gradient or a subtle outer drop-shadow with 15% opacity of the accent color to simulate a neon glow.
- **Glassmorphism:** Use backdrop-blur (12px to 20px) on modal overlays and navigation bars to maintain the "Tech-Stack" depth without losing the context of the dashboard beneath.

## Shapes

The shape language balances modern software aesthetics with functional industrial design.

- **Cards:** Use a 24px radius (`rounded-lg` in this system) for primary bento cards to create a sophisticated, high-end feel.
- **UI Elements:** Smaller components like input fields, status chips, and internal UI mockups use a 12px radius.
- **Buttons:** All primary buttons are pill-shaped (9999px) to provide a distinct visual contrast against the rectangular grid system.

## Components

- **Buttons:** Primary buttons use the Cyan-to-Lime gradient with black text for maximum legibility. Secondary buttons are outlined with `border-subtle` and white text.
- **Data Cards:** Every card must include a `card-title` and an optional "Live" indicator (a pulsing 8px Cyan circle) for real-time monitoring sections.
- **Input Fields:** Dark background (`#03181C`), 1px border (`#13383E`), and `text-main` for input. On focus, the border should glow Cyan.
- **Status Chips:** Small, semi-transparent capsules. "Normal" states use a subtle Teal tint; "Warning" states use an Amber tint; "Critical" states use a pulsing Red glow.
- **Progress Bars:** For solar cell performance or wastewater levels, use the Cyan-to-Lime gradient for the filled portion, with a dark background for the unfilled track.
- **Abstract UI Mockups:** Use simplified, non-functional versions of these components as background decorations or illustrative icons for staff manuals.