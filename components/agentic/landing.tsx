"use client";

/**
 * The Agentic landing (user request 2026-09-05, HeyGov reference image 1):
 * no sidebar, one serif question, one ask box, a row of icon shortcuts.
 * The chat shell (sidebar + transcript + inspector) appears only once a
 * question or a shortcut has started a run. Direction 13 tokens throughout.
 */

import type { ReactNode } from "react";
import { ArrowLeftRight, FileText, ListChecks, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import type { RunTask } from "@/lib/agentic/types";
import type { Lang } from "@/lib/types";
import LanguageMenu from "../ui/language-menu";
import type { ShellCitizen } from "./app-shell";
import { HeaderBar, PrototypeBanner } from "./header-frame";
import type { WorkMode } from "./mode-switch";
import { Composer } from "./workspace";

export interface AgenticLandingProps {
  s: AgenticStrings;
  t: Dict;
  lang: Lang;
  changeLang: (lang: Lang) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onModeChange: (mode: WorkMode) => void;
  citizen: ShellCitizen | null;
  onSignOut?: () => void;
  onOpenVault: () => void;
  onMyReturn: () => void;
  onStart: (input: { message?: string; task?: RunTask }) => void;
  /** Rendered instead of the ask box when there is no session yet. */
  signIn?: ReactNode;
  /** A truthful note under the ask box, e.g. storage unavailable. */
  notice?: string;
  busy?: boolean;
}

export default function AgenticLanding(props: AgenticLandingProps) {
  const { s, t, citizen } = props;
  const shortcuts: { task: RunTask | "vault"; label: string; icon: ReactNode }[] = [
    { task: "prepare_salaried_return", label: s.taskPrepareReturn, icon: <FileText size={22} aria-hidden="true" /> },
    { task: "compare_regimes", label: s.taskCompareRegimes, icon: <ArrowLeftRight size={22} aria-hidden="true" /> },
    { task: "reconcile_facts", label: s.taskReconcile, icon: <ListChecks size={22} aria-hidden="true" /> },
    { task: "vault", label: s.taxVault, icon: <ShieldCheck size={22} aria-hidden="true" /> },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      <PrototypeBanner t={t} />
      <header className="shrink-0" data-testid="landing-header">
      <HeaderBar t={t} s={s} mode="agentic" onModeChange={props.onModeChange} busy={props.busy}>
        <nav className="hidden lg:flex items-center gap-1.5 shrink-0" aria-label={t.shell.productName}>
          <button type="button" onClick={props.onMyReturn} className="h-[38px] whitespace-nowrap rounded-full border border-line bg-paper-2 px-4 text-sm text-ink hover:border-money/60 hover:shadow-sm cursor-pointer">
            {s.myReturn}
          </button>
          <button type="button" onClick={props.onOpenVault} className="h-[38px] whitespace-nowrap rounded-full border border-line bg-paper-2 px-4 text-sm text-ink hover:border-money/60 hover:shadow-sm cursor-pointer">
            {s.taxVault}
          </button>
          <span className="w-px h-6 bg-line mx-1" aria-hidden="true" />
        </nav>
        <LanguageMenu lang={props.lang} onChange={props.changeLang} label={t.shell.language} className="shrink-0" />
        <button type="button" onClick={props.toggleTheme} className="size-[38px] rounded-full border border-line bg-paper-2 text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer shrink-0" aria-label={props.theme === "dark" ? t.shell.light : t.shell.dark}>
          {props.theme === "dark" ? <Sun size={15} className="text-money" aria-hidden="true" /> : <Moon size={15} className="text-money" aria-hidden="true" />}
        </button>
        {citizen && (
          <div className="hidden sm:flex items-center gap-2 h-[38px] rounded-full border border-line bg-paper-2 ps-1 pe-2 min-w-0">
            <span className="size-7 shrink-0 rounded-full bg-amber-bg border border-amber-500/40 text-amber-700 dark:text-amber-300 font-sans font-bold text-[11px] flex items-center justify-center" aria-hidden="true">
              {citizen.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <span className="text-sm font-semibold text-ink truncate max-w-[10rem]">{citizen.name}</span>
            {props.onSignOut && (
              <button type="button" onClick={props.onSignOut} className="size-7 flex items-center justify-center rounded-full text-ink-3 hover:text-ink cursor-pointer" aria-label={s.signOut} title={s.signOut}>
                <LogOut size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </HeaderBar>
      </header>

      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-1 text-xs text-ink-2">
            <span className="size-1.5 rounded-full bg-money" aria-hidden="true" /> {s.simulatedBadge}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-ink text-balance">
            {s.welcomeTitle}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-ink-2 leading-relaxed max-w-2xl mx-auto">{s.welcomeBody}</p>

          {props.signIn ?? (
            <>
              <Composer s={s} lang={props.lang} disabled={!!props.busy} onSubmit={(message) => props.onStart({ message })} variant="ask" placeholder={s.landingPlaceholder} />
              <div className="flex flex-wrap justify-center gap-6 sm:gap-10 pt-2">
                {shortcuts.map((sc) => (
                  <button
                    key={sc.task}
                    type="button"
                    onClick={() => (sc.task === "vault" ? props.onOpenVault() : props.onStart({ task: sc.task }))}
                    className="group flex flex-col items-center gap-2.5 w-28 text-sm text-ink leading-tight cursor-pointer"
                  >
                    <span className="size-16 rounded-full border border-line bg-paper-2 shadow-sm flex items-center justify-center text-ink group-hover:border-money/60 group-hover:shadow transition">
                      {sc.icon}
                    </span>
                    <span>{sc.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {props.notice && <p className="text-sm text-ink-2 leading-relaxed max-w-md mx-auto">{props.notice}</p>}
        </div>
      </main>
    </div>
  );
}
