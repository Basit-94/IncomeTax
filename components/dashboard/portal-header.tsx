"use client";

import { Sun, Moon, LayoutGrid, FileText, LogOut, User, ShieldCheck } from "lucide-react";
import { type Dict } from "../../lib/i18n";
import type { Lang } from "../../lib/types";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";
import { agenticStrings } from "@/lib/i18n/agenticStrings";
import { HeaderBar, PrototypeBanner } from "../agentic/header-frame";
import LanguageMenu from "../ui/language-menu";

interface PortalHeaderProps {
  lang: Lang;
  t: Dict;
  theme: "dark" | "light";
  changeLang: (l: Lang) => void;
  toggleTheme: () => void;
  onLogoClick?: () => void;
  /**
   * Hidden where the page already owns the language choice (onboarding), so the same task is
   * never offered twice on one screen. See the "one task, one control" rule in docs/DESIGN.md.
   */
  showLanguage?: boolean;
  /** Simple/Detailed switch - shown only while a return is open. The header is
      the ONE control for this task (user directive 2026-08-29). */
  mode?: "agentic" | "manual" | "simple" | "full";
  onModeChange?: (mode: "agentic" | "manual") => void;
  /** Authenticated citizen session */
  activeCitizen?: { name: string; pan: string } | null;
  currentView?: "hub" | "dashboard";
  onViewChange?: (view: "hub" | "dashboard") => void;
  onLogout?: () => void;
  onOpenVault?: () => void;
  /**
   * Rendered inside the shared application shell (components/agentic/app-shell.tsx),
   * which already carries the brand, the mode switch, language, theme and the
   * vault. This header then keeps only what the shell does not: the Hub /
   * Return switcher and the signed-in citizen strip (plan.md §6: "Avoid
   * duplicating the same navigation across the canvas and header").
   */
  inShell?: boolean;
}

