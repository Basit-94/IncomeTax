/**
 * Executable eligibility rules with three outcomes (plan.md §5.6): eligible,
 * ineligible, insufficient_information. A missing attribute is never treated
 * as "no" — it is the thing to ask about, and the predicate names it.
 *
 * Each result cites the provision ids it rests on, so a recommendation can
 * show its supporting text (§5.6: "Every recommendation records ... rule
 * versions"). The arithmetic itself stays in lib/engine; these predicates
 * decide whether the engine should be asked at all.
 */

import {
  LTCG_112A_EXEMPTION,
  REBATE_87A_NEW_THRESHOLD,
  REBATE_87A_OLD_THRESHOLD,
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
} from "../engine/constants";
import type { ApplicabilityResult, TaxpayerFacts } from "./types";

const need = (rule: string, provisions: string[], missing: string[]): ApplicabilityResult => ({
  rule,
  outcome: "insufficient_information",
  provisions,
  reason: `To decide this I still need: ${missing.join(", ")}.`,
  missing,
});

/** The Act that governs the period must be the one the corpus covers. */
export function periodSupported(facts: TaxpayerFacts): ApplicabilityResult {
  const rule = "period_supported";
  if (!facts.period) return need(rule, ["transition:1961-to-2025"], ["income period"]);
  if (facts.period.financialYear === "2025-26" && facts.period.act === "IT_ACT_1961") {
    return { rule, outcome: "eligible", provisions: ["transition:1961-to-2025"], reason: "Income of FY 2025-26 is assessed under the Income-tax Act, 1961 as AY 2026-27, which this release covers." };
  }
  if (facts.period.act === "IT_ACT_2025") {
    return { rule, outcome: "ineligible", provisions: ["transition:1961-to-2025"], reason: "Income from 1 April 2026 falls under the Income-tax Act, 2025; this release has no reviewed rules for it yet." };
  }
  return { rule, outcome: "ineligible", provisions: ["transition:1961-to-2025"], reason: `This release covers FY 2025-26 only, not ${facts.period.financialYear}.` };
}

export function standardDeduction(facts: TaxpayerFacts): ApplicabilityResult {
  const rule = "standard_deduction_16ia";
  const provisions = ["1961:16(ia)@FY2025-26"];
  if (facts.hasSalaryIncome === undefined) return need(rule, provisions, ["whether there is salary income"]);
  if (!facts.hasSalaryIncome) {
    return { rule, outcome: "ineligible", provisions, reason: "The standard deduction applies to salary income only; there is none here." };
  }
  if (!facts.regime) return need(rule, provisions, ["tax regime"]);
  const cap = facts.regime === "new" ? STANDARD_DEDUCTION_NEW : STANDARD_DEDUCTION_OLD;
  const salaryNote = facts.grossSalary !== undefined && facts.grossSalary < cap ? ` — limited to the salary of ₹${facts.grossSalary.toLocaleString("en-IN")}` : "";
  return { rule, outcome: "eligible", provisions, reason: `₹${cap.toLocaleString("en-IN")} under s.16(ia) in the ${facts.regime} regime, once for the year however many employers${salaryNote}.` };
}

export function rebate87A(facts: TaxpayerFacts): ApplicabilityResult {
  const rule = "rebate_87A";
  const provisions = ["1961:87A@FY2025-26"];
  const missing: string[] = [];
  if (facts.resident === undefined) missing.push("residential status");
  if (facts.totalIncome === undefined) missing.push("total income");
  if (!facts.regime) missing.push("tax regime");
  if (missing.length) return need(rule, provisions, missing);
  if (!facts.resident) return { rule, outcome: "ineligible", provisions, reason: "The s.87A rebate is for resident individuals only." };
  if (facts.category && facts.category === "huf") return { rule, outcome: "ineligible", provisions, reason: "The s.87A rebate is for individuals, not an HUF." };
  const threshold = facts.regime === "new" ? REBATE_87A_NEW_THRESHOLD : REBATE_87A_OLD_THRESHOLD;
  if (facts.totalIncome! <= threshold) {
    return { rule, outcome: "eligible", provisions, reason: `Total income ₹${facts.totalIncome!.toLocaleString("en-IN")} is within the ₹${threshold.toLocaleString("en-IN")} threshold, so the slab tax is rebated.` };
  }
  if (facts.regime === "new") {
    return { rule, outcome: "eligible", provisions, reason: `Above the threshold, marginal relief applies: slab tax is capped at the excess over ₹${threshold.toLocaleString("en-IN")}. The engine computes the exact figure.` };
  }
  return { rule, outcome: "ineligible", provisions, reason: `Total income exceeds the old-regime threshold of ₹${threshold.toLocaleString("en-IN")}; no rebate.` };
}

