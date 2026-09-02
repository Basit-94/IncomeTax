/**
 * AY 2026-27 statutory adapter.
 *
 * This file does NOT implement the rates. It shapes a flat, form-shaped input
 * into the pure engine's fact/claim model (`lib/engine/tax.ts`), calls it once
 * per regime, and reshapes the breakdown into the field names the reconciliation
 * UI reads. Keeping the arithmetic in one place is load-bearing: `lib/engine/*`
 * is pinned to the Java backend by 72 golden vectors in `fixtures/golden/`, so a
 * second copy of the slabs here would be a silent fork of the product contract.
 *
 * What the engine it calls actually applies for AY 2026-27, new regime:
 *   - Standard deduction ₹75,000 on salary income (₹50,000 old regime); ₹0 when
 *     there is no salary fact at all.
 *   - Chapter VI-A: only 80CCD(2) (employer NPS) survives the new regime.
 *     80C and 80D are dropped there and capped at ₹1,50,000 / ₹25,000 in the old.
 *   - Slabs 0-4L nil, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%, 20-24L 25%,
 *     above 24L 30%.
 *   - s.87A: full rebate (cap ₹60,000) when total income ≤ ₹12,00,000.
 *   - Marginal relief above that: where slab tax exceeds the excess of income
 *     over ₹12,00,000, the relief is (slab tax − excess), leaving pre-cess tax
 *     equal to the excess itself.
 *   - 4% health & education cess, applied AFTER rebate/relief.
 *   - Net position = liability − (TDS + advance tax + self-assessment paid).
 *
 * KNOWN GAPS, unchanged and labelled in `lib/engine/constants.ts`: surcharge,
 * s.234A/B/C interest, s.234F fee, old-regime marginal relief.
 */

import { computeTax } from "./engine/tax";
import type { TaxInputFact } from "./engine/types";
import type { CapitalGainsMeta, Claim } from "./types";
import { REBATE_87A_NEW_THRESHOLD } from "./engine/constants";

/** One classified capital-gains lot, so s.111A/112A/112 can price it properly. */
export interface CapitalGainsLot {
  amount: number;
  /** Absent → slab treatment, which the engine labels as a simplification. */
  classification?: CapitalGainsMeta;
}

export interface TaxEngineInput {
  isSalaried: boolean;
  age: number;
  grossSalary: number;
  businessIncome: number;
  savingsInterest: number;
  otherIncome: number;
  /** Total TDS from every deductor (employer + banks + others). */
  tdsPaid: number;
  advanceTaxPaid: number;
  section80C: number;
  section80D: number;

  /* ---- added for the reconciliation surface; all optional and default 0 ---- */

  /** s.194 dividend, taxed at slab. */
  dividendIncome?: number;
  /** House-property / rental income, taxed at slab. */
  rentalIncome?: number;
  /** Employer NPS contribution — the one Chapter VI-A head the new regime keeps. */
  section80CCD2?: number;
  /**
   * Capital gains as lots rather than one lump, so classified gains can leave
   * the slab pool and be priced at their own statutory rate.
   */
  capitalGains?: CapitalGainsLot[];
  /**
   * Self-assessment tax under s.140A — Challan 280, minor head 300. Credited
   * exactly like TDS but reported separately so the UI can show that the
   * citizen, not a deductor, paid it.
   */
  selfAssessmentPaid?: number;
  /**
   * Chapter VI-A claims the reconciliation surface has no row for (80GG,
   * 80E, 80TTA, 24(b), parents' 80D ...). Forwarded to the engine with their
   * own sections so each keeps its statutory cap under the old regime.
   */
  additionalClaims?: AdditionalClaim[];
}

/** A claim passed through by section, untouched. */
export interface AdditionalClaim {
  id: string;
  section: string;
  label: string;
  amount: number;
}

export interface RegimeResult {
  grossTotalIncome: number;
  standardDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  /** Slab-only tax, before rebate. Excludes special-rate capital-gains tax. */
  slabTax: number;
  /** Tax on classified capital gains at s.111A / s.112A / s.112 rates. */
  specialRateTax: number;
  /** The s.112A slice within total income that attracts no tax. */
  specialExemptAmount: number;
  /** slabTax + specialRateTax. */
  taxBeforeRebate: number;
  rebate87A: number;
  marginalRelief: number;
  /** taxBeforeRebate − rebate87A − marginalRelief. The cess base. */
  taxAfterRebate: number;
  cess: number;
  totalTaxLiability: number;
  /** TDS from all deductors. */
  tdsPaid: number;
  advanceTaxPaid: number;
  /** s.140A self-assessment tax already paid by challan. */
  selfAssessmentPaid: number;
  totalTaxesPaid: number;
  /** Positive = payable to the department; negative = refund due to citizen. */
  netPayableOrRefund: number;
}

