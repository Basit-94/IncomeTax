/**
 * Data models for the AY 2026-27 dashboard: the return facts the exact-paise
 * engine consumes, its results, the AIS rows the scrutiny radar watches, and
 * the CBDT feedback attribution that rides on a correction into the ledger.
 *
 * Framework-free. Money at this boundary is WHOLE RUPEES as `number`, matching
 * lib/types.ts; the engine converts to integer paise internally and reports
 * paise back out (fields suffixed `Paise`), so nothing here ever holds a
 * fractional rupee.
 */

import type { AgeBand, Regime } from "../lib/engine/types";
import type { Claim, IncomeKind, Persona } from "../lib/types";
import type { AISFeedbackCode } from "../lib/compliance/aisFeedback";

export type { AgeBand, Regime };
export type { AISFeedbackCode };

/* -------------------------------------------------------------- inputs -- */

/** Integer paise. A `number` here is always a safe integer; the engine asserts it. */
export type Paise = number;

/** Whole rupees. */
export type Rupees = number;

/** One Chapter VI-A claim line (80C, 80D, 24(b) …), whole rupees. */
export interface ClaimLine {
  section: string;
  amount: Rupees;
}

/**
 * Special-rate capital gains, whole rupees, already netted per section.
 * These leave the slab pool and are priced at their own rates.
 */
export interface SpecialRateGains {
  /** s.111A — STCG on STT-paid listed equity / equity MF, 20%. */
  stcg111A: Rupees;
  /** s.112 — other LTCG without indexation, 12.5%. */
  ltcg112: Rupees;
  /** s.112A — LTCG on STT-paid listed equity, 12.5% above the ₹1.25 lakh threshold. */
  ltcg112A: Rupees;
}

/**
 * Everything the engine needs for one return. Salary is separate because the
 * standard deduction is a deduction FROM salary and cannot exceed it.
 */
export interface ReturnFacts {
  grossSalary: Rupees;
  /** Interest, dividend, rent, business/other — everything slab-taxed that is not salary. */
  otherIncome: Rupees;
  specialRateGains: SpecialRateGains;
  /** Chapter VI-A claims. Old regime only, except 80CCD(2). */
  chapterVIA: ClaimLine[];
  /** TDS + advance tax + self-assessment already paid. */
  taxCredits: Rupees;
  ageBand: AgeBand;
}

/* ------------------------------------------------------------- results -- */

export interface SlabSlicePaise {
  fromPaise: Paise;
  /** Number.POSITIVE_INFINITY for the top slab. */
  toPaise: number;
  /** Basis points: 500 = 5%. */
  rateBp: number;
  taxPaise: Paise;
}

export interface SpecialRateResultPaise {
  section: "111A" | "112" | "112A";
  gainsPaise: Paise;
  exemptPaise: Paise;
  taxablePaise: Paise;
  rateBp: number;
  taxPaise: Paise;
}

/** The full working for one regime, every figure in integer paise. */
export interface RegimeComputation {
  regime: Regime;
  grossTotalIncomePaise: Paise;
  standardDeductionPaise: Paise;
  chapterVIAPaise: Paise;
  /** Total income before s.288A rounding. */
  totalIncomePaise: Paise;
  /** Total income rounded to the nearest ₹10 u/s 288A — what the slabs run on. */
  totalIncome288APaise: Paise;
  slabTaxablePaise: Paise;
  slabs: SlabSlicePaise[];
  slabTaxPaise: Paise;
  specialRate: SpecialRateResultPaise[];
  specialRateTaxPaise: Paise;
  /** Slab + special-rate tax, before s.87A. */
  taxBeforeRebatePaise: Paise;
  /** s.87A rebate, including the marginal-relief component. */
  rebate87APaise: Paise;
  marginalReliefApplied: boolean;
  /** Tax after rebate and relief, before cess. */
  taxAfterRebatePaise: Paise;
  cessPaise: Paise;
  /** Tax + cess, exact paise, before s.288B. */
  taxPayablePaise: Paise;
  /** Tax + cess rounded to the nearest ₹10 u/s 288B — the figure the return prints. */
  taxPayable288BPaise: Paise;
  taxCreditsPaise: Paise;
  /** Positive = refund; negative = balance payable. Computed on the s.288B figure. */
  refundOrDuePaise: Paise;
  /** taxPayable / grossTotalIncome, as a fraction; 0 when no income. Display only. */
  effectiveRate: number;
}

export interface RegimeComparison {
  new: RegimeComputation;
  old: RegimeComputation;
  cheaper: Regime;
  /** |new − old| on the s.288B figure, paise. */
  savingsPaise: Paise;
}

/* ------------------------------------------------------- scrutiny radar -- */

/** One pre-filled row from AIS / TIS / 26AS as the radar sees it. */
export interface AISItem {
  id: string;
  label: string;
  kind: IncomeKind;
  statement: "AIS" | "TIS" | "26AS" | "SFT";
  reporter: string;
  preFilled: Rupees;
  declared: Rupees;
}

/** The variance test. `varianceBp` is exact: (pre − declared) × 10 000 / pre, rounded half-up. */
export interface AISVariance {
  preFilled: Rupees;
  declared: Rupees;
  /** Basis points of the pre-filled figure. Negative when the citizen declared MORE. */
  varianceBp: number;
  /** varianceBp / 100, for display. */
  variancePercent: number;
  /** True when the reduction is past the CASS threshold (strictly greater than 20%). */
  exceedsThreshold: boolean;
}

/**
 * The statutory attribution that binds a disputed AIS row to a CBDT code. It is
 * appended to the correction in the ledger and travels on the submission
 * payload, so the department sees the citizen's position with the return
 * rather than months later in a s.143(1)(a) exchange.
 */
export interface AISDiscrepancyAttribution {
  factId: string;
  code: AISFeedbackCode;
  preFilled: Rupees;
  declared: Rupees;
  varianceBp: number;
  /** Required for CODE_2; optional otherwise. */
  explanation: string;
  /** File name only. Nothing is uploaded in this prototype. */
  proofName?: string;
  /** ISO timestamp. */
  at: string;
}

/** Metadata for the five codes as the modal renders them. */
export interface CBDTFeedbackOption {
  code: AISFeedbackCode;
  label: string;
  help: string;
  requiresExplanation: boolean;
  /** CODE_1 keeps the department's figure; picking it withdraws the reduction. */
  keepsReportedFigure: boolean;
}

/* ------------------------------------------------------------ dashboard -- */

/** The seven cards, in grid order. */
export type DashboardCardId =
  | "file_return"
  | "match_records"
  | "regime_optimizer"
  | "pay_tax"
  | "notices"
  | "return_status"
  | "calendar";

/** What a card shows in its live meta line. */
export interface DashboardCardMeta {
  /** A short mono figure or date, e.g. "₹8,400 back" or "31 Jul". */
  value: string;
  /** Plain words beside it. */
  caption: string;
  tone?: "neutral" | "good" | "warn" | "alarm";
}

/** Adapter contract: a persona becomes ReturnFacts without any arithmetic in the UI. */
export type ReturnFactsAdapter = (persona: Persona, claims?: Claim[]) => ReturnFacts;