/** Chapter VI-A deductions the old regime allows and the new does not. */
export function oldRegimeDeduction(facts: TaxpayerFacts, section: "80C" | "80D"): ApplicabilityResult {
  const rule = `deduction_${section}`;
  const provisions = [`1961:${section}@FY2025-26`, "1961:115BAC@FY2025-26"];
  if (!facts.regime) return need(rule, provisions, ["tax regime"]);
  if (facts.regime === "new") {
    return { rule, outcome: "ineligible", provisions, reason: `s.${section} is not available under the new regime (s.115BAC).` };
  }
  const claim = facts.claims?.find((c) => c.section === section || c.section.startsWith(`${section}_`));
  if (!claim) return need(rule, provisions, [`whether any s.${section} payment was actually made this year, and how much`]);
  if (claim.amount <= 0) return { rule, outcome: "ineligible", provisions, reason: `No s.${section} payment was made.` };
  if (claim.evidence === false) {
    return { rule, outcome: "insufficient_information", provisions, reason: `A s.${section} claim of ₹${claim.amount.toLocaleString("en-IN")} needs its receipt or statement before it is relied on.`, missing: [`proof of the s.${section} payment`] };
  }
  return { rule, outcome: "eligible", provisions, reason: `s.${section} applies under the old regime; the engine caps it at the statutory limit.` };
}

/**
 * Whether switching regime is an action this system may execute for this
 * taxpayer (§5.6 example: salary-only and salary-plus-business taxpayers must
 * not get the same workflow).
 */
export function regimeSwitch(facts: TaxpayerFacts): ApplicabilityResult {
  const rule = "regime_switch_115BAC";
  const provisions = ["1961:115BAC@FY2025-26"];
  if (facts.hasBusinessOrProfessionIncome === undefined) {
    return need(rule, provisions, ["whether there is any business or professional income"]);
  }
  if (!facts.hasBusinessOrProfessionIncome) {
    return { rule, outcome: "eligible", provisions, reason: "With no business or professional income, the regime is chosen each year in the return itself; nothing else to file." };
  }
  if (facts.priorRegimeOptOut === undefined) {
    return need(rule, provisions, ["whether Form 10-IEA was filed in an earlier year and whether that option was later withdrawn"]);
  }
  return {
    rule,
    outcome: "insufficient_information",
    provisions,
    reason: "With business or professional income, opting out of the new regime requires Form 10-IEA by the s.139(1) due date and the choice carries forward with a one-time withdrawal. This release does not execute that election; a comparison can be shown, the switch cannot.",
    missing: ["Form 10-IEA election history verified by a tax professional"],
  };
}

export function ltcg112AExemption(facts: TaxpayerFacts): ApplicabilityResult {
  const rule = "ltcg_112A_exemption";
  const provisions = ["1961:112A@FY2025-26"];
  if (facts.ltcg112A === undefined) return need(rule, provisions, ["long-term equity gains for the year"]);
  if (facts.ltcg112A <= 0) return { rule, outcome: "ineligible", provisions, reason: "No long-term equity gain to exempt." };
  const taxable = Math.max(0, facts.ltcg112A - LTCG_112A_EXEMPTION);
  return {
    rule,
    outcome: "eligible",
    provisions,
    reason: `The first ₹${LTCG_112A_EXEMPTION.toLocaleString("en-IN")} of the ₹${facts.ltcg112A.toLocaleString("en-IN")} gain is tax-free; ₹${taxable.toLocaleString("en-IN")} is taxed at 12.5%. The whole gain still counts in total income.`,
  };
}

/** Everything the salaried slice checks, in one call. */
export function evaluateSalariedSlice(facts: TaxpayerFacts): ApplicabilityResult[] {
  return [
    periodSupported(facts),
    standardDeduction(facts),
    rebate87A(facts),
    oldRegimeDeduction(facts, "80C"),
    oldRegimeDeduction(facts, "80D"),
    regimeSwitch(facts),
    ltcg112AExemption(facts),
  ];
}
