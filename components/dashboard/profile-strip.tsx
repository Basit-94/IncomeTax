"use client";

import { RefreshCw } from "lucide-react";
import type { Persona, Lang } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { localize } from "../mock-i18n";

interface ProfileStripProps {
  persona: Persona;
  lang: Lang;
  t: Dict;
  onLogOut: () => void;
  isRealMode?: boolean;
  /** The hero carries the one remaining chrome job: re-opening onboarding. */
  onEditOnboarding?: () => void;
  /** The anti-phishing phrase (T2.1): shown ONLY on a live server session. */
  greeting?: string;
}

export default function ProfileStrip({
  persona,
  lang,
  t,
  onLogOut,
  isRealMode = false,
  onEditOnboarding,
  greeting,
}: ProfileStripProps) {
  return (
    /* D13 hero: the cover sits directly on the graph paper - no card box. */
    <div className="flex flex-col justify-between gap-4 px-1 pt-4 pb-1 md:flex-row md:items-start print:hidden">
      {/* D13 cover voice: the rotated case-file stamp, then the person as the
          headline - this page is about them, not about the portal. */}
      <div className="space-y-2 flex-1">
        <span className="stamp-chip">
          PAN {persona.pan || "[PENDING]"} &middot; TAX YEAR {persona.assessmentYear} &middot; {isRealMode ? "SELF-REPORTED" : localize(persona.occupation, lang).toUpperCase()}
        </span>
        <h1 className="text-[27px] font-bold leading-tight tracking-tight text-ink">
          {persona.name || "Real User"}
        </h1>
        <p className="max-w-[58ch] text-[15px] leading-snug text-ink-2">
          <strong className="font-semibold">{t.dashboard.filingStatusLabel} {persona.assessmentYear}:</strong>{" "}
          {isRealMode ? "Real User self-reported return declaration." : localize(persona.situation, lang)}
        </p>
        {greeting && (
          <p className="flex flex-wrap items-baseline gap-2" title={t.dashboard.greetingWhy}>
            <span className="cap">{t.dashboard.greetingLabel}</span>
            <span className="pencil text-[19px] leading-none text-ink">{greeting}</span>
            <span className="badge you">{t.login.signedInAs}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 md:items-end">
      {onEditOnboarding && (
        <button
          onClick={onEditOnboarding}
          className="text-sm font-semibold text-money hover:underline"
        >
          {t.onboarding.changeAnswers}
        </button>
      )}
      <button
        onClick={onLogOut}
        aria-label={t.common.logOut}
        className="text-xs border border-line bg-paper px-3 py-1.5 rounded hover:bg-paper-2 text-ink-2 hover:text-alarm transition-colors self-start md:self-auto flex items-center gap-1.5 font-mono font-semibold"
      >
        <RefreshCw size={12} />
        <span>{t.common.logOut}</span>
      </button>
      </div>
    </div>
  );
}
