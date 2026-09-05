/**
 * The curated corpus for the first supported slice — salaried returns, regime
 * comparison, and reconciliation for FY 2025-26 (AY 2026-27) — plus the
 * transition case (plan.md §5.6). Every figure here mirrors lib/engine/constants.ts;
 * a disagreement between the two is a release-blocking defect, and the test
 * suite checks it.
 *
 * REVIEW STATUS: drafted from official sources by the implementing engineer;
 * `reviewer` records that. Plan §5.7 requires a qualified Indian tax reviewer to
 * sign the release before rule-based recommendations reach citizens. That gate
 * is open — see docs/CONTEXT.md. An engineering review on 2026-09-05
 * (docs/knowledge-tax-review-2026-09-05.md) corrected the text below; its
 * engine-level findings (80CCE aggregation, 80D senior cap, 80CCD(2) salary
 * percentage, s.112A basic-exemption adjustment) remain open.
 */

import { createHash } from "crypto";
import {
  LTCG_112A_EXEMPTION,
  LTCG_112A_RATE,
  LTCG_112_RATE,
  OLD_REGIME_CLAIM_CAPS,
  REBATE_87A_NEW_MAX_AMOUNT,
  REBATE_87A_NEW_THRESHOLD,
  REBATE_87A_OLD_MAX_AMOUNT,
  REBATE_87A_OLD_THRESHOLD,
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
  STCG_111A_RATE,
} from "../engine/constants";
import type { LegalProvision, TaxPeriod } from "./types";

const REVIEWER = "engineering draft — awaiting qualified tax reviewer (plan §5.7)";
const REVIEWED_ON = "2026-09-05";
const FY = "2025-26";
const IT_PORTAL = "https://www.incometax.gov.in";

export const PERIOD_FY_2025_26: TaxPeriod = { financialYear: "2025-26", label: "AY 2026-27", act: "IT_ACT_1961" };
export const PERIOD_FY_2026_27: TaxPeriod = { financialYear: "2026-27", label: "TY 2026-27", act: "IT_ACT_2025" };

/** Which Act and label govern an income period (§5.6 transition case). */
export function periodForFinancialYear(fy: string): TaxPeriod | null {
  if (fy === "2025-26") return PERIOD_FY_2025_26;
  if (fy === "2026-27") return PERIOD_FY_2026_27;
  // Earlier years are under the 1961 Act with AY labelling; the corpus does not cover them.
  const m = /^(\d{4})-(\d{2})$/.exec(fy);
  if (!m) return null;
  const start = Number(m[1]);
  if (start < 2025) return { financialYear: fy, label: `AY ${start + 1}-${String(start + 2).slice(2)}`, act: "IT_ACT_1961" };
  return { financialYear: fy, label: `TY ${fy}`, act: "IT_ACT_2025" };
}

