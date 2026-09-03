/**
 * Exact-paise statutory engine for AY 2026-27 (s.115BAC default regime plus the
 * old regime for comparison). Pure: no I/O, no React, deterministic over plain
 * data.
 *
 * WHY A SECOND ENGINE. `lib/engine/tax.ts` is the rupee-integer engine the
 * ledger, the harness and 72 golden vectors depend on; it rounds each slab
 * slice to the rupee and never applies s.288A/288B. This module is the
 * dashboard's reactive engine: it computes in integer paise (BigInt inside, so
 * 12.5% of ₹1 is 12.5 paise → 13, never 0.125 × 100 drifting through IEEE 754),
 * rounds total income u/s 288A and tax u/s 288B at the two statutory boundaries
 * and nowhere else, and exposes the marginal-relief interval as a number the UI
 * can print. Every rate and edge is imported from `lib/engine/constants.ts` —
 * there is one table of slabs in this repo, and this file does not add another.
 * `lib/__tests__/taxEngine.test.ts` pins the two engines to each other on the
 * pre-288B figure.
 *
 * Statute modelled (new regime, AY 2026-27):
 *   TI   = max(0, GTI − SD)                      SD = min(salary, ₹75,000)
 *   slab = 0 / 5 / 10 / 15 / 20 / 25 / 30 % at 4 / 8 / 12 / 16 / 20 / 24 lakh
 *   s.87A: TI ≤ ₹12,00,000 → slab tax nil (rebate ≤ ₹60,000)
 *   marginal relief: TI > ₹12,00,000 → payable = min(slab tax, TI − ₹12,00,000);
 *     binding while TI ≤ ₹12,70,588, because 60,000 + 0.15·e > e ⇔ e < 70,588.24
 *   cess 4% on the relief-adjusted figure; s.288B to the nearest ₹10 last.
 * Special-rate gains (s.111A 20%, s.112 12.5%, s.112A 12.5% above ₹1.25 lakh)
 * are priced outside the slabs, are not eroded by deductions, and do not earn
 * the rebate — the same treatment as lib/engine/tax.ts, and the reading the
 * 2025 ITAT decisions on s.87A-vs-special-rate turned on.
 *
 * KNOWN GAPS (same as the rupee engine): surcharge, s.234A/B/C, s.234F.
 */

import {
  HEALTH_EDU_CESS_RATE,
  LTCG_112_RATE,
  LTCG_112A_EXEMPTION,
  LTCG_112A_RATE,
  NEW_REGIME_ALLOWED_SECTIONS,
  OLD_REGIME_CLAIM_CAPS,
  REBATE_87A_NEW_MAX_AMOUNT,
  REBATE_87A_NEW_THRESHOLD,
  REBATE_87A_OLD_MAX_AMOUNT,
  REBATE_87A_OLD_THRESHOLD,
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
  STCG_111A_RATE,
} from "./engine/constants";
import { slabTable } from "./engine/slab";
import type { AgeBand, Regime } from "./engine/types";
import type { Claim, Persona } from "./types";
import type {
  Paise,
  RegimeComparison,
  RegimeComputation,
  ReturnFacts,
  Rupees,
  SlabSlicePaise,
  SpecialRateResultPaise,
} from "../types/tax";

/* ------------------------------------------------------- paise arithmetic -- */

const PAISE_PER_RUPEE = 100n;
const BP_DENOMINATOR = 10_000n;
/** ₹10 in paise — the s.288A / s.288B rounding unit. */
const TEN_RUPEES_PAISE = 1_000n;

/** Guard on the way out: the analogue of Math.addExact — a silent precision loss is a bug. */
function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError(`paise value ${value} exceeds the safe integer range`);
  }
  return Number(value);
}

/** Whole rupees → integer paise. Fractional rupees are refused: this boundary is whole-rupee by contract. */
export function toPaise(rupees: Rupees): Paise {
  if (!Number.isFinite(rupees) || !Number.isInteger(rupees)) {
    throw new RangeError(`expected whole rupees, got ${rupees}`);
  }
  return toSafeNumber(BigInt(rupees) * PAISE_PER_RUPEE);
}

/** Integer paise → rupees as a number with at most two decimals (display only). */
export function toRupees(paise: Paise): number {
  return paise / 100;
}

/** Integer paise → whole rupees, rounding half-up (for callers that print rupees). */
export function toWholeRupees(paise: Paise): Rupees {
  return toSafeNumber(divRoundHalfUp(BigInt(paise), PAISE_PER_RUPEE));
}

