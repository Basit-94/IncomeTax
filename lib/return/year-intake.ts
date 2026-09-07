/**
 * The year's intake — everything about a return that changes every April
 * (design 2026-09-07, "Papers-first onboarding v2": onboarding keeps only what
 * never changes; the tax year lives here).
 *
 * The figures themselves (facts, TDS, claims) stay on the Persona through the
 * normal commands. This module holds what the persona cannot: where the papers
 * came from and when consent was given, the salary breakup a Form 16 Part B
 * carries, the SFT flags an AIS carries, the verdict (which ITR form, which
 * regime leads), the answers to the one form, and which earlier year seeded
 * the defaults. Both shells read the same object; only the rendering differs
 * (docs/MODES.md).
 *
 * Nothing here decides a rupee: `regimeLean` calls the engine twice and reads
 * the result back; `inferForm` applies the ITR-1 eligibility text verbatim.
 */

import { compareRegimes } from "../engine/tax";
import type { OnboardingIntent, Residency } from "../onboarding";
import type { Claim, Persona } from "../types";
import { taxInputFor } from "./compute";

export const YEAR_INTAKE_VERSION = 1;

export type IntakeSource = "digilocker" | "upload" | "vault" | "manual" | "none";

export type Housing = "rent" | "own_self" | "own_letout" | "family";
export const HOUSING: Housing[] = ["rent", "own_self", "own_letout", "family"];

/** "Anything else this year?" — the ITR-1 gate in plain words. */
export type Extra =
  | "business"
  | "sold_assets"
  | "foreign"
  | "director"
  | "crypto"
  | "agri"
  | "disability"
  | "family_pension"
  | "none";
export const EXTRAS: Extra[] = ["business", "sold_assets", "foreign", "director", "crypto", "agri", "disability", "family_pension", "none"];

/** Deductions a salaried person may have paid outside what the employer reported. */
export type DeductionKey = "80C" | "80D_SELF" | "80CCD_1B" | "80E" | "80G" | "80EEB" | "80GG" | "24B";
export const DEDUCTION_KEYS: DeductionKey[] = ["80C", "80D_SELF", "80CCD_1B", "80E", "80G", "80EEB", "80GG", "24B"];

export type EmployerCategory = "central_govt" | "state_govt" | "psu" | "pensioner" | "others";

export type SeventhProvisoTrigger = "current_account_deposit_1cr" | "foreign_travel_2l" | "electricity_1l";

/** Form 16 Part B, the rows the persona has no place for. */
export interface SalaryBreakup {
  gross: number;
  s17_1?: number;
  s17_2?: number;
  s17_3?: number;
  exempt10: { section: string; amount: number }[];
  professionalTax?: number;
  tdsSalary?: number;
  employerName?: string;
  tan?: string;
  category?: EmployerCategory;
}

export interface YearAnswers {
  housing?: Housing;
  extras?: Extra[];
  deductions?: { section: DeductionKey; amount: number }[];
  letOut?: { address?: string; rent: number; municipalTax?: number };
  homeLoanInterest?: number;
  /** The no-papers path: the same four figures the agentic intake asked before. */
  manual?: { salary?: number; employerCategory?: EmployerCategory; interest?: number; resident?: boolean };
}

export interface RegimeLean {
  /** Total tax under each regime with the claims as they stand. */
  new: number;
  old: number;
  lean: "new" | "old" | "open";
  /** True when the new regime wins even with deductions topped up to the ceiling — the deductions group is skipped. */
  decidedWithoutDeductions: boolean;
  ceiling: number;
}

export type ItrForm = "ITR-1" | "ITR-2" | "ITR-3/4" | "unknown";

export interface Verdict {
  itrForm: ItrForm;
  reasons: string[];
  regime: RegimeLean;
  filingSection: "139(1)" | "139(4)";
}

export interface YearIntake {
  version: typeof YEAR_INTAKE_VERSION;
  assessmentYear: string;
  /** Asked every visit in the opener. */
  intent?: OnboardingIntent;
  sources: {
    chosen: IntakeSource;
    consentAt?: string;
    /** Vault document ids. Two employers in a year is common, so Form 16 is a list. */
    documents: { form16: string[]; ais?: string; form26as?: string };
  };
  read: { salary?: SalaryBreakup; sftFlags: SeventhProvisoTrigger[] };
  inferred?: Verdict;
  answers: YearAnswers;
  /** The earlier assessment year whose answers seeded this one's defaults. */
  carriedFrom?: string;
  updatedAt: string;
}

