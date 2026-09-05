import { createHash } from "node:crypto";
import type { Persona } from "../types";
import { compareForPersona } from "../return/compute";
import { evaluateSalariedSlice } from "./applicability";
import { PERIOD_FY_2025_26 } from "./provisions";
import { approvedForAdvice, releaseHealth, TAX_RELEASE } from "./release";
import type { TaxpayerFacts } from "./types";

export interface AdviceIssue { code: string; reason: string; provisions: string[] }
export interface AdviceAssessment {
  release: string;
  corpusHash: string;
  inputHash: string;
  /** `supported_reviewed` is reachable only once TAX_RELEASE records a qualified reviewer. */
  status: "supported_demo" | "supported_reviewed" | "needs_information" | "unsupported" | "review_required";
  canRecommend: boolean;
  canAct: boolean;
  issues: AdviceIssue[];
  applicability: ReturnType<typeof evaluateSalariedSlice>;
  comparison?: ReturnType<typeof compareForPersona>;
}
export interface AdviceContext {
  ownerKind: "demo" | "citizen";
  today: string;
  resident?: boolean;
  returnByDueDate?: boolean;
  existingOldElection?: boolean;
  /** A verified inventory of all income/exemptions/losses is not present in legacy personas. */
  completeFacts?: boolean;
}
const id = (section: string) => `1961:${section}@FY2025-26`;

