/**
 * Money and date formatting.
 *
 * Indian digit grouping is not the western one — ₹4,20,000, not ₹420,000 —
 * and getting it wrong is the kind of detail that tells a citizen immediately
 * that a product was not built for them. `Intl` handles it correctly for
 * `en-IN`, so there is no reason to hand-roll a lakh/crore grouper.
 *
 * Digits stay Latin in all three languages. Devanagari and Tamil numerals are
 * correct, and `Intl` will produce them if asked, but almost nobody in India
 * reads money in them — and money is the one thing on these screens that has
 * to be legible before anything else.
 */

import type { Lang } from "./types";

const LOCALE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
};

/** ₹4,20,000 — whole rupees, no paise. */
export function formatMoney(rupees: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(rupees);
}

/** 4,20,000 — for places where the ₹ is already in the label. */
export function formatAmount(rupees: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(rupees);
}

/**
 * 12 May 2026 · 12 मई 2026 · 12 மே 2026.
 *
 * Provenance lines are read as a sentence, so the month is spelled out. A
 * citizen checking whether their employer filed on time should not have to
 * decode 12/05/2026 — which in this country could also be 5 December.
 */
export function formatDate(iso: string, lang: Lang = "en"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  }).format(new Date(`${iso}T00:00:00`));
}

/** 12 May — for timelines, where the year is already established. */
export function formatDayMonth(iso: string, lang: Lang = "en"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric",
    month: "short",
    numberingSystem: "latn",
  }).format(new Date(`${iso}T00:00:00`));
}
