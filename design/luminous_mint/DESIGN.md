---
name: Luminous Mint
colors:
  surface: '#f3fbf7'
  surface-dim: '#d4dcd8'
  surface-bright: '#f3fbf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf5f1'
  surface-container: '#e8f0ec'
  surface-container-high: '#e2eae6'
  surface-container-highest: '#dce4e0'
  on-surface: '#161d1b'
  on-surface-variant: '#3b4a45'
  inverse-surface: '#2a322f'
  inverse-on-surface: '#ebf3ee'
  outline: '#6b7a75'
  outline-variant: '#bacac4'
  surface-tint: '#006b5a'
  primary: '#006b5a'
  on-primary: '#ffffff'
  primary-container: '#00d1b2'
  on-primary-container: '#005446'
  inverse-primary: '#2cdebf'
  secondary: '#406370'
  on-secondary: '#ffffff'
  secondary-container: '#c0e6f4'
  on-secondary-container: '#446874'
  tertiary: '#904d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffa557'
  on-tertiary-container: '#723c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#58fbda'
  primary-fixed-dim: '#2cdebf'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#c3e8f7'
  secondary-fixed-dim: '#a7ccda'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#274c57'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f3fbf7'
  on-background: '#161d1b'
  surface-variant: '#dce4e0'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is built around a refreshed, ethereal aesthetic that combines **Glassmorphism** with a vibrant, tech-forward color palette. It is designed to feel airy, modern, and highly legible, targeting high-growth SaaS, lifestyle apps, or creative platforms. 

The emotional response is one of clarity and optimism. By utilizing semi-transparent layers and soft "aura" glows, the UI achieves a sense of depth without the heaviness of traditional skeuomorphism. The atmosphere is clinical yet welcoming, professional yet spirited.

## Colors

The palette is anchored by a high-contrast relationship between the **Mint Green** primary and the **Deep Teal** text. 

- **Primary (#00D1B2):** Used for calls to action, active states, and branding accents.
- **Surface (rgba(255, 255, 255, 0.7)):** The core of the glass effect, requiring a background blur behind it to maintain legibility.
- **Text (#002B36):** A deep, saturated teal that provides better visual harmony with the mint accents than a standard neutral gray.
- **Background (#F7FAFA):** A cool off-white that prevents the screen from feeling overly sterile while allowing the glass layers to pop.

## Typography

The design system utilizes **Plus Jakarta Sans** across all levels to maintain a cohesive, friendly, and geometric feel. 

Headlines use a heavy weight (Bold/ExtraBold) with slight negative letter spacing to create a strong visual "anchor" against the light, translucent UI elements. Body text prioritizes breathability with a generous 1.6 line height. Label styles are set in SemiBold or Bold to ensure they remain legible even when placed over semi-transparent glass surfaces.

## Layout & Spacing

The design system follows a **Fluid Grid** model with a maximum container width for desktop viewing. 

- **Desktop:** 12-column grid, 24px gutters, 48px side margins.
- **Tablet:** 8-column grid, 16px gutters, 32px side margins.
- **Mobile:** 4-column grid, 16px gutters, 16px side margins.

Space is used aggressively to reinforce the "Airy" brand pillar. Component padding should lean towards the `md` (24px) scale to ensure the Glassmorphism effects have enough surface area to be appreciated.

## Elevation & Depth

Depth is not communicated through traditional black shadows, but through **Backdrop Blurs** and **Colored Auras**.

1.  **Low Elevation:** Surface with `backdrop-filter: blur(8px)` and a 1px border of `rgba(0, 209, 178, 0.3)`.
2.  **Medium Elevation (Hover):** The border opacity increases, and a subtle Mint Green outer glow (`box-shadow: 0 0 15px rgba(0, 209, 178, 0.15)`) is applied.
3.  **High Elevation (Modals):** `backdrop-filter: blur(16px)`, a stronger white fill (`rgba(255, 255, 255, 0.9)`), and a more pronounced aura glow to lift the element off the page.

## Shapes

The design system uses a **Rounded** shape language to complement the soft nature of Glassmorphism. 

Standard components (Cards, Inputs) use a 0.5rem (8px) radius. Larger layout containers or featured sections should utilize `rounded-xl` (1.5rem/24px) to create a more distinct, pill-like framing. Buttons and interactive chips may use the full pill-shape (circular ends) to contrast against the rectangular grid.

## Components

### Buttons
Primary buttons use the Mint Green gradient with white text. On hover, they should emit a soft mint shadow. Secondary buttons use a transparent background with a mint border and teal text.

### Cards
Cards are the primary expression of the design system. They must feature `backdrop-filter: blur(12px)`, the semi-transparent white background, and the subtle mint "aura" border. Avoid stacking too many cards; use whitespace to let the glass effect breathe.

### Inputs
Input fields use a more opaque version of the surface color to ensure text entry clarity. On focus, the border transitions from soft mint to a solid 2px mint stroke with a subtle glow.

### Lists & Chips
Chips use a light mint tint (`rgba(0, 209, 178, 0.1)`) with Deep Teal text for maximum readability. Lists should be separated by thin, low-opacity mint dividers rather than harsh gray lines.

### Tooltips & Overlays
These should use a higher blur value (20px+) to create a "frost" effect that clearly separates the overlay from the content below it.