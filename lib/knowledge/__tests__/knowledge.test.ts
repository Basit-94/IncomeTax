import { describe, expect, it } from "vitest";
import { createHash } from "crypto";
import {
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
  REBATE_87A_NEW_THRESHOLD,
  LTCG_112A_EXEMPTION,
} from "../../engine/constants";
import { evaluateSalariedSlice, oldRegimeDeduction, periodSupported, rebate87A, regimeSwitch, standardDeduction } from "../applicability";
import { PERIOD_FY_2025_26, PERIOD_FY_2026_27, PROVISIONS, periodForFinancialYear, provisionById } from "../provisions";
import { cite, retrieve } from "../retrieval";

describe("corpus integrity (plan §5.6–5.7)", () => {
  it("every provision carries the required metadata and a matching content hash", () => {
    for (const p of PROVISIONS) {
      expect(p.id).toMatch(/^(1961|2025|transition):/);
      expect(p.sourceUrl).toMatch(/^https:\/\//);
      expect(p.locator.length).toBeGreaterThan(5);
      expect(p.financialYears.length).toBeGreaterThan(0);
      expect(p.reviewer).toBeTruthy();
      expect(p.contentHash).toBe(createHash("sha256").update(p.ruleText).digest("hex"));
      for (const l of p.linked) expect(provisionById(l), `${p.id} links to ${l}`).toBeDefined();
    }
  });

  it("figures in the corpus agree with the engine's constants — the release-blocking parity check", () => {
    expect(provisionById("1961:16(ia)@FY2025-26")!.ruleText).toContain(`₹${STANDARD_DEDUCTION_NEW.toLocaleString("en-IN")}`);
    expect(provisionById("1961:16(ia)@FY2025-26")!.ruleText).toContain(`₹${STANDARD_DEDUCTION_OLD.toLocaleString("en-IN")}`);
    expect(provisionById("1961:87A@FY2025-26")!.ruleText).toContain(`₹${REBATE_87A_NEW_THRESHOLD.toLocaleString("en-IN")}`);
    expect(provisionById("1961:112A@FY2025-26")!.ruleText).toContain(`₹${LTCG_112A_EXEMPTION.toLocaleString("en-IN")}`);
  });

  it("the transition case: FY 2025-26 is AY under the 1961 Act, FY 2026-27 is TY under the 2025 Act", () => {
    expect(periodForFinancialYear("2025-26")).toEqual(PERIOD_FY_2025_26);
    expect(periodForFinancialYear("2026-27")).toEqual(PERIOD_FY_2026_27);
    expect(PERIOD_FY_2025_26.act).toBe("IT_ACT_1961");
    expect(PERIOD_FY_2026_27.act).toBe("IT_ACT_2025");
    expect(periodSupported({ period: PERIOD_FY_2025_26 }).outcome).toBe("eligible");
    expect(periodSupported({ period: PERIOD_FY_2026_27 }).outcome).toBe("ineligible");
    expect(periodSupported({}).outcome).toBe("insufficient_information");
  });
});

describe("applicability predicates — three outcomes, missing facts are named", () => {
  it("standard deduction: unknown salary → ask; no salary → ineligible; salary → the regime's figure", () => {
    expect(standardDeduction({})).toMatchObject({ outcome: "insufficient_information", missing: ["whether there is salary income"] });
    expect(standardDeduction({ hasSalaryIncome: false }).outcome).toBe("ineligible");
    expect(standardDeduction({ hasSalaryIncome: true })).toMatchObject({ outcome: "insufficient_information", missing: ["tax regime"] });
    const r = standardDeduction({ hasSalaryIncome: true, regime: "new", grossSalary: 40000 });
    expect(r.outcome).toBe("eligible");
    expect(r.reason).toContain("limited to the salary");
    expect(r.provisions).toEqual(["1961:16(ia)@FY2025-26"]);
  });

  it("87A: residency, income and regime are all required; non-resident is ineligible; new regime above threshold gets marginal relief", () => {
    expect(rebate87A({}).missing).toEqual(["residential status", "total income", "tax regime"]);
    expect(rebate87A({ resident: false, totalIncome: 500000, regime: "new" }).outcome).toBe("ineligible");
    expect(rebate87A({ resident: true, totalIncome: 1200000, regime: "new" }).outcome).toBe("eligible");
    expect(rebate87A({ resident: true, totalIncome: 1285000, regime: "new" }).reason).toContain("marginal relief");
    expect(rebate87A({ resident: true, totalIncome: 600000, regime: "old" }).outcome).toBe("ineligible");
    expect(rebate87A({ resident: true, totalIncome: 400000, regime: "old" }).outcome).toBe("eligible");
  });

  it("80C/80D: never under the new regime; unknown payment → ask; unproven → ask for proof; zero → ineligible", () => {
    expect(oldRegimeDeduction({ regime: "new" }, "80C").outcome).toBe("ineligible");
    expect(oldRegimeDeduction({ regime: "old" }, "80C")).toMatchObject({ outcome: "insufficient_information" });
    expect(oldRegimeDeduction({ regime: "old", claims: [{ section: "80C", amount: 0 }] }, "80C").outcome).toBe("ineligible");
    expect(oldRegimeDeduction({ regime: "old", claims: [{ section: "80C", amount: 150000, evidence: false }] }, "80C")).toMatchObject({ outcome: "insufficient_information", missing: ["proof of the s.80C payment"] });
    expect(oldRegimeDeduction({ regime: "old", claims: [{ section: "80D_SELF", amount: 25000, evidence: true }] }, "80D").outcome).toBe("eligible");
    expect(oldRegimeDeduction({}, "80C").outcome).toBe("insufficient_information");
  });

  it("regime switch: salary-only may switch in the return; business income needs 10-IEA history and is never executed here (§5.6 example)", () => {
    expect(regimeSwitch({}).outcome).toBe("insufficient_information");
    expect(regimeSwitch({ hasBusinessOrProfessionIncome: false }).outcome).toBe("eligible");
    const biz = regimeSwitch({ hasBusinessOrProfessionIncome: true, priorRegimeOptOut: false });
    expect(biz.outcome).toBe("insufficient_information");
    expect(biz.reason).toContain("Form 10-IEA");
    expect(biz.provisions).toContain("1961:115BAC@FY2025-26");
    // identical totals, different categories → different outcomes
    expect(regimeSwitch({ hasBusinessOrProfessionIncome: false, totalIncome: 1450000 }).outcome).not.toBe(regimeSwitch({ hasBusinessOrProfessionIncome: true, totalIncome: 1450000, priorRegimeOptOut: false }).outcome);
  });

  it("the whole slice runs and every result cites a real provision", () => {
    const results = evaluateSalariedSlice({ period: PERIOD_FY_2025_26, hasSalaryIncome: true, regime: "new", resident: true, totalIncome: 900000, hasBusinessOrProfessionIncome: false, ltcg112A: 0 });
    expect(results.length).toBe(7);
    for (const r of results) for (const id of r.provisions) expect(provisionById(id), id).toBeDefined();
    expect(results.map((r) => r.outcome)).not.toContain(undefined);
  });
});

describe("retrieval — version filter, keyword search, linked expansion, retained candidates", () => {
  it("filters by the period's Act and pulls the exact section plus what it links to", () => {
    const b = retrieve({ text: "can I claim 80C under the new regime", period: PERIOD_FY_2025_26, category: "individual", incomeHeads: ["salary"] });
    const ids = b.provisions.map((p) => p.id);
    expect(ids).toContain("1961:80C@FY2025-26");
    expect(ids).toContain("1961:115BAC@FY2025-26"); // the exception travels with the rule
    expect(b.release).toBeTruthy();
    expect(b.retainedForMissing).toEqual([]);
  });

  it("an unknown attribute retains candidates and says what was missing instead of dropping them", () => {
    const b = retrieve({ text: "standard deduction", period: PERIOD_FY_2025_26 });
    expect(b.provisions.map((p) => p.id)).toContain("1961:16(ia)@FY2025-26");
    const retained = b.retainedForMissing.find((r) => r.provision.id === "1961:16(ia)@FY2025-26");
    expect(retained?.missing).toEqual(["taxpayer category", "income heads"]);
  });

  it("a 2025-Act period retrieves only the transition note, not 1961 rules", () => {
    const b = retrieve({ text: "standard deduction 87A rebate", period: PERIOD_FY_2026_27 });
    expect(b.provisions.map((p) => p.id)).toEqual(["transition:1961-to-2025"]);
  });

  it("an explicit section request outranks keywords, and a category mismatch excludes", () => {
    const b = retrieve({ text: "tax", period: PERIOD_FY_2025_26, sections: ["112A"], category: "individual", incomeHeads: ["capital_gains"], limit: 1 });
    expect(b.provisions[0].id).toBe("1961:112A@FY2025-26");
    const huf = retrieve({ text: "employer NPS 80CCD(2)", period: PERIOD_FY_2025_26, category: "huf", incomeHeads: ["salary"] });
    expect(huf.provisions.map((p) => p.id)).not.toContain("1961:80CCD(2)@FY2025-26");
  });

  it("citations carry title, locator and URL for the Sources panel", () => {
    const c = cite(["1961:87A@FY2025-26", "ghost"]);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ section: "s.87A", url: expect.stringMatching(/^https/) });
  });
});
