/**
 * CASS — Computer-Assisted Scrutiny Selection.
 *
 * The department does not read every return. It runs returns through CASS,
 * which flags cases where what the citizen declared diverges sharply from what
 * third parties (employer, bank, broker, registrar) reported for the same PAN.
 * A citizen who lowers a figure is entitled to do so — the AIS row may genuinely
 * be wrong — but they deserve to know, BEFORE filing, that this particular
 * change is the kind that draws an inquiry, and what documentary proof answers
 * it. Silence here is what turns a defensible correction into a s.143(1)(a)
 * notice the citizen did not expect.
 *
 * Pure arithmetic over plain data: no React, no I/O. Single source of the
 * thresholds so the UI radar (components/AuditRiskRadar.tsx) and the agent tool
 * (lib/agent/copilot-engine.ts predict_audit_risk) can never drift apart.
 *
 * KNOWN LIMIT, stated on the surface too: the "probability" is a fixed
 * illustrative figure, not a fitted model. The department publishes no CASS
 * selection probabilities, so no honest number exists to put here. What IS real
 * is the direction (a large downward revision against third-party data is a
 * documented selection trigger) and the section it lands under.
 */

import type { AISVariance } from "../../types/tax";

/** Fractional downward revision of a single income row that trips the radar. */
export const CASS_VARIANCE_THRESHOLD = 0.2;

/** Aggregate rupee reduction across all rows that trips the radar on its own. */
export const CASS_AGGREGATE_RUPEE_THRESHOLD = 100_000;

/** Illustrative, not fitted — see the file header. */
export const CASS_INQUIRY_PROBABILITY_LABEL = "94%";

export type CassRiskLevel = "LOW" | "HIGH";

/** One income row's divergence from what a third party reported for the PAN. */
export interface CassRowInput {
  id: string;
  label: string;
  /** AIS / 26AS / Form 16 figure, whole rupees. */
  reportedAmount: number;
  /** What the citizen is declaring, whole rupees. */
  declaredAmount: number;
  /** Whether proof is already attached to this row. */
  hasAttachment?: boolean;
  /** The attached file's name, when one was chosen. Nothing is uploaded. */
  attachmentName?: string;
  /** Who reported it — named in the warning so the citizen knows who to ask. */
  reportedBy?: string;
}

export interface CassRowFinding extends CassRowInput {
  /** reportedAmount − declaredAmount. Positive = citizen declared less. */
  shortfall: number;
  /** shortfall / reportedAmount, 0 when nothing was reported. */
  variance: number;
  /** True when this single row is past CASS_VARIANCE_THRESHOLD. */
  exceedsVarianceThreshold: boolean;
}

export interface CassAssessment {
  riskLevel: CassRiskLevel;
  /** Rows where the citizen declared LESS than was reported, worst first. */
  findings: CassRowFinding[];
  /** Sum of every positive shortfall, whole rupees. */
  aggregateShortfall: number;
  /** Largest single-row variance as a fraction. */
  worstVariance: number;
  /** Which rule fired. Empty when riskLevel is LOW. */
  reasons: Array<"row_variance" | "aggregate_amount">;
  /** The section an inquiry would issue under. */
  scrutinySection: string;
  /** Rows that trip the radar and still have no proof attached. */
  unsupportedFindings: CassRowFinding[];
}

/**
 * Assess CASS exposure for a set of income rows.
 *
 * Only DOWNWARD revisions count. Declaring MORE than was reported cannot draw a
 * scrutiny notice for under-reporting, and flagging it would train citizens to
 * distrust a warning that fires when they are being careful.
 */
export function assessCassRisk(rows: CassRowInput[]): CassAssessment {
  const findings: CassRowFinding[] = [];

  for (const row of rows) {
    const shortfall = row.reportedAmount - row.declaredAmount;
    if (shortfall <= 0) continue;
    const variance = row.reportedAmount > 0 ? shortfall / row.reportedAmount : 0;
    findings.push({
      ...row,
      shortfall,
      variance,
      exceedsVarianceThreshold: variance > CASS_VARIANCE_THRESHOLD,
    });
  }

  findings.sort((a, b) => b.shortfall - a.shortfall);

  const aggregateShortfall = findings.reduce((sum, f) => sum + f.shortfall, 0);
  const worstVariance = findings.reduce((max, f) => Math.max(max, f.variance), 0);

  const reasons: CassAssessment["reasons"] = [];
  if (findings.some((f) => f.exceedsVarianceThreshold)) reasons.push("row_variance");
  if (aggregateShortfall > CASS_AGGREGATE_RUPEE_THRESHOLD) reasons.push("aggregate_amount");

  return {
    riskLevel: reasons.length > 0 ? "HIGH" : "LOW",
    findings,
    aggregateShortfall,
    worstVariance,
    reasons,
    scrutinySection: "143(1)(a)",
    unsupportedFindings: findings.filter(
      (f) => (f.exceedsVarianceThreshold || reasons.includes("aggregate_amount")) && !f.hasAttachment,
    ),
  };
}

/* ------------------------------------------------ pre-audit variance test -- */

/**
 * The single-row test the pre-audit radar runs the moment a pre-filled AIS
 * figure is edited: Variance = (PreFilled − Declared) / PreFilled. Exact
 * integer basis points, so 20.00% is never 19.999…% by way of a float. The
 * threshold is the same CASS_VARIANCE_THRESHOLD the aggregate assessment uses;
 * "exceeds" is strictly greater than, matching assessCassRisk.
 */
export function assessAisVariance(preFilled: number, declared: number): AISVariance {
  const pre = Math.max(0, Math.round(preFilled));
  const dec = Math.max(0, Math.round(declared));
  let varianceBp = 0;
  if (pre > 0) {
    const numerator = (pre - dec) * 10_000;
    // Round half away from zero on integers; no floating-point division survives to the result.
    const q = Math.trunc(numerator / pre);
    const r = Math.abs(numerator % pre);
    varianceBp = r * 2 >= pre ? q + Math.sign(numerator) : q;
  }
  return {
    preFilled: pre,
    declared: dec,
    varianceBp,
    variancePercent: varianceBp / 100,
    exceedsThreshold: varianceBp > Math.round(CASS_VARIANCE_THRESHOLD * 10_000),
  };
}
