"use client";

import { Settings, Sun, Moon } from "lucide-react";
import { LANG_NATIVE, LANGS, type Dict } from "../../lib/i18n";
import type { Lang } from "../../lib/types";

interface PortalHeaderProps {
  lang: Lang;
  t: Dict;
  theme: "dark" | "light";
  showConsole: boolean;
  changeLang: (l: Lang) => void;
  toggleTheme: () => void;
  setShowConsole: (v: boolean) => void;
  onLogoClick?: () => void;
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
}: PortalHeaderProps) {
  return (
    <header className="border-b border-line bg-paper text-ink z-10 relative print:hidden">
      {/* Top small banner */}
      <div className="bg-navy-dark px-4 py-2 text-[0.68rem] flex items-center justify-between font-mono text-paper/70">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-money" aria-hidden="true" />
          <span>{t.shell.independent}</span>
        </span>
        <span className="hidden md:inline">{t.shell.taxYear}</span>
      </div>
      
      <div className="px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left bg-transparent border-0 p-0 cursor-pointer"
          >
            <span className="font-extrabold text-money text-2xl tracking-tight font-sans">
              {t.shell.productName}
            </span>
            <span className="text-sm text-ink-2">{t.shell.productNativeName}</span>
          </button>
          <div className="h-6 w-[1px] bg-line hidden md:block" />
          <div className="space-y-0.5">
            <h1 className="font-bold text-sm tracking-wide text-ink">{t.shell.subtitle}</h1>
            <p className="text-[0.65rem] text-ink-2 tracking-wider">{t.shell.taxYear}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* Lang switcher */}
          <div className="flex bg-paper-2 border border-line rounded-full p-0.5 text-xs font-mono" aria-label={t.shell.language}>
            {LANGS.map(l => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    lang === l ? "bg-money text-white font-semibold shadow-sm" : "text-ink-2 hover:bg-slate-200"
                }`}
              >
                {LANG_NATIVE[l]}
              </button>
            ))}
          </div>

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
