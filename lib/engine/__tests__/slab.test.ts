import { describe, expect, it } from "vitest";
import { computeSlabs, slabTable } from "../slab";

/**
 * Boundary tests at every slab edge (income = edge ± 1), plus the rounding
 * rule's observable consequences. These test the SLAB LAYER directly so the
 * s.87A rebate (which zeroes tax below Rs 12 lakh) does not mask the edges.
 */

const NEW = slabTable("new");
const OLD = slabTable("old", "below_60");

function newRegimeTax(income: number): number {
  return computeSlabs(income, NEW).total;
}
function oldRegimeTax(income: number): number {
  return computeSlabs(income, OLD).total;
}

describe("new-regime slab edges", () => {
  it.each([
    [399_999, 0], // just below 4L: nil band
    [400_000, 0],
    [400_001, Math.round(1 * 0.05)], // first rupee of the 5% band rounds to 0
    [400_002, Math.round(2 * 0.05)], // ...first full rupee appears at +2
    [799_999, Math.round(399_999 * 0.05)], // 19999.95 -> half-up -> 20000
    [800_000, 20_000],
    [800_001, 20_000 + Math.round(1 * 0.1)],
    [1_199_999, 60_000],
    [1_200_000, 60_000],
    [1_200_001, 60_000 + Math.round(1 * 0.15)],
    [1_599_999, 60_000 + Math.round(399_999 * 0.15)],
    [1_600_000, 120_000],
    [1_600_001, 120_000 + Math.round(1 * 0.2)],
    [1_999_999, 200_000], // 120000 + round(79999.8)=80000
    [2_000_000, 200_000],
    [2_000_001, 200_000 + Math.round(1 * 0.25)],
    [2_399_999, 300_000], // 200000 + round(99999.75)=100000
    [2_400_000, 300_000],
    [2_400_001, 300_000 + Math.round(1 * 0.3)],
    [2_400_004, 300_001], // 4 * 0.3 = 1.2 -> 1
  ])("income %d -> slab tax %d", (income, expected) => {
    expect(newRegimeTax(income)).toBe(expected);
  });

  it("top slab is open-ended and covers arbitrarily high income", () => {
    expect(slabTable("new").at(-1)?.to).toBe(Number.POSITIVE_INFINITY);
    expect(newRegimeTax(10_000_000)).toBe(
      300_000 + Math.round((10_000_000 - 2_400_000) * 0.3),
    );
  });
});

describe("old-regime slab edges (below-60)", () => {
  it.each([
    [249_999, 0],
    [250_000, 0],
    [250_040, Math.round(40 * 0.05)], // 2
    [499_999, Math.round(249_999 * 0.05)], // 12500
    [500_000, 12_500],
    [500_001, 12_500 + Math.round(1 * 0.2)],
    [999_999, 12_500 + Math.round(499_999 * 0.2)], // 112500
    [1_000_000, 112_500],
    [1_000_001, 112_500 + Math.round(1 * 0.3)],
  ])("income %d -> slab tax %d", (income, expected) => {
    expect(oldRegimeTax(income)).toBe(expected);
  });
});

describe("old-regime age bands", () => {
  it("senior citizens get a raised basic exemption (TODO(verify) constant)", () => {
    const senior = slabTable("old", "60_to_80");
    expect(senior[0]).toMatchObject({ from: 300_000, rate: 0.05 });
    expect(computeSlabs(350_000, senior).total).toBe(Math.round(50_000 * 0.05));
  });

  it("super-senior basic exemption swallows both nil bands' edges", () => {
    const superSenior = slabTable("old", "above_80");
    expect(computeSlabs(500_000, superSenior).total).toBe(0);
    // first slab rupees at 20% round to zero until the third (0.2*3 -> 1)
    expect(computeSlabs(500_003, superSenior).total).toBe(1);
  });
});

describe("slab slice integrity", () => {
  it("slice taxes are integers summing to the total", () => {
    for (const income of [346_240, 911_700, 1_926_550, 123_456]) {
      const { slices, total } = computeSlabs(income, NEW);
      const sum = slices.reduce((s, x) => s + x.tax, 0);
      expect(sum).toBe(total);
      for (const s of slices) {
        expect(Number.isInteger(s.tax)).toBe(true);
        expect(Number.isInteger(s.from)).toBe(true);
      }
    }
  });
});