/** Percentage as a fraction (0.125) → basis points (1250), exactly. */
export function rateToBp(rate: number): number {
  const bp = Math.round(rate * 10_000);
  if (Math.abs(bp - rate * 10_000) > 1e-6) {
    throw new RangeError(`rate ${rate} is not expressible in basis points`);
  }
  return bp;
}

function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError("denominator must be positive");
  const negative = numerator < 0n;
  const n = negative ? -numerator : numerator;
  const q = n / denominator;
  const r = n % denominator;
  const rounded = r * 2n >= denominator ? q + 1n : q;
  return negative ? -rounded : rounded;
}

/** paise × rate, rounded half-up to the paisa. */
function mulBp(paise: bigint, rateBp: number): bigint {
  return divRoundHalfUp(paise * BigInt(rateBp), BP_DENOMINATOR);
}

/** Nearest multiple of ₹10, half-up (₹5 and above rounds up) — s.288A / s.288B. */
function roundToTenRupees(paise: bigint): bigint {
  return divRoundHalfUp(paise, TEN_RUPEES_PAISE) * TEN_RUPEES_PAISE;
}

const min = (a: bigint, b: bigint): bigint => (a < b ? a : b);
const max = (a: bigint, b: bigint): bigint => (a > b ? a : b);

/* ------------------------------------------------------------- constants -- */

export const NEW_REGIME_REBATE_THRESHOLD_PAISE: Paise = toPaise(REBATE_87A_NEW_THRESHOLD);

/**
 * The last rupee of total income at which marginal relief still binds under
 * the new regime. Solved from slab tax = threshold tax + 15% × excess:
 *   60,000 + 0.15·e > e  ⇔  e < 70,588.24  ⇒  e_max = 70,588.
 * Exposed so the UI prints the interval rather than a hand-typed constant.
 */
export const MARGINAL_RELIEF_UPPER_BOUND_RUPEES: Rupees = computeMarginalReliefUpperBound();

function computeMarginalReliefUpperBound(): Rupees {
  const table = slabTable("new");
  const threshold = BigInt(REBATE_87A_NEW_THRESHOLD);
  // Tax at exactly the threshold, in rupees (whole because every edge is a multiple of 20).
  let taxAtThreshold = 0n;
  for (const s of table) {
    const from = BigInt(s.from);
    if (threshold <= from) break;
    const to = s.to === Number.POSITIVE_INFINITY ? threshold : BigInt(s.to);
    const slice = min(threshold, to) - from;
    taxAtThreshold += divRoundHalfUp(slice * BigInt(rateToBp(s.rate)), BP_DENOMINATOR);
  }
  // The slab that begins at the threshold is the one the excess is taxed in.
  const next = table.find((s) => BigInt(s.from) === threshold);
  const rateAboveBp = next ? rateToBp(next.rate) : 0;
  // e < T / (1 − r)  →  in bp: e < T·10000 / (10000 − r). Largest integer strictly below.
  const numerator = taxAtThreshold * BP_DENOMINATOR;
  const denominator = BP_DENOMINATOR - BigInt(rateAboveBp);
  const exact = numerator / denominator;
  const eMax = numerator % denominator === 0n ? exact - 1n : exact;
  return toSafeNumber(threshold + eMax);
}

/* --------------------------------------------------------------- engine -- */

function standardDeduction(regime: Regime, salaryPaise: bigint): bigint {
  if (salaryPaise <= 0n) return 0n;
  const flat = BigInt(toPaise(regime === "new" ? STANDARD_DEDUCTION_NEW : STANDARD_DEDUCTION_OLD));
  return min(salaryPaise, flat);
}

function chapterVIATotal(regime: Regime, claims: ReturnFacts["chapterVIA"]): bigint {
  let total = 0n;
  for (const claim of claims) {
    const amount = BigInt(toPaise(Math.max(0, claim.amount)));
    if (regime === "new") {
      if (NEW_REGIME_ALLOWED_SECTIONS.has(claim.section)) total += amount;
      continue;
    }
    const cap = OLD_REGIME_CLAIM_CAPS[claim.section];
    total += cap === undefined ? amount : min(amount, BigInt(toPaise(cap)));
  }
  return total;
}