/** Shared guard for the runtime AND all arithmetic tools. No identifiers in its audit fingerprint. */
export function assessAdvice(persona: Persona, context: AdviceContext): AdviceAssessment {
  const issues: AdviceIssue[] = [];
  const add = (code: string, reason: string, sections: string[]) => issues.push({ code, reason, provisions: sections.map(id) });
  const health = releaseHealth(context.today);
  if (health !== "ok") add(health, "The tax knowledge release needs validation before it can support an answer.", []);
  if (persona.assessmentYear !== "2026-27") add("unsupported_period", "This calculator covers AY 2026-27 only.", []);
  const demo = context.ownerKind === "demo";
  const resident = context.resident ?? (demo ? true : undefined);
  if (resident === undefined) add("residency_unknown", "Residential status has not been established for this income period.", ["87A"]);
  if (resident === false) add("nonresident_calculation", "The shared calculator does not model non-resident rebate and exemption treatment.", ["87A", "rates-old"]);
  if (!demo && context.completeFacts !== true) add("facts_incomplete", "The income, exemption and loss inventory must be verified before comparing regimes.", ["ITR-selection"]);
  const values = [...persona.facts.map((f) => f.amount), ...persona.claims.map((c) => c.amount), ...persona.taxPaid.map((t) => t.amount)];
  // Each amount AND each aggregate must stay inside the safe-integer range; whole-rupee ages only.
  const sums = [persona.facts, persona.claims, persona.taxPaid].map((xs) => (xs as { amount: number }[]).reduce((n, x) => n + x.amount, 0));
  if ([...values, ...sums].some((n) => !Number.isSafeInteger(n) || n < 0) || !Number.isInteger(persona.age) || persona.age < 0 || persona.age > 120)
    add("invalid_values", "Negative, invalid or unsafe amounts/age require correction before calculation.", []);
  if (persona.facts.length === 0) add("income_unknown", "No income inventory is available; an empty return is not evidence of nil income.", ["ITR-selection"]);
  const gross = persona.facts.reduce((n, f) => n + f.amount, 0);
  if (gross > 5000000) add("surcharge_unsupported", "High-income surcharge and marginal relief are not implemented in the shared calculator.", ["cess-surcharge"]);
  if (persona.facts.some((f) => f.kind === "capital_gains" && f.amount !== 0))
    add("capital_gains_unsupported", "Capital gains need validated exemption, loss and special-rate adjustments before a regime recommendation.", ["111A", "112A", "112"]);
  if (persona.facts.some((f) => (f.kind === "other" || f.kind === "rent") && f.amount !== 0))
    add("income_head_unsupported", "Business/professional or house-property income needs head-specific computation and election checks.", ["24", "115BAC"]);
  for (const claim of persona.claims.filter((c) => c.amount > 0)) {
    if (claim.section !== "80C") add("deduction_unsupported", `The ${claim.section} amount needs eligibility and limit details that the shared calculator does not carry.`,
      claim.section.startsWith("80D") ? ["80D"] : claim.section.startsWith("80CCD") ? ["80CCD(2)"] : ["115BAC"]);
    if (!claim.evidenceAttached) add("claim_unverified", `The ${claim.section} claim has not been checked against supporting records.`, ["reconciliation"]);
  }
  if (persona.claims.filter((c) => c.section === "80C").reduce((n, c) => n + c.amount, 0) > 150000)
    add("aggregate_cap_unsupported", "The total 80C claim exceeds the shared annual limit; duplicate rows must not bypass it.", ["80C"]);
  if (!demo && !approvedForAdvice()) add("tax_review_required", "This release is an engineering draft awaiting qualified Indian tax review; personal recommendations are unavailable.", []);
  const inputHash = createHash("sha256").update(JSON.stringify({
    ay: persona.assessmentYear, age: persona.age,
    facts: persona.facts.map((f) => ({ kind: f.kind, amount: f.amount, capitalGains: f.capitalGains })),
    claims: persona.claims.map((c) => ({ section: c.section, amount: c.amount, evidence: c.evidenceAttached })),
    credits: persona.taxPaid.map((t) => ({ section: t.section, amount: t.amount })), context,
  })).digest("hex");
  // Arithmetic is never invoked for unsupported inputs.
  const comparison = issues.length === 0 ? compareForPersona(persona) : undefined;
  const facts: TaxpayerFacts = { period: persona.assessmentYear === "2026-27" ? PERIOD_FY_2025_26 : undefined,
    category: "individual", resident, age: persona.age, regime: "new",
    hasSalaryIncome: persona.facts.some((f) => f.kind === "salary"),
    grossSalary: persona.facts.filter((f) => f.kind === "salary").reduce((n, f) => n + f.amount, 0),
    hasBusinessOrProfessionIncome: persona.facts.some((f) => f.kind === "other" && f.amount > 0),
    totalIncome: comparison?.new.taxableIncome,
    // Derived from the return, never asserted: all capital-gains facts are special-rate income here.
    specialRateIncome: persona.facts.filter((f) => f.kind === "capital_gains").reduce((n, f) => n + f.amount, 0),
    ltcg112A: persona.facts.filter((f) => f.kind === "capital_gains" && f.capitalGains?.holding === "long" && f.capitalGains.assetClass === "equity_stt").reduce((n, f) => n + f.amount, 0),
    returnByDueDate: context.returnByDueDate,
    claims: persona.claims.map((c) => ({ section: c.section, amount: c.amount, evidence: c.evidenceAttached })),
  };
  const applicability = evaluateSalariedSlice(facts);
  if (comparison && comparison.old.totalTax < comparison.new.totalTax && context.existingOldElection !== true && context.returnByDueDate !== true)
    add("election_unverified", "The old regime is cheaper in this calculation, but a valid timely election has not been established.", ["115BAC"]);
  const canRecommend = issues.length === 0;
  // Acting (a simulated filing or payment) needs every guard above to pass AND, in the runtime, an explicit
  // confirmation bound to the exact snapshot. No further legal test is invented here; TDS reconciliation
  // is surfaced as a review finding, not silently turned into a filing bar.
  const canAct = canRecommend;
  return { release: TAX_RELEASE.id, corpusHash: TAX_RELEASE.corpusHash, inputHash,
    status: issues.some((i) => i.code === "tax_review_required") ? "review_required" :
      issues.some((i) => /unknown|unverified|incomplete/.test(i.code)) ? "needs_information" : issues.length ? "unsupported" : demo ? "supported_demo" : "supported_reviewed",
    canRecommend, canAct, issues, applicability,
    // Do not expose a 'cheaper' calculation when election legality is unknown.
    comparison: canRecommend ? comparison : undefined };
}