export default function PortalHeader({
  lang,
  t,
  theme,
  changeLang,
  toggleTheme,
  onLogoClick,
  showLanguage = true,
  mode = "manual",
  onModeChange,
  activeCitizen,
  currentView,
  onViewChange,
  onLogout,
  onOpenVault,
  inShell = false,
}: PortalHeaderProps) {
  const ps = getPortalStrings(lang);

  if (inShell) {
    return (
      <header className="border-b border-line bg-paper text-ink z-30 relative print:hidden">
        <div className="px-4 py-2.5 max-w-6xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
          {activeCitizen && onViewChange && (
            <div className="flex items-center gap-1 rounded-xl border border-line bg-paper-2 p-1 font-sans text-xs">
              <button type="button" onClick={() => onViewChange("hub")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${currentView === "hub" ? "bg-paper text-money shadow-sm border border-line" : "text-ink-2 hover:text-ink"}`}>
                <LayoutGrid size={13} />
                <span>{ps.portalHub}</span>
              </button>
              <button type="button" onClick={() => onViewChange("dashboard")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${currentView === "dashboard" ? "bg-paper text-money shadow-sm border border-line" : "text-ink-2 hover:text-ink"}`}>
                <FileText size={13} />
                <span>{ps.myReturn}</span>
              </button>
            </div>
          )}
          {activeCitizen ? (
            <div className="flex items-center gap-2 min-w-0 ms-auto">
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-1 text-xs min-w-0">
                <User size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-ink truncate">{activeCitizen.name}</span>
                <span className="font-mono text-ink-3 hidden sm:inline">({activeCitizen.pan})</span>
              </div>
              {onLogout && (
                <button type="button" onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-line bg-paper-2 px-2.5 py-1 text-xs text-ink-2 hover:text-ink cursor-pointer">
                  <LogOut size={12} />
                  <span className="hidden sm:inline">{ps.logOut}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-ink-3 font-mono ms-auto">{t.shell.independent} · {t.shell.taxYear}</div>
          )}
        </div>
      </header>
    );
  }

  // The same frame the Agentic surfaces use, so the Agentic/Manual switch sits at the
  // identical x/y on every route (user directive 2026-09-05).
  const workMode = mode === "agentic" ? "agentic" : "manual";
  const hubReturnSwitcher = activeCitizen && onViewChange && (
    <div className="hidden md:flex items-center gap-1 rounded-xl border border-line bg-paper-2 p-1 font-sans text-xs shrink-0">
      <button
        type="button"
        onClick={() => onViewChange("hub")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
          currentView === "hub"
            ? "bg-paper text-money shadow-sm border border-line"
            : "text-ink-2 hover:text-ink"
        }`}
      >
        <LayoutGrid size={13} />
        <span>{ps.portalHub}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewChange("dashboard")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition cursor-pointer ${
          currentView === "dashboard"
            ? "bg-paper text-money shadow-sm border border-line"
            : "text-ink-2 hover:text-ink"
        }`}
      >
        <FileText size={13} />
        <span>{ps.myReturn}</span>
      </button>
    </div>
  );

  return (
    <header className="border-b border-line bg-paper text-ink z-30 relative print:hidden">
      <PrototypeBanner t={t} />

      {/* Row 1: the shared frame — brand box, Agentic/Manual switch, subtitle; theme toggle right */}
      <HeaderBar
        t={t}
        s={agenticStrings(lang)}
        mode={workMode}
        onModeChange={(m) => onModeChange?.(m)}
        onBrandClick={onLogoClick}
        after={
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <div className="h-6 w-[1px] bg-line" />
            <div className="space-y-0.5 min-w-0">
              <h1 className="font-bold text-sm tracking-wide text-ink truncate">{t.shell.subtitle}</h1>
              <p className="text-[0.65rem] text-ink-2 tracking-wider">{t.shell.taxYear}</p>
            </div>
          </div>
        }
      >
        {/* Desktop Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="hidden sm:flex px-2.5 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors items-center gap-1.5 text-xs font-mono cursor-pointer"
          aria-label={theme === "dark" ? t.shell.light : t.shell.dark}
        >
          {theme === "dark" ? (
            <>
              <Sun size={14} className="text-money" />
              <span className="hidden lg:inline">{t.shell.light}</span>
            </>
          ) : (
            <>
              <Moon size={14} className="text-money" />
              <span className="hidden lg:inline">{t.shell.dark}</span>
            </>
          )}
        </button>
      </HeaderBar>

      <div className="px-4 pb-2.5 sm:pb-3 max-w-6xl mx-auto w-full space-y-2.5">
        {/* Mobile Logged-in Hub / Return Switcher (< md) */}
        {activeCitizen && onViewChange && (
          <div className="flex md:hidden items-center rounded-xl border border-line bg-paper-2 p-1 font-sans text-xs w-full">
            <button
              type="button"
              onClick={() => onViewChange("hub")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition cursor-pointer ${
                currentView === "hub"
                  ? "bg-paper text-money shadow-sm border border-line"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              <LayoutGrid size={13} />
              <span>{ps.portalHub}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange("dashboard")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-paper text-money shadow-sm border border-line"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              <FileText size={13} />
              <span>{ps.myReturn}</span>
            </button>
          </div>
        )}

        {/* Row 2: Hub/Return switcher (desktop) + citizen identity badge on left, Action buttons on right */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/40">
          {hubReturnSwitcher}
          {/* Authenticated Citizen Badge */}
          {activeCitizen ? (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-1 text-xs min-w-0"
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold text-emerald-900 dark:text-emerald-200 truncate max-w-[100px] sm:max-w-[140px]">
                  {activeCitizen.name}
                </span>
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 shrink-0">
                  ({activeCitizen.pan})
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-1 text-[11px] font-semibold text-ink-3 hover:text-alarm hover:bg-alarm/10 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                  title={ps.logOut}
                >
                  <LogOut size={12} />
                  <span className="hidden sm:inline">{ps.logOut}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-ink-3 font-mono hidden sm:block">
              {t.shell.independent}
            </div>
          )}

          {/* Action buttons on right: Vault, Language, Theme (mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 ms-auto">
            {/* Citizen Tax Vault Button */}
            {onOpenVault && (
              <button
                type="button"
                onClick={onOpenVault}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-400/40 hover:border-amber-400/80 rounded-lg text-ink hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer shadow-xs shrink-0"
                title={ps.taxVault}
              >
                <ShieldCheck size={14} className="text-amber-500" />
                <span>{ps.taxVault}</span>
              </button>
            )}

            {showLanguage && (
              <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} />
            )}

            {/* Mobile Theme Toggler (< sm) */}
            <button
              onClick={toggleTheme}
              className="sm:hidden px-2.5 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center text-xs font-mono cursor-pointer shrink-0"
              aria-label={theme === "dark" ? t.shell.light : t.shell.dark}
            >
              {theme === "dark" ? (
                <Sun size={14} className="text-money" />
              ) : (
                <Moon size={14} className="text-money" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
