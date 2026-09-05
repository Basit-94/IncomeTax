/**
 * What the assistant says (plan.md §5.8). Deterministic templates carry every
 * fact — figures, statuses, citations — and the model may only rephrase them.
 * A validator keeps the phrasing honest: any rupee figure in the model's text
 * must already appear in the brief, and forbidden claims ("filed", "paid")
 * outside the brief drop the phrasing back to the template.
 */

import { agenticStrings, type AgenticStrings } from "../i18n/agenticStrings";
import { languageOption } from "../i18n/languages";
import { formatMoney } from "../money";
import type { Lang } from "../types";
import type { ModelAdapter, PhraseInput } from "./model";

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function strings(lang: Lang): AgenticStrings {
  return agenticStrings(lang);
}

export function regimeName(regime: "new" | "old", lang: Lang): string {
  // Kept as the plain English pair in all languages: the words are the ones on every official form.
  return regime === "new" ? (lang === "hi" ? "नई" : lang === "ta" ? "புதிய" : "new") : lang === "hi" ? "पुरानी" : lang === "ta" ? "பழைய" : "old";
}

export interface RecommendationFacts {
  cheaper: "new" | "old";
  saving: number;
  taxableIncome: number;
  totalTax: number;
  refundOrDue: number;
}

/** The deterministic recommendation, which is also the brief the model may rephrase. */
export function recommendationText(f: RecommendationFacts, lang: Lang): string {
  const s = strings(lang);
  const head = f.saving === 0 ? s.regimesEqual : fill(s.recommendRegime, { regime: regimeName(f.cheaper, lang), saving: formatMoney(f.saving, lang) });
  const rows = [
    `${s.rowTaxableIncome}: ${formatMoney(f.taxableIncome, lang)}`,
    `${s.rowTotalTax}: ${formatMoney(f.totalTax, lang)}`,
    f.refundOrDue >= 0 ? `${s.rowRefund}: ${formatMoney(f.refundOrDue, lang)}` : `${s.rowDue}: ${formatMoney(-f.refundOrDue, lang)}`,
  ];
  // The human sentence about the outcome (docs/VOICE.md) repeats the same figure the rows carry — nothing new.
  const cheer = f.refundOrDue > 0 ? fill(s.cheerRefund, { amount: formatMoney(f.refundOrDue, lang) }) : f.refundOrDue < 0 ? fill(s.cheerDue, { amount: formatMoney(-f.refundOrDue, lang) }) : s.cheerNil;
  return `${head}\n${rows.join("\n")}\n${cheer}`;
}

const FORBIDDEN_CLAIMS = /\b(has been filed|was filed|successfully filed|payment (was|has been) made|paid to the department|submitted to the (department|government))\b/i;

/** Keep only phrasing whose figures and claims are all in the brief. */
export function validatePhrasing(brief: string, phrased: string): boolean {
  const figures = phrased.match(/₹\s?[\d,]+/g) ?? [];
  const briefFigures = new Set((brief.match(/₹\s?[\d,]+/g) ?? []).map((x) => x.replace(/\s/g, "")));
  if (figures.some((f) => !briefFigures.has(f.replace(/\s/g, "")))) return false;
  if (FORBIDDEN_CLAIMS.test(phrased) && !FORBIDDEN_CLAIMS.test(brief)) return false;
  if (phrased.length > brief.length * 4 + 400) return false;
  return true;
}

/**
 * Say it: the template always exists; the model's version is used only when
 * it survives validation. Returns the text and the tokens the attempt cost.
 */
export async function say(
  model: ModelAdapter,
  brief: string,
  shape: PhraseInput["shape"],
  lang: Lang,
): Promise<{ text: string; tokens: number; phrased: boolean }> {
  const attempt = await model.phrase({ brief, lang, langEnglishName: languageOption(lang).english, shape });
  if (attempt && validatePhrasing(brief, attempt.text)) {
    return { text: attempt.text, tokens: attempt.usage.tokens, phrased: true };
  }
  return { text: brief, tokens: attempt?.usage.tokens ?? 0, phrased: false };
}
