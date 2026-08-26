"use client";

import React, { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Sliders, 
  Sparkles, 
  ArrowRight,
  Printer
} from 'lucide-react';
import { useTax, TaxFact } from '../context/TaxReturnContext';
import { ItrVReceipt } from './ItrVReceipt';

interface InteractiveTaxDashboardProps {
  onLogOut?: () => void;
}

export default function InteractiveTaxDashboard({ onLogOut }: InteractiveTaxDashboardProps) {
  const { state, dispatch, computation } = useTax();
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('');
  const [showItrV, setShowItrV] = useState(false);
  const [lang, setLang] = useState<'EN' | 'HI' | 'TA'>('EN');

  const activeRegime: 'NEW' | 'OLD' = state.selectedRegime;
  const activeBreakdown = activeRegime === 'NEW' ? computation.newRegime : computation.oldRegime;
  const isRefund = activeBreakdown.netPayableOrRefund < 0;
  const absoluteRefundOrPayable = Math.abs(activeBreakdown.netPayableOrRefund);

  // Format currency in Indian standard
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const translations = {
    EN: {
      eyebrow: "MEMBER OF DIGITAL INDIA INITIATIVE",
      title: "Interactive Tax Dashboard",
      sub: "AY 2026-27 statutory ITR verification & reconciliation matrix.",
      confirm: "Confirm",
      confirmed: "Confirmed",
      flag: "Correct / Flag",
      modified: "Disputed",
      pending: "Awaiting Action",
      salary: "Gross Salary Income",
      consulting: "Freelance / Consulting",
      interest: "Savings & FD Interest",
      other: "Other Incomes / Dividend",
      tds: "Tax Deducted at Source (TDS)",
      ded80c: "Section 80C Investments",
      ded80d: "Section 80D Health Cover",
      recalc: "Save & Recalculate",
      reset: "Reset to Prefill",
      newRegime: "New Tax Regime",
      oldRegime: "Old Tax Regime",
      saves: "Saves",
      recommended: "Recommended",
      netRefund: "Net Refund Due",
      netPayable: "Net Tax Payable",
      disputeInputLabel: "Specify correct amount (₹)",
      disputeReasonLabel: "Briefly explain the reason for discrepancy",
      disputeReasonPlaceholder: "e.g., Final invoice corrected / bank ledger updated",
      officialProofBtn: "Toggle Official Acknowledgment Preview (ITR-V)",
    },
    HI: {
      eyebrow: "डिजिटल इंडिया पहल का सदस्य",
      title: "इंटरएक्टिव टैक्स डैशबोर्ड",
      sub: "निर्धारण वर्ष 2026-27 वैधानिक ITR सत्यापन और समाधान मैट्रिक्स।",
      confirm: "सत्यापित करें",
      confirmed: "सत्यापित किया गया",
      flag: "सुधार करें / फ़्लैग करें",
      modified: "विवादित",
      pending: "कार्रवाई की प्रतीक्षा",
      salary: "सकल वेतन आय",
      consulting: "फ्रीलांस / कंसल्टिंग",
      interest: "बचत और FD ब्याज",
      other: "अन्य आय / लाभांश",
      tds: "स्रोत पर कर कटौती (TDS)",
      ded80c: "धारा 80C निवेश",
      ded80d: "धारा 80D स्वास्थ्य बीमा",
      recalc: "सहेजें और पुनर्गणना करें",
      reset: "प्रीफिल पर रीसेट करें",
      newRegime: "नई कर व्यवस्था",
      oldRegime: "पुरानी कर व्यवस्था",
      saves: "बचाता है",
      recommended: "अनुशंसित",
      netRefund: "शुद्ध वापसी देय",
      netPayable: "शुद्ध कर देय",
      disputeInputLabel: "सही राशि निर्दिष्ट करें (₹)",
      disputeReasonLabel: "अंतर का कारण संक्षेप में स्पष्ट करें",
      disputeReasonPlaceholder: "उदा., अंतिम चालान में सुधार / बैंक बही अपडेट",
      officialProofBtn: "आधिकारिक पावती पूर्वावलोकन टॉगल करें (ITR-V)",
    },
    TA: {
      eyebrow: "டிஜிட்டல் இந்தியா திட்டத்தின் உறுப்பினர்",
      title: "ஊடாடும் வரி டாஷ்போர்டு",
      sub: "மதிப்பீட்டு ஆண்டு 2026-27 சட்டப்பூர்வ ITR சரிபார்ப்பு & சமரச மேட்ரிக்ஸ்.",
      confirm: "உறுதிப்படுத்துக",
      confirmed: "உறுதிப்படுத்தப்பட்டது",
      flag: "திருத்துக / கொடியிடுக",
      modified: "சர்ச்சைக்குரியது",
      pending: "செயலுக்காக காத்திருக்கிறது",
      salary: "மொத்த சம்பள வருமானம்",
      consulting: "ஃப்ரீலான்ஸ் / ஆலோசனை",
      interest: "சேமிப்பு & வைப்பு வட்டி",
      other: "இதர வருமானம் / ஈவுத்தொகை",
      tds: "மூலத்தில் வரி பிடித்தம் (TDS)",
      ded80c: "பிரிவு 80C முதலீடுகள்",
      ded80d: "பிரிவு 80D மருத்துவக் காப்பீடு",
      recalc: "சேமித்து மறுமதிப்பீடு செய்க",
      reset: "முன்பதிவுக்கு மீட்டமை",
      newRegime: "புதிய வரி முறை",
      oldRegime: "பழைய வரி முறை",
      saves: "சேமிக்கிறது",
      recommended: "பரிந்துரைக்கப்படுகிறது",
      netRefund: "நிகர பணத்தைத் திரும்பப்பெறுதல்",
      netPayable: "நிகர வரி செலுத்த வேண்டியது",
      disputeInputLabel: "சரியான தொகையைக் குறிப்பிடவும் (₹)",
      disputeReasonLabel: "முரண்பாட்டுக்கான காரணத்தை சுருக்கமாக விளக்குங்கள்",
      disputeReasonPlaceholder: "उदा., இறுதி விலைப்பட்டியல் திருத்தப்பட்டது / வங்கி லெட்ஜர் புதுப்பிக்கப்பட்டது",
      officialProofBtn: "அதிகாரப்பூர்வ ஒப்புதல் முன்னோட்டத்தை மாற்றவும் (ITR-V)",
    }
  };

  const t = translations[lang];

  // spring animations values
  const springTransition = { type: "spring" as const, stiffness: 80, damping: 15, mass: 0.6 };

  const handleConfirm = (factId: string) => {
    dispatch({ type: 'CONFIRM_FACT', factId });
  };

  const handleUpdate = (factId: string, amount: number) => {
    dispatch({ 
      type: 'UPDATE_FACT', 
      factId, 
      amount, 
      reason: disputeReason || "Discrepancy reported by taxpayer." 
    });
  };

  const handleReset = (factId: string) => {
    dispatch({ type: 'RESET_FACT', factId });
    setEditingFactId(null);
    setDisputeReason('');
  };

  // Slabs comparison to determine recommendation
  const savings = Math.abs(computation.oldRegime.totalTaxLiability - computation.newRegime.totalTaxLiability);
  const recommendedRegime = computation.newRegime.totalTaxLiability <= computation.oldRegime.totalTaxLiability ? 'NEW' : 'OLD';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-800 font-sans selection:bg-teal-500/20 antialiased">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-teal-800 uppercase block">
              {t.eyebrow}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>{t.title}</span>
              <Sparkles size={18} className="text-teal-700 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-500">{t.sub}</p>
          </div>

          {/* Language & Actions Selector */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200">
              {(['EN', 'HI', 'TA'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    lang === l ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {l === 'EN' ? 'English' : l === 'HI' ? 'हिंदी' : 'தமிழ்'}
                </button>
              ))}
            </div>

            {/* Regime Switch Toggle */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200">
              <button
                onClick={() => dispatch({ type: 'SET_REGIME', regime: 'NEW' })}
                className={`px-3.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeRegime === 'NEW' ? 'bg-teal-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{t.newRegime}</span>
                {recommendedRegime === 'NEW' && (
                  <span className="bg-emerald-500 text-[9px] text-white font-extrabold px-1 rounded uppercase tracking-wider">
                    ★
                  </span>
                )}
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_REGIME', regime: 'OLD' })}
                className={`px-3.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeRegime === 'OLD' ? 'bg-teal-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{t.oldRegime}</span>
                {recommendedRegime === 'OLD' && (
                  <span className="bg-emerald-500 text-[9px] text-white font-extrabold px-1 rounded uppercase tracking-wider">
                    ★
                  </span>
                )}
              </button>
            </div>

            {/* Log Out button */}
            {onLogOut && (
              <button
                onClick={onLogOut}
                className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Floating Top Mini Dashboard Card */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              AY 2026-27 NET OUTFLOW STATUS
            </span>
            <div className="flex items-baseline gap-2">
              <m.h2 
                key={absoluteRefundOrPayable}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springTransition}
                className={`text-4xl font-extrabold tracking-tight font-mono tabular-nums ${isRefund ? 'text-emerald-700' : 'text-amber-700'}`}
              >
                {formatINR(absoluteRefundOrPayable)}
              </m.h2>
              <span className="text-sm font-semibold text-slate-500">
                {isRefund ? t.netRefund : t.netPayable}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              PAN: <span className="font-bold text-slate-700">{state.pan}</span> | Assessee: <span className="font-bold text-slate-700">{state.fullName}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowItrV(!showItrV)}
              className="flex-1 px-5 py-3.5 bg-teal-850 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={15} />
              <span>{t.officialProofBtn}</span>
            </button>
          </div>
        </section>

        {/* View Switch for ITR-V Preview */}
        <AnimatePresence mode="wait">
          {showItrV ? (
            <m.div
              key="itr-v-preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={springTransition}
              className="space-y-4"
            >
              <div className="flex justify-end print:hidden">
                <button
                  onClick={() => setShowItrV(false)}
                  className="px-4 py-2 border border-slate-350 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  ← Back to Reconciliation Matrix
                </button>
              </div>
              <ItrVReceipt />
            </m.div>
          ) : (
            <m.div
              key="reconciliation-matrix"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Table / Grid Headers */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  FACT CONFIRMATION MATRIX
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Confirm or correct reported values below
                </span>
              </div>

              {/* Matrix List */}
              <div className="grid gap-4">
                {Object.values(state.facts).map((fact: any) => {
                  const isEditing = editingFactId === fact.id;
                  const labelKey = fact.id as keyof typeof translations.EN;
                  const localizedLabel = t[labelKey] || fact.label;

                  return (
                    <m.div
                      layout
                      key={fact.id}
                      transition={springTransition}
                      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                        fact.status === 'confirmed'
                          ? 'border-emerald-500/60 bg-emerald-50/5'
                          : fact.status === 'disputed'
                          ? 'border-amber-500/60 bg-amber-50/5'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Summary Row */}
                      <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                fact.category === 'income' 
                                  ? 'bg-teal-700' 
                                  : fact.category === 'tax_paid' 
                                  ? 'bg-indigo-600' 
                                  : 'bg-emerald-600'
                              }`} 
                            />
                            <h4 className="font-extrabold text-slate-900 text-sm">{localizedLabel}</h4>
                            <span 
                              className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                                fact.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : fact.status === 'disputed'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {fact.status === 'confirmed'
                                ? t.confirmed
                                : fact.status === 'disputed'
                                ? t.modified
                                : t.pending}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-normal max-w-xl">
                            {fact.category === 'income' 
                              ? "Self-reported or employer/bank matched income." 
                              : fact.category === 'tax_paid' 
                              ? "Tax collected by deductors and sent to department." 
                              : "Deduction claims matching statutory Section thresholds."}
                          </p>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-mono text-slate-400 block uppercase">
                              REPORTED / EFFECTIVE
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold font-mono text-slate-400 line-through">
                                {fact.status === 'disputed' ? formatINR(fact.reportedAmount) : ''}
                              </span>
                              <span className={`text-lg font-extrabold font-mono tracking-tight tabular-nums ${fact.status === 'disputed' ? 'text-amber-700' : 'text-slate-950'}`}>
                                {formatINR(fact.userAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {fact.status !== 'confirmed' && (
                              <button
                                onClick={() => handleConfirm(fact.id)}
                                className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                {t.confirm}
                              </button>
                            )}
                            
                            {fact.status !== 'disputed' && (
                              <button
                                onClick={() => {
                                  setEditingFactId(isEditing ? null : fact.id);
                                  setDisputeReason(fact.disputeReason || '');
                                }}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Sliders size={12} />
                                <span>{t.flag}</span>
                              </button>
                            )}

                            {fact.status === 'disputed' && (
                              <button
                                onClick={() => handleReset(fact.id)}
                                className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                title={t.reset}
                              >
                                <RefreshCw size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Adjuster Drawer */}
                      <AnimatePresence initial={false}>
                        {isEditing && (
                          <m.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={springTransition}
                            className="border-t border-slate-200/80 bg-slate-50/50 overflow-hidden"
                          >
                            <div className="p-5 md:p-6 space-y-4 max-w-2xl">
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    {t.disputeInputLabel}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    defaultValue={fact.userAmount}
                                    onChange={(e) => handleUpdate(fact.id, Number(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    {t.disputeReasonLabel}
                                  </label>
                                  <input
                                    type="text"
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value)}
                                    placeholder={t.disputeReasonPlaceholder}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-teal-700 focus:outline-none transition-all"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  onClick={() => handleReset(fact.id)}
                                  className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                                >
                                  {t.reset}
                                </button>
                                <button
                                  onClick={() => {
                                    handleUpdate(fact.id, fact.userAmount);
                                    setEditingFactId(null);
                                    setDisputeReason('');
                                  }}
                                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg transition"
                                >
                                  {t.recalc}
                                </button>
                              </div>
                            </div>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </m.div>
                  );
                })}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Calculation Dock */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 shadow-2xl p-4 md:p-5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-850 rounded-xl text-teal-300">
              <Coins size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
                {isRefund ? t.netRefund : t.netPayable}
              </span>
              <div className="flex items-baseline gap-1.5">
                <m.span 
                  key={absoluteRefundOrPayable}
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xl font-bold font-mono tracking-tight tabular-nums"
                >
                  {formatINR(absoluteRefundOrPayable)}
                </m.span>
                <span className="text-xs text-slate-400 font-mono">
                  {isRefund ? 'Credited to Kaveri Bank' : 'Tax Liability u/s 115BAC'}
                </span>
              </div>
            </div>
          </div>

          {/* Regime Comparative Badges */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 bg-slate-800 rounded-lg flex items-center gap-2 border border-slate-700">
                <span className="text-slate-400">{t.newRegime}:</span>
                <span className="font-bold text-white font-mono">{formatINR(computation.newRegime.totalTaxLiability)}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-800 rounded-lg flex items-center gap-2 border border-slate-700">
                <span className="text-slate-400">{t.oldRegime}:</span>
                <span className="font-bold text-white font-mono">{formatINR(computation.oldRegime.totalTaxLiability)}</span>
              </div>
            </div>

            {/* Saves Badge */}
            {savings > 0 && (
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1">
                <TrendingUp size={12} />
                <span>
                  {recommendedRegime === 'NEW' ? t.newRegime : t.oldRegime} {t.saves} {formatINR(savings)}
                </span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
