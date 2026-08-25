import { describe, expect, it } from "vitest";
import type { Claim, IncomeKind } from "../../types";
import { compareRegimes, computeTax } from "../tax";
import type { TaxInput } from "../types";

function input(
  facts: { kind: IncomeKind; amount: number }[],
  opts: Partial<TaxInput> = {},
): TaxInput {
  return {
    facts,
    claims: [],
    regime: "new",
    ...opts,
  };
}

const salaryOnly = (amount: number) => input([{ kind: "salary", amount }]);
// Non-salary income attracts no standard deduction — usable to pin taxable
// income exactly for the cliff tests.
const rawOnly = (amount: number) => input([{ kind: "other", amount }]);

describe("s.87A rebate cliff and marginal relief (new regime)", () => {
  // NOTE: the exact marginal-relief formula is TODO(verify) — these tests
  // encode `payable(pre-cess) = min(taxBeforeRebate, taxable - threshold)`.

  it("nil tax at and below the Rs 12 lakh threshold", () => {
    expect(computeTax(rawOnly(1_199_999)).totalTax).toBe(0);
    expect(computeTax(rawOnly(1_200_000)).totalTax).toBe(0);
  });

  it("first rupee above the threshold costs at most that rupee (+cess rounding)", () => {
    const b = computeTax(rawOnly(1_200_001));
    expect(b.rebate87A).toBe(59_999); // marginal relief engaged
    expect(b.totalTax).toBeLessThanOrEqual(2);
  });

  it("in the relief zone, pre-cess payable equals exactly the excess over the threshold", () => {
    const b = computeTax(rawOnly(1_210_000));
    const excess = 10_000;
    expect(b.taxBeforeRebate).toBe(61_500);
    expect(b.taxBeforeRebate - b.rebate87A).toBe(excess);
    expect(b.totalTax).toBe(excess + Math.round(excess * 0.04)); // 10400
  });

  it("relief disengages once slab tax exceeds the excess", () => {
    const b = computeTax(rawOnly(1_600_000));
    expect(b.rebate87A).toBe(0);
    expect(b.totalTax).toBe(120_000 + Math.round(120_000 * 0.04)); // 124800
  });

  it("monotone across the cliff with rupee steps (no discontinuity spike)", () => {
    let prev = -1;
    for (let income = 1_199_000; income <= 1_212_000; income++) {
      const tax = computeTax(rawOnly(income)).totalTax;
      expect(tax).toBeGreaterThanOrEqual(prev);
      expect(tax - prev).toBeLessThanOrEqual(16); // max one rupee + cess jump
      prev = tax;
    }
  });
});

describe("old-regime s.87A", () => {
  it("rebates up to the cap at/below the old threshold", () => {
    // taxable 540000-50000 std = 490000 <= 500000 threshold;
    // slab tax round(240000*0.05)=12000 -> rebate is the full 12000 (< 12500 cap)
    expect(
      computeTax(input([{ kind: "salary", amount: 540_000 }], { regime: "old" })).rebate87A,
    ).toBe(12_000);
  });

  it("no rebate above the threshold", () => {
    expect(computeTax(input([{ kind: "salary", amount: 900_000 }], { regime: "old" })).rebate87A).toBe(0);
  });
});

/* --------------------------------------------------------- golden personas -- */
/* Figures mirror lib/personas.ts (owned by another agent — not imported, so
   this suite cannot break when persona data evolves). */

describe("golden file: Sunita", () => {
  it("salary 420000 + interest 1240, TDS 8400 -> full refund, zero liability", () => {
    const b = computeTax(
      input(
        [
          { kind: "salary", amount: 420_000 },
          { kind: "interest", amount: 1_240 },
        ],
        { tdsCredits: 8_400 },
      ),
    );
    expect(b.grossIncome).toBe(421_240);
    expect(b.standardDeduction).toBe(75_000);
    expect(b.taxableIncome).toBe(346_240);
    expect(b.totalTax).toBe(0);
    expect(b.refundOrDue).toBe(8_400);
  });
});

