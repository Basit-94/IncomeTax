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
}

export default function ProfileStrip({ persona, lang, t, onLogOut }: ProfileStripProps) {
  return (
    <div className="surface-panel flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
      <div className="space-y-1 flex-1">
        <div className="flex items-center space-x-2">
          <span className="rounded-full border border-line bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-ink-2">
            PAN: {persona.pan}
          </span>
          <span className="text-xs font-bold text-ink leading-none">
            {persona.name} ({localize(persona.occupation, lang)})
          </span>
        </div>
        <p className="text-xs text-ink-2">
          <strong>{t.dashboard.filingStatusLabel} {persona.assessmentYear}:</strong>{" "}
          {localize(persona.situation, lang)}
        </p>
      </div>

      <button
        onClick={onLogOut}
        className="text-xs border border-line bg-paper px-3 py-1.5 rounded hover:bg-paper-2 text-ink-2 hover:text-alarm transition-colors self-start md:self-auto flex items-center gap-1.5 font-mono font-semibold"
      >
        <RefreshCw size={12} />
        <span>{t.common.logOut}</span>
      </button>
    </div>
  );
}
