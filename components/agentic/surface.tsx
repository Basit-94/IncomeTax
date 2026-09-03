"use client";

/**
 * The agentic surface (plan §3.8). Hero until the first message; then a two-column chat:
 * transcript with the composer at its foot, and the Progress / Outputs / Context panel.
 * Content is never gated on animation (repo rule): the morph is a layout transition
 * around elements that are already there.
 */
import { useEffect, useState } from "react";
import { LazyMotion, domMax, m } from "motion/react";
import { dict, isLang } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { localize } from "@/components/mock-i18n";
import { updatePreferences, useUser } from "@/lib/user-context";
import AgenticHeader from "./agentic-header";
import Composer from "./composer";
import Hero from "./hero";
import HistoryDrawer from "./history-drawer";
import SidePanel from "./side-panel";
import Transcript from "./transcript";
import { useRun } from "./use-run";

export default function AgenticSurface() {
  const { user, setUser } = useUser();
  const [lang, setLang] = useState<Lang>(user.lang);
  const [theme, setTheme] = useState<"light" | "dark">(user.theme);
  const [historyOpen, setHistoryOpen] = useState(false);
  const run = useRun();
  const t = dict(lang);
  const L = (s: string) => localize(s, lang);
  const inChat = run.events.length > 0;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wapsi_lang");
      if (saved && isLang(saved)) setLang(saved);
      const savedTheme = localStorage.getItem("wapsi_theme");
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);

  const changeLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem("wapsi_lang", next);
      window.dispatchEvent(new Event("wapsi_lang_change"));
    } catch {
      /* cosmetic */
    }
    void updatePreferences({ lang: next }).then((updated) => updated && setUser(updated));
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("wapsi_theme", next);
    } catch {
      /* cosmetic */
    }
    void updatePreferences({ theme: next }).then((updated) => updated && setUser(updated));
  };

  return (
    <LazyMotion features={domMax} strict>
      <div className="service-shell flex min-h-dvh flex-col text-ink" dir={t.dir === "rtl" ? "rtl" : "ltr"}>
        <AgenticHeader lang={lang} theme={theme} onLang={changeLang} onTheme={toggleTheme} onHistory={() => setHistoryOpen(true)} />
        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onOpenRun={(id) => {
            setHistoryOpen(false);
            void run.load(id);
          }}
        />

        {!inChat ? (
          <m.main layout key="hero" className="flex-1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Hero lang={lang} name={user.onboarding ? undefined : user.username} onSubmit={run.send} />
          </m.main>
        ) : (
          <m.main
            layout
            key="chat"
            className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            data-testid="chat-shell"
          >
            <section className="flex min-h-0 flex-col" aria-label="Conversation">
              <div className="mb-3 flex items-center gap-2 border-b border-line pb-2">
                <h1 className="truncate text-sm font-bold text-ink">{run.view.title || L("Your situation")}</h1>
                <span className="ms-auto font-mono text-[0.68rem] uppercase tracking-wider text-ink-3" data-testid="run-status">
                  {run.view.status}
                </span>
                <button type="button" onClick={run.reset} className="rounded border border-line bg-paper-2 px-2 py-1 text-xs font-semibold text-ink-2 hover:bg-paper-3" data-testid="new-chat">
                  {L("New chat")}
                </button>
              </div>
              <div className="flex-1">
                <Transcript view={run.view} busy={run.busy} onAnswer={run.answer} onSkip={run.skip} onConfirm={run.confirm} onCancel={run.cancel} problem={run.problem} />
              </div>
              <div className="sticky bottom-0 mt-4 bg-paper/90 pb-2 pt-2 backdrop-blur">
                <Composer lang={lang} placeholder={L("Add anything, or answer above")} buttonLabel={L("Send")} disabled={run.busy} onSubmit={run.send} />
                <p className="mt-2 text-center text-[0.68rem] text-ink-3">
                  {L("Figures come from the tax engine. Nothing is filed until you press the button on the confirmation card.")}
                </p>
              </div>
            </section>
            <div className="lg:sticky lg:top-4 lg:self-start">
              <SidePanel view={run.view} />
            </div>
          </m.main>
        )}
      </div>
    </LazyMotion>
  );
}
