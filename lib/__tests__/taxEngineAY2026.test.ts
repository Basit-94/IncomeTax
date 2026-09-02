import { describe, it, expect } from "vitest";
import { computeAY2026Tax } from "../taxEngineAY2026";
import type { TaxEngineInput } from "../taxEngineAY2026";

/** A salaried individual with nothing but salary. Every vector below varies it. */
function salariedCase(overrides: Partial<TaxEngineInput> = {}): TaxEngineInput {
  return {
    isSalaried: true,
    age: 30,
    grossSalary: 0,
    businessIncome: 0,
    savingsInterest: 0,
    otherIncome: 0,
    tdsPaid: 0,
    advanceTaxPaid: 0,
    section80C: 0,
    section80D: 0,
    ...overrides,
  };
}

describe("taxEngineAY2026", () => {
  it("should compute tax for default inputs correctly under both regimes", () => {
    const output = computeAY2026Tax({
      isSalaried: true,
      age: 28,
      grossSalary: 600000,
      businessIncome: 0,
      savingsInterest: 10000,
      otherIncome: 0,
      tdsPaid: 30000,
      advanceTaxPaid: 0,
      section80C: 0,
      section80D: 0,
    });

    expect(output.newRegime).toBeDefined();
    expect(output.oldRegime).toBeDefined();

    expect(output.newRegime.grossTotalIncome).toBe(610000);
    expect(output.newRegime.standardDeduction).toBe(75000);
    expect(output.newRegime.taxableIncome).toBe(535000);
    // Under new regime, since taxableIncome <= 7,00,000, the rebate u/s 87A covers the entire tax.
    expect(output.newRegime.totalTaxLiability).toBe(0);
    expect(output.newRegime.totalTaxesPaid).toBe(30000);
    expect(output.newRegime.netPayableOrRefund).toBe(-30000); // Refund due of 30,000

    expect(output.oldRegime.grossTotalIncome).toBe(610000);
    expect(output.oldRegime.standardDeduction).toBe(50000);
    expect(output.oldRegime.taxableIncome).toBe(560000);
  });
});

/**
 * The two statutory vectors the s.87A boundary turns on.
 *
 * These are not smoke tests. They sit either side of ₹12,00,000 total income,
 * which is where the new regime stops being a slab table and starts being a
 * cliff: ₹10,000 of extra income moves the liability from ₹0 to ₹10,400, and
 * without marginal relief it would move it to ₹63,960. Get the boundary wrong in
 * either direction and the figure a citizen is shown is wrong by more than the
 * income that caused it.
 */
