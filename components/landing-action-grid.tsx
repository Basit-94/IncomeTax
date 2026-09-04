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
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Upload,
  Lock,
} from "lucide-react";
import { getLandingCards, type LandingActionCard } from "@/lib/landingCards";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";
import type { Lang, Notice, BankAccount, Persona, TaxAlreadyPaid } from "@/lib/types";
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
    grossTax?: number;
    hasPaidChallan?: boolean;
    challanPayments?: TaxAlreadyPaid[];
    taxPaidEntries?: TaxAlreadyPaid[];
    notices?: Notice[];
    banks?: BankAccount[];
    refund?: Persona["refund"];
    hasDiscrepancies?: boolean;
  } | null;
  onResumeReturn?: () => void;
  onStartFreshFiling?: () => void;
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
  onStartFreshFiling,
  onLaunchFullReconcile,
  onApplyReconciliation,
  onApplyOptimizer,
  onApplyChallan,
  onResolveNotice,
  currentRegime,
}: LandingActionGridProps) {
  const cards = getLandingCards(lang);
  const ps = getPortalStrings(lang);

  const [isFileReturnOpen, setIsFileReturnOpen] = useState(false);
  const [fileReturnTab, setFileReturnTab] = useState<"custom_pan" | "form16" | "demo_personas">("custom_pan");
  const [isMatchRecordsOpen, setIsMatchRecordsOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isPayTaxOpen, setIsPayTaxOpen] = useState(false);
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAgenticOpen, setIsAgenticOpen] = useState(false);

  const card1 = cards.find((c) => c.id === "file_return");
  const otherCards = cards.filter((c) => c.id !== "file_return");

  const handleNormalFiling = () => {
    if (activeCitizen) {
      if (onResumeReturn && ((activeCitizen.salary ?? 0) > 0 || (activeCitizen.taxDue ?? 0) > 0)) {
        onResumeReturn();
      } else if (onStartFreshFiling) {
        onStartFreshFiling();
      } else if (onResumeReturn) {
        onResumeReturn();
      } else {
        setFileReturnTab("custom_pan");
        setIsFileReturnOpen(true);
      }
      return;
    }
    setFileReturnTab("custom_pan");
    setIsFileReturnOpen(true);
  };

  const handlePdfUpload = () => {
    setFileReturnTab("form16");
    setIsFileReturnOpen(true);
  };

  const handleCardClick = (id: LandingActionCard["id"]) => {
    if (id === "file_return") {
      handleNormalFiling();
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
    <section className="mt-8 space-y-8" aria-label="Portal Capabilities Grid">

      {/* ========================================================================= */}
      {/* 1. TOP & MAIN HERO: CARD 01 - FILE OR REVIEW RETURN (MAIN THING AT TOP)   */}
      {/* ========================================================================= */}
      {card1 && (
        <div
          key={card1.id}
          className="surface-panel relative w-full flex flex-col justify-between rounded-2xl border-2 border-emerald-500/50 bg-paper-2 p-5 sm:p-6 text-start shadow-sm transition-all"
        >
          <div>
            {/* Card Top: Number + Badges + Icon */}
            <div className="flex items-start justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-400/40">
                  {card1.number}
                </span>
                <span className="rounded-md border border-line bg-paper-3 px-2 py-0.5 text-[11px] font-mono font-medium text-ink-2">
                  {card1.badge}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  <Sparkles size={12} className="text-emerald-500" />
                  <span>{ps.primaryBadge}</span>
                </span>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                <FileText size={18} aria-hidden="true" />
              </div>
            </div>

            {/* Card Title & Description */}
            <div className="mt-3.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-sans text-xl sm:text-2xl font-bold text-ink">
                  {card1.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-ink-2 max-w-3xl">
                {card1.subtitle}
              </p>
            </div>

            {/* TWO FILING OPTIONS: 1. Normal Filing  2. Form 16 / AIS PDF Insertion */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Option 1: Normal Filing */}
              <button
                type="button"
                onClick={handleNormalFiling}
                className="group/opt relative flex flex-col justify-between rounded-xl border border-line hover:border-emerald-500 bg-paper hover:bg-paper-3 p-4 text-start transition-all hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-money"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300/40">
                      {ps.option1Badge}
                    </span>
                    <div className="size-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center group-hover/opt:scale-110 transition-transform">
                      <FileText size={14} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h4 className="font-sans text-[15px] font-bold text-ink group-hover/opt:text-emerald-600 dark:group-hover/opt:text-emerald-400 transition-colors">
                      {ps.option1Title}
                    </h4>
                    <p className="text-xs leading-relaxed text-ink-2">
                      {ps.option1Desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span>
                    {activeCitizen && ((activeCitizen.salary ?? 0) > 0 || (activeCitizen.taxDue ?? 0) > 0)
                      ? ps.continueFiling
                      : ps.option1Btn}
                  </span>
                  <ArrowRight size={14} className="group-hover/opt:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: PDF Insertion (Form 16 / AIS) */}
              <button
                type="button"
                onClick={handlePdfUpload}
                className="group/opt relative flex flex-col justify-between rounded-xl border border-line hover:border-blue-500 bg-paper hover:bg-paper-3 p-4 text-start transition-all hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-300/40">
                      {ps.option2Badge}
                    </span>
                    <div className="size-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center group-hover/opt:scale-110 transition-transform">
                      <Upload size={14} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h4 className="font-sans text-[15px] font-bold text-ink group-hover/opt:text-blue-600 dark:group-hover/opt:text-blue-400 transition-colors">
                      {ps.option2Title}
                    </h4>
                    <p className="text-xs leading-relaxed text-ink-2">
                      {ps.option2Desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-2.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                  <span>{ps.option2Btn}</span>
                  <Upload size={14} className="group-hover/opt:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Card Footer: Replaces tag + Security Note */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-3 text-[11px] sm:text-xs text-ink-3">
            <span className="truncate">
              <span className="font-semibold text-ink-2">{ps.consolidatesLabel}</span> {card1.replaces}
            </span>
            <span className="font-mono text-[10.5px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <Lock size={11} />
              <span>{ps.clientSideOnly}</span>
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THE REMAINING 6 ACTION CAPABILITIES (GRID)                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-line pb-2.5 text-start pt-2">
        <div>
          <span className="font-mono text-[11px] font-bold tracking-widest text-money uppercase">
            {ps.coreCapabilities}
          </span>
          <h2 className="font-sans text-xl font-bold text-ink">
            {ps.sevenActionGrid}
          </h2>
        </div>
        <span className="text-xs text-ink-3">
          {ps.clickToLaunch}
        </span>
      </div>

      {/* 6-Card Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {otherCards.map((c) => {
          const conf = CARD_ICONS[c.id];
          let Icon = conf.icon;
          let cardColor = conf.color;
          let cardTitle = c.title;
          let cardSubtitle = c.subtitle;
          let cardBadge = c.badge;
          const isFullWidth = c.id === "tax_calendar";

          if (c.id === "pay_tax" && activeCitizen) {
            const isPaid = Boolean(
              activeCitizen.hasPaidChallan ||
              (activeCitizen.challanPayments && activeCitizen.challanPayments.length > 0) ||
              (activeCitizen.taxPaidEntries && activeCitizen.taxPaidEntries.some((t) => t.section === "140A"))
            );
            const isNilDue = (activeCitizen.taxDue ?? 0) <= 0;

            if (isPaid) {
              cardTitle = ps.paidCardTitle;
              cardSubtitle = ps.paidCardSub;
              cardBadge = ps.paidCardBadge;
              cardColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
              Icon = ShieldCheck;
            } else if (isNilDue) {
              cardTitle = ps.nilDueCardTitle;
              cardSubtitle = ps.nilDueCardSub;
              cardBadge = ps.nilDueCardBadge;
              cardColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
              Icon = ShieldCheck;
            } else {
              const dueAmt = activeCitizen.taxDue!;
              cardTitle = `${ps.payDueCardTitle}: ₹${dueAmt.toLocaleString("en-IN")}`;
              cardSubtitle = `${ps.payDueCardSub} (₹${dueAmt.toLocaleString("en-IN")})`;
              cardBadge = `₹${dueAmt.toLocaleString("en-IN")} ${ps.dueBadge}`;
              cardColor = "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
            }
          }

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
                      {cardBadge}
                    </span>
                  </div>
                  <div className={`flex size-8 items-center justify-center rounded-lg ${cardColor} transition-transform group-hover:scale-110`}>
                    <Icon size={16} aria-hidden="true" />
                  </div>
                </div>

                {/* Card Title & Description */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sans text-[15px] font-bold text-ink group-hover:text-money transition-colors">
                      {cardTitle}
                    </h3>
                    {c.highlight && (
                      <Sparkles size={13} className="text-amber-500 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-ink-2">
                    {cardSubtitle}
                  </p>
                </div>
              </div>

              {/* Card Footer: Replaces tag + Arrow */}
              <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-2.5 text-[11px] text-ink-3">
                <span className="truncate">
                  <span className="font-semibold text-ink-2">{ps.consolidatesLabel}</span> {c.replaces}
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
        initialTab={fileReturnTab}
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
