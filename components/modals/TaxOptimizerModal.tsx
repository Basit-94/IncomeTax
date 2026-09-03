"use client";

import { useState, useId } from "react";
import { X, Calculator, ArrowRight, CheckCircle2, TrendingDown } from "lucide-react";
import { computeAY2026Tax } from "@/lib/taxEngineAY2026";
import { formatMoney } from "@/lib/money";
import type { Lang } from "@/lib/types";

interface TaxOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

const PRESETS = [
  { label: "₹7.5 Lakh", salary: 750000 },
  { label: "₹10 Lakh", salary: 1000000 },
  { label: "₹12.75 Lakh", salary: 1275000 },
  { label: "₹15 Lakh", salary: 1500000 },
  { label: "₹20 Lakh", salary: 2000000 },
];

export default function TaxOptimizerModal({ isOpen, onClose, lang }: TaxOptimizerModalProps) {
  const [grossSalary, setGrossSalary] = useState(1275000);
  const [section80C, setSection80C] = useState(150000);
  const [section80D, setSection80D] = useState(25000);
  const salaryId = useId();
  const c80Id = useId();
  const d80Id = useId();

  if (!isOpen) return null;

  const result = computeAY2026Tax({
    isSalaried: true,
    age: 35,
    grossSalary,
    businessIncome: 0,
    savingsInterest: 0,
    otherIncome: 0,
    tdsPaid: 0,
    advanceTaxPaid: 0,
    section80C,
    section80D,
  });

  const oldTax = result.oldRegime.totalTaxLiability;
  const newTax = result.newRegime.totalTaxLiability;
  const diff = Math.abs(oldTax - newTax);
  const isNewBetter = newTax <= oldTax;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-optimizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-2xl overflow-hidden rounded-2xl bg-paper p-6 shadow-2xl border border-line">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-money-soft text-money">
              <Calculator size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id="tax-optimizer-title" className="font-sans text-xl font-bold text-ink">
                {lang === "hi" ? "टैक्स और रिजीम ऑप्टिमाइज़र (AY 2026-27)" : "Tax & Regime Optimizer (AY 2026-27)"}
              </h2>
              <p className="text-xs text-ink-2">
                {lang === "hi"
                  ? "धारा 87A मार्जिनल रिलीफ और मानक कटौती के साथ तुरंत तुलना करें"
                  : "Instant comparison with standard deduction and Section 87A marginal relief"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-ink-3 hover:bg-paper-3 hover:text-ink transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preset Pills */}
        <div className="my-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
            {lang === "hi" ? "त्वरित चयन:" : "Quick Select:"}
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setGrossSalary(p.salary)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                grossSalary === p.salary
                  ? "bg-money text-white shadow-sm"
                  : "bg-paper-3 text-ink-2 hover:bg-paper-2 hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={salaryId} className="mb-1 block text-xs font-semibold text-ink-2">
              {lang === "hi" ? "वार्षिक वेतन (Gross Salary)" : "Gross Annual Salary"}
            </label>
            <input
              id={salaryId}
              type="number"
              value={grossSalary}
              step={25000}
              min={0}
              onChange={(e) => setGrossSalary(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm font-mono font-semibold text-ink focus:border-money"
            />
          </div>

          <div>
            <label htmlFor={c80Id} className="mb-1 block text-xs font-semibold text-ink-2">
              {lang === "hi" ? "धारा 80C छूट (EPF/PPF/LIC)" : "Section 80C (Max ₹1.5L)"}
            </label>
            <input
              id={c80Id}
              type="number"
              value={section80C}
              step={10000}
              min={0}
              max={150000}
              onChange={(e) => setSection80C(Math.min(150000, Math.max(0, Number(e.target.value) || 0)))}
              className="w-full rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm font-mono font-semibold text-ink focus:border-money"
            />
          </div>

          <div>
            <label htmlFor={d80Id} className="mb-1 block text-xs font-semibold text-ink-2">
              {lang === "hi" ? "धारा 80D (स्वास्थ्य बीमा)" : "Section 80D (Health Ins.)"}
            </label>
            <input
              id={d80Id}
              type="number"
              value={section80D}
              step={5000}
              min={0}
              max={100000}
              onChange={(e) => setSection80D(Math.min(100000, Math.max(0, Number(e.target.value) || 0)))}
              className="w-full rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm font-mono font-semibold text-ink focus:border-money"
            />
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* New Regime Card */}
          <div
            className={`rounded-xl p-4 border transition ${
              isNewBetter
                ? "border-money bg-money-soft/40 shadow-sm"
                : "border-line bg-paper-2 opacity-80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-bold text-ink">
                {lang === "hi" ? "नई कर व्यवस्था (New Regime)" : "New Regime (Default)"}
              </span>
              {isNewBetter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-money text-white px-2 py-0.5 text-[11px] font-bold">
                  <CheckCircle2 size={12} /> {lang === "hi" ? "अनुशंसित" : "Recommended"}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1 text-xs text-ink-2">
              <div className="flex justify-between">
                <span>{lang === "hi" ? "मानक कटौती:" : "Standard Deduction:"}</span>
                <span className="font-mono">₹75,000</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "hi" ? "कर योग्य आय:" : "Taxable Income:"}</span>
                <span className="font-mono">{formatMoney(result.newRegime.taxableIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "hi" ? "धारा 87A राहत:" : "87A Rebate / Relief:"}</span>
                <span className="font-mono text-money">
                  {result.newRegime.rebate87A > 0 ? `-${formatMoney(result.newRegime.rebate87A)}` : "₹0"}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-line/60 pt-2 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-ink">{lang === "hi" ? "कुल देय कर:" : "Total Tax:"}</span>
              <span className="font-mono text-xl font-bold text-ink">
                {formatMoney(result.newRegime.totalTaxLiability)}
              </span>
            </div>
          </div>

          {/* Old Regime Card */}
          <div
            className={`rounded-xl p-4 border transition ${
              !isNewBetter
                ? "border-money bg-money-soft/40 shadow-sm"
                : "border-line bg-paper-2 opacity-80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-bold text-ink">
                {lang === "hi" ? "पुरानी कर व्यवस्था (Old Regime)" : "Old Regime"}
              </span>
              {!isNewBetter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-money text-white px-2 py-0.5 text-[11px] font-bold">
                  <CheckCircle2 size={12} /> {lang === "hi" ? "अनुशंसित" : "Recommended"}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1 text-xs text-ink-2">
              <div className="flex justify-between">
                <span>{lang === "hi" ? "मानक कटौती:" : "Standard Deduction:"}</span>
                <span className="font-mono">₹50,000</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "hi" ? "80C + 80D कटौती:" : "80C + 80D Deductions:"}</span>
                <span className="font-mono">{formatMoney(section80C + section80D)}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "hi" ? "कर योग्य आय:" : "Taxable Income:"}</span>
                <span className="font-mono">{formatMoney(result.oldRegime.taxableIncome)}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-line/60 pt-2 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-ink">{lang === "hi" ? "कुल देय कर:" : "Total Tax:"}</span>
              <span className="font-mono text-xl font-bold text-ink">
                {formatMoney(result.oldRegime.totalTaxLiability)}
              </span>
            </div>
          </div>
        </div>

        {/* Savings banner */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-paper-3 p-3.5 border border-line">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <TrendingDown size={18} className="text-money" />
            <span>
              {isNewBetter
                ? `${lang === "hi" ? "नई व्यवस्था में बचत:" : "Savings with New Regime:"} ${formatMoney(diff)}`
                : `${lang === "hi" ? "पुरानी व्यवस्था में बचत:" : "Savings with Old Regime:"} ${formatMoney(diff)}`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            <span>{lang === "hi" ? "वापस जाएं" : "Done"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
