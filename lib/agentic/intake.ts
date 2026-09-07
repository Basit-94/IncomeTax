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
 *
 * 2026-09-07 (papers-first v2): this is the yearly half of onboarding. The
 * source card puts DigiLocker first when the profile linked it; the one form
 * is built from `gapGroups` — housing, "anything else", deductions, and the
 * no-papers figures — so a group the documents already answer is never shown.
 */

import type { AgenticStrings } from "../i18n/agenticStrings";
import { formatMoney } from "../money";
import type { VersionedReturn } from "../return/snapshot-store";
import { DEDUCTION_FIELDS, formFieldsFor, yearAnswersFrom } from "../return/year-form";
import type { GapGroup, YearAnswers } from "../return/year-intake";
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
    employment: has(/\b(job|salary|salaried|package|ctc|employer|employed|placement|offer letter|payslip|salary slip|in hand|take[- ]home|naukri|nokri|tankha|tanakhwa|pagaar|pagar|kamai|kamaata|kamata)\b/),
    salaryAmount: parseAmountInRupees(t),
    business: has(/\b(business|freelanc\w*|consultan\w*|self[- ]employed|revenue|turnover|shop|proprietor|gst|clients?|startup|gig|dhandha|dhanda|dukaan|dukan|vyapar|vyaapar)\b/),
    rentPaid: has(/\b(rent|hra|paying guest|pg|kiraya|kiraye)\b/) && !has(/\brental income\b/),
    homeLoan: has(/\b(home loan|housing loan|emi|mortgage|ghar ka loan|ghar loan)\b/),
    investments: has(/\b(pf|epf|ppf|elss|lic|nps|sip|mutual fund|insurance premium|80c|bima|beema)\b/),
    healthInsurance: has(/\b(health insurance|mediclaim|medical insurance|80d|health policy|medical policy|swasthya bima)\b/),
    capitalGains: has(/\b(stocks?|shares?|equity|mutual funds?|crypto|sold (a |my )?(flat|house|property|land)|capital gains?)\b/),
    firstTime: has(/\b(first (time|job)|fresher|never filed|new to|pehli baar|pehla job|pehli job|kabhi nahi bhara)\b/),
    mentionsForm16: has(/\bform[- ]?16\b/),
    wantsFiling: has(/\b(file|filing|itr|return|submit|bharna|bharni|bharu|bharoon|bhar do|karna hai)\b/),
    wantsBest: has(/\b(best|save|saving|benefit|optimi[sz]e|maximi[sz]e|cheaper|less tax|sabse (accha|acha|behtar)|behtar|bachat|bachana|bacha|kam tax|fayda|faayda)\b/),
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
  /** Demo personas are residents by construction; a citizen has to be asked. */
  ownerKind: "demo" | "citizen";
  /** Readable Form 16s already in the vault — offered as a source, read only after consent. */
  vaultForm16: { id: string; title: string }[];
  /** A salary figure already staged in this run from a document or a declaration. */
  salaryStaged: boolean;
  /** What the DigiLocker mock would hand over, one line each, for the consent card. */
  digilockerItems: string[];
  /** The profile linked DigiLocker at onboarding: the fetch is one tap and comes first. */
  digilockerLinked?: boolean;
  /** Residency already on the profile — the form does not ask again. */
  residencyKnown?: boolean;
  /** Which groups of the one form still need the person (lib/return/year-intake.ts `gapGroups`). */
  gaps?: GapGroup[];
  /** Last year's answers, pre-selected and tagged. */
  carried?: Pick<YearAnswers, "housing" | "extras" | "deductions">;
  s: AgenticStrings;
  lang: Lang;
}

const differs = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b, 1) > 0.05;

// The form's field specs live in lib/return/year-form.ts (pure, browser-safe) so the Manual shell renders the same card.
export { DEDUCTION_FIELDS, formFieldsFor, yearAnswersFrom };

