---
name: UTH[AI]-EVN - Aura Edition Design System
version: 2.0.0
brand: UTH[AI]-EVN (Clinical Infrastructure OS)
theme_modes: [DARK, LIGHT]
---

# UTH[AI]-EVN: Aura Edition Design System

## 1. Visual Identity & Brand
The **UTH[AI]-EVN** brand represents a futuristic, AI-driven clinical infrastructure management platform. The visual language is defined by high-tech "Aura" aesthetics, combining data density with immersive motion.

*   **Primary Logo:** `UTH[AI]-EVN`
*   **Highlight:** The `[AI]` suffix is emphasized with a neon cyan/lime highlight to signal the intelligence layer powering the system.

## 2. Color Palettes & Modes

### Dark Mode (Authority)
*   **Background:** `#00161b` (Deep Teal)
*   **Surface (Cards):** `rgba(0, 22, 27, 0.6)` (Translucent Surface-Dim)
*   **Text (Main):** `#FFFFFF`
*   **Text (Muted):** `#A1B5BB`

### Light Mode (Clinical)
*   **Background:** `#f3fbf7` (Luminous Mint)
*   **Surface (Cards):** `rgba(255, 255, 255, 0.7)` (Translucent White)
*   **Text (Main):** `#00161b`
*   **Text (Muted):** `#5A7177`

### Neon Accents (The Aura)
*   **Primary Neon Cyan:** `#00F0FF`
*   **Primary Neon Lime:** `#CCFF00`
*   **Aura Gradient:** `conic-gradient(from var(--border-angle), transparent 20%, #00F0FF 40%, #CCFF00 50%, #00F0FF 60%, transparent 80%)`

## 3. The "Aura Edition" Card Architecture

All primary widgets and data modules follow a strict **3D Glassmorphism** and **Animated Aura** specification.

### Structure
1.  **Container:** Rounded corners (`24px`).
2.  **Backdrop:** `backdrop-filter: blur(12px)` for depth.
3.  **The Aura (Border):** A 1.5px outer stroke animated by a rotating conic gradient.
4.  **3D Elevation:** Deep, soft shadows to create a "floating" effect above the dashboard grid.

### CSS Technique: Masked Border Animation
The aura effect is restricted *strictly* to the border edge using a layered pseudo-element approach to prevent light bleed into the content area.

```css
.aura-card {
    position: relative;
    border-radius: 24px;
    background: var(--surface-color);
    backdrop-filter: blur(12px);
    z-index: 1;
}

/* The Rotating Aura Layer */
.aura-card::before {
    content: '';
    position: absolute;
    inset: -1.5px; /* Stroke width */
    background: conic-gradient(from var(--angle), transparent, #00F0FF, #CCFF00, #00F0FF, transparent);
    border-radius: inherit;
    animation: rotate 4s linear infinite;
    z-index: -1;
}

/* The Content Mask Layer */
.aura-card::after {
    content: '';
    position: absolute;
    inset: 0.5px;
    background: inherit;
    border-radius: inherit;
    z-index: -1;
}
```

## 4. Typography
*   **Main Font:** `Plus Jakarta Sans`
*   **Headlines:** Bold, tracking-tight, uppercase for section labels.
*   **Data Points:** High-contrast weights for numerical telemetry.

## 5. Module-Specific Design Logic
*   **Emergency Shutdown:** Always anchored (bottom-left or top-right) with a high-visibility red highlight.
*   **Status Indicators:** Pulsing "Live" badges for active data streams.
*   **Telemetry Grids:** 2-3 column layout with consistent gutter spacing for high information density.

---
*This document serves as the design authority for all UTH[AI]-EVN interface development.*
