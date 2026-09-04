# Wapsi (वापसी) Design System (DESIGN.md)

This document defines the visual design system, aesthetic rules, tokens, and component patterns for Wapsi.

---

## 1. Visual Theme: "Direction 13" (Graph Paper & Index Cards)

Wapsi's signature aesthetic is **Direction 13**: an authoritative, physical case-file workspace.
- **The Desk**: The root page is styled as graph paper on an accountant's desk (`--desk`).
- **The Index Cards**: Every card, section, and modal is a physical index card (`--paper`) sitting on the desk.
- **The Ink**: Sharp, legible typography (`--ink`) reminiscent of typewriter print and government gazettes.
- **The Rubber Stamps**: Rotated stamp chips (`.stamp-chip`) displaying PAN numbers, tax assessment years, and statutory sections.

---

## 2. Color Palette & Semantic Tokens

### Canvas & Surfaces
| Token | Light Mode | Dark Mode | Description |
| :--- | :--- | :--- | :--- |
| `--desk` | `#f4f2eb` (Warm graph paper) | `#0b0f19` (Dark blueprint) | Background canvas |
| `--paper` | `#faf8f3` (Warm ivory index card) | `#141b2d` (Dark case-file slate) | Primary surface panel |
| `--paper-2` | `#f0ede4` | `#1c2438` | Secondary nested surface |
| `--paper-3` | `#e7e3d8` | `#232d44` | Inset input background |
| `--line` | `#d8d2c4` | `#2c3954` | 1px card and table borders |

### Typography & Ink
| Token | Light Mode | Dark Mode | Description |
| :--- | :--- | :--- | :--- |
| `--ink` | `#111827` (Deep charcoal ink) | `#f8fafc` (Chalk white) | Primary headings & values |
| `--ink-2` | `#4b5563` (Muted gray) | `#94a3b8` (Slate secondary) | Descriptions & labels |
| `--ink-3` | `#6b7280` (Subtle annotation) | `#64748b` | Footers & timestamps |

### Brand & Functional Accents
| Token | Color | Usage |
| :--- | :--- | :--- |
| `--navy` | `#0f172a` / `#1e3a8a` | Primary actions, sovereign authority, header badges |
| `--money` | `#059669` / `#10b981` | Tax refunds, validated banks, positive balances |
| `--amber` | `#d97706` / `#f59e0b` | Citizen Vault accents, gold seals, statutory warnings |
| `--alarm` | `#dc2626` / `#ef4444` | Defective notice 139(9), demand tax, validation errors |

---

## 3. Typography Hierarchy
- **Brand Title**: Sans-serif, Bold, `tracking-tight` (e.g. `Wapsi (वापसी)`).
- **Statutory / Identity Numbers**: Monospaced font (`font-mono tracking-widest uppercase`) for PAN (`DEMPS4417K`), Aadhaar (`•••• •••• 2345`), IFSC, and Challan BSR codes.
- **Currency Figures**: Monospaced tabular numerals with Indian numbering system grouping (`₹1,24,500`).
- **Multilingual Integrity**: Full typographical parity across all 23 official Indian languages.

---

## 4. Authentication & Vault Design Standards
- **Zero-Friction Entry**: Sign Up and Sign In ask strictly for the 10-character PAN. No redundant fields.
- **Sovereign Presentation**: No internal implementation noise (e.g., no "Port 5432" or technical jargon). Use citizen-facing terms like *"Encrypted Sovereign Tax Vault"* and *"CBDT AY 2026-27 Compliant"*.
- **Strict Security Barrier**: Unauthenticated visitors are confined to the secure entry portal. No bypass or guest access to internal returns.
- **Tactile Card Elevation**: Rounded-3xl container, multi-tier border shadows, and smooth pill tab selectors.
