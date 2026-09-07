"use client";

/**
 * /app — the Agentic workspace inside the shared shell (plan.md §6).
 *
 * The shell, the mode switch, language, theme and the Tax Vault are the same
 * components the Manual page uses; only the centre differs. The vault opened
 * here is the existing CitizenVaultModal on the same records (user request
 * 2026-09-05: "use the tax vault in agentic mode as in manual mode").
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LazyMotion, domMax } from "motion/react";
import { agenticEnabled } from "@/lib/agentic/flags";
import type { MemoryEntry } from "@/lib/agentic/types";
import { loadSession, saveSession, clearSession, type SessionInfo } from "@/lib/auth-client";
import { dict, isLang } from "@/lib/i18n";
import { agenticStrings } from "@/lib/i18n/agenticStrings";
import { isRtl } from "@/lib/i18n/languages";
import { loadOnboardingProfile, profileSeed } from "@/lib/onboarding";
import { PERSONAS, PERSONA_ORDER, findPersonaByPan } from "@/lib/personas";
import { CURRENT_VERSION, load, save as savePersist } from "@/lib/return/persist";
import { mirrorReturn, pullReturn } from "@/lib/return-sync-client";
import type { ReturnState } from "@/lib/return/state";
import { endServerSession, ensureServerSession, type ServerSessionInfo } from "@/lib/session-client";
import { blankPersona } from "@/lib/signin-flow";
import type { Lang, Persona } from "@/lib/types";
import { fetchVaultUser, getSeededVaultForPersona, addDocumentToVault, type CitizenVaultUser } from "@/lib/vault/vault-store";
import AppShell from "@/components/agentic/app-shell";
import AgenticLanding from "@/components/agentic/landing";
import Workspace from "@/components/agentic/workspace";
import type { WorkMode } from "@/components/agentic/mode-switch";
import { useRun, useRuns } from "@/components/agentic/use-run";
import CitizenVaultModal from "@/components/vault/citizen-vault-modal";
import CAShareModal from "@/components/ca/ca-share-modal";
import CAComparisonModal from "@/components/ca/ca-comparison-modal";
import {
  getActiveReviewForPan,
  fetchReviewRecord,
  type CAReviewRecord,
} from "@/lib/ca/ca-store";
import { Award } from "lucide-react";

/** `useSearchParams` bails out of prerendering; Next 16 requires the boundary. */
export default function AgenticPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-paper" />}>
      <AgenticWorkspace />
    </Suspense>
  );
}

function AgenticWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const activeRunId = params.get("run");

  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [client, setClient] = useState<SessionInfo | null>(null);
  const [server, setServer] = useState<ServerSessionInfo | null>(null);
  const [sessionState, setSessionState] = useState<"checking" | "none" | "ready" | "unverifiable">("checking");
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultUser, setVaultUser] = useState<CitizenVaultUser | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);

  const t = dict(lang);
  const s = agenticStrings(lang);

  /* --- preferences: same keys, same effects as app/page.tsx ------------- */
  useEffect(() => {
    const savedLang = localStorage.getItem("wapsi_lang");
    if (savedLang && isLang(savedLang)) setLang(savedLang);
    const savedTheme = localStorage.getItem("wapsi_theme");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
    document.body?.classList.toggle("dark", theme === "dark");
    document.body?.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);
  useEffect(() => {
    document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);
  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("wapsi_lang", l);
    window.dispatchEvent(new Event("wapsi_lang_change"));
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("wapsi_theme", next);
  };

  /* --- session: the client copy becomes a server session or nothing ------ */
  const establish = useCallback(async (c: SessionInfo | null) => {
    setClient(c);
    if (!c) {
      setServer(null);
      setSessionState("none");
      return;
    }
    const r = await ensureServerSession(c);
    if (r.ok) {
      setServer(r.session);
      setSessionState("ready");
      const local = load();
      if (local && "state" in local && local.state.persona.pan.toUpperCase() === c.pan.toUpperCase()) {
        void mirrorReturn(local.state);
      }
    } else {
      setServer(null);
      setSessionState(r.reason === "unverifiable" ? "unverifiable" : "none");
    }
  }, []);
  useEffect(() => {
    void establish(loadSession());
  }, [establish]);
  // Signing in is its own page (user request 2026-09-06); the Agentic home assumes a session.
  useEffect(() => {
    if (sessionState === "none" || sessionState === "unverifiable") router.replace("/signin");
  }, [sessionState, router]);

  const [returnState, setReturnState] = useState<ReturnState | null>(null);

  // Sync latest return snapshot from server
  useEffect(() => {
    if (sessionState !== "ready") return;
    void pullReturn().then((res) => {
      if (res?.state) setReturnState(res.state);
    });
  }, [sessionState, activeRunId]);

  const persona = useMemo(() => {
    if (!server) return null;
    // 1. If server return has a persona for this PAN, use it (carries Form 16 facts / deductions / salary)
    if (returnState?.persona && returnState.persona.pan.toUpperCase() === server.owner.pan.toUpperCase()) {
      return returnState.persona;
    }
    // 2. If localStorage has a return for this PAN, use it
    const local = load();
    if (local && "state" in local && local.state.persona && local.state.persona.pan.toUpperCase() === server.owner.pan.toUpperCase()) {
      return local.state.persona;
    }
    // 3. If seeded demo persona
    const seeded = findPersonaByPan(server.owner.pan);
    if (seeded) return seeded;
    // 4. Default to blankPersona so CA review and all features work unconditionally for any PAN
    return blankPersona(server.owner.pan, server.owner.displayName, lang);
  }, [server, returnState, lang]);
  const citizen = useMemo(() => (server ? { name: server.owner.displayName, pan: server.owner.pan, isDemo: server.owner.kind === "demo" } : null), [server]);
  useEffect(() => {
    if (!server) return setVaultUser(null);
    if (persona) setVaultUser((prev) => (prev && prev.pan === persona.pan ? prev : getSeededVaultForPersona(persona)));
    void fetchVaultUser(server.owner.pan).then((u) => u && setVaultUser(u));
  }, [server, persona]);

  // CA Review Portal state for Agentic mode
  const [caShareOpen, setCaShareOpen] = useState(false);
  const [caComparisonOpen, setCaComparisonOpen] = useState(false);
  const [activeCAReview, setActiveCAReview] = useState<CAReviewRecord | null>(null);

  useEffect(() => {
    if (!persona?.pan) return;

    let isSubscribed = true;

    const syncReview = async () => {
      // 1. Read local storage
      const local = getActiveReviewForPan(persona.pan);
      if (local && isSubscribed) {
        setActiveCAReview((prev) => {
          if (!prev || prev.status !== local.status || prev.reviewedAt !== local.reviewedAt) {
            return local;
          }
          return prev;
        });

        // 2. If review is pending or has updates, check server
        if (local.status === "pending" || local.status === "reviewed") {
          try {
            const serverRec = await fetchReviewRecord(local.code, true);
            if (serverRec && isSubscribed) {
              setActiveCAReview((prev) => {
                if (!prev || prev.status !== serverRec.status || prev.reviewedAt !== serverRec.reviewedAt) {
                  return serverRec;
                }
                return prev;
              });
            }
          } catch {
            // Ignore background sync errors
          }
        }
      }
    };

    void syncReview();

    // Cross-tab storage change listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "wapsi_ca_reviews" || !e.key) {
        void syncReview();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Custom in-window review update listener
    const handleCustom = () => {
      void syncReview();
    };
    window.addEventListener("wapsi_ca_review_updated", handleCustom);

    // Focus listener
    const handleFocus = () => {
      void syncReview();
    };
    window.addEventListener("focus", handleFocus);

    // Periodic polling (every 2.5s)
    const interval = setInterval(() => {
      void syncReview();
    }, 2500);

    return () => {
      isSubscribed = false;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("wapsi_ca_review_updated", handleCustom);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [persona?.pan]);

  const handleAdoptCAReview = (newPersona: Persona, newRegime: "new" | "old") => {
    const loaded = load();
    const baseState: ReturnState = (loaded && "state" in loaded)
      ? loaded.state
      : {
          version: CURRENT_VERSION,
          lang,
          personaId: newPersona.id === "custom" ? "custom" : newPersona.id,
          baselinePersona: newPersona,
          persona: newPersona,
          corrections: [],
          confirmedFactIds: [],
          regime: newRegime,
        };

    const updatedState: ReturnState = {
      ...baseState,
      baselinePersona: newPersona,
      persona: newPersona,
      corrections: [],
      regime: newRegime,
    };

    savePersist(updatedState);
    void mirrorReturn(updatedState, true);
    setReturnState(updatedState);
    try {
      window.dispatchEvent(new CustomEvent("wapsi_state_changed"));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("wapsi_ca_review_updated"));
    } catch {}

    setActiveCAReview((prev) => (prev ? { ...prev, status: "accepted" } : null));
  };

  /** Demo sign-in: the same client session shape the manual page mints, so both modes agree. */
  const signInDemo = async (personaId: (typeof PERSONA_ORDER)[number]) => {
    const p = PERSONAS[personaId];
    const c: SessionInfo = { token: `mock-token-${p.pan}-${Date.now()}`, pan: p.pan, fullName: p.name, personalisedMessage: "My money comes back.", isMock: true };
    saveSession(c);
    const state: ReturnState = { version: CURRENT_VERSION, lang, personaId: p.id, baselinePersona: p, persona: p, corrections: [], confirmedFactIds: [], regime: "new" };
    savePersist(state);
    await establish(c);
  };
  const signOut = async () => {
    await endServerSession();
    clearSession();
    await establish(null);
    router.replace("/app");
  };

  const [workMode, setWorkMode] = useState<WorkMode>("agentic");
  const handleModeChange = (m: WorkMode) => {
    setWorkMode(m);
    if (m === "manual") {
      try {
        localStorage.setItem("wapsi_user_mode", "manual");
        localStorage.setItem("wapsi_ui_mode", "full");
      } catch {
        // ignore
      }
      router.push("/");
    }
  };

  /* --- runs --------------------------------------------------------------- */
  const runs = useRuns();
  const view = useRun(sessionState === "ready" ? activeRunId : null);
  useEffect(() => {
    if (sessionState === "ready") void runs.refresh();
  }, [sessionState, runs.refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // Automatically sync generated Form ITR-V into citizen's Tax Vault so it's stored and viewable there
  useEffect(() => {
    if (!citizen?.pan) return;
    const itrv = view.outputs.find((o) => o.kind === "itrv_acknowledgement_pdf");
    if (itrv) {
      void addDocumentToVault(citizen.pan, {
        id: `doc_itrv_${itrv.id}`,
        title: itrv.title || "Form ITR-V (Acknowledgement) · AY 2026-27",
        docType: "ITR_V",
        issuer: "Income Tax Department",
        status: "verified",
        sizeKb: 12,
      }).then((updated) => {
        setVaultUser(updated);
      });
    }
  }, [citizen?.pan, view.outputs]);

  const start = async (input: { message?: string; task?: import("@/lib/agentic/types").RunTask }) => {
    // The profile's seed rides along (2026-09-07): first name, masked refund account, residency, the DigiLocker
    // link, the mode — never a PAN or Aadhaar. The runtime opens the year with it and skips what it answers.
    const profile = loadOnboardingProfile();
    const run = await runs.create({ ...input, lang, profile: profile ? profileSeed(profile) : undefined });
    router.push(`/app?run=${run.id}`);
  };

  const loadMemory = async () => {
    const res = await fetch("/api/memory", { credentials: "same-origin" });
    if (res.ok) setMemory(((await res.json()) as { entries: MemoryEntry[] }).entries);
    setMemoryOpen(true);
  };
  const forget = async (key: string) => {
    await fetch(`/api/memory?key=${encodeURIComponent(key)}`, { method: "DELETE", credentials: "same-origin" });
    setMemory((m) => m.filter((e) => e.key !== key));
  };

  if (!agenticEnabled()) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-8 text-ink">
        <p className="text-sm text-ink-2">The Agentic workspace is disabled in this deployment.</p>
      </main>
    );
  }

  return (
    <LazyMotion features={domMax} strict>
      <AppShell
        mode={workMode}
        onModeChange={handleModeChange}
        modeBusy={view.loading && view.run?.status === "running"}
        lang={lang}
        changeLang={changeLang}
        theme={theme}
        toggleTheme={toggleTheme}
        s={s}
        t={t}
        citizen={citizen}
        onSignOut={citizen ? signOut : undefined}
        onOpenVault={() => setVaultOpen(true)}
        onMyReturn={() => router.push("/")}
        onOpenMemory={citizen ? loadMemory : undefined}
        runs={runs.runs}
        activeRunId={activeRunId}
        onSelectRun={(id) => router.push(`/app?run=${id}`)}
        onNewChat={() => router.push("/app")}
        onDeleteRun={(id) => void runs.remove(id).then(() => activeRunId === id && router.push("/app"))}
        inspector={{
          steps: view.run?.steps ?? [],
          outputs: view.outputs,
          sources: view.run?.sources ?? [],
          runId: view.run?.id ?? null,
          // Every turn where the model's wording was not used, with the reason — never silent (docs/VOICE.md).
          modelNotes: view.events.flatMap((e) => (e.payload.type === "tool_outcome" && e.payload.tool === "model.phrase" && !e.payload.ok ? [e.payload.summary] : [])),
        }}
        notice={server && !server.durable ? s.notDurable : undefined}
      >
        {sessionState === "checking" ? (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-3 font-mono">…</div>
        ) : sessionState !== "ready" ? (
          <SignInPrompt s={s} state={sessionState} onDemo={signInDemo} onManual={() => router.push("/")} />
        ) : runs.status === "unavailable" ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="max-w-md text-center text-sm text-ink-2 leading-relaxed">{s.storageUnavailable}</p>
          </div>
        ) : (
          <Workspace
            s={s}
            lang={lang}
            citizenName={citizen?.name ?? null}
            run={view.run}
            events={view.events}
            outputs={view.outputs}
            loading={view.loading}
            error={view.error}
            durable={view.durable}
            onStart={(input) => void start(input)}
            onSend={(input) => void view.send(input)}
            onOpenVault={() => setVaultOpen(true)}
            onReviewWithCA={() => setCaShareOpen(true)}
            activeCAReview={activeCAReview}
            onOpenComparison={() => setCaComparisonOpen(true)}
          />
        )}
      </AppShell>

      <CitizenVaultModal isOpen={vaultOpen} onClose={() => setVaultOpen(false)} vaultUser={vaultUser} onUpdateUser={setVaultUser} lang={lang} />

      {/* --- CA REVIEW SHARE & PIN MODAL --- */}
      {persona && (
        <CAShareModal
          isOpen={caShareOpen}
          onClose={() => setCaShareOpen(false)}
          persona={persona}
          regime={returnState?.regime ?? "new"}
          lang={lang}
          onRecordCreated={(rec) => setActiveCAReview(rec)}
          onReviewReceived={(rec) => {
            setActiveCAReview(rec);
            setCaShareOpen(false);
            setCaComparisonOpen(true);
          }}
        />
      )}

      {/* --- CA SIDE-BY-SIDE RECONCILIATION MODAL --- */}
      {activeCAReview && (
        <CAComparisonModal
          isOpen={caComparisonOpen}
          onClose={() => setCaComparisonOpen(false)}
          record={activeCAReview}
          lang={lang}
          onAdopt={handleAdoptCAReview}
        />
      )}

      {memoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label={s.memory}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-base font-bold text-ink">{s.memory}</h2>
              <button type="button" onClick={() => setMemoryOpen(false)} className="text-sm text-ink-2 hover:text-ink cursor-pointer">{s.cancel}</button>
            </div>
            {memory.length === 0 ? (
              <p className="text-sm text-ink-2 leading-relaxed">{s.memoryEmpty}</p>
            ) : (
              <ul className="space-y-2">
                {memory.map((e) => (
                  <li key={e.key} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] text-ink-3">{e.key}</span>
                      <span className="block text-ink truncate">{String(e.value)}</span>
                    </span>
                    <button type="button" onClick={() => void forget(e.key)} className="text-xs font-semibold text-alarm hover:underline cursor-pointer shrink-0">{s.forget}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </LazyMotion>
  );
}

/** `compact` drops the hero (the landing already shows it) and keeps the persona buttons. */
function SignInPrompt({ s, state, onDemo, onManual, compact = false }: { s: ReturnType<typeof agenticStrings>; state: "none" | "unverifiable"; onDemo: (id: (typeof PERSONA_ORDER)[number]) => void; onManual: () => void; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center justify-center pt-2" : "flex-1 flex items-center justify-center p-6"}>
      <div className="w-full max-w-lg text-center space-y-5">
        {!compact && <h1 className="font-serif text-3xl sm:text-4xl leading-tight text-ink text-balance">{s.welcomeTitle}</h1>}
        <p className="text-sm sm:text-base text-ink-2 leading-relaxed">{state === "unverifiable" ? `${s.signInPrompt} ${s.welcomeBody}` : s.signInPrompt}</p>
        <div className="space-y-2">
          <p className="cap">{s.demoSignIn}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {PERSONA_ORDER.map((id) => (
              <button key={id} type="button" onClick={() => onDemo(id)} className="rounded-full border border-line bg-paper-2 px-4 py-2 text-sm text-ink hover:border-money/60 hover:shadow-sm cursor-pointer">
                {PERSONAS[id].name} <span className="font-mono text-ink-3 text-xs">({PERSONAS[id].pan})</span>
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={onManual} className="text-sm font-semibold text-money hover:underline cursor-pointer">{s.modeManual} →</button>
      </div>
    </div>
  );
}
