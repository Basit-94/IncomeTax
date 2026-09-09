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
    <footer className="w-full !max-w-none !mx-0 !mb-0 mt-16 sm:mt-24 md:mt-28 bg-[var(--banner-bg)] border-t border-white/10 text-[var(--banner-fg)] font-mono text-[0.72rem] py-6 px-4 sm:px-8 z-10 print:hidden select-none">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        {/* Left: Brand, AY, and Compliance Statement */}
        <div className="flex flex-wrap items-center gap-3 text-center md:text-start justify-center md:justify-start">
          <span className="flex items-center gap-2 font-bold text-on-ink tracking-wider text-xs">
            <span className="h-2 w-2 rounded-full bg-[#5EE6B0] animate-pulse" aria-hidden="true" />
            <span>{t.shell.productNativeName} ({t.shell.productName}) · {t.shell.taxYear}</span>
          </span>

          <span className="rounded bg-white/10 px-2 py-0.5 text-[9.5px] text-on-ink border border-white/15 font-semibold">
            {t.shell.independent}
          </span>

          <span className="text-[var(--banner-fg)]/80 hidden lg:inline text-[11.5px] leading-relaxed max-w-[55ch]">
            {ps.complianceNote}
          </span>
        </div>

        {/* Right: Statutory Badges & Builder attribution */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-[var(--banner-fg)]/80 justify-center md:justify-end">
          <a
            href="https://www.linkedin.com/in/abdul-basit-siddiqui-7a3a38309"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#0A66C2]/20 text-[11px] text-white border border-white/15 hover:border-[#0A66C2]/40 transition-all font-sans font-medium"
            title="Connect with Abdul Basit Siddiqui on LinkedIn"
          >
            <svg className="w-3.5 h-3.5 fill-current text-[#0A66C2] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z" />
            </svg>
            <span className="text-white/70 group-hover:text-white">Built by</span>
            <span className="font-semibold text-white">Abdul Basit Siddiqui</span>
          </a>
          <span className="text-[var(--banner-fg)]/40 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 text-[#5EE6B0] font-semibold">
            <CheckCircle2 size={12} />
            <span>{ps.languagesSupported}</span>
          </span>
          <span className="text-[var(--banner-fg)]/40 hidden sm:inline">•</span>
          <span>{ps.challanReady}</span>
          <span className="text-[var(--banner-fg)]/40 hidden sm:inline">•</span>
          <span className="text-[var(--banner-fg)]/80">{ps.sandboxMode}</span>
        </div>
      </div>
    </footer>
  );
}
