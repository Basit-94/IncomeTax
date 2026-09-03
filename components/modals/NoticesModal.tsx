"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import {
  X,
  ShieldAlert,
  AlertOctagon,
  Scale,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  Volume2,
  VolumeX,
  Search,
  Check,
  ChevronRight,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Download,
  Building,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import type { Lang, Notice } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { PERSONAS } from "@/lib/personas";

export interface NoticeItemDisplay {
  id: string;
  din: string;
  section: "139(9)" | "143(1)(a)" | "148A" | "245";
  titleEn: string;
  titleHi: string;
  issuedOn: string;
  deadlineDays: number;
  daysRemaining: number;
  taxDemand: number;
  taxpayerName: string;
  pan: string;
  issueSummaryEn: string;
  issueSummaryHi: string;
  suggestedActionEn: string;
  suggestedActionHi: string;
  recommendedDraftEn: string;
  recommendedDraftHi: string;
  isDemoCase?: boolean;
}

const BENCHMARK_NOTICES: NoticeItemDisplay[] = [
  {
    id: "notice-rakesh-143-1a",
    din: "ITBA/AST/S/143(1)(a)/2026-27/1078342219(1)",
    section: "143(1)(a)",
    titleEn: "Intimation u/s 143(1)(a) — Unreported Broker Share Profit",
    titleHi: "धारा 143(1)(a) के तहत सूचना — अघोषित शेयर लेन-देन लाभ",
    issuedOn: "2026-08-11",
    deadlineDays: 30,
    daysRemaining: 7,
    taxDemand: 34300,
    taxpayerName: PERSONAS.rakesh.name,
    pan: PERSONAS.rakesh.pan,
    issueSummaryEn:
      "Meridian Securities reported ₹1,10,000 from equity sales. The department prima facie adjustments propose adding ₹1,10,000 to income, reducing refund by ₹34,300.",
    issueSummaryHi:
      "मेरिडियन सिक्योरिटीज ने ₹1,10,000 के शेयर विक्रय की सूचना दी है। सीपीसी द्वारा इसे आय में जोड़कर रिफंड में ₹34,300 की कटौती प्रस्तावित की गई है।",
    suggestedActionEn:
      "File response citing actual broker contract notes showing net loss of ₹4,200 rather than profit.",
    suggestedActionHi:
      "ब्रोकर अनुबंध नोट संलग्न कर उत्तर दें कि लाभ के बजाय ₹4,200 की वास्तविक हानि हुई है।",
    recommendedDraftEn:
      "In response to notice ITBA/AST/S/143(1)(a)/2026-27/1078342219(1), I respectfully disagree with the proposed addition of ₹1,10,000. Meridian Securities reported gross sales consideration rather than net capital gains. As per enclosed P&L statement, transactions resulted in a net loss of ₹4,200. Please drop proposed adjustment.",
    recommendedDraftHi:
      "नोटिस ITBA/AST/S/143(1)(a)/2026-27/1078342219(1) के संबंध में, मैं ₹1,10,000 के प्रस्तावित समायोजन से असहमत हूं। यह राशि सकल विक्रय मूल्य है, शुद्ध लाभ नहीं। संलग्न पीएंडएल विवरण अनुसार ₹4,200 की हानि हुई है। कृपया मांग निरस्त करें।",
    isDemoCase: true,
  },
  {
    id: "notice-priya-nudge",
    din: "ITBA/CMP/F/NUDGE/2026-27/1081226703(1)",
    section: "139(9)",
    titleEn: "Defect Nudge u/s 139(9) — Section 80GG Rent Proof Required",
    titleHi: "धारा 139(9) त्रुटि नोटिस — धारा 80GG किराया रसीद आवश्यक",
    issuedOn: "2026-07-03",
    deadlineDays: 15,
    daysRemaining: 5,
    taxDemand: 18600,
    taxpayerName: PERSONAS.priya.name,
    pan: PERSONAS.priya.pan,
    issueSummaryEn:
      "You claimed ₹60,000 of rent under Section 80GG with no rent agreement or landlord PAN uploaded. The refund is held pending receipt verification.",
    issueSummaryHi:
      "धारा 80GG के तहत ₹60,000 की किराया कटौती का दावा किया गया है किंतु पोर्टल पर रसीद या मकान मालिक का पैन संलग्न नहीं है।",
    suggestedActionEn:
      "Upload rent agreement and Form 10BA or stage revised return to confirm claim.",
    suggestedActionHi:
      "फॉर्म 10BA एवं किराया रसीदें अपलोड करें अथवा संशोधित रिटर्न प्रस्तुत करें।",
    recommendedDraftEn:
      "Respectfully submitted in reference to ITBA/CMP/F/NUDGE/2026-27/1081226703(1). Monthly rent of ₹5,000 was paid via bank transfers to landlord (PAN attached). Staged revised Form 10BA declaration in support of Section 80GG claim.",
    recommendedDraftHi:
      "नोटिस के संदर्भ में निवेदन है कि बैंक द्वारा ₹5,000/माह किराए का भुगतान किया गया था। धारा 80GG के समर्थन में फॉर्म 10BA संलग्न है।",
    isDemoCase: true,
  },
];

