---
name: awesome-design-ui-kits
description: "Curated design systems, visual hierarchy, tactile textures, accessible color contrast, and financial dashboard kits inspired by goabstract/Awesome-Design-Tools."
---

# Awesome Design UI Kits: Design System Best Practices

Inspired by the [goabstract/Awesome-Design-Tools - Awesome Design UI Kits](https://github.com/goabstract/Awesome-Design-Tools/blob/master/Awesome-Design-UI-Kits.md) directory.

## Core Rules for Financial Portals
1. **Visual Hierarchy & Typographic Rhythm**:
   - Single authoritative `h1` per surface with tight letter-spacing (`tracking-tight`).
   - Clear contrast between body text and secondary annotations (`text-ink-2`, `text-ink-3`).
   - Dedicated monospaced styling for sensitive credentials (PAN, IFSC, Challan BSR codes, Dates).

2. **Tactile Textures & Form Depth**:
   - Avoid flat generic white boxes; use subtle surface tints (`bg-paper`, `bg-paper-2`, `bg-paper-3`).
   - Delicate line borders with 1px precision (`border border-line`).
   - High-contrast interactive states (subtle hover scale, active ring glow).

3. **Accessibility (WCAG 2.1 AA)**:
   - Minimum 4.5:1 text contrast ratio against background cards.
   - Distinct focus rings on keyboard navigation (`focus:ring-2 focus:ring-money focus:outline-hidden`).
   - Form inputs with clear, persistent labels and aria-describedby error associations.
