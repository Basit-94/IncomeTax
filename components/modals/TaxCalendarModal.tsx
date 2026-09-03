"use client";

import { X, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Lang } from "@/lib/types";

interface TaxCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

const DEADLINES = [
  {
    date: "15 June 2025",
    title: "1st Advance Tax Installment",
    subtitle: "At least 15% of estimated net annual tax liability",
    penalty: "Sec 234C (1% per month for deferment)",
    status: "passed",
  },
  {
    date: "15 September 2025",
    title: "2nd Advance Tax Installment",
    subtitle: "Cumulative 45% of estimated net annual tax liability",
    penalty: "Sec 234C (1% per month for deferment)",
    status: "passed",
  },
  {
    date: "15 December 2025",
    title: "3rd Advance Tax Installment",
    subtitle: "Cumulative 75% of estimated net annual tax liability",
    penalty: "Sec 234C (1% per month for deferment)",
    status: "upcoming",
  },
  {
    date: "15 March 2026",
    title: "4th Advance Tax Installment",
    subtitle: "100% of estimated net annual tax liability",
    penalty: "Sec 234B & 234C",
    status: "upcoming",
  },
  {
    date: "31 July 2026",
    title: "ITR Filing Deadline (AY 2026-27)",
    subtitle: "Non-audit salaried & individual taxpayers",
    penalty: "Sec 234A (1% per month) + Sec 234F late fee",
    status: "upcoming",
    crucial: true,
  },
  {
    date: "31 December 2026",
    title: "Belated & Revised Return Cutoff",
    subtitle: "Final statutory date to file belated ITR for AY 2026-27",
    penalty: "Cannot file after this date without condonation of delay",
    status: "upcoming",
  },
];

export default function TaxCalendarModal({ isOpen, onClose, lang }: TaxCalendarModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-calendar-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-paper p-6 shadow-2xl border border-line">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300">
              <Calendar size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id="tax-calendar-title" className="font-sans text-xl font-bold text-ink">
                {lang === "hi" ? "टैक्स कैलेंडर और वैधानिक समय सीमा" : "Statutory Tax Calendar & Deadlines"}
              </h2>
              <p className="text-xs text-ink-2">
                {lang === "hi"
                  ? "वित्तीय वर्ष 2025-26 और निर्धारण वर्ष (AY) 2026-27 की महत्वपूर्ण तिथियां"
                  : "Key statutory dates for FY 2025-26 (Assessment Year 2026-27)"}
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

        {/* Milestone List */}
        <div className="mt-5 space-y-3">
          {DEADLINES.map((d) => (
            <div
              key={d.date}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl p-3.5 border transition ${
                d.crucial
                  ? "border-money bg-money-soft/30"
                  : "border-line bg-paper-2"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-ink">{d.date}</span>
                  {d.crucial && (
                    <span className="rounded-full bg-money text-white px-2 py-0.5 text-[10px] font-bold">
                      {lang === "hi" ? "अंतिम तारीख" : "Critical Deadline"}
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm font-semibold text-ink">{d.title}</p>
                <p className="text-xs text-ink-2">{d.subtitle}</p>
              </div>

              <div className="text-start sm:text-end shrink-0 text-xs">
                <span className="flex items-center sm:justify-end gap-1 text-[11px] text-ink-3">
                  <AlertTriangle size={12} className="text-warn" /> {d.penalty}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Section 234 Rules Explanation */}
        <div className="mt-6 rounded-xl bg-paper-3 p-4 border border-line space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Clock size={15} className="text-blue" />
            <span>{lang === "hi" ? "ब्याज और दंड नियम (Sections 234A, 234B, 234C):" : "Interest Penalty Provisions:"}</span>
          </div>
          <ul className="text-xs text-ink-2 space-y-1 list-disc pl-4">
            <li><strong>234A:</strong> 1% per month for delay in filing return beyond July 31.</li>
            <li><strong>234B:</strong> 1% per month if advance tax paid is less than 90% of total tax liability.</li>
            <li><strong>234C:</strong> 1% per month on deferment of individual advance tax installments.</li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            {lang === "hi" ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
