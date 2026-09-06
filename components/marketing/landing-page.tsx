"use client";

/**
 * The public landing page — what a visitor sees at "/" before signing in
 * (user request 2026-09-06: "an awesome looking, well designed landing page").
 *
 * Design notes (docs/DESIGN.md Direction 13 + the HeyGov references):
 * - Palette and type are the site's own tokens: paper / ink / line / money /
 *   amber, the D13 serif for display, the grotesk for body, the mono for money.
 * - The signature is the thing Wapsi is actually about: a live "fact card" —
 *   one figure, who reported it, and the citizen's one decision — cycling
 *   through a demo return while the refund line stays put. No gradients, no
 *   stock illustration; the product's own material.
 * - Copy is the product's voice (docs/VOICE.md). One-off strings go through
 *   localize() with hi/ta, per the repo rule for component copy.
 * - Motion: one orchestrated element (the card), honouring reduced motion.
 */

import { useEffect, useState } from "react";
import { ArrowRight, Check, Moon, ShieldCheck, Sun, X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { Lang } from "@/lib/types";
import { PrototypeBanner } from "../agentic/header-frame";
import { LogoMark } from "../brand/logo";
import { localize } from "../mock-i18n";
import LanguageMenu from "../ui/language-menu";

export interface MarketingLandingProps {
  t: Dict;
  lang: Lang;
  changeLang: (l: Lang) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onSignIn: () => void;
  onDemo: () => void;
}

/** Sunita's demo return — the same figures the product itself computes (₹8,400 back). */
const FACTS = [
  { label: "Salary from Infosys Ltd", amount: 420000, reporter: "Reported by your employer · Form 16" },
  { label: "Interest your savings account earned", amount: 1240, reporter: "Reported by your bank · AIS" },
  { label: "Tax already taken from your pay", amount: 8400, reporter: "Deducted by your employer · Form 26AS" },
] as const;

export default function MarketingLanding({ t, lang, changeLang, theme, toggleTheme, onSignIn, onDemo }: MarketingLandingProps) {
  const L = (s: string) => localize(s, lang);
  const [i, setI] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  // One orchestrated moment: a fact is "confirmed", then the next one slides in. Off under reduced motion.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const confirmAt = setTimeout(() => setConfirmed(true), 2600);
    const next = setTimeout(() => {
      setConfirmed(false);
      setI((n) => (n + 1) % FACTS.length);
    }, 4200);
    return () => {
      clearTimeout(confirmAt);
      clearTimeout(next);
    };
  }, [i]);

  const fact = FACTS[i];

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      <PrototypeBanner t={t} />
      <header className="h-[56px] shrink-0 px-4 sm:px-6 flex items-center gap-3">
        <a href="/" className="flex items-center shrink-0 hover:opacity-80" aria-label={t.shell.productName}>
          <LogoMark t={t} size="sm" />
        </a>
        <div className="flex-1" />
        <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} className="shrink-0" />
        <button type="button" onClick={toggleTheme} className="size-[38px] rounded-full border border-line bg-paper-2 text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer shrink-0" aria-label={theme === "dark" ? t.shell.light : t.shell.dark}>
          {theme === "dark" ? <Sun size={15} className="text-money" aria-hidden="true" /> : <Moon size={15} className="text-money" aria-hidden="true" />}
        </button>
        <button type="button" onClick={onSignIn} className="h-[38px] rounded-full bg-ink text-paper px-5 text-sm font-bold hover:opacity-90 cursor-pointer shrink-0">
          {L("Sign in")}
        </button>
      </header>

      <main id="main-content" className="flex-1">
        {/* ---------------------------------------------------------------- hero -- */}
        <section className="px-4 sm:px-6 pt-10 sm:pt-16 pb-14">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="cap">{L("Income tax, in plain words")}</p>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-ink text-balance">
                {L("Your money, coming back.")}
              </h1>
              <p className="text-lg sm:text-xl text-ink-2 leading-relaxed max-w-xl">
                {L("Tell Wapsi what's going on — a new job, a form you don't recognise, a refund you're waiting on. It checks what's already on record about you, asks only what it can't find, shows every figure with its source, and never files without your say-so.")}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button type="button" onClick={onSignIn} className="inline-flex items-center gap-2 h-12 rounded-full bg-ink text-paper px-6 text-base font-bold hover:opacity-90 cursor-pointer">
                  {L("Sign in")} <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={onDemo} className="inline-flex items-center gap-2 h-12 rounded-full border border-line bg-paper-2 px-6 text-base font-semibold text-ink hover:border-money/60 hover:shadow-sm cursor-pointer">
                  {L("Try a demo citizen")}
                </button>
              </div>
              <p className="text-xs text-ink-3 font-mono">{t.shell.independent} · {t.shell.taxYear}</p>
            </div>

            {/* The signature: one fact, its source, one decision. */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[28px] bg-amber-bg/40 dark:bg-amber-bg/20 -z-10" aria-hidden="true" />
              <div className="rounded-2xl border border-line bg-paper-2 shadow-sm p-6 sm:p-7 space-y-5" aria-live="polite">
                <p className="cap">{L("One of your facts, as Wapsi shows it")}</p>
                <div key={i} className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
                  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink">{L(fact.label)}</p>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-bg text-amber-ink px-2.5 py-0.5 text-[11px] font-mono whitespace-nowrap">
                        <ShieldCheck size={11} aria-hidden="true" /> {L(fact.reporter)}
                      </p>
                    </div>
                    <p className="font-mono tabular-nums text-3xl sm:text-4xl text-ink ms-auto">{formatMoney(fact.amount, lang)}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${confirmed ? "bg-money text-paper" : "bg-ink text-paper"}`}>
                      <Check size={14} aria-hidden="true" /> {L("Yes, that's right")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink-2">
                      <X size={14} aria-hidden="true" /> {L("No, this is wrong")}
                    </span>
                  </div>
                </div>
                <div className="border-t border-line pt-4 flex items-baseline justify-between gap-4">
                  <p className="text-sm text-ink-2">{L("Coming back to you")}</p>
                  <p className="font-mono tabular-nums text-2xl text-money">{formatMoney(8400, lang)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- how a conversation goes -- */}
        <section className="px-4 sm:px-6 py-14 border-t border-line/60">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="space-y-4">
              <p className="cap">{L("How a conversation goes")}</p>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-ink text-balance">{L("You explain. It asks the few things it can't find. Then you decide.")}</h2>
              <p className="text-base text-ink-2 leading-relaxed">{L("No form to fill first. Documents are described in words you'd recognise, and a deduction only counts once there is a record behind it.")}</p>
            </div>
            <div className="space-y-3 max-w-2xl">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-amber-bg border border-amber-500/30 px-4 py-2.5 text-[15px] leading-relaxed text-ink">
                  {L("I got a job with a 12 LPA package, and I need to file my taxes. What's the best play here?")}
                </div>
              </div>
              <Bubble>{L("Got it — you're salaried, at about ₹12,00,000 a year. I'll check what your employer has already reported, ask you a few quick things, and only then show you the figures. Nothing is filed without your say-so.")}</Bubble>
              <Bubble accent>
                <p className="text-sm text-ink-2">{L("This one's about a piece of paper —")}</p>
                <p className="mt-1">{L("Do you have a document called Form 16?")}</p>
                <p className="mt-1 text-sm text-ink-2">{L("It's the certificate your employer gives you around June — one or two pages showing your salary for the year and the tax already deducted from it.")}</p>
              </Bubble>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- what's real, what isn't -- */}
        <section className="px-4 sm:px-6 py-14 border-t border-line/60">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="space-y-3 max-w-2xl">
              <p className="cap">{L("What's real here, and what isn't")}</p>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-ink text-balance">{L("Honest by construction.")}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [L("The arithmetic is real"), L("Every figure comes from one engine, pinned to 72 shared test vectors. The agent never rounds or invents a number.")],
                [L("Filing is simulated"), L("Nothing is sent to the Income Tax Department, UIDAI or any bank. You see exactly what would be filed, and it says so.")],
                [L("Your documents stay yours"), L("Uploads are encrypted in your vault and read only for the figures you ask about.")],
                [L("23 languages"), L("Hindi, Tamil, Bengali, Telugu and nineteen more — the same care in each.")],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-line bg-paper-2 p-5 space-y-2">
                  <p className="font-sans text-base font-bold text-ink">{title}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 sm:px-6 py-8 border-t border-line/60">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-sm text-ink-2">
          <LogoMark t={t} size="sm" />
          <p className="font-mono text-xs text-ink-3">{L("Independent prototype — nothing is filed or paid with any authority.")}</p>
          <button type="button" onClick={onSignIn} className="text-money font-semibold hover:underline cursor-pointer">
            {L("Prefer to do it yourself? Sign in and switch to Manual.")}
          </button>
        </div>
      </footer>
    </div>
  );
}

function Bubble({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 size-8 shrink-0 rounded-full bg-ink text-paper font-serif font-bold text-sm flex items-center justify-center" aria-hidden="true">W</span>
      <div className={`min-w-0 max-w-[85%] rounded-2xl rounded-tl-md border ${accent ? "border-amber-500/40" : "border-line"} bg-paper-2 px-4 py-3 text-[15px] leading-relaxed text-ink`}>{children}</div>
    </div>
  );
}