export function emptyYearIntake(assessmentYear: string, now: string): YearIntake {
  return {
    version: YEAR_INTAKE_VERSION,
    assessmentYear,
    sources: { chosen: "none", documents: { form16: [] } },
    read: { sftFlags: [] },
    answers: {},
    updatedAt: now,
  };
}

/* ------------------------------------------------------------------ regime -- */

/**
 * The deductions a salaried person could plausibly still add (decision 3, 2026-09-07): 80C 1.5L,
 * 80CCD(1B) 50k, 80D self 25k + parents 25k, 24(b) 2L — ₹4.5L. Topped up per section, never stacked
 * on what the employer already reported.
 */
export const DEDUCTION_CEILING: ReadonlyArray<{ section: string; amount: number }> = [
  { section: "80C", amount: 150_000 },
  { section: "80CCD_1B", amount: 50_000 },
  { section: "80D_SELF", amount: 25_000 },
  { section: "80D_PARENTS", amount: 25_000 },
  { section: "24B", amount: 200_000 },
];

function topUp(persona: Persona): Persona {
  const claims: Claim[] = [...persona.claims];
  for (const c of DEDUCTION_CEILING) {
    const existing = claims.find((k) => k.section === c.section);
    if (existing) {
      if (existing.amount < c.amount) claims[claims.indexOf(existing)] = { ...existing, amount: c.amount };
    } else {
      claims.push({ id: `ceiling-${c.section}`, section: c.section, label: c.section, amount: c.amount, evidenceAttached: false });
    }
  }
  return { ...persona, claims };
}

/** Both regimes, as they stand and at the ceiling. Pure; the engine does the arithmetic. */
export function regimeLean(persona: Persona): RegimeLean {
  const asIs = compareRegimes(taxInputFor(persona, "new"));
  const ceiling = DEDUCTION_CEILING.reduce((n, c) => n + c.amount, 0);
  const atCeiling = compareRegimes(taxInputFor(topUp(persona), "new"));
  const newWinsNow = asIs.new.totalTax <= asIs.old.totalTax;
  const newWinsAtCeiling = atCeiling.new.totalTax <= atCeiling.old.totalTax;
  const lean: RegimeLean["lean"] = newWinsNow && newWinsAtCeiling ? "new" : !newWinsNow ? "old" : "open";
  return { new: asIs.new.totalTax, old: asIs.old.totalTax, lean, decidedWithoutDeductions: lean === "new", ceiling };
}

/* -------------------------------------------------------------------- form -- */

export const ITR1_INCOME_LIMIT = 5_000_000;
export const ITR1_LTCG_112A_LIMIT = 125_000;

export function totalIncome(persona: Persona): number {
  return persona.facts.reduce((n, f) => n + f.amount, 0);
}

/**
 * Which form, from the ITR-1 eligibility text as the portal prints it: resident, total income up to
 * ₹50 lakh, salary / up to two house properties / other sources / LTCG u/s 112A up to ₹1.25 lakh /
 * agricultural income up to ₹5,000; not a director, no unlisted shares, no foreign assets, no business.
 */
export function inferForm(persona: Persona, answers: YearAnswers, residency: Residency = "resident"): { itrForm: ItrForm; reasons: string[] } {
  const reasons: string[] = [];
  const extras = new Set(answers.extras ?? []);
  if (extras.has("business")) return { itrForm: "ITR-3/4", reasons: ["Business or freelance income"] };
  if (residency !== "resident") reasons.push("Not a resident for the year");
  const income = totalIncome(persona);
  if (income > ITR1_INCOME_LIMIT) reasons.push("Total income above ₹50 lakh");
  const gains = persona.facts.filter((f) => f.kind === "capital_gains");
  const ltcg112A = gains.filter((f) => f.capitalGains?.assetClass === "equity_stt" && f.capitalGains.holding === "long").reduce((n, f) => n + f.amount, 0);
  if (gains.some((f) => !f.capitalGains || f.capitalGains.assetClass !== "equity_stt" || f.capitalGains.holding !== "long")) reasons.push("Capital gains other than listed-equity LTCG");
  if (ltcg112A > ITR1_LTCG_112A_LIMIT) reasons.push("LTCG u/s 112A above ₹1.25 lakh");
  if (extras.has("sold_assets")) reasons.push("Sold property or shares beyond what AIS shows");
  if (extras.has("foreign")) reasons.push("Foreign income or assets");
  if (extras.has("director")) reasons.push("Director, or holds unlisted shares");
  if (extras.has("crypto")) reasons.push("Crypto or lottery income");
  if (extras.has("agri")) reasons.push("Agricultural income above ₹5,000");
  if (reasons.length) return { itrForm: "ITR-2", reasons };
  const heads: string[] = [];
  if (persona.facts.some((f) => f.kind === "salary")) heads.push("salary");
  if (persona.facts.some((f) => f.kind === "interest")) heads.push("interest");
  if (persona.facts.some((f) => f.kind === "dividend")) heads.push("dividends");
  if (persona.facts.some((f) => f.kind === "rent") || answers.housing === "own_letout") heads.push("one let-out property");
  if (ltcg112A > 0) heads.push("LTCG u/s 112A within ₹1.25 lakh");
  const summary = heads.length ? heads.join(" + ") : "no income on record yet";
  return { itrForm: "ITR-1", reasons: [summary, income > 0 ? `Total income ${income <= ITR1_INCOME_LIMIT ? "under" : "over"} ₹50 lakh` : "Nothing rules ITR-1 out"] };
}