export interface NoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  activeCitizen?: {
    name: string;
    pan: string;
    salary?: number;
    tds?: number;
    notices?: Notice[];
    hasDiscrepancies?: boolean;
  } | null;
  onResolveNotice?: (noticeId: string, resolution: "agree" | "disagree", responseStatement?: string) => void;
  onNavigateToDashboard?: () => void;
}

export default function NoticesModal({
  isOpen,
  onClose,
  lang,
  activeCitizen,
  onResolveNotice,
  onNavigateToDashboard,
}: NoticesModalProps) {
  const isHindi = lang === "hi";

  // Tab State: "active_notices" | "defense_drafter" | "timeline_radar"
  const [activeTab, setActiveTab] = useState<"active_notices" | "defense_drafter" | "timeline_radar">("active_notices");

  // Allow user to switch between their personal clean view and exploring benchmark cases
  const [showDemoCases, setShowDemoCases] = useState<boolean>(false);

  // Selected Notice
  const [selectedNoticeId, setSelectedNoticeId] = useState<string>(BENCHMARK_NOTICES[0].id);

  // Search DIN
  const [searchDin, setSearchDin] = useState<string>("");

  // Response Stance: "agree" | "disagree"
  const [stance, setStance] = useState<"agree" | "disagree">("disagree");
  const [statementText, setStatementText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isResolved, setIsResolved] = useState<boolean>(false);

  const searchInputId = useId();

  // Check if logged-in citizen actually has notices or discrepancies
  const hasRealNotices = Boolean(
    activeCitizen &&
      ((activeCitizen.notices && activeCitizen.notices.length > 0) || activeCitizen.hasDiscrepancies)
  );

  const isCleanRecord = Boolean(activeCitizen && !hasRealNotices && !showDemoCases);

  // Derive active notice list
  const availableNotices: NoticeItemDisplay[] = useMemo(() => {
    if (activeCitizen && activeCitizen.notices && activeCitizen.notices.length > 0) {
      return activeCitizen.notices.map((n) => ({
        id: n.id,
        din: n.din,
        section: n.kind === "143_1_a" ? "143(1)(a)" : n.kind === "139_9_defective" ? "139(9)" : "245",
        titleEn: n.headline,
        titleHi: n.headline,
        issuedOn: n.issuedOn,
        deadlineDays: 30,
        daysRemaining: 12,
        taxDemand: n.amountAtStake,
        taxpayerName: activeCitizen.name,
        pan: activeCitizen.pan,
        issueSummaryEn: n.consequence,
        issueSummaryHi: n.consequence,
        suggestedActionEn: "Submit objection or revise return to resolve adjustment.",
        suggestedActionHi: "समायोजन दूर करने के लिए आपत्ति दर्ज करें अथवा रिटर्न संशोधित करें।",
        recommendedDraftEn: `In response to ${n.din}, I respectfully dispute the proposed adjustment. Complete supporting documentation is attached.`,
        recommendedDraftHi: `नोटिस ${n.din} के उत्तर में, मैं प्रस्तावित मांग से विनम्रतापूर्वक असहमत हूं। साक्ष्य संलग्न हैं।`,
        isDemoCase: false,
      }));
    }
    return BENCHMARK_NOTICES;
  }, [activeCitizen]);

  const currentNotice = availableNotices.find((n) => n.id === selectedNoticeId) || availableNotices[0];

  // Initialize statement text when notice changes
  useEffect(() => {
    if (currentNotice) {
      setStatementText(isHindi ? currentNotice.recommendedDraftHi : currentNotice.recommendedDraftEn);
      setIsResolved(false);
    }
  }, [currentNotice, isHindi]);

  // When modal opens, configure view
  useEffect(() => {
    if (isOpen) {
      setShowDemoCases(false);
      setIsResolved(false);
      setActiveTab("active_notices");
      if (availableNotices[0]) {
        setSelectedNoticeId(availableNotices[0].id);
      }
    }
  }, [isOpen, availableNotices]);

  if (!isOpen) return null;

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const appendText = isHindi
          ? " (दस्तावेजी साक्ष्य पोर्टल पर सफलतापूर्वक संलग्न किए गए हैं।)"
          : " (Supporting contract notes and bank statements have been attached.)";
        setStatementText((prev) => prev + appendText);
      }, 2500);
    }
  };

  const handleResolve = () => {
    setIsResolved(true);
    onResolveNotice?.(currentNotice.id, stance, statementText);
  };

  const filteredNotices = searchDin.trim()
    ? availableNotices.filter(
        (n) =>
          n.din.toLowerCase().includes(searchDin.toLowerCase()) ||
          n.pan.toLowerCase().includes(searchDin.toLowerCase()) ||
          n.section.toLowerCase().includes(searchDin.toLowerCase())
      )
    : availableNotices;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notices-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-paper shadow-2xl border border-line overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex items-start justify-between border-b border-line p-5 sm:px-6 sm:py-4 bg-paper-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-xs">
              <ShieldAlert size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="notices-modal-title" className="font-sans text-lg sm:text-xl font-black text-ink">
                  {isHindi ? "नोटिस और त्रुटि निवारण केंद्र" : "Notices & Defect Resolver"}
                </h2>
                <span className="hidden sm:inline-flex rounded-full bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Sec 143(1)(a) & 139(9)
                </span>
              </div>
              <p className="text-xs text-ink-2">
                {isHindi
                  ? "सीपीसी बेंगलूरु के नोटिसों का सत्यापन, 15-दिवसीय समय सीमा और कानूनी उत्तर ड्राफ्टर।"
                  : "CBDT DIN verification, statutory 15-day defect timeline & AI legal defense drafter."}
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
            onClick={() => setActiveTab("active_notices")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "active_notices"
                ? "border-rose-600 text-rose-600 dark:text-rose-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <FileText size={15} />
            <span>{isHindi ? "1. सक्रिय नोटिस स्थिति" : "1. Notice Status & DIN"}</span>
            {!isCleanRecord && (
              <span className="rounded-full bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-300">
                {filteredNotices.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("defense_drafter")}
            disabled={isCleanRecord}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "defense_drafter"
                ? "border-rose-600 text-rose-600 dark:text-rose-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Scale size={15} />
            <span>{isHindi ? "2. एआई कानूनी उत्तर ड्राफ्टर" : "2. Legal Defense Drafter"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("timeline_radar")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "timeline_radar"
                ? "border-rose-600 text-rose-600 dark:text-rose-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Clock size={15} />
            <span>{isHindi ? "3. 15-दिवसीय समय सीमा व परिणाम" : "3. 15-Day Countdown & Penalties"}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB BODY (SCROLLABLE)                                                     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ======================================================================= */}
          {/* TAB 1: ACTIVE NOTICES & DIN VERIFICATION                                */}
          {/* ======================================================================= */}
          {activeTab === "active_notices" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* CASE 1: LOGGED IN CITIZEN HAS A CLEAN RECORD (NO NOTICES) */}
              {isCleanRecord ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-4 shadow-sm">
                    <div className="flex size-16 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 shadow-sm">
                      <ShieldCheck size={36} />
                    </div>

                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center justify-center gap-2">
                        <span className="rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                          Zero Pending Notices
                        </span>
                        <span className="font-mono text-xs font-bold text-ink-2">
                          AY 2026-27
                        </span>
                      </div>
                      <h3 className="font-sans text-lg sm:text-xl font-black text-ink">
                        {isHindi
                          ? `${activeCitizen?.name}: कोई लंबित नोटिस या त्रुटि नहीं मिली`
                          : `No Pending Notices or Defects for ${activeCitizen?.name}`}
                      </h3>
                      <p className="text-xs text-ink-2 leading-relaxed">
                        {isHindi
                          ? `पैन (${activeCitizen?.pan}) के लिए सीपीसी द्वारा कोई भी धारा 143(1)(a) या धारा 139(9) नोटिस जारी नहीं किया गया है। आपके द्वारा घोषित रिटर्न एवं AIS/26AS रिकॉर्ड में 100% पूर्ण सामंजस्य है।`
                          : `No statutory notice under Section 143(1)(a), 139(9), or 148A has been issued for PAN ${activeCitizen?.pan}. Your reported income matches third-party AIS & 26AS data with zero discrepancies.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToDashboard?.();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
                      >
                        <span>{isHindi ? "डैशबोर्ड पर रिटर्न देखें" : "View My Return in Dashboard"}</span>
                        <ArrowRight size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDemoCases(true)}
                        className="px-4 py-2.5 rounded-xl border border-line bg-paper hover:bg-paper-2 text-ink text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles size={14} className="text-amber-500" />
                        <span>{isHindi ? "डेमो बेंचमार्क नोटिस केस देखें" : "Explore Benchmark Notice Cases"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Verification Banner */}
                  <div className="p-4 rounded-2xl bg-paper-2 border border-line text-xs space-y-1 text-ink-2">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>{isHindi ? "सत्यापित सीबीडीटी स्थिति:" : "CBDT Central Processing Verification:"}</span>
                    </span>
                    <p>
                      {isHindi
                        ? "आपकी फाइलिंग स्थिति पूरी तरह से वैधानिक रूप से दोषमुक्त है। यदि कभी कोई सूचना प्राप्त होती है, तो आप यहाँ उसका DIN दर्ज करके कानूनी उत्तर तैयार कर सकेंगे।"
                        : "Your filing record is in complete statutory compliance. If you ever receive an official communication, you can verify its Document Identification Number (DIN) here."}
                    </p>
                  </div>
                </div>
              ) : (
                /* CASE 2: CITIZEN HAS NOTICES OR IS EXPLORING BENCHMARK CASES */
                <div className="space-y-6">
                  {/* Demo Indicator if exploring demo cases */}
                  {showDemoCases && activeCitizen && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-600 shrink-0" />
                        <span>
                          <strong>{isHindi ? "डेमो मोड सक्रिय:" : "Demonstration Mode Active:"}</strong>{" "}
                          {isHindi
                            ? "आप बेंचमार्क नोटिस केस देख रहे हैं। आपका व्यक्तिगत रिकॉर्ड पूरी तरह दोषमुक्त है।"
                            : `Exploring benchmark notice scenarios. Your personal account (${activeCitizen.name}) has zero notices.`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDemoCases(false)}
                        className="font-bold text-xs underline cursor-pointer hover:opacity-80"
                      >
                        {isHindi ? "मेरे रिकॉर्ड पर वापस जाएं" : "Return to My Clean Record"}
                      </button>
                    </div>
                  )}

                  {/* CBDT DIN Rule Disclosure Banner */}
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 text-xs">
                    <AlertOctagon size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-ink">
                        {isHindi ? "सीबीडीटी परिपत्र 19/2019 — अनिवार्य DIN अधिदेश" : "CBDT Circular No. 19/2019 — Mandatory DIN Requirement"}
                      </span>
                      <p className="text-ink-2 leading-relaxed">
                        {isHindi
                          ? "आयकर विभाग द्वारा जारी प्रत्येक आधिकारिक नोटिस, समन या आदेश में एक वैध दस्तावेज़ पहचान संख्या (DIN) होना कानूनी रूप से अनिवार्य है। बिना DIN का कोई भी नोटिस अमान्य और शून्य (void ab initio) माना जाता है।"
                          : "Every official notice issued by the Income Tax Department must bear a computer-generated Document Identification Number (DIN). Any communication without a valid DIN is non-est (invalid) in law."}
                      </p>
                    </div>
                  </div>

                  {/* DIN Search / Filter Bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                      id={searchInputId}
                      type="text"
                      value={searchDin}
                      onChange={(e) => setSearchDin(e.target.value)}
                      placeholder={
                        isHindi
                          ? "DIN संख्या, पैन (PAN) या धारा (Section 139/143) खोजें..."
                          : "Search by DIN (e.g. ITBA/AST/S/143), PAN, or Section..."
                      }
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-mono rounded-xl border border-line bg-paper text-ink placeholder:text-ink-3 focus:border-rose-600 focus:outline-none"
                    />
                  </div>

                  {/* Notices List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">
                        {isHindi ? "सक्रिय वैधानिक नोटिस सूची:" : "Active Statutory Notices:"}
                      </span>
                      <span className="text-ink-3 font-mono">
                        Showing {filteredNotices.length} active items
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                      {filteredNotices.map((n) => {
                        const isSelected = selectedNoticeId === n.id;
                        const isUrgent = n.daysRemaining <= 7;

                        return (
                          <div
                            key={n.id}
                            onClick={() => setSelectedNoticeId(n.id)}
                            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-3 ${
                              isSelected
                                ? "border-rose-600 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs ring-1 ring-rose-600"
                                : "border-line bg-paper hover:border-rose-300"
                            }`}
                          >
                            {/* Notice Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-rose-600 text-white font-mono text-[10px] font-bold px-2 py-0.5">
                                  Section {n.section}
                                </span>
                                <span className="font-mono text-xs font-bold text-ink truncate max-w-xs">{n.din}</span>
                                {n.isDemoCase && (
                                  <span className="rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.2">
                                    Demo Case
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-ink-3">Issued: {n.issuedOn}</span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    isUrgent
                                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  }`}
                                >
                                  {n.daysRemaining} days left of {n.deadlineDays}
                                </span>
                              </div>
                            </div>

                            {/* Title & Issue */}
                            <div>
                              <h4 className="font-bold text-sm text-ink">{isHindi ? n.titleHi : n.titleEn}</h4>
                              <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                                {isHindi ? n.issueSummaryHi : n.issueSummaryEn}
                              </p>
                            </div>

                            {/* Taxpayer & Demand Bar */}
                            <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 text-ink-3">
                                <span>Taxpayer: <strong className="text-ink">{n.taxpayerName}</strong> ({n.pan})</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-ink-2">Amount at Stake:</span>
                                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                  {formatMoney(n.taxDemand, lang)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: AI LEGAL DEFENSE DRAFTER                                         */}
          {/* ======================================================================= */}
          {activeTab === "defense_drafter" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Active Notice Selected Bar */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-3 block">Selected Case for Defense:</span>
                  <span className="font-bold text-sm text-ink">{currentNotice.din}</span>
                  <span className="text-ink-2 block mt-0.5">Section {currentNotice.section} — {currentNotice.taxpayerName}</span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] font-mono text-ink-3 block">Time Remaining:</span>
                  <span className="font-bold text-rose-600 font-mono text-sm">{currentNotice.daysRemaining} Days</span>
                </div>
              </div>

              {/* Legal Position Stance Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-ink block">
                  {isHindi ? "आपकी कानूनी प्रतिक्रिया का रुख (Choose Legal Position):" : "Choose Your Response Position:"}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStance("agree");
                      setStatementText(isHindi ? currentNotice.recommendedDraftHi : currentNotice.recommendedDraftEn);
                    }}
                    className={`p-4 rounded-2xl border-2 text-start transition cursor-pointer space-y-1.5 ${
                      stance === "agree"
                        ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-600"
                        : "border-line bg-paper hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Check size={14} />
                        <span>{isHindi ? "विभाग के तथ्यों से सहमत — सुधार स्वीकारें" : "Agree & Reconcile (Revised Return)"}</span>
                      </span>
                      <div className="size-4 rounded-full border border-line flex items-center justify-center bg-paper">
                        {stance === "agree" && <div className="size-2.5 rounded-full bg-emerald-600" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      {isHindi
                        ? "धारा 139(5) के तहत संशोधित रिटर्न तैयार करता है। मूल फाइलिंग तिथि सुरक्षित रहती है और 234F पेनल्टी से मुक्ति मिलती है।"
                        : "Stages a Revised Return u/s 139(5) accepting the reporter's figures. Preserves original filing date and clears defect without penalty."}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStance("disagree");
                      setStatementText(
                        isHindi
                          ? `नोटिस ${currentNotice.din} के संदर्भ में, मैं प्रस्तावित मांग से असहमत हूं। रिपोर्ट की गई राशि में नियोक्ता/बैंक द्वारा त्रुटि है। प्रमाणित दस्तावेजी साक्ष्य संलग्न हैं।`
                          : `In reference to notice ${currentNotice.din}, I respectfully dispute the proposed adjustment. The discrepancy originates from reporter reporting errors in AIS/26AS. Corroborating banking proofs are annexed.`
                      );
                    }}
                    className={`p-4 rounded-2xl border-2 text-start transition cursor-pointer space-y-1.5 ${
                      stance === "disagree"
                        ? "border-rose-600 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs ring-1 ring-rose-600"
                        : "border-line bg-paper hover:border-rose-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertOctagon size={14} />
                        <span>{isHindi ? "असहमत — कानूनी साक्ष्य व आपत्ति दर्ज करें" : "Object & Submit Evidence (Dispute)"}</span>
                      </span>
                      <div className="size-4 rounded-full border border-line flex items-center justify-center bg-paper">
                        {stance === "disagree" && <div className="size-2.5 rounded-full bg-rose-600" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      {isHindi
                        ? "यदि रिपोर्टर (कंपनी या बैंक) ने गलत डेटा भेजा है, तो AIS फीडबैक कोड के साथ औपचारिक कानूनी आपत्ति दर्ज करें।"
                        : "If third-party reporter filed incorrect figures, dispute with formal statutory citations, AIS feedback codes, and bank evidence."}
                    </p>
                  </button>
                </div>
              </div>

              {/* Legal Defense Statement Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-ink">
                    {isHindi ? "आधिकारिक प्रतिक्रिया वक्तव्य (Formal Legal Response):" : "Statutory Response Statement (Draft):"}
                  </label>

                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`flex items-center gap-1.5 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      isListening
                        ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                        : "bg-paper border-line text-ink-2 hover:text-ink"
                    }`}
                  >
                    {isListening ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    <span>{isListening ? (isHindi ? "सुन रहा है…" : "Listening…") : (isHindi ? "बोलकर ड्राफ्ट करें" : "Dictate Statement")}</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={statementText}
                  onChange={(e) => setStatementText(e.target.value)}
                  className="w-full p-3.5 text-xs font-mono leading-relaxed rounded-2xl border border-line bg-paper text-ink focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              {/* Staging Summary */}
              {isResolved && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <strong className="font-bold block">
                      {isHindi ? "संशोधित रिटर्न सफलतापूर्वक तैयार (Revised Return Staged u/s 139(5))" : "Notice Resolved & Revised Return Staged u/s 139(5)"}
                    </strong>
                    <span>
                      {isHindi
                        ? "धारा 139(9) की विसंगति हल हो गई है। मूल फाइलिंग तिथि सुरक्षित रखी गई है।"
                        : "The discrepancy cited in the notice has been reconciled and staged into your return draft."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: 15-DAY COUNTDOWN & STATUTORY PENALTIES                            */}
          {/* ======================================================================= */}
          {activeTab === "timeline_radar" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 15-Day Countdown Progress */}
              <div className="rounded-2xl border border-line bg-paper-2 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">
                    {isHindi ? "धारा 139(9) अनिवार्य 15-दिवसीय प्रतिक्रिया विंडो:" : "Section 139(9) 15-Day Statutory Response Window:"}
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    {currentNotice.daysRemaining} Days Left
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-500"
                    style={{ width: `${((currentNotice.deadlineDays - currentNotice.daysRemaining) / currentNotice.deadlineDays) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-ink-3">
                  <span>Issued: {currentNotice.issuedOn}</span>
                  <span>Cutoff: Day {currentNotice.deadlineDays} (Final statutory limit)</span>
                </div>
              </div>

              {/* Statutory Consequences Grid */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <AlertOctagon size={15} className="text-rose-600" />
                  <span>
                    {isHindi
                      ? "15 दिनों में उत्तर न देने पर कानूनी परिणाम:"
                      : "Statutory Consequences of Non-Compliance within 15 Days:"}
                  </span>
                </div>

                <div className="space-y-2.5 text-ink-2 leading-relaxed">
                  <div className="p-3 rounded-xl bg-paper border border-line/60">
                    <strong className="text-ink block">1. रिटर्न अमान्य (Return Treated as Invalid / Non-Est):</strong>
                    यदि 15 दिनों में उत्तर नहीं दिया जाता, तो विभाग द्वारा रिटर्न को ऐसा माना जाएगा जैसे वह कभी दाखिल ही नहीं किया गया था।
                  </div>
                  <div className="p-3 rounded-xl bg-paper border border-line/60">
                    <strong className="text-ink block">2. धारा 234F विलंब शुल्क (Mandatory ₹5,000 Late Fee):</strong>
                    रिटर्न अमान्य होने पर इसे विलंबित (Belated) रिटर्न माना जाएगा और धारा 234F के तहत ₹5,000 का विलंब शुल्क देय होगा।
                  </div>
                  <div className="p-3 rounded-xl bg-paper border border-line/60">
                    <strong className="text-ink block">3. धारा 234A ब्याज (1% Per Month Penal Interest):</strong>
                    31 जुलाई के बाद बकाया कर पर 1% प्रति माह की दर से दंडात्मक ब्याज निरंतर बढ़ता रहेगा।
                  </div>
                  <div className="p-3 rounded-xl bg-paper border border-line/60">
                    <strong className="text-ink block">4. हानि अग्रेषण का अधिकार समाप्त (Forfeiture of Carry Forward Losses):</strong>
                    व्यापार या पूंजीगत हानियों को आगामी 8 वर्षों तक आगे ले जाने (Carry Forward) का अधिकार हमेशा के लिए समाप्त हो जाएगा।
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FIXED FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line p-4 sm:p-5 bg-paper">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <Building size={15} className="text-rose-600" />
            <span>
              {isCleanRecord
                ? `${activeCitizen?.name} · Clean Compliance Record`
                : `CPC Bengaluru e-Proceedings · DIN ${currentNotice.din}`}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>

            {isCleanRecord ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDashboard?.();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <span>{isHindi ? "डैशबोर्ड पर रिटर्न देखें" : "View Return in Dashboard"}</span>
                <ArrowRight size={14} />
              </button>
            ) : stance === "agree" ? (
              <button
                type="button"
                onClick={handleResolve}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <Sparkles size={14} />
                <span>
                  {isHindi ? "संशोधित रिटर्न u/s 139(5) तैयार करें (त्रुटि मुक्त)" : "Stage Revised Return u/s 139(5)"}
                </span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResolve}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/25 transition cursor-pointer"
              >
                <Send size={14} />
                <span>
                  {isHindi ? "आपत्ति व कानूनी साक्ष्य सीपीसी को भेजें" : "Submit Formal Defense to CPC"}
                </span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
