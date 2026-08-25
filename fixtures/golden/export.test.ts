import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeTax } from "../../lib/engine/tax";
import { GOLDEN_CASES } from "./cases";

function toPaise(rupees: number): number {
  return rupees * 100;
}

function serialize(input: (typeof GOLDEN_CASES)[number]["input"]) {
  const result = computeTax(input);
  return {
    input: {
      facts: input.facts.map((fact) => ({
        kind: fact.kind,
        amountPaise: toPaise(fact.amount),
      })),
      claims: input.claims.map((claim) => ({
        id: claim.id,
        section: claim.section,
        amountPaise: toPaise(claim.amount),
      })),
      ageBand: input.ageBand ?? null,
      regime: input.regime,
      tdsCreditsPaise:
        input.tdsCredits === undefined ? null : toPaise(input.tdsCredits),
    },
    expected: {
      grossIncomePaise: toPaise(result.grossIncome),
      standardDeductionPaise: toPaise(result.standardDeduction),
      totalDeductionsPaise: toPaise(result.totalDeductions),
      taxableIncomePaise: toPaise(result.taxableIncome),
      slabBreakdown: result.slabBreakdown.map((slice) => ({
        fromPaise: toPaise(slice.from),
        toPaise: Number.isFinite(slice.to) ? toPaise(slice.to) : null,
        rate: slice.rate,
        taxPaise: toPaise(slice.tax),
      })),
      taxBeforeRebatePaise: toPaise(result.taxBeforeRebate),
      rebate87APaise: toPaise(result.rebate87A),
      cessPaise: toPaise(result.cess),
      totalTaxPaise: toPaise(result.totalTax),
      tdsCreditsPaise: toPaise(result.tdsCredits),
      refundOrDuePaise: toPaise(result.refundOrDue),
    },
  };
}

describe("golden vector exporter", () => {
  it("writes deterministic TypeScript engine outputs for the Java conformance runner", () => {
    const vectors = GOLDEN_CASES.map((testCase) => ({
      id: testCase.id,
      ...serialize(testCase.input),
    }));
    const output = {
      schemaVersion: 1,
      generatedBy: "lib/engine/tax.ts",
      moneyUnit: "INR paise",
      rounding: "legacy TypeScript engine rounds each slab slice and cess to whole rupees, represented here as paise",
      vectors,
    };
    const outputPath = path.resolve(process.cwd(), "fixtures/golden/vectors.json");
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    expect(vectors).toHaveLength(GOLDEN_CASES.length);
  });
});
