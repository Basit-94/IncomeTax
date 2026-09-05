/**
 * Plain-English intake (user request 2026-09-05: "You just explain your
 * situation, and it will find the best path for you").
 *
 * The citizen types one sentence — "I got a job with a 12 LPA package and need
 * to file my taxes". This module turns that sentence into a `Situation` with
 * deterministic patterns (no model decides a fact), then plans the questions
 * that situation actually needs, one at a time, each with a plain reason and —
 * for documents — a description of what the document is and where it comes
 * from, so the citizen recognises it ("oh, that form") instead of being told a
 * form number. Every answer lands in the same staged commands the rest of the
 * runtime reviews and confirms; nothing here applies anything.
 */

import type { AgenticStrings } from "../i18n/agenticStrings";
import { formatMoney } from "../money";
import type { VersionedReturn } from "../return/snapshot-store";
import type { Lang } from "../types";
import { fill } from "./response";
import { newId } from "./store";
import type { Question } from "./types";

export interface Situation {
  /** Salary, a job, a package, an employer. */
  employment: boolean;
  /** Annual figure the citizen mentioned, in rupees (12 LPA → 1,200,000). */
  salaryAmount?: number;
  business: boolean;
  rentPaid: boolean;
  homeLoan: boolean;
  investments: boolean;
  healthInsurance: boolean;
  capitalGains: boolean;
  firstTime: boolean;
  mentionsForm16: boolean;
  wantsFiling: boolean;
  wantsBest: boolean;
}

const RUPEE_WORDS: [RegExp, number][] = [
  [/\b(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lacs?|lakh|l)\b/i, 100_000],
  [/\b(\d+(?:\.\d+)?)\s*(?:crores?|cr)\b/i, 10_000_000],
];

export function parseAmountInRupees(text: string): number | undefined {
  for (const [re, unit] of RUPEE_WORDS) {
    const m = re.exec(text);
    if (m) return Math.round(Number(m[1]) * unit);
  }
  const plain = /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+|\d{5,9})\b/i.exec(text);
  if (plain) {
    const n = Number(plain[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 10_000) return n;
  }
  return undefined;
}

export function parseSituation(text: string): Situation {
  const t = text.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  return {
    employment: has(/\b(job|salary|salaried|package|ctc|employer|employed|placement|offer letter|payslip|salary slip|in hand|take[- ]home)\b/),
    salaryAmount: parseAmountInRupees(t),
    business: has(/\b(business|freelanc\w*|consultan\w*|self[- ]employed|revenue|turnover|shop|proprietor|gst|clients?|startup|gig)\b/),
    rentPaid: has(/\b(rent|hra|paying guest|pg)\b/) && !has(/\brental income\b/),
    homeLoan: has(/\b(home loan|housing loan|emi|mortgage)\b/),
    investments: has(/\b(pf|epf|ppf|elss|lic|nps|sip|mutual fund|insurance premium|80c)\b/),
    healthInsurance: has(/\b(health insurance|mediclaim|medical insurance|80d)\b/),
    capitalGains: has(/\b(stocks?|shares?|equity|mutual funds?|crypto|sold (a |my )?(flat|house|property|land)|capital gains?)\b/),
    firstTime: has(/\b(first (time|job)|fresher|never filed|new to)\b/),
    mentionsForm16: has(/\bform[- ]?16\b/),
    wantsFiling: has(/\b(file|filing|itr|return|submit)\b/),
    wantsBest: has(/\b(best|save|saving|benefit|optimi[sz]e|maximi[sz]e|cheaper|less tax)\b/),
  };
}

/** Whether the opening message carries any signal worth an intake at all. */
export function hasIntakeSignal(s: Situation): boolean {
  return s.employment || s.business || s.investments || s.healthInsurance || s.rentPaid || s.homeLoan || s.capitalGains;
}

/** The deterministic acknowledgement: what was understood and what happens next. */
export function intakeAcknowledgement(sit: Situation, s: AgenticStrings, lang: Lang): string {
  const parts: string[] = [];
  if (sit.business) {
    parts.push(s.intakeBusinessUnsupported);
  } else if (sit.employment) {
    parts.push(fill(s.intakeAckSalaried, { amount: sit.salaryAmount ? fill(s.intakeAckAmount, { amount: formatMoney(sit.salaryAmount, lang) }) : "" }));
  } else {
    parts.push(s.intakeAckGeneric);
  }
  if (sit.rentPaid || sit.homeLoan) parts.push(s.intakeNoteRentHomeLoan);
  if (sit.capitalGains && !sit.business) parts.push(s.intakeNoteCapitalGains);
  return parts.join("\n\n");
}