function hash(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

/** The hash covers everything a citizen may be shown: the rule and its summary. */
export function provisionHash(p: Pick<LegalProvision, "ruleText" | "summary">) {
  return hash(`${p.ruleText}\n${p.summary}`);
}

function provision(p: Omit<LegalProvision, "contentHash" | "jurisdiction" | "reviewer" | "reviewedOn">): LegalProvision {
  return { ...p, jurisdiction: "IN", reviewer: REVIEWER, reviewedOn: REVIEWED_ON, contentHash: provisionHash(p) };
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const PROVISIONS: readonly LegalProvision[] = [
  provision({
    id: "1961:16(ia)@FY2025-26",
    act: "IT_ACT_1961",
    section: "16",
    subsection: "(ia)",
    title: "Standard deduction from salary",
    summary: "A flat amount comes off salary income before tax, once per year, whatever the number of employers.",
    ruleText: `Standard deduction of ${rupees(STANDARD_DEDUCTION_NEW)} under s.115BAC (new regime) or ${rupees(STANDARD_DEDUCTION_OLD)} otherwise, limited to the salary income; nil where there is no salary income; allowed once per assessee per year, not per employer.`,
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, s.16(ia) as amended by Finance (No. 2) Act, 2024",
    categories: ["individual", "senior", "super_senior"],
    incomeHeads: ["salary"],
    keywords: ["standard deduction", "16(ia)", "salary", "75000", "50000", "multiple employers", "Form 16"],
    linked: ["1961:115BAC@FY2025-26"],
  }),
  provision({
    id: "1961:87A@FY2025-26",
    act: "IT_ACT_1961",
    section: "87A",
    title: "Rebate for resident individuals",
    summary: "Below a total-income threshold the slab tax is waived; just above it, relief tapers so an extra rupee of income cannot cost more than a rupee of tax.",
    ruleText: `New regime: full rebate up to ${rupees(REBATE_87A_NEW_MAX_AMOUNT)} where total income does not exceed ${rupees(REBATE_87A_NEW_THRESHOLD)}; marginal relief above it caps pre-cess slab tax at the excess over the threshold. Old regime: rebate up to ${rupees(REBATE_87A_OLD_MAX_AMOUNT)} where total income does not exceed ${rupees(REBATE_87A_OLD_THRESHOLD)}. Resident individuals only. Under the new regime the rebate is limited to tax computed at the s.115BAC(1A) slab rates, so it does not reach tax on income chargeable at special rates (ss.111A, 112, 112A and the like); marginal relief likewise only arises where that slab tax exceeds the excess of total income over the threshold.`,
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, s.87A as amended by Finance Act, 2025",
    categories: ["individual", "senior", "super_senior"],
    incomeHeads: ["salary", "other_sources", "house_property", "capital_gains", "business_profession"],
    keywords: ["rebate", "87A", "marginal relief", "12 lakh", "1200000", "60000", "12500", "resident"],
    linked: ["1961:115BAC@FY2025-26", "1961:112A@FY2025-26"],
  }),
  provision({
    id: "1961:115BAC@FY2025-26",
    act: "IT_ACT_1961",
    section: "115BAC",
    title: "The default (new) tax regime and opting out of it",
    summary: "The new regime is the default. A salaried person can choose the old regime each year in the return; someone with business or professional income must file Form 10-IEA and the choice is sticky.",
    ruleText: "The regime under s.115BAC(1A) is the default. An assessee with no income from business or profession may opt out for a year by exercising the option in the return filed under s.139(1). An assessee with business or professional income opts out by furnishing Form 10-IEA on or before the s.139(1) due date; that option continues for subsequent years and may be withdrawn only once, after which the assessee cannot opt out again while such income continues.",
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "form_manual",
    sourceUrl: `${IT_PORTAL}/iec/foportal/newformpage/forms/form10-iea-UM?mobile-app=1`,
    locator: "s.115BAC(6); Form 10-IEA user manual",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["salary", "business_profession", "house_property", "other_sources", "capital_gains"],
    keywords: ["regime", "new regime", "old regime", "115BAC", "10-IEA", "opt out", "business income", "profession"],
    linked: ["1961:16(ia)@FY2025-26", "1961:87A@FY2025-26", "1961:80C@FY2025-26"],
  }),
  provision({
    id: "1961:80C@FY2025-26",
    act: "IT_ACT_1961",
    section: "80C",
    title: "Deduction for specified savings and payments",
    summary: "Provident fund, life insurance, ELSS, tuition fees and similar payments come off taxable income — under the old regime only.",
    ruleText: `Aggregate deduction under ss.80C, 80CCC and 80CCD(1) limited to ${rupees(OLD_REGIME_CLAIM_CAPS["80C"] ?? 150000)} (s.80CCE). Not available under s.115BAC (new regime). Requires the payment to have actually been made in the year; a package figure or an intention is not a payment.`,
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, ss.80C, 80CCE",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["salary", "other_sources", "house_property", "business_profession", "capital_gains"],
    keywords: ["80C", "PPF", "EPF", "ELSS", "LIC", "tuition", "150000", "old regime", "80CCE"],
    linked: ["1961:115BAC@FY2025-26"],
  }),
  provision({
    id: "1961:80D@FY2025-26",
    act: "IT_ACT_1961",
    section: "80D",
    title: "Deduction for health insurance premium",
    summary: "Medical insurance premium for self and family, and separately for parents, comes off taxable income — under the old regime only.",
    ruleText: `Self, spouse and dependent children: up to ${rupees(OLD_REGIME_CLAIM_CAPS["80D"] ?? 25000)} (${rupees(50000)} if the assessee or spouse is a senior citizen). Parents: up to ${rupees(OLD_REGIME_CLAIM_CAPS["80D_PARENTS"] ?? 50000)} where a parent is a senior citizen, else ${rupees(25000)}. Payment other than in cash. Not available under s.115BAC.`,
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, s.80D",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["salary", "other_sources", "house_property", "business_profession", "capital_gains"],
    keywords: ["80D", "health insurance", "mediclaim", "premium", "parents", "25000", "50000", "old regime"],
    linked: ["1961:115BAC@FY2025-26"],
  }),
  provision({
    id: "1961:80CCD(2)@FY2025-26",
    act: "IT_ACT_1961",
    section: "80CCD",
    subsection: "(2)",
    title: "Employer's contribution to NPS",
    summary: "What an employer pays into the employee's pension account is deductible — in both regimes. The employee's own PF is not this.",
    ruleText: "Employer contribution to the employee's NPS account under s.80CCD(2) is deductible in both regimes, up to 14% of salary under s.115BAC and 10% otherwise (14% for Central and State Government employers). Salary for this purpose means basic pay plus dearness allowance forming part of retirement benefits, not the whole package. Employee contributions fall under s.80CCD(1)/(1B), which the new regime does not allow. Provident fund is not NPS.",
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, s.80CCD(2) and Explanation",
    categories: ["individual", "senior", "super_senior"],
    incomeHeads: ["salary"],
    keywords: ["80CCD(2)", "NPS", "employer contribution", "pension", "both regimes", "14%", "10%", "PF is not NPS"],
    linked: ["1961:115BAC@FY2025-26"],
  }),
  provision({
    id: "1961:111A@FY2025-26",
    act: "IT_ACT_1961",
    section: "111A",
    title: "Short-term capital gains on listed equity with STT",
    summary: "Profit on shares or equity funds sold within a year is taxed at a flat rate, not at slab.",
    ruleText: `Short-term capital gains on transfer of equity shares, equity-oriented fund units or business-trust units on which STT was paid are taxed at ${STCG_111A_RATE * 100}% for transfers on or after 23 July 2024. Chapter VI-A deductions do not reduce such gains.`,
    financialYears: [FY],
    effectiveFrom: "2024-07-23",
    sourceKind: "finance_act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, s.111A as amended by Finance (No. 2) Act, 2024",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["capital_gains"],
    keywords: ["111A", "STCG", "short-term", "equity", "STT", "20%", "shares", "broker"],
    linked: ["1961:112A@FY2025-26"],
  }),
  provision({
    id: "1961:112A@FY2025-26",
    act: "IT_ACT_1961",
    section: "112A",
    title: "Long-term capital gains on listed equity with STT",
    summary: "Profit on shares or equity funds held over a year is tax-free up to a yearly threshold and taxed at a flat rate above it.",
    ruleText: `Long-term capital gains under s.112A are taxed at ${LTCG_112A_RATE * 100}% on the amount exceeding ${rupees(LTCG_112A_EXEMPTION)} in the year, for transfers on or after 23 July 2024. The whole gain forms part of total income; the threshold is a tax computation rule, not an exclusion from income. For a resident individual or HUF whose other income is below the basic exemption limit, the unused part of that limit is set against the gain before the rate applies (proviso to s.112A(2)). The s.87A rebate does not apply to tax under this section.`,
    financialYears: [FY],
    effectiveFrom: "2024-07-23",
    sourceKind: "finance_act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, s.112A as amended by Finance (No. 2) Act, 2024",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["capital_gains"],
    keywords: ["112A", "LTCG", "long-term", "equity", "125000", "1.25 lakh", "12.5%", "exemption"],
    linked: ["1961:111A@FY2025-26", "1961:87A@FY2025-26"],
  }),
  provision({
    id: "1961:112@FY2025-26",
    act: "IT_ACT_1961",
    section: "112",
    title: "Long-term capital gains on other assets",
    summary: "Long-term gains on assets other than listed equity are taxed at a flat rate.",
    ruleText: `Long-term capital gains not covered by s.112A are taxed at ${LTCG_112_RATE * 100}% without indexation for transfers on or after 23 July 2024. For a resident individual or HUF transferring land or a building acquired before 23 July 2024, tax is limited to what the earlier 20%-with-indexation computation would give; the unused basic exemption limit is set against the gain first (s.112(1)(a) provisos).`,
    financialYears: [FY],
    effectiveFrom: "2024-07-23",
    sourceKind: "finance_act",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/individual/return-applicable-1`,
    locator: "Income-tax Act, 1961, s.112 as amended by Finance (No. 2) Act, 2024",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["capital_gains"],
    keywords: ["112", "LTCG", "12.5%", "property", "gold", "debt"],
    linked: ["1961:112A@FY2025-26"],
  }),
  provision({
    id: "1961:139(1)@FY2025-26",
    act: "IT_ACT_1961",
    section: "139",
    subsection: "(1)",
    title: "Due date for filing the return",
    summary: "Salaried individuals whose accounts need no audit file by 31 July after the year ends; a late return can still be filed until 31 December, and a filed return can be corrected until 31 March, at a cost.",
    ruleText: "Return under s.139(1) due by 31 July 2026 for salaried individuals not subject to audit (the department's notified calendar sets later dates for some other non-audit categories and for business or professional cases; check the category). Belated return under s.139(4) by 31 December 2026. Revised return under s.139(5) by 31 March 2027, provided the assessment is not completed earlier; a revision after 31 December 2026 attracts an additional fee under s.234-I. Late filing attracts a fee under s.234F (₹5,000; ₹1,000 where total income does not exceed ₹5,00,000) and interest under s.234A on unpaid tax, not on lateness alone.",
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "departmental_faq",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/all-topics/e-filing-services/ITR1-FAQ`,
    locator: "Income-tax Act, 1961, ss.139(1), 139(4), 139(5), 234A, 234F, 234-I; ITR-1 FAQs Q19–20 and return-transition FAQ Q6 (AY 2026-27 dates)",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["salary", "other_sources", "house_property", "capital_gains", "business_profession"],
    keywords: ["due date", "31 July", "139(1)", "belated", "revised", "139(5)", "234F", "late fee"],
    linked: ["1961:139(9)@FY2025-26"],
  }),
  provision({
    id: "1961:139(9)@FY2025-26",
    act: "IT_ACT_1961",
    section: "139",
    subsection: "(9)",
    title: "Defective return",
    summary: "If the return is incomplete in a way the law lists — missing schedules, statements or figures — the department sends a defect notice; left unanswered, the return is treated as never filed. A mismatch with what others reported is handled by its own notice, not by this rule.",
    ruleText: "Where the Assessing Officer considers a return defective on a ground listed in the Explanation to s.139(9), the assessee is given 15 days (extendable) to rectify it; failing rectification the return is treated as invalid. Unpaid self-assessment tax under s.140A no longer makes a return defective (clause (aa) omitted from AY 2017-18); the tax remains payable with interest, which is a separate consequence.",
    financialYears: [FY],
    effectiveFrom: "2025-04-01",
    sourceKind: "circular",
    sourceUrl: "https://incometaxindia.gov.in/communications/circular/circular03_2017.pdf",
    locator: "Income-tax Act, 1961, s.139(9) and Explanation; CBDT Circular 3/2017 paras 55.9–55.10 (omission of clause (aa))",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["salary", "other_sources", "house_property", "capital_gains", "business_profession"],
    keywords: ["defective", "139(9)", "defect notice", "invalid return", "rectify"],
    linked: ["1961:139(1)@FY2025-26"],
  }),
  provision({
    id: "transition:1961-to-2025",
    act: "IT_ACT_2025",
    section: "1",
    title: "Which Act applies to which year",
    summary: "Income earned in FY 2025-26 is still assessed under the 1961 Act as AY 2026-27. Income from 1 April 2026 falls under the Income-tax Act, 2025 and is labelled Tax Year 2026-27. This is about the ACT, not about the old-vs-new regime choice.",
    ruleText: "Income of FY 2025-26 (AY 2026-27) is governed by the Income-tax Act, 1961. Income of FY 2026-27 onwards (Tax Year 2026-27) is governed by the Income-tax Act, 2025. The Act that applies to a period is independent of the regime an assessee elects under it.",
    financialYears: ["2025-26", "2026-27"],
    effectiveFrom: "2026-04-01",
    sourceKind: "departmental_faq",
    sourceUrl: `${IT_PORTAL}/iec/foportal/help/all-topics/e-filing-services/objective-and-scope-new-act-faq`,
    locator: "Objective and scope of the new Act — FAQ",
    categories: ["individual", "huf", "senior", "super_senior"],
    incomeHeads: ["salary", "other_sources", "house_property", "capital_gains", "business_profession"],
    keywords: ["transition", "Income-tax Act 2025", "tax year", "assessment year", "1961", "2025 Act", "new act"],
    linked: [],
  }),
];

export function provisionById(id: string): LegalProvision | undefined {
  return PROVISIONS.find((p) => p.id === id);
}
