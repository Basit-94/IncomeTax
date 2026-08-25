"use client";

import { Settings, Sun, Moon } from "lucide-react";
import { LANG_NATIVE, LANGS } from "../../lib/i18n";
import type { Lang } from "../../lib/types";

interface PortalHeaderProps {
  lang: Lang;
  theme: "dark" | "light";
  showConsole: boolean;
  changeLang: (l: Lang) => void;
  toggleTheme: () => void;
  setShowConsole: (v: boolean) => void;
}

export default function PortalHeader({
  lang,
  theme,
  showConsole,
  changeLang,
  toggleTheme,
  setShowConsole,
}: PortalHeaderProps) {
  return (
    <header className="border-b border-line bg-paper text-ink z-10 relative">
      {/* Top small banner */}
      <div className="bg-navy-dark px-4 py-1.5 text-[0.65rem] flex items-center justify-between font-mono text-ink-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-money rounded-full animate-pulse" />
          <span>GOVERNMENT OF INDIA &bull; INCOME TAX DEPARTMENT</span>
        </span>
        <span className="hidden md:inline">ASSESSMENT YEAR 2026-27</span>
      </div>
      
      <div className="px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="bg-paper-2 p-1.5 rounded-[4px] border border-line flex items-center justify-center">
            <span className="font-extrabold text-money text-lg tracking-tight font-sans">
              e-Filing
            </span>
          </div>
          <div className="h-6 w-[1px] bg-line hidden md:block" />
          <div className="space-y-0.5">
            <h1 className="font-bold text-sm tracking-wide text-ink uppercase">WAPSI DIRECT PORTAL</h1>
            <p className="text-[0.65rem] text-ink-2 tracking-wider">SECURE PUBLIC SERVICE PLATFORM</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* Lang switcher */}
          <div className="flex bg-paper-2 border border-line rounded p-0.5 text-xs font-mono">
            {LANGS.map(l => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  lang === l ? "bg-money text-[#FFFFFF] font-semibold shadow-sm" : "text-ink-2 hover:bg-slate-200"
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
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <>
                <Sun size={14} className="text-money" />
                <span>LIGHT</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-money" />
                <span>DARK</span>
              </>
            )}
          </button>

          {/* Reviewer Settings Gear */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="p-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
          >
            <Settings size={14} className={showConsole ? "animate-spin" : ""} />
            <span>SANDBOX</span>
          </button>
        </div>
      </div>
    </header>
  );
}
