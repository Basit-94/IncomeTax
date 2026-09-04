---
name: flutter-ui-design
description: "Fintech UI/UX best practices, virtual identity cards, drag-and-drop feedback states, and sovereign financial tracking inspired by arturssmirnovs/flutter-ui-design-list-collection."
---

# Flutter UI / UX Design Patterns for Sovereign Fintech

Inspired by the [arturssmirnovs/flutter-ui-design-list-collection](https://github.com/arturssmirnovs/flutter-ui-design-list-collection) repository of high-polish mobile and desktop applications.

## Fintech Design Principles
1. **Virtual Identity Cards**:
   - Skewed, realistic card designs for PAN and Aadhaar identity tokens.
   - Hologram accents, watermarks, official emblems, and copyable numbers.
   - Reveal/Mask security toggles for sensitive numbers.

2. **Drag-and-Drop Document Upload**:
   - High-affordance dropzones with dashed borders, centered icons, and supported file format tags.
   - Micro-state transitions: `idle` -> `reading/extracting (with spinner)` -> `success (with verified checkmark)` -> `error (with inline resolution)`.
   - Automatic background ingestion without intrusive confirmation dialogs.

3. **Metric Dashboards & Asset Trackers**:
   - Clean tabular numerals with Indian currency formatting (`₹1,25,000`).
   - Clear distinction between "Taxes Deducted (TDS)", "Advance Tax Paid", and "Estimated Refund Due".
   - Non-cluttered summary cards with micro-labels and statutory section citations (s.87A, s.192, s.245).
