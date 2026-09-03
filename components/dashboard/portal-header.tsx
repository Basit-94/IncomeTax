"use client";

import { Settings, Sun, Moon, LayoutGrid, FileText, LogOut, User } from "lucide-react";
import { type Dict } from "../../lib/i18n";
import type { Lang } from "../../lib/types";
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
  mode?: "simple" | "full";
  onModeChange?: (mode: "simple" | "full") => void;
  /** Authenticated citizen session */
  activeCitizen?: { name: string; pan: string } | null;
  currentView?: "hub" | "dashboard";
  onViewChange?: (view: "hub" | "dashboard") => void;
  onLogout?: () => void;
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
  mode,
  onModeChange,
  activeCitizen,
  currentView,
  onViewChange,
  onLogout,
}: PortalHeaderProps) {
  const isHindi = lang === "hi";

  return (
    <header className="border-b border-line bg-paper text-ink z-10 relative print:hidden">
      {/* Top small banner */}
      <div className="bg-navy-dark px-4 py-2 text-[0.68rem] flex items-center justify-between font-mono text-paper/70">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-navy" aria-hidden="true" />
          <span>{t.shell.independent}</span>
        </span>
        <span className="hidden md:inline">{t.shell.taxYear}</span>
      </div>
      
      <div className="px-4 py-3.5 max-w-6xl mx-auto w-full space-y-3">
        {/* Row 1: brand left, Hub/Return switch in middle if logged in, Simple/Detailed switch in the top-right */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
          <div className="flex min-w-0 items-center space-x-3">
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

          {/* Logged-in Hub / Return Switcher */}
          {activeCitizen && onViewChange && (
            <div className="flex items-center gap-1 rounded-xl border border-line bg-paper-2 p-1 font-sans text-xs">
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
                <span>{isHindi ? "सेवा हब (7 कार्ड)" : "Portal Hub"}</span>
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
                <span>{isHindi ? "मेरा रिटर्न (ITR-1)" : "My Return"}</span>
              </button>
            </div>
          )}

          {/* Simple vs Detailed mode switch */}
          {mode && onModeChange && (
            <div className="seg ms-auto" role="group" aria-label={t.onboarding.modeQuestion}>
              {(["simple", "full"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="min-h-[38px] px-3 text-xs"
                  aria-pressed={mode === m}
                  onClick={() => mode !== m && onModeChange(m)}
                >
                  {m === "simple" ? t.common.modeSimple : t.common.modeDetailed}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: citizen identity badge, language, theme, and sandbox controls */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end pt-1 border-t border-line/40">
          {/* Authenticated Citizen Badge */}
          {activeCitizen && (
            <div className="me-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-1 text-xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold text-emerald-900 dark:text-emerald-200 max-w-[140px] truncate">
                  {activeCitizen.name}
                </span>
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  ({activeCitizen.pan})
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-1 text-[11px] font-semibold text-ink-3 hover:text-alarm hover:bg-alarm/10 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title={isHindi ? "लॉग आउट करें / दूसरा करदाता चुनें" : "Log out / Switch taxpayer"}
                >
                  <LogOut size={12} />
                  <span>{isHindi ? "लॉग आउट" : "Log out"}</span>
                </button>
              )}
            </div>
          )}

          {showLanguage && (
            <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} />
          )}

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            aria-label={theme === "dark" ? t.shell.light : t.shell.dark}
          >
            {theme === "dark" ? (
              <>
                <Sun size={14} className="text-money" />
                <span>{t.shell.light}</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-money" />
                <span>{t.shell.dark}</span>
              </>
            )}
          </button>

          {/* Reviewer Settings Gear */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="px-3 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
          >
            <Settings size={14} className={showConsole ? "animate-spin" : ""} />
            <span>{t.shell.sandbox}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
