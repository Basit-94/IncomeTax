"use client";

import { Settings, Sun, Moon, UserRound } from "lucide-react";
import type { Regime } from "../../lib/engine/types";
import { formatMoney } from "../../lib/money";
import { type Dict } from "../../lib/i18n";
import { UI_MODES, type UiMode } from "../../lib/mode";
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
  /** Agentic/Manual switch (plan D5). The header is the ONE control for this task
      (user directive 2026-08-29); it follows the account, not the page. */
  uiMode?: UiMode;
  onUiModeChange?: (mode: UiMode) => void;
  /** Opens the profile slide-over ("My documents and details" lives there, not in the grid). */
  onOpenProfile?: () => void;
  /**
   * The regime toggle preview: both regimes' payable figures from the exact-paise
   * engine, with the active one pressed. Shown only while a return is open.
   */
  regimePreview?: { regime: Regime; newTax: number; oldTax: number; onChange: (regime: Regime) => void };
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
  uiMode,
  onUiModeChange,
  onOpenProfile,
  regimePreview,
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
        {/* WCAG 1.4.10: the row wraps at 320px so the switch drops onto its own
            line instead of pushing the page wider than the viewport. */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center space-x-3">
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

          {uiMode && onUiModeChange && (
            <div className="seg ms-auto" role="group" aria-label="Agentic or Manual" data-testid="mode-switch">
              {UI_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="min-h-[44px] min-w-[44px]"
                  aria-pressed={uiMode === m}
                  data-mode={m}
                  onClick={() => uiMode !== m && onUiModeChange(m)}
                >
                  {m === "agentic" ? t.common.modeAgentic : t.common.modeManual}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: the remaining controls, right-aligned */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {regimePreview && (
            <div className="seg" role="group" aria-label="Tax regime" data-testid="regime-preview">
              {(["new", "old"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className="min-h-[44px] flex items-baseline gap-2"
                  aria-pressed={regimePreview.regime === r}
                  data-regime={r}
                  onClick={() => regimePreview.regime !== r && regimePreview.onChange(r)}
                >
                  <span>{r === "new" ? "New" : "Old"}</span>
                  <span className="font-mono text-[11px] tabular-nums opacity-80">
                    {formatMoney(r === "new" ? regimePreview.newTax : regimePreview.oldTax, lang)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {showLanguage && (
            <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} />
          )}

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="min-h-[44px] px-3 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
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
            className="min-h-[44px] px-3 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
          >
            <Settings size={14} className={showConsole ? "animate-spin" : ""} />
            <span>{t.shell.sandbox}</span>
          </button>

          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="My documents and details"
              data-testid="profile-button"
              className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              <UserRound size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
