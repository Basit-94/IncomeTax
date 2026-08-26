import { computeTax } from "./engine/tax";
import type { TaxInputFact } from "./engine/types";
import type { Claim } from "./types";

export interface TaxEngineInput {
  isSalaried: boolean;
  age: number;
  grossSalary: number;
  businessIncome: number;
  savingsInterest: number;
  otherIncome: number;
  tdsPaid: number;
  advanceTaxPaid: number;
  section80C: number;
  section80D: number;
}

export interface RegimeResult {
  grossTotalIncome: number;
  standardDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate87A: number;
  marginalRelief: number;
  cess: number;
  totalTaxLiability: number;
  totalTaxesPaid: number;
  netPayableOrRefund: number;
}

export interface TaxEngineOutput {
  newRegime: RegimeResult;
  oldRegime: RegimeResult;
}

function calculateForRegime(input: TaxEngineInput, regime: "new" | "old"): RegimeResult {
  const facts: TaxInputFact[] = [];
  if (input.grossSalary > 0 || input.isSalaried) {
    facts.push({ kind: "salary", amount: input.grossSalary });
  }
  if (input.businessIncome > 0) {
    facts.push({ kind: "other", amount: input.businessIncome });
  }
  if (input.savingsInterest > 0) {
    facts.push({ kind: "interest", amount: input.savingsInterest });
  }
  if (input.otherIncome > 0) {
    facts.push({ kind: "other", amount: input.otherIncome });
  }

  const claims: Claim[] = [];
  if (input.section80C > 0) {
    claims.push({
      id: "claim-80c",
      section: "80C",
      amount: input.section80C,
      evidenceAttached: true,
      label: "Section 80C",
    });
  }
  if (input.section80D > 0) {
    claims.push({
      id: "claim-80d",
      section: "80D",
      amount: input.section80D,
      evidenceAttached: true,
      label: "Section 80D",
    });
  }

  const ageBand = input.age >= 80 ? "above_80" : input.age >= 60 ? "60_to_80" : "below_60";

  const breakdown = computeTax({
    facts,
    claims,
    ageBand,
    regime,
    tdsCredits: input.tdsPaid + input.advanceTaxPaid,
  });

  // Split rebate and marginal relief
  let rebate87AVal = 0;
  let marginalReliefVal = 0;

  if (regime === "new") {
    if (breakdown.taxableIncome <= 700000) {
      rebate87AVal = breakdown.rebate87A;
    } else {
      marginalReliefVal = breakdown.rebate87A;
    }
  } else {
    // Old regime rebate
    rebate87AVal = breakdown.rebate87A;
  }

  return {
    grossTotalIncome: breakdown.grossIncome,
    standardDeduction: breakdown.standardDeduction,
    totalDeductions: breakdown.totalDeductions + breakdown.standardDeduction,
    taxableIncome: breakdown.taxableIncome,
    taxBeforeRebate: breakdown.taxBeforeRebate,
    rebate87A: rebate87AVal,
    marginalRelief: marginalReliefVal,
    cess: breakdown.cess,
    totalTaxLiability: breakdown.totalTax,
    totalTaxesPaid: breakdown.tdsCredits,
    netPayableOrRefund: breakdown.totalTax - breakdown.tdsCredits,
  };
}

export function computeAY2026Tax(input: TaxEngineInput): TaxEngineOutput {
  return {
    newRegime: calculateForRegime(input, "new"),
    oldRegime: calculateForRegime(input, "old"),
  };
}
