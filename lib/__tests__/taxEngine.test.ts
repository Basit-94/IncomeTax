import { describe, expect, it } from "vitest";
import { computeTax } from "../engine/tax";
import type { TaxInput } from "../engine/types";
import {
  MARGINAL_RELIEF_UPPER_BOUND_RUPEES,
  compareRegimesExact,
  computeNewRegime,
  computeOldRegime,
  isInMarginalReliefBand,
  rateToBp,
  returnFactsFromPersona,
  toPaise,
  toWholeRupees,
} from "../taxEngine";
import { PERSONAS } from "../personas";
import type { ReturnFacts } from "../../types/tax";

const facts = (over: Partial<ReturnFacts> = {}): ReturnFacts => ({
  grossSalary: 0,
  otherIncome: 0,
  specialRateGains: { stcg111A: 0, ltcg112: 0, ltcg112A: 0 },
  chapterVIA: [],
  taxCredits: 0,
  ageBand: "below_60",
  ...over,
});

/** Non-salary income carries no standard deduction, so total income equals the input exactly. */
const other = (amount: number) => facts({ otherIncome: amount });

describe("paise arithmetic", () => {
  it("converts whole rupees to integer paise and refuses fractions", () => {
    expect(toPaise(1)).toBe(100);
    expect(toPaise(1_200_000)).toBe(120_000_000);
    expect(() => toPaise(0.1)).toThrow(RangeError);
  });

  it("expresses every statutory rate in exact basis points", () => {
    expect(rateToBp(0.05)).toBe(500);
    expect(rateToBp(0.125)).toBe(1250);
    expect(rateToBp(0.04)).toBe(400);
  });

  it("12.5% of one rupee is 12.5 paise, rounded half-up to 13 — no IEEE 754 drift", () => {
    const r = computeNewRegime(facts({ specialRateGains: { stcg111A: 0, ltcg112: 1, ltcg112A: 0 } }));
    expect(r.specialRate[0].taxPaise).toBe(13);
  });
});

describe("new regime u/s 115BAC, AY 2026-27", () => {
  it("nil tax at and below ₹12,00,000 via the s.87A rebate", () => {
    expect(computeNewRegime(other(1_200_000)).taxPayablePaise).toBe(0);
    expect(computeNewRegime(other(700_000)).taxPayablePaise).toBe(0);
    expect(computeNewRegime(other(1_200_000)).rebate87APaise).toBe(toPaise(60_000));
  });

  it("standard deduction is ₹75,000 and never exceeds the salary", () => {
    expect(computeNewRegime(facts({ grossSalary: 1_275_000 })).standardDeductionPaise).toBe(toPaise(75_000));
    expect(computeNewRegime(facts({ grossSalary: 1_275_000 })).taxPayablePaise).toBe(0);
    expect(computeNewRegime(facts({ grossSalary: 40_000 })).standardDeductionPaise).toBe(toPaise(40_000));
  });

  it("marginal relief caps pre-cess tax at the excess over ₹12,00,000", () => {
    const r = computeNewRegime(other(1_210_000));
    expect(r.marginalReliefApplied).toBe(true);
    expect(r.taxAfterRebatePaise).toBe(toPaise(10_000));
    expect(r.cessPaise).toBe(toPaise(400));
    expect(r.taxPayablePaise).toBe(toPaise(10_400));
  });

  it("the relief band ends at exactly ₹12,70,588", () => {
    expect(MARGINAL_RELIEF_UPPER_BOUND_RUPEES).toBe(1_270_588);
    expect(isInMarginalReliefBand(1_200_001)).toBe(true);
    expect(isInMarginalReliefBand(1_270_588)).toBe(true);
    expect(isInMarginalReliefBand(1_270_589)).toBe(false);
    // Near the top of the band the relief is worth rupees, not lakhs: at ₹12,70,580 the slab
    // tax is ₹70,587 against an excess of ₹70,580, so the relief is exactly ₹7.
    const nearTop = computeNewRegime(other(1_270_580));
    expect(nearTop.marginalReliefApplied).toBe(true);
    expect(nearTop.slabTaxPaise - nearTop.taxAfterRebatePaise).toBe(toPaise(7));
    // s.288A rounds ₹12,70,588 UP to ₹12,70,590 before the slabs run, and at the rounded
    // figure the relief no longer binds — so with statutory rounding the last income that
    // actually receives relief is ₹12,70,584. The band constant is the mathematical bound.
    const bound = computeNewRegime(other(1_270_588));
    expect(bound.totalIncome288APaise).toBe(toPaise(1_270_590));
    expect(bound.marginalReliefApplied).toBe(false);
    expect(computeNewRegime(other(1_270_584)).marginalReliefApplied).toBe(true);
    expect(computeNewRegime(other(1_270_585)).marginalReliefApplied).toBe(false);
  });

  it("beyond the band, normal slab rates apply with no rebate", () => {
    const r = computeNewRegime(other(1_300_000));
    expect(r.marginalReliefApplied).toBe(false);
    expect(r.rebate87APaise).toBe(0);
    // 20,000 + 40,000 + 15% × 1,00,000 = 75,000; cess 3,000.
    expect(r.taxAfterRebatePaise).toBe(toPaise(75_000));
    expect(r.taxPayablePaise).toBe(toPaise(78_000));
  });

  it("rounds total income u/s 288A and tax u/s 288B to the nearest ₹10, half-up", () => {
    // ₹12,00,004 → ₹12,00,000 → nil; ₹12,00,005 → ₹12,00,010 → payable ₹10 + 40p cess → ₹10.40 → ₹10.
    expect(computeNewRegime(other(1_200_004)).totalIncome288APaise).toBe(toPaise(1_200_000));
    expect(computeNewRegime(other(1_200_004)).taxPayable288BPaise).toBe(0);
    const five = computeNewRegime(other(1_200_005));
    expect(five.totalIncome288APaise).toBe(toPaise(1_200_010));
    expect(five.taxPayablePaise).toBe(1_040);
    expect(five.taxPayable288BPaise).toBe(toPaise(10));
    // ₹78,000 is already a multiple of ten; ₹1,300 of relief-band tax stays; ₹10.40 + ₹5 rounds up.
    expect(computeNewRegime(other(1_300_000)).taxPayable288BPaise).toBe(toPaise(78_000));
  });

  it("special-rate gains sit outside the slabs and outside the rebate", () => {
    const r = computeNewRegime(facts({ otherIncome: 500_000, specialRateGains: { stcg111A: 100_000, ltcg112: 0, ltcg112A: 200_000 } }));
    expect(r.slabTaxPaise).toBe(toPaise(5_000));
    expect(r.rebate87APaise).toBe(toPaise(5_000));
    const s111A = r.specialRate.find((i) => i.section === "111A");
    const s112A = r.specialRate.find((i) => i.section === "112A");
    expect(s111A?.taxPaise).toBe(toPaise(20_000));
    expect(s112A?.exemptPaise).toBe(toPaise(125_000));
    expect(s112A?.taxPaise).toBe(toPaise(9_375));
    expect(r.taxAfterRebatePaise).toBe(toPaise(29_375));
    expect(r.totalIncomePaise).toBe(toPaise(800_000));
  });
});