/**
 * The next intake step, or null when the intake is complete. Document-first and
 * short (user direction 2026-09-06: "asking one question at a time feels worse
 * than manual mode"): where the salary figures come from — an upload, the
 * DigiLocker mock, the vault (each behind explicit consent) or typed — then ONE
 * form for everything the papers could not answer, then at most one proof upload.
 */
export function nextIntakeQuestion(ctx: IntakeContext): Question | null {
  const { situation: sit, snapshot, answers: a, s, lang } = ctx;
  const persona = snapshot.state.persona;
  // A blank return and a sentence that says nothing about the money ("file my tax"): ask where it came from first.
  if (!sit.employment && !sit.business && persona.facts.length === 0 && a.income_source === undefined) {
    return {
      id: newId("q"),
      text: s.askIncomeSource,
      why: s.askIncomeSourceWhy,
      expects: "choice",
      resolves: "income_source",
      choices: [
        { value: "salary", label: s.incomeSourceSalary },
        { value: "business", label: s.incomeSourceBusiness },
        { value: "other", label: s.incomeSourceOther },
      ],
    };
  }
  if (sit.business || !sit.employment) return null;
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

  const salaryKnown = reportedSalary > 0 || ctx.salaryStaged || snapshot.state.baselinePersona.facts.some((f) => f.kind === "salary");
  if (!salaryKnown && a.source === undefined) {
    const vaultDocs = a.vault_consent === false ? [] : ctx.vaultForm16;
    const options: NonNullable<Question["sourceOptions"]> = [];
    // A linked locker is the one-tap path and goes first; otherwise the upload leads, as before.
    if (ctx.vaultAvailable && ctx.digilockerLinked) options.push({ value: "digilocker", label: s.sourceDigiLocker, kind: "choice", detail: s.sourceDigiLockerLinked });
    if (ctx.vaultAvailable) options.push({ value: "upload", label: s.sourceUpload, kind: "upload", detail: s.sourceUploadDetail });
    if (ctx.vaultAvailable && !ctx.digilockerLinked) options.push({ value: "digilocker", label: s.sourceDigiLocker, kind: "choice", detail: s.sourceDigiLockerDetail });
    if (vaultDocs.length) options.push({ value: "vault", label: s.sourceVault, kind: "choice", detail: vaultDocs.map((d) => d.title).join(" · ") });
    options.push({ value: "manual", label: s.sourceManual, kind: "choice" });
    return { id: newId("q"), text: s.askSource, why: s.askSourceWhy, expects: "source", resolves: "source", sourceOptions: options };
  }
  if (a.source === "digilocker" && a.digilocker_consent === undefined) {
    return { id: newId("q"), text: s.askDigiLockerConsent, why: s.askDigiLockerConsentWhy, expects: "yes_no", resolves: "digilocker_consent", items: ctx.digilockerItems };
  }
  if (a.source === "vault" && a.vault_consent === undefined) {
    return { id: newId("q"), text: s.askVaultConsent, why: s.askVaultConsentWhy, expects: "yes_no", resolves: "vault_consent", items: ctx.vaultForm16.map((d) => d.title) };
  }

  if (a.details === undefined) {
    const fields = formFieldsFor(ctx, salaryKnown);
    if (fields.length === 0) return null; // the papers answered everything; the runtime marks the inventory confirmed
    return { id: newId("q"), text: s.askDetails, why: s.askDetailsWhy, expects: "form", resolves: "details", fields };
  }

  const claimed = DEDUCTION_FIELDS.some((d) => typeof a[d.key] === "number" && (a[d.key] as number) > 0);
  if (claimed && ctx.vaultAvailable && a.proof === undefined) {
    return { id: newId("q"), text: s.askProof, why: s.askProofWhy, expects: "file", resolves: "proof", docType: "OTHER", skipLabel: s.skipForNow };
  }
  return null;
}

/** A file answer is a stored document id; "none" means the citizen does not have it. */
export function isDocumentAnswer(value: unknown): value is string {
  return typeof value === "string" && value !== "none" && value.length > 0;
}
