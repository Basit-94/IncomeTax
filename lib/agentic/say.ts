/**
 * The check on what Munshi ji says (rebuilt 2026-09-07). The model now writes every conversational
 * sentence itself; this file keeps him honest about the one thing that matters most — figures.
 *
 *  - every digit sequence in a reply must already exist in what the model was shown this turn: the
 *    facts, the tool results, the person's own words, the statutory block (so "30%" or "₹1,50,000" are
 *    fine when they are the law, and "you'll get ₹9,999 back" is not unless the engine said so);
 *  - no claim that anything was filed, paid or submitted unless that event happened;
 *  - no identifier — a PAN or Aadhaar shape in the text is refused outright;
 *  - no self-description ("no jargon", "honestly", "I'm here to help") — that is the fluff.
 *
 * Register: a person who writes in romanised Hindi is answered in Hinglish.
 */

import type { Lang } from "../types";

export type Register = "plain" | "hinglish";

const HINGLISH_MARKERS =
  /\b(mujhe|mera|meri|mere|hai|hain|nahi|nahin|kya|kaise|karna|karni|karo|kardo|batao|bata|chahiye|kitna|kitni|kaun|kaunsa|kab|bhi|toh|abhi|paisa|paise|naukri|tankha|bharna|bharni|milta|mili|mila|lagega|lagta|hoga|hogi|wala|wali|bhai|yaar|accha|acha|theek|haan|aap|aapka|hum|humara|kyun|kyu|matlab|samjhao|zaroori|jaldi)\b/gi;

/**
 * The language Munshi ji replies in follows the person's latest message (user direction 2026-09-07: "reply in
 * whichever language the user is asking… right now, only keep these languages"): Devanagari → Hindi, romanised
 * Hindi → Hinglish, anything else → English. The interface language still labels the cards.
 */
export type ReplyLanguage = "en" | "hi" | "hinglish";

export function detectReplyLanguage(text: string): ReplyLanguage {
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  const found = new Set((text.toLowerCase().match(HINGLISH_MARKERS) ?? []).map((w) => w.toLowerCase()));
  return found.size >= 2 ? "hinglish" : "en";
}

/** How the reply language is named to the model. */
export function replyLanguageName(lang: ReplyLanguage): string {
  return lang === "hi" ? "Hindi (Devanagari script)" : lang === "hinglish" ? "Hinglish — Hindi in Latin letters the way people text in India, tax words left in English" : "English";
}

/** Romanised Hindi: Latin script with at least two distinct Hindi function words. Only for English/Hindi UIs. */
export function detectRegister(text: string, lang: Lang): Register {
  if (lang !== "en" && lang !== "hi") return "plain";
  if (/[ऀ-ॿ]/.test(text)) return "plain"; // Devanagari is Hindi proper, handled by the hi dictionary
  const found = new Set((text.toLowerCase().match(HINGLISH_MARKERS) ?? []).map((w) => w.toLowerCase()));
  return found.size >= 2 ? "hinglish" : "plain";
}

const META = /\b(no (jargon|fluff|nonsense)|jargon|plain (words|english|language)|honest(ly)?( speaking)?|friend who|happens to be an? (ca|chartered)|i'?m here to help|as an? (ai|assistant|language model|friend)|i promise|rest assured|don'?t worry|no worries)\b/i;
const CLAIMS = /\b(has been filed|was filed|is filed|successfully filed|i (have )?filed|payment (was|has been) made|has been paid|was paid|is paid|paid to the department|submitted to the (department|government)|e-verified)\b/i;
const PAN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
const AADHAAR = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;

/** Every digit sequence in a text, commas and spaces stripped, leading zeros dropped. Any script's digits. */
export const digitsOf = (s: string) => new Set((s.replace(/[, ]/g, "").match(/\p{Nd}+/gu) ?? []).map((d) => d.replace(/^0+(?=\d)/, "")));

/** Small numbers are ordinals, dates and counts ("two things", "31 July"); they are never a hallucinated rupee figure worth refusing. */
const SMALL = 31;

export interface ReplyCheck {
  /** Everything the model saw this turn — the digits in it are the only digits it may use. */
  allowed: Set<string>;
  /** True once a simulated filing or payment actually happened in this run. */
  actionHappened: boolean;
  maxWords?: number;
}

/** The reason a reply is refused, or null when it stands. Exported for tests; the brain never bypasses it. */
export function whyRejected(text: string, check: ReplyCheck): string | null {
  const t = text.trim();
  if (!t) return "empty";
  const words = t.split(/\s+/).length;
  if (words > (check.maxWords ?? 700)) return `too long (${words} words)`;
  if (PAN.test(t) || AADHAAR.test(t)) return "identifier in reply";
  for (const d of digitsOf(t)) {
    if (Number(d) <= SMALL) continue;
    if (!check.allowed.has(d)) return `figure not in the facts (${d})`;
  }
  const meta = META.exec(t);
  if (meta) return `self-description ("${meta[0]}")`;
  if (!check.actionHappened && CLAIMS.test(t)) return "claims an action that did not happen";
  return null;
}
