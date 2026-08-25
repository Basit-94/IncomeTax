/**
 * Every rate and threshold the engine uses, in one place.
 *
 * PROVENANCE DISCIPLINE (non-negotiable): no value here is primary-sourced in
 * this repo. The reference PDF (docs/AUDIT.md; full text at
 * C:\Users\anike\AppData\Local\Temp\opencode\eportal.txt) confirms AY 2026-27
 * runs under the new Income-tax Act 2025, mentions a Rs 12 lakh nil-tax
 * threshold on p21, and that regime selection defaults to the new regime — but
 * contains NO slab tables. So EVERY constant below carries TODO(verify).
 */

/* ------------------------------------------------------------- new regime -- */

// TODO(verify): new-regime slab edges & rates for FY 2026-27 (first Tax Year
// under IT Act 2025) — check Finance Act 2026 / incometax.gov.in tax calculator.
// Structure matches the widely reported FY 2025-26 Budget slabs, carried forward.
export const NEW_REGIME_SLABS: ReadonlyArray<{
  upTo: number; // exclusive upper edge of this slab
  rate: number;
}> = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 0.05 },
  { upTo: 1_200_000, rate: 0.1 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.2 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.3 },
];

/** Income at or below this has nil liability via s.87A rebate (PDF p21 mentions "Rs 12 lakh"). */
// TODO(verify): exact s.87A nil-tax threshold for FY 2026-27 — Finance Act 2026 / incometax.gov.in.
export const REBATE_87A_NEW_THRESHOLD = 1_200_000;

/**
 * Maximum s.87A rebate amount under the new regime. Set to equal the total tax
 * on exactly REBATE_87A_NEW_THRESHOLD of income (60,000) so the threshold and
 * cap are mutually consistent.
 */
// TODO(verify): statutory rebate cap (was 25,000 at the 7L era; 60,000 at the 12L era) — Finance Act 2026 text.
export const REBATE_87A_NEW_MAX_AMOUNT = 60_000;

/**
 * Marginal relief near the cliff: for taxable income just above the threshold,
 * payable tax must not exceed the excess over the threshold. Formula here is
 * `payable = min(taxBeforeRebate, taxable - threshold)` applied BEFORE cess.
 */
// TODO(verify): exact marginal-relief formula and whether cess is inside or outside it — Finance Act 2026 / CBDT examples.
export const MARGINAL_RELIEF_ENABLED_NEW = true;

/** Standard deduction for salaried taxpayers, new regime only. */
// TODO(verify): Rs 75,000 standard deduction for salaried under new regime — Finance Act 2026 / incometax.gov.in.
export const STANDARD_DEDUCTION_NEW = 75_000;

/**
 * Sections whose claims are ALLOWED under the new regime. Only standard
 * deduction + employer NPS contribution u/s 80CCD(2). Everything else is
 * silently excluded from totalDeductions (the UI layer should surface why).
 */
// TODO(verify): full list of new-regime-permitted deductions under IT Act 2025 (e.g. 80CCH, Agniveer) — Finance Act 2026.
export const NEW_REGIME_ALLOWED_SECTIONS: ReadonlySet<string> = new Set([
  "80CCD(2)",
  "80CCD_2", // tolerate both spellings of the same section
]);

/* -------------------------------------------------------------- old regime -- */

// TODO(verify): old-regime slab edges & rates — check whether IT Act 2025 still
// offers the old regime at all for AY 2026-27 and its exact slabs.
export const OLD_REGIME_SLABS: ReadonlyArray<{ upTo: number; rate: number }> = [
  { upTo: 250_000, rate: 0 },
  { upTo: 500_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.2 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.3 },
];

/**
 * Old-regime basic exemption by age band (senior citizens get a higher
 * nil band; implemented by replacing the first slab's edge).
 */
// TODO(verify): senior (60-80) 300k / super-senior (>80) 500k basic exemption survival under IT Act 2025.
export const OLD_REGIME_BASIC_EXEMPTION_BY_AGE: Record<
  "below_60" | "60_to_80" | "above_80",
  number
> = {
  below_60: 250_000,
  "60_to_80": 300_000,
  above_80: 500_000,
};

/** Standard deduction for salaried taxpayers, old regime. */
// TODO(verify): Rs 50,000 old-regime standard deduction — Finance Act 2026.
export const STANDARD_DEDUCTION_OLD = 50_000;

/** s.87A also exists in the old regime (income <= 5L, rebate capped). */
// TODO(verify): old-regime 87A threshold 500k / cap 12,500 survival under IT Act 2025.
export const REBATE_87A_OLD_THRESHOLD = 500_000;
export const REBATE_87A_OLD_MAX_AMOUNT = 12_500;

/** Per-section caps for chapter VI-A claims under the old regime. */
// TODO(verify): 80C cap 150k, 80D cap 25k (50k senior), 80GG cap 60k — Income-tax Act 2025 chapter VI-A text.
export const OLD_REGIME_CLAIM_CAPS: Readonly<Record<string, number>> = {
  "80C": 150_000,
  "80CCC": 150_000,
  "80GG": 60_000,
};

/* ------------------------------------------------------------------ common -- */

/** Health and education cess on tax-after-rebate. */
// TODO(verify): 4% cess rate survival/rename under IT Act 2025 — Finance Act 2026.
export const HEALTH_EDU_CESS_RATE = 0.04;

/**
 * KNOWN GAPS deliberately not modelled in v1 (each would need TODO(verify)
 * constants once sourced):
 * - Surcharge (10/15/25/37%) on high incomes — absent entirely.
 * - Special capital-gains rates (111A/112 etc.) — capital_gains taxed at slab.
 * - s.234A/B/C interest and s.234F fee on late filing.
 * - Rebate/marginal relief under the OLD regime's own interaction rules.
 */
