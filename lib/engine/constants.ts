/**
 * Every rate and threshold the engine uses, in one place.
 *
 * Primary-source audit: docs/scale/rules-audit.md. Values below are aligned to
 * current Income Tax Department/CBDT publications for AY 2026-27. Remaining
 * TODO(scope) comments identify behavior deliberately outside this prototype,
 * not an unsupported claim that the whole tax code has been implemented.
 */

/* ------------------------------------------------------------- new regime -- */

// Source: Income Tax Department Budget 2026 FAQs, pp.63-65.
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
// Source: Income Tax Department Budget 2026 FAQs, pp.63-65.
export const REBATE_87A_NEW_THRESHOLD = 1_200_000;

/**
 * Maximum s.87A rebate amount under the new regime. Set to equal the total tax
 * on exactly REBATE_87A_NEW_THRESHOLD of income (60,000) so the threshold and
 * cap are mutually consistent.
 */
// Source: Income Tax Department Budget 2026 FAQs, pp.63-65; Income Tax Department AY 2026-27 salaried guidance.
export const REBATE_87A_NEW_MAX_AMOUNT = 60_000;

/**
 * Marginal relief near the cliff: for taxable income just above the threshold,
 * payable tax must not exceed the excess over the threshold. Formula here is
 * `payable = min(taxBeforeRebate, taxable - threshold)` applied BEFORE cess.
 */
// Source: Income Tax Department Budget 2026 FAQs, pp.64-65. This engine applies
// the published marginal comparison before the separately stated 4% cess.
export const MARGINAL_RELIEF_ENABLED_NEW = true;

/** Standard deduction for salaried taxpayers, new regime only. */
// Source: Income Tax Department Budget 2026 FAQs, p.64; Income Tax Department salary guide.
export const STANDARD_DEDUCTION_NEW = 75_000;

/**
 * Sections whose claims are ALLOWED under the new regime. Only standard
 * deduction + employer NPS contribution u/s 80CCD(2). Everything else is
 * silently excluded from totalDeductions (the UI layer should surface why).
 */
// Source: Income Tax Department AY 2026-27 salaried guidance. The v1 engine
// intentionally models only 80CCD(2); 80CCH/80JJAA are outside this fixture.
export const NEW_REGIME_ALLOWED_SECTIONS: ReadonlySet<string> = new Set([
  "80CCD(2)",
  "80CCD_2", // tolerate both spellings of the same section
]);

/* -------------------------------------------------------------- old regime -- */

// Source: Income Tax Department AY 2026-27 salaried guidance.
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
// Source: Income Tax Department AY 2026-27 salaried and senior-citizen guidance.
export const OLD_REGIME_BASIC_EXEMPTION_BY_AGE: Record<
  "below_60" | "60_to_80" | "above_80",
  number
> = {
  below_60: 250_000,
  "60_to_80": 300_000,
  above_80: 500_000,
};

/** Standard deduction for salaried taxpayers, old regime. */
// Source: Income Tax Department threshold-limits and salary guidance for AY 2026-27.
export const STANDARD_DEDUCTION_OLD = 50_000;

/** s.87A also exists in the old regime (income <= 5L, rebate capped). */
// Source: Income Tax Department AY 2026-27 salaried guidance.
export const REBATE_87A_OLD_THRESHOLD = 500_000;
export const REBATE_87A_OLD_MAX_AMOUNT = 12_500;

/** Per-section caps for chapter VI-A claims under the old regime. */
// Source: Income Tax Department AY 2026-27 salaried guidance. The fixture
// retains only the 80C/80CCC/80GG ceilings; the 80GG least-of-three formula is
// a TODO(scope) limitation of this prototype.
export const OLD_REGIME_CLAIM_CAPS: Readonly<Record<string, number>> = {
  "80C": 150_000,
  "80CCC": 150_000,
  "80GG": 60_000,
};

/* ------------------------------------------------------------------ common -- */

/** Health and education cess on tax-after-rebate. */
// Source: Income Tax Department AY 2026-27 salaried guidance and Finance Bill 2026.
export const HEALTH_EDU_CESS_RATE = 0.04;

/**
 * KNOWN GAPS deliberately not modelled in v1:
 * - Surcharge (10/15/25/37%) on high incomes — absent entirely.
 * - Special capital-gains rates (111A/112 etc.) — capital_gains taxed at slab.
 * - s.234A/B/C interest and s.234F fee on late filing.
 * - Rebate/marginal relief under the OLD regime's own interaction rules.
 */
