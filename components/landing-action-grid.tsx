"use client";

import { useState, useRef } from "react";
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
import Card3D from "./ui/card-3d";
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
  file_return: { icon: FileText, color: "bg-ok/15 text-ok", glow: "rgba(30, 158, 112, 0.35)" },
  match_records: { icon: FileCheck2, color: "bg-tertiary/15 text-tertiary", glow: "rgba(139, 108, 240, 0.35)" },
  tax_optimizer: { icon: Calculator, color: "bg-warn/15 text-warn", glow: "rgba(184, 122, 0, 0.3)" },
  pay_tax: { icon: CreditCard, color: "bg-tertiary/15 text-tertiary", glow: "rgba(139, 108, 240, 0.35)" },
  notices: { icon: ShieldAlert, color: "bg-bad/15 text-bad", glow: "rgba(217, 64, 58, 0.3)" },
  status_history: { icon: Clock, color: "bg-ok/15 text-ok", glow: "rgba(30, 158, 112, 0.35)" },
  tax_calendar: { icon: Calendar, color: "bg-tertiary/15 text-tertiary", glow: "rgba(139, 108, 240, 0.35)" },
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

  const [droppedPdfFile, setDroppedPdfFile] = useState<File | null>(null);
  const [isOption2Dragging, setIsOption2Dragging] = useState(false);
  const option2DragCounter = useRef(0);

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

  const handleOption2DragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    option2DragCounter.current += 1;
    setIsOption2Dragging(true);
  };

  const handleOption2DragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsOption2Dragging(true);
  };

  const handleOption2DragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    option2DragCounter.current -= 1;
    if (option2DragCounter.current <= 0) {
      option2DragCounter.current = 0;
      setIsOption2Dragging(false);
    }
  };

  const handleOption2Drop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    option2DragCounter.current = 0;
    setIsOption2Dragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setDroppedPdfFile(file);
      setFileReturnTab("form16");
      setIsFileReturnOpen(true);
    }
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
        <Card3D
          key={card1.id}
          glowColor="rgba(255, 122, 26, 0.35)"
          depth={26}
          className="glass relative w-full flex flex-col justify-between rounded-3xl border-[1.5px] border-money p-4 sm:p-6 sm:px-7 text-start"
        >
          <div>
            {/* Card Top: Number + Badges + Icon */}
            <div className="flex items-start justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-bg px-2.5 py-1 text-xs font-bold text-amber-ink">
                  {card1.number}
                </span>
                <span className="glass-flat rounded-full px-2.5 py-1 text-xs font-mono font-medium tracking-[.04em] text-ink-3">
                  {card1.badge}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-xs font-bold text-ok-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden="true" />
                  <span>{ps.primaryBadge}</span>
                </span>
              </div>
              <div className="ink-surface flex size-11 items-center justify-center rounded-[14px] shrink-0">
                <FileText size={18} aria-hidden="true" />
              </div>
            </div>

            {/* Card Title & Description */}
            <div className="mt-3.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-sans text-2xl font-extrabold tracking-[-0.02em] text-ink">
                  {card1.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-ink-2 max-w-3xl">
                {card1.subtitle}
              </p>
            </div>

            {/* TWO FILING OPTIONS: 1. Normal Filing  2. Form 16 / AIS PDF Insertion */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Option 1: Normal Filing */}
              <button
                type="button"
                onClick={handleNormalFiling}
                className="group/opt relative flex flex-col justify-between rounded-[18px] border border-glass-edge bg-white/70 dark:bg-white/[0.06] hover:border-ok/60 p-4 text-start transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-money"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-bold text-ok-ink">
                      {ps.option1Badge}
                    </span>
                    <div className="size-7 rounded-[9px] bg-ok/15 text-ok flex items-center justify-center">
                      <FileText size={14} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h4 className="font-sans text-[15px] font-bold text-ink">
                      {ps.option1Title}
                    </h4>
                    <p className="text-[12.5px] leading-relaxed text-ink-2">
                      {ps.option1Desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 text-[13px] font-bold text-ok">
                  <span>
                    {activeCitizen && ((activeCitizen.salary ?? 0) > 0 || (activeCitizen.taxDue ?? 0) > 0)
                      ? ps.continueFiling
                      : ps.option1Btn}
                  </span>
                  <ArrowRight size={14} className="group-hover/opt:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: PDF Insertion (Form 16 / AIS) with direct Drag & Drop */}
              <button
                type="button"
                onClick={handlePdfUpload}
                onDragEnter={handleOption2DragEnter}
                onDragOver={handleOption2DragOver}
                onDragLeave={handleOption2DragLeave}
                onDrop={handleOption2Drop}
                className={`group/opt relative flex flex-col justify-between rounded-[18px] border p-4 text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-money ${
                  isOption2Dragging
                    ? "border-money bg-amber-bg ring-[3px] ring-money/30 scale-[1.01]"
                    : "border-dashed border-money/60 bg-white/70 dark:bg-white/[0.06] hover:border-money"
                }`}
              >
                <div className="pointer-events-none w-full">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                        isOption2Dragging ? "bg-money text-white animate-pulse" : "bg-amber-bg text-amber-ink"
                      }`}
                    >
                      {isOption2Dragging ? "Drop PDF Now" : ps.option2Badge}
                    </span>
                    <div
                      className={`size-7 rounded-[9px] flex items-center justify-center transition-all ${
                        isOption2Dragging ? "bg-money text-white scale-125" : "bg-money/15 text-money"
                      }`}
                    >
                      <Upload size={14} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h4
                      className={`font-sans text-[15px] font-bold transition-colors ${isOption2Dragging ? "text-money" : "text-ink"}`}
                    >
                      {isOption2Dragging ? "Drop your Form 16 / AIS PDF here" : ps.option2Title}
                    </h4>
                    <p className="text-[12.5px] leading-relaxed text-ink-2">
                      {isOption2Dragging
                        ? "Release the mouse to auto-ingest Form 16 / AIS figures directly into your return draft."
                        : ps.option2Desc}
                    </p>
                  </div>
                </div>

                <div className="pointer-events-none mt-4 flex items-center justify-between pt-2 text-[13px] font-bold text-money">
                  <span>{isOption2Dragging ? "Release to Ingest" : ps.option2Btn}</span>
                  <Upload
                    size={14}
                    className={isOption2Dragging ? "animate-pulse" : "group-hover/opt:-translate-y-0.5 transition-transform"}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Card Footer: Replaces tag + Security Note */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs text-ink-3">
            <span className="truncate">
              <span className="font-semibold text-ink-2">{ps.consolidatesLabel}</span> {card1.replaces}
            </span>
            <span className="text-xs text-ok flex items-center gap-1.5 font-semibold">
              <Lock size={11} />
              <span>{ps.clientSideOnly}</span>
            </span>
          </div>
        </Card3D>
      )}

      {/* ========================================================================= */}
      {/* 2. THE REMAINING 6 ACTION CAPABILITIES (GRID)                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-1 text-start pt-2">
        <div>
          <span className="text-xs font-bold tracking-[.08em] text-money uppercase">
            {ps.coreCapabilities}
          </span>
          <h2 className="font-sans text-xl font-extrabold tracking-[-0.02em] text-ink">
            {ps.sevenActionGrid}
          </h2>
        </div>
        <span className="text-[12.5px] text-ink-3">
          {ps.clickToLaunch}
        </span>
      </div>

      {/* 6-Card Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
        {otherCards.map((c) => {
          const conf = CARD_ICONS[c.id];
          let Icon = conf.icon;
          let cardColor = conf.color;
          let cardTitle = c.title;
          let cardSubtitle = c.subtitle;
          let cardBadge = c.badge;

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
              cardColor = "bg-ok/15 text-ok";
              Icon = ShieldCheck;
            } else if (isNilDue) {
              cardTitle = ps.nilDueCardTitle;
              cardSubtitle = ps.nilDueCardSub;
              cardBadge = ps.nilDueCardBadge;
              cardColor = "bg-ok/15 text-ok";
              Icon = ShieldCheck;
            } else {
              const dueAmt = activeCitizen.taxDue!;
              cardTitle = `${ps.payDueCardTitle}: ₹${dueAmt.toLocaleString("en-IN")}`;
              cardSubtitle = `${ps.payDueCardSub} (₹${dueAmt.toLocaleString("en-IN")})`;
              cardBadge = `₹${dueAmt.toLocaleString("en-IN")} ${ps.dueBadge}`;
              cardColor = "bg-warn/15 text-warn";
            }
          }

          return (
            <Card3D key={c.id} as="div" glowColor={conf.glow} depth={20} className="rounded-[20px]">
              <button
                type="button"
                onClick={() => handleCardClick(c.id)}
                className="glass w-full h-full relative flex flex-col justify-between rounded-[20px] max-sm:rounded-[16px] p-5 max-sm:p-3.5 text-start transition-colors hover:border-money/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-money cursor-pointer"
              >
                <div>
                  {/* Card Top: Number + Badge + Icon */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-3">{c.number}</span>
                      <span className="glass-flat rounded-full px-2.5 py-0.5 text-xs font-mono font-medium tracking-[.04em] text-ink-3">
                        {cardBadge}
                      </span>
                    </div>
                    <div className={`flex size-[34px] items-center justify-center rounded-[11px] ${cardColor}`}>
                      <Icon size={16} aria-hidden="true" />
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-sans text-[15px] font-bold text-ink">
                        {cardTitle}
                      </h3>
                      {c.highlight && (
                        <Sparkles size={13} className="text-money shrink-0" aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-ink-2">
                      {cardSubtitle}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Replaces tag + Arrow */}
                <div className="mt-4 flex items-center justify-between pt-2 text-[11.5px] text-ink-3">
                  <span className="truncate">
                    <span className="font-semibold text-ink-2">{ps.consolidatesLabel}</span> {c.replaces}
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-semibold text-money">
                    <ChevronRight size={14} className="rtl:rotate-180" />
                  </span>
                </div>
              </button>
            </Card3D>
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
        onClose={() => {
          setIsFileReturnOpen(false);
          setDroppedPdfFile(null);
        }}
        lang={lang}
        initialTab={fileReturnTab}
        initialFile={droppedPdfFile}
        onLaunchPersona={(personaId, direct) => {
          setIsFileReturnOpen(false);
          setDroppedPdfFile(null);
          onLaunchPersona?.(personaId, direct);
        }}
        onLaunchPan={(pan) => {
          setIsFileReturnOpen(false);
          setDroppedPdfFile(null);
          onLaunchPan?.(pan);
        }}
        onLaunchWithForm16={(doc) => {
          setIsFileReturnOpen(false);
          setDroppedPdfFile(null);
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
