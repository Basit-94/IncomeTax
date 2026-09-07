/**
 * Opportunities — what this person could still avail, priced by the engine (2026-09-07, user direction:
 * "There are many provisions users might be able to avail themselves of without knowing about them, and
 * that is where our product comes in").
 *
 * Deterministic. Every rupee here is `computeTax` run twice — the return as it stands against the return
 * with the provision applied — and the saving is measured against the CHEAPER regime as things stand, so
 * an old-regime deduction that only matters once the old regime overtakes the new is priced honestly.
 *
 * Two lanes, because the law draws the line and Munshi ji has to as well:
 *  - `claim_now`   — a deduction this return can carry, provided the payment was actually made and proof exists;
 *  - `next_year`   — a salary structure the employer would have to change (NPS under 80CCD(2), meal vouchers,
 *                    LTA); nothing received this year can be relabelled at filing time.
 *  - `check`       — worth a question before it can be priced (housing, rent, a loan).
 */

import { compareRegimes, computeTax } from "../engine/tax";
import { OLD_REGIME_CLAIM_CAPS, REBATE_87A_NEW_THRESHOLD } from "../engine/constants";
import { taxInputFor } from "../return/compute";
import type { YearIntake } from "../return/year-intake";
import type { Claim, Persona } from "../types";

export type OpportunityLane = "claim_now" | "next_year" | "check";

export interface Opportunity {
  id: string;
  section: string;
  title: string;
  lane: OpportunityLane;
  /** Which regime the provision lives in. */
  regime: "old" | "new" | "both";
  /** The rupee headroom or exemption the item is priced at, when there is one. */
  amount?: number;
  /** Tax saved against the cheaper regime as things stand; 0 when it changes nothing. Engine arithmetic. */
  saving: number;
  /** One plain sentence: what it is and why it applies to this person. */
  why: string;
  /** What has to be true or brought before it can be claimed. */
  needs?: string;
}

export interface OpportunityScan {
  regimeOnRecord: "new" | "old";
  /** Total tax under each regime with the return as it stands, and the cheaper of the two. */
  asIs: { new: number; old: number; cheaper: "new" | "old"; saving: number };
  items: Opportunity[];
  /** Said once with the list: these are engine figures on the facts as recorded; proof and eligibility still apply. */
  note: string;
}

const MEAL_VOUCHER_EXEMPT_PER_YEAR = 26_400; // ₹50 a meal × 2 meals × 22 working days × 12 months, Rule 3(7)(iii)
const CAP_80C = OLD_REGIME_CLAIM_CAPS["80C"];
const CAP_80CCD_1B = OLD_REGIME_CLAIM_CAPS["80CCD_1B"];
const CAP_80D_SELF = OLD_REGIME_CLAIM_CAPS["80D_SELF"];
const CAP_80D_PARENTS = OLD_REGIME_CLAIM_CAPS["80D_PARENTS"];
const CAP_24B = OLD_REGIME_CLAIM_CAPS["24B"];
const CAP_80TTA = OLD_REGIME_CLAIM_CAPS["80TTA"];
const CAP_80GG = OLD_REGIME_CLAIM_CAPS["80GG"];

const claimTotal = (claims: Claim[], ...sections: string[]) => claims.filter((c) => sections.includes(c.section)).reduce((n, c) => n + c.amount, 0);

function withClaims(persona: Persona, extra: { section: string; amount: number }[]): Persona {
  const claims = [...persona.claims];
  for (const e of extra) {
    const i = claims.findIndex((c) => c.section === e.section);
    if (i >= 0) claims[i] = { ...claims[i], amount: claims[i].amount + e.amount };
    else claims.push({ id: `opp-${e.section}`, section: e.section, label: e.section, amount: e.amount, evidenceAttached: false });
  }
  return { ...persona, claims };
}

function withLessSalary(persona: Persona, amount: number): Persona {
  let left = amount;
  return {
    ...persona,
    facts: persona.facts.map((f) => {
      if (f.kind !== "salary" || left <= 0) return f;
      const cut = Math.min(f.amount, left);
      left -= cut;
      return { ...f, amount: f.amount - cut };
    }),
  };
}

/** The cheaper regime's total tax for a persona — the yardstick every saving is measured against. */
function bestTax(persona: Persona): number {
  const both = compareRegimes(taxInputFor(persona, "new"));
  return Math.min(both.new.totalTax, both.old.totalTax);
}

