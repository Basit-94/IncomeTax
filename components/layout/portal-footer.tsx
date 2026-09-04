"use client";

import { CheckCircle2 } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";

interface PortalFooterProps {
  t: Dict;
  lang: Lang;
}

export default function PortalFooter({ t, lang }: PortalFooterProps) {
  const ps = getPortalStrings(lang);

  return (
    <footer className="w-full !max-w-none !mx-0 !mb-0 mt-16 sm:mt-24 md:mt-28 bg-[#0a101d] dark:bg-[#060a14] border-t border-slate-800/80 text-slate-300 font-mono text-[0.72rem] py-6 px-4 sm:px-8 z-10 print:hidden select-none">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        {/* Left: Brand, AY, and Compliance Statement */}
        <div className="flex flex-wrap items-center gap-3 text-center md:text-start justify-center md:justify-start">
          <span className="flex items-center gap-2 font-bold text-white tracking-wider text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>{t.shell.productNativeName} ({t.shell.productName}) · {t.shell.taxYear}</span>
          </span>

          <span className="rounded bg-white/10 px-2 py-0.5 text-[9.5px] text-slate-200 border border-white/15 font-semibold">
            {t.shell.independent}
          </span>

          <span className="text-slate-400 hidden lg:inline text-[11.5px] leading-relaxed max-w-[55ch]">
            {ps.complianceNote}
          </span>
        </div>

        {/* Right: Statutory Badges */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-slate-400 justify-center md:justify-end">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 size={12} />
            <span>{ps.languagesSupported}</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>{ps.challanReady}</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400">{ps.sandboxMode}</span>
        </div>
      </div>
    </footer>
  );
}