/** ITR-1/2 are due 31 July of the assessment year's first calendar year. */
export function filingSection(today: string, assessmentYear: string): "139(1)" | "139(4)" {
  const due = `${assessmentYear.slice(0, 4)}-07-31`;
  return today <= due ? "139(1)" : "139(4)";
}

export function verdict(persona: Persona, intake: YearIntake, residency: Residency, today: string): Verdict {
  const form = inferForm(persona, intake.answers, residency);
  return { itrForm: form.itrForm, reasons: form.reasons, regime: regimeLean(persona), filingSection: filingSection(today, intake.assessmentYear) };
}

/* --------------------------------------------------------------------- gaps -- */

export type GapGroup = "housing" | "extras" | "deductions" | "manual";

/**
 * Which groups of the one form still need the person. Each has a skip condition; a group that is
 * already answered never comes back.
 *  - housing: skipped when Form 16 shows an HRA exemption and nothing on record points at a property;
 *  - extras: always, until answered — it is the ITR-1 gate;
 *  - deductions: skipped when the new regime wins even at the ceiling;
 *  - manual: only the no-papers path, until the four figures are given.
 */
export function gapGroups(persona: Persona, intake: YearIntake, lean: RegimeLean = regimeLean(persona)): GapGroup[] {
  const a = intake.answers;
  const groups: GapGroup[] = [];
  const hasSalary = persona.facts.some((f) => f.kind === "salary");
  if (!hasSalary && !a.manual && (intake.sources.chosen === "manual" || intake.sources.chosen === "none")) groups.push("manual");
  const hra = intake.read.salary?.exempt10.some((e) => /10\(13A\)|HRA/i.test(e.section)) ?? false;
  const propertySignal = persona.facts.some((f) => f.kind === "rent");
  if (a.housing === undefined && !(hra && !propertySignal)) groups.push("housing");
  if (a.extras === undefined) groups.push("extras");
  if (a.deductions === undefined && !lean.decidedWithoutDeductions) groups.push("deductions");
  return groups;
}

/** Last year's answers become this year's defaults — tagged, one tap to change. Documents never carry. */
export function carryDefaults(previous: YearIntake): Pick<YearAnswers, "housing" | "extras" | "deductions"> {
  const out: Pick<YearAnswers, "housing" | "extras" | "deductions"> = {};
  if (previous.answers.housing) out.housing = previous.answers.housing;
  if (previous.answers.extras) out.extras = previous.answers.extras;
  if (previous.answers.deductions) out.deductions = previous.answers.deductions;
  return out;
}

/** Merge a partial update, stamping the time. Pure. */
export function mergeYearIntake(current: YearIntake, patch: Partial<Omit<YearIntake, "version" | "assessmentYear">>, now: string): YearIntake {
  return {
    ...current,
    ...patch,
    sources: patch.sources
      ? {
          ...current.sources,
          ...patch.sources,
          documents: {
            ...current.sources.documents,
            ...(patch.sources.documents ?? {}),
            // Two employers, two Form 16s: ids accumulate, never overwrite.
            form16: [...new Set([...current.sources.documents.form16, ...(patch.sources.documents?.form16 ?? [])])],
          },
        }
      : current.sources,
    read: patch.read ? { ...current.read, ...patch.read } : current.read,
    answers: patch.answers ? { ...current.answers, ...patch.answers } : current.answers,
    updatedAt: now,
  };
}
