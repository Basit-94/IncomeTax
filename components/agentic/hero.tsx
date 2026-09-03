"use client";

/**
 * The landing (plan §3.8): one line, one box, four chips. The chips insert text into the
 * box rather than running anything, so the first message is always the person's own.
 */
import { FileText, Scale, Mail, Sparkles } from "lucide-react";
import type { Lang } from "@/lib/types";
import { localize } from "@/components/mock-i18n";
import Composer from "./composer";

const CHIPS: { icon: typeof FileText; label: string; text: string }[] = [
  { icon: FileText, label: "File my return", text: "I want to file my income tax return for this year." },
  { icon: Scale, label: "Compare regimes", text: "Which tax regime is better for me, old or new?" },
  { icon: Mail, label: "I received a notice", text: "I got a letter from the income tax department and I am not sure what it means." },
  { icon: Sparkles, label: "Try a demo", text: "Show me a demo with a sample citizen so I can see how this works." },
];

export default function Hero({ lang, name, onSubmit }: { lang: Lang; name?: string; onSubmit: (text: string) => void }) {
  const L = (s: string) => localize(s, lang);
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-16 pt-14 text-center sm:pt-24" data-testid="hero">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-1 text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-money" aria-hidden="true" />
        {L("An assistant that does the filing, not just the talking")}
      </span>
      <h1 className="font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
        {L("Explain your situation")}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
        {name ? `${name}, ` : ""}
        {L("say it the way you would to a friend. The assistant works out what applies, asks only for what it cannot find, and files when you say so.")}
      </p>
      <div className="mt-8 w-full">
        <Composer
          lang={lang}
          size="lg"
          autoFocus
          placeholder={L('e.g. "I got a job with a 14 lakh package. What is the best play here?"')}
          buttonLabel={L("Ask")}
          onSubmit={onSubmit}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-start justify-center gap-3 sm:gap-6">
        {CHIPS.map(({ icon: Icon, label, text }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSubmit(L(text))}
            className="group flex w-24 flex-col items-center gap-2 bg-transparent text-center"
            data-testid="hero-chip"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-paper-2 text-ink transition-colors group-hover:border-money group-hover:text-money">
              <Icon size={18} />
            </span>
            <span className="text-xs font-semibold leading-tight text-ink-2 group-hover:text-ink">{L(label)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
