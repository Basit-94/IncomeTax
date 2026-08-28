# Onboarding audit (T3.1) — every question, and whether it earns its place

**Date:** 2026-08-28 · Verified by grep against the code, not by reading the UI.
Rubric per PLAN.md T3.1: *needed for the return* / *needed for the dashboard* / *derivable from a
document or an earlier answer* / *redundant*.

## The screens as found (profile v1)

| # | Screen | Question | Consumed by | Verdict |
|---|--------|----------|-------------|---------|
| 1 | language | Which language? | everything | **Keep.** Owns the language task on this screen (DESIGN §9A); the header menu yields here. |
| 2 | intent | What brought you here? | `getDashboardDestination` — changes the landing surface | **Keep.** |
| 3 | situation | Your work? (`profession`) | `getPersonalization` regime lens; dashboard strip | **Keep, but it must feed the wizard** — see the duplication table. |
| 3 | situation | Filed before? (`filingHistory`) | v1 `guided` heuristic | **Keep** (context signal; no longer decides guidance in v2). |
| 4 | income | Income band? | **Display only** — echoed on the dashboard profile strip. No computation, no personalization, no destination reads it. | **DELETED (T3.2).** Asked-but-unused is the definition of a question that does not earn its place. The real income arrives later from facts and documents, more accurately than a self-reported band. |
| 5 | focus | What's on your mind? (`focuses`) | `guided` (v1), `regimeLens` | **Keep.** |

## Repeated questions across the journey (the user's explicit ban)

| Asked at | Asked again at | Status |
|----------|----------------|--------|
| onboarding `profession` | wizard `employmentType` | **Open — T3.5.** Map salaried→salaried, self_employed→freelancer, business_owner→business, retired→pension; ask in the wizard only for the ambiguous cases (student / investor / other). |
| landing PAN input | wizard PAN field | **Open — T3.5.** The wizard must pre-fill from the landing value. |
| onboarding `language` | header language menu on the same screen | **Fixed earlier** (`showLanguage={step !== "onboarding"}`, DESIGN §9A). |

## What changed (profile v2, T3.2–T3.4)

- **`incomeBand` deleted.** Screen 4 now asks the **mode** question instead — *"Do it for me"*
  (simple) vs *"Show me everything"* (full) — so the question count is unchanged: one question
  that earned nothing was exchanged for the one the product's thesis requires.
- **`mode` is the guidance level.** `getPersonalization` reads the user's explicit choice;
  the old heuristic (`filingHistory === "never" || focuses includes "not_sure"`) survives only
  as the migration default. A first-time filer who asks for full detail gets full detail —
  tested.
- **v1 profiles migrate, never invalidate.** A stored v1 profile loads as v2 with `mode`
  derived from the old heuristic and is re-saved — nobody is sent back through onboarding to
  re-answer questions we hold answers to. Tested.
- **Strings landed in all three dictionaries** (en/hi/ta), matching the intent screen's
  label + detail pattern.

## Dead code flagged, not deleted (per the standing rule)

- `OnboardingIncomeBand` type and `INCOME_BANDS` in `lib/onboarding.ts`
- `incomeQuestion` / `incomeHelp` / `incomeOptions` keys in all three dictionaries
- `t.dashboard.personalized.profileLabels.income` label

## Still owed before the onboarding page is LOCKED

- **T3.5** — wizard dedup (profession→employmentType, PAN pre-fill).
- **§4B page review** — the two persona passes have not run on the new mode screen. The page is
  changed, verified by typecheck + tests, but **not locked**.
