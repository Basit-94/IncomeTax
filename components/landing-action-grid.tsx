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
} from "lucide-react";
import { getLandingCards, type LandingActionCard } from "@/lib/landingCards";
import type { Lang } from "@/lib/types";
import TaxOptimizerModal from "./modals/TaxOptimizerModal";
import TaxCalendarModal from "./modals/TaxCalendarModal";
import FileReturnModal from "./modals/FileReturnModal";
import type { IngestedDocument } from "@/context/TaxReturnContext";

interface LandingActionGridProps {
  lang: Lang;
  onActionClick: (cardId: LandingActionCard["id"]) => void;
  onLaunchPersona?: (personaId: "sunita" | "rakesh" | "priya", directToDashboard?: boolean) => void;
  onLaunchPan?: (pan: string) => void;
  onLaunchWithForm16?: (doc: IngestedDocument) => void;
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
}: LandingActionGridProps) {
  const cards = getLandingCards(lang);
  const [isFileReturnOpen, setIsFileReturnOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleCardClick = (id: LandingActionCard["id"]) => {
    if (id === "file_return") {
      setIsFileReturnOpen(true);
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
    <section className="mt-8 space-y-4" aria-label="Portal Capabilities Grid">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-line pb-2 text-start">
        <div>
          <span className="font-mono text-[11px] font-bold tracking-widest text-money uppercase">
            {lang === "hi" ? "कार्यप्रणाली और सुविधाएं" : "Core Capabilities"}
          </span>
          <h2 className="font-sans text-xl font-bold text-ink">
            {lang === "hi" ? "सुव्यवस्थित 7-कार्ड कार्यप्रणाली" : "The 7-Action Capability Grid"}
          </h2>
        </div>
        <span className="text-xs text-ink-3">
          {lang === "hi" ? "सीधे शुरू करने के लिए किसी भी कार्ड पर क्लिक करें" : "Click any card to launch or preview directly"}
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
                  <span className="font-semibold text-ink-2">{lang === "hi" ? "समाधान:" : "Consolidates:"}</span> {c.replaces}
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
      <TaxCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        lang={lang}
      />
    </section>
  );
}
