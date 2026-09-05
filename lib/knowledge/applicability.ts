/**
 * Executable eligibility rules with three outcomes (plan.md §5.6): eligible,
 * ineligible, insufficient_information. A missing attribute is never treated
 * as "no" — it is the thing to ask about, and the predicate names it.
 *
 * Each result cites the provision ids it rests on, so a recommendation can
 * show its supporting text (§5.6: "Every recommendation records ... rule
 * versions"). The arithmetic itself stays in lib/engine; these predicates
 * decide whether the engine should be asked at all — and where the engine does
 * not model a statutory adjustment, they say so instead of promising a figure
 * (review of 2026-09-05, docs/knowledge-tax-review-2026-09-05.md).
 */

import {
  LTCG_112A_EXEMPTION,
  REBATE_87A_NEW_THRESHOLD,
  REBATE_87A_OLD_THRESHOLD,
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
} from "../engine/constants";
import { computeSlabs, slabTable } from "../engine/slab";
import type { AgeBand } from "../engine/types";
import type { ApplicabilityResult, TaxpayerFacts } from "./types";

const need = (rule: string, provisions: string[], missing: string[]): ApplicabilityResult => ({
  rule,
  outcome: "insufficient_information",
  provisions,
  reason: `To decide this I still need: ${missing.join(", ")}.`,
  missing,
});

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function ageBand(facts: TaxpayerFacts): AgeBand {
  if (facts.category === "super_senior" || (facts.age ?? 0) >= 80) return "above_80";
  if (facts.category === "senior" || (facts.age ?? 0) >= 60) return "60_to_80";
  return "below_60";
}

/** The income level at which slab tax starts — the engine's own table, not a second copy of it. */
function basicExemption(regime: "new" | "old", band: AgeBand): number {
  return slabTable(regime, band).find((row) => row.rate > 0)?.from ?? 0;
}

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
  const salaryNote = facts.grossSalary !== undefined && facts.grossSalary < cap ? ` — limited to the salary of ${rupees(facts.grossSalary)}` : "";
  return { rule, outcome: "eligible", provisions, reason: `${rupees(cap)} under s.16(ia) in the ${facts.regime} regime, once for the year however many employers${salaryNote}.` };
}

