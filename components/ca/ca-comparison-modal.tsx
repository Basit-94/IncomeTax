"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  FileText,
  ArrowRight,
  Sparkles,
  Info,
  Award,
  Download,
  AlertCircle,
} from "lucide-react";
import type { Persona, Lang } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { computeForPersona } from "@/lib/return/compute";
import { acceptCAReview, type CAReviewRecord } from "@/lib/ca/ca-store";

interface CAComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CAReviewRecord;
  lang?: Lang;
  onAdopt: (newPersona: Persona, newRegime: "new" | "old") => void;
}

export default function CAComparisonModal({
  isOpen,
  onClose,
  record,
  lang = "en",
  onAdopt,
}: CAComparisonModalProps) {
  const [isAdopting, setIsAdopting] = useState(false);

  if (!isOpen || !record) return null;

  const originalPersona = record.originalPersona;
  const caPersona = record.caPersona || record.originalPersona;
  const originalRegime = record.originalRegime || "new";
  const caRegime = record.caRegime || originalRegime;

  const originalB = computeForPersona(originalPersona, originalRegime);
  const caB = computeForPersona(caPersona, caRegime);

  // Financial Delta (positive = citizen benefits)
  const refundDelta = caB.refundOrDue - originalB.refundOrDue;

  const handleAdopt = async () => {
    setIsAdopting(true);
    try {
      await acceptCAReview(record.code);
      onAdopt(caPersona, caRegime);
      onClose();
    } catch {
      // Adopt locally regardless
      onAdopt(caPersona, caRegime);
      onClose();
    } finally {
      setIsAdopting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-paper border border-line rounded-3xl shadow-glass overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r px-6 py-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-bg border border-money/40 text-money">
                <Award size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold tracking-tight">CA Audit Reconciliation</h3>
                  <span className="px-2 py-0.5 rounded-md bg-ok-soft text-ok text-[10px] font-bold uppercase tracking-wider border border-ok/40">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-money/80 mt-0.5">
                  Reviewed by {record.caDetails?.name || "Chartered Accountant"}{" "}
                  {record.caDetails?.membershipNo && `(ICAI Mem: ${record.caDetails.membershipNo})`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Benefit Banner */}
          {refundDelta > 0 ? (
            <div className="p-4 bg-ok-soft border border-ok/40 rounded-2xl flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-ok text-white shrink-0 shadow-xs">
                <TrendingUp size={22} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-ok-ink uppercase tracking-wider block">
                  Taxpayer Value Unlocked
                </span>
                <p className="text-sm text-ink font-semibold mt-0.5">
                  CA recommendations unlock an additional{" "}
                  <strong className="text-ok-ink font-mono text-base">
                    +{formatMoney(refundDelta, lang)}
                  </strong>{" "}
                  in net refund / reduced tax liability.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-paper-2 border border-line rounded-2xl flex items-center gap-3">
              <Info size={18} className="text-ink-3 shrink-0" />
              <p className="text-xs text-ink-2">
                The Chartered Accountant has validated your figures against official AIS/TIS standards and verified compliance.
              </p>
            </div>
          )}

          {/* CA Advisory Notes Card */}
          {record.caNotes && (
            <div className="p-4 bg-amber-bg border border-money/40 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-ink">
                <FileText size={14} />
                <span>CA Professional Advisory & Audit Remarks</span>
              </div>
              <p className="text-xs text-ink leading-relaxed font-sans whitespace-pre-wrap bg-paper/60 p-3 rounded-xl border border-line/60">
                &ldquo;{record.caNotes}&rdquo;
              </p>
            </div>
          )}

          {/* Side-by-Side Comparison Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 font-mono">
              Return Comparison Matrix
            </h4>
            <div className="border border-line rounded-2xl overflow-hidden bg-paper">
              <table className="w-full text-xs text-left">
                <thead className="bg-paper-2 border-b border-line font-bold text-ink-2">
                  <tr>
                    <th className="p-3">Fact / Computation Item</th>
                    <th className="p-3 text-right">Original Draft</th>
                    <th className="p-3 text-right text-money bg-amber-bg">
                      CA Version
                    </th>
                    <th className="p-3 text-right">Tax Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono">
                  <tr>
                    <td className="p-3 font-sans font-medium text-ink">Gross Total Income</td>
                    <td className="p-3 text-right text-ink-2">
                      {formatMoney(originalB.grossIncome, lang)}
                    </td>
                    <td className="p-3 text-right font-bold text-ink bg-amber-bg">
                      {formatMoney(caB.grossIncome, lang)}
                    </td>
                    <td className="p-3 text-right text-ink-3 font-sans">
                      {caB.grossIncome === originalB.grossIncome ? "Unchanged" : "Adjusted"}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-ink">Deductions (Chapter VI-A)</td>
                    <td className="p-3 text-right text-ink-2">
                      {formatMoney(originalB.totalDeductions, lang)}
                    </td>
                    <td className="p-3 text-right font-bold text-ok-ink bg-amber-bg">
                      {formatMoney(caB.totalDeductions, lang)}
                    </td>
                    <td className="p-3 text-right font-sans">
                      {caB.totalDeductions > originalB.totalDeductions ? (
                        <span className="text-ok-ink font-bold">
                          +{formatMoney(caB.totalDeductions - originalB.totalDeductions, lang)}
                        </span>
                      ) : (
                        <span className="text-ink-3">Unchanged</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-ink">Taxable Income</td>
                    <td className="p-3 text-right text-ink-2">
                      {formatMoney(originalB.taxableIncome, lang)}
                    </td>
                    <td className="p-3 text-right font-bold text-ink bg-amber-bg">
                      {formatMoney(caB.taxableIncome, lang)}
                    </td>
                    <td className="p-3 text-right font-sans text-ink-3">
                      {originalB.taxableIncome - caB.taxableIncome > 0
                        ? `-${formatMoney(originalB.taxableIncome - caB.taxableIncome, lang)}`
                        : "Same"}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-ink">Recommended Tax Regime</td>
                    <td className="p-3 text-right font-sans font-semibold text-ink-2">
                      {originalRegime === "new" ? "New Regime" : "Old Regime"}
                    </td>
                    <td className="p-3 text-right font-sans font-bold text-money bg-amber-bg">
                      {caRegime === "new" ? "New Regime" : "Old Regime"}
                    </td>
                    <td className="p-3 text-right font-sans text-ink-3">
                      {caRegime !== originalRegime ? "Switched" : "Matched"}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-ink">Gross Tax Liability</td>
                    <td className="p-3 text-right text-ink-2">
                      {formatMoney(originalB.totalTax, lang)}
                    </td>
                    <td className="p-3 text-right font-bold text-ink bg-amber-bg">
                      {formatMoney(caB.totalTax, lang)}
                    </td>
                    <td className="p-3 text-right font-sans">
                      {originalB.totalTax - caB.totalTax > 0 ? (
                        <span className="text-ok-ink font-bold">
                          Saved {formatMoney(originalB.totalTax - caB.totalTax, lang)}
                        </span>
                      ) : (
                        <span className="text-ink-3">Same</span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-paper-2 font-bold text-sm">
                    <td className="p-3 font-sans text-ink">Net Refund / (Tax Payable)</td>
                    <td
                      className={`p-3 text-right ${
 originalB.refundOrDue >= 0 ?"text-money" : "text-alarm"
                      }`}
                    >
                      {originalB.refundOrDue >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(originalB.refundOrDue), lang)}
                    </td>
                    <td
                      className={`p-3 text-right bg-amber-bg ${
 caB.refundOrDue >= 0 ?"text-money" : "text-alarm"
                      }`}
                    >
                      {caB.refundOrDue >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(caB.refundOrDue), lang)}
                    </td>
                    <td className="p-3 text-right">
                      {refundDelta > 0 ? (
                        <span className="text-ok-ink font-extrabold text-xs">
                          +{formatMoney(refundDelta, lang)} Gain
                        </span>
                      ) : (
                        <span className="text-ink-3 text-xs">Verified</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-line bg-paper-2 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-line rounded-xl text-ink-2 hover:text-ink hover:bg-paper text-xs font-bold transition cursor-pointer"
          >
            Keep My Original Draft
          </button>
          <button
            type="button"
            onClick={handleAdopt}
            disabled={isAdopting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 ink-surface hover:ink-surface text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            <Sparkles size={15} />
            <span>Adopt CA Recommendations & Proceed to File</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
