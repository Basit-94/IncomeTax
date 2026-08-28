"use client";

import { Settings, Sun, Moon } from "lucide-react";
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
}: PortalHeaderProps) {
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
      
      <div className="px-4 py-4 max-w-6xl mx-auto w-full space-y-3">
        {/* Row 1: brand left, the Simple/Detailed switch in the top-right corner
            (user-annotated position, 2026-08-29). */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left bg-transparent border-0 p-0 cursor-pointer"
            >
              <LogoMark t={t} size="md" />
            </button>
            <div className="h-6 w-[1px] bg-line hidden md:block" />
            <div className="space-y-0.5">
              <h1 className="font-bold text-sm tracking-wide text-ink">{t.shell.subtitle}</h1>
              <p className="text-[0.65rem] text-ink-2 tracking-wider">{t.shell.taxYear}</p>
            </div>
          </div>

          {mode && onModeChange && (
            <div className="seg shrink-0" role="group" aria-label={t.onboarding.modeQuestion}>
              {(["simple", "full"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => mode !== m && onModeChange(m)}
                >
                  {m === "simple" ? t.common.modeSimple : t.common.modeDetailed}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: the remaining controls, right-aligned */}
        <div className="flex items-center space-x-3 justify-end">
          {showLanguage && (
            <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} />
          )}

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="p-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
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
            className="p-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
          >
            <Settings size={14} className={showConsole ? "animate-spin" : ""} />
            <span>{t.shell.sandbox}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
