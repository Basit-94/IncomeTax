"use client";

/**
 * The reconciliation surface: every AIS/26AS row, confirmed or disputed, with the
 * return recomputing under both regimes as you go.
 *
 * WHAT CHANGED HERE (2026-09-02), and why each change was necessary rather than
 * cosmetic:
 *
 *  1. The dispute input was uncontrolled (`defaultValue` + an `onChange` that
 *     dispatched on every keystroke). Typing "50000" dispatched five times, and
 *     the first of those — the single digit 5 — went onto the undo stack as a
 *     committed dispute. "Save & Recalculate" then re-sent the value the store
 *     already held, so the button did nothing at all. It is now a controlled
 *     draft that commits once, on save.
 *
 *  2. A dispute now requires a CBDT feedback code. The department cannot act on
 *     "the number is wrong" — it needs to know whether the row is exempt, wrongly
 *     attributed, denied, or just misstated, because that decides who gets asked
 *     to fix it. A free-text reason alone was not a dispute the portal could file.
 *
 *  3. Statuses are compared in upper case, matching the reducer. The old code
 *     tested `=== 'confirmed'` against a store that stored `'CONFIRMED'`, so no
 *     row ever rendered as confirmed.
 *
 *  4. When the return computes to a balance payable the dock CTA becomes Challan
 *     280 rather than "Continue to File" — filing with tax outstanding is
 *     defective u/s 139(9), so the journey must not offer that route.
 *
 * Currency is never printed raw: <Rupees> is the only formatter, and it carries
 * `font-mono tabular-nums` so figures do not shift width as they animate.
 */

