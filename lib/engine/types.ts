/**
 * Pure tax-engine types. Framework-free by design: no React, no Next.js.
 * Money is whole rupees (integer `number`), matching lib/types.ts.
 */

import type { Claim, IncomeKind } from "../types";

export type Regime = "new" | "old";

export type AgeBand = "below_60" | "60_to_80" | "above_80";

/** A single income row, stripped of provenance — the engine is pure arithmetic. */
export interface TaxInputFact {
  kind: IncomeKind;
  amount: number;
}

export interface TaxInput {
  facts: TaxInputFact[];
  /** Citizen-claimed deductions (80C, 80D, 80GG, 80CCD(2)...). Allowed sections are regime-dependent. */
  claims: Claim[];
  /**
   * Only affects old-regime basic exemption (senior/super-senior).
   * New-regime slabs are age-independent. TODO(verify): whether IT Act 2025
   * retains senior-citizen basic-exemption differences under the old regime.
   */
  ageBand?: AgeBand;
  regime: Regime;
  /** Total tax deducted at source / advance tax credits to offset against liability. */
  tdsCredits?: number;
}

/** One progressive-slab slice of taxable income and its tax. */
export interface SlabSlice {
  from: number; // inclusive
  to: number; // exclusive; Number.POSITIVE_INFINITY for the top slab
  rate: number; // decimal fraction, e.g. 0.05
  tax: number; // integer rupees for this slice
}

export interface TaxBreakdown {
  grossIncome: number;
  standardDeduction: number;
  /** Chapter VI-A style claim deductions actually ALLOWED under the regime. */
  totalDeductions: number;
  taxableIncome: number;
  slabBreakdown: SlabSlice[];
  taxBeforeRebate: number;
  rawTax: number;
  /** s.87A rebate + marginal relief combined effect, integer rupees. */
  rebate87A: number;
  marginalReliefApplied: boolean;
  taxAfterRebate: number;
  cess: number;
  totalTax: number;
  tdsCredits: number;
  /** Positive = refund due to citizen; negative = balance payable. */
  refundOrDue: number;
  /** totalTax / grossIncome, 0 when grossIncome is 0. Not rounded — display concern. */
  effectiveRate: number;
}