export function rebate87A(facts: TaxpayerFacts): ApplicabilityResult {
  const rule = "rebate_87A";
  const provisions = ["1961:87A@FY2025-26"];
  const missing: string[] = [];
  if (facts.category === undefined) missing.push("taxpayer category");
  if (facts.resident === undefined) missing.push("residential status");
  if (facts.totalIncome === undefined) missing.push("total income");
  if (!facts.regime) missing.push("tax regime");
  if (missing.length) return need(rule, provisions, missing);
  if (!facts.resident) return { rule, outcome: "ineligible", provisions, reason: "The s.87A rebate is for resident individuals only." };
  if (facts.category === "huf") return { rule, outcome: "ineligible", provisions, reason: "The s.87A rebate is for individuals, not an HUF." };
  const totalIncome = facts.totalIncome!;
  const threshold = facts.regime === "new" ? REBATE_87A_NEW_THRESHOLD : REBATE_87A_OLD_THRESHOLD;
  if (totalIncome <= threshold) {
    return { rule, outcome: "eligible", provisions, reason: `Total income ${rupees(totalIncome)} is within the ${rupees(threshold)} threshold, so the slab tax is rebated.` };
  }
  if (facts.regime === "old") {
    return { rule, outcome: "ineligible", provisions, reason: `Total income exceeds the old-regime threshold of ${rupees(threshold)}; no rebate.` };
  }
  // New regime above the threshold: relief exists only while slab tax exceeds the excess,
  // and the rebate never reaches tax at special rates — so the composition matters.
  if (facts.specialRateIncome === undefined) return need(rule, provisions, ["whether any income is taxed at special rates (capital gains)"]);
  const excess = totalIncome - threshold;
  if (facts.specialRateIncome > 0) {
    return {
      rule,
      outcome: "insufficient_information",
      provisions,
      reason: `Above the threshold, relief depends on the slab tax on the non-special-rate part of the income; with ${rupees(facts.specialRateIncome)} at special rates the engine has to compute it.`,
      missing: ["the engine's slab tax net of special-rate income"],
    };
  }
  const slabTax = computeSlabs(totalIncome, slabTable("new", ageBand(facts))).total;
  if (slabTax > excess) {
    return { rule, outcome: "eligible", provisions, reason: `Marginal relief applies: slab tax of ${rupees(slabTax)} exceeds the ${rupees(excess)} by which income tops the threshold, so pre-cess tax is capped at ${rupees(excess)}.` };
  }
  return { rule, outcome: "ineligible", provisions, reason: `Total income tops the ${rupees(threshold)} threshold by ${rupees(excess)}, which is not less than the slab tax of ${rupees(slabTax)}; neither the rebate nor marginal relief applies.` };
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
  // Unknown evidence is not evidence: only an attached proof lets a claim be relied on.
  if (claim.evidence !== true) {
    return { rule, outcome: "insufficient_information", provisions, reason: `A s.${section} claim of ${rupees(claim.amount)} needs its receipt or statement before it is relied on.`, missing: [`proof of the s.${section} payment`] };
  }
  const amountNote =
    section === "80C"
      ? "the engine caps this section at its limit, but does not enforce the shared s.80CCE ceiling across 80C, 80CCC and 80CCD(1) — check that where more than one is claimed"
      : "the allowed amount depends on who is covered, their age and non-cash payment; the engine applies the self-and-family cap only, so senior-citizen and parent limits need a professional's figure";
  return { rule, outcome: "eligible", provisions, reason: `s.${section} applies under the old regime; ${amountNote}.` };
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
    // The option to the old regime is exercised in the return under s.139(1): a belated return cannot take it.
    if (facts.returnByDueDate === undefined) return need(rule, provisions, ["whether the return will be filed by the s.139(1) due date"]);
    if (!facts.returnByDueDate) {
      return { rule, outcome: "ineligible", provisions, reason: "The old regime can only be chosen in a return filed by the s.139(1) due date; a belated return stays in the new regime." };
    }
    return { rule, outcome: "eligible", provisions, reason: "With no business or professional income, the regime is chosen each year in the return itself, filed on time; nothing else to file." };
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
  const missing: string[] = [];
  if (facts.resident === undefined) missing.push("residential status");
  if (facts.totalIncome === undefined) missing.push("total income");
  if (!facts.regime) missing.push("tax regime");
  if (missing.length) return need(rule, provisions, missing);
  if (facts.resident) {
    // Proviso to s.112A(2): a resident's unused basic exemption is set against the gain first.
    // The engine does not model that adjustment, so the taxable figure cannot be promised here.
    const otherIncome = facts.totalIncome! - facts.ltcg112A;
    const edge = basicExemption(facts.regime!, ageBand(facts));
    if (otherIncome < edge) {
      return {
        rule,
        outcome: "insufficient_information",
        provisions,
        reason: `Other income of ${rupees(Math.max(0, otherIncome))} is below the ${rupees(edge)} basic exemption, so the unused ${rupees(edge - Math.max(0, otherIncome))} is set against the gain before the ${rupees(LTCG_112A_EXEMPTION)} threshold and the 12.5% rate apply. This release's engine does not make that adjustment; the taxable gain needs a professional's figure.`,
        missing: ["s.112A(2) basic-exemption adjustment"],
      };
    }
  }
  const taxable = Math.max(0, facts.ltcg112A - LTCG_112A_EXEMPTION);
  return {
    rule,
    outcome: "eligible",
    provisions,
    reason: `The first ${rupees(LTCG_112A_EXEMPTION)} of the ${rupees(facts.ltcg112A)} gain is tax-free; ${rupees(taxable)} is taxed at 12.5%. The whole gain still counts in total income.`,
  };
}

/**
 * Everything the salaried slice checks, in one call. An unsupported period is
 * a prerequisite, not one result among others: every dependent rule is then
 * marked unsupported rather than answered from the wrong Act.
 */
export function evaluateSalariedSlice(facts: TaxpayerFacts): ApplicabilityResult[] {
  const period = periodSupported(facts);
  const rules: ((f: TaxpayerFacts) => ApplicabilityResult)[] = [
    standardDeduction,
    rebate87A,
    (f) => oldRegimeDeduction(f, "80C"),
    (f) => oldRegimeDeduction(f, "80D"),
    regimeSwitch,
    ltcg112AExemption,
  ];
  if (period.outcome !== "eligible") {
    const label = facts.period ? `${facts.period.label} (${facts.period.act === "IT_ACT_2025" ? "Income-tax Act, 2025" : "Income-tax Act, 1961"})` : "this period";
    return [
      period,
      ...rules.map((r) => ({
        rule: r(facts).rule,
        outcome: "insufficient_information" as const,
        provisions: ["transition:1961-to-2025"],
        reason: `This release has no reviewed rules for ${label}, so this cannot be decided here.`,
        missing: [`reviewed rules for ${label}`],
      })),
    ];
  }
  return [period, ...rules.map((r) => r(facts))];
}
