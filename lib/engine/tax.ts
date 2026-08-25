/**
 * Pure tax computation. No I/O, no React, no Next.js — deterministic functions
 * over plain data, fully unit-testable.
 *
 * KNOWN GAPS (see constants.ts): surcharge, special capital-gains rates,
 * s.234A/B/C interest. capital_gains income is taxed at ordinary slab rates
 * here. TODO(verify): s.111A/112/112A special rates for FY 2026-27 before any
 * real use.
 */

import {
  HEALTH_EDU_CESS_RATE,
  MARGINAL_RELIEF_ENABLED_NEW,
  NEW_REGIME_ALLOWED_SECTIONS,
  OLD_REGIME_CLAIM_CAPS,
  REBATE_87A_NEW_MAX_AMOUNT,
  REBATE_87A_NEW_THRESHOLD,
  REBATE_87A_OLD_MAX_AMOUNT,
  REBATE_87A_OLD_THRESHOLD,
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
} from "./constants";
import { computeSlabs, slabTable } from "./slab";
import type { TaxBreakdown, TaxInput } from "./types";

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

export function computeTax(input: TaxInput): TaxBreakdown {
  const grossIncome = input.facts.reduce((sum, f) => sum + f.amount, 0);
  const standardDeduction = standardDeductionFor(input);
  const totalDeductions = allowedClaimTotal(input);
  const taxableIncome = Math.max(
    0,
    grossIncome - standardDeduction - totalDeductions,
  );

  const table = slabTable(input.regime, input.ageBand);
  const { slices, total: taxBeforeRebate } = computeSlabs(taxableIncome, table);

  const rebate87A = rebateFor(input.regime, taxableIncome, taxBeforeRebate);
  const taxAfterRebate = taxBeforeRebate - rebate87A;
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
    taxBeforeRebate,
    rebate87A,
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
