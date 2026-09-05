/**
 * Tax knowledge as data (plan.md §5.6): a versioned corpus of provisions with
 * the metadata a later reader needs to know WHICH law produced an answer, plus
 * executable applicability predicates with three outcomes.
 *
 * Two dimensions the plan insists stay separate (§5.6, "Critical transition
 * case"): which ACT governs a period (1961 vs 2025) is not the same thing as
 * which REGIME a taxpayer elected (old vs new). Both are fields here; neither
 * is inferred from the other.
 */

export type ActVersion = "IT_ACT_1961" | "IT_ACT_2025";

/** "AY 2026-27" under the 1961 Act; "TY 2026-27" under the 2025 Act. */
export interface TaxPeriod {
  /** Income period, e.g. "2025-26" (1 Apr 2025 – 31 Mar 2026). */
  financialYear: string;
  /** How the period is labelled in filings: AY under 1961, TY under 2025. */
  label: string;
  act: ActVersion;
}

export type TaxpayerCategory = "individual" | "huf" | "senior" | "super_senior";
export type IncomeHead = "salary" | "house_property" | "business_profession" | "capital_gains" | "other_sources";

export type SourceKind =
  | "act"
  | "finance_act"
  | "rule"
  | "notification"
  | "circular"
  | "form_manual"
  | "departmental_faq";

export interface LegalProvision {
  /** Stable id, e.g. "1961:16(ia)@FY2025-26". */
  id: string;
  act: ActVersion;
  section: string;
  subsection?: string;
  title: string;
  /** Plain-language summary a citizen could read. Never a substitute for the text. */
  summary: string;
  /** The operative rule, as reviewed. Short, exact, with the numbers. */
  ruleText: string;
  financialYears: string[];
  effectiveFrom: string;
  effectiveTo?: string;
  sourceKind: SourceKind;
  sourceUrl: string;
  /** Exact locator inside the source: section number, page, FAQ number. */
  locator: string;
  jurisdiction: "IN";
  categories: TaxpayerCategory[];
  incomeHeads: IncomeHead[];
  /** Search terms and related section numbers. */
  keywords: string[];
  /** Provisions this one qualifies or is qualified by: definitions, provisos, exceptions. */
  linked: string[];
  supersededBy?: string;
  reviewer: string;
  reviewedOn: string;
  /** SHA-256 of ruleText, so a silent edit is detectable. */
  contentHash: string;
}

export type ApplicabilityOutcome = "eligible" | "ineligible" | "insufficient_information";

export interface ApplicabilityResult {
  rule: string;
  outcome: ApplicabilityOutcome;
  /** Provision ids the outcome rests on. */
  provisions: string[];
  /** Why, in one sentence a citizen can read. */
  reason: string;
  /** Facts still needed to decide, when outcome is insufficient_information. */
  missing?: string[];
}

/** The attributes predicates may ask about. Everything optional: absence is a first-class state. */
export interface TaxpayerFacts {
  period?: TaxPeriod;
  category?: TaxpayerCategory;
  age?: number;
  resident?: boolean;
  hasSalaryIncome?: boolean;
  grossSalary?: number;
  hasBusinessOrProfessionIncome?: boolean;
  totalIncome?: number;
  regime?: "new" | "old";
  /** Whether the taxpayer has previously opted OUT of the new regime with business income (s.115BAC(6)). */
  priorRegimeOptOut?: boolean;
  claims?: { section: string; amount: number; evidence?: boolean }[];
  ltcg112A?: number;
}

export interface EvidenceBundle {
  release: string;
  period: TaxPeriod;
  query: string;
  provisions: LegalProvision[];
  /** Candidate rules kept because a filtering attribute was unknown (§5.6). */
  retainedForMissing: { provision: LegalProvision; missing: string[] }[];
}
