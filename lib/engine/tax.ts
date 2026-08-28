/**
 * Pure tax computation. No I/O, no React, no Next.js — deterministic functions
 * over plain data, fully unit-testable.
 *
 * Capital gains: a capital_gains fact carrying asset-class metadata is taxed at
 * the real special rates (s.111A / s.112A / s.112 — see constants.ts); one
 * without metadata is taxed at slab, a labelled simplification for unclassified
 * data. KNOWN GAPS (see constants.ts): surcharge, s.234A/B/C interest.
 */

import {
  HEALTH_EDU_CESS_RATE,
  LTCG_112_RATE,
  LTCG_112A_EXEMPTION,
  LTCG_112A_RATE,
  MARGINAL_RELIEF_ENABLED_NEW,
  NEW_REGIME_ALLOWED_SECTIONS,
  OLD_REGIME_CLAIM_CAPS,
  REBATE_87A_NEW_MAX_AMOUNT,
  REBATE_87A_NEW_THRESHOLD,
  REBATE_87A_OLD_MAX_AMOUNT,
  REBATE_87A_OLD_THRESHOLD,
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
  STCG_111A_RATE,
} from "./constants";
import { computeSlabs, slabTable } from "./slab";
import type { SpecialRateItem, TaxBreakdown, TaxInput, TaxInputFact } from "./types";

/** Standard deduction applies to salary income only, under both regimes. */
function standardDeductionFor(input: TaxInput): number {
  const salaried = input.facts.some((f) => f.kind === "salary");
  if (!salaried) return 0;
  return input.regime === "new" ? STANDARD_DEDUCTION_NEW : STANDARD_DEDUCTION_OLD;
}

/**
 * Chapter VI-A style claims, filtered by regime and capped per section.
 * New regime: only standard deduction + employer NPS (80CCD(2)) survive;
 * everything else is dropped — TODO(verify) the full permitted list.
 */
export function allowedClaimTotal(input: TaxInput): number {
  let total = 0;
  for (const claim of input.claims) {
    if (input.regime === "new") {
      if (!NEW_REGIME_ALLOWED_SECTIONS.has(claim.section)) continue;
    } else {
      const cap = OLD_REGIME_CLAIM_CAPS[claim.section];
      total += cap === undefined ? claim.amount : Math.min(claim.amount, cap);
      continue;
    }
    // New-regime path: TODO(verify) whether 80CCD(2) carries a cap (% of salary).
    total += claim.amount;
  }
  return total;
}

/**
 * Which special-rate section a fact falls under, or null for slab treatment.
 * Non-equity SHORT-term gains are genuinely slab-taxed in law — that branch is
 * not a simplification.
 */
function specialSectionFor(f: TaxInputFact): SpecialRateItem["section"] | null {
  if (f.kind !== "capital_gains" || !f.capitalGains) return null;
  if (f.capitalGains.assetClass === "equity_stt") {
    return f.capitalGains.holding === "short" ? "111A" : "112A";
  }
  return f.capitalGains.holding === "long" ? "112" : null;
}

/** Sum classified gains into per-section buckets and price them. */
function specialRateItems(facts: TaxInputFact[]): SpecialRateItem[] {
  const sums: Record<SpecialRateItem["section"], number> = { "111A": 0, "112A": 0, "112": 0 };
  for (const f of facts) {
    const section = specialSectionFor(f);
    if (section) sums[section] += f.amount;
  }
  const items: SpecialRateItem[] = [];
  if (sums["111A"] > 0) {
    items.push({
      section: "111A", gains: sums["111A"], exemptAmount: 0, taxable: sums["111A"],
      rate: STCG_111A_RATE, tax: Math.round(sums["111A"] * STCG_111A_RATE),
    });
  }
  if (sums["112A"] > 0) {
    // The ₹1.25L exemption is annual and shared across all s.112A gains.
    const exempt = Math.min(sums["112A"], LTCG_112A_EXEMPTION);
    const taxable = sums["112A"] - exempt;
    items.push({
      section: "112A", gains: sums["112A"], exemptAmount: exempt, taxable,
      rate: LTCG_112A_RATE, tax: Math.round(taxable * LTCG_112A_RATE),
    });
  }
  if (sums["112"] > 0) {
    items.push({
      section: "112", gains: sums["112"], exemptAmount: 0, taxable: sums["112"],
      rate: LTCG_112_RATE, tax: Math.round(sums["112"] * LTCG_112_RATE),
    });
  }
  return items;
}

