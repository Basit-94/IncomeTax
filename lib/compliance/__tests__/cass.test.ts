import { describe, it, expect } from "vitest";
import {
  CASS_AGGREGATE_RUPEE_THRESHOLD,
  CASS_VARIANCE_THRESHOLD,
  assessAisVariance,
  assessCassRisk,
} from "../cass";
import type { CassRowInput } from "../cass";

function row(over: Partial<CassRowInput> & { id: string }): CassRowInput {
  return {
    label: over.id,
    reportedAmount: 0,
    declaredAmount: 0,
    ...over,
  };
}

describe("assessCassRisk", () => {
  it("is clear when nothing was revised downward", () => {
    const result = assessCassRisk([
      row({ id: "salary", reportedAmount: 1_500_000, declaredAmount: 1_500_000 }),
      row({ id: "interest", reportedAmount: 18_400, declaredAmount: 18_400 }),
    ]);

    expect(result.riskLevel).toBe("LOW");
    expect(result.findings).toHaveLength(0);
    expect(result.aggregateShortfall).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("ignores rows where the citizen declared MORE than was reported", () => {
    // Declaring more cannot draw an under-reporting notice. Flagging it would
    // train people to distrust the warning exactly when they are being careful.
    const result = assessCassRisk([
      row({ id: "consulting", reportedAmount: 100_000, declaredAmount: 900_000 }),
    ]);

    expect(result.riskLevel).toBe("LOW");
    expect(result.findings).toHaveLength(0);
    expect(result.aggregateShortfall).toBe(0);
  });

  it("flags a single row past the variance threshold even when the rupees are small", () => {
    // 40% of a ₹10,000 row. Only ₹4,000 in absolute terms — under the aggregate
    // rule — so this fires on variance alone or not at all.
    const result = assessCassRisk([
      row({ id: "dividend", reportedAmount: 10_000, declaredAmount: 6_000 }),
    ]);

    expect(result.riskLevel).toBe("HIGH");
    expect(result.reasons).toEqual(["row_variance"]);
    expect(result.worstVariance).toBeCloseTo(0.4, 5);
    expect(result.findings[0].exceedsVarianceThreshold).toBe(true);
  });

  it("flags a large rupee reduction even when every row's variance is small", () => {
    // 10% of a ₹15,00,000 row: under the variance threshold, but ₹1,50,000 in
    // absolute terms, which is the size that gets looked at.
    const result = assessCassRisk([
      row({ id: "salary", reportedAmount: 1_500_000, declaredAmount: 1_350_000 }),
    ]);

    expect(result.riskLevel).toBe("HIGH");
    expect(result.reasons).toEqual(["aggregate_amount"]);
    expect(result.worstVariance).toBeCloseTo(0.1, 5);
    expect(result.findings[0].exceedsVarianceThreshold).toBe(false);
  });

  it("treats both thresholds as strict — sitting exactly on one does not fire", () => {
    const atVariance = assessCassRisk([
      row({
        id: "salary",
        reportedAmount: 100_000,
        declaredAmount: 100_000 * (1 - CASS_VARIANCE_THRESHOLD),
      }),
    ]);
    expect(atVariance.riskLevel).toBe("LOW");

    const atAggregate = assessCassRisk([
      row({
        id: "salary",
        reportedAmount: 1_000_000,
        declaredAmount: 1_000_000 - CASS_AGGREGATE_RUPEE_THRESHOLD,
      }),
    ]);
    expect(atAggregate.riskLevel).toBe("LOW");

    const oneRupeeOver = assessCassRisk([
      row({
        id: "salary",
        reportedAmount: 1_000_000,
        declaredAmount: 1_000_000 - CASS_AGGREGATE_RUPEE_THRESHOLD - 1,
      }),
    ]);
    expect(oneRupeeOver.riskLevel).toBe("HIGH");
  });

  it("sums shortfalls across rows and orders findings worst-rupees first", () => {
    const result = assessCassRisk([
      row({ id: "interest", reportedAmount: 50_000, declaredAmount: 10_000 }),
      row({ id: "salary", reportedAmount: 1_500_000, declaredAmount: 1_000_000 }),
      row({ id: "rent", reportedAmount: 0, declaredAmount: 0 }),
    ]);

    expect(result.aggregateShortfall).toBe(540_000);
    expect(result.findings.map((f) => f.id)).toEqual(["salary", "interest"]);
    expect(result.reasons).toEqual(["row_variance", "aggregate_amount"]);
  });

  it("stops counting a flagged row as unsupported once proof is attached", () => {
    const rows = [
      row({ id: "salary", reportedAmount: 1_500_000, declaredAmount: 1_000_000 }),
      row({ id: "interest", reportedAmount: 50_000, declaredAmount: 10_000 }),
    ];

    expect(assessCassRisk(rows).unsupportedFindings).toHaveLength(2);

    const withProof = rows.map((r) =>
      r.id === "salary" ? { ...r, hasAttachment: true } : r,
    );
    const result = assessCassRisk(withProof);

    // The risk itself does not go away — the variance is still there. What
    // changes is whether the citizen can answer the notice.
    expect(result.riskLevel).toBe("HIGH");
    expect(result.unsupportedFindings.map((f) => f.id)).toEqual(["interest"]);
  });

  it("does not divide by zero when nothing was reported for a row", () => {
    const result = assessCassRisk([
      row({ id: "rent", reportedAmount: 0, declaredAmount: 0 }),
    ]);
    expect(result.worstVariance).toBe(0);
    expect(Number.isFinite(result.worstVariance)).toBe(true);
  });

  it("names the section an inquiry would issue under", () => {
    expect(assessCassRisk([]).scrutinySection).toBe("143(1)(a)");
  });
});

describe("assessAisVariance — the pre-audit single-row test", () => {
  it("is exact in basis points and strict at the 20% threshold", () => {
    expect(assessAisVariance(100_000, 80_000)).toMatchObject({ varianceBp: 2_000, variancePercent: 20, exceedsThreshold: false });
    expect(assessAisVariance(100_000, 79_999)).toMatchObject({ varianceBp: 2_000, exceedsThreshold: false });
    expect(assessAisVariance(100_000, 79_990)).toMatchObject({ varianceBp: 2_001, exceedsThreshold: true });
    expect(assessAisVariance(100_000, 0)).toMatchObject({ varianceBp: 10_000, variancePercent: 100, exceedsThreshold: true });
  });

  it("does not fire when the citizen declares more, or when nothing was pre-filled", () => {
    expect(assessAisVariance(100_000, 150_000)).toMatchObject({ varianceBp: -5_000, exceedsThreshold: false });
    expect(assessAisVariance(0, 50_000)).toMatchObject({ varianceBp: 0, exceedsThreshold: false });
  });

  it("rounds half-up on integers, never through a float", () => {
    // (3 − 2) × 10 000 / 3 = 3333.33… → 3333
    expect(assessAisVariance(3, 2).varianceBp).toBe(3_333);
    // (7 − 5) × 10 000 / 7 = 2857.14… → 2857; (8 − 5) / 8 = 37.5% exactly
    expect(assessAisVariance(8, 5).varianceBp).toBe(3_750);
  });
});
