/**
 * The offline planner (plan D7). When the model is unavailable, this classifies the first
 * message with keywords, extracts what it can, and phrases questions from the schema
 * templates. The run is labelled "offline planner" so nobody mistakes it for the model.
 */
import type { TaskId } from "./events";
import { parseIndianAmount, formatRupees } from "./interview";
import { TASKS, type SlotSpec } from "./tasks";
import type { OnboardingProfile } from "../onboarding";

export interface Classification {
  taskId: TaskId;
  confidence: number;
  /** Facts the sentence already contains; each becomes a proposal the person confirms. */
  extracted: {
    employment?: "salaried" | "self_employed" | "business";
    salary?: number;
    revenue?: number;
    newJob?: boolean;
    firstTime?: boolean;
  };
  summary: string;
}

const ORDER: Exclude<TaskId, "unknown">[] = ["demo_persona", "respond_notice", "pay_tax", "check_refund", "business_benefits", "compare_regimes", "file_return"];

export function classifyOffline(text: string, profile?: OnboardingProfile | null): Classification {
  const t = text.toLowerCase();
  let best: { id: Exclude<TaskId, "unknown">; score: number } | null = null;
  for (const id of ORDER) {
    const score = TASKS[id].triggers.reduce((acc, trigger) => acc + (t.includes(trigger) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  const extracted: Classification["extracted"] = {};
  if (/\b(job|package|salary|ctc|employer|offer)\b/.test(t)) extracted.employment = "salaried";
  if (/\b(freelanc|consult|contract)/.test(t)) extracted.employment = "self_employed";
  if (/\b(business|shop|turnover|revenue|startup)\b/.test(t)) extracted.employment = "business";
  if (/\b(new job|got a job|joined|first job|started working)\b/.test(t)) extracted.newJob = true;
  if (/\b(first time|never filed|first return)\b/.test(t)) extracted.firstTime = true;
  const amount = parseIndianAmount(t);
  if (amount !== null && amount >= 10_000) {
    if (extracted.employment === "business" || best?.id === "business_benefits") extracted.revenue = amount;
    else extracted.salary = amount;
  }
  // Onboarding intent breaks a tie or fills the blank.
  let taskId: TaskId = best?.id ?? "unknown";
  if (taskId === "unknown" && profile) {
    taskId =
      profile.intent === "understand_notice"
        ? "respond_notice"
        : profile.intent === "check_refund"
          ? "check_refund"
          : profile.intent === "business_benefits"
            ? "business_benefits"
            : profile.intent === "explore"
              ? "unknown"
              : "file_return";
  }
  const bits: string[] = [];
  if (extracted.employment) bits.push(extracted.employment.replace("_", "-"));
  if (extracted.newJob) bits.push("new job");
  if (extracted.salary) bits.push(`salary about ${formatRupees(extracted.salary)}`);
  if (extracted.revenue) bits.push(`turnover about ${formatRupees(extracted.revenue)}`);
  if (extracted.firstTime || profile?.filingHistory === "never") bits.push("first-time filer");
  return {
    taskId,
    confidence: best ? Math.min(1, 0.4 + best.score * 0.2) : 0,
    extracted,
    summary: bits.length ? bits.join(" · ") : "nothing specific in the first line",
  };
}

/** The template question, with any proposal folded in. */
export function phraseOffline(spec: SlotSpec, proposal?: string): string {
  if (!proposal) return spec.question;
  if (spec.input.kind === "yesno") return `${spec.question} Earlier you said ${proposal === "yes" ? "yes" : "no"}; tap to confirm or change.`;
  if (spec.input.kind === "select") {
    const label = spec.input.options.find((o) => o.value === proposal)?.label ?? proposal;
    return `${spec.question} From what you told me it looks like "${label}"; pick that or another.`;
  }
  if (spec.input.kind === "money") return `${spec.question} You mentioned about ${proposal}; change it if that was rough.`;
  return spec.question;
}

/** A short thinking line for the activity log, from the classification. */
export function thinkingOffline(c: Classification): string {
  const task = c.taskId === "unknown" ? "not clear yet which job this is" : TASKS[c.taskId].title.toLowerCase();
  return `Reading the first line: ${c.summary}. Task: ${task}.`;
}
