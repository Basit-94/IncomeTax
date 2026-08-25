"use client";

import React from "react";
import { BadgeCheck } from "lucide-react";
import type { Persona, Lang } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { formatMoney } from "../../lib/money";
import { compareForPersona } from "../../lib/return/compute";

interface RegimeStepProps {
  persona: Persona;
  t: Dict;
  lang: Lang;
  regime: "new" | "old";
  onChoose: (regime: "new" | "old") => void;
}

/**
 * One screen, both outcomes, computed live by compareRegimes(). The
 * recommendation carries its reasoning in money — "your deductions exceed ₹X
 * so the old regime saves ₹Y" — and overriding is a first-class action, not
 * a hidden escape hatch.
 */
export default function RegimeStep({ persona, t, lang, regime, onChoose }: RegimeStepProps) {
  const both = compareForPersona(persona);
  const recommended = both.new.refundOrDue >= both.old.refundOrDue ? "new" : "old";
  const savings = Math.abs(both[recommended].refundOrDue - both[recommended === "new" ? "old" : "new"].refundOrDue);

  const reasoning =
    recommended === "old"
      ? t.regime.reasoningOldDeductions(
          formatMoney(both.old.totalDeductions, lang),
          formatMoney(savings, lang),
        )
      : t.regime.reasoningNewDefault(formatMoney(savings, lang));

  const card = (which: "new" | "old") => {
    const b = both[which];
    const isSelected = regime === which;
    const isBest = recommended === which;
    return (
      <button
        key={which}
        onClick={() => onChoose(which)}
        aria-pressed={isSelected}
        className={`text-left w-full rounded-2xl border-2 p-5 space-y-3 transition-colors ${
          isSelected
            ? "border-money bg-money-soft"
            : "border-line bg-paper-2 hover:border-money/50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-ink">
            {which === "new" ? t.regime.newRegimeName : t.regime.oldRegimeName}
          </span>
          {isBest && (
            <span className="flex items-center gap-1 text-[0.65rem] font-mono font-bold uppercase bg-money-soft text-money px-2 py-0.5 rounded border border-money/20">
              <BadgeCheck size={12} />
              {t.regime.recommendedBadge}
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <span className="block text-xs text-ink-2">{t.check.taxableIncome}</span>
          <span className="block text-sm font-semibold text-ink tabular">
            {formatMoney(b.taxableIncome, lang)}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="block text-xs text-ink-2">
            {b.refundOrDue >= 0 ? t.regime.refundLabel : t.regime.dueLabel}
          </span>
          <span
            className={`block text-2xl font-extrabold tabular tracking-tight ${
              b.refundOrDue >= 0 ? "text-money" : "text-alarm"
            }`}
          >
            {b.refundOrDue >= 0 ? "" : "−"}
            {formatMoney(Math.abs(b.refundOrDue), lang)}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          {t.regime.heading}
        </h2>
      </div>

      {savings > 0 && (
        <p className="recovery-callout p-4 text-sm font-medium leading-relaxed text-ink">
          {reasoning}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {card("new")}
        {card("old")}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onChoose(recommended)}
          className="w-full rounded-xl bg-money px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-money-deep"
        >
          {t.regime.acceptRecommendation}
        </button>
        <p className="text-xs text-ink-3 text-center leading-relaxed">
          {t.regime.overrideNote}
        </p>
      </div>
    </div>
  );
}
