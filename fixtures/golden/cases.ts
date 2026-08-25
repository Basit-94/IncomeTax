import type { Claim, IncomeKind } from "../../lib/types";
import type { TaxInput } from "../../lib/engine/types";

export interface GoldenCase {
  id: string;
  input: TaxInput;
}

const fact = (kind: IncomeKind, amount: number) => ({ kind, amount });
const claim = (id: string, section: string, amount: number): Claim => ({
  id,
  section,
  label: section,
  amount,
  evidenceAttached: true,
});

/**
 * Small, deliberately hand-readable cases at boundaries and persona shapes.
 * Expected outputs are generated from the TypeScript engine, never hand-keyed.
 */
const CURATED_CASES: readonly GoldenCase[] = [
  {
    id: "zero-income",
    input: { facts: [], claims: [], regime: "new" },
  },
  {
    id: "new-rebate-threshold",
    input: {
      facts: [fact("other", 1_200_000)],
      claims: [],
      regime: "new",
    },
  },
  {
    id: "new-rebate-first-rupee",
    input: {
      facts: [fact("other", 1_200_001)],
      claims: [],
      regime: "new",
    },
  },
  {
    id: "priya-new-claims-ignored",
    input: {
      facts: [fact("salary", 980_000), fact("interest", 6_700)],
      claims: [claim("c1", "80C", 48_000), claim("c2", "80GG", 60_000)],
      regime: "new",
      tdsCredits: 34_800,
    },
  },
  {
    id: "priya-old-claims-capped",
    input: {
      facts: [fact("salary", 980_000), fact("interest", 6_700)],
      claims: [claim("c1", "80C", 48_000), claim("c2", "80GG", 60_000)],
      regime: "old",
      ageBand: "below_60",
      tdsCredits: 34_800,
    },
  },
  {
    id: "senior-old-regime",
    input: {
      facts: [fact("salary", 1_000_000)],
      claims: [],
      regime: "old",
      ageBand: "60_to_80",
      tdsCredits: 12_345,
    },
  },
  {
    id: "rakesh-capital-gains-gap",
    input: {
      facts: [
        fact("salary", 1_860_000),
        fact("interest", 22_400),
        fact("dividend", 9_150),
        fact("capital_gains", 110_000),
      ],
      claims: [claim("r1", "80C", 150_000), claim("r2", "80D", 25_000)],
      regime: "new",
      tdsCredits: 286_840,
    },
  },
  {
    id: "top-slab-with-credit",
    input: {
      facts: [fact("salary", 5_000_000)],
      claims: [],
      regime: "new",
      tdsCredits: 500_000,
    },
  },
];

/**
 * The former TypeScript suite also exercised property-style ranges. These 64
 * deterministic matrix cases make those ranges portable without hiding them
 * inside a JavaScript-only loop.
 */
const MATRIX_CASES: readonly GoldenCase[] = Array.from({ length: 64 }, (_, index) => {
  const oldRegime = index % 2 === 0;
  const ageBands = ["below_60", "60_to_80", "above_80"] as const;
  const ageBand = oldRegime ? ageBands[Math.floor(index / 2) % ageBands.length] : undefined;
  const incomeKind: IncomeKind = index % 3 === 0 ? "salary" : "other";
  const claims = oldRegime
    ? [claim(`m-${index}-80c`, "80C", 90_000 + (index % 5) * 30_000)]
    : [claim(`m-${index}-nps`, "80CCD(2)", 10_000 + (index % 4) * 5_000)];
  return {
    id: `matrix-${String(index + 1).padStart(2, "0")}`,
    input: {
      facts: [
        fact(incomeKind, 300_000 + index * 37_777),
        fact("interest", (index % 7) * 1_234),
      ],
      claims,
      ageBand,
      regime: oldRegime ? "old" : "new",
      tdsCredits: index % 4 === 0 ? 0 : 12_345 + index * 321,
    },
  };
});

export const GOLDEN_CASES: readonly GoldenCase[] = [...CURATED_CASES, ...MATRIX_CASES];
