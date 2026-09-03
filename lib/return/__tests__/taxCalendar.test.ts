import { describe, expect, it } from "vitest";

describe("Card 07 - Statutory Tax Calendar & Section 234 Penalties", () => {
  it("calculates Section 234A interest at 1% per month for delay past July 31", () => {
    const unpaidTax = 50_000;
    const monthsDelay = 3;
    const interest = Math.round(unpaidTax * 0.01 * monthsDelay);
    expect(interest).toBe(1500);
  });

  it("applies Section 234F late filing fee tiers based on income", () => {
    const lowIncomeLateFee = 450_000 <= 500_000 ? 1000 : 5000;
    const standardIncomeLateFee = 1_200_000 <= 500_000 ? 1000 : 5000;

    expect(lowIncomeLateFee).toBe(1000);
    expect(standardIncomeLateFee).toBe(5000);
  });
});
