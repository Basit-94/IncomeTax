"use client";

/**
 * The public landing page — what a visitor sees at "/" before signing in.
 *
 * Redesign 2026-09-06 (docs/redesign handoff, "Wapsi Landing Directions" turn 5,
 * option 5a — Lilac & Tangerine): Munshi ji introduces himself, a demo composer
 * types the way people actually write, three floating cards show one exchange
 * each, and three plain promises follow. Everything a visitor can press leads
 * to /signin. Copy goes through localize() (hi/ta) per the repo rule; the
 * refund shown is Sunita's real engine figure (₹8,400), nothing invented.
 */

import { useEffect, useState } from "react";
import { ArrowRight, Moon, Sun } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { PrototypeBanner } from "../agentic/header-frame";
import { LOGO_FALLBACK } from "../brand/logo";
import { Munshi, MunshiAvatar, MunshiBubble } from "../brand/munshi";
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

/** What the demo composer types, one sentence at a time — the register people really use, incl. Hindi. */
const TYPED = [
  "I got a job with a 12 LPA package and need to file my taxes",
  "Do I have to file if my salary is 5 lakh?",
  "मेरी सैलरी 5 लाख है, क्या मुझे रिटर्न भरना होगा?",
];

export default function MarketingLanding({ t, lang, changeLang, theme, toggleTheme, onSignIn, onDemo }: MarketingLandingProps) {
  const L = (s: string) => localize(s, lang);
  const typed = useTypewriter(TYPED);

  return (
    <div className="min-h-dvh flex flex-col text-ink">
      <PrototypeBanner t={t} />
      <header className="relative h-[76px] max-md:h-14 shrink-0 px-6 max-md:px-4 sm:px-12 flex items-center gap-7 max-md:gap-2.5">
        <a href="/" className="flex items-center gap-2.5 hover:opacity-80" aria-label={t.shell.productName}>
          <MunshiAvatar size={40} />
          <span className="font-extrabold text-[26px] max-md:text-[18px] tracking-[-0.03em] text-ink-2">{t.shell.productName ?? LOGO_FALLBACK.name}</span>
          <span className="text-sm font-medium text-ink-3">{t.shell.productNativeName ?? LOGO_FALLBACK.native}</span>
        </a>
        <div className="flex-1" />
        <nav className="hidden md:flex gap-6 text-[15px] font-medium text-ink-2" aria-label={t.shell.productName}>
          <a href="#meet" className="hover:text-ink">{L("Meet Munshi ji")}</a>
          <a href="#how" className="hover:text-ink">{L("How it works")}</a>
          <a href="#languages" className="hover:text-ink">{L("Languages")}</a>
        </nav>
        <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} className="shrink-0" />
        <button type="button" onClick={toggleTheme} className="glass-flat size-[38px] rounded-full text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer shrink-0" aria-label={theme === "dark" ? t.shell.light : t.shell.dark}>
          {theme === "dark" ? <Sun size={15} className="text-money" aria-hidden="true" /> : <Moon size={15} className="text-money" aria-hidden="true" />}
        </button>
        <button type="button" onClick={onSignIn} className="glass h-11 rounded-full px-5 text-[15px] font-semibold text-ink-2 hover:text-ink cursor-pointer shrink-0 max-md:h-9 max-md:rounded-[14px] max-md:px-3.5 max-md:text-[13px] max-md:font-bold max-md:bg-ink-surface max-md:text-on-ink max-md:border-0">
          {L("Sign in")}
        </button>
      </header>

      <main id="main-content" className="relative flex-1 px-6 max-md:px-5 sm:px-12 pt-10 max-md:pt-3 sm:pt-16 text-center max-md:text-start">
        {/* ---------------------------------------------------------------- hero -- */}
        <section id="meet" className="mx-auto max-w-5xl">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-ink-3">
            <span className="size-2 rounded-full bg-money" aria-hidden="true" /> {L("Your friendly CA, for your first salary")}
          </span>
          <h1 className="mx-auto mt-6 max-w-[15ch] text-[44px] sm:text-[64px] lg:text-[84px] font-extrabold leading-[1] tracking-[-0.04em] text-ink text-balance">
            {L("Namaste, I'm Munshi ji. Let's file your taxes.")}
          </h1>
          <p className="mx-auto mt-6 max-w-[46ch] text-lg sm:text-xl text-ink-2 leading-relaxed">
            {L("Tell me what's going on. I'll read what your employer and bank already reported, ask only what I can't find, and show you exactly what comes back.")}
          </p>

          {/* The demo composer: Munshi ji peeks from behind it, a bubble above-left, the sentence types itself. */}
          <div className="relative mx-auto mt-16 max-md:mt-[96px] max-w-[720px]">
            <div className="hidden lg:block absolute -left-[118px] -bottom-1.5 pointer-events-none" aria-hidden="true">
              <Munshi size={150} state="welcome" />
            </div>
            {/* M1: Munshi ji at 112 px over the composer, his line to the right. */}
            <div className="md:hidden absolute -left-2 -top-[96px] pointer-events-none" aria-hidden="true">
              <Munshi size={112} state="welcome" />
            </div>
            <MunshiBubble className="absolute left-6 -top-[58px] max-md:left-[104px] max-md:-top-[72px] !py-2.5 !px-4 text-sm max-md:text-[12.5px] font-semibold">
              {L("Just type it the way you'd tell a friend")} 👇
            </MunshiBubble>
            <button
              type="button"
              onClick={onSignIn}
              className="glass w-full rounded-3xl p-2.5 ps-6 flex items-center gap-3.5 text-start cursor-pointer hover:border-money/50"
              style={{ boxShadow: "0 30px 80px -30px rgba(255,122,26,.6)" }}
              aria-label={L("Ask Munshi ji")}
            >
              <span className="flex-1 min-w-0 truncate text-base sm:text-lg text-ink-3">
                {typed}
                <span className="inline-block w-0.5 h-5 align-[-3px] ms-0.5 bg-ink motion-safe:animate-[caret-blink_1s_steps(1)_infinite]" aria-hidden="true" />
              </span>
              <span className="btn-primary h-[54px] max-md:size-[42px] max-md:px-0 max-md:justify-center max-md:rounded-[13px] shrink-0 rounded-2xl px-6 text-base flex items-center gap-2.5">
                <span className="max-md:hidden">{L("Ask Munshi ji")}</span> <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
            <div className="mt-4 flex flex-wrap justify-center max-md:justify-start gap-2.5 max-md:gap-2">
              {["What is Form 16?", "New regime or old?", "I pay rent", "मेरी सैलरी 5 लाख है"].map((chip) => (
                <button key={chip} type="button" onClick={onSignIn} className="glass-flat rounded-full px-4 py-2 text-[13px] font-semibold text-ink-2 hover:text-ink hover:border-money/50 cursor-pointer">
                  {chip.startsWith("म") ? chip : L(chip)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- how a conversation goes -- */}
        <section id="how" className="mx-auto mt-24 max-w-[1080px] grid gap-5 lg:grid-cols-3 lg:items-start text-start">
          <div className="glass rounded-[28px] p-6 motion-safe:animate-[floaty_8s_ease-in-out_infinite] lg:mt-8">
            <div className="flex items-center gap-2.5">
              <MunshiAvatar size={36} />
              <span className="font-semibold text-[15px]">Munshi ji</span>
            </div>
            <MunshiBubble className="mt-3.5 !px-4 !py-3.5">
              {L("Your employer says you earned")} <b>₹4,20,000</b> {L("this year. Sounds right?")}
            </MunshiBubble>
            <div className="mt-3 flex gap-2">
              <span className="btn-primary rounded-full px-3.5 py-2 text-[13px]">{L("Yes, that's right")}</span>
              <span className="glass-flat rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink-2">{L("Not quite")}</span>
            </div>
          </div>
          <div className="ink-surface rounded-[28px] p-6 motion-safe:animate-[floaty_9s_ease-in-out_infinite_1s]">
            <div className="text-xs font-semibold uppercase tracking-[.06em] text-soft">{L("Munshi ji found")}</div>
            <div className="mt-2.5 font-extrabold text-[56px] leading-none tracking-[-0.04em] tabular-nums">₹8,400</div>
            <div className="mt-2 text-sm text-soft">{L("coming back to you. Below the rebate limit you owe nothing, so the tax they took comes home.")}</div>
          </div>
          <div className="glass rounded-[28px] p-6 motion-safe:animate-[floaty_7.5s_ease-in-out_infinite_.5s] lg:mt-10">
            <div className="flex items-center gap-2.5">
              <MunshiAvatar size={36} />
              <span className="font-semibold text-[15px]">Munshi ji</span>
            </div>
            <MunshiBubble className="mt-3.5 !px-4 !py-3.5">
              {L("Beta, do you have a")} <b>Form 16</b>? {L("It's the one or two pages HR sends around June.")}
            </MunshiBubble>
            <div className="mt-3 flex gap-2">
              <span className="btn-primary rounded-full px-3.5 py-2 text-[13px]">{L("Yes, I have it")}</span>
              <span className="glass-flat rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink-2">{L("What's that?")}</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ three promises -- */}
        <section id="languages" className="mx-auto mt-10 mb-18 max-w-[1080px] grid gap-5 sm:grid-cols-3 text-start">
          {[
            [L("Talks your language"), L("Type or talk, in any of 23 languages. Munshi ji never hands you a form first."), "rounded-[14px] bg-gradient-to-br from-soft to-money"],
            [L("Shows his working"), L("Every figure names who reported it. You confirm or correct, one tap each."), "rounded-full bg-gradient-to-br from-ink-2 to-money"],
            [L("Waits for your nod"), L("He never files or pays until you say so. Here, filing is simulated."), "rounded-[14px_50%_14px_50%] bg-gradient-to-br from-soft to-money-deep"],
          ].map(([title, body, shape]) => (
            <div key={title} className="glass-flat rounded-[28px] p-7">
              <div className={`size-11 ${shape}`} aria-hidden="true" />
              <h3 className="mt-4 mb-1.5 text-xl font-bold tracking-[-0.01em]">{title}</h3>
              <p className="text-[15px] text-ink-2 leading-relaxed">{body}</p>
            </div>
          ))}
        </section>
        <div className="mx-auto mb-14 flex justify-center">
          <button type="button" onClick={onDemo} className="glass-flat rounded-full px-5 py-2.5 text-sm font-semibold text-ink-2 hover:text-ink cursor-pointer">
            {L("Try a demo citizen")}
          </button>
        </div>
      </main>

      <footer className="relative px-6 sm:px-12 py-5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-3 border-t border-line">
        <span className="font-extrabold text-lg text-ink-2">
          {t.shell.productName ?? LOGO_FALLBACK.name} <span className="font-medium text-xs">{t.shell.productNativeName ?? LOGO_FALLBACK.native}</span>
        </span>
        <span>{L("Independent prototype · nothing is filed with any authority")}</span>
        <span>English · हिन्दी · தமிழ் · +20</span>
      </footer>
    </div>
  );
}

/** Types each sentence, holds it, clears it, moves to the next. Off (first sentence, static) under reduced motion. */
function useTypewriter(lines: readonly string[]): string {
  const [text, setText] = useState(lines[0]);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let line = 0;
    let i = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = lines[line];
      if (!deleting) {
        i += 1;
        setText(full.slice(0, i));
        if (i >= full.length) {
          deleting = true;
          timer = setTimeout(tick, 2200);
          return;
        }
        timer = setTimeout(tick, 38);
      } else {
        i -= 3;
        if (i <= 0) {
          i = 0;
          deleting = false;
          line = (line + 1) % lines.length;
          setText("");
          timer = setTimeout(tick, 350);
          return;
        }
        setText(full.slice(0, i));
        timer = setTimeout(tick, 18);
      }
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [lines]);
  return text;
}
