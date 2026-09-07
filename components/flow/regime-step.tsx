"use client";

import React from "react";
import { BadgeCheck } from "lucide-react";
import type { Persona, Lang } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import type { OnboardingProfile } from "../../lib/onboarding";
import { getPersonalization } from "../../lib/onboarding";
import { formatMoney } from "../../lib/money";
import { compareForPersona } from "../../lib/return/compute";
import { MunshiAvatar } from "../brand/munshi";
import { regimeReaction } from "../../lib/munshi-state";

interface RegimeStepProps {
  persona: Persona;
  t: Dict;
  lang: Lang;
  regime: "new" | "old";
  onboardingProfile?: OnboardingProfile | null;
  onChoose: (regime: "new" | "old") => void;
}

/**
 * One screen, both outcomes, computed live by compareRegimes(). The
 * recommendation carries its reasoning in money — "your deductions exceed ₹X
 * so the old regime saves ₹Y" — and overriding is a first-class action, not
 * a hidden escape hatch.
 */
export default function RegimeStep({ persona, t, lang, regime, onboardingProfile, onChoose }: RegimeStepProps) {
  const both = compareForPersona(persona);
  const [interacted, setInteracted] = React.useState(false);
  const choose = (which: "new" | "old") => { setInteracted(true); onChoose(which); };
  const reaction = regimeReaction(interacted ? regime : null, { new: both.new.refundOrDue, old: both.old.refundOrDue });
  const personalization = onboardingProfile ? getPersonalization(onboardingProfile) : null;
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
        onClick={() => choose(which)}
        aria-pressed={isSelected}
        className={`text-left w-full rounded-[22px] border-2 p-[22px] space-y-3 transition-colors cursor-pointer ${
          isSelected
            ? "border-money bg-amber-bg"
            : "border-glass-edge bg-glass hover:border-money/50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-base text-ink">
            {which === "new" ? t.regime.newRegimeName : t.regime.oldRegimeName}
          </span>
          {isBest && (
            <span className="flex items-center gap-1 text-xs font-bold bg-ok-soft text-ok-ink px-2.5 py-1 rounded-full">
              <BadgeCheck size={12} />
              {t.regime.recommendedBadge}
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <span className="block text-xs font-bold text-ink-3">{t.check.taxableIncome}</span>
          <span className="block text-lg font-extrabold text-ink tabular tracking-[-0.02em]">
            {formatMoney(b.taxableIncome, lang)}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="block text-xs font-bold text-ink-3">
            {b.refundOrDue >= 0 ? t.regime.refundLabel : t.regime.dueLabel}
          </span>
          <span
            className={`block text-[30px] leading-none font-extrabold tabular tracking-[-0.03em] ${
              b.refundOrDue >= 0 ? "text-ok" : "text-bad"
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
        <h2 className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
          {t.regime.heading}
        </h2>
      </div>

      {savings > 0 && (
        <p className="recovery-callout flex items-start gap-2.5 px-[18px] py-3.5 text-sm font-medium leading-relaxed text-amber-ink">
          <MunshiAvatar key={`${regime}-${reaction}`} size={28} state={reaction} />
          <span>{reasoning}</span>
        </p>
      )}

      {personalization && (
        <div className="surface-panel space-y-1 p-4">
          <p className="text-xs font-bold text-money">
            {t.onboarding.tailoredBadge}
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            {personalization.regimeLens === "check_claims"
              ? t.onboarding.claimsRegimeValue
              : t.onboarding.compareRegimeValue}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {card("new")}
        {card("old")}
      </div>

      <div className="space-y-3 max-md:pb-24">
        <div className="md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)]">
          <button
            onClick={() => choose(recommended)}
            className="btn-primary w-full rounded-[14px] h-[50px] px-6 text-[14.5px] transition-colors cursor-pointer"
          >
            {t.regime.acceptRecommendation}
          </button>
        </div>
        <p className="text-xs text-ink-3 text-center leading-relaxed">
          {t.regime.overrideNote}
        </p>
      </div>
    </div>
  );
}
