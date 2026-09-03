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
import type { Lang } from "@/lib/types";
import TaxOptimizerModal from "./modals/TaxOptimizerModal";
import TaxCalendarModal from "./modals/TaxCalendarModal";
import FileReturnModal from "./modals/FileReturnModal";
import AgenticModeModal from "./modals/AgenticModeModal";
import MatchRecordsModal, { type ReconcileRow } from "./modals/MatchRecordsModal";
import type { IngestedDocument } from "@/context/TaxReturnContext";

interface LandingActionGridProps {
  lang: Lang;
  onActionClick: (cardId: LandingActionCard["id"]) => void;
  onLaunchPersona?: (personaId: "sunita" | "rakesh" | "priya", directToDashboard?: boolean) => void;
  onLaunchPan?: (pan: string) => void;
  onLaunchWithForm16?: (doc: IngestedDocument) => void;
  activeCitizen?: { name: string; pan: string; salary?: number; tds?: number } | null;
  onResumeReturn?: () => void;
  onLaunchFullReconcile?: () => void;
  onApplyReconciliation?: (reconciledRows: ReconcileRow[]) => void;
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
}: LandingActionGridProps) {
  const cards = getLandingCards(lang);
  const [isFileReturnOpen, setIsFileReturnOpen] = useState(false);
  const [isMatchRecordsOpen, setIsMatchRecordsOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
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
    if (id === "tax_calendar") {
      setIsCalendarOpen(true);
      return;
    }
    onActionClick(id);
  };

  return (
    <section className="mt-8 space-y-6" aria-label="Portal Capabilities Grid">
      {/* ========================================================================= */}
      {/* HIGHLIGHTED AGENTIC MODE HERO BOX (AT THE TOP OF ALL CARDS)              */}
      {/* ========================================================================= */}
      <div className="relative group rounded-3xl p-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-emerald-50/90 via-paper to-teal-50/40 dark:from-emerald-950/40 dark:via-paper dark:to-cyan-950/30 p-6 md:p-8 text-start backdrop-blur-md">
          {/* Subtle Ambient Background Radiances */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 size-48 rounded-full bg-teal-400/10 dark:bg-teal-400/5 blur-2xl pointer-events-none" />

          {/* Top Bar: Live AI Indicator + Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
              </span>
              <span className="rounded-full bg-emerald-600/10 dark:bg-emerald-400/15 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-mono font-bold tracking-wider text-emerald-700 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <Sparkles size={12} className="text-emerald-500" />
                <span>{isHindi ? "एजेंटिक मोड · स्वायत्त बातचीत" : "AI AGENTIC MODE · CONVERSATIONAL TAX FILING"}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-ink-3">
              <span className="rounded-md bg-paper-3/80 px-2 py-0.5 border border-line">
                {isHindi ? "23 भाषाएं" : "23 Languages"}
              </span>
              <span className="rounded-md bg-paper-3/80 px-2 py-0.5 border border-line">
                {isHindi ? "शून्य-फॉर्म" : "Zero Form Filling"}
              </span>
            </div>
          </div>

          {/* Main Hero Content (Responsive 2-column) */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left Column: Vision & Pitch */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30 shrink-0">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-sans text-xl md:text-2xl font-black text-ink tracking-tight">
                    {isHindi
                      ? "एजेंटिक मोड: सामान्य बातचीत से संपूर्ण रिटर्न दाखिल व अनुपालन"
                      : "Agentic Mode: File, Reconcile & Resolve Everything via Natural Conversation"}
                  </h3>
                </div>
              </div>

              <p className="text-xs md:text-sm text-ink-2 leading-relaxed">
                {isHindi
                  ? "कोई जटिल पोर्टल नहीं, कोई स्लैब गणना का सिरदर्द नहीं। अपनी भाषा में बोलें या लिखें — हमारा स्वायत्त टैक्स एजेंट आपकी फॉर्म 16 पढ़ता है, छिपी कटौतियां (80C, 80D, HRA) खोजता है, AIS विसंगतियों को ठीक करता है और स्वतः रिटर्न तैयार करता है।"
                  : "No tedious portals, no manual slab math, no legal jargon. Simply converse or upload your Form 16. Our autonomous tax agent uncovers missing 80C/80D/HRA deductions, resolves AIS discrepancies with statutory codes, and prepares your return hands-free."}
              </p>

              {/* Sample Prompt Chips */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsAgenticOpen(true)}
                  className="rounded-full bg-paper/80 dark:bg-paper-2/90 border border-emerald-500/30 px-3 py-1 text-[11px] font-medium text-ink-2 hover:border-emerald-500 hover:text-ink transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare size={12} className="text-emerald-500" />
                  <span>{isHindi ? "“यहाँ मेरा फॉर्म 16 है, अधिकतम रिफंड निकालें”" : "“Here is my Form 16, maximize my refund”"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAgenticOpen(true)}
                  className="rounded-full bg-paper/80 dark:bg-paper-2/90 border border-emerald-500/30 px-3 py-1 text-[11px] font-medium text-ink-2 hover:border-emerald-500 hover:text-ink transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare size={12} className="text-emerald-500" />
                  <span>{isHindi ? "“AIS बैंक ब्याज विसंगति का जवाब तैयार करें”" : "“Reconcile my SBI interest mismatch in AIS”"}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Chat Teaser & CTA */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-line/70 bg-paper/90 dark:bg-paper-2/90 p-4 shadow-md backdrop-blur-sm">
              <div className="space-y-2.5 text-xs">
                {/* Simulated Citizen Prompt */}
                <div className="flex items-start gap-2 justify-end">
                  <div className="rounded-xl rounded-tr-sm bg-emerald-600 px-3 py-2 text-white shadow-sm text-[11px]">
                    <span className="block opacity-75 text-[9px] font-mono mb-0.5">Citizen</span>
                    <span>
                      {isHindi
                        ? "मेरी ₹14.5L सैलरी है और ₹85k TDS कटा है। कौन सा रिजीम बेहतर है?"
                        : "I have ₹14.5L salary and ₹85k TDS. Which regime saves more?"}
                    </span>
                  </div>
                </div>

                {/* Simulated Agent Reply */}
                <div className="flex items-start gap-2">
                  <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-paper-2 dark:bg-paper-3 p-2.5 border border-line text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-ink">
                      <span>Wapsi Autonomous Agent</span>
                      <Zap size={11} className="text-amber-500" />
                    </div>
                    <p className="m-0 text-ink-2 leading-relaxed">
                      {isHindi
                        ? "पुरानी व्यवस्था में 80C + 80D के साथ आपका टैक्स ₹76,440 है। आपको ₹8,560 का रिफंड मिलेगा!"
                        : "In Old Regime with 80C + 80D, your tax is ₹76,440 vs ₹1,06,600 in New. You get an ₹8,560 refund!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-ink-3 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>{isHindi ? "मानव स्वीकृति सुरक्षित" : "Human-in-Loop Safe AI"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAgenticOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:opacity-95 transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <span>{isHindi ? "एजेंटिक मोड देखें" : "Explore Agentic Mode"}</span>
                  <ArrowRight size={14} />
                </button>
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
      <TaxCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        lang={lang}
      />
    </section>
  );
}
