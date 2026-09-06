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
  FileText,
  RefreshCw,
  RotateCcw,
  Sliders,
  ArrowRight,
  Banknote,
  ShieldCheck,
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
import CitizenVaultModal from "./vault/citizen-vault-modal";
import { getSeededVaultForPersona, type CitizenVaultUser } from "@/lib/vault/vault-store";
import { PERSONAS } from "@/lib/personas";
import { Rupees } from "./Rupees";
import { AnimatedAmount } from "./ui/animated-amount";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";
import { LogoLink } from "./brand/logo";
import { MunshiAvatar } from "./brand/munshi";

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
  /**
   * Shown when the net position is exactly zero — which is what a cleared
   * Challan 280 produces. Neither "payable" nor "refund due" is true there, and
   * "refund due ₹0" reads as a promise of money that is not coming.
   */
  netSettled: string;
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
    netSettled: "Nothing further to pay",
    disputeInputLabel: "The correct amount (₹)",
    disputeCodeLabel: "What is wrong with this entry? ",
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
    netSettled: "अब कुछ भी देय नहीं",
    disputeInputLabel: "सही राशि (₹)",
    disputeCodeLabel: "इस प्रविष्टि में क्या गलत है? ",
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
    netSettled: "இனி செலுத்த வேண்டியது இல்லை",
    disputeInputLabel: "சரியான தொகை (₹)",
    disputeCodeLabel: "இந்தப் பதிவில் என்ன தவறு? ",
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
    netPayable,
    netRefund,
    isPayable,
    isSettled,
    selfAssessmentPaid,
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
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultUser, setVaultUser] = useState<CitizenVaultUser>(() => getSeededVaultForPersona(PERSONAS.priya));
  const [lang, setLang] = useState<Lang>("EN");

  const t = TRANSLATIONS[lang];
  const activeRegime = state.selectedRegime;

  /**
   * Three positions, not two. A cleared challan lands the return on exactly nil,
   * and describing that as a refund due of ₹0 tells the citizen money is coming
   * back when none is. Derived once so the summary card, the dock and the
   * data-position test hook can never disagree with each other.
   */
  const positionKey = isPayable ? "payable" : isSettled ? "settled" : "refund";
  const positionLabel = isPayable
    ? t.netPayable
    : isSettled
      ? t.netSettled
      : t.netRefund;

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
    <div className="min-h-screen pb-16 text-ink font-sans selection:bg-amber-bg antialiased">
      {/* Sticky top header */}
      <header className="sticky top-0 z-40 bg-paper/80 backdrop-blur-md border-b border-glass-edge px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <MunshiAvatar size={44} className="shrink-0 mt-1" />
            <div className="space-y-1">
              <LogoLink size="sm" className="mb-1" />
              <span className="text-[10px] font-bold tracking-widest text-money uppercase block">
                {t.eyebrow}
              </span>
              <h1 className="text-[30px] leading-tight font-extrabold tracking-tight text-ink">{t.title}</h1>
              <p className="text-sm text-ink-2 max-w-xl">{t.sub}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* T0.4 house rule: language is a dropdown, never a slider. This view
                carries only the three translated dictionaries it ships with. */}
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="glass-flat rounded-[12px] px-2.5 py-1.5 text-xs font-bold text-ink cursor-pointer"
            >
              <option value="EN">English</option>
              <option value="HI">{"हिन्दी"}</option>
              <option value="TA">{"தமிழ்"}</option>
            </select>

            <div className="glass-flat p-0.5 rounded-[12px] flex">
              {(["NEW", "OLD"] as const).map((regime) => (
                <button
                  key={regime}
                  onClick={() => dispatch({ type: "SET_REGIME", regime })}
                  className={`px-3.5 py-1 text-xs font-bold rounded-[10px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeRegime === regime ? "ink-surface text-white" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  <span>{regime === "NEW" ? t.newRegime : t.oldRegime}</span>
                  {recommendedRegime === regime && (
                    <span
                      title={t.recommended}
                      className="bg-ok text-[9px] text-white font-extrabold px-1 rounded uppercase tracking-wider"
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
              className="px-3 py-1.5 border border-glass-edge bg-white/55 dark:bg-white/10 text-ink hover:border-money/50 text-xs font-bold rounded-[12px] transition cursor-pointer inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={12} /> {t.undo}
            </button>

            <button
              onClick={() => setIsVaultOpen(true)}
              className="px-3 py-1.5 border border-glass-edge bg-white/55 dark:bg-white/10 text-ink hover:border-money/50 text-xs font-bold rounded-[12px] transition cursor-pointer inline-flex items-center gap-1.5"
              title="Encrypted Tax Vault"
            >
              <ShieldCheck size={14} className="text-amber-ink" />
              <span>Tax Vault</span>
            </button>

            {onLogOut && (
              <button
                onClick={onLogOut}
                className="px-3.5 py-1.5 bg-bad-soft border border-bad/40 text-bad hover:opacity-90 text-xs font-bold rounded-[12px] transition cursor-pointer"
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
          data-testid="net-position"
          data-position={positionKey}
          transition={springTransition}
          className="glass rounded-[24px] p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden"
        >
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-ink-3 uppercase font-mono">
              AY 2026-27 · net position
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              {/* No key on this element and no opacity-gated enter: the figure
                  must render at its final value whether or not a frame loop is
                  running. AnimatedAmount springs the digits between values — a
                  ₹18,280 due that becomes an ₹84,040 refund rolls through the
                  numbers rather than snapping, and the colour flips with the
                  position. */}
              <m.div layout transition={springTransition}>
                <AnimatedAmount
                  value={isPayable ? netPayable : netRefund}
                  className={`text-4xl font-extrabold ${
 isPayable
 ? "text-amber-ink"
                      : isSettled
                        ? "text-ink-2"
                        : "text-ok-ink"
                  }`}
                />
              </m.div>
              <span className="text-sm font-semibold text-ink-3">{positionLabel}</span>
            </div>
            <p className="text-xs text-ink-3 font-mono">
              PAN: <span className="font-bold text-ink-2">{state.pan}</span> · Assessee:{" "}
              <span className="font-bold text-ink-2">{state.name}</span> ·{" "}
              <span className="font-bold text-ink-2 tabular-nums">
                {answered}/{progress.total}
              </span>{" "}
              {t.progress}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowItrV((v) => !v)}
              className="flex-1 px-5 py-3.5 ink-surface hover:opacity-90 text-white rounded-[14px] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={15} />
              <span>{t.officialProofBtn}</span>
            </button>
          </div>
        </m.section>

        {/*
          A plain conditional, not AnimatePresence. This swap decides whether the
          whole return is on screen, and `mode="wait"` makes that decision wait on
          an exit animation: the outgoing branch stays mounted until its exit
          completes, so anything that stops the frame loop — a tab opened in the
          background, a throttled client, a motion feature bundle that fails to
          load under LazyMotion — leaves the incoming branch unmounted and the
          outgoing one pinned at `opacity: 0`. That is a blank tax return with no
          way out of it. Both branches now render at their final values and the
          crossfade is gone; whether a citizen can see their own figures must not
          depend on an animation finishing.
        */}
        {showItrV ? (
          <m.div key="itr-v-preview" layout transition={springTransition} className="space-y-4">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => setShowItrV(false)}
                className="px-4 py-2 border border-glass-edge bg-white/55 dark:bg-white/10 text-ink hover:border-money/50 text-xs font-bold rounded-[12px] transition cursor-pointer"
              >
                ← Back to the reconciliation matrix
              </button>
            </div>
            <ItrVReceipt />
          </m.div>
        ) : (
          <m.div
            key="reconciliation-matrix"
            layout
            transition={springTransition}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
              <div className="space-y-5 min-w-0">
                {/* The s.139(9) notice renders only when declared income is short of
                    what the reporters filed; otherwise it returns null. */}
                <DefectiveNoticeCard />

                <AuditRiskRadar />

                <PdfIngestionDropzone />

                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-ink-3 uppercase tracking-wider">Fact confirmation matrix</h3>
                  <span className="text-xs text-ink-3 font-mono tabular-nums">
                    {progress.confirmed} confirmed · {progress.disputed} disputed · {progress.pending} pending
                  </span>
                </div>

                <div className="grid gap-3">
                  {facts.map((fact) => {
                    const isEditing = editingFactId === fact.id;
                    const localizedLabel = t.labels[fact.id] ?? fact.label;
                    const isConfirmed = fact.status === "CONFIRMED";
                    const isDisputed = fact.status === "DISPUTED";
                    const source =
                      [fact.statement, fact.reportedBy && fact.reportedBy !== "—" ? fact.reportedBy : null]
                        .filter(Boolean)
                        .join(" · ") || CATEGORY_BLURB[fact.category];

                    return (
                      <m.div
                        layout
                        key={fact.id}
                        data-fact-id={fact.id}
                        data-fact-status={fact.status}
                        transition={springTransition}
                        className={`rounded-[18px] border transition-colors duration-200 overflow-hidden ${
                          isConfirmed ? "bg-ok-soft border-ok/30" : isDisputed ? "bg-warn-soft border-warn/30" : "glass"
                        }`}
                      >
                        <m.div
                          layout
                          className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr_auto] gap-3.5 md:items-center px-[18px] py-[14px]"
                        >
                          <div className="min-w-0">
                            <h4 className="text-[14px] font-bold text-ink">{localizedLabel}</h4>
                            <p className="text-[10.5px] text-ink-3 mt-0.5">{source}</p>
                            {isDisputed && fact.feedbackCode && (
                              <p className="text-[11px] text-warn mt-1">
                                <span className="font-bold">{fact.feedbackCode}</span> —{" "}
                                {AIS_FEEDBACK_LABELS[fact.feedbackCode]}
                                {fact.disputeReason ? ` · ${fact.disputeReason}` : ""}
                              </p>
                            )}
                          </div>

                          <div>
                            <span className="block text-[12px] font-bold text-ink-3">{t.reportedByDept}</span>
                            <Rupees value={fact.reportedAmount} className="text-[15px] font-extrabold text-ink" />
                          </div>

                          <div>
                            <span className="block text-[12px] font-bold text-ink-3">{t.yourFigure}</span>
                            <Rupees
                              value={fact.declaredAmount}
                              className={`text-[15px] font-extrabold ${isDisputed ? "text-warn" : "text-ink"}`}
                            />
                          </div>

                          <div className="flex items-center gap-2 md:justify-end flex-wrap">
                            {isConfirmed || isDisputed ? (
                              <span
                                className={`inline-flex items-center h-[30px] px-3 rounded-full text-[12px] font-bold text-white ${
                                  isConfirmed ? "bg-ok" : "bg-warn"
                                }`}
                              >
                                {isConfirmed ? `✓ ${t.confirmed}` : `✎ ${t.modified}`}
                              </span>
                            ) : (
                              <button
                                data-action="confirm"
                                onClick={() => dispatch({ type: "CONFIRM_FACT", factId: fact.id })}
                                className="h-[34px] px-3.5 ink-surface hover:opacity-90 text-white text-[12.5px] font-bold rounded-[12px] transition cursor-pointer"
                              >
                                {t.confirm}
                              </button>
                            )}

                            <button
                              data-action="dispute"
                              onClick={() => (isEditing ? closeDrawer() : openDispute(fact))}
                              className="h-[34px] px-3 rounded-[12px] border border-glass-edge bg-white/55 dark:bg-white/10 text-ink hover:border-money/50 text-[12.5px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <Sliders size={12} />
                              <span>{t.flag}</span>
                            </button>

                            {(isDisputed || isConfirmed) && (
                              <button
                                onClick={() => handleReset(fact.id)}
                                className="h-[34px] w-[34px] grid place-items-center rounded-[12px] border border-glass-edge bg-white/55 dark:bg-white/10 text-ink-2 hover:text-ink transition cursor-pointer"
                                title={t.reset}
                                aria-label={t.reset}
                              >
                                <RefreshCw size={12} />
                              </button>
                            )}
                          </div>
                        </m.div>

                        {/* Dispute drawer, attached to the row. `layout` on the card above means
                            the rows below slide rather than jump when this opens. */}
                        <AnimatePresence initial={false}>
                          {isEditing && (
                            <m.div
                              key="drawer"
                              layout
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={springTransition}
                              className="border-t border-glass-edge bg-white/70 dark:bg-white/[0.06] overflow-hidden"
                            >
                              <div className="px-[18px] py-4 space-y-3">
                                <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_1.2fr_auto] md:items-end">
                                  <div className="space-y-1">
                                    <label
                                      htmlFor={`amount-${fact.id}`}
                                      className="text-[11px] font-bold text-ink-3 block"
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
                                      className="w-full h-10 px-3.5 bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge rounded-[14px] text-sm font-mono tabular-nums font-bold text-ink focus:ring-2 focus:ring-money/40 focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label
                                      htmlFor={`code-${fact.id}`}
                                      className="text-[11px] font-bold text-ink-3 block"
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
                                      className="w-full h-10 px-3.5 bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge rounded-[14px] text-sm font-semibold text-ink focus:ring-2 focus:ring-money/40 focus:outline-none cursor-pointer"
                                    >
                                      {DISPUTE_FEEDBACK_CODES.map((code) => (
                                        <option key={code} value={code}>
                                          {code} — {AIS_FEEDBACK_LABELS[code]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label
                                      htmlFor={`reason-${fact.id}`}
                                      className="text-[11px] font-bold text-ink-3 block"
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
                                        className="w-full h-10 px-3.5 bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge rounded-[14px] text-sm text-ink focus:ring-2 focus:ring-money/40 focus:outline-none"
                                      />
                                      <MockFill
                                        onFill={() =>
                                          setDraft((d) => ({ ...d, reason: MOCK.disputeReason }))
                                        }
                                      />
                                    </MockField>
                                  </div>

                                  <button
                                    data-action="save-dispute"
                                    onClick={() => commitDispute(fact.id)}
                                    className="h-10 px-4 ink-surface hover:opacity-90 text-white text-[12.5px] font-bold rounded-[14px] transition cursor-pointer whitespace-nowrap"
                                  >
                                    {t.recalc}
                                  </button>
                                </div>

                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <p className="text-[11px] text-ink-3 max-w-xl">
                                    {AIS_FEEDBACK_HELP[draft.feedbackCode]} Nothing is committed until you save;
                                    the department keeps <Rupees value={fact.reportedAmount} /> on its side either way.
                                  </p>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={closeDrawer}
                                      className="px-3 py-1.5 text-xs font-semibold text-ink-3 hover:text-ink transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleReset(fact.id)}
                                      className="px-3 py-1.5 text-xs font-semibold text-ink-3 hover:text-ink transition cursor-pointer"
                                    >
                                      {t.reset}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>
                      </m.div>
                    );
                  })}
                </div>
              </div>

              {/* Live rail */}
              <aside className="space-y-4 lg:sticky lg:top-[140px]">
                <div className="ink-surface rounded-[24px] p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-soft">Live · both regimes</span>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {(["NEW", "OLD"] as const).map((regime) => {
                      const tile = regime === "NEW" ? computation.newRegime : computation.oldRegime;
                      const best = recommendedRegime === regime;
                      return (
                        <button
                          key={regime}
                          type="button"
                          onClick={() => dispatch({ type: "SET_REGIME", regime })}
                          aria-pressed={activeRegime === regime}
                          className={`text-start rounded-[14px] p-3 border transition cursor-pointer ${
                            best ? "border-money bg-white/[0.16]" : "border-white/10 bg-white/[0.08] hover:bg-white/[0.12]"
                          } ${activeRegime === regime ? "ring-2 ring-money/60" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-1 min-h-5">
                            <span className="text-[11.5px] font-bold">{regime === "NEW" ? t.newRegime : t.oldRegime}</span>
                            {best && savings > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-bg text-amber-ink text-[10px] font-extrabold whitespace-nowrap">
                                {t.saves} <Rupees value={savings} />
                              </span>
                            )}
                          </div>
                          <Rupees value={tile.totalTaxLiability} className="mt-1 block text-[20px] font-extrabold" />
                          <span className="text-[10.5px] text-white/60">total tax</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] font-bold text-white/80">
                      {positionLabel} ({activeRegime === "NEW" ? t.newRegime : t.oldRegime})
                    </span>
                    <m.div layout transition={springTransition}>
                      <AnimatedAmount
                        value={isPayable ? netPayable : netRefund}
                        className="text-[24px] font-extrabold text-[#5EE6B0]"
                      />
                    </m.div>
                  </div>

                  {/*
                    The CTA is the rule, not a label. A return filed with tax outstanding is
                    defective u/s 139(9), so while the net position is payable the only route
                    forward is the challan. A plain conditional, never AnimatePresence: which
                    action is offered is a statutory question and must not wait on an exit
                    animation that a background tab or reduced-motion client may never run.
                  */}
                  {isPayable ? (
                    <button
                      key="pay"
                      onClick={() => setChallanOpen(true)}
                      className="btn-primary mt-4 w-full h-11 rounded-[14px] text-[14px] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Banknote size={14} />
                      {t.payNow}
                    </button>
                  ) : (
                    <button
                      key="file"
                      onClick={() => setShowItrV(true)}
                      className="btn-primary mt-4 w-full h-11 rounded-[14px] text-[14px] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {t.continueToFile}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                <div className="glass rounded-[24px] p-5">
                  <h4 className="text-[15px] font-extrabold text-ink">Progress</h4>
                  <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-ink-2/15">
                    <div className="bg-ok" style={{ width: `${(progress.confirmed / Math.max(progress.total, 1)) * 100}%` }} />
                    <div className="bg-warn" style={{ width: `${(progress.disputed / Math.max(progress.total, 1)) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-[12.5px] text-ink-2">
                    {progress.confirmed} confirmed · {progress.disputed} disputed · {progress.pending} pending. Every row
                    must be answered before filing.
                  </p>
                </div>

                <div className="glass rounded-[24px] p-5 flex gap-3">
                  <MunshiAvatar size={36} className="shrink-0" />
                  <p className="text-[13px] text-ink-2">
                    <span className="font-bold text-ink">Munshi ji:</span> “{t.flag}” doesn&apos;t fight the department — it
                    tells them which of four things is wrong, so the right party fixes it.
                  </p>
                </div>
              </aside>
            </div>
          </m.div>
        )}
      </main>

      <Challan280Modal open={challanOpen} onClose={() => setChallanOpen(false)} />
      <CitizenVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        vaultUser={vaultUser}
        onUpdateUser={setVaultUser}
        lang={lang.toLowerCase()}
      />
    </div>
  );
}