export function computeTax(input: TaxInput): TaxBreakdown {
  const grossIncome = input.facts.reduce((sum, f) => sum + f.amount, 0);
  const standardDeduction = standardDeductionFor(input);
  const totalDeductions = allowedClaimTotal(input);

  // Classified capital gains leave the slab pool and are priced per-section.
  // Deductions (standard + VI-A) offset slab income only — they cannot erode
  // s.111A/112A/112 gains, matching the Act.
  const specialRate = specialRateItems(input.facts);
  const specialGainsTotal = specialRate.reduce((s, i) => s + i.gains, 0);
  const specialTaxableTotal = specialRate.reduce((s, i) => s + i.taxable, 0);
  const specialTax = specialRate.reduce((s, i) => s + i.tax, 0);

  const slabTaxable = Math.max(
    0,
    grossIncome - specialGainsTotal - standardDeduction - totalDeductions,
  );
  const taxableIncome = slabTaxable + specialTaxableTotal;

  const table = slabTable(input.regime, input.ageBand);
  const { slices, total: slabTax } = computeSlabs(slabTaxable, table);

  // s.87A (incl. marginal relief) is computed against the slab portion only —
  // the rebate is not available against special-rate gains under the new
  // regime, and this engine models the same rule for both regimes.
  const rebate87A = rebateFor(input.regime, slabTaxable, slabTax);
  const taxBeforeRebate = slabTax + specialTax;
  const taxAfterRebate = taxBeforeRebate - rebate87A;

  const marginalReliefApplied =
    input.regime === "new" &&
    slabTaxable > REBATE_87A_NEW_THRESHOLD &&
    slabTax > (slabTaxable - REBATE_87A_NEW_THRESHOLD);

  // Cess rounds half-up like slab slices; applied AFTER rebate/relief.
  const cess = Math.round(taxAfterRebate * HEALTH_EDU_CESS_RATE);
  const totalTax = taxAfterRebate + cess;

  const tdsCredits = input.tdsCredits ?? 0;
  const refundOrDue = tdsCredits - totalTax;
  const effectiveRate = grossIncome === 0 ? 0 : totalTax / grossIncome;

  return {
    grossIncome,
    standardDeduction,
    totalDeductions,
    taxableIncome,
    slabBreakdown: slices,
    slabTax,
    specialRate,
    taxBeforeRebate,
    rawTax: taxBeforeRebate,
    rebate87A,
    marginalReliefApplied,
    taxAfterRebate,
    cess,
    totalTax,
    tdsCredits,
    refundOrDue,
    effectiveRate,
  };
}

/**
 * s.87A rebate incl. new-regime marginal relief.
 * New regime, at/below threshold: full rebate up to the statutory cap.
 * New regime, above threshold: marginal relief caps payable (pre-cess) tax at
 * the excess of income over the threshold. TODO(verify) exact formula.
 * Old regime: flat threshold/cap, no marginal relief modelled.
 */
function rebateFor(regime: TaxInput["regime"], taxableIncome: number, taxBeforeRebate: number): number {
  if (regime === "old") {
    if (taxableIncome <= REBATE_87A_OLD_THRESHOLD) {
      return Math.min(taxBeforeRebate, REBATE_87A_OLD_MAX_AMOUNT);
    }
    return 0;
  }
  if (taxableIncome <= REBATE_87A_NEW_THRESHOLD) {
    return Math.min(taxBeforeRebate, REBATE_87A_NEW_MAX_AMOUNT);
  }
  if (!MARGINAL_RELIEF_ENABLED_NEW) return 0;
  const excessOverThreshold = taxableIncome - REBATE_87A_NEW_THRESHOLD;
  if (taxBeforeRebate > excessOverThreshold) {
    return taxBeforeRebate - excessOverThreshold;
  }
  return 0;
}

/** Both regimes' totals for the same citizen inputs — powers comparison mode. */
export function compareRegimes(input: TaxInput): { new: TaxBreakdown; old: TaxBreakdown } {
  return {
    new: computeTax({ ...input, regime: "new" }),
    old: computeTax({ ...input, regime: "old" }),
  };
}