function slabTax(taxablePaise: bigint, regime: Regime, ageBand: AgeBand): { slices: SlabSlicePaise[]; total: bigint } {
  const slices: SlabSlicePaise[] = [];
  let total = 0n;
  for (const s of slabTable(regime, ageBand)) {
    const from = BigInt(toPaise(s.from));
    if (taxablePaise <= from) break;
    const to = s.to === Number.POSITIVE_INFINITY ? taxablePaise : BigInt(toPaise(s.to));
    const slice = min(taxablePaise, to) - from;
    const rateBp = rateToBp(s.rate);
    const tax = mulBp(slice, rateBp);
    total += tax;
    slices.push({
      fromPaise: toSafeNumber(from),
      toPaise: s.to === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : toSafeNumber(to),
      rateBp,
      taxPaise: toSafeNumber(tax),
    });
  }
  return { slices, total };
}

function specialRate(gains: ReturnFacts["specialRateGains"]): { items: SpecialRateResultPaise[]; gainsTotal: bigint; taxTotal: bigint } {
  const items: SpecialRateResultPaise[] = [];
  let gainsTotal = 0n;
  let taxTotal = 0n;
  const push = (section: SpecialRateResultPaise["section"], rupees: Rupees, rate: number, exemption: Rupees) => {
    const g = BigInt(toPaise(Math.max(0, rupees)));
    if (g <= 0n) return;
    const exempt = min(g, BigInt(toPaise(exemption)));
    const taxable = g - exempt;
    const rateBp = rateToBp(rate);
    const tax = mulBp(taxable, rateBp);
    gainsTotal += g;
    taxTotal += tax;
    items.push({
      section,
      gainsPaise: toSafeNumber(g),
      exemptPaise: toSafeNumber(exempt),
      taxablePaise: toSafeNumber(taxable),
      rateBp,
      taxPaise: toSafeNumber(tax),
    });
  };
  push("111A", gains.stcg111A, STCG_111A_RATE, 0);
  push("112A", gains.ltcg112A, LTCG_112A_RATE, LTCG_112A_EXEMPTION);
  push("112", gains.ltcg112, LTCG_112_RATE, 0);
  return { items, gainsTotal, taxTotal };
}

/**
 * s.87A with marginal relief. Returns the rebate to subtract from SLAB tax.
 * New regime above the threshold: relief caps slab tax at the excess over the
 * threshold; the rebate is whatever brings it down to that cap.
 */
function rebate87A(regime: Regime, totalIncomePaise: bigint, slabTaxPaise: bigint): { rebate: bigint; marginalRelief: boolean } {
  if (regime === "old") {
    if (totalIncomePaise <= BigInt(toPaise(REBATE_87A_OLD_THRESHOLD))) {
      return { rebate: min(slabTaxPaise, BigInt(toPaise(REBATE_87A_OLD_MAX_AMOUNT))), marginalRelief: false };
    }
    return { rebate: 0n, marginalRelief: false };
  }
  const threshold = BigInt(NEW_REGIME_REBATE_THRESHOLD_PAISE);
  if (totalIncomePaise <= threshold) {
    return { rebate: min(slabTaxPaise, BigInt(toPaise(REBATE_87A_NEW_MAX_AMOUNT))), marginalRelief: false };
  }
  const excess = totalIncomePaise - threshold;
  if (slabTaxPaise > excess) {
    return { rebate: slabTaxPaise - excess, marginalRelief: true };
  }
  return { rebate: 0n, marginalRelief: false };
}