import React, { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import {
  Coins,
  FileText,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Banknote,
  CheckCheck,
} from "lucide-react";
import {
  useTax,
  AIS_FEEDBACK_LABELS,
  AIS_FEEDBACK_HELP,
  DISPUTE_FEEDBACK_CODES,
} from "../context/TaxReturnContext";
import type { AISFeedbackCode, FactId, TaxFact } from "../context/TaxReturnContext";
import { ItrVReceipt } from "./ItrVReceipt";
import { AuditRiskRadar } from "./AuditRiskRadar";
import { DefectiveNoticeCard } from "./DefectiveNoticeCard";
import { PdfIngestionDropzone } from "./PdfIngestionDropzone";
import { Challan280Modal } from "./Challan280Modal";
import { Rupees } from "./Rupees";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";
import { LogoLink } from "./brand/logo";

interface InteractiveTaxDashboardProps {
  onLogOut?: () => void;
}

type Lang = "EN" | "HI" | "TA";

/** The draft a citizen is composing in an open dispute drawer, before they save. */
interface DisputeDraft {
  amount: string;
  feedbackCode: AISFeedbackCode;
  reason: string;
}

interface Dictionary {
  eyebrow: string;
  title: string;
  sub: string;
  confirm: string;
  confirmed: string;
  flag: string;
  modified: string;
  pending: string;
  recalc: string;
  reset: string;
  newRegime: string;
  oldRegime: string;
  saves: string;
  recommended: string;
  netRefund: string;
  netPayable: string;
  disputeInputLabel: string;
  disputeCodeLabel: string;
  disputeReasonLabel: string;
  disputeReasonPlaceholder: string;
  officialProofBtn: string;
  undo: string;
  payNow: string;
  continueToFile: string;
  reportedByDept: string;
  yourFigure: string;
  progress: string;
  /** Row labels, keyed by fact id. Any id absent falls back to the store label. */
  labels: Partial<Record<FactId, string>>;
}

const TRANSLATIONS: Record<Lang, Dictionary> = {
  EN: {
    eyebrow: "INDEPENDENT PROTOTYPE — NOT A GOVERNMENT SITE",
    title: "Reconciliation matrix",
    sub: "AY 2026-27 · confirm what is right, correct what is not. Every change recomputes the return.",
    confirm: "Yes, this is right",
    confirmed: "Confirmed",
    flag: "No, this is wrong",
    modified: "Disputed",
    pending: "Awaiting your answer",
    recalc: "Save and recalculate",
    reset: "Reset to reported",
    newRegime: "New regime",
    oldRegime: "Old regime",
    saves: "saves",
    recommended: "Recommended",
    netRefund: "Net refund due",
    netPayable: "Net tax payable",
    disputeInputLabel: "The correct amount (₹)",
    disputeCodeLabel: "What is wrong with this entry?",
    disputeReasonLabel: "Anything you want on the record",
    disputeReasonPlaceholder: "e.g. final invoice was revised down in March",
    officialProofBtn: "Acknowledgement preview (ITR-V)",
    undo: "Undo",
    payNow: "Pay outstanding tax (Challan 280)",
    continueToFile: "Continue to file",
    reportedByDept: "Reported",
    yourFigure: "You declare",
    progress: "rows answered",
    labels: {},
  },
  HI: {
    eyebrow: "स्वतंत्र प्रोटोटाइप — सरकारी साइट नहीं",
    title: "समाधान मैट्रिक्स",
    sub: "निर्धारण वर्ष 2026-27 · जो सही है उसकी पुष्टि करें, जो नहीं है उसे सुधारें। हर बदलाव पर गणना दोबारा होती है।",
    confirm: "हाँ, यह सही है",
    confirmed: "सत्यापित",
    flag: "नहीं, यह गलत है",
    modified: "विवादित",
    pending: "आपके उत्तर की प्रतीक्षा",
    recalc: "सहेजें और पुनर्गणना करें",
    reset: "रिपोर्ट किए गए मान पर लौटें",
    newRegime: "नई कर व्यवस्था",
    oldRegime: "पुरानी कर व्यवस्था",
    saves: "बचाता है",
    recommended: "अनुशंसित",
    netRefund: "शुद्ध वापसी देय",
    netPayable: "शुद्ध कर देय",
    disputeInputLabel: "सही राशि (₹)",
    disputeCodeLabel: "इस प्रविष्टि में क्या गलत है?",
    disputeReasonLabel: "रिकॉर्ड के लिए कोई टिप्पणी",
    disputeReasonPlaceholder: "उदा. मार्च में अंतिम चालान संशोधित हुआ",
    officialProofBtn: "पावती पूर्वावलोकन (ITR-V)",
    undo: "पूर्ववत करें",
    payNow: "बकाया कर का भुगतान करें (चालान 280)",
    continueToFile: "दाखिल करना जारी रखें",
    reportedByDept: "रिपोर्ट किया गया",
    yourFigure: "आपकी घोषणा",
    progress: "पंक्तियाँ उत्तरित",
    labels: {
      salary: "सकल वेतन आय",
      consulting: "फ्रीलांस / कंसल्टिंग प्राप्तियाँ",
      savings_interest: "बचत और सावधि जमा ब्याज",
      dividend: "प्राप्त लाभांश",
      capital_gains: "दीर्घकालिक पूंजीगत लाभ — सूचीबद्ध इक्विटी",
      rental: "गृह संपत्ति से किराया",
      tds_salary: "नियोक्ता द्वारा टीडीएस (धारा 192)",
      tds_bank: "बैंक द्वारा टीडीएस (धारा 194A)",
      tds_other: "अन्य द्वारा टीडीएस",
      advance_tax: "अग्रिम कर भुगतान",
      sec_80c: "धारा 80C निवेश",
      sec_80d: "धारा 80D स्वास्थ्य बीमा",
      sec_80ccd2: "धारा 80CCD(2) — नियोक्ता एनपीएस अंशदान",
    },
  },
  TA: {
    eyebrow: "சுயாதீன முன்மாதிரி — அரசு தளம் அல்ல",
    title: "சமரச மேட்ரிக்ஸ்",
    sub: "மதிப்பீட்டு ஆண்டு 2026-27 · சரியானதை உறுதிப்படுத்துங்கள், தவறானதைத் திருத்துங்கள். ஒவ்வொரு மாற்றமும் மறுகணக்கிடப்படும்.",
    confirm: "ஆம், இது சரி",
    confirmed: "உறுதிப்படுத்தப்பட்டது",
    flag: "இல்லை, இது தவறு",
    modified: "சர்ச்சைக்குரியது",
    pending: "உங்கள் பதிலுக்காக காத்திருக்கிறது",
    recalc: "சேமித்து மறுகணக்கிடுக",
    reset: "அறிவிக்கப்பட்ட தொகைக்கு மீட்டமை",
    newRegime: "புதிய வரி முறை",
    oldRegime: "பழைய வரி முறை",
    saves: "சேமிக்கிறது",
    recommended: "பரிந்துரைக்கப்படுகிறது",
    netRefund: "நிகர வரி திரும்பப்பெறுதல்",
    netPayable: "நிகர வரி செலுத்த வேண்டியது",
    disputeInputLabel: "சரியான தொகை (₹)",
    disputeCodeLabel: "இந்தப் பதிவில் என்ன தவறு?",
    disputeReasonLabel: "பதிவுக்காக ஏதேனும் குறிப்பு",
    disputeReasonPlaceholder: "எ.கா. மார்ச்சில் இறுதி விலைப்பட்டியல் திருத்தப்பட்டது",
    officialProofBtn: "ஒப்புகைச் சான்று முன்னோட்டம் (ITR-V)",
    undo: "செயல்தவிர்",
    payNow: "நிலுவை வரியைச் செலுத்துக (சலான் 280)",
    continueToFile: "தாக்கல் செய்யத் தொடரவும்",
    reportedByDept: "அறிவிக்கப்பட்டது",
    yourFigure: "நீங்கள் அறிவிப்பது",
    progress: "வரிசைகள் பதிலளிக்கப்பட்டன",
    labels: {
      salary: "மொத்த சம்பள வருமானம்",
      consulting: "ஃப்ரீலான்ஸ் / ஆலோசனை வருவாய்",
      savings_interest: "சேமிப்பு மற்றும் வைப்பு வட்டி",
      dividend: "பெறப்பட்ட ஈவுத்தொகை",
      capital_gains: "நீண்டகால மூலதன ஆதாயம் — பட்டியலிடப்பட்ட ஈக்விட்டி",
      rental: "வீட்டுச் சொத்திலிருந்து வாடகை",
      tds_salary: "முதலாளியின் TDS (பிரிவு 192)",
      tds_bank: "வங்கியின் TDS (பிரிவு 194A)",
      tds_other: "பிறரின் TDS",
      advance_tax: "முன்கூட்டியே செலுத்திய வரி",
      sec_80c: "பிரிவு 80C முதலீடுகள்",
      sec_80d: "பிரிவு 80D மருத்துவக் காப்பீடு",
      sec_80ccd2: "பிரிவு 80CCD(2) — முதலாளியின் NPS பங்களிப்பு",
    },
  },
};

const springTransition = { type: "spring" as const, stiffness: 80, damping: 15, mass: 0.6 };

const CATEGORY_BLURB: Record<TaxFact["category"], string> = {
  income: "Reported to the department by a third party. You are answering whether it is right.",
  tax_paid: "Tax already collected on your behalf and credited against this return.",
  deduction: "A claim you are making. The new regime allows only 80CCD(2) of these.",
};

export default function InteractiveTaxDashboard({ onLogOut }: InteractiveTaxDashboardProps) {
  const {
    state,
    dispatch,
    computation,
    active,
    netPayable,
    netRefund,
    isPayable,
    progress,
    canUndo,
  } = useTax();

  const [editingFactId, setEditingFactId] = useState<FactId | null>(null);
  const [draft, setDraft] = useState<DisputeDraft>({
    amount: "",
    feedbackCode: "CODE_3",
    reason: "",
  });
  const [showItrV, setShowItrV] = useState(false);
  const [challanOpen, setChallanOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("EN");

  const t = TRANSLATIONS[lang];
  const activeRegime = state.selectedRegime;

  // Which regime to recommend, and by how much. Compared on total liability
  // rather than net position, because TDS is identical under both.
  const savings = Math.abs(
    computation.oldRegime.totalTaxLiability - computation.newRegime.totalTaxLiability,
  );
  const recommendedRegime =
    computation.newRegime.totalTaxLiability <= computation.oldRegime.totalTaxLiability
      ? "NEW"
      : "OLD";

  const openDispute = (fact: TaxFact): void => {
    setEditingFactId(fact.id);
    setDraft({
      // Seeded with what the citizen already declared, not the reported figure —
      // reopening a dispute should show the position they took, not undo it.
      amount: String(fact.declaredAmount),
      feedbackCode: fact.feedbackCode && fact.feedbackCode !== "CODE_1"
        ? fact.feedbackCode
        : "CODE_3",
      reason: fact.disputeReason ?? "",
    });
  };

  const closeDrawer = (): void => {
    setEditingFactId(null);
    setDraft({ amount: "", feedbackCode: "CODE_3", reason: "" });
  };

  const commitDispute = (factId: FactId): void => {
    const parsed = Number(draft.amount);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    dispatch({
      type: "DISPUTE_FACT",
      factId,
      declaredAmount: parsed,
      feedbackCode: draft.feedbackCode,
      disputeReason: draft.reason.trim() || undefined,
    });
    closeDrawer();
  };

  const handleReset = (factId: FactId): void => {
    dispatch({ type: "RESET_FACT", factId });
    closeDrawer();
  };

  const facts: TaxFact[] = Object.values(state.facts);
  const answered = progress.confirmed + progress.disputed;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-800 font-sans selection:bg-teal-500/20 antialiased">
      {/* Sticky top header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <LogoLink size="sm" className="mb-1" />
            <span className="text-[10px] font-bold tracking-widest text-teal-800 uppercase block">
              {t.eyebrow}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>{t.title}</span>
              <Sparkles size={18} className="text-teal-700" />
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">{t.sub}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* T0.4 house rule: language is a dropdown, never a slider. This view
                carries only the three translated dictionaries it ships with. */}
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="EN">English</option>
              <option value="HI">{"हिन्दी"}</option>
              <option value="TA">{"தமிழ்"}</option>
            </select>

            <div className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200">
              {(["NEW", "OLD"] as const).map((regime) => (
                <button
                  key={regime}
                  onClick={() => dispatch({ type: "SET_REGIME", regime })}
                  className={`px-3.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeRegime === regime
                      ? "bg-teal-800 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>{regime === "NEW" ? t.newRegime : t.oldRegime}</span>
                  {recommendedRegime === regime && (
                    <span
                      title={t.recommended}
                      className="bg-emerald-500 text-[9px] text-white font-extrabold px-1 rounded uppercase tracking-wider"
                    >
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Undo is 25 levels deep and covers every committed action, including
                the s.139(9) auto-reconcile. A one-click change to what gets filed
                has to be a one-click change back. */}
            <button
              onClick={() => dispatch({ type: "UNDO_LAST_ACTION" })}
              disabled={!canUndo}
              className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition cursor-pointer inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={12} /> {t.undo}
            </button>

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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Net position. `layout` on the figure so it eases between states
            instead of snapping when a dispute changes the total. */}
        <m.section
          layout
          transition={springTransition}
          className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden"
        >
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              AY 2026-27 · net position
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <m.div
                layout
                key={isPayable ? "payable" : "refund"}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springTransition}
              >
                <Rupees
                  value={isPayable ? netPayable : netRefund}
                  className={`text-4xl font-extrabold tracking-tight ${
                    isPayable ? "text-amber-700" : "text-emerald-700"
                  }`}
                />
              </m.div>
              <span className="text-sm font-semibold text-slate-500">
                {isPayable ? t.netPayable : t.netRefund}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              PAN: <span className="font-bold text-slate-700">{state.pan}</span> · Assessee:{" "}
              <span className="font-bold text-slate-700">{state.name}</span> ·{" "}
              <span className="font-bold text-slate-700 tabular-nums">
                {answered}/{progress.total}
              </span>{" "}
              {t.progress}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowItrV((v) => !v)}
              className="flex-1 px-5 py-3.5 bg-teal-850 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={15} />
              <span>{t.officialProofBtn}</span>
            </button>
          </div>
        </m.section>

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
                  ← Back to the reconciliation matrix
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
              {/* The s.139(9) notice renders only when declared income is short of
                  what the reporters filed; otherwise it returns null. */}
              <DefectiveNoticeCard />

              <AuditRiskRadar />

              <PdfIngestionDropzone />

              <div className="flex items-center justify-between px-2 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Fact confirmation matrix
                </h3>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {progress.confirmed} confirmed · {progress.disputed} disputed ·{" "}
                  {progress.pending} pending
                </span>
              </div>

              <div className="grid gap-4">
                {facts.map((fact) => {
                  const isEditing = editingFactId === fact.id;
                  const localizedLabel = t.labels[fact.id] ?? fact.label;
                  const isConfirmed = fact.status === "CONFIRMED";
                  const isDisputed = fact.status === "DISPUTED";

                  return (
                    <m.div
                      layout
                      key={fact.id}
                      transition={springTransition}
                      className={`bg-white rounded-2xl border transition-colors duration-200 overflow-hidden shadow-xs ${
                        isConfirmed
                          ? "border-emerald-500/60"
                          : isDisputed
                            ? "border-amber-500/60"
                            : "border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <m.div
                        layout
                        className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                fact.category === "income"
                                  ? "bg-teal-700"
                                  : fact.category === "tax_paid"
                                    ? "bg-indigo-600"
                                    : "bg-emerald-600"
                              }`}
                            />
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {localizedLabel}
                            </h4>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                                isConfirmed
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : isDisputed
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {isConfirmed ? t.confirmed : isDisputed ? t.modified : t.pending}
                            </span>
                            {fact.statement && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 uppercase">
                                {fact.statement}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 leading-normal max-w-xl">
                            {CATEGORY_BLURB[fact.category]}
                            {fact.reportedBy && fact.reportedBy !== "—" && (
                              <>
                                {" "}
                                Reported by{" "}
                                <span className="font-semibold text-slate-700">
                                  {fact.reportedBy}
                                </span>
                                .
                              </>
                            )}
                          </p>

                          {isDisputed && fact.feedbackCode && (
                            <p className="text-[11px] text-amber-800">
                              <span className="font-bold">{fact.feedbackCode}</span> —{" "}
                              {AIS_FEEDBACK_LABELS[fact.feedbackCode]}
                              {fact.disputeReason ? ` · ${fact.disputeReason}` : ""}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-mono text-slate-400 block uppercase">
                              {t.reportedByDept} / {t.yourFigure}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap md:justify-end">
                              {fact.declaredAmount !== fact.reportedAmount && (
                                <Rupees
                                  value={fact.reportedAmount}
                                  strike
                                  className="text-xs font-semibold text-slate-400"
                                />
                              )}
                              <Rupees
                                value={fact.declaredAmount}
                                className={`text-lg font-extrabold tracking-tight ${
                                  isDisputed ? "text-amber-700" : "text-slate-950"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!isConfirmed && (
                              <button
                                onClick={() =>
                                  dispatch({ type: "CONFIRM_FACT", factId: fact.id })
                                }
                                className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                {t.confirm}
                              </button>
                            )}

                            <button
                              onClick={() => (isEditing ? closeDrawer() : openDispute(fact))}
                              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Sliders size={12} />
                              <span>{t.flag}</span>
                            </button>

                            {(isDisputed || isConfirmed) && (
                              <button
                                onClick={() => handleReset(fact.id)}
                                className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                title={t.reset}
                                aria-label={t.reset}
                              >
                                <RefreshCw size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </m.div>

                      {/* Dispute drawer. `layout` on the card above means the rows
                          below slide rather than jump when this opens. */}
                      <AnimatePresence initial={false}>
                        {isEditing && (
                          <m.div
                            key="drawer"
                            layout
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={springTransition}
                            className="border-t border-slate-200/80 bg-slate-50/60 overflow-hidden"
                          >
                            <div className="p-5 md:p-6 space-y-4 max-w-3xl">
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label
                                    htmlFor={`amount-${fact.id}`}
                                    className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block"
                                  >
                                    {t.disputeInputLabel}
                                  </label>
                                  <input
                                    id={`amount-${fact.id}`}
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={draft.amount}
                                    onChange={(e) =>
                                      setDraft((d) => ({ ...d, amount: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-sm font-mono tabular-nums font-semibold text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none transition-all"
                                  />
                                  <p className="text-[11px] text-slate-500">
                                    Nothing is committed until you save. The department
                                    keeps <Rupees value={fact.reportedAmount} /> on its side
                                    of the row either way.
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <label
                                    htmlFor={`code-${fact.id}`}
                                    className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block"
                                  >
                                    {t.disputeCodeLabel}
                                  </label>
                                  <select
                                    id={`code-${fact.id}`}
                                    value={draft.feedbackCode}
                                    onChange={(e) =>
                                      setDraft((d) => ({
                                        ...d,
                                        feedbackCode: e.target.value as AISFeedbackCode,
                                      }))
                                    }
                                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none transition-all cursor-pointer"
                                  >
                                    {DISPUTE_FEEDBACK_CODES.map((code) => (
                                      <option key={code} value={code}>
                                        {code} — {AIS_FEEDBACK_LABELS[code]}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-[11px] text-slate-500">
                                    {AIS_FEEDBACK_HELP[draft.feedbackCode]}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label
                                  htmlFor={`reason-${fact.id}`}
                                  className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block"
                                >
                                  {t.disputeReasonLabel}
                                </label>
                                <MockField>
                                  <input
                                    id={`reason-${fact.id}`}
                                    type="text"
                                    value={draft.reason}
                                    onChange={(e) =>
                                      setDraft((d) => ({ ...d, reason: e.target.value }))
                                    }
                                    placeholder={t.disputeReasonPlaceholder}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-teal-700 focus:outline-none transition-all"
                                  />
                                  <MockFill
                                    onFill={() =>
                                      setDraft((d) => ({ ...d, reason: MOCK.disputeReason }))
                                    }
                                  />
                                </MockField>
                              </div>

                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  onClick={closeDrawer}
                                  className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReset(fact.id)}
                                  className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                >
                                  {t.reset}
                                </button>
                                <button
                                  onClick={() => commitDispute(fact.id)}
                                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
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

      {/* Calculation dock */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 shadow-2xl p-4 md:p-5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-850 rounded-xl text-teal-300">
              <Coins size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
                {isPayable ? t.netPayable : t.netRefund}
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <m.div layout transition={springTransition}>
                  <Rupees
                    value={isPayable ? netPayable : netRefund}
                    className="text-xl font-bold tracking-tight"
                  />
                </m.div>
                <span className="text-xs text-slate-400 font-mono">
                  {isPayable
                    ? "outstanding u/s 140A"
                    : active.totalTaxesPaid > 0
                      ? "credit against taxes already paid"
                      : "nothing due either way"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 bg-slate-800 rounded-lg flex items-center gap-2 border border-slate-700">
                <span className="text-slate-400">{t.newRegime}:</span>
                <Rupees
                  value={computation.newRegime.totalTaxLiability}
                  className="font-bold text-white"
                />
              </div>
              <div className="px-3 py-1.5 bg-slate-800 rounded-lg flex items-center gap-2 border border-slate-700">
                <span className="text-slate-400">{t.oldRegime}:</span>
                <Rupees
                  value={computation.oldRegime.totalTaxLiability}
                  className="font-bold text-white"
                />
              </div>
            </div>

            {savings > 0 && (
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1">
                <TrendingUp size={12} />
                <span>
                  {recommendedRegime === "NEW" ? t.newRegime : t.oldRegime} {t.saves}{" "}
                  <Rupees value={savings} />
                </span>
              </div>
            )}

            {/*
              The CTA is the rule, not a label. A return filed with tax
              outstanding is defective u/s 139(9), so while the net position is
              payable the only route forward is the challan.
            */}
            <AnimatePresence mode="wait" initial={false}>
              {isPayable ? (
                <m.button
                  key="pay"
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={springTransition}
                  onClick={() => setChallanOpen(true)}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition cursor-pointer inline-flex items-center gap-2"
                >
                  <Banknote size={14} />
                  {t.payNow}
                </m.button>
              ) : (
                <m.button
                  key="file"
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={springTransition}
                  onClick={() => setShowItrV(true)}
                  className="px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer inline-flex items-center gap-2"
                >
                  {answered === progress.total ? (
                    <CheckCheck size={14} />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                  {t.continueToFile}
                </m.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </footer>

      <Challan280Modal open={challanOpen} onClose={() => setChallanOpen(false)} />
    </div>
  );
}
