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
export const GOLDEN_CASES: readonly GoldenCase[] = [
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
