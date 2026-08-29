"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";

import { LANGUAGE_OPTIONS, isRtl, languageOption, toLang } from "../../lib/i18n/languages";
import type { Lang } from "../../lib/types";

/**
 * The one language control for the whole product.
 *
 * A dropdown rather than the previous inline row: three languages fitted across a top bar,
 * twenty-three do not. It is also the *only* language control on any page — see the "one
 * task, one control" rule in docs/DESIGN.md. Onboarding used to carry a second one, which
 * meant the same job was offered twice on the same screen.
 *
 * All 23 languages carry dictionaries. Beyond English, Hindi and Tamil they are
 * model-generated translations awaiting native review (T0.5) — the menu footer says so,
 * because hiding that would misrepresent what the product supports.
 */
export default function LanguageMenu({
  lang,
  onChange,
  label = "Language",
  className = "",
}: {
  lang: Lang;
  onChange: (next: Lang) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = languageOption(lang);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code: string) => {
    const next = toLang(code);
    if (!next) return; // not translated yet — the option is disabled anyway
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.english}`}
        className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-paper"
      >
        <Globe size={13} className="text-ink-2" aria-hidden="true" />
        <span dir={isRtl(current.code) ? "rtl" : "ltr"}>{current.native}</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`text-ink-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-50 mt-1.5 max-h-80 w-60 overflow-y-auto rounded-xl border border-line bg-paper p-1 shadow-lg"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = option.code === lang;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={!option.translated}
                onClick={() => choose(option.code)}
                title={option.translated ? option.english : `${option.english} — not translated yet`}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  option.translated
                    ? "cursor-pointer text-ink hover:bg-paper-2"
                    : "cursor-not-allowed text-ink-3"
                } ${selected ? "bg-money-soft font-semibold text-money" : ""}`}
              >
                <span dir={isRtl(option.code) ? "rtl" : "ltr"}>{option.native}</span>
                {selected ? (
                  <Check size={14} aria-hidden="true" />
                ) : !option.translated ? (
                  <span className="font-mono text-[9px] uppercase tracking-wider">soon</span>
                ) : null}
              </button>
            );
          })}
          <p className="border-t border-line px-2.5 pb-1 pt-2 text-[10px] leading-snug text-ink-3">
            Beyond English, Hindi and Tamil these are machine translations, still being
            reviewed by human translators. Tax wording has to be right — if something reads
            wrongly in your language, trust the English.
          </p>
        </div>
      )}
    </div>
  );
}
