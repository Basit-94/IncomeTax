"use client";

import React, { useState, useMemo, useId } from "react";
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  Calculator,
  ShieldCheck,
  Printer,
  FileText,
  ExternalLink,
  Info,
} from "lucide-react";
import type { Lang } from "@/lib/types";
import { formatMoney } from "@/lib/money";

interface TaxCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

type TaxpayerCategory = "all" | "salaried" | "business" | "senior";

interface DeadlineItem {
  id: string;
  dateStr: string;
  targetDate: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  penaltyEn: string;
  penaltyHi: string;
  category: "all" | "salaried" | "business";
  isCrucial?: boolean;
}

const STATUTORY_DEADLINES: DeadlineItem[] = [
  {
    id: "adv-tax-q1",
    dateStr: "15 June 2025",
    targetDate: "2025-06-15",
    titleEn: "1st Advance Tax Installment (15%)",
    titleHi: "प्रथम अग्रिम कर किस्त (15%)",
    subtitleEn: "At least 15% of estimated net annual tax liability",
    subtitleHi: "वार्षिक कर देयता का कम से कम 15%",
    penaltyEn: "Sec 234C (1% per month for deferment)",
    penaltyHi: "धारा 234C (विलंब पर 1% प्रति माह ब्याज)",
    category: "all",
  },
  {
    id: "adv-tax-q2",
    dateStr: "15 September 2025",
    targetDate: "2025-09-15",
    titleEn: "2nd Advance Tax Installment (45%)",
    titleHi: "द्वितीय अग्रिम कर किस्त (संचयी 45%)",
    subtitleEn: "Cumulative 45% of estimated annual tax liability",
    subtitleHi: "वार्षिक कर देयता का संचयी 45%",
    penaltyEn: "Sec 234C (1% per month for deferment)",
    penaltyHi: "धारा 234C (विलंब पर 1% प्रति माह ब्याज)",
    category: "all",
  },
  {
    id: "adv-tax-q3",
    dateStr: "15 December 2025",
    targetDate: "2025-12-15",
    titleEn: "3rd Advance Tax Installment (75%)",
    titleHi: "तृतीय अग्रिम कर किस्त (संचयी 75%)",
    subtitleEn: "Cumulative 75% of estimated annual tax liability",
    subtitleHi: "वार्षिक कर देयता का संचयी 75%",
    penaltyEn: "Sec 234C (1% per month for deferment)",
    penaltyHi: "धारा 234C (विलंब पर 1% प्रति माह ब्याज)",
    category: "all",
  },
  {
    id: "adv-tax-q4",
    dateStr: "15 March 2026",
    targetDate: "2026-03-15",
    titleEn: "4th Advance Tax Installment (100%)",
    titleHi: "अंतिम अग्रिम कर किस्त (100%)",
    subtitleEn: "100% of estimated annual tax liability",
    subtitleHi: "कुल वार्षिक कर देयता का 100% पूर्ण भुगतान",
    penaltyEn: "Sec 234B & 234C interest provisions",
    penaltyHi: "धारा 234B और 234C के तहत ब्याज देय",
    category: "all",
  },
  {
    id: "presumptive-44ad",
    dateStr: "15 March 2026",
    targetDate: "2026-03-15",
    titleEn: "Presumptive Taxpayers (Sec 44AD / 44ADA)",
    titleHi: "अनुमानित करदाता (धारा 44AD/44ADA)",
    subtitleEn: "Single 100% installment for small businesses & professionals",
    subtitleHi: "छोटे व्यवसायों और पेशेवरों के लिए एकमुश्त 100% भुगतान",
    penaltyEn: "Sec 234C (1% per month past March 15)",
    penaltyHi: "धारा 234C (15 मार्च के बाद 1% प्रति माह)",
    category: "business",
  },
  {
    id: "itr-non-audit",
    dateStr: "31 July 2026",
    targetDate: "2026-07-31",
    titleEn: "ITR Filing Deadline (AY 2026-27)",
    titleHi: "आयकर रिटर्न दाखिल करने की अंतिम तिथि",
    subtitleEn: "Non-audit salaried individuals, HUFs, and professionals (ITR-1 / ITR-2)",
    subtitleHi: "गैर-लेखापरीक्षा वेतनभोगी करदाता एवं व्यक्ति (ITR-1 / ITR-2)",
    penaltyEn: "Sec 234A (1%/mo) + Sec 234F (₹5,000 late fee)",
    penaltyHi: "धारा 234A (1%/माह) + धारा 234F (₹5,000 विलंब शुल्क)",
    category: "salaried",
    isCrucial: true,
  },
  {
    id: "tax-audit-cutoff",
    dateStr: "31 October 2026",
    targetDate: "2026-10-31",
    titleEn: "Tax Audit Return Cutoff",
    titleHi: "कर लेखापरीक्षा रिटर्न की अंतिम तिथि",
    subtitleEn: "Corporate and individual accounts requiring statutory audit u/s 44AB",
    subtitleHi: "धारा 44AB के तहत अनिवार्य ऑडिट वाले व्यवसाय",
    penaltyEn: "Sec 271B penalty (0.5% of turnover up to ₹1.5L)",
    penaltyHi: "धारा 271B दंड (टर्नओवर का 0.5% अधिकतम ₹1.5 लाख)",
    category: "business",
  },
  {
    id: "belated-revised",
    dateStr: "31 December 2026",
    targetDate: "2026-12-31",
    titleEn: "Belated & Revised Return Final Cutoff",
    titleHi: "विलंबित एवं संशोधित रिटर्न की अंतिम वैधानिक तिथि",
    subtitleEn: "Final statutory date to submit ITR for AY 2026-27 u/s 139(4) & 139(5)",
    subtitleHi: "धारा 139(4) व 139(5) के तहत रिटर्न दाखिल करने का अंतिम अवसर",
    penaltyEn: "Cannot file return after this date without Sec 119(2)(b) condonation",
    penaltyHi: "इसके बाद बिना धारा 119(2)(b) माफी के रिटर्न दाखिल नहीं हो सकता",
    category: "all",
  },
];

