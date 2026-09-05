"use client";

/**
 * The one header frame every Wapsi surface starts with (user directive
 * 2026-09-05: "the toggle must be in the same spot in both modes"). The
 * Manual page (legacy PortalHeader), the Agentic landing and the Agentic chat
 * shell all render exactly this: a fixed-height banner strip, then a 56 px
 * full-width bar whose first two items are a fixed-width brand box and the
 * Agentic/Manual switch. Because the widths and heights are constants, the
 * switch has the same x and y on every route; only what comes after it varies.
 */

import type { ReactNode } from "react";
import type { Dict } from "@/lib/i18n";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import { LogoMark } from "../brand/logo";
import ModeSwitch, { type WorkMode } from "./mode-switch";

/** The thin dark "independent prototype · tax year" strip. Fixed 28 px so the bar below it never moves. */
export function PrototypeBanner({ t }: { t: Dict }) {
  return (
    <div className="h-7 shrink-0 bg-[#0a101d] dark:bg-[#060a14] border-b border-white/10 px-4 text-[0.68rem] flex items-center justify-between font-mono text-slate-300 dark:text-slate-300" data-testid="prototype-banner">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
        <span className="font-semibold">{t.shell.independent}</span>
      </span>
      <span className="hidden md:inline font-semibold">{t.shell.taxYear}</span>
    </div>
  );
}

export interface HeaderBarProps {
  t: Dict;
  s: AgenticStrings;
  mode: WorkMode;
  onModeChange: (mode: WorkMode) => void;
  busy?: boolean;
  /** Brand click; when absent the brand is a plain link to "/". */
  onBrandClick?: () => void;
  /** Rendered immediately after the switch (e.g. the legacy subtitle block). */
  after?: ReactNode;
  /** The right-hand cluster. */
  children?: ReactNode;
}

/** Brand box width + gap are the constants that pin the switch's x. */
export const BRAND_BOX_CLASS = "w-[128px] shrink-0 flex items-center";

export function HeaderBar({ t, s, mode, onModeChange, busy, onBrandClick, after, children }: HeaderBarProps) {
  const brand = <LogoMark t={t} size="sm" />;
  return (
    <div className="h-[56px] shrink-0 px-4 flex items-center gap-3 bg-paper text-ink" data-testid="header-bar">
      {onBrandClick ? (
        <button type="button" onClick={onBrandClick} className={`${BRAND_BOX_CLASS} hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-0 p-0 text-left`} aria-label={t.shell.productName}>
          {brand}
        </button>
      ) : (
        <a href="/" className={`${BRAND_BOX_CLASS} hover:opacity-80 transition-opacity`} aria-label={t.shell.productName}>
          {brand}
        </a>
      )}
      <div className="shrink-0" data-testid="mode-slot">
        <ModeSwitch mode={mode} onChange={onModeChange} s={s} busy={busy} />
      </div>
      {after}
      <div className="flex-1 min-w-0" />
      {children}
    </div>
  );
}