export interface TaxEngineOutput {
  newRegime: RegimeResult;
  oldRegime: RegimeResult;
}

function calculateForRegime(input: TaxEngineInput, regime: "new" | "old"): RegimeResult {
  const facts: TaxInputFact[] = [];
  if (input.grossSalary > 0 || input.isSalaried) {
    facts.push({ kind: "salary", amount: input.grossSalary });
  }
  if (input.businessIncome > 0) {
    facts.push({ kind: "other", amount: input.businessIncome });
  }
  if (input.savingsInterest > 0) {
    facts.push({ kind: "interest", amount: input.savingsInterest });
  }
  if ((input.dividendIncome ?? 0) > 0) {
    facts.push({ kind: "dividend", amount: input.dividendIncome ?? 0 });
  }
  if ((input.rentalIncome ?? 0) > 0) {
    facts.push({ kind: "rent", amount: input.rentalIncome ?? 0 });
  }
  for (const lot of input.capitalGains ?? []) {
    if (lot.amount <= 0) continue;
    facts.push({ kind: "capital_gains", amount: lot.amount, capitalGains: lot.classification });
  }
  if (input.otherIncome > 0) {
    facts.push({ kind: "other", amount: input.otherIncome });
  }

  const claims: Claim[] = [];
  if (input.section80C > 0) {
    claims.push({
      id: "claim-80c",
      section: "80C",
      amount: input.section80C,
      evidenceAttached: true,
      label: "Section 80C",
    });
  }
  if (input.section80D > 0) {
    claims.push({
      id: "claim-80d",
      section: "80D",
      amount: input.section80D,
      evidenceAttached: true,
      label: "Section 80D",
    });
  }
  if ((input.section80CCD2 ?? 0) > 0) {
    claims.push({
      id: "claim-80ccd2",
      section: "80CCD(2)",
      amount: input.section80CCD2 ?? 0,
      evidenceAttached: true,
      label: "Section 80CCD(2) — employer NPS",
    });
  }
  for (const claim of input.additionalClaims ?? []) {
    if (claim.amount <= 0) continue;
    claims.push({
      id: claim.id,
      section: claim.section,
      amount: claim.amount,
      evidenceAttached: true,
      label: claim.label,
    });
  }

  const ageBand = input.age >= 80 ? "above_80" : input.age >= 60 ? "60_to_80" : "below_60";

  const advanceTaxPaid = input.advanceTaxPaid;
  const selfAssessmentPaid = input.selfAssessmentPaid ?? 0;
  const totalTaxesPaid = input.tdsPaid + advanceTaxPaid + selfAssessmentPaid;

  const breakdown = computeTax({
    facts,
    claims,
    ageBand,
    regime,
    tdsCredits: totalTaxesPaid,
  });

  // The engine returns rebate and marginal relief as one number, because both
  // are the same s.87A mechanism. The UI has to name them separately — a citizen
  // told "rebate ₹51,500" on a ₹12,10,000 income would reasonably expect the
  // ₹60,000 cap to apply next year too. Which one it was is decided by exactly
  // the test the statute uses: total income at or below the threshold.
  const specialRateTax = breakdown.specialRate.reduce((sum, item) => sum + item.tax, 0);
  const atOrBelowThreshold = breakdown.taxableIncome <= REBATE_87A_NEW_THRESHOLD;
  const isRelief = regime === "new" && !atOrBelowThreshold;

  return {
    grossTotalIncome: breakdown.grossIncome,
    standardDeduction: breakdown.standardDeduction,
    totalDeductions: breakdown.totalDeductions + breakdown.standardDeduction,
    taxableIncome: breakdown.taxableIncome,
    slabTax: breakdown.slabTax,
    specialRateTax,
    specialExemptAmount: breakdown.specialExemptTotal,
    taxBeforeRebate: breakdown.taxBeforeRebate,
    rebate87A: isRelief ? 0 : breakdown.rebate87A,
    marginalRelief: isRelief ? breakdown.rebate87A : 0,
    taxAfterRebate: breakdown.taxAfterRebate,
    cess: breakdown.cess,
    totalTaxLiability: breakdown.totalTax,
    tdsPaid: input.tdsPaid,
    advanceTaxPaid,
    selfAssessmentPaid,
    totalTaxesPaid: breakdown.tdsCredits,
    netPayableOrRefund: breakdown.totalTax - breakdown.tdsCredits,
  };
}

export function computeAY2026Tax(input: TaxEngineInput): TaxEngineOutput {
  return {
    newRegime: calculateForRegime(input, "new"),
    oldRegime: calculateForRegime(input, "old"),
  };
}