export function scanOpportunities(persona: Persona, opts: { regime?: "new" | "old"; intake?: YearIntake } = {}): OpportunityScan {
  const both = compareRegimes(taxInputFor(persona, "new"));
  const cheaper: "new" | "old" = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  const base = Math.min(both.new.totalTax, both.old.totalTax);
  const regimeOnRecord = opts.regime ?? "new";
  const items: Opportunity[] = [];
  const salary = persona.facts.filter((f) => f.kind === "salary").reduce((n, f) => n + f.amount, 0);
  const interest = persona.facts.filter((f) => f.kind === "interest").reduce((n, f) => n + f.amount, 0);
  const answers = opts.intake?.answers ?? {};
  const hraExempt = opts.intake?.read.salary?.exempt10.some((e) => /10\(13A\)|HRA/i.test(e.section)) ?? false;
  const priceClaim = (section: string, amount: number) => Math.max(0, base - bestTax(withClaims(persona, [{ section, amount }])));

  // The regime itself, when the ledger's choice is the dearer one.
  if (both.old.totalTax !== both.new.totalTax && cheaper !== regimeOnRecord) {
    items.push({
      id: "regime", section: "115BAC", title: cheaper === "old" ? "Choose the old regime this year" : "Stay in the new regime", lane: "claim_now", regime: "both",
      saving: Math.abs(both.new.totalTax - both.old.totalTax),
      why: `With the claims as recorded, the ${cheaper} regime costs less than the ${regimeOnRecord} regime the return is on.`,
      needs: cheaper === "old" ? "The return has to be filed by the 31 July due date to take the old regime (no business income)." : undefined,
    });
  }

  // Old-regime deductions with headroom.
  const room80C = CAP_80C - claimTotal(persona.claims, "80C", "80CCC", "80CCD_1", "80CCD(1)");
  if (room80C > 0) {
    items.push({ id: "80C", section: "80C", title: "Section 80C — PF, PPF, ELSS, life insurance, tuition, home-loan principal", lane: "claim_now", regime: "old", amount: room80C, saving: priceClaim("80C", room80C),
      why: `₹${room80C.toLocaleString("en-IN")} of the ₹1,50,000 limit is unused on this return.`, needs: "Payments actually made in FY 2025-26, with receipts or statements." });
  }
  if (claimTotal(persona.claims, "80CCD_1B", "80CCD(1B)") === 0) {
    items.push({ id: "80CCD_1B", section: "80CCD(1B)", title: "Section 80CCD(1B) — your own NPS Tier-1 contribution", lane: "claim_now", regime: "old", amount: CAP_80CCD_1B, saving: priceClaim("80CCD_1B", CAP_80CCD_1B),
      why: "An extra ₹50,000 over the 80C limit for money you put into NPS yourself.", needs: "An NPS Tier-1 account and the year's contribution statement." });
  }
  if (claimTotal(persona.claims, "80D_SELF", "80D") === 0) {
    items.push({ id: "80D_SELF", section: "80D", title: "Section 80D — health insurance for self and family", lane: "claim_now", regime: "old", amount: CAP_80D_SELF, saving: priceClaim("80D_SELF", CAP_80D_SELF),
      why: "Premium paid for yourself, spouse and children comes off income, up to ₹25,000.", needs: "The premium receipt; paid by any mode other than cash." });
  }
  if (claimTotal(persona.claims, "80D_PARENTS") === 0) {
    items.push({ id: "80D_PARENTS", section: "80D", title: "Section 80D — health insurance for parents", lane: "claim_now", regime: "old", amount: CAP_80D_PARENTS, saving: priceClaim("80D_PARENTS", CAP_80D_PARENTS),
      why: "A separate limit for parents' premium — ₹25,000, or ₹50,000 when a parent is 60 or older.", needs: "The parents' policy receipt." });
  }
  if (interest > 0 && claimTotal(persona.claims, "80TTA") === 0) {
    const amount = Math.min(interest, CAP_80TTA);
    items.push({ id: "80TTA", section: "80TTA", title: "Section 80TTA — savings-account interest", lane: "claim_now", regime: "old", amount, saving: priceClaim("80TTA", amount),
      why: `Interest of ₹${interest.toLocaleString("en-IN")} is on record; up to ₹10,000 of savings-account interest is deductible.`, needs: "Only savings-account interest counts, not fixed deposits (80TTB replaces this at 60+)." });
  }

  // Housing: rent without HRA → 80GG; own home → 24(b). Unknown → ask.
  if (answers.housing === "rent" && !hraExempt && claimTotal(persona.claims, "80GG") === 0) {
    items.push({ id: "80GG", section: "80GG", title: "Section 80GG — rent paid with no HRA in the salary", lane: "claim_now", regime: "old", amount: CAP_80GG, saving: priceClaim("80GG", CAP_80GG),
      why: "You rent and the Form 16 shows no HRA exemption, so the rent deduction under 80GG applies instead.", needs: "The rent paid for the year (least of ₹5,000 a month, 25% of income, rent minus 10% of income) and Form 10BA before filing." });
  } else if (answers.housing === "own_self" && claimTotal(persona.claims, "24B", "24(b)", "24b") === 0) {
    items.push({ id: "24B", section: "24(b)", title: "Section 24(b) — interest on the home loan", lane: "claim_now", regime: "old", amount: CAP_24B, saving: priceClaim("24B", CAP_24B),
      why: "Interest on a loan for the house you live in comes off income, up to ₹2,00,000.", needs: "The lender's interest certificate for FY 2025-26." });
  } else if (answers.housing === undefined && !hraExempt) {
    items.push({ id: "housing", section: "10(13A) / 80GG / 24(b)", title: "Where you lived this year decides a deduction", lane: "check", regime: "old", saving: 0,
      why: "Rent without HRA points at 80GG; a home loan points at 24(b). Neither can be priced until we know.", needs: "One answer: rent, own home, or family home." });
  }

  // Salary structure — the employer's side, for next year. Nothing received this year moves.
  if (claimTotal(persona.claims, "80CCD(2)", "80CCD_2") === 0 && salary > 0) {
    const amount = Math.round(salary * 0.1);
    const saving = Math.max(0, base - bestTax(withClaims(persona, [{ section: "80CCD(2)", amount }])));
    items.push({ id: "80CCD_2", section: "80CCD(2)", title: "Employer NPS under 80CCD(2) — works in both regimes", lane: "next_year", regime: "both", amount, saving,
      why: "What the employer pays into your NPS is deductible even in the new regime (up to 14% of basic + DA). This return shows none — priced here at 10% of salary as an illustration.", needs: "Ask HR to restructure the CTC for FY 2026-27; it only counts once the employer actually contributes." });
  }
  if (salary > MEAL_VOUCHER_EXEMPT_PER_YEAR) {
    const saving = Math.max(0, base - bestTax(withLessSalary(persona, MEAL_VOUCHER_EXEMPT_PER_YEAR)));
    items.push({ id: "meal", section: "17(2) · Rule 3(7)(iii)", title: "Meal vouchers as part of salary — old regime only", lane: "next_year", regime: "old", amount: MEAL_VOUCHER_EXEMPT_PER_YEAR, saving,
      why: "Meal vouchers are exempt at ₹50 a meal, about ₹26,400 a year, only when the employer pays that part of CTC as vouchers and the Form 16 shows it.", needs: "A CTC restructure with HR for next year; salary already received cannot be relabelled." });
  }
  if (salary > 0 && !(opts.intake?.read.salary?.exempt10.some((e) => /10\(5\)|LTA/i.test(e.section)) ?? false)) {
    items.push({ id: "LTA", section: "10(5)", title: "Leave travel allowance — old regime only", lane: "next_year", regime: "old", saving: 0,
      why: "Actual domestic travel fare for the family, twice in a block of four years, is exempt when the CTC carries an LTA component and the trip is taken.", needs: "An LTA component in the CTC and travel tickets." });
  }

  // The 87A cliff: just above ₹12 lakh, marginal relief caps the tax at the excess.
  const newB = computeTax(taxInputFor(persona, "new"));
  if (newB.taxableIncome > REBATE_87A_NEW_THRESHOLD && newB.marginalReliefApplied) {
    items.push({ id: "87A", section: "87A", title: "Marginal relief is already limiting your new-regime tax", lane: "check", regime: "new", saving: 0,
      why: `Total income of ₹${newB.taxableIncome.toLocaleString("en-IN")} is just over the ₹12,00,000 rebate line, so tax before cess is capped at the excess. A deduction that brings income under the line removes the tax entirely.` });
  }

  items.sort((a, b) => b.saving - a.saving || a.title.localeCompare(b.title));
  return {
    regimeOnRecord,
    asIs: { new: both.new.totalTax, old: both.old.totalTax, cheaper, saving: Math.abs(both.new.totalTax - both.old.totalTax) },
    items,
    note: "Engine arithmetic on the return as recorded; each item still needs the payment to have been made in FY 2025-26 and its proof. Old-regime items pay off only when the old regime becomes the cheaper one overall.",
  };
}
