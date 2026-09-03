"use client";

import { useRouter } from "next/navigation";
import { History, LogOut, Moon, Sun, Vault } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import LanguageMenu from "@/components/ui/language-menu";
import { dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { updatePreferences, useUser } from "@/lib/user-context";
import ModeSwitch from "./mode-switch";

/**
 * The agentic surface's header: brand, the Agentic|Manual switch, language, theme, chat
 * history, the vault, sign out. Light on purpose: the page is the conversation.
 */
export default function AgenticHeader({
  lang,
  theme,
  onLang,
  onTheme,
  onHistory,
}: {
  lang: Lang;
  theme: "light" | "dark";
  onLang: (next: Lang) => void;
  onTheme: () => void;
  onHistory: () => void;
}) {
  const router = useRouter();
  const { user, setUser } = useUser();
  const t = dict(lang);

  const switchMode = async () => {
    const next = await updatePreferences({ mode: "manual" });
    if (next) setUser(next);
    router.push("/");
    router.refresh();
  };

  const signOut = async () => {
    try {
      localStorage.clear();
    } catch {
      /* storage unavailable */
    }
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/signin";
  };

  return (
    <header className="border-b border-line bg-paper-2/80 backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <button type="button" onClick={() => router.push("/app")} className="flex items-center gap-2 bg-transparent p-0 text-left">
          <LogoMark t={t} size="md" />
        </button>
        <ModeSwitch current="agentic" onChange={() => void switchMode()} labels={{ agentic: t.common.modeAgentic, manual: t.common.modeManual }} />
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <LanguageMenu lang={lang} onChange={onLang} label={t.shell.language} />
          <button
            type="button"
            onClick={onTheme}
            aria-label={theme === "dark" ? t.shell.light : t.shell.dark}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded border border-line bg-paper-2 px-3 font-mono text-xs text-ink-2 hover:bg-paper-3"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span className="hidden sm:inline">{theme === "dark" ? t.shell.light : t.shell.dark}</span>
          </button>
          <button
            type="button"
            onClick={onHistory}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded border border-line bg-paper-2 px-3 font-mono text-xs text-ink-2 hover:bg-paper-3"
            data-testid="history-button"
          >
            <History size={14} />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/vault")}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded border border-line bg-paper-2 px-3 font-mono text-xs text-ink-2 hover:bg-paper-3"
          >
            <Vault size={14} />
            <span className="hidden sm:inline">Vault</span>
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded border border-line bg-paper-2 px-3 font-mono text-xs text-ink-2 hover:bg-paper-3"
            aria-label={t.common.logOut}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">{user.username}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