describe("golden file: Priya", () => {
  const claims: Claim[] = [
    { id: "c1", section: "80C", label: "80C", amount: 48_000, evidenceAttached: true },
    { id: "c2", section: "80GG", label: "80GG", amount: 60_000, evidenceAttached: true },
  ];
  const facts = [
    { kind: "salary" as const, amount: 980_000 },
    { kind: "interest" as const, amount: 6_700 },
  ];

  it("new regime rejects/ignores 80C and 80GG claims entirely", () => {
    const b = computeTax(input(facts, { claims, tdsCredits: 34_800 }));
    expect(b.totalDeductions).toBe(0);
    // gross 986700 - std 75000 = 911700 taxable
    expect(b.taxableIncome).toBe(911_700);
    expect(b.slabBreakdown.map((s) => s.rate)).toEqual([0, 0.05, 0.1]);
    // 20000 + round(111700*0.1)=11170 -> 31170 before rebate
    expect(b.taxBeforeRebate).toBe(31_170);
    expect(b.rebate87A).toBe(31_170); // below threshold: full rebate (< cap)
    expect(b.cess).toBe(0);
    expect(b.totalTax).toBe(0);
    expect(b.refundOrDue).toBe(34_800);
  });

  it("old regime allows both claims (with caps), flipping her to a payable balance", () => {
    const b = computeTax(input(facts, { claims, regime: "old", tdsCredits: 34_800 }));
    expect(b.totalDeductions).toBe(108_000); // 48000 + 60000
    expect(b.taxableIncome).toBe(986_700 - 50_000 - 108_000);
    expect(b.refundOrDue).toBeLessThan(0);
  });

  it("compareRegimes shows the new regime is better for her", () => {
    const cmp = compareRegimes({ facts, claims, regime: "new", tdsCredits: 34_800 });
    expect(cmp.new.totalTax).toBeLessThan(cmp.old.totalTax);
  });
});

describe("golden file: Rakesh (capital gains taxed at slab — TODO(verify))", () => {
  const facts = [
    { kind: "salary" as const, amount: 1_860_000 },
    { kind: "interest" as const, amount: 22_400 },
    { kind: "dividend" as const, amount: 9_150 },
    { kind: "capital_gains" as const, amount: 110_000 },
  ];
  const claims: Claim[] = [
    { id: "r1", section: "80C", label: "80C", amount: 150_000, evidenceAttached: true },
    { id: "r2", section: "80D", label: "80D", amount: 25_000, evidenceAttached: true },
  ];

  it("new regime: internal consistency of the whole breakdown", () => {
    const b = computeTax(input(facts, { claims, tdsCredits: 286_840 }));
    expect(b.grossIncome).toBe(2_001_550);
    expect(b.grossIncome - b.standardDeduction - b.totalDeductions).toBe(b.taxableIncome);
    const slabSum = b.slabBreakdown.reduce((s, x) => s + x.tax, 0);
    expect(slabSum).toBe(b.taxBeforeRebate);
    expect(b.taxBeforeRebate - b.rebate87A + b.cess).toBe(b.totalTax);
    expect(b.tdsCredits - b.totalTax).toBe(b.refundOrDue);
    // hand-computed expectation
    expect(b.taxableIncome).toBe(1_926_550);
    expect(b.taxBeforeRebate).toBe(185_310); // 20k+40k+60k+65310
    expect(b.totalTax).toBe(185_310 + Math.round(185_310 * 0.04)); // 192722
    expect(b.refundOrDue).toBe(286_840 - 192_722);
  });

  it("new regime ignores his 80C/80D claims; old regime caps but keeps them", () => {
    expect(computeTax(input(facts, { claims })).totalDeductions).toBe(0);
    const oldB = computeTax(input(facts, { claims, regime: "old" }));
    expect(oldB.totalDeductions).toBe(175_000); // min(150000,150000)+min(25000,capless)=175000
  });
});

describe("property tests", () => {
  it("totalTax is non-decreasing in income (step 1000 over 0..3M)", () => {
    let prev = -Infinity;
    for (let income = 0; income <= 3_000_000; income += 1_000) {
      const tax = computeTax(salaryOnly(income)).totalTax;
      expect(tax).toBeGreaterThanOrEqual(prev);
      prev = tax;
    }
  });

  it("refundOrDue === tdsCredits - totalTax always", () => {
    for (const income of [300_000, 700_000, 1_200_000, 1_200_500, 5_000_000]) {
      const b = computeTax(input([{ kind: "salary", amount: income }], { tdsCredits: 40_000 }));
      expect(b.refundOrDue).toBe(b.tdsCredits - b.totalTax);
    }
  });

  it("all money outputs are integers", () => {
    for (const income of [123_457, 986_703, 1_926_551, 2_413_777]) {
      const b = computeTax(input([{ kind: "salary", amount: income }], { tdsCredits: 33_333 }));
      for (const v of [
        b.grossIncome,
        b.standardDeduction,
        b.totalDeductions,
        b.taxableIncome,
        b.taxBeforeRebate,
        b.rebate87A,
        b.cess,
        b.totalTax,
        b.tdsCredits,
        b.refundOrDue,
      ]) {
        expect(Number.isInteger(v)).toBe(true);
      }
      for (const s of b.slabBreakdown) expect(Number.isInteger(s.tax)).toBe(true);
    }
  });

  it("zero income yields all-zero liability", () => {
    const b = computeTax(input([]));
    expect(b.totalTax).toBe(0);
    expect(b.effectiveRate).toBe(0);
  });
});
