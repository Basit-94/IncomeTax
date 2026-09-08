"use client";

/**
 * The shared application shell (plan.md §6): persistent left navigation, a
 * header with the Agentic/Manual switch in a reserved slot immediately right
 * of the sidebar boundary and the Progress/Outputs/Sources controls at the
 * top right, a centre column, and a collapsible inspector. Both `/` (Manual)
 * and `/app` (Agentic) render this component with the same structure, so the
 * switch has the same anchor, order and size in either mode.
 *
 * Visual language: Direction 13 tokens throughout (paper / ink / money /
 * line), the serif for headings, mono for labels. The sidebar and the
 * composer take their calm from the HeyGov reference; the three-column
 * arrangement is the ChatGPT Work layout the plan requires.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Brain, FileText, History, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, Search, ShieldCheck, Sun, Trash2, X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import type { Lang } from "@/lib/types";
import type { PublicRun } from "@/lib/agentic/runtime";
import type { OutputRef, PlanStep, SourceRef } from "@/lib/agentic/types";
import LanguageMenu from "../ui/language-menu";
import { HeaderBar, PrototypeBanner } from "./header-frame";
import { localizeName } from "@/lib/i18n/names";
import { InspectorControls, InspectorPanel, type InspectorTab } from "./inspector";
import ModeSwitch, { type WorkMode } from "./mode-switch";
import MobileDrawer from "../mobile/mobile-drawer";

export interface ShellCitizen {
  name: string;
  pan: string;
  isDemo?: boolean;
}

export interface AppShellProps {
  mode: WorkMode;
  onModeChange: (mode: WorkMode) => void;
  modeBusy?: boolean;
  lang: Lang;
  changeLang: (lang: Lang) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  s: AgenticStrings;
  t: Dict;
  citizen: ShellCitizen | null;
  onSignOut?: () => void;
  onOpenVault: () => void;
  onMyReturn: () => void;
  onFilingHistory?: () => void;
  onOpenMemory?: () => void;
  runs: PublicRun[];
  activeRunId: string | null;
  onSelectRun: (id: string) => void;
  onNewChat: () => void;
  onDeleteRun?: (id: string) => void;
  inspector: {
    steps: PlanStep[];
    outputs: OutputRef[];
    sources: SourceRef[];
    runId: string | null;
    persona?: import("@/lib/types").Persona | null;
    returnState?: import("@/lib/return/state").ReturnState | null;
    vaultUser?: import("@/lib/vault/vault-store").CitizenVaultUser | null;
    profile?: import("@/lib/onboarding").OnboardingProfile | null;
    manualNote?: string;
    modelNotes?: string[];
  };
  /** A short truthful note under the sidebar, e.g. "demo session clears on restart". */
  notice?: string;
  /** "Your return" (2026-09-08): the draft in progress and any CA review under way, shown above the chats. */
  workItems?: { id: string; title: string; detail: string; tone: "draft" | "review" | "ready"; onClick: () => void }[];
  children: ReactNode;
}

