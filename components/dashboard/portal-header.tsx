"use client";

import { Settings, Sun, Moon, LayoutGrid, FileText, LogOut, User, ShieldCheck, Sparkles } from "lucide-react";
import { type Dict } from "../../lib/i18n";
import type { Lang } from "../../lib/types";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";
import { LogoMark } from "../brand/logo";
import LanguageMenu from "../ui/language-menu";

interface PortalHeaderProps {
  lang: Lang;
  t: Dict;
  theme: "dark" | "light";
  showConsole: boolean;
  changeLang: (l: Lang) => void;
  toggleTheme: () => void;
  setShowConsole: (v: boolean) => void;
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
}

export default function PortalHeader({
  lang,
  t,
  theme,
  showConsole,
  changeLang,
  toggleTheme,
  setShowConsole,
  onLogoClick,
  showLanguage = true,
  mode = "manual",
  onModeChange,
  activeCitizen,
  currentView,
  onViewChange,
  onLogout,
  onOpenVault,
}: PortalHeaderProps) {
  const ps = getPortalStrings(lang);

  return (
    <header className="border-b border-line bg-paper text-ink z-30 relative print:hidden">
      {/* Top small banner */}
      <div className="bg-[#0a101d] dark:bg-[#060a14] border-b border-white/10 px-4 py-1.5 text-[0.68rem] flex items-center justify-between font-mono text-slate-300 dark:text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="font-semibold">{t.shell.independent}</span>
        </span>
        <span className="hidden md:inline font-semibold">{t.shell.taxYear}</span>
      </div>
      
      <div className="px-4 py-2.5 sm:py-3 max-w-6xl mx-auto w-full space-y-2.5">
        {/* Row 1: brand left, Hub/Return switch in middle if logged in (desktop), Agentic/Manual switch in top-right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center space-x-3 shrink-0">
            <button
              onClick={onLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left bg-transparent border-0 p-0 cursor-pointer"
            >
              <LogoMark t={t} size="md" />
            </button>
            <div className="h-6 w-[1px] bg-line hidden md:block" />
            <div className="space-y-0.5 hidden sm:block">
              <h1 className="font-bold text-sm tracking-wide text-ink">{t.shell.subtitle}</h1>
              <p className="text-[0.65rem] text-ink-2 tracking-wider">{t.shell.taxYear}</p>
            </div>
          </div>

          {/* Desktop Logged-in Hub / Return Switcher */}
          {activeCitizen && onViewChange && (
            <div className="hidden md:flex items-center gap-1 rounded-xl border border-line bg-paper-2 p-1 font-sans text-xs">
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
          )}

          {/* Agentic vs Manual mode switch + desktop theme toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onModeChange && (
              <div className="seg" role="group" aria-label={ps.filingMode}>
                {(["agentic", "manual"] as const).map((m) => {
                  const isSelected = mode === m || (m === "manual" && (mode === "full" || !mode));
                  return (
                    <button
                      key={m}
                      type="button"
                      className="min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 text-xs flex items-center gap-1.5"
                      aria-pressed={isSelected}
                      onClick={() => onModeChange(m)}
                    >
                      {m === "agentic" && <Sparkles size={12} className="text-amber-500" />}
                      <span>
                        {m === "agentic" ? ps.agentic : ps.manual}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

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
          </div>
        </div>

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

        {/* Row 2: Citizen identity badge on left, Action buttons on right */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/40">
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

          {/* Action buttons on right: Vault, Language, Theme (mobile), Review tools */}
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

            {/* Reviewer Settings Gear */}
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="px-2.5 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer shrink-0"
              title={t.shell.sandbox}
            >
              <Settings size={14} className={showConsole ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{t.shell.sandbox}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
