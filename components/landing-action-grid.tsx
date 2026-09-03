"use client";

import { useState } from "react";
import {
  FileText,
  FileCheck2,
  Calculator,
  CreditCard,
  ShieldAlert,
  Clock,
  Calendar,
  ChevronRight,
  Sparkles,
  Bot,
  MessageSquare,
  Zap,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { getLandingCards, type LandingActionCard } from "@/lib/landingCards";
import type { Lang, Notice, BankAccount, Persona } from "@/lib/types";
import TaxOptimizerModal from "./modals/TaxOptimizerModal";
import TaxCalendarModal from "./modals/TaxCalendarModal";
import FileReturnModal from "./modals/FileReturnModal";
import AgenticModeModal from "./modals/AgenticModeModal";
import MatchRecordsModal, { type ReconcileRow } from "./modals/MatchRecordsModal";
import PayTaxModal from "./modals/PayTaxModal";
import NoticesModal from "./modals/NoticesModal";
import StatusHistoryModal from "./modals/StatusHistoryModal";
import type { IngestedDocument, SelfAssessmentPayment } from "@/context/TaxReturnContext";

interface LandingActionGridProps {
  lang: Lang;
  onActionClick: (cardId: LandingActionCard["id"]) => void;
  onLaunchPersona?: (personaId: "sunita" | "rakesh" | "priya", directToDashboard?: boolean) => void;
  onLaunchPan?: (pan: string) => void;
  onLaunchWithForm16?: (doc: IngestedDocument) => void;
  activeCitizen?: {
    name: string;
    pan: string;
    salary?: number;
    tds?: number;
    totalTaxesPaid?: number;
    taxDue?: number;
    notices?: Notice[];
    banks?: BankAccount[];
    refund?: Persona["refund"];
    hasDiscrepancies?: boolean;
  } | null;
  onResumeReturn?: () => void;
  onLaunchFullReconcile?: () => void;
  onApplyReconciliation?: (reconciledRows: ReconcileRow[]) => void;
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
  onApplyChallan?: (payment: SelfAssessmentPayment) => void;
  onResolveNotice?: (noticeId: string, resolution: "agree" | "disagree", responseStatement?: string) => void;
  currentRegime?: "new" | "old";
}

const CARD_ICONS = {
  file_return: { icon: FileText, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  match_records: { icon: FileCheck2, color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
  tax_optimizer: { icon: Calculator, color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
  pay_tax: { icon: CreditCard, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" },
  notices: { icon: ShieldAlert, color: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" },
  status_history: { icon: Clock, color: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300" },
  tax_calendar: { icon: Calendar, color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
};

export default function LandingActionGrid({
  lang,
  onActionClick,
  onLaunchPersona,
  onLaunchPan,
  onLaunchWithForm16,
  activeCitizen,
  onResumeReturn,
  onLaunchFullReconcile,
  onApplyReconciliation,
  onApplyOptimizer,
  onApplyChallan,
  onResolveNotice,
  currentRegime,
}: LandingActionGridProps) {
  const cards = getLandingCards(lang);
  const [isFileReturnOpen, setIsFileReturnOpen] = useState(false);
  const [isMatchRecordsOpen, setIsMatchRecordsOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isPayTaxOpen, setIsPayTaxOpen] = useState(false);
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAgenticOpen, setIsAgenticOpen] = useState(false);

  const isHindi = lang === "hi";

  const handleCardClick = (id: LandingActionCard["id"]) => {
    if (id === "file_return") {
      setIsFileReturnOpen(true);
      return;
    }
    if (id === "match_records") {
      setIsMatchRecordsOpen(true);
      return;
    }
    if (id === "tax_optimizer") {
      setIsOptimizerOpen(true);
      return;
    }
    if (id === "pay_tax") {
      setIsPayTaxOpen(true);
      return;
    }
    if (id === "notices") {
      setIsNoticesOpen(true);
      return;
    }
    if (id === "status_history") {
      setIsStatusHistoryOpen(true);
      return;
    }
    if (id === "tax_calendar") {
      setIsCalendarOpen(true);
      return;
    }
    onActionClick(id);
  };

  return (
    <section className="mt-8 space-y-6" aria-label="Portal Capabilities Grid">
      {/* ========================================================================= */}
      {/* AGENTIC MODE HERO BOX (CLEAN, ELEVATED ARCHITECTURE)                      */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-none p-6 sm:p-7 md:p-8 text-start transition-shadow hover:shadow-[0_14px_30px_-5px_rgba(0,0,0,0.07)]">
        {/* Top Bar: Single Muted Pill */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-0.5 text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isHindi ? "एजेंटिक मोड · स्वायत्त कर फाइलिंग" : "AI AGENTIC MODE • CONVERSATIONAL TAX FILING"}</span>
          </div>
        </div>

        {/* Main Hero Content (Responsive 2-column: Left 55-58%, Right ~42-45%) */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Vision, Subtext, Navy CTA & Compact Starter Pills */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-sans text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {isHindi
                ? "स्वायत्त बातचीत: संपूर्ण रिटर्न दाखिल व कर अनुकूलन"
                : "File, Reconcile & Optimize Taxes via Conversation"}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {isHindi
                ? "कोई जटिल पोर्टल नहीं, कोई स्लैब गणना का सिरदर्द नहीं। अपनी मातृभाषा में बोलें या फॉर्म 16 अपलोड करें — हमारा स्वायत्त टैक्स एजेंट छिपी कटौतियां खोजता है, AIS विसंगतियां ठीक करता है और अधिकतम रिफंड सुनिश्चित करता है।"
                : "No tedious portals, no manual slab math, no legal jargon. Simply converse or upload your Form 16. Our autonomous tax agent uncovers missing 80C/80D/HRA deductions, reconciles AIS discrepancies with statutory codes, and prepares your return hands-free."}
            </p>

            {/* Primary CTA (Deep Slate / Navy) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsAgenticOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                <span>{isHindi ? "एजेंटिक मोड शुरू करें" : "Explore Agentic Mode"}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Compact Starter Prompt Pills */}
            <div className="pt-1 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {isHindi ? "त्वरित शुरुआत (Click to Ask):" : "Try asking the agent:"}
              </span>

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAgenticOpen(true)}
                  className="group w-full text-start rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 truncate">
                    <MessageSquare size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{isHindi ? "“यहाँ मेरा फॉर्म 16 है, अधिकतम रिफंड निकालें”" : "“Here is my Form 16, maximize my refund”"}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors ml-2 shrink-0">
                    ↵
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAgenticOpen(true)}
                  className="group w-full text-start rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 truncate">
                    <MessageSquare size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{isHindi ? "“AIS में बैंक ब्याज विसंगति का जवाब तैयार करें”" : "“Reconcile my SBI interest mismatch in AIS”"}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors ml-2 shrink-0">
                    ↵
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Compact Autonomous Terminal Preview Mockup (~45% width) */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 shadow-xs overflow-hidden">
            {/* Terminal Window Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-3.5 py-2 bg-slate-100/70 dark:bg-slate-800/50 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-400" />
                <span className="size-2 rounded-full bg-amber-400" />
                <span className="size-2 rounded-full bg-emerald-400" />
                <span className="ml-1.5 font-mono text-[10.5px] font-medium text-slate-600 dark:text-slate-300">
                  Wapsi Terminal
                </span>
              </div>
              <span className="flex items-center gap-1 font-mono text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Agent active 🟢</span>
              </span>
            </div>

            {/* Terminal Canvas */}
            <div className="p-3.5 sm:p-4 space-y-3">
              {/* User Message (High Contrast Deep Charcoal/Navy) */}
              <div className="flex items-start justify-end">
                <div className="max-w-[92%] rounded-xl rounded-tr-xs bg-slate-900 dark:bg-slate-950 text-white p-2.5 sm:p-3 border border-slate-800 shadow-xs">
                  <span className="block text-[8.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
                    Citizen · Verified
                  </span>
                  <p className="text-xs leading-relaxed m-0 text-slate-100">
                    {isHindi
                      ? "मेरी ₹14.5L सैलरी है और ₹85,000 TDS कटा है। कौन सा रिजीम मुझे अधिक रिफंड देगा?"
                      : "I have ₹14.5L salary and ₹85,000 TDS. Which regime gives me the highest refund?"}
                  </p>
                </div>
              </div>

              {/* Agent Autonomous Execution Trail */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1 font-mono text-[10.5px]">
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold text-[10px]">
                  <Zap size={11} className="text-amber-500" />
                  <span>Execution Trail:</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    ✓ Form 16 parsed
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    ✓ AIS matched
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    ✓ 80C/80D verified
                  </span>
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                    ⚡ Optimal found
                  </span>
                </div>
              </div>

              {/* Agent Highlighted Outcome Card */}
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9.5px] font-semibold uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-600" />
                    <span>Recommended: Old Regime</span>
                  </span>
                  <span className="rounded bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2">
                    Saves ₹30,160
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-t border-emerald-200/80 dark:border-emerald-800/60 pt-1.5">
                  <div>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-mono">Net Statutory Outcome:</span>
                    <span className="font-mono text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      +₹8,560 Net Refund Due
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-mono">Old vs New:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      ₹76.4k vs ₹106.6k
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7-CARD CAPABILITY GRID HEADER                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-line pb-2 text-start pt-2">
        <div>
          <span className="font-mono text-[11px] font-bold tracking-widest text-money uppercase">
            {isHindi ? "कार्यप्रणाली और सुविधाएं" : "Core Capabilities"}
          </span>
          <h2 className="font-sans text-xl font-bold text-ink">
            {isHindi ? "सुव्यवस्थित 7-कार्ड कार्यप्रणाली" : "The 7-Action Capability Grid"}
          </h2>
        </div>
        <span className="text-xs text-ink-3">
          {isHindi ? "सीधे शुरू करने के लिए किसी भी कार्ड पर क्लिक करें" : "Click any card to launch or preview directly"}
        </span>
      </div>

      {/* 7-Card Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const conf = CARD_ICONS[c.id];
          const Icon = conf.icon;
          const isFullWidth = c.id === "tax_calendar";

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCardClick(c.id)}
              className={`group surface-panel relative flex flex-col justify-between rounded-xl border border-line bg-paper-2 p-4 text-start transition-all hover:border-money/60 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-money ${
                isFullWidth ? "sm:col-span-2 lg:col-span-3 bg-paper-2/90" : ""
              }`}
            >
              <div>
                {/* Card Top: Number + Badge + Icon */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink-3">{c.number}</span>
                    <span className="rounded-md border border-line bg-paper-3 px-2 py-0.5 text-[11px] font-mono font-medium text-ink-2">
                      {c.badge}
                    </span>
                  </div>
                  <div className={`flex size-8 items-center justify-center rounded-lg ${conf.color} transition-transform group-hover:scale-110`}>
                    <Icon size={16} aria-hidden="true" />
                  </div>
                </div>

                {/* Card Title & Description */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sans text-[15px] font-bold text-ink group-hover:text-money transition-colors">
                      {c.title}
                    </h3>
                    {c.highlight && (
                      <Sparkles size={13} className="text-amber-500 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-ink-2">
                    {c.subtitle}
                  </p>
                </div>
              </div>

              {/* Card Footer: Replaces tag + Arrow */}
              <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-2.5 text-[11px] text-ink-3">
                <span className="truncate">
                  <span className="font-semibold text-ink-2">{isHindi ? "समाधान:" : "Consolidates:"}</span> {c.replaces}
                </span>
                <span className="inline-flex items-center gap-0.5 font-semibold text-money opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ChevronRight size={14} className="rtl:rotate-180" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Modals */}
      <AgenticModeModal
        isOpen={isAgenticOpen}
        onClose={() => setIsAgenticOpen(false)}
        lang={lang}
        onOpenStandardFiling={() => {
          setIsAgenticOpen(false);
          setIsFileReturnOpen(true);
        }}
      />
      <FileReturnModal
        isOpen={isFileReturnOpen}
        onClose={() => setIsFileReturnOpen(false)}
        lang={lang}
        onLaunchPersona={(personaId, direct) => {
          setIsFileReturnOpen(false);
          onLaunchPersona?.(personaId, direct);
        }}
        onLaunchPan={(pan) => {
          setIsFileReturnOpen(false);
          onLaunchPan?.(pan);
        }}
        onLaunchWithForm16={(doc) => {
          setIsFileReturnOpen(false);
          onLaunchWithForm16?.(doc);
        }}
      />
      <TaxOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        lang={lang}
        activeCitizen={activeCitizen}
        currentRegime={currentRegime}
        onApplyOptimizer={onApplyOptimizer}
      />
      <MatchRecordsModal
        isOpen={isMatchRecordsOpen}
        onClose={() => setIsMatchRecordsOpen(false)}
        lang={lang}
        activeCitizen={activeCitizen}
        onResumeReturn={onResumeReturn}
        onLaunchFullReconcile={onLaunchFullReconcile}
        onApplyReconciliation={onApplyReconciliation}
      />
      <PayTaxModal
        isOpen={isPayTaxOpen}
        onClose={() => setIsPayTaxOpen(false)}
        lang={lang}
        activeCitizen={activeCitizen}
        onApplyChallan={onApplyChallan}
      />
      <NoticesModal
        isOpen={isNoticesOpen}
        onClose={() => setIsNoticesOpen(false)}
        lang={lang}
        activeCitizen={activeCitizen}
        onResolveNotice={onResolveNotice}
        onNavigateToDashboard={onResumeReturn}
      />
      <StatusHistoryModal
        isOpen={isStatusHistoryOpen}
        onClose={() => setIsStatusHistoryOpen(false)}
        lang={lang}
        activeCitizen={activeCitizen}
        onViewReturnDetails={onResumeReturn}
      />
      <TaxCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        lang={lang}
      />
    </section>
  );
}
