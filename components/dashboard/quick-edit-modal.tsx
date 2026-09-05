"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { X, Check } from "lucide-react";
import type { Dict } from "../../lib/i18n";
import type { Lang } from "../../lib/types";
import { formatMoney } from "../../lib/money";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";

interface QuickEditModalProps {
  isOpen: boolean;
  salary: number;
  interest: number;
  tds: number;
  onSave: (salary: number, interest: number, tds: number) => void;
  onClose: () => void;
  lang: Lang;
  t: Dict;
}

export function QuickEditModal({
  isOpen,
  salary,
  interest,
  tds,
  onSave,
  onClose,
  lang,
  t,
}: QuickEditModalProps) {
  const [localSalary, setLocalSalary] = useState(salary);
  const [localInterest, setLocalInterest] = useState(interest);
  const [localTds, setLocalTds] = useState(tds);

  // Sync with props when opened
  useEffect(() => {
    if (isOpen) {
      setLocalSalary(salary);
      setLocalInterest(interest);
      setLocalTds(tds);
    }
  }, [isOpen, salary, interest, tds]);

  // A modal that only its own X can close becomes a trap the moment anything under it
  // changes state (SS4B round 1, finding C5). Escape always works.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSalary, localInterest, localTds);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <m.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="bg-paper rounded-2xl max-w-md w-full border border-line shadow-2xl relative overflow-hidden z-10 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-ink">Quick Edit Actual Figures</h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  Update primary facts below to recalculate tax liabilities instantly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-ink-2 hover:text-ink hover:bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                  Gross Salary Income (₹)
                </label>
                <MockField>
                  <input
                  type="number"
                  value={localSalary || ""}
                  onChange={(e) => setLocalSalary(Number(e.target.value))}
                  className="w-full rounded-xl border border-line p-3 font-mono text-sm text-ink focus:border-money focus:outline-none bg-paper-2"
                  min="0"
                  placeholder="e.g. 1200000"
                />
                  <MockFill onFill={() => setLocalSalary(MOCK.annualSalary)} />
                </MockField>
                <span className="block text-[0.68rem] text-ink-3">
                  Excluding standard deduction. Prefilled from Form 16.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                  Other Interest Income (₹)
                </label>
                <MockField>
                  <input
                  type="number"
                  value={localInterest || ""}
                  onChange={(e) => setLocalInterest(Number(e.target.value))}
                  className="w-full rounded-xl border border-line p-3 font-mono text-sm text-ink focus:border-money focus:outline-none bg-paper-2"
                  min="0"
                  placeholder="e.g. 15000"
                />
                  <MockFill onFill={() => setLocalInterest(MOCK.savingsInterest)} />
                </MockField>
                <span className="block text-[0.68rem] text-ink-3">
                  Interest earned from savings & FD accounts. Prefilled from AIS.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                  TDS Credits / Tax Paid (₹)
                </label>
                <MockField>
                  <input
                  type="number"
                  value={localTds || ""}
                  onChange={(e) => setLocalTds(Number(e.target.value))}
                  className="w-full rounded-xl border border-line p-3 font-mono text-sm text-ink focus:border-money focus:outline-none bg-paper-2"
                  min="0"
                  placeholder="e.g. 66000"
                />
                  <MockFill onFill={() => setLocalTds(MOCK.tdsDeducted)} />
                </MockField>
                <span className="block text-[0.68rem] text-ink-3">
                  Total tax withheld at source. Prefilled from 26AS.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-10 px-4 rounded-xl border border-line text-sm font-semibold text-ink-2 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 px-5 rounded-xl bg-navy hover:opacity-90 text-white text-sm font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Check size={16} />
                  <span>{t.common.saveAndGoOn}</span>
                </button>
              </div>
            </form>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