export default function TaxCalendarModal({ isOpen, onClose, lang }: TaxCalendarModalProps) {
  const isHindi = lang === "hi";

  // Tab State: "calendar" | "penalty_calc" | "exemptions"
  const [activeTab, setActiveTab] = useState<"calendar" | "penalty_calc" | "exemptions">("calendar");

  // Category filter
  const [category, setCategory] = useState<TaxpayerCategory>("all");

  // Section 234 Interactive Penalty Estimator State
  const [unpaidTaxAmount, setUnpaidTaxAmount] = useState<number>(50000);
  const [monthsLate, setMonthsLate] = useState<number>(3);
  const [annualIncome, setAnnualIncome] = useState<number>(1200000);

  const unpaidTaxId = useId();

  // Calculate Section 234 penalties
  const sec234AInterest = useMemo(() => {
    return Math.round(unpaidTaxAmount * 0.01 * monthsLate);
  }, [unpaidTaxAmount, monthsLate]);

  const sec234FLateFee = useMemo(() => {
    if (monthsLate <= 0) return 0;
    return annualIncome <= 500000 ? 1000 : 5000;
  }, [monthsLate, annualIncome]);

  const totalPenalCost = sec234AInterest + sec234FLateFee;

  if (!isOpen) return null;

  // Filter deadlines based on selected category
  const filteredDeadlines = STATUTORY_DEADLINES.filter((d) => {
    if (category === "all") return true;
    if (category === "senior") return d.category === "salaried" || d.id === "itr-non-audit" || d.id === "belated-revised";
    if (category === "salaried") return d.category === "all" || d.category === "salaried";
    if (category === "business") return d.category === "all" || d.category === "business";
    return true;
  });

  const handlePrintPdfCalendar = () => {
    window.print();
  };

  const handleOpenGoogleCalendar = () => {
    const title = encodeURIComponent("Income Tax Return Deadline (AY 2026-27)");
    const details = encodeURIComponent("Statutory deadline to file ITR-1 / ITR-2 for non-audit individual taxpayers without penalty u/s 234F.");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20260731T090000Z/20260731T180000Z&details=${details}&location=e-Filing+Portal`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-calendar-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-paper shadow-2xl border border-line overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex items-start justify-between border-b border-line p-5 sm:px-6 sm:py-4 bg-paper-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs">
              <Calendar size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tax-calendar-title" className="font-sans text-lg sm:text-xl font-black text-ink">
                  {isHindi ? "टैक्स कैलेंडर और वैधानिक समय सीमा" : "Statutory Tax Calendar & Deadlines"}
                </h2>
                <span className="hidden sm:inline-flex rounded-full bg-purple-100 dark:bg-purple-950/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  AY 2026-27
                </span>
              </div>
              <p className="text-xs text-ink-2">
                {isHindi
                  ? "अग्रिम कर की किस्तों, 31 जुलाई समय सीमा और धारा 234 ब्याज दंडों का समयबद्ध केंद्र।"
                  : "Advance tax installments, statutory cutoffs & Section 234 penal interest radar."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isHindi ? "संवाद बंद करें" : "Close dialog"}
            className="rounded-xl p-2 text-ink-3 hover:bg-paper-3 hover:text-ink transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION                                                            */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex items-center border-b border-line bg-paper px-6 pt-2 gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "calendar"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Calendar size={15} />
            <span>{isHindi ? "1. वैधानिक समय सीमा और कैलेंडर" : "1. Statutory Milestones"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("penalty_calc")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "penalty_calc"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Calculator size={15} />
            <span>{isHindi ? "2. धारा 234 दंड एवं ब्याज गणक" : "2. Sec 234 Penalty Calculator"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("exemptions")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "exemptions"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <ShieldCheck size={15} />
            <span>{isHindi ? "3. वरिष्ठ नागरिक छूट व धारा 207" : "3. Senior Citizens & Sec 207"}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB BODY (SCROLLABLE)                                                     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ======================================================================= */}
          {/* TAB 1: STATUTORY CALENDAR                                               */}
          {/* ======================================================================= */}
          {activeTab === "calendar" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Critical Countdown Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-purple-200">
                      Primary Filing Cutoff
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black">
                    31 July 2026 — Non-Audit ITR-1 / ITR-2 Deadline
                  </h3>
                  <p className="text-xs text-purple-200 max-w-xl">
                    Filing on or before July 31 avoids mandatory Section 234F late fees (₹5,000) and preserves the right to carry forward losses.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handlePrintPdfCalendar}
                    className="px-3.5 py-2 rounded-xl bg-white text-purple-900 hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Printer size={14} />
                    <span>{isHindi ? "पीडीएफ प्रिंट करें" : "Print / PDF Schedule"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenGoogleCalendar}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Google Calendar</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-ink-3 mr-1 flex items-center gap-1 font-semibold">
                    <Filter size={13} /> {isHindi ? "श्रेणी अनुसार देखें:" : "Filter for:"}
                  </span>
                  {(
                    [
                      { id: "all", labelEn: "All Taxpayers", labelHi: "सभी करदाता" },
                      { id: "salaried", labelEn: "Salaried (ITR-1/2)", labelHi: "वेतनभोगी" },
                      { id: "business", labelEn: "Business / 44AD", labelHi: "व्यवसाय / पेशेवर" },
                      { id: "senior", labelEn: "Senior Citizen (60+)", labelHi: "वरिष्ठ नागरिक" },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        category === cat.id
                          ? "bg-purple-600 text-white border-purple-600 font-bold"
                          : "bg-paper-2 border-line text-ink-2 hover:text-ink"
                      }`}
                    >
                      {isHindi ? cat.labelHi : cat.labelEn}
                    </button>
                  ))}
                </div>

                <span className="text-ink-3 font-mono text-[11px]">
                  {filteredDeadlines.length} Milestones
                </span>
              </div>

              {/* Milestones Timeline Grid */}
              <div className="space-y-3">
                {filteredDeadlines.map((d) => (
                  <div
                    key={d.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-4 border transition ${
                      d.isCrucial
                        ? "border-purple-600 bg-purple-50/30 dark:bg-purple-950/20 shadow-xs ring-1 ring-purple-600"
                        : "border-line bg-paper-2"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink">{d.dateStr}</span>
                        {d.isCrucial && (
                          <span className="rounded-full bg-purple-600 text-white px-2.5 py-0.5 text-[10px] font-bold">
                            {isHindi ? "अंतिम तारीख" : "Statutory Due Date"}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-ink">{isHindi ? d.titleHi : d.titleEn}</h4>
                      <p className="text-xs text-ink-2">{isHindi ? d.subtitleHi : d.subtitleEn}</p>
                    </div>

                    <div className="text-start sm:text-end shrink-0 text-xs">
                      <span className="flex items-center sm:justify-end gap-1 text-[11px] text-ink-3 font-mono">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                        <span>{isHindi ? d.penaltyHi : d.penaltyEn}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: INTERACTIVE SECTION 234 CALCULATOR                               */}
          {/* ======================================================================= */}
          {activeTab === "penalty_calc" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-line bg-paper-2 p-5 space-y-2">
                <span className="font-bold text-sm text-ink flex items-center gap-2">
                  <Calculator size={18} className="text-purple-600" />
                  <span>{isHindi ? "धारा 234 ब्याज एवं विलंब शुल्क सिम्युलेटर:" : "Section 234 Interest & Penalty Estimator:"}</span>
                </span>
                <p className="text-xs text-ink-2 leading-relaxed">
                  Calculate exact statutory penalties incurred if a return is submitted after July 31, 2026 or advance tax is underpaid.
                </p>
              </div>

              {/* Sliders & Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="space-y-2">
                  <label htmlFor={unpaidTaxId} className="font-bold text-ink block">
                    {isHindi ? "बकाया कर राशि (Unpaid Net Tax):" : "Estimated Outstanding Tax Due:"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-ink-3 font-bold">₹</span>
                    <input
                      id={unpaidTaxId}
                      type="number"
                      step={5000}
                      value={unpaidTaxAmount}
                      onChange={(e) => setUnpaidTaxAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-8 pr-4 py-2.5 font-mono text-sm font-bold rounded-xl border border-line bg-paper text-ink focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-ink block">
                    {isHindi ? "फाइलिंग में विलंब (Months of Delay Past July 31):" : "Months of Delay Past July 31:"}
                  </label>
                  <select
                    value={monthsLate}
                    onChange={(e) => setMonthsLate(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 font-semibold text-xs rounded-xl border border-line bg-paper text-ink focus:border-purple-600 focus:outline-none"
                  >
                    <option value={0}>On Time (Filing by July 31) — ₹0 Penalty</option>
                    <option value={1}>1 Month Delay (Filed in August)</option>
                    <option value={2}>2 Months Delay (Filed in September)</option>
                    <option value={3}>3 Months Delay (Filed in October)</option>
                    <option value={4}>4 Months Delay (Filed in November)</option>
                    <option value={5}>5 Months Delay (Filed by Dec 31 Cutoff)</option>
                  </select>
                </div>
              </div>

              {/* Penalty Output Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-line bg-paper space-y-1">
                  <span className="text-[10px] font-mono uppercase text-ink-3 block">Section 234A Interest</span>
                  <span className="font-mono text-lg font-black text-rose-600">
                    {formatMoney(sec234AInterest, lang)}
                  </span>
                  <span className="text-[10px] text-ink-2 block">1% per month on unpaid tax</span>
                </div>

                <div className="p-4 rounded-2xl border border-line bg-paper space-y-1">
                  <span className="text-[10px] font-mono uppercase text-ink-3 block">Section 234F Late Fee</span>
                  <span className="font-mono text-lg font-black text-amber-600">
                    {formatMoney(sec234FLateFee, lang)}
                  </span>
                  <span className="text-[10px] text-ink-2 block">Mandatory statutory fee</span>
                </div>

                <div className="p-4 rounded-2xl border-2 border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-700 dark:text-purple-300 block">
                    Total Avoidable Penal Cost
                  </span>
                  <span className="font-mono text-xl font-black text-purple-700 dark:text-purple-300">
                    {formatMoney(totalPenalCost, lang)}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-semibold">
                    Saved by filing before July 31!
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: SENIOR CITIZENS & EXEMPTIONS                                     */}
          {/* ======================================================================= */}
          {activeTab === "exemptions" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 text-xs">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-ink">
                    {isHindi ? "धारा 207 — वरिष्ठ नागरिकों को अग्रिम कर से पूर्ण छूट" : "Section 207 — Full Advance Tax Exemption for Senior Citizens"}
                  </h4>
                  <p className="text-ink-2 leading-relaxed">
                    {isHindi
                      ? "यदि किसी निवासी भारतीय नागरिक की आयु 60 वर्ष या उससे अधिक है और उनकी व्यवसाय या पेशे से कोई आय (PGBP) नहीं है, तो उन्हें वित्तीय वर्ष के दौरान कोई भी अग्रिम कर जमा करने की आवश्यकता नहीं है। वे 31 जुलाई तक एकमुश्त स्व-निर्धारण कर भर सकते हैं।"
                      : "A resident individual who is 60 years or older and does not have any income chargeable under the head 'Profits and Gains of Business or Profession' (PGBP) is 100% exempt from paying advance tax during the financial year."}
                  </p>
                </div>
              </div>

              {/* Section 119(2)(b) Condonation Procedure */}
              <div className="rounded-2xl border border-line bg-paper-2 p-5 space-y-3 text-xs">
                <h4 className="font-bold text-ink flex items-center gap-2">
                  <Info size={16} className="text-blue-600" />
                  <span>{isHindi ? "धारा 119(2)(b) विलंब माफी याचिका (Condonation of Delay):" : "Section 119(2)(b) Condonation of Delay Procedure:"}</span>
                </h4>
                <p className="text-ink-2 leading-relaxed">
                  {isHindi
                    ? "यदि कोई करदाता 31 दिसंबर की अंतिम तिथि के बाद भी वास्तविक कठिनाई (बीमारी, कानूनी विवाद) के कारण रिटर्न दाखिल नहीं कर सका, तो वह धारा 119(2)(b) के तहत प्रधान मुख्य आयकर आयुक्त (Pr. CCIT) के समक्ष विलंब माफी की याचिका प्रस्तुत कर सकता है।"
                    : "If a taxpayer misses the December 31 belated filing cutoff due to genuine hardship (prolonged illness, hospitalization), they can petition the Principal Chief Commissioner of Income Tax u/s 119(2)(b) for condonation of delay."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FIXED FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line p-4 sm:p-5 bg-paper">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <Calendar size={15} className="text-purple-600" />
            <span>
              {isHindi
                ? "निर्धारण वर्ष 2026-27 के लिए सीबीडीटी वैधानिक तिथियां"
                : "CBDT Statutory Schedule for Assessment Year 2026-27"}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintPdfCalendar}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>{isHindi ? "प्रिंट / पीडीएफ सेव करें" : "Print / Save PDF"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/25 transition cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
