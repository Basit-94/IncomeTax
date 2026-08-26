import { describe, it, expect } from "vitest";
import { computeAY2026Tax } from "../taxEngineAY2026";

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
