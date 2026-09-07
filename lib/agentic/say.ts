/**
 * The conversational layer (user direction 2026-09-06: "the chatbot feels
 * hardcoded, I don't want the same responses ever… a lot of unnecessary fluff").
 *
 * Every conversational turn is phrased by the model from a structured brief and
 * then checked; a deterministic template is the fallback, never the first
 * choice. What the check enforces is what keeps this safe (plan.md §5.3):
 *
 *  - no figure the brief did not contain (digits are compared as sets);
 *  - no claim that anything was filed, paid or submitted unless the brief says so;
 *  - no advice words unless the turn IS the recommendation;
 *  - no self-description — "no jargon", "honest", "friend who happens to be…"
 *    are themselves fluff and are rejected;
 *  - required terms present (a question about Form 16 must say "Form 16");
 *  - not a repeat of something said earlier in the run.
 *
 * Register: a person who writes in romanised Hindi is answered in Hinglish.
 */

import { languageOption } from "../i18n/languages";
import type { Lang } from "../types";
import type { ModelAdapter } from "./model";

export type Register = "plain" | "hinglish";

const HINGLISH_MARKERS =
  /\b(mujhe|mera|meri|mere|hai|hain|nahi|nahin|kya|kaise|karna|karni|karo|kardo|batao|bata|chahiye|kitna|kitni|kaun|kaunsa|kab|bhi|toh|abhi|paisa|paise|naukri|tankha|bharna|bharni|milta|mili|mila|lagega|lagta|hoga|hogi|wala|wali|bhai|yaar|accha|acha|theek|haan|aap|aapka|hum|humara|kyun|kyu|matlab|samjhao|zaroori|jaldi)\b/gi;

/** Romanised Hindi: Latin script with at least two distinct Hindi function words. Only for English/Hindi UIs. */
export function detectRegister(text: string, lang: Lang): Register {
  if (lang !== "en" && lang !== "hi") return "plain";
  if (/[ऀ-ॿ]/.test(text)) return "plain"; // Devanagari is Hindi proper, handled by the hi dictionary
  const found = new Set((text.toLowerCase().match(HINGLISH_MARKERS) ?? []).map((w) => w.toLowerCase()));
  return found.size >= 2 ? "hinglish" : "plain";
}

export interface SayContext {
  model: ModelAdapter;
  lang: Lang;
  register: Register;
  /** First name, or "" when none should be used. */
  name: string;
  /** The last few things the agent said, so wording is not repeated. */
  recent: string[];
  /** Charges the day's budget with the tokens a call used. */
  charge: (tokens: number) => Promise<void>;
  /** Called whenever the fallback is used, with the reason — a model that is off, failing or over-reaching is never silent. */
  onFallback?: (reason: string) => Promise<unknown> | void;
}

export interface SayInput {
  /** What this turn has to do, in one plain sentence for the model. */
  intent: string;
  /** Facts the model may state, each verbatim. Figures appear ONLY here. */
  facts?: string[];
  /** Terms that must appear in the output (e.g. "Form 16"). */
  mustContain?: string[];
  /** The deterministic sentence used when the model is off or its output fails the check. */
  fallback: string;
  maxWords?: number;
  /** Only the recommendation turn may use advice words. */
  allowAdvice?: boolean;
  /** `chat` (default) for a turn; `review` for a result that carries a table of figures the model must keep. */
  shape?: "chat" | "review" | "explanation";
}

const META = /\b(no (jargon|fluff|nonsense)|jargon|plain (words|english|language)|honest(ly)?( speaking)?|friend who|happens to be an? (ca|chartered)|say-so|i'?m here to help|as an? (ai|assistant|friend)|i promise|rest assured|don'?t worry|no worries)\b/i;
const CLAIMS = /\b(filed|paid|submitted|sent to|e-verified|refund (is|has been) (issued|credited))\b/i;
const ADVICE = /\b(suggest|recommend|advise|advice|eligible|eligibility|you should|you must|make sure|opt for|choose|switch to|better for you|cheaper for you)\b/i;

const digitsOf = (s: string) => new Set((s.replace(/[, ]/g, "").match(/\p{Nd}+/gu) ?? []).map((d) => d.replace(/^0+(?=\d)/, "")));
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{Nd}]+/gu, " ").trim();

/** The check, with the reason it failed. Exported for tests; the runtime never bypasses it. */
export function whyRejected(text: string, input: SayInput, recent: string[] = []): string | null {
  const t = text.trim();
  if (!t) return "empty";
  const words = t.split(/\s+/).length;
  if (words > (input.maxWords ?? 60) * 1.5) return `too long (${words} words)`;
  const allowed = digitsOf([...(input.facts ?? []), ...(input.mustContain ?? []), input.fallback].join(" "));
  for (const d of digitsOf(t)) if (!allowed.has(d)) return `figure not in brief (${d})`;
  const meta = META.exec(t);
  if (meta) return `self-description ("${meta[0]}")`;
  if (CLAIMS.test(t) && !CLAIMS.test((input.facts ?? []).join(" "))) return "claims an action the brief did not state";
  const advice = !input.allowAdvice && ADVICE.exec(t);
  if (advice) return `advice wording ("${advice[0]}")`;
  for (const term of input.mustContain ?? []) if (!t.toLowerCase().includes(term.toLowerCase())) return `missing required term "${term}"`;
  const n = norm(t);
  if (recent.some((r) => norm(r) === n)) return "repeats an earlier sentence";
  return null;
}

export function validateSaid(text: string, input: SayInput, recent: string[] = []): boolean {
  return whyRejected(text, input, recent) === null;
}

/**
 * One conversational turn. Returns the model's sentence when it passes the
 * check, otherwise the fallback — callers never need to branch.
 */
export async function say(ctx: SayContext, input: SayInput): Promise<string> {
  if (ctx.model.name === "none") {
    await ctx.onFallback?.("model off");
    return input.fallback;
  }
  const brief = [
    `Intent: ${input.intent}`,
    input.facts?.length ? `Facts you may state, figures exactly as written:\n${input.facts.map((f) => `- ${f}`).join("\n")}` : "State no figures, dates or amounts.",
    input.mustContain?.length ? `Must mention: ${input.mustContain.join("; ")}.` : "",
    input.shape === "review" ? "If the facts include a markdown table, keep the table rows exactly as given and say the rest in your own words around it." : "",
    ctx.name ? `The person's first name is ${ctx.name}; use it at most once, only if natural.` : "No name is known; do not invent one.",
    ctx.recent.length ? `Already said in this conversation (do not repeat the wording):\n${ctx.recent.map((r) => `- ${r.slice(0, 160)}`).join("\n")}` : "",
    `At most ${input.maxWords ?? 60} words.`,
    ctx.register === "hinglish"
      ? "Write in Hinglish: Hindi in Latin letters, the way people text in India, mixing English tax words naturally (e.g. 'Form 16 mil gaya, ab bas PF ka amount batao'). Not Devanagari."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const out = await ctx.model.phrase({ brief, lang: ctx.lang, langEnglishName: languageOption(ctx.lang).english, shape: input.shape ?? "chat" });
  if (!out) {
    await ctx.onFallback?.(ctx.model.lastFailure?.() ?? "no reply");
    return input.fallback;
  }
  await ctx.charge(out.usage.tokens);
  const reason = whyRejected(out.text, input, ctx.recent);
  if (reason) {
    await ctx.onFallback?.(`reply rejected: ${reason}`);
    return input.fallback;
  }
  return out.text.trim();
}