describe("AY 2026-27 new regime — s.87A rebate and marginal relief boundary", () => {
  it("vector 1: ₹12,75,000 salary sits exactly on the threshold — full rebate, refund of the TDS", () => {
    const { newRegime } = computeAY2026Tax(
      salariedCase({ grossSalary: 1_275_000, tdsPaid: 30_000 }),
    );

    // 12,75,000 − 75,000 standard deduction lands precisely on the threshold.
    expect(newRegime.taxableIncome).toBe(1_200_000);

    // Slabs: 0–4L nil, 4–8L @5% = 20,000, 8–12L @10% = 40,000.
    expect(newRegime.slabTax).toBe(60_000);
    expect(newRegime.taxBeforeRebate).toBe(60_000);

    // At or below the threshold this is a rebate, not relief — the distinction
    // the UI shows the citizen, and it is capped at 60,000, which this equals.
    expect(newRegime.rebate87A).toBe(60_000);
    expect(newRegime.marginalRelief).toBe(0);

    // Nothing left to charge cess on.
    expect(newRegime.cess).toBe(0);
    expect(newRegime.totalTaxLiability).toBe(0);

    // The whole ₹30,000 deducted at source comes back.
    expect(newRegime.netPayableOrRefund).toBe(-30_000);
  });

  it("vector 2: ₹12,85,000 salary is ₹10,000 over — marginal relief caps the tax at the excess", () => {
    const { newRegime } = computeAY2026Tax(
      salariedCase({ grossSalary: 1_285_000, tdsPaid: 0 }),
    );

    expect(newRegime.taxableIncome).toBe(1_210_000);

    // Slabs: 20,000 + 40,000 + (10,000 @15% = 1,500).
    expect(newRegime.slabTax).toBe(61_500);
    expect(newRegime.taxBeforeRebate).toBe(61_500);

    // Past the threshold the same mechanism is relief, not rebate. Tnormal
    // (61,500) exceeds ΔI (10,000), so relief = 61,500 − 10,000.
    expect(newRegime.rebate87A).toBe(0);
    expect(newRegime.marginalRelief).toBe(51_500);

    // Pre-cess tax equals the excess income itself. That is the entire point of
    // the provision: the extra ₹10,000 of income can cost at most ₹10,000 of tax.
    expect(newRegime.taxAfterRebate).toBe(10_000);
    expect(newRegime.cess).toBe(400); // 4% of 10,000, charged after relief
    expect(newRegime.totalTaxLiability).toBe(10_400);

    // Payable, so this is the case that must route through Challan 280.
    expect(newRegime.netPayableOrRefund).toBe(10_400);
  });

  it("the cliff between the two vectors is ₹10,400, not ₹63,960", () => {
    const below = computeAY2026Tax(salariedCase({ grossSalary: 1_275_000 })).newRegime;
    const above = computeAY2026Tax(salariedCase({ grossSalary: 1_285_000 })).newRegime;

    // Without relief the liability at 12,10,000 would be 61,500 + 4% = 63,960.
    expect(above.totalTaxLiability - below.totalTaxLiability).toBe(10_400);
    expect(above.totalTaxLiability).toBeLessThan(63_960);
  });
});

describe("AY 2026-27 — deductions by regime", () => {
  it("drops 80C and 80D in the new regime but keeps 80CCD(2)", () => {
    const withClaims = computeAY2026Tax(
      salariedCase({
        grossSalary: 1_500_000,
        section80C: 150_000,
        section80D: 25_000,
        section80CCD2: 100_000,
      }),
    );
    const withoutClaims = computeAY2026Tax(salariedCase({ grossSalary: 1_500_000 }));

    // New regime: only the employer NPS contribution reduces taxable income.
    expect(withClaims.newRegime.taxableIncome).toBe(
      withoutClaims.newRegime.taxableIncome - 100_000,
    );

    // Old regime: all three are allowable, so 2,75,000 comes off.
    expect(withClaims.oldRegime.taxableIncome).toBe(
      withoutClaims.oldRegime.taxableIncome - 275_000,
    );
  });

  it("gives no standard deduction to a non-salaried filer", () => {
    const { newRegime } = computeAY2026Tax(
      salariedCase({ isSalaried: false, grossSalary: 0, businessIncome: 1_275_000 }),
    );
    expect(newRegime.standardDeduction).toBe(0);
    // So the same gross that was exactly at the threshold for a salaried filer is
    // 75,000 over it here, and the rebate is gone.
    expect(newRegime.taxableIncome).toBe(1_275_000);
    expect(newRegime.totalTaxLiability).toBeGreaterThan(0);
  });
});

describe("AY 2026-27 — taxes paid", () => {
  it("credits self-assessment tax u/s 140A exactly like TDS, clearing the balance", () => {
    const before = computeAY2026Tax(
      salariedCase({ grossSalary: 1_285_000, tdsPaid: 0 }),
    ).newRegime;
    expect(before.netPayableOrRefund).toBe(10_400);

    const after = computeAY2026Tax(
      salariedCase({ grossSalary: 1_285_000, tdsPaid: 0, selfAssessmentPaid: 10_400 }),
    ).newRegime;

    expect(after.selfAssessmentPaid).toBe(10_400);
    expect(after.totalTaxesPaid).toBe(10_400);
    expect(after.netPayableOrRefund).toBe(0);
    // The liability itself is untouched — paying it does not reduce it.
    expect(after.totalTaxLiability).toBe(10_400);
  });
});
