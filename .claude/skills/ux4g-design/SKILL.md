---
name: ux4g-design
description: Review or build citizen-facing Indian government UI against UX4G (MeitY/NeGD design system) and GIGW 3.0 / WCAG 2.1 AA. Use when designing, changing, or auditing any screen a citizen sees - forms, error states, language switching, colour and contrast, focus, touch targets - or when asked whether the UI is accessible or government-compliant.
---

# UX4G / GIGW design review

India's government design standard, as an actionable checklist. Two documents matter:

- **UX4G** (User Experience for Government Applications) - the design system from NeGD under
  MeitY, Digital India Programme. Components, tokens, patterns. <https://www.ux4g.gov.in/>
- **GIGW 3.0** (Guidelines for Indian Government Websites and Apps, NIC/MeitY) - the compliance
  standard. **88 mandatory checkpoints** across accessibility, quality, cybersecurity, and
  lifecycle management. Accessibility floor is **WCAG 2.1 Level AA**.
  <https://guidelines.india.gov.in/>

GIGW compliance is a condition of digital service delivery under Digital India, and aligns with
the Rights of Persons with Disabilities Act 2016. For a real government service this is a legal
posture, not a style preference.

## What UX4G assumes about your user

This is the part teams skip, and it is the part that changes designs. UX4G states its target
context explicitly: **low-literacy users, VLE (Village Level Entrepreneur) kiosks, 2G network
connectivity, and the 22 scheduled languages.** Its own instruction: *"Design with these in mind,
not just the happy path."*

Concretely, that means these are defects, not trade-offs:

- Copy that needs a literate reader to parse a clause before acting.
- A flow that only works on a fast connection, or that loses entered data when one fails.
- A screen that reads correctly only in English because the layout assumes English word order
  or string length.
- An interaction that needs a hover, a precise cursor, or a second screen.

## The review checklist

Work top to bottom. Each item is checkable by observation - open the page and test it. Do not
mark an item passed because the code looks right; the criteria below are about what a person
experiences.

### 1. Perceivable

- [ ] **Text contrast >= 4.5:1** (WCAG 1.4.3). Large text - 18pt, or 14pt bold - may be 3:1.
      Check the muted/secondary text colours especially; that is where designs fail.
- [ ] **Non-text contrast >= 3:1** (1.4.11) for UI component boundaries, icons carrying meaning,
      focus indicators, and chart/graph elements that convey data.
- [ ] **Colour is never the only carrier of meaning** (1.4.1). A red border alone does not say
      "error"; a green tick alone does not say "confirmed". Pair with text or shape.
- [ ] **Reflow at 320 CSS px** (1.4.10) with no two-dimensional scrolling. Test at 320px wide -
      this is the kiosk and low-end-phone case UX4G names.
- [ ] **Resize to 200%** (1.4.4) with no loss of content or function.
- [ ] **Text spacing override** (1.4.12) does not clip content.

### 2. Operable

- [ ] **Every interactive element is keyboard reachable and operable** (2.1.1), in a sensible
      order (2.4.3), with **no keyboard trap** (2.1.2).
- [ ] **Focus is visibly indicated** (2.4.7) on every focusable element - including custom
      controls built from div/span. A removed outline with no replacement is a failure.
- [ ] **Touch targets are large enough.** WCAG 2.1 puts 44x44 CSS px at AAA (2.5.5); WCAG 2.2
      adds a 24x24 AA floor (2.5.8). For kiosk and rural-phone use, treat **44x44 as the working
      target**, not the aspiration.
- [ ] **Nothing depends on hover** to be discoverable or usable.
- [ ] **Timed steps are adjustable or absent** (2.2.1). An OTP that expires silently and discards
      entered data fails both this and the user's trust.

### 3. Understandable

- [ ] **Page language is declared** (3.1.1) - `<html lang>` must match what is rendered, and
      must update when the user switches language.
- [ ] **Passages in another language are marked** (3.1.2) - a `lang` attribute on the inline run.
- [ ] **`dir="rtl"` is set** for Urdu, Kashmiri, and Sindhi. Setting the language without the
      direction produces text that is technically translated and practically unreadable.
- [ ] **Every input has a programmatically associated label** (3.3.2, 1.3.1) - a real `<label
      for>` or `aria-label`, not placeholder text acting as a label.
- [ ] **`autocomplete` is set on identity fields** (1.3.5) - name, phone, email, address.
- [ ] **Errors identify the field and say how to fix it** (3.3.1, 3.3.3). "Invalid input" fails.
      Name what is wrong and what right looks like.
- [ ] **Consistent navigation and identification** (3.2.3, 3.2.4) across screens.
- [ ] **Language switching is discoverable** without reading English first - label each language
      in its own script, never only in Latin.

### 4. Financial and legal submissions (GIGW-critical)

- [ ] **WCAG 3.3.4 Error Prevention (Legal, Financial, Data)** applies to any submission that is
      legally binding, moves money, or writes to a citizen record. It requires **at least one**
      of: the submission is reversible; the data is checked and the user can correct errors; or
      the user gets an explicit confirmation step to review and confirm before committing.
      A tax return, a grievance, a benefit claim, and a payment all fall under this.
- [ ] **The consequence of not finishing is stated**, in money and time, before the user leaves.
- [ ] **Nothing irreversible happens without a human confirming the figures it will commit.**

### 5. Structure and assistive technology

- [ ] **Headings are real and ordered** (1.3.1, 2.4.6) - h1 then h2, not styled divs.
- [ ] **Custom controls expose name, role, and value** (4.1.2). A clickable div needs `role`,
      `tabindex`, keyboard handlers, and state (`aria-checked`, `aria-expanded`).
- [ ] **Images have text alternatives** (1.1.1); decorative images are `aria-hidden` or `alt=""`.
- [ ] **Page has a title that describes it** (2.4.2) and a skip link to main content (2.4.1).
- [ ] **Status changes are announced** - live regions for async results, not silent DOM swaps.

### 6. UX4G component conventions

- [ ] **Material Design Icons at 24px** - the size UX4G component slots expect.
- [ ] **Primary colour drives all interactive states** - buttons, links, focus rings, progress.
      Secondary and tertiary exist as design-workflow tokens and are not applied to components.
- [ ] Before designing a component from scratch, check whether UX4G already defines it and read
      its usage notes - they carry government-specific constraints not visible in the visual.

## Sourcing discipline

UX4G's exact token values - hex codes, the type scale, the spacing ramp - live in its Figma kit
and Storybook, which are not readable as static text. **Do not quote specific UX4G hex values or
pixel scales from memory.** If a review needs them, say they must be checked against the Figma
Design Kit or `doc.ux4g.gov.in`, and review against the WCAG criteria above instead, which are
normative and verifiable by measurement.

When reporting, separate:
- **Fails** - a criterion above is measurably not met. Name the criterion and the measurement.
- **Risks** - likely a problem but not measured, or dependent on an unverified UX4G value.
- **Not applicable** - say why, rather than silently dropping it.

Never report a contrast ratio, a target size, or a zoom result you did not actually measure.