describe("old regime for comparison", () => {
  it("applies the 2.5/5/10 lakh slabs, ₹50,000 standard deduction and capped VI-A claims", () => {
    const r = computeOldRegime(facts({ grossSalary: 1_000_000, chapterVIA: [{ section: "80C", amount: 200_000 }] }));
    expect(r.standardDeductionPaise).toBe(toPaise(50_000));
    expect(r.chapterVIAPaise).toBe(toPaise(150_000));
    expect(r.totalIncomePaise).toBe(toPaise(800_000));
    // 12,500 + 20% × 3,00,000 = 72,500; cess 2,900.
    expect(r.taxPayablePaise).toBe(toPaise(75_400));
  });

  it("s.87A under the old regime: ≤ ₹5,00,000 nil, capped at ₹12,500", () => {
    expect(computeOldRegime(other(500_000)).taxPayablePaise).toBe(0);
    expect(computeOldRegime(other(500_010)).rebate87APaise).toBe(0);
  });

  it("compares both regimes and names the cheaper one with the delta", () => {
    const c = compareRegimesExact(facts({ grossSalary: 1_500_000 }));
    expect(c.new.taxPayable288BPaise).toBeLessThan(c.old.taxPayable288BPaise);
    expect(c.cheaper).toBe("new");
    expect(c.savingsPaise).toBe(c.old.taxPayable288BPaise - c.new.taxPayable288BPaise);
  });
});

describe("parity with lib/engine/tax.ts (the rupee engine behind the golden vectors)", () => {
  // Incomes that are multiples of ₹10 sidestep s.288A, which the rupee engine does not apply.
  const sweep = [0, 250_000, 400_000, 700_000, 1_150_000, 1_200_000, 1_200_010, 1_250_000, 1_270_580, 1_270_590, 1_500_000, 2_400_000, 3_000_000, 12_345_670];

  it.each(sweep)("salary ₹%i: pre-288B payable agrees to the rupee", (salary) => {
    for (const regime of ["new", "old"] as const) {
      const legacy = computeTax({ facts: [{ kind: "salary", amount: salary }], claims: [], regime } satisfies TaxInput);
      const exact = regime === "new" ? computeNewRegime(facts({ grossSalary: salary })) : computeOldRegime(facts({ grossSalary: salary }));
      expect(toWholeRupees(exact.taxPayablePaise)).toBe(legacy.totalTax);
      expect(exact.marginalReliefApplied).toBe(legacy.marginalReliefApplied);
    }
  });

  it("the three seeded personas compute the same liability on both engines", () => {
    for (const persona of Object.values(PERSONAS)) {
      const legacy = computeTax({
        facts: persona.facts.map((f) => ({ kind: f.kind, amount: f.amount, capitalGains: f.capitalGains })),
        claims: persona.claims,
        regime: "new",
        ageBand: persona.age >= 80 ? "above_80" : persona.age >= 60 ? "60_to_80" : "below_60",
        tdsCredits: persona.taxPaid.reduce((s, t) => s + t.amount, 0),
      });
      const exact = computeNewRegime(returnFactsFromPersona(persona));
      // Personas' total incomes are multiples of ten, so s.288A is a no-op here.
      expect(toWholeRupees(exact.totalIncome288APaise)).toBe(legacy.taxableIncome);
      expect(toWholeRupees(exact.taxPayablePaise)).toBe(legacy.totalTax);
    }
  });
});
