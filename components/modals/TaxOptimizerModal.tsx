"use client";

import { useState, useId } from "react";
import {
  X,
  Calculator,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  Home,
  HeartPulse,
  PiggyBank,
  Check,
  Building,
} from "lucide-react";
import { computeAY2026Tax } from "@/lib/taxEngineAY2026";
import { formatMoney } from "@/lib/money";
import type { Lang } from "@/lib/types";

interface TaxOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  activeCitizen?: { name: string; pan: string; salary?: number; tds?: number; totalTaxesPaid?: number } | null;
  currentRegime?: "new" | "old";
  onApplyOptimizer?: (
    regime: "new" | "old",
    grossSalary: number,
    deductions: {
      section80C: number;
      section80D: number;
      hra: number;
      nps: number;
      homeLoan: number;
    }
  ) => void;
}

const PRESETS = [
  { label: "₹7.5 Lakh", salary: 750000 },
  { label: "₹10 Lakh", salary: 1000000 },
  { label: "₹12.75 Lakh", salary: 1275000 },
  { label: "₹14.5 Lakh", salary: 1450000 },
  { label: "₹18 Lakh", salary: 1800000 },
  { label: "₹25 Lakh", salary: 2500000 },
];

export default function TaxOptimizerModal({
  isOpen,
  onClose,
  lang,
  activeCitizen,
  currentRegime = "new",
  onApplyOptimizer,
}: TaxOptimizerModalProps) {
  const isHindi = lang === "hi";

  // Tab State: "battle" | "deductions" | "marginal"
  const [activeTab, setActiveTab] = useState<"battle" | "deductions" | "marginal">("battle");

  // Initial salary defaults to active citizen's salary or ₹14.5L
  const [grossSalary, setGrossSalary] = useState<number>(() => {
    return activeCitizen?.salary || 1450000;
  });

  // Deduction Builders
  const [section80C, setSection80C] = useState<number>(150000);
  const [section80D, setSection80D] = useState<number>(25000);
  const [parents80D, setParents80D] = useState<number>(0);
  const [nps80CCD1B, setNps80CCD1B] = useState<number>(0);
  const [homeLoan24b, setHomeLoan24b] = useState<number>(0);

  // HRA Calculator State
  const [basicSalary, setBasicSalary] = useState<number>(600000);
  const [actualRentPaid, setActualRentPaid] = useState<number>(180000);
  const [isMetroCity, setIsMetroCity] = useState<boolean>(true);
  const [includeHra, setIncludeHra] = useState<boolean>(false);

  // Marginal Relief Explorer Salary Slider
  const [marginalSalary, setMarginalSalary] = useState<number>(780000);

  // User manual override for chosen regime
  const [manualRegimeChoice, setManualRegimeChoice] = useState<"new" | "old" | null>(null);

  const salaryId = useId();

  if (!isOpen) return null;

  // Taxes already paid: sum of all TDS, advance tax, and Challan 280 payments
  const taxesAlreadyPaid = activeCitizen?.totalTaxesPaid ?? activeCitizen?.tds ?? 0;

  // Calculate HRA exemption u/s 10(13A)
  // Rule: Minimum of:
  // 1) Actual HRA received (assume 40% or 50% of basic)
  // 2) Rent paid - 10% of basic salary
  // 3) 50% of basic (metro) or 40% of basic (non-metro)
  const assumedHraReceived = basicSalary * (isMetroCity ? 0.5 : 0.4);
  const rentMinusTenPercent = Math.max(0, actualRentPaid - 0.1 * basicSalary);
  const maxPercentBasic = basicSalary * (isMetroCity ? 0.5 : 0.4);
  const calculatedHraExemption = Math.round(
    Math.min(assumedHraReceived, rentMinusTenPercent, maxPercentBasic)
  );
  const effectiveHra = includeHra ? calculatedHraExemption : 0;

  const totalDeductions =
    section80C + section80D + parents80D + nps80CCD1B + homeLoan24b + effectiveHra;

  // Compute Tax for Main Comparison (with taxes already paid subtracted!)
  const result = computeAY2026Tax({
    isSalaried: true,
    age: 32,
    grossSalary,
    businessIncome: 0,
    savingsInterest: 0,
    otherIncome: 0,
    tdsPaid: taxesAlreadyPaid,
    advanceTaxPaid: 0,
    section80C,
    section80D: section80D + parents80D,
    additionalClaims: [
      ...(effectiveHra > 0
        ? [{ id: "hra", section: "HRA", label: "HRA", amount: effectiveHra }]
        : []),
      ...(nps80CCD1B > 0
        ? [{ id: "nps", section: "80CCD_1B", label: "NPS", amount: nps80CCD1B }]
        : []),
      ...(homeLoan24b > 0
        ? [{ id: "hl", section: "24B", label: "Home Loan", amount: homeLoan24b }]
        : []),
    ],
  });

  const oldGrossTax = result.oldRegime.totalTaxLiability;
  const newGrossTax = result.newRegime.totalTaxLiability;

  // Net position after subtracting all previous taxes paid (TDS + Challan)
  // negative = refund due to citizen, positive = balance tax payable
  const oldNet = result.oldRegime.netPayableOrRefund;
  const newNet = result.newRegime.netPayableOrRefund;

  const taxDifference = Math.abs(oldGrossTax - newGrossTax);
  const isNewBetter = newGrossTax <= oldGrossTax;
  const recommendedRegime: "new" | "old" = isNewBetter ? "new" : "old";
  const selectedRegimeChoice: "new" | "old" = manualRegimeChoice ?? recommendedRegime;

  // Compute Breakeven Deduction
  // Determine approximate deduction where old tax == new tax
  const findBreakeven = () => {
    let low = 0;
    let high = grossSalary;
    let best = 0;
    for (let d = 50000; d <= grossSalary; d += 10000) {
      const test = computeAY2026Tax({
        isSalaried: true,
        age: 32,
        grossSalary,
        businessIncome: 0,
        savingsInterest: 0,
        otherIncome: 0,
        tdsPaid: 0,
        advanceTaxPaid: 0,
        section80C: Math.min(150000, d),
        section80D: Math.max(0, d - 150000),
      });
      if (test.oldRegime.totalTaxLiability <= newGrossTax) {
        best = d;
        break;
      }
    }
    return best;
  };
  const breakevenDeductions = findBreakeven();

  // Compute Marginal Relief Comparison for Tab 3
  const marginalResult = computeAY2026Tax({
    isSalaried: true,
    age: 32,
    grossSalary: marginalSalary,
    businessIncome: 0,
    savingsInterest: 0,
    otherIncome: 0,
    tdsPaid: 0,
    advanceTaxPaid: 0,
    section80C: 0,
    section80D: 0,
  });

  const handleApply = () => {
    onClose();
    if (onApplyOptimizer) {
      onApplyOptimizer(selectedRegimeChoice, grossSalary, {
        section80C,
        section80D: section80D + parents80D,
        hra: effectiveHra,
        nps: nps80CCD1B,
        homeLoan: homeLoan24b,
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-optimizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-4xl h-[88vh] flex flex-col rounded-3xl bg-paper shadow-2xl border border-amber-500/40 text-start overflow-hidden">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-start justify-between border-b border-line p-5 sm:p-6 bg-paper">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30 shrink-0">
              <Calculator size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="tax-optimizer-title" className="font-sans text-xl md:text-2xl font-bold text-ink">
                  {isHindi ? "टैक्स और रिजीम ऑप्टिमाइज़र (AY 2026-27)" : "Tax & Regime Optimizer (AY 2026-27)"}
                </h2>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Card 03
                </span>
              </div>
              <p className="text-xs text-ink-2 mt-0.5">
                {activeCitizen ? (
                  <span>
                    {isHindi ? "सक्रिय करदाता सत्र:" : "Active Taxpayer:"}{" "}
                    <span className="font-bold text-ink">{activeCitizen.name}</span> (PAN:{" "}
                    <span className="font-mono font-bold text-ink">{activeCitizen.pan}</span>) ·{" "}
                    {isHindi ? "वर्तमान ड्राफ्ट:" : "Current Draft:"}{" "}
                    <strong className="text-amber-600 uppercase">{currentRegime} Regime</strong>
                  </span>
                ) : (
                  <span>
                    {isHindi
                      ? "धारा 87A मार्जिनल रिलीफ और 80C/80D/HRA कटौतियों के साथ पुरानी बनाम नई कर व्यवस्था की त्वरित तुलना।"
                      : "Instant Old vs New Regime statutory comparison with Section 87A marginal relief and deduction discovery."}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-ink-3 hover:bg-paper-3 hover:text-ink transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fixed Navigation Tabs */}
        <div className="shrink-0 flex items-center gap-2 border-b border-line/70 px-5 sm:px-6 pt-3 pb-3 bg-paper">
          <button
            type="button"
            onClick={() => setActiveTab("battle")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "battle"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink"
            }`}
          >
            <Zap size={13} />
            <span>{isHindi ? "1. लाइव रिजीम तुलना (Old vs New)" : "1. Live Regime Battle"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deductions")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "deductions"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink"
            }`}
          >
            <PiggyBank size={13} />
            <span>{isHindi ? "2. छूट खोज व HRA कैलकुलेटर" : "2. Deduction Discovery & HRA"}</span>
            {totalDeductions > 0 && (
              <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-200">
                ₹{(totalDeductions / 1000).toFixed(0)}k
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("marginal")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "marginal"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink"
            }`}
          >
            <HelpCircle size={13} />
            <span>{isHindi ? "3. धारा 87A मार्जिनल रिलीफ" : "3. Section 87A Marginal Relief"}</span>
          </button>
        </div>

        {/* Scrollable Body: Contained localized scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: LIVE REGIME BATTLE */}
          {activeTab === "battle" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Salary Selector & Presets */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label htmlFor={salaryId} className="font-mono text-xs font-bold uppercase text-ink-2">
                    {isHindi ? "वार्षिक सकल वेतन (Annual Gross Salary)" : "Annual Gross Salary"}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm text-ink-3">₹</span>
                    <input
                      id={salaryId}
                      type="number"
                      value={grossSalary}
                      step={25000}
                      min={0}
                      onChange={(e) => setGrossSalary(Math.max(0, Number(e.target.value) || 0))}
                      className="w-36 rounded-xl border border-amber-500/50 bg-paper px-3 py-1 text-sm font-mono font-bold text-ink focus:border-amber-500 focus:outline-none text-end shadow-sm"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-mono text-ink-3 uppercase me-1">
                    {isHindi ? "त्वरित चयन:" : "Presets:"}
                  </span>
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setGrossSalary(p.salary)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition cursor-pointer ${
                        grossSalary === p.salary
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-paper border border-line text-ink-2 hover:text-ink hover:border-amber-400"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommendation Winner Callout */}
              <div
                className={`rounded-2xl p-4 border-2 flex items-center justify-between gap-4 flex-wrap transition shadow-sm ${
                  isNewBetter
                    ? "border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : "border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl text-white font-bold shrink-0 ${
                      isNewBetter ? "bg-emerald-600" : "bg-blue-600"
                    }`}
                  >
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-3 block">
                      {isHindi ? "सर्वोत्तम वैधानिक अनुशंसा" : "Optimal Statutory Recommendation"}
                    </span>
                    <h3 className="font-sans text-base sm:text-lg font-black text-ink">
                      {isNewBetter
                        ? isHindi
                          ? `नई व्यवस्था बेहतर है · ₹${formatMoney(taxDifference, lang)} की बचत`
                          : `New Tax Regime Saves You ${formatMoney(taxDifference, lang)}!`
                        : isHindi
                        ? `पुरानी व्यवस्था बेहतर है · ₹${formatMoney(taxDifference, lang)} की बचत`
                        : `Old Tax Regime Saves You ${formatMoney(taxDifference, lang)}!`}
                    </h3>
                    {taxesAlreadyPaid > 0 && (
                      <p className="text-xs font-semibold text-ink-2 mt-0.5">
                        {isHindi
                          ? `पूर्व भुगतान: ₹${formatMoney(taxesAlreadyPaid, lang)} घटाने के बाद ${
                              (isNewBetter ? newNet : oldNet) < 0
                                ? `रिफंड: ₹${formatMoney(Math.abs(isNewBetter ? newNet : oldNet), lang)}`
                                : (isNewBetter ? newNet : oldNet) > 0
                                ? `बकाया देय: ₹${formatMoney(isNewBetter ? newNet : oldNet, lang)}`
                                : "पूर्ण चुकता"
                            }`
                          : `After subtracting ₹${formatMoney(taxesAlreadyPaid, lang)} taxes already paid: ${
                              (isNewBetter ? newNet : oldNet) < 0
                                ? `Net Refund ${formatMoney(Math.abs(isNewBetter ? newNet : oldNet), lang)}`
                                : (isNewBetter ? newNet : oldNet) > 0
                                ? `Balance Due ${formatMoney(isNewBetter ? newNet : oldNet, lang)}`
                                : "Fully Settled"
                            }`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualRegimeChoice(recommendedRegime)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedRegimeChoice === recommendedRegime
                        ? "bg-ink text-paper shadow-md"
                        : "bg-paper border border-line text-ink-2 hover:text-ink"
                    }`}
                  >
                    <Check size={13} />
                    <span>
                      {selectedRegimeChoice === recommendedRegime
                        ? isHindi
                          ? "चयनित (लागू करने हेतु तैयार)"
                          : "Selected to Apply"
                        : isHindi
                        ? "इसे चुनें"
                        : "Select This"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NEW REGIME CARD */}
                <div
                  onClick={() => setManualRegimeChoice("new")}
                  className={`rounded-2xl p-5 border-2 transition cursor-pointer space-y-4 ${
                    selectedRegimeChoice === "new"
                      ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-md ring-1 ring-amber-500"
                      : "border-line bg-paper hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">
                          {isHindi ? "नई कर व्यवस्था (Section 115BAC)" : "New Regime (Sec 115BAC)"}
                        </span>
                        {isNewBetter && (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                            {isHindi ? "सर्वोत्तम" : "Winner"}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-3">
                        {isHindi ? "डिफ़ॉल्ट वैधानिक व्यवस्था" : "Default Government Regime"}
                      </span>
                    </div>

                    <div className="size-5 rounded-full border border-line flex items-center justify-center bg-paper">
                      {selectedRegimeChoice === "new" && (
                        <div className="size-3 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-y border-line/60 py-3">
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "मानक वेतन कटौती:" : "Standard Deduction:"}</span>
                      <span className="font-mono font-bold text-ink">₹75,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "निवेश कटौतियां (80C/80D):" : "80C / 80D Deductions:"}</span>
                      <span className="font-mono text-ink-3">
                        {isHindi ? "अनुमत नहीं (शून्य)" : "Not Applicable (₹0)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "कर योग्य आय:" : "Taxable Income:"}</span>
                      <span className="font-mono font-bold text-ink">
                        {formatMoney(result.newRegime.taxableIncome, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "धारा 87A छूट / मार्जिनल रिलीफ:" : "Sec 87A Rebate / Relief:"}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {result.newRegime.rebate87A > 0 ? `-${formatMoney(result.newRegime.rebate87A, lang)}` : "₹0"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-ink-2">{isHindi ? "कुल टैक्स देयता:" : "Total Tax Liability:"}</span>
                      <span className="font-mono font-bold text-ink">
                        {formatMoney(newGrossTax, lang)}
                      </span>
                    </div>
                    {taxesAlreadyPaid > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {isHindi ? "जमा टैक्स (TDS / चालान 280):" : "Taxes Paid (TDS / Challan):"}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          −{formatMoney(taxesAlreadyPaid, lang)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between pt-1 border-t border-line/60">
                      <span className="text-xs font-bold text-ink">
                        {newNet < 0
                          ? (isHindi ? "अंतिम रिफंड राशि:" : "Net Refund Due:")
                          : newNet > 0
                          ? (isHindi ? "अतिरिक्त देय टैक्स:" : "Balance Tax Payable:")
                          : (isHindi ? "शुद्ध स्थिति:" : "Net Tax Position:")}
                      </span>
                      <span className={`font-mono text-2xl font-black ${
                        newNet < 0 ? "text-emerald-600 dark:text-emerald-400" : newNet > 0 ? "text-amber-600 dark:text-amber-400" : "text-ink"
                      }`}>
                        {newNet < 0 ? `+${formatMoney(Math.abs(newNet), lang)}` : newNet > 0 ? formatMoney(newNet, lang) : "₹0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* OLD REGIME CARD */}
                <div
                  onClick={() => setManualRegimeChoice("old")}
                  className={`rounded-2xl p-5 border-2 transition cursor-pointer space-y-4 ${
                    selectedRegimeChoice === "old"
                      ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-md ring-1 ring-amber-500"
                      : "border-line bg-paper hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">
                          {isHindi ? "पुरानी कर व्यवस्था (Old Regime)" : "Old Regime (Deductions)"}
                        </span>
                        {!isNewBetter && (
                          <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                            {isHindi ? "सर्वोत्तम" : "Winner"}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-3">
                        {isHindi ? "निवेश व छूट आधारित" : "Requires Proofs for 80C/80D/HRA"}
                      </span>
                    </div>

                    <div className="size-5 rounded-full border border-line flex items-center justify-center bg-paper">
                      {selectedRegimeChoice === "old" && (
                        <div className="size-3 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-y border-line/60 py-3">
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "मानक वेतन कटौती:" : "Standard Deduction:"}</span>
                      <span className="font-mono font-bold text-ink">₹50,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "कुल अनुमत कटौतियां:" : "Total Deductions Claimed:"}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(totalDeductions, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "कर योग्य आय:" : "Taxable Income:"}</span>
                      <span className="font-mono font-bold text-ink">
                        {formatMoney(result.oldRegime.taxableIncome, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-2">{isHindi ? "धारा 87A छूट (पुराने स्लैब):" : "Sec 87A Rebate:"}</span>
                      <span className="font-mono text-ink-3">
                        {result.oldRegime.rebate87A > 0 ? `-${formatMoney(result.oldRegime.rebate87A, lang)}` : "₹0"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-ink-2">{isHindi ? "कुल टैक्स देयता:" : "Total Tax Liability:"}</span>
                      <span className="font-mono font-bold text-ink">
                        {formatMoney(oldGrossTax, lang)}
                      </span>
                    </div>
                    {taxesAlreadyPaid > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {isHindi ? "जमा टैक्स (TDS / चालान 280):" : "Taxes Paid (TDS / Challan):"}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          −{formatMoney(taxesAlreadyPaid, lang)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between pt-1 border-t border-line/60">
                      <span className="text-xs font-bold text-ink">
                        {oldNet < 0
                          ? (isHindi ? "अंतिम रिफंड राशि:" : "Net Refund Due:")
                          : oldNet > 0
                          ? (isHindi ? "अतिरिक्त देय टैक्स:" : "Balance Tax Payable:")
                          : (isHindi ? "शुद्ध स्थिति:" : "Net Tax Position:")}
                      </span>
                      <span className={`font-mono text-2xl font-black ${
                        oldNet < 0 ? "text-emerald-600 dark:text-emerald-400" : oldNet > 0 ? "text-blue-600 dark:text-blue-400" : "text-ink"
                      }`}>
                        {oldNet < 0 ? `+${formatMoney(Math.abs(oldNet), lang)}` : oldNet > 0 ? formatMoney(oldNet, lang) : "₹0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakeven Threshold Analyzer */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-500" />
                  <span className="font-bold text-ink">
                    {isHindi ? "ब्रेकईवन कटौती विश्लेषण (Breakeven Point):" : "Breakeven Threshold Analysis:"}
                  </span>
                </div>
                <p className="text-ink-2 leading-relaxed">
                  {breakevenDeductions > 0 ? (
                    isHindi ? (
                      <>
                        इस वेतन पर पुरानी व्यवस्था को नई व्यवस्था से बेहतर होने के लिए आपको कम से कम{" "}
                        <strong className="text-amber-600 font-mono font-bold">
                          {formatMoney(breakevenDeductions, lang)}
                        </strong>{" "}
                        की कुल कटौतियों (80C + 80D + HRA + होम लोन) की आवश्यकता है। आपकी वर्तमान कटौतियां{" "}
                        <span className="font-mono font-bold text-ink">{formatMoney(totalDeductions, lang)}</span> हैं।
                      </>
                    ) : (
                      <>
                        For your salary of <span className="font-mono font-bold text-ink">{formatMoney(grossSalary, lang)}</span>, you need at least{" "}
                        <strong className="text-amber-600 font-mono font-bold">
                          {formatMoney(breakevenDeductions, lang)}
                        </strong>{" "}
                        in total deductions (80C, 80D, HRA, Home Loan) for the Old Regime to save more tax. You currently have{" "}
                        <span className="font-mono font-bold text-ink">{formatMoney(totalDeductions, lang)}</span> configured.
                      </>
                    )
                  ) : (
                    isHindi
                      ? "इस वेतन स्तर पर धारा 87A राहत के कारण नई व्यवस्था में टैक्स शून्य है।"
                      : "At this income level, Section 87A rebate completely zeros out liability in the New Regime."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DEDUCTION DISCOVERY & HRA CALCULATOR */}
          {activeTab === "deductions" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-3 text-xs">
                <span className="text-amber-900 dark:text-amber-200">
                  {isHindi
                    ? "यहाँ अपनी कटौतियों को जोड़ें। ये आंकड़े पुरानी कर व्यवस्था की गणना में स्वतः जुड़ जाएंगे।"
                    : "Configure eligible Chapter VI-A investments & HRA. They automatically feed into your Old Regime tax calculation."}
                </span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                  {isHindi ? "कुल:" : "Total:"} {formatMoney(totalDeductions, lang)}
                </span>
              </div>

              {/* 80C Builder */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={18} className="text-blue-600" />
                    <div>
                      <span className="font-bold text-sm text-ink block">
                        {isHindi ? "धारा 80C (PPF, EPF, ELSS, जीवन बीमा, ट्यूशन फीस)" : "Section 80C (EPF, PPF, ELSS, LIC, Tuition Fees)"}
                      </span>
                      <span className="text-[11px] text-ink-3">
                        {isHindi ? "अधिकतम वैधानिक सीमा: ₹1,50,000" : "Statutory Ceiling: ₹1,50,000"}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-ink">
                    {formatMoney(section80C, lang)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150000}
                  step={5000}
                  value={section80C}
                  onChange={(e) => setSection80C(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* 80D Health Insurance */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={18} className="text-rose-600" />
                    <div>
                      <span className="font-bold text-sm text-ink block">
                        {isHindi ? "धारा 80D (स्वास्थ्य बीमा प्रीमियम)" : "Section 80D (Health Insurance Premium)"}
                      </span>
                      <span className="text-[11px] text-ink-3">
                        {isHindi ? "स्वयं/परिवार (₹25,000 तक) + वरिष्ठ माता-पिता (₹50,000 तक)" : "Self & Family (max ₹25k) + Senior Citizen Parents (max ₹50k)"}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-ink">
                    {formatMoney(section80D + parents80D, lang)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-ink-2 block mb-1">
                      {isHindi ? "स्वयं व बच्चे (Max ₹25k)" : "Self, Spouse & Children"}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={25000}
                      step={2500}
                      value={section80D}
                      onChange={(e) => setSection80D(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-2 block mb-1">
                      {isHindi ? "माता-पिता (वरिष्ठ नागरिक Max ₹50k)" : "Senior Citizen Parents (Max ₹50k)"}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={50000}
                      step={5000}
                      value={parents80D}
                      onChange={(e) => setParents80D(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* NPS 80CCD(1B) and Home Loan 24(b) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NPS */}
                <div className="rounded-2xl border border-line bg-paper-2 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-ink block">
                      {isHindi ? "NPS अतिरिक्त छूट (80CCD 1B)" : "NPS Additional (Sec 80CCD 1B)"}
                    </span>
                    <span className="font-mono font-bold text-xs text-ink">
                      {formatMoney(nps80CCD1B, lang)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50000}
                    step={5000}
                    value={nps80CCD1B}
                    onChange={(e) => setNps80CCD1B(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-ink-3 block">
                    {isHindi ? "80C के अतिरिक्त ₹50,000 तक" : "Extra ₹50k over and above 80C"}
                  </span>
                </div>

                {/* Home Loan 24b */}
                <div className="rounded-2xl border border-line bg-paper-2 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-ink block">
                      {isHindi ? "होम लोन ब्याज (धारा 24b)" : "Home Loan Interest (Sec 24b)"}
                    </span>
                    <span className="font-mono font-bold text-xs text-ink">
                      {formatMoney(homeLoan24b, lang)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200000}
                    step={10000}
                    value={homeLoan24b}
                    onChange={(e) => setHomeLoan24b(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-ink-3 block">
                    {isHindi ? "स्वयं अधिकृत मकान पर ₹2,00,000 तक" : "Self-occupied house max ₹2,00,000"}
                  </span>
                </div>
              </div>

              {/* Section 10(13A) HRA Calculator */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home size={18} className="text-emerald-600" />
                    <div>
                      <span className="font-bold text-sm text-ink block">
                        {isHindi ? "मकान किराया भत्ता छूट (HRA u/s 10(13A))" : "House Rent Allowance (HRA Exemption u/s 10(13A))"}
                      </span>
                      <span className="text-[11px] text-ink-3">
                        {isHindi ? "धारा 10(13A) के 3 वैधानिक नियमों के आधार पर गणना" : "Computed based on CBDT Rule 2A formula"}
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHra}
                      onChange={(e) => setIncludeHra(e.target.checked)}
                      className="size-4 rounded border-line accent-amber-600"
                    />
                    <span className="text-xs font-bold text-ink">
                      {isHindi ? "HRA छूट जोड़ें" : "Claim HRA"}
                    </span>
                  </label>
                </div>

                {includeHra && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-line/60 text-xs">
                    <div>
                      <label className="text-ink-2 block mb-1 font-semibold">
                        {isHindi ? "वार्षिक मूल वेतन (Basic Salary):" : "Annual Basic Salary:"}
                      </label>
                      <input
                        type="number"
                        step={25000}
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-ink text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-ink-2 block mb-1 font-semibold">
                        {isHindi ? "वार्षिक भुगतान किया गया किराया:" : "Annual Rent Paid:"}
                      </label>
                      <input
                        type="number"
                        step={10000}
                        value={actualRentPaid}
                        onChange={(e) => setActualRentPaid(Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-ink text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-ink-2 block mb-1 font-semibold">
                        {isHindi ? "शहर का प्रकार:" : "City Type:"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsMetroCity(!isMetroCity)}
                        className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-ink text-xs font-semibold flex items-center justify-between cursor-pointer"
                      >
                        <span>{isMetroCity ? "Metro (50%)" : "Non-Metro (40%)"}</span>
                        <Building size={13} className="text-ink-3" />
                      </button>
                    </div>
                    <div className="sm:col-span-3 pt-1 flex items-center justify-between text-xs bg-paper p-2.5 rounded-xl border border-line">
                      <span className="text-ink-2 font-medium">
                        {isHindi ? "गणना की गई HRA छूट:" : "Calculated HRA Exemption:"}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(calculatedHraExemption, lang)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SECTION 87A MARGINAL RELIEF RADAR */}
          {activeTab === "marginal" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-line bg-paper-2 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <ShieldCheck size={18} />
                  <span>
                    {isHindi
                      ? "धारा 87A मार्जिनल रिलीफ क्या है और यह आपको कैसे बचाती है?"
                      : "What is Section 87A Marginal Relief & How Does it Protect You?"}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {isHindi
                    ? "आयकर अधिनियम में ₹7,75,000 (वेतन के बाद) तक टैक्स शून्य होता है। यदि आपकी आय ₹7,80,000 (केवल ₹5,000 अधिक) हो जाती है, तो बिना मार्जिनल रिलीफ के आप पर ₹25,000 से अधिक टैक्स लग जाता! धारा 87A मार्जिनल रिलीफ यह सुनिश्चित करती है कि आपका टैक्स ₹7.75L से अधिक अर्जित की गई राशि (यहाँ ₹5,000) से अधिक कभी नहीं हो सकता।"
                    : "Under the New Tax Regime, total income up to ₹7,75,000 (after ₹75k standard deduction) has ₹0 tax due to full Section 87A rebate. If your income increases to ₹7,80,000 (just ₹5,000 extra), without relief you would pay over ₹25,000 in slab tax! Section 87A Marginal Relief steps in and strictly caps your tax liability to only the excess income earned (₹5,000 in this case)."}
                </p>
              </div>

              {/* Interactive Cliff Slider */}
              <div className="rounded-2xl border border-line bg-paper p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-ink-2">
                    {isHindi ? "मार्जिनल रिलीफ सिम्युलेटर (वेतन खिसकाएं):" : "Interactive Marginal Relief Simulator:"}
                  </span>
                  <span className="font-mono font-black text-base text-ink">
                    {formatMoney(marginalSalary, lang)}
                  </span>
                </div>
                <input
                  type="range"
                  min={700000}
                  max={850000}
                  step={5000}
                  value={marginalSalary}
                  onChange={(e) => setMarginalSalary(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-paper-2 p-3 rounded-xl border border-line">
                    <span className="text-[10px] font-mono text-ink-3 uppercase block">
                      {isHindi ? "स्लैब अनुसार टैक्स (बिना राहत)" : "Normal Slab Tax"}
                    </span>
                    <span className="font-mono font-bold text-sm text-ink">
                      {formatMoney(marginalResult.newRegime.slabTax, lang)}
                    </span>
                  </div>
                  <div className="bg-paper-2 p-3 rounded-xl border border-line">
                    <span className="text-[10px] font-mono text-ink-3 uppercase block">
                      {isHindi ? "धारा 87A राहत / छूट" : "87A Relief Credited"}
                    </span>
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      -{formatMoney(marginalResult.newRegime.rebate87A, lang)}
                    </span>
                  </div>
                  <div className="bg-paper-2 p-3 rounded-xl border border-line">
                    <span className="text-[10px] font-mono text-ink-3 uppercase block">
                      {isHindi ? "वास्तविक देय टैक्स (सुरक्षित)" : "Protected Tax Liability"}
                    </span>
                    <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                      {formatMoney(marginalResult.newRegime.totalTaxLiability, lang)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line p-4 sm:p-5 bg-paper">
          <div className="flex items-center gap-2.5 text-xs text-ink-2 flex-wrap">
            <span className="font-bold text-ink">
              {isHindi ? "लागू करने हेतु व्यवस्था:" : "Regime to Apply:"}
            </span>
            <div className="flex items-center gap-1 p-1 bg-paper-2 border border-line rounded-xl">
              <button
                type="button"
                onClick={() => setManualRegimeChoice("new")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  selectedRegimeChoice === "new"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <span>New Regime</span>
                <span className="font-mono text-[10px] opacity-90 font-normal">
                  ({newNet < 0 ? `Refund ${formatMoney(Math.abs(newNet), lang)}` : newNet > 0 ? `Due ${formatMoney(newNet, lang)}` : "₹0"})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setManualRegimeChoice("old")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  selectedRegimeChoice === "old"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <span>Old Regime</span>
                <span className="font-mono text-[10px] opacity-90 font-normal">
                  ({oldNet < 0 ? `Refund ${formatMoney(Math.abs(oldNet), lang)}` : oldNet > 0 ? `Due ${formatMoney(oldNet, lang)}` : "₹0"})
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                selectedRegimeChoice === "old"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
              }`}
            >
              <Sparkles size={14} />
              <span>
                {selectedRegimeChoice === "new"
                  ? newNet < 0
                    ? isHindi
                      ? `नई व्यवस्था लागू करें (रिफंड: ₹${formatMoney(Math.abs(newNet), lang)})`
                      : `Apply New Regime (Refund: ₹${formatMoney(Math.abs(newNet), lang)})`
                    : newNet > 0
                    ? isHindi
                      ? `नई व्यवस्था लागू करें (अतिरिक्त देय: ₹${formatMoney(newNet, lang)})`
                      : `Apply New Regime (Pay Extra: ₹${formatMoney(newNet, lang)})`
                    : isHindi
                    ? "नई व्यवस्था लागू करें (पूर्ण चुकता)"
                    : "Apply New Regime (₹0 Due)"
                  : oldNet < 0
                  ? isHindi
                    ? `पुरानी व्यवस्था लागू करें (रिफंड: ₹${formatMoney(Math.abs(oldNet), lang)})`
                    : `Apply Old Regime (Refund: ₹${formatMoney(Math.abs(oldNet), lang)})`
                  : oldNet > 0
                  ? isHindi
                    ? `पुरानी व्यवस्था लागू करें (अतिरिक्त देय: ₹${formatMoney(oldNet, lang)})`
                    : `Apply Old Regime (Pay Extra: ₹${formatMoney(oldNet, lang)})`
                  : isHindi
                  ? "पुरानी व्यवस्था लागू करें (पूर्ण चुकता)"
                  : "Apply Old Regime (₹0 Due)"}
              </span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
