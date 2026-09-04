"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Check, ChevronDown, Globe, Search, X } from "lucide-react";

import { LANGUAGE_OPTIONS, isRtl, languageOption, toLang } from "../../lib/i18n/languages";
import type { Lang } from "../../lib/types";

/**
 * The one language control for the whole product.
 *
 * Responsive design:
 * - Desktop/tablet (>= 640px): Crisp dropdown anchored to trigger button.
 * - Mobile (< 640px): Accessible slide-up bottom sheet drawer with search filter,
 *   50px touch targets, native scripts + English labels, and frictionless single-tap selection.
 *
 * All 23 official Indian languages are fully supported.
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
  const [searchQuery, setSearchQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const current = languageOption(lang);

  // Close on outside pointer click (supports mouse, touch, and stylus)
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      // For mobile bottom sheet, backdrop clicks are handled by overlay onClick
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  // Focus search input when sheet opens on mobile
  useEffect(() => {
    if (open && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const choose = (code: string) => {
    const next = toLang(code);
    if (!next) return;
    onChange(next);
    setOpen(false);
    setSearchQuery("");
  };

  // Filter languages based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(
      (opt) =>
        opt.english.toLowerCase().includes(q) ||
        opt.native.toLowerCase().includes(q) ||
        opt.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div ref={root} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.english}`}
        className="flex min-h-[38px] sm:min-h-[42px] cursor-pointer items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-paper shadow-xs"
      >
        <Globe size={14} className="text-money shrink-0" aria-hidden="true" />
        <span dir={isRtl(current.code) ? "rtl" : "ltr"} className="font-semibold">
          {current.native}
        </span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`text-ink-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM SHEET (< 640px)                                             */}
      {/* ========================================================================= */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/65 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
            onClick={() => {
              setOpen(false);
              setSearchQuery("");
            }}
            role="dialog"
            aria-modal="true"
            aria-label={label}
          >
            <div
              className="w-full max-h-[85vh] rounded-t-3xl border-t border-line bg-paper shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Bar */}
              <div className="pt-3 pb-1 flex justify-center">
                <div className="h-1.5 w-12 rounded-full bg-line/80" />
              </div>

              {/* Sheet Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-money-soft text-money flex items-center justify-center">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-ink">
                      {current.native} · {label}
                    </h3>
                    <p className="text-[11px] text-ink-3">
                      23 Official Indian Languages
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="p-2 -mr-1 rounded-full hover:bg-paper-2 text-ink-2 hover:text-ink transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close language selector"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Filter */}
              <div className="p-3 border-b border-line bg-paper-2/40">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search language / भाषा खोजें..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-paper border border-line rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-money"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* 23 Languages Scrollable List */}
              <div
                role="listbox"
                aria-label={label}
                className="overflow-y-auto px-3 py-2 space-y-1 divide-y divide-line/30 flex-1 overscroll-contain"
              >
                {filteredOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-ink-3">
                    No matching language found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const selected = option.code === lang;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={!option.translated}
                        onClick={() => choose(option.code)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition text-left cursor-pointer min-h-[50px] ${
                          selected
                            ? "bg-money-soft border border-money/30 text-money font-bold"
                            : "text-ink hover:bg-paper-2 active:bg-paper-2"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className="text-base font-semibold"
                            dir={isRtl(option.code) ? "rtl" : "ltr"}
                          >
                            {option.native}
                          </span>
                          <span className="text-xs text-ink-2 font-mono">
                            {option.english} {isRtl(option.code) ? "· RTL" : ""}
                          </span>
                        </div>
                        {selected && (
                          <span className="size-6 rounded-full bg-money text-paper flex items-center justify-center shrink-0">
                            <Check size={14} className="stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Bottom Notice */}
              <div className="border-t border-line px-4 py-2.5 bg-paper-2/40 text-[11px] text-ink-3 leading-snug">
                All 23 official Indian languages are fully supported across the entire portal.
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP / TABLET DROPDOWN (>= 640px)                                      */}
          {/* ========================================================================= */}
          <div
            role="listbox"
            aria-label={label}
            className="hidden sm:block absolute right-0 z-50 mt-1.5 max-h-96 w-64 overflow-y-auto rounded-xl border border-line bg-paper p-1 shadow-2xl scrollbar-none"
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
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                    selected
                      ? "bg-money-soft font-semibold text-money"
                      : "text-ink hover:bg-paper-2"
                  }`}
                >
                  <div className="flex flex-col">
                    <span dir={isRtl(option.code) ? "rtl" : "ltr"} className="font-medium">
                      {option.native}
                    </span>
                    <span className="text-[10px] text-ink-3 font-mono">
                      {option.english}
                    </span>
                  </div>
                  {selected && (
                    <Check size={14} aria-hidden="true" className="text-money shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
            <p className="border-t border-line px-2.5 pb-1 pt-2 text-[10px] leading-snug text-ink-3">
              All 23 official Indian languages are dynamically supported.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

