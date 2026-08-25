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
    <div className="bg-white border border-line rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      <div className="space-y-1 flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono bg-slate-100 border border-line text-ink-2 px-2.5 py-0.5 rounded-full font-semibold">
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
