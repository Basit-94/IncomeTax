/**
 * The agent's voice (user request 2026-09-05: "not just a tax assistant, but a
 * friend CA who is just happy to help — I want a soul in my agent").
 *
 * Wapsi speaks like a friend who happens to be a chartered accountant: warm,
 * plain, curious about you, glad when the news is good, calm when it is not,
 * honest about what it cannot do, never preachy, never salesy. See docs/VOICE.md.
 *
 * How the soul stays safe (plan.md §5.3, §5.8): every FACT — a figure, a rule,
 * a date, an action — comes from a deterministic template. This module adds
 * three things around those facts: small-talk replies (deterministic), rotating
 * lead-ins so questions do not sound like a form (deterministic), and an
 * optional one-line warmth from the model that is accepted only if it contains
 * no digit, no rupee sign, no section reference and no claim of an action.
 */

import type { AgenticStrings } from "../i18n/agenticStrings";
import { languageOption } from "../i18n/languages";
import type { Lang } from "../types";
import type { ModelAdapter } from "./model";
import { fill } from "./response";

export type SmallTalk = "hello" | "thanks" | "who" | "help" | "howAreYou" | "bye";

const PATTERNS: [SmallTalk, RegExp][] = [
  ["thanks", /^(thanks?( you| a lot| so much)?|thank u|thx|ty|cheers|dhanyavaad|dhanyawad|shukriya|nandri|much appreciated)\b[\s!.]*$/i],
  ["bye", /^(bye|goodbye|see you|see ya|take care|good night|ok bye|that'?s all|done for now)\b[\s!.]*$/i],
  ["howAreYou", /^(how are you|how'?s it going|how do you do|kaise ho|kaise hain|what'?s up|sup)\b[\s?!.]*$/i],
  ["who", /^(who are you|what are you|are you (a )?(bot|human|real|ai)|what is wapsi|who is this|introduce yourself)\b[\s?!.]*$/i],
  ["help", /^(help|what can you do|what do you do|how can you help( me)?|what are my options|show me what you can do|menu)\b[\s?!.]*$/i],
  ["hello", /^(hi+|hello+|hey+|hiya|yo|namaste|namaskar|namaskaram|vanakkam|sat sri akal|salaam|as-?salamu alaikum|good (morning|afternoon|evening)|hola)\b[\s,!.]*(wapsi|there|friend|bhai|ji)?[\s!.]*$/i],
];

/** Small talk is short and matches a whole-message pattern; anything with substance falls through to the real classifier. */
export function detectSmallTalk(text: string): SmallTalk | null {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t || t.split(" ").length > 8) return null;
  for (const [kind, re] of PATTERNS) if (re.test(t)) return kind;
  return null;
}

export function firstName(displayName: string | undefined | null): string {
  const n = (displayName ?? "").trim().split(/\s+/)[0] ?? "";
  // A masked or synthetic display name ("Citizen 7710") is not a name to greet with.
  return /^[A-Za-zऀ-෿฀-๿ក-៿]+$/.test(n) && !/^citizen$/i.test(n) ? n : "";
}

export function smallTalkReply(kind: SmallTalk, s: AgenticStrings, name: string): string {
  switch (kind) {
    case "hello":
      return name ? fill(s.chatHello, { name }) : s.chatHelloAnon;
    case "thanks":
      return s.chatThanks;
    case "who":
      return s.chatWho;
    case "help":
      return s.chatHelp;
    case "howAreYou":
      return s.chatHowAreYou;
    case "bye":
      return name ? fill(s.chatBye, { name }) : s.chatByeAnon;
  }
}

/** A short human lead before a question, rotating so a run never reads like a form. */
export function questionLead(answered: number, s: AgenticStrings, kind: "question" | "file"): string {
  if (kind === "file") return s.leadDoc;
  if (answered === 0) return s.leadFirst;
  const next = [s.leadNext1, s.leadNext2, s.leadNext3];
  return next[(answered - 1) % next.length];
}

/** Digits in any script, rupee signs, section references and action claims are all disqualifying. */
export function validateWarmth(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 240) return false;
  if (/[\p{Nd}₹%]/u.test(t)) return false;
  if (/\b(section|sec\.?|s\.|itr|form|80[a-z]|87a|115bac|139)\b/i.test(t)) return false;
  if (/\b(filed|paid|submitted|sent to|deducted|refund of|owe|payable|saving of)\b/i.test(t)) return false;
  // Warmth is not advice: anything that suggests, recommends, judges eligibility or tells the person what to do is out.
  if (/\b(suggest|recommend|advise|advice|eligible|eligibility|claim(ing)?|you should|you must|make sure|opt for|choose|switch)\b/i.test(t)) return false;
  if (/\n/.test(t)) return false;
  return true;
}

export interface WarmthContext {
  lang: Lang;
  name: string;
  /** What just happened, in words the model may colour but not change. */
  moment: "recommendation_refund" | "recommendation_due" | "recommendation_nil" | "filed" | "abstained";
}

/**
 * One warm sentence from the model, or null. The brief carries no figures on
 * purpose, so there is nothing to get wrong; the validator rejects any figure,
 * rule or claim the model invents. Callers fall back to a deterministic line.
 */
export async function warmLine(model: ModelAdapter, ctx: WarmthContext): Promise<{ text: string; tokens: number } | null> {
  if (model.name === "none") return null;
  const brief = [
    `Moment: ${ctx.moment.replace(/_/g, " ")}.`,
    ctx.name ? `The person's first name is ${ctx.name}; use it once, naturally.` : "No name is available; do not invent one.",
    "Write ONE warm, plain sentence (max 25 words) a friend who is a chartered accountant would say at this moment — encouragement or reassurance only.",
    "Do not advise, suggest, recommend, or say what the person is eligible for or should do: the figures and the recommendation follow separately and are not yours to state.",
    "No numbers, no rupee amounts, no sections or form names, no claims that anything was filed or paid.",
  ].join(" ");
  const out = await model.phrase({ brief, lang: ctx.lang, langEnglishName: languageOption(ctx.lang).english, shape: "warm" });
  if (!out) return null;
  return validateWarmth(out.text) ? { text: out.text.trim(), tokens: out.usage.tokens } : { text: "", tokens: out.usage.tokens };
}