export default function AppShell(props: AppShellProps) {
  const { s, t, mode, citizen, runs, inspector } = props;
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setInspectorTab("context");
    }
  }, []);

  useEffect(() => {
    try {
      const c = localStorage.getItem("wapsi_sidebar_collapsed");
      if (c === "1") setCollapsed(true);
    } catch {
      // cosmetic preference only
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem("wapsi_sidebar_collapsed", v ? "0" : "1");
      } catch {
        // cosmetic preference only
      }
      return !v;
    });
  };

  const visibleRuns = runs.filter((r) => !query.trim() || r.title.toLowerCase().includes(query.trim().toLowerCase()));
  // The chat sidebar (New chat, recent chats) belongs to Agentic only; Manual keeps its own navigation (user, 2026-09-05).
  const withSidebar = mode === "agentic";

  const sidebar = (
    <nav aria-label="Wapsi" className="flex h-full flex-col overflow-y-auto bg-paper-2 border-e border-line max-lg:bg-paper max-lg:border-e-0 max-lg:pt-3">
      {/* The brand lives in the shared header bar above; this row only holds the collapse / close control. */}
      <div className="flex items-center justify-end px-3 pt-3 pb-1">
        <button type="button" onClick={() => (drawer ? setDrawer(false) : toggleCollapsed())} className="hidden lg:flex size-8 items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-paper-3 cursor-pointer" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
          <PanelLeftClose size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setDrawer(false)} className="lg:hidden size-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink cursor-pointer" aria-label={s.cancel}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="px-3 space-y-2">
        <button type="button" onClick={() => { props.onNewChat(); setDrawer(false); }} className="w-full flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-semibold text-ink hover:border-money/60 hover:shadow-sm transition cursor-pointer">
          <Plus size={15} aria-hidden="true" /> <span>{s.newChat}</span>
        </button>
        <label className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink-2 focus-within:border-money/60">
          <Search size={14} aria-hidden="true" className="shrink-0 text-ink-3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={s.searchChats} aria-label={s.searchChats} className="w-full bg-transparent outline-none text-ink placeholder:text-ink-3 text-sm" />
        </label>
      </div>

      {/* Tools */}
      <div className="px-3 pt-4">
        <p className="cap px-1 mb-1.5">{t.shell.productName}</p>
        <ul className="space-y-0.5">
          <li>
            <button type="button" onClick={() => { props.onOpenVault(); setDrawer(false); }} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-paper-3 cursor-pointer text-start">
              <ShieldCheck size={15} className="text-money shrink-0" aria-hidden="true" /> <span>{s.taxVault}</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => { props.onMyReturn(); setDrawer(false); }} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-paper-3 cursor-pointer text-start">
              <FileText size={15} className="text-money shrink-0" aria-hidden="true" /> <span>{s.myReturn}</span>
            </button>
          </li>
          {props.onFilingHistory && (
            <li>
              <button type="button" onClick={() => { props.onFilingHistory?.(); setDrawer(false); }} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-paper-3 cursor-pointer text-start">
                <History size={15} className="text-ink-3 shrink-0" aria-hidden="true" /> <span>{s.filingHistory}</span>
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Your return: the draft midway and any CA review, above the chats (user, 2026-09-08). */}
      {props.workItems && props.workItems.length > 0 && (
        <div className="px-3 pt-4">
          <p className="cap px-1 mb-1.5">Your return</p>
          <ul className="space-y-0.5">
            {props.workItems.map((w) => (
              <li key={w.id}>
                <button type="button" onClick={() => { w.onClick(); setDrawer(false); }} className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-start hover:bg-paper-3 cursor-pointer">
                  <span className={`mt-1.5 size-2 rounded-full shrink-0 ${w.tone === "review" ? "bg-money animate-pulse" : w.tone === "ready" ? "bg-ok" : "bg-ink-3"}`} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink truncate">{w.title}</span>
                    <span className="block text-[11px] text-ink-3 truncate">{w.detail}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent chats — the whole nav scrolls as one region (user, 2026-09-08); this list no longer needs its own bounded, independently-scrolling area. */}
      <div className="px-3 pt-4">
        <p className="cap px-1 mb-1.5">{s.recentChats}</p>
        {visibleRuns.length === 0 ? (
          <p className="px-1 text-xs text-ink-3 leading-relaxed">{s.noChats}</p>
        ) : (
          <>
            <ul className="space-y-0.5">
              {visibleRuns.map((r) => {
                const active = r.id === props.activeRunId;
                return (
                  <li key={r.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { props.onSelectRun(r.id); setDrawer(false); }}
                      aria-current={active ? "page" : undefined}
                      className={`flex-1 min-w-0 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-start cursor-pointer ${active ? "bg-amber-bg text-amber-ink font-semibold" : "text-ink-2 hover:bg-paper-3 hover:text-ink"}`}
                    >
                      <FileText size={13} className="shrink-0 text-ink-3" aria-hidden="true" />
                      <span className="truncate">{r.title}</span>
                      {r.status !== "completed" && r.status !== "cancelled" && r.status !== "failed" && <span className="ms-auto size-1.5 rounded-full bg-money shrink-0" aria-hidden="true" />}
                    </button>
                    {props.onDeleteRun && (
                      <button type="button" onClick={() => props.onDeleteRun?.(r.id)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 size-7 flex items-center justify-center rounded text-ink-3 hover:text-alarm cursor-pointer" aria-label={`${s.forget}: ${r.title}`}>
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Mode — the drawer carries the Agentic|Manual switch, full width, with one line on what Manual is (M4g). */}
      <div className="lg:hidden border-t border-line px-3 pt-3 pb-1">
        <p className="cap px-1 mb-2">{s.modeLabel}</p>
        <ModeSwitch mode={mode} onChange={(m) => { setDrawer(false); props.onModeChange(m); }} s={s} busy={props.modeBusy} fullWidth />
        <p className="mt-1.5 px-1 text-[11.5px] text-ink-3 leading-snug">{s.manualInspectorNote}</p>
      </div>

      {/* Account / settings */}
      <div className="border-t border-line p-3 space-y-2">
        {citizen ? (
          <div className="rounded-xl border border-line bg-paper px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="size-8 shrink-0 rounded-full bg-amber-bg text-amber-ink font-sans font-extrabold text-xs flex items-center justify-center" aria-hidden="true">
                {citizen.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{localizeName(citizen.name, props.lang)}</p>
                <p className="font-mono text-[10px] text-ink-3 truncate">{citizen.pan}{citizen.isDemo ? " · demo" : ""}</p>
              </div>
              {props.onSignOut && (
                <button type="button" onClick={props.onSignOut} className="size-7 flex items-center justify-center rounded text-ink-3 hover:text-ink cursor-pointer" aria-label={s.signOut} title={s.signOut}>
                  <LogOut size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-3 px-1">{s.signInPrompt}</p>
        )}
        <div className="lg:hidden">
          <LanguageMenu lang={props.lang} onChange={props.changeLang} label={t.shell.language} className="w-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={props.toggleTheme} className="h-[34px] flex-1 rounded-lg border border-line bg-paper text-ink-2 hover:text-ink flex items-center justify-center gap-1.5 text-xs font-mono cursor-pointer shrink-0" aria-label={props.theme === "dark" ? t.shell.light : t.shell.dark}>
            {props.theme === "dark" ? <Sun size={13} className="text-money" aria-hidden="true" /> : <Moon size={13} className="text-money" aria-hidden="true" />}
            <span>{props.theme === "dark" ? t.shell.light : t.shell.dark}</span>
          </button>
          {props.onOpenMemory && (
            <button type="button" onClick={props.onOpenMemory} className="h-[34px] px-2.5 rounded-lg border border-line bg-paper text-ink-2 hover:text-ink flex items-center cursor-pointer shrink-0" aria-label={s.memory} title={s.memory}>
              <Brain size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-[10px] font-mono text-ink-3 px-1">
          <span className="size-1.5 rounded-full bg-money shrink-0" aria-hidden="true" />
          <span className="truncate">{props.notice ?? t.shell.independent}</span>
        </p>
      </div>
    </nav>
  );

  return (
    <div className="h-dvh max-h-dvh overflow-hidden flex flex-col bg-paper text-ink">
      {/* The shared frame: banner + header bar span the full width ABOVE the sidebar, so the
          Agentic/Manual switch sits at the same x/y as on the landing and the Manual page. */}
      <PrototypeBanner t={t} />
      <header className="relative z-50 shrink-0 border-b border-line bg-paper/95 backdrop-blur" data-testid="shell-header">
        <HeaderBar
          t={t}
          s={s}
          mode={mode}
          onModeChange={props.onModeChange}
          busy={props.modeBusy}
          leading={
            withSidebar ? (
              <button type="button" onClick={() => setDrawer(true)} className="glass-flat size-9 rounded-full flex items-center justify-center text-ink cursor-pointer" aria-label={s.recentChats}>
                <Menu size={16} aria-hidden="true" />
              </button>
            ) : undefined
          }
          mobileTitle={withSidebar ? runs.find((r) => r.id === props.activeRunId)?.title ?? s.newChat : undefined}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {withSidebar && (
              <InspectorControls
                s={s}
                open={inspectorTab}
                onToggle={(tab) => setInspectorTab((cur) => (cur === tab ? null : tab))}
                steps={inspector.steps}
                outputs={inspector.outputs}
                sources={inspector.sources}
                vaultUser={inspector.vaultUser}
              />
            )}
            {/* Phones in Agentic: the title and the compact pill need the width; the language menu lives in the drawer (M4g). */}
            <div className={`relative z-[60] ${withSidebar ? "max-md:hidden" : ""}`}>
              <LanguageMenu lang={props.lang} onChange={props.changeLang} label={t.shell.language} className="shrink-0" />
            </div>
          </div>
        </HeaderBar>
      </header>

      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Sidebar: fixed column on large screens (expanded: 272px, collapsed: sleek 54px icon rail) */}
        {withSidebar && (
          <div
            className={`hidden lg:flex flex-col shrink-0 border-e border-line bg-paper/95 backdrop-blur transition-[width] duration-200 z-20 ${
              collapsed ? "w-[54px] items-center py-3 px-1.5 gap-2" : "w-[272px]"
            }`}
          >
            {collapsed ? (
              <>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="size-10 flex items-center justify-center rounded-xl text-money hover:bg-paper-3 transition cursor-pointer"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen size={18} aria-hidden="true" />
                </button>
                <div className="w-6 h-px bg-line my-0.5" />
                <button
                  type="button"
                  onClick={() => props.onNewChat()}
                  className="size-10 flex items-center justify-center rounded-xl text-ink-2 hover:text-ink hover:bg-paper-3 transition cursor-pointer"
                  title={s.newChat}
                  aria-label={s.newChat}
                >
                  <Plus size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => props.onOpenVault()}
                  className="size-10 flex items-center justify-center rounded-xl text-ink-2 hover:text-ink hover:bg-paper-3 transition cursor-pointer"
                  title={s.taxVault}
                  aria-label={s.taxVault}
                >
                  <ShieldCheck size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => props.onMyReturn()}
                  className="size-10 flex items-center justify-center rounded-xl text-ink-2 hover:text-ink hover:bg-paper-3 transition cursor-pointer"
                  title={s.myReturn}
                  aria-label={s.myReturn}
                >
                  <FileText size={18} aria-hidden="true" />
                </button>
                <div className="mt-auto flex flex-col items-center gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={props.toggleTheme}
                    className="size-9 flex items-center justify-center rounded-xl text-ink-2 hover:text-ink hover:bg-paper-3 transition cursor-pointer"
                    title={props.theme === "dark" ? t.shell.light : t.shell.dark}
                    aria-label={props.theme === "dark" ? t.shell.light : t.shell.dark}
                  >
                    {props.theme === "dark" ? <Sun size={16} className="text-money" /> : <Moon size={16} className="text-money" />}
                  </button>
                </div>
              </>
            ) : (
              sidebar
            )}
          </div>
        )}
        {withSidebar && (
          <MobileDrawer open={drawer} onClose={() => setDrawer(false)} closeLabel={s.cancel}>
            {sidebar}
          </MobileDrawer>
        )}

        <div className="flex-1 min-w-0 min-h-0 flex flex-col lg:flex-row">
          <main id="main-content" className={`shell-main flex-1 min-w-0 min-h-0 flex flex-col ${mode === "agentic" ? "overflow-hidden" : "overflow-y-auto"}`}>{props.children}</main>
          {withSidebar && (
            <InspectorPanel
              s={s}
              open={inspectorTab}
              onToggle={(tab) => setInspectorTab(tab)}
              onClose={() => setInspectorTab(null)}
              steps={inspector.steps}
              outputs={inspector.outputs}
              sources={inspector.sources}
              runId={inspector.runId}
              persona={inspector.persona}
              returnState={inspector.returnState}
              vaultUser={inspector.vaultUser}
              profile={inspector.profile}
              onOpenVault={props.onOpenVault}
              manualNote={inspector.manualNote}
              modelNotes={inspector.modelNotes}
              lang={props.lang}
            />
          )}
        </div>
      </div>
    </div>
  );
}
