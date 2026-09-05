import type { LegalProvision } from "./types";

type Draft = Omit<LegalProvision, "contentHash" | "jurisdiction" | "reviewer" | "reviewedOn">;
const guide = "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1";
const faq = "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/ITR1-FAQ";
const all: Draft["incomeHeads"] = ["salary", "other_sources", "house_property", "capital_gains", "business_profession"];
const id = (s: string) => `1961:${s}@FY2025-26`;
function draft(section: string, title: string, summary: string, ruleText: string, keywords: string[], sourceUrl = guide, locator = title): Draft {
  return { id: id(section), act: "IT_ACT_1961", section, title, summary, ruleText,
    financialYears: ["2025-26"], effectiveFrom: "2025-04-01", sourceKind: "departmental_faq", sourceUrl, locator,
    categories: ["individual", "huf", "senior", "super_senior"], incomeHeads: all, keywords, linked: [id("115BAC")] };
}

/** Curated paraphrases, not copied statutory text or a claim to complete tax-code coverage. */
export const SUPPLEMENTAL_PROVISIONS: Draft[] = [
  draft("115BAC(1A)", "New-regime income-tax slabs", "Seven bands apply to ordinary taxable income, regardless of age.",
    "FY 2025-26: ₹0–4 lakh nil; ₹4–8 lakh 5%; ₹8–12 lakh 10%; ₹12–16 lakh 15%; ₹16–20 lakh 20%; ₹20–24 lakh 25%; above ₹24 lakh 30%. Apply each rate only to its band. These are ordinary-income rates; special-rate income is separate. Rebate, surcharge and cess are subsequent calculations.",
    ["slabs", "tax rates", "bands", "new regime", "115BAC(1A)", "income tax slab"]),
  draft("rates-old", "Old-regime income-tax slabs", "Old-regime exemption depends on age and residency.",
    "Ordinary income: up to ₹2.5 lakh nil, the next band to ₹5 lakh at 5%, ₹5–10 lakh at 20%, above ₹10 lakh at 30%. For resident individuals aged 60–79 the nil band is ₹3 lakh; aged 80 or more it is ₹5 lakh. Non-residents and HUFs do not receive those age concessions. Special-rate income remains separate.",
    ["old regime", "slabs", "senior", "super senior", "non resident", "rates"], guide, "Tax rates tables; read resident age conditions with the Finance Act First Schedule"),
  draft("cess-surcharge", "Cess and surcharge", "High incomes require surcharge and its marginal relief before cess.",
    "Health and Education Cess is 4% of income-tax plus applicable surcharge. Surcharge begins above ₹50 lakh; ordinary old-regime tiers are 10%, 15%, 25% and 37%; the new regime caps the highest at 25%. Certain dividends and capital gains have a 15% surcharge cap. Surcharge marginal relief differs from section 87A relief. This release's calculator does not implement surcharge.",
    ["cess", "surcharge", "50 lakh", "high income", "4%", "marginal relief"]),
  draft("24", "House-property interest and losses", "Home-loan treatment depends on occupancy, borrowing and regime.",
    "Old regime: eligible self-occupied acquisition/construction interest can have a ₹2 lakh ceiling; other conditions can restrict it to ₹30,000. Let-out interest, house-property computation and loss set-off require separate treatment. New regime disallows self-occupied section 24(b) interest and inter-head house-property loss set-off. Do not apply a flat deduction to gross rent or ignore occupancy and loan conditions.",
    ["24(b)", "home loan", "housing loan", "rent", "rental", "house property", "interest", "loss"]),
  draft("80TTA-80TTB", "Savings and senior deposit interest", "Savings interest and term-deposit interest have different deduction rules.",
    "Old regime: section 80TTA permits up to ₹10,000 of eligible savings-account interest for eligible individuals/HUFs, excluding time deposits. Resident seniors qualifying under section 80TTB instead have a ₹50,000 ceiling on eligible deposit interest, including eligible term deposits. Do not combine both deductions. Neither is available under the new regime.",
    ["80TTA", "80TTB", "savings", "bank interest", "fixed deposit", "fd", "senior"]),
  draft("ITR-selection", "Choose the applicable return form", "Income, residency and exclusions determine the form, not salary alone.",
    "For AY 2026-27, ITR-1 has a ₹50 lakh income ceiling and excludes business income, short-term capital gains and section 112A gains above ₹1.25 lakh. It allows up to two house properties. Check residency and all exclusions, including foreign assets/income, directorship, unlisted shares and losses. A salary entry alone never establishes ITR-1 eligibility.",
    ["ITR-1", "ITR-2", "ITR-3", "ITR-4", "form", "which itr", "foreign", "RNOR"], faq, "ITR-1 FAQs Q1–2, Q8"),
  draft("reconciliation", "Reconcile AIS and tax credits", "Match third-party reports with records before confirming or correcting a return.",
    "Compare AIS, Form 26AS, employer/bank statements and the underlying records. Investigate differences with the deductor or reporter. AIS feedback does not itself amend a filed return or guarantee a TDS credit. Do not suppress income merely because reporting is wrong or claim a credit solely from an unverified upload. Filing, tax payment and e-verification are distinct steps.",
    ["AIS", "26AS", "TDS", "mismatch", "refund", "reconcile", "credit", "duplicate", "Form 16"], faq, "ITR-1 FAQs Q6–7, Q18"),
];