export interface IntakeContext {
  situation: Situation;
  snapshot: VersionedReturn;
  answers: Record<string, string | number | boolean>;
  /** Uploads are possible only with a document store. */
  vaultAvailable: boolean;
  /** Document types already in the vault for this year. */
  documentTypes: string[];
  s: AgenticStrings;
  lang: Lang;
}

const differs = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b, 1) > 0.05;

/**
 * The next intake question, or null when the intake is complete. Order is by
 * consequence: the salary figure first (it moves every other number), then the
 * document that proves it, then deductions — each followed by its proof.
 */
export function nextIntakeQuestion(ctx: IntakeContext): Question | null {
  const { situation: sit, snapshot, answers: a, s, lang } = ctx;
  if (sit.business || !sit.employment) return null;
  const persona = snapshot.state.persona;
  const reportedSalary = persona.facts.filter((f) => f.kind === "salary").reduce((n, f) => n + f.amount, 0);

  if (sit.salaryAmount && reportedSalary > 0 && differs(sit.salaryAmount, reportedSalary) && a.salary_figure === undefined) {
    return {
      id: newId("q"),
      text: fill(s.askSalaryFigure, { reported: formatMoney(reportedSalary, lang), stated: formatMoney(sit.salaryAmount, lang) }),
      why: s.askSalaryFigureWhy,
      expects: "choice",
      resolves: "salary_figure",
      choices: [
        { value: "reported", label: fill(s.intakeSalaryReported, { amount: formatMoney(reportedSalary, lang) }) },
        { value: "stated", label: fill(s.intakeSalaryStated, { amount: formatMoney(sit.salaryAmount, lang) }) },
        { value: "unsure", label: s.intakeNotSure },
      ],
    };
  }

  if (ctx.vaultAvailable && !ctx.documentTypes.includes("FORM_16") && a.form16 === undefined) {
    return { id: newId("q"), text: s.askForm16, why: s.askForm16Why, expects: "file", resolves: "form16", docHint: s.askForm16Hint, docType: "FORM_16", skipLabel: s.dontHaveIt };
  }

  const has80C = persona.claims.some((c) => c.section === "80C");
  if (!has80C) {
    if (a.pf === undefined) return { id: newId("q"), text: s.askPf, why: s.askPfWhy, expects: "yes_no", resolves: "pf" };
    if (a.pf === true && a.pf_amount === undefined) return { id: newId("q"), text: s.askPfAmount, why: s.askPfWhy, expects: "number", resolves: "pf_amount" };
    if (a.pf === true && typeof a.pf_amount === "number" && a.pf_amount > 0 && ctx.vaultAvailable && a.pf_proof === undefined) {
      return { id: newId("q"), text: s.askProof, why: s.askProofWhy, expects: "file", resolves: "pf_proof", docType: "OTHER", skipLabel: s.skipForNow };
    }
  }

  const has80D = persona.claims.some((c) => c.section.startsWith("80D"));
  if (!has80D) {
    if (a.health === undefined) return { id: newId("q"), text: s.askHealthInsurance, why: s.askHealthInsuranceWhy, expects: "yes_no", resolves: "health" };
    if (a.health === true && a.health_amount === undefined) return { id: newId("q"), text: s.askHealthAmount, why: s.askHealthInsuranceWhy, expects: "number", resolves: "health_amount" };
    if (a.health === true && typeof a.health_amount === "number" && a.health_amount > 0 && ctx.vaultAvailable && a.health_proof === undefined) {
      return { id: newId("q"), text: s.askProof, why: s.askProofWhy, expects: "file", resolves: "health_proof", docType: "OTHER", skipLabel: s.skipForNow };
    }
  }
  return null;
}

/** A file answer is a stored document id; "none" means the citizen does not have it. */
export function isDocumentAnswer(value: unknown): value is string {
  return typeof value === "string" && value !== "none" && value.length > 0;
}