/** The full working for one regime. */
export function computeRegime(facts: ReturnFacts, regime: Regime): RegimeComputation {
  const salary = BigInt(toPaise(Math.max(0, facts.grossSalary)));
  const other = BigInt(toPaise(Math.max(0, facts.otherIncome)));
  const special = specialRate(facts.specialRateGains);

  const grossTotalIncome = salary + other + special.gainsTotal;
  const sd = standardDeduction(regime, salary);
  const viA = chapterVIATotal(regime, facts.chapterVIA);

  // Deductions offset slab income only; they cannot erode special-rate gains.
  const slabTaxableExact = max(0n, salary + other - sd - viA);
  const totalIncomeExact = slabTaxableExact + special.gainsTotal;

  // s.288A: total income to the nearest ₹10, applied once, here. The slab pool
  // absorbs the rounding so the special-rate buckets keep their exact figures.
  const totalIncome288A = roundToTenRupees(totalIncomeExact);
  const slabTaxable = max(0n, totalIncome288A - special.gainsTotal);

  const slabs = slabTax(slabTaxable, regime, facts.ageBand);
  const { rebate, marginalRelief } = rebate87A(regime, totalIncome288A, slabs.total);

  const taxBeforeRebate = slabs.total + special.taxTotal;
  const taxAfterRebate = taxBeforeRebate - rebate;
  const cess = mulBp(taxAfterRebate, rateToBp(HEALTH_EDU_CESS_RATE));
  const taxPayable = taxAfterRebate + cess;
  // s.288B: the payable figure to the nearest ₹10, applied once, here.
  const taxPayable288B = roundToTenRupees(taxPayable);

  const credits = BigInt(toPaise(Math.max(0, facts.taxCredits)));
  const refundOrDue = credits - taxPayable288B;

  return {
    regime,
    grossTotalIncomePaise: toSafeNumber(grossTotalIncome),
    standardDeductionPaise: toSafeNumber(sd),
    chapterVIAPaise: toSafeNumber(viA),
    totalIncomePaise: toSafeNumber(totalIncomeExact),
    totalIncome288APaise: toSafeNumber(totalIncome288A),
    slabTaxablePaise: toSafeNumber(slabTaxable),
    slabs: slabs.slices,
    slabTaxPaise: toSafeNumber(slabs.total),
    specialRate: special.items,
    specialRateTaxPaise: toSafeNumber(special.taxTotal),
    taxBeforeRebatePaise: toSafeNumber(taxBeforeRebate),
    rebate87APaise: toSafeNumber(rebate),
    marginalReliefApplied: marginalRelief,
    taxAfterRebatePaise: toSafeNumber(taxAfterRebate),
    cessPaise: toSafeNumber(cess),
    taxPayablePaise: toSafeNumber(taxPayable),
    taxPayable288BPaise: toSafeNumber(taxPayable288B),
    taxCreditsPaise: toSafeNumber(credits),
    refundOrDuePaise: toSafeNumber(refundOrDue),
    effectiveRate: grossTotalIncome === 0n ? 0 : Number(taxPayable) / Number(grossTotalIncome),
  };
}

export function computeNewRegime(facts: ReturnFacts): RegimeComputation {
  return computeRegime(facts, "new");
}

export function computeOldRegime(facts: ReturnFacts): RegimeComputation {
  return computeRegime(facts, "old");
}

/** Both regimes for the same facts, with the delta the optimizer card prints. */
export function compareRegimesExact(facts: ReturnFacts): RegimeComparison {
  const n = computeRegime(facts, "new");
  const o = computeRegime(facts, "old");
  const cheaper: Regime = n.taxPayable288BPaise <= o.taxPayable288BPaise ? "new" : "old";
  return { new: n, old: o, cheaper, savingsPaise: Math.abs(n.taxPayable288BPaise - o.taxPayable288BPaise) };
}

/** Is this total income (rupees) inside the interval where marginal relief binds? */
export function isInMarginalReliefBand(totalIncome: Rupees): boolean {
  return totalIncome > REBATE_87A_NEW_THRESHOLD && totalIncome <= MARGINAL_RELIEF_UPPER_BOUND_RUPEES;
}

/* -------------------------------------------------------------- adapter -- */

function ageBandFor(age: number): AgeBand {
  if (age >= 80) return "above_80";
  if (age >= 60) return "60_to_80";
  return "below_60";
}

/**
 * Persona → ReturnFacts. Pure reshaping, no arithmetic beyond summing rows.
 * A capital_gains fact WITHOUT asset-class metadata is slab-taxed (the same
 * labelled simplification as lib/return/compute.ts); one with metadata lands
 * in its statutory bucket. Non-equity short-term gains are slab-taxed in law.
 */
export function returnFactsFromPersona(persona: Persona, claims: Claim[] = persona.claims): ReturnFacts {
  let grossSalary = 0;
  let otherIncome = 0;
  const gains = { stcg111A: 0, ltcg112: 0, ltcg112A: 0 };
  for (const f of persona.facts) {
    if (f.kind === "salary") {
      grossSalary += f.amount;
    } else if (f.kind === "capital_gains" && f.capitalGains) {
      const { assetClass, holding } = f.capitalGains;
      if (assetClass === "equity_stt") {
        if (holding === "short") gains.stcg111A += f.amount;
        else gains.ltcg112A += f.amount;
      } else if (holding === "long") {
        gains.ltcg112 += f.amount;
      } else {
        otherIncome += f.amount;
      }
    } else {
      otherIncome += f.amount;
    }
  }
  return {
    grossSalary,
    otherIncome,
    specialRateGains: gains,
    chapterVIA: claims.map((c) => ({ section: c.section, amount: c.amount })),
    taxCredits: persona.taxPaid.reduce((sum, t) => sum + t.amount, 0),
    ageBand: ageBandFor(persona.age),
  };
}
