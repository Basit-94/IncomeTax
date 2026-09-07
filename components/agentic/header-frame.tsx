"use client";

/**
 * The one header frame every Wapsi surface starts with (user directive
 * 2026-09-05: "the toggle must be in the same spot in both modes"). The
 * Manual page (legacy PortalHeader), the Agentic landing and the Agentic chat
 * shell all render exactly this: a fixed-height banner strip, then a 64 px
 * full-width bar whose first two items are a fixed-width brand box and the
 * Agentic/Manual switch. Because the widths and heights are constants, the
 * switch has the same x and y on every route; only what comes after it varies.
 *
 * Redesign 2026-09-06: 64 px bar, 150 px brand box with the Munshi ji avatar
 * and the stacked "Wapsi / वापसी" wordmark; the banner in the new ink.
 */

import type { ReactNode } from "react";
import type { Dict } from "@/lib/i18n";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import { LOGO_FALLBACK } from "../brand/logo";
import { MunshiAvatar } from "../brand/munshi";
import ModeSwitch, { type WorkMode } from "./mode-switch";

/** The thin dark "independent prototype · tax year" strip. Fixed 28 px so the bar below it never moves. */
export function PrototypeBanner({ t }: { t: Dict }) {
  return (
    <div className="h-7 shrink-0 bg-[var(--banner-bg)] text-[var(--banner-fg)] px-4 text-[11px] flex items-center justify-between font-mono font-semibold" data-testid="prototype-banner">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5EE6B0] animate-pulse" aria-hidden="true" />
        <span>{t.shell.independent}</span>
      </span>
      <span className="hidden md:inline">{t.shell.taxYear}</span>
    </div>
  );
}

/** Munshi ji + the bilingual wordmark, stacked — the brand as the redesign draws it. */
export function BrandBox({ t, avatar = 38 }: { t: Dict; avatar?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <MunshiAvatar size={avatar} />
      <span className="flex flex-col leading-none">
        <span className="font-sans font-extrabold text-[20px] tracking-[-0.03em] text-ink-2">{t.shell.productName ?? LOGO_FALLBACK.name}</span>
        <span className="text-[11px] font-medium text-ink-3">{t.shell.productNativeName ?? LOGO_FALLBACK.native}</span>
      </span>
    </span>
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
  /** Phones only: a back circle or hamburger before the title (handoff 2, mobile header). */
  leading?: ReactNode;
  /** Phones only: replaces the brand box with a 16/800 title (workspace, dashboard, wizard…). */
  mobileTitle?: string;
  /** Phones only: the Agentic|Manual pill moves to a centred row under the bar (home, hub). */
  mobileSwitchBelow?: boolean;
}

/** Brand box width + gap are the constants that pin the switch's x. */
export const BRAND_BOX_CLASS = "w-[150px] max-md:w-auto shrink-0 flex items-center";
/** The bar's height; the switch's y follows from the banner (28 px) + this. */
export const HEADER_BAR_CLASS = "h-[64px] max-md:h-[56px] shrink-0 px-6 max-md:px-4 flex items-center gap-3.5 max-md:gap-2.5 text-ink";

export function HeaderBar({ t, s, mode, onModeChange, busy, onBrandClick, after, children, leading, mobileTitle, mobileSwitchBelow }: HeaderBarProps) {
  const brand = <BrandBox t={t} />;
  const brandClass = `${BRAND_BOX_CLASS} ${mobileTitle ? "max-md:hidden" : ""}`;
  return (
    <>
      <div className={HEADER_BAR_CLASS} data-testid="header-bar">
        {leading && <div className="md:hidden shrink-0 flex items-center">{leading}</div>}
        {onBrandClick ? (
          <button type="button" onClick={onBrandClick} className={`${brandClass} hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-0 p-0 text-left`} aria-label={t.shell.productName}>
            {brand}
          </button>
        ) : (
          <a href="/" className={`${brandClass} hover:opacity-80 transition-opacity`} aria-label={t.shell.productName}>
            {brand}
          </a>
        )}
        {mobileTitle && <span className="md:hidden flex-1 min-w-0 truncate text-[16px] font-extrabold text-ink">{mobileTitle}</span>}
        <div className={`shrink-0 ${mobileSwitchBelow ? "max-md:hidden" : ""}`} data-testid="mode-slot">
          <ModeSwitch mode={mode} onChange={onModeChange} s={s} busy={busy} />
        </div>
        {after}
        <div className="flex-1 min-w-0" />
        {children}
      </div>
      {mobileSwitchBelow && (
        <div className="md:hidden flex justify-center px-4 pt-1.5 pb-1">
          <ModeSwitch mode={mode} onChange={onModeChange} s={s} busy={busy} />
        </div>
      )}
    </>
  );
}
